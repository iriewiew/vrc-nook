// ======================= v4: features from the VRChat API (vrchat.community) =======================
// This file is injected at the end of vrclog_ui.html — every endpoint goes through Api.vrc (allow-list in vrc_ops.py)
// Buttons that change the account or send anything to others only run when the user clicks them

// × close button (used in every window header)
function xBtn(fn, cls = "") { return `<button class="icon-btn xclose ${cls}" title="${t("close")}" onclick="${fn}">${icon("x")}</button>`; }

// ---------- 3-language strings: key: [Thai, English, 日本語] ----------
function tx(table) {
  for (const [k, [th, en, ja]] of Object.entries(table)) { I18N.th[k] = th; I18N.en[k] = en; I18N.ja[k] = ja ?? en; }
}
tx({
  nav_worlds: ["โลก", "Worlds", "ワールド"], nav_favorites: ["รายการโปรด", "Favorites", "お気に入り"],
  nav_events: ["อีเวนต์", "Events", "イベント"], nav_safety: ["บล็อก / ปิดเสียง", "Blocks & Mutes", "ブロック・ミュート"],
  nav_account: ["บัญชีของฉัน", "My Account", "マイアカウント"],
  optional: ["ไม่บังคับ", "Optional", "任意"], save: ["บันทึก", "Save", "保存"], saved: ["บันทึกแล้ว", "Saved", "保存しました"],
  cancel: ["ยกเลิก", "Cancel", "キャンセル"], done: ["เรียบร้อย", "Done", "完了しました"], remove: ["นำออก", "Remove", "削除"],
  edit: ["แก้ไข", "Edit", "編集"], create: ["สร้าง", "Create", "作成"], more: ["เพิ่มเติม", "More", "もっと見る"],
  loadMore: ["โหลดเพิ่ม", "Load more", "さらに読み込む"], none: ["ไม่มี", "None", "なし"], view: ["ดู", "View", "表示"],
  title: ["หัวข้อ", "Title", "タイトル"], text: ["ข้อความ", "Text", "本文"], desc: ["คำอธิบาย", "Description", "説明"],
  name: ["ชื่อ", "Name", "名前"], notify: ["ส่งแจ้งเตือน", "Send notification", "通知を送る"],
  visibility: ["การมองเห็น", "Visibility", "公開範囲"], start: ["เริ่ม", "Starts", "開始"], end: ["จบ", "Ends", "終了"],
  people2: [n => `${n} คน`, n => `${n} people`, n => `${n} 人`], online2: ["ออนไลน์", "Online", "オンライン"],
  vrcOnline: [n => `VRChat ออนไลน์ ${n} คน`, n => `${n} online in VRChat`, n => `VRChat オンライン ${n} 人`],
  copyLink: ["คัดลอกลิงก์", "Copy link", "リンクをコピー"], linkCopied: ["คัดลอกลิงก์แล้ว", "Link copied", "リンクをコピーしました"],
  pickImage: ["เลือกรูป", "Choose image", "画像を選択"], imagePicked: ["เลือกรูปแล้ว", "Image selected", "画像を選択しました"],
  fav_title: ["เพิ่มในรายการโปรด", "Add to favorites", "お気に入りに追加"], fav_added: ["เพิ่มในรายการโปรดแล้ว", "Added to favorites", "お気に入りに追加しました"],
  fav_removed: ["นำออกจากรายการโปรดแล้ว", "Removed from favorites", "お気に入りから削除しました"], fav_remove: ["นำออกจากรายการโปรด", "Remove from favorites", "お気に入りから削除"],
  fav_full: ["กลุ่มนี้เต็มแล้ว", "This group is full", "このグループは満杯です"],
  mod_added: ["ตั้งค่าแล้ว", "Applied", "設定しました"], mod_removed: ["ยกเลิกแล้ว", "Removed", "解除しました"],
  m_block: ["บล็อก", "Block", "ブロック"], m_mute: ["ปิดเสียง", "Mute", "ミュート"], m_hideAvatar: ["ซ่อนอวตาร", "Hide avatar", "アバター非表示"],
  m_showAvatar: ["แสดงอวตารเสมอ", "Always show avatar", "アバターを常に表示"], m_interactOff: ["ปิดการโต้ตอบ", "Interaction off", "インタラクションオフ"],
  m_muteChat: ["ปิดแชท", "Mute chat", "チャットミュート"], m_unmute: ["เปิดเสียงเสมอ", "Unmute", "ミュート解除"],
  m_interactOn: ["เปิดการโต้ตอบ", "Interaction on", "インタラクションオン"], m_unmuteChat: ["เปิดแชท", "Unmute chat", "チャットミュート解除"],
  m_avatarBlock: ["บล็อกอวตารนี้ทุกที่", "Block this avatar everywhere", "このアバターを全体でブロック"],
  newNotifV2: [s => `แจ้งเตือน: ${s}`, s => `Notification: ${s}`, s => `通知: ${s}`],
  queueReady: ["ถึงคิวเข้าห้องแล้ว", "Your instance queue is ready", "インスタンスの順番が来ました"],
});

