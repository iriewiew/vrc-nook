"""VRC Nook — macOS Tahoe (Liquid Glass) style UI with pywebview + HTML"""
import base64
import ctypes
import json
import logging
import os
import re
import subprocess
import sys
import threading
import time
import urllib.parse
import urllib.request
from logging.handlers import RotatingFileHandler
from pathlib import Path

import webview

import osc
import vkbd
import vrc_api
import tray
import updater
import vrc_ops
import vrclog
from social import Social
from store import Store
from vrclog import KINDS, Room, parse_line

# A console-less exe has no stdout — keep print() in vrclog from crashing
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w", encoding="utf-8")

VERSION = "0.4.1"
log = logging.getLogger("vrclog")
UPLOAD_FIELDS = ("animationStyle", "maskTag", "frames", "framesOverTime", "loopStyle")
HERE = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))


def _data_dir():
    """%APPDATA%\\VRCNook — moves the pre-rename folder (VRChatLogViewer) over once.
    If the move fails (e.g. an old copy is still running and holds data.db), keep using the old folder and retry next start."""
    root = Path(os.environ["APPDATA"])
    new, old = root / "VRCNook", root / "VRChatLogViewer"
    if not new.exists() and old.is_dir():
        try:
            os.rename(old, new)  # same drive: instant, nothing is copied
        except OSError:
            return old
    return new


DATA_DIR = _data_dir()
SETTINGS = DATA_DIR / "settings.json"
LOCATION_RE = re.compile(r"^wrld_[\w-]+(:[\w~().,-]+)?$")


class Bridge:
    """Push data to the web page (callable from any thread)"""

    def __init__(self):
        self.window = None

    def __call__(self, fn, data):
        try:
            self.window.evaluate_js(f"window.{fn} && window.{fn}({json.dumps(data, ensure_ascii=False)})")
        except Exception:
            pass  # Window already closed / not ready yet


