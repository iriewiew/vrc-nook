"""Minimal VRChat API — login (with 2FA), friends, worlds, notifications, search and image cache

No password is stored: only the session cookie, encrypted with Windows DPAPI (decryptable only by this Windows account)
"""
import base64
import ctypes
import json
import logging
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import deque
from ctypes import wintypes
from http.cookies import SimpleCookie
from pathlib import Path

log = logging.getLogger("vrclog")
API = "https://api.vrchat.cloud/api/1"
USER_AGENT = "VRCNook/0.3 (personal companion app)"
INFO_TTL = 3 * 24 * 3600  # Data older than this is reloaded
CACHE_VERSION = 2  # Bump when the stored data format changes to force a reload
API_DELAY = 1.0  # Seconds between API requests — don't lower it or you'll hit the rate limit
IMG_DELAY = 0.5


# The login cookie is sent only to VRChat's API — CDN images / other sites don't need it and it must never leak
COOKIE_HOSTS = {"api.vrchat.cloud"}


class _SafeRedirect(urllib.request.HTTPRedirectHandler):
    """Redirected to another host (e.g. a file on S3/CDN) = strip Cookie / Authorization before following"""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        new = super().redirect_request(req, fp, code, msg, headers, newurl)
        if new is not None and urllib.parse.urlsplit(newurl).hostname not in COOKIE_HOSTS:
            for k in ("Cookie", "Authorization"):
                new.remove_header(k)
        return new


_opener = urllib.request.build_opener(_SafeRedirect)


# ---------- Windows DPAPI ----------
class _Blob(ctypes.Structure):
    _fields_ = [("cbData", wintypes.DWORD), ("pbData", ctypes.POINTER(ctypes.c_char))]


def _dpapi(data: bytes, protect: bool) -> bytes:
    buf = ctypes.create_string_buffer(data, len(data))
    inp = _Blob(len(data), ctypes.cast(buf, ctypes.POINTER(ctypes.c_char)))
    out = _Blob()
    fn = ctypes.windll.crypt32.CryptProtectData if protect else ctypes.windll.crypt32.CryptUnprotectData
    if not fn(ctypes.byref(inp), None, None, None, None, 0, ctypes.byref(out)):
        raise OSError("DPAPI failed")
    try:
        return ctypes.string_at(out.pbData, out.cbData)
    finally:
        ctypes.windll.kernel32.LocalFree(out.pbData)


class ApiError(Exception):
    def __init__(self, status, message=""):
        super().__init__(f"{status} {message}")
        self.status = status
        self.message = message