// ---------- API calls ----------
async function vrc(op, params = {}) { return (await api("vrc", op, params)) || { error: 0 }; }
// Call and report the result — returns the result (or true) on success, undefined on error
async function vrcDo(op, params, okKey) {
  const r = await vrc(op, params);
  if ("error" in r) { apiError(r); return undefined; }
  if (okKey) toast(t(okKey));
  return r.ok ?? true;
}
const myLoc = () => lastBatch?.location || "";
function fmtIso(s, dateOnly) {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d) ? String(s) : d.toLocaleString(S.lang, dateOnly ? { dateStyle: "medium" } : { dateStyle: "medium", timeStyle: "short" });
}
function fmtBytes(n) {
  if (!n && n !== 0) return "";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (n >= 1024 && i < 3) { n /= 1024; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${u[i]}`;
}
const imgUrl = x => x?.thumbnailImageUrl || x?.imageUrl || x?.iconUrl || "";

// Generic data cache: key -> {data, loading, error}
const CACHE = {};
async function load(key, fn, force) {
  const c = CACHE[key] ||= {};
  if ((c.data !== undefined || c.loading) && !force) return c;
  c.loading = true;
  c.error = null;
  repaint();
  const r = await fn();
  c.loading = false;
  if (r && typeof r === "object" && "error" in r) c.error = r;
  else c.data = r && typeof r === "object" && "ok" in r ? r.ok : r;
  repaint();
  return c;
}
const loadOp = (key, op, params, force) => load(key, () => vrc(op, params), force);
const got = key => CACHE[key]?.data;
function dropCache(prefix) { for (const k in CACHE) if (k.startsWith(prefix)) delete CACHE[k]; }
// Redraw the current page and any open card/window (skipped while typing in a field)
let repaintTimer = 0;
function repaint() {
  clearTimeout(repaintTimer);
  repaintTimer = setTimeout(() => {
    renderView();
    const a = document.activeElement;
    const typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== "checkbox";
    if (typing && a.closest(".overlay")) return;
    if (profileOpen) buildProfile(); else if (worldOpen) buildWorld(); else if (groupOpen) buildGroup(); else if (avatarOpen) buildAvatar();
    if (X) buildX();
  }, 30);
}
// Status block (loading / error / empty) — returns "" when data is ready to show
function stateHtml(c, emptyKey = "noResults", h = 120) {
  const box = msg => `<div class="empty-state" style="height:${h}px">${msg}</div>`;
  if (!c || c.loading) return box(t("loading"));
  if (c.error) return box(c.error.error === 403 ? t("noPermission") : `${t("errGeneric")}${c.error.message ? " — " + esc(c.error.message) : ""}`);
  const d = c.data;
  if (d == null || (Array.isArray(d) && !d.length)) return box(t(emptyKey));
  return "";
}
tx({ noPermission: ["ไม่มีสิทธิ์ดูข้อมูลนี้", "You don't have permission to view this", "これを表示する権限がありません"] });

// ---------- Secondary window (sheet) for forms / details ----------
document.body.insertAdjacentHTML("beforeend", `<div class="overlay" id="xOverlay" onmousedown="if(event.target===this)closeX()">
  <div class="sheet" id="xsheet"></div></div>`);
let X = null;  // {title, render(): html, after(): void, wide}
function openX(title, render, after, wide) { X = { title, render, after, wide }; buildX(); $("xOverlay").classList.add("show"); }
function buildX() {
  if (!X) return;
  const el = $("xsheet"), body = el.querySelector(".sheet-body"), scroll = body?.scrollTop || 0;
  el.classList.toggle("wide", !!X.wide);
  el.innerHTML = `<div class="sheet-head"><h1>${esc(X.title)}</h1>${xBtn("closeX()")}</div>
    <div class="sheet-body">${X.render()}</div>`;
  el.querySelector(".sheet-body").scrollTop = scroll;
  X.after?.();
}
function closeX() { X = null; $("xOverlay").classList.remove("show"); }

// Escape for attribute values (esc() doesn't escape quotes)
const escA = s => esc(s).replace(/"/g, "&quot;");
// Form fields
const fv = id => { const el = $(id); return !el ? undefined : el.type === "checkbox" ? el.checked : el.value.trim(); };
const fRow = (label, control, hint) => `<div class="fmrow"><div class="flbl">${label}${hint ? `<small>${hint}</small>` : ""}</div><div class="fctl">${control}</div></div>`;
const fInput = (id, value = "", attrs = "") => `<input class="field" id="${id}" value="${escA(value ?? "")}" spellcheck="false" ${attrs}>`;
const fArea = (id, value = "", rows = 4) => `<textarea class="field" id="${id}" rows="${rows}">${esc(value ?? "")}</textarea>`;
const fSelect = (id, opts, value) => `<select class="field" id="${id}">${Object.entries(opts).map(([v, l]) =>
  `<option value="${esc(v)}" ${String(value ?? "") === v ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
const fCheck = (id, on) => `<label class="switch"><input type="checkbox" id="${id}" ${on ? "checked" : ""}></label>`;
const btn = (label, onclick, cls = "", ic = "") => `<button class="btn ${cls}" onclick="${esc(onclick)}">${ic ? icon(ic) : ""}${label}</button>`;
const tabsHtml = (tabs, cur, setter) => `<div class="segmented scroll-x">${Object.entries(tabs).map(([k, label]) =>
  `<button class="${cur === k ? "on" : ""}" onclick="${setter}('${k}')">${label}</button>`).join("")}</div>`;

// Pick an image from disk → PNG base64 (scaled to at most max, square = fit into a square with contain)
function pickImage(max = 2048, square = false) {
  return new Promise(resolve => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.onchange = async () => resolve(inp.files[0] ? await toPng(inp.files[0], max, square) : null);
    inp.click();
  });
}
async function toPng(file, max, square) {
  const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = URL.createObjectURL(file); }).catch(() => null);
  if (!img) { toast(t("errGeneric")); return null; }
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  let w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
  if (square) w = h = Math.max(w, h);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const dw = img.naturalWidth * k, dh = img.naturalHeight * k;
  c.getContext("2d").drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return c.toDataURL("image/png");
}

// Generic list row: image (user or thumbnail) + name + details + buttons
function lrow({ uid, name, thumb, sub, acts = "", onclick = "", cls = "" }) {
  const pic = uid ? `<span class="slot" data-uid="${esc(uid)}" data-name="${escA(name || "")}"></span>`
    : `<span class="lthumb" ${thumbAttr(thumb)}></span>`;
  return `<div class="lrow ${cls}" ${onclick ? `onclick="${esc(onclick)}"` : ""}>${pic}<div class="info"><div class="nm">${esc(name || "")}</div>
    ${sub ? `<div class="sub">${sub}</div>` : ""}</div>${acts ? `<div class="acts" onclick="event.stopPropagation()">${acts}</div>` : ""}</div>`;
}
// Replace .slot with the real profile picture (call after inserting the HTML)
function fillSlots(root) {
  root?.querySelectorAll(".slot[data-uid]").forEach(s => s.replaceWith(makeAvatar(s.dataset.uid, s.dataset.name || "?")));
}
const _buildX = buildX;
buildX = function () { _buildX(); fillSlots($("xsheet")); };
function userLink(uid, name) { return `<span class="link" onclick="event.stopPropagation();showProfile('${esc(uid)}','${esc((name || "").replace(/'/g, ""))}')">${esc(name || uid)}</span>`; }

// ---------- Extra CSS ----------
document.head.insertAdjacentHTML("beforeend", `<style>
.sheet.wide { width: min(760px, calc(100% - 40px)); }
.fmrow { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 12px; align-items: center; padding: 8px 2px; }
.fmrow + .fmrow { border-top: 1px solid var(--sep); }
.flbl { font-size: 12.5px; font-weight: 600; }
.flbl small { display: block; font-weight: 400; color: var(--text3); font-size: 11px; margin-top: 2px; }
.fctl { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; min-width: 0; }
.fctl .field { flex: 1; min-width: 0; }
textarea.field { resize: vertical; font: 13px var(--font); }
select.field { padding: 7px 10px; }
select.field option { background: var(--sheet); color: var(--text); }
.form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; flex-wrap: wrap; }
.btn { display: inline-flex; align-items: center; gap: 6px; }
.btn svg { width: 13px; height: 13px; }
.btn.sm { padding: 3px 11px; font-size: 11.5px; }
.btn:disabled { opacity: .5; }
.segmented.scroll-x { overflow-x: auto; scrollbar-width: none; max-width: 100%; }
.segmented.scroll-x::-webkit-scrollbar { display: none; }
.segmented.scroll-x button { flex: 0 0 auto; }
.lrow { display: flex; gap: 10px; align-items: center; padding: 8px 10px; border-radius: 12px; background: var(--card); border: 1px solid var(--sep); min-width: 0; }
.lrow + .lrow { margin-top: 6px; }
.lrow[onclick] { cursor: pointer; }
.lrow[onclick]:hover { background: var(--hover); }
.lrow .avatar { width: 34px; height: 34px; font-size: 13px; flex-shrink: 0; }
.lrow .lthumb { width: 46px; height: 34px; border-radius: 8px; background: var(--track) center/cover; flex-shrink: 0; }
.lrow .info { flex: 1; min-width: 0; text-align: left; }
.lrow .nm { font-weight: 600; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lrow .sub { font-size: 11.5px; color: var(--text2); overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; white-space: pre-line; }
.lrow .acts { display: flex; gap: 5px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
.lrow.dim { opacity: .55; }
.pcard.xwide { width: min(780px, calc(100vw / var(--z, 1) - 40px)); }
.pcard-actions.wrap { flex-wrap: wrap; margin-top: 8px; }
.pact { display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap; margin: 14px 0 4px; }
.pact .btn { padding: 7px 15px; }
.btn.icon-only { padding: 7px 10px; }
.pact .badge svg { width: 11px; height: 11px; vertical-align: -1px; }
.pstats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; }
.pstat { padding: 10px 12px; border-radius: 12px; background: var(--card); border: 1px solid var(--sep); min-width: 0; }
.phead { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; font-size: 12.5px; }
.phead .perf { margin-left: auto; font-size: 12px; }
.pstat .kv { font-size: 11.5px; }
.mwrap { position: relative; }
.menu { position: absolute; right: 0; top: calc(100% + 6px); min-width: 210px; padding: 5px; border-radius: 14px; z-index: 10; display: none; text-align: left;
        background: var(--sheet); backdrop-filter: blur(30px) saturate(180%); border: 1px solid var(--stroke); box-shadow: 0 12px 34px rgba(0,0,0,.4); }
.menu.open { display: block; }
.menu.floating { position: fixed; right: auto; z-index: 200; max-height: calc(100vh / var(--z, 1) - 16px); overflow-y: auto; }
.mi { display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 10px; border: none; border-radius: 9px; background: none;
      color: var(--text); font: 500 12.5px var(--font); text-align: left; cursor: pointer; }
.mi:hover { background: var(--hover); }
.mi svg { width: 15px; height: 15px; color: var(--text2); flex-shrink: 0; }
.mi.danger, .mi.danger svg { color: var(--red); }
.mi.armed { background: var(--red); color: #fff; }
#filterArea { display: none !important; }
.set-tabs { padding: 0 20px 8px; display: flex; }
.set-tabs .segmented { flex: 1; }
.set-tabs .segmented button { flex: 1; }
.set-card { padding: 4px 6px; }
.kbs-tile { font: 600 11px var(--font); color: #fff; letter-spacing: -.3px; overflow: hidden; }
.toggle-row .label .hint { display: block; font-size: 11px; color: var(--text2); font-weight: 400; margin-top: 1px; }
.note-line { display: flex; gap: 6px; align-items: flex-start; font-size: 11.5px; color: var(--text2); padding: 6px 6px 0; }
.note-line svg { width: 13px; height: 13px; flex-shrink: 0; margin-top: 2px; }
.pcard-actions.wrap .btn { padding: 5px 12px; font-size: 12px; }
.ptabs { margin: 14px 0 4px; display: flex; justify-content: center; }
.ptab-body { text-align: left; margin-top: 10px; }
.kv { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 4px 14px; font-size: 12px; text-align: left; }
.kv > :nth-child(odd) { color: var(--text3); }
.kv > :nth-child(even) { overflow-wrap: anywhere; }
.opt-list { display: grid; gap: 6px; }
.opt { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--sep); background: var(--card);
       color: var(--text); font: 500 13px var(--font); text-align: left; }
.opt:hover { background: var(--hover); }
.opt.on { outline: 2px solid var(--accent); outline-offset: -2px; }
.opt b { flex: 1; }
.opt span { color: var(--text3); font-size: 11.5px; }
.opt svg { width: 15px; height: 15px; color: var(--text2); }
.btn.star.on { color: #ffcc00; }
.btn.star.on svg { fill: #ffcc00; }
.ecard .when { font-size: 11.5px; color: var(--accent); font-weight: 600; }
.ecard .wimg { aspect-ratio: 16 / 9; }
.ecard .live-tag { position: absolute; left: 8px; top: 8px; background: var(--red); color: #fff; font-size: 10px; font-weight: 800; padding: 1px 7px; border-radius: 99px; }
.post { padding: 10px 12px; border-radius: 12px; background: var(--card); border: 1px solid var(--sep); text-align: left; }
.post + .post { margin-top: 8px; }
.post h4 { margin: 0 0 4px; font-size: 13px; }
.post .meta { font-size: 11px; color: var(--text3); margin-bottom: 6px; display: flex; gap: 8px; align-items: center; }
.post .meta .acts { margin-left: auto; display: flex; gap: 4px; }
.post .txt { font-size: 12.5px; white-space: pre-wrap; overflow-wrap: anywhere; }
.post .pimg { margin-top: 8px; aspect-ratio: 16 / 9; border-radius: 10px; background: var(--track) center/cover; }
.nav-foot { padding: 2px 18px 8px; font-size: 11px; color: var(--text3); display: flex; align-items: center; gap: 6px; }
.nav-foot i { width: 7px; height: 7px; border-radius: 50%; background: var(--green); display: inline-block; }
.statgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.stat { padding: 10px 12px; border-radius: 12px; background: var(--card); border: 1px solid var(--sep); }
.stat b { display: block; font-size: 18px; }
.stat span { font-size: 11.5px; color: var(--text2); }
.ncard.unseen { border-color: var(--accent); }
.ncard .nimg { width: 64px; height: 40px; border-radius: 8px; background: var(--track) center/cover; flex-shrink: 0; }
.ncard .acts { flex-wrap: wrap; justify-content: flex-end; }
.ncard .gicon-sm { width: 40px; height: 40px; border-radius: 10px; background: var(--track) center/cover; display: grid; place-items: center; flex-shrink: 0; }
.ncard .gicon-sm svg { width: 18px; height: 18px; color: var(--text2); }
.ncard.v2 { flex-wrap: wrap; }
.ncard.v2 .info { flex: 1 1 300px; }
.ncard.v2 .sub { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; white-space: pre-line; cursor: pointer; }
.ncard.v2 .sub.open { -webkit-line-clamp: unset; }
.ncard.v2 .acts { flex: 1 1 100%; justify-content: flex-end; }
.inv-tabs { overflow-x: auto; scrollbar-width: none; min-width: 0; flex-shrink: 1; }
.inv-tabs::-webkit-scrollbar { display: none; }
.inv-tabs button { flex: 0 0 auto; }
.toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 4px 0 12px; }
.toolbar .grow, .grow { flex: 1; }
.fprev .iimg { width: 100%; max-width: 420px; margin: 0 auto; aspect-ratio: 1; border-radius: 14px; background-size: contain; }
.fprev.wide .iimg { max-width: none; aspect-ratio: 16 / 9; }
.quota { font-size: 11px; font-weight: 600; color: var(--text3); }
.quota.full { color: var(--red); }
.itile .imenu { position: absolute; top: 12px; left: 12px; opacity: 0; transition: opacity .15s; }
.itile:hover .imenu { opacity: 1; }
.atable { width: 100%; border-collapse: collapse; font-size: 11.5px; text-align: left; }
.atable th { color: var(--text3); font-weight: 600; padding: 4px 6px; }
.atable td { padding: 4px 6px; border-top: 1px solid var(--sep); }
.perf { font-weight: 700; }
.perf.Excellent { color: var(--green); } .perf.Good { color: var(--mint); } .perf.Medium { color: var(--yellow); }
.perf.Poor { color: var(--orange); } .perf.VeryPoor { color: var(--red); }
</style>`);

// ---------- VRChat online player count (bottom of the menu) ----------
$("nav").insertAdjacentHTML("afterend", `<div class="nav-foot" id="vrcOnline" style="display:none"><i></i><span></span></div>`);
async function updateOnline() {
  if (!AUTH.loggedIn) { $("vrcOnline").style.display = "none"; return; }
  const r = await vrc("getCurrentOnlineUsers");
  if (typeof r.ok === "number") {
    $("vrcOnline").style.display = "";
    $("vrcOnline").querySelector("span").textContent = t("vrcOnline", r.ok.toLocaleString());
  }
}
setInterval(updateOnline, 5 * 60 * 1000);

// ---------- Favorites (shared by every card) ----------
const FAV = { groups: null, friend: null, world: null, avatar: null, limits: null, loading: false };
async function loadFav(force) {
  if (!AUTH.loggedIn || FAV.loading || (FAV.groups && !force)) return;
  FAV.loading = true;
  repaint();
  const [g, f, w, a, l] = await Promise.all([vrc("getFavoriteGroups", { n: 100 }), vrc("getFavorites", { type: "friend", _all: true }),
    vrc("getFavoritedWorlds", { _all: true }), vrc("getFavoritedAvatars", { _all: true }), vrc("getFavoriteLimits")]);
  Object.assign(FAV, { groups: g.ok || [], friend: f.ok || [], world: w.ok || [], avatar: a.ok || [], limits: l.ok || null, loading: false });
  if (g.error) apiError(g);
  repaint();
}
// type: friend | world | avatar → {fid: favorite entry id, group: group name}
function favRecord(type, id) {
  if (type === "friend") { const f = (FAV.friend || []).find(x => x.favoriteId === id); return f && { fid: f.id, group: f.tags?.[0] }; }
  const x = (FAV[type] || []).find(o => o.id === id);
  return x && { fid: x.favoriteId, group: x.favoriteGroup };
}
const favGroups = type => (FAV.groups || []).filter(g => type === "world" ? g.type === "world" || g.type === "vrcPlusWorld" : g.type === type);
function favCount(type, group) {
  return type === "friend" ? (FAV.friend || []).filter(x => x.tags?.includes(group)).length : (FAV[type] || []).filter(x => x.favoriteGroup === group).length;
}
function favButton(type, id) {
  const on = !!favRecord(type, id);
  return `<button class="btn star ${on ? "on" : ""}" title="${t(on ? "fav_remove" : "fav_title")}" onclick="favMenu('${type}','${esc(id)}')">${icon("star")}</button>`;
}
async function favMenu(type, id) {
  if (!FAV.groups) await loadFav();
  openX(t("fav_title"), () => {
    const rec = favRecord(type, id);
    const max = g => FAV.limits?.maxFavoritesPerGroup?.[g.type] ?? "";
    return `<div class="opt-list">${favGroups(type).map(g => `<button class="opt ${rec?.group === g.name ? "on" : ""}"
        onclick="favSet('${type}','${esc(id)}','${esc(g.name)}','${g.type}')">${icon(rec?.group === g.name ? "circle-check" : "star")}
        <b>${esc(g.displayName || g.name)}</b><span>${favCount(type, g.name)}/${max(g)}</span></button>`).join("") || `<div class="empty-state" style="height:80px">${t("loading")}</div>`}</div>
      ${rec ? `<div class="form-actions">${btn(t("fav_remove"), `favRemove('${type}','${esc(id)}')`, "danger", "heart-off")}</div>` : ""}`;
  });
}
async function favSet(type, id, group, gtype) {
  const rec = favRecord(type, id);
  if (rec?.group === group) return closeX();
  const g = favGroups(type).find(x => x.name === group);
  if (favCount(type, group) >= (FAV.limits?.maxFavoritesPerGroup?.[g?.type] ?? Infinity)) return toast(t("fav_full"));
  if (rec && (await vrcDo("removeFavorite", { favoriteId: rec.fid })) === undefined) return;
  const ok = await vrcDo("addFavorite", { type: gtype === "vrcPlusWorld" ? "vrcPlusWorld" : type, favoriteId: id, tags: [group] }, "fav_added");
  closeX();
  if (ok !== undefined || rec) await loadFav(true);
}
async function favRemove(type, id) {
  const rec = favRecord(type, id);
  if (!rec) return closeX();
  if ((await vrcDo("removeFavorite", { favoriteId: rec.fid }, "fav_removed")) !== undefined) { closeX(); await loadFav(true); }
}

// ---------- Blocks / mutes (shared by every card) ----------
const MOD_TYPES = ["block", "mute", "hideAvatar", "showAvatar", "interactOff", "muteChat"];
const MOD_ICON = { block: "ban", mute: "volume-x", hideAvatar: "eye-off", showAvatar: "eye", interactOff: "hand", muteChat: "message-square",
                   unmute: "mic", interactOn: "hand", unmuteChat: "message-square" };
const MODS = { list: null, avatars: null, loading: false };
async function loadMods(force) {
  if (!AUTH.loggedIn || MODS.loading || (MODS.list && !force)) return;
  MODS.loading = true;
  const [p, a] = await Promise.all([vrc("getPlayerModerations"), vrc("getGlobalAvatarModerations")]);
  Object.assign(MODS, { list: p.ok || [], avatars: a.ok || [], loading: false });
  repaint();
}
const modsOf = uid => new Set((MODS.list || []).filter(m => m.targetUserId === uid).map(m => m.type));
async function modToggle(uid, type) {
  const on = modsOf(uid).has(type);
  if ((await vrcDo(on ? "unmoderateUser" : "moderateUser", { moderated: uid, type }, on ? "mod_removed" : "mod_added")) !== undefined) await loadMods(true);
}
function modMenu(uid, name) {
  if (!MODS.list) loadMods();
  openX(name, () => {
    const on = modsOf(uid);
    return `<div class="opt-list">${MOD_TYPES.map(ty => `<button class="opt ${on.has(ty) ? "on" : ""}" onclick="modToggle('${esc(uid)}','${ty}')">
      ${icon(MOD_ICON[ty])}<b>${t("m_" + ty)}</b><span>${on.has(ty) ? icon("circle-check") : ""}</span></button>`).join("")}</div>`;
  });
}
const avatarBlocked = aid => (MODS.avatars || []).some(m => m.targetAvatarId === aid);
async function avatarBlockToggle(aid) {
  const on = avatarBlocked(aid);
  const r = await vrcDo(on ? "deleteGlobalAvatarModeration" : "createGlobalAvatarModeration",
    { targetAvatarId: aid, avatarModerationType: "block" }, on ? "mod_removed" : "mod_added");
  if (r !== undefined) await loadMods(true);
}

// ---------- Preset invite messages ----------
const inviteMsgs = (type, force) => loadOp("im_" + type, "getInviteMessages", { messageType: type }, force);
function msgOptions(type) {
  const list = got("im_" + type) || [];
  return { "": t("inv_noMsg"), ...Object.fromEntries(list.map(m => [String(m.slot), `${m.slot + 1}. ${m.message}`])) };
}
tx({ inv_noMsg: ["(ไม่ใส่ข้อความ)", "(no message)", "(メッセージなし)"] });

// ---------- WebSocket events forwarded by social.py ----------
window.onPipelineEvent = ({ type, content: c }) => {
  if (type.startsWith("notification-v2")) {
    if (type === "notification-v2" && (c?.title || c?.message)) toast(t("newNotifV2", c.title || c.message));
    loadN2(true);
  } else if (type === "content-refresh") {
    const map = { gallery: "gallery", icon: "icon", emoji: "emoji", sticker: "sticker", print: "prints", prints: "prints", inventory: "items" };
    const k = map[c?.contentType];
    if (k) { delete INV.data[k]; if (view === "inventory") renderView(); }
  } else if (type.startsWith("group-")) {
    GRP.mine = null;
    dropCache("ug_");
    if (view === "groups") renderView();
  } else if (type === "instance-queue-ready") {
    toast(t("queueReady"));
  } else if (type === "user-update") {
    if (view === "account") renderView();
  }
};
// After login, load data shared by the cards
const _onAuth = window.onAuth;
window.onAuth = (a) => {
  _onAuth(a);
  if (a.loggedIn) { updateOnline(); loadMods(true); }
  else { for (const k in CACHE) delete CACHE[k]; Object.assign(FAV, { groups: null }); Object.assign(MODS, { list: null, avatars: null }); updateOnline(); }
};

// ======================= Profile card: friend / invite / block / groups / mutual friends =======================
tx({
  p_addFriend: ["ขอเป็นเพื่อน", "Add friend", "フレンド申請"], p_cancelReq: ["ยกเลิกคำขอเป็นเพื่อน", "Cancel request", "申請を取り消す"],
  p_acceptReq: ["ยอมรับคำขอเป็นเพื่อน", "Accept request", "申請を承認"], p_unfriend: ["เลิกเป็นเพื่อน", "Unfriend", "フレンド解除"],
  p_reqSent: ["ส่งคำขอเป็นเพื่อนแล้ว", "Friend request sent", "フレンド申請を送りました"], p_reqCanceled: ["ยกเลิกคำขอแล้ว", "Request canceled", "申請を取り消しました"],
  p_unfriended: ["เลิกเป็นเพื่อนแล้ว", "Unfriended", "フレンドを解除しました"], p_boop: ["Boop", "Boop", "Boop"], p_booped: ["ส่ง Boop แล้ว", "Booped!", "Boop しました"],
  p_invite: ["เชิญมาห้องฉัน", "Invite to my room", "自分の部屋に招待"], p_reqInvite: ["ขอ Invite", "Request invite", "招待をリクエスト"],
  p_moderate: ["บล็อก / ปิดเสียง", "Block / Mute", "ブロック・ミュート"], p_editMe: ["แก้ไขโปรไฟล์", "Edit profile", "プロフィールを編集"],
  p_rep: ["กลุ่มที่แสดงบนโปรไฟล์", "Represented group", "代表グループ"], p_mutual: ["ร่วมกัน", "Mutuals", "共通"],
  p_mfriends: [n => `เพื่อนร่วมกัน ${n}`, n => `${n} mutual friends`, n => `共通のフレンド ${n}`],
  p_mgroups: [n => `กลุ่มร่วมกัน ${n}`, n => `${n} mutual groups`, n => `共通のグループ ${n}`],
  p_groups: ["กลุ่มที่เข้าร่วม", "Groups", "参加グループ"], p_showGroups: ["แสดงกลุ่มทั้งหมด", "Show groups", "グループを表示"],
  p_noteSync: ["บันทึกในเครื่องและ sync กับโน้ตของ VRChat", "Saved locally and synced to your VRChat note", "ローカル保存 + VRChat のメモと同期"],
  p_cosmetics: ["ของแต่งที่มี", "Cosmetics", "コスメティック"],
  inv_title: [n => `เชิญ ${n}`, n => `Invite ${n}`, n => `${n} を招待`], inv_where: ["ห้อง", "Room", "部屋"],
  inv_msg: ["ข้อความ", "Message", "メッセージ"], inv_photo: ["แนบรูป", "Photo", "写真"], inv_photoHint: ["ต้องมี VRC+", "Requires VRC+", "VRC+ が必要"],
  inv_send: ["ส่ง", "Send", "送信"], inv_sent: ["ส่งแล้ว", "Sent", "送信しました"],
  inv_noLoc: ["ยังไม่รู้ว่าคุณอยู่ห้องไหน (ต้องเปิด VRChat อยู่)", "Your current room is unknown (VRChat must be running)", "現在の部屋が不明です (VRChat を起動してください)"],
  rq_title: [n => `ขอ Invite จาก ${n}`, n => `Request invite from ${n}`, n => `${n} に招待をリクエスト`],
});

const PX = {};  // uid -> {user, status, mutuals, rep, groups, mfriends, mgroups, cosmetics}
const _showProfile = showProfile;
showProfile = function (uid, name) {
  const p = _showProfile(uid, name);
  if (AUTH.loggedIn && uid) loadProfileExtra(uid);
  return p;
};
async function loadProfileExtra(uid) {
  const x = PX[uid] = { loading: true };
  if (!MODS.list) loadMods();
  if (!FAV.groups) loadFav();
  const self = uid === AUTH.id;
  const [u, st, m, rep] = await Promise.all([vrc("getUser", { userId: uid }), self ? {} : vrc("getFriendStatus", { userId: uid }),
    self ? {} : vrc("getMutuals", { userId: uid }), vrc("getUserRepresentedGroup", { userId: uid })]);
  Object.assign(x, { loading: false, user: u.ok, status: st.ok, mutuals: m.ok, rep: rep.ok?.groupId ? rep.ok : null });
  if (profileOpen === uid) buildProfile();
}
async function pLoad(uid, key, op, params) {
  const x = PX[uid] ||= {};
  if (x[key] === undefined) {
    x[key] = null;
    buildProfile();
    const r = await vrc(op, { userId: uid, ...params });
    x[key] = r.ok || [];
  } else x[key] = x[key] ? undefined : x[key];  // Clicking again = hide
  if (profileOpen === uid) buildProfile();
}

const _buildProfile = buildProfile;
buildProfile = function () {
  const memoFocused = document.activeElement?.classList.contains("memo");
  $("pcard").classList.remove("xwide");  // In case it opens from a wider group/avatar card
  _buildProfile();
  if (!memoFocused) profileMore();
};
function profileMore() {
  const uid = profileOpen, body = $("pcard").querySelector(".pcard-body");
  if (!uid || !body || !AUTH.loggedIn || body.querySelector("#pMore")) return;
  $("pcard").classList.add("wide");
  const x = PX[uid] || {}, self = uid === AUTH.id;
  const name = PROFILES[uid]?.displayName || profileName;
  const isFriend = x.status?.isFriend ?? (!!FRIENDS[uid] || PROFILES[uid]?.isFriend);
  const sec = (label, inner) => `<div class="pcard-section"><div class="lbl">${label}</div>${inner}</div>`;
  let html = "";
  if (x.rep) html += sec(t("p_rep"), `<div class="link-row" onclick="openGroupId('${esc(x.rep.groupId)}')">${icon("users")}<b>${esc(x.rep.name)}</b>
      <span>${esc(x.rep.shortCode || "")}.${esc(x.rep.discriminator || "")}</span></div>`);
  if (!self && x.mutuals) {
    html += sec(t("p_mutual"), `<div class="chips">
      <button class="btn sm" onclick="pLoad('${uid}','mfriends','getMutualFriends',{n:100})">${icon("users-round")}${t("p_mfriends", x.mutuals.friends ?? 0)}</button>
      <button class="btn sm" onclick="pLoad('${uid}','mgroups','getMutualGroups',{n:100})">${icon("users")}${t("p_mgroups", x.mutuals.groups ?? 0)}</button></div>
      ${x.mfriends === null || x.mgroups === null ? `<div class="pcard-note">${t("loading")}</div>` : ""}
      ${x.mfriends?.length ? `<div class="chips">${x.mfriends.map(f => `<span class="chip" onclick="showProfile('${esc(f.id)}')"><span class="slot" data-uid="${esc(f.id)}" data-name="${escA(f.displayName)}"></span><span>${esc(f.displayName)}</span></span>`).join("")}</div>` : ""}
      ${x.mgroups?.length ? `<div class="links" style="margin-top:6px">${x.mgroups.map(g => `<div class="link-row" onclick="openGroupId('${esc(g.groupId || g.id)}')">${icon("users")}<b>${esc(g.name)}</b><span>${esc(g.shortCode || "")}</span></div>`).join("")}</div>` : ""}`);
  }
  html += sec(t("p_groups"), x.groups ? (x.groups.length ? `<div class="links">${x.groups.map(g => `<div class="link-row" onclick="openGroupId('${esc(g.groupId || g.id)}')">
      ${icon(g.mutualGroup ? "users-round" : "users")}<b>${esc(g.name)}</b><span>${esc(g.shortCode || "")}.${esc(g.discriminator || "")}${g.isRepresenting ? " ★" : ""}</span></div>`).join("")}</div>`
      : `<div class="pcard-note">${t("noResults")}</div>`)
    : x.groups === null ? `<div class="pcard-note">${t("loading")}</div>` : `<button class="btn sm" onclick="pLoad('${uid}','groups','getUserGroups')">${icon("users")}${t("p_showGroups")}</button>`);
  const more = document.createElement("div");
  more.id = "pMore";
  more.innerHTML = html;
  body.querySelector(".pcard-actions").before(more);
  fillSlots(more);

  // Action buttons
  const st = x.status || {};
  const incoming = NOTIFS.find(n => n.type === "friendRequest" && n.from === uid);
  // Frequently used buttons under the name, the rest in the ⋯ menu
  const safeName = esc(name.replace(/['\\]/g, ""));
  let main = "";
  const menu = [];
  if (self) main += btn(t("p_editMe"), "setView('account');closeProfile()", "primary", "pencil");
  else {
    if (isFriend) {
      main += btn(t("p_invite"), `inviteDialog('${uid}')`, "primary", "send") + btn(t("p_reqInvite"), `requestInviteDialog('${uid}')`, "", "mail")
        + favButton("friend", uid);
      menu.push({ ic: "hand", label: t("p_boop"), fn: `boopDialog('${uid}')` });
    } else if (incoming || st.incomingRequest) main += btn(t("p_acceptReq"), incoming ? `respond('${incoming.id}',true)` : `doFriend('${uid}')`, "primary", "user-check");
    else if (st.outgoingRequest) main += btn(t("p_cancelReq"), `doCancelFriend('${uid}')`, "", "user-x");
    else main += btn(t("p_addFriend"), `doFriend('${uid}')`, "primary", "user-plus");
  }
  menu.push({ ic: "copy", label: t("copyId"), fn: `api('copy','${uid}');toast(t('copied','${safeName}'))` },
            { ic: "external-link", label: t("openWeb"), fn: `api('open_profile','${uid}')` });
  if (!self) {
    menu.push({ ic: "users", label: t("p_inviteGroup"), fn: `groupInviteDialog('${uid}')` });
    menu.push({ ic: "shield-ban", label: t("p_moderate") + (modsOf(uid).size ? ` (${modsOf(uid).size})` : ""), fn: `modMenu('${uid}','${safeName}')` });
    if (isFriend) menu.push({ ic: "user-minus", label: t("p_unfriend"), fn: `doUnfriend('${uid}')`, danger: true });
  }
  body.querySelector(".pcard-actions")?.remove();
  const anchor = [...body.children].find(el => el.matches(".badges, .pcard-bio, .pcard-section, #pMore, .pcard-note"));
  anchor?.insertAdjacentHTML("beforebegin", `<div class="pact">${main}${menuBtn(menu)}</div>`);

  // Note: use VRChat's note if the local one is empty, and save back to VRChat too
  const memo = body.querySelector("textarea.memo");
  if (memo) {
    if (!memo.value && x.user?.note) { memo.value = x.user.note; api("set_memo", uid, x.user.note); if (PEXTRA[uid]) PEXTRA[uid].memo = x.user.note; }
    memo.title = t("p_noteSync");
    memo.addEventListener("change", () => { vrc("updateUserNote", { targetUserId: uid, note: memo.value }); if (x.user) x.user.note = memo.value; });
  }
}
// ⋯ button + menu (item: {ic, label, fn, danger}) — danger needs a second click to confirm
function menuBtn(items) {
  return `<div class="mwrap"><button class="btn icon-only" title="${t("more")}" onclick="event.stopPropagation();toggleMenu(this)">${icon("ellipsis")}</button>
    <div class="menu">${items.map(i => `<button class="mi ${i.danger ? "danger" : ""}" onclick="${i.danger ? `confirmBtn(this,()=>{closeMenus();${i.fn}})` : `closeMenus();${i.fn}`}">${icon(i.ic)}<span>${esc(i.label)}</span></button>`).join("")}</div></div>`;
}
function placeActions(body, main, menu) {
  body.querySelectorAll(".pcard-actions").forEach(el => el.remove());
  const html = `<div class="pact">${main}${menu.length ? menuBtn(menu) : ""}</div>`;
  const anchor = [...body.children].find(el => el.matches(".badges, .pcard-bio, .pcard-section, #pMore, .pcard-note, .ptabs"));
  if (anchor) anchor.insertAdjacentHTML("beforebegin", html); else body.insertAdjacentHTML("beforeend", html);
}
function toggleMenu(b) {
  const m = b._menu ||= b.nextElementSibling, open = !m.classList.contains("open");
  closeMenus();
  if (!open) return;
  m.classList.add("open", "floating", "mwrap");
  m._btn = b;
  document.body.append(m);
  const z = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--z")) || 1;
  const r = b.getBoundingClientRect(), W = innerWidth / z, H = innerHeight / z;
  const bx = r.left / z, by = r.top / z, bw = r.width / z, bh = r.height / z, mw = m.offsetWidth, mh = m.offsetHeight;
  m.style.left = Math.max(8, Math.min(W - mw - 8, bx + bw - mw)) + "px";
  m.style.top = (by + bh + 6 + mh > H - 8 && by - 6 - mh > 8 ? by - 6 - mh : Math.min(by + bh + 6, H - mh - 8)) + "px";
}
function closeMenus() { document.querySelectorAll(".menu.floating").forEach(m => { m.classList.remove("open"); m.remove(); }); }
addEventListener("resize", closeMenus);
// Scrolling the box that holds the ⋯ button = close the menu (the floating menu doesn't scroll with it)
document.addEventListener("scroll", e => { const m = document.querySelector(".menu.floating"); if (m && e.target.contains?.(m._btn)) closeMenus(); }, true);
document.addEventListener("click", e => { if (!e.target.closest(".mwrap")) closeMenus(); });
async function doFriend(uid) {
  if ((await vrcDo("friend", { userId: uid }, "p_reqSent")) !== undefined) loadProfileExtra(uid);
}
async function doCancelFriend(uid) {
  if ((await vrcDo("deleteFriendRequest", { userId: uid }, "p_reqCanceled")) !== undefined) loadProfileExtra(uid);
}
async function doUnfriend(uid) {
  if ((await vrcDo("unfriend", { userId: uid }, "p_unfriended")) !== undefined) loadProfileExtra(uid);
}

// ---------- Invite / request invite (image attachment with VRC+) ----------
let INV_PHOTO = null;
async function choosePhoto() {
  const png = await pickImage(2048);
  if (png) { INV_PHOTO = png; const el = $("invPhoto"); if (el) el.textContent = t("imagePicked"); }
}
function photoRow() {
  return fRow(t("inv_photo"), `${btn(t("pickImage"), "choosePhoto()", "sm", "image-plus")}<span id="invPhoto" class="hint-inline">${INV_PHOTO ? t("imagePicked") : ""}</span>`, t("inv_photoHint"));
}
function inviteDialog(uid, loc = myLoc()) {
  if (!loc) return toast(t("inv_noLoc"));
  INV_PHOTO = null;
  inviteMsgs("message");
  const name = PROFILES[uid]?.displayName || uid;
  openX(t("inv_title", name), () => `
    ${fRow(t("inv_where"), `<div class="locline" style="flex:1">${icon("map-pin")}<span class="w">${esc(locLabel(loc))}</span><span class="itype">${esc(itypeLabel(parseLoc(loc)))}</span></div>`)}
    ${fRow(t("inv_msg"), fSelect("invSlot", msgOptions("message"), ""))}
    ${photoRow()}
    <div class="form-actions">${btn(t("inv_send"), `sendInvite('${uid}','${esc(loc)}')`, "primary", "send")}</div>`);
}
async function sendInvite(uid, loc) {
  const slot = fv("invSlot");
  const p = { userId: uid, instanceId: loc, ...(slot ? { messageSlot: +slot } : {}) };
  const r = await vrcDo(INV_PHOTO ? "inviteUserWithPhoto" : "inviteUser", INV_PHOTO ? { ...p, _image: INV_PHOTO } : p, "inv_sent");
  if (r !== undefined) closeX();
}
function requestInviteDialog(uid) {
  INV_PHOTO = null;
  inviteMsgs("request");
  openX(t("rq_title", PROFILES[uid]?.displayName || uid), () => `
    ${fRow(t("inv_msg"), fSelect("invSlot", msgOptions("request"), ""))}
    ${photoRow()}
    <div class="form-actions">${btn(t("inv_send"), `sendRequestInvite('${uid}')`, "primary", "send")}</div>`);
}
async function sendRequestInvite(uid) {
  const slot = fv("invSlot");
  const p = { userId: uid, ...(slot ? { requestSlot: +slot } : {}) };
  const r = await vrcDo(INV_PHOTO ? "requestInviteWithPhoto" : "requestInvite", INV_PHOTO ? { ...p, _image: INV_PHOTO } : p, "inv_sent");
  if (r !== undefined) closeX();
}

// ======================= World card: instances / create instance / favorites / store =======================
tx({
  w_instances: ["ห้องสาธารณะที่เปิดอยู่", "Public instances", "パブリックインスタンス"], w_newInstance: ["สร้างห้องใหม่", "New instance", "インスタンスを作成"],
  w_store: ["ร้านค้าในโลก", "World store", "ワールドストア"], w_roomInfo: ["ข้อมูลห้อง", "Instance info", "インスタンス情報"],
  w_owner: ["เจ้าของ", "Owner", "オーナー"], w_users: ["คนในห้อง", "Users", "ユーザー"], w_queue: ["คิว", "Queue", "キュー"],
  w_closeRoom: ["ปิดห้อง", "Close instance", "インスタンスを閉じる"], w_closed: ["ปิดห้องแล้ว", "Instance closed", "インスタンスを閉じました"],
  w_ageGate: ["จำกัด 18+", "18+ only", "18+ 限定"], w_platforms: ["แพลตฟอร์ม", "Platforms", "プラットフォーム"],
  w_full: ["เต็ม", "Full", "満員"], w_tags: ["แท็ก", "Tags", "タグ"], w_updated: ["อัปเดต", "Updated", "更新"],
  ci_type: ["ประเภท", "Type", "種類"], ci_region: ["ภูมิภาค", "Region", "リージョン"], ci_group: ["กลุ่ม", "Group", "グループ"],
  ci_access: ["ใครเข้าได้", "Access", "アクセス"], ci_queue: ["เปิดคิว", "Enable queue", "キューを有効化"],
  ci_name: ["ชื่อห้อง", "Display name", "表示名"], ci_created: ["สร้างห้องแล้ว", "Instance created", "インスタンスを作成しました"],
  ci_members: ["สมาชิก", "Members", "メンバー"], ci_plus: ["Group+", "Group+", "Group+"], ci_public: ["Group Public", "Group Public", "Group Public"],
  st_price: [n => `${n} เครดิต`, n => `${n} credits`, n => `${n} クレジット`],
});
const WX = {};  // wid or location -> raw API data
const _openWorld = openWorld;
openWorld = function (wid, loc) {
  _openWorld(wid, loc);
  if (AUTH.loggedIn && wid) loadWorldExtra(wid, loc || "");
};
async function loadWorldExtra(wid, loc) {
  if (!FAV.groups) loadFav();
  const [w, i] = await Promise.all([vrc("getWorld", { worldId: wid }), parseLoc(loc).name ? vrc("getInstance", { location: loc }) : {}]);
  if (w.ok) WX[wid] = w.ok;
  if (loc && parseLoc(loc).name) WX[loc] = i.ok || { _error: i.error };
  if (worldOpen === wid) buildWorld();
}
const _buildWorld = buildWorld;
buildWorld = function () { $("pcard").classList.remove("xwide"); _buildWorld(); worldMore(); };
function worldMore() {
  const wid = worldOpen, body = $("pcard").querySelector(".pcard-body");
  if (!wid || !body || !AUTH.loggedIn) return;
  const w = WX[wid] || {}, inst = worldLoc && WX[worldLoc];
  let html = "";
  if (inst && !inst._error) {
    const owner = inst.ownerId || "";
    // Instance owner's name (user or group) — loaded once and kept
    if (owner && !PROFILES[owner]?.displayName && !CACHE["oname_" + owner]) loadOp("oname_" + owner, owner.startsWith("grp_") ? "getGroup" : "getUser", owner.startsWith("grp_") ? { groupId: owner } : { userId: owner });
    const ownerName = PROFILES[owner]?.displayName || got("oname_" + owner)?.displayName || got("oname_" + owner)?.name || owner;
    const plat = Object.entries(inst.platforms || {}).filter(([, n]) => n).map(([p, n]) => `${{ standalonewindows: "PC", android: "Android", ios: "iOS" }[p] || p} ${n}`).join(" · ");
    html += `<div class="pcard-section"><div class="lbl">${t("w_roomInfo")}</div><div class="kv">
      <span>${t("w_users")}</span><span>${inst.n_users ?? inst.userCount ?? "?"} / ${inst.capacity ?? "?"}${inst.full ? ` · ${t("w_full")}` : ""}</span>
      ${plat ? `<span>${t("w_platforms")}</span><span>${esc(plat)}</span>` : ""}
      ${owner ? `<span>${t("w_owner")}</span><span>${owner.startsWith("grp_") ? `<span class="link" onclick="openGroupId('${esc(owner)}')">${esc(ownerName)}</span>` : userLink(owner, ownerName)}</span>` : ""}
      ${inst.queueEnabled ? `<span>${t("w_queue")}</span><span>${inst.queueSize ?? 0}</span>` : ""}
      ${inst.ageGate ? `<span></span><span>${t("w_ageGate")}</span>` : ""}
      ${inst.displayName ? `<span>${t("ci_name")}</span><span>${esc(inst.displayName)}</span>` : ""}</div>
      ${inst.users?.length ? `<div class="chips">${inst.users.map(u => `<span class="chip" onclick="showProfile('${esc(u.id)}')"><span class="slot" data-uid="${esc(u.id)}" data-name="${escA(u.displayName)}"></span><span>${esc(u.displayName)}</span></span>`).join("")}</div>` : ""}
      <div class="chips">
</div></div>`;
  }
  const list = (w.instances || []).filter(i => Array.isArray(i) && i[0]);
  if (list.length) html += `<div class="pcard-section"><div class="lbl">${t("w_instances")} (${list.length})</div>${list.slice(0, 30).map(([iid, n]) => {
    const loc = `${wid}:${iid}`, L2 = parseLoc(loc);
    return lrow({ thumb: "", name: `#${L2.name}`, sub: `${esc(itypeLabel(L2))} · ${t("people2", n)}`, onclick: `openWorld('${wid}','${esc(loc)}')`,
      acts: `<button class="mini-btn" title="${t("join")}" onclick="doLaunch('${esc(loc)}')">${icon("rocket")}</button>
             <button class="mini-btn" title="${t("inviteMe")}" onclick="doInvite('${esc(loc)}')">${icon("send")}</button>` }).replace('<span class="lthumb" ></span>', "");
  }).join("")}</div>`;
  if (w.tags?.some(x => x.startsWith("author_tag_"))) html += `<div class="pcard-section"><div class="lbl">${t("w_tags")}</div><div class="chips">${w.tags.filter(x => x.startsWith("author_tag_")).map(x => `<span class="chip lang">${esc(x.slice(11))}</span>`).join("")}</div></div>`;
  if (w.updated_at) html += `<div class="pcard-note">${t("w_updated")} ${fmtIso(w.updated_at)}</div>`;
  const more = document.createElement("div");
  more.innerHTML = html;
  body.querySelector(".pcard-actions").before(more);
  fillSlots(more);
  const L2 = parseLoc(worldLoc), owner = inst && !inst._error ? inst.ownerId || "" : "";
  const main = btn(t(L2.name ? "joinInstance" : "launch"), `doLaunch('${esc(worldLoc || wid)}')`, "primary", "rocket")
    + (L2.name ? btn(t("inviteMe"), `doInvite('${esc(worldLoc)}')`, "", "send") : "") + favButton("world", wid);
  const menu = [{ ic: "circle-plus", label: t("w_newInstance"), fn: `createInstanceDialog('${wid}')` }];
  if (L2.name) menu.push({ ic: "link", label: t("copyLink"), fn: `copyInstanceLink('${esc(worldLoc)}')` });
  if (w.storeId) menu.push({ ic: "store", label: t("w_store"), fn: `openStore('${esc(w.storeId)}')` });
  menu.push({ ic: "copy", label: t("copyId"), fn: `api('copy','${wid}');toast(t('copied','${wid}'))` },
            { ic: "external-link", label: t("openWeb"), fn: `api('open_world','${wid}')` });
  if (owner && (owner === AUTH.id || owner.startsWith("grp_"))) menu.push({ ic: "door-open", label: t("w_closeRoom"), fn: `closeInstance('${esc(worldLoc)}')`, danger: true });
  placeActions(body, main, menu);
}
async function copyInstanceLink(loc) {
  const inst = WX[loc] || {};
  let short = inst.shortName || inst.secureName;
  if (!short) { const r = await vrc("getShortName", { location: loc }); short = r.ok?.shortName || r.ok?.secureName; }
  const url = short ? `https://vrch.at/${short}` : `https://vrchat.com/home/launch?worldId=${loc.split(":")[0]}&instanceId=${encodeURIComponent(loc.split(":")[1] || "")}`;
  api("copy", url);
  toast(t("linkCopied"));
}
async function closeInstance(loc) {
  if ((await vrcDo("closeInstance", { location: loc }, "w_closed")) !== undefined) { delete WX[loc]; loadWorldExtra(worldOpen, loc); }
}
function createInstanceDialog(wid) {
  if (!GRP.mine && !GRP.loading) loadGroups().then(() => X && buildX());
  loadOp("ci_cats", "getInstanceCategories");
  openX(t("w_newInstance"), () => {
    const groups = Object.fromEntries((GRP.mine || []).map(g => [g.id, g.name]));
    return `${fRow(t("ci_type"), fSelect("ciType", { public: "Public", hidden: "Friends+", friends: "Friends", "private+": "Invite+", private: "Invite", group: "Group" }, "public"))}
      ${fRow(t("ci_region"), fSelect("ciRegion", { jp: "Japan", us: "US West", use: "US East", eu: "Europe" }, "jp"))}
      <div id="ciGroup" style="display:none">
        ${fRow(t("ci_group"), fSelect("ciGrp", groups, ""))}
        ${fRow(t("ci_access"), fSelect("ciAccess", { members: t("ci_members"), plus: t("ci_plus"), public: t("ci_public") }, "members"))}
        ${fRow(t("ci_queue"), fCheck("ciQueue", true))}
      </div>
      ${fRow(t("w_ageGate"), fCheck("ciAge", false))}
      ${fRow(t("ci_name"), fInput("ciName", "", `placeholder="${t("optional")}"`))}
      <div class="form-actions">${btn(t("create"), `doCreateInstance('${wid}')`, "primary", "circle-plus")}</div>`;
  }, () => {
    const sync = () => { $("ciGroup").style.display = $("ciType").value === "group" ? "" : "none"; };
    $("ciType").onchange = sync;
    sync();
  });
}
async function doCreateInstance(wid) {
  const type = fv("ciType");
  const body = { worldId: wid, type: type === "private+" ? "private" : type, region: fv("ciRegion") };
  if (type === "private+") body.canRequestInvite = true;
  if (type === "group") Object.assign(body, { ownerId: fv("ciGrp"), groupAccessType: fv("ciAccess"), queueEnabled: fv("ciQueue") });
  else if (type !== "public") body.ownerId = AUTH.id;
  if (fv("ciAge")) body.ageGate = true;
  if (fv("ciName")) body.displayName = fv("ciName");
  const r = await vrcDo("createInstance", body, "ci_created");
  if (!r) return;
  closeX();
  const loc = r.location || `${wid}:${r.instanceId}`;
  WX[loc] = r;
  openWorld(wid, loc);
}
async function openStore(storeId) {
  loadOp("store_" + storeId, "getStore", { storeId, hydrateListings: true });
  openX(t("w_store"), () => {
    const c = CACHE["store_" + storeId], s = c?.data;
    const st = stateHtml(c);
    if (st) return st;
    const listings = s.listings || [];
    return `<div class="pcard-note" style="margin:0 0 10px">${esc(s.displayName || "")} ${s.description ? "— " + esc(s.description) : ""}</div>
      ${listings.map(l => lrow({ thumb: l.imageUrl, name: l.displayName, sub: `${esc(l.description || l.subtitle || "")}`,
        acts: `<span class="badge gray">${t("st_price", l.priceTokens ?? "?")}</span>` })).join("") || `<div class="empty-state" style="height:80px">${t("noResults")}</div>`}`;
  }, null, true);
}

// ======================= Avatar card: fallback / edit / block / file size =======================
tx({
  a_licensed: ["ที่ซื้อแล้ว", "Purchased", "購入済み"], a_fallback: ["ตั้งเป็นอวตารสำรอง", "Set as fallback", "フォールバックに設定"],
  a_fallbackSet: ["ตั้งเป็นอวตารสำรองแล้ว", "Fallback avatar set", "フォールバックに設定しました"],
  a_edit: ["แก้ไขอวตาร", "Edit avatar", "アバターを編集"], a_release: ["การเผยแพร่", "Release status", "公開設定"],
  a_analysis: ["ขนาดและประสิทธิภาพ", "Size & performance", "サイズとパフォーマンス"], a_size: ["ขนาดไฟล์", "Download", "ダウンロード"],
  a_unc: ["เมื่อแตกไฟล์", "Uncompressed", "展開後"], a_perf: ["Performance", "Performance", "パフォーマンス"],
  a_polys: ["โพลิกอน", "Polygons", "ポリゴン"], a_mats: ["วัสดุ", "Materials", "マテリアル"], a_bones: ["กระดูก", "Bones", "ボーン"],
  a_pb: ["PhysBones", "PhysBones", "PhysBones"], a_skinned: ["Skinned mesh", "Skinned meshes", "スキンメッシュ"], a_meshes: ["Mesh", "Meshes", "メッシュ"],
  a_tex: ["หน่วยความจำ texture", "Texture memory", "テクスチャメモリ"], a_particles: ["Particle system", "Particle systems", "パーティクル"],
  a_audio: ["แหล่งเสียง", "Audio sources", "オーディオ"], a_lights: ["แสง", "Lights", "ライト"], a_constraints: ["Constraints", "Constraints", "コンストレイント"],
  a_contacts: ["Contacts", "Contacts", "コンタクト"], a_details: ["รายละเอียด", "Details", "詳細"], a_author: ["ผู้สร้าง", "Author", "作者"],
  a_created: ["สร้างเมื่อ", "Created", "作成日"], a_version: ["เวอร์ชัน", "Version", "バージョン"], a_content: ["เนื้อหา", "Content", "コンテンツ"],
  a_unblock: ["ยกเลิกบล็อกอวตารนี้", "Unblock this avatar", "ブロックを解除"],
  a_impostorHint: ["อวตารจำลองที่ VRChat สร้างอัตโนมัติสำหรับแพลตฟอร์มที่ผู้สร้างไม่ได้อัปโหลดไว้",
                   "A stand-in VRChat generates automatically for platforms the author didn't upload", "作者が未対応のプラットフォーム向けに VRChat が自動生成した代替アバター"], a_styles: ["สไตล์", "Styles", "スタイル"], a_blocked: ["บล็อกอวตารนี้อยู่", "Blocked", "ブロック中"],
});
AVA_TABS.push("licensed");
const _loadAvatars = loadAvatars;
loadAvatars = async function (tab, force) {
  if (tab !== "licensed") return _loadAvatars(tab, force);
  if (AVA.licensed && !force) return;
  AVA.loading = true; renderView();
  const r = await vrc("getLicensedAvatars", { _all: true });
  AVA.loading = false;
  if (r.ok) AVA.licensed = r.ok.map(avatarSlim); else apiError(r);
  renderView();
};
function avatarSlim(a) {
  return { id: a.id, name: a.name, description: a.description, authorName: a.authorName, authorId: a.authorId,
           thumb: a.thumbnailImageUrl || a.imageUrl, image: a.imageUrl, releaseStatus: a.releaseStatus,
           platforms: [...new Set((a.unityPackages || []).map(p => p.platform).filter(Boolean))].sort(), updated: a.updated_at, tags: a.tags || [] };
}
const AX = {};  // avatarId -> {raw, analysis: [{platform, ...}]}
const _openAvatar = openAvatar;
openAvatar = function (a) {
  _openAvatar(a);
  if (AUTH.loggedIn) loadAvatarExtra(a.id);
};
async function loadAvatarExtra(aid) {
  if (!FAV.groups) loadFav();
  if (!MODS.list) loadMods();
  loadOp("avatarStyles", "getAvatarStyles");
  const x = AX[aid] = { analysis: null };
  const r = await vrc("getAvatar", { avatarId: aid });
  x.raw = r.ok;
  if (avatarOpen?.id === aid) buildAvatar();
  // File size/performance per platform: use the standard file if present, otherwise the Impostor VRChat generates
  const pk = {}, rank = v => v === "impostor" ? 1 : 2;
  for (const p of r.ok?.unityPackages || []) {
    const m = (p.assetUrl || "").match(/file\/(file_[\w-]+)\/(\d+)/);
    const variant = p.variant || "standard";
    if (!m || variant === "security") continue;
    const cur = pk[p.platform];
    if (!cur || rank(variant) > rank(cur.variant) || (rank(variant) === rank(cur.variant) && +m[2] > cur.v))
      pk[p.platform] = { f: m[1], v: +m[2], variant, perf: p.performanceRating, unity: p.unityVersion };
  }
  x.analysis = [];
  const order = ["standalonewindows", "android", "ios"];
  for (const [platform, p] of Object.entries(pk).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))) {
    const a = await vrc(p.variant === "impostor" ? "getFileAnalysis" : "getFileAnalysisStandard", { fileId: p.f, versionId: p.v });
    const row = { platform, ...p, ...(a.ok || {}), _error: a.error };
    if (!row.fileSize) {  // Impostors have no size in the analysis — read it from the file data instead
      const f = await vrc("getFile", { fileId: p.f });
      const ver = (f.ok?.versions || []).find(v => v.version === p.v);
      row.fileSize = ver?.file?.sizeInBytes;
    }
    x.analysis.push(row);
    if (avatarOpen?.id === aid) buildAvatar();
  }
  if (avatarOpen?.id === aid) buildAvatar();
}
const _buildAvatar = buildAvatar;
buildAvatar = function () { _buildAvatar(); avatarMore(); };
function avatarMore() {
  const a = avatarOpen, body = $("pcard").querySelector(".pcard-body");
  if (!a || !body || !AUTH.loggedIn) return;
  $("pcard").classList.add("xwide");  // The size/performance table needs a wide layout
  const x = AX[a.id] || {}, raw = x.raw || {};
  const styles = got("avatarStyles") || [];
  const styleName = id => styles.find(s => s.id === id)?.styleName || id;
  let html = "";
  const st = [raw.styles?.primary, raw.styles?.secondary].filter(Boolean);
  if (st.length) html += `<div class="pcard-section"><div class="lbl">${t("a_styles")}</div><div class="chips">${st.map(s => `<span class="chip lang">${esc(styleName(s))}</span>`).join("")}</div></div>`;
  // General details
  const ctags = (raw.tags || []).filter(x => x.startsWith("content_")).map(x => x.slice(8).replace(/_/g, " "));
  const atags = (raw.tags || []).filter(x => x.startsWith("author_tag_")).map(x => x.slice(11));
  if (raw.id) html += `<div class="pcard-section"><div class="lbl">${t("a_details")}</div><div class="kv">
      ${raw.authorId ? `<span>${t("a_author")}</span><span>${userLink(raw.authorId, raw.authorName)}</span>` : ""}
      ${raw.created_at ? `<span>${t("a_created")}</span><span>${fmtIso(raw.created_at)}</span>` : ""}
      ${raw.updated_at ? `<span>${t("updated")}</span><span>${fmtIso(raw.updated_at)}</span>` : ""}
      ${raw.version != null ? `<span>${t("a_version")}</span><span>${esc(raw.version)}</span>` : ""}
      ${x.analysis?.[0]?.unity ? `<span>Unity</span><span>${esc(x.analysis[0].unity)}</span>` : ""}
      ${ctags.length ? `<span>${t("a_content")}</span><span>${esc(ctags.join(", "))}</span>` : ""}
      ${atags.length ? `<span>${t("w_tags")}</span><span>${esc(atags.join(", "))}</span>` : ""}</div></div>`;
  // Size and performance: one card per platform
  if (x.analysis === null && raw.id) html += `<div class="pcard-section"><div class="lbl">${t("a_analysis")}</div><div class="pcard-note">${t("loading")}</div></div>`;
  if (x.analysis?.length) {
    const PL = { standalonewindows: "PC", android: "Quest / Android", ios: "iOS" };
    const num = v => v == null ? null : Number(v).toLocaleString();
    html += `<div class="pcard-section"><div class="lbl">${t("a_analysis")}</div><div class="pstats">${x.analysis.map(r => {
      const st = r.avatarStats || {}, perf = r.performanceRating || r.perf || raw.performance?.[r.platform] || "";
      const rows = [[t("a_size"), fmtBytes(r.fileSize)], [t("a_unc"), fmtBytes(r.uncompressedSize)], [t("a_polys"), num(st.totalPolygons)],
        [t("a_mats"), st.materialCount ?? st.materialSlotsUsed], [t("a_bones"), num(st.boneCount)],
        [t("a_pb"), st.physBoneComponentCount != null ? `${st.physBoneComponentCount} (${st.physBoneTransformCount ?? "?"} transforms)` : null],
        [t("a_skinned"), st.skinnedMeshCount], [t("a_meshes"), st.meshCount], [t("a_tex"), st.totalTextureUsage ? fmtBytes(st.totalTextureUsage) : null],
        [t("a_particles"), st.particleSystemCount], [t("a_audio"), st.audioSourceCount], [t("a_lights"), st.lightCount],
        [t("a_constraints"), st.constraintCount], [t("a_contacts"), st.contactCount]].filter(([, v]) => v !== null && v !== undefined && v !== "");
      return `<div class="pstat"><div class="phead"><b>${esc(PL[r.platform] || r.platform)}</b>
          ${r.variant === "impostor" ? `<span class="badge gray" style="margin:0" title="${escA(t("a_impostorHint"))}">Impostor</span>` : ""}
          ${perf ? `<span class="perf ${esc(perf.replace(/\s/g, ""))}">${esc(perf)}</span>` : ""}</div>
        ${rows.length ? `<div class="kv">${rows.map(([k, v]) => `<span>${k}</span><span>${esc(String(v))}</span>`).join("")}</div>`
          : `<div class="pcard-note" style="margin:0">${r.variant === "impostor" ? t("a_impostorHint") : r._error === 403 ? t("noPermission") : t("errGeneric")}</div>`}</div>`;
    }).join("")}</div></div>`;
  }
  if (html) { const d = document.createElement("div"); d.innerHTML = html; (body.querySelector(".pcard-actions") || body.querySelector(".pcard-note:last-child"))?.before(d); }
  const mine = a.authorId === AUTH.id, wearing = a.id === AVA.current;
  const main = `<button class="btn primary" ${wearing ? "disabled" : ""} onclick="useAvatar()">${icon("shirt")}${t(wearing ? "wearing" : "useAvatar")}</button>` + favButton("avatar", a.id);
  const menu = [{ ic: "shirt", label: t("a_fallback"), fn: `vrcDo('selectFallbackAvatar',{avatarId:'${a.id}'},'a_fallbackSet')` }];
  if (mine) menu.push({ ic: "pencil", label: t("a_edit"), fn: `editAvatarDialog('${a.id}')` });
  menu.push({ ic: "copy", label: t("copyId"), fn: `api('copy','${a.id}');toast(t('copied','${a.id}'))` },
            { ic: "external-link", label: t("openWeb"), fn: `api('open_url','https://vrchat.com/home/avatar/${a.id}')` },
            { ic: "ban", label: t(avatarBlocked(a.id) ? "a_unblock" : "m_avatarBlock"), fn: `avatarBlockToggle('${a.id}')` });
  placeActions(body, main, menu);
}
function editAvatarDialog(aid) {
  const a = avatarOpen?.id === aid ? avatarOpen : {};
  openX(t("a_edit"), () => `${fRow(t("name"), fInput("avName", a.name))}
    ${fRow(t("desc"), fArea("avDesc", a.description, 3))}
    ${fRow(t("a_release"), fSelect("avRel", { private: "Private", public: "Public" }, a.releaseStatus))}
    <div class="form-actions">${btn(t("save"), `saveAvatar('${aid}')`, "primary", "save")}</div>`);
}
async function saveAvatar(aid) {
  const body = { avatarId: aid, name: fv("avName"), description: fv("avDesc"), releaseStatus: fv("avRel") };
  const r = await vrcDo("updateAvatar", body, "saved");
  if (!r) return;
  closeX();
  Object.assign(avatarOpen, { name: body.name, description: body.description, releaseStatus: body.releaseStatus });
  for (const k of AVA_TABS) (AVA[k] || []).forEach(x => { if (x.id === aid) Object.assign(x, { name: body.name, description: body.description, releaseStatus: body.releaseStatus }); });
  buildAvatar(); renderView();
}

// ======================= Group card (full) =======================
tx({
  g_info: ["ข้อมูล", "About", "概要"], g_posts: ["โพสต์", "Posts", "投稿"], g_instances: ["ห้อง", "Instances", "インスタンス"],
  g_members: ["สมาชิก", "Members", "メンバー"], g_gallery: ["แกลเลอรี", "Gallery", "ギャラリー"], g_events: ["อีเวนต์", "Events", "イベント"],
  g_me: ["การตั้งค่าของฉัน", "My settings", "自分の設定"], g_admin: ["จัดการกลุ่ม", "Manage", "管理"],
  g_rules: ["กฎ", "Rules", "ルール"], g_announcement: ["ประกาศ", "Announcement", "お知らせ"], g_links: ["ลิงก์", "Links", "リンク"],
  g_cancelReq: ["ยกเลิกคำขอเข้าร่วม", "Cancel request", "申請を取り消す"], g_decline: ["ปฏิเสธคำเชิญ", "Decline invite", "招待を辞退"],
  g_declineBlock: ["ปฏิเสธและบล็อก", "Decline & block", "辞退してブロック"], g_block: ["บล็อกกลุ่ม", "Block group", "グループをブロック"],
  g_blocked: ["บล็อกกลุ่มแล้ว", "Group blocked", "グループをブロックしました"], g_acceptInvite: ["ยอมรับคำเชิญ", "Accept invite", "招待を承諾"],
  g_represent: ["แสดงกลุ่มนี้บนโปรไฟล์", "Represent this group", "このグループを代表にする"],
  g_memberVis: ["ให้คนอื่นเห็นว่าฉันอยู่กลุ่มนี้", "Membership visibility", "メンバーシップの公開"],
  g_vis_visible: ["ทุกคน", "Everyone", "全員"], g_vis_friends: ["เพื่อน", "Friends", "フレンド"], g_vis_hidden: ["ซ่อน", "Hidden", "非表示"],
  g_subAnn: ["รับแจ้งเตือนประกาศ", "Announcement notifications", "お知らせの通知"], g_subEvt: ["รับแจ้งเตือนอีเวนต์", "Event notifications", "イベントの通知"],
  g_joined: [d => `เข้าร่วมเมื่อ ${d}`, d => `Joined ${d}`, d => `${d} に参加`], g_roles: ["บทบาท", "Roles", "ロール"],
  g_kick: ["เตะออก", "Kick", "キック"], g_ban: ["แบน", "Ban", "BAN"], g_unban: ["ยกเลิกแบน", "Unban", "BAN 解除"],
  g_requests: ["คำขอเข้าร่วม", "Join requests", "参加リクエスト"], g_invites: ["คำเชิญที่ส่ง", "Sent invites", "送信した招待"],
  g_bans: ["ถูกแบน", "Bans", "BAN"], g_audit: ["บันทึกการจัดการ", "Audit log", "監査ログ"], g_edit: ["แก้ไขกลุ่ม", "Edit group", "グループを編集"],
  g_accept: ["ยอมรับ", "Accept", "承認"], g_reject: ["ปฏิเสธ", "Reject", "拒否"], g_rejectBlock: ["ปฏิเสธและบล็อก", "Reject & block", "拒否してブロック"],
  g_inviteFriend: ["เชิญเพื่อนเข้ากลุ่ม", "Invite a friend", "フレンドを招待"], g_newPost: ["โพสต์ใหม่", "New post", "新規投稿"],
  g_newAnn: ["ประกาศใหม่", "New announcement", "新しいお知らせ"], g_delAnn: ["ลบประกาศ", "Delete announcement", "お知らせを削除"],
  g_newGallery: ["สร้างแกลเลอรี", "New gallery", "ギャラリーを作成"], g_delGallery: ["ลบแกลเลอรี", "Delete gallery", "ギャラリーを削除"],
  g_addImage: ["เพิ่มรูปจากคลังรูป", "Add from my photos", "自分の写真から追加"], g_membersOnly: ["เฉพาะสมาชิก", "Members only", "メンバー限定"],
  g_newRole: ["สร้างบทบาท", "New role", "ロールを作成"], g_selfAssign: ["เลือกเองได้", "Self-assignable", "自分で付与可能"],
  g_perms: ["สิทธิ์", "Permissions", "権限"], g_newEvent: ["สร้างอีเวนต์", "New event", "イベントを作成"],
  g_joinState: ["การเข้าร่วม", "Join", "参加方法"], g_js_open: ["เข้าได้เลย", "Open", "誰でも"], g_js_request: ["ต้องขอ", "Request", "リクエスト"],
  g_js_invite: ["เชิญเท่านั้น", "Invite only", "招待のみ"], g_js_closed: ["ปิด", "Closed", "停止"],
  g_vis_group: ["สมาชิก", "Members", "メンバー"], g_vis_public: ["สาธารณะ", "Public", "公開"], g_pickFriend: ["เลือกเพื่อน", "Pick a friend", "フレンドを選択"],
  g_invited: ["ส่งคำเชิญแล้ว", "Invite sent", "招待を送りました"], g_noAdmin: ["ไม่มีสิทธิ์จัดการส่วนนี้", "No permission for this", "この操作の権限がありません"],
  g_cancelled: ["ยกเลิกคำขอแล้ว", "Request canceled", "申請を取り消しました"],
});
const GX = { tab: "info", admin: "requests", gallery: null, memberQ: "", memberOff: 0 };
openGroup = async function (g) {
  profileOpen = null; worldOpen = null; avatarOpen = null;
  groupOpen = { ...g };
  Object.assign(GX, { tab: "info", admin: "requests", gallery: null, memberQ: "", memberOff: 0 });
  dropCache("g_");
  buildGroup();
  $("pOverlay").classList.add("show");
  if (!AUTH.loggedIn || !g.id) return;
  const r = await vrc("getGroup", { groupId: g.id, includeRoles: true });
  if (r.ok && groupOpen?.id === g.id) {
    groupOpen = { ...g, ...r.ok, membershipStatus: r.ok.myMember?.membershipStatus || r.ok.membershipStatus };
    GX.gallery = r.ok.galleries?.[0]?.id || null;
    buildGroup();
    gLoad();
  } else if (r.error) apiError(r);
};
function openGroupId(gid) { closeX(); openGroup({ id: gid }); }
const gPerms = () => groupOpen?.myMember?.permissions || [];
const gCan = (...p) => gPerms().includes("*") || p.some(x => gPerms().includes(x));
const gIsAdmin = () => gPerms().some(p => p === "*" || /manage|kick|ban|invite|assign|audit|remove|edit|announcement|calendar/.test(p));
function gTab(tab) { GX.tab = tab; buildGroup(); gLoad(); }
function gAdminTab(tab) { GX.admin = tab; buildGroup(); gLoad(); }
// Load data for the current tab
function gLoad(force) {
  const gid = groupOpen?.id;
  if (!gid || !AUTH.loggedIn) return;
  const tab = GX.tab;
  if (tab === "info") loadOp("g_ann", "getGroupAnnouncements", { groupId: gid }, force);
  else if (tab === "posts") loadOp("g_posts", "getGroupPosts", { groupId: gid, n: 30 }, force);
  else if (tab === "instances") loadOp("g_inst", "getGroupInstances", { groupId: gid }, force);
  else if (tab === "members") GX.memberQ
    ? loadOp("g_mem", "searchGroupMembers", { groupId: gid, query: GX.memberQ, n: 50 }, true)
    : loadOp("g_mem", "getGroupMembers", { groupId: gid, n: 50, offset: GX.memberOff, sort: "joinedAt:desc" }, force);
  else if (tab === "gallery" && GX.gallery) loadOp("g_gal_" + GX.gallery, "getGroupGalleryImages", { groupId: gid, groupGalleryId: GX.gallery, n: 60 }, force);
  else if (tab === "events") loadOp("g_evt", "getGroupCalendarEvents", { groupId: gid, n: 30 }, force);
  else if (tab === "admin") {
    const a = GX.admin;
    if (a === "requests") loadOp("g_req", "getGroupRequests", { groupId: gid, n: 100 }, force);
    else if (a === "invites") loadOp("g_inv", "getGroupInvites", { groupId: gid, n: 100 }, force);
    else if (a === "bans") loadOp("g_bans", "getGroupBans", { groupId: gid, n: 100 }, force);
    else if (a === "audit") loadOp("g_audit", "getGroupAuditLogs", { groupId: gid, n: 50 }, force);
    else if (a === "roles") loadOp("g_perms", "getGroupPermissions", { groupId: gid });
  }
}

buildGroup = function () {
  const g = groupOpen, card = $("pcard");
  if (!g) return;
  card.classList.add("wide", "xwide");
  const st = g.membershipStatus, me = g.myMember || {};
  const iid = esc(g.id);
  // Main buttons depend on membership status, the rest go in the ⋯ menu
  let action = "";
  const menu = [];
  if (st === "member") {
    action = `<span class="badge" style="margin:0">${icon("circle-check")} ${t("joined")}</span>`;
    menu.push({ ic: "log-out", label: t("leaveGroup"), fn: "leaveGroup()", danger: true });
  } else if (st === "requested") action = btn(t("g_cancelReq"), "gCancelRequest()", "", "circle-x");
  else if (st === "invited") {
    action = btn(t("g_acceptInvite"), "joinGroup()", "primary", "circle-check") + btn(t("g_decline"), "gDecline(false)", "", "circle-x");
    menu.push({ ic: "ban", label: t("g_declineBlock"), fn: "gDecline(true)", danger: true });
  } else if (st === "userblocked") action = `<span class="badge gray" style="margin:0">${t("g_blocked")}</span>`;
  else {
    action = g.joinState === "open" ? btn(t("joinGroup"), "joinGroup()", "primary", "plus")
      : g.joinState === "request" ? btn(t("requestJoin"), "joinGroup()", "primary", "send") : `<button class="btn" disabled>${t("inviteOnly")}</button>`;
    if (AUTH.loggedIn && g.id) menu.push({ ic: "ban", label: t("g_block"), fn: "gBlock()", danger: true });
  }
  menu.unshift({ ic: "copy", label: t("copyId"), fn: `api('copy','${esc(g.id)}');toast(t('copied','${esc(g.id)}'))` },
               { ic: "external-link", label: t("openWeb"), fn: `api('open_url','https://vrchat.com/home/group/${esc(g.id)}')` });
  const tabs = { info: t("g_info"), posts: t("g_posts"), instances: t("g_instances"), members: t("g_members"),
    ...(g.galleries?.length || gCan("group-galleries-manage") ? { gallery: t("g_gallery") } : {}), events: t("g_events"),
    ...(st === "member" ? { me: t("g_me") } : {}), ...(gIsAdmin() ? { admin: t("g_admin") } : {}) };
  card.innerHTML = `<div class="wc-hero" ${thumbAttr(g.bannerUrl)}></div>
    <div class="pcard-body">
      <div class="gicon big" ${thumbAttr(g.iconUrl)}></div>
      <h3>${esc(g.name || "")}${g.isVerified ? ` <span class="verified">${icon("badge-check")}</span>` : ""}</h3>
      <div class="pcard-status">${esc(g.shortCode || "")}.${esc(g.discriminator || "")}</div>
      <div class="stats">${g.memberCount != null ? `<span><b>${Number(g.memberCount).toLocaleString()}</b> ${t("membersW")}</span>` : ""}
        ${g.onlineMemberCount != null ? `<span><b>${g.onlineMemberCount}</b> ${t("onlineW")}</span>` : ""}
        ${me.isRepresenting ? `<span class="badge">★</span>` : ""}</div>
      <div class="pact">${action}${menuBtn(menu)}</div>
      ${AUTH.loggedIn && g.id ? `<div class="ptabs">${tabsHtml(tabs, GX.tab, "gTab")}</div><div class="ptab-body" id="gBody">${gBody()}</div>` : ""}
      <div class="pcard-note" style="font-family:var(--mono)">${iid}</div>
    </div>`;
  fillSlots(card);
};

function gBody() {
  const g = groupOpen, tab = GX.tab;
  if (tab === "info") {
    const ann = got("g_ann");
    return `${ann?.title || ann?.text ? `<div class="post"><div class="meta">${icon("megaphone")}<b>${t("g_announcement")}</b>${fmtIso(ann.createdAt)}
        ${gCan("group-announcement-manage") ? `<span class="acts"><button class="mini-btn" title="${t("g_delAnn")}" onclick="confirmBtn(this,()=>gDo('deleteGroupAnnouncement',{},'deleted','g_ann'))">${icon("trash-2")}</button></span>` : ""}</div>
        <h4>${esc(ann.title || "")}</h4><div class="txt">${esc(ann.text || "")}</div>${ann.imageUrl ? `<div class="pimg" ${thumbAttr(ann.imageUrl)}></div>` : ""}</div>` : ""}
      ${g.description ? `<div class="pcard-bio">${esc(g.description)}</div>` : ""}
      ${g.rules ? `<div class="pcard-section"><div class="lbl">${t("g_rules")}</div><div class="pcard-bio" style="margin:0">${esc(g.rules)}</div></div>` : ""}
      ${linksHtml({ bioLinks: g.links || [] }).replace(t("links"), t("g_links"))}
      ${langsHtml({ languages: g.languages || [] })}
      ${g.createdAt ? `<div class="pcard-note">${fmtIso(g.createdAt, true)}</div>` : ""}`;
  }
  if (tab === "posts") {
    const c = CACHE.g_posts, posts = c?.data?.posts;
    const canPost = gCan("group-announcement-manage");
    return `${canPost ? `<div class="toolbar">${btn(t("g_newPost"), "gPostDialog()", "primary sm", "pencil-line")}${btn(t("g_newAnn"), "gAnnDialog()", "sm", "megaphone")}</div>` : ""}
      ${stateHtml(c && { ...c, data: posts }) || posts.map(p => `<div class="post"><div class="meta">${fmtIso(p.createdAt)}<span class="badge gray" style="margin:0">${t("g_vis_" + p.visibility) || p.visibility}</span>
        ${canPost ? `<span class="acts"><button class="mini-btn" title="${t("edit")}" onclick="gPostDialog('${esc(p.id)}')">${icon("pencil")}</button>
          <button class="mini-btn" title="${t("del")}" onclick="confirmBtn(this,()=>gDo('deleteGroupPost',{notificationId:'${esc(p.id)}'},'deleted','g_posts'))">${icon("trash-2")}</button></span>` : ""}</div>
        <h4>${esc(p.title)}</h4><div class="txt">${esc(p.text)}</div>${p.imageUrl ? `<div class="pimg" ${thumbAttr(p.imageUrl)}></div>` : ""}</div>`).join("")}`;
  }
  if (tab === "instances") {
    const c = CACHE.g_inst;
    return stateHtml(c) || c.data.map(i => lrow({ thumb: imgUrl(i.world), name: i.world?.name || i.location,
      sub: `${esc(itypeLabel(parseLoc(i.location)))} · ${t("people2", i.memberCount ?? "?")}`, onclick: `openWorld('${esc(i.world?.id || parseLoc(i.location).wid)}','${esc(i.location)}')`,
      acts: `<button class="mini-btn" title="${t("join")}" onclick="doLaunch('${esc(i.location)}')">${icon("rocket")}</button>
             <button class="mini-btn" title="${t("inviteMe")}" onclick="doInvite('${esc(i.location)}')">${icon("send")}</button>` })).join("");
  }
  if (tab === "members") {
    const c = CACHE.g_mem, roles = g.roles || [];
    const canKick = gCan("group-members-remove"), canBan = gCan("group-bans-manage"), canRole = gCan("group-roles-assign");
    return `<div class="toolbar"><input class="field grow" id="gmq" placeholder="${t("searchPh")}" value="${escA(GX.memberQ)}"
        onkeydown="if(event.key==='Enter'){GX.memberQ=this.value.trim();GX.memberOff=0;gLoad(true)}"></div>
      ${stateHtml(c) || c.data.map(m => lrow({ uid: m.userId, name: m.user?.displayName || m.userId,
        sub: `${t("g_joined", fmtIso(m.joinedAt || m.createdAt, true))}${(m.roleIds || []).length ? " · " + (m.roleIds || []).map(r => esc(roles.find(x => x.id === r)?.name || "")).filter(Boolean).join(", ") : ""}`,
        onclick: `showProfile('${esc(m.userId)}')`,
        acts: (canRole && roles.length ? `<button class="mini-btn" title="${t("g_roles")}" onclick="gRolesDialog('${esc(m.userId)}')">${icon("user-cog")}</button>` : "")
          + (canKick && m.userId !== AUTH.id ? `<button class="mini-btn" title="${t("g_kick")}" onclick="confirmBtn(this,()=>gDo('kickGroupMember',{userId:'${esc(m.userId)}'},'done','g_mem'))">${icon("door-open")}</button>` : "")
          + (canBan && m.userId !== AUTH.id ? `<button class="mini-btn" title="${t("g_ban")}" onclick="confirmBtn(this,()=>gDo('banGroupMember',{userId:'${esc(m.userId)}'},'done','g_mem'))">${icon("ban")}</button>` : "") })).join("")}
      ${!GX.memberQ && c?.data?.length === 50 ? `<div class="form-actions">${GX.memberOff ? btn("‹", "GX.memberOff-=50;gLoad(true)", "sm") : ""}${btn("›", "GX.memberOff+=50;gLoad(true)", "sm")}</div>` : ""}`;
  }
  if (tab === "gallery") {
    const gals = g.galleries || [], canManage = gCan("group-galleries-manage");
    const c = GX.gallery && CACHE["g_gal_" + GX.gallery];
    return `<div class="toolbar">${gals.length ? tabsHtml(Object.fromEntries(gals.map(x => [x.id, x.name])), GX.gallery, "gGallery") : ""}<span class="grow"></span>
        ${canManage ? btn(t("g_newGallery"), "gGalleryDialog()", "sm", "circle-plus") : ""}
        ${canManage && GX.gallery ? `<button class="btn sm danger" onclick="confirmBtn(this,()=>gDo('deleteGroupGallery',{groupGalleryId:GX.gallery},'deleted',null,true))">${icon("trash-2")}${t("g_delGallery")}</button>` : ""}
        ${GX.gallery ? btn(t("g_addImage"), "gAddImageDialog()", "sm", "image-plus") : ""}</div>
      ${!GX.gallery ? "" : stateHtml(c, "noItems") || `<div class="igrid photos">${c.data.map(im => `<div class="itile"><div class="iimg" ${thumbAttr(im.imageUrl)}></div>
        ${canManage || im.submittedByUserId === AUTH.id ? `<button class="mini-btn del" title="${t("del")}" onclick="confirmBtn(this,()=>gDo('deleteGroupGalleryImage',{groupGalleryId:GX.gallery,groupGalleryImageId:'${esc(im.id)}'},'deleted','g_gal_'+GX.gallery))">${icon("trash-2")}</button>` : ""}</div>`).join("")}</div>`}`;
  }
  if (tab === "events") {
    const c = CACHE.g_evt, list = c?.data?.results || c?.data;
    return `${gCan("group-calendar-manage") ? `<div class="toolbar">${btn(t("g_newEvent"), "eventDialog(groupOpen.id)", "primary sm", "calendar-plus")}</div>` : ""}
      ${stateHtml(c && { ...c, data: list }) || `<div class="wgrid">${list.map(eventCard).join("")}</div>`}`;
  }
  if (tab === "me") {
    const me = g.myMember || {};
    return `${fRow(t("g_represent"), `<label class="switch"><input type="checkbox" ${me.isRepresenting ? "checked" : ""} onchange="gRepresent(this.checked)"></label>`)}
      ${fRow(t("g_memberVis"), `<select class="field" onchange="gMember({visibility:this.value})">${["visible", "friends", "hidden"].map(v =>
        `<option value="${v}" ${me.visibility === v ? "selected" : ""}>${t("g_vis_" + v)}</option>`).join("")}</select>`)}
      ${fRow(t("g_subAnn"), `<label class="switch"><input type="checkbox" ${me.isSubscribedToAnnouncements ? "checked" : ""} onchange="gMember({isSubscribedToAnnouncements:this.checked})"></label>`)}
      ${fRow(t("g_subEvt"), `<label class="switch"><input type="checkbox" ${me.isSubscribedToEventAnnouncements ? "checked" : ""} onchange="gMember({isSubscribedToEventAnnouncements:this.checked})"></label>`)}
      ${me.joinedAt ? `<div class="pcard-note">${t("g_joined", fmtIso(me.joinedAt, true))}</div>` : ""}`;
  }
  if (tab === "admin") return gAdminBody();
  return "";
}
function gAdminBody() {
  const g = groupOpen, a = GX.admin;
  const tabs = { requests: t("g_requests"), invites: t("g_invites"), bans: t("g_bans"), roles: t("g_roles"), audit: t("g_audit"), edit: t("g_edit") };
  let inner = "";
  if (a === "requests") {
    const c = CACHE.g_req;
    inner = stateHtml(c) || c.data.map(m => lrow({ uid: m.userId, name: m.user?.displayName || m.userId, sub: fmtIso(m.createdAt), onclick: `showProfile('${esc(m.userId)}')`,
      acts: btn(t("g_accept"), `gDo('respondGroupJoinRequest',{userId:'${esc(m.userId)}',action:'accept'},'done','g_req')`, "primary sm")
        + btn(t("g_reject"), `gDo('respondGroupJoinRequest',{userId:'${esc(m.userId)}',action:'reject'},'done','g_req')`, "sm")
        + `<button class="btn sm danger" onclick="confirmBtn(this,()=>gDo('respondGroupJoinRequest',{userId:'${esc(m.userId)}',action:'reject',block:true},'done','g_req'))">${t("g_rejectBlock")}</button>` })).join("");
  } else if (a === "invites") {
    const c = CACHE.g_inv;
    inner = `<div class="toolbar">${btn(t("g_inviteFriend"), "gInviteDialog()", "primary sm", "user-plus")}</div>`
      + (stateHtml(c) || c.data.map(m => lrow({ uid: m.userId, name: m.user?.displayName || m.userId, sub: fmtIso(m.createdAt), onclick: `showProfile('${esc(m.userId)}')`,
        acts: `<button class="mini-btn" title="${t("remove")}" onclick="gDo('deleteGroupInvite',{userId:'${esc(m.userId)}'},'done','g_inv')">${icon("x")}</button>` })).join(""));
  } else if (a === "bans") {
    const c = CACHE.g_bans;
    inner = stateHtml(c) || c.data.map(m => lrow({ uid: m.userId, name: m.user?.displayName || m.userId, sub: fmtIso(m.bannedAt || m.createdAt), onclick: `showProfile('${esc(m.userId)}')`,
      acts: btn(t("g_unban"), `gDo('unbanGroupMember',{userId:'${esc(m.userId)}'},'done','g_bans')`, "sm") })).join("");
  } else if (a === "roles") {
    inner = `<div class="toolbar">${btn(t("g_newRole"), "gRoleDialog()", "primary sm", "circle-plus")}</div>`
      + (g.roles || []).sort((x, y) => (x.order ?? 0) - (y.order ?? 0)).map(r => lrow({ thumb: "", name: r.name,
        sub: `${esc(r.description || "")}${r.permissions?.length ? ` · ${r.permissions.length} ${t("g_perms")}` : ""}`,
        acts: btn(t("edit"), `gRoleDialog('${esc(r.id)}')`, "sm") + (r.isManagementRole || r.defaultRole ? ""
          : `<button class="mini-btn" title="${t("del")}" onclick="confirmBtn(this,()=>gDo('deleteGroupRole',{groupRoleId:'${esc(r.id)}'},'deleted',null,true))">${icon("trash-2")}</button>`) })
        .replace('<span class="lthumb" ></span>', "")).join("");
  } else if (a === "audit") {
    const c = CACHE.g_audit, list = c?.data?.results;
    inner = stateHtml(c && { ...c, data: list }) || list.map(l => `<div class="lrow"><div class="info"><div class="nm">${esc(l.description || l.eventType)}</div>
      <div class="sub">${esc(l.actorDisplayName || "")} · ${fmtIso(l.created_at)} · ${esc(l.eventType)}</div></div></div>`).join("");
  } else if (a === "edit") {
    inner = `${fRow(t("desc"), fArea("geDesc", g.description, 4))}
      ${fRow(t("g_rules"), fArea("geRules", g.rules, 4))}
      ${fRow(t("g_links"), fArea("geLinks", (g.links || []).join("\n"), 3), "1 / line")}
      ${fRow(t("languages"), langPicker("geLangs", g.languages || [], 0))}
      ${fRow(t("g_joinState"), fSelect("geJoin", { open: t("g_js_open"), request: t("g_js_request"), invite: t("g_js_invite"), closed: t("g_js_closed") }, g.joinState))}
      <div class="form-actions">${btn(t("save"), "gSaveEdit()", "primary", "save")}</div>`;
  }
  return `<div class="toolbar">${tabsHtml(tabs, a, "gAdminTab")}</div>${inner}`;
}
// Call an endpoint for the open group, then reload the affected parts (reloadGroup = reload all group data)
async function gDo(op, params, okKey, cacheKey, reloadGroup) {
  const r = await vrcDo(op, { groupId: groupOpen.id, ...params }, okKey);
  if (r === undefined) return;
  closeX();
  if (reloadGroup) return openGroupKeepTab();
  if (cacheKey) { delete CACHE[cacheKey]; gLoad(true); }
  return r;
}
async function openGroupKeepTab() {
  const tab = GX.tab, admin = GX.admin, gal = GX.gallery;
  await openGroup({ id: groupOpen.id });
  Object.assign(GX, { tab, admin, gallery: (groupOpen.galleries || []).some(x => x.id === gal) ? gal : groupOpen.galleries?.[0]?.id || null });
  buildGroup(); gLoad(true);
}
function gGallery(id) { GX.gallery = id; buildGroup(); gLoad(); }
async function gCancelRequest() {
  if ((await vrcDo("cancelGroupRequest", { groupId: groupOpen.id }, "g_cancelled")) !== undefined) { groupOpen.membershipStatus = null; buildGroup(); }
}
async function gDecline(block) {
  if ((await vrcDo("declineGroupInvite", { groupId: groupOpen.id, block }, "done")) !== undefined) { groupOpen.membershipStatus = block ? "userblocked" : null; buildGroup(); dropCache("ug_"); }
}
async function gBlock() {
  if ((await vrcDo("blockGroup", { groupId: groupOpen.id }, "g_blocked")) !== undefined) { groupOpen.membershipStatus = "userblocked"; buildGroup(); dropCache("ug_"); }
}
async function gRepresent(on) {
  if ((await vrcDo("updateGroupRepresentation", { groupId: groupOpen.id, isRepresenting: on }, "saved")) !== undefined) {
    groupOpen.myMember = { ...groupOpen.myMember, isRepresenting: on };
    for (const k in PX) delete PX[k].rep;
  }
  buildGroup();
}
async function gMember(change) {
  const r = await vrcDo("updateGroupMember", { groupId: groupOpen.id, userId: AUTH.id, ...change }, "saved");
  if (r !== undefined) groupOpen.myMember = { ...groupOpen.myMember, ...change };
  buildGroup();
}
function gPostDialog(pid) {
  const p = pid ? (got("g_posts")?.posts || []).find(x => x.id === pid) || {} : {};
  openX(t(pid ? "edit" : "g_newPost"), () => `${fRow(t("title"), fInput("gpTitle", p.title))}${fRow(t("text"), fArea("gpText", p.text, 6))}
    ${fRow(t("visibility"), fSelect("gpVis", { group: t("g_vis_group"), public: t("g_vis_public") }, p.visibility || "group"))}
    ${fRow(t("notify"), fCheck("gpNotify", !pid))}
    <div class="form-actions">${btn(t("save"), `gSavePost('${pid || ""}')`, "primary", "send")}</div>`);
}
async function gSavePost(pid) {
  const body = { title: fv("gpTitle"), text: fv("gpText"), visibility: fv("gpVis"), sendNotification: fv("gpNotify") };
  if (!body.title || !body.text) return toast(t("errGeneric"));
  await gDo(pid ? "updateGroupPost" : "addGroupPost", pid ? { ...body, notificationId: pid } : body, "saved", "g_posts");
}
function gAnnDialog() {
  openX(t("g_newAnn"), () => `${fRow(t("title"), fInput("gaTitle"))}${fRow(t("text"), fArea("gaText", "", 6))}${fRow(t("notify"), fCheck("gaNotify", true))}
    <div class="form-actions">${btn(t("save"), "gSaveAnn()", "primary", "megaphone")}</div>`);
}
async function gSaveAnn() {
  const body = { title: fv("gaTitle"), text: fv("gaText"), sendNotification: fv("gaNotify") };
  if (!body.title || !body.text) return toast(t("errGeneric"));
  if (await gDo("createGroupAnnouncement", body, "saved", "g_ann")) { GX.tab = "info"; buildGroup(); }
}
function gGalleryDialog() {
  openX(t("g_newGallery"), () => `${fRow(t("name"), fInput("ggName"))}${fRow(t("desc"), fArea("ggDesc", "", 3))}${fRow(t("g_membersOnly"), fCheck("ggMembers", false))}
    <div class="form-actions">${btn(t("create"), "gSaveGallery()", "primary", "circle-plus")}</div>`);
}
async function gSaveGallery() {
  if (!fv("ggName")) return;
  await gDo("createGroupGallery", { name: fv("ggName"), description: fv("ggDesc"), membersOnly: fv("ggMembers") }, "saved", null, true);
}
async function gAddImageDialog() {
  if (!INV.data.gallery) await loadInv("gallery");
  openX(t("g_addImage"), () => `<div class="igrid photos">${(INV.data.gallery || []).map(f => `<div class="itile" onclick="gDo('addGroupGalleryImage',{groupGalleryId:GX.gallery,fileId:'${esc(f.id)}'},'done','g_gal_'+GX.gallery)">
      <div class="iimg" ${thumbAttr(f.url)}></div></div>`).join("") || `<div class="empty-state" style="height:100px">${t("noItems")}</div>`}</div>`, null, true);
}
function gRolesDialog(uid) {
  const mem = (got("g_mem") || []).find(m => m.userId === uid) || {};
  const has = new Set(mem.roleIds || []);
  openX(`${t("g_roles")} — ${mem.user?.displayName || uid}`, () => `<div class="opt-list">${(groupOpen.roles || []).filter(r => !r.defaultRole).map(r =>
    `<button class="opt ${has.has(r.id) ? "on" : ""}" onclick="gToggleRole('${esc(uid)}','${esc(r.id)}',${has.has(r.id)})">${icon(has.has(r.id) ? "circle-check" : "circle")}<b>${esc(r.name)}</b></button>`).join("")}</div>`);
}
async function gToggleRole(uid, rid, on) {
  const r = await vrcDo(on ? "removeGroupMemberRole" : "addGroupMemberRole", { groupId: groupOpen.id, userId: uid, groupRoleId: rid }, "saved");
  if (r === undefined) return;
  const mem = (got("g_mem") || []).find(m => m.userId === uid);
  if (mem) mem.roleIds = on ? (mem.roleIds || []).filter(x => x !== rid) : [...(mem.roleIds || []), rid];
  gRolesDialog(uid); buildGroup();
}
function gRoleDialog(rid) {
  const role = rid ? (groupOpen.roles || []).find(r => r.id === rid) || {} : {};
  const perms = got("g_perms") || [];
  const have = new Set(role.permissions || []);
  openX(t(rid ? "edit" : "g_newRole"), () => `${fRow(t("name"), fInput("grName", role.name))}${fRow(t("desc"), fArea("grDesc", role.description, 2))}
    ${fRow(t("g_selfAssign"), fCheck("grSelf", role.isSelfAssignable))}
    <div class="pcard-section"><div class="lbl">${t("g_perms")}</div>${perms.length ? perms.map(p => `<label class="toggle-row" title="${escA(p.help || "")}">
      <span class="label">${esc(p.displayName || p.name)}</span><span class="switch"><input type="checkbox" class="grPerm" value="${escA(p.name)}" ${have.has(p.name) ? "checked" : ""}></span></label>`).join("") : t("loading")}</div>
    <div class="form-actions">${btn(t("save"), `gSaveRole('${rid || ""}')`, "primary", "save")}</div>`, null, true);
}
async function gSaveRole(rid) {
  const permissions = [...document.querySelectorAll(".grPerm:checked")].map(x => x.value);
  const body = { name: fv("grName"), description: fv("grDesc"), isSelfAssignable: fv("grSelf"), permissions };
  if (!body.name) return;
  await gDo(rid ? "updateGroupRole" : "createGroupRole", rid ? { ...body, groupRoleId: rid } : body, "saved", null, true);
}
function gInviteDialog() {
  let q = "";
  openX(t("g_pickFriend"), () => {
    const list = Object.values(FRIENDS).filter(f => !q || (f.displayName || "").toLowerCase().includes(q))
      .sort((a, b) => (a.displayName || "").localeCompare(b.displayName || "")).slice(0, 80);
    return `<input class="field" id="gifq" placeholder="${t("searchPh")}" style="margin-bottom:10px">
      ${list.map(f => lrow({ uid: f.id, name: f.displayName, sub: "", acts: btn(t("inv_send"), `gDo('createGroupInvite',{userId:'${esc(f.id)}'},'g_invited','g_inv')`, "primary sm", "send") })).join("")}`;
  }, () => {
    const inp = $("gifq");
    inp.value = q;
    inp.oninput = () => { q = inp.value.trim().toLowerCase(); buildX(); const n = $("gifq"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
  });
}
async function gSaveEdit() {
  const body = { description: fv("geDesc"), rules: fv("geRules"), joinState: fv("geJoin"),
    links: fv("geLinks").split("\n").map(s => s.trim()).filter(Boolean), languages: fv("geLangs").split(/[,\s]+/).filter(Boolean) };
  await gDo("updateGroup", body, "saved", null, true);
}

// ======================= Groups page: mine / invites / requests / blocked / group instances =======================
tx({
  gt_mine: ["กลุ่มของฉัน", "My groups", "参加中"], gt_invited: ["คำเชิญ", "Invites", "招待"], gt_requested: ["คำขอที่ส่ง", "Requested", "申請中"],
  gt_blocked: ["ที่บล็อก", "Blocked", "ブロック中"], gt_instances: ["ห้องของกลุ่ม", "Group instances", "グループインスタンス"],
});
const GT = { tab: "mine" };
renderGroups = function () {
  const el = $("v_groups");
  if (!AUTH.loggedIn) return needLogin(el);
  if (!el.querySelector(".search-head")) {
    el.innerHTML = `<div class="search-head">${sboxHtml("gq")}</div><div id="gtabs" class="toolbar"></div><div id="gres"></div>`;
    wireSbox("gq", searchGroups, () => { GRP.results = null; renderView(); });
    $("gq").oninput = e => { if (!e.target.value.trim() && GRP.results) { GRP.results = null; renderView(); } };
  }
  $("gq").placeholder = t("g_searchPh");
  $("gtabs").innerHTML = GRP.results ? "" : tabsHtml({ mine: t("gt_mine"), invited: t("gt_invited"), requested: t("gt_requested"),
    blocked: t("gt_blocked"), instances: t("gt_instances") }, GT.tab, "gtSet");
  const res = $("gres");
  if (GRP.results || GT.tab === "mine") {
    if (!GRP.mine && !GRP.loading) loadGroups();
    const list = GRP.results ?? (GRP.mine || []).filter(g => !query || g.name?.toLowerCase().includes(query));
    res.innerHTML = `<div class="sec-head">${t(GRP.results ? "g_results" : "g_mine")} <span class="n">${list.length}</span></div>`;
    if (GRP.loading) return res.insertAdjacentHTML("beforeend", `<div class="empty-state" style="height:160px">${t("loading")}</div>`);
    if (!list.length) return res.insertAdjacentHTML("beforeend", `<div class="empty-state" style="height:160px">${t("noResults")}</div>`);
    const grid = document.createElement("div");
    grid.className = "wgrid";
    list.forEach(g => grid.appendChild(groupCard(g)));
    return res.appendChild(grid);
  }
  const ops = { invited: "getInvitedGroups", requested: "getUserGroupRequests", blocked: "getBlockedGroups", instances: "getUserGroupInstances" };
  const c = CACHE["ug_" + GT.tab];
  if (!c) loadOp("ug_" + GT.tab, ops[GT.tab]);
  if (GT.tab === "instances") {
    const list = c?.data?.instances;
    const name = gid => (GRP.mine || []).find(g => g.id === gid)?.name || "";
    res.innerHTML = stateHtml(c && { ...c, data: list }, "noResults", 160) || list.map(i => lrow({ thumb: imgUrl(i.world), name: i.world?.name || i.location,
      sub: [esc(name(i.ownerId)), esc(itypeLabel(parseLoc(i.location))), `${i.n_users ?? i.userCount ?? "?"}/${i.capacity ?? "?"}`].filter(Boolean).join(" · "),
      onclick: `openWorld('${esc(i.worldId || i.world?.id)}','${esc(i.location)}')`,
      acts: `<button class="mini-btn" title="${t("join")}" onclick="doLaunch('${esc(i.location)}')">${icon("rocket")}</button>
             <button class="mini-btn" title="${t("inviteMe")}" onclick="doInvite('${esc(i.location)}')">${icon("send")}</button>` })).join("");
    return;
  }
  res.innerHTML = stateHtml(c, "noResults", 160);
  if (!res.innerHTML) {
    const grid = document.createElement("div");
    grid.className = "wgrid";
    c.data.forEach(g => grid.appendChild(groupCard({ ...g, id: g.groupId || g.id, membershipStatus: g.myMember?.membershipStatus || g.membershipStatus })));
    res.appendChild(grid);
  }
};
function gtSet(tab) { GT.tab = tab; renderView(); }
VIEW_REFRESH.groups = () => { GRP.results = null; dropCache("ug_"); loadGroups(true); };

// ======================= Events (calendar) + Jams =======================
tx({
  ev_featured: ["แนะนำ", "Featured", "おすすめ"], ev_following: ["ที่ติดตาม", "Following", "フォロー中"], ev_upcoming: ["กำลังจะมา", "Upcoming", "今後"],
  ev_live: ["กำลังจัด", "Live now", "開催中"], ev_mine: ["กลุ่มของฉัน", "My groups", "参加グループ"], ev_jams: ["Jams", "Jams", "Jams"],
  ev_follow: ["ติดตาม", "Follow", "フォロー"], ev_unfollow: ["เลิกติดตาม", "Unfollow", "フォロー解除"], ev_ics: ["บันทึกลงปฏิทิน (.ics)", "Save to calendar (.ics)", "カレンダーに保存 (.ics)"],
  ev_interested: [n => `สนใจ ${n} คน`, n => `${n} interested`, n => `${n} 人が興味あり`], ev_group: ["กลุ่มผู้จัด", "Host group", "主催グループ"],
  ev_category: ["หมวด", "Category", "カテゴリ"], ev_platforms: ["แพลตฟอร์ม", "Platforms", "プラットフォーム"], ev_access: ["ใครเข้าได้", "Access", "アクセス"],
  ev_saved: ["บันทึกไฟล์แล้ว", "File saved", "ファイルを保存しました"], ev_submissions: ["ผลงานที่ส่ง", "Submissions", "投稿作品"],
  ev_state: ["สถานะ", "State", "状態"],
});
const EV_CATS = ["hangout", "music", "dance", "gaming", "performance", "roleplaying", "exploration", "film_media", "arts", "avatars", "education", "wellness", "other"];
const EV = { tab: "featured" };
const EV_LOAD = {
  featured: () => loadOp("ev_featured", "getFeaturedCalendarEvents", { n: 60 }),
  following: () => loadOp("ev_following", "getFollowedCalendarEvents", { n: 60 }),
  upcoming: () => loadOp("ev_upcoming", "discoverCalendarEvents", { scope: "upcoming", n: 60 }),
  live: () => loadOp("ev_live", "discoverCalendarEvents", { scope: "live", n: 60 }),
  mine: () => loadOp("ev_mine", "getCalendarEvents", { n: 60 }),
  jams: () => loadOp("ev_jams", "getJams"),
};
function renderEvents() {
  const el = $("v_events");
  if (!AUTH.loggedIn) return needLogin(el);
  const c = CACHE["ev_" + EV.tab];
  if (!c) EV_LOAD[EV.tab]();
  const head = `<div class="toolbar">${tabsHtml(Object.fromEntries(Object.keys(EV_LOAD).map(k => [k, t("ev_" + k)])), EV.tab, "evSet")}</div>`;
  if (EV.tab === "jams") {
    el.innerHTML = head + (stateHtml(c, "noResults", 160) || c.data.map(j => lrow({ thumb: "", name: j.title,
      sub: `${esc(j.state || "")} · ${fmtIso(j.stateChangeDates?.submissionsOpened, true)} – ${fmtIso(j.stateChangeDates?.closed, true)}`, onclick: `openJam('${esc(j.id)}')` })
      .replace('<span class="lthumb" ></span>', "")).join(""));
    return;
  }
  const list = (c?.data?.results || c?.data || []).filter(e => !query || (e.title || "").toLowerCase().includes(query));
  el.innerHTML = head + (stateHtml(c && { ...c, data: list }, "noResults", 160) || `<div class="wgrid">${list.map(eventCard).join("")}</div>`);
}
function evSet(tab) { EV.tab = tab; renderView(); }
VIEW_REFRESH.events = () => { delete CACHE["ev_" + EV.tab]; renderView(); };
const EVENTS = {};  // id -> event (for opening details)
function eventCard(e) {
  EVENTS[e.id] = e;
  const now = Date.now(), live = new Date(e.startsAt) <= now && now < new Date(e.endsAt);
  return `<div class="wcard ecard" onclick="openEvent('${esc(e.id)}')"><div class="wimg" ${thumbAttr(e.imageUrl)}>${live ? `<span class="live-tag">LIVE</span>` : ""}</div>
    <div class="winfo"><div class="when">${fmtIso(e.startsAt)}</div><div class="nm">${esc(e.title)}</div>
    <div class="sub">${esc(t("evc_" + e.category) || e.category || "")}${e.interestedUserCount ? " · " + t("ev_interested", e.interestedUserCount) : ""}${e.userInterest?.isFollowing ? " · ★" : ""}</div></div></div>`;
}
tx(Object.fromEntries(EV_CATS.map(c => ["evc_" + c, {
  hangout: ["แฮงเอาต์", "Hangout", "交流"], music: ["ดนตรี", "Music", "音楽"], dance: ["เต้น", "Dance", "ダンス"], gaming: ["เกม", "Gaming", "ゲーム"],
  performance: ["การแสดง", "Performance", "パフォーマンス"], roleplaying: ["โรลเพลย์", "Roleplaying", "ロールプレイ"], exploration: ["สำรวจ", "Exploration", "探検"],
  film_media: ["ภาพยนตร์/สื่อ", "Film & Media", "映像・メディア"], arts: ["ศิลปะ", "Arts", "アート"], avatars: ["อวตาร", "Avatars", "アバター"],
  education: ["การศึกษา", "Education", "教育"], wellness: ["สุขภาพ", "Wellness", "ウェルネス"], other: ["อื่นๆ", "Other", "その他"],
}[c]])));
const PLAT = { standalonewindows: "PC", android: "Android", ios: "iOS" };
function openEvent(id) {
  const e = EVENTS[id];
  if (!e) return;
  if (e.ownerId && !CACHE["gname_" + e.ownerId]) loadOp("gname_" + e.ownerId, "getGroup", { groupId: e.ownerId });
  openX(e.title, () => {
    const following = e.userInterest?.isFollowing;
    return `${e.imageUrl ? `<div class="post" style="padding:0;border:none"><div class="pimg" style="margin:0" ${thumbAttr(e.imageUrl)}></div></div>` : ""}
      <div class="kv" style="margin:12px 2px">
        <span>${t("start")}</span><span>${fmtIso(e.startsAt)}</span><span>${t("end")}</span><span>${fmtIso(e.endsAt)}</span>
        <span>${t("ev_category")}</span><span>${esc(t("evc_" + e.category) || e.category || "")}</span>
        ${e.accessType ? `<span>${t("ev_access")}</span><span>${esc(t("g_vis_" + (e.accessType === "group" ? "group" : "public")))}</span>` : ""}
        ${e.platforms?.length ? `<span>${t("ev_platforms")}</span><span>${esc(e.platforms.map(p => PLAT[p] || p).join(", "))}</span>` : ""}
        ${e.languages?.length ? `<span>${t("languages")}</span><span>${esc(e.languages.join(", "))}</span>` : ""}
        ${e.interestedUserCount ? `<span></span><span>${t("ev_interested", e.interestedUserCount)}</span>` : ""}
        ${e.ownerId ? `<span>${t("ev_group")}</span><span class="link" onclick="openGroupId('${esc(e.ownerId)}')">${esc(got("gname_" + e.ownerId)?.name || e.ownerId)}</span>` : ""}</div>
      ${e.description ? `<div class="pcard-bio" style="white-space:pre-wrap">${esc(e.description)}</div>` : ""}
      ${e.tags?.length ? `<div class="chips">${e.tags.map(x => `<span class="chip lang">${esc(x)}</span>`).join("")}</div>` : ""}
      <div class="form-actions">
        ${btn(t(following ? "ev_unfollow" : "ev_follow"), `followEvent('${esc(id)}',${!following})`, following ? "" : "primary", "star")}
        ${btn(t("ev_ics"), `saveIcs('${esc(id)}')`, "", "calendar-check")}
        ${gEditable(e) ? btn(t("edit"), `eventDialog('${esc(e.ownerId)}','${esc(id)}')`, "", "pencil")
          + `<button class="btn danger" onclick="confirmBtn(this,()=>deleteEvent('${esc(id)}'))">${icon("trash-2")}${t("del")}</button>` : ""}</div>`;
  }, null, true);
}
const gEditable = e => groupOpen?.id === e.ownerId && gCan("group-calendar-manage");
async function followEvent(id, on) {
  const e = EVENTS[id];
  const r = await vrcDo("followGroupCalendarEvent", { groupId: e.ownerId, calendarId: id, isFollowing: on }, "saved");
  if (r === undefined) return;
  e.userInterest = { ...e.userInterest, isFollowing: on };
  delete CACHE.ev_following;
  buildX(); renderView();
}
async function saveIcs(id) {
  const e = EVENTS[id];
  const r = await api("vrc_save", "getGroupCalendarEventICS", { groupId: e.ownerId, calendarId: id }, (e.title || "event") + ".ics");
  if (r?.ok) toast(t("ev_saved")); else if (r?.error) apiError(r);
}
async function deleteEvent(id) {
  const e = EVENTS[id];
  if ((await vrcDo("deleteGroupCalendarEvent", { groupId: e.ownerId, calendarId: id }, "deleted")) === undefined) return;
  closeX(); delete CACHE.g_evt; gLoad(true);
}
// Create/edit form for group events (times are local, sent as ISO)
function eventDialog(gid, id) {
  const e = id ? EVENTS[id] || {} : {};
  const local = iso => { if (!iso) return ""; const d = new Date(iso); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
  const start = e.startsAt || new Date(Date.now() + 3600000).toISOString(), end = e.endsAt || new Date(Date.now() + 3 * 3600000).toISOString();
  openX(t(id ? "edit" : "g_newEvent"), () => `${fRow(t("title"), fInput("evTitle", e.title))}${fRow(t("desc"), fArea("evDesc", e.description, 5))}
    ${fRow(t("start"), fInput("evStart", local(start), 'type="datetime-local"'))}${fRow(t("end"), fInput("evEnd", local(end), 'type="datetime-local"'))}
    ${fRow(t("ev_category"), fSelect("evCat", Object.fromEntries(EV_CATS.map(c => [c, t("evc_" + c)])), e.category || "hangout"))}
    ${fRow(t("ev_access"), fSelect("evAccess", { group: t("g_vis_group"), public: t("g_vis_public") }, e.accessType || "group"))}
    ${fRow(t("ev_platforms"), ["standalonewindows", "android", "ios"].map(p => `<label class="chip lang"><input type="checkbox" class="evPlat" value="${p}" ${!e.platforms || e.platforms.includes(p) ? "checked" : ""}> ${{ standalonewindows: "PC", android: "Android", ios: "iOS" }[p]}</label>`).join(""))}
    ${fRow(t("languages"), langPicker("evLangs", e.languages || [], 0))}
    ${id ? "" : fRow(t("notify"), fCheck("evNotify", true))}
    <div class="form-actions">${btn(t("save"), `saveEvent('${esc(gid)}','${esc(id || "")}')`, "primary", "calendar-check")}</div>`, null, true);
}
async function saveEvent(gid, id) {
  const body = { title: fv("evTitle"), description: fv("evDesc"), startsAt: new Date(fv("evStart")).toISOString(), endsAt: new Date(fv("evEnd")).toISOString(),
    category: fv("evCat"), accessType: fv("evAccess"), platforms: [...document.querySelectorAll(".evPlat:checked")].map(x => x.value),
    languages: fv("evLangs").split(/[,\s]+/).filter(Boolean) };
  if (!id) body.sendCreationNotification = fv("evNotify");
  if (!body.title) return;
  const r = await vrcDo(id ? "updateGroupCalendarEvent" : "createGroupCalendarEvent", { groupId: gid, ...(id ? { calendarId: id } : {}), ...body }, "saved");
  if (r === undefined) return;
  closeX(); delete CACHE.g_evt; dropCache("ev_"); gLoad(true);
}
async function openJam(id) {
  loadOp("jam_" + id, "getJam", { jamId: id });
  loadOp("jams_" + id, "getJamSubmissions", { jamId: id });
  openX("Jam", () => {
    const j = got("jam_" + id) || {}, c = CACHE["jams_" + id];
    return `<h3 style="margin:0 0 6px">${esc(j.title || "")}</h3><div class="kv"><span>${t("ev_state")}</span><span>${esc(j.state || "")}</span>
      ${Object.entries(j.stateChangeDates || {}).map(([k, v]) => `<span>${esc(k)}</span><span>${fmtIso(v)}</span>`).join("")}</div>
      ${j.description ? `<div class="pcard-bio" style="white-space:pre-wrap">${esc(j.description)}</div>` : ""}
      ${j.moreInfo ? `<div class="pcard-bio" style="white-space:pre-wrap">${esc(j.moreInfo)}</div>` : ""}
      <div class="pcard-section"><div class="lbl">${t("ev_submissions")}</div>${stateHtml(c) || c.data.map(s => lrow({ thumb: "", name: s.contentId,
        sub: `${esc(s.description || "")} ${s.ratingScore != null ? "· " + s.ratingScore : ""}`,
        onclick: s.contentId?.startsWith("wrld_") ? `closeX();openWorld('${esc(s.contentId)}','')` : "" }).replace('<span class="lthumb" ></span>', "")).join("")}</div>`;
  }, null, true);
}

// ======================= Notifications (legacy + NotificationV2) =======================
tx({
  n_v1: ["แจ้งเตือน", "Notifications", "通知"], n_v2: ["แจ้งเตือนอื่นๆ (กลุ่ม, ของขวัญ, ระบบ)", "Other notifications (groups, gifts, system)", "その他の通知 (グループ・ギフト・システム)"],
  n_clearAll: ["ล้างทั้งหมด", "Clear all", "すべて消去"], n_seen: ["อ่านแล้ว", "Mark read", "既読にする"], n_reply: ["ตอบกลับ", "Reply", "返信"],
  n_sendInvite: ["ส่ง Invite", "Send invite", "招待を送る"], n_declineMsg: ["ปฏิเสธพร้อมข้อความ", "Decline with message", "メッセージ付きで断る"],
  n_inviteResponse: ["ตอบกลับคำเชิญ", "replied to your invite", "招待に返信しました"], n_requestInviteResponse: ["ตอบกลับคำขอ invite", "replied to your invite request", "招待リクエストに返信しました"],
  n_message: ["ส่งข้อความ", "sent a message", "メッセージ"], n_votetokick: ["โหวตเตะ", "vote to kick", "キック投票"],
  n_unsub: ["เลิกรับแจ้งเตือน", "Unsubscribe", "購読解除"], n_respondTitle: ["ตอบกลับ", "Respond", "返信"], n_deleted: ["ลบแล้ว", "Deleted", "削除しました"],
});
const N2 = { list: null, loading: false };
async function loadN2(force) {
  if (!AUTH.loggedIn || N2.loading || (N2.list && !force)) return;
  N2.loading = true;
  const r = await vrc("getNotificationV2s", { limit: 100 });
  N2.loading = false;
  N2.list = r.ok || [];
  buildNav();
  if (view === "notifs") renderView();
}
const _buildNav = buildNav;
buildNav = function () {
  _buildNav();
  const n2 = (N2.list || []).filter(n => !n.seen).length;
  if (n2) {
    const b = document.querySelector(`.nav-item[onclick*="'notifs'"]`);
    const badge = b?.querySelector(".nav-badge");
    if (badge) badge.textContent = NOTIFS.length + n2;
    else b?.insertAdjacentHTML("beforeend", `<span class="nav-badge hot">${n2}</span>`);
  }
};
renderNotifs = function () {
  const el = $("v_notifs");
  if (!AUTH.loggedIn) return needLogin(el);
  if (!N2.list && !N2.loading) loadN2();
  const scroll = el.scrollTop;
  el.innerHTML = `<div class="sec-head">${t("n_v1")} <span class="n">${NOTIFS.length}</span>
    ${NOTIFS.length ? `<button class="btn" style="padding:3px 12px" onclick="confirmBtn(this,()=>vrcDo('clearNotifications',{},'done'))">${t("n_clearAll")}</button>` : ""}</div>`;
  if (!NOTIFS.length) el.insertAdjacentHTML("beforeend", `<div class="empty-state" style="height:80px">${t("noNotifs")}</div>`);
  for (const n of [...NOTIFS].sort((a, b) => (b.t || "").localeCompare(a.t || ""))) el.appendChild(notifCard(n));
  const v2 = N2.list || [];
  el.insertAdjacentHTML("beforeend", `<div class="sec-head" style="margin-top:16px">${t("n_v2")} <span class="n">${v2.length}</span>
    ${v2.length ? `<button class="btn" style="padding:3px 12px" onclick="confirmBtn(this,()=>n2DeleteAll())">${t("n_clearAll")}</button>` : ""}</div>`);
  if (N2.loading && !N2.list) el.insertAdjacentHTML("beforeend", `<div class="empty-state" style="height:80px">${t("loading")}</div>`);
  else if (!v2.length) el.insertAdjacentHTML("beforeend", `<div class="empty-state" style="height:80px">${t("noNotifs")}</div>`);
  for (const n of v2) el.appendChild(notif2Card(n));
  fillSlots(el);
  el.scrollTop = scroll;
};
VIEW_REFRESH.notifs = () => { api("friends_reload"); loadN2(true); };
function notifCard(n) {
  const wid = parseLoc(n.world).wid, wname = n.worldName || WORLDS[wid]?.name || "";
  const d = n.details || {};
  const c = document.createElement("div");
  c.className = "ncard" + (n.seen ? "" : " unseen");
  let acts = "";
  if (n.type === "friendRequest") acts = btn(t("accept"), `respond('${n.id}',true)`, "primary") + btn(t("decline"), `respond('${n.id}',false)`);
  else if (n.type === "invite") acts = btn(t("join"), `doLaunch('${esc(n.world)}')`, "primary") + btn(t("n_reply"), `respondDialog('${n.id}','response')`)
    + btn(t("dismiss"), `respond('${n.id}',false)`);
  else if (n.type === "requestInvite") acts = btn(t("n_sendInvite"), `answerRequest('${n.id}','${esc(n.from)}')`, "primary")
    + btn(t("n_declineMsg"), `respondDialog('${n.id}','requestResponse')`) + btn(t("dismiss"), `respond('${n.id}',false)`);
  else acts = (n.seen ? "" : btn(t("n_seen"), `markSeen('${n.id}')`)) + btn(t("dismiss"), `respond('${n.id}',false)`);
  c.innerHTML = `<span class="slot" data-uid="${esc(n.from)}" data-name="${escA(n.name)}"></span><div class="info"><div class="nm"></div><div class="sub"></div></div><div class="acts">${acts}</div>`;
  c.querySelector(".nm").textContent = n.name || n.from;
  c.querySelector(".nm").onclick = () => showProfile(n.from, n.name);
  const msg = n.msg || d.inviteMessage || d.requestMessage || d.responseMessage || "";
  c.querySelector(".sub").textContent = `${t("n_" + n.type, wname)}${msg ? ` — “${msg}”` : ""} · ${n.t ? new Date(n.t).toLocaleString(S.lang) : ""}`;
  return c;
}
async function markSeen(id) {
  if ((await vrcDo("markNotificationAsRead", { notificationId: id })) === undefined) return;
  const n = NOTIFS.find(x => x.id === id);
  if (n) n.seen = true;
  renderView();
}
async function answerRequest(id, uid) {
  const loc = myLoc();
  if (!loc) return toast(t("inv_noLoc"));
  if ((await vrcDo("inviteUser", { userId: uid, instanceId: loc }, "inv_sent")) !== undefined) respond(id, false);
}
// Reply to an invite / decline an invite request with a preset message (image attachment with VRC+)
function respondDialog(id, type) {
  INV_PHOTO = null;
  inviteMsgs(type);
  openX(t("n_respondTitle"), () => `${fRow(t("inv_msg"), fSelect("invSlot", msgOptions(type), "0"))}${photoRow()}
    <div class="form-actions">${btn(t("inv_send"), `sendRespond('${id}')`, "primary", "reply")}</div>`);
}
async function sendRespond(id) {
  const p = { notificationId: id, responseSlot: +(fv("invSlot") || 0) };
  const r = await vrcDo(INV_PHOTO ? "respondInviteWithPhoto" : "respondInvite", INV_PHOTO ? { ...p, _image: INV_PHOTO } : p, "inv_sent");
  if (r !== undefined) closeX();
}
function notif2Card(n) {
  const c = document.createElement("div");
  c.className = "ncard v2" + (n.seen ? "" : " unseen");
  const short = { delete: t("dismiss"), unsubscribe: t("n_unsub"), accept: t("accept"), decline: t("decline"), reject: t("decline") };
  const resp = (n.responses || []).map((r, i) => `<button class="btn ${i ? "" : "primary"}" title="${escA(r.text || "")}" onclick="n2Respond('${esc(n.id)}',${i})">${esc(short[r.type] || r.text || r.type)}</button>`).join("");
  const link = n2Link(n.link);
  c.innerHTML = `${n.senderUserId ? `<span class="slot" data-uid="${esc(n.senderUserId)}" data-name="${escA(n.senderUsername || "")}"></span>`
      : `<span class="gicon-sm" ${thumbAttr(n.imageUrl)}>${n.imageUrl ? "" : icon("bell")}</span>`}
    <div class="info"><div class="nm"></div><div class="sub"></div></div>
    ${n.senderUserId && n.imageUrl ? `<span class="nimg" ${thumbAttr(n.imageUrl)}></span>` : ""}
    <div class="acts">${resp}${link ? btn(esc(n.linkText || t("view")), link) : ""}
      ${n.seen ? "" : btn(t("n_seen"), `n2Seen('${esc(n.id)}')`)}
      ${n.canDelete !== false ? `<button class="mini-btn" title="${t("del")}" onclick="n2Delete('${esc(n.id)}')">${icon("x")}</button>` : ""}</div>`;
  c.querySelector(".nm").textContent = n.title || n.senderUsername || n.type;
  c.querySelector(".sub").textContent = `${n.message || ""}${n.createdAt ? " · " + fmtIso(n.createdAt) : ""}`;
  c.querySelector(".sub").onclick = e => e.currentTarget.classList.toggle("open");  // Click to read the full message
  return c;
}
// Links in notifications, e.g. "group:grp_..." / "user:usr_..." / "event:grp_...:cal_..."
function n2Link(link) {
  const m = (link || "").match(/^(\w+):([\w-]+)(?::([\w-]+))?/);
  if (!m) return /^https:\/\//.test(link || "") ? `api('open_url','${esc(link)}')` : "";
  if (m[1] === "group") return `openGroupId('${m[2]}')`;
  if (m[1] === "user") return `showProfile('${m[2]}')`;
  if (m[1] === "world") return `openWorld('${m[2]}','')`;
  if (m[1] === "event" && m[3]) return `openEventById('${m[2]}','${m[3]}')`;
  return "";
}
async function openEventById(gid, cid) {
  const r = await vrc("getGroupCalendarEvent", { groupId: gid, calendarId: cid });
  if (r.ok) { EVENTS[cid] = r.ok; openEvent(cid); } else apiError(r);
}
async function n2Respond(id, i) {
  const n = (N2.list || []).find(x => x.id === id), r = n?.responses?.[i];
  if (!r) return;
  if ((await vrcDo("respondNotificationV2", { notificationId: id, responseType: r.type, responseData: r.data ?? "" }, "done")) !== undefined) loadN2(true);
}
async function n2Seen(id) { if ((await vrcDo("acknowledgeNotificationV2", { notificationId: id })) !== undefined) loadN2(true); }
async function n2Delete(id) { if ((await vrcDo("deleteNotificationV2", { notificationId: id })) !== undefined) loadN2(true); }
async function n2DeleteAll() { if ((await vrcDo("deleteAllNotificationV2s", {}, "n_deleted")) !== undefined) loadN2(true); }

// ======================= Inventory: VRC+ icons / prints / props / item management =======================
tx({
  i_icon: ["ไอคอน", "Icons", "アイコン"], i_prints: ["Prints", "Prints", "プリント"], i_props: ["Props", "Props", "プロップ"],
  i_hint_icon: ["VRC+: ย่อเป็นสี่เหลี่ยมจัตุรัส 1024px", "VRC+: auto-resized to a 1024px square", "VRC+: 1024px の正方形に自動縮小"],
  i_useIcon: ["ใช้เป็นไอคอนโปรไฟล์", "Use as profile icon", "プロフィールアイコンにする"], i_iconSet: ["ตั้งไอคอนแล้ว", "Icon updated", "アイコンを設定しました"],
  i_archive: ["เก็บเข้าคลัง", "Archive", "アーカイブ"], i_unarchive: ["นำออกจากคลัง", "Unarchive", "アーカイブ解除"],
  i_consume: ["ใช้ไอเทม", "Use item", "アイテムを使う"], i_share: ["แชร์ให้เพื่อน", "Share to friend", "フレンドに共有"],
  i_archived: ["ที่เก็บเข้าคลัง", "Archived", "アーカイブ済み"], i_redeem: ["แลกโค้ด", "Redeem code", "コードを引き換え"],
  i_code: ["โค้ด", "Code", "コード"], i_redeemed: ["แลกโค้ดแล้ว", "Code redeemed", "コードを引き換えました"],
  i_drops: ["กิจกรรมแจกของ", "Item drops", "アイテムドロップ"], i_catalog: ["แคตตาล็อกของแต่ง", "Cosmetics catalog", "コスメティック一覧"],
  i_uploadPrint: ["อัปโหลด Print", "Upload print", "プリントをアップロード"], i_note: ["โน้ต", "Note", "メモ"], i_world: ["โลก", "World", "ワールド"],
  i_taken: ["ถ่ายเมื่อ", "Taken", "撮影日時"], i_shared: ["แชร์แล้ว", "Shared", "共有しました"], i_used: ["ใช้แล้ว", "Used", "使用しました"],
  i_collection: ["คอลเลกชัน", "Collection", "コレクション"], i_all: ["ทั้งหมด", "All", "すべて"],
});
Object.assign(INV_TABS, { icon: ["circle-user-round", "teal"], prints: ["printer", "green"], props: ["boxes", "gray"] });
const INVX = { archived: false, collection: "" };
const _loadInv = loadInv;
loadInv = async function (tab, force) {
  if (!["prints", "props", "items"].includes(tab) || (tab === "items" && !INVX.archived)) return _loadInv(tab, force);
  if (INV.data[tab] && !force) return;
  INV.loading = true; renderView();
  let r;
  if (tab === "prints") {
    r = await vrc("getUserPrints");
    if (r.ok) r.ok = r.ok.map(p => ({ id: p.id, name: p.note || p.worldName || "Print", imageUrl: p.files?.image, itemTypeLabel: fmtIso(p.timestamp || p.createdAt), _p: p }));
  } else if (tab === "props") {
    r = await vrc("listProps", { authorId: AUTH.id, n: 100 });
    if (r.ok) r.ok = r.ok.map(p => ({ id: p.id, name: p.name, imageUrl: p.thumbnailImageUrl || p.imageUrl, itemTypeLabel: p.releaseStatus, description: p.description, _p: p }));
  } else {
    r = await vrc("getInventory", { notFlags: "equippable", archived: true, order: "newest", _all: true });
    if (r.ok) r.ok = (Array.isArray(r.ok) ? r.ok : r.ok.data || []).filter(i => i.isArchived);
  }
  INV.loading = false;
  if (r.ok) INV.data[tab] = r.ok; else apiError(r);
  renderView();
};
const _renderInventory = renderInventory;
renderInventory = function () {
  const tab = INV.tab;
  // Filter by collection (items) before the original function draws
  const all = INV.data.items;
  if (tab === "items" && INVX.collection && all) INV.data.items = all.filter(i => (i.collections || []).includes(INVX.collection));
  _renderInventory();
  if (tab === "items" && all) INV.data.items = all;
  invAugment(tab);
};
function invList(tab) {
  let list = INV.data[tab] || [];
  if (tab === "items" && INVX.collection) list = list.filter(i => (i.collections || []).includes(INVX.collection));
  return list.filter(x => !query || (x.name || "").toLowerCase().includes(query) || (x.itemTypeLabel || x.itemType || "").toLowerCase().includes(query));
}
function invAugment(tab) {
  const el = $("v_inventory"), head = el.querySelector(".search-head");
  if (!head || !AUTH.loggedIn) return;
  if (tab === "items") {
    if (!CACHE.inv_cols) loadOp("inv_cols", "getInventoryCollections");
    const cols = got("inv_cols") || [];
    head.insertAdjacentHTML("afterend", `<div class="toolbar">
      ${cols.length ? `<select class="field" style="width:auto" onchange="INVX.collection=this.value;renderView()"><option value="">${t("i_collection")}: ${t("i_all")}</option>
        ${cols.map(c => `<option value="${escA(c)}" ${INVX.collection === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>` : ""}
      <label class="chip lang"><input type="checkbox" ${INVX.archived ? "checked" : ""} onchange="INVX.archived=this.checked;delete INV.data.items;renderView()"> ${t("i_archived")}</label>
      <span class="grow"></span>${btn(t("i_drops"), "openDrops()", "sm", "gift")}${btn(t("i_redeem"), "redeemDialog()", "sm", "ticket")}</div>`);
  }
  if (tab === "cosmetics") head.insertAdjacentHTML("afterend", `<div class="toolbar"><span class="grow"></span>${btn(t("i_catalog"), "openCatalog('iconFrame')", "sm", "layout-grid")}</div>`);
  if (tab === "prints") head.insertAdjacentHTML("beforeend", btn(t("i_uploadPrint"), "uploadPrintDialog()", "primary", "upload"));
  const isFile = FILE_TABS.includes(tab);
  if (isFile) fileQuota(el, tab);
  const tiles = el.querySelectorAll(".igrid .itile");
  if (!isFile && !["items", "prints", "props"].includes(tab)) return;
  const list = invList(tab);
  tiles.forEach((d, i) => {
    const x = list[i];
    if (!x) return;
    // Click an image = view it in the app (no need for the website)
    if (isFile) d.onclick = () => openFilePreview(tab, x.id);
    else d.onclick = () => (tab === "items" ? openItem : tab === "prints" ? openPrint : openProp)(x.id);
    if (tab === "icon") d.insertAdjacentHTML("beforeend", `<button class="mini-btn imenu" title="${t("i_useIcon")}" onclick="event.stopPropagation();useIcon('${esc(x.url)}')">${icon("circle-user-round")}</button>`);
  });
}
// ---------- Upload limits / in-app image viewer ----------
const FILE_TABS = ["gallery", "emoji", "sticker", "icon"];
// Emoji/sticker limits come from VRChat's /config; photos and VRC+ icons allow 64
function fileLimit(tab) {
  const cfg = got("cfg") || {};
  return { gallery: 64, icon: 64, emoji: cfg.maxUserEmoji || 18, sticker: cfg.maxUserStickers || 18 }[tab];
}
function fileQuota(el, tab) {
  if (!CACHE.cfg) loadOp("cfg", "getConfig");
  const n = (INV.data[tab] || []).length, max = fileLimit(tab), left = Math.max(0, max - n);
  const head = el.querySelector(".sec-head .n");
  if (head && INV.data[tab]) {
    head.textContent = `${n} / ${max}`;
    head.insertAdjacentHTML("afterend", `<span class="quota ${left ? "" : "full"}">${left ? t("i_left", left) : t("i_full")}</span>`);
  }
  const up = el.querySelector(".search-head .btn.primary");
  if (up && INV.data[tab] && !left) { up.disabled = true; up.title = t("i_full"); }
}
function openFilePreview(tab, id) {
  const x = (INV.data[tab] || []).find(f => f.id === id);
  if (!x) return;
  const anim = tab === "emoji" && x.frames > 1;
  openX(t("i_" + tab), () => `<div class="fprev ${tab === "gallery" ? "wide" : ""}"><div class="iimg" ${thumbAttr(x.url + "#full")}
      ${anim ? `data-frames="${+x.frames}" data-fps="${+x.framesOverTime || 10}" data-loop="${escA(x.loopStyle || "")}"` : ""}></div></div>
    <div class="kv" style="margin:12px 2px">
      ${x.created ? `<span>${t("i_uploadedAt")}</span><span>${fmtIso(x.created)}</span>` : ""}
      ${x.animationStyle ? `<span>${t("emk_style")}</span><span>${esc(x.animationStyle)}</span>` : ""}
      ${anim ? `<span>${t("i_anim")}</span><span>${+x.frames} frames · ${+x.framesOverTime || 10} fps${x.loopStyle === "pingpong" ? " · " + t("emk_pingpong") : ""}</span>` : ""}
      ${x.maskTag && tab === "sticker" ? `<span>Mask</span><span>${esc(x.maskTag)}</span>` : ""}</div>
    <div class="form-actions">
      ${tab === "icon" ? btn(t("i_useIcon"), `useIcon('${esc(x.url)}')`, "primary", "circle-user-round") : ""}
      <button class="btn danger" onclick="confirmBtn(this,async()=>{await deleteFile('${esc(x.id)}');closeX()})">${icon("trash-2")}${t("del")}</button></div>`, null, tab === "gallery");
}
async function useIcon(url) { await vrcDo("updateProfile", { userIcon: url }, "i_iconSet"); }
function openItem(id) {
  const x = (INV.data.items || []).find(i => i.id === id);
  if (!x) return;
  const f = x.flags || [];
  openX(x.name, () => `<div class="post" style="padding:0;border:none"><div class="pimg" style="margin:0;aspect-ratio:1;max-height:260px;background-size:contain;background-repeat:no-repeat;background-position:center" ${thumbAttr(x.imageUrl)}></div></div>
    <div class="kv" style="margin:12px 2px"><span>${t("ev_category")}</span><span>${esc(x.itemTypeLabel || x.itemType || "")}</span>
      ${x.collections?.length ? `<span>${t("i_collection")}</span><span>${esc(x.collections.join(", "))}</span>` : ""}
      ${x.created_at ? `<span>${t("updated")}</span><span>${fmtIso(x.created_at)}</span>` : ""}</div>
    ${x.description ? `<div class="pcard-bio">${esc(x.description)}</div>` : ""}
    <div class="form-actions">
      ${f.includes("consumable") ? btn(t("i_consume"), `itemDo('consumeOwnInventoryItem','${id}',{},'i_used')`, "primary", "zap") : ""}
      ${f.includes("cloneable") || f.includes("shareable") ? btn(t("i_share"), `shareItemDialog('${id}')`, "", "share-2") : ""}
      ${f.includes("archivable") || x.isArchived ? btn(t(x.isArchived ? "i_unarchive" : "i_archive"), `itemDo('updateOwnInventoryItem','${id}',{isArchived:${!x.isArchived}},'done')`, "", x.isArchived ? "archive-restore" : "archive") : ""}
      ${f.includes("trashable") || f.includes("deletable") ? `<button class="btn danger" onclick="confirmBtn(this,()=>itemDo('deleteOwnInventoryItem','${id}',{},'deleted'))">${icon("trash-2")}${t("del")}</button>` : ""}</div>`);
}
async function itemDo(op, id, extra, okKey) {
  if ((await vrcDo(op, { inventoryItemId: id, ...extra }, okKey)) === undefined) return;
  closeX(); delete INV.data.items; renderView();
}
function shareItemDialog(id) {
  let q = "";
  openX(t("i_share"), () => {
    const list = Object.values(FRIENDS).filter(f => !q || (f.displayName || "").toLowerCase().includes(q))
      .sort((a, b) => (a.displayName || "").localeCompare(b.displayName || "")).slice(0, 80);
    return `<input class="field" id="sifq" placeholder="${t("searchPh")}" style="margin-bottom:10px">${list.map(f => lrow({ uid: f.id, name: f.displayName,
      acts: btn(t("inv_send"), `shareItem('${id}','${esc(f.id)}')`, "primary sm", "send") })).join("")}`;
  }, () => {
    const inp = $("sifq");
    inp.value = q;
    inp.oninput = () => { q = inp.value.trim().toLowerCase(); buildX(); const n = $("sifq"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
  });
}
async function shareItem(id, uid) {
  if ((await vrcDo("shareInventoryItemDirect", { itemId: id, users: [uid] }, "i_shared")) !== undefined) closeX();
}
function redeemDialog() {
  openX(t("i_redeem"), () => `${fRow(t("i_code"), fInput("rdCode"))}<div class="form-actions">${btn(t("i_redeem"), "doRedeem()", "primary", "ticket")}</div>`);
}
async function doRedeem() {
  if (!fv("rdCode")) return;
  if ((await vrcDo("redeemReward", { code: fv("rdCode") }, "i_redeemed")) !== undefined) { closeX(); delete INV.data.items; delete INV.data.cosmetics; renderView(); }
}
function openDrops() {
  loadOp("inv_drops", "getInventoryDrops", { active: true });
  openX(t("i_drops"), () => {
    const c = CACHE.inv_drops;
    return stateHtml(c) || c.data.map(d => lrow({ thumb: d.notificationDetails?.imageUrl, name: d.name || d.notificationDetails?.title,
      sub: `${esc(d.notificationDetails?.body || "")}\n${fmtIso(d.startDropDate)} – ${fmtIso(d.endDropDate)}` })).join("");
  }, null, true);
}
let CATALOG_TYPE = "iconFrame";
function openCatalog(type) {
  CATALOG_TYPE = type;
  loadOp("cat_" + type, "getCosmeticIndex", { itemType: type });
  const types = { iconFrame: t("slot_iconFrame"), nameplateEffect: t("slot_nameplateEffect"), profileEffect: t("slot_profileEffect"),
                  droneskin: t("slot_drone"), portalskin: t("slot_portal"), warpeffect: t("slot_warp") };
  openX(t("i_catalog"), () => {
    const c = CACHE["cat_" + CATALOG_TYPE];
    return `<div class="toolbar">${tabsHtml(types, CATALOG_TYPE, "openCatalog")}</div>${stateHtml(c, "noItems") || `<div class="igrid">${c.data.map(x =>
      `<div class="itile" title="${escA(x.description || "")}"><div class="iimg" ${thumbAttr(x.imageUrl)}></div><div class="iname">${esc(x.name)}</div>
       <div class="isub">${esc(x.status || x.dropStatus || "")}</div></div>`).join("")}</div>`}`;
  }, null, true);
}
function openPrint(id) {
  const x = (INV.data.prints || []).find(p => p.id === id), p = x?._p;
  if (!p) return;
  openX("Print", () => `<div class="post" style="padding:0;border:none"><div class="pimg" style="margin:0" ${thumbAttr(p.files?.image)}></div></div>
    <div class="kv" style="margin:12px 2px">${p.worldName ? `<span>${t("i_world")}</span><span class="link" onclick="closeX();openWorld('${esc(p.worldId)}','')">${esc(p.worldName)}</span>` : ""}
      <span>${t("i_taken")}</span><span>${fmtIso(p.timestamp || p.createdAt)}</span>${p.authorName ? `<span>by</span><span>${esc(p.authorName)}</span>` : ""}</div>
    ${fRow(t("i_note"), fArea("prNote", p.note, 3))}
    <div class="form-actions"><button class="btn danger" onclick="confirmBtn(this,()=>printDo('deletePrint','${id}',{},'deleted'))">${icon("trash-2")}${t("del")}</button>
      ${btn(t("save"), `printDo('editPrint','${id}',{note:fv('prNote'),_imageUrl:'${esc(p.files?.image)}'},'saved')`, "primary", "save")}</div>`, null, true);
}
async function printDo(op, id, extra, okKey) {
  if ((await vrcDo(op, { printId: id, ...extra }, okKey)) === undefined) return;
  closeX(); delete INV.data.prints; renderView();
}
let PRINT_IMG = null;
function uploadPrintDialog() {
  PRINT_IMG = null;
  openX(t("i_uploadPrint"), () => `${fRow(t("pickImage"), `${btn(t("pickImage"), "pickPrint()", "sm", "image-plus")}<span id="prImg" class="hint-inline">${PRINT_IMG ? t("imagePicked") : ""}</span>`)}
    ${fRow(t("i_note"), fArea("prNew", "", 3))}
    <div class="form-actions">${btn(t("upload"), "doUploadPrint()", "primary", "upload")}</div>`);
}
async function pickPrint() { PRINT_IMG = await pickImage(2048); if (PRINT_IMG && $("prImg")) $("prImg").textContent = t("imagePicked"); }
async function doUploadPrint() {
  if (!PRINT_IMG) return toast(t("pickImage"));
  const w = parseLoc(myLoc()).wid;
  const p = { _image: PRINT_IMG, note: fv("prNew"), timestamp: new Date().toISOString(), ...(w ? { worldId: w, worldName: WORLDS[w]?.name || lastBatch?.world || "" } : {}) };
  if ((await vrcDo("uploadPrint", p, "uploaded")) === undefined) return;
  closeX(); delete INV.data.prints; renderView();
}
function openProp(id) {
  const x = (INV.data.props || []).find(p => p.id === id), p = x?._p;
  if (!p) return;
  openX(p.name, () => `<div class="post" style="padding:0;border:none"><div class="pimg" style="margin:0" ${thumbAttr(p.imageUrl || p.thumbnailImageUrl)}></div></div>
    <div class="kv" style="margin:12px 2px"><span>${t("a_release")}</span><span>${esc(p.releaseStatus || "")}</span>
      <span>by</span><span>${esc(p.authorName || "")}</span><span>Max</span><span>${esc(p.maxCountPerUser ?? "")}</span>
      <span>${t("updated")}</span><span>${fmtIso(p._updated_at || p._created_at)}</span></div>
    ${p.description ? `<div class="pcard-bio">${esc(p.description)}</div>` : ""}`);
}

// ======================= Search: users / worlds / groups / events / links & IDs =======================
tx({
  s_groups: ["กลุ่ม", "Groups", "グループ"], s_events: ["อีเวนต์", "Events", "イベント"], s_link: ["ลิงก์ / ID", "Link / ID", "リンク / ID"],
  searchLinkPh: ["วางลิงก์ vrch.at, ลิงก์ vrchat.com, ID (usr_/wrld_/grp_/avtr_) หรือชื่อผู้ใช้ (username)",
                 "Paste a vrch.at link, vrchat.com link, ID (usr_/wrld_/grp_/avtr_) or a username", "vrch.at・vrchat.com のリンク、ID、ユーザー名を貼り付け"],
  searchGroupsPh: ["ค้นหากลุ่ม", "Search groups", "グループを検索"], searchEventsPh: ["ค้นหาอีเวนต์", "Search events", "イベントを検索"],
  notFound: ["ไม่พบ", "Not found", "見つかりません"],
});
const SEARCH_KINDS = ["users", "worlds", "groups", "events", "link"];
renderSearch = function () {
  const el = $("v_search");
  if (!AUTH.loggedIn) return needLogin(el);
  if (!el.querySelector(".search-head")) {
    el.innerHTML = `<div class="search-head">${sboxHtml("sq")}</div><div class="toolbar"><div class="segmented" id="skind"></div></div><div id="sres"></div>`;
    wireSbox("sq", doSearch, () => { searchRes = null; renderSearch(); });
  }
  $("sq").placeholder = t({ users: "searchUsersPh", worlds: "searchWorldsPh", groups: "searchGroupsPh", events: "searchEventsPh", link: "searchLinkPh" }[searchKind]);
  $("skind").innerHTML = SEARCH_KINDS.map(k =>
    `<button class="${searchKind === k ? "on" : ""}" onclick="searchKind='${k}';searchRes=null;renderSearch();doSearch()">${t("s_" + k)}</button>`).join("");
  const res = $("sres");
  if (searching) return res.innerHTML = `<div class="empty-state" style="height:200px">${t("searching")}</div>`;
  if (!searchRes) return res.innerHTML = "";
  if (searchRes.error) return res.innerHTML = `<div class="empty-state" style="height:200px">${searchRes.error === 404 ? t("notFound") : t("errGeneric")}</div>`;
  if (searchRes.kind === "groups") {
    if (!searchRes.list.length) return res.innerHTML = `<div class="empty-state" style="height:200px">${t("noResults")}</div>`;
    res.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "wgrid";
    searchRes.list.forEach(g => grid.appendChild(groupCard(g)));
    return res.appendChild(grid);
  }
  if (searchRes.kind === "events") return res.innerHTML = searchRes.list.length ? `<div class="wgrid">${searchRes.list.map(eventCard).join("")}</div>`
    : `<div class="empty-state" style="height:200px">${t("noResults")}</div>`;
  if (searchRes.kind === "link") return res.innerHTML = "";
  _renderSearchBase();
};
// Draw user/world results the original way
function _renderSearchBase() {
  const res = $("sres");
  if (!searchRes.ids?.length) return res.innerHTML = `<div class="empty-state" style="height:200px">${t("noResults")}</div>`;
  res.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = searchRes.kind === "users" ? "fgrid" : "wgrid";
  for (const id of searchRes.ids) {
    const d = document.createElement("div");
    if (searchRes.kind === "users") {
      const p = PROFILES[id] || {};
      d.className = "fcard";
      d.innerHTML = `<span class="slot"></span><div class="info"><div class="nm"></div><div class="sub"></div></div>`;
      d.querySelector(".slot").replaceWith(makeAvatar(id, p.displayName || "?"));
      d.querySelector(".nm").textContent = p.displayName || id;
      d.querySelector(".sub").textContent = p.statusDescription || "";
      d.onclick = () => showProfile(id, p.displayName);
    } else {
      const w = WORLDS[id] || {};
      d.className = "wcard";
      d.innerHTML = `<div class="wimg" ${w.img ? `style="background-image:url('${w.img}')"` : ""}></div><div class="winfo"><div class="nm"></div><div class="sub"></div></div>`;
      d.querySelector(".nm").textContent = w.name || id;
      d.querySelector(".sub").textContent = [w.authorName, w.capacity ? `${w.capacity} ${t("capacity")}` : ""].filter(Boolean).join(" · ");
      d.onclick = () => openWorld(id, "");
    }
    grid.appendChild(d);
  }
  res.appendChild(grid);
}
const _doSearch = doSearch;
doSearch = async function () {
  const q = $("sq")?.value.trim();
  if (!q) return;
  if (searchKind === "users" || searchKind === "worlds") return _doSearch();
  searching = true; renderSearch();
  const kind = searchKind;
  if (kind === "groups") {
    const r = await vrc("searchGroups", { query: q, n: 40 });
    searchRes = r.ok ? { kind, list: r.ok.map(g => ({ ...g, id: g.id || g.groupId })) } : { kind, error: r.error };
  } else if (kind === "events") {
    const r = await vrc("searchCalendarEvents", { searchTerm: q, n: 60, utcOffset: -new Date().getTimezoneOffset() / 60 });
    searchRes = r.ok ? { kind, list: r.ok.results || r.ok } : { kind, error: r.error };
  } else {
    searchRes = { kind, list: [] };
    const err = await openAnything(q);
    if (err) searchRes = { kind, error: err };
  }
  searching = false;
  renderSearch();
};
// Open whatever was pasted: vrch.at / vrchat.com link, location, ID or username
async function openAnything(q) {
  const id = (q.match(/(usr|wrld|grp|avtr)_[0-9a-f-]{36}/) || [])[0];
  const loc = (q.match(/wrld_[0-9a-f-]{36}:[\w~().,-]+/) || [])[0];
  const launch = q.match(/worldId=(wrld_[\w-]+)&instanceId=([^&\s]+)/);
  if (loc) return openWorld(loc.split(":")[0], loc);
  if (launch) return openWorld(launch[1], `${launch[1]}:${decodeURIComponent(launch[2])}`);
  if (id?.startsWith("usr_")) return showProfile(id);
  if (id?.startsWith("wrld_")) return openWorld(id, "");
  if (id?.startsWith("grp_")) return openGroupId(id);
  if (id?.startsWith("avtr_")) {
    const r = await vrc("getAvatar", { avatarId: id });
    return r.ok ? openAvatar(avatarSlim(r.ok)) : r.error;
  }
  const short = (q.match(/vrch\.at\/(\w+)/) || [])[1] || (/^\w{6,12}$/.test(q) ? q : "");
  if (short) {
    const r = await vrc("getInstanceByShortName", { shortName: short });
    const l = r.ok?.location || (r.ok?.worldId && r.ok?.instanceId ? `${r.ok.worldId}:${r.ok.instanceId}` : "");
    if (l) return openWorld(l.split(":")[0], l);
  }
  const grp = q.match(/^([A-Za-z0-9]{3,6})\.(\d{4})$/);  // Group short code, e.g. ABCD.1234
  if (grp) {
    const r = await vrc("searchGroups", { query: q, n: 5 });
    const g = (r.ok || []).find(x => `${x.shortCode}.${x.discriminator}`.toLowerCase() === q.toLowerCase());
    if (g) return openGroup(g);
  }
  const u = await vrc("getUserByName", { username: q });
  if (u.ok?.id) return showProfile(u.ok.id, u.ok.displayName);
  return 404;
}

// ======================= Worlds page =======================
tx({
  wt_favorites: ["โปรด", "Favorites", "お気に入り"], wt_recent: ["เพิ่งไป", "Recent", "最近"], wt_active: ["ยอดนิยมตอนนี้", "Active", "人気"],
  wt_mine: ["ของฉัน", "Mine", "自分の"], wt_locations: ["ห้องล่าสุด", "Recent instances", "最近のインスタンス"],
});
const WT = { tab: "favorites" };
const WT_LOAD = {
  favorites: () => loadFav(),
  recent: () => loadOp("wt_recent", "getRecentWorlds", { n: 100 }),
  active: () => loadOp("wt_active", "getActiveWorlds", { n: 60, sort: "heat", order: "descending" }),
  mine: () => loadOp("wt_mine", "searchWorlds", { user: "me", releaseStatus: "all", n: 100, sort: "updated", order: "descending" }),
  locations: () => loadOp("wt_locations", "getRecentLocations", { n: 50 }),
};
function renderWorlds() {
  const el = $("v_worlds");
  if (!AUTH.loggedIn) return needLogin(el);
  const tab = WT.tab;
  if (tab === "favorites" ? !FAV.groups : !CACHE["wt_" + tab]) WT_LOAD[tab]();
  const head = `<div class="toolbar">${tabsHtml(Object.fromEntries(Object.keys(WT_LOAD).map(k => [k, t("wt_" + k)])), tab, "wtSet")}</div>`;
  const match = w => !query || (w.name || "").toLowerCase().includes(query) || (w.authorName || "").toLowerCase().includes(query);
  if (tab === "favorites") {
    if (!FAV.groups) return el.innerHTML = head + stateHtml({ loading: true }, "", 160);
    el.innerHTML = head + favGroups("world").map(g => {
      const list = (FAV.world || []).filter(w => w.favoriteGroup === g.name && match(w));
      return `<div class="sec-head">${esc(g.displayName || g.name)} <span class="n">${list.length}</span></div><div class="wgrid">${list.map(worldTile).join("")}</div>`;
    }).join("");
    return;
  }
  const c = CACHE["wt_" + tab];
  if (tab === "locations") {
    const locs = (c?.data || []).filter(Boolean);
    const wids = [...new Set(locs.map(l => parseLoc(l).wid).filter(Boolean))];
    if (wids.length && !WT.asked) { WT.asked = true; api("worlds", wids); }
    el.innerHTML = head + (stateHtml(c && { ...c, data: locs }, "noResults", 160) || locs.map(l => {
      const L2 = parseLoc(l), w = WORLDS[L2.wid] || {};
      return `<div class="lrow" onclick="openWorld('${esc(L2.wid)}','${esc(l)}')"><span class="lthumb" ${w.img ? `style="background-image:url('${w.img}')"` : ""}></span>
        <div class="info"><div class="nm">${esc(w.name || L2.wid || l)}</div><div class="sub">#${esc(L2.name || "")} · ${esc(itypeLabel(L2))}</div></div>
        <div class="acts" onclick="event.stopPropagation()">${joinButtons(l)}</div></div>`;
    }).join(""));
    return;
  }
  const list = (c?.data || []).filter(match);
  el.innerHTML = head + (stateHtml(c && { ...c, data: list }, "noResults", 160) || `<div class="wgrid">${list.map(worldTile).join("")}</div>`);
}
function wtSet(tab) { WT.tab = tab; WT.asked = false; renderView(); }
VIEW_REFRESH.worlds = () => { if (WT.tab === "favorites") loadFav(true); else { delete CACHE["wt_" + WT.tab]; renderView(); } };
function worldTile(w) {
  return `<div class="wcard" onclick="openWorld('${esc(w.id)}','')"><div class="wimg" ${thumbAttr(imgUrl(w))}></div>
    <div class="winfo"><div class="nm">${esc(w.name)}</div><div class="sub">${esc(w.authorName || "")}${w.occupants ? ` · ${t("people2", w.occupants)}` : ""}</div></div></div>`;
}

// ======================= Favorites page =======================
tx({
  ft_friend: ["เพื่อน", "Friends", "フレンド"], ft_world: ["โลก", "Worlds", "ワールド"], ft_avatar: ["อวตาร", "Avatars", "アバター"],
  f_rename: ["เปลี่ยนชื่อกลุ่ม", "Rename group", "グループ名を変更"], f_clear: ["ล้างกลุ่ม", "Clear group", "グループを空にする"],
  f_vis_private: ["ส่วนตัว", "Private", "非公開"], f_vis_friends: ["เพื่อน", "Friends", "フレンド"], f_vis_public: ["สาธารณะ", "Public", "公開"],
});
const FT = { tab: "friend" };
function renderFavorites() {
  const el = $("v_favorites");
  if (!AUTH.loggedIn) return needLogin(el);
  if (!FAV.groups) { loadFav(); return el.innerHTML = stateHtml({ loading: true }, "", 160); }
  const type = FT.tab;
  const max = FAV.limits?.maxFavoritesPerGroup || {};
  let html = `<div class="toolbar">${tabsHtml({ friend: t("ft_friend"), world: t("ft_world"), avatar: t("ft_avatar") }, type, "ftSet")}</div>`;
  for (const g of favGroups(type)) {
    const head = `<div class="sec-head">${esc(g.displayName || g.name)} <span class="n">${favCount(type, g.name)}/${max[g.type] ?? ""}</span>
      <select class="field" style="width:auto;margin-left:auto;padding:3px 8px" onchange="favGroupUpdate('${g.type}','${esc(g.name)}',{visibility:this.value})">
        ${["private", "friends", "public"].map(v => `<option value="${v}" ${g.visibility === v ? "selected" : ""}>${t("f_vis_" + v)}</option>`).join("")}</select>
      <button class="mini-btn" title="${t("f_rename")}" onclick="favRenameDialog('${g.type}','${esc(g.name)}')">${icon("pencil")}</button>
      <button class="mini-btn" title="${t("f_clear")}" onclick="confirmBtn(this,()=>favClear('${g.type}','${esc(g.name)}'))">${icon("trash-2")}</button></div>`;
    if (type === "friend") {
      const ids = (FAV.friend || []).filter(f => f.tags?.includes(g.name)).map(f => f.favoriteId);
      const list = ids.map(id => FRIENDS[id] || { id, displayName: PROFILES[id]?.displayName || id, state: "offline" })
        .filter(f => !query || (f.displayName || "").toLowerCase().includes(query));
      html += head + `<div class="fgrid" data-fav="${esc(g.name)}"></div>`;
      FT.pending = FT.pending || {};
      FT.pending[g.name] = list;
    } else {
      const list = (FAV[type] || []).filter(x => x.favoriteGroup === g.name && (!query || (x.name || "").toLowerCase().includes(query)));
      html += head + `<div class="wgrid">${list.map(x => type === "world" ? worldTile(x)
        : `<div class="wcard" onclick='openAvatar(${JSON.stringify(avatarSlim(x)).replace(/'/g, "&#39;")})'><div class="wimg" ${thumbAttr(imgUrl(x))}></div>
           <div class="winfo"><div class="nm">${esc(x.name)}</div><div class="sub">${esc(x.authorName || "")}</div></div></div>`).join("")}</div>`;
    }
  }
  el.innerHTML = html;
  if (type === "friend") {
    el.querySelectorAll("[data-fav]").forEach(grid => (FT.pending[grid.dataset.fav] || []).forEach(f => grid.appendChild(friendCard(f))));
    FT.pending = {};
  }
}
function ftSet(tab) { FT.tab = tab; renderView(); }
VIEW_REFRESH.favorites = () => loadFav(true);
async function favGroupUpdate(type, name, change) {
  if ((await vrcDo("updateFavoriteGroup", { favoriteGroupType: type, favoriteGroupName: name, ...change }, "saved")) !== undefined) loadFav(true);
}
function favRenameDialog(type, name) {
  const g = (FAV.groups || []).find(x => x.name === name && x.type === type) || {};
  openX(t("f_rename"), () => `${fRow(t("name"), fInput("fgName", g.displayName))}<div class="form-actions">${btn(t("save"), `favGroupUpdate('${type}','${esc(name)}',{displayName:fv('fgName')});closeX()`, "primary", "save")}</div>`);
}
async function favClear(type, name) {
  if ((await vrcDo("clearFavoriteGroup", { favoriteGroupType: type, favoriteGroupName: name }, "done")) !== undefined) loadFav(true);
}

// ======================= Blocks / mutes page =======================
tx({
  sf_players: ["ผู้เล่น", "Players", "プレイヤー"], sf_avatars: ["อวตารที่บล็อก", "Blocked avatars", "ブロックしたアバター"],
  sf_groups: ["กลุ่มที่บล็อก", "Blocked groups", "ブロックしたグループ"], sf_clearAll: ["ล้างทั้งหมด", "Clear all", "すべて解除"],
});
const SF = { tab: "players" };
function renderSafety() {
  const el = $("v_safety");
  if (!AUTH.loggedIn) return needLogin(el);
  if (!MODS.list && !MODS.loading) loadMods();
  const head = `<div class="toolbar">${tabsHtml({ players: t("sf_players"), avatars: t("sf_avatars"), groups: t("sf_groups") }, SF.tab, "sfSet")}<span class="grow"></span>
    ${SF.tab === "players" && MODS.list?.length ? `<button class="btn sm danger" onclick="confirmBtn(this,()=>clearMods())">${t("sf_clearAll")}</button>` : ""}</div>`;
  if (SF.tab === "players") {
    if (!MODS.list) return el.innerHTML = head + stateHtml({ loading: true }, "", 160);
    let html = head;
    for (const ty of [...new Set([...MOD_TYPES, ...MODS.list.map(m => m.type)])]) {
      const list = MODS.list.filter(m => m.type === ty && (!query || (m.targetDisplayName || "").toLowerCase().includes(query)));
      if (!list.length) continue;
      html += `<div class="sec-head">${icon(MOD_ICON[ty] || "shield")} ${t("m_" + ty)} <span class="n">${list.length}</span></div>`
        + list.map(m => lrow({ uid: m.targetUserId, name: m.targetDisplayName, sub: fmtIso(m.created), onclick: `showProfile('${esc(m.targetUserId)}')`,
          acts: btn(t("remove"), `modToggle('${esc(m.targetUserId)}','${ty}')`, "sm") })).join("");
    }
    el.innerHTML = html === head ? head + `<div class="empty-state" style="height:160px">${t("noResults")}</div>` : html;
    fillSlots(el);
  } else if (SF.tab === "avatars") {
    const list = MODS.avatars || [];
    el.innerHTML = head + (list.length ? list.map(m => lrow({ thumb: "", name: m.targetAvatarId, sub: fmtIso(m.created),
      onclick: `openAnything('${esc(m.targetAvatarId)}')`, acts: btn(t("remove"), `avatarBlockToggle('${esc(m.targetAvatarId)}')`, "sm") })
      .replace('<span class="lthumb" ></span>', "")).join("") : `<div class="empty-state" style="height:160px">${t("noResults")}</div>`);
  } else {
    const c = CACHE.ug_blocked;
    if (!c) loadOp("ug_blocked", "getBlockedGroups");
    el.innerHTML = head + (stateHtml(c, "noResults", 160) || `<div class="wgrid"></div>`);
    if (c?.data?.length) c.data.forEach(g => el.querySelector(".wgrid").appendChild(groupCard({ ...g, id: g.groupId || g.id })));
  }
}
function sfSet(tab) { SF.tab = tab; renderView(); }
VIEW_REFRESH.safety = () => { loadMods(true); delete CACHE.ug_blocked; renderView(); };
async function clearMods() { if ((await vrcDo("clearAllPlayerModerations", {}, "done")) !== undefined) loadMods(true); }

// ======================= My account page =======================
tx({
  ac_profile: ["โปรไฟล์", "Profile", "プロフィール"], ac_messages: ["ข้อความเชิญ", "Invite messages", "招待メッセージ"],
  ac_notes: ["โน้ตผู้ใช้", "User notes", "ユーザーメモ"], ac_store: ["VRC+ / เครดิต / การซื้อ", "VRC+ / Credits / Purchases", "VRC+・クレジット・購入"],
  ac_vrchat: ["สถานะ VRChat", "VRChat status", "VRChat ステータス"],
  ac_status: ["สถานะ", "Status", "ステータス"], ac_statusDesc: ["ข้อความสถานะ", "Status message", "ステータスメッセージ"],
  ac_pronouns: ["สรรพนาม", "Pronouns", "代名詞"], ac_bio: ["แนะนำตัว", "Bio", "自己紹介"], ac_links: ["ลิงก์ (สูงสุด 3)", "Links (max 3)", "リンク (最大3つ)"],
  ac_langs: ["ภาษา (รหัส 3 ตัว)", "Languages (3-letter codes)", "言語 (3文字コード)"], ac_boop: ["รับ Boop", "Allow boops", "Boop を受け取る"],
  ac_badges: ["Badge", "Badges", "バッジ"], ac_hidden: ["ซ่อน", "Hidden", "非表示"], ac_showcase: ["โชว์", "Showcase", "ショーケース"],
  ac_repGroup: ["กลุ่มที่แสดงบนโปรไฟล์", "Represented group", "代表グループ"], ac_ageVerif: ["ยืนยันอายุ", "Age verification", "年齢確認"],
  ac_icon: ["ไอคอนโปรไฟล์ (VRC+)", "Profile icon (VRC+)", "プロフィールアイコン (VRC+)"], ac_iconHint: ["เลือกได้ที่ Inventory → ไอคอน", "Pick one in Inventory → Icons", "インベントリ → アイコン から選択"],
  ac_slot: [n => `ช่อง ${n}`, n => `Slot ${n}`, n => `スロット ${n}`], ac_cooldown: [n => `แก้ได้อีกใน ${n} นาที`, n => `Editable in ${n} min`, n => `あと ${n} 分で編集可能`],
  ac_reset: ["คืนค่าเดิม", "Reset", "リセット"], ac_mt_message: ["เชิญ", "Invite", "招待"], ac_mt_response: ["ตอบคำเชิญ", "Invite reply", "招待への返信"],
  ac_mt_request: ["ขอ invite", "Request", "リクエスト"], ac_mt_requestResponse: ["ตอบคำขอ", "Request reply", "リクエストへの返信"],
  ac_sub: ["การสมัครสมาชิก", "Subscriptions", "サブスクリプション"], ac_expires: ["หมดอายุ", "Expires", "有効期限"], ac_balance: ["เครดิตคงเหลือ", "Credits balance", "クレジット残高"],
  ac_licenses: ["สิทธิ์ที่มี", "Licenses", "ライセンス"], ac_purchases: ["ประวัติการซื้อ", "Purchases", "購入履歴"], ac_tx: ["ธุรกรรม", "Transactions", "取引"],
  ac_limits: ["ขีดจำกัดรายการโปรด", "Favorite limits", "お気に入りの上限"], ac_online: ["คนออนไลน์ใน VRChat", "Users online", "オンラインユーザー"],
  ac_health: ["สถานะเซิร์ฟเวอร์", "Server health", "サーバー状態"], ac_notices: ["ประกาศจาก VRChat", "VRChat notices", "VRChat のお知らせ"],
  ac_session: ["ตรวจ session", "Check session", "セッション確認"], ac_sessionOk: ["session ยังใช้ได้", "Session is valid", "セッションは有効です"],
  ac_gifts: ["ชุดของขวัญ VRC+ ที่ซื้อ", "VRC+ gift bundles", "VRC+ ギフトバンドル"], ac_noSub: ["ไม่มีการสมัครที่ใช้งานอยู่", "No active subscription", "有効なサブスクリプションはありません"],
});
const AC = { tab: "profile", msgType: "message" };
function renderAccount() {
  const el = $("v_account");
  if (!AUTH.loggedIn) return needLogin(el);
  const tabs = { profile: t("ac_profile"), messages: t("ac_messages"), notes: t("ac_notes"), store: t("ac_store"), vrchat: t("ac_vrchat") };
  const scroll = el.scrollTop;
  el.innerHTML = `<div class="toolbar">${tabsHtml(tabs, AC.tab, "acSet")}</div><div id="acBody">${acBody()}</div>`;
  fillSlots(el);
  el.scrollTop = scroll;
}
function acSet(tab) { AC.tab = tab; $("v_account").scrollTop = 0; renderView(); }
VIEW_REFRESH.account = () => { dropCache("ac_"); dropCache("im_"); renderView(); };
function acBody() {
  const tab = AC.tab;
  if (tab === "profile") {
    const c = CACHE.ac_me;
    if (!c) load("ac_me", async () => ({ ok: await api("me") }));
    // Since API 1.21, bio/links/badges/languages live at /profile
    if (!CACHE.ac_prof) loadOp("ac_prof", "getPublicProfile", { userId: AUTH.id });
    if (!CACHE.ac_rep) loadOp("ac_rep", "getUserRepresentedGroup", { userId: AUTH.id });
    if (!CACHE.ac_age) loadOp("ac_age", "getAgeVerificationStatus");
    if (!GRP.mine && !GRP.loading) loadGroups();
    const st = stateHtml(c);
    if (st) return st;
    const me = { ...c.data, ...(got("ac_prof") || {}) }, p = PROFILES[AUTH.id] || {};
    const links = [...(me.bioLinks || p.bioLinks || []), "", "", ""].slice(0, 3);
    const rep = got("ac_rep");
    const badges = me.badges || p.badges || [];
    return `<div class="card" style="padding:4px 14px">
      ${fRow(t("ac_status"), fSelect("acStatus", { "join me": "Join Me", active: "Online", "ask me": "Ask Me", busy: "Do Not Disturb" }, me.status))}
      ${fRow(t("ac_statusDesc"), fInput("acStatusDesc", me.statusDescription, 'maxlength="32"'))}
      ${fRow(t("ac_pronouns"), fInput("acPronouns", me.pronouns, 'maxlength="32"'))}
      ${fRow(t("ac_bio"), fArea("acBio", me.bio, 5))}
      ${fRow(t("ac_links"), links.map((l, i) => fInput("acLink" + i, l, 'placeholder="https://"')).join(""))}
      ${fRow(t("ac_langs"), langPicker("acLangs", me.languages || p.languages || (me.tags || []).filter(x => x.startsWith("language_")).map(x => x.slice(9)), 3), t("lang_max", 3))}
      ${fRow(t("ac_boop"), fCheck("acBoop", me.isBoopingEnabled !== false))}
      <div class="form-actions">${btn(t("save"), "saveMyProfile()", "primary", "save")}</div></div>
    <div class="sec-head">${t("ac_repGroup")}</div>
    <div class="card" style="padding:4px 14px">${fRow(t("ac_repGroup"), `<select class="field" onchange="setRepGroup(this.value,'${esc(rep?.groupId || "")}')">
      <option value="">${t("none")}</option>${(GRP.mine || []).map(g => `<option value="${esc(g.id)}" ${rep?.groupId === g.id ? "selected" : ""}>${esc(g.name)}</option>`).join("")}</select>`)}
      ${fRow(t("ac_icon"), `<span class="hint-inline">${t("ac_iconHint")}</span>${btn(t("i_icon"), "INV.tab='icon';setView('inventory')", "sm", "circle-user-round")}`)}
      ${got("ac_age") ? fRow(t("ac_ageVerif"), `<span>${esc(got("ac_age").ageVerificationStatus || got("ac_age").status || JSON.stringify(got("ac_age")))}</span>`) : ""}</div>
    ${badges.length ? `<div class="sec-head">${t("ac_badges")} <span class="n">${badges.length}</span></div>${badges.map(b => `<div class="lrow">
      <span class="lthumb" style="background-image:url('${escA(b.badgeImageUrl || "")}');background-size:contain;background-repeat:no-repeat;width:34px"></span>
      <div class="info"><div class="nm">${esc(b.badgeName)}</div><div class="sub">${esc(b.badgeDescription || "")}</div></div>
      <div class="acts"><label class="chip lang"><input type="checkbox" ${b.hidden ? "checked" : ""} onchange="setBadge('${esc(b.badgeId)}',{hidden:this.checked})"> ${t("ac_hidden")}</label>
        <label class="chip lang"><input type="checkbox" ${b.showcased ? "checked" : ""} onchange="setBadge('${esc(b.badgeId)}',{showcased:this.checked})"> ${t("ac_showcase")}</label></div></div>`).join("")}` : ""}`;
  }
  if (tab === "messages") {
    const type = AC.msgType, c = CACHE["im_" + type];
    if (!c) inviteMsgs(type);
    return `<div class="toolbar">${tabsHtml(Object.fromEntries(["message", "response", "request", "requestResponse"].map(k => [k, t("ac_mt_" + k)])), type, "acMsgType")}</div>
      ${stateHtml(c) || c.data.map(m => `<div class="fmrow"><div class="flbl">${t("ac_slot", m.slot + 1)}${m.remainingCooldownMinutes ? `<small>${t("ac_cooldown", m.remainingCooldownMinutes)}</small>` : ""}</div>
        <div class="fctl">${fInput(`im_${m.slot}`, m.message, `maxlength="64" ${m.canBeUpdated === false ? "disabled" : ""}`)}
          ${btn(t("save"), `saveMsg('${type}',${m.slot})`, "sm", "save")}${btn(t("ac_reset"), `resetMsg('${type}',${m.slot})`, "sm")}</div></div>`).join("")}`;
  }
  if (tab === "notes") {
    const c = CACHE.ac_notes;
    if (!c) loadOp("ac_notes", "getUserNotes", { _all: true });
    const list = (c?.data || []).filter(n => n.note && (!query || (n.targetUser?.displayName || "").toLowerCase().includes(query) || n.note.toLowerCase().includes(query)));
    return stateHtml(c && { ...c, data: list }) || list.map(n => lrow({ uid: n.targetUserId, name: n.targetUser?.displayName || n.targetUserId, sub: esc(n.note),
      onclick: `showProfile('${esc(n.targetUserId)}')` })).join("");
  }
  if (tab === "store") {
    const ops = { ac_sub: ["getCurrentSubscriptions"], ac_bal: ["getBalance"], ac_lic: ["getActiveLicenses"],
      ac_pur: ["getProductPurchases", { buyerId: AUTH.id, n: 50, sort: "purchaseDate", order: "desc" }], ac_tx: ["getProductPurchaseHistory", { n: 50 }], ac_lim: ["getFavoriteLimits"] };
    for (const [k, [op, p]] of Object.entries(ops)) if (!CACHE[k]) loadOp(k, op, p);
    const subs = got("ac_sub") || [], bal = got("ac_bal"), lic = got("ac_lic") || [], pur = got("ac_pur") || [], txs = got("ac_tx")?.transactions || [], lim = got("ac_lim");
    const byType = {};
    lic.forEach(l => (byType[l.forType] ||= []).push(l));
    return `<div class="statgrid">
        <div class="stat"><b>${bal ? Number(bal.balance ?? 0).toLocaleString() : "…"}</b><span>${t("ac_balance")}</span></div>
        ${subs.filter(s => s.active && !s.isBulkGift && !s.isGift).map(s => `<div class="stat"><b>${esc(s.description || s.tier || "VRC+")}</b><span>${t("ac_expires")} ${fmtIso(s.expires, true)}</span></div>`).join("")
          || `<div class="stat"><b>—</b><span>${t("ac_noSub")}</span></div>`}
        ${subs.some(s => s.isBulkGift) ? `<div class="stat"><b>${subs.filter(s => s.isBulkGift).length}</b><span>${t("ac_gifts")}</span></div>` : ""}
        ${Object.entries(byType).map(([k, v]) => `<div class="stat"><b>${v.length}</b><span>${t("ac_licenses")} · ${esc(k)}</span></div>`).join("")}</div>
      ${lim ? `<div class="sec-head">${t("ac_limits")}</div><div class="kv">${Object.entries(lim.maxFavoriteGroups || {}).map(([k, v]) =>
        `<span>${esc(k)}</span><span>${v} × ${lim.maxFavoritesPerGroup?.[k] ?? "?"}</span>`).join("")}</div>` : ""}
      <div class="sec-head">${t("ac_purchases")} <span class="n">${pur.length}</span></div>
      ${stateHtml(CACHE.ac_pur, "noResults", 70) || pur.map(p => lrow({ thumb: "", name: p.listingDisplayName, sub: `${fmtIso(p.purchaseDate)} · ${p.purchasePrice ?? ""} · ${esc(p.sellerDisplayName || "")}` })
        .replace('<span class="lthumb" ></span>', "")).join("")}
      <div class="sec-head">${t("ac_tx")} <span class="n">${txs.length}</span></div>
      ${stateHtml(CACHE.ac_tx && { ...CACHE.ac_tx, data: txs }, "noResults", 70) || txs.map(x => lrow({ thumb: "", name: x.listingDisplayName || x.reasonLabel || x.reason,
        sub: `${fmtIso(x.date)} · ${x.amount > 0 ? "+" : ""}${x.amount} · ${esc(x.fromUserDisplayName || "")}` }).replace('<span class="lthumb" ></span>', "")).join("")}
      ${lic.length ? `<div class="sec-head">${t("ac_licenses")} <span class="n">${lic.length}</span></div><div class="chips">${lic.map(l => `<span class="chip lang">${esc(l.forName || l.forId)}</span>`).join("")}</div>` : ""}`;
  }
  if (tab === "vrchat") {
    for (const [k, op, p] of [["ac_online", "getCurrentOnlineUsers"], ["ac_health", "getHealth"], ["ac_info", "getInfoPush", { require: "", include: "" }]])
      if (!CACHE[k]) loadOp(k, op, p);
    const online = got("ac_online"), health = got("ac_health"), info = (got("ac_info") || []).filter(i => i.isEnabled !== false && (i.data?.name || i.data?.description));
    return `<div class="statgrid"><div class="stat"><b>${typeof online === "number" ? online.toLocaleString() : "…"}</b><span>${t("ac_online")}</span></div>
        <div class="stat"><b>${health ? (health.ok ? "OK" : "!") : CACHE.ac_health?.error ? "—" : "…"}</b><span>${t("ac_health")}${health?.serverName ? " · " + esc(health.serverName) : ""}</span></div>
        <div class="stat" style="display:flex;align-items:center">${btn(t("ac_session"), "checkSession()", "sm", "shield-check")}</div></div>
      <div class="sec-head">${t("ac_notices")} <span class="n">${info.length}</span></div>
      ${stateHtml(CACHE.ac_info && { ...CACHE.ac_info, data: info }, "noResults", 80) || info.map(i => lrow({ thumb: i.data?.imageUrl || i.data?.thumbnailImageUrl,
        name: i.data?.name || i.data?.overrideName || "", sub: `${esc(i.data?.description || "")}${i.endDate ? "\n" + fmtIso(i.startDate, true) + " – " + fmtIso(i.endDate, true) : ""}` })).join("")}`;
  }
  return "";
}
function acMsgType(type) { AC.msgType = type; renderView(); }
async function saveMyProfile() {
  const u = { status: fv("acStatus"), statusDescription: fv("acStatusDesc"), pronouns: fv("acPronouns"), isBoopingEnabled: fv("acBoop") };
  const p = { bio: fv("acBio"), bioLinks: [0, 1, 2].map(i => fv("acLink" + i)).filter(l => /^https?:\/\//.test(l)), languages: fv("acLangs").split(/[,\s]+/).filter(Boolean) };
  const a = await vrcDo("updateUser", u);
  const b = await vrcDo("updateProfile", p);
  if (a !== undefined && b !== undefined) { toast(t("saved")); delete CACHE.ac_me; renderView(); }
}
async function setRepGroup(gid, old) {
  const r = gid ? await vrcDo("updateGroupRepresentation", { groupId: gid, isRepresenting: true }, "saved")
    : old ? await vrcDo("updateGroupRepresentation", { groupId: old, isRepresenting: false }, "saved") : true;
  if (r !== undefined) { delete CACHE.ac_rep; renderView(); }
}
async function setBadge(id, change) {
  if ((await vrcDo("updateBadge", { badgeId: id, ...change }, "saved")) !== undefined) { delete CACHE.ac_me; renderView(); }
}
async function saveMsg(type, slot) {
  if ((await vrcDo("updateInviteMessage", { messageType: type, slot, message: fv("im_" + slot) }, "saved")) !== undefined) inviteMsgs(type, true);
}
async function resetMsg(type, slot) {
  if ((await vrcDo("resetInviteMessage", { messageType: type, slot }, "done")) !== undefined) inviteMsgs(type, true);
}
async function checkSession() {
  const r = await vrc("verifyAuthToken");
  if (r.ok?.ok) toast(t("ac_sessionOk")); else apiError(r.error ? r : { error: 401 });
}

// ======================= Sign-in location verification (on the login page) =======================
tx({
  lp_title: ["ยืนยันการเข้าสู่ระบบจากที่ใหม่", "Verify new login location", "新しい場所からのログインを確認"],
  lp_hint: ["ถ้า VRChat ส่งอีเมลให้ยืนยันการเข้าสู่ระบบ วางลิงก์จากอีเมลที่นี่ แล้วเข้าสู่ระบบอีกครั้ง",
            "If VRChat emailed you to confirm this login, paste the link here and sign in again", "VRChat からログイン確認のメールが届いたら、リンクを貼り付けて再度サインインしてください"],
  lp_ok: ["ยืนยันแล้ว — เข้าสู่ระบบอีกครั้งได้เลย", "Verified — sign in again", "確認しました。もう一度サインインしてください"],
});
const _buildLogin = buildLogin;
buildLogin = function () {
  _buildLogin();
  const body = $("sheet").querySelector(".sheet-body");
  if (!body || settingsView === "2fa") return;
  body.insertAdjacentHTML("beforeend", `<div class="sec-title">${t("lp_title")}</div><div class="card" style="padding:10px 12px">
    <div class="hint-inline" style="margin-bottom:8px">${t("lp_hint")}</div>
    <div style="display:flex;gap:8px"><input class="field" id="lpLink" placeholder="https://vrchat.com/..." spellcheck="false">
    <button class="btn" onclick="verifyPlace()">${t("save")}</button></div></div>`);
};
async function verifyPlace() {
  const r = await api("verify_login_place", $("lpLink").value);
  if (r?.ok) toast(t("lp_ok")); else apiError(r);
}

// ======================= Register new pages in the menu =======================
Object.assign(NAV, { worlds: ["globe", "blue"], favorites: ["star", "yellow"], events: ["calendar", "pink"], safety: ["shield-ban", "red"], account: ["circle-user-round", "purple"] });
VIEWS.splice(VIEWS.indexOf("history") + 1, 0, "worlds", "favorites", "events");
VIEWS.splice(VIEWS.indexOf("search"), 0, "safety", "account");
for (const v of ["worlds", "favorites", "events", "safety", "account"]) {
  $("jump").insertAdjacentHTML("beforebegin", `<div class="view" id="v_${v}"></div>`);
}
Object.assign(VIEW_RENDER, { worlds: renderWorlds, favorites: renderFavorites, events: renderEvents, safety: renderSafety, account: renderAccount });

// ======================= Windows notifications / tray / start with Windows (v4.2) =======================
tx({
  st_desktop: ["แจ้งเตือนและการทำงานเบื้องหลัง", "Notifications & background", "通知とバックグラウンド"],
  st_notifyFav: ["เพื่อนในรายการโปรดออนไลน์", "Favorite friends come online", "お気に入りのフレンドがオンライン"],
  st_notifyAll: ["เพื่อนทุกคนออนไลน์", "Any friend comes online", "すべてのフレンドがオンライン"],
  st_notifyInvites: ["คำเชิญ / คำขอ / แจ้งเตือนจากกลุ่ม", "Invites, requests & group notices", "招待・リクエスト・グループ通知"],
  st_notifyHint: ["แจ้งเตือนของ Windows แสดงเมื่อหน้าต่างโปรแกรมไม่ได้อยู่ด้านหน้า", "Windows notifications appear when the app window isn't focused", "アプリが前面にないときに Windows 通知を表示"],
  st_tray: ["ปิดหน้าต่างแล้วย่อไปที่ถาดระบบ", "Close to system tray", "閉じるとシステムトレイへ"],
  st_trayHint: ["โปรแกรมยังทำงานต่อ (อ่าน log + แจ้งเตือน) คลิกไอคอนที่ถาดเพื่อเปิด", "Keeps running (log + notifications); click the tray icon to reopen", "動作を続けます。トレイアイコンで再表示"],
  st_autostart: ["เปิดพร้อม Windows", "Start with Windows", "Windows 起動時に開始"],
  st_autostartHint: ["เปิดแบบซ่อนไว้ที่ถาดระบบ", "Starts hidden in the tray", "トレイに隠した状態で起動"],
  i_left: [n => `เหลือ ${n}`, n => `${n} left`, n => `残り ${n}`], i_full: ["เต็มแล้ว — ลบอันเก่าก่อนอัปโหลด", "Full — delete one to upload", "上限です。削除してからアップロード"],
  i_uploadedAt: ["อัปโหลดเมื่อ", "Uploaded", "アップロード日時"],
  emk_static: ["1 เฟรม = อัปโหลดเป็นอีโมจิแบบนิ่ง (1024px)", "1 frame = uploads as a static emoji (1024px)", "1 フレーム = 静止画の絵文字 (1024px)"], i_anim: ["เคลื่อนไหว", "Animated", "アニメ"], a_search: ["ค้นหาอวตาร", "Search avatars", "アバター検索"],
  a_searchPublicPh: ["ค้นหาอวตารสาธารณะ (ชื่อ, ผู้สร้าง, แท็ก)", "Search public avatars (name, author, tags)", "公開アバターを検索 (名前・作者・タグ)"],
  a_searchSource: ["ผลจาก avtrdb.com (ฐานข้อมูลภายนอกที่ VRCX ใช้) — ส่งไปแค่คำค้นหา ไม่ส่งข้อมูลบัญชี",
                   "Results from avtrdb.com (an external database also used by VRCX). Only your search text is sent, never your account.",
                   "avtrdb.com (VRCX も使う外部データベース) の結果。送信するのは検索語のみです"],
});
Object.assign(DEFAULTS, { notifyFav: true, notifyAll: false, notifyInvites: true, tray: false });

// Windows notifications — only when the window isn't in front (when it is, the in-app toast is enough)
function winNotify(title, msg) {
  if (document.hasFocus() && !document.hidden) return;
  api("notify", title || "VRC Nook", msg || "");
}
const _onFeedN = window.onFeed;
window.onFeed = (list) => {
  _onFeedN(list);
  for (const e of list) {
    if (e.type !== "online") continue;
    if (S.notifyAll || (S.notifyFav && favRecord("friend", e.u))) winNotify(e.name, t("ff_online", locLabel(e.d?.location)));
  }
};
const _onNewNotifN = window.onNewNotif;
window.onNewNotif = (n) => {
  _onNewNotifN(n);
  if (S.notifyInvites) winNotify(n.name || "VRChat", t("n_" + n.type, n.worldName || ""));
};
const _onPipelineN = window.onPipelineEvent;
window.onPipelineEvent = (ev) => {
  _onPipelineN(ev);
  if (ev.type === "notification-v2" && S.notifyInvites) winNotify(ev.content?.title || "VRChat", ev.content?.message || "");
};
// Favorites must be loaded first to know which friends are favorited
const _onAuthN = window.onAuth;
window.onAuth = (a) => { _onAuthN(a); if (a.loggedIn) loadFav(); };

// New settings section (inserted before the "Data" heading)
const _buildSettingsN = buildSettings;
buildSettings = function () {
  _buildSettingsN();
  if (settingsView !== "main") return;
  const anchor = [...$("sheet").querySelectorAll(".sec-title")].find(el => el.textContent === t("data"));
  if (!anchor) return;
  anchor.insertAdjacentHTML("beforebegin", `<div class="sec-title">${t("st_desktop")}</div><div class="card">
    ${srow("star", "yellow", t("st_notifyFav"), sw("notifyFav"), t("st_notifyHint"))}
    ${srow("users-round", "green", t("st_notifyAll"), sw("notifyAll"))}
    ${srow("bell", "red", t("st_notifyInvites"), sw("notifyInvites"))}
    ${srow("arrow-down", "blue", t("st_tray"), sw("tray"), t("st_trayHint"))}
    ${srow("rocket", "purple", t("st_autostart"), sw("autostart"), t("st_autostartHint"))}</div>`);
};
const _setSN = setS;
setS = async function (key, value) {
  if (key === "autostart") value = !!(await api("set_autostart", value));
  _setSN(key, value);
};
// "Start with Windows" state is read from the actual registry
window.addEventListener("pywebviewready", async () => { S.autostart = !!(await api("get_autostart")); });

// ---------- Public avatar search (avtrdb.com) ----------
const _thumbStyleN = thumbStyle;
thumbStyle = url => url && url.startsWith("https://thumb.avtrdb.com/") ? `background-image:url('${esc(url)}')` : _thumbStyleN(url);
AVA_TABS.push("search");
const AVS = { q: "", list: null, loading: false, page: 0, more: false };
async function avatarSearch(more) {
  const q = $("avq")?.value.trim();
  if (!q) return;
  if (!more) Object.assign(AVS, { q, list: [], page: 0 });
  AVS.loading = true; renderView();
  const r = await api("avatar_search", AVS.q, AVS.page);
  AVS.loading = false;
  if (r?.ok) { AVS.list.push(...r.ok); AVS.more = r.more; AVS.page++; } else apiError(r);
  renderView();
}
const _renderAvatarsN = renderAvatars;
renderAvatars = function () {
  if (AVA.tab !== "search") return _renderAvatarsN();
  const el = $("v_avatars");
  if (!el.querySelector("#avq")) {
    el.innerHTML = `<div class="search-head" id="avHead"></div><div class="search-head">${sboxHtml("avq")}</div><div id="avres"></div>`;
    wireSbox("avq", () => avatarSearch(), () => { AVS.list = null; AVS.q = ""; renderView(); });
    $("avq").value = AVS.q;
  }
  $("avHead").innerHTML = `<div class="segmented">${AVA_TABS.map(k => `<button class="${AVA.tab === k ? "on" : ""}" onclick="AVA.tab='${k}';$('v_avatars').innerHTML='';renderView()">${t("a_" + k)}</button>`).join("")}</div>`;
  $("avq").placeholder = t("a_searchPublicPh");
  const res = $("avres");
  if (!AVS.list) return res.innerHTML = "";
  if (!AVS.list.length) return res.innerHTML = `<div class="empty-state" style="height:160px">${t(AVS.loading ? "searching" : "noResults")}</div>`;
  res.innerHTML = `<div class="sec-head">${t("a_search")} <span class="n">${AVS.list.length}</span></div>`;
  const grid = document.createElement("div");
  grid.className = "wgrid";
  AVS.list.forEach((a, i) => {
    const d = document.createElement("div");
    d.className = "wcard" + (a.id === AVA.current ? " current" : "");
    d.innerHTML = `<div class="wimg" ${thumbAttr(a.thumb)}></div><div class="winfo"><div class="nm"></div><div class="sub"></div></div>`;
    d.querySelector(".nm").textContent = a.name;
    d.querySelector(".sub").textContent = [a.authorName, a.perf].filter(Boolean).join(" · ");
    d.onclick = () => openAvatar(AVS.list[i]);
    grid.appendChild(d);
  });
  res.appendChild(grid);
  if (AVS.more) res.insertAdjacentHTML("beforeend", `<div class="form-actions">${btn(t(AVS.loading ? "searching" : "loadMore"), "avatarSearch(true)", "", "arrow-down")}</div>`);
};
// Leaving the search tab must clear the page so the original function redraws everything
const _loadAvatarsN = loadAvatars;
loadAvatars = (tab, force) => tab === "search" ? undefined : _loadAvatarsN(tab, force);

// ======================= Tabbed settings (Game Log / Feed filters moved here from the sidebar) =======================
tx({ set_general: ["ทั่วไป", "General", "一般"], set_log: ["Game Log", "Game Log", "ゲームログ"], set_feed: ["Feed", "Feed", "フィード"],
      set_kb: ["คีย์บอร์ด", "Keyboard", "キーボード"],
      kbs_langs: ["ภาษาที่สลับได้", "Languages to switch between", "切り替える言語"],
      kbs_langsHint: ["ปุ่มภาษาบนคีย์บอร์ดจะวนตามลำดับนี้ (ใช้ทั้งคีย์บอร์ดในแอปและคีย์บอร์ดลอย)", "The language key cycles through these in order (in-app and floating keyboard)", "言語キーはこの順に切り替わります"],
      kbs_jaHint: ["พิมพ์ได้แค่คานะ ไม่มีการแปลงเป็นคันจิ", "Kana only — no kanji conversion", "かなのみ（漢字変換なし）"],
      kbs_koHint: ["ตัวอักษรรวมเป็นพยางค์ให้อัตโนมัติ", "Jamo combine into syllables automatically", "字母は自動で音節に結合されます"],
      kbs_viHint: ["กดปุ่มวรรณยุกต์ (◌́ ◌̀ ◌̉ ◌̃ ◌̣) หลังสระ — กดซ้ำเพื่อเอาออก", "Press a tone key (◌́ ◌̀ ◌̉ ◌̃ ◌̣) after the vowel — press again to remove", "母音の後に声調キーを押します"],
      kbs_zhHint: ["พินอินพร้อมวรรณยุกต์ 4 เสียง — ไม่มีแปลงเป็นอักษรจีน", "Pinyin with 4 tone marks — no conversion to characters", "声調記号付きピンイン（漢字変換なし）"],
      kbs_emojiHint: ["อีโมจิยอดนิยม 2 หน้า (Shift = หน้าถัดไป)", "Popular emoji on 2 pages (Shift = next page)", "人気の絵文字 2 ページ（Shift で次へ）"],
      kbs_min: ["ต้องเปิดไว้อย่างน้อย 1 ภาษา", "Keep at least one language on", "少なくとも 1 言語は必要です"],
      kbs_size: ["ขนาดปุ่ม (คีย์บอร์ดในแอป)", "Key size (in-app keyboard)", "キーサイズ（アプリ内）"],
      kbs_floatNote: ["ถ้าคีย์บอร์ดลอยเปิดอยู่ จะใช้ค่าใหม่ตอนเปิดครั้งถัดไป", "A floating keyboard that's already open picks this up next time it opens", "開いているフローティングキーボードには次回から反映されます"] });
let SET_TAB = "general";
const _openSettingsT = openSettings;
openSettings = function (v = "main") {
  // Opened from the Game Log / Feed page = jump straight to that page's filters
  SET_TAB = view === "log" ? "log" : view === "feed" ? "feed" : "general";
  _openSettingsT(v);
};
function setTab(k) { SET_TAB = k; buildSettings(); $("sheet").querySelector(".sheet-body").scrollTop = 0; }
const _buildSettingsT = buildSettings;
buildSettings = function () {
  _buildSettingsT();
  if (settingsView !== "main") return;
  const head = $("sheet").querySelector(".sheet-head"), body = $("sheet").querySelector(".sheet-body");
  head.insertAdjacentHTML("afterend", `<div class="set-tabs">${tabsHtml({ general: t("set_general"), log: t("set_log"), feed: t("set_feed"), kb: t("set_kb") }, SET_TAB, "setTab")}</div>`);
  if (SET_TAB === "kb") body.innerHTML = kbSettingsHtml();
  else if (SET_TAB === "log") body.innerHTML = logFiltersHtml();
  else if (SET_TAB === "feed") body.innerHTML = feedFiltersHtml();
};
function kbSettingsHtml() {
  const on = kbEnabled(S.kbLangs), hint = { ja: "kbs_jaHint", jk: "kbs_jaHint", ko: "kbs_koHint", vi: "kbs_viHint", zh: "kbs_zhHint", emoji: "kbs_emojiHint" };
  const cols = { th: "blue", en: "indigo", ja: "pink", jk: "pink", ko: "teal", ru: "red", vi: "green", zh: "brown", emoji: "orange" };
  return `<div class="sec-title">${t("kbs_langs")}</div>
    <div class="card set-card">${KB_ORDER.map(k => `<label class="toggle-row"><span class="tile kbs-tile" style="--c:var(--${cols[k]})">${KB_LANGS[k].key}</span>
      <span class="label">${KB_LANGS[k].name}${hint[k] ? `<span class="hint">${t(hint[k])}</span>` : ""}</span>
      <span class="switch"><input type="checkbox" ${on.includes(k) ? "checked" : ""} onchange="kbLangSet('${k}',this.checked)"></span></label>`).join("")}</div>
    <div class="note-line">${icon("info")}${t("kbs_langsHint")}</div>
    <div class="sec-title">${t("kbs_size")}</div>
    <div class="card set-card"><div class="srow"><span class="tile" style="--c:var(--purple)">${icon("keyboard")}</span><span class="label">${S.kbSize || 64}px</span>
      <input type="range" min="40" max="110" step="4" value="${S.kbSize || 64}" onchange="S.kbSize=+this.value;save();buildSettings();kbRender()"></div></div>
    <div class="note-line">${icon("info")}${t("kbs_floatNote")}</div>`;
}
function kbLangSet(k, on) {
  const list = kbEnabled(S.kbLangs).filter(x => x !== k).concat(on ? [k] : []);
  if (!list.length) { toast(t("kbs_min")); return buildSettings(); }
  S.kbLangs = KB_ORDER.filter(x => list.includes(x));
  save(); buildSettings(); kbRender();
}
function toggleRow(ic, col, label, checked, onchange) {
  return `<label class="toggle-row"><span class="tile" style="--c:var(--${col})">${icon(ic)}</span><span class="label" title="${escA(label)}">${esc(label)}</span>
    <span class="switch"><input type="checkbox" ${checked ? "checked" : ""} onchange="${onchange}"></span></label>`;
}
function logFiltersHtml() {
  const listed = new Set(GROUPS.flatMap(g => g[1]));
  const extra = Object.keys(KINDS).filter(k => !listed.has(k));
  return `<div class="segmented" style="margin:4px 0 6px">
      <button onclick="setAll(true);buildSettings()">${t("all")}</button><button onclick="setDefault();buildSettings()">${t("defaults")}</button>
      <button onclick="setAll(false);buildSettings()">${t("none")}</button></div>`
    + [...GROUPS, ...(extra.length ? [["g_other", extra]] : [])].map(([title, names]) => {
      const rows = names.filter(n => KINDS[n]).map(n => {
        const [ic, col] = KIND_STYLE[n] || ["circle-alert", "gray"];
        return toggleRow(ic, col, kindLabel(n), enabled[n], `enabled['${n}']=this.checked;save();render()`);
      }).join("");
      return rows ? `<div class="sec-title">${t(title)}</div><div class="card set-card">${rows}</div>` : "";
    }).join("");
}
function feedFiltersHtml() {
  return `<div class="sec-title">${t("feedFilter")}</div><div class="card set-card">${FEED_TYPES.map(k => {
    const [ic, col] = FEED_STYLE[k];
    return toggleRow(ic, col, t("ft_" + k), feedOn[k], `feedOn['${k}']=this.checked;S.feedEnabled=feedOn;save();renderView()`);
  }).join("")}</div>`;
}

// ======================= v4.7: search box / language / Boop / group invites / friends view =======================
tx({
  clearSearch: ["ล้าง", "Clear", "クリア"], lang_max: [n => `เลือกได้สูงสุด ${n} ภาษา`, n => `Up to ${n}`, n => `最大 ${n} つ`],
  boop_title: [n => `ส่ง Boop ถึง ${n}`, n => `Send a boop to ${n}`, n => `${n} に Boop`], boop_send: ["ส่ง Boop", "Send Boop", "Boop を送る"],
  boop_none: ["ไม่ใส่", "None", "なし"], boop_mine: ["อีโมจิของฉัน", "My emoji", "マイ絵文字"], boop_inv: ["จาก Inventory", "From inventory", "インベントリ"],
  boop_default: ["อีโมจิพื้นฐาน", "Default emoji", "デフォルト絵文字"],
  p_inviteGroup: ["เชิญเข้ากลุ่ม", "Invite to group", "グループに招待"], gi_title: [n => `เชิญ ${n} เข้ากลุ่ม`, n => `Invite ${n} to a group`, n => `${n} をグループに招待`],
  fv_cards: ["การ์ด", "Cards", "カード"], fv_list: ["รายการ", "List", "リスト"], fv_icons: ["ไอคอน", "Icons", "アイコン"],
  lastOnline: [s => `ออนไลน์ล่าสุด ${s}`, s => `Last online ${s}`, s => `最終オンライン ${s}`],
  ago_now: ["เมื่อสักครู่", "just now", "たった今"], ago_m: [n => `${n} นาทีที่แล้ว`, n => `${n}m ago`, n => `${n}分前`],
  ago_h: [n => `${n} ชม.ที่แล้ว`, n => `${n}h ago`, n => `${n}時間前`], ago_d: [n => `${n} วันที่แล้ว`, n => `${n}d ago`, n => `${n}日前`],
  ago_mo: [n => `${n} เดือนที่แล้ว`, n => `${n}mo ago`, n => `${n}か月前`],
});

// ---------- Search box ----------
function sboxHtml(id) {
  return `<div class="sbox">${icon("search")}<input class="field" id="${id}" spellcheck="false">
    <button class="sclear" title="${t("clearSearch")}" onmousedown="event.preventDefault()">${icon("x")}</button></div>`;
}
function wireSbox(id, onEnter, onClear) {
  const inp = $(id), box = inp.parentElement, upd = () => box.classList.toggle("has", !!inp.value);
  inp.addEventListener("input", upd);
  inp.addEventListener("keydown", e => {
    if (e.key === "Enter") onEnter();
    if (e.key === "Escape" && inp.value) { e.stopPropagation(); inp.value = ""; upd(); onClear(); }
  });
  box.querySelector(".sclear").onclick = () => { inp.value = ""; upd(); inp.focus(); onClear(); };
  setTimeout(upd);
}
// Top search box: × button clears it
$("searchBox").insertAdjacentHTML("beforeend", `<button class="sclear top" title="${t("clearSearch")}" onmousedown="event.preventDefault()">${icon("x")}</button>`);
{
  const box = $("searchBox"), inp = $("search"), upd = () => box.classList.toggle("has", !!inp.value);
  inp.addEventListener("input", upd);
  box.querySelector(".sclear").onclick = e => { e.preventDefault(); inp.value = ""; upd(); query = ""; render(); renderView(); inp.focus(); };
}

// ---------- Pick a language by clicking ----------
const VRC_LANGS = ["eng", "jpn", "kor", "zho", "tha", "vie", "ind", "msa", "fil", "spa", "por", "fra", "deu", "ita", "nld", "rus", "ukr", "pol",
  "ces", "hun", "ron", "ell", "tur", "ara", "heb", "hin", "swe", "nor", "dan", "fin", "ase", "bfi", "jsl", "dse", "fsl", "kvk"];
const SIGN_LANGS = { ase: "ASL", bfi: "BSL", jsl: "JSL", dse: "NGT", fsl: "LSF", kvk: "KSL" };
function langName(c) {
  if (SIGN_LANGS[c]) return SIGN_LANGS[c];
  try { return new Intl.DisplayNames([S.lang], { type: "language" }).of(LANG3[c] || c) || c; } catch { return c; }
}
const LANGSEL = {};
function langPicker(id, selected, max) {
  LANGSEL[id] = { list: [...(selected || [])], max };
  const all = [...new Set([...LANGSEL[id].list, ...VRC_LANGS])];
  return `<input type="hidden" id="${id}" value="${escA(LANGSEL[id].list.join(","))}"><div class="langpick" data-for="${id}">${all.map(c =>
    `<button type="button" class="chip lang ${LANGSEL[id].list.includes(c) ? "on" : ""}" data-c="${c}" onclick="toggleLang('${id}','${c}')">${esc(langName(c))}</button>`).join("")}</div>`;
}
function toggleLang(id, c) {
  const st = LANGSEL[id];
  const i = st.list.indexOf(c);
  if (i >= 0) st.list.splice(i, 1);
  else if (st.max && st.list.length >= st.max) return toast(t("lang_max", st.max));
  else st.list.push(c);
  $(id).value = st.list.join(",");
  document.querySelectorAll(`.langpick[data-for="${id}"] .chip`).forEach(b => b.classList.toggle("on", st.list.includes(b.dataset.c)));
}

// ---------- Boop with emoji ----------
// VRChat's default emoji (API IDs) — shown as the closest standard emoji, since VRChat doesn't expose images for this set
const BOOP_DEFAULT = [["smile", "😀"], ["laugh", "😆"], ["blushing", "😊"], ["in_love", "😍"], ["kiss", "😘"], ["tongue_out", "😛"], ["wow", "😮"],
  ["thinking", "🤔"], ["shush", "🤫"], ["stoic", "😐"], ["frown", "☹️"], ["crying", "😭"], ["angry", "😡"], ["cantsee", "🙈"], ["sunglasses", "🕶️"],
  ["neon_shades", "😎"], ["skull", "💀"], ["boo", "👻"], ["spooky_ghost", "👻"], ["heart", "❤️"], ["broken_heart", "💔"], ["thumbs_up", "👍"],
  ["thumbs_down", "👎"], ["hand_wave", "👋"], ["hang_ten", "🤙"], ["arrowpoint", "👉"], ["exclamation", "❗"], ["question", "❓"], ["stop", "🛑"],
  ["go", "🟢"], ["zzz", "💤"], ["hourglass", "⌛"], ["keyboard", "⌨️"], ["nomic", "🎙️"], ["noheadphones", "🎧"], ["music_note", "🎵"],
  ["fire", "🔥"], ["confetti", "🎉"], ["gift", "🎁"], ["gifts", "🎁"], ["money", "💰"], ["portal", "🌀"], ["web", "🕸️"], ["cloud", "☁️"],
  ["splash", "💦"], ["snow_fall", "🌨️"], ["snowball", "⚪"], ["coal", "🪨"], ["mistletoe", "🌿"], ["gingerbread", "🍪"], ["candy", "🍬"],
  ["candy_cane", "🍭"], ["candy_corn", "🌽"], ["jack_o_lantern", "🎃"], ["bats", "🦇"], ["pizza", "🍕"], ["pineapple", "🍍"], ["tomato", "🍅"],
  ["ice_cream", "🍦"], ["beer", "🍺"], ["champagne", "🍾"], ["drink", "🥤"], ["beachball", "🏐"], ["sun_lotion", "🧴"], ["life_ring", "🛟"]];
let BOOP = null;  // {uid, key}
function boopDialog(uid) {
  BOOP = { uid, key: "none" };
  if (!INV.data.emoji) loadInv("emoji");
  if (!CACHE.boop_inv) loadOp("boop_inv", "getInventory", { types: "emoji", n: 100 });
  openX(t("boop_title", PROFILES[uid]?.displayName || uid), boopBody, null, true);
}
function boopBody() {
  const on = k => BOOP.key === k ? "on" : "";
  const tile = (k, inner, title = "") => `<button class="btile ${on(k)}" title="${escA(title)}" onclick="BOOP.key='${k}';buildX()">${inner}</button>`;
  const mine = INV.data.emoji || [];
  const inv = (got("boop_inv")?.data || []).filter(i => i.imageUrl);
  const animAttr = f => f.frames > 1 ? `data-frames="${+f.frames}" data-fps="${+f.framesOverTime || 10}" data-loop="${escA(f.loopStyle || "")}"` : "";
  return `<div class="boopgrid">${tile("none", `<span class="bnone">${t("boop_none")}</span>`)}</div>
    ${mine.length ? `<div class="sec-title">${t("boop_mine")}</div><div class="boopgrid">${mine.map(f =>
      tile(f.id, `<span class="iimg" ${thumbAttr(f.url + (f.frames > 1 ? "#full" : ""))} ${animAttr(f)}></span>`, f.animationStyle || "")).join("")}</div>` : ""}
    ${inv.length ? `<div class="sec-title">${t("boop_inv")}</div><div class="boopgrid">${inv.map(i =>
      tile(i.id, `<span class="iimg" ${thumbAttr(i.imageUrl)}></span>`, i.name)).join("")}</div>` : ""}
    <div class="sec-title">${t("boop_default")}</div><div class="boopgrid">${BOOP_DEFAULT.map(([id, ch]) =>
      tile("default_" + id, `<span class="bemo">${ch}</span>`, id.replace(/_/g, " "))).join("")}</div>
    <div class="form-actions boop-send">${btn(t("boop_send"), "sendBoop()", "primary", "hand")}</div>`;
}
async function sendBoop() {
  const k = BOOP.key, p = { userId: BOOP.uid };
  if (k.startsWith("file_")) {
    const f = (INV.data.emoji || []).find(x => x.id === k);
    p.emojiId = k;
    p.emojiVersion = +(((f?.url || "").match(/\/file\/file_[\w-]+\/(\d+)/) || [])[1] || 1);
  } else if (k.startsWith("inv_")) p.inventoryItemId = k;
  else if (k.startsWith("default_")) p.emojiId = k;
  if ((await vrcDo("boop", p, "p_booped")) !== undefined) closeX();
}

// ---------- Invite others to our group ----------
function groupInviteDialog(uid) {
  if (!GRP.mine && !GRP.loading) loadGroups().then(() => X && buildX());  // Redraw the group list once loaded
  openX(t("gi_title", PROFILES[uid]?.displayName || uid), () => !GRP.mine ? stateHtml({ loading: true })
    : GRP.mine.map(g => lrow({ thumb: g.iconUrl, name: g.name, sub: `${esc(g.shortCode || "")}.${esc(g.discriminator || "")}`,
        acts: btn(t("inv_send"), `groupInviteSend('${esc(g.id)}','${esc(uid)}',this)`, "primary sm", "send") })).join(""));
}
async function groupInviteSend(gid, uid, b) {
  b.disabled = true;
  if ((await vrcDo("createGroupInvite", { groupId: gid, userId: uid }, "g_invited")) !== undefined) b.textContent = "✓";
  else b.disabled = false;
}

// ---------- Friends page: view mode + last online ----------
function ago(iso) {
  const d = new Date(iso);
  if (!iso || isNaN(d) || d.getFullYear() < 2015) return "";
  const m = Math.floor((Date.now() - d) / 60000);
  if (m < 1) return t("ago_now");
  if (m < 60) return t("ago_m", m);
  if (m < 1440) return t("ago_h", Math.floor(m / 60));
  if (m < 43200) return t("ago_d", Math.floor(m / 1440));
  return t("ago_mo", Math.floor(m / 43200));
}
const lastSeenAt = f => f.last_activity || f.last_login || "";
function lastSeenText(f) { const a = ago(lastSeenAt(f)); return a ? t("lastOnline", a) : t("fs_offline"); }
renderFriends = function () {
  const el = $("v_friends");
  if (!AUTH.loggedIn) return needLogin(el);
  if (!friendsLoaded) return emptyState(el, "refresh-cw", t("loadingFriends"));
  const mode = S.friendView || "cards";
  const list = Object.values(FRIENDS).filter(f => !query || (f.displayName || "").toLowerCase().includes(query)
    || locLabel(f.location, f.state).toLowerCase().includes(query));
  const group = f => f.state !== "online" ? f.state : parseLoc(f.location).wid ? "online" : "private";
  const by = st => list.filter(f => group(f) === st).sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
  const scroll = el.scrollTop;
  el.innerHTML = `<div class="toolbar"><span class="grow"></span><div class="segmented">${["cards", "list", "icons"].map(k =>
    `<button class="${mode === k ? "on" : ""}" title="${t("fv_" + k)}" onclick="S.friendView='${k}';save();renderView()">${icon({ cards: "layout-grid", list: "list", icons: "users-round" }[k])}</button>`).join("")}</div></div>`;
  for (const st of ["online", "private", "active", "offline"]) {
    const arr = by(st);
    if (st === "online") arr.sort((a, b) => (a.location || "").localeCompare(b.location || ""));
    if (st === "offline" || st === "active") arr.sort((a, b) => lastSeenAt(b).localeCompare(lastSeenAt(a)));  // Most recent first
    if (st === "private" && !arr.length) continue;
    const head = document.createElement("div");
    head.className = "sec-head";
    head.innerHTML = `${t("fs_" + st)} <span class="n">${arr.length}</span>` + (st === "online"
      ? `<span class="live ${pipelineOn ? "on" : ""}" style="margin-left:auto"><i></i>${t(pipelineOn ? "live" : "notLive")}</span>`
      : st === "offline" ? `<button class="btn" style="padding:3px 12px" onclick="S.showOffline=!S.showOffline;save();renderView()">${t(S.showOffline ? "hide" : "show")}</button>` : "");
    el.appendChild(head);
    if (st === "offline" && !S.showOffline) continue;
    const grid = document.createElement("div");
    grid.className = mode === "list" ? "flist" : mode === "icons" ? "ficons" : "fgrid";
    arr.forEach(f => grid.appendChild(mode === "list" ? friendRow(f) : mode === "icons" ? friendIcon(f) : friendCardLast(f)));
    el.appendChild(grid);
  }
  el.scrollTop = scroll;
};
function friendCardLast(f) {
  const d = friendCard(f);
  if (f.state === "offline") d.querySelector(".loc span").textContent = lastSeenText(f);
  return d;
}
function friendRow(f) {
  const d = document.createElement("div");
  d.className = "frrow";
  const L2 = parseLoc(f.location), st = (f.status || "").toLowerCase();
  d.innerHTML = `<span class="slot"></span><span class="nm"></span><span class="sd"></span><span class="where"></span>
    <span class="tail">${L2.wid ? `<span class="itype">${esc(itypeLabel(L2))}</span>` : ""}${f.state === "online" ? joinButtons(f.location) : ""}</span>`;
  d.querySelector(".slot").replaceWith(avatarWithDot(f.id, f.displayName || "?", f.state, f.status));
  d.querySelector(".nm").textContent = f.displayName || f.id;
  d.querySelector(".sd").textContent = f.statusDescription || (f.state !== "offline" ? L().st?.[st] || "" : "");
  d.querySelector(".where").textContent = f.state === "offline" ? lastSeenText(f) : locLabel(f.location, f.state);
  d.onclick = () => showProfile(f.id, f.displayName);
  return d;
}
function friendIcon(f) {
  const d = document.createElement("div");
  d.className = "fic";
  d.title = `${f.displayName}\n${f.state === "offline" ? lastSeenText(f) : locLabel(f.location, f.state)}`;
  d.append(avatarWithDot(f.id, f.displayName || "?", f.state, f.status));
  d.insertAdjacentHTML("beforeend", `<span class="nm"></span>`);
  d.querySelector(".nm").textContent = f.displayName || f.id;
  d.onclick = () => showProfile(f.id, f.displayName);
  return d;
}

document.head.insertAdjacentHTML("beforeend", `<style>
.sbox { position: relative; flex: 1; min-width: 0; }
.sbox > svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--text3); pointer-events: none; }
.sbox .field { padding: 9px 36px 9px 38px; border-radius: 99px; }
.sclear { display: none; place-items: center; width: 22px; height: 22px; border: none; border-radius: 50%; background: var(--track); color: var(--text2); padding: 0; cursor: pointer; }
.sclear:hover { background: var(--hover); color: var(--text); }
.sclear svg { width: 12px; height: 12px; }
.sbox .sclear { position: absolute; right: 9px; top: 50%; transform: translateY(-50%); }
.sbox.has .sclear, .search.has .sclear { display: grid; }
.search .sclear.top { width: 18px; height: 18px; flex-shrink: 0; }
.langpick { display: flex; flex-wrap: wrap; gap: 6px; }
.langpick .chip { border: 1px solid transparent; color: var(--text2); font: 500 12px var(--font); }
.langpick .chip.on { background: color-mix(in srgb, var(--accent) 22%, transparent); border-color: var(--accent); color: var(--text); font-weight: 700; }
.boopgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 8px; }
.btile { aspect-ratio: 1; border-radius: 14px; border: 2px solid transparent; background: var(--card); padding: 6px; cursor: pointer; display: grid; place-items: center; }
.btile:hover { background: var(--hover); }
.btile.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 18%, var(--card)); }
.btile .iimg { width: 100%; height: 100%; border-radius: 8px; }
.bemo { font-size: 30px; line-height: 1; }
.bnone { font: 800 11px var(--font); color: var(--text2); border: 2px dashed var(--text3); border-radius: 50%; width: 46px; height: 46px; display: grid; place-items: center; }
.boop-send { position: sticky; bottom: -22px; padding: 12px 0; background: var(--sheet); margin-bottom: -10px; }
.flist { display: grid; gap: 4px; }
.frrow { display: grid; grid-template-columns: auto minmax(110px, 200px) minmax(0, 1fr) minmax(0, 1.2fr) auto; gap: 12px; align-items: center;
         padding: 6px 10px; border-radius: 12px; background: var(--card); border: 1px solid var(--sep); cursor: pointer; }
.frrow:hover { background: var(--hover); }
.frrow .avatar { width: 30px; height: 30px; font-size: 12px; }
.frrow .nm { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.frrow .sd, .frrow .where { font-size: 11.5px; color: var(--text2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.frrow .tail { display: flex; gap: 6px; align-items: center; justify-content: flex-end; }
.ficons { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 10px; }
.fic { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 4px; border-radius: 14px; cursor: pointer; min-width: 0; }
.fic:hover { background: var(--hover); }
.fic .avatar { width: 54px; height: 54px; font-size: 20px; }
.fic .nm { font-size: 11.5px; font-weight: 600; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.toolbar .segmented button svg { width: 13px; height: 13px; vertical-align: -2px; }
</style>`);

// ======================= Chat: send to the in-game Chatbox (OSC) + history (v4.9) =======================
tx({
  nav_chat: ["แชทในเกม", "Chatbox", "チャットボックス"],
  ch_ph: ["พิมพ์ข้อความที่จะแสดงเหนือหัวในเกม…", "Message to show above your head…", "頭上に表示するメッセージ…"],
  ch_keys: ["Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่", "Enter to send · Shift+Enter for a new line", "Enter で送信 · Shift+Enter で改行"],
  ch_send: ["ส่ง", "Send", "送信"],
  ch_inGame: ["อยู่ในเกม", "In game", "ゲーム中"], ch_notInGame: ["ไม่ได้อยู่ในเกม", "Not in game", "ゲーム外"],
  ch_sound: ["เสียงแจ้งเตือนในเกม", "In-game sound", "ゲーム内の通知音"],
  ch_typingOpt: ["แสดง \"กำลังพิมพ์…\" ในเกม", "Show typing indicator in game", "ゲーム内で入力中を表示"],
  ch_oscHint: ["ต้องเปิด OSC ในเกมก่อน: Action Menu → Options → OSC → Enabled", "Enable OSC in game first: Action Menu → Options → OSC → Enabled", "ゲーム内で OSC を有効にしてください: アクションメニュー → Options → OSC → Enabled"],
  ch_empty: ["ยังไม่เคยส่งข้อความ", "No messages sent yet", "まだ送信したメッセージはありません"],
  ch_resend: ["ส่งอีกครั้ง", "Send again", "もう一度送信"], ch_edit: ["แก้แล้วส่ง", "Edit & send", "編集して送信"],
  ch_del: ["ลบจากประวัติ", "Delete from history", "履歴から削除"],
  ch_wait: ["รอสักครู่ก่อนส่งข้อความถัดไป (VRChat จำกัดความถี่)", "Wait a moment before the next message (VRChat rate limit)", "次の送信まで少しお待ちください（VRChat の制限）"],
  ch_failed: ["ส่งไม่สำเร็จ", "Couldn't send", "送信できませんでした"],
  ch_today: ["วันนี้", "Today", "今日"],
});
NAV.chat = ["message-square", "teal"];
VIEWS.splice(VIEWS.indexOf("search"), 0, "chat");
// History pages (History + Game Log) go at the bottom of the menu
for (const v of ["history", "log"]) VIEWS.push(...VIEWS.splice(VIEWS.indexOf(v), 1));
$("jump").insertAdjacentHTML("beforebegin", `<div class="view" id="v_chat"></div>`);

const CHAT = { items: null, inGame: false, typing: false, typingTimer: 0, last: 0 };
const CHAT_MAX = 144, CHAT_GAP = 1600;  // VRChat won't show messages sent faster than this
function chatInGame() { return lastBatch ? !!lastBatch.location : CHAT.inGame; }
async function loadChat() {
  const r = await api("chat_history");
  CHAT.items = r?.items || []; CHAT.inGame = !!r?.inGame;
  if (view === "chat") renderChat(true);
}
function renderChat(scrollEnd) {
  const el = $("v_chat");
  if (!$("chatList")) {
    el.innerHTML = `<div class="toolbar chat-top"><span class="chat-st" id="chatSt"></span><span class="grow"></span>
        <label class="chat-opt">${icon("keyboard")}<span>${t("ch_typingOpt")}</span>
          <span class="switch"><input type="checkbox" ${S.chatTyping !== false ? "checked" : ""} onchange="S.chatTyping=this.checked;save();if(!this.checked)chatStopTyping()"></span></label>
        <label class="chat-opt">${icon("bell")}<span>${t("ch_sound")}</span>
          <span class="switch"><input type="checkbox" ${S.chatSound !== false ? "checked" : ""} onchange="S.chatSound=this.checked;save()"></span></label></div>
      <div class="chat-list" id="chatList"></div>
      <div class="chat-box">
        <textarea id="chatIn" rows="1" maxlength="400" placeholder="${escA(t("ch_ph"))}" oninput="chatInput()" onkeydown="chatKey(event)" onfocus="chatInput()" onblur="chatStopTyping()"></textarea>
        <span class="chat-n" id="chatN"></span>
        <button class="btn primary" id="chatSend" onclick="chatSend()">${icon("send")}${t("ch_send")}</button>
      </div>
      <div class="chat-hint">${icon("info")}<span>${t("ch_oscHint")}</span><span class="grow"></span><span>${t("ch_keys")}</span></div>`;
    chatInput(true);
  }
  chatStatus();
  const list = $("chatList");
  if (!CHAT.items) {
    if (!CHAT.loading) { CHAT.loading = true; loadChat().finally(() => CHAT.loading = false); }
    list.innerHTML = stateHtml({ loading: true }, "", 160);
    return;
  }
  const items = CHAT.items.filter(m => !query || m.text.toLowerCase().includes(query) || (m.world || "").toLowerCase().includes(query));
  const atEnd = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
  const n = new Date(), today = `${n.getFullYear()}.${String(n.getMonth() + 1).padStart(2, "0")}.${String(n.getDate()).padStart(2, "0")}`;
  let day = "", html = "";
  for (const m of items) {
    const d = m.t.slice(0, 10);
    if (d !== day) { day = d; html += `<div class="chat-day">${d === today ? t("ch_today") : d.replace(/\./g, "-")}</div>`; }
    html += `<div class="chat-msg"><div class="chat-acts">
        <button class="icon-btn" title="${escA(t("ch_resend"))}" onclick="chatResend(${m.id})">${icon("rotate-ccw")}</button>
        <button class="icon-btn" title="${escA(t("ch_edit"))}" onclick="chatEdit(${m.id})">${icon("pencil")}</button>
        <button class="icon-btn" title="${escA(t("ch_del"))}" onclick="confirmBtn(this,()=>chatDelete(${m.id}))">${icon("trash-2")}</button></div>
      <div class="chat-bub">${esc(m.text)}</div>
      <div class="chat-meta">${m.t.slice(11, 16)}${m.world ? ` · ${esc(m.world)}` : ""}</div></div>`;
  }
  list.innerHTML = html || `<div class="empty-state" style="height:160px">${query ? t("noResults") : t("ch_empty")}</div>`;
  if (scrollEnd || atEnd) list.scrollTop = list.scrollHeight;
}
function chatStatus() {
  const st = $("chatSt");
  if (!st) return;
  const on = chatInGame(), w = lastBatch?.world && lastBatch.world !== "-" ? lastBatch.world : "";
  st.className = "chat-st" + (on ? " on" : "");
  st.innerHTML = `<i></i>${on ? t("ch_inGame") + (w ? " · " + esc(w) : "") : t("ch_notInGame")}`;
}
function chatInput(init) {
  const ta = $("chatIn"), n = [...ta.value].length;
  ta.style.height = "";  // Empty = 1 line (the placeholder shouldn't push the height)
  if (ta.value) ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  $("chatN").textContent = `${n} / ${CHAT_MAX}`;
  $("chatN").classList.toggle("over", n > CHAT_MAX);
  $("chatSend").disabled = !ta.value.trim() || n > CHAT_MAX;
  if (init) return;
  // Show "typing…" in game while typing (3 s idle = off)
  // In-game "typing…" dots: on while the box has text and you're typing; off on send / clear / blur / 10 s idle
  if (!ta.value.trim() || S.chatTyping === false) return chatStopTyping();
  if (!CHAT.typing) {
    CHAT.typing = true; api("chat_typing", true);
    CHAT.keep = setInterval(() => api("chat_typing", true), 4000);  // Re-send periodically in case the game clears the dots or OSC was just enabled
  }
  clearTimeout(CHAT.typingTimer);
  CHAT.typingTimer = setTimeout(chatStopTyping, 10000);
}
function chatStopTyping() {
  clearTimeout(CHAT.typingTimer); clearInterval(CHAT.keep);
  if (CHAT.typing) { CHAT.typing = false; api("chat_typing", false); }
}
function chatKey(e) {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); chatSend(); }
}
async function chatSend(text) {
  const ta = $("chatIn"), fromBox = text === undefined;
  text = (fromBox ? ta.value : text).trim().split("\n").slice(0, 9).join("\n");
  if (!text || [...text].length > CHAT_MAX) return;
  if (CHAT.last + CHAT_GAP > Date.now()) return toast(t("ch_wait"));
  CHAT.last = Date.now();
  chatStopTyping();
  const r = await api("chat_send", text, S.chatSound !== false);
  if (!r || r.error) return toast(t("ch_failed") + (r?.error && r.error !== "empty" ? ": " + r.error : ""));
  (CHAT.items ||= []).push(r);
  if (fromBox) { ta.value = ""; chatInput(true); ta.focus(); }
  renderChat(true);
}
function chatResend(id) { const m = CHAT.items.find(x => x.id === id); if (m) chatSend(m.text); }
function chatEdit(id) {
  const m = CHAT.items.find(x => x.id === id), ta = $("chatIn");
  if (!m) return;
  ta.value = m.text; chatInput(); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
}
async function chatDelete(id) {
  await api("chat_delete", id);
  CHAT.items = CHAT.items.filter(x => x.id !== id);
  renderChat();
}
VIEW_RENDER.chat = () => renderChat();
VIEW_REFRESH.chat = () => { CHAT.items = null; renderChat(true); };
const _setViewChat = setView;
setView = function (v, persist) { if (view === "chat" && v !== "chat") chatStopTyping(); return _setViewChat(v, persist); };
const _onBatchChat = window.onBatch;
window.onBatch = b => { _onBatchChat(b); if (view === "chat") chatStatus(); };

document.head.insertAdjacentHTML("beforeend", `<style>
#v_chat.on { display: flex; flex-direction: column; padding: 0; overflow: hidden; }
.chat-top { padding: 6px 16px 0; }
.chat-st { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text2); background: var(--track); border-radius: 99px;
           padding: 5px 12px; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chat-st i { width: 8px; height: 8px; border-radius: 50%; background: var(--gray); flex-shrink: 0; }
.chat-st.on { color: var(--text); }
.chat-st.on i { background: var(--green); box-shadow: 0 0 0 3px color-mix(in srgb, var(--green) 25%, transparent); }
.chat-opt { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text2); cursor: pointer; }
.chat-opt > svg { width: 15px; height: 15px; }
.chat-list { flex: 1; min-height: 0; overflow-y: auto; padding: 8px 18px 12px; display: flex; flex-direction: column; }
.chat-day { align-self: center; font-size: 11px; color: var(--text2); background: var(--track); border-radius: 99px; padding: 2px 10px; margin: 12px 0 6px; }
.chat-msg { align-self: flex-end; max-width: 72%; display: grid; grid-template-columns: auto minmax(0, auto); grid-template-areas: "acts bub" ". meta"; column-gap: 6px; margin: 3px 0; }
.chat-bub { grid-area: bub; background: var(--accent); color: #fff; padding: 8px 13px; border-radius: 18px 18px 5px 18px; white-space: pre-wrap;
            overflow-wrap: anywhere; font-size: 13.5px; line-height: 1.4; user-select: text; }
.chat-meta { grid-area: meta; justify-self: end; font-size: 10.5px; color: var(--text2); margin-top: 3px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chat-acts { grid-area: acts; align-self: center; display: flex; gap: 2px; opacity: 0; transition: opacity .15s; }
.chat-msg:hover .chat-acts { opacity: 1; }
.chat-acts .icon-btn { width: 28px; height: 28px; }
.chat-acts .icon-btn svg { width: 14px; height: 14px; }
.chat-box { display: flex; align-items: flex-end; gap: 8px; margin: 0 14px; padding: 7px 7px 7px 15px; border-radius: 22px; background: var(--card); border: 1px solid var(--sep); }
.chat-box:focus-within { border-color: var(--accent); }
.chat-box textarea { flex: 1; height: 31px; min-width: 0; border: none; outline: none; background: none; color: var(--text); font: 13.5px/1.45 var(--font); resize: none; padding: 6px 0; max-height: 180px; }
.chat-box .btn { border-radius: 99px; }
.chat-n { font: 11px var(--mono); color: var(--text2); align-self: center; white-space: nowrap; }
.chat-n.over { color: var(--red); font-weight: 600; }
.chat-hint { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text2); padding: 6px 22px 12px; }
.chat-hint svg { width: 13px; height: 13px; flex-shrink: 0; }
</style>`);

// ======================= On-screen keyboard (Thai / English) with big keys for VR (v4.11) =======================
tx({
  kb_toggle: ["คีย์บอร์ดบนจอ", "On-screen keyboard", "スクリーンキーボード"],
  kb_size: ["ขนาดปุ่ม", "Key size", "キーサイズ"],
  kb_space: ["เว้นวรรค", "space", "スペース"],
  kb_clear: ["ล้างข้อความ", "Clear text", "テキストを消去"],
  kb_copy: ["คัดลอก", "Copy", "コピー"], kb_paste: ["วาง", "Paste", "貼り付け"], kb_all: ["เลือกทั้งหมด", "Select all", "すべて選択"], kb_copied: ["คัดลอกแล้ว", "Copied", "コピーしました"],
  kb_pop: ["แยกคีย์บอร์ดออกมาลอยเหนือทุกโปรแกรม", "Pop out — float above all apps", "切り離して最前面に表示"],
  kb_floating: ["คีย์บอร์ดลอยอยู่ — พิมพ์ลงโปรแกรมที่ใช้งานอยู่ได้เลย", "Keyboard is floating — it types into the active app", "キーボードはフローティング中"],
  kb_dock: ["ดึงกลับมา", "Dock back", "戻す"],
});
// Layouts for every language are in kb_layouts.js (loaded before this file)
const KBS = { shift: 0, rep: 0 };  // shift: 0 off, 1 once, 2 locked

const _renderChatKb = renderChat;
renderChat = function (scrollEnd) {
  const fresh = !$("chatList");
  _renderChatKb(scrollEnd);
  if (!fresh) return;
  $("chatSend").insertAdjacentHTML("beforebegin",
    `<button class="btn icon-only kb-tg" id="kbTg" title="${escA(t("kb_toggle"))}" onclick="kbToggle()">${icon("keyboard")}</button>`);
  document.querySelector("#v_chat .chat-box").insertAdjacentHTML("afterend", `<div id="chatKb"></div>`);
  kbRender();
};
let KB_LIVE = false;
function kbPop() {
  KB_LIVE = true; S.kbFloat = true; save(); kbRender();
  api("kb_float", true, { lang: S.lang, kbLang: kbCur(), langs: kbEnabled(S.kbLangs), dark: dark(), rect: S.kbFloatRect,
    mode: S.kbFloatMode === "win" ? "win" : "chat", sound: S.chatSound !== false, typing: S.chatTyping !== false,
    accent: getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() });
}
// Closing the floating keyboard = dock it back in the chat page (position/size remembered for next time)
window.onKbFloat = ({ rect } = {}) => { KB_LIVE = false; S.kbFloat = false; S.kbOpen = true; if (rect) S.kbFloatRect = rect; save(); kbRender(); };
window.onKbMode = m => { S.kbFloatMode = m; save(); };
// Messages sent from the floating keyboard (in-game chat mode) also go into the chat page history
window.onChatSent = m => { if (CHAT.items) { CHAT.items.push(m); if (view === "chat") renderChat(true); } };
window.onKbLang = k => { if (KB_LANGS[k]) { S.kbLang = k; save(); if (!S.kbFloat) kbRender(); } };
// Current language (if the remembered one is disabled in settings, use the first enabled one)
function kbCur() { const on = kbEnabled(S.kbLangs); return on.includes(S.kbLang) ? S.kbLang : on[0]; }
function kbToggle() {
  if (S.kbFloat) return api("kb_float", false); S.kbOpen = !S.kbOpen; save(); kbRender(); const l = $("chatList"); if (l) l.scrollTop = l.scrollHeight; }
function kbSize(d) { S.kbSize = Math.max(40, Math.min(110, (S.kbSize || 64) + d)); save(); kbRender(); }
function kbRender() {
  const box = $("chatKb");
  if (!box) return;
  if (S.kbFloat && !KB_LIVE) S.kbFloat = false;  // App restarted = the old floating window is gone
  if (S.kbFloat) {  // Floating keyboard is popped out
    $("v_chat").classList.remove("kbopen"); $("kbTg").classList.add("on");
    box.innerHTML = `<div class="kb-away">${icon("picture-in-picture-2")}<span>${t("kb_floating")}</span><span class="grow"></span>
      <button class="btn sm" onclick="api('kb_float', false)">${t("kb_dock")}</button></div>`;
    return;
  }
  $("v_chat").classList.toggle("kbopen", !!S.kbOpen);
  $("kbTg").classList.toggle("on", !!S.kbOpen);
  if (!S.kbOpen) return box.innerHTML = "";
  const lang = kbCur(), rows = kbRows(lang, KBS.shift), next = kbNext(lang, S.kbLangs);
  const key = ch => `<button data-k="${escA(ch)}">${esc(kbKeyLabel(ch))}</button>`;
  const fn = (act, inner, cls = "") => `<button class="fn ${cls}" data-act="${act}">${inner}</button>`;
  const shiftCls = KBS.shift === 2 ? "on lock" : KBS.shift ? "on" : "";
  box.innerHTML = `<div class="kb" style="--kb-h:${kbFit()}px">
    <div class="kb-head"><span>${t("kb_size")}</span>
      <button class="icon-btn" onclick="kbSize(-8)">${icon("minus")}</button><button class="icon-btn" onclick="kbSize(8)">${icon("plus")}</button>
      <span class="kb-sep"></span>
      <button class="kb-pill" data-act="copy">${icon("copy")}${t("kb_copy")}</button><button class="kb-pill" data-act="paste">${icon("clipboard")}${t("kb_paste")}</button><button class="kb-pill" data-act="all">${icon("text-select")}${t("kb_all")}</button>
      <span class="kb-grow"></span>
      <button class="icon-btn" title="${escA(t("kb_pop"))}" onclick="kbPop()">${icon("picture-in-picture-2")}</button>
      <button class="icon-btn" title="${escA(t("close"))}" onclick="kbToggle()">${icon("x")}</button></div>
    <div class="kb-row">${[...rows[0]].map(key).join("")}${fn("bs", icon("delete"), "w15")}</div>
    <div class="kb-row">${[...rows[1]].map(key).join("")}</div>
    <div class="kb-row">${[...rows[2]].map(key).join("")}${fn("enter", icon("corner-down-left"), "w15 send")}</div>
    <div class="kb-row">${fn("shift", icon("arrow-big-up"), "w15 " + shiftCls)}${[...rows[3]].map(key).join("")}${fn("shift", icon("arrow-big-up"), "w15 " + shiftCls)}</div>
    <div class="kb-row">${fn("lang", `${icon("languages")}<b>${next === lang ? KB_LANGS[lang].key : KB_LANGS[next].key}</b>`, "w2")}
      ${fn("space", `<small>${KB_LANGS[lang].name} · ${t("kb_space")}</small>`, "sp")}
      ${fn("clear", icon("eraser"), "w15")}${fn("send", `${icon("send")}<b>${t("ch_send")}</b>`, "w2 send")}</div></div>`;
}
// Keys as large as configured, but shrunk to fit the window (leaving room for at least ~1 chat message)
function kbFit() {
  const vc = $("v_chat"), want = S.kbSize || 64;
  if (!vc?.clientHeight) return want;
  const used = (vc.querySelector(".chat-top")?.offsetHeight || 46) + (vc.querySelector(".chat-box")?.offsetHeight || 48);
  const room = vc.clientHeight - used - 80 /* History */ - 28 /* Keyboard header */ - 4 * 6 - 34 /* Edge */;
  return Math.max(34, Math.min(want, Math.floor(room / 5)));
}
window.addEventListener("resize", () => {
  const kb = document.querySelector("#chatKb .kb");
  if (kb && view === "chat") kb.style.setProperty("--kb-h", kbFit() + "px");
});
function kbInsert(s) {
  const ta = $("chatIn"), a = ta.selectionStart ?? ta.value.length, b = ta.selectionEnd ?? a;
  ta.setRangeText(s, a, b, "end");
  chatInput();
  if (KBS.shift === 1) { KBS.shift = 0; kbRender(); }
}
// Letter keys — some languages combine with the previous character (kbCompose in kb_layouts.js)
function kbKey(ch) {
  const ta = $("chatIn"), a = ta.selectionStart ?? ta.value.length, b = ta.selectionEnd ?? a;
  const prev = a === b && a > 0 ? [...ta.value.slice(0, a)].pop() : "";
  const r = prev ? kbCompose(kbCur(), prev, ch) : null;  // Korean syllable composition / Vietnamese + Pinyin tone marks
  if (r == null) return kbInsert(ch);
  ta.setRangeText(r, a - prev.length, a, "end");
  chatInput();
  if (KBS.shift === 1) { KBS.shift = 0; kbRender(); }
}
function kbBackspace() {
  const ta = $("chatIn");
  let a = ta.selectionStart ?? ta.value.length, b = ta.selectionEnd ?? a;
  if (a === b) {
    if (!a) return;
    a -= /[\uDC00-\uDFFF]/.test(ta.value[a - 1]) && a > 1 ? 2 : 1;  // 1 emoji = 2 units
  }
  ta.setRangeText("", a, b, "end");
  chatInput();
}
function kbAct(act) {
  const ta = $("chatIn");
  if (act === "bs") kbBackspace();
  else if (act === "space") kbInsert(" ");
  else if (act === "enter") { if (KBS.shift) kbInsert("\n"); else chatSend(); }
  else if (act === "send") chatSend();
  else if (act === "clear") { ta.value = ""; chatInput(); }
  else if (act === "all") { ta.focus(); ta.select(); }
  else if (act === "copy") {  // Copy the selection (nothing selected = everything)
    const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd) || ta.value;
    if (sel) { api("copy", sel); toast(t("kb_copied")); }
  }
  else if (act === "paste") api("clip_get").then(x => x && kbInsert(String(x).replace(/\r/g, "")));
  else if (act === "shift") { KBS.shift = (KBS.shift + 1) % 3; kbRender(); }
  else if (act === "lang") { S.kbLang = kbNext(kbCur(), S.kbLangs); KBS.shift = 0; save(); kbRender(); }
}
// Fire on pointerdown (more responsive than click in VR) without stealing focus from the text box — holding backspace repeats
document.addEventListener("pointerdown", e => {
  const b = e.target.closest(".kb button[data-k], .kb button[data-act]");
  if (!b || e.button > 0) return;
  e.preventDefault();
  b.classList.add("down");
  if (b.dataset.k !== undefined) return kbKey(b.dataset.k);
  kbAct(b.dataset.act);
  if (b.dataset.act === "bs") KBS.rep = setTimeout(function again() { kbBackspace(); KBS.rep = setTimeout(again, 60); }, 450);
});
const kbUp = () => { clearTimeout(KBS.rep); document.querySelectorAll(".kb button.down").forEach(b => b.classList.remove("down")); };
document.addEventListener("pointerup", kbUp);
document.addEventListener("pointercancel", kbUp);
document.addEventListener("pointerleave", kbUp);

document.head.insertAdjacentHTML("beforeend", `<style>
.btn.icon-only.kb-tg.on { background: var(--accent); color: #fff; }
#v_chat.kbopen .chat-hint { display: none; }
.kb-away { display: flex; align-items: center; gap: 10px; margin: 8px 14px 0; padding: 8px 8px 8px 14px; border-radius: 14px; font-size: 12px;
           color: var(--text2); background: var(--card); border: 1px solid var(--sep); }
.kb-away svg { width: 16px; height: 16px; color: var(--accent); }
#v_chat .chat-list { min-height: 70px; }
.kb { margin: 8px 14px 12px; padding: 6px 8px 8px; border-radius: 20px; background: var(--card); border: 1px solid var(--sep);
      display: flex; flex-direction: column; gap: 6px; user-select: none; touch-action: manipulation; }
.kb-head { display: flex; align-items: center; gap: 2px; font-size: 11.5px; color: var(--text2); padding: 0 2px 0 6px; }
.kb-head span:first-child { margin-right: 4px; }
.kb-head .icon-btn { width: 30px; height: 26px; }
.kb-row { display: flex; gap: 6px; }
.kb-grow { flex: 1; }
.kb-sep { width: 1px; height: 16px; margin: 0 6px; background: var(--sep); }
.kb-pill { height: 24px; border: none; border-radius: 7px; padding: 0 9px; margin-right: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;
           background: color-mix(in srgb, var(--text) 8%, transparent); color: var(--text); font: 500 11.5px var(--font); }
.kb-pill:hover { background: color-mix(in srgb, var(--text) 15%, transparent); }
.kb-pill.down { background: var(--accent); color: #fff; }
.kb-pill svg { width: 13px; height: 13px; }
.kb-row button { flex: 1 1 0; min-width: 0; height: var(--kb-h); border: none; border-radius: 12px; cursor: pointer;
  background: color-mix(in srgb, var(--text) 13%, transparent); color: var(--text);
  font: 500 calc(var(--kb-h) * .42)/1 var(--font); display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: background .08s, transform .08s; }
.kb-row button:hover { background: color-mix(in srgb, var(--text) 20%, transparent); }
.kb-row button.fn { background: color-mix(in srgb, var(--text) 7%, transparent); }
.kb-row button svg { width: calc(var(--kb-h) * .38); height: calc(var(--kb-h) * .38); }
.kb-row button b { font-size: calc(var(--kb-h) * .28); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kb-row button small { font-size: calc(var(--kb-h) * .22); color: var(--text2); }
.kb-row button.on, .kb-row button.send { background: var(--accent); color: #fff; }
.kb-row button.lock { box-shadow: inset 0 -4px 0 rgba(255,255,255,.85); }
.kb-row button.down { background: var(--accent); color: #fff; transform: scale(.94); }
.kb-row .w15 { flex-grow: 1.5; } .kb-row .w2 { flex-grow: 2; } .kb-row .sp { flex-grow: 6; }
</style>`);

// ======================= VRChat effect preview in the emoji maker (v4.14) =======================
// Show the official preview of the selected animationStyle before uploading
tx({
  fx_vrc: ["ตัวอย่าง effect", "Effect preview", "エフェクト見本"],
  fx_vrcNote: ["ภาพตัวอย่างทางการจาก VRChat (ใช้อีโมจิตัวอย่าง) — ในเกมจะเป็นอีโมจิของคุณ", "Official VRChat preview (sample emoji) — in game it uses your emoji", "VRChat 公式プレビュー（見本の絵文字）— ゲーム内では自分の絵文字になります"],
  fx_vrcNone: ["VRChat ไม่มีภาพตัวอย่างของเอฟเฟกต์นี้", "VRChat has no preview for this effect", "このエフェクトの公式プレビューはありません"],
  fx_vrcFail: ["โหลดภาพตัวอย่างจาก VRChat ไม่ได้", "Couldn't load the VRChat preview", "VRChat のプレビューを読み込めません"],
  fx_sheet: ["Sprite sheet", "Sprite sheet", "スプライトシート"],
});
const _buildEmkFx = buildEmk;
buildEmk = function () {
  _buildEmkFx();
  const sh = $("emkSh");
  if (!sh) return;
  const tab = S.emkTab === "sheet" ? "sheet" : "vrc";
  sh.insertAdjacentHTML("beforebegin", `<div class="segmented emk-tabs">${[["vrc", "play", "fx_vrc"], ["sheet", "layout-grid", "fx_sheet"]]
    .map(([k, ic, l]) => `<button class="${tab === k ? "on" : ""}" onclick="emkTab('${k}')">${icon(ic)}${t(l)}</button>`).join("")}</div>`);
  sh.insertAdjacentHTML("afterend", `<div class="emk-vrc" id="emkVrc"></div>
    <div class="emk-fxnote" id="emkFxNote"></div>`);
  sh.style.display = tab === "sheet" ? "" : "none";
  $("emkVrc").style.display = tab === "vrc" ? "" : "none";
  $("emkFxNote").style.display = tab === "sheet" ? "none" : "";
  fxNote();
  if (tab === "vrc") fxVrc();
};
// VRChat's official previews — loaded directly from VRChat's servers when viewed (not bundled in the app)
const FX_VRC = { aura: "Aura", bats: "Fall_Bats", bees: "Bees", bounce: "Bounce", cloud: "Cloud", confetti: "Winter_Confetti", crying: "Crying",
  dislike: "Dislike", fire: "Fire", idea: "Idea", lasers: "Lasers", like: "Like", magnet: "Magnet", mistletoe: "Winter_Mistletoe", money: "Money",
  noise: "Noise", orbit: "Orbit", pizza: "Pizza", rain: "Rain", rotate: "Rotate", shake: "Shake", spin: "Spin", snowball: "Winter_Snowball",
  splash: "SummerSplash", stop: "Stop", zzz: "ZZZ" };
function fxNote(fail) {
  const n = $("emkFxNote");
  if (!n) return;
  n.innerHTML = icon("info") + t(fail ? "fx_vrcFail" : FX_VRC[EMK.style] ? "fx_vrcNote" : "fx_vrcNone");
}
function fxVrc() {
  const box = $("emkVrc");
  if (!box) return;
  const f = FX_VRC[EMK.style];
  if (!f) { box.innerHTML = `<div class="emk-vrc-none">${icon("image")}</div>`; return fxNote(); }
  const url = `https://assets.vrchat.com/www/images/emoji-previews/Preview_B2-${f}.gif`;
  if (box.querySelector("img")?.dataset.u === url) return;
  box.innerHTML = `<img data-u="${url}" src="${url}" alt="${escA(EMK.style)}" onerror="fxNote(true)" onload="fxNote()"><span class="spin-dot"></span>`;
  fxNote();
}
const _emkSetFx = emkSet;
emkSet = function (k, v, rebuild) { _emkSetFx(k, v, rebuild); if (k === "style") { fxVrc(); fxNote(); } };
function emkTab(k) { S.emkTab = k; save(); buildEmk(); emkQueue(); }
document.head.insertAdjacentHTML("beforeend", `<style>
.emk-tabs { width: 300px; }
.emk-vrc { width: 300px; height: 300px; border-radius: 16px; overflow: hidden; background: #111214; position: relative; }
.emk-vrc img { width: 100%; height: 100%; display: block; position: relative; z-index: 1; }
.emk-vrc .spin-dot { position: absolute; left: 50%; top: 50%; width: 22px; height: 22px; margin: -11px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.2); border-top-color: #fff; animation: fxspin 1s linear infinite; }
@keyframes fxspin { to { transform: rotate(360deg); } }
.emk-vrc-none { height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,.25); }
.emk-vrc-none svg { width: 48px; height: 48px; }
.emk-tabs button { font-size: 11.5px; padding-left: 4px; padding-right: 4px; }
.emk-tabs button { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.emk-tabs svg { width: 14px; height: 14px; }
.emk-fxnote { width: 300px; display: flex; gap: 6px; align-items: center; font-size: 11px; color: var(--text2); margin-top: -4px; }
.emk-fxnote svg { width: 13px; height: 13px; flex-shrink: 0; }
</style>`);

// ======================= × close button on every window + font setting (v4.17) =======================
// Profile / world / group / avatar cards have no header — add a floating × top-right on every redraw
new MutationObserver(() => {
  const c = $("pcard");
  if (c.childElementCount && !c.querySelector(":scope > .xclose")) c.insertAdjacentHTML("afterbegin", xBtn("closeProfile()", "float"));
}).observe($("pcard"), { childList: true });

tx({ font: ["ฟอนต์", "Font", "フォント"], font_system: ["ค่าเริ่มต้นของระบบ", "System default", "システム標準"] });
// Google Fonts with Thai support (loaded when selected — falls back to the system font when offline)
const FONTS = ["Noto Sans Thai", "Sarabun", "Prompt", "Kanit", "IBM Plex Sans Thai", "Anuphan"];
const FONT_BASE = getComputedStyle(document.documentElement).getPropertyValue("--font").trim();
function applyFont() {
  const f = FONTS.includes(S.font) ? S.font : "";
  let link = $("gfont");
  if (f) {
    const href = `https://fonts.googleapis.com/css2?family=${f.replace(/ /g, "+")}:wght@300;400;500;600;700&display=swap`;
    if (!link) document.head.insertAdjacentHTML("beforeend", `<link rel="stylesheet" id="gfont">`), link = $("gfont");
    if (link.getAttribute("href") !== href) link.setAttribute("href", href);
  } else link?.remove();
  document.documentElement.style.setProperty("--font", f ? `"${f}", ${FONT_BASE}` : FONT_BASE);
}
function fontSelect() {
  return `<select class="fsel" onchange="setS('font',this.value)">
    <option value="" ${FONTS.includes(S.font) ? "" : "selected"}>${t("font_system")}</option>
    ${FONTS.map(f => `<option value="${f}" ${S.font === f ? "selected" : ""} style="font-family:'${f}'">${f}</option>`).join("")}</select>`;
}
// Load every font's preview when settings open so the dropdown shows the real typeface
const _openSettingsF = openSettings;
openSettings = function (...a) {
  if (!$("gfontAll")) document.head.insertAdjacentHTML("beforeend", `<link rel="stylesheet" id="gfontAll"
    href="https://fonts.googleapis.com/css2?${FONTS.map(f => "family=" + f.replace(/ /g, "+")).join("&")}&display=swap">`);
  return _openSettingsF(...a);
};
applyFont();

document.head.insertAdjacentHTML("beforeend", `<style>
.xclose { width: 32px; height: 32px; border-radius: 50%; padding: 0; flex-shrink: 0; display: grid; place-items: center;
          background: color-mix(in srgb, var(--text) 9%, transparent); color: var(--text2); }
.xclose:hover { background: color-mix(in srgb, var(--text) 16%, transparent); color: var(--text); }
.xclose svg { width: 17px; height: 17px; }
.xclose.float { position: sticky; top: 12px; margin: 12px 12px -44px auto; z-index: 6; background: rgba(0,0,0,.35); color: #fff;
                backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.xclose.float:hover { background: rgba(0,0,0,.55); color: #fff; }
.fsel { border: none; border-radius: 8px; background: var(--track); color: var(--text); font: 500 12.5px var(--font); padding: 6px 10px; max-width: 190px; }
</style>`);

// ======================= Background theme: custom colors (v4.18) =======================
tx({
  wallpaper: ["ธีม", "Theme", "テーマ"],
  wc_title: ["ปรับแต่งสีเอง", "Custom colors", "カスタムカラー"],
  wc_c: ["สี", "Color", "色"], wc_base: ["พื้น", "Base", "ベース"],
  wc_mode: ["กำลังแก้ของโหมด", "Editing", "編集中のモード"],
  wc_from: ["เริ่มจาก", "Start from", "プリセットから"],
});
for (const [k, v] of Object.entries({ th: "กำหนดเอง", en: "Custom", ja: "カスタム" })) I18N[k].wp = { ...I18N[k].wp, custom: v };
let WALL_EDIT = false;
// Custom colors [dark, light], each mode has 4 gradient colors + a base color — starts from Tahoe
function syncCustomWall() {
  const ok = w => Array.isArray(w) && w.length === 2 && w.every(m => Array.isArray(m) && m.length === 5 && m.every(c => /^#[0-9a-f]{6}$/i.test(c)));
  if (!ok(S.customWall)) S.customWall = JSON.parse(JSON.stringify(WALLPAPERS.tahoe));
  WALLPAPERS.custom = S.customWall;
}
const _applyAppearanceW = applyAppearance;
applyAppearance = function () { syncCustomWall(); _applyAppearanceW(); };
const _buildSettingsW = buildSettings;
buildSettings = function () {
  syncCustomWall();
  _buildSettingsW();
  const sw = $("sheet").querySelector(".swatch[onclick*=\"'custom'\"]");
  if (!sw) return;
  sw.classList.add("custom");
  sw.innerHTML = icon(WALL_EDIT ? "chevron-down" : "palette");
  sw.setAttribute("onclick", "wallCustom()");
  if (!WALL_EDIT) return;
  const d = dark() ? 0 : 1, w = S.customWall[d];
  const presets = Object.keys(WALLPAPERS).filter(k => k !== "custom");
  sw.closest(".srow").insertAdjacentHTML("afterend", `<div class="wc">
    <div class="wc-head"><b>${t("wc_title")}</b><span class="hint-inline">${t("wc_mode")}: ${t(d ? "themeLight" : "themeDark")}</span><span class="grow"></span>
      <select class="fsel" onchange="if(this.value)wallFrom(this.value)"><option value="">${t("wc_from")}…</option>
        ${presets.map(k => `<option value="${k}">${esc(L().wp[k] || k)}</option>`).join("")}</select></div>
    <div class="wc-row">${w.map((c, i) => `<label class="wc-c"><input type="color" value="${c}" oninput="wallSet(${i},this.value)" onchange="save()">
      <span>${i < 4 ? t("wc_c") + " " + (i + 1) : t("wc_base")}</span></label>`).join("")}</div></div>`);
};
function wallCustom() {
  if (S.wallpaper !== "custom") { WALL_EDIT = true; return setS("wallpaper", "custom"); }
  WALL_EDIT = !WALL_EDIT; buildSettings();
}
function wallSet(i, c) {
  S.customWall[dark() ? 0 : 1][i] = c;
  applyAppearance();
  const sw = $("sheet").querySelector(".swatch.custom"), w = S.customWall[dark() ? 0 : 1];
  if (sw) sw.style.background = `linear-gradient(135deg,${w[0]},${w[1]} 45%,${w[2]})`;
}
function wallFrom(k) {
  const d = dark() ? 0 : 1;
  S.customWall[d] = [...WALLPAPERS[k][d]];
  save(); applyAppearance(); buildSettings();
}
document.head.insertAdjacentHTML("beforeend", `<style>
.swatch.custom { display: grid; place-items: center; color: #fff; }
.swatch.custom svg { width: 16px; height: 16px; filter: drop-shadow(0 1px 2px rgba(0,0,0,.5)); }
.wc { padding: 10px 12px 12px; border-top: 1px solid var(--sep); }
.wc-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 12.5px; }
.wc-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
.wc-c { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11px; color: var(--text2); cursor: pointer; }
.wc-c input { width: 100%; height: 34px; border: none; border-radius: 9px; padding: 0; background: none; cursor: pointer; box-shadow: 0 0 0 1px var(--sep); }
.wc-c input::-webkit-color-swatch-wrapper { padding: 0; }
.wc-c input::-webkit-color-swatch { border: none; border-radius: 9px; }
</style>`);

// ======================= Settings: redraw without jumping back to the top (v4.19) =======================
const _buildSettingsKeep = buildSettings;
buildSettings = function () {
  const body = $("sheet").querySelector(".sheet-body"), key = settingsView + "|" + SET_TAB;
  const top = body && buildSettings.key === key ? body.scrollTop : 0;
  _buildSettingsKeep();
  buildSettings.key = key;
  const nb = $("sheet").querySelector(".sheet-body");
  if (nb && top) nb.scrollTop = top;
};
const _openSettingsKeep = openSettings;
openSettings = function (...a) { buildSettings.key = null; return _openSettingsKeep(...a); };  // Reopened = start at the top

// ======================= Tab bars wider than their box: horizontal scroll + faded edges + mouse wheel scrolls sideways (v0.1) =======================
const HSCROLL = ".search-head > .segmented, .toolbar > .segmented, .set-tabs .segmented, .emk-tabs";
function hscrollMark() {
  document.querySelectorAll(HSCROLL).forEach(el => {
    const over = el.scrollWidth > el.clientWidth + 1;
    el.classList.toggle("hs", over);
    el.classList.toggle("hs-l", over && el.scrollLeft > 2);
    el.classList.toggle("hs-r", over && el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
    if (over && !el._hs) {  // First time: scroll the selected tab into view
      el._hs = true;
      const on = el.querySelector("button.on");
      if (on) el.scrollLeft = on.offsetLeft - el.clientWidth / 2 + on.offsetWidth / 2;
    }
  });
}
new MutationObserver(() => requestAnimationFrame(hscrollMark)).observe(document.body, { childList: true, subtree: true });
addEventListener("resize", hscrollMark);
document.addEventListener("scroll", e => { if (e.target.matches?.(HSCROLL)) hscrollMark(); }, true);
document.addEventListener("wheel", e => {
  const el = e.target.closest?.(HSCROLL);
  if (!el || !el.classList.contains("hs") || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
  e.preventDefault();
  el.scrollLeft += e.deltaY;
}, { passive: false });
document.head.insertAdjacentHTML("beforeend", `<style>
.search-head > .segmented, .toolbar > .segmented, .set-tabs .segmented { min-width: 0; flex-shrink: 1; overflow-x: auto; scrollbar-width: none; }
.search-head > .segmented::-webkit-scrollbar, .toolbar > .segmented::-webkit-scrollbar, .set-tabs .segmented::-webkit-scrollbar { display: none; }
.search-head > .segmented > button, .toolbar > .segmented > button { flex: 0 0 auto; white-space: nowrap; }
.segmented.hs.hs-r { -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 36px), transparent); mask-image: linear-gradient(90deg, #000 calc(100% - 36px), transparent); }
.segmented.hs.hs-l { -webkit-mask-image: linear-gradient(90deg, transparent, #000 36px); mask-image: linear-gradient(90deg, transparent, #000 36px); }
.segmented.hs.hs-l.hs-r { -webkit-mask-image: linear-gradient(90deg, transparent, #000 36px, #000 calc(100% - 36px), transparent); mask-image: linear-gradient(90deg, transparent, #000 36px, #000 calc(100% - 36px), transparent); }
.search-head > .btn { flex-shrink: 0; }
</style>`);

// ======================= Require sign-in before use (v0.1.1) =======================
// The lock screen covers the whole app until login succeeds — reuses the login form (buildLogin / doLogin / doVerify) but renders into the lock screen
tx({
  gate_title: ["เข้าสู่ระบบ VRChat", "Sign in to VRChat", "VRChat にサインイン"],
  gate_sub: ["ต้องเข้าสู่ระบบก่อนจึงจะใช้งานโปรแกรมได้", "Sign in to start using the app", "アプリを使うにはサインインしてください"],
  gate_checking: ["กำลังตรวจสอบการเข้าสู่ระบบ…", "Checking your session…", "セッションを確認中…"],
  gate_back: ["เปลี่ยนบัญชี", "Use another account", "別のアカウント"],
});
document.body.insertAdjacentHTML("beforeend", `<div class="gate show" id="gate">
  <div class="gate-bar pywebview-drag-region">
    <button class="tl close" onclick="api('close')">${icon("x")}</button>
    <button class="tl min" onclick="api('minimize')">${icon("minus")}</button>
    <button class="tl max" onclick="api('zoom')">${icon("plus")}</button>
    <label class="gate-lang" title="Language">${icon("languages")}<select class="fsel" id="gateLang" onchange="gateSetLang(this.value)">
      ${Object.entries(LANGS).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></label>
  </div>
  <div class="gate-card glass" id="gateCard"></div></div>`);
let GATE = true;
function gateHead() {
  return `<div class="gate-icon">${LOGO_SVG}</div><h1>${t("gate_title")}</h1><p>${t("gate_sub")}</p>`;
}
function updateGate() {
  const on = !(authKnown && AUTH.loggedIn), fresh = on && !GATE;  // fresh = just signed out, start the form over
  if (on !== GATE || on) {
    GATE = on;
    if (fresh) $("gateCard").innerHTML = "";
    $("gate").classList.toggle("show", on);
    if (!on) { $("gateCard").innerHTML = ""; return; }  // Clear the form (including the password) from the page once signed in
    if (!authKnown) { $("gateCard").innerHTML = gateHead() + `<div class="gate-wait"><span class="spin-dot"></span>${t("gate_checking")}</div>`; return; }
    if (settingsOpen) closeSettings();
    closeProfile?.(); closeX?.(); closeEmk?.();
    if (!$("gateCard").querySelector("form")) { settingsView = "login"; login = {}; buildLogin(); }
  }
}
// Render the login form into the lock screen while it's open
const _buildLoginG = buildLogin;
buildLogin = function () {
  if (!GATE) return _buildLoginG();
  const keep = $("sheet").innerHTML;
  _buildLoginG();
  const card = $("sheet").querySelector(".card");
  $("sheet").innerHTML = keep;
  $("gateCard").innerHTML = gateHead() + card.outerHTML
    + (settingsView === "2fa" ? `<a href="#" class="gate-link" onclick="settingsView='login';login={};buildLogin();return false">${t("gate_back")}</a>` : "");
  setTimeout(() => $(settingsView === "2fa" ? "fCode" : "fUser")?.focus(), 50);
};
// Language picker on the lock screen (first run starts in English) — redraw the form but keep what was typed
function gateSetLang(v) {
  const keep = ["fUser", "fPass", "fCode"].map(id => [id, $(id)?.value]);
  S.lang = v; save(); applyLang();
  if (!authKnown) { GATE = false; updateGate(); }
  else if (GATE) buildLogin();
  for (const [id, val] of keep) if (val && $(id)) $(id).value = val;
}
const _applyLangG = applyLang;
applyLang = function () { _applyLangG(); if ($("gateLang")) $("gateLang").value = S.lang; };
// After login, doLogin/doVerify call buildSettings — don't open settings, just unlock (onAuth follows)
const _onAuthG = window.onAuth;
window.onAuth = a => { _onAuthG(a); updateGate(); };
updateGate();

document.head.insertAdjacentHTML("beforeend", `<style>
.gate { position: fixed; top: 0; left: 0; width: calc(100vw / var(--z, 1)); height: calc(100vh / var(--z, 1)); z-index: 45; display: none;
        place-items: center; background: color-mix(in srgb, var(--wall-base) 55%, transparent); backdrop-filter: blur(30px) saturate(160%); }
.gate.show { display: grid; }
.gate-bar { position: absolute; top: 0; left: 0; right: 0; height: 44px; display: flex; gap: 8px; padding: 16px 18px; }
.gate-bar:hover .tl svg { opacity: 1; }
.gate-lang { margin-left: auto; display: flex; align-items: center; gap: 6px; color: var(--text2); margin-top: -6px; }
.gate-lang svg { width: 16px; height: 16px; }
.gate-lang .fsel { background: color-mix(in srgb, var(--track) 80%, transparent); }
.gate-card { width: min(380px, calc(100% - 40px)); padding: 28px 24px 22px; border-radius: 26px; text-align: center; }
.gate-card h1 { margin: 6px 0 4px; font-size: 20px; }
.gate-card > p { margin: 0 0 16px; color: var(--text2); font-size: 12.5px; }
.gate-card .card { text-align: left; }
.gate-icon { width: 60px; height: 60px; margin: 0 auto 8px; border-radius: 16px; display: grid; place-items: center; color: #fff;
             background: linear-gradient(135deg, var(--accent), var(--purple)); }
.gate-icon svg { width: 32px; height: 32px; }
.gate-wait { display: flex; align-items: center; justify-content: center; gap: 10px; color: var(--text2); padding: 14px 0 6px; }
.gate-wait .spin-dot { position: static; margin: 0; width: 16px; height: 16px; border: 2px solid var(--track); border-top-color: var(--accent);
                       border-radius: 50%; animation: fxspin 1s linear infinite; }
.gate-link { display: inline-block; margin-top: 12px; font-size: 12px; color: var(--accent); }
#grip { z-index: 60; }
@keyframes fxspin { to { transform: rotate(360deg); } }
</style>`);

// ======================= App language change: redraw the chat page (its frame is built once) keeping any unsent text =======================
const _applyLangChat = applyLang;
applyLang = function () {
  _applyLangChat();
  if (!$("chatList")) return;
  const draft = $("chatIn")?.value || "";
  $("v_chat").innerHTML = "";
  renderChat(true);
  if (draft && $("chatIn")) { $("chatIn").value = draft; chatInput(true); }
};

// ======================= App updates (GitHub Releases) =======================
tx({
  upd_sec: ["อัปเดต", "Updates", "アップデート"],
  upd_check: ["ตรวจหาอัปเดต", "Check for updates", "アップデートを確認"],
  upd_checkBtn: ["ตรวจเลย", "Check now", "今すぐ確認"],
  upd_checking: ["กำลังตรวจ…", "Checking…", "確認中…"],
  upd_auto: ["ตรวจหาอัปเดตอัตโนมัติ", "Check for updates automatically", "自動でアップデートを確認"],
  upd_autoHint: ["ตรวจทุกครั้งที่เปิดแอป", "Checks each time the app starts", "アプリ起動時に確認"],
  upd_latest: ["เป็นเวอร์ชันล่าสุดแล้ว", "You're up to date", "最新バージョンです"],
  upd_newer: [v => `มีเวอร์ชันใหม่ ${v}`, v => `Version ${v} is available`, v => `新しいバージョン ${v} があります`],
  upd_error: ["ตรวจหาอัปเดตไม่ได้", "Couldn't check for updates", "アップデートを確認できません"],
  upd_title: [v => `VRC Nook ${v} พร้อมแล้ว`, v => `VRC Nook ${v} is ready`, v => `VRC Nook ${v} が利用可能`],
  upd_current: [v => `เวอร์ชันที่ใช้อยู่ ${v}`, v => `You have ${v}`, v => `現在のバージョン ${v}`],
  upd_notes: ["มีอะไรใหม่", "What's new", "新機能"],
  upd_noNotes: ["ไม่มีรายละเอียด", "No release notes", "リリースノートはありません"],
  upd_now: ["อัปเดตเลย", "Update now", "今すぐアップデート"],
  upd_later: ["ไว้ทีหลัง", "Later", "後で"],
  upd_skip: ["ข้ามเวอร์ชันนี้", "Skip this version", "このバージョンをスキップ"],
  upd_page: ["เปิดหน้าดาวน์โหลด", "Open download page", "ダウンロードページを開く"],
  upd_manual: ["อัปเดตเองไม่ได้ในรุ่นนี้ — ดาวน์โหลดจากหน้า GitHub แทน", "Can't update automatically here — download it from GitHub instead", "自動更新できません — GitHub からダウンロードしてください"],
  upd_downloading: [p => `กำลังดาวน์โหลด… ${p}%`, p => `Downloading… ${p}%`, p => `ダウンロード中… ${p}%`],
  upd_restarting: ["ตรวจไฟล์ผ่านแล้ว กำลังเปิดแอปใหม่…", "Verified — restarting…", "検証完了 — 再起動中…"],
  upd_fail: ["อัปเดตไม่สำเร็จ ลองใหม่อีกครั้ง", "Update failed — please try again", "アップデートに失敗しました"],
});
// Korean / Russian / Vietnamese / Chinese — i18n_extra.js loads later and recreates I18N.xx wholesale, so these are merged at the end of that file
const UPD_I18N = {
  ko: { upd_sec: "업데이트", upd_check: "업데이트 확인", upd_checkBtn: "지금 확인", upd_checking: "확인 중…",
    upd_auto: "자동으로 업데이트 확인", upd_autoHint: "앱을 시작할 때마다 확인", upd_latest: "최신 버전입니다", upd_newer: v => `새 버전 ${v} 사용 가능`,
    upd_error: "업데이트를 확인할 수 없습니다", upd_title: v => `VRC Nook ${v} 준비 완료`, upd_current: v => `현재 버전 ${v}`, upd_notes: "새로운 기능",
    upd_noNotes: "릴리스 노트 없음", upd_now: "지금 업데이트", upd_later: "나중에", upd_skip: "이 버전 건너뛰기", upd_page: "다운로드 페이지 열기",
    upd_manual: "여기서는 자동 업데이트할 수 없습니다 — GitHub에서 받으세요", upd_downloading: p => `다운로드 중… ${p}%`,
    upd_restarting: "확인 완료 — 다시 시작하는 중…", upd_fail: "업데이트 실패 — 다시 시도하세요" },
  ru: { upd_sec: "Обновления", upd_check: "Проверить обновления", upd_checkBtn: "Проверить", upd_checking: "Проверка…",
    upd_auto: "Проверять обновления автоматически", upd_autoHint: "При каждом запуске приложения", upd_latest: "У вас последняя версия",
    upd_newer: v => `Доступна версия ${v}`, upd_error: "Не удалось проверить обновления", upd_title: v => `VRC Nook ${v} готов`,
    upd_current: v => `Текущая версия ${v}`, upd_notes: "Что нового", upd_noNotes: "Нет описания", upd_now: "Обновить", upd_later: "Позже",
    upd_skip: "Пропустить версию", upd_page: "Открыть страницу загрузки", upd_manual: "Автообновление здесь недоступно — скачайте с GitHub",
    upd_downloading: p => `Загрузка… ${p}%`, upd_restarting: "Проверено — перезапуск…", upd_fail: "Ошибка обновления — попробуйте ещё раз" },
  vi: { upd_sec: "Cập nhật", upd_check: "Kiểm tra cập nhật", upd_checkBtn: "Kiểm tra", upd_checking: "Đang kiểm tra…",
    upd_auto: "Tự động kiểm tra cập nhật", upd_autoHint: "Mỗi lần mở ứng dụng", upd_latest: "Bạn đang dùng bản mới nhất",
    upd_newer: v => `Đã có phiên bản ${v}`, upd_error: "Không thể kiểm tra cập nhật", upd_title: v => `VRC Nook ${v} đã sẵn sàng`,
    upd_current: v => `Phiên bản hiện tại ${v}`, upd_notes: "Có gì mới", upd_noNotes: "Không có ghi chú", upd_now: "Cập nhật ngay", upd_later: "Để sau",
    upd_skip: "Bỏ qua phiên bản này", upd_page: "Mở trang tải xuống", upd_manual: "Không thể tự cập nhật ở đây — hãy tải từ GitHub",
    upd_downloading: p => `Đang tải… ${p}%`, upd_restarting: "Đã xác minh — đang khởi động lại…", upd_fail: "Cập nhật thất bại — hãy thử lại" },
  zh: { upd_sec: "更新", upd_check: "检查更新", upd_checkBtn: "立即检查", upd_checking: "正在检查…",
    upd_auto: "自动检查更新", upd_autoHint: "每次启动应用时检查", upd_latest: "已是最新版本", upd_newer: v => `有新版本 ${v}`,
    upd_error: "无法检查更新", upd_title: v => `VRC Nook ${v} 已就绪`, upd_current: v => `当前版本 ${v}`, upd_notes: "更新内容",
    upd_noNotes: "没有更新说明", upd_now: "立即更新", upd_later: "稍后", upd_skip: "跳过此版本", upd_page: "打开下载页面",
    upd_manual: "此处无法自动更新 —— 请从 GitHub 下载", upd_downloading: p => `正在下载… ${p}%`, upd_restarting: "校验通过 —— 正在重启…",
    upd_fail: "更新失败 —— 请重试" },
};

const UPD = { checking: false, info: null, error: false, pct: null };
function updButton() {
  return UPD.checking ? `<button class="btn" disabled><i class="upd-spin"></i>${t("upd_checking")}</button>`
    : UPD.info?.newer ? `<button class="btn primary" onclick="updPrompt()">${icon("download")}${t("upd_now")}</button>`
    : `<button class="btn" onclick="updCheck(true)">${t("upd_checkBtn")}</button>`;
}
function updStatus() {
  if (UPD.error) return t("upd_error");
  if (UPD.info?.newer) return t("upd_newer", UPD.info.latest);
  return UPD.info ? t("upd_latest") : t("upd_current", VERSION);
}
async function updCheck(manual) {
  if (UPD.checking) return;
  UPD.checking = true; UPD.error = false;
  if (settingsOpen) buildSettings();
  const r = await api("update_check");
  UPD.checking = false;
  if (!r || r.error) { UPD.error = true; if (manual) toast(t("upd_error")); }
  else {
    UPD.info = r;
    if (r.newer && (manual || S.updSkip !== r.latest)) updPrompt();
    else if (manual) toast(t("upd_latest"));
  }
  if (settingsOpen) buildSettings();
}
function updPrompt() {
  const i = UPD.info;
  if (!i?.newer) return;
  openX(t("upd_title", i.latest), () => {
    const busy = UPD.pct != null;
    return `<div class="upd">
      <div class="upd-head"><div class="upd-logo">${LOGO_SVG}</div>
        <div><b>VRC Nook ${esc(i.latest)}</b><span>${t("upd_current", VERSION)}${i.size ? ` · ${(i.size / 1048576).toFixed(1)} MB` : ""}</span></div></div>
      <div class="upd-notes-t">${t("upd_notes")}</div>
      <div class="upd-notes">${esc(i.notes.trim()) || `<i>${t("upd_noNotes")}</i>`}</div>
      ${busy ? `<div class="upd-bar"><i style="width:${UPD.pct}%"></i></div>
        <div class="upd-prog">${UPD.pct >= 100 ? t("upd_restarting") : t("upd_downloading", UPD.pct)}</div>`
      : `${i.canSelf ? "" : `<div class="upd-prog">${t("upd_manual")}</div>`}
        <div class="upd-actions">
          <button class="btn" onclick="updSkip()">${t("upd_skip")}</button>
          <span class="grow"></span>
          <button class="btn" onclick="closeX()">${t("upd_later")}</button>
          ${i.canSelf ? `<button class="btn primary" onclick="updInstall()">${icon("download")}${t("upd_now")}</button>`
            : `<button class="btn primary" onclick="api('update_page')">${icon("external-link")}${t("upd_page")}</button>`}
        </div>`}
    </div>`;
  });
}
function updSkip() { S.updSkip = UPD.info?.latest; save(); closeX(); }
async function updInstall() {
  UPD.pct = 0; buildX();
  if (!await api("update_install")) { UPD.pct = null; toast(t("upd_fail")); buildX(); }
}
window.onUpdateProgress = p => { UPD.pct = p; if (X) buildX(); };
window.onUpdateFailed = () => { UPD.pct = null; toast(t("upd_fail")); if (X) buildX(); };
// Check on app start (wait for settings to load first)
(function updAuto() {
  if (!ready) return setTimeout(updAuto, 1000);
  if (S.autoUpdate !== false) setTimeout(() => updCheck(false), 4000);
})();

document.head.insertAdjacentHTML("beforeend", `<style>
.upd { display: grid; gap: 10px; }
.upd-head { display: flex; align-items: center; gap: 12px; }
.upd-head b { display: block; font-size: 15px; }
.upd-head span { color: var(--text2); font-size: 12px; }
.upd-logo { width: 48px; height: 48px; border-radius: 13px; display: grid; place-items: center; color: #fff; flex: none;
            background: linear-gradient(135deg, var(--accent), var(--purple)); }
.upd-logo svg { width: 28px; height: 28px; }
.upd-notes-t { font-weight: 600; font-size: 12px; color: var(--text2); margin-top: 4px; }
.upd-notes { white-space: pre-wrap; font-size: 12.5px; line-height: 1.55; max-height: 240px; overflow: auto; padding: 10px 12px;
             border-radius: 10px; background: var(--hover); }
.upd-bar { height: 6px; border-radius: 99px; background: var(--track); overflow: hidden; }
.upd-bar i { display: block; height: 100%; background: var(--accent); border-radius: 99px; transition: width .2s; }
.upd-prog { font-size: 12px; color: var(--text2); }
.upd-actions { display: flex; gap: 8px; align-items: center; margin-top: 4px; }
.upd-actions .btn, .srow .btn { display: inline-flex; align-items: center; gap: 6px; }
.upd-actions .btn svg, .srow .btn svg { width: 14px; height: 14px; }
.upd-spin { width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--track); border-top-color: var(--accent);
            animation: btnspin .8s linear infinite; display: inline-block; }
</style>`);
