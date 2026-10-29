"""SteamVR overlays: short notices that float in front of you, and a round VRC Nook button on your wrist. Poke the button
with the other controller and it opens into a ring of buttons; those open a panel above it (the keyboard, friends online,
notifications, the room, the Chatbox, the info panel) that you poke the same way.
The page draws the pictures (it lays out Thai and colour emoji properly, which Pillow can't) and hands them over as PNG;
this places, fades and shows them, and tells the page where the other controller's tip touches them (vrPoke). It runs
inside the SteamVR reader's thread (chatinfo._Vr), so the app keeps one SteamVR connection, and like that reader it never
starts SteamVR itself."""
import base64
import ctypes
import io
import logging
import math
import queue
import threading
import time
from collections import deque

log = logging.getLogger("vrcnook")


class VrOverlay:
    TOAST_SECS, FADE = 4.5, 0.25    # How long a notice stays, and its fade in / out
    TICK_EVERY = 2.0                # How often the page is asked to redraw the wrist (clock, lists)
    TOAST_POS = (0.0, -0.12, -0.9)  # In front of the eyes, a little below (metres, head space)
    TOAST_WIDTH = 0.42
    TIP = (0.0, -0.015, -0.055)     # The poking point on the other controller: its tip (controller space, metres)
    TOUCH, RELEASE, NEAR = 0.012, 0.03, 0.08  # Tip distance from a surface: pressed / let go / close enough to show the dot
    EDGE = 0.012                    # A poke this far outside an overlay's edge still counts (small round buttons)
    GAP = 0.012                     # Between the button ring and the panel above it
    CURSOR = 0.014                  # Width of the dot on the tip
    MOVE_PX = 4                     # A press that moves this many pixels is passed on (dragging a list)

    def __init__(self, js):
        self._js = js
        self._calls = queue.Queue()     # Calls to the page, made by their own thread: the page answers slowly (it draws),
        threading.Thread(target=self._caller, daemon=True, name="vr-page").start()  # and SteamVR's thread mustn't wait
        self.wanted = False
        self.cfg = {"wrist": True, "hand": "left", "dist": 20, "x": 0, "y": 0, "palm": False, "gaze": True, "input": "both"}  # input: poke / laser / both
        self.panel_info = lambda: {}   # Extra things for the info panel (chatbox text, devices), set by chatinfo
        self.error = ""
        self._lock = threading.Lock()
        self._toasts = deque(maxlen=6)  # Pictures waiting to be shown: (RGBA bytes, width, height)
        self._new = {}                  # "wrist" / "panel" -> a new picture (bytes, w, h, metres wide), or None: hide the panel
        self._h = {}                    # "toast" / "wrist" / "panel" / "cursor" -> overlay handle
        self._size = {}                 # "wrist" / "panel" on show -> (metres wide, metres high, pixels wide, pixels high)
        self._toast_at = None           # When the notice on screen appeared
        self._asked = 0.0
        self._key = None                # What the wrist overlays are placed for
        self._places = {}               # "wrist" / "panel" -> (rotation, position) in the wrist controller's space
        self._alpha = 0.0
        self._last = None               # Where the tip was last tick: (overlay, x, y, z) in metres on that overlay
        self._press = None              # (overlay, x px, y px) while the tip is pressing
        self._laser_at = None           # (overlay, x px, y px) while SteamVR's laser is pressing (the trigger is held)
        self._interactive = None        # Whether SteamVR's laser can point at the wrist overlays now
        self._aim_until = 0.0           # ...which lasts until then (time.monotonic) after the other controller last aimed at them
        self._cursor = None             # The dot's picture on show: "near" / "press"
        self._gpu = None                # _Gpu once made (False: not available, pictures go through setOverlayRaw)
        self._shown = {}                # Overlay handle -> the picture's bytes it shows now (to skip uploading the same one)

    def js(self, fn, data):
        self._calls.put((fn, data))

    def _caller(self):
        while True:
            fn, data = self._calls.get()
            if fn == "vrWristTick" and any(c[0] == "vrWristTick" for c in list(self._calls.queue)):
                continue  # A newer one is waiting
            self._js(fn, data)

    # ---------- From the page ----------
    def push(self, kind, png_b64, width=0.0):
        """A picture the page drew: "toast" (queued), "wrist" or "panel" (width in metres; an empty panel hides it)"""
        if kind == "panel" and not png_b64:
            with self._lock:
                self._new["panel"] = None
            return
        from PIL import Image
        img = Image.open(io.BytesIO(base64.b64decode(png_b64.split(",")[-1]))).convert("RGBA")
        pic = (img.tobytes(), img.width, img.height)
        with self._lock:
            if kind == "toast":
                self._toasts.append(pic)
            elif kind in ("wrist", "panel") and 0.01 <= width <= 1.0:
                self._new[kind] = (*pic, float(width))

    # ---------- From the SteamVR thread ----------
    def tick(self, openvr, system):
        try:
            ov = openvr.VROverlay()
            if self._gpu is None:
                try:
                    self._gpu = _Gpu(system.getDXGIOutputInfo())
                except Exception as e:
                    log.info("vr overlay: no D3D11 (%r), using setOverlayRaw", e)
                    self._gpu = False
            if not self._h:
                self._create(openvr, ov)
            self._tick_toast(openvr, ov)
            self._tick_wrist(openvr, ov, system)
            self.error = ""
        except Exception as e:  # Keep the reader running; say what went wrong once
            if str(e) != self.error:
                log.info("vr overlay: %r", e)
            self.error = str(e) or type(e).__name__

    def close(self, openvr):
        """Remove the overlays (overlay switched off). SteamVR removes them by itself when it closes"""
        if self._h:
            try:
                ov = openvr.VROverlay()
                for h in self._h.values():
                    ov.destroyOverlay(h)
            except Exception:
                pass
        self.forget()
        if self._gpu:
            self._gpu.close()
            self._gpu = None

    def forget(self):
        """SteamVR went away — its overlays went with it"""
        self._h, self._toast_at = {}, None
        self._hidden()
        self._drop_pictures()

    def _hidden(self):
        """The wrist overlays are off screen: shown again (and placed again) when the page's next pictures come"""
        self._size, self._key, self._places, self._alpha = {}, None, {}, 0.0
        self._asked = 0.0  # Ask the page for its pictures straight away
        self._last = self._press = self._cursor = self._laser_at = self._interactive = None

    def _upload(self, openvr, ov, h, pic):
        """Show a picture on an overlay. Through a D3D11 texture when there is one: setOverlayRaw drops the old picture
        before the new one is ready, so an overlay updated with it blinks every time it changes"""
        data, w, ht = pic
        if self._shown.get(h) == data:
            return
        if self._gpu:
            try:
                tex = self._gpu.put(h, data, w, ht)
                ov.setOverlayTexture(h, openvr.Texture_t(tex, openvr.TextureType_DirectX, openvr.ColorSpace_Auto))
                self._gpu.flush()  # SteamVR copies the texture on our device: make that copy happen now, not at the next upload
                self._shown[h] = data
                return
            except Exception as e:
                log.info("vr overlay: texture failed (%r), using setOverlayRaw", e)
                self._gpu.close()
                self._gpu = False
        ov.setOverlayRaw(h, (ctypes.c_char * len(data)).from_buffer_copy(data), w, ht, 4)
        self._shown[h] = data

    def _drop_pictures(self):
        for h in list(self._shown):
            self._shown.pop(h, None)
            if self._gpu:
                self._gpu.drop(h)

    def _create(self, openvr, ov):
        for name in ("toast", "wrist", "panel", "cursor"):
            key = "vrcnook." + name
            try:
                h = ov.createOverlay(key, "VRC Nook " + name)
            except Exception:  # Left over from an earlier run in this SteamVR session
                h = ov.findOverlay(key)
            self._h[name] = h
            ov.hideOverlay(h)
        ov.setOverlayWidthInMeters(self._h["toast"], self.TOAST_WIDTH)
        ov.setOverlayTransformTrackedDeviceRelative(self._h["toast"], openvr.k_unTrackedDeviceIndex_Hmd, _matrix(openvr, _rot(0, 0), self.TOAST_POS))
        ov.setOverlaySortOrder(self._h["toast"], 10)
        ov.setOverlayWidthInMeters(self._h["cursor"], self.CURSOR)
        ov.setOverlaySortOrder(self._h["cursor"], 20)

    def _tick_toast(self, openvr, ov):
        h, now = self._h["toast"], time.monotonic()
        if self._toast_at is None:
            with self._lock:
                pic = self._toasts.popleft() if self._toasts else None
            if not pic:
                return
            self._upload(openvr, ov, h, pic)
            ov.setOverlayAlpha(h, 0.0)
            ov.showOverlay(h)
            self._toast_at = now
            return
        age = now - self._toast_at
        if age >= self.TOAST_SECS:
            ov.hideOverlay(h)
            self._toast_at = None
            return
        ov.setOverlayAlpha(h, max(0.0, min(1.0, age / self.FADE, (self.TOAST_SECS - age) / self.FADE)))

    def _tick_wrist(self, openvr, ov, system):
        h, c = self._h, self.cfg
        right = c["hand"] == "right"
        roles = (openvr.TrackedControllerRole_RightHand, openvr.TrackedControllerRole_LeftHand)
        dev, other = (system.getTrackedDeviceIndexForControllerRole(r) for r in (roles if right else roles[::-1]))
        if not c["wrist"] or dev == openvr.k_unTrackedDeviceIndexInvalid:
            if self._size:
                for name in ("wrist", "panel", "cursor"):
                    ov.hideOverlay(h[name])
                self._hidden()
            return
        now = time.monotonic()
        if now - self._asked >= self.TICK_EVERY:  # The page draws them; the pictures come back through push()
            self._asked = now
            self.js("vrWristTick", {**self.panel_info(), "all": "wrist" not in self._size})
        with self._lock:
            new, self._new = self._new, {}
        for name, pic in new.items():
            if pic is None:
                if name in self._size:
                    ov.hideOverlay(h[name])
                    del self._size[name]
                    self._key = None
                continue
            data, w, ht, metres = pic
            self._upload(openvr, ov, h[name], (data, w, ht))
            size = (metres, metres * ht / w, w, ht)
            if self._size.get(name) != size:
                ov.setOverlayWidthInMeters(h[name], metres)
                ov.setOverlayMouseScale(h[name], openvr.HmdVector2_t(w, ht))  # The laser's position comes in pixels
                if name not in self._size:
                    ov.setOverlayAlpha(h[name], self._alpha)
                    ov.showOverlay(h[name])
                self._size[name] = size
                self._key = None
        if "wrist" not in self._size:  # The page hasn't drawn it yet
            return
        if self._key != (dev, c["input"]):  # Laser: SteamVR's own pointer and trigger, like its pinned desktop windows
            laser = c["input"] != "poke"
            for name in ("wrist", "panel"):
                ov.setOverlayInputMethod(h[name], openvr.VROverlayInputMethod_Mouse if laser else openvr.VROverlayInputMethod_None)
                ov.setOverlayFlag(h[name], openvr.VROverlayFlags_SendVRSmoothScrollEvents, laser)
            self._key, self._interactive = (dev, c["input"]), None
        poses = (openvr.TrackedDevicePose_t * openvr.k_unMaxTrackedDeviceCount)()
        system.getDeviceToAbsoluteTrackingPose(openvr.TrackingUniverseStanding, 0, poses)
        self._place(openvr, ov, poses, dev, c)
        # With "only when called" on, fade in while you raise your arm to look at your wrist, or while its palm faces you
        showing = self._alpha > 0.5
        if not c["gaze"]:
            target = 1.0
        elif c.get("palm"):
            target = 1.0 if self._palm_up(openvr, poses, dev, right, showing) else 0.0
        else:
            target = self._looking(openvr, poses, dev, self._places["wrist"][1], showing)
        step = 0.035  # Per tick (about 90 a second): a quarter-second fade
        alpha = self._alpha + max(-step, min(step, target - self._alpha))
        if alpha != self._alpha:
            for name in self._size:
                ov.setOverlayAlpha(h[name], alpha)
            self._alpha = alpha
        # The laser only finds them while they're shown (a faded-out button mustn't catch the trigger), and only while the
        # other controller points their way: while they're interactive SteamVR keeps the controllers from the game (no walking)
        if c["input"] != "poke" and self._alpha >= 0.5 and self._aiming(openvr, poses, dev, other, self._places, self._size, now < self._aim_until):
            self._aim_until = now + 1.0  # A moment's grace, so a shaky aim or a press in progress isn't cut off
        interactive = c["input"] != "poke" and self._alpha >= 0.5 and now < self._aim_until
        if interactive != self._interactive:
            for name in ("wrist", "panel"):
                ov.setOverlayFlag(h[name], openvr.VROverlayFlags_MakeOverlaysInteractiveIfVisible, interactive)
            self._interactive = interactive
        self._laser(openvr, ov)
        none = openvr.k_unTrackedDeviceIndexInvalid
        if c["input"] != "laser":
            self._poke(openvr, ov, system, poses, dev, other)
        elif self._cursor or self._press:  # Switched to laser only: let go and hide the dot
            self._poke(openvr, ov, system, poses, dev, none)

    def _place(self, openvr, ov, poses, dev, c):
        """The button at the wrist ("dist" cm back from the controller towards the elbow, clear of its ring, moved "x" cm
        right and "y" cm up), turned to face your eyes and upright as you see it, so you don't have to twist your wrist; the
        panel just above it"""
        p, R = (c.get("x", 0) / 100, -0.01 + c.get("y", 0) / 100, c["dist"] / 100), self._places.get("wrist", (_rot(0, 0),))[0]
        hmd, ctl = poses[openvr.k_unTrackedDeviceIndex_Hmd], poses[dev]
        if hmd.bPoseIsValid and ctl.bPoseIsValid:
            C, H = ctl.mDeviceToAbsoluteTracking.m, hmd.mDeviceToAbsoluteTracking.m
            local = lambda v: [sum(C[j][i] * v[j] for j in range(3)) for i in range(3)]  # Room direction -> controller space
            n = _unit([e - p[i] for i, e in enumerate(local([H[j][3] - C[j][3] for j in range(3)]))])  # Towards the eyes
            x = _cross(local([H[j][1] for j in range(3)]), n)  # Your head's "up", so it stays upright as you see it
            if sum(v * v for v in x) > 1e-6:
                x = _unit(x)
                y = _cross(n, x)
                R = [[x[i], y[i], n[i]] for i in range(3)]
        self._places = {"wrist": (R, p)}
        if "panel" in self._size:
            up = self._size["wrist"][1] / 2 + self.GAP + self._size["panel"][1] / 2
            self._places["panel"] = (R, _add(p, _mul(R, (0.0, up, 0.005))))
        for name, (R2, p2) in self._places.items():
            ov.setOverlayTransformTrackedDeviceRelative(self._h[name], dev, _matrix(openvr, R2, p2))

    def _laser(self, openvr, ov):
        """SteamVR's laser on the button ring or the panel: pulling the trigger presses there (passed on like a poke), the
        stick scrolls"""
        ev = openvr.VREvent_t()
        for name in ("wrist", "panel"):
            while ov.pollNextOverlayEvent(self._h[name], ev)[0]:
                t, size = ev.eventType, self._size.get(name)
                if not size:
                    continue
                if t in (openvr.VREvent_ScrollSmooth, openvr.VREvent_ScrollDiscrete):
                    self.js("vrPoke", {"o": name, "t": "scroll", "d": ev.data.scroll.ydelta})
                    continue
                if t not in (openvr.VREvent_MouseMove, openvr.VREvent_MouseButtonDown, openvr.VREvent_MouseButtonUp):
                    continue
                pw, ph = size[2:]
                x = min(max(round(ev.data.mouse.x), 0), pw - 1)
                y = min(max(round(ph - ev.data.mouse.y), 0), ph - 1)  # SteamVR counts y from the bottom
                at = self._laser_at
                if t == openvr.VREvent_MouseButtonDown:
                    self._laser_at = (name, x, y)
                    self._send("down", name, x, y)
                elif t == openvr.VREvent_MouseButtonUp:
                    if at and at[0] == name:
                        self._send("up", name, x, y)
                    self._laser_at = None
                elif at and at[0] == name and (abs(x - at[1]) >= self.MOVE_PX or abs(y - at[2]) >= self.MOVE_PX):
                    self._laser_at = (name, x, y)
                    self._send("move", name, x, y)

    def _poke(self, openvr, ov, system, poses, dev, other):
        """Where the other controller's tip is on the button ring or the panel: a dot shows it when it's close, and pushing
        it through the surface presses there. Pressing, moving while pressed and letting go go to the page (vrPoke)"""
        hit, C, O = None, None, None
        if other != openvr.k_unTrackedDeviceIndexInvalid and self._alpha > 0.5 and poses[dev].bPoseIsValid and poses[other].bPoseIsValid:
            C, O = poses[dev].mDeviceToAbsoluteTracking.m, poses[other].mDeviceToAbsoluteTracking.m
            tip = [sum(O[i][j] * self.TIP[j] for j in range(3)) + O[i][3] for i in range(3)]
            q = [sum(C[j][i] * (tip[j] - C[j][3]) for j in range(3)) for i in range(3)]  # In the wrist controller's space
            for name, (R, p) in self._places.items():
                w, ht = self._size[name][:2]
                x, y, z = (sum(R[j][i] * (q[j] - p[j]) for j in range(3)) for i in range(3))
                if abs(x) <= w / 2 + self.EDGE and abs(y) <= ht / 2 + self.EDGE and -0.04 < z < self.NEAR and (not hit or abs(z) < abs(hit[3])):
                    hit = (name, x, y, z)
        last, self._last = self._last, hit
        if self._press:
            name, px, py = self._press
            if not hit or hit[0] != name or hit[3] > self.RELEASE:
                self._send("up", name, px, py)
                self._press = None
            else:
                x, y = self._px(hit)
                if abs(x - px) >= self.MOVE_PX or abs(y - py) >= self.MOVE_PX:
                    self._send("move", name, x, y)
                    self._press = (name, x, y)
        elif hit and hit[3] < self.TOUCH and last and last[0] == hit[0] and last[3] >= self.TOUCH:  # Pushed in from the front
            x, y = self._px(hit)
            self._press = (hit[0], x, y)
            self._send("down", hit[0], x, y)
            try:
                system.triggerHapticPulse(other, 0, 1500)
            except Exception:
                pass
        self._show_cursor(openvr, ov, other, hit, C, O)

    def _px(self, hit):
        name, x, y, _ = hit
        w, ht, pw, ph = self._size[name]
        return min(max(round((x / w + 0.5) * pw), 0), pw - 1), min(max(round((0.5 - y / ht) * ph), 0), ph - 1)

    def _send(self, kind, name, x, y):
        self.js("vrPoke", {"o": name, "t": kind, "x": x, "y": y})

    def _show_cursor(self, openvr, ov, other, hit, C, O):
        """The dot sits on the other controller's tip (so SteamVR moves it with the hand, smoothly), lying parallel to
        the surface it's near"""
        h = self._h["cursor"]
        if not hit:
            if self._cursor:
                ov.hideOverlay(h)
                self._cursor = None
            return
        want = "press" if self._press else "near"
        if want != self._cursor:
            self._upload(openvr, ov, h, _dot(want == "press"))
            if not self._cursor:
                ov.showOverlay(h)
            self._cursor = want
        R = self._places[hit[0]][0]
        W = [[sum(C[i][k] * R[k][j] for k in range(3)) for j in range(3)] for i in range(3)]   # The surface, in the room
        Rc = [[sum(O[k][i] * W[k][j] for k in range(3)) for j in range(3)] for i in range(3)]  # ... on the tip's controller
        ov.setOverlayTransformTrackedDeviceRelative(h, other, _matrix(openvr, Rc, self.TIP))

    @staticmethod
    def _aiming(openvr, poses, dev, other, places, sizes, already):
        """Whether the other controller points roughly at the button or the open panel, or is right by it. SteamVR's laser
        comes out of the controller's front or tilted down from it depending on the model, so both count: within 40
        degrees (55 once it's caught, so it doesn't drop out mid-press), widened by how big the overlay looks from there"""
        if other == openvr.k_unTrackedDeviceIndexInvalid:
            return False
        ctl, o = poses[dev], poses[other]
        if not (ctl.bPoseIsValid and o.bPoseIsValid):
            return False
        C, O = ctl.mDeviceToAbsoluteTracking.m, o.mDeviceToAbsoluteTracking.m
        k = math.sqrt(0.5)  # 45 degrees down
        aims = [[-O[i][2] for i in range(3)], [-(O[i][2] + O[i][1]) * k for i in range(3)]]  # A controller points along its -z
        cone = math.radians(55 if already else 40)
        for name, (_, p) in places.items():
            if name not in sizes:
                continue
            v = [sum(C[i][j] * p[j] for j in range(3)) + C[i][3] - O[i][3] for i in range(3)]
            dist = math.sqrt(sum(x * x for x in v))
            if dist < 0.3:  # Close enough to poke it
                return True
            if dist > 2.0:
                continue
            reach = min(cone + math.atan2(max(sizes[name][:2]) / 2, dist), math.radians(85))
            if any(sum(a[i] * v[i] for i in range(3)) / dist > math.cos(reach) for a in aims):
                return True
        return False

    @staticmethod
    def _palm_up(openvr, poses, dev, right, showing):
        """Whether the palm of the hand holding the wrist controller faces your eyes. The palm is the controller's +x side
        for the left hand and -x for the right; a little more turn is needed to let go than to catch it"""
        hmd, ctl = poses[openvr.k_unTrackedDeviceIndex_Hmd], poses[dev]
        if not (hmd.bPoseIsValid and ctl.bPoseIsValid):
            return False
        C, H = ctl.mDeviceToAbsoluteTracking.m, hmd.mDeviceToAbsoluteTracking.m
        side = -1.0 if right else 1.0
        to_eyes = _unit([H[i][3] - C[i][3] for i in range(3)])
        facing = sum(side * C[i][0] * to_eyes[i] for i in range(3))
        return facing > (0.35 if showing else 0.65)

    @staticmethod
    def _looking(openvr, poses, dev, p, showing):
        """1 when you look towards your wrist and it's close, 0 otherwise. Once shown it takes a little more to hide it
        again, so a glance right at the edge doesn't make it flash on and off"""
        hmd, ctl = poses[openvr.k_unTrackedDeviceIndex_Hmd], poses[dev]
        if not (hmd.bPoseIsValid and ctl.bPoseIsValid):
            return 0.0
        C, H = ctl.mDeviceToAbsoluteTracking.m, hmd.mDeviceToAbsoluteTracking.m
        v = [sum(C[i][j] * p[j] for j in range(3)) + C[i][3] - H[i][3] for i in range(3)]  # Eyes -> button
        dist = math.sqrt(sum(x * x for x in v)) or 1.0
        ahead = -sum(H[i][2] * v[i] for i in range(3)) / dist  # 1 = straight ahead of you
        if showing:
            return 1.0 if ahead > 0.8 and dist < 0.9 else 0.0
        return 1.0 if ahead > 0.9 and dist < 0.75 else 0.0


