"""Table of VRChat API endpoints the web page can call through Api.vrc()
Based on https://vrchat.community (OpenAPI 1.21) — only names in this table can be called, and only the listed fields are sent
Endpoints intentionally left out: Unity SDK work (creating/uploading avatars and worlds), purchases/payments, account sign-up/deletion,
security settings (2FA, password, email) and VRChat-internal endpoints"""
import base64
import json
import re
import time
import urllib.parse
from collections import namedtuple

Op = namedtuple("Op", "method path query body users form", defaults=((), (), "", ""))

# users: how to pull user objects from the result into the profile image cache ("list" = each item is a user, "user" = item.user,
#        "target" = item.targetUser, "users" = result.users)
# form:  multipart endpoint (sends an image)
Q_PAGE = ("n", "offset")
Q_LIST = Q_PAGE + ("sort", "order", "search", "tag", "notag", "featured", "releaseStatus", "platform")
EVENT_FIELDS = ("title", "description", "startsAt", "endsAt", "category", "accessType", "languages", "platforms", "tags",
                "imageId", "roleIds", "sendCreationNotification", "featured", "isDraft", "hostEarlyJoinMinutes",
                "guestEarlyJoinMinutes", "closeInstanceAfterEndMinutes", "usesInstanceOverflow")
GALLERY_FIELDS = ("name", "description", "membersOnly", "roleIdsToView", "roleIdsToSubmit", "roleIdsToAutoApprove", "roleIdsToManage")
POST_FIELDS = ("title", "text", "imageId", "sendNotification", "roleIds", "visibility")

