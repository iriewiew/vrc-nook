"""Read VRChat logs and show important events in real time

Examples:
    python vrclog.py                    # follow the latest log in real time (default)
    python vrclog.py --verbose          # show every type, including disabled ones (download, pickup, error)
    python vrclog.py --only join leave  # show only the chosen types
    python vrclog.py --raw              # print every raw log line
    python vrclog.py --once             # read the latest log once and exit
    python vrclog.py --summary --all    # summary across all files
    python vrclog.py --list             # list all event types
"""
import argparse
import os
import re
import sys
import time
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

def _locallow():
    """Ask Windows where LocalLow is (it can be redirected), fall back to %USERPROFILE%\\AppData\\LocalLow"""
    try:
        import ctypes
        guid = (ctypes.c_byte * 16).from_buffer_copy(  # FOLDERID_LocalAppDataLow {A520A1A4-1780-4FF6-BD18-167343C5AF16}
            bytes.fromhex("a4a120a58017f64fbd18167343c5af16"))
        out = ctypes.c_wchar_p()
        if ctypes.windll.shell32.SHGetKnownFolderPath(ctypes.byref(guid), 0, None, ctypes.byref(out)) == 0:
            p = out.value
            ctypes.windll.ole32.CoTaskMemFree(out)
            if p:
                return Path(p)
    except Exception:
        pass
    return Path(os.environ.get("USERPROFILE") or Path.home()) / "AppData/LocalLow"


DEFAULT_LOG_DIR = _locallow() / "VRChat/VRChat"
LOG_DIR = DEFAULT_LOG_DIR  # The app may point this at a folder the user picked


def find_log_dir(d: Path) -> Path:
    """Accept the log folder itself or a parent of it (LocalLow, VRChat) — return the folder holding output_log files"""
    for c in (d, d / "VRChat", d / "VRChat/VRChat"):
        if any(c.glob("output_log_*.txt")):
            return c
    return d

LINE_RE = re.compile(r"^(\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}) (\w+)\s+-\s+(.*)$")


def _notify(m):
    # Skip old notifications already read (VRChat loads them all at login)
    if "m seen:True" in m.string:
        return None
    return (f"{m[2]} from {m[1]}" if m[1] else m[2]), ""


@dataclass
class Kind:
    name: str
    icon: str
    color: str
    regex: re.Pattern
    build: callable  # match -> (text, user_id), or None to skip
    default: bool = True
    desc: str = ""


def K(name, icon, color, rx, build=lambda m: (m[1], ""), default=True, desc=""):
    return Kind(name, icon, color, re.compile(rx), build, default, desc)


