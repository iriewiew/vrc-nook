"""Chatbox info: a random status line, the song playing in Windows, the clock and heart rate (straight from a
Bluetooth watch/strap, or from Pulsoid), shown together in the in-game Chatbox over OSC.
Heart rate is also sent as avatar parameters."""
import asyncio
import ctypes
import datetime
import json
import logging
import random
import re
import subprocess
import threading
import time
import uuid
import urllib.error
import urllib.parse
import urllib.request
import webbrowser

import websocket

import osc

log = logging.getLogger(__name__)

DEFAULTS = {
    "on": False,          # Send to the Chatbox
    "status": True, "statuses": [], "statusEvery": 60,   # Random line from the list, changed every N seconds
    "media": True, "mediaFmt": "{artist} - {title}",
    # Second line under the song: time played / length / seek bar
    "mediaTime": False, "mediaDur": False, "mediaBar": False, "mediaBarStyle": "line", "mediaBarLen": 10,
    "clock": True, "clock24": True, "clockTz": False, "clockTzSup": False, "clockDate": False,
    "heart": False, "heartFmt": "{bpm}", "hrSuffixOn": False, "hrSuffix": "bpm", "hrSuffixSup": False, "hrParams": True,
    "hrSource": "ble",    # ble = Bluetooth heart-rate device (free) / pulsoid = Pulsoid account (BRO plan)
    "bleAddr": "", "bleName": "", "pulsoid": "",
    "interval": 3,        # Seconds between updates (1–60; VRChat may skip messages sent faster than ~1.5 s)
    # Order of the parts in the Chatbox: items, "br" = new line, "sep:<text>" = separator between two parts on a line,
    # "text:<text>" = the user's own text (always shown), "sup:<text>" = the same in small superscript letters
    "layout": ["status", "br", "media", "br", "clock", "sep:   ", "heart"],
    "icons": {"status": "", "media": "🎵", "clock": "🕒", "heart": "❤️", "devices": "", "pc": ""},   # Emoji in front of each part ("" = none)
    # VR devices from SteamVR: one entry per device, or one per kind (headset / controllers / trackers)
    "devices": False, "devTrkGroup": False, "devStat": "lowest", "devHmd": True, "devCtrl": True, "devTrk": True,
    "devCharging": True, "devLow": 20, "devHidden": [], "devOff": [],
    "devVibe": True, "devVibeIcon": "〰️", "devBattIcon": False, "devBattSym": "🔋", "devKindIcon": False,
    "devKindSyms": {"hmd": "🥽", "ctrl": "🎮", "trk": "📍", "toy": "📳"},
    "pc": False, "pcCpu": True, "pcGpu": True, "pcTemp": True, "pcRam": True, "pcVram": True, "pcFps": True, "pcTotal": False,
    "pcSep": " | ", "pcPerLine": 2, "pcLabels": {"cpu": "CPU", "gpu": "GPU", "ram": "RAM", "vram": "VRAM", "fps": "FPS"},
    "pcCpuName": False, "pcGpuName": False, "pcRamType": False, "pcIcon": False, "pcLblSup": False, "pcUnitSup": False,
    "pcIcons": {"cpu": "🧠", "gpu": "🎮", "ram": "💾", "vram": "🖼️", "fps": "⏱️"},
    "devToy": False, "devToyBatt": True, "intiface": "ws://127.0.0.1:12345", "intifaceRelay": 12346,
}
ITEMS = ("status", "media", "clock", "heart", "devices", "pc")
PC_ITEMS = ("cpu", "gpu", "ram", "vram", "fps")  # In the order they're shown
DEV_KINDS = {"hmd": ("devHmd", "🥽"), "ctrl": ("devCtrl", "🎮"), "trk": ("devTrk", "📍"), "toy": ("devToy", "📳")}  # Default label of each kind
BARS = {"line": ("━", "●", "─"), "blocks": ("▰", "", "▱"), "squares": ("■", "", "□"), "dots": ("●", "", "○")}  # filled, knob, empty
OLD_FMTS = {"mediaFmt": "🎵 {artist} - {title}", "heartFmt": "❤️ {bpm}"}  # Before icons were separate: drop the built-in emoji
PAUSE_AFTER_CHAT = 15     # Don't cover a message typed on the Chat page right away
KEEPALIVE = 20            # Resend unchanged text so it doesn't fade out
PULSOID_WS = "wss://dev.pulsoid.net/api/v1/data/real_time?access_token="
# VRC Nook's app ID from pulsoid.net/ui/api-clients — sign in instead of pasting a token (Pulsoid still requires BRO).
# Not a secret (it's sent in the open during sign-in). Empty = the Sign in button stays off
PULSOID_CLIENT_ID = "6693caf8-8f98-452c-9a50-ff109b7f6e72"
PULSOID_DEVICE = "https://pulsoid.net/oauth2/device_authorization"
PULSOID_TOKEN = "https://pulsoid.net/oauth2/token"
PLAYING = 4               # GlobalSystemMediaTransportControlsSessionPlaybackStatus.PLAYING
HR_SERVICE = uuid.UUID("0000180d-0000-1000-8000-00805f9b34fb")       # Bluetooth standard Heart Rate service
HR_MEASUREMENT = uuid.UUID("00002a37-0000-1000-8000-00805f9b34fb")   # ...and its Heart Rate Measurement characteristic


def _fmt_dur(td):
    s = int(td.total_seconds()) if td else 0
    return f"{s // 60}:{s % 60:02d}"


