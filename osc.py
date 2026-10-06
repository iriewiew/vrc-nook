"""Send text to the in-game Chatbox over OSC (UDP 127.0.0.1:9000) — OSC must be enabled in game (Action Menu → Options → OSC → Enabled)"""
import socket
import struct

HOST, PORT = "127.0.0.1", 9000
MAX_CHARS = 144   # VRChat truncates anything longer
MAX_LINES = 9

_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)


def _pad(b: bytes) -> bytes:
    return b + b"\0" * (4 - len(b) % 4)  # OSC strings must end with \0 and be padded to a multiple of 4


def message(address, *args) -> bytes:
    tags, data = ",", b""
    for a in args:
        if a is True or a is False:
            tags += "T" if a else "F"
        elif isinstance(a, int):
            tags += "i"
            data += struct.pack(">i", a)
        elif isinstance(a, float):
            tags += "f"
            data += struct.pack(">f", a)
        else:
            tags += "s"
            data += _pad(str(a).encode("utf-8"))
    return _pad(address.encode()) + _pad(tags.encode()) + data


def clean(text: str) -> str:
    lines = str(text).replace("\r", "").split("\n")[:MAX_LINES]
    return "\n".join(lines).strip()[:MAX_CHARS]


def chatbox(text: str, sound=True):
    """Show the text immediately (without opening the in-game keyboard); sound = play the in-game notification sound"""
    _sock.sendto(message("/chatbox/input", clean(text), True, bool(sound)), (HOST, PORT))


def typing(on: bool):
    _sock.sendto(message("/chatbox/typing", bool(on)), (HOST, PORT))