# Ordered by priority — a line matches only the first type that fits
KINDS = [
    K("world", "🌍", "1;96", r"\[Behaviour\] Entering Room: (.+)", desc="Entered a world"),
    K("instance", "  ↳", "90", r"\[Behaviour\] Joining (wrld_\S+)", desc="instance ID"),
    K("left", "🚪", "96", r"\[Behaviour\] OnLeftRoom$", lambda m: ("Left the room", ""), desc="You left the room"),
    K("join", "➕", "92", r"\[Behaviour\] OnPlayerJoined (.+?) \((usr_[\w-]+)\)", lambda m: (m[1], m[2]), desc="Player joined"),
    K("leave", "➖", "91", r"\[Behaviour\] OnPlayerLeft (.+?) \((usr_[\w-]+)\)", lambda m: (m[1], m[2]), desc="Player left"),
    K("avatar", "👤", "36", r"\[Behaviour\] Switching (.+) to avatar (.+)",
      lambda m: (f"{m[1]} → {m[2]}", ""), desc="Avatar changed"),
    K("video", "🎬", "95", r"\[Video Playback\] Attempting to resolve URL '([^']+)'", desc="Video played"),
    K("video_title", "🎵", "95", r"\[YTTL\] (title|author): (.+)",
      lambda m: (m[2] if m[1] == "title" else f"by {m[2]}", ""), desc="Video title/channel (worlds with YTTL only)"),
    K("video_err", "⚠️", "93", r"\[Video Playback\] ERROR: (.+)", desc="Video error"),
    K("screenshot", "📷", "94", r"\[VRC Camera\] Took screenshot to: (.+)", desc="Screenshot taken"),
    K("sticker", "📌", "35", r"\[StickersManager\] User (usr_[\w-]+) \((.+?)\) spawned sticker",
      lambda m: (f"{m[2]} placed a sticker", m[1]), desc="Sticker placed"),
    K("notify", "🔔", "33", r"Received Notification: <Notification from username:(.*?), .*? of type: (\w+)",
      _notify, desc="Unread notifications (invites, friend requests, etc.)"),
    K("item", "🎁", "35", r"\[VRCItems\] Item \S+ spawned by (usr_[\w-]+)", lambda m: ("spawned an item", m[1]),
      desc="Someone spawned an item (prop)"),
    K("disconnect", "🔌", "91", r"\[Behaviour\] OnDisconnected: (\w+)", lambda m: (f"Disconnected from room ({m[1]})", ""),
      desc="Disconnected from the room"),
    K("net", "📡", "93", r"^Websockets API lost connection", lambda m: ("API connection lost (friends/notifications may not update)", ""),
      desc="API connection lost"),
    K("login", "🔑", "32", r"User Authenticated: (.+?) \((usr_[\w-]+)\)", lambda m: (f"Logged in as {m[1]}", m[2]),
      desc="login"),
    K("mic", "🎤", "90", r"\[Behaviour\] Microphone device changing to '(.+)'", desc="Microphone changed"),
    K("perf", "🚫", "33", r"Avatar was blocked by local perf limits", lambda m: ("Avatar blocked by perf limit", ""),
      default=False, desc="Avatar blocked for performance"),
    K("udon_err", "💥", "31", r"\[UdonBehaviour\] An exception occurred", lambda m: ("Udon script error (world script crashed)", ""),
      desc="Udon script error"),
    # Off by default because they're very noisy — enable with --verbose or --only
    K("download", "⬇️", "90", r"\[(?:String|Image) Download\] Attempting to load \w+ from URL '([^']+)'",
      default=False, desc="World loaded an image/text from a URL"),
    K("travel", "🧭", "90", r"\[Behaviour\] Destination requested: (\S+)", lambda m: (f"Traveling to {m[1]}", ""),
      default=False, desc="Traveling to a world (before load finishes)"),
    K("world_load", "⏱️", "90", r"\[Behaviour\] World download took (.+)", lambda m: (f"World download took {m[1]}", ""),
      default=False, desc="World load time"),
    K("avatar_load", "📦", "90", r"Unpacking Avatar \((.+) by (.+?)\)$", lambda m: (f"Loading avatar {m[1]} (by {m[2]})", ""),
      default=False, desc="Avatar loaded + author"),
    K("store", "🛒", "90", r"\[EconomyStoreManager\] .*Fetch World Store Success: .*\((\d+) Listings\)",
      lambda m: (f"This world has a store ({m[1]} items)", ""), default=False, desc="World store"),
    K("moderation", "🔒", "90", r"\[ModerationManager\] (.+)", default=False, desc="Show/hide avatar moderation"),
    K("pickup", "✋", "90", r"\[Behaviour\] Pickup object: '([^']+)'", default=False, desc="Picked up an object"),
    K("error", "❗", "31", r"(.+)", default=False, desc="All other Error-level lines"),
]
KIND_BY_NAME = {k.name: k for k in KINDS}


@dataclass
class Event:
    time: str
    kind: str
    value: str
    user_id: str = ""
    parts: tuple = ()  # Raw regex groups — the GUI translates them itself


def parse_line(line: str):
    m = LINE_RE.match(line)
    if not m:
        return None
    ts, level, msg = m.groups()
    for k in KINDS:
        if k.name == "error" and level != "Error":
            continue
        pm = k.regex.search(msg)
        if pm:
            built = k.build(pm)
            if built is None:
                return None
            value, uid = built
            return Event(ts, k.name, value.strip(), uid, pm.groups())
    return None


def newest_log():
    """Newest output_log, or None when VRChat hasn't written one yet (folder may not exist either)"""
    try:
        return max(LOG_DIR.glob("output_log_*.txt"), key=lambda p: p.stat().st_mtime, default=None)
    except OSError:  # A file vanished between glob and stat
        return None


def log_files(all_files: bool):
    files = sorted(LOG_DIR.glob("output_log_*.txt"), key=lambda p: p.stat().st_mtime)
    if not files:
        sys.exit(f"No log files found in {LOG_DIR}")
    return files if all_files else files[-1:]


def read_lines(path: Path):
    with open(path, encoding="utf-8-sig", errors="replace") as f:
        for line in f:
            yield line.rstrip("\n")


def follow_lines(path: Path, auto_switch=True, on_switch=None):
    """Like tail -f: read existing content, wait for new lines, and switch files when VRChat restarts"""
    f = open(path, encoding="utf-8-sig", errors="replace")
    buf = ""
    while True:
        chunk = f.readline()
        if chunk:
            buf += chunk
            if buf.endswith("\n"):
                yield buf.rstrip("\n")
                buf = ""
            continue
        newest = (newest_log() or path) if auto_switch else path
        if newest != path:
            f.close()
            path = newest
            if on_switch:
                on_switch(path)
            else:
                print(f"\n--- Switched to {path.name} ---")
            f = open(path, encoding="utf-8-sig", errors="replace")
            continue
        time.sleep(0.5)


