"""Windows virtual keyboard — sends key presses to the active program (SendInput) and reads/writes the clipboard

The floating keyboard window is WS_EX_NOACTIVATE: clicking it doesn't steal focus, so text goes to the original program.
As a safeguard it remembers the last window that isn't ours; if focus lands on the keyboard it switches back before sending.
"""
import ctypes
import os
import threading
import time
from ctypes import wintypes

user32 = ctypes.WinDLL("user32", use_last_error=True)
kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

INPUT_KEYBOARD = 1
KEYEVENTF_KEYUP = 0x0002
KEYEVENTF_UNICODE = 0x0004
GWL_EXSTYLE = -20
WS_EX_NOACTIVATE = 0x08000000
WS_EX_TOPMOST = 0x00000008
WS_EX_APPWINDOW = 0x00040000
WS_EX_TOOLWINDOW = 0x00000080
CF_UNICODETEXT = 13
GMEM_MOVEABLE = 0x0002

VK = {"bs": 0x08, "tab": 0x09, "enter": 0x0D, "shift": 0x10, "ctrl": 0x11, "alt": 0x12, "esc": 0x1B, "space": 0x20, "win": 0x5B,
      "left": 0x25, "up": 0x26, "right": 0x27, "down": 0x28, "del": 0x2E, "a": 0x41, "c": 0x43, "v": 0x56, "x": 0x58, "z": 0x5A}
COMBOS = {"copy": ("ctrl", "c"), "paste": ("ctrl", "v"), "cut": ("ctrl", "x"), "all": ("ctrl", "a"), "undo": ("ctrl", "z"),
          "newline": ("shift", "enter"), "taskview": ("win", "tab")}


class KEYBDINPUT(ctypes.Structure):
    _fields_ = [("wVk", wintypes.WORD), ("wScan", wintypes.WORD), ("dwFlags", wintypes.DWORD),
                ("time", wintypes.DWORD), ("dwExtraInfo", ctypes.c_size_t)]


class _MOUSEINPUT(ctypes.Structure):  # Included so the union has its real size
    _fields_ = [("dx", wintypes.LONG), ("dy", wintypes.LONG), ("mouseData", wintypes.DWORD),
                ("dwFlags", wintypes.DWORD), ("time", wintypes.DWORD), ("dwExtraInfo", ctypes.c_size_t)]


class _U(ctypes.Union):
    _fields_ = [("ki", KEYBDINPUT), ("mi", _MOUSEINPUT)]


class INPUT(ctypes.Structure):
    _fields_ = [("type", wintypes.DWORD), ("u", _U)]


user32.SendInput.argtypes = (wintypes.UINT, ctypes.POINTER(INPUT), ctypes.c_int)
user32.GetForegroundWindow.restype = wintypes.HWND
user32.GetWindowLongPtrW.restype = ctypes.c_ssize_t
user32.GetWindowLongPtrW.argtypes = (wintypes.HWND, ctypes.c_int)
user32.SetWindowLongPtrW.restype = ctypes.c_ssize_t
user32.SetWindowLongPtrW.argtypes = (wintypes.HWND, ctypes.c_int, ctypes.c_ssize_t)
user32.GetWindowThreadProcessId.argtypes = (wintypes.HWND, ctypes.POINTER(wintypes.DWORD))
user32.GetClipboardData.restype = wintypes.HANDLE
user32.SetClipboardData.argtypes = (wintypes.UINT, wintypes.HANDLE)
user32.SetClipboardData.restype = wintypes.HANDLE
kernel32.GlobalLock.restype = ctypes.c_void_p
kernel32.GlobalLock.argtypes = (wintypes.HGLOBAL,)
kernel32.GlobalUnlock.argtypes = (wintypes.HGLOBAL,)
kernel32.GlobalAlloc.restype = wintypes.HGLOBAL
kernel32.GlobalAlloc.argtypes = (wintypes.UINT, ctypes.c_size_t)


def _send(events):
    arr = (INPUT * len(events))(*events)
    user32.SendInput(len(events), arr, ctypes.sizeof(INPUT))


def _key(vk=0, scan=0, flags=0):
    return INPUT(type=INPUT_KEYBOARD, u=_U(ki=KEYBDINPUT(wVk=vk, wScan=scan, dwFlags=flags)))


# ---------- Track the target program ----------
_own_pid = os.getpid()
_target = None


def _pid(hwnd):
    pid = wintypes.DWORD()
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    return pid.value


def _watch():
    global _target
    while True:
        h = user32.GetForegroundWindow()
        if h and _pid(h) != _own_pid:
            _target = h
        time.sleep(0.15)


threading.Thread(target=_watch, daemon=True).start()


def _ensure_target(own_hwnd):
    """If focus landed on the keyboard window, switch back to the original program before sending keys"""
    fg = user32.GetForegroundWindow()
    if fg and fg == own_hwnd and _target:
        user32.SetForegroundWindow(_target)
        time.sleep(0.03)


# ---------- Send keys ----------
def type_text(text, own_hwnd=None):
    _ensure_target(own_hwnd)
    ev, raw = [], text.replace("\r", "").encode("utf-16-le")
    for unit in (int.from_bytes(raw[i:i + 2], "little") for i in range(0, len(raw), 2)):  # emoji = 2 units, each can be sent separately
        if unit == 0x0A:  # New line = Enter
            ev += [_key(VK["enter"]), _key(VK["enter"], flags=KEYEVENTF_KEYUP)]
        else:
            ev += [_key(scan=unit, flags=KEYEVENTF_UNICODE), _key(scan=unit, flags=KEYEVENTF_UNICODE | KEYEVENTF_KEYUP)]
    if ev:
        _send(ev)


def press(name, own_hwnd=None):
    """name = key name (VK) or shortcut (COMBOS, e.g. copy / paste)"""
    _ensure_target(own_hwnd)
    keys = [VK[k] for k in COMBOS.get(name, (name,)) if k in VK]
    if not keys:
        return
    _send([_key(k) for k in keys] + [_key(k, flags=KEYEVENTF_KEYUP) for k in reversed(keys)])


# ---------- Window that doesn't steal focus ----------
def make_noactivate(hwnd):
    ex = user32.GetWindowLongPtrW(hwnd, GWL_EXSTYLE)
    ex = (ex | WS_EX_NOACTIVATE | WS_EX_TOPMOST | WS_EX_TOOLWINDOW) & ~WS_EX_APPWINDOW
    user32.SetWindowLongPtrW(hwnd, GWL_EXSTYLE, ex)


# ---------- Clipboard ----------
def _open_clipboard():
    for _ in range(10):  # Another program may hold it open briefly
        if user32.OpenClipboard(None):
            return True
        time.sleep(0.02)
    return False


def get_clipboard():
    if not _open_clipboard():
        return ""
    try:
        h = user32.GetClipboardData(CF_UNICODETEXT)
        if not h:
            return ""
        p = kernel32.GlobalLock(h)
        try:
            return ctypes.wstring_at(p) if p else ""
        finally:
            kernel32.GlobalUnlock(h)
    finally:
        user32.CloseClipboard()


def set_clipboard(text):
    data = (text + "\0").encode("utf-16-le")
    if not _open_clipboard():
        return False
    try:
        user32.EmptyClipboard()
        h = kernel32.GlobalAlloc(GMEM_MOVEABLE, len(data))
        p = kernel32.GlobalLock(h)
        ctypes.memmove(p, data, len(data))
        kernel32.GlobalUnlock(h)
        return bool(user32.SetClipboardData(CF_UNICODETEXT, h))
    finally:
        user32.CloseClipboard()
