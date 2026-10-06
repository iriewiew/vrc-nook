"""Real-time friends (VRChat WebSocket pipeline), feed and notifications"""
import json
import threading
import time

import websocket

import vrc_api
from store import now

PIPELINE = "wss://pipeline.vrchat.cloud/?authToken="
FRIEND_FIELDS = ("displayName", "status", "statusDescription", "location", "last_platform", "bio", "iconFrame",
                 "currentAvatarThumbnailImageUrl", "currentAvatarImageUrl", "userIcon", "iconUrl", "profilePicOverride",
                 "last_login", "last_activity", "last_mobile")
AVATAR_KEYS = ("currentAvatarThumbnailImageUrl", "currentAvatarImageUrl")


def world_of(location):
    return location.split(":")[0] if location and location.startswith("wrld_") else ""


class Social:
    def __init__(self, client: vrc_api.Client, users: vrc_api.Cache, worlds: vrc_api.Cache, store, js, banners=None):
        self.client = client
        self.users = users
        self.worlds = worlds
        self.banners = banners
        self.store = store
        self.js = js  # js(function name, data)
        self.friends = {}  # uid -> dict
        self.notifs = {}  # id -> dict
        self.lock = threading.Lock()
        self.ws = None
        self.gen = 0  # Bumped on every login/logout so old threads stop
        self.online = False

    # ---------- Start / stop ----------
    def start(self):
        self.gen += 1
        threading.Thread(target=self._initial_load, args=(self.gen,), daemon=True).start()
        threading.Thread(target=self._pipeline, args=(self.gen,), daemon=True).start()

    def stop(self):
        self.gen += 1
        with self.lock:
            self.friends.clear()
            self.notifs.clear()
        if self.ws:
            try:
                self.ws.close()
            except Exception:
                pass
        self.js("onFriends", {"list": [], "loaded": False})
        self.js("onNotifs", [])

    def reload(self):
        threading.Thread(target=self._initial_load, args=(self.gen,), daemon=True).start()

    # ---------- Load the friend list on start ----------
    def _initial_load(self, gen):
        try:
            online = self.client.get_friends(False)
            time.sleep(vrc_api.API_DELAY)
            offline = self.client.get_friends(True)
            time.sleep(vrc_api.API_DELAY)
            notifs = self.client.get_notifications()
        except vrc_api.ApiError:
            return
        if gen != self.gen:
            return
        with self.lock:
            self.friends = {}
            for u in online:
                loc = u.get("location") or ""
                self.friends[u["id"]] = self._entry(u, "online" if loc and loc != "offline" else "active")
            for u in offline:
                self.friends[u["id"]] = self._entry(u, "offline")
            self.notifs = {n["id"]: self._notif(n) for n in notifs if n.get("id")}
        self._check_names(online + offline)
        self.users.ingest(online)
        if self.banners:
            self.banners.ingest(online)
        self.users.ingest(offline, images=False)  # Offline friends can number in the hundreds — load their images when a profile is opened
        self._want_worlds()
        self._send_all()

    def _check_names(self, users):
        """Compare the name with the stored one — if it changed, record name history and add a feed entry"""
        for u in users:
            old = self.users.index.get(u.get("id"), {}).get("info", {}).get("displayName")
            new = u.get("displayName")
            if old and new and old != new:
                self.store.add_name_change(u["id"], old, new)
                self._feed("name", u["id"], new, old=old, new=new)

    def _entry(self, u, state):
        e = {k: u.get(k, "") for k in FRIEND_FIELDS}
        e.update(id=u["id"], state=state)
        if state != "online":
            e["location"] = "offline" if state == "offline" else e.get("location") or "offline"
        return e

    def _notif(self, n):
        details = n.get("details") or {}
        if isinstance(details, str):
            try:
                details = json.loads(details)
            except ValueError:
                details = {}
        return {"id": n["id"], "type": n.get("type"), "from": n.get("senderUserId", ""),
                "name": n.get("senderUsername", ""), "t": n.get("created_at", ""), "msg": n.get("message", ""),
                "world": details.get("worldId", ""), "worldName": details.get("worldName", ""), "seen": n.get("seen", False),
                "details": {k: v for k, v in details.items() if isinstance(v, (str, int, float, bool))}}

    def _send_all(self):
        with self.lock:
            data = {"list": list(self.friends.values()), "loaded": True}
            notifs = list(self.notifs.values())
        self.js("onFriends", data)
        self.js("onNotifs", notifs)

    def _want_worlds(self):
        with self.lock:
            ids = {world_of(f.get("location")) for f in self.friends.values()}
            ids |= {world_of(n.get("world")) for n in self.notifs.values()}
        self.worlds.want([i for i in ids if i])

    # ---------- WebSocket ----------
    def _pipeline(self, gen):
        backoff = 2
        while gen == self.gen:
            token = self.client.auth_token
            if not token:
                time.sleep(3)
                continue
            connected = False
            try:
                self.ws = websocket.create_connection(PIPELINE + token, header=[f"User-Agent: {vrc_api.USER_AGENT}"],
                                                      timeout=60)
                connected = True
                self._set_online(True)
                backoff = 2
                while gen == self.gen:
                    try:
                        msg = self.ws.recv()
                    except websocket.WebSocketTimeoutException:
                        self.ws.ping()
                        continue
                    if not msg:
                        break
                    data = json.loads(msg)
                    content = data.get("content")
                    if isinstance(content, str):
                        try:
                            content = json.loads(content)
                        except ValueError:
                            pass
                    try:
                        self._on_event(data.get("type"), content or {})
                    except Exception:
                        pass
            except Exception:
                pass
            finally:
                self._set_online(False)
                try:
                    self.ws and self.ws.close()
                except Exception:
                    pass
            if gen != self.gen:
                return
            time.sleep(backoff)
            backoff = min(backoff * 2, 120)
            if connected:
                self.reload()  # Was connected and dropped — reload the list in case events were missed meanwhile

    def _set_online(self, on):
        if on != self.online:
            self.online = on
            self.js("onPipeline", on)

    def _feed(self, type_, uid, name, **d):
        entry = {"t": now(), "type": type_, "u": uid, "name": name, "d": d}
        self.store.add_feed(entry)
        self.js("onFeed", [entry])

    def _on_event(self, type_, c):
        uid = c.get("userId", "")
        user = c.get("user") or {}
        if type_ in ("friend-online", "friend-location", "friend-active", "friend-offline", "friend-update", "friend-add"):
            with self.lock:
                old = dict(self.friends.get(uid, {}))
                cur = self.friends.setdefault(uid, {"id": uid, "state": "offline", "location": "offline"})
                for k in FRIEND_FIELDS:
                    if k in user:
                        cur[k] = user[k]
                name = cur.get("displayName") or old.get("displayName", "")
                if type_ == "friend-online":
                    cur.update(state="online", location=c.get("location") or "private")
                    cur["last_platform"] = c.get("platform") or cur.get("last_platform", "")
                elif type_ == "friend-location":
                    loc = c.get("location") or ""
                    cur["state"] = "online"
                    if loc and loc != "traveling":
                        cur["location"] = loc
                    elif loc == "traveling":
                        cur["location"] = "traveling"
                        cur["traveling"] = c.get("travelingToLocation", "")
                elif type_ == "friend-active":
                    cur.update(state="active", location="offline")
                elif type_ == "friend-offline":
                    cur.update(state="offline", location="offline",
                           last_activity=time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()))  # Used to show "last online"
                snapshot = dict(cur)
            if user:
                self._check_names([{**user, "id": uid}])
                self.users.ingest([{**user, "id": uid}])
                if self.banners and ("bannerUrl" in user or "bannerType" in user):
                    self.banners.ingest([{**user, "id": uid}])
            # Only record feed entries for real changes
            if type_ == "friend-online" and old.get("state") != "online":
                self._feed("online", uid, name, location=snapshot["location"])
            elif type_ == "friend-offline" and old.get("state") in ("online", "active"):
                self._feed("offline", uid, name)
            elif type_ == "friend-location" and snapshot["location"] not in ("traveling", old.get("location")):
                self._feed("location", uid, name, location=snapshot["location"])
            elif type_ == "friend-add":
                self._feed("friendAdd", uid, name)
            if user and old:
                if (user.get("status"), user.get("statusDescription")) != (old.get("status"), old.get("statusDescription")) \
                        and "status" in user:
                    self._feed("status", uid, name, status=user.get("status"), desc=user.get("statusDescription", ""))
                if any(k in user and user[k] and user[k] != old.get(k) for k in AVATAR_KEYS):
                    self._feed("avatar", uid, name)
                if "bio" in user and user["bio"] != old.get("bio", user["bio"]):
                    self._feed("bio", uid, name, bio=user["bio"])
            if world_of(snapshot["location"]):
                self.worlds.want([world_of(snapshot["location"])])
            self.js("onFriend", snapshot)
        elif type_ == "friend-delete":
            with self.lock:
                old = self.friends.pop(uid, {})
            self._feed("friendRemove", uid, old.get("displayName", ""))
            self.js("onFriendRemoved", uid)
        elif type_ == "notification" and c.get("id"):
            n = self._notif(c)
            with self.lock:
                self.notifs[n["id"]] = n
            if n["world"]:
                self.worlds.want([world_of(n["world"])])
            self.js("onNotifs", list(self.notifs.values()))
            self.js("onNewNotif", n)
        elif type_ in ("see-notification", "hide-notification", "response-notification"):
            nid = c if isinstance(c, str) else c.get("notificationId") or c.get("id")
            with self.lock:
                self.notifs.pop(nid, None)
                notifs = list(self.notifs.values())
            self.js("onNotifs", notifs)
        elif type_ == "user-update" and isinstance(c.get("user"), dict):
            me = {**c["user"], "id": c.get("userId") or c["user"].get("id")}
            if self.client.user:
                self.client.user.update({k: v for k, v in c["user"].items() if v is not None})
            self.users.ingest([me])
            self.js("onPipelineEvent", {"type": type_, "content": c})
        else:
            # notification-v2*, group-*, content-refresh, instance-queue-* etc. — passed on to the web page
            self.js("onPipelineEvent", {"type": type_, "content": c})

    # ---------- Actions from the UI ----------
    def respond(self, nid, accept):
        n = self.notifs.get(nid)
        if not n:
            return {"error": 404}
        try:
            if accept and n["type"] == "friendRequest":
                self.client.accept_friend(nid)
            else:
                self.client.hide_notification(nid)
        except vrc_api.ApiError as e:
            return {"error": e.status}
        with self.lock:
            self.notifs.pop(nid, None)
            notifs = list(self.notifs.values())
        self.js("onNotifs", notifs)
        return {"ok": True}

    def drop_notif(self, nid):
        with self.lock:
            self.notifs.pop(nid, None)
            notifs = list(self.notifs.values())
        self.js("onNotifs", notifs)

    def friend(self, uid):
        with self.lock:
            return dict(self.friends.get(uid, {}))
