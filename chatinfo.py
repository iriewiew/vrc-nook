"""Chatbox info: a random status line, the song playing in Windows, the clock and heart rate (straight from a
Bluetooth watch/strap, or from Pulsoid), shown together in the in-game Chatbox over OSC.
Heart rate is also sent as avatar parameters."""
import asyncio
import datetime
import json
import logging
import random
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
    "icons": {"status": "", "media": "🎵", "clock": "🕒", "heart": "❤️"},   # Emoji in front of each part ("" = none)
}
ITEMS = ("status", "media", "clock", "heart")
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
        c["statusEvery"] = min(max(int(c["statusEvery"]), 5), 3600)
        c["pulsoid"] = c["pulsoid"].strip()[:200]
        if c["hrSource"] not in ("ble", "pulsoid"):
            c["hrSource"] = "ble"
        try:
            int(c["bleAddr"], 16)
        except ValueError:
            c["bleAddr"] = ""
        c["bleName"] = c["bleName"][:80]
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
                "login": self.login, "canLogin": bool(PULSOID_CLIENT_ID),
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
        return {k: f"{c['icons'][k]} {v}".strip() if c["icons"].get(k) else v for k, v in out.items() if v}

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
    return out + [k for k in ITEMS if k not in seen]


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