class ChatInfo:
    def __init__(self):
        self.cfg = dict(DEFAULTS)
        self.media = None          # {"title", "artist", "pos", "dur"} while something is playing
        self.bpm = None
        self.hr_state = "off"      # off / connecting / live / searching (Bluetooth) / badToken / error (Pulsoid)
        self.text = ""             # What was last sent
        self._status, self._status_at = "", 0.0
        self._sent_at, self._paused_until = 0.0, 0.0
        self._hr_at = 0.0
        self._watch_until = 0.0   # The OSC page is open — keep reading media for its preview even while sending is off
        self._ws, self._ws_token = None, ""
        self.login = {"state": "idle"}  # Pulsoid sign-in: idle / waiting / done (+ token) / denied / expired / error
        self._ble = None           # Started the first time Bluetooth is needed
        self.vr = _Vr()            # SteamVR devices (reads only while the devices part is on)
        self.toys = _Intiface()    # Devices connected in Intiface Central (only when switched on: it takes one app at a time)
        self.pc = _Pc()            # CPU / GPU / RAM / VRAM (FPS comes from SteamVR, in self.vr)
        self._lock = threading.Lock()
        threading.Thread(target=self._run, name="chatinfo", daemon=True).start()

    # ---------- Settings from the page ----------
    def configure(self, cfg):
        if not isinstance(cfg, dict):
            return
        c = dict(DEFAULTS)
        for k, v in cfg.items():
            if k in DEFAULTS and type(v) is type(DEFAULTS[k]):
                c[k] = v
        c["statuses"] = [str(s).strip()[:144] for s in c["statuses"] if str(s).strip()][:200]
        c["interval"] = min(max(int(c["interval"]), 1), 60)
        for k, old in OLD_FMTS.items():
            if c[k] == old:
                c[k] = DEFAULTS[k]
        c["layout"] = _clean_layout(c["layout"])
        c["icons"] = {k: str(c["icons"].get(k, DEFAULTS["icons"][k]))[:8] for k in ITEMS}
        c["icons"]["devices"] = ""  # No emoji for the whole part: each device has its own icons (battery / device)
        c["statusEvery"] = min(max(int(c["statusEvery"]), 5), 3600)
        c["pulsoid"] = c["pulsoid"].strip()[:200]
        if c["hrSource"] not in ("ble", "pulsoid"):
            c["hrSource"] = "ble"
        try:
            int(c["bleAddr"], 16)
        except ValueError:
            c["bleAddr"] = ""
        c["bleName"] = c["bleName"][:80]
        if cfg.get("devMode") == "group" and "devTrkGroup" not in cfg:  # The old "grouped by kind" mode
            c["devTrkGroup"] = True
        if c["devStat"] not in ("lowest", "average"):
            c["devStat"] = "lowest"
        c["devLow"] = min(max(int(c["devLow"]), 0), 100)
        if not c["intiface"].startswith(("ws://", "wss://")):
            c["intiface"] = DEFAULTS["intiface"]
        c["intiface"] = c["intiface"][:100]
        if c["intifaceRelay"] and not 1024 <= c["intifaceRelay"] <= 65535:  # 0 = no relay
            c["intifaceRelay"] = DEFAULTS["intifaceRelay"]
        c["devHidden"] = [str(k)[:64] for k in c["devHidden"]][:64]
        c["devOff"] = [str(k)[:64] for k in c["devOff"]][:64]
        c["devVibeIcon"] = c["devVibeIcon"][:8]
        c["devBattSym"] = c["devBattSym"][:8]
        c["pcSep"] = c["pcSep"][:12]
        c["pcPerLine"] = min(max(int(c["pcPerLine"]), 0), len(PC_ITEMS))  # 0 = all on one line
        c["pcLabels"] = {k: str(c["pcLabels"].get(k, DEFAULTS["pcLabels"][k]))[:12] for k in PC_ITEMS}
        old_icons = {"cpu": "💻", "gpu": "🖥️", "vram": "🗂️", "fps": "🎞️"}  # First defaults, replaced by clearer ones
        c["pcIcons"] = {k: DEFAULTS["pcIcons"][k] if not c["pcIcons"].get(k) or c["pcIcons"][k] == old_icons.get(k)
                        else str(c["pcIcons"][k])[:8] for k in PC_ITEMS}  # Empty = back to the default
        c["devKindSyms"] = {k: str(c["devKindSyms"].get(k) or e)[:8] for k, (_, e) in DEV_KINDS.items()}  # Empty = back to the default
        if c["mediaBarStyle"] not in BARS:
            c["mediaBarStyle"] = "line"
        c["mediaBarLen"] = min(max(int(c["mediaBarLen"]), 5), 20)
        c["hrSuffix"] = c["hrSuffix"].strip()[:16]
        old_src = self.cfg["hrSource"]
        with self._lock:
            if c["statuses"] != self.cfg["statuses"]:
                self._status_at = 0  # Pick a new line from the new list
            self.cfg = c
        src_changed = c["hrSource"] != old_src
        if src_changed:
            self.bpm = None
        self._pulsoid_sync()
        self._ble_sync()
        if not c["heart"] or not (c["pulsoid"] if c["hrSource"] == "pulsoid" else c["bleAddr"]):
            self.hr_state = "off"  # The chosen source has nothing set up (don't show the other source's state)

    def pause(self, seconds=PAUSE_AFTER_CHAT):
        """A message was sent by hand — leave it on screen for a while"""
        self._paused_until = time.monotonic() + seconds

    def state(self):
        self._watch_until = time.monotonic() + 5
        return {"text": self.build(), "sent": self.text, "media": self.media, "bpm": self.bpm, "hr": self.hr_state,
                "login": self.login, "canLogin": bool(PULSOID_CLIENT_ID), "vr": {"state": self.vr.state, "devices": self.vr.devices},
                "pc": {**self.pc.stats, "fps": self.vr.fps, "vr": self.vr.state},
                "toys": {"state": self.toys.state, "devices": self.toys.devices, "relay": self.toys.relay, "app": self.toys.app},
                "ble": {"scanning": self._ble.scanning, "found": self._ble.list()} if self._ble else {"scanning": False, "found": []},
                "paused": max(0, round(self._paused_until - time.monotonic()))}

    # ---------- Building the text ----------
    def _parts(self):
        """Text of each part that has something to show right now (with its icon)"""
        c, out = self.cfg, {}
        if c["status"] and c["statuses"]:
            now = time.monotonic()
            if not self._status or now - self._status_at >= c["statusEvery"] or self._status not in c["statuses"]:
                pool = [s for s in c["statuses"] if s != self._status] or c["statuses"]
                self._status, self._status_at = random.choice(pool), now
            out["status"] = self._status
        if c["media"] and self.media:
            m = self.media
            try:
                out["media"] = c["mediaFmt"].format(title=m["title"], artist=m["artist"], pos=m["pos"], dur=m["dur"]).strip()
            except (KeyError, IndexError, ValueError):
                out["media"] = f"{m['artist']} - {m['title']}".strip(" -")
            timeline = self._timeline(m)
            if timeline:
                out["media"] += "\n" + timeline
        if c["clock"]:
            now = datetime.datetime.now()
            bits = [now.strftime("%d/%m")] if c["clockDate"] else []
            bits.append(now.strftime("%H:%M" if c["clock24"] else "%I:%M %p").lstrip("0"))
            if c["clockTz"]:
                tz = _utc_offset()
                bits.append(sup(tz) if c["clockTzSup"] else tz)
            out["clock"] = " ".join(bits)
        if c["heart"] and self.bpm:
            try:
                out["heart"] = c["heartFmt"].format(bpm=self.bpm).strip()
            except (KeyError, IndexError, ValueError):
                out["heart"] = str(self.bpm)
            if c["hrSuffixOn"] and c["hrSuffix"]:  # Superscript sits right after the number, like 120ᶠᵖˢ
                out["heart"] += sup(c["hrSuffix"]) if c["hrSuffixSup"] else " " + c["hrSuffix"]
        if c["devices"]:
            out["devices"] = self._devices_text()
        if c["pc"]:
            out["pc"] = self._pc_text()
        return {k: f"{c['icons'][k]} {v}".strip() if c["icons"].get(k) else v for k, v in out.items() if v}

    def _devices_text(self):
        """'Quest 3 80% Touch L 65% Hip 70%⚡ Lush 64% 〰️45%' — trackers can be merged into one: '📍×3 62%'"""
        c = self.cfg
        off, vibe_on = set(c["devOff"]), c["devVibe"]
        devs = [d for d in self.vr.devices + self.toys.devices if d["serial"] not in off and c[DEV_KINDS[d["kind"]][0]]
                and (d["battery"] is not None or (vibe_on and d.get("vibe") is not None))]

        def bits(name, battery, charging, vibe):
            out = [name]
            if battery is not None:
                out.append((c["devBattSym"] if c["devBattIcon"] else "") + f"{battery}%" + ("⚡" if c["devCharging"] and charging else "") +
                           ("🪫" if battery <= c["devLow"] and not charging else ""))
            if vibe_on and vibe is not None:  # Vibration strength of an Intiface device
                out.append(f"{c['devVibeIcon']}{vibe}%")
            return " ".join(out)
        hidden = set(c["devHidden"])  # Hidden: just the short label (🥽 / L / T1 / 📳1) instead of the device's name

        def name(d):
            n = d["label"] if d["serial"] in hidden or not d["model"] else d["model"]
            default, kind = DEV_KINDS[d["kind"]][1], c["devKindSyms"][d["kind"]]
            if n.startswith(default):  # Short labels like '🥽' / '📳1' use the user's icon too
                n = kind + n[len(default):]
            return f"{kind} {n}" if c["devKindIcon"] and not n.startswith(kind) else n  # '🥽 Quest 3', but not '🥽 🥽'
        out, trackers = [], [d for d in devs if d["kind"] == "trk"]
        for d in devs:
            if d["kind"] != "trk" or not c["devTrkGroup"]:
                out.append(bits(name(d), d["battery"], d["charging"], d.get("vibe")))
            elif d is trackers[0]:  # All trackers as one, where the first one was: '📍×3 62%'
                vals = [t["battery"] for t in trackers]
                val = min(vals) if c["devStat"] == "lowest" else round(sum(vals) / len(vals))
                out.append(bits(c["devKindSyms"]["trk"] + (f"×{len(trackers)}" if len(trackers) > 1 else ""), val, any(t["charging"] for t in trackers), None))
        return " ".join(out)

    def _pc_text(self):
        """'CPU 60% | GPU 47% 56°C' / 'RAM 23.6GB | VRAM 7.5GB' / 'FPS 40' (one line each) — whatever is switched on and could be read.
        Options: icon in front, the model / RAM type ('CPU Ryzen 7 5700X 60%', 'RAM DDR4 23.6GB'),
        the label as small letters after the number ('60%ᶜᵖᵘ') and small units ('23.6ᴳᴮ', '56°ᶜ')"""
        c, s, bits = self.cfg, self.pc.stats, []
        unit = lambda u: sup(u) if c["pcUnitSup"] else u
        gb = lambda used, total: f"{used:.1f}" + (f"/{total:.0f}" if c["pcTotal"] and total else "") + unit("GB")
        values = {
            "cpu": s.get("cpu") is not None and f"{s['cpu']}%",
            "gpu": s.get("gpu") is not None and f"{s['gpu']}%" + (f" {s['temp']}°{unit('C')}" if c["pcTemp"] and s.get("temp") is not None else ""),
            "ram": s.get("ram") is not None and gb(s["ram"], s.get("ramTotal")),
            "vram": s.get("vram") is not None and gb(s["vram"], s.get("vramTotal")),
            "fps": self.vr.fps is not None and str(self.vr.fps),
        }
        names = {"cpu": c["pcCpuName"] and s.get("cpuName"), "gpu": c["pcGpuName"] and s.get("gpuName"), "ram": c["pcRamType"] and s.get("ramType")}
        for k in PC_ITEMS:
            if not (c["pc" + k.capitalize()] and values[k]):
                continue
            label, value = c["pcLabels"][k], values[k]
            if c["pcLblSup"] and label:  # '60%ᶜᵖᵘ' — the label moves after the number (before a GPU temperature)
                head, _, rest = value.partition(" ")
                gap = " " if c["pcUnitSup"] and k in ("ram", "vram") else ""  # '31.6ᴳᴮ ᴿᴬᴹ', not '31.6ᴳᴮᴿᴬᴹ'
                value, label = f"{head}{gap}{sup(label)}" + (f" {rest}" if rest else ""), ""
            front = " ".join(x for x in ((c["pcIcons"][k] if c["pcIcon"] else ""), label) if x)
            bits.append(" ".join(x for x in (front, names.get(k) or "", value) if x))
        n = c["pcPerLine"] or len(bits) or 1
        return "\n".join(c["pcSep"].join(bits[i:i + n]) for i in range(0, len(bits), n))

    def _timeline(self, m):
        """'1:23 ━━━●────── 3:45' — whichever of time played / seek bar / length are switched on"""
        c, bits = self.cfg, []
        if c["mediaTime"]:
            bits.append(m["pos"])
        if c["mediaBar"] and m.get("durS"):
            fill, knob, empty = BARS[c["mediaBarStyle"]]
            n, frac = c["mediaBarLen"], min(max(m["posS"] / m["durS"], 0), 1)
            k = min(round(frac * n), n - 1) if knob else round(frac * n)
            bits.append(fill * k + knob + empty * (n - k - (1 if knob else 0)))
        if c["mediaDur"] and m.get("durS"):
            bits.append(("/ " if c["mediaTime"] and not c["mediaBar"] else "") + m["dur"])
        return " ".join(bits)

    def build(self):
        """Lay the parts out in the user's order. A separator only shows between two parts that are both there"""
        parts, lines, line, sep = self._parts(), [], [], None
        for it in self.cfg["layout"]:
            if it == "br":
                lines.append("".join(line))
                line, sep = [], None
            elif it.startswith("sep:"):
                sep = it[4:]
            elif it in parts or (it.startswith(("text:", "sup:")) and it.split(":", 1)[1].strip()):
                text = parts.get(it) or it.split(":", 1)[1].strip()
                if it.startswith("sup:"):
                    text = sup(text)
                if line:
                    line.append(f" {sep.strip()} " if sep and sep.strip() else sep if sep else " ")
                line.append(text)
                sep = None
        lines.append("".join(line))
        return osc.clean("\n".join(l for l in lines if l.strip()))

    # ---------- Main loop: media every 2 s, Chatbox every `interval` s ----------
    def _run(self):
        loop = asyncio.new_event_loop()
        next_media = 0.0
        while True:
            now = time.monotonic()
            c = self.cfg
            if (c["on"] or now < self._watch_until) and c["media"] and now >= next_media:
                next_media = now + 2
                try:
                    self.media = loop.run_until_complete(self._read_media())
                except Exception as e:  # No media API (old Windows) or a player that misbehaves
                    log.debug("media read failed: %s", e)
                    self.media = None
            watching = c["on"] or now < self._watch_until
            self.vr.fps_wanted = c["pc"] and c["pcFps"] and watching
            self.vr.wanted = (c["devices"] and watching) or self.vr.fps_wanted
            self.pc.wanted = c["pc"] and watching
            self.toys.url, self.toys.relay_port, self.toys.battery = c["intiface"], c["intifaceRelay"], c["devToyBatt"]
            self.toys.wanted = c["devices"] and c["devToy"] and (c["on"] or now < self._watch_until)
            if c["heart"] and self.bpm and now - self._hr_at > 15:  # No reading for a while = sensor off
                self.bpm = None
                self._send_hr(None)
            if c["on"] and now >= self._paused_until:
                text = self.build()
                due = now - self._sent_at >= c["interval"]
                if text and due and (text != self.text or now - self._sent_at >= KEEPALIVE):
                    try:
                        osc.chatbox(text, False)
                        self.text, self._sent_at = text, now
                    except OSError as e:
                        log.warning("chatbox send failed: %s", e)
            time.sleep(0.5)

    @staticmethod
    async def _read_media():
        from winrt.windows.media.control import GlobalSystemMediaTransportControlsSessionManager as Manager
        mgr = await Manager.request_async()
        s = mgr.get_current_session()
        if not s or s.get_playback_info().playback_status != PLAYING:
            return None
        p = await s.try_get_media_properties_async()
        if not p or not (p.title or "").strip():
            return None
        tl = s.get_timeline_properties()
        pos = tl.position
        try:  # Players only report the position now and then — move it on by the time since
            pos += datetime.datetime.now(datetime.timezone.utc) - tl.last_updated_time
        except (TypeError, ValueError):
            pass
        dur = tl.end_time - tl.start_time
        pos = min(max(pos, datetime.timedelta(0)), dur) if dur.total_seconds() > 0 else pos
        return {"title": p.title.strip(), "artist": (p.artist or "").strip(), "pos": _fmt_dur(pos), "dur": _fmt_dur(dur),
                "posS": pos.total_seconds(), "durS": max(dur.total_seconds(), 0)}

    # ---------- Pulsoid sign-in (OAuth 2 device flow): opens Pulsoid in the browser, the user clicks Allow ----------
    def pulsoid_login(self):
        if not PULSOID_CLIENT_ID:
            return {"error": "noClient"}
        if self.login.get("state") == "waiting":
            return {"ok": True}
        try:
            d = _post_form(PULSOID_DEVICE, {"client_id": PULSOID_CLIENT_ID, "scope": "data:heart_rate:read"})
            url = d["verification_uri_complete"]
            if not url.startswith("https://pulsoid.net/"):
                raise ValueError("unexpected verification URL")
        except (OSError, ValueError, KeyError, _OAuthError) as e:  # _OAuthError: e.g. unauthorized_client (wrong client ID)
            log.warning("pulsoid sign-in start failed: %s", e)
            self.login = {"state": "error"}
            return {"error": "start"}
        self.login = {"state": "waiting", "url": url}
        webbrowser.open(url)
        threading.Thread(target=self._login_poll, args=(d["device_code"], int(d.get("interval") or 3), int(d.get("expires_in") or 600)),
                         name="pulsoid-login", daemon=True).start()
        return {"ok": True, "url": url}

    def pulsoid_login_cancel(self):
        self.login = {"state": "idle"}

    def _login_poll(self, device_code, interval, expires_in):
        end = time.monotonic() + expires_in
        while time.monotonic() < end and self.login.get("state") == "waiting":
            time.sleep(max(interval, 2))
            try:
                r = _post_form(PULSOID_TOKEN, {"grant_type": "urn:ietf:params:oauth:grant-type:device_code",
                                               "device_code": device_code, "client_id": PULSOID_CLIENT_ID})
            except _OAuthError as e:
                if e.code == "authorization_pending":
                    continue
                if e.code == "slow_down":
                    interval += 2
                    continue
                if self.login.get("state") == "waiting":
                    self.login = {"state": "expired" if e.code == "expired_token" else "denied"}
                return
            except (OSError, ValueError) as e:
                log.info("pulsoid sign-in poll: %s", e)
                continue
            token = str(r.get("access_token") or "")
            if self.login.get("state") == "waiting" and token:
                self.login = {"state": "done", "token": token}  # The page saves it into the settings (like a pasted token)
            return
        if self.login.get("state") == "waiting":
            self.login = {"state": "expired"}

    # ---------- Pulsoid (WebSocket, token from pulsoid.net) ----------
    def _pulsoid_sync(self):
        token = self.cfg["pulsoid"] if self.cfg["heart"] and self.cfg["hrSource"] == "pulsoid" else ""
        if token == self._ws_token:
            return
        old, self._ws, self._ws_token = self._ws, None, token
        if old:
            old.keep_running = False
            old.close()
        self.bpm = None
        self._send_hr(None)
        if not token:
            if self.cfg["hrSource"] == "pulsoid" or not self.cfg["heart"]:
                self.hr_state = "off"
            return
        self.hr_state = "connecting"
        ws = websocket.WebSocketApp(PULSOID_WS + token, on_message=self._on_hr, on_open=lambda _: self._hr_live(),
                                    on_error=self._on_hr_error)
        self._ws = ws
        threading.Thread(target=self._pulsoid_run, args=(ws, token), name="pulsoid", daemon=True).start()

    def _pulsoid_run(self, ws, token):
        delay = 3
        while self._ws is ws and self.hr_state != "badToken":
            ws.run_forever(ping_interval=30, ping_timeout=10)
            if self._ws is not ws or self.hr_state == "badToken":
                break
            self.hr_state = "connecting"
            time.sleep(delay)
            delay = min(delay * 2, 60)

    def _hr_live(self):
        self.hr_state = "live"

    def _on_hr_error(self, ws, err):
        status = getattr(err, "status_code", None)
        if status in (401, 403):
            self.hr_state = "badToken"
        else:
            self.hr_state = "error"
            log.info("pulsoid: %s", err)

    def _on_hr(self, ws, msg):
        try:
            self._got_bpm(int(json.loads(msg)["data"]["heart_rate"]))
        except (ValueError, KeyError, TypeError):
            pass

    # ---------- Bluetooth heart-rate device ----------
    def ble_scan(self):
        self._ble_get().scan()
        return True

    def _ble_get(self):
        if not self._ble:
            self._ble = _Ble(self._got_bpm, self._ble_state)
        return self._ble

    def _ble_sync(self):
        c = self.cfg
        addr = int(c["bleAddr"], 16) if c["heart"] and c["hrSource"] == "ble" and c["bleAddr"] else None
        if addr is None and c["hrSource"] == "ble":
            self.hr_state = "off"
        if addr is None and not self._ble:
            return
        if self._ble_get().use(addr):
            self.bpm = None

    def _ble_state(self, st):
        if self.cfg["hrSource"] == "ble":
            self.hr_state = st

    def _got_bpm(self, bpm):
        if not 20 <= bpm <= 255:
            return
        self.bpm, self._hr_at, self.hr_state = bpm, time.monotonic(), "live"
        self._send_hr(bpm)

    def _send_hr(self, bpm):
        """Avatar parameters in the common HRtoVRChat naming, so existing heart-rate avatars just work"""
        if not self.cfg["hrParams"]:
            return
        try:
            if bpm is None:
                osc.param("isHRConnected", False)
                osc.param("isHRActive", False)
                return
            osc.param("HR", bpm)
            osc.param("onesHR", bpm % 10)
            osc.param("tensHR", bpm // 10 % 10)
            osc.param("hundredsHR", bpm // 100 % 10)
            osc.param("HRPercent", round(bpm / 255, 4))
            osc.param("isHRConnected", True)
            osc.param("isHRActive", True)
        except OSError:
            pass


_SUP = str.maketrans(
    "abcdefghijklmnoprstuvwxyzABDEGHIJKLMNOPRTUVW0123456789+-=()",
    "ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻᴬᴮᴰᴱᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᴿᵀᵁⱽᵂ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾")
_SUP_UPPER_AS_LOWER = str.maketrans("CFQSXYZ", "ᶜᶠqˢˣʸᶻ")  # No superscript capital in Unicode — use the small letter


def sup(text):
    """Small superscript letters, like 120ᶠᵖˢ. Letters without a superscript form (q, Thai…) stay as they are"""
    return text.translate(_SUP_UPPER_AS_LOWER).translate(_SUP)


def _utc_offset():
    """Local time zone as 'UTC+7' / 'UTC+5:30' (Windows' own zone names are too long for the Chatbox)"""
    off = int(datetime.datetime.now().astimezone().utcoffset().total_seconds() // 60)
    sign, off = ("+" if off >= 0 else "-"), abs(off)
    return f"UTC{sign}{off // 60}" + (f":{off % 60:02d}" if off % 60 else "")


def _clean_layout(layout):
    """Only known entries; every item exactly once (missing ones go at the end); short separators"""
    out, seen = [], set()
    for it in layout if isinstance(layout, list) else []:
        it = str(it)
        if it in ITEMS and it not in seen:
            seen.add(it)
            out.append(it)
        elif it == "br" or it.startswith("sep:"):
            out.append(it[:24])
        elif it.startswith(("text:", "sup:")):
            out.append(it[:it.index(":") + 61])
        if len(out) >= 40:
            break
    for k in ITEMS:  # A part that's new in this version goes on its own line at the end
        if k not in seen:
            out += ["br", k] if out else [k]
    return out


class _Vr:
    """VR devices and their battery from SteamVR, read every few seconds while wanted.
    Uses the "background" app type: never starts SteamVR, just waits until it's running.
    Virtual Desktop / Quest Link without SteamVR (OpenXR) can't be read this way."""
    POLL, RETRY = 5, 10

    def __init__(self):
        self.wanted = self.fps_wanted = False
        self.state = "off"     # off / noSteamVR / ok / error
        self.devices = []      # [{"serial", "kind": hmd|ctrl|trk, "label", "model", "battery": 0-100|None, "charging"}]
        self.fps = None        # Frames per second the game hands SteamVR (None = no game / not wanted)
        self._frames = None    # (pid, frames submitted, time) at the last FPS reading
        threading.Thread(target=self._run, name="steamvr", daemon=True).start()

    def _run(self):
        system = None
        while True:
            if not self.wanted:
                if system:
                    self._close()
                    system = None
                self.state, self.devices, self.fps = "off", [], None
                time.sleep(1)
                continue
            try:
                import openvr
                if not system:
                    system = openvr.init(openvr.VRApplication_Background)
                if self._quit_requested(system, openvr):
                    self._close()
                    system = None
                    raise OSError("SteamVR closed")
                self.devices = self._read(system, openvr)
                self.state = "ok"
                for _ in range(self.POLL):  # FPS is read every second
                    self.fps = self._read_fps(openvr) if self.fps_wanted else None
                    time.sleep(1)
            except Exception as e:  # SteamVR not running (InitError_Init_NoServerForBackgroundApp) or it just quit
                not_running = "NoServer" in type(e).__name__ or "closed" in str(e)
                self.state, self.devices, self.fps, self._frames = ("noSteamVR" if not_running else "error"), [], None, None
                if not not_running:
                    log.info("steamvr: %r", e)
                if system:
                    self._close()
                    system = None
                time.sleep(self.RETRY)

    @staticmethod
    def _close():
        try:
            import openvr
            openvr.shutdown()
        except Exception:
            pass

    def _read_fps(self, openvr):
        """Frames the game submitted to SteamVR since the last reading, per second"""
        stats = openvr.VRCompositor().getCumulativeStats(ctypes.sizeof(openvr.Compositor_CumulativeStats))
        now, prev = (stats.m_nPid, stats.m_nNumFrameSubmits, time.monotonic()), self._frames
        self._frames = now
        if not stats.m_nPid or not prev or prev[0] != now[0] or now[2] <= prev[2]:
            return None  # No game connected, or it just changed
        return max(round((now[1] - prev[1]) / (now[2] - prev[2])), 0)

    @staticmethod
    def _quit_requested(system, openvr):
        ev = openvr.VREvent_t()
        while system.pollNextEvent(ev):
            if ev.eventType == openvr.VREvent_Quit:
                system.acknowledgeQuit_Exiting()  # Let SteamVR close without waiting for us
                return True
        return False

    @staticmethod
    def _read(system, openvr):
        kinds = {openvr.TrackedDeviceClass_HMD: "hmd", openvr.TrackedDeviceClass_Controller: "ctrl", openvr.TrackedDeviceClass_GenericTracker: "trk"}

        def prop(kind, i, p, default=None):
            try:
                return getattr(system, f"get{kind}TrackedDeviceProperty")(i, p)
            except Exception:  # The driver doesn't report this property
                return default
        out, trackers = [], 0
        for i in range(openvr.k_unMaxTrackedDeviceCount):
            kind = kinds.get(system.getTrackedDeviceClass(i))
            if not kind or not system.isTrackedDeviceConnected(i):
                continue
            has_battery = prop("Bool", i, openvr.Prop_DeviceProvidesBatteryStatus_Bool, False)
            level = prop("Float", i, openvr.Prop_DeviceBatteryPercentage_Float) if has_battery else None
            if kind == "hmd":
                label = "🥽"
            elif kind == "ctrl":
                role = prop("Int32", i, openvr.Prop_ControllerRoleHint_Int32, 0)
                label = {openvr.TrackedControllerRole_LeftHand: "L", openvr.TrackedControllerRole_RightHand: "R"}.get(role, "🎮")
            else:
                trackers += 1
                label = f"T{trackers}"
            out.append({"serial": prop("String", i, openvr.Prop_SerialNumber_String, f"#{i}"), "kind": kind, "label": label,
                        "model": prop("String", i, openvr.Prop_ModelNumber_String, ""),
                        "battery": round(level * 100) if isinstance(level, float) else None,
                        "charging": bool(prop("Bool", i, openvr.Prop_DeviceIsCharging_Bool, False)) if has_battery else False})
        return out


class _Pc:
    """CPU / RAM from Windows, GPU load / temperature / VRAM from NVIDIA's NVML (comes with the driver).
    Other GPUs fall back to Windows' own GPU counters (the ones Task Manager shows), which have no temperature."""
    POLL = 2

    def __init__(self):
        self.wanted = False
        self.stats = {}        # cpu %, ram / ramTotal GB, gpu %, temp °C, vram / vramTotal GB — only what could be read
        self.names = None      # cpuName, gpuName, ramType — looked up once, the first time they're wanted
        self._cpu_prev = None
        self._nvml = self._gpu = self._pdh = None
        threading.Thread(target=self._run, name="pcstats", daemon=True).start()

    def _run(self):
        while True:
            if not self.wanted:
                self.stats, self._cpu_prev = {}, None
                time.sleep(1)
                continue
            if self.names is None:
                self.names = self._read_names()
            s = dict(self.names)
            for read in (self._read_cpu, self._read_ram, self._read_gpu):
                try:
                    s.update(read())
                except Exception as e:  # One source failing shouldn't hide the others
                    log.debug("pc stats: %s failed: %r", read.__name__, e)
            self.stats = s
            time.sleep(self.POLL)

    # ---------- Names: 'Ryzen 7 5700X', 'RTX 3080', 'DDR4' ----------
    RAM_TYPES = {20: "DDR", 21: "DDR2", 24: "DDR3", 26: "DDR4", 27: "LPDDR", 28: "LPDDR2", 29: "LPDDR3", 30: "LPDDR4", 34: "DDR5", 35: "LPDDR5"}

    @staticmethod
    def short_name(name):
        """Drop the brand and filler: 'AMD Ryzen 7 5700X 8-Core Processor' -> 'Ryzen 7 5700X', 'NVIDIA GeForce RTX 3080' -> 'RTX 3080'"""
        name = re.sub(r"\((R|TM)\)", "", name)
        name = re.sub(r"\b\d+(th|st|nd|rd) Gen\b|\s*w/ .*|\bIntel\b|\bAMD\b|\bNVIDIA\b|\bGeForce\b|\bCore\b(?= i\d)|"
                      r"\b\d+-Core\b|\bProcessor\b|\bwith Radeon Graphics\b|\bCPU @ .*|\bGraphics\b(?=$)", "", name, flags=re.I)
        return " ".join(name.split())[:40]

    def _read_names(self):
        out = {}
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"HARDWARE\DESCRIPTION\System\CentralProcessor\0") as k:
                out["cpuName"] = self.short_name(winreg.QueryValueEx(k, "ProcessorNameString")[0])
        except OSError:
            pass
        try:  # RAM type and the main graphics card (the one with the most memory; skips virtual displays)
            ps = ("$m = Get-CimInstance Win32_PhysicalMemory | Select-Object -First 1 SMBIOSMemoryType;"
                  "$g = Get-CimInstance Win32_VideoController | Sort-Object AdapterRAM -Descending | Select-Object -First 1 Name;"
                  "@{ram = $m.SMBIOSMemoryType; gpu = $g.Name} | ConvertTo-Json -Compress")
            r = subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", ps], capture_output=True, text=True,
                               timeout=20, creationflags=subprocess.CREATE_NO_WINDOW)
            info = json.loads(r.stdout or "{}")
            if info.get("ram") in self.RAM_TYPES:
                out["ramType"] = self.RAM_TYPES[info["ram"]]
            if info.get("gpu"):
                out["gpuName"] = self.short_name(info["gpu"])
        except (OSError, ValueError, subprocess.SubprocessError) as e:
            log.debug("pc names: %r", e)
        return out

    # ---------- CPU and RAM (kernel32) ----------
    def _read_cpu(self):
        idle, kernel, user = (ctypes.c_ulonglong() for _ in range(3))
        if not ctypes.windll.kernel32.GetSystemTimes(ctypes.byref(idle), ctypes.byref(kernel), ctypes.byref(user)):
            return {}
        now, prev = (idle.value, kernel.value + user.value), self._cpu_prev  # Kernel time includes idle time
        self._cpu_prev = now
        if not prev or now[1] == prev[1]:
            return {}
        return {"cpu": round(100 * (1 - (now[0] - prev[0]) / (now[1] - prev[1])))}

    @staticmethod
    def _read_ram():
        class MemoryStatus(ctypes.Structure):
            _fields_ = [("length", ctypes.c_ulong), ("load", ctypes.c_ulong), ("total", ctypes.c_ulonglong), ("avail", ctypes.c_ulonglong),
                        ("pageTotal", ctypes.c_ulonglong), ("pageAvail", ctypes.c_ulonglong), ("virtTotal", ctypes.c_ulonglong),
                        ("virtAvail", ctypes.c_ulonglong), ("extAvail", ctypes.c_ulonglong)]
        m = MemoryStatus(length=ctypes.sizeof(MemoryStatus))
        if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m)):
            return {}
        return {"ram": (m.total - m.avail) / 2 ** 30, "ramTotal": m.total / 2 ** 30}

    # ---------- GPU ----------
    def _read_gpu(self):
        if self._nvml is None:
            self._nvml = self._open_nvml() or False
        if self._nvml:
            return self._read_nvml()
        return self._read_pdh()

    def _open_nvml(self):
        import os
        for path in ("nvml.dll", os.path.expandvars(r"%ProgramFiles%\NVIDIA Corporation\NVSMI\nvml.dll")):
            try:
                lib = ctypes.CDLL(path)
            except OSError:
                continue
            if lib.nvmlInit_v2() != 0:
                return None
            count, best = ctypes.c_uint(), None
            lib.nvmlDeviceGetCount_v2(ctypes.byref(count))
            for i in range(count.value):  # Several NVIDIA cards: use the one with the most memory
                h, mem = ctypes.c_void_p(), self._NvMem()
                if lib.nvmlDeviceGetHandleByIndex_v2(i, ctypes.byref(h)) == 0 and lib.nvmlDeviceGetMemoryInfo(h, ctypes.byref(mem)) == 0:
                    if not best or mem.total > best[1]:
                        best = (h, mem.total)
            if not best:
                return None
            self._gpu = best[0]
            name = ctypes.create_string_buffer(96)
            lib.nvmlDeviceGetName(self._gpu, name, 96)
            self._gpu_name = self.short_name(name.value.decode(errors="replace"))
            return lib
        return None

    class _NvMem(ctypes.Structure):
        _fields_ = [("total", ctypes.c_ulonglong), ("free", ctypes.c_ulonglong), ("used", ctypes.c_ulonglong)]

    class _NvUtil(ctypes.Structure):
        _fields_ = [("gpu", ctypes.c_uint), ("memory", ctypes.c_uint)]

    def _read_nvml(self):
        lib, h, out = self._nvml, self._gpu, {"gpuName": self._gpu_name}
        util, temp, mem = self._NvUtil(), ctypes.c_uint(), self._NvMem()
        if lib.nvmlDeviceGetUtilizationRates(h, ctypes.byref(util)) == 0:
            out["gpu"] = util.gpu
        if lib.nvmlDeviceGetTemperature(h, 0, ctypes.byref(temp)) == 0:  # 0 = the GPU die
            out["temp"] = temp.value
        if lib.nvmlDeviceGetMemoryInfo(h, ctypes.byref(mem)) == 0:
            out["vram"], out["vramTotal"] = mem.used / 2 ** 30, mem.total / 2 ** 30
        return out

    def _read_pdh(self):
        """Windows' GPU counters: load = busiest GPU's 3D engines, VRAM = its dedicated memory in use"""
        pdh = ctypes.windll.pdh
        if self._pdh is None:
            query, load, vram = ctypes.c_void_p(), ctypes.c_void_p(), ctypes.c_void_p()
            if pdh.PdhOpenQueryW(None, None, ctypes.byref(query)) != 0:
                self._pdh = False
                return {}
            pdh.PdhAddEnglishCounterW(query, r"\GPU Engine(*engtype_3D)\Utilization Percentage", None, ctypes.byref(load))
            pdh.PdhAddEnglishCounterW(query, r"\GPU Adapter Memory(*)\Dedicated Usage", None, ctypes.byref(vram))
            pdh.PdhCollectQueryData(query)  # Rates need two samples — the first reading comes next round
            self._pdh = (query, load, vram)
            return {}
        if not self._pdh:
            return {}
        query, load, vram = self._pdh
        if pdh.PdhCollectQueryData(query) != 0:
            return {}
        per_gpu = {}
        for name, value in self._pdh_values(load):  # 'pid_123_luid_0x..._0x..._phys_0_eng_0_engtype_3D'
            gpu = name[name.find("luid_"):name.find("_phys")]
            per_gpu[gpu] = per_gpu.get(gpu, 0) + value
        out = {}
        if per_gpu:
            out["gpu"] = min(round(max(per_gpu.values())), 100)
        used = [v for _, v in self._pdh_values(vram)]
        if used:
            out["vram"] = max(used) / 2 ** 30
        return out

    @staticmethod
    def _pdh_values(counter):
        class Item(ctypes.Structure):
            _fields_ = [("name", ctypes.c_wchar_p), ("status", ctypes.c_ulong), ("value", ctypes.c_double)]
        pdh, size, count = ctypes.windll.pdh, ctypes.c_ulong(0), ctypes.c_ulong(0)
        PDH_MORE_DATA, PDH_FMT_DOUBLE = 0x800007D2, 0x200
        if pdh.PdhGetFormattedCounterArrayW(counter, PDH_FMT_DOUBLE, ctypes.byref(size), ctypes.byref(count), None) & 0xFFFFFFFF != PDH_MORE_DATA:
            return []
        buf = (ctypes.c_byte * size.value)()
        if pdh.PdhGetFormattedCounterArrayW(counter, PDH_FMT_DOUBLE, ctypes.byref(size), ctypes.byref(count), buf) != 0:
            return []
        items = ctypes.cast(buf, ctypes.POINTER(Item))
        return [(items[i].name, items[i].value) for i in range(count.value) if items[i].status == 0]