class Client:
    def __init__(self, data_dir: Path):
        self.session_file = data_dir / "session.bin"
        self.cookies = {}
        self.user = None  # Signed-in account data
        self._load_session()

    # ---------- session ----------
    def _load_session(self):
        try:
            self.cookies = json.loads(_dpapi(self.session_file.read_bytes(), protect=False))
        except (OSError, ValueError):
            self.cookies = {}

    def _save_session(self):
        self.session_file.parent.mkdir(parents=True, exist_ok=True)
        self.session_file.write_bytes(_dpapi(json.dumps(self.cookies).encode(), protect=True))

    def _clear_session(self):
        self.cookies = {}
        self.user = None
        self.session_file.unlink(missing_ok=True)

    @property
    def logged_in(self):
        return self.user is not None

    @property
    def auth_token(self):
        return self.cookies.get("auth") if self.user else None

    # ---------- HTTP ----------
    def _request(self, method, path, body=None, headers=None, raw=False, timeout=15, data=None):
        url = path if path.startswith("http") else API + path
        h = {"User-Agent": USER_AGENT, "Accept": "application/json"}
        if self.cookies and urllib.parse.urlsplit(url).hostname in COOKIE_HOSTS:
            h["Cookie"] = "; ".join(f"{k}={v}" for k, v in self.cookies.items())
        if data is not None:  # Raw body such as multipart (Content-Type must be passed in headers)
            body = data
        elif body is not None:
            body = json.dumps(body).encode()
            h["Content-Type"] = "application/json"
        elif method in ("POST", "PUT"):
            body = b""
        h.update(headers or {})
        if urllib.parse.urlsplit(url).hostname not in COOKIE_HOSTS:
            h.pop("Authorization", None)
        req = urllib.request.Request(url, data=body, headers=h, method=method)
        try:
            with _opener.open(req, timeout=timeout) as resp:
                if urllib.parse.urlsplit(resp.geturl()).hostname in COOKIE_HOSTS:  # Accept cookies from VRChat only
                    self._take_cookies(resp.headers.get_all("Set-Cookie") or [])
                data = resp.read()
                return (data, resp.headers.get("Content-Type", "")) if raw else json.loads(data or b"{}")
        except urllib.error.HTTPError as e:
            if urllib.parse.urlsplit(e.geturl() or url).hostname in COOKIE_HOSTS:
                self._take_cookies(e.headers.get_all("Set-Cookie") or [])
            try:
                body = json.loads(e.read())
                msg = body.get("error", {}).get("message", "") if isinstance(body, dict) else str(body)
            except (ValueError, AttributeError):
                msg = ""
            raise ApiError(e.code, str(msg).strip('"')) from None
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            raise ApiError(0, str(e)) from None

    def _take_cookies(self, headers):
        changed = False
        for header in headers:
            c = SimpleCookie()
            c.load(header)
            for name in ("auth", "twoFactorAuth"):
                if name in c:
                    self.cookies[name] = c[name].value
                    changed = True
        if changed and self.cookies.get("auth"):
            self._save_session()

    # ---------- login ----------
    def resume(self):
        """Try the saved session; return True if it's still valid"""
        if not self.cookies.get("auth"):
            return False
        try:
            me = self._request("GET", "/auth/user")
        except ApiError as e:
            if e.status == 401:
                self._clear_session()
            return False
        if "requiresTwoFactorAuth" in me:
            return False
        self.user = me
        return True

    def login(self, username, password):
        """Return {"ok": True} or {"need2fa": [...]} or raise ApiError"""
        self.cookies = {}
        cred = f"{urllib.parse.quote(username, safe='')}:{urllib.parse.quote(password, safe='')}"
        me = self._request("GET", "/auth/user",
                           headers={"Authorization": "Basic " + base64.b64encode(cred.encode()).decode()})
        if "requiresTwoFactorAuth" in me:
            return {"need2fa": me["requiresTwoFactorAuth"]}
        self.user = me
        return {"ok": True}

    def verify_2fa(self, method, code):
        path = {"totp": "/auth/twofactorauth/totp/verify", "otp": "/auth/twofactorauth/otp/verify",
                "emailOtp": "/auth/twofactorauth/emailotp/verify"}[method]
        res = self._request("POST", path, body={"code": code.strip().replace(" ", "")})
        if not res.get("verified"):
            raise ApiError(400, "invalid code")
        self.user = self._request("GET", "/auth/user")
        return {"ok": True}

    def logout(self):
        try:
            self._request("PUT", "/logout")
        except ApiError:
            pass
        self._clear_session()

    # ---------- Endpoints ----------
    def get_user(self, uid):
        return self._request("GET", f"/users/{uid}")

    def _pages(self, path, limit=500, key=None):
        """Load multiple pages (n=100) until done or the limit is reached"""
        out, offset = [], 0
        sep = "&" if "?" in path else "?"
        while len(out) < limit:
            r = self._request("GET", f"{path}{sep}n=100&offset={offset}")
            page = r.get(key, []) if key else r
            out += page
            if len(page) < 100:
                break
            offset += 100
            time.sleep(API_DELAY)
        return out[:limit]

    # ---------- Images / emoji / stickers ----------
    def list_files(self, tag):
        return self._pages(f"/files?tag={urllib.parse.quote(tag)}")

    def upload_image(self, tag, png: bytes, fields=None):
        boundary = "----vrclog" + base64.urlsafe_b64encode(time.time_ns().to_bytes(8, "big")).decode().rstrip("=")
        parts = []
        for k, v in {"tag": tag, **(fields or {})}.items():
            parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="image.png"\r\n'
                     f'Content-Type: image/png\r\n\r\n'.encode() + png + b"\r\n")
        parts.append(f"--{boundary}--\r\n".encode())
        return self._request("POST", "/file/image", data=b"".join(parts), timeout=120,
                             headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})

    def delete_file(self, fid):
        return self._request("DELETE", f"/file/{fid}")

    # ---------- inventory ----------
    def inventory(self, query):
        return self._pages(f"/inventory?{query}", key="data")

    def equip(self, inv_id, slot):
        return self._request("PUT", f"/inventory/{inv_id}/equip", body={"equipSlot": slot})

    def unequip(self, slot):
        return self._request("DELETE", f"/inventory/{slot}/equip")

    # ---------- Avatars ----------
    def my_avatars(self):
        return self._pages("/avatars?user=me&releaseStatus=all&sort=updated&order=descending")

    def favorite_avatars(self):
        return self._pages("/avatars/favorites")

    def get_avatar(self, aid):
        return self._request("GET", f"/avatars/{aid}")

    def select_avatar(self, aid):
        return self._request("PUT", f"/avatars/{aid}/select")

    # ---------- Groups ----------
    def search_groups(self, q):
        return self._request("GET", "/groups?" + urllib.parse.urlencode({"query": q, "n": 40}))

    def my_groups(self):
        return self._request("GET", f"/users/{self.user['id']}/groups")

    def get_group(self, gid):
        return self._request("GET", f"/groups/{gid}")

    def join_group(self, gid):
        return self._request("POST", f"/groups/{gid}/join")

    def leave_group(self, gid):
        return self._request("POST", f"/groups/{gid}/leave")

    def get_template(self, tid):
        """Item template, e.g. a profile frame (a player's iconFrame is a template ID starting with invt_)"""
        return self._request("GET", f"/inventory/template/{tid}")

    def get_profile(self, uid):
        """Profile page data (bio, links, badges, banner, theme, VRC+) — VRChat moved these from /users to here (API v1.21)"""
        try:
            return self._request("GET", f"/profile/{uid}")
        except ApiError as e:
            if e.status in (0, 401, 429):
                raise
            return self.get_user(uid)

    def get_world(self, wid):
        return self._request("GET", f"/worlds/{wid}")

    def get_friends(self, offline):
        out, offset = [], 0
        while True:
            page = self._request("GET", f"/auth/user/friends?offline={'true' if offline else 'false'}&n=100&offset={offset}")
            out += page
            if len(page) < 100:
                return out
            offset += 100
            time.sleep(API_DELAY)

    def get_notifications(self):
        return self._request("GET", "/auth/user/notifications?n=100")

    def accept_friend(self, nid):
        return self._request("PUT", f"/auth/user/notifications/{nid}/accept")

    def hide_notification(self, nid):
        return self._request("PUT", f"/auth/user/notifications/{nid}/hide")

    def search_users(self, q):
        return self._request("GET", "/users?" + urllib.parse.urlencode({"search": q, "n": 30}))

    def search_worlds(self, q):
        return self._request("GET", "/worlds?" + urllib.parse.urlencode({"search": q, "n": 30, "sort": "relevance"}))

    def invite_self(self, location):
        return self._request("POST", f"/invite/myself/to/{urllib.parse.quote(location, safe=':~()_-.')}")

    def download_image(self, url):
        # "#full" = need the full file (e.g. animated emoji sprite sheets; shrunk frames would be too small)
        if url.endswith("#full"):
            return self._request("GET", url[:-5], raw=True, timeout=60)
        # Request a small image instead of the full file (less bandwidth, loads faster)
        m = re.search(r"/api/1/file/(file_[\w-]+)/(\d+)", url)
        if m:
            try:
                return self._request("GET", f"{API}/image/{m[1]}/{m[2]}/256", raw=True)
            except ApiError as e:
                if e.status in (0, 401, 429):
                    raise
        return self._request("GET", url, raw=True)