OPS = {
    # ---------- Account ----------
    "getCurrentUser": Op("GET", "/auth/user"),
    "verifyAuthToken": Op("GET", "/auth"),
    "verifyLoginPlace": Op("GET", "/auth/verifyLoginPlace", ("userId", "token")),
    "getGlobalAvatarModerations": Op("GET", "/auth/user/avatarmoderations"),
    "createGlobalAvatarModeration": Op("POST", "/auth/user/avatarmoderations", (), ("avatarModerationType", "targetAvatarId")),
    "deleteGlobalAvatarModeration": Op("DELETE", "/auth/user/avatarmoderations", ("targetAvatarId", "avatarModerationType")),
    "getFavoriteLimits": Op("GET", "/auth/user/favoritelimits"),
    "getAgeVerificationStatus": Op("GET", "/ageVerification/status"),

    # ---------- Users ----------
    "getUser": Op("GET", "/users/{userId}"),
    "searchUsers": Op("GET", "/users", ("search", "n", "offset"), users="list"),
    "getUserByName": Op("GET", "/users/{username}/name"),
    "getPublicProfile": Op("GET", "/profile/{userId}", ("asSelf", "withGroupsAndWorlds")),
    "updateProfile": Op("PUT", "/profile/{me}", (), ("bio", "bioLinks", "languages", "bannerColor", "bannerType", "iconFrame",
                                                     "userIcon", "nameplateEffect", "profileEffect", "themeId",
                                                     "backgroundType", "backgroundTextureId")),
    "updateUser": Op("PUT", "/users/{me}", (), ("status", "statusDescription", "pronouns", "isBoopingEnabled",
                                                "hasSharedConnectionsOptOut", "hasDiscordFriendsOptOut")),
    "updateBadge": Op("PUT", "/users/{me}/badges/{badgeId}", (), ("hidden", "showcased")),
    "getUserNotes": Op("GET", "/userNotes", Q_PAGE, users="target"),
    "getUserNote": Op("GET", "/userNotes/{userNoteId}"),
    "updateUserNote": Op("POST", "/userNotes", (), ("targetUserId", "note")),
    "getUserGroups": Op("GET", "/users/{userId}/groups"),
    "getUserRepresentedGroup": Op("GET", "/users/{userId}/groups/represented"),
    "getInvitedGroups": Op("GET", "/users/{me}/groups/invited"),
    "getUserGroupRequests": Op("GET", "/users/{me}/groups/requested"),
    "getBlockedGroups": Op("GET", "/users/{me}/groups/userblocked"),
    "getUserGroupInstances": Op("GET", "/users/{me}/instances/groups"),
    "getUserGroupInstancesForGroup": Op("GET", "/users/{me}/instances/groups/{groupId}"),
    "getMutuals": Op("GET", "/users/{userId}/mutuals"),
    "getMutualFriends": Op("GET", "/users/{userId}/mutuals/friends", Q_PAGE, users="list"),
    "getMutualGroups": Op("GET", "/users/{userId}/mutuals/groups", Q_PAGE),
    "getUserCosmetics": Op("GET", "/user/{userId}/cosmetics"),

    # ---------- Friends ----------
    "getFriends": Op("GET", "/auth/user/friends", Q_PAGE + ("offline",)),
    "friend": Op("POST", "/user/{userId}/friendRequest"),
    "deleteFriendRequest": Op("DELETE", "/user/{userId}/friendRequest"),
    "getFriendStatus": Op("GET", "/user/{userId}/friendStatus"),
    "unfriend": Op("DELETE", "/auth/user/friends/{userId}"),
    "boop": Op("POST", "/users/{userId}/boop", (), ("emojiId", "emojiVersion", "inventoryItemId")),

    # ---------- Favorites ----------
    "getFavorites": Op("GET", "/favorites", Q_PAGE + ("type", "tag")),
    "addFavorite": Op("POST", "/favorites", (), ("type", "favoriteId", "tags")),
    "removeFavorite": Op("DELETE", "/favorites/{favoriteId}"),
    "getFavoriteGroups": Op("GET", "/favorite/groups", Q_PAGE + ("type", "ownerId", "userId")),
    "getFavoriteGroup": Op("GET", "/favorite/group/{favoriteGroupType}/{favoriteGroupName}/{me}"),
    "updateFavoriteGroup": Op("PUT", "/favorite/group/{favoriteGroupType}/{favoriteGroupName}/{me}", (), ("displayName", "visibility", "tags")),
    "clearFavoriteGroup": Op("DELETE", "/favorite/group/{favoriteGroupType}/{favoriteGroupName}/{me}"),
    "getFavoritedWorlds": Op("GET", "/worlds/favorites", Q_LIST + ("userId",)),
    "getFavoritedAvatars": Op("GET", "/avatars/favorites", Q_LIST + ("userId",)),

    # ---------- Blocks / mutes ----------
    "getPlayerModerations": Op("GET", "/auth/user/playermoderations", ("type", "targetUserId")),
    "moderateUser": Op("POST", "/auth/user/playermoderations", (), ("moderated", "type")),
    "unmoderateUser": Op("PUT", "/auth/user/unplayermoderate", (), ("moderated", "type")),
    "clearAllPlayerModerations": Op("DELETE", "/auth/user/playermoderations"),

    # ---------- Notifications ----------
    "getNotifications": Op("GET", "/auth/user/notifications", Q_PAGE + ("type", "sent", "hidden", "after")),
    "getNotification": Op("GET", "/auth/user/notifications/{notificationId}"),
    "acceptFriendRequest": Op("PUT", "/auth/user/notifications/{notificationId}/accept"),
    "markNotificationAsRead": Op("PUT", "/auth/user/notifications/{notificationId}/see"),
    "deleteNotification": Op("PUT", "/auth/user/notifications/{notificationId}/hide"),
    "clearNotifications": Op("PUT", "/auth/user/notifications/clear"),
    "getNotificationV2s": Op("GET", "/notifications", ("limit",)),
    "getNotificationV2": Op("GET", "/notifications/{notificationId}"),
    "acknowledgeNotificationV2": Op("POST", "/notifications/{notificationId}/see"),
    "respondNotificationV2": Op("POST", "/notifications/{notificationId}/respond", (), ("responseType", "responseData")),
    "replyNotificationV2": Op("POST", "/notifications/{notificationId}/reply", (), ("responseType", "responseData", "message")),
    "deleteNotificationV2": Op("DELETE", "/notifications/{notificationId}"),
    "deleteAllNotificationV2s": Op("DELETE", "/notifications"),

    # ---------- Invites ----------
    "inviteUser": Op("POST", "/invite/{userId}", (), ("instanceId", "messageSlot")),
    "inviteUserWithPhoto": Op("POST", "/invite/{userId}/photo", (), ("instanceId", "messageSlot"), form="photo"),
    "requestInvite": Op("POST", "/requestInvite/{userId}", (), ("requestSlot",)),
    "requestInviteWithPhoto": Op("POST", "/requestInvite/{userId}/photo", (), ("requestSlot",), form="photo"),
    "respondInvite": Op("POST", "/invite/{notificationId}/response", (), ("responseSlot",)),
    "respondInviteWithPhoto": Op("POST", "/invite/{notificationId}/response/photo", (), ("responseSlot",), form="photo"),
    "inviteMyselfTo": Op("POST", "/invite/myself/to/{location}"),
    "getInviteMessages": Op("GET", "/message/{me}/{messageType}"),
    "getInviteMessage": Op("GET", "/message/{me}/{messageType}/{slot}"),
    "updateInviteMessage": Op("PUT", "/message/{me}/{messageType}/{slot}", (), ("message",)),
    "resetInviteMessage": Op("DELETE", "/message/{me}/{messageType}/{slot}"),

    # ---------- Worlds / instances ----------
    "searchWorlds": Op("GET", "/worlds", Q_LIST + ("user", "userId", "fuzzy", "noplatform")),
    "getActiveWorlds": Op("GET", "/worlds/active", Q_LIST),
    "getRecentWorlds": Op("GET", "/worlds/recent", Q_LIST),
    "getWorld": Op("GET", "/worlds/{worldId}"),
    "getWorldInstance": Op("GET", "/worlds/{worldId}/{instanceId}"),
    "getInstance": Op("GET", "/instances/{location}", users="users"),
    "getShortName": Op("GET", "/instances/{location}/shortName"),
    "getInstanceByShortName": Op("GET", "/instances/s/{shortName}"),
    "createInstance": Op("POST", "/instances", (), ("worldId", "type", "region", "ownerId", "canRequestInvite", "groupAccessType",
                                                    "roleIds", "queueEnabled", "ageGate", "inviteOnly", "displayName", "description",
                                                    "closedAt", "categoryId", "vibeIds", "instancePersistenceEnabled",
                                                    "playerPersistenceEnabled", "contentSettings", "calendarEntryId")),
    "closeInstance": Op("DELETE", "/instances/{location}", ("hardClose", "closedAt")),
    "getRecentLocations": Op("GET", "/instances/recent", Q_PAGE),
    "getInstanceCategories": Op("GET", "/instanceCategories"),
    "getInstanceVibes": Op("GET", "/instanceVibes"),

    # ---------- Avatars ----------
    "searchAvatars": Op("GET", "/avatars", Q_LIST + ("user",)),  # VRChat only allows user=me
    "getAvatar": Op("GET", "/avatars/{avatarId}"),
    "getOwnAvatar": Op("GET", "/users/{me}/avatar"),
    "selectAvatar": Op("PUT", "/avatars/{avatarId}/select"),
    "selectFallbackAvatar": Op("PUT", "/avatars/{avatarId}/selectFallback"),
    "updateAvatar": Op("PUT", "/avatars/{avatarId}", (), ("name", "description", "releaseStatus", "tags")),
    "getLicensedAvatars": Op("GET", "/avatars/licensed", Q_PAGE),
    "getAvatarStyles": Op("GET", "/avatarStyles"),

    # ---------- Groups (member) ----------
    "searchGroups": Op("GET", "/groups", ("query", "n", "offset")),
    "getGroup": Op("GET", "/groups/{groupId}", ("includeRoles", "purpose")),
    "joinGroup": Op("POST", "/groups/{groupId}/join", ("confirmOverrideBlock",), ("inviteId",)),
    "leaveGroup": Op("POST", "/groups/{groupId}/leave"),
    "blockGroup": Op("POST", "/groups/{groupId}/block"),
    "cancelGroupRequest": Op("DELETE", "/groups/{groupId}/requests"),
    "declineGroupInvite": Op("PUT", "/groups/{groupId}/invites", (), ("block",)),
    "getGroupAnnouncements": Op("GET", "/groups/{groupId}/announcement"),
    "getGroupPosts": Op("GET", "/groups/{groupId}/posts", Q_PAGE + ("publicOnly",)),
    "getGroupInstances": Op("GET", "/groups/{groupId}/instances"),
    "getGroupMembers": Op("GET", "/groups/{groupId}/members", Q_PAGE + ("sort", "roleId"), users="user"),
    "searchGroupMembers": Op("GET", "/groups/{groupId}/members/search", Q_PAGE + ("query",), users="user"),
    "getGroupMember": Op("GET", "/groups/{groupId}/members/{userId}"),
    "updateGroupMember": Op("PUT", "/groups/{groupId}/members/{userId}", (), ("visibility", "isSubscribedToAnnouncements",
                                                                            "isSubscribedToEventAnnouncements", "managerNotes")),
    "updateGroupRepresentation": Op("PUT", "/groups/{groupId}/representation", (), ("isRepresenting",)),
    "getGroupGalleryImages": Op("GET", "/groups/{groupId}/galleries/{groupGalleryId}", Q_PAGE + ("approved",)),
    "getGroupRoles": Op("GET", "/groups/{groupId}/roles"),
    "getGroupPermissions": Op("GET", "/groups/{groupId}/permissions"),

    # ---------- Groups (admin — VRChat checks permissions) ----------
    "updateGroup": Op("PUT", "/groups/{groupId}", (), ("name", "shortCode", "description", "joinState", "iconId", "bannerId",
                                                       "languages", "links", "rules", "tags")),
    "createGroupAnnouncement": Op("POST", "/groups/{groupId}/announcement", (), ("title", "text", "imageId", "sendNotification")),
    "deleteGroupAnnouncement": Op("DELETE", "/groups/{groupId}/announcement"),
    "addGroupPost": Op("POST", "/groups/{groupId}/posts", (), POST_FIELDS),
    "updateGroupPost": Op("PUT", "/groups/{groupId}/posts/{notificationId}", (), POST_FIELDS),
    "deleteGroupPost": Op("DELETE", "/groups/{groupId}/posts/{notificationId}"),
    "getGroupAuditLogs": Op("GET", "/groups/{groupId}/auditLogs", Q_PAGE + ("startDate", "endDate", "actorIds", "eventTypes", "targetIds")),
    "getGroupAuditLogEntryTypes": Op("GET", "/groups/{groupId}/auditLogTypes"),
    "getGroupBans": Op("GET", "/groups/{groupId}/bans", Q_PAGE, users="user"),
    "banGroupMember": Op("POST", "/groups/{groupId}/bans", (), ("userId",)),
    "unbanGroupMember": Op("DELETE", "/groups/{groupId}/bans/{userId}"),
    "kickGroupMember": Op("DELETE", "/groups/{groupId}/members/{userId}"),
    "addGroupMemberRole": Op("PUT", "/groups/{groupId}/members/{userId}/roles/{groupRoleId}"),
    "removeGroupMemberRole": Op("DELETE", "/groups/{groupId}/members/{userId}/roles/{groupRoleId}"),
    "getGroupRequests": Op("GET", "/groups/{groupId}/requests", Q_PAGE + ("blocked",), users="user"),
    "respondGroupJoinRequest": Op("PUT", "/groups/{groupId}/requests/{userId}", (), ("action", "block")),
    "getGroupInvites": Op("GET", "/groups/{groupId}/invites", Q_PAGE, users="user"),
    "createGroupInvite": Op("POST", "/groups/{groupId}/invites", (), ("userId", "confirmOverrideBlock")),
    "deleteGroupInvite": Op("DELETE", "/groups/{groupId}/invites/{userId}"),
    "createGroupRole": Op("POST", "/groups/{groupId}/roles", (), ("name", "description", "isSelfAssignable", "permissions")),
    "updateGroupRole": Op("PUT", "/groups/{groupId}/roles/{groupRoleId}", (), ("name", "description", "isSelfAssignable", "permissions", "order")),
    "deleteGroupRole": Op("DELETE", "/groups/{groupId}/roles/{groupRoleId}"),
    "createGroupGallery": Op("POST", "/groups/{groupId}/galleries", (), GALLERY_FIELDS),
    "updateGroupGallery": Op("PUT", "/groups/{groupId}/galleries/{groupGalleryId}", (), GALLERY_FIELDS),
    "deleteGroupGallery": Op("DELETE", "/groups/{groupId}/galleries/{groupGalleryId}"),
    "addGroupGalleryImage": Op("POST", "/groups/{groupId}/galleries/{groupGalleryId}/images", (), ("fileId",)),
    "deleteGroupGalleryImage": Op("DELETE", "/groups/{groupId}/galleries/{groupGalleryId}/images/{groupGalleryImageId}"),

    # ---------- Event calendar ----------
    "getCalendarEvents": Op("GET", "/calendar", Q_PAGE + ("date",)),
    "getFeaturedCalendarEvents": Op("GET", "/calendar/featured", Q_PAGE + ("date",)),
    "getFollowedCalendarEvents": Op("GET", "/calendar/following", Q_PAGE + ("date",)),
    "discoverCalendarEvents": Op("GET", "/calendar/discover", ("scope", "categories", "tags", "featuredResults", "nonFeaturedResults",
                                                               "personalizedResults", "minimumInterestCount", "minimumRemainingMinutes",
                                                               "upcomingOffsetMinutes", "n", "nextCursor")),
    "searchCalendarEvents": Op("GET", "/calendar/search", Q_PAGE + ("searchTerm", "utcOffset")),
    "getGroupCalendarEvents": Op("GET", "/calendar/{groupId}", Q_PAGE + ("date",)),
    "getGroupNextCalendarEvent": Op("GET", "/calendar/{groupId}/next"),
    "getGroupCalendarEvent": Op("GET", "/calendar/{groupId}/{calendarId}"),
    "getGroupCalendarEventICS": Op("GET", "/calendar/{groupId}/{calendarId}.ics"),
    "followGroupCalendarEvent": Op("POST", "/calendar/{groupId}/{calendarId}/follow", (), ("isFollowing",)),
    "createGroupCalendarEvent": Op("POST", "/calendar/{groupId}/event", (), EVENT_FIELDS),
    "updateGroupCalendarEvent": Op("PUT", "/calendar/{groupId}/{calendarId}/event", (), EVENT_FIELDS),
    "deleteGroupCalendarEvent": Op("DELETE", "/calendar/{groupId}/{calendarId}"),

    # ---------- Inventory / files / prints ----------
    "getInventory": Op("GET", "/inventory", Q_PAGE + ("holderId", "equipSlot", "order", "tags", "types", "flags", "notTypes",
                                                      "notFlags", "archived", "seen")),
    "getOwnInventoryItem": Op("GET", "/inventory/{inventoryItemId}"),
    "updateOwnInventoryItem": Op("PUT", "/inventory/{inventoryItemId}", (), ("isArchived", "isSeen")),
    "deleteOwnInventoryItem": Op("DELETE", "/inventory/{inventoryItemId}"),
    "consumeOwnInventoryItem": Op("PUT", "/inventory/{inventoryItemId}/consume"),
    "equipOwnInventoryItem": Op("PUT", "/inventory/{inventoryItemId}/equip", (), ("equipSlot",)),
    "unequipOwnInventorySlot": Op("DELETE", "/inventory/{inventoryItemId}/equip"),
    "getInventoryCollections": Op("GET", "/inventory/collections"),
    "getInventoryDrops": Op("GET", "/inventory/drops", ("active",)),
    "getInventoryTemplate": Op("GET", "/inventory/template/{inventoryTemplateId}"),
    "getCosmeticIndex": Op("GET", "/cosmetics/index/{itemType}"),
    "getUserInventoryItem": Op("GET", "/user/{userId}/inventory/{inventoryItemId}"),
    "redeemReward": Op("POST", "/reward/redeem", (), ("code",)),
    "shareInventoryItemDirect": Op("POST", "/inventory/cloning/direct", ("itemId", "duration"), ("itemId", "users")),
    "getFiles": Op("GET", "/files", Q_PAGE + ("tag",)),
    "getFile": Op("GET", "/file/{fileId}"),
    "deleteFile": Op("DELETE", "/file/{fileId}"),
    "uploadIcon": Op("POST", "/icon", form="icon"),
    "getFileAnalysis": Op("GET", "/analysis/{fileId}/{versionId}"),
    "getFileAnalysisStandard": Op("GET", "/analysis/{fileId}/{versionId}/standard"),
    "getFileAnalysisSecurity": Op("GET", "/analysis/{fileId}/{versionId}/security"),
    "getUserPrints": Op("GET", "/prints/user/{me}"),
    "getPrint": Op("GET", "/prints/{printId}"),
    "uploadPrint": Op("POST", "/prints", (), ("note", "timestamp", "worldId", "worldName"), form="print"),
    "editPrint": Op("POST", "/prints/{printId}", (), ("note",), form="print"),
    "deletePrint": Op("DELETE", "/prints/{printId}"),
    "listProps": Op("GET", "/props", Q_PAGE + ("authorId",)),
    "getProp": Op("GET", "/props/{propId}"),

    # ---------- Store / subscriptions (read-only) ----------
    "getBalance": Op("GET", "/user/{me}/balance"),
    "getCurrentSubscriptions": Op("GET", "/auth/user/subscription"),
    "getRecentSubscription": Op("GET", "/user/subscription/recent"),
    "getSubscriptions": Op("GET", "/subscriptions"),
    "getActiveLicenses": Op("GET", "/economy/licenses/active"),
    "getLicenseGroup": Op("GET", "/licenseGroups/{licenseGroupId}"),
    "getProductPurchases": Op("GET", "/economy/purchases", Q_PAGE + ("buyerId", "receiverId", "mostRecent", "sort", "order", "active")),
    "getProductPurchaseHistory": Op("GET", "/user/{me}/economy/transactions", ("n", "dateMin", "dateMax", "sort", "order")),
    "getStore": Op("GET", "/economy/store", ("storeId", "hydrateListings", "hydrateProducts")),
    "getStoreShelves": Op("GET", "/economy/store/shelves", ("storeId", "hydrateListings")),
    "listStores": Op("GET", "/economy/stores", Q_PAGE + ("sellerId",)),
    "getProductListing": Op("GET", "/listing/{productId}", ("hydrate",)),
    "getProductListings": Op("GET", "/user/{userId}/listings", Q_PAGE + ("hydrate", "active")),

    # ---------- Misc ----------
    "getJams": Op("GET", "/jams", ("type",)),
    "getJam": Op("GET", "/jams/{jamId}"),
    "getJamSubmissions": Op("GET", "/jams/{jamId}/submissions", ("contentId", "submitterId")),
    "getCurrentOnlineUsers": Op("GET", "/visits"),
    "getInfoPush": Op("GET", "/infoPush", ("require", "include")),
    "getHealth": Op("GET", "/health"),
    "getConfig": Op("GET", "/config"),  # Used to read the max number of emoji/stickers
}