class Api:
    """Functions JavaScript can call via window.pywebview.api (attributes starting with _ are not exposed to JS)"""

    def __init__(self, js):
        self._js = js
        self._window = None
        self._maximized = False
        self._client = vrc_api.Client(DATA_DIR)
        self._fetcher = vrc_api.Fetcher(self._client, self._auth_lost)
        self._users = vrc_api.Cache(self._fetcher, DATA_DIR, "users", vrc_api.USER_FIELDS, vrc_api.pick_image,
                                    self._fetch_user, lambda p: js("onProfiles", p))
        # Player banner images, stored separately from profile images
        self._banners = vrc_api.Cache(self._fetcher, DATA_DIR, "banners", vrc_api.BANNER_FIELDS, vrc_api.banner_image,
                                      None, lambda p: js("onBanners", p))
        # Profile frames (cached per template — frames shared by many players load once)
        self._frames = vrc_api.Cache(self._fetcher, DATA_DIR, "frames", vrc_api.FRAME_FIELDS, vrc_api.frame_asset("base"),
                                     self._client.get_template, lambda p: js("onFrames", {"anim": False, "list": p}))
        self._frames_anim = vrc_api.Cache(self._fetcher, DATA_DIR, "frames_anim", vrc_api.FRAME_FIELDS,
                                          vrc_api.frame_asset("mainAnimation"), self._client.get_template,
                                          lambda p: js("onFrames", {"anim": True, "list": p}), raw_images=True)
        self._worlds = vrc_api.Cache(self._fetcher, DATA_DIR, "worlds", vrc_api.WORLD_FIELDS,
                                     lambda w: w.get("thumbnailImageUrl") or w.get("imageUrl", ""),
                                     self._client.get_world, lambda p: js("onWorlds", p))
        self._store = Store(DATA_DIR / "data.db")
        # General thumbnails (gallery, emoji, groups, avatars, items) — key is the original URL
        self._thumbs = vrc_api.Cache(self._fetcher, DATA_DIR, "thumbs", (), lambda o: o.get("url", ""),
                                     None, lambda p: js("onThumbs", [{"url": x["id"], "img": x["img"]} for x in p if x.get("img")]))
        self._social = Social(self._client, self._users, self._worlds, self._store, js, self._banners)
        self._pump = None
        self._tray = None
        self._kb = None        # Floating keyboard window
        self._kb_hwnd = None
        self._kb_rect = None

    def _fetch_user(self, uid):
        p = self._client.get_profile(uid)
        self._banners.ingest([{**p, "id": uid}])
        return p

    # ---------- General ----------
    def init(self):
        kinds = [{"name": k.name, "desc": k.desc, "default": k.default} for k in KINDS]
        try:
            settings = json.loads(SETTINGS.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            settings = {}
        return {"kinds": kinds, "settings": settings, "version": VERSION}

    def save_settings(self, settings):
        SETTINGS.parent.mkdir(parents=True, exist_ok=True)
        SETTINGS.write_text(json.dumps(settings, ensure_ascii=False), encoding="utf-8")

    def open_folder(self):
        os.startfile(vrclog.LOG_DIR)

    def open_profile(self, uid):
        if re.fullmatch(r"usr_[\w-]+", uid):
            os.startfile(f"https://vrchat.com/home/user/{uid}")

    def open_world(self, wid):
        if re.fullmatch(r"wrld_[\w-]+", wid):
            os.startfile(f"https://vrchat.com/home/world/{wid}")

    def open_url(self, url):
        """Open a social link from a profile — http/https only"""
        if re.match(r"^https?://[^\s\"'<>]+$", url or ""):
            os.startfile(url)

    def copy(self, text):
        subprocess.run("clip", input=text.encode("utf-16"), creationflags=subprocess.CREATE_NO_WINDOW)

    def set_on_top(self, on):
        self._window.on_top = bool(on)

    # ---------- VRChat account ----------
    def _auth_status(self):
        u = self._client.user
        if not u:
            return {"loggedIn": False}
        return {"loggedIn": True, "name": u.get("displayName", ""), "id": u.get("id", "")}

    def _after_login(self):
        self._js("onAuth", self._auth_status())
        if self._pump:
            self._users.want(list(self._pump.room.players), network=True)
        me = self._client.user.get("id")
        if me:
            self._users.want([me], network=True)
        self._social.start()

    def _auth_lost(self):
        self._client.user = None
        self._social.stop()
        self._js("onAuth", {"loggedIn": False, "expired": True})

    def vrc_login(self, username, password):
        try:
            res = self._client.login(username, password)
        except vrc_api.ApiError as e:
            return {"error": e.status}
        if res.get("ok"):
            self._after_login()
        return res

    def vrc_verify(self, method, code):
        try:
            self._client.verify_2fa(method, code)
        except vrc_api.ApiError as e:
            return {"error": e.status}
        self._after_login()
        return {"ok": True}

    def vrc_logout(self):
        self._fetcher.clear()
        self._social.stop()
        self._client.logout()
        self._js("onAuth", self._auth_status())

    def vrc_clear_cache(self):
        self._users.clear()
        self._worlds.clear()
        self._banners.clear()
        self._frames.clear()
        self._frames_anim.clear()
        self._thumbs.clear()

    # ---------- Friends / notifications ----------
    def friends_reload(self):
        if self._client.logged_in:
            self._social.reload()

    def notif_respond(self, nid, accept):
        return self._social.respond(nid, bool(accept))

    def launch(self, location):
        """Launch VRChat into that instance (via a vrchat:// link)"""
        if LOCATION_RE.match(location or ""):
            os.startfile(f"vrchat://launch?ref=vrchat.com&id={location}")
            return {"ok": True}
        return {"error": 400}

    def invite_self(self, location):
        if not LOCATION_RE.match(location or "") or ":" not in location:
            return {"error": 400}
        try:
            self._client.invite_self(location)
        except vrc_api.ApiError as e:
            return {"error": e.status}
        return {"ok": True}

    # ---------- Player / world data ----------
    def user(self, uid):
        """Open a profile card — push images/data via onProfiles and return data from the local database"""
        self._users.want([uid], network=True, force=True)
        self._banners.want([uid], network=False, force=True)
        return {"enc": self._store.encounters(uid), "memo": self._store.memo(uid), "friend": self._social.friend(uid),
                "names": self._store.names(uid)}

    def frames(self, tids, animated=False):
        tids = [t for t in tids if re.fullmatch(r"invt_[\w-]+", t or "")]
        (self._frames_anim if animated else self._frames).want(tids, network=True)

    # ---------- Thumbnails ----------
    def thumbs(self, urls):
        urls = [u for u in urls if isinstance(u, str) and u.startswith("https://api.vrchat.cloud/")]
        new = [u for u in urls if u not in self._thumbs.index]
        self._thumbs.want(urls, network=False)  # Send the ones we already have right away
        if new:
            self._thumbs.ingest([{"id": u, "url": u} for u in new])  # Queue the missing ones for loading

    # ---------- Generic VRChat API (vrc_ops table — only allowed endpoints can be called) ----------
    def vrc(self, name, params=None):
        if not self._client.logged_in:
            return {"error": 401}
        params = dict(params) if isinstance(params, dict) else {}
        try:
            src = params.pop("_imageUrl", None)  # Reuse the existing image on VRChat (e.g. editing a print's note without changing the image)
            if src:
                if not src.startswith("https://api.vrchat.cloud/"):
                    return {"error": 400}
                data, _ = self._client._request("GET", src, raw=True, timeout=60)
                params["_image"] = base64.b64encode(data).decode()
            res = vrc_ops.call(self._client, name, params)
        except vrc_ops.OpError as e:
            log.warning("vrc %s rejected: %s", name, e)
            return {"error": 400, "message": str(e)}
        except vrc_api.ApiError as e:
            log.warning("vrc %s failed: %s", name, e)
            return {"error": e.status, "message": e.message}
        users = vrc_ops.users_in(name, res)
        if users:
            self._users.ingest(users, images=len(users) <= 100)
        self._after_op(name, params or {}, res)
        return {"ok": res}

    def _after_op(self, name, params, res):
        me = (self._client.user or {}).get("id")
        if name in ("acceptFriendRequest", "deleteNotification", "respondInvite", "respondInviteWithPhoto"):
            self._social.drop_notif(params.get("notificationId"))
        elif name == "clearNotifications":
            for nid in list(self._social.notifs):
                self._social.drop_notif(nid)
        elif name == "updateUser" and isinstance(res, dict) and self._client.user:
            self._client.user.update({k: v for k, v in res.items() if v is not None})
            self._users.ingest([{**res, "id": me}])
        elif name in ("updateProfile", "updateBadge", "uploadIcon") and me:
            self._users.want([me], network=True, force=True)
        elif name == "selectAvatar" and self._client.user:
            self._client.user["currentAvatar"] = params.get("avatarId")

    def vrc_save(self, name, params, filename):
        """Download a file from the API (e.g. an event's .ics) and let the user pick where to save it"""
        if not self._client.logged_in:
            return {"error": 401}
        try:
            data, _ = vrc_ops.call(self._client, name, params if isinstance(params, dict) else {}, raw=True)
        except (vrc_ops.OpError, vrc_api.ApiError) as e:
            return {"error": getattr(e, "status", 400), "message": str(e)}
        name_ = re.sub(r"[^\w.-]+", "_", filename or "file")
        path = self._window.create_file_dialog(webview.FileDialog.SAVE, save_filename=name_)
        if not path:
            return {"ok": False}
        Path(path if isinstance(path, str) else path[0]).write_bytes(data)
        return {"ok": True}

    def verify_login_place(self, link):
        """Confirm a sign-in from a new location — the user pastes the link from VRChat's email (works before signing in)"""
        try:
            u = urllib.parse.urlparse((link or "").strip())
        except ValueError:
            return {"error": 400}
        if u.scheme != "https" or not re.fullmatch(r"(.+\.)?vrchat\.(com|cloud)", u.hostname or ""):
            return {"error": 400}
        q = urllib.parse.parse_qs(u.query)
        uid, token = (q.get("userId") or [""])[0], (q.get("token") or [""])[0]
        if not re.fullmatch(r"usr_[\w-]+", uid) or not re.fullmatch(r"[\w.\-~]+", token):
            return {"error": 400}
        try:
            self._client._request("GET", "/auth/verifyLoginPlace?" + urllib.parse.urlencode({"userId": uid, "token": token}))
        except vrc_api.ApiError as e:
            return {"error": e.status, "message": e.message}
        return {"ok": True}

    def me(self):
        """Own account data (from /auth/user received at login)"""
        u = self._client.user or {}
        # Don't send email/linked accounts to the web page (not needed)
        return {k: v for k, v in u.items() if not re.search(r"(?i)email|details|password|deletion|twoFactor", k)}

    def _call(self, fn, *args):
        """Call the API and return {"ok": result} or {"error": status}"""
        if not self._client.logged_in:
            return {"error": 401}
        try:
            return {"ok": fn(*args)}
        except vrc_api.ApiError as e:
            log.warning("%s failed: %s", fn.__name__, e)
            return {"error": e.status, "message": e.message}

    # ---------- Groups ----------
    @staticmethod
    def _group(g):
        return {k: g.get(k) for k in ("id", "groupId", "name", "shortCode", "discriminator", "description", "memberCount",
                                      "iconUrl", "bannerUrl", "joinState", "isVerified", "privacy", "rules", "links",
                                      "languages", "onlineMemberCount", "membershipStatus", "tags", "createdAt")}

    def groups_mine(self):
        r = self._call(self._client.my_groups)
        if "ok" in r:
            r["ok"] = [{**self._group(g), "id": g.get("groupId") or g.get("id"), "membershipStatus": "member"} for g in r["ok"]]
        return r

    def groups_search(self, q):
        r = self._call(self._client.search_groups, (q or "").strip())
        if "ok" in r:
            r["ok"] = [self._group(g) for g in r["ok"]]
        return r

    def group(self, gid):
        r = self._call(self._client.get_group, gid)
        if "ok" in r:
            g = r["ok"]
            r["ok"] = {**self._group(g), "membershipStatus": (g.get("myMember") or {}).get("membershipStatus") or g.get("membershipStatus")}
        return r

    def group_join(self, gid):
        r = self._call(self._client.join_group, gid)
        if "ok" in r:
            r["ok"] = {"membershipStatus": (r["ok"] or {}).get("membershipStatus", "member")}
        return r

    def group_leave(self, gid):
        return self._call(self._client.leave_group, gid)

    # ---------- Avatars ----------
    @staticmethod
    def _avatar(a):
        platforms = sorted({p.get("platform") for p in a.get("unityPackages") or [] if p.get("platform")})
        return {"id": a.get("id"), "name": a.get("name"), "description": a.get("description"), "authorName": a.get("authorName"),
                "authorId": a.get("authorId"), "thumb": a.get("thumbnailImageUrl") or a.get("imageUrl"),
                "image": a.get("imageUrl"), "releaseStatus": a.get("releaseStatus"), "platforms": platforms,
                "created": a.get("created_at"), "updated": a.get("updated_at"), "tags": a.get("tags") or []}

    def avatars(self, kind):
        fn = self._client.favorite_avatars if kind == "fav" else self._client.my_avatars
        r = self._call(fn)
        if "ok" in r:
            r["ok"] = {"list": [self._avatar(a) for a in r["ok"]], "current": (self._client.user or {}).get("currentAvatar")}
        return r

    def avatar_select(self, aid):
        r = self._call(self._client.select_avatar, aid)
        if "ok" in r and self._client.user:
            self._client.user["currentAvatar"] = aid
            r["ok"] = True
        return r

    # ---------- Gallery / inventory ----------
    @staticmethod
    def _file(f):
        vers = [v for v in f.get("versions") or [] if v.get("file")]
        url = vers[-1]["file"].get("url") if vers else ""
        return {"id": f.get("id"), "url": url, "tags": f.get("tags") or [], "created": vers[-1].get("created_at") if vers else "",
                "animationStyle": f.get("animationStyle"), "maskTag": f.get("maskTag"), "frames": f.get("frames"),
                "framesOverTime": f.get("framesOverTime"), "loopStyle": f.get("loopStyle")}

    def files(self, tag):
        r = self._call(self._client.list_files, tag)
        if "ok" in r:
            r["ok"] = [self._file(f) for f in r["ok"]]
            r["ok"].reverse()  # Newest first
        return r

    def upload_image(self, tag, b64png, fields=None):
        if tag not in ("gallery", "icon", "emoji", "emojianimated", "sticker"):
            return {"error": 400}
        try:
            png = base64.b64decode(b64png.split(",", 1)[-1])
        except ValueError:
            return {"error": 400}
        fields = {k: str(v) for k, v in (fields or {}).items() if k in UPLOAD_FIELDS and v not in ("", None)}
        r = self._call(self._client.upload_image, tag, png, fields)
        if "ok" in r:
            r["ok"] = self._file(r["ok"])
        return r

    def save_png(self, b64png, name):
        """Save a sprite sheet to disk (the user chooses where)"""
        name = re.sub(r"[^\w.-]+", "_", name or "emoji") + ".png"
        path = self._window.create_file_dialog(webview.FileDialog.SAVE, save_filename=name, file_types=("PNG (*.png)",))
        if not path:
            return False
        Path(path if isinstance(path, str) else path[0]).write_bytes(base64.b64decode(b64png.split(",", 1)[-1]))
        return True

    def delete_file(self, fid):
        if not re.fullmatch(r"file_[\w-]+", fid or ""):
            return {"error": 400}
        return self._call(self._client.delete_file, fid)

    @staticmethod
    def _item(i):
        return {k: i.get(k) for k in ("id", "templateId", "name", "description", "itemType", "itemTypeLabel", "imageUrl",
                                      "equipSlot", "equipSlots", "isArchived", "collections", "created_at", "flags")}

    def inventory(self, kind):
        query = "flags=equippable&order=newest" if kind == "cosmetics" else "notFlags=equippable&order=newest"
        r = self._call(self._client.inventory, query)
        if "ok" in r:
            r["ok"] = [self._item(i) for i in r["ok"]]
        return r

    def equip(self, inv_id, slot):
        if not re.fullmatch(r"inv_[\w-]+", inv_id or "") or not re.fullmatch(r"\w+", slot or ""):
            return {"error": 400}
        r = self._call(self._client.equip, inv_id, slot)
        if "ok" in r:
            r["ok"] = self._item(r["ok"])
        return r

    def unequip(self, slot):
        if not re.fullmatch(r"\w+", slot or ""):
            return {"error": 400}
        return self._call(self._client.unequip, slot)

    def set_memo(self, uid, text):
        self._store.set_memo(uid, text[:2000])

    def world(self, wid):
        self._worlds.want([wid], network=True, force=True)

    def worlds(self, wids):
        self._worlds.want(wids, network=True)

    def search(self, kind, q):
        q = (q or "").strip()
        if not q or not self._client.logged_in:
            return {"ids": []}
        try:
            if kind == "worlds":
                res = self._client.search_worlds(q)
                self._worlds.ingest(res)
            else:
                res = self._client.search_users(q)
                self._users.ingest(res)
        except vrc_api.ApiError as e:
            return {"error": e.status}
        return {"ids": [r["id"] for r in res if r.get("id")]}

    def history(self):
        return self._store.history()

    def visit_players(self, start, end):
        players = self._store.visit_players(start, end)
        self._users.want([p["u"] for p in players], network=False)
        return players

    def feed(self):
        items = self._store.recent_feed()
        self._users.want({i["u"] for i in items}, network=False)
        return items

    # Traffic-light buttons
    def close(self):
        # "Minimize to tray" is on = hide the window instead of quitting
        if self._tray and _setting("tray"):
            self._window.hide()
        else:
            self.kb_float(False)
            self._window.destroy()

    def show_window(self):
        self._window.show()
        self._window.restore()

    def quit(self):
        self.kb_float(False)
        self._window.destroy()

    # ---------- App updates (GitHub Releases) ----------
    def update_check(self):
        try:
            info = updater.check(VERSION)
        except Exception as e:
            log.warning("update check failed: %s", e)
            return {"error": str(e)}
        self._update = info
        info["canSelf"] = bool(updater.exe_path()) and bool(info["sha256"])
        return info

    def update_install(self):
        info = getattr(self, "_update", None)
        if not info or not info.get("newer"):
            return False

        def run():
            try:
                new = updater.download(info, lambda p: self._js("onUpdateProgress", p))
                self._js("onUpdateProgress", 100)
                updater.apply(new)
            except Exception as e:
                log.warning("update failed: %s", e)
                self._js("onUpdateFailed", str(e))
                return
            self.quit()
        threading.Thread(target=run, daemon=True).start()
        return True

    def update_page(self):
        os.startfile((getattr(self, "_update", None) or {}).get("page") or f"https://github.com/{updater.REPO}/releases")

    # ---------- Windows notifications / start with Windows ----------
    def notify(self, title, message):
        if self._tray:
            self._tray.notify(title, message)

    def get_autostart(self):
        return tray.autostart_get()

    def set_autostart(self, on):
        try:
            return tray.autostart_set(bool(on))
        except OSError as e:
            log.warning("autostart failed: %s", e)
            return tray.autostart_get()

    # ---------- In-game Chatbox (OSC) ----------
    def chat_send(self, text, sound=True):
        text = osc.clean(text)
        if not text:
            return {"error": "empty"}
        try:
            osc.chatbox(text, sound)
        except OSError as e:
            return {"error": str(e)}
        room = self._pump.room if self._pump else None
        world = room.world if room and room.location else ""
        return self._store.add_chat(text, world)

    def chat_typing(self, on):
        try:
            osc.typing(bool(on))
        except OSError:
            pass

    def chat_history(self):
        return {"items": self._store.recent_chat(), "inGame": bool(self._pump and self._pump.room.location)}

    def chat_delete(self, cid):
        self._store.delete_chat(cid)
        return True

    # ---------- Floating keyboard (Windows virtual keyboard) ----------
    def clip_get(self):
        return vkbd.get_clipboard()

    def kb_float(self, on, cfg=None):
        if not on:
            w = self._kb
            if w:
                self.chat_typing(False)  # In case it's closed while typing in chat mode
                try:
                    self._kb_rect = [w.x, w.y, w.width, w.height]
                except Exception:
                    pass
                w.destroy()
            return True
        if self._kb:
            return True
        cfg = cfg if isinstance(cfg, dict) else {}
        icons = (HERE / "vrclog_icons.json").read_text(encoding="utf-8")
        page = (HERE / "kb_float.html").read_text(encoding="utf-8")
        safe = {k: cfg.get(k) for k in ("lang", "kbLang", "langs", "accent", "dark", "mode", "sound", "typing")}
        layouts = (HERE / "kb_layouts.js").read_text(encoding="utf-8")
        page = page.replace("/*CFG*/{}", json.dumps(safe, ensure_ascii=False).replace("</", "<\\/")).replace("/*ICONS*/{}", icons)
        page = page.replace("/*LAYOUTS*/", layouts)
        rect = cfg.get("rect")
        if isinstance(rect, list) and len(rect) == 4 and all(isinstance(v, (int, float)) for v in rect):
            x, y, w, h = (int(v) for v in rect)
            w, h = max(w, 360), max(h, 160)
        else:
            w, h, x, y = 900, 380, None, None
            try:  # Place at the bottom center of the screen
                sc = webview.screens[0]
                x, y = sc.x + (sc.width - w) // 2, sc.y + sc.height - h - 70
            except Exception:
                pass
        self._kb = webview.create_window("VRChat Keyboard", html=page, js_api=KbApi(self), width=w, height=h, x=x, y=y,
                                         min_size=(360, 160), frameless=True, on_top=True, focus=False, shadow=True,
                                         background_color="#f2f2f6" if not cfg.get("dark", True) else "#1c1c1f")
        win = self._kb

        def shown():
            try:
                self._kb_hwnd = win.native.Handle.ToInt32()
                vkbd.make_noactivate(self._kb_hwnd)
            except Exception as e:
                log.warning("keyboard style failed: %s", e)
            round_corners(win)

        def closed():
            if self._kb is win:
                self._kb, self._kb_hwnd = None, None
                self._js("onKbFloat", {"rect": self._kb_rect})

        win.events.shown += shown
        win.events.closed += closed
        return True

    # ---------- Public avatar search via avtrdb.com (external database, as used by VRCX) ----------
    def avatar_search(self, query, page=0):
        q = (query or "").strip()
        if not q:
            return {"ok": []}
        url = "https://api.avtrdb.com/v2/avatar/search?" + urllib.parse.urlencode({"query": q, "page_size": 50, "page": int(page or 0)})
        # Send only the search query — no cookie or VRChat account data goes to the external service
        req = urllib.request.Request(url, headers={"User-Agent": vrc_api.USER_AGENT, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                data = json.loads(r.read())
        except (OSError, ValueError) as e:
            log.warning("avtrdb failed: %s", e)
            return {"error": 0, "message": str(e)}
        out = []
        for a in data.get("avatars") or []:
            if not re.fullmatch(r"avtr_[\w-]+", a.get("vrc_id") or ""):
                continue
            perf = a.get("performance") or {}
            out.append({"id": a["vrc_id"], "name": a.get("name", ""), "authorName": (a.get("author") or {}).get("name", ""),
                        "authorId": (a.get("author") or {}).get("vrc_id", ""), "description": a.get("description", ""),
                        "thumb": a.get("image_url", "") if str(a.get("image_url", "")).startswith("https://") else "",
                        "platforms": [{"pc": "standalonewindows"}.get(p, p) for p in a.get("compatibility") or []],
                        "perf": perf.get("pc_rating", ""), "updated": a.get("updated_at", "")})
        return {"ok": out, "more": bool(data.get("has_more"))}

    def minimize(self):
        self._window.minimize()

    def zoom(self):
        if self._maximized:
            self._window.restore()
        else:
            self._window.maximize()
        self._maximized = not self._maximized

    def resize(self, w, h):
        self._window.resize(max(int(w), 860), max(int(h), 520))


class KbApi:
    """Floating keyboard window functions — send keys to the active program"""
    _KEYS = {"bs", "enter", "newline", "tab", "esc", "left", "right", "up", "down", "del", "copy", "paste", "cut", "all", "undo", "taskview"}

    def __init__(self, owner):
        self._o = owner

    def type(self, text):
        vkbd.type_text(str(text)[:200], self._o._kb_hwnd)

    def retype(self, text):
        vkbd.press("bs", self._o._kb_hwnd)
        vkbd.type_text(str(text)[:8], self._o._kb_hwnd)

    def press(self, name):
        if name in self._KEYS:
            vkbd.press(name, self._o._kb_hwnd)

    def resize(self, w, h):
        if self._o._kb:
            self._o._kb.resize(max(int(w), 360), max(int(h), 160))

    def set_lang(self, k):
        if k in ("th", "en", "ja", "jk", "ko", "ru", "vi", "zh", "emoji"):
            self._o._js("onKbLang", k)

    def set_mode(self, m):
        if m in ("chat", "win"):
            self._o._js("onKbMode", m)

    # ---------- In-game chat mode: send to the Chatbox over OSC and record history like the chat page ----------
    def chat_send(self, text, sound=True):
        r = self._o.chat_send(text, sound)
        if isinstance(r, dict) and r.get("id"):
            self._o._js("onChatSent", r)
        return r

    def chat_typing(self, on):
        self._o.chat_typing(on)

    def clip_get(self):
        return vkbd.get_clipboard()

    def clip_set(self, text):
        return vkbd.set_clipboard(str(text)[:2000])

    def close(self):
        self._o.kb_float(False)


class Pump:
    """Read the log on a separate thread, push batches to the web page every 0.25 s and save them to the database"""

    def __init__(self, api: Api, js):
        self.api = api
        self.js = js
        self.room = Room()
        self.pending = []
        self.to_store = []
        self.lock = threading.Lock()
        self.started = False
        self.path = None

    def start(self):
        if self.started:
            return
        self.started = True
        self.path = vrclog.log_files(False)[0]
        threading.Thread(target=self._read, daemon=True).start()
        threading.Thread(target=self._flush, daemon=True).start()
        # Import old logs into the database in the background (the first run may take a while)
        threading.Thread(target=lambda: self.api._store.import_logs(skip=self.path), daemon=True).start()

    def _read(self):
        def switched(p):
            self.path = p
        for line in vrclog.follow_lines(self.path, on_switch=switched):
            ev = parse_line(line)
            if not ev:
                continue
            with self.lock:
                self.room.update(ev)
                parts = list(ev.parts)
                if ev.kind == "item":  # The log only has the user ID — send the player's name instead
                    parts = [self.room.players.get(ev.user_id, ev.user_id)]
                self.pending.append({"t": ev.time, "k": ev.kind, "v": ev.value, "u": ev.user_id,
                                     "p": parts, "c": len(self.room.players)})
                self.to_store.append(ev)

    def _flush(self):
        sent_once = False
        last_room = None
        while True:
            time.sleep(0.25)
            with self.lock:
                store, self.to_store = self.to_store, []
                if not self.pending and sent_once:
                    continue
                sent_once = True
                batch = {
                    "events": self.pending,
                    "world": self.room.world,
                    "location": self.room.location,
                    "players": sorted(self.room.players.items(), key=lambda x: x[1].lower()),
                }
                self.pending = []
            self.api._store.add_events(store)
            self.js("onBatch", batch)
            # Images from cache for everyone in the log / fetch from the network only for players currently in the room
            self.api._users.want({e["u"] for e in batch["events"] if e["u"]}, network=False)
            room = tuple(uid for uid, _ in batch["players"])
            if room != last_room:
                last_room = room
                self.api._users.want(room, network=True)
            locs = [e["v"].split(":")[0] for e in batch["events"] if e["k"] == "instance"]
            if locs:
                self.api._worlds.want(locs[-1:], network=True)
                self.api._worlds.want(locs, network=False)


def round_corners(window):
    # Windows 11: rounded corners on the frameless window, like macOS
    try:
        hwnd = window.native.Handle.ToInt32()
        pref = ctypes.c_int(2)  # DWMWCP_ROUND
        ctypes.windll.dwmapi.DwmSetWindowAttribute(hwnd, 33, ctypes.byref(pref), ctypes.sizeof(pref))
    except Exception:
        pass


def _setting(key):
    try:
        return json.loads(SETTINGS.read_text(encoding="utf-8")).get(key)
    except (OSError, ValueError):
        return None


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    updater.cleanup()
    handler = RotatingFileHandler(DATA_DIR / "debug.log", maxBytes=1_000_000, backupCount=1, encoding="utf-8")
    logging.basicConfig(handlers=[handler], level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    webview.settings["DRAG_REGION_DIRECT_TARGET_ONLY"] = True  # Clicking toolbar buttons doesn't drag the window
    js = Bridge()
    api = Api(js)
    html = (HERE / "vrclog_ui.html").read_text(encoding="utf-8")
    icons = (HERE / "vrclog_icons.json").read_text(encoding="utf-8")
    html = html.replace("/*ICONS*/{}", icons)
    more = (HERE / "vrclog_more.js").read_text(encoding="utf-8")  # Extra pages/features using the VRChat API (v4)
    layouts = (HERE / "kb_layouts.js").read_text(encoding="utf-8")  # Keyboard layouts for every language (shared with the floating keyboard)
    extra = (HERE / "i18n_extra.js").read_text(encoding="utf-8")  # Extra app languages (Korean / Russian / Vietnamese / Chinese)
    html = html.replace("</body>", f"<script>{layouts}</script><script>{more}</script><script>{extra}</script></body>")
    window = webview.create_window("VRC Nook", html=html, js_api=api, width=1280, height=840,
                                   min_size=(860, 520), frameless=True, shadow=True,
                                   background_color="#1c1c1e", hidden="--tray" in sys.argv)
    js.window = api._window = window
    try:  # System tray icon (also used for notifications)
        api._tray = tray.Tray(api.show_window, api.quit, ("เปิด VRC Nook", "ออกจากโปรแกรม"))
    except Exception as e:
        log.warning("tray failed: %s", e)
    api._pump = Pump(api, js)

    def on_loaded():
        api._pump.start()

        def resume():  # Reuse the previous session if it hasn't expired
            if api._client.resume():
                api._after_login()
            else:
                js("onAuth", api._auth_status())
        threading.Thread(target=resume, daemon=True).start()

    window.events.shown += lambda: round_corners(window)
    window.events.loaded += on_loaded
    webview.start()
    if api._tray:
        api._tray.stop()


if __name__ == "__main__":
    main()