class _Intiface:
    """Devices connected in Intiface Central (Buttplug protocol) and their battery.
    Intiface serves one app at a time, so VRC Nook can also be the go-between: another app (e.g. OscGoesBrrr) connects to
    ws://127.0.0.1:<relay port> instead of Intiface, everything it sends goes on to Intiface unchanged, and VRC Nook slips in
    its own battery reads (with Ids far above anything the app uses) and keeps those replies to itself.
    Only lists what Intiface already has connected — scanning is left to Intiface / the other app."""
    BATTERY_EVERY, RETRY = 60, 10
    FIRST_READ, READ_TIMEOUT, MAX_MISSES = 5, 15, 2   # Some devices hang Intiface when asked for their battery too eagerly
    OWN_ID = 4_000_000_000     # Our message Ids start here (Buttplug Ids are u32; apps count up from 1)

    def __init__(self):
        self.wanted, self.url, self.relay_port = False, DEFAULTS["intiface"], DEFAULTS["intifaceRelay"]
        self.battery = True    # Ask Intiface for battery levels at all
        self.state = "off"     # off / noIntiface / ok / error
        self.relay = "off"     # off / waiting / app (an app is connected through us) / portBusy
        self.app = ""          # Name the connected app gave Intiface
        self.devices = []      # Same shape as _Vr's, kind "toy"
        self._found = {}       # DeviceIndex -> {"name", "feature": battery sensor/feature index|None, "range", "level"}
        self._ver, self._id, self._pending = 3, 0, None
        threading.Thread(target=lambda: asyncio.run(self._main()), name="intiface", daemon=True).start()

    # ---------- Loop: listen for an app on the relay port; keep one session with Intiface (ours, or the app's) ----------
    async def _main(self):
        import websockets
        server, port = None, 0
        while True:
            want_port = self.relay_port if self.wanted else 0
            if server and port != want_port:
                server.close()
                await server.wait_closed()
                server, port = None, 0
                self.relay = "off"
            if want_port and not server:
                try:
                    server = await websockets.serve(self._on_app, "127.0.0.1", want_port, ping_interval=None, max_size=None, close_timeout=2)
                    port, self.relay = want_port, "waiting"
                except OSError:  # Something else already uses that port
                    self.relay = "portBusy"
            if not self.wanted:
                self.state, self.devices, self.relay = "off", [], "off"
                await asyncio.sleep(1)
                continue
            app, self._pending = self._pending, None
            url = self.url
            failed = False
            try:
                await self._session(url, app)
            except Exception as e:  # Intiface isn't running / its server isn't started, it's busy, or it closed
                refused = isinstance(e, (OSError, websockets.ConnectionClosed)) and not isinstance(e, _IntifaceError)
                self.state, self.devices, self._found = ("noIntiface" if refused else "error"), [], {}
                if not refused:
                    log.info("intiface: %r", e)
                failed = True
            if app:  # The app's connection ends with its session; it reconnects by itself
                await app[0].close()
                if not app[1].done():
                    app[1].set_result(None)
            if self.relay == "app":
                self.relay = "waiting" if port else "off"
            self.app = ""
            for _ in range(self.RETRY if failed else 0):  # Retry later — sooner if an app connects or the address changes
                if self._pending or not self.wanted or self.url != url:
                    break
                await asyncio.sleep(1)

    async def _on_app(self, ws):
        """An app connected to the relay port. One at a time, like Intiface itself"""
        if self.relay == "app" or self._pending:
            await ws.close(1013, "Another app is already connected through VRC Nook")
            return
        done = asyncio.get_running_loop().create_future()
        self._pending = (ws, done)
        await done  # The session with Intiface runs in _main; the connection closes when this returns

    async def _session(self, url, app):
        """One connection to Intiface — for us alone, or carrying an app's messages. Returns when it should be redone"""
        import websockets
        async with websockets.connect(url, open_timeout=5, ping_interval=None, max_size=None) as up:
            ping = await self._handshake(up, app)
            self.state = "ok"
            self._found = {}
            await self._send(up, "RequestDeviceList")
            up_rx = asyncio.ensure_future(up.recv())
            app_rx = asyncio.ensure_future(app[0].recv()) if app else None
            next_ping = 0.0
            try:
                while self.wanted and self.url == url and (app or not self._pending):
                    done, _ = await asyncio.wait({t for t in (up_rx, app_rx) if t}, timeout=min(1, ping / 4) if ping and not app else 1,
                                                 return_when=asyncio.FIRST_COMPLETED)
                    if up_rx in done:
                        msgs = self._parse(up_rx.result())
                        for m in msgs:
                            self._handle(m)
                        theirs = [m for m in msgs if not self._ours(m)]
                        if app and theirs:
                            await app[0].send(json.dumps(theirs))
                        up_rx = asyncio.ensure_future(up.recv())
                    if app_rx and app_rx in done:
                        try:
                            raw = app_rx.result()
                        except websockets.ConnectionClosed:
                            return  # The app left — start over on our own
                        for m in self._parse(raw):
                            self._handle(m)  # Not needed for its replies, but harmless
                        await up.send(raw)
                        app_rx = asyncio.ensure_future(app[0].recv())
                    now = time.monotonic()
                    if ping and not app and now >= next_ping:  # A connected app pings for itself
                        await self._send(up, "Ping")
                        next_ping = now + ping / 2
                    await self._read_batteries(up, now)
                    self._publish()
            finally:
                for t in (up_rx, app_rx):
                    if t:
                        t.cancel()
                if app:
                    await app[0].close()

    async def _handshake(self, up, app):
        """Ours (protocol 3), or the app's own RequestServerInfo passed through so it gets the version it asked for.
        Returns how often to ping (seconds, 0 = never)"""
        if app:
            raw = await asyncio.wait_for(app[0].recv(), 10)
            for m in self._parse(raw):
                info = m.get("RequestServerInfo")
                if info:
                    self._ver = info.get("ProtocolVersionMajor", info.get("MessageVersion", 3))
                    self.app = str(info.get("ClientName", ""))[:40]
            await up.send(raw)
            self.relay = "app"
        else:
            self._ver = 3
            await self._send(up, "RequestServerInfo", ClientName="VRC Nook", MessageVersion=3)
        for _ in range(3):
            raw = await asyncio.wait_for(up.recv(), 5)
            if app:
                await app[0].send(raw)
            for m in self._parse(raw):
                if "ServerInfo" in m:
                    return m["ServerInfo"].get("MaxPingTime", 0) / 1000
                if "Error" in m:
                    raise _IntifaceError(m["Error"].get("ErrorMessage", "refused"))
        raise _IntifaceError("no reply from Intiface")

    async def _send(self, up, kind, **fields):
        self._id = self._id + 1 if self._id >= self.OWN_ID else self.OWN_ID
        await up.send(json.dumps([{kind: {"Id": self._id, **fields}}]))
        return self._id

    async def _read_batteries(self, up, now):
        """Gently: a few seconds after a device shows up, one read at a time, never a second one while the first is unanswered,
        and none at all for a device that refused or didn't answer — a stuck read can freeze Intiface Central"""
        if not self.battery:
            return
        for i, d in sorted(self._found.items()):
            if d["feature"] is None or d["misses"] >= self.MAX_MISSES:
                continue
            if d["wait"]:
                if now - d["wait"][1] < self.READ_TIMEOUT:
                    return  # Still waiting for it — ask nothing else meanwhile
                d["wait"] = None
                d["misses"] += 1
                log.info("intiface: no battery reply from %s (%d)", d["name"], d["misses"])
                continue
            if now >= d["next"]:
                if self._ver >= 4:
                    sent = await self._send(up, "InputCmd", DeviceIndex=i, FeatureIndex=d["feature"], Type="Battery", Command="Read")
                else:
                    sent = await self._send(up, "SensorReadCmd", DeviceIndex=i, SensorIndex=d["feature"], SensorType="Battery")
                d["wait"], d["next"] = (sent, now), now + self.BATTERY_EVERY
                return

    def _ours(self, m):
        body = next(iter(m.values()), None)
        return isinstance(body, dict) and isinstance(body.get("Id"), int) and body["Id"] >= self.OWN_ID

    @staticmethod
    def _parse(raw):
        try:
            msgs = json.loads(raw)
        except (ValueError, TypeError):
            return []
        return [m for m in msgs if isinstance(m, dict) and m] if isinstance(msgs, list) else []

    # ---------- Device list and battery replies (protocol 3 and 4) ----------
    def _handle(self, m):
        if "Error" in m and self._ours(m):  # Our battery read was refused — don't ask that device again
            for d in self._found.values():
                if d["wait"] and d["wait"][0] == m["Error"].get("Id"):
                    d["wait"], d["misses"] = None, self.MAX_MISSES
                    log.info("intiface: battery read refused by %s: %s", d["name"], m["Error"].get("ErrorMessage"))
        elif "DeviceList" in m:
            devs = m["DeviceList"].get("Devices", [])
            if isinstance(devs, dict):  # Protocol 4: always the whole list (no DeviceAdded / DeviceRemoved)
                old, self._found = self._found, {}
                for d in devs.values():
                    self._add(d, old)
            else:
                for d in devs:
                    self._add(d)
        elif "DeviceAdded" in m:
            self._add(m["DeviceAdded"])
        elif "DeviceRemoved" in m:
            self._found.pop(m["DeviceRemoved"].get("DeviceIndex"), None)
        elif "SensorReading" in m and m["SensorReading"].get("SensorType") == "Battery":
            r = m["SensorReading"]
            self._level(r.get("DeviceIndex"), (r.get("Data") or [None])[0])
        elif "InputReading" in m:
            r = m["InputReading"]
            battery = (r.get("Reading") or {}).get("Battery")
            if isinstance(battery, dict):
                self._level(r.get("DeviceIndex"), battery.get("Value"))
        # What the app tells a device to do (only seen while it's connected through us)
        elif "OutputCmd" in m:  # Protocol 4: {"Command": {"Vibrate": {"Value": 10}}}, Value within the feature's range
            r = m["OutputCmd"]
            d = self._found.get(r.get("DeviceIndex"))
            for cmd in (r.get("Command") or {}).values():
                if d and isinstance(cmd, dict) and r.get("FeatureIndex") in d["outs"]:
                    self._vibe(d, r["FeatureIndex"], cmd.get("Value"), d["outs"][r["FeatureIndex"]])
        elif "ScalarCmd" in m or "VibrateCmd" in m:  # Protocol 3 / 2: 0.0–1.0 per motor
            r = m.get("ScalarCmd") or m.get("VibrateCmd")
            d = self._found.get(r.get("DeviceIndex"))
            for x in (r.get("Scalars") or r.get("Speeds") or []) if d else []:
                if isinstance(x, dict):
                    self._vibe(d, x.get("Index"), x.get("Scalar", x.get("Speed")), 1)
        elif "StopDeviceCmd" in m or "StopAllDevices" in m or "StopCmd" in m:
            r = next(iter(m.values())) or {}
            for i, d in self._found.items():
                if r.get("DeviceIndex") in (None, i):
                    d["motors"] = {}

    @staticmethod
    def _vibe(d, motor, value, top):
        if isinstance(value, (int, float)) and top:
            d["motors"][motor] = min(max(round(value * 100 / top), 0), 100)

    def _level(self, i, value):
        d = self._found.get(i)
        if d and isinstance(value, (int, float)):
            d["wait"], d["misses"] = None, 0
            d["level"] = min(max(round(value * 100 / (d["range"] or 100)), 0), 100)

    def _add(self, dev, old=None):
        i = dev.get("DeviceIndex")
        if not isinstance(i, int):
            return
        feature, top = None, 100
        for n, s in enumerate(dev.get("DeviceMessages", {}).get("SensorReadCmd", []) or []):  # Protocol 3
            if s.get("SensorType") == "Battery":
                feature = n
                try:
                    top = s["SensorRange"][0][1] or 100
                except (KeyError, IndexError, TypeError):
                    pass
                break
        for k, f in (dev.get("DeviceFeatures") or {}).items():  # Protocol 4
            battery = (f.get("Input") or {}).get("Battery") if isinstance(f, dict) else None
            if isinstance(battery, dict):
                feature = f.get("FeatureIndex", int(k) if str(k).isdigit() else None)
                try:
                    top = battery["Value"][0][1] or 100
                except (KeyError, IndexError, TypeError):
                    pass
                break
        outs = {}  # Motors: feature index -> top of its range (protocol 4); protocol 3 sends 0.0–1.0
        for n, _ in enumerate(dev.get("DeviceMessages", {}).get("ScalarCmd", []) or []):
            outs[n] = 1
        for k, f in (dev.get("DeviceFeatures") or {}).items():
            for kind, o in ((f.get("Output") or {}) if isinstance(f, dict) else {}).items():
                if kind in ("Vibrate", "Oscillate", "Rotate", "Constrict") and isinstance(o, dict):
                    rng = o.get("Value") or [0, 1]
                    rng = rng[0] if rng and isinstance(rng[0], list) else rng
                    idx = f.get("FeatureIndex", int(k) if str(k).isdigit() else None)
                    if idx is not None:
                        outs[idx] = rng[-1] or 1
        name = str(dev.get("DeviceDisplayName") or dev.get("DeviceName") or f"Device {i}")[:60]
        prev = (old if old is not None else self._found).get(i)
        same = prev and prev["name"] == name
        self._found[i] = {"name": name, "feature": feature, "range": top, "level": prev["level"] if same else None,
                          "outs": outs, "motors": prev["motors"] if same else {},
                          **({k: prev[k] for k in ("wait", "misses", "next")} if same else
                             {"wait": None, "misses": 0, "next": time.monotonic() + self.FIRST_READ})}

    def _publish(self):
        """Short label "📳" (numbered when there are several) for when the user hides the device's name"""
        out, seen = [], {}
        many = len(self._found) > 1
        for n, (i, d) in enumerate(sorted(self._found.items()), 1):
            seen[d["name"]] = seen.get(d["name"], 0) + 1  # Two of the same model still need different keys for their names
            key = "intiface:" + d["name"] + (f"#{seen[d['name']]}" if seen[d["name"]] > 1 else "")
            out.append({"serial": key, "kind": "toy", "label": f"📳{n}" if many else "📳", "model": d["name"],
                        "battery": d["level"], "charging": False,
                        "vibe": max(d["motors"].values(), default=0) if d["outs"] else None})
        self.devices = out