_DOTS = {}


def _dot(pressed):
    """The tip's dot: a white ring, filled blue while pressing"""
    if pressed not in _DOTS:
        from PIL import Image, ImageDraw
        img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.ellipse((4, 4, 59, 59), fill=(10, 132, 255, 255) if pressed else (255, 255, 255, 70), outline=(255, 255, 255, 255), width=6)
        _DOTS[pressed] = (img.tobytes(), 64, 64)
    return _DOTS[pressed]


def _mul(R, v):
    return tuple(sum(R[i][j] * v[j] for j in range(3)) for i in range(3))


def _add(a, b):
    return tuple(a[i] + b[i] for i in range(3))


def _cross(a, b):
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]


def _unit(v):
    n = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / n for x in v]


class _Guid(ctypes.Structure):
    _fields_ = [("a", ctypes.c_uint32), ("b", ctypes.c_uint16), ("c", ctypes.c_uint16), ("d", ctypes.c_ubyte * 8)]


class _TexDesc(ctypes.Structure):  # D3D11_TEXTURE2D_DESC
    _fields_ = [(n, ctypes.c_uint) for n in ("Width", "Height", "MipLevels", "ArraySize", "Format", "SampleCount",
                                              "SampleQuality", "Usage", "BindFlags", "CPUAccessFlags", "MiscFlags")]


