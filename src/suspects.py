"""Spotting the ripper / cheat-ad bot accounts that join public instances

Two levels:
  confirmed: the bio or status advertises a cheat / avatar-ripping service (hexed.cc, oversee.lol, "Avatar Bot … downloads")
  suspected: a Visitor whose name has the bots' made-up shape ("Kyvo5rexth", "D3raxolorirsh", "victor.kaya69032")
Display names end with " " + the last 4 characters of the user ID when VRChat adds that itself (a name shared by many people),
and VRChat shows "." in names as "․" (U+2024): neither says anything about the person, so both are ignored.
Checked against ~29,000 users seen by VRC Nook: the bio rule matched only bots; the name rule needs the Visitor rank,
because normal people use names like "Lilith4u" too."""
import re

SPAM = re.compile(r"hexed|oversee\s*(?:[.․]|[(（\[]\s*dot\s*[)）\]])|avatar\s*bot\b.*\d[\d,]*\s*downloads", re.I | re.S)
NAME = re.compile(r"^[A-Z][a-z]*\d{1,3}[a-z]{2,}$|^[A-Z][a-z]{1,}\d{1,3}[a-z]$|^[a-z]+[.․][a-z]+\d{5}$")
SUFFIX = re.compile(r" [0-9a-f]{4}$")
# Made-up word with the digits at the end ("Kaxezenlieth5", "Vamirrylvexx525"): people use names like that too ("Alvinchong11"),
# so it counts only for a Visitor whose name also has the " xxxx" VRChat adds — every bot seen so far has it, those people don't
NAME_END = re.compile(r"^[A-Z][a-z]{6,}\d{1,3}$")


def base_name(name, uid):
    """The name without the " xxxx" VRChat adds from the user ID"""
    name = name or ""
    return SUFFIX.sub("", name) if uid and name[-4:] == uid[-4:] else name


def check(uid, info=None, name=None):
    """{"level", "why"} when this user looks like a bot, else None. info = the cached profile (may be missing)"""
    info = info or {}
    name = info.get("displayName") or name or ""
    text = " ".join([info.get("bio") or "", info.get("statusDescription") or "", " ".join(info.get("bioLinks") or [])])
    if SPAM.search(text):
        return {"level": "confirmed", "why": "ad"}
    tags = info.get("trustTags")
    base = base_name(name, uid)
    if tags == [] and base != name and NAME_END.match(base):
        return {"level": "suspected", "why": "name"}
    if NAME.match(base):
        if tags == []:
            return {"level": "suspected", "why": "name"}
        if tags is None:  # Profile not loaded yet: the name alone is only a hint
            return {"level": "suspected", "why": "nameOnly"}
    return None