ID_RE = re.compile(r"^[\w\-:~().,]{1,200}$")
LOCATION_RE = re.compile(r"^wrld_[\w-]+:[\w~().,-]+$")
MESSAGE_TYPES = ("message", "response", "request", "requestResponse")


class OpError(Exception):
    pass


def _path(op, params, me):
    def fill(m):
        key = m[1]
        if key == "me":
            if not me:
                raise OpError("not logged in")
            return me
        v = str(params.pop(key, ""))
        if key == "location" and not LOCATION_RE.match(v):
            raise OpError("bad location")
        if key == "messageType" and v not in MESSAGE_TYPES:
            raise OpError("bad messageType")
        if not ID_RE.match(v):
            raise OpError(f"bad {key}")
        return urllib.parse.quote(v, safe=":~()_-.,")
    return re.sub(r"\{(\w+)\}", fill, op.path)


def _qs(value):
    if isinstance(value, bool):
        return "true" if value else "false"
    return value


def _multipart(fields, files):
    boundary = "----vrclog" + base64.urlsafe_b64encode(time.time_ns().to_bytes(8, "big")).decode().rstrip("=")
    parts = []
    for k, v in fields.items():
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    for k, png in files.items():
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"; filename="image.png"\r\n'
                     f'Content-Type: image/png\r\n\r\n'.encode() + png + b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"


