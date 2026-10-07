"""System tray icon, Windows notifications and start with Windows"""
import logging
import math
import sys
import threading
import winreg
from pathlib import Path

import pystray
from PIL import Image, ImageDraw

log = logging.getLogger("vrclog")
RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
APP_NAME = "VRC Nook"  # Autostart value name (shown in Task Manager → Startup apps)
OLD_NAMES = ("VRChatLogViewer",)  # Pre-rename entries — still detected, removed on the next toggle


def make_icon(size=64):
    """App icon: rounded square with a blue→purple gradient + an archway with a moon (a cozy "Nook", matches LOGO_SVG in the UI)"""
    s = 512  # Draw large then downscale for smooth edges
    grad = Image.new("RGBA", (s, s))
    a, b = (10, 132, 255), (191, 90, 242)
    px = grad.load()
    for y in range(s):
        for x in range(s):
            t = (x + y) / (2 * s - 2)
            px[x, y] = tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3)) + (255,)
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle((8, 8, s - 9, s - 9), radius=s * 0.23, fill=255)
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    img.paste(grad, mask=mask)
    d = ImageDraw.Draw(img)
    u = s / 24  # Same coordinates as LOGO_SVG's 24x24 viewBox, scaled in to leave a margin
    k, o = 0.62, s * 0.19
    p = lambda v: o + v * u * k
    w = 2.6 * u * k / 2

    def stroke(pts):  # Draw strokes as closely spaced circles to get round caps like stroke-linecap="round"
        for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
            n = max(2, int(math.hypot(x2 - x1, y2 - y1) * 8))
            for i in range(n + 1):
                x, y = x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n
                d.ellipse((p(x) - w, p(y) - w, p(x) + w, p(y) + w), fill="white")

    arch = [(12 - 7 * math.cos(math.pi * i / 40), 11 - 7 * math.sin(math.pi * i / 40)) for i in range(41)]
    stroke([(5, 20.5)] + arch + [(19, 20.5)])
    stroke([(3, 20.5), (21, 20.5)])
    moon = Image.new("L", (s, s), 0)  # Crescent moon = a circle minus a circle offset to the top right
    md = ImageDraw.Draw(moon)
    circ = lambda cx, cy, r, f: md.ellipse((p(cx - r), p(cy - r), p(cx + r), p(cy + r)), fill=f)
    circ(12, 14, 3.2, 255)
    circ(13.7, 12.6, 2.7, 0)
    img.paste((255, 255, 255, 255), mask=moon)
    return img.resize((size, size), Image.LANCZOS)


class Tray:
    def __init__(self, on_show, on_quit, labels=("Open", "Quit")):
        menu = pystray.Menu(pystray.MenuItem(labels[0], lambda icon, item: on_show(), default=True),
                            pystray.MenuItem(labels[1], lambda icon, item: on_quit()))
        self.icon = pystray.Icon("VRC Nook", make_icon(), "VRC Nook", menu)
        threading.Thread(target=self.icon.run, daemon=True).start()

    def notify(self, title, message):
        try:
            self.icon.notify(str(message)[:250], str(title)[:60])
        except Exception as e:  # Notification failures are fine to ignore
            log.warning("notify failed: %s", e)

    def stop(self):
        try:
            self.icon.stop()
        except Exception:
            pass


def _command():
    """Command Windows uses to start the app at sign-in (starts hidden in the tray)"""
    if getattr(sys, "frozen", False):
        return f'"{sys.executable}" --tray'
    pyw = Path(sys.executable).with_name("pythonw.exe")
    return f'"{pyw if pyw.exists() else sys.executable}" "{Path(sys.argv[0]).resolve()}" --tray'


def autostart_get():
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY) as k:
            for name in (APP_NAME, *OLD_NAMES):
                try:
                    winreg.QueryValueEx(k, name)
                    return True
                except OSError:
                    pass
    except OSError:
        pass
    return False


def autostart_set(on):
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY, 0, winreg.KEY_SET_VALUE) as k:
        for name in (OLD_NAMES if on else (APP_NAME, *OLD_NAMES)):
            try:
                winreg.DeleteValue(k, name)
            except FileNotFoundError:
                pass
        if on:
            winreg.SetValueEx(k, APP_NAME, 0, winreg.REG_SZ, _command())
    return autostart_get()


def autostart_migrate():
    """Rename a pre-rename autostart entry to APP_NAME (pointing at this exe) once"""
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY) as k:
            if not any(_has(k, n) for n in OLD_NAMES):
                return
        autostart_set(True)
    except OSError as e:
        log.warning("autostart migrate failed: %s", e)


def _has(k, name):
    try:
        winreg.QueryValueEx(k, name)
        return True
    except OSError:
        return False
