"""SQLite database — keeps the game log permanently (VRChat deletes old log files itself), the friend feed and notes"""
import json
import sqlite3
import threading
import time
from pathlib import Path

import vrclog

SCHEMA = """
CREATE TABLE IF NOT EXISTS gamelog (t TEXT, kind TEXT, value TEXT, uid TEXT, parts TEXT,
                                    UNIQUE (t, kind, value, uid));
CREATE INDEX IF NOT EXISTS gamelog_kind ON gamelog (kind, t);
CREATE INDEX IF NOT EXISTS gamelog_uid ON gamelog (uid, kind);
CREATE TABLE IF NOT EXISTS imported (file TEXT PRIMARY KEY, size INTEGER);
CREATE TABLE IF NOT EXISTS feed (id INTEGER PRIMARY KEY, t TEXT, type TEXT, uid TEXT, name TEXT, data TEXT);
CREATE INDEX IF NOT EXISTS feed_t ON feed (t);
CREATE TABLE IF NOT EXISTS memos (uid TEXT PRIMARY KEY, text TEXT);
CREATE TABLE IF NOT EXISTS name_changes (uid TEXT, old TEXT, new TEXT, t TEXT);
CREATE INDEX IF NOT EXISTS name_changes_uid ON name_changes (uid);
CREATE TABLE IF NOT EXISTS chat (id INTEGER PRIMARY KEY, t TEXT, text TEXT, world TEXT);
"""


def now():
    return time.strftime("%Y.%m.%d %H:%M:%S")


class Store:
    def __init__(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path, check_same_thread=False)
        self.db.executescript(SCHEMA)
        self.lock = threading.Lock()

    def _exec(self, sql, args=(), many=False):
        with self.lock:
            cur = self.db.executemany(sql, args) if many else self.db.execute(sql, args)
            self.db.commit()
            return cur

    def _query(self, sql, args=()):
        with self.lock:
            return self.db.execute(sql, args).fetchall()

    # ---------- game log ----------
    def add_events(self, events):
        rows = [(e.time, e.kind, e.value, e.user_id, json.dumps(list(e.parts), ensure_ascii=False)) for e in events]
        if rows:
            self._exec("INSERT OR IGNORE INTO gamelog VALUES (?,?,?,?,?)", rows, many=True)

    def import_logs(self, skip=None):
        """Import every old log file not imported yet (skipping the file currently being read live)"""
        done = dict(self._query("SELECT file, size FROM imported"))
        for f in vrclog.LOG_DIR.glob("output_log_*.txt"):
            if f == skip:
                continue
            size = f.stat().st_size
            if done.get(f.name) == size:
                continue
            batch = []
            for line in vrclog.read_lines(f):
                ev = vrclog.parse_line(line)
                if ev:
                    batch.append(ev)
                if len(batch) >= 2000:
                    self.add_events(batch)
                    batch = []
            self.add_events(batch)
            self._exec("INSERT OR REPLACE INTO imported VALUES (?,?)", (f.name, size))

    def encounters(self, uid):
        first, last, count = self._query(
            "SELECT MIN(t), MAX(t), COUNT(*) FROM gamelog WHERE uid = ? AND kind = 'join'", (uid,))[0]
        return {"first": first, "last": last, "count": count}

    def history(self, limit=300):
        """Worlds visited (newest first) with instance and number of players met"""
        rows = self._query("SELECT t, kind, value FROM gamelog WHERE kind IN ('world', 'instance') "
                           "ORDER BY t DESC, kind ASC LIMIT ?", (limit * 2,))  # Reverse the order so the world comes before the instance
        rows.reverse()
        visits = []
        for t, kind, value in rows:
            if kind == "world":
                visits.append({"t": t, "name": value, "loc": ""})
            elif visits and not visits[-1]["loc"]:
                visits[-1]["loc"] = value
        for i, v in enumerate(visits):
            v["end"] = visits[i + 1]["t"] if i + 1 < len(visits) else ""
        if visits:
            joins = self._query("SELECT t, uid FROM gamelog WHERE kind = 'join' AND t >= ? ORDER BY t", (visits[0]["t"],))
            j = 0
            for v in visits:
                seen = set()
                while j < len(joins) and (not v["end"] or joins[j][0] < v["end"]):
                    if joins[j][0] >= v["t"]:
                        seen.add(joins[j][1])
                    j += 1
                v["players"] = len(seen)
        visits.reverse()
        return visits[:limit]

    def visit_players(self, start, end):
        sql = "SELECT uid, value, MIN(t) FROM gamelog WHERE kind = 'join' AND t >= ?"
        args = [start]
        if end:
            sql += " AND t < ?"
            args.append(end)
        return [{"u": u, "name": n, "t": t} for u, n, t in self._query(sql + " GROUP BY uid ORDER BY MIN(t)", args)]

    # ---------- feed ----------
    def add_feed(self, entry):
        self._exec("INSERT INTO feed (t, type, uid, name, data) VALUES (?,?,?,?,?)",
                   (entry["t"], entry["type"], entry["u"], entry["name"], json.dumps(entry.get("d", {}), ensure_ascii=False)))

    def recent_feed(self, limit=1000):
        rows = self._query("SELECT t, type, uid, name, data FROM feed ORDER BY id DESC LIMIT ?", (limit,))
        return [{"t": t, "type": ty, "u": u, "name": n, "d": json.loads(d or "{}")} for t, ty, u, n, d in reversed(rows)]

    # ---------- Chatbox message history ----------
    def add_chat(self, text, world):
        t = now()
        cur = self._exec("INSERT INTO chat (t, text, world) VALUES (?,?,?)", (t, text, world))
        return {"id": cur.lastrowid, "t": t, "text": text, "world": world}

    def recent_chat(self, limit=500):
        rows = self._query("SELECT id, t, text, world FROM chat ORDER BY id DESC LIMIT ?", (limit,))
        return [{"id": i, "t": t, "text": x, "world": w} for i, t, x, w in reversed(rows)]

    def delete_chat(self, cid):
        self._exec("DELETE FROM chat WHERE id = ?", (int(cid),))

    # ---------- Name history ----------
    def add_name_change(self, uid, old, new):
        self._exec("INSERT INTO name_changes VALUES (?,?,?,?)", (uid, old, new, now()))

    def names(self, uid):
        """Every name seen for this user (from the game log + name changes detected via the API), oldest → newest"""
        seen = {}
        for name, first, last in self._query("SELECT value, MIN(t), MAX(t) FROM gamelog WHERE uid = ? "
                                             "AND kind IN ('join', 'leave') GROUP BY value", (uid,)):
            seen[name] = [first, last]
        for old, new, t in self._query("SELECT old, new, t FROM name_changes WHERE uid = ? ORDER BY t", (uid,)):
            seen.setdefault(old, [t, t])
            seen[old][1] = max(seen[old][1], t)
            seen.setdefault(new, [t, t])
            seen[new][0] = min(seen[new][0], t)
        return [{"name": n, "first": f, "last": l} for n, (f, l) in sorted(seen.items(), key=lambda x: x[1][0])]

    # ---------- Notes ----------
    def memo(self, uid):
        r = self._query("SELECT text FROM memos WHERE uid = ?", (uid,))
        return r[0][0] if r else ""

    def set_memo(self, uid, text):
        if text.strip():
            self._exec("INSERT OR REPLACE INTO memos VALUES (?,?)", (uid, text))
        else:
            self._exec("DELETE FROM memos WHERE uid = ?", (uid,))