def call(client, name, params=None, raw=False):
    """Call an endpoint by name — params hold path/query/body in one dict ("_all": True = load every page)
    Returns the API's JSON (raw=True returns (bytes, content-type))"""
    op = OPS.get(name)
    if not op:
        raise OpError(f"unknown op {name}")
    params = dict(params or {})
    fetch_all = params.pop("_all", False)
    image = params.pop("_image", None)  # Base64 PNG for endpoints that upload an image
    path = _path(op, params, (client.user or {}).get("id"))
    query = {k: _qs(params[k]) for k in op.query if k in params and params[k] is not None}
    body = {k: params[k] for k in op.body if k in params}

    if op.form:
        if not image:
            raise OpError("image required")
        png = base64.b64decode(image.split(",", 1)[-1])
        if op.form == "icon":
            fields, files = {}, {"file": png}
        elif op.form == "print":
            fields, files = {k: str(v) for k, v in body.items()}, {"image": png}
        else:  # Invite with an image: the body is sent as JSON in the "data" field
            fields, files = {"data": json.dumps(body)}, {"image": png}
        data, ctype = _multipart(fields, files)
        url = path + ("?" + urllib.parse.urlencode(query) if query else "")
        return client._request(op.method, url, data=data, headers={"Content-Type": ctype}, timeout=120)

    def get(q):
        url = path + ("?" + urllib.parse.urlencode(q, doseq=True) if q else "")
        return client._request(op.method, url, body=body if op.method != "GET" and (body or op.body) else None, raw=raw)

    if not (fetch_all and "n" in op.query and "offset" in op.query):
        return get(query)
    out, offset = [], int(query.get("offset", 0) or 0)
    while len(out) < 2000:
        page = get({**query, "n": 100, "offset": offset})
        # Some endpoints return {data: [...]} or {results: [...]} instead of a list
        items = page if isinstance(page, list) else (page.get("data") or page.get("results") or []) if isinstance(page, dict) else []
        out.extend(items)
        if len(items) < 100:
            break
        offset += 100
    return out


def users_in(op_name, result):
    """Pull user objects from a result (for the profile image cache)"""
    kind = OPS[op_name].users
    if not kind or result is None:
        return []
    if kind == "users":
        items = (result or {}).get("users") or [] if isinstance(result, dict) else []
        return [u for u in items if isinstance(u, dict) and u.get("id")]
    items = result if isinstance(result, list) else []
    if kind == "list":
        return [u for u in items if isinstance(u, dict) and u.get("id")]
    key = "targetUser" if kind == "target" else "user"
    return [x[key] for x in items if isinstance(x, dict) and isinstance(x.get(key), dict) and x[key].get("id")]
