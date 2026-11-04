"""Battery log: what each connected device's battery did over time (SteamVR headset / controllers / trackers and Intiface
toys), saved as samples and turned into statistics per day, a summary over a range of days, and a comparison with the
range before it. Samples are written when a level or charging state changes, and at least every few minutes while a device
stays connected, so gaps in the samples mean "not connected / app not running" (no data), never "0 %"."""
import time

HEARTBEAT = 300  # Seconds: a device that keeps the same level still gets a sample this often (it's connected)
GAP = 660        # Samples further apart than this are separate stretches (it was off, or SteamVR / the app wasn't running)
EMPTY = 5        # A stretch that ends at or below this level, not charging, ran out of battery
MIN_USE = 0.25   # Hours of use (not charging) needed before a drain rate means anything (levels move in steps)


class Recorder:
    def __init__(self):
        self._last = {}  # serial -> (time written, level, charging)

    def sample(self, devices, now=None):
        """Rows to save for this reading of the devices: (t, serial, kind, label, model, level, charging)"""
        now, rows = int(now or time.time()), []
        for d in devices:
            level, serial = d.get("battery"), d.get("serial")
            if level is None or not serial:
                continue
            charging, last = bool(d.get("charging")), self._last.get(serial)
            if last and last[1] == level and last[2] == charging and now - last[0] < HEARTBEAT:
                continue
            self._last[serial] = (now, level, charging)
            rows.append((now, serial, d.get("kind") or "", d.get("label") or "", d.get("model") or "", int(level), int(charging)))
        return rows


def _by_serial(rows):
    out = {}
    for t, serial, kind, label, model, level, charging in rows:
        dev = out.setdefault(serial, {"serial": serial, "kind": kind, "label": label, "model": model, "pts": []})
        dev.update(kind=kind or dev["kind"], label=label or dev["label"], model=model or dev["model"])
        dev["pts"].append((t, level, bool(charging)))
    for dev in out.values():
        dev["pts"].sort()
    return out


def stats(pts):
    """Numbers for one device's samples (sorted by time)"""
    use = charge_secs = drain = 0.0
    charges, empties, charge_from = [], 0, None
    for i, (t, level, charging) in enumerate(pts):
        nxt = pts[i + 1] if i + 1 < len(pts) else None
        joined = nxt is not None and nxt[0] - t <= GAP
        if charging and charge_from is None:
            charge_from = (t, level)
        if joined:
            dt = nxt[0] - t
            if charging or nxt[2]:
                charge_secs += dt
            else:
                use += dt
                drain += max(0, level - nxt[1])
        if charge_from is not None and (not joined or not nxt[2]):  # The charge ends here (unplugged, or the samples stop)
            charges.append({"t": charge_from[0], "from": charge_from[1], "to": level})
            charge_from = None
        if not joined and not charging and level <= EMPTY:
            empties += 1
    hours = use / 3600
    rate = drain / hours if hours >= MIN_USE and drain > 0 else None
    levels = [p[1] for p in pts]
    return {"useH": round(hours, 2), "chargeH": round(charge_secs / 3600, 2), "drain": round(drain), "rate": round(rate, 1) if rate else None,
            "fullH": round(100 / rate, 1) if rate else None, "charges": charges, "empties": empties,
            "min": min(levels) if levels else None, "last": levels[-1] if levels else None}


def day(rows):
    """One day: every device's samples (for the chart) and its numbers"""
    return [{**{k: v for k, v in d.items() if k != "pts"}, "pts": d["pts"], "stats": stats(d["pts"])} for d in _by_serial(rows).values()]


def summary(rows, start, days):
    """A range of days: per device, its totals, how many days it was used, and its drain rate week by week (battery wear)"""
    out = []
    for d in _by_serial(rows).values():
        s = stats(d["pts"])
        used = {time.strftime("%Y-%m-%d", time.localtime(t)) for t, _, _ in d["pts"]}
        weeks = {}
        for t, level, charging in d["pts"]:
            weeks.setdefault((t - start) // (7 * 86400), []).append((t, level, charging))
        trend = [[start + w * 7 * 86400, stats(p)["rate"]] for w, p in sorted(weeks.items())]
        out.append({**{k: v for k, v in d.items() if k != "pts"}, "stats": {**s, "charges": len(s["charges"]),
                    "days": len(used), "chargesPerDay": round(len(s["charges"]) / len(used), 1) if used else 0}, "weeks": trend})
    return out