class _IntifaceError(Exception):
    """Intiface answered, but refused us (e.g. another app is connected to it)"""


class _Ble:
    """Heart rate straight from a Bluetooth LE watch or chest strap (standard Heart Rate service), no account needed.
    Runs its own asyncio loop and reconnects by itself when the device drops out or stops sending."""

    def __init__(self, on_bpm, on_state):
        self._on_bpm, self._on_state = on_bpm, on_state
        self.scanning = False
        self._found = {}           # address -> {"addr", "name", "rssi", "at"}
        self._addr, self._task, self._last = None, None, 0.0
        self.loop = asyncio.new_event_loop()
        threading.Thread(target=self.loop.run_forever, name="ble", daemon=True).start()

    def list(self):
        now = time.monotonic()
        return sorted(({k: v for k, v in d.items() if k != "at"} for d in self._found.values() if now - d["at"] < 60),
                      key=lambda d: -d["rssi"])

    def scan(self, seconds=8):
        if not self.scanning:
            self.scanning = True
            asyncio.run_coroutine_threadsafe(self._scan(seconds), self.loop)

    async def _scan(self, seconds):
        from winrt.windows.devices.bluetooth.advertisement import BluetoothLEAdvertisementWatcher, BluetoothLEScanningMode

        def seen(_, a):
            try:
                key = f"{a.bluetooth_address:012X}"
                name = a.advertisement.local_name or ""
                old = self._found.get(key)
                if old or HR_SERVICE in list(a.advertisement.service_uuids):  # The name often comes in a later packet
                    self._found[key] = {"addr": key, "name": name or (old or {}).get("name", ""),
                                        "rssi": a.raw_signal_strength_in_dbm, "at": time.monotonic()}
            except Exception as e:  # A bad packet must not stop the scan
                log.debug("ble advert: %s", e)
        try:
            w = BluetoothLEAdvertisementWatcher()
            w.scanning_mode = BluetoothLEScanningMode.ACTIVE
            w.add_received(seen)
            w.start()
            await asyncio.sleep(seconds)
            w.stop()
        except Exception as e:  # No Bluetooth adapter / Bluetooth turned off
            log.warning("ble scan failed: %s", e)
        finally:
            self.scanning = False

    def use(self, addr):
        """Connect to this device (int address) and keep the connection; None = disconnect. True if it changed"""
        if addr == self._addr:
            return False
        self._addr = addr
        self.loop.call_soon_threadsafe(self._restart, addr)
        return True

    def _restart(self, addr):
        if self._task:
            self._task.cancel()
        self._task = self.loop.create_task(self._keep(addr)) if addr is not None else None

    async def _keep(self, addr):
        from winrt.windows.devices.bluetooth import BluetoothLEDevice
        from winrt.windows.devices.bluetooth.genericattributeprofile import GattClientCharacteristicConfigurationDescriptorValue as Cccd
        delay, first = 3, True
        while True:
            dev = ch = token = None
            self._on_state("connecting" if first else "searching")
            first = False
            try:
                dev = await BluetoothLEDevice.from_bluetooth_address_async(addr)
                if not dev:
                    raise OSError("device not found")
                services = []
                for _ in range(3):  # Windows often reports "unreachable" on the first try
                    services = (await dev.get_gatt_services_for_uuid_async(HR_SERVICE)).services
                    if services:
                        break
                    await asyncio.sleep(2)
                if not services:
                    raise OSError("heart rate service unreachable")
                chars = (await services[0].get_characteristics_for_uuid_async(HR_MEASUREMENT)).characteristics
                if not chars:
                    raise OSError("no heart rate measurement")
                ch = chars[0]
                token = ch.add_value_changed(self._value)
                if await ch.write_client_characteristic_configuration_descriptor_async(Cccd.NOTIFY) != 0:
                    raise OSError("couldn't turn on notifications")
                self._last, delay = time.monotonic(), 3
                while time.monotonic() - self._last < 20:  # Still sending? Otherwise reconnect
                    await asyncio.sleep(2)
                log.info("ble: no data for 20 s, reconnecting")
            except asyncio.CancelledError:
                raise
            except Exception as e:  # Off, out of range, broadcast mode turned off on the watch...
                log.info("ble: %s", e)
            finally:
                if ch and token is not None:
                    try:
                        ch.remove_value_changed(token)
                    except Exception:
                        pass
                if dev:
                    dev.close()
            await asyncio.sleep(delay)
            delay = min(delay * 2, 30)

    def _value(self, _, args):
        try:
            from winrt.windows.storage.streams import DataReader
            buf = args.characteristic_value
            rd = DataReader.from_buffer(buf)
            b = bytes(rd.read_byte() for _ in range(buf.length))
            bpm = int.from_bytes(b[1:3], "little") if b[0] & 1 else b[1]  # Flag bit 0 set = 16-bit value
        except Exception as e:
            log.debug("ble value: %s", e)
            return
        self._last = time.monotonic()
        self._on_bpm(bpm)


class _OAuthError(Exception):
    def __init__(self, code, desc=""):
        super().__init__(f"{code}: {desc}")
        self.code = code


def _post_form(url, fields):
    """POST a form to Pulsoid's OAuth endpoints → JSON. A 400 with an OAuth error raises _OAuthError"""
    req = urllib.request.Request(url, data=urllib.parse.urlencode(fields).encode(), method="POST",
                                 headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json",
                                          "User-Agent": "VRCNook"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read())
        except ValueError:
            body = {}
        if body.get("error"):
            raise _OAuthError(body["error"], body.get("error_description", "")) from None
        raise
