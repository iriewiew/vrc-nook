"""Auto-update the app from GitHub Releases (iriewiew/vrc-nook)

Security: downloads only from the built-in repo, every redirect must stay on GitHub domains,
and the file's SHA-256 must match what GitHub reports (asset digest or a .sha256 file), otherwise nothing is installed
"""
import hashlib
import json
import logging
import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

log = logging.getLogger("vrclog")
REPO = "iriewiew/vrc-nook"
ASSET = "VRCNook.exe"
API = f"https://api.github.com/repos/{REPO}/releases/latest"
HOSTS = {"api.github.com", "github.com", "objects.githubusercontent.com", "release-assets.githubusercontent.com"}
UA = "VRCNook-updater"


class _GitHubOnly(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        _check(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


_opener = urllib.request.build_opener(_GitHubOnly)


def _check(url):
    u = urllib.parse.urlsplit(url)
    if u.scheme != "https" or u.hostname not in HOSTS:
        raise ValueError(f"blocked host: {u.hostname}")


def _get(url, accept="application/vnd.github+json"):
    _check(url)
    return _opener.open(urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept}), timeout=30)


def _ver(s):
    return tuple(int(x) for x in re.findall(r"\d+", s or "")[:3])


def exe_path():
    """The running exe (None = running from .py, can't self-update)"""
    return Path(sys.executable) if getattr(sys, "frozen", False) else None


def cleanup():
    """Delete old exes left over from the previous update"""
    exe = exe_path()
    if exe:
        for p in (exe.with_name(exe.name + ".old"), exe.with_name(exe.name + ".new")):
            try:
                p.unlink(missing_ok=True)
            except OSError:
                pass  # The old one hasn't fully exited yet — delete it next time


def check(current):
    """Check the latest version → {"latest", "newer", "notes", "url", "size", "sha256", "page"}"""
    try:
        with _get(API) as r:
            rel = json.load(r)
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise
        rel = {}  # No release yet
    tag = rel.get("tag_name", "")
    assets = {a["name"]: a for a in rel.get("assets", [])}
    a = assets.get(ASSET)
    sha = ""
    if a:
        m = re.fullmatch(r"sha256:([0-9a-f]{64})", a.get("digest") or "")
        sha = m.group(1) if m else ""
        side = assets.get(ASSET + ".sha256")
        if not sha and side:
            with _get(side["browser_download_url"], "application/octet-stream") as r:
                m = re.search(r"\b[0-9a-fA-F]{64}\b", r.read(4096).decode("ascii", "ignore"))
                sha = m.group(0).lower() if m else ""
    return {"latest": tag.lstrip("v"), "newer": _ver(tag) > _ver(current), "notes": (rel.get("body") or "")[:4000],
            "url": a["browser_download_url"] if a else "", "size": a.get("size", 0) if a else 0,
            "sha256": sha, "page": rel.get("html_url", f"https://github.com/{REPO}/releases")}


def download(info, progress):
    """Download the new exe next to the current one (.new) and verify SHA-256 → return its path"""
    exe = exe_path()
    if not exe:
        raise RuntimeError("not frozen")
    if not info.get("url") or not re.fullmatch(r"[0-9a-f]{64}", info.get("sha256", "")):
        raise RuntimeError("no checksum")
    new = exe.with_name(exe.name + ".new")
    h, done, total = hashlib.sha256(), 0, info.get("size") or 0
    with _get(info["url"], "application/octet-stream") as r, open(new, "wb") as f:
        while chunk := r.read(256 * 1024):
            f.write(chunk)
            h.update(chunk)
            done += len(chunk)
            if total:
                progress(min(99, done * 100 // total))
    if h.hexdigest() != info["sha256"]:
        new.unlink(missing_ok=True)
        raise RuntimeError("checksum mismatch")
    return new


def apply(new):
    """Swap exes: running one → .old, new one → original name, then launch the new one (the caller must quit the app)"""
    exe = exe_path()
    old = exe.with_name(exe.name + ".old")
    old.unlink(missing_ok=True)
    os.replace(exe, old)  # Windows allows renaming a running exe but not overwriting it
    try:
        os.replace(new, exe)
    except OSError:
        os.replace(old, exe)
        raise
    env = {**os.environ, "PYINSTALLER_RESET_ENVIRONMENT": "1"}  # Make the new one extract its own files instead of reusing the old one's
    subprocess.Popen([str(exe)], env=env, close_fds=True,
                     creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP)