def pick_image(u):
    # Endpoints use different field names (the friend list uses iconUrl / currentAvatarImageUrl)
    for key in ("userIcon", "iconUrl", "profilePicOverrideThumbnail", "profilePicOverride",
                "currentAvatarThumbnailImageUrl", "currentAvatarImageUrl"):
        if u.get(key):
            return u[key]
    return ""


def banner_image(u):
    if u.get("bannerType") == "color":
        return ""
    return u.get("bannerCustomUrl") or u.get("bannerUrl") or ""


USER_FIELDS = ("displayName", "status", "statusDescription", "bio", "bioLinks", "badges", "isFriend", "last_platform",
               "pronouns", "iconFrame", "bannerType", "bannerColor", "hasVrcPlus", "languages", "trustTags", "tags",
               "themeButtonColor", "themeIconColor", "ageVerificationStatus", "date_joined")
BANNER_FIELDS = ("bannerType", "bannerColor")
FRAME_FIELDS = ("name", "itemType")


def frame_asset(kind):
    """Frame file URL from a template: 'base' = still image, 'mainAnimation' = animated WebP"""
    def pick(t):
        assets = (t.get("metadata") or {}).get("assets") or []
        return next((a.get("url", "") for a in assets if a.get("type") == kind), "")
    return pick