def fmt(ev: Event, count=None, color=False) -> str:
    k = KIND_BY_NAME[ev.kind]
    text = f"[{ev.time}] {k.icon} {ev.value}"
    if count is not None and ev.kind in ("join", "leave"):
        text += f"  ({count} players)"
    if color:
        text = f"\033[{k.color}m{text}\033[0m"
    return ("\n" + text) if ev.kind == "world" else text


class Room:
    """Track the current world and who is in it"""

    def __init__(self):
        self.world = "-"
        self.location = ""  # wrld_...:instance of the current room
        self.players = {}

    def update(self, ev: Event):
        if ev.kind == "world":
            self.world = ev.value
            self.players.clear()
        elif ev.kind == "instance":
            self.location = ev.value
        elif ev.kind == "left":
            self.players.clear()
            self.location = ""
        elif ev.kind == "join":
            self.players[ev.user_id] = ev.value
        elif ev.kind == "leave":
            self.players.pop(ev.user_id, None)
        elif ev.kind == "item":
            # The log only has the user ID — resolve the name from players in the room
            ev.value = f"{self.players.get(ev.user_id, ev.user_id)} spawned an item"

    def title(self):
        # Set the console window title: current world + player count
        if sys.stdout.isatty():
            sys.stdout.write(f"\033]0;VRChat Log | {self.world} | {len(self.players)} players\007")


def summary(events):
    worlds = Counter(e.value for e in events if e.kind == "world")
    players = {e.user_id: e.value for e in events if e.kind == "join"}
    print(f"🌍 Worlds visited ({len(worlds)}):")
    for w, n in worlds.most_common():
        print(f"   {n:>3}x  {w}")
    print(f"\n👥 Players met ({len(players)}):")
    for uid, name in sorted(players.items(), key=lambda x: x[1].lower()):
        print(f"   {name}  ({uid})")
    for kind, title in [("video", "🎬 Videos"), ("screenshot", "📷 Screenshots"), ("notify", "🔔 Notifications")]:
        items = [e for e in events if e.kind == kind]
        print(f"\n{title} ({len(items)}):")
        for e in items:
            print(f"   [{e.time}] {e.value}")


def live(path: Path, keep, raw=False, auto_switch=True):
    os.system("")  # Enable ANSI colors in the Windows console
    room = Room()
    print(f"🔴 Following log in real time: {path.name}  (Ctrl+C to stop)")
    try:
        for line in follow_lines(path, auto_switch):
            if raw:
                if line.strip():
                    print(line, flush=True)
                continue
            ev = parse_line(line)
            if not ev:
                continue
            room.update(ev)
            if keep(ev):
                print(fmt(ev, len(room.players), color=True), flush=True)
            room.title()
    except KeyboardInterrupt:
        print("\nStopped following")


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    names = [k.name for k in KINDS]
    ap = argparse.ArgumentParser(description="VRChat log reader (default: follow in real time)")
    ap.add_argument("--once", action="store_true", help="read once and exit, no real-time follow")
    ap.add_argument("--all", action="store_true", help="read all log files (with --once/--summary)")
    ap.add_argument("--only", nargs="+", choices=names, metavar="TYPE", help="show only these types (see --list)")
    ap.add_argument("--hide", nargs="+", choices=names, metavar="TYPE", default=[], help="hide these types")
    ap.add_argument("--verbose", "-v", action="store_true", help="show every type, including disabled ones")
    ap.add_argument("--raw", action="store_true", help="print every raw log line")
    ap.add_argument("--summary", action="store_true", help="print a summary")
    ap.add_argument("--list", action="store_true", help="list event types")
    ap.add_argument("--file", type=Path, help="use a specific log file")
    args = ap.parse_args()

    if args.list:
        for k in KINDS:
            print(f"  {k.icon} {k.name:<11} {'(off) ' if not k.default else ''}{k.desc}")
        return

    if args.only:
        shown = set(args.only)
    elif args.verbose:
        shown = set(names)
    else:
        shown = {k.name for k in KINDS if k.default}
    shown -= set(args.hide)
    keep = lambda e: e.kind in shown

    files = [args.file] if args.file else log_files(args.all)

    if not (args.once or args.summary or args.all):
        live(files[-1], keep, raw=args.raw, auto_switch=args.file is None)
        return

    if args.raw:
        for p in files:
            for line in read_lines(p):
                print(line)
        return

    room = Room()
    events = [ev for p in files for line in read_lines(p) if (ev := parse_line(line))]
    for ev in events:
        room.update(ev)
    if args.summary:
        summary(events)
    else:
        for ev in events:
            if keep(ev):
                print(fmt(ev))


if __name__ == "__main__":
    main()