def _com(obj, index, restype, *args):
    """Call method number `index` of a COM object; args are (ctypes type, value) pairs"""
    vt = ctypes.cast(obj, ctypes.POINTER(ctypes.POINTER(ctypes.c_void_p))).contents
    fn = ctypes.WINFUNCTYPE(restype, ctypes.c_void_p, *[a[0] for a in args])(vt[index])
    return fn(obj, *[a[1] for a in args])


class _Gpu:
    """A D3D11 device on the headset's graphics card, with one texture per overlay for SteamVR to show (setOverlayTexture)"""
    RGBA8, SHADER_RESOURCE = 28, 0x8
    IID_FACTORY1 = (0x770aae78, 0xf26f, 0x4dba, (0xa8, 0x29, 0x25, 0x3c, 0x83, 0xd1, 0xb3, 0x87))

    def __init__(self, adapter_index):
        vp, P = ctypes.c_void_p, ctypes.POINTER
        adapter = vp()
        if adapter_index >= 0:  # The card the headset is on (a laptop may have two)
            dxgi = ctypes.WinDLL("dxgi")
            dxgi.CreateDXGIFactory1.argtypes, dxgi.CreateDXGIFactory1.restype = [P(_Guid), P(vp)], ctypes.c_long
            g, factory = self.IID_FACTORY1, vp()
            if dxgi.CreateDXGIFactory1(ctypes.byref(_Guid(g[0], g[1], g[2], (ctypes.c_ubyte * 8)(*g[3]))), ctypes.byref(factory)) >= 0:
                if _com(factory, 7, ctypes.c_long, (ctypes.c_uint, adapter_index), (P(vp), ctypes.byref(adapter))) < 0:  # EnumAdapters
                    adapter = vp()
                _com(factory, 2, ctypes.c_ulong)
        d3d = ctypes.WinDLL("d3d11")
        d3d.D3D11CreateDevice.argtypes = [vp, ctypes.c_int, vp, ctypes.c_uint, vp, ctypes.c_uint, ctypes.c_uint, P(vp), P(ctypes.c_int), P(vp)]
        d3d.D3D11CreateDevice.restype = ctypes.c_long
        self.dev, self.ctx = vp(), vp()
        hr = d3d.D3D11CreateDevice(adapter, 0 if adapter else 1, None, 0, None, 0, 7, ctypes.byref(self.dev), None, ctypes.byref(self.ctx))
        if adapter:
            _com(adapter, 2, ctypes.c_ulong)
        if hr < 0:
            raise OSError(f"D3D11CreateDevice 0x{hr & 0xffffffff:08x}")
        self.tex = {}  # Overlay handle -> (texture, width, height)

    def put(self, h, data, w, ht):
        """Copy the picture into the overlay's texture (made, or remade at a new size, as needed); returns the texture"""
        tex = self.tex.get(h)
        if not tex or tex[1:] != (w, ht):
            self.drop(h)
            desc, t = _TexDesc(w, ht, 1, 1, self.RGBA8, 1, 0, 0, self.SHADER_RESOURCE, 0, 0), ctypes.c_void_p()
            hr = _com(self.dev, 5, ctypes.c_long, (ctypes.POINTER(_TexDesc), ctypes.byref(desc)), (ctypes.c_void_p, None),
                      (ctypes.POINTER(ctypes.c_void_p), ctypes.byref(t)))  # CreateTexture2D
            if hr < 0:
                raise OSError(f"CreateTexture2D 0x{hr & 0xffffffff:08x}")
            tex = self.tex[h] = (t, w, ht)
        buf = ctypes.create_string_buffer(data, len(data))
        _com(self.ctx, 48, None, (ctypes.c_void_p, tex[0]), (ctypes.c_uint, 0), (ctypes.c_void_p, None),
             (ctypes.c_void_p, ctypes.cast(buf, ctypes.c_void_p)), (ctypes.c_uint, w * 4), (ctypes.c_uint, 0))  # UpdateSubresource
        self.flush()
        return tex[0].value

    def flush(self):
        _com(self.ctx, 111, None)  # ID3D11DeviceContext::Flush

    def drop(self, h):
        tex = self.tex.pop(h, None)
        if tex:
            _com(tex[0], 2, ctypes.c_ulong)

    def close(self):
        for h in list(self.tex):
            self.drop(h)
        for o in (self.ctx, self.dev):
            if o:
                _com(o, 2, ctypes.c_ulong)
        self.ctx = self.dev = None


def _rot(tilt, roll):
    """Rotation: roll around the panel's own facing axis first, then tilt around X (degrees)"""
    a, b = math.radians(tilt), math.radians(roll)
    rx = ((1, 0, 0), (0, math.cos(a), -math.sin(a)), (0, math.sin(a), math.cos(a)))
    rz = ((math.cos(b), -math.sin(b), 0), (math.sin(b), math.cos(b), 0), (0, 0, 1))
    return [[sum(rx[i][k] * rz[k][j] for k in range(3)) for j in range(3)] for i in range(3)]


def _matrix(openvr, r, pos):
    m = openvr.HmdMatrix34_t()
    for i in range(3):
        for j in range(3):
            m.m[i][j] = r[i][j]
        m.m[i][3] = pos[i]
    return m