WORLD_FIELDS = ("name", "authorName", "authorId", "capacity", "description", "visits", "favorites",
                "releaseStatus", "occupants", "heat", "popularity")


def slim(d, fields):
    return {k: d.get(k, "") for k in fields if k in d}


class Cache:
    """Disk cache of data + images (players or worlds), pushed to the web page"""

    def __init__(self, fetcher, data_dir: Path, name, fields, image_of, fetch_info, push, raw_images=False):
        self.f = fetcher
        self.raw_images = raw_images  # True = load the full file without resizing (e.g. animated WebP)
        self.fields = fields
        self.image_of = image_of
        self.fetch_info = fetch_info  # id -> dict from the API
        self.push = push
        self.dir = data_dir / "cache"
        self.img_dir = self.dir / name
        self.img_dir.mkdir(parents=True, exist_ok=True)
        self.index_file = self.dir / f"{name}.json"
        try:
            self.index = json.loads(self.index_file.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            self.index = {}
        # Drop entries pointing to image files that no longer exist (e.g. cache from an older version that stored images elsewhere)
        for entry in self.index.values():
            if entry.get("img") and not (self.img_dir / entry["img"]).exists():
                entry.pop("img", None)
                entry.pop("mime", None)
        self.sent = set()
        self.lock = threading.Lock()
        self._dirty = False

    def _stale(self, key):
        entry = self.index.get(key, {})
        # v below CACHE_VERSION = stored before switching to /profile — must reload
        return entry.get("v", 0) < CACHE_VERSION or time.time() - entry.get("ts", 0) >= INFO_TTL

    def payload(self, key):
        entry = self.index.get(key)
        if not entry:
            return None
        p = {"id": key, **entry.get("info", {})}
        img = entry.get("img")
        if img and (self.img_dir / img).exists():
            data = (self.img_dir / img).read_bytes()
            p["img"] = f"data:{entry.get('mime', 'image/png')};base64,{base64.b64encode(data).decode()}"
        return p

    def want(self, keys, network=True, force=False):
        """Push from cache immediately if present, and queue a reload if missing/stale"""
        out = []
        for key in keys:
            if not key:
                continue
            if (force or key not in self.sent) and key in self.index:
                p = self.payload(key)
                if p:
                    out.append(p)
                    self.sent.add(key)
            if not network:
                continue
            entry = self.index.get(key, {})
            if self.fetch_info and self._stale(key):
                self.f.enqueue((self, "info", key, None))
            elif entry.get("url") and not entry.get("img"):  # Have the data but the image is missing — load only the image
                self.f.enqueue((self, "img", key, entry["url"]), front=False)
        if out:
            self.push(out)

    def ingest(self, objs, images=True):
        """Take objects already fetched from the API (e.g. the friend list) — update the data and load only changed images
        images=False: don't load images now (they load when the profile is opened)"""
        out = []
        for o in objs:
            key = o.get("id")
            if not key:
                continue
            self._update(key, o, full=False, images=images)
            p = self.payload(key)
            if p:
                out.append(p)
                self.sent.add(key)
        self.save()
        if out:
            self.push(out)

    def _update(self, key, obj, full=True, images=True):
        with self.lock:
            old = self.index.get(key, {})
            # Objects from the friend list/search results are incomplete — merge with the existing data and don't count as "fresh"
            entry = {"ts": time.time() if full else old.get("ts", 0), "v": CACHE_VERSION if full else old.get("v", 0),
                     "info": {**old.get("info", {}), **slim(obj, self.fields)}}
            url = self.image_of(obj)
            if url and url == old.get("url") and old.get("img") and (self.img_dir / old["img"]).exists():
                entry.update(url=url, img=old["img"], mime=old.get("mime"))
            elif url:
                entry["url"] = url
                if old.get("img"):  # Keep the old image to show while the new one loads
                    entry.update(img=old["img"], mime=old.get("mime"))
                if images:
                    self.f.enqueue((self, "img", key, url), front=False)
            self.index[key] = entry
            self._dirty = True

    def _fetch_info(self, key):
        obj = self.fetch_info(key)
        self._update(key, obj)
        self.save()
        self.sent.discard(key)
        self.want([key], network=False)

    def _fetch_img(self, key, url):
        if self.index.get(key, {}).get("url") != url:
            return
        if self.raw_images:
            data, mime = self.f.client._request("GET", url, raw=True, timeout=60)
        else:
            data, mime = self.f.client.download_image(url)
        name = re.sub(r"\W", "_", key) + ".img"
        (self.img_dir / name).write_bytes(data)
        with self.lock:
            self.index[key].update(img=name, mime=(mime or "image/png").split(";")[0])
            self._dirty = True
        self.save()
        self.sent.discard(key)
        self.want([key], network=False)

    def save(self):
        with self.lock:
            if not self._dirty:
                return
            tmp = self.index_file.with_suffix(".tmp")
            tmp.write_text(json.dumps(self.index, ensure_ascii=False), encoding="utf-8")
            tmp.replace(self.index_file)
            self._dirty = False

    def clear(self):
        with self.lock:
            for f in self.img_dir.glob("*"):
                f.unlink(missing_ok=True)
            self.index = {}
            self.sent.clear()
            self._dirty = True
        self.save()


class Fetcher:
    """Single queue for every background request — keeps the overall rate under the rate limit"""

    def __init__(self, client: Client, on_auth_lost):
        self.client = client
        self.on_auth_lost = on_auth_lost
        self.queue = deque()
        self.queued = set()
        self.cond = threading.Condition()
        threading.Thread(target=self._worker, daemon=True).start()

    def enqueue(self, task, front=True):
        cache, kind, key, _ = task
        tag = (id(cache), kind, key)
        if not self.client.logged_in or tag in self.queued:
            return
        with self.cond:
            # Data (info) before images so names/status show up quickly
            (self.queue.appendleft if front else self.queue.append)(task)
            self.queued.add(tag)
            self.cond.notify()

    def clear(self):
        with self.cond:
            self.queue.clear()
            self.queued.clear()

    def _worker(self):
        while True:
            with self.cond:
                while not self.queue:
                    self.cond.wait()
                task = self.queue.popleft()
            cache, kind, key, url = task
            delay = API_DELAY if kind == "info" else IMG_DELAY
            try:
                if self.client.logged_in:
                    if kind == "info":
                        cache._fetch_info(key)
                    else:
                        cache._fetch_img(key, url)
            except ApiError as e:
                log.warning("%s %s failed: %s", kind, key, e)
                if e.status == 401:
                    self.clear()
                    self.on_auth_lost()
                elif e.status == 429:  # Rate limited — back off and retry
                    with self.cond:
                        self.queue.appendleft(task)
                    time.sleep(60)
                    continue
                elif e.status == 404 and kind == "info":
                    cache.index[key] = {"ts": time.time(), "info": {}}
            except Exception:
                log.exception("%s %s crashed", kind, key)
            finally:
                with self.cond:
                    if task not in self.queue:
                        self.queued.discard((id(cache), kind, key))
            time.sleep(delay)
