<p align="center"><img src="docs/icon.png" width="112" alt="VRC Nook"></p>

<h1 align="center">VRC Nook</h1>

<p align="center">A cozy all-in-one VRChat companion for Windows: friends, game log, in-game chatbox, a VR-friendly keyboard and an animated emoji maker.</p>

<p align="center">
<b>English</b> · <a href="README.th.md">ไทย</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.ru.md">Русский</a> · <a href="README.vi.md">Tiếng Việt</a> · <a href="README.zh.md">中文</a>
</p>

---

## Download

Grab `VRCNook.exe` from the [latest release](https://github.com/iriewiew/vrc-nook/releases/latest) and run it. There's no installer.
Put it in a folder you can write to, such as Documents. Don't use Program Files, because the app updates itself in place.

**Requirements:** Windows 10/11 with Microsoft Edge WebView2 (already included in Windows 11).

## Features

### Friends & social
- **Real-time friends list** over VRChat's WebSocket. Friends are grouped into: in a public world, in a private world, online on the web, and offline.
- **Views:** switch between views and see when each friend was last online.
- **Profile cards:** banner, profile frame, badges, bio, links, mutual friends, and name history.
  - Personal notes sync with VRChat.
  - Actions: invite, request invite, Boop with emoji, favorite, block or mute.
- **Feed:** friends' status, location, avatar and display-name changes.
- **Notifications:** invites, friend requests and group notifications. Reply with preset messages (with an image if you have VRC+).
- **Windows notifications** and a system tray icon. Optionally start with Windows.

### Game log
- **Live VRChat log reader:** worlds joined, players joining and leaving, videos, screenshots, stickers, disconnects and more.
- **Filters:** choose which event types to show.
- **Permanent history:** stored in a local SQLite database. VRChat deletes its own old logs, but VRC Nook keeps them.
- **World history:** every world and instance you visited, with the players you met.

### VRChat content
- **Worlds and instances:** browse worlds, create instances, open a world in VRChat, view the world store.
- **Favorites:** friends, worlds and avatars.
- **Events:** VRChat's event calendar and Jams.
- **Groups:** browse and manage groups, including members, invites, requests, bans and group instances.
- **Avatars:**
  - Switch avatars and see file size and performance per platform.
  - Public avatar search through avtrdb.com.
- **Inventory:** VRC+ icons, photos, prints, emoji, stickers and props.
- **Search:** users, worlds, groups and events. You can also paste a link or ID.
- **My account:** edit your bio, links and status. Manage blocks and mutes.

### Animated emoji maker
- **Input:** an animated GIF, an animated WebP, or several images (one frame each).
- **Editing:**
  - Pick a frame range and frame count.
  - Remove a background with chroma key (click the preview to pick a color).
- **Output:** builds VRChat's 1024×1024 sprite sheet automatically.
- **Preview:** see how each animation style looks in VRChat (official previews), then upload directly.

### In-game Chatbox (OSC)
- **Chat page:** type in the app and the text appears in your in-game Chatbox, with send history.
- **Indicators:** shows the "typing…" bubble in game while you type. The notification sound is optional.

### On-screen keyboard for VR
- **Built for VR:** big keys, resizable, with copy, paste and select-all.
- **Pop-out floating keyboard:**
  - Stays on top of every window and never steals focus.
  - **In-game chat mode:** sends to the Chatbox.
  - **Global keyboard mode:** types into any Windows app, with task view.
- **Layouts:** Thai, English, Japanese hiragana and katakana, Korean, Russian, Vietnamese, Chinese Pinyin, and emoji.
  - Korean syllables are composed automatically.
  - Vietnamese and Pinyin use tone keys.
- **Settings:** choose which layouts the language key cycles through.

### Personalize
- **7 app languages:** ไทย, English, 日本語, 한국어, Русский, Tiếng Việt, 中文.
- **Themes:** light and dark themes, plus custom gradient colors.
- **Fonts:** Noto Sans Thai and other Google Fonts. You can also change the font size.
- **Window:** stay on top, minimize to tray.

### Updates
- **Automatic checks:** VRC Nook checks GitHub Releases at startup and can update itself in one click.
- **Verification:** downloads only come from this repository, and the file's SHA-256 must match before it's installed.

## Privacy & security

- **Your password is never stored.** It goes straight to VRChat.
  - Only the session cookie is kept, encrypted with Windows DPAPI so only your Windows account can read it.
- **The login cookie goes to `api.vrchat.cloud` only.** It's stripped from any redirect to another host.
- **Everything stays on your PC** in `%APPDATA%\VRCNook`:
  - settings
  - the game log database
  - notes and chat history
  - the image cache
- **Other connections:**
  - [avtrdb.com](https://avtrdb.com): only when you search public avatars, and only the search text is sent.
  - Google Fonts: only when you pick a web font.
  - `assets.vrchat.com`: effect previews.
  - `api.github.com`: update checks.

## Data folder

```
%APPDATA%\VRCNook\
├─ session.bin     encrypted login session
├─ settings.json   app settings
├─ data.db         game log, feed, notes, name history, chat history (SQLite)
├─ debug.log       error log
└─ cache\          images and profile data (safe to delete)
```

## Build from source

```powershell
pip install -r requirements.txt
python vrclog_mac.py          # run
.\build.ps1                   # build dist\VRCNook.exe
```

| File | Purpose |
|---|---|
| `vrclog_mac.py` | Entry point: window, Python ↔ JS API, log pump |
| `vrclog_ui.html`, `vrclog_more.js` | The UI (HTML/CSS/JS) |
| `i18n_extra.js` | Korean / Russian / Vietnamese / Chinese UI text |
| `kb_layouts.js`, `kb_float.html` | Keyboard layouts and the floating keyboard |
| `vrc_api.py`, `vrc_ops.py` | VRChat API client, endpoint allow-list, image cache |
| `social.py` | Real-time friends pipeline and feed |
| `store.py` | SQLite storage |
| `vrclog.py` | VRChat log parser (also works as a CLI) |
| `osc.py`, `vkbd.py` | OSC Chatbox and Windows virtual keyboard |
| `tray.py`, `updater.py` | Tray icon, autostart, self-update |

## Credits

- Made by **iriewiew**
- Icons: [Lucide](https://lucide.dev) (ISC License)
- Animated emoji idea: [VRCEmoji](https://github.com/Wakamu/VRCEmoji) by Wakamu
- API reference: [vrchat.community](https://vrchat.community)
- Inspired by [VRCX](https://github.com/vrcx-team/VRCX)

> VRC Nook is a fan-made tool and is not affiliated with or endorsed by VRChat Inc.
> It uses the VRChat API, which is not officially supported for third-party apps. Use it at your own risk and follow VRChat's Terms of Service.
