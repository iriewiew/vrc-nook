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
  CI.sel = new Set(); CI.q = "";
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
      ${fRow(t("ci_me"), fCheck("ciMe", S.ciMe !== false), t("ci_meHint"))}
      <div class="ci-inv-head">${icon("send")}<span>${t("ci_invite")}</span><span class="grow"></span><span id="ciInvN" class="hint-inline"></span></div>
      <div id="ciInv"></div>
      <div class="form-actions" id="ciGo"></div>`;
  }, () => {
    const sync = () => { $("ciGroup").style.display = $("ciType").value === "group" ? "" : "none"; };
    $("ciType").onchange = sync;
    sync();
    ciInvUi(wid);
  });
}
// ---------- Friends to invite once the instance is made ----------
// Online friends first (favorites at the top), then the rest; tick as many as you like
const CI = { sel: new Set(), q: "", wid: "" };
function ciInvUi(wid, focus) {
  const el = $("ciInv");
  if (!el) return;
  if (wid) CI.wid = wid;
  const q = CI.q.trim().toLowerCase(), on = f => f.state === "online";
  const list = Object.values(FRIENDS).filter(f => !q || (f.displayName || "").toLowerCase().includes(q))
    .sort((a, b) => (+on(b) - +on(a)) || (+!!favRecord("friend", b.id) - +!!favRecord("friend", a.id)) || (a.displayName || "").localeCompare(b.displayName || ""))
    .slice(0, 150);
  const scroll = el.querySelector(".ci-list")?.scrollTop || 0;
  const chips = [...CI.sel].map(uid => `<span class="ci-chip">${esc(FRIENDS[uid]?.displayName || PROFILES[uid]?.displayName || uid)}<button onclick="ciPick('${esc(uid)}')">${icon("x")}</button></span>`).join("");
  el.innerHTML = `${chips ? `<div class="ci-chips">${chips}</div>` : ""}
    <input class="field" id="ciInvQ" placeholder="${escA(t("ci_find"))}" value="${escA(CI.q)}">
    <div class="ci-list">${list.map(f => lrow({ uid: f.id, name: (favRecord("friend", f.id) ? "★ " : "") + (f.displayName || PROFILES[f.id]?.displayName || f.id),
      sub: esc(on(f) ? locLabel(f.location, f.state) : t("ci_offline")), onclick: `ciPick('${esc(f.id)}')`, cls: CI.sel.has(f.id) ? "on" : "",
      acts: `<span class="ci-tick" onclick="ciPick('${esc(f.id)}')">${icon("check")}</span>` })).join("") || `<div class="hint-inline ci-none">${t("ci_noFriend")}</div>`}</div>`;
  fillSlots(el);
  el.querySelector(".ci-list").scrollTop = scroll;
  const inp = $("ciInvQ");
  inp.oninput = () => { CI.q = inp.value; ciInvUi(null, true); };
  if (focus) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  const n = CI.sel.size;
  $("ciInvN").textContent = n ? t("ci_invPicked", n) : t("ci_invNone");
  $("ciGo").innerHTML = btn(n ? t("ci_createInvite", n) : t("create"), `doCreateInstance('${CI.wid}')`, "primary", n ? "send" : "circle-plus");
}
function ciPick(uid) {
  if (!CI.sel.delete(uid)) CI.sel.add(uid);
  ciInvUi();
}
async function ciSendInvites(loc, uids) {
  toast(t("ci_inviting", uids.length));
  let ok = 0;
  for (const [i, uid] of uids.entries()) {
    if (i) await new Promise(r => setTimeout(r, 400));  // VRChat rate-limits invites
    if ((await vrc("inviteUser", { userId: uid, instanceId: loc })).ok !== undefined) ok++;
  }
  toast(ok === uids.length ? t("ci_invited", ok) : t("ci_invitedSome", ok, uids.length));
}
document.head.insertAdjacentHTML("beforeend", `<style>
.ci-inv-head { display: flex; align-items: center; gap: 8px; margin: 14px 2px 8px; font-weight: 600; font-size: 13px; }
.ci-inv-head svg { width: 15px; height: 15px; color: var(--accent); }
.ci-inv-head .grow { flex: 1; }
.ci-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.ci-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 4px 3px 10px; border-radius: 999px; font-size: 12px;
  background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--text); }
.ci-chip button { width: 18px; height: 18px; border: none; border-radius: 50%; background: none; color: var(--text2); display: grid; place-items: center; cursor: pointer; padding: 0; }
.ci-chip button:hover { background: var(--hover); color: var(--text); }
.ci-chip svg { width: 12px; height: 12px; }
#ciInvQ { margin-bottom: 8px; }
.ci-list { max-height: 240px; overflow-y: auto; padding-right: 2px; }
.ci-list .lrow { cursor: pointer; padding: 6px 10px; }
.ci-list .lrow.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--card)); }
.ci-tick { width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--sep); display: grid; place-items: center; color: transparent; cursor: pointer; }
.ci-tick svg { width: 14px; height: 14px; }
.lrow.on .ci-tick { background: var(--accent); border-color: var(--accent); color: #fff; }
.ci-none { padding: 10px 4px; }
</style>`);
tx({
  ci_invite: ["ชวนเพื่อน", "Invite friends", "フレンドを招待"],
  ci_invNone: ["ติ๊กเพื่อนที่จะชวน แล้วจะส่งคำเชิญให้หลังสร้างห้อง", "Tick friends to invite once it's made", "作成後に招待するフレンドを選択"],
  ci_invPicked: [n => `เลือกแล้ว ${n} คน`, n => `${n} picked`, n => `${n} 人を選択`],
  ci_createInvite: [n => `สร้างแล้วชวน ${n} คน`, n => `Create and invite ${n}`, n => `作成して ${n} 人を招待`],
  ci_me: ["เข้าห้องนี้เลย", "Go there now", "すぐに参加"],
  ci_meHint: ["ส่งคำเชิญให้ตัวเองหลังสร้างห้อง กดรับในเกมเพื่อเข้า", "Sends you an invite once it's made — accept it in game", "作成後に自分へ招待を送ります（ゲーム内で承諾）"],
  ci_find: ["ค้นหาเพื่อน", "Find a friend", "フレンドを検索"], ci_offline: ["ออฟไลน์", "Offline", "オフライン"], ci_noFriend: ["ไม่พบเพื่อน", "No friends found", "フレンドが見つかりません"],
  ci_inviting: [n => `กำลังส่งคำเชิญให้ ${n} คน…`, n => `Inviting ${n}…`, n => `${n} 人を招待中…`],
  ci_invited: [n => `ส่งคำเชิญให้ ${n} คนแล้ว`, n => `Invited ${n}`, n => `${n} 人を招待しました`],
  ci_invitedSome: [(ok, n) => `ส่งคำเชิญได้ ${ok} จาก ${n} คน`, (ok, n) => `Invited ${ok} of ${n}`, (ok, n) => `${n} 人中 ${ok} 人を招待しました`],
});
async function doCreateInstance(wid) {
  const type = fv("ciType");
  const body = { worldId: wid, type: type === "private+" ? "private" : type, region: fv("ciRegion") };
  if (type === "private+") body.canRequestInvite = true;
  if (type === "group") Object.assign(body, { ownerId: fv("ciGrp"), groupAccessType: fv("ciAccess"), queueEnabled: fv("ciQueue") });
  else if (type !== "public") body.ownerId = AUTH.id;
  if (fv("ciAge")) body.ageGate = true;
  if (fv("ciName")) body.displayName = fv("ciName");
  const me = fv("ciMe");
  if (me !== (S.ciMe !== false)) { S.ciMe = me; save(); }  // Remembered for next time
  const r = await vrcDo("createInstance", body, "ci_created");
  if (!r) return;
  const invite = [...CI.sel];
  closeX();
  const loc = r.location || `${wid}:${r.instanceId}`;
  WX[loc] = r;
  openWorld(wid, loc);
  if (me) await doInvite(loc);  // An invite to yourself: accept it in game to go there
  if (invite.length) ciSendInvites(loc, invite);
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
  a_vpBlocked: [p => `อวตารนี้จะถูกบล็อกโดยค่าเริ่มต้นเพราะ performance ต่ำ (${p}) คนอื่นจะเห็นอวตารสำรองของคุณแทน`,
    p => `This avatar will be blocked by default due to performance (${p}). Your fallback will be shown instead.`,
    p => `このアバターはパフォーマンスのため既定でブロックされます (${p})。代わりにフォールバックが表示されます。`],
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
    // Same warning VRChat shows: Very Poor avatars are blocked by default and others see your fallback instead
    const vp = x.analysis.filter(r => (r.performanceRating || r.perf || raw.performance?.[r.platform] || "").replace(/\s/g, "") === "VeryPoor")
      .map(r => PL[r.platform] || r.platform);
    const warn = vp.length ? `<div class="perf-warn">${icon("circle-alert")}<span>${t("a_vpBlocked", vp.join(", "))}</span></div>` : "";
    html += `<div class="pcard-section"><div class="lbl">${t("a_analysis")}</div>${warn}<div class="pstats">${x.analysis.map(r => {
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
const GX = { tab: "info", admin: "requests", gallery: null, memberQ: "", memberOff: 0, memberRole: "", reqBlocked: false, auditType: "", auditOff: 0,
  memberN: 50, auditN: 50, auditQ: "", auditUser: "", auditBy: "targetIds", sel: [], selRoles: [], note: "", selInput: "" };
openGroup = async function (g) {
  profileOpen = null; worldOpen = null; avatarOpen = null;
  groupOpen = { ...g };
  Object.assign(GX, { tab: "info", admin: "requests", gallery: null, memberQ: "", memberOff: 0, memberRole: "", reqBlocked: false, auditType: "", auditOff: 0, newIcon: null, newBanner: null });
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
// Sections of the Manage tab and the permission each one needs
const G_ADMIN = [["requests", "user-plus", "group-members-manage"], ["invites", "send", "group-invites-manage"], ["bans", "ban", "group-bans-manage"],
  ["bulk", "users", ["group-members-manage", "group-members-remove", "group-bans-manage", "group-roles-assign"]], ["roles", "user-cog", "group-roles-manage"], ["audit", "scroll-text", "group-audit-view"], ["edit", "pencil", "group-data-manage"]];
// "Can manage" = at least one Manage-tab section is available (same rule as the tab itself)
const G_MANAGE_PERMS = G_ADMIN.flatMap(x => x[2]);
const gAdminTabs = () => G_ADMIN.filter(([, , perm]) => gCan(...[perm].flat()));
const gIsAdmin = () => gAdminTabs().length > 0;
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
    ? loadOp("g_mem", "searchGroupMembers", { groupId: gid, query: GX.memberQ, n: GX.memberN, offset: GX.memberOff }, true)
    : loadOp("g_mem", "getGroupMembers", { groupId: gid, n: GX.memberN, offset: GX.memberOff, sort: "joinedAt:desc", ...(GX.memberRole ? { roleId: GX.memberRole } : {}) }, force);
  else if (tab === "gallery" && GX.gallery) loadOp("g_gal_" + GX.gallery, "getGroupGalleryImages", { groupId: gid, groupGalleryId: GX.gallery, n: 60 }, force);
  else if (tab === "events") loadOp("g_evt", "getGroupCalendarEvents", { groupId: gid, n: 30 }, force);
  else if (tab === "admin") {
    const a = GX.admin;
    if (a === "requests") loadOp("g_req", "getGroupRequests", { groupId: gid, n: 100, ...(GX.reqBlocked ? { blocked: true } : {}) }, force);
    else if (a === "invites") loadOp("g_inv", "getGroupInvites", { groupId: gid, n: 100 }, force);
    else if (a === "bans") loadOp("g_bans", "getGroupBans", { groupId: gid, n: 100 }, force);
    else if (a === "audit") {
      loadOp("g_auditTypes", "getGroupAuditLogEntryTypes", { groupId: gid });
      loadOp("g_audit", "getGroupAuditLogs", { groupId: gid, ...gAuditQuery(), n: GX.auditN, offset: GX.auditOff }, force);
    }
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
    action = `<span class="gpill member">${icon("circle-check")}${t("joined")}</span>`;
    menu.push({ ic: "log-out", label: t("leaveGroup"), fn: "leaveGroup()", danger: true });
  } else if (st === "requested") action = btn(t("g_cancelReq"), "gCancelRequest()", "", "circle-x");
  else if (st === "invited") {
    action = btn(t("g_acceptInvite"), "joinGroup()", "primary", "circle-check") + btn(t("g_decline"), "gDecline(false)", "", "circle-x");
    menu.push({ ic: "ban", label: t("g_declineBlock"), fn: "gDecline(true)", danger: true });
  } else if (st === "userblocked") action = `<span class="gpill">${icon("ban")}${t("g_blocked")}</span>`;
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
      </div>
      <div class="pact">${g.ownerId && g.ownerId === AUTH.id ? `<span class="gpill owner">${icon("crown")}${t("g_owner")}</span>`
        : gIsAdmin() ? `<span class="gpill admin">${icon("shield")}${t("g_manager")}</span>` : ""}${action}
        ${me.isRepresenting ? `<span class="gpill rep" title="${escA(t("g_represent"))}">${icon("star")}${t("g_repShort")}</span>` : ""}${menuBtn(menu)}</div>
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
    const canOpen = gCan("group-instance-open-create", "group-instance-plus-create", "group-instance-public-create");
    return (canOpen ? `<div class="toolbar">${btn(t("g_newInst"), "gNewInstance()", "primary sm", "circle-plus")}</div>` : "") + (stateHtml(c) || c.data.map(i => lrow({ thumb: imgUrl(i.world), name: i.world?.name || i.location,
      sub: `${esc(itypeLabel(parseLoc(i.location)))} · ${t("people2", i.memberCount ?? "?")}`, onclick: `openWorld('${esc(i.world?.id || parseLoc(i.location).wid)}','${esc(i.location)}')`,
      acts: `<button class="mini-btn" title="${t("join")}" onclick="doLaunch('${esc(i.location)}')">${icon("rocket")}</button>
             <button class="mini-btn" title="${t("inviteMe")}" onclick="doInvite('${esc(i.location)}')">${icon("send")}</button>` })).join(""));
  }
  if (tab === "members") {
    const c = CACHE.g_mem, roles = g.roles || [];
    const canKick = gCan("group-members-remove"), canBan = gCan("group-bans-manage"), canRole = gCan("group-roles-assign");
    return `<div class="toolbar"><input class="field grow" id="gmq" placeholder="${t("searchPh")}" value="${escA(GX.memberQ)}"
        onkeydown="if(event.key==='Enter'){GX.memberQ=this.value.trim();GX.memberOff=0;buildGroup();gLoad(true)}">
        ${roles.length > 1 && !GX.memberQ ? `<select class="field" style="width:auto" onchange="GX.memberRole=this.value;GX.memberOff=0;buildGroup();gLoad(true)">
          <option value="">${t("g_allRoles")}</option>${roles.map(r => `<option value="${escA(r.id)}" ${GX.memberRole === r.id ? "selected" : ""}>${esc(r.name)}</option>`).join("")}</select>` : ""}</div>
      ${stateHtml(c) || c.data.map(m => lrow({ uid: m.userId, name: m.user?.displayName || m.userId,
        sub: `${t("g_joined", fmtIso(m.joinedAt || m.createdAt, true))}${(m.roleIds || []).length ? " · " + (m.roleIds || []).map(r => esc(roles.find(x => x.id === r)?.name || "")).filter(Boolean).join(", ") : ""}`,
        onclick: `showProfile('${esc(m.userId)}')`,
        acts: (canRole && roles.length ? `<button class="mini-btn" title="${t("g_roles")}" onclick="gRolesDialog('${esc(m.userId)}')">${icon("user-cog")}</button>` : "")
          + (canKick && m.userId !== AUTH.id ? `<button class="mini-btn" title="${t("g_kick")}" onclick="confirmBtn(this,()=>gDo('kickGroupMember',{userId:'${esc(m.userId)}'},'done','g_mem'))">${icon("door-open")}</button>` : "")
          + (canBan && m.userId !== AUTH.id ? `<button class="mini-btn" title="${t("g_ban")}" onclick="confirmBtn(this,()=>gDo('banGroupMember',{userId:'${esc(m.userId)}'},'done','g_mem'))">${icon("ban")}</button>` : "") })).join("")}
      ${gMemberPager(c?.data?.length || 0, !GX.memberQ && !GX.memberRole ? g.memberCount : null)}`;
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
  const g = groupOpen, allowed = gAdminTabs();
  if (!allowed.some(x => x[0] === GX.admin)) GX.admin = allowed[0]?.[0];
  const a = GX.admin;
  const TITLE = { requests: "g_requests", invites: "g_invites", bans: "g_bans", bulk: "g_bulk", roles: "g_roles", audit: "g_audit", edit: "g_edit" };
  let inner = "", head = "";
  if (a === "requests") {
    const c = CACHE.g_req;
    head = `<div class="segmented sm">${[["open", "g_reqPending"], ["blocked", "g_blockedReq"]].map(([k, l]) =>
      `<button class="${(GX.reqBlocked ? "blocked" : "open") === k ? "on" : ""}" onclick="gReqTab('${k}')">${t(l)}</button>`).join("")}</div>`;
    inner = (stateHtml(c) || c.data.map(m => lrow({ uid: m.userId, name: m.user?.displayName || m.userId, sub: fmtIso(m.createdAt), onclick: `showProfile('${esc(m.userId)}')`,
      acts: btn(t("g_accept"), `gDo('respondGroupJoinRequest',{userId:'${esc(m.userId)}',action:'accept'},'done','g_req')`, "primary sm")
        + btn(t("g_reject"), `gDo('respondGroupJoinRequest',{userId:'${esc(m.userId)}',action:'reject'},'done','g_req')`, "sm")
        + (GX.reqBlocked ? "" : `<button class="btn sm danger" onclick="confirmBtn(this,()=>gDo('respondGroupJoinRequest',{userId:'${esc(m.userId)}',action:'reject',block:true},'done','g_req'))">${t("g_rejectBlock")}</button>`) })).join(""));
  } else if (a === "invites") {
    const c = CACHE.g_inv;
    head = btn(t("g_inviteUser"), "gUserPicker('invite')", "sm", "search") + btn(t("g_inviteFriend"), "gInviteDialog()", "primary sm", "user-plus");
    inner = (stateHtml(c) || c.data.map(m => lrow({ uid: m.userId, name: m.user?.displayName || m.userId, sub: fmtIso(m.createdAt), onclick: `showProfile('${esc(m.userId)}')`,
        acts: `<button class="mini-btn" title="${t("remove")}" onclick="gDo('deleteGroupInvite',{userId:'${esc(m.userId)}'},'done','g_inv')">${icon("x")}</button>` })).join(""));
  } else if (a === "bans") {
    const c = CACHE.g_bans;
    head = btn(t("g_banUser"), "gUserPicker('ban')", "sm danger", "ban");
    inner = (stateHtml(c) || c.data.map(m => lrow({ uid: m.userId, name: m.user?.displayName || m.userId, sub: fmtIso(m.bannedAt || m.createdAt), onclick: `showProfile('${esc(m.userId)}')`,
      acts: btn(t("g_unban"), `gDo('unbanGroupMember',{userId:'${esc(m.userId)}'},'done','g_bans')`, "sm") })).join(""));
  } else if (a === "roles") {
    head = btn(t("g_newRole"), "gRoleDialog()", "primary sm", "circle-plus");
    inner = (g.roles || []).sort((x, y) => (x.order ?? 0) - (y.order ?? 0)).map((r, i, all) => lrow({ thumb: "", name: r.name,
        sub: `${esc(r.description || "")}${r.permissions?.length ? ` · ${r.permissions.length} ${t("g_perms")}` : ""}`,
        acts: (r.isManagementRole || r.defaultRole ? "" : (i > 0 && !all[i - 1].isManagementRole ? `<button class="mini-btn" title="${t("g_up")}" onclick="gMoveRole('${esc(r.id)}',-1)">${icon("arrow-up")}</button>` : "")
            + (i < all.length - 1 && !all[i + 1].defaultRole ? `<button class="mini-btn" title="${t("g_down")}" onclick="gMoveRole('${esc(r.id)}',1)">${icon("arrow-down")}</button>` : ""))
          + btn(t("edit"), `gRoleDialog('${esc(r.id)}')`, "sm") + (r.isManagementRole || r.defaultRole ? ""
          : `<button class="mini-btn" title="${t("del")}" onclick="confirmBtn(this,()=>gDo('deleteGroupRole',{groupRoleId:'${esc(r.id)}'},'deleted',null,true))">${icon("trash-2")}</button>`) })
        .replace('<span class="lthumb" ></span>', "")).join("");
  } else if (a === "audit") {
    [head, inner] = gAuditHtml();
  } else if (a === "bulk") {
    inner = gBulkHtml();
  } else if (a === "edit") {
    const ic = GX.newIcon?.url || g.iconUrl, bn = GX.newBanner?.url || g.bannerUrl;
    inner = `${fRow(t("name"), fInput("geName", g.name))}
      ${fRow(t("g_icon"), `<div class="g-imgpick"><div class="gicon" ${thumbAttr(ic)}></div>${btn(t("g_pickImage"), "gPickImage('icon')", "sm", "image")}</div>`, t("g_pickHint"))}
      ${fRow(t("g_banner"), `<div class="g-imgpick"><div class="g-banner" ${thumbAttr(bn)}></div>${btn(t("g_pickImage"), "gPickImage('banner')", "sm", "image")}</div>`)}
      ${fRow(t("desc"), fArea("geDesc", g.description, 4))}
      ${fRow(t("g_rules"), fArea("geRules", g.rules, 4))}
      ${fRow(t("g_links"), fArea("geLinks", (g.links || []).join("\n"), 3), "1 / line")}
      ${fRow(t("languages"), langPicker("geLangs", g.languages || [], 0))}
      ${fRow(t("g_joinState"), fSelect("geJoin", { open: t("g_js_open"), request: t("g_js_request"), invite: t("g_js_invite"), closed: t("g_js_closed") }, g.joinState))}
      ${fRow(t("g_privacy"), fSelect("gePriv", { default: t("g_pv_default"), private: t("g_pv_private") }, g.privacy || "default"))}
      <div class="form-actions">${btn(t("save"), "gSaveEdit()", "primary", "save")}</div>
      ${g.ownerId && g.ownerId === AUTH.id ? `<div class="pcard-section g-danger"><div class="lbl">${t("g_danger")}</div>
        ${fRow(t("g_delete"), fInput("geDelName", "", `placeholder="${escA(g.name || "")}"`), t("g_deleteHint"))}
        <div class="form-actions"><button class="btn danger" onclick="gDeleteGroup()">${icon("trash-2")}${t("g_delete")}</button></div></div>` : ""}`;
  }
  if (!a) return `<div class="empty-state" style="height:120px">${t("g_noAdmin")}</div>`;
  const nav = allowed.map(([k, ic]) => `<button class="${k === a ? "on" : ""}" onclick="gAdminTab('${k}')">${icon(ic)}<span>${t(TITLE[k])}</span></button>`).join("");
  return `<div class="gadm"><nav class="gadm-nav">${nav}</nav>
    <div class="gadm-main"><div class="gadm-head"><h4>${t(TITLE[a])}</h4><span class="grow"></span>${head}</div>${inner}</div></div>`;
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
  const body = { name: fv("geName") || groupOpen.name, description: fv("geDesc"), rules: fv("geRules"), joinState: fv("geJoin"), privacy: fv("gePriv"),
    ...(GX.newIcon ? { iconId: GX.newIcon.id } : {}), ...(GX.newBanner ? { bannerId: GX.newBanner.id } : {}),
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
  $("gtabs").innerHTML = GRP.results ? "" : tabsHtml({ mine: t("gt_mine"), owned: t("gt_owned"), invited: t("gt_invited"), requested: t("gt_requested"),
    blocked: t("gt_blocked"), instances: t("gt_instances") }, GT.tab, "gtSet");
  const res = $("gres");
  if (GRP.results || GT.tab === "mine" || GT.tab === "owned") {
    if (!GRP.mine && !GRP.loading) loadGroups();
    const owned = !GRP.results && GT.tab === "owned";
    if (owned && !GRP.perms) gLoadPerms();
    const match = g => !query || g.name?.toLowerCase().includes(query);
    const list = GRP.results ?? (GRP.mine || []).filter(g => match(g) && (!owned || g.ownerId === AUTH.id));
    res.innerHTML = `<div class="sec-head">${t(GRP.results ? "g_results" : owned ? "gt_owned" : "g_mine")} <span class="n">${list.length}</span>
      ${owned ? `<span class="grow"></span>${btn(t("g_create"), "gCreateDialog()", "primary sm", "circle-plus")}` : ""}</div>`;
    if (owned) {
      const managed = (GRP.mine || []).filter(g => match(g) && g.ownerId !== AUTH.id && gCanManage(GRP.perms?.[g.id]));
      if (GRP.loading) return res.insertAdjacentHTML("beforeend", `<div class="empty-state" style="height:160px">${t("loading")}</div>`);
      const grid = cls => { const d = document.createElement("div"); d.className = "wgrid" + (cls ? " " + cls : ""); return d; };
      const pa = paged("groups:owned", list);
      const a = grid(); pa.items.forEach(g => a.appendChild(groupCard(g)));
      if (list.length) { res.appendChild(a); res.insertAdjacentHTML("beforeend", pa.bar); }
      else res.insertAdjacentHTML("beforeend", `<div class="empty-state" style="height:100px">${t("noResults")}</div>`);
      res.insertAdjacentHTML("beforeend", `<div class="sec-head" style="margin-top:18px">${t("g_canManage")} <span class="n">${GRP.perms ? managed.length : "…"}</span></div>`);
      if (!GRP.perms) return res.insertAdjacentHTML("beforeend", `<div class="empty-state" style="height:100px">${t("loading")}</div>`);
      if (!managed.length) return res.insertAdjacentHTML("beforeend", `<div class="empty-state" style="height:100px">${t("noResults")}</div>`);
      const pb = paged("groups:managed", managed);
      const b = grid(); pb.items.forEach(g => b.appendChild(groupCard(g)));
      res.appendChild(b);
      return res.insertAdjacentHTML("beforeend", pb.bar);
    }
    if (GRP.loading) return res.insertAdjacentHTML("beforeend", `<div class="empty-state" style="height:160px">${t("loading")}</div>`);
    if (!list.length) return res.insertAdjacentHTML("beforeend", `<div class="empty-state" style="height:160px">${t("noResults")}</div>`);
    const pg = paged(GRP.results ? "groups:results" : "groups:mine", list);
    const grid = document.createElement("div");
    grid.className = "wgrid";
    pg.items.forEach(g => grid.appendChild(groupCard(g)));
    res.appendChild(grid);
    return res.insertAdjacentHTML("beforeend", pg.bar);
  }
  const ops = { invited: "getInvitedGroups", requested: "getUserGroupRequests", blocked: "getBlockedGroups", instances: "getUserGroupInstances" };
  const c = CACHE["ug_" + GT.tab];
  if (!c) loadOp("ug_" + GT.tab, ops[GT.tab]);
  if (GT.tab === "instances") {
    const list = c?.data?.instances;
    const name = gid => (GRP.mine || []).find(g => g.id === gid)?.name || "";
    const pg = paged("groups:instances", list || []);
    res.innerHTML = stateHtml(c && { ...c, data: list }, "noResults", 160) || pg.items.map(i => lrow({ thumb: imgUrl(i.world), name: i.world?.name || i.location,
      sub: [esc(name(i.ownerId)), esc(itypeLabel(parseLoc(i.location))), `${i.n_users ?? i.userCount ?? "?"}/${i.capacity ?? "?"}`].filter(Boolean).join(" · "),
      onclick: `openWorld('${esc(i.worldId || i.world?.id)}','${esc(i.location)}')`,
      acts: `<button class="mini-btn" title="${t("join")}" onclick="doLaunch('${esc(i.location)}')">${icon("rocket")}</button>
             <button class="mini-btn" title="${t("inviteMe")}" onclick="doInvite('${esc(i.location)}')">${icon("send")}</button>` })).join("") + pg.bar;
    return;
  }
  res.innerHTML = stateHtml(c, "noResults", 160);
  if (!res.innerHTML) {
    const pg = paged("groups:" + GT.tab, c.data);
    const grid = document.createElement("div");
    grid.className = "wgrid";
    pg.items.forEach(g => grid.appendChild(groupCard({ ...g, id: g.groupId || g.id, membershipStatus: g.myMember?.membershipStatus || g.membershipStatus })));
    res.appendChild(grid);
    res.insertAdjacentHTML("beforeend", pg.bar);
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
    const pg = paged("events:jams", c?.data || []);
    el.innerHTML = head + (stateHtml(c, "noResults", 160) || pg.items.map(j => lrow({ thumb: "", name: j.title,
      sub: `${esc(j.state || "")} · ${fmtIso(j.stateChangeDates?.submissionsOpened, true)} – ${fmtIso(j.stateChangeDates?.closed, true)}`, onclick: `openJam('${esc(j.id)}')` })
      .replace('<span class="lthumb" ></span>', "")).join("") + pg.bar);
    return;
  }
  const list = (c?.data?.results || c?.data || []).filter(e => !query || (e.title || "").toLowerCase().includes(query));
  const pg = paged("events:" + EV.tab, list);
  el.innerHTML = head + (stateHtml(c && { ...c, data: list }, "noResults", 160) || `<div class="wgrid">${pg.items.map(eventCard).join("")}</div>${pg.bar}`);
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
  const pg1 = paged("notifs:v1", [...NOTIFS].sort((a, b) => (b.t || "").localeCompare(a.t || "")));
  pg1.items.forEach(n => el.appendChild(notifCard(n)));
  el.insertAdjacentHTML("beforeend", pg1.bar);
  const v2 = N2.list || [];
  el.insertAdjacentHTML("beforeend", `<div class="sec-head" style="margin-top:16px">${t("n_v2")} <span class="n">${v2.length}</span>
    ${v2.length ? `<button class="btn" style="padding:3px 12px" onclick="confirmBtn(this,()=>n2DeleteAll())">${t("n_clearAll")}</button>` : ""}</div>`);
  if (N2.loading && !N2.list) el.insertAdjacentHTML("beforeend", `<div class="empty-state" style="height:80px">${t("loading")}</div>`);
  else if (!v2.length) el.insertAdjacentHTML("beforeend", `<div class="empty-state" style="height:80px">${t("noNotifs")}</div>`);
  const pg2 = paged("notifs:v2", v2);
  pg2.items.forEach(n => el.appendChild(notif2Card(n)));
  el.insertAdjacentHTML("beforeend", pg2.bar);
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
  i_taken: ["ถ่ายเมื่อ", "Taken", "撮影日時"], i_download: ["ดาวน์โหลด", "Download", "ダウンロード"], i_shared: ["แชร์แล้ว", "Shared", "共有しました"], i_used: ["ใช้แล้ว", "Used", "使用しました"],
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
  const list = paged("inv:" + tab, invList(tab)).items;  // Same page the tiles were drawn from
  tiles.forEach((d, i) => {
    const x = list[i];
    if (!x) return;
    // Click an image = view it in the app (no need for the website)
    if (isFile) d.onclick = () => openFilePreview(tab, x.id);
    else d.onclick = () => (tab === "items" ? openItem : tab === "prints" ? openPrint : openProp)(x.id);
    if (tab === "icon") d.insertAdjacentHTML("beforeend", `<button class="mini-btn imenu" title="${t("i_useIcon")}" onclick="event.stopPropagation();useIcon('${esc(x.url)}')">${icon("circle-user-round")}</button>`);
    const photo = tab === "gallery" ? x.url : tab === "prints" ? x._p?.files?.image : "";
    if (photo) d.insertAdjacentHTML("beforeend", `<button class="mini-btn imenu" title="${t("i_download")}" onclick="event.stopPropagation();saveImage('${esc(photo)}','${esc(x.id)}')">${icon("download")}</button>`);
  });
}
// Full-size photo/print, saved where the user picks
async function saveImage(url, name) {
  toast(t("loading"));
  const r = await api("save_image", url, name);
  if (r?.ok) toast(t("ev_saved"));
  else if (r && "error" in r) apiError(r);
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
      ${tab === "gallery" ? btn(t("i_download"), `saveImage('${esc(x.url)}','${esc(x.id)}')`, "primary", "download") : ""}
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
      ${p.files?.image ? btn(t("i_download"), `saveImage('${esc(p.files.image)}','${esc(id)}')`, "", "download") : ""}
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
    const pg = paged("search:groups", searchRes.list);
    const grid = document.createElement("div");
    grid.className = "wgrid";
    pg.items.forEach(g => grid.appendChild(groupCard(g)));
    res.appendChild(grid);
    return res.insertAdjacentHTML("beforeend", pg.bar);
  }
  if (searchRes.kind === "events") {
    const pg = paged("search:events", searchRes.list);
    return res.innerHTML = searchRes.list.length ? `<div class="wgrid">${pg.items.map(eventCard).join("")}</div>${pg.bar}`
      : `<div class="empty-state" style="height:200px">${t("noResults")}</div>`;
  }
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
  const pg = paged("search:" + searchRes.kind, searchRes.ids);
  for (const id of pg.items) {
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
  res.insertAdjacentHTML("beforeend", pg.bar);
}
const _doSearch = doSearch;
doSearch = async function () {
  const q = $("sq")?.value.trim();
  if (!q) return;
  for (const k in PAGES) if (k.startsWith("search:")) delete PAGES[k];  // New results start on page 1
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
    el.innerHTML = head + favGroups("world").map((g, i) => {
      const list = (FAV.world || []).filter(w => w.favoriteGroup === g.name && match(w));
      const pg = paged("worlds:fav:" + i, list);
      return `<div class="sec-head">${esc(g.displayName || g.name)} <span class="n">${list.length}</span></div><div class="wgrid">${pg.items.map(worldTile).join("")}</div>${pg.bar}`;
    }).join("");
    return;
  }
  const c = CACHE["wt_" + tab];
  if (tab === "locations") {
    const locs = (c?.data || []).filter(Boolean);
    const wids = [...new Set(locs.map(l => parseLoc(l).wid).filter(Boolean))];
    if (wids.length && !WT.asked) { WT.asked = true; api("worlds", wids); }
    const pg = paged("worlds:locations", locs);
    el.innerHTML = head + (stateHtml(c && { ...c, data: locs }, "noResults", 160) || pg.items.map(l => {
      const L2 = parseLoc(l), w = WORLDS[L2.wid] || {};
      return `<div class="lrow" onclick="openWorld('${esc(L2.wid)}','${esc(l)}')"><span class="lthumb" ${w.img ? `style="background-image:url('${w.img}')"` : ""}></span>
        <div class="info"><div class="nm">${esc(w.name || L2.wid || l)}</div><div class="sub">#${esc(L2.name || "")} · ${esc(itypeLabel(L2))}</div></div>
        <div class="acts" onclick="event.stopPropagation()">${joinButtons(l)}</div></div>`;
    }).join("") + pg.bar);
    return;
  }
  const list = (c?.data || []).filter(match);
  const pg = paged("worlds:" + tab, list);
  el.innerHTML = head + (stateHtml(c && { ...c, data: list }, "noResults", 160) || `<div class="wgrid">${pg.items.map(worldTile).join("")}</div>${pg.bar}`);
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
  favGroups(type).forEach((g, gi) => {
    const head = `<div class="sec-head">${esc(g.displayName || g.name)} <span class="n">${favCount(type, g.name)}/${max[g.type] ?? ""}</span>
      <select class="field" style="width:auto;margin-left:auto;padding:3px 8px" onchange="favGroupUpdate('${g.type}','${esc(g.name)}',{visibility:this.value})">
        ${["private", "friends", "public"].map(v => `<option value="${v}" ${g.visibility === v ? "selected" : ""}>${t("f_vis_" + v)}</option>`).join("")}</select>
      <button class="mini-btn" title="${t("f_rename")}" onclick="favRenameDialog('${g.type}','${esc(g.name)}')">${icon("pencil")}</button>
      <button class="mini-btn" title="${t("f_clear")}" onclick="confirmBtn(this,()=>favClear('${g.type}','${esc(g.name)}'))">${icon("trash-2")}</button></div>`;
    if (type === "friend") {
      const ids = (FAV.friend || []).filter(f => f.tags?.includes(g.name)).map(f => f.favoriteId);
      const list = ids.map(id => FRIENDS[id] || { id, displayName: PROFILES[id]?.displayName || id, state: "offline" })
        .filter(f => !query || (f.displayName || "").toLowerCase().includes(query));
      const pg = paged(`fav:${type}:${gi}`, list);
      html += head + `<div class="fgrid" data-fav="${esc(g.name)}"></div>${pg.bar}`;
      FT.pending = FT.pending || {};
      FT.pending[g.name] = pg.items;
    } else {
      const list = (FAV[type] || []).filter(x => x.favoriteGroup === g.name && (!query || (x.name || "").toLowerCase().includes(query)));
      const pg = paged(`fav:${type}:${gi}`, list);
      html += head + `<div class="wgrid">${pg.items.map(x => type === "world" ? worldTile(x)
        : `<div class="wcard" onclick='openAvatar(${JSON.stringify(avatarSlim(x)).replace(/'/g, "&#39;")})'><div class="wimg" ${thumbAttr(imgUrl(x))}></div>
           <div class="winfo"><div class="nm">${esc(x.name)}</div><div class="sub">${esc(x.authorName || "")}</div></div></div>`).join("")}</div>${pg.bar}`;
    }
  });
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
      const pg = paged("safety:" + ty, list);
      html += `<div class="sec-head">${icon(MOD_ICON[ty] || "shield")} ${t("m_" + ty)} <span class="n">${list.length}</span></div>`
        + pg.items.map(m => lrow({ uid: m.targetUserId, name: m.targetDisplayName, sub: fmtIso(m.created), onclick: `showProfile('${esc(m.targetUserId)}')`,
          acts: btn(t("remove"), `modToggle('${esc(m.targetUserId)}','${ty}')`, "sm") })).join("") + pg.bar;
    }
    el.innerHTML = html === head ? head + `<div class="empty-state" style="height:160px">${t("noResults")}</div>` : html;
    fillSlots(el);
  } else if (SF.tab === "avatars") {
    const list = MODS.avatars || [];
    const pg = paged("safety:avatars", list);
    el.innerHTML = head + (list.length ? pg.items.map(m => lrow({ thumb: "", name: m.targetAvatarId, sub: fmtIso(m.created),
      onclick: `openAnything('${esc(m.targetAvatarId)}')`, acts: btn(t("remove"), `avatarBlockToggle('${esc(m.targetAvatarId)}')`, "sm") })
      .replace('<span class="lthumb" ></span>', "")).join("") + pg.bar : `<div class="empty-state" style="height:160px">${t("noResults")}</div>`);
  } else {
    const c = CACHE.ug_blocked;
    if (!c) loadOp("ug_blocked", "getBlockedGroups");
    const pg = paged("safety:groups", c?.data || []);
    el.innerHTML = head + (stateHtml(c, "noResults", 160) || `<div class="wgrid"></div>${pg.bar}`);
    if (c?.data?.length) pg.items.forEach(g => el.querySelector(".wgrid").appendChild(groupCard({ ...g, id: g.groupId || g.id })));
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
  a_searchPublicPh: ["ค้นหาอวตารสาธารณะ (ชื่อ, ผู้สร้าง, คำอธิบาย, แท็ก)", "Search public avatars (name, author, description, tags)", "公開アバターを検索 (名前・作者・説明・タグ)"],
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
// Lives on the Search page as the "Avatars" kind. avtrdb matches the name, author, description and tags;
// each card shows the description so it's clear why an avatar matched
tx({ s_avatars: ["อวตาร", "Avatars", "アバター"] });
SEARCH_KINDS.splice(SEARCH_KINDS.indexOf("worlds") + 1, 0, "avatars");
async function avatarSearch(q) {
  const more = q === undefined;
  if (more) { if (searchRes?.kind !== "avatars" || searchRes.loading) return; }
  else searchRes = { kind: "avatars", q, list: [], page: 0, more: false };
  const sr = searchRes;
  sr.loading = true;
  if (more) renderSearch();
  const r = await api("avatar_search", sr.q, sr.page);
  sr.loading = false;
  if (r?.ok) { sr.list.push(...r.ok); sr.more = r.more; sr.page++; } else if (!sr.list.length) sr.error = r?.error ?? 0; else apiError(r);
}
function avatarResultCard(a) {
  const d = document.createElement("div");
  d.className = "wcard" + (a.id === AVA.current ? " current" : "");
  d.innerHTML = `<div class="wimg" ${thumbAttr(a.thumb)}></div><div class="winfo"><div class="nm"></div><div class="sub"></div><div class="desc"></div></div>`;
  d.querySelector(".nm").textContent = a.name;
  d.querySelector(".sub").textContent = [a.authorName, a.perf].filter(Boolean).join(" · ");
  d.querySelector(".desc").textContent = a.description || "";
  d.title = a.description || "";
  d.onclick = () => openAvatar(a);
  return d;
}
const _renderSearchAv = renderSearch;
renderSearch = function () {
  _renderSearchAv();
  if (!AUTH.loggedIn) return;
  if (searchKind === "avatars") $("sq").placeholder = t("a_searchPublicPh");
  if (searching || searchRes?.kind !== "avatars" || searchRes.error !== undefined) return;
  const res = $("sres"), list = searchRes.list;
  if (!list.length) return res.innerHTML = `<div class="empty-state" style="height:200px">${t("noResults")}</div>`;
  res.innerHTML = `<div class="sec-head">${t("a_search")} <span class="n">${list.length}</span></div>`;
  const pg = paged("search:avatars", list);
  const grid = document.createElement("div");
  grid.className = "wgrid";
  pg.items.forEach(a => grid.appendChild(avatarResultCard(a)));
  res.appendChild(grid);
  res.insertAdjacentHTML("beforeend", pg.bar);
  if (searchRes.more) res.insertAdjacentHTML("beforeend", `<div class="form-actions">${btn(t(searchRes.loading ? "searching" : "loadMore"),
    "avatarSearch().then(renderSearch)", "", "arrow-down")}</div>`);
};
const _doSearchAv = doSearch;
doSearch = async function () {
  const q = $("sq")?.value.trim();
  if (searchKind !== "avatars" || !q) return _doSearchAv();
  for (const k in PAGES) if (k.startsWith("search:")) delete PAGES[k];
  searching = true; renderSearch();
  await avatarSearch(q);
  searching = false;
  renderSearch();
};

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
    const pg = paged("friends:" + st, arr);
    const grid = document.createElement("div");
    grid.className = mode === "list" ? "flist" : mode === "icons" ? "ficons" : "fgrid";
    pg.items.forEach(f => grid.appendChild(mode === "list" ? friendRow(f) : mode === "icons" ? friendIcon(f) : friendCardLast(f)));
    el.appendChild(grid);
    el.insertAdjacentHTML("beforeend", pg.bar);
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

// ======================= Chatbox info (OSC): random status, now playing, clock, Pulsoid heart rate =======================
// Python (chatinfo.py) builds and sends the text; this page edits the settings and shows a live preview
tx({
  nav_osc: ["OSC", "OSC", "OSC"],
  oi_on: ["ส่งไปที่ Chatbox", "Send to Chatbox", "チャットボックスに送信"],
  oi_onHint: ["อัปเดตข้อความเหนือหัวอัตโนมัติ · หยุด 15 วิ หลังส่งข้อความเองจากหน้าแชท", "Updates the text above your head · pauses 15 s after you send a message yourself", "頭上のテキストを自動更新 · 自分でメッセージを送ると 15 秒停止"],
  oi_preview: ["ตัวอย่าง", "Preview", "プレビュー"],
  oi_previewEmpty: ["ยังไม่มีอะไรจะแสดง — เปิดอย่างน้อยหนึ่งอย่างด้านล่าง", "Nothing to show yet — turn something on below", "表示する内容がありません — 下で何かをオンにしてください"],
  oi_paused: [n => `หยุดชั่วคราว ${n} วิ (เพิ่งส่งข้อความเอง)`, n => `Paused for ${n} s (you just sent a message)`, n => `${n} 秒一時停止中（メッセージを送信したため）`],
  oi_status: ["สถานะสุ่ม", "Random status", "ランダムステータス"],
  oi_statuses: ["ข้อความ", "Lines", "メッセージ"], oi_statusesHint: ["บรรทัดละ 1 ข้อความ สุ่มมาแสดงทีละอัน", "One per line, shown one at a time at random", "1 行に 1 つ、ランダムに 1 つずつ表示"],
  oi_every: ["เปลี่ยนทุก (วินาที)", "Change every (seconds)", "切り替え間隔（秒）"],
  oi_media: ["เพลง / สื่อที่กำลังเล่น", "Now playing", "再生中のメディア"], oi_format: ["รูปแบบ", "Format", "書式"],
  oi_mediaHint: ["{title} ชื่อเพลง · {artist} ศิลปิน · {pos} เวลาที่เล่น · {dur} ความยาว", "{title} · {artist} · {pos} position · {dur} length", "{title} 曲名 · {artist} アーティスト · {pos} 再生位置 · {dur} 長さ"],
  oi_nowPlaying: ["ตอนนี้", "Now", "現在"], oi_nothing: ["ไม่มีอะไรเล่นอยู่", "Nothing playing", "再生していません"],
  oi_clock: ["นาฬิกา", "Clock", "時計"], oi_24h: ["แบบ 24 ชั่วโมง", "24-hour", "24 時間表示"],
  oi_heart: ["อัตราการเต้นหัวใจ", "Heart rate", "心拍数"],
  oi_token: ["Pulsoid token", "Pulsoid token", "Pulsoid トークン"], oi_getToken: ["ขอ token", "Get a token", "トークンを取得"],
  oi_tokenHint: ["หรือวาง token จาก pulsoid.net (ต้องใช้แพ็กเกจ BRO) · เก็บไว้ในเครื่องนี้เท่านั้น", "Or paste a token from pulsoid.net (needs the BRO plan) · kept on this PC only", "または pulsoid.net のトークンを貼り付け（BRO プランが必要）· この PC にのみ保存"],
  oi_account: ["บัญชี Pulsoid", "Pulsoid account", "Pulsoid アカウント"],
  oi_loginHint: ["ต้องมีแพ็กเกจ BRO ของ Pulsoid — กดแล้วกด Allow ในหน้าเว็บที่เปิดขึ้นมา", "Needs a Pulsoid BRO plan — click, then Allow on the page that opens", "Pulsoid の BRO プランが必要 — クリックして、開いたページで Allow"],
  oi_signIn: ["เข้าสู่ระบบด้วย Pulsoid", "Sign in with Pulsoid", "Pulsoid でサインイン"], oi_signOut: ["ออกจากระบบ", "Sign out", "サインアウト"],
  oi_signedIn: ["เชื่อมบัญชีแล้ว", "Signed in", "サインイン済み"], oi_reopen: ["เปิดหน้าอีกครั้ง", "Open the page again", "ページを再度開く"],
  oi_waiting: ["รอคุณกด Allow ในเบราว์เซอร์…", "Waiting for you to click Allow in the browser…", "ブラウザで Allow を押すのを待っています…"],
  oi_login_denied: ["ไม่ได้รับอนุญาต — ลองใหม่ได้", "Access wasn't allowed — try again", "許可されませんでした — もう一度お試しください"],
  oi_login_expired: ["หมดเวลา — ลองใหม่ได้", "Timed out — try again", "時間切れです — もう一度お試しください"],
  oi_login_error: ["ติดต่อ Pulsoid ไม่ได้", "Couldn't reach Pulsoid", "Pulsoid に接続できません"],
  oi_noClient: ["ยังไม่ได้ตั้งค่าการเข้าสู่ระบบในแอปนี้", "Sign-in isn't set up in this build yet", "このビルドではサインインがまだ設定されていません"],
  oi_heartHint: ["{bpm} = ค่าหัวใจ", "{bpm} = heart rate", "{bpm} = 心拍数"],
  oi_params: ["ส่งเป็นพารามิเตอร์อวตารด้วย", "Also send avatar parameters", "アバターパラメーターにも送信"],
  oi_paramsHint: ["HR, onesHR, tensHR, hundredsHR, HRPercent, isHRConnected, isHRActive (ชื่อเดียวกับ HRtoVRChat)",
    "HR, onesHR, tensHR, hundredsHR, HRPercent, isHRConnected, isHRActive (same names as HRtoVRChat)",
    "HR, onesHR, tensHR, hundredsHR, HRPercent, isHRConnected, isHRActive（HRtoVRChat と同じ名前）"],
  oi_connection: ["การเชื่อมต่อ", "Connection", "接続"],
  oi_source: ["รับค่าจาก", "Source", "取得元"], oi_srcBle: ["Bluetooth (ฟรี)", "Bluetooth (free)", "Bluetooth（無料）"], oi_srcPulsoid: ["Pulsoid", "Pulsoid", "Pulsoid"],
  oi_device: ["อุปกรณ์", "Device", "デバイス"], oi_noDevice: ["ยังไม่ได้เลือก", "None chosen yet", "未選択"],
  oi_findDevices: ["ค้นหาอุปกรณ์", "Find devices", "デバイスを探す"], oi_scanning: ["กำลังค้นหา…", "Searching…", "検索中…"],
  oi_use: ["ใช้อันนี้", "Use", "使う"], oi_using: ["กำลังใช้", "In use", "使用中"],
  oi_noneFound: ["ไม่เจออุปกรณ์วัดหัวใจ — เปิดโหมดส่งค่าหัวใจบนนาฬิกาแล้วค้นหาใหม่", "No heart-rate device found — turn on heart-rate broadcast on your watch and search again", "心拍デバイスが見つかりません — 時計の心拍ブロードキャストをオンにして再検索"],
  oi_bleHint: ["สายคาดอกใช้ได้เลย · นาฬิกาต้องเปิดโหมดส่งค่าหัวใจ (Huawei: แชร์ข้อมูลหัวใจ, Garmin: Broadcast Heart Rate) · Apple Watch ใช้ไม่ได้",
    "Chest straps work as is · watches need heart-rate broadcast on (Huawei: heart rate sharing, Garmin: Broadcast Heart Rate) · Apple Watch can't",
    "胸ストラップはそのまま使えます · 時計は心拍ブロードキャストをオン（Huawei: 心拍数共有、Garmin: Broadcast Heart Rate）· Apple Watch は不可"],
  oi_hr_offBle: ["ยังไม่ได้เลือกอุปกรณ์", "No device chosen yet", "デバイス未選択"],
  oi_hr_searching: ["หาอุปกรณ์ไม่เจอ — กำลังลองใหม่ (เปิดโหมดส่งค่าหัวใจไว้หรือยัง?)", "Can't reach the device — retrying (is broadcast on?)", "デバイスに接続できません — 再試行中（ブロードキャストはオン？）"],
  oi_hr_off: ["ยังไม่ได้ใส่ token", "No token yet", "トークン未設定"], oi_hr_connecting: ["กำลังเชื่อมต่อ…", "Connecting…", "接続中…"],
  oi_hr_live: [n => `เชื่อมต่อแล้ว · ${n} bpm`, n => `Connected · ${n} bpm`, n => `接続済み · ${n} bpm`],
  oi_hr_badToken: ["token ไม่ถูกต้อง", "Invalid token", "トークンが無効です"], oi_hr_error: ["เชื่อมต่อไม่ได้ — กำลังลองใหม่", "Can't connect — retrying", "接続できません — 再試行中"],
  oi_interval: ["ส่งทุก (วินาที)", "Update every (seconds)", "更新間隔（秒）"],
  oi_layout: ["การจัดวาง", "Layout", "レイアウト"],
  oi_layoutHint: ["ลากเพื่อย้ายตำแหน่ง · กดอีโมจิเพื่อเปลี่ยน", "Drag to move · click an emoji to change it", "ドラッグで移動 · 絵文字をクリックで変更"],
  oi_addSep: ["ตัวคั่น", "Separator", "区切り"], oi_addBr: ["ขึ้นบรรทัดใหม่", "New line", "改行"], oi_br: ["ขึ้นบรรทัด", "New line", "改行"],
  oi_noEmoji: ["ไม่มี", "None", "なし"], oi_customEmoji: ["หรือพิมพ์/วางอีโมจิเอง", "Or type/paste your own", "または自分で入力・貼り付け"],
  oi_remove: ["เอาออก", "Remove", "削除"], oi_reset: ["คืนค่าเริ่มต้น", "Reset", "リセット"],
  oi_overall: ["ภาพรวม", "Overall", "全体"],
  oi_sup: ["ตัวยกเล็ก (เช่น 120ᶠᵖˢ)", "Small superscript (like 120ᶠᵖˢ)", "小さい上付き（例: 120ᶠᵖˢ）"],
  oi_supHint: ["ได้กับ a–z และ 0–9 · ภาษาไทยไม่เปลี่ยน", "Works for a–z and 0–9 · other scripts stay as they are", "a–z と 0–9 のみ · 他の文字はそのまま"],
  oi_clockTzSup: ["เขตเวลาเป็นตัวยกเล็ก", "Time zone in superscript", "タイムゾーンを上付きに"],
  oi_devices: ["Integrate devices", "Integrate devices", "デバイス連携"],
  oi_pc: ["ข้อมูล PC", "PC stats", "PC 情報"], oi_pcNow: ["ค่าตอนนี้", "Right now", "現在の値"],
  oi_pcCpu: ["CPU ที่ใช้", "CPU load", "CPU 使用率"], oi_pcGpu: ["GPU ที่ใช้", "GPU load", "GPU 使用率"],
  oi_pcTemp: ["อุณหภูมิ GPU", "GPU temperature", "GPU 温度"], oi_pcTempHint: ["เฉพาะการ์ดจอ NVIDIA", "NVIDIA graphics cards only", "NVIDIA のみ"],
  oi_pcRam: ["RAM ที่ใช้", "RAM in use", "使用中の RAM"], oi_pcVram: ["VRAM ที่ใช้", "VRAM in use", "使用中の VRAM"], oi_pcFps: ["FPS", "FPS", "FPS"],
  oi_pcFpsHint: ["อ่านจาก SteamVR · ถ้าเล่นโดยไม่เปิด SteamVR (เช่น Virtual Desktop แบบ VDXR) จะไม่ขึ้น", "From SteamVR · Not shown when you play without SteamVR (e.g. Virtual Desktop with VDXR)", "SteamVR から · SteamVR なし（Virtual Desktop の VDXR など）では表示されません"],
  oi_pcLblHint: ["ช่องแรกคือไอคอน ช่องที่สองคือข้อความหน้าตัวเลข", "First box: icon · second box: the text before the number", "1 つ目の欄はアイコン、2 つ目は数字の前の文字"],
  oi_pcCpuName: ["แสดงชื่อ CPU", "Show the CPU model", "CPU 名を表示"], oi_pcGpuName: ["แสดงชื่อการ์ดจอ", "Show the GPU model", "GPU 名を表示"],
  oi_pcRamType: ["แสดงประเภทแรม", "Show the RAM type", "RAM の種類を表示"], oi_pcIcon: ["แสดงไอคอน", "Show icons", "アイコンを表示"],
  oi_pcLblSup: ["ข้อความเป็นตัวเล็กลอยหลังตัวเลข (39%ᶜᴾᵁ)", "Label as small text after the number (39%ᶜᴾᵁ)", "ラベルを数字の後ろに小さく（39%ᶜᴾᵁ）"],
  oi_pcUnitSup: ["หน่วยเป็นตัวเล็กลอย (31.6ᴳᴮ 53°ᶜ)", "Small units (31.6ᴳᴮ 53°ᶜ)", "単位を小さく（31.6ᴳᴮ 53°ᶜ）"],
  oi_pcTotal: ["แสดงความจุทั้งหมดด้วย (31.6/64GB)", "Show the total too (31.6/64GB)", "合計も表示（31.6/64GB）"],
  oi_pcSep: ["ตัวคั่น", "Separator", "区切り"], oi_pcPerLine: ["จำนวนต่อบรรทัด", "Items per line", "1 行の項目数"],
  oi_pcPerLineHint: ["0 = ทั้งหมดในบรรทัดเดียว", "0 = all on one line", "0 = すべて 1 行"],
  oi_toyHint: ["อ่านอุปกรณ์ที่เชื่อมต่อใน Intiface Central และแบตเตอรี่ · กด Start server ใน Intiface และเชื่อมอุปกรณ์ที่นั่นก่อน",
    "Lists the devices connected in Intiface Central and their battery · Press Start server in Intiface and connect devices there first",
    "Intiface Central に接続したデバイスとバッテリーを表示 · 先に Intiface で Start server を押してデバイスを接続"],
  oi_relay: ["ให้แอปอื่นต่อผ่าน VRC Nook", "Let other apps connect through VRC Nook", "他のアプリを VRC Nook 経由で接続"],
  oi_relayHint: [p => `Intiface ต่อได้ทีละแอป ถ้าใช้ OscGoesBrrr หรือแอปอื่นคุมอุปกรณ์ ให้ตั้งที่อยู่ Intiface ในแอปนั้นเป็น ws://127.0.0.1:${p} แล้วจะใช้ได้พร้อมกัน (ต้องเปิด VRC Nook ไว้) · 0 = ปิด`,
    p => `Intiface takes one app at a time. If OscGoesBrrr or another app controls your devices, set its Intiface address to ws://127.0.0.1:${p} and both work together (VRC Nook must be running) · 0 = off`,
    p => `Intiface は一度に 1 アプリだけ。OscGoesBrrr などで操作しているなら、そのアプリの Intiface アドレスを ws://127.0.0.1:${p} にすると両方使えます（VRC Nook の起動が必要）· 0 = オフ`],
  oi_relay_off: ["ปิดอยู่", "Off", "オフ"], oi_relay_waiting: [p => `รอแอปต่อที่พอร์ต ${p}`, p => `Waiting for an app on port ${p}`, p => `ポート ${p} でアプリを待っています`],
  oi_relay_app: [n => `${n || "แอป"} ต่อผ่าน VRC Nook อยู่`, n => `${n || "An app"} is connected through VRC Nook`, n => `${n || "アプリ"} が VRC Nook 経由で接続中`],
  oi_relay_portBusy: [p => `พอร์ต ${p} ถูกโปรแกรมอื่นใช้อยู่ — เปลี่ยนเลขพอร์ต`, p => `Port ${p} is used by another program — pick another`, p => `ポート ${p} は他のプログラムが使用中 — 別の番号に`],
  oi_toyBatt: ["อ่านแบตจาก Intiface", "Read battery from Intiface", "Intiface からバッテリーを読む"],
  oi_toyBattHint: ["ถ้า Intiface Central ค้างหลังเปิด ให้ปิดอันนี้ (ยังเห็นชื่ออุปกรณ์และ % แรงสั่น)", "If Intiface Central freezes after turning this on, switch this off (names and vibration % still show)", "Intiface Central が固まる場合はオフに（名前と振動 % は表示されます）"],
  oi_toyAddr: ["ที่อยู่เซิร์ฟเวอร์ Intiface", "Intiface server address", "Intiface サーバーのアドレス"],
  oi_toyAddrHint: ["ค่าเริ่มต้น ws://127.0.0.1:12345", "Default ws://127.0.0.1:12345", "既定 ws://127.0.0.1:12345"],
  oi_toy_off: ["ปิดอยู่", "Off", "オフ"], oi_toy_noIntiface: ["รอเซิร์ฟเวอร์ Intiface…", "Waiting for the Intiface server…", "Intiface サーバーを待っています…"],
  oi_toy_ok: [n => `เชื่อมต่อ Intiface แล้ว · ${n} อุปกรณ์`, n => `Connected to Intiface · ${n} devices`, n => `Intiface に接続 · ${n} 台`],
  oi_toy_error: ["ต่อ Intiface ไม่ได้ (อาจมีแอปอื่นต่อตรงอยู่ ให้แอปนั้นต่อผ่าน VRC Nook แทน) — กำลังลองใหม่", "Can't connect to Intiface (another app may be connected to it directly — point it at VRC Nook instead) — retrying", "Intiface に接続できません（他のアプリが直接接続中かも — VRC Nook 経由に変更を）— 再試行中"],
  oi_devHint: ["อ่านจาก SteamVR: แบตเตอรี่ของแว่น controller และ tracker · ถ้าเล่นผ่าน Virtual Desktop/Quest Link แบบไม่เปิด SteamVR จะอ่านไม่ได้",
    "Read from SteamVR: battery of your headset, controllers and trackers · Virtual Desktop / Quest Link without SteamVR can't be read",
    "SteamVR から読み取り：ヘッドセット・コントローラー・トラッカーのバッテリー · SteamVR なしの Virtual Desktop / Quest Link は読めません"],
  oi_vr_off: ["ปิดอยู่", "Off", "オフ"], oi_vr_noSteamVR: ["รอ SteamVR เปิด…", "Waiting for SteamVR…", "SteamVR の起動を待っています…"],
  oi_vr_ok: [n => `เชื่อมต่อ SteamVR แล้ว · ${n} อุปกรณ์`, n => `Connected to SteamVR · ${n} devices`, n => `SteamVR に接続 · ${n} 台`],
  oi_vr_error: ["อ่านจาก SteamVR ไม่ได้ — กำลังลองใหม่", "Can't read SteamVR — retrying", "SteamVR を読み取れません — 再試行中"],
  oi_devTrkGroup: ["รวม tracker เป็นกลุ่ม", "Group trackers", "トラッカーをまとめる"],
  oi_devTrkGroupHint: ["แสดง tracker ทั้งหมดเป็นอันเดียว เช่น 📍×3 62%", "Show all trackers as one, like 📍×3 62%", "全トラッカーを 1 つに表示（例：📍×3 62%）"],
  oi_devStat: ["ค่าของกลุ่ม tracker", "Tracker group value", "トラッカーグループの値"], oi_devLowest: ["ต่ำสุด", "Lowest", "最低"], oi_devAverage: ["เฉลี่ย", "Average", "平均"],
  oi_devHmd: ["แว่น (headset)", "Headset", "ヘッドセット"], oi_devCtrl: ["Controller", "Controllers", "コントローラー"], oi_devTrk: ["Tracker", "Trackers", "トラッカー"],
  oi_devCharging: ["แสดง ⚡ ตอนชาร์จ", "Show ⚡ while charging", "充電中は ⚡ を表示"],
  oi_devLow: ["แบตต่ำกว่า (%) ให้แสดง 🪫", "Show 🪫 at or below (%)", "この % 以下で 🪫 を表示"],
  oi_devList: ["อุปกรณ์ที่เจอ", "Devices found", "見つかったデバイス"],
  oi_devNameHint: ["สวิตช์หน้าแต่ละชิ้น = ให้ขึ้นใน chatbox ไหม · chatbox จะขึ้นชื่ออุปกรณ์ กดซ่อนชื่อเพื่อให้ขึ้นแค่สัญลักษณ์",
    "The switch on each device = show it in the Chatbox · The Chatbox shows its name — hide the name to show just a short label",
    "各デバイスのスイッチ = Chatbox に表示するか · Chatbox にデバイス名を表示 — 名前を隠すと短いラベルだけに"],
  oi_devShow: ["แสดงใน chatbox", "Show in the Chatbox", "Chatbox に表示"],
  oi_devBattIcon: ["ไอคอนแบต", "Battery icon", "バッテリーアイコン"],
  oi_devKindIcon: ["ไอคอนอุปกรณ์", "Device icon", "デバイスアイコン"],
  oi_resetIcon: ["คืนไอคอนเริ่มต้น", "Reset to the default icon", "既定のアイコンに戻す"],
  oi_devVibe: ["แสดง % แรงสั่น (Intiface)", "Show vibration strength % (Intiface)", "振動の強さ % を表示（Intiface）"],
  oi_devVibeHint: ["อ่านจากคำสั่งที่แอปที่ต่อผ่าน VRC Nook ส่งไป (เช่น OscGoesBrrr) · ช่องข้างหลังคือสัญลักษณ์หน้าตัวเลข", "Taken from what the app connected through VRC Nook (e.g. OscGoesBrrr) sends · The box is the symbol before the number", "VRC Nook 経由で接続したアプリ（OscGoesBrrr など）の命令から読み取り · 欄は数字の前の記号"],
  oi_hideName: ["ซ่อนชื่อ", "Hide name", "名前を隠す"], oi_showName: ["แสดงชื่อ", "Show name", "名前を表示"],
  oi_devNone: ["ยังไม่เจออุปกรณ์", "No devices yet", "まだデバイスがありません"], oi_noBattery: ["ไม่รายงานแบต", "No battery info", "バッテリー情報なし"],
  oi_hrSuffixSup: ["ข้อความต่อท้ายเป็นตัวยกเล็ก", "Suffix in superscript", "後ろのテキストを上付きに"],
  oi_addText: ["ข้อความ", "Text", "テキスト"], oi_textPh: ["พิมพ์ข้อความ…", "Type text…", "テキストを入力…"],
  oi_mediaTime: ["แสดงเวลาที่เล่นไป", "Show time played", "再生位置を表示"], oi_mediaDur: ["แสดงความยาวเพลง", "Show length", "曲の長さを表示"],
  oi_mediaBar: ["แสดงแถบเวลา (seek bar)", "Show seek bar", "シークバーを表示"], oi_barStyle: ["แบบแถบ", "Bar style", "バーの形"],
  oi_barLen: ["ความยาวแถบ (ตัวอักษร)", "Bar length (characters)", "バーの長さ（文字数）"],
  oi_timelineHint: ["แสดงเป็นบรรทัดใต้ชื่อเพลง", "Shown on a line under the song", "曲名の下の行に表示"],
  oi_clockTz: ["แสดงเขตเวลา (เช่น UTC+7)", "Show time zone (e.g. UTC+7)", "タイムゾーンを表示（例: UTC+7）"],
  oi_clockDate: ["แสดงวันที่ (วัน/เดือน)", "Show date (day/month)", "日付を表示（日/月）"],
  oi_hrSuffixOn: ["ข้อความต่อท้ายค่าหัวใจ", "Text after the number", "数値の後ろのテキスト"],
  oi_hrSuffixHint: ["เช่น bpm, BPM, ครั้ง/นาที", "e.g. bpm, BPM", "例: bpm、BPM"],
  oi_intervalHint: ["1–60 วิ · ถ้าต่ำกว่า ~1.5 วิ VRChat อาจข้ามบางข้อความ", "1–60 s · under ~1.5 s VRChat may skip some updates", "1〜60 秒 · 約 1.5 秒未満だと VRChat が一部を表示しないことがあります"],
});
NAV.osc = ["radio", "pink"];
VIEWS.splice(VIEWS.indexOf("chat") + 1, 0, "osc");
$("jump").insertAdjacentHTML("beforebegin", `<div class="view" id="v_osc"></div>`);
// VR overlay has its own page: OSC builds its settings with the rest (one form, saved together) and they're moved there
NAV.vr = ["glasses", "purple"];
VIEWS.splice(VIEWS.indexOf("osc") + 1, 0, "vr");
$("jump").insertAdjacentHTML("beforebegin", `<div class="view" id="v_vr"></div>`);
const OI_DEF = { on: false, status: true, statuses: [], statusEvery: 60, media: true, mediaFmt: "{artist} - {title}", clock: true, clock24: true,
  layout: ["status", "br", "media", "br", "clock", "sep:   ", "heart"], icons: { status: "", media: "🎵", clock: "🕒", heart: "❤️", devices: "", pc: "" },
  devices: false, devTrkGroup: false, devPerLine: false, devStat: "lowest", devHmd: true, devCtrl: true, devTrk: true, devCharging: true, devLow: 20, devHidden: [], devOff: [], devNames: {}, devVibe: true, devVibeIcon: "〰️", devBattIcon: false, devBattSym: "🔋", devKindIcon: false, devKindSyms: { hmd: "🥽", ctrl: "🎮", trk: "📍", toy: "📳" },
  pc: false, pcCpu: true, pcGpu: true, pcTemp: true, pcRam: true, pcVram: true, pcFps: true, pcTotal: false, pcSep: " | ", pcPerLine: 2,
  pcLabels: { cpu: "CPU", gpu: "GPU", ram: "RAM", vram: "VRAM", fps: "FPS" },
  pcCpuName: false, pcGpuName: false, pcRamType: false, pcIcon: false, pcLblSup: false, pcUnitSup: false,
  pcIcons: { cpu: "🧠", gpu: "🎮", ram: "💾", vram: "🖼️", fps: "⏱️" },
  devToy: false, devToyBatt: true, intiface: "ws://127.0.0.1:12345", intifaceRelay: 12346,
  vr: false, vrToast: true, vrFriends: "fav", vrInvites: true, vrJoins: true, vrWrist: true, vrHand: "left", vrBtn: 5, vrPanel: 26, vrKb: 32, vrDist: 20, vrX: 0, vrY: 0, vrPalm: false, vrGaze: true, vrInput: "both",
  mediaTime: false, mediaDur: false, mediaBar: false, mediaBarStyle: "line", mediaBarLen: 10, clockTz: false, clockTzSup: false, clockDate: false,
  heart: false, heartFmt: "{bpm}", hrSuffixOn: false, hrSuffix: "bpm", hrSuffixSup: false, hrParams: true, hrSource: "ble", bleAddr: "", bleName: "", pulsoid: "", interval: 3 };
const oiCfg = () => {
  const c = { ...OI_DEF, ...(S.chatInfo || {}) };
  if (c.mediaFmt === "🎵 {artist} - {title}") c.mediaFmt = OI_DEF.mediaFmt;  // Icons used to be part of the format
  if (c.heartFmt === "❤️ {bpm}") c.heartFmt = OI_DEF.heartFmt;
  const oldPcIcons = { cpu: "💻", gpu: "🖥️", vram: "🗂️", fps: "🎞️" };  // First defaults, replaced by clearer ones
  if (c.pcIcons) c.pcIcons = Object.fromEntries(Object.entries(c.pcIcons).map(([k, v]) => [k, v === oldPcIcons[k] ? OI_DEF.pcIcons[k] : v]));
  return c;
};
function renderOsc() {
  const el = $("v_osc");
  if ($("oiPrev") && el.dataset.lang === S.lang) return;  // Built already — only the preview updates (see oiPoll)
  const c = oiCfg();
  const sec = (key, ic, on, body) => `<div class="oi-sec" data-tab="${key}"><div class="sec-head">${icon(ic)} ${t("oi_" + key)}<span class="grow"></span>${fCheck("oi_" + key, on)}</div>
    <div class="card oi-card">${body}</div></div>`;
  el.dataset.lang = S.lang;
  oiLoginKey = oiBleKey = oiVrKey = "";  // These rows are empty again — draw them on the next poll
  el.innerHTML = `<div class="card oi-card oi-top"><div class="oi-prev" id="oiPrev"></div><div class="oi-note" id="oiNote"></div></div>
    <div class="toolbar oi-tabs"><div class="segmented scroll-x" id="oiTabs"></div></div>
    <div class="oi-sec" data-tab="overall"><div class="card oi-card">${fRow(t("oi_on"), fCheck("oiOn", c.on), t("oi_onHint"))}
      ${fRow(t("oi_interval"), fInput("oiInterval", c.interval, 'type="number" min="1" max="60"'), t("oi_intervalHint"))}
      <div class="oi-lay-head"><b>${t("oi_layout")}</b><span class="hint-inline">${t("oi_layoutHint")}</span><span class="grow"></span>
        ${btn(t("oi_addText"), "oiAdd('text:')", "sm", "plus")}${btn(t("oi_addSep"), "oiAdd('sep: | ')", "sm", "plus")}${btn(t("oi_addBr"), "oiAdd('br')", "sm", "corner-down-left")}
        <button class="mini-btn" title="${t("oi_reset")}" onclick="oiLayoutReset()">${icon("rotate-ccw")}</button></div>
      <div class="oi-lay" id="oiLay"></div></div></div>
    ${sec("status", "sparkles", c.status, fRow(t("oi_statuses"), fArea("oiStatuses", c.statuses.join("\n"), 5), t("oi_statusesHint"))
      + fRow(t("oi_every"), fInput("oiEvery", c.statusEvery, 'type="number" min="5" max="3600"')))}
    ${sec("media", "music", c.media, fRow(t("oi_format"), fInput("oiMediaFmt", c.mediaFmt), t("oi_mediaHint"))
      + fRow(t("oi_mediaTime"), fCheck("oiMediaTime", c.mediaTime), t("oi_timelineHint"))
      + fRow(t("oi_mediaDur"), fCheck("oiMediaDur", c.mediaDur))
      + fRow(t("oi_mediaBar"), fCheck("oiMediaBar", c.mediaBar))
      + fRow(t("oi_barStyle"), fSelect("oiBarStyle", { line: "━━━●────", blocks: "▰▰▰▱▱▱▱▱", squares: "■■■□□□□□", dots: "●●●○○○○○" }, c.mediaBarStyle))
      + fRow(t("oi_barLen"), fInput("oiBarLen", c.mediaBarLen, 'type="number" min="5" max="20"'))
      + fRow(t("oi_nowPlaying"), `<span class="hint-inline" id="oiMedia"></span>`))}
    ${sec("clock", "clock", c.clock, fRow(t("oi_24h"), fCheck("oiClock24", c.clock24))
      + fRow(t("oi_clockTz"), fCheck("oiClockTz", c.clockTz))
      + fRow(t("oi_clockTzSup"), fCheck("oiClockTzSup", c.clockTzSup), t("oi_supHint"))
      + fRow(t("oi_clockDate"), fCheck("oiClockDate", c.clockDate)))}
    ${sec("heart", "heart", c.heart, fRow(t("oi_source"), `<div class="segmented oi-src" id="oiSrc"></div><input type="hidden" id="oiSource" value="${escA(c.hrSource)}">`)
      + `<div class="oi-ble">${fRow(t("oi_device"), `<div class="oi-token" id="oiBle"></div>`, t("oi_bleHint"))}<div id="oiBleList"></div>
          <input type="hidden" id="oiBleAddr" value="${escA(c.bleAddr)}"><input type="hidden" id="oiBleName" value="${escA(c.bleName)}"></div>`
      + `<div class="oi-pulsoid">${fRow(t("oi_account"), `<div class="oi-token" id="oiLogin"></div>`, t("oi_loginHint"))
      + fRow(t("oi_token"), `<div class="oi-token"><input class="field" id="oiToken" type="password" value="${escA(c.pulsoid)}" spellcheck="false" autocomplete="off">
        ${btn(t("oi_getToken"), "api('open_url','https://pulsoid.net/ui/keys')", "sm", "external-link")}</div>`, t("oi_tokenHint"))}</div>`
      + fRow(t("oi_connection"), `<span class="hint-inline" id="oiHr"></span>`)
      + fRow(t("oi_format"), fInput("oiHeartFmt", c.heartFmt), t("oi_heartHint"))
      + fRow(t("oi_hrSuffixOn"), `<div class="oi-token">${fCheck("oiHrSuffixOn", c.hrSuffixOn)}${fInput("oiHrSuffix", c.hrSuffix, 'maxlength="16"')}</div>`, t("oi_hrSuffixHint"))
      + fRow(t("oi_hrSuffixSup"), fCheck("oiHrSuffixSup", c.hrSuffixSup), t("oi_supHint"))
      + fRow(t("oi_params"), fCheck("oiParams", c.hrParams), t("oi_paramsHint")))}
    ${sec("devices", "battery-medium", c.devices, fRow("SteamVR", `<span class="hint-inline" id="oiVr"></span>`, t("oi_devHint"))
      + fRow(t("oi_devHmd"), fCheck("oiDevHmd", c.devHmd)) + fRow(t("oi_devCtrl"), fCheck("oiDevCtrl", c.devCtrl)) + fRow(t("oi_devTrk"), fCheck("oiDevTrk", c.devTrk))
      + fRow("Intiface Central", `<div class="oi-token">${fCheck("oiDevToy", c.devToy)}<span class="hint-inline" id="oiToy"></span></div>`, t("oi_toyHint"))
      + fRow(t("oi_toyBatt"), fCheck("oiDevToyBatt", c.devToyBatt), t("oi_toyBattHint"))
      + fRow(t("oi_toyAddr"), fInput("oiIntiface", c.intiface, 'spellcheck="false" maxlength="100"'), t("oi_toyAddrHint"))
      + fRow(t("oi_relay"), `<div class="oi-token">${fInput("oiRelay", c.intifaceRelay, 'type="number" min="0" max="65535"')}<span class="hint-inline" id="oiRelaySt"></span></div>`,
        `<span id="oiRelayHint">${t("oi_relayHint", c.intifaceRelay || 12346)}</span>`)
      + fRow(t("oi_devTrkGroup"), fCheck("oiDevTrkGroup", "devTrkGroup" in (S.chatInfo || {}) ? c.devTrkGroup : c.devMode === "group"), t("oi_devTrkGroupHint"))
      + fRow(t("oi_devPerLine"), fCheck("oiDevPerLine", c.devPerLine), t("oi_devPerLineHint"))
      + fRow(t("oi_devStat"), fSelect("oiDevStat", { lowest: t("oi_devLowest"), average: t("oi_devAverage") }, c.devStat))
      + fRow(t("oi_devCharging"), fCheck("oiDevCharging", c.devCharging))
      + fRow(t("oi_devBattIcon"), `<div class="oi-token">${fCheck("oiDevBattIcon", c.devBattIcon)}${oiSym("oiDevBattSym", c.devBattSym, OI_DEF.devBattSym)}${oiSymReset("oiDevBattSym")}</div>`)
      + fRow(t("oi_devKindIcon"), `<div class="oi-token">${fCheck("oiDevKindIcon", c.devKindIcon)}${Object.keys(OI_KIND).map(k => oiSym("oiSym_" + k, c.devKindSyms?.[k] || OI_KIND[k], OI_KIND[k])).join("")}
        ${oiSymReset(...Object.keys(OI_KIND).map(k => "oiSym_" + k))}</div>`)
      + fRow(t("oi_devVibe"), `<div class="oi-token">${fCheck("oiDevVibe", c.devVibe)}${oiSym("oiDevVibeIcon", c.devVibeIcon, OI_DEF.devVibeIcon)}${oiSymReset("oiDevVibeIcon")}</div>`, t("oi_devVibeHint"))
      + fRow(t("oi_devLow"), fInput("oiDevLow", c.devLow, 'type="number" min="0" max="100"'))
      + fRow(t("oi_devList"), `<div id="oiVrList" class="oi-vr-list"></div>`, t("oi_devNameHint")))}
    ${sec("pc", "cpu", c.pc, fRow(t("oi_pcNow"), `<span class="hint-inline" id="oiPc"></span>`)
      + PC_ITEMS.map(k => fRow(t("oi_pc" + oiCap(k)), `<div class="oi-token">${fCheck("oiPc" + oiCap(k), c["pc" + oiCap(k)])}${oiSym("oiPcIco_" + k, c.pcIcons?.[k] || OI_DEF.pcIcons[k], OI_DEF.pcIcons[k])}${fInput("oiPcLbl_" + k, (c.pcLabels || {})[k] ?? OI_DEF.pcLabels[k], 'maxlength="12" style="width:110px"')}</div>`,
          k === "fps" ? t("oi_pcFpsHint") : t("oi_pcLblHint"))
        + (PC_NAMES[k] ? fRow(t("oi_" + PC_NAMES[k]), fCheck("oi" + oiCap(PC_NAMES[k]), c[PC_NAMES[k]]), `<span id="oiPcName_${k}"></span>`) : "")
        + (k === "gpu" ? fRow(t("oi_pcTemp"), fCheck("oiPcTemp", c.pcTemp), t("oi_pcTempHint")) : "")).join("")
      + fRow(t("oi_pcIcon"), `<div class="oi-token">${fCheck("oiPcIcon", c.pcIcon)}${oiSymReset(...PC_ITEMS.map(k => "oiPcIco_" + k))}</div>`)
      + fRow(t("oi_pcLblSup"), fCheck("oiPcLblSup", c.pcLblSup))
      + fRow(t("oi_pcUnitSup"), fCheck("oiPcUnitSup", c.pcUnitSup))
      + fRow(t("oi_pcTotal"), fCheck("oiPcTotal", c.pcTotal))
      + fRow(t("oi_pcSep"), fInput("oiPcSep", c.pcSep, 'maxlength="12" style="width:110px"'))
      + fRow(t("oi_pcPerLine"), fInput("oiPcPerLine", c.pcPerLine, 'type="number" min="0" max="5"'), t("oi_pcPerLineHint")))}
    ${sec("vr", "glasses", c.vr, fRow("SteamVR", `<span class="hint-inline" id="oiOv"></span>`, t("vr_hint"))
      + `<div class="oi-sub">${t("vr_toasts")}</div>`
      + fRow(t("vr_toast"), `<div class="oi-token">${fCheck("oiVrToast", c.vrToast)}${btn(t("vr_test"), "vrTest()", "sm", "bell")}</div>`, t("vr_toastHint"))
      + fRow(t("vr_friends"), fSelect("oiVrFriends", { off: t("vr_fr_off"), fav: t("vr_fr_fav"), all: t("vr_fr_all") }, c.vrFriends))
      + fRow(t("vr_invites"), fCheck("oiVrInvites", c.vrInvites), t("vr_invitesHint"))
      + fRow(t("vr_joins"), fCheck("oiVrJoins", c.vrJoins), t("vr_joinsHint"))
      + `<div class="oi-sub">${t("vr_wristSec")}</div>`
      + fRow(t("vr_wrist"), fCheck("oiVrWrist", c.vrWrist), t("vr_wristHint"))
      + fRow(t("vr_hand"), fSelect("oiVrHand", { left: t("vr_left"), right: t("vr_right") }, c.vrHand))
      + fRow(t("vr_size"), fInput("oiVrBtn", c.vrBtn, 'type="number" min="3" max="12"'), t("vr_sizeHint"))
      + fRow(t("vr_panel"), fInput("oiVrPanel", c.vrPanel, 'type="number" min="15" max="40"'), t("vr_panelHint"))
      + fRow(t("vr_kbSize"), fInput("oiVrKb", c.vrKb ?? OI_DEF.vrKb, 'type="number" min="20" max="60"'), t("vr_kbSizeHint"))
      + fRow(t("vr_palm"), fSelect("oiVrShow", { look: t("vr_show_look"), palm: t("vr_show_palm") }, c.vrPalm ? "palm" : "look"), t("vr_palmHint"))
      + fRow(t("vr_posX"), fInput("oiVrX", c.vrX ?? 0, 'type="number" min="-20" max="20" step="0.5"'), t("vr_posXHint"))
      + fRow(t("vr_posY"), fInput("oiVrY", c.vrY ?? 0, 'type="number" min="-20" max="20" step="0.5"'), t("vr_posYHint"))
      + fRow(t("vr_posZ"), fInput("oiVrDist", c.vrDist, 'type="number" min="-10" max="40" step="0.5"'), t("vr_distHint"))
      + fRow(t("vr_input"), fSelect("oiVrInput", { both: t("vr_in_both"), poke: t("vr_in_poke"), laser: t("vr_in_laser") }, c.vrInput), t("vr_inputHint"))
      + fRow(t("vr_gaze"), fCheck("oiVrGaze", c.vrGaze), t("vr_gazeHint")))}`;
  let timer = 0;
  el.oninput = el.onchange = () => { clearTimeout(timer); timer = setTimeout(oiSave, 400); oiTabsUi(); oiLayDim(); };
  const vr = el.querySelector('.oi-sec[data-tab="vr"]');  // To its own page
  vr.hidden = false;
  $("v_vr").replaceChildren(vr);
  $("v_vr").oninput = $("v_vr").onchange = el.oninput;
  oiLayout = [...c.layout]; oiIcons = { ...OI_DEF.icons, ...c.icons };
  for (const k of ["status", "media", "clock", "heart", "devices", "pc"])  // A part that's new in this version goes on its own line at the end
    if (!oiLayout.includes(k)) oiLayout.push(...(oiLayout.length ? ["br", k] : [k]));
  oiLayUi();
  oiSrcUi();
  oiTabsUi();
  oiPoll();
}
// ---------- Layout editor: chips in the order they're sent; drag to move (pointer events, so it also works from VR) ----------
let oiLayout = [], oiIcons = {};
const OI_EMOJI = ["🎵", "🎶", "🎧", "🎤", "📻", "💿", "🕒", "⏰", "⌚", "🌙", "☀️", "❤️", "💓", "💗", "💖", "🫀", "💜", "🖤",
  "✨", "⭐", "🌸", "🍀", "🔥", "💬", "😴", "🎮", "🐱", "🌈"];
function oiLayUi() {
  $("oiLay").innerHTML = oiLayout.map((it, i) => {
    if (it === "br") return `<span class="oi-chip br" data-i="${i}">${icon("corner-down-left")}${t("oi_br")}<button class="oi-x" title="${t("oi_remove")}" onclick="oiDel(${i})">${icon("x")}</button></span><span class="oi-break"></span>`;
    if (it.startsWith("text:") || it.startsWith("sup:")) {
      const kind = it.slice(0, it.indexOf(":") + 1), val = it.slice(kind.length);
      return `<span class="oi-chip text" data-i="${i}">${icon("pencil")}<input value="${escA(val)}" maxlength="60" spellcheck="false"
        placeholder="${escA(t("oi_textPh"))}" oninput="oiLayout[${i}]='${kind}'+this.value;this.size=Math.max(this.value.length,8);oiSaveSoon()" size="${Math.max(val.length, 8)}">
        <button class="oi-supt ${kind === "sup:" ? "on" : ""}" title="${escA(t("oi_sup"))}" onclick="oiSupToggle(${i})">ᵃᵇ</button>
        <button class="oi-x" title="${t("oi_remove")}" onclick="oiDel(${i})">${icon("x")}</button></span>`;
    }
    if (it.startsWith("sep:")) return `<span class="oi-chip sep" data-i="${i}"><input value="${escA(it.slice(4))}" maxlength="20" spellcheck="false"
      oninput="oiLayout[${i}]='sep:'+this.value;this.size=Math.max(this.value.length,2);oiSaveSoon()" size="${Math.max(it.length - 4, 2)}">
      <button class="oi-x" title="${t("oi_remove")}" onclick="oiDel(${i})">${icon("x")}</button></span>`;
    const emo = it === "devices" ? "" : `<button class="oi-emo" title="${t("oi_layoutHint")}" onclick="oiEmoji('${it}',this)">${oiIcons[it] || icon("plus")}</button>`;  // Devices have their own icons
    return `<span class="oi-chip item" data-i="${i}" data-k="${it}">${emo}${t("oi_" + it)}</span>`;
  }).join("");
  oiLayDim();
}
function oiLayDim() {  // Parts that are switched off look faded
  $("oiLay")?.querySelectorAll(".oi-chip.item").forEach(c => c.classList.toggle("off", !$("oi_" + c.dataset.k)?.checked));
}
let oiSaveTimer = 0;
function oiSaveSoon() { clearTimeout(oiSaveTimer); oiSaveTimer = setTimeout(oiSave, 400); }
function oiAdd(it) {
  oiLayout.push(it); oiLayUi(); oiSave();
  if (it === "text:") [...$("oiLay").querySelectorAll(".oi-chip.text input")].pop()?.focus();  // Ready to type
}
function oiDel(i) { oiLayout.splice(i, 1); oiLayUi(); oiSave(); }
function oiSupToggle(i) {
  const it = oiLayout[i];
  oiLayout[i] = it.startsWith("sup:") ? "text:" + it.slice(4) : "sup:" + it.slice(5);
  oiLayUi(); oiSave();
}
function oiLayoutReset() { oiLayout = [...OI_DEF.layout]; oiIcons = { ...OI_DEF.icons }; oiLayUi(); oiSave(); }
document.addEventListener("pointerdown", e => {
  const chip = e.target.closest?.("#oiLay .oi-chip");
  if (!chip || e.button !== 0 || e.target.closest("input, button")) return;
  e.preventDefault();
  chip.classList.add("drag");
  const lay = $("oiLay");
  // Listen on the whole page, not the chip: moving the chip in the page drops pointer capture, and the release
  // could then land on another element and leave the drag hanging
  const move = ev => {  // Move the chip in front of / behind the chip under the pointer
    if (ev.pointerId !== e.pointerId) return;
    const over = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".oi-chip");
    if (!over || over === chip || !lay.contains(over)) return;
    const r = over.getBoundingClientRect();
    const target = ev.clientX > r.left + r.width / 2 ? (over.nextElementSibling?.classList.contains("oi-break") ? over.nextElementSibling : over).nextSibling : over;
    if (target !== chip) lay.insertBefore(chip, target);
  };
  const up = ev => {
    if (ev.pointerId !== e.pointerId) return;
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
    document.removeEventListener("pointercancel", up);
    chip.classList.remove("drag");
    const order = [...lay.querySelectorAll(".oi-chip")].map(c => oiLayout[+c.dataset.i]);
    const changed = order.join("\n") !== oiLayout.join("\n");
    oiLayout = order;
    oiLayUi();
    if (changed) oiSave();
  };
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up);
  document.addEventListener("pointercancel", up);
});
function oiEmoji(k, anchor) {
  $("oiEmoPop")?.remove();
  const pop = document.createElement("div");
  pop.id = "oiEmoPop";
  pop.className = "oi-emo-pop";
  pop.innerHTML = `<div class="grid">${OI_EMOJI.map(e => `<button data-e="${e}">${e}</button>`).join("")}<button data-e="" class="none">${t("oi_noEmoji")}</button></div>
    <input class="field" placeholder="${escA(t("oi_customEmoji"))}" maxlength="8" value="${escA(oiIcons[k] || "")}">`;
  const pick = e => { oiIcons[k] = e; pop.remove(); oiLayUi(); oiSave(); };
  pop.querySelectorAll("button").forEach(b => b.onclick = () => pick(b.dataset.e));
  const inp = pop.querySelector("input");
  inp.onkeydown = ev => { if (ev.key === "Enter") pick(inp.value.trim()); if (ev.key === "Escape") pop.remove(); };
  inp.onchange = () => pick(inp.value.trim());
  document.body.appendChild(pop);
  const r = anchor.getBoundingClientRect();
  pop.style.left = Math.min(r.left, innerWidth - pop.offsetWidth - 8) + "px";
  pop.style.top = (r.bottom + pop.offsetHeight + 8 > innerHeight ? r.top - pop.offsetHeight - 6 : r.bottom + 6) + "px";
  setTimeout(() => document.addEventListener("pointerdown", function off(ev) {
    if (!pop.contains(ev.target)) { pop.remove(); document.removeEventListener("pointerdown", off); }
  }), 0);
}
// One section at a time; each tab shows a dot when that part is switched on
const OI_TABS = { overall: "sliders-horizontal", status: "sparkles", media: "music", clock: "clock", pc: "cpu", heart: "heart", devices: "battery-medium" };
let oiTab = "overall";
function oiTabsUi() {
  $("oiTabs").innerHTML = Object.entries(OI_TABS).map(([k, ic]) => `<button class="${oiTab === k ? "on" : ""}" onclick="oiTab='${k}';oiTabsUi()">${icon(ic)}${t("oi_" + k)}
    <i class="oi-dot ${$(k === "overall" ? "oiOn" : "oi_" + k)?.checked ? "on" : ""}"></i></button>`).join("");
  $("v_osc").querySelectorAll(".oi-sec").forEach(d => d.hidden = d.dataset.tab !== oiTab);
}
function oiSave() {
  const num = (id, d) => { const n = parseInt(fv(id), 10); return Number.isFinite(n) ? n : d; };
  const dec = (id, d) => { const n = parseFloat(fv(id)); return Number.isFinite(n) ? Math.round(n * 10) / 10 : d; };
  S.chatInfo = { on: fv("oiOn"), status: fv("oi_status"), statuses: (fv("oiStatuses") || "").split("\n").map(s => s.trim()).filter(Boolean),
    statusEvery: num("oiEvery", OI_DEF.statusEvery), media: fv("oi_media"), mediaFmt: fv("oiMediaFmt") || OI_DEF.mediaFmt,
    clock: fv("oi_clock"), clock24: fv("oiClock24"), clockTz: fv("oiClockTz"), clockTzSup: fv("oiClockTzSup"), clockDate: fv("oiClockDate"),
    mediaTime: fv("oiMediaTime"), mediaDur: fv("oiMediaDur"), mediaBar: fv("oiMediaBar"), mediaBarStyle: fv("oiBarStyle") || "line",
    mediaBarLen: num("oiBarLen", OI_DEF.mediaBarLen), heart: fv("oi_heart"), heartFmt: fv("oiHeartFmt") || OI_DEF.heartFmt,
    hrSuffixOn: fv("oiHrSuffixOn"), hrSuffix: fv("oiHrSuffix") ?? "bpm", hrSuffixSup: fv("oiHrSuffixSup"),
    devices: fv("oi_devices"), devTrkGroup: fv("oiDevTrkGroup"), devStat: fv("oiDevStat") || "lowest",
    devHmd: fv("oiDevHmd"), devCtrl: fv("oiDevCtrl"), devTrk: fv("oiDevTrk"), devCharging: fv("oiDevCharging"),
    devToy: fv("oiDevToy"), devToyBatt: fv("oiDevToyBatt"), intiface: (fv("oiIntiface") || "").trim() || OI_DEF.intiface, intifaceRelay: num("oiRelay", OI_DEF.intifaceRelay),
    devLow: num("oiDevLow", OI_DEF.devLow), devPerLine: fv("oiDevPerLine"), devHidden: [...oiHidden()], devOff: [...oiOff()], devNames: oiNames(),
    devVibe: fv("oiDevVibe"), devVibeIcon: (fv("oiDevVibeIcon") ?? OI_DEF.devVibeIcon).slice(0, 8),
    devBattIcon: fv("oiDevBattIcon"), devBattSym: (fv("oiDevBattSym") ?? OI_DEF.devBattSym).slice(0, 8), devKindIcon: fv("oiDevKindIcon"),
    devKindSyms: Object.fromEntries(Object.keys(OI_KIND).map(k => [k, (fv("oiSym_" + k) || OI_KIND[k]).slice(0, 8)])),
    pc: fv("oi_pc"), ...Object.fromEntries(PC_ITEMS.map(k => ["pc" + oiCap(k), fv("oiPc" + oiCap(k))])), pcTemp: fv("oiPcTemp"), pcTotal: fv("oiPcTotal"),
    pcSep: $("oiPcSep")?.value ?? OI_DEF.pcSep,  // Untrimmed: the spaces around "|" matter
    pcPerLine: num("oiPcPerLine", OI_DEF.pcPerLine),
    vr: fv("oi_vr"), vrToast: fv("oiVrToast"), vrFriends: fv("oiVrFriends") || "fav", vrInvites: fv("oiVrInvites"), vrJoins: fv("oiVrJoins"),
    vrWrist: fv("oiVrWrist"), vrHand: fv("oiVrHand") || "left", vrBtn: num("oiVrBtn", OI_DEF.vrBtn), vrPanel: num("oiVrPanel", OI_DEF.vrPanel), vrKb: num("oiVrKb", OI_DEF.vrKb), vrPalm: fv("oiVrShow") === "palm", vrDist: dec("oiVrDist", OI_DEF.vrDist), vrX: dec("oiVrX", 0), vrY: dec("oiVrY", 0), vrGaze: fv("oiVrGaze"), vrInput: fv("oiVrInput") || "both",
    pcLabels: Object.fromEntries(PC_ITEMS.map(k => [k, (fv("oiPcLbl_" + k) ?? OI_DEF.pcLabels[k]).slice(0, 12)])),
    pcIcons: Object.fromEntries(PC_ITEMS.map(k => [k, (fv("oiPcIco_" + k) || OI_DEF.pcIcons[k]).slice(0, 8)])),
    ...Object.fromEntries(Object.values(PC_NAMES).map(n => [n, fv("oi" + oiCap(n))])),
    pcIcon: fv("oiPcIcon"), pcLblSup: fv("oiPcLblSup"), pcUnitSup: fv("oiPcUnitSup"),
    hrSource: fv("oiSource") || "ble", bleAddr: fv("oiBleAddr") || "", bleName: fv("oiBleName") || "",
    pulsoid: fv("oiToken") || "", hrParams: fv("oiParams"), interval: num("oiInterval", OI_DEF.interval),
    layout: [...oiLayout], icons: { ...oiIcons } };
  save();
  api("info_set", S.chatInfo);
  oiPoll();
}
let oiTimer = 0;
async function oiPoll() {
  clearTimeout(oiTimer);
  if (view !== "osc" && view !== "vr") return;
  const s = await api("info_state");
  if (s && $("oiPrev")) {
    const prev = $("oiPrev");
    prev.textContent = s.text || t("oi_previewEmpty");
    prev.classList.toggle("empty", !s.text);
    $("oiNote").textContent = !oiCfg().on ? "" : s.paused ? t("oi_paused", s.paused) : chatInGame() ? "" : t("ch_notInGame");
    $("oiMedia").textContent = s.media ? `${s.media.artist ? s.media.artist + " - " : ""}${s.media.title} (${s.media.pos} / ${s.media.dur})` : t("oi_nothing");
    $("oiHr").textContent = t(s.hr === "off" && oiCfg().hrSource === "ble" ? "oi_hr_offBle" : "oi_hr_" + s.hr, s.bpm ?? "—");
    $("oiHr").style.color = s.hr === "live" ? "var(--green)" : s.hr === "badToken" || s.hr === "error" ? "var(--red)" : s.hr === "searching" ? "var(--orange)" : "";
    oiLoginUi(s);
    oiVrUi(s.vr || { state: "off", devices: [] }, s.toys || { state: "off", devices: [] });
    oiBleUi(s);
    oiPcUi(s.pc || {});
    oiOvUi(s.overlay || {});
  }
  oiTimer = setTimeout(oiPoll, 1000);
}
// ---------- PC stats: what the app reads right now ----------
const PC_ITEMS = ["cpu", "gpu", "ram", "vram", "fps"];
const PC_NAMES = { cpu: "pcCpuName", gpu: "pcGpuName", ram: "pcRamType" };  // Item -> its "show the model / type" setting
const oiCap = k => k[0].toUpperCase() + k.slice(1);
function oiPcUi(p) {
  if (!$("oiPc")) return;
  for (const [k, v] of [["cpu", p.cpuName], ["gpu", p.gpuName], ["ram", p.ramType]]) $("oiPcName_" + k).textContent = v || "";
  const gb = (u, tot) => u == null ? "—" : `${u.toFixed(1)}${tot ? "/" + tot.toFixed(0) : ""}GB`;
  $("oiPc").textContent = [p.gpuName, `CPU ${p.cpu ?? "—"}%`, `GPU ${p.gpu ?? "—"}%${p.temp != null ? ` ${p.temp}°C` : ""}`,
    `RAM ${gb(p.ram, p.ramTotal)}`, `VRAM ${gb(p.vram, p.vramTotal)}`, `FPS ${p.fps ?? "—"}`].filter(Boolean).join(" · ");
}
// ---------- Integrate devices (SteamVR + Intiface Central): live list with battery; each one can be renamed ----------
const OI_KIND = { hmd: "🥽", ctrl: "🎮", trk: "📍", toy: "📳" };  // Defaults; the user can change them
// Small emoji box that remembers its default, and a button that puts the default back
const oiSym = (id, value, def) => `<input class="field oi-sym" id="${id}" value="${escA(value ?? "")}" data-def="${escA(def)}" maxlength="8" spellcheck="false">`;
const oiSymReset = (...ids) => `<button class="mini-btn" title="${escA(t("oi_resetIcon"))}" onclick="oiSymDefault('${ids.join("','")}')">${icon("rotate-ccw")}</button>`;
function oiSymDefault(...ids) {
  for (const id of ids) $(id).value = $(id).dataset.def;
  oiSave();
}
let oiVrKey = "";
function oiVrUi(vr, toys) {
  if (!$("oiVr")) return;
  const color = st => st === "ok" ? "var(--green)" : st === "error" ? "var(--red)" : "";
  $("oiVr").textContent = t("oi_vr_" + vr.state, vr.devices.length);
  $("oiVr").style.color = color(vr.state);
  $("oiToy").textContent = t("oi_toy_" + toys.state, toys.devices.length);
  $("oiToy").style.color = color(toys.state);
  const port = oiCfg().intifaceRelay;
  $("oiRelaySt").textContent = port ? t("oi_relay_" + (toys.relay || "off"), toys.relay === "app" ? toys.app : port) : "";
  $("oiRelaySt").style.color = toys.relay === "app" ? "var(--green)" : toys.relay === "portBusy" ? "var(--red)" : "";
  $("oiRelayHint").textContent = t("oi_relayHint", port || 12346);
  const devices = [...vr.devices, ...toys.devices];
  const key = vr.state + toys.state + devices.map(d => d.serial).join() + S.lang + JSON.stringify(oiCfg().devKindSyms);
  if (key !== oiVrKey) {  // Rebuild rows only when devices come or go
    oiVrKey = key;
    $("oiVrList").innerHTML = devices.length ? devices.map(d => `<div class="oi-vr" data-serial="${escA(d.serial)}" data-label="${escA(d.label)}">
        <label class="switch" title="${escA(t("oi_devShow"))}"><input type="checkbox" class="oi-show" ${oiOff().has(d.serial) ? "" : "checked"} onchange="oiShowToggle(this)"></label><span class="k">${esc(oiCfg().devKindSyms?.[d.kind] || OI_KIND[d.kind])}</span><span class="m"><input class="oi-name" value="${escA(oiCfg().devNames?.[d.serial] || "")}" placeholder="${escA(d.model || d.label)}" maxlength="32"
          spellcheck="false" title="${escA(t("oi_devRename"))}"><small>${esc(d.serial.replace(/^intiface:/, "Intiface · "))}</small></span>
        <span class="b"></span><button class="mini-btn oi-hide" onclick="oiHideToggle(this)"></button></div>`).join("")
      : `<span class="hint-inline">${t("oi_devNone")}</span>`;
    oiHideUi();
  }
  for (const d of devices) {
    const b = $("oiVrList").querySelector(`.oi-vr[data-serial="${CSS.escape(d.serial)}"] .b`);
    if (!b) continue;
    const vibe = d.vibe != null ? `${oiCfg().devVibeIcon || "〰️"}${d.vibe}%` : "";
    b.textContent = d.battery == null ? (vibe || t("oi_noBattery")) : `${oiCfg().devBattSym || "🔋"}${d.battery}%${d.charging ? " ⚡" : ""}${vibe ? " · " + vibe : ""}`;
    b.classList.toggle("none", d.battery == null && !vibe);
    b.classList.toggle("low", d.battery != null && d.battery <= (oiCfg().devLow ?? 20) && !d.charging);
  }
}
// Devices whose name stays out of the Chatbox (kept for devices that aren't connected right now)
let oiHiddenSet = null, oiOffSet = null;
const oiOff = () => oiOffSet ??= new Set(oiCfg().devOff || []);  // Devices left out of the Chatbox
function oiShowToggle(box) {
  const serial = box.closest(".oi-vr").dataset.serial;
  box.checked ? oiOff().delete(serial) : oiOff().add(serial);
  box.closest(".oi-vr").classList.toggle("off", !box.checked);  // The page's change handler saves
}
const oiHidden = () => oiHiddenSet ??= new Set(oiCfg().devHidden || []);
// Names you gave devices (serial -> name): the ones typed in the list, plus those of devices that aren't connected now
function oiNames() {
  const out = { ...(oiCfg().devNames || {}) };
  $("oiVrList")?.querySelectorAll(".oi-vr").forEach(r => { const v = r.querySelector(".oi-name").value.trim().slice(0, 32); if (v) out[r.dataset.serial] = v; else delete out[r.dataset.serial]; });
  return out;
}
function oiHideToggle(btn) {
  const serial = btn.closest(".oi-vr").dataset.serial, hidden = oiHidden();
  hidden.has(serial) ? hidden.delete(serial) : hidden.add(serial);
  oiHideUi();
  oiSave();
}
function oiHideUi() {
  $("oiVrList")?.querySelectorAll(".oi-vr").forEach(r => {
    const off = oiHidden().has(r.dataset.serial), btn = r.querySelector(".oi-hide");
    r.classList.toggle("anon", off);
    r.classList.toggle("off", oiOff().has(r.dataset.serial));
    btn.innerHTML = `${icon(off ? "eye-off" : "eye")}<span>${off ? r.dataset.label : t("oi_hideName")}</span>`;
    btn.title = t(off ? "oi_showName" : "oi_hideName");
  });
}
// Heart-rate source: Bluetooth device (free) or Pulsoid — only that source's rows are shown
function oiSrcUi() {
  const src = $("oiSource").value;
  $("oiSrc").innerHTML = ["ble", "pulsoid"].map(k => `<button class="${src === k ? "on" : ""}" onclick="oiSetSrc('${k}')">${t(k === "ble" ? "oi_srcBle" : "oi_srcPulsoid")}</button>`).join("");
  $("v_osc").querySelector(".oi-ble").hidden = src !== "ble";
  $("v_osc").querySelector(".oi-pulsoid").hidden = src !== "pulsoid";
}
function oiSetSrc(k) { $("oiSource").value = k; oiSrcUi(); oiSave(); }
let oiBleKey = "";
function oiBleUi(s) {
  const b = s.ble || { found: [] }, cur = $("oiBleAddr").value;
  const key = JSON.stringify([b.scanning, b.found.map(d => d.addr + d.name), cur, S.lang]);
  if (key === oiBleKey || !$("oiBle")) return;  // Redraw only when something changed, so clicks aren't lost
  oiBleKey = key;
  $("oiBle").innerHTML = `<span class="hint-inline">${cur ? esc($("oiBleName").value || cur) : t("oi_noDevice")}</span><span class="grow"></span>`
    + (b.scanning ? `<button class="btn sm" disabled>${icon("search")}${t("oi_scanning")}</button>` : btn(t("oi_findDevices"), "oiBleScan()", cur ? "sm" : "primary sm", "search"));
  $("oiBleList").innerHTML = b.found.map(d => `<div class="oi-dev">${icon("heart")}<span class="nm">${esc(d.name || d.addr)}</span>
      <span class="hint-inline">${d.rssi} dBm</span><span class="grow"></span>${d.addr === cur ? `<span class="badge">${t("oi_using")}</span>`
      : btn(t("oi_use"), `oiUseBle('${esc(d.addr)}','${esc(d.name).replace(/'/g, "")}')`, "primary sm")}</div>`).join("")
    || (oiScanned && !b.scanning ? `<div class="oi-dev hint-inline">${t("oi_noneFound")}</div>` : "");
}
let oiScanned = false;
function oiBleScan() { oiScanned = true; api("info_ble_scan"); setTimeout(oiPoll, 300); }
function oiUseBle(addr, name) {
  $("oiBleAddr").value = addr; $("oiBleName").value = name;
  if (!$("oi_heart").checked) $("oi_heart").checked = true;
  oiSave();
}
// Pulsoid sign-in: Python runs the device flow; when it hands back a token it's saved like a pasted one
let oiLoginKey = "";
function oiLoginUi(s) {
  const lg = s.login || {}, has = !!oiCfg().pulsoid;
  if (lg.state === "done" && lg.token) {
    $("oiToken").value = lg.token;
    api("pulsoid_login_cancel");
    oiSave();
    toast(t("oi_signedIn"));
    return;
  }
  const key = [s.canLogin, lg.state, has, S.lang].join();
  if (key === oiLoginKey || !$("oiLogin")) return;  // Redraw only when something changed, so clicks aren't lost
  oiLoginKey = key;
  const signIn = btn(t("oi_signIn"), "oiLogin()", "primary sm", "heart");
  const note = (k, col = "var(--text2)") => `<span class="hint-inline" style="color:${col}">${t(k)}</span>`;
  $("oiLogin").innerHTML = !s.canLogin ? `<button class="btn primary sm" disabled>${icon("heart")}${t("oi_signIn")}</button>${note("oi_noClient")}`
    : lg.state === "waiting" ? `${note("oi_waiting", "var(--orange)")}${lg.url ? btn(t("oi_reopen"), `api('open_url','${esc(lg.url)}')`, "sm", "external-link") : ""}
        ${btn(t("cancel"), "api('pulsoid_login_cancel')", "sm")}`
    : has ? `${note("oi_signedIn", "var(--green)")}${btn(t("oi_signOut"), "$('oiToken').value='';oiSave()", "sm", "log-out")}`
    : signIn + (["denied", "expired", "error"].includes(lg.state) ? note("oi_login_" + lg.state, "var(--red)") : "");
}
async function oiLogin() {
  if (!$("oi_heart").checked) { $("oi_heart").checked = true; oiSave(); }
  const r = await api("pulsoid_login");
  if (r?.error) toast(t("oi_login_error"));
  oiPoll();
}
VIEW_RENDER.osc = VIEW_RENDER.vr = () => renderOsc();
// Hand the saved settings to Python once the app has started, so sending works without opening this page
(function oiStart() { if (!ready) return setTimeout(oiStart, 300); api("info_set", oiCfg()); })();
document.head.insertAdjacentHTML("beforeend", `<style>
.oi-card { padding: 4px 14px; }
.oi-tabs { margin: 14px 0 2px; }
.oi-vr-list { display: grid; gap: 6px; }
.oi-sym { width: 52px; text-align: center; padding-left: 4px; padding-right: 4px; }
.oi-vr { display: grid; grid-template-columns: auto 26px minmax(0, 1fr) auto 140px; align-items: center; gap: 10px; padding: 6px 8px;
         border-radius: 10px; background: var(--track); }
.oi-vr .k { font-size: 17px; text-align: center; }
.oi-vr .m { display: flex; flex-direction: column; min-width: 0; }
.oi-vr .m b { font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.oi-vr .m .oi-name { font: 600 12.5px var(--font); color: var(--text); background: none; border: 1px solid transparent; border-radius: 6px;
                     padding: 1px 6px; margin-left: -7px; min-width: 0; text-overflow: ellipsis; }
.oi-vr .m .oi-name::placeholder { color: var(--text); opacity: 1; }
.oi-vr .m .oi-name:hover { border-color: var(--sep); }
.oi-vr .m .oi-name:focus { outline: none; border-color: var(--accent); background: var(--field, rgba(127,127,127,.08)); }
.oi-vr .m .oi-name:focus::placeholder { color: var(--text3); }
.oi-vr .m small { font: 10.5px var(--mono); color: var(--text3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.oi-vr .b { font: 600 12.5px var(--mono); }
.oi-vr .b.low { color: var(--red); }
.oi-vr .b.none { font: 11.5px var(--font); color: var(--text3); }
.oi-vr .oi-hide { justify-self: end; display: inline-flex; align-items: center; gap: 5px; width: auto; padding: 0 9px; font-size: 12px; }
.oi-vr.off > :not(.switch) { opacity: .45; }
.oi-vr.anon .m b { text-decoration: line-through; color: var(--text3); }
.oi-top { padding: 12px 14px 4px; }
.oi-top .oi-prev { margin-top: 0; }
.oi-sec[data-tab="overall"] .card { margin-top: 8px; }
.oi-supt { border: none; border-radius: 6px; background: none; color: var(--text3); font-size: 13px; padding: 2px 5px; cursor: pointer; }
.oi-supt:hover { background: var(--hover); }
.oi-supt.on { background: var(--accent); color: #fff; }
.oi-lay-head { display: flex; align-items: center; gap: 8px; margin: 2px 0 8px; font-size: 12.5px; flex-wrap: wrap; }
.oi-lay-head .grow { flex: 1; }
.oi-lay { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 10px; margin-bottom: 12px; border-radius: 12px;
          border: 1px dashed var(--sep); min-height: 40px; }
.oi-chip { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px 0 6px; border-radius: 10px; background: var(--card);
           border: 1px solid var(--sep); font-size: 12.5px; cursor: grab; touch-action: none; user-select: none; }
.oi-chip.drag { cursor: grabbing; opacity: .6; box-shadow: var(--shadow); }
.oi-chip.off { opacity: .45; }
.oi-chip svg { width: 13px; height: 13px; }
.oi-chip.br, .oi-chip.sep { background: var(--track); padding: 0 4px 0 8px; color: var(--text2); }
.oi-chip.text { padding: 0 4px 0 8px; color: var(--text2); border-style: dashed; }
.oi-chip.text input { border: none; background: none; color: var(--text); font: 13px var(--font); padding: 0; outline: none; min-width: 6ch; }
.oi-chip.text input::placeholder { color: var(--text3); }
.oi-chip.sep input { border: none; background: none; color: var(--text); font: 600 13px var(--mono); text-align: center; padding: 0; outline: none; min-width: 1.5ch; }
.oi-break { flex-basis: 100%; height: 0; }
.oi-emo { width: 24px; height: 24px; border: none; border-radius: 7px; background: var(--track); font-size: 15px; line-height: 1; padding: 0;
          display: grid; place-items: center; cursor: pointer; color: var(--text2); }
.oi-emo:hover { background: var(--hover); }
.oi-x { border: none; background: none; color: var(--text3); padding: 2px; display: grid; place-items: center; cursor: pointer; border-radius: 6px; }
.oi-x:hover { color: var(--red); background: var(--hover); }
.oi-emo-pop { position: fixed; z-index: 50; padding: 10px; border-radius: 14px; width: 264px; background: var(--sheet); backdrop-filter: blur(30px) saturate(180%);
               border: 1px solid var(--sep); box-shadow: var(--shadow), 0 10px 30px rgba(0,0,0,.25); }
.oi-emo-pop .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 8px; }
.oi-emo-pop .grid button { height: 32px; border: none; border-radius: 8px; background: none; font-size: 18px; cursor: pointer; padding: 0; min-width: 0; }
.oi-emo-pop .grid button:hover { background: var(--hover); }
.oi-emo-pop .grid .none { grid-column: span 7; font-size: 12px; color: var(--text2); background: var(--track); }
.oi-tabs .segmented button { display: inline-flex; align-items: center; gap: 6px; padding-left: 12px; padding-right: 12px; }
.oi-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text3); opacity: .5; }
.oi-dot.on { background: var(--green); opacity: 1; }
.oi-sec .sec-head:first-child { margin-top: 8px; }
.oi-prev { margin: 4px 0 10px; padding: 12px 14px; border-radius: 12px; background: var(--track); text-align: center; white-space: pre-wrap;
           font-size: 14px; line-height: 1.5; min-height: 22px; }
.oi-prev.empty { color: var(--text3); font-size: 12.5px; }
.oi-note { font-size: 11.5px; color: var(--orange); text-align: center; margin: -4px 0 8px; }
.oi-note:empty { display: none; }
.oi-token { display: flex; gap: 8px; align-items: center; }
.oi-token .field { flex: 1; min-width: 0; }
.oi-token .grow { flex: 1; }
.oi-src { width: fit-content; }
.oi-dev { display: flex; align-items: center; gap: 8px; padding: 6px 2px 6px 166px; font-size: 12.5px; }
.oi-dev svg { width: 14px; height: 14px; color: var(--red); flex-shrink: 0; }
.oi-dev .nm { font-weight: 600; }
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

// ---------- VRChat log folder (for people who moved it) ----------
tx({
  ld_title: ["โฟลเดอร์ Cache ของ VRChat", "VRChat cache folder", "VRChat のキャッシュフォルダ"],
  ld_default: ["ค่าเริ่มต้น", "Default", "既定"],
  ld_none: ["ยังไม่พบไฟล์ log ในโฟลเดอร์นี้ — เปิด VRChat ก่อน หรือเลือกโฟลเดอร์ที่ย้ายไว้", "No logs here yet — start VRChat, or pick the folder you moved it to",
    "ここにログがありません — VRChat を起動するか、移動先のフォルダを選んでください"],
  ld_pick: ["เปลี่ยน", "Change", "変更"], ld_reset: ["ใช้ค่าเริ่มต้น", "Use default", "既定に戻す"],
  ld_set: ["เปลี่ยนโฟลเดอร์ log แล้ว", "Log folder changed", "ログフォルダを変更しました"],
});
Object.assign(UPD_I18N.ko, { ld_title: "VRChat 캐시 폴더", ld_default: "기본값", ld_none: "아직 로그가 없습니다 — VRChat을 실행하거나 옮긴 폴더를 선택하세요",
  ld_pick: "변경", ld_reset: "기본값 사용", ld_set: "로그 폴더를 변경했습니다" });
Object.assign(UPD_I18N.ru, { ld_title: "Папка кэша VRChat", ld_default: "По умолчанию", ld_none: "Логов пока нет — запустите VRChat или выберите папку, куда вы их перенесли",
  ld_pick: "Изменить", ld_reset: "По умолчанию", ld_set: "Папка логов изменена" });
Object.assign(UPD_I18N.vi, { ld_title: "Thư mục cache VRChat", ld_default: "Mặc định", ld_none: "Chưa có log ở đây — hãy mở VRChat hoặc chọn thư mục bạn đã chuyển tới",
  ld_pick: "Đổi", ld_reset: "Dùng mặc định", ld_set: "Đã đổi thư mục log" });
Object.assign(UPD_I18N.zh, { ld_title: "VRChat 缓存文件夹", ld_default: "默认", ld_none: "这里还没有日志 —— 请启动 VRChat，或选择你移动到的文件夹",
  ld_pick: "更改", ld_reset: "恢复默认", ld_set: "已更改日志文件夹" });

let LOGDIR = null;
async function ldRefresh() { LOGDIR = await api("log_dir_info"); if (settingsOpen) buildSettings(); }
async function ldPick() {
  const p = await api("pick_log_dir");
  if (!p) return;
  setS("logDir", p);
  toast(t("ld_set"));
  ldRefresh();
}
async function ldReset() { await api("set_log_dir", ""); setS("logDir", ""); ldRefresh(); }
const _buildSettingsL = buildSettings;
buildSettings = function () {
  _buildSettingsL();
  if (settingsView !== "main" || !LOGDIR) return;
  const anchor = [...$("sheet").querySelectorAll(".sec-title")].find(el => el.textContent === t("data"));
  const card = anchor?.nextElementSibling;
  if (!card) return;
  const hint = `<span class="ld-path">${esc(LOGDIR.path)}</span>${LOGDIR.found ? "" : `<br><span class="ld-warn">${t("ld_none")}</span>`}`;
  card.insertAdjacentHTML("afterbegin", srow("folder-open", "blue", LOGDIR.custom ? t("ld_title") : `${t("ld_title")} · ${t("ld_default")}`,
    `<div class="ld-btns">${LOGDIR.custom ? `<button class="btn" onclick="ldReset()">${t("ld_reset")}</button>` : ""}
     <button class="btn" onclick="api('open_folder')">${t("open")}</button>
     <button class="btn" onclick="ldPick()">${t("ld_pick")}</button></div>`, hint));
};
const _resetAllL = resetAll;
resetAll = function () { _resetAllL(); if (!S.logDir && LOGDIR?.custom) api("set_log_dir", "").then(ldRefresh); };
window.addEventListener("pywebviewready", ldRefresh);
document.head.insertAdjacentHTML("beforeend", `<style>
.ld-path { word-break: break-all; }
.ld-warn { color: var(--orange, #ff9f0a); }
.ld-btns { display: flex; gap: 6px; flex-shrink: 0; }
</style>`);

Object.assign(UPD_I18N.ko, { a_vpBlocked: p => `이 아바타는 퍼포먼스 때문에 기본적으로 차단됩니다 (${p}). 대신 폴백 아바타가 표시됩니다.` });
Object.assign(UPD_I18N.ru, { a_vpBlocked: p => `Этот аватар по умолчанию блокируется из-за производительности (${p}). Вместо него будет показан запасной.` });
Object.assign(UPD_I18N.vi, { a_vpBlocked: p => `Avatar này sẽ bị chặn mặc định do hiệu năng (${p}). Avatar dự phòng của bạn sẽ được hiển thị thay thế.` });
Object.assign(UPD_I18N.zh, { a_vpBlocked: p => `此模型因性能问题默认会被屏蔽 (${p})。将改为显示你的备用模型。` });
document.head.insertAdjacentHTML("beforeend", `<style>
.perf-warn { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; margin-bottom: 10px; border-radius: 10px;
             background: color-mix(in srgb, var(--red) 12%, transparent); color: var(--text); font-size: 13px; line-height: 1.4; }
.perf-warn svg { width: 18px; height: 18px; flex-shrink: 0; color: var(--red); margin-top: 1px; }
</style>`);

// ======================= Owned groups: create / delete, invite or ban anyone, roles order, images, new instance =======================
tx({
  gt_owned: ["ที่เป็นเจ้าของ", "Owned", "オーナー"], g_owner: ["เจ้าของ", "Owner", "オーナー"],
  g_create: ["สร้างกลุ่ม", "Create group", "グループを作成"],
  g_createHint: ["ต้องมี VRChat+ และ VRChat จำกัดจำนวนกลุ่มที่เป็นเจ้าของได้", "Needs VRChat+. VRChat limits how many groups you can own.", "VRChat+ が必要です。オーナーになれるグループ数には上限があります。"],
  g_shortCode: ["ชื่อย่อ", "Short code", "ショートコード"], g_shortHint: ["3–6 ตัวอักษร A–Z / 0–9", "3–6 letters or digits", "英数字 3〜6 文字"],
  g_created: ["สร้างกลุ่มแล้ว", "Group created", "グループを作成しました"],
  g_privacy: ["การค้นหา", "Search", "検索"], g_pv_default: ["แสดงในผลการค้นหา", "Shown in search", "検索に表示"],
  g_pv_private: ["ไม่แสดงในผลการค้นหา", "Hidden from search", "検索に表示しない"],
  g_icon: ["ไอคอน", "Icon", "アイコン"], g_banner: ["แบนเนอร์", "Banner", "バナー"], g_pickImage: ["เลือกรูป", "Choose", "選択"],
  g_pickHint: ["อัปโหลดรูปในหน้าคลังของก่อน (ไอคอน / รูปภาพ)", "Upload on the Inventory page first (Icons / Photos)", "先にインベントリ (アイコン / 写真) にアップロードしてください"],
  g_inviteUser: ["เชิญผู้ใช้", "Invite a user", "ユーザーを招待"], g_banUser: ["แบนผู้ใช้", "Ban a user", "ユーザーを BAN"],
  g_userPh: ["ชื่อผู้ใช้ หรือ usr_…", "Name or usr_…", "名前または usr_…"],
  g_blockedReq: ["คำขอที่บล็อกไว้", "Blocked", "ブロック済み"], g_allRoles: ["ทุกบทบาท", "All roles", "すべてのロール"],
  g_allTypes: ["ทุกประเภท", "All types", "すべての種類"], g_up: ["เลื่อนขึ้น", "Move up", "上へ"], g_down: ["เลื่อนลง", "Move down", "下へ"],
  g_newInst: ["สร้างห้องกลุ่ม", "New group instance", "グループインスタンスを作成"], g_pickWorld: ["เลือกโลก", "Pick a world", "ワールドを選択"],
  g_worldPh: ["wrld_… หรือลิงก์โลก", "wrld_… or a world link", "wrld_… またはワールドのリンク"], g_recentWorlds: ["โลกที่ไปล่าสุด", "Recent worlds", "最近のワールド"],
  g_danger: ["โซนอันตราย", "Danger zone", "危険な操作"], g_delete: ["ลบกลุ่ม", "Delete group", "グループを削除"],
  g_deleteHint: ["ลบถาวร ย้อนกลับไม่ได้ พิมพ์ชื่อกลุ่มให้ตรงเพื่อยืนยัน", "Permanent. Type the group name to confirm.", "元に戻せません。確認のためグループ名を入力してください。"],
  g_deleteMismatch: ["ชื่อกลุ่มไม่ตรง", "The name doesn't match", "名前が一致しません"], g_deleted: ["ลบกลุ่มแล้ว", "Group deleted", "グループを削除しました"],
});
Object.assign(UPD_I18N.ko, { gt_owned: "소유", g_owner: "소유자", g_create: "그룹 만들기", g_createHint: "VRChat+가 필요합니다. 소유할 수 있는 그룹 수에는 제한이 있습니다.",
  g_shortCode: "짧은 코드", g_shortHint: "영문/숫자 3–6자", g_created: "그룹을 만들었습니다", g_privacy: "검색", g_pv_default: "검색에 표시", g_pv_private: "검색에 표시 안 함",
  g_icon: "아이콘", g_banner: "배너", g_pickImage: "선택", g_pickHint: "먼저 인벤토리(아이콘 / 사진)에 업로드하세요", g_inviteUser: "사용자 초대", g_banUser: "사용자 차단(밴)",
  g_userPh: "이름 또는 usr_…", g_blockedReq: "차단됨", g_allRoles: "모든 역할", g_allTypes: "모든 유형", g_up: "위로", g_down: "아래로",
  g_newInst: "그룹 인스턴스 만들기", g_pickWorld: "월드 선택", g_worldPh: "wrld_… 또는 월드 링크", g_recentWorlds: "최근 월드",
  g_danger: "위험 구역", g_delete: "그룹 삭제", g_deleteHint: "되돌릴 수 없습니다. 확인을 위해 그룹 이름을 입력하세요.", g_deleteMismatch: "이름이 일치하지 않습니다", g_deleted: "그룹을 삭제했습니다" });
Object.assign(UPD_I18N.ru, { gt_owned: "Мои (владелец)", g_owner: "Владелец", g_create: "Создать группу", g_createHint: "Нужен VRChat+. Число групп, которыми можно владеть, ограничено.",
  g_shortCode: "Короткий код", g_shortHint: "3–6 букв или цифр", g_created: "Группа создана", g_privacy: "Поиск", g_pv_default: "Показывать в поиске", g_pv_private: "Скрыть из поиска",
  g_icon: "Иконка", g_banner: "Баннер", g_pickImage: "Выбрать", g_pickHint: "Сначала загрузите в Инвентарь (Иконки / Фото)", g_inviteUser: "Пригласить пользователя", g_banUser: "Забанить пользователя",
  g_userPh: "Имя или usr_…", g_blockedReq: "Заблокированные", g_allRoles: "Все роли", g_allTypes: "Все типы", g_up: "Выше", g_down: "Ниже",
  g_newInst: "Новая инстанция группы", g_pickWorld: "Выберите мир", g_worldPh: "wrld_… или ссылка на мир", g_recentWorlds: "Недавние миры",
  g_danger: "Опасная зона", g_delete: "Удалить группу", g_deleteHint: "Навсегда. Введите название группы для подтверждения.", g_deleteMismatch: "Название не совпадает", g_deleted: "Группа удалена" });
Object.assign(UPD_I18N.vi, { gt_owned: "Sở hữu", g_owner: "Chủ sở hữu", g_create: "Tạo nhóm", g_createHint: "Cần VRChat+. VRChat giới hạn số nhóm bạn có thể sở hữu.",
  g_shortCode: "Mã ngắn", g_shortHint: "3–6 chữ hoặc số", g_created: "Đã tạo nhóm", g_privacy: "Tìm kiếm", g_pv_default: "Hiện trong tìm kiếm", g_pv_private: "Ẩn khỏi tìm kiếm",
  g_icon: "Biểu tượng", g_banner: "Ảnh bìa", g_pickImage: "Chọn", g_pickHint: "Tải lên ở trang Kho đồ trước (Biểu tượng / Ảnh)", g_inviteUser: "Mời người dùng", g_banUser: "Cấm người dùng",
  g_userPh: "Tên hoặc usr_…", g_blockedReq: "Đã chặn", g_allRoles: "Mọi vai trò", g_allTypes: "Mọi loại", g_up: "Lên", g_down: "Xuống",
  g_newInst: "Tạo phòng nhóm", g_pickWorld: "Chọn thế giới", g_worldPh: "wrld_… hoặc liên kết thế giới", g_recentWorlds: "Thế giới gần đây",
  g_danger: "Vùng nguy hiểm", g_delete: "Xóa nhóm", g_deleteHint: "Vĩnh viễn. Nhập tên nhóm để xác nhận.", g_deleteMismatch: "Tên không khớp", g_deleted: "Đã xóa nhóm" });
Object.assign(UPD_I18N.zh, { gt_owned: "我拥有的", g_owner: "所有者", g_create: "创建群组", g_createHint: "需要 VRChat+。可拥有的群组数量有上限。",
  g_shortCode: "短代码", g_shortHint: "3–6 个字母或数字", g_created: "已创建群组", g_privacy: "搜索", g_pv_default: "在搜索中显示", g_pv_private: "不在搜索中显示",
  g_icon: "图标", g_banner: "横幅", g_pickImage: "选择", g_pickHint: "请先在物品栏（图标 / 照片）上传", g_inviteUser: "邀请用户", g_banUser: "封禁用户",
  g_userPh: "名称或 usr_…", g_blockedReq: "已屏蔽", g_allRoles: "所有角色", g_allTypes: "所有类型", g_up: "上移", g_down: "下移",
  g_newInst: "创建群组房间", g_pickWorld: "选择世界", g_worldPh: "wrld_… 或世界链接", g_recentWorlds: "最近的世界",
  g_danger: "危险操作", g_delete: "删除群组", g_deleteHint: "永久删除，无法恢复。请输入群组名称以确认。", g_deleteMismatch: "名称不一致", g_deleted: "已删除群组" });

function gReqTab(v) { GX.reqBlocked = v === "blocked"; delete CACHE.g_req; buildGroup(); gLoad(true); }

// Search any VRChat user (or paste usr_…) to invite or ban
function gUserPicker(mode) {
  let q = "", res = null, busy = false;
  const run = async () => {
    q = fv("gupq") || "";
    if (!q) return;
    const id = q.match(/usr_[\w-]+/)?.[0];
    if (id) { res = [{ id, displayName: id }]; return buildX(); }
    busy = true; buildX();
    const r = await vrc("searchUsers", { search: q, n: 20 });
    busy = false;
    res = r.ok || [];
    if (r.error) apiError(r);
    buildX();
  };
  window._gupRun = run;
  openX(t(mode === "ban" ? "g_banUser" : "g_inviteUser"), () => `<input class="field" id="gupq" placeholder="${t("g_userPh")}" value="${escA(q)}" style="margin-bottom:10px">
    ${busy ? `<div class="empty-state" style="height:80px">${t("loading")}</div>` : !res ? "" : !res.length ? `<div class="empty-state" style="height:80px">${t("noResults")}</div>`
      : res.map(u => lrow({ uid: u.id, name: u.displayName, sub: "", acts: mode === "ban"
        ? `<button class="btn sm danger" onclick="confirmBtn(this,()=>gDo('banGroupMember',{userId:'${esc(u.id)}'},'done','g_bans'))">${icon("ban")}${t("g_ban")}</button>`
        : btn(t("inv_send"), `gDo('createGroupInvite',{userId:'${esc(u.id)}'},'g_invited','g_inv')`, "primary sm", "send") })).join("")}`,
  () => { const i = $("gupq"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); i.onkeydown = e => { if (e.key === "Enter") _gupRun(); }; });
}

// Swap a role with its neighbour (VRChat orders roles by "order")
async function gMoveRole(rid, dir) {
  const roles = [...(groupOpen.roles || [])].sort((x, y) => (x.order ?? 0) - (y.order ?? 0));
  const i = roles.findIndex(r => r.id === rid), j = i + dir;
  if (i < 0 || !roles[j]) return;
  const a = roles[i], b = roles[j];
  const oa = a.order ?? i, ob = b.order ?? j;
  if ((await vrcDo("updateGroupRole", { groupId: groupOpen.id, groupRoleId: a.id, order: ob === oa ? ob + dir : ob })) === undefined) return;
  if ((await vrcDo("updateGroupRole", { groupId: groupOpen.id, groupRoleId: b.id, order: oa }, "saved")) === undefined) return;
  openGroupKeepTab();
}

// Icon from the Icons inventory, banner from Photos — saved with the rest of the edit form
async function gPickImage(kind) {
  const tab = kind === "icon" ? "icon" : "gallery";
  if (!INV.data[tab]) await loadInv(tab);
  openX(t(kind === "icon" ? "g_icon" : "g_banner"), () => `<div class="igrid ${kind === "icon" ? "" : "photos"}">${(INV.data[tab] || []).map(f =>
    `<div class="itile" onclick="gSetImage('${kind}','${esc(f.id)}','${escA(f.url)}')"><div class="iimg" ${thumbAttr(f.url)}></div></div>`).join("")
    || `<div class="empty-state" style="height:100px">${t("g_pickHint")}</div>`}</div>`, null, true);
}
function gSetImage(kind, id, url) {
  // Keep what's typed in the edit form across the re-render
  const keep = ["geName", "geDesc", "geRules", "geLinks", "geJoin", "gePriv"].map(k => [k, $(k)?.value]);
  GX[kind === "icon" ? "newIcon" : "newBanner"] = { id, url };
  closeX(); buildGroup();
  for (const [k, v] of keep) if ($(k) && v != null) $(k).value = v;
}

async function gDeleteGroup() {
  if (fv("geDelName") !== groupOpen.name) return toast(t("g_deleteMismatch"));
  if ((await vrcDo("deleteGroup", { groupId: groupOpen.id }, "g_deleted")) === undefined) return;
  closeProfile();
  GRP.mine = null;
  loadGroups(true);
}

function gCreateDialog() {
  openX(t("g_create"), () => `<div class="pcard-note" style="margin:0 0 10px">${t("g_createHint")}</div>
    ${fRow(t("name"), fInput("gcName"))}
    ${fRow(t("g_shortCode"), fInput("gcCode", "", `maxlength="6" style="text-transform:uppercase"`), t("g_shortHint"))}
    ${fRow(t("desc"), fArea("gcDesc", "", 3))}
    ${fRow(t("g_joinState"), fSelect("gcJoin", { open: t("g_js_open"), request: t("g_js_request"), invite: t("g_js_invite"), closed: t("g_js_closed") }, "request"))}
    ${fRow(t("g_privacy"), fSelect("gcPriv", { default: t("g_pv_default"), private: t("g_pv_private") }, "default"))}
    <div class="form-actions">${btn(t("create"), "gCreate()", "primary", "circle-plus")}</div>`);
}
async function gCreate() {
  const name = fv("gcName"), shortCode = (fv("gcCode") || "").toUpperCase();
  if (!name || !/^[A-Z0-9]{3,6}$/.test(shortCode)) return toast(t("g_shortHint"));
  const r = await vrcDo("createGroup", { name, shortCode, description: fv("gcDesc"), joinState: fv("gcJoin"), privacy: fv("gcPriv"), roleTemplate: "default" }, "g_created");
  if (!r) return;
  closeX();
  GRP.mine = null;
  loadGroups(true);
  if (r.id) openGroup(r);
}

// Pick a world (recent ones or a pasted ID / link), then reuse the instance dialog preset to this group
async function gNewInstance() {
  const gid = groupOpen.id;
  const hist = await api("history") || [];
  const seen = new Set(), recent = [];
  for (const v of hist) {
    const wid = (v.loc || "").split(":")[0];
    if (wid.startsWith("wrld_") && !seen.has(wid)) { seen.add(wid); recent.push({ wid, name: v.name }); }
    if (recent.length >= 12) break;
  }
  openX(t("g_pickWorld"), () => `<div class="toolbar"><input class="field grow" id="gnwq" placeholder="${t("g_worldPh")}">${btn("›", "gNewInstanceGo(fv('gnwq'))", "primary sm")}</div>
    ${recent.length ? `<div class="pcard-section"><div class="lbl">${t("g_recentWorlds")}</div>${recent.map(w =>
      lrow({ thumb: "", name: w.name, sub: "", onclick: `gNewInstanceGo('${esc(w.wid)}')` }).replace('<span class="lthumb" ></span>', "")).join("")}</div>` : ""}`,
  () => { $("gnwq").onkeydown = e => { if (e.key === "Enter") gNewInstanceGo($("gnwq").value); }; });
  window._gniGroup = gid;
}
async function gNewInstanceGo(text) {
  const wid = (text || "").match(/wrld_[\w-]+/)?.[0];
  if (!wid) return toast(t("g_worldPh"));
  const gid = window._gniGroup;
  if (!GRP.mine) await loadGroups();
  closeX();
  createInstanceDialog(wid);
  const set = () => { if (!$("ciType")) return; $("ciType").value = "group"; $("ciGrp").value = gid; $("ciType").onchange(); };
  set();
  const _after = X.after;
  X.after = () => { _after?.(); set(); };
}

document.head.insertAdjacentHTML("beforeend", `<style>
.g-imgpick { display: flex; align-items: center; gap: 10px; }
.g-imgpick .gicon { position: static; width: 48px; height: 48px; margin: 0; border-width: 0; }
.g-banner { width: 160px; height: 54px; border-radius: 8px; background: var(--track) center / cover no-repeat; }
.g-danger { margin-top: 18px; padding-top: 12px; border-top: 1px solid color-mix(in srgb, var(--red) 35%, transparent); }
.g-danger .lbl { color: var(--red); }
.badge.owner { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
               background: color-mix(in srgb, var(--orange) 18%, transparent); color: var(--orange); }
.badge.owner svg { width: 12px; height: 12px; }
</style>`);

// ---------- Groups you can manage (one request: permissions for every group) ----------
tx({
  g_canManage: ["กลุ่มที่จัดการได้", "Groups you can manage", "管理できるグループ"], g_manager: ["ผู้จัดการ", "Manager", "管理者"],
  g_repShort: ["แสดงบนโปรไฟล์", "Representing", "代表中"], g_reqPending: ["รออนุมัติ", "Pending", "保留中"],
});
Object.assign(UPD_I18N.ko, { g_canManage: "관리할 수 있는 그룹", g_manager: "관리자", g_repShort: "대표 그룹", g_reqPending: "대기 중" });
Object.assign(UPD_I18N.ru, { g_canManage: "Группы, которыми вы управляете", g_manager: "Управляющий", g_repShort: "Представляю", g_reqPending: "Ожидают" });
Object.assign(UPD_I18N.vi, { g_canManage: "Nhóm bạn có thể quản lý", g_manager: "Quản lý", g_repShort: "Đang đại diện", g_reqPending: "Đang chờ" });
Object.assign(UPD_I18N.zh, { g_canManage: "可管理的群组", g_manager: "管理员", g_repShort: "代表中", g_reqPending: "待处理" });
const permName = p => typeof p === "string" ? p : p?.name || "";
// Same rule as the group card's "Manage" tab: any management-type permission counts
const gCanManage = perms => (perms || []).map(permName).some(p => p === "*" || G_MANAGE_PERMS.includes(p));
async function gLoadPerms() {
  if (GRP.permsLoading) return;
  GRP.permsLoading = true;
  const r = await vrc("getMyGroupPermissions");
  GRP.permsLoading = false;
  GRP.perms = r.ok && typeof r.ok === "object" ? r.ok : {};
  if (r.error) apiError(r);
  if (view === "groups") renderView();
}
const _loadGroupsP = loadGroups;
loadGroups = async function (force) { if (force) GRP.perms = null; return _loadGroupsP(force); };
document.head.insertAdjacentHTML("beforeend", `<style>
.gpill { display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 13px; border-radius: 99px; white-space: nowrap;
         font: 600 12.5px var(--font); background: var(--track); color: var(--text2); }
.gpill svg { width: 14px; height: 14px; flex-shrink: 0; }
.gpill.member { background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent); }
.gpill.owner { background: color-mix(in srgb, var(--orange) 18%, transparent); color: var(--orange); }
.gpill.admin { background: color-mix(in srgb, var(--indigo, #5e5ce6) 16%, transparent); color: var(--indigo, #5e5ce6); }
.gpill.rep { background: color-mix(in srgb, var(--yellow) 22%, transparent); color: color-mix(in srgb, var(--yellow) 70%, var(--text)); }
.pact .btn.icon-only { width: 30px; height: 30px; padding: 0; justify-content: center; }
</style>`);
document.head.insertAdjacentHTML("beforeend", `<style>
.badge.owner.admin { background: color-mix(in srgb, var(--indigo) 16%, transparent); color: var(--indigo); }
.gcard .badge.owner { margin: 0 0 0 2px; padding: 2px 6px; vertical-align: 1px; }
</style>`);

document.head.insertAdjacentHTML("beforeend", `<style>
.gadm { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 18px; margin-top: 12px; text-align: left; }
.gadm-nav { display: flex; flex-direction: column; gap: 2px; padding-right: 14px; border-right: 1px solid var(--sep, rgba(128,128,128,.18)); }
.gadm-nav button { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border: none; border-radius: 9px; background: none;
                   color: var(--text); font: 500 13px var(--font); text-align: left; cursor: pointer; }
.gadm-nav button:hover { background: var(--track); }
.gadm-nav button.on { background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--accent); font-weight: 600; }
.gadm-nav svg { width: 16px; height: 16px; flex-shrink: 0; }
.gadm-head { display: flex; align-items: center; gap: 8px; min-height: 32px; margin-bottom: 10px; flex-wrap: wrap; }
.gadm-head h4 { margin: 0; font-size: 15px; font-weight: 700; }
.gadm-head .field.sm { width: auto; padding: 5px 10px; font-size: 12px; }
.segmented.sm button { padding: 4px 12px; font-size: 12px; }
@media (max-width: 720px) {
  .gadm { grid-template-columns: 1fr; gap: 10px; }
  .gadm-nav { flex-direction: row; overflow-x: auto; padding: 0 0 8px; border-right: none; border-bottom: 1px solid var(--sep, rgba(128,128,128,.18)); }
  .gadm-nav button { white-space: nowrap; }
}
</style>`);

// ======================= Image cropper: Photos / Icons upload, group banner guide =======================
// VRChat: file < 10 MB, at least 64×64, anything above 2048 px gets scaled — we export within those limits
tx({
  cr_title: ["ครอปและอัปโหลด", "Crop & upload", "切り抜いてアップロード"], cr_original: ["ต้นฉบับ", "Original", "元の比率"],
  cr_banner: ["ปกกลุ่ม 16:9", "Group banner 16:9", "グループバナー 16:9"], cr_square: ["จัตุรัส 1:1", "Square 1:1", "正方形 1:1"],
  cr_zoom: ["ซูม", "Zoom", "ズーム"], cr_guide: ["เส้นแนว", "Guide", "ガイド"], cr_reset: ["รีเซ็ต", "Reset", "リセット"],
  cr_hint: ["ลากเพื่อเลื่อน · ล้อเมาส์เพื่อซูม", "Drag to move · scroll to zoom", "ドラッグで移動・ホイールでズーム"],
  cr_preview: ["ตัวอย่าง", "Preview", "プレビュー"], cr_out: [(w, h) => `จะอัปโหลดขนาด ${w}×${h}`, (w, h) => `Uploads at ${w}×${h}`, (w, h) => `${w}×${h} でアップロード`],
  cr_nameplate: ["ป้ายชื่อ (แบบสั้น) · แสดงเสมอ", "Nameplate (short) · always shown", "ネームプレート(ショート)・常に表示"],
  cr_expanded: ["ป้ายชื่อ (แบบขยาย/ชื่อยาว) · แสดงเสมอ", "Nameplate (expanded / long name) · always shown", "ネームプレート(展開/長い名前)・常に表示"],
  cr_sometimes: ["แบนเนอร์กลุ่ม", "Group banner", "グループバナー"], cr_never: ["ไม่แสดง", "Never shown", "表示されない"],
  cr_full: ["ทั้งภาพ", "Full image", "全体"], cr_iconLarge: ["โปรไฟล์", "Profile", "プロフィール"], cr_iconSmall: ["รายชื่อ", "List", "リスト"],
  cr_tooBig: ["ไฟล์ต้องเล็กกว่า 10 MB", "The file must be under 10 MB", "10 MB 未満のファイルにしてください"],
  cr_tooSmall: ["รูปต้องใหญ่กว่า 64×64 พิกเซล", "The image must be larger than 64×64 pixels", "64×64 ピクセルより大きい画像にしてください"],
  cr_cropSmall: ["ส่วนที่ครอปเล็กกว่า 64×64 — ซูมออกหน่อย", "The crop is under 64×64 — zoom out a bit", "切り抜きが 64×64 未満です — 少しズームアウトしてください"],
  cr_uploadNew: ["อัปโหลดใหม่", "Upload new", "新しくアップロード"], cr_plate: ["ป้ายชื่อ", "Nameplate", "ネームプレート"],
  cr_long: ["แบบยาว", "Long", "ロング"], cr_short: ["แบบสั้น", "Short", "ショート"],
  cr_compact: ["แบนเนอร์กลุ่ม(Compact)", "Group banner (Compact)", "グループバナー(Compact)"],
});
Object.assign(UPD_I18N.ko, { cr_compact: "그룹 배너(Compact)", cr_long: "긴", cr_short: "짧은", cr_plate: "이름표", cr_title: "자르고 업로드", cr_original: "원본", cr_banner: "그룹 배너 16:9", cr_square: "정사각형 1:1", cr_zoom: "확대", cr_guide: "가이드",
  cr_reset: "초기화", cr_hint: "드래그로 이동 · 휠로 확대", cr_preview: "미리보기", cr_out: (w, h) => `${w}×${h}로 업로드`, cr_nameplate: "이름표(짧은) · 항상 표시",
  cr_expanded: "이름표(확장/긴 이름) · 항상 표시", cr_sometimes: "그룹 배너", cr_never: "표시 안 됨", cr_full: "전체 이미지", cr_iconLarge: "프로필", cr_iconSmall: "목록",
  cr_tooBig: "10 MB 미만 파일이어야 합니다", cr_tooSmall: "64×64 픽셀보다 커야 합니다", cr_cropSmall: "잘린 영역이 64×64 미만입니다 — 조금 축소하세요", cr_uploadNew: "새로 업로드" });
Object.assign(UPD_I18N.ru, { cr_compact: "Баннер группы (Compact)", cr_long: "длинная", cr_short: "короткая", cr_plate: "Табличка", cr_title: "Обрезать и загрузить", cr_original: "Оригинал", cr_banner: "Баннер группы 16:9", cr_square: "Квадрат 1:1", cr_zoom: "Масштаб",
  cr_guide: "Разметка", cr_reset: "Сброс", cr_hint: "Перетаскивайте · колесо — масштаб", cr_preview: "Предпросмотр", cr_out: (w, h) => `Загрузится как ${w}×${h}`,
  cr_nameplate: "Табличка (короткая) · видно всегда", cr_expanded: "Табличка (развёрнутая / длинное имя) · видно всегда", cr_sometimes: "Баннер группы", cr_never: "Не видно", cr_full: "Целиком",
  cr_iconLarge: "Профиль", cr_iconSmall: "Список", cr_tooBig: "Файл должен быть меньше 10 МБ", cr_tooSmall: "Изображение должно быть больше 64×64",
  cr_cropSmall: "Область меньше 64×64 — уменьшите масштаб", cr_uploadNew: "Загрузить новое" });
Object.assign(UPD_I18N.vi, { cr_compact: "Ảnh bìa nhóm (Compact)", cr_long: "dài", cr_short: "ngắn", cr_plate: "Bảng tên", cr_title: "Cắt và tải lên", cr_original: "Gốc", cr_banner: "Ảnh bìa nhóm 16:9", cr_square: "Vuông 1:1", cr_zoom: "Thu phóng",
  cr_guide: "Đường gióng", cr_reset: "Đặt lại", cr_hint: "Kéo để di chuyển · cuộn để phóng to", cr_preview: "Xem trước", cr_out: (w, h) => `Tải lên ở ${w}×${h}`,
  cr_nameplate: "Bảng tên (ngắn) · luôn hiện", cr_expanded: "Bảng tên (mở rộng / tên dài) · luôn hiện", cr_sometimes: "Ảnh bìa nhóm", cr_never: "Không hiện", cr_full: "Toàn ảnh",
  cr_iconLarge: "Hồ sơ", cr_iconSmall: "Danh sách", cr_tooBig: "Tệp phải nhỏ hơn 10 MB", cr_tooSmall: "Ảnh phải lớn hơn 64×64 pixel",
  cr_cropSmall: "Vùng cắt nhỏ hơn 64×64 — hãy thu nhỏ", cr_uploadNew: "Tải lên mới" });
Object.assign(UPD_I18N.zh, { cr_compact: "群组横幅（Compact）", cr_long: "长", cr_short: "短", cr_plate: "名牌", cr_title: "裁剪并上传", cr_original: "原始比例", cr_banner: "群组横幅 16:9", cr_square: "正方形 1:1", cr_zoom: "缩放", cr_guide: "参考线",
  cr_reset: "重置", cr_hint: "拖动移动 · 滚轮缩放", cr_preview: "预览", cr_out: (w, h) => `将以 ${w}×${h} 上传`, cr_nameplate: "名牌（短）· 始终显示",
  cr_expanded: "名牌（展开/长名称）· 始终显示", cr_sometimes: "群组横幅", cr_never: "不显示", cr_full: "完整图片", cr_iconLarge: "个人资料", cr_iconSmall: "列表",
  cr_tooBig: "文件必须小于 10 MB", cr_tooSmall: "图片必须大于 64×64 像素", cr_cropSmall: "裁剪区域小于 64×64 —— 请缩小一些", cr_uploadNew: "上传新图片" });

// Group banner guide in 2000×1125 template coordinates
const BANNER_W = 2000, BANNER_H = 1125;
const BANNER = {
  compact: [8, 165, 1992, 1125, 80, 0],     // x0, y0, x1, y1, top radius, bottom radius
  group: [0, 336, 2000, 762, 20, 20],       // what the in-game group page shows (measured from a screenshot)
  long: [8, 322, 1992, 1035, 230, 250],
  short: [333, 326, 1662, 1000, 200, 0],
  plate: { long: [4, 540, 1996, 1032, 252, 794], short: [322, 542, 1672, 1006, 557, 771] },  // pill + avatar centre (r 195)
};
function rrPath(p, [x0, y0, x1, y1, rt, rb]) {
  p.moveTo(x0 + rt, y0); p.arcTo(x1, y0, x1, y1, rt); p.arcTo(x1, y1, x0, y1, rb);
  p.arcTo(x0, y1, x0, y0, rb); p.arcTo(x0, y0, x1, y0, rt); p.closePath();
}
// Mock nameplate: dark pill, avatar circle and the player's name
function drawPlate(g, kind, alpha = 1) {
  const [x0, y0, x1, y1, ax, ay] = BANNER.plate[kind], r = (y1 - y0) / 2;
  g.save(); g.globalAlpha = alpha;
  g.beginPath(); rrPath(g, [x0, y0, x1, y1, r, r]);
  g.fillStyle = kind === "long" ? "#2e2e2e" : "#000"; g.fill(); g.lineWidth = 10; g.strokeStyle = "#1c1c1c"; g.stroke();
  g.beginPath(); g.arc(ax, ay, 195, 0, Math.PI * 2); g.fillStyle = "#4a4a4a"; g.fill();
  g.fillStyle = "#fff"; g.font = "600 120px " + getComputedStyle(document.body).fontFamily; g.textBaseline = "middle";
  const tx = ax + 250, maxW = x1 - r * 0.6 - tx;
  g.fillText(AUTH.name || "Player Name", tx, ay + 6, maxW);
  g.restore();
}
const CROP_MODES = { original: null, banner: 16 / 9, square: 1 };
let CROP = null;

const MAX_UPLOAD = 10 * 1024 * 1024;
function cropLoad(file) {
  if (file.size >= MAX_UPLOAD) { toast(t("cr_tooBig")); return null; }
  return new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = URL.createObjectURL(file); })
    .then(img => {
      if (!img) { toast(t("errGeneric")); return null; }
      if (img.naturalWidth <= 64 || img.naturalHeight <= 64) { toast(t("cr_tooSmall")); return null; }
      return img;
    });
}
// tag: "gallery" | "icon". mode: original / banner / square. done(file) runs after a successful upload
async function openCropper(file, tag, mode, done) {
  const img = await cropLoad(file);
  if (!img) return;
  CROP = { img, tag, mode: tag === "icon" ? "square" : mode || "original", guide: true, plate: "long", done, busy: false };
  cropReset();
  openX(t("cr_title"), cropHtml, cropWire, true);
}
const cropAspect = () => CROP_MODES[CROP.mode] ?? CROP.img.naturalWidth / CROP.img.naturalHeight;
// Largest crop of the chosen aspect that fits the image (zoom 1)
function cropBase() {
  const W = CROP.img.naturalWidth, H = CROP.img.naturalHeight, a = cropAspect();
  return W / H > a ? [H * a, H] : [W, W / a];
}
// Free pan and zoom: the crop may go past the image edges (that part stays transparent)
const ZOOM_MIN = 0.05, ZOOM_MAX = 20;
function cropRect() {
  const [bw, bh] = cropBase(), w = bw / CROP.zoom, h = bh / CROP.zoom;
  return [CROP.cx - w / 2, CROP.cy - h / 2, w, h];
}
// Draw the crop into a dw×dh area of a 2D context (works when the crop extends past the image)
function cropPaint(g, dw, dh) {
  const [x, y, w, h] = cropRect(), kx = dw / w, ky = dh / h;
  g.imageSmoothingQuality = "high";
  g.drawImage(CROP.img, -x * kx, -y * ky, CROP.img.naturalWidth * kx, CROP.img.naturalHeight * ky);
}
function cropReset() { CROP.zoom = 1; CROP.cx = CROP.img.naturalWidth / 2; CROP.cy = CROP.img.naturalHeight / 2; }
// Output size: banner 2000×1125 at most, everything else ≤ 2048 on the long side, never upscaled
function cropOutSize() {
  const [, , w, h] = cropRect();
  const cap = CROP.mode === "banner" ? BANNER_W / w : 2048 / Math.max(w, h);
  const s = Math.min(1, cap);
  return [Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))];
}
function cropHtml() {
  const modes = CROP.tag === "icon" ? "" : `<div class="segmented sm">${Object.keys(CROP_MODES).map(m =>
    `<button class="${CROP.mode === m ? "on" : ""}" onclick="cropMode('${m}')">${t("cr_" + m)}</button>`).join("")}</div>`;
  const legend = CROP.mode === "banner" && CROP.guide ? `<div class="cr-legend">
      <span><i style="background:#3f8f4a"></i>${t("cr_nameplate")}</span><span><i style="background:#8a7a3d"></i>${t("cr_expanded")}</span>
      <span><i style="background:#3a4252"></i>${t("cr_sometimes")}</span><span><i style="background:#8f74c9"></i>${t("cr_compact")}</span>
      <span><i style="background:#111"></i>${t("cr_never")}</span></div>` : "";
  const prev = CROP.tag === "icon"
    ? `<div class="cr-pv"><canvas id="crPvBig" class="round" width="192" height="192" style="width:96px;height:96px"></canvas><small>${t("cr_iconLarge")}</small></div>
       <div class="cr-pv"><canvas id="crPvSmall" class="round" width="80" height="80" style="width:40px;height:40px"></canvas><small>${t("cr_iconSmall")}</small></div>`
    : CROP.mode === "banner"
      // Same scale for all three: widths are shares of the 2000-wide banner, canvases keep each zone's real aspect
      ? Object.entries(BANNER_PV).map(([k, [x0, y0, x1, y1]]) => `<div class="cr-pv wide"><canvas id="crPv_${k}" width="${(x1 - x0) / 2}" height="${(y1 - y0) / 2}"
          style="width:${((x1 - x0) / BANNER_W * 100).toFixed(1)}%"></canvas><small>${BANNER_PV_LABEL[k]()}</small></div>`).join("")
      : `<div class="cr-pv wide"><canvas id="crPvFull" ${cropPvSize(cropAspect())}></canvas><small>${t("cr_full")}</small></div>`;
  return `<div class="cr-top">${modes}<span class="grow"></span>
      ${CROP.mode === "banner" && CROP.guide ? `<div class="segmented sm">${["long", "short"].map(k =>
        `<button class="${CROP.plate === k ? "on" : ""}" onclick="CROP.plate='${k}';cropDraw();this.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===this))">${t("cr_plate")}: ${t(k === "long" ? "cr_long" : "cr_short")}</button>`).join("")}</div>` : ""}
      ${CROP.mode === "banner" ? `<label class="cr-chk"><input type="checkbox" ${CROP.guide ? "checked" : ""} onchange="CROP.guide=this.checked;buildX()">${t("cr_guide")}</label>` : ""}
      ${btn(t("cr_reset"), "cropReset();cropDraw()", "sm", "rotate-ccw")}</div>
    <div class="cr-body">
      <div class="cr-stage-wrap"><canvas id="crStage"></canvas><div class="cr-hint">${t("cr_hint")}</div>${legend}</div>
      <div class="cr-side"><div class="lbl">${t("cr_preview")}</div>${prev}</div>
    </div>
    <div class="cr-bottom">${icon("zoom-out")}<input type="range" id="crZoom" min="${Math.log2(ZOOM_MIN).toFixed(2)}" max="${Math.log2(ZOOM_MAX).toFixed(2)}" step="0.01" value="${Math.log2(CROP.zoom)}">${icon("zoom-in")}
      <span class="cr-out" id="crOut"></span>
      ${btn(t(CROP.busy ? "uploading" : "upload"), "cropUpload()", "primary", "upload")}</div>`;
}
// Preview canvas for the whole crop: fits 440×330 at the crop's own aspect (no stretching)
function cropPvSize(a) {
  const w = Math.round(Math.min(440, 330 * a)), h = Math.round(w / a);
  return `width="${w}" height="${h}" style="width:${Math.round(w / 2)}px;max-width:100%"`;
}
function cropMode(m) { CROP.mode = m; cropReset(); buildX(); }
function cropWire() {
  const c = $("crStage");
  if (!c) return;
  // Stage size: fit 600×400 keeping the crop's aspect
  const a = cropAspect(), maxW = Math.min(600, document.querySelector(".cr-stage-wrap").clientWidth || 600), maxH = 400;
  const w = Math.min(maxW, maxH * a), h = w / a, dpr = window.devicePixelRatio || 1;
  c.style.width = w + "px"; c.style.height = h + "px"; c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  let drag = null;
  c.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY }; c.setPointerCapture(e.pointerId); c.classList.add("grab"); };
  c.onpointermove = e => {
    if (!drag) return;
    const [, , cw] = cropRect(), k = cw / c.clientWidth;
    CROP.cx -= (e.clientX - drag.x) * k; CROP.cy -= (e.clientY - drag.y) * k;
    drag = { x: e.clientX, y: e.clientY };
    cropDraw();
  };
  c.onpointerup = c.onpointercancel = () => { drag = null; c.classList.remove("grab"); };
  c.onwheel = e => {  // Zoom toward the cursor
    e.preventDefault();
    const r = c.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width, my = (e.clientY - r.top) / r.height;
    const [x0, y0, cw, ch] = cropRect(), px = x0 + mx * cw, py = y0 + my * ch;
    CROP.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, CROP.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
    const [bw, bh] = cropBase();
    CROP.cx = px - (mx - .5) * bw / CROP.zoom; CROP.cy = py - (my - .5) * bh / CROP.zoom;
    cropDraw();
  };
  $("crZoom").oninput = e => { CROP.zoom = 2 ** +e.target.value; cropDraw(); };  // log scale: same feel at any zoom
  cropDraw();
}
function cropDraw() {
  const c = $("crStage");
  if (!c || !CROP) return;
  const [x, y, w, h] = cropRect(), g = c.getContext("2d");
  g.imageSmoothingQuality = "high";
  g.clearRect(0, 0, c.width, c.height);
  cropPaint(g, c.width, c.height);
  if (CROP.mode === "banner" && CROP.guide) cropGuide(g, c.width / BANNER_W);
  if (CROP.tag === "icon") {  // Dim outside the circle
    g.save(); g.fillStyle = "rgba(0,0,0,.45)"; g.beginPath(); g.rect(0, 0, c.width, c.height);
    g.arc(c.width / 2, c.height / 2, c.width / 2, 0, Math.PI * 2, true); g.fill("evenodd"); g.restore();
  }
  if ($("crZoom")) $("crZoom").value = Math.log2(CROP.zoom);
  const [ow, oh] = cropOutSize();
  $("crOut").textContent = t("cr_out", ow, oh) + (Math.min(w, h) < 64 ? " · " + t("cr_cropSmall") : "");
  $("crOut").classList.toggle("warn", Math.min(w, h) < 64);
  // Previews
  const pv = (id, sx, sy, sw, sh, clip) => {
    const p = $(id);
    if (!p) return;
    const q = p.getContext("2d");
    q.clearRect(0, 0, p.width, p.height);
    q.save();
    if (clip) { q.beginPath(); clip(q, p.width / sw); q.clip(); }
    q.setTransform(p.width / sw, 0, 0, p.height / sh, -sx * p.width / sw, -sy * p.height / sh);
    cropPaint(q, 1, 1);
    q.setTransform(1, 0, 0, 1, 0, 0);
    q.restore();
  };
  if (CROP.tag === "icon") { pv("crPvBig", 0, 0, 1, 1); pv("crPvSmall", 0, 0, 1, 1); return; }
  pv("crPvFull", 0, 0, 1, 1);
  if (CROP.mode !== "banner") return;
  for (const [k, [rx0, ry0]] of Object.entries(BANNER_PV)) {
    const p = $("crPv_" + k);
    if (!p) continue;
    const q = p.getContext("2d");
    q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, p.width, p.height);
    q.setTransform(0.5, 0, 0, 0.5, -rx0 * 0.5, -ry0 * 0.5);   // template units → canvas
    q.save(); q.beginPath(); rrPath(q, BANNER[k]); q.clip();
    q.imageSmoothingQuality = "high";
    cropPaint(q, BANNER_W, BANNER_H);
    q.restore();
    if (k === "long" || k === "short") drawPlate(q, k);
  }
}
const BANNER_PV = { long: [0, 300, 2000, 1050], short: [310, 300, 1690, 1030], group: [0, 336, 2000, 762], compact: [0, 150, 2000, 1125] };
const BANNER_PV_LABEL = { long: () => t("cr_expanded"), short: () => t("cr_nameplate"), group: () => t("cr_sometimes"), compact: () => t("cr_compact") };
// Draw the template zones over the stage (k = canvas px per template unit)
function cropGuide(g, k) {
  g.save(); g.scale(k, k);
  const fillStroke = (shape, fill, stroke) => { g.beginPath(); rrPath(g, shape); g.fillStyle = fill; g.fill(); if (stroke) { g.strokeStyle = stroke; g.stroke(); } };
  g.lineWidth = 5;
  g.fillStyle = "rgba(10,10,12,.62)"; g.fillRect(0, 0, BANNER_W, BANNER.compact[1]);                            // never shown
  g.beginPath(); rrPath(g, BANNER.compact); g.strokeStyle = "rgba(180,150,240,.95)"; g.setLineDash([22, 14]); g.stroke(); g.setLineDash([]);  // compact card
  fillStroke(BANNER.group, "rgba(58,66,82,.28)", "rgba(150,160,180,.8)");                                       // group page banner
  fillStroke(BANNER.long, "rgba(196,164,64,.22)", "rgba(230,195,90,.95)");                                      // expanded
  fillStroke(BANNER.short, "rgba(70,170,90,.22)", "rgba(110,220,130,.95)");                                     // nameplate
  drawPlate(g, CROP.plate, 0.62);                                                                               // covered: never shown
  g.setLineDash([14, 12]); g.lineWidth = 3; g.strokeStyle = "rgba(255,255,255,.8)";
  g.beginPath(); g.moveTo(0, 540); g.lineTo(BANNER_W, 540); g.stroke();
  g.restore();
}
async function cropUpload() {
  if (!CROP || CROP.busy) return;
  const [x, y, w, h] = cropRect();
  if (Math.min(w, h) < 64) return toast(t("cr_cropSmall"));
  let [ow, oh] = cropOutSize(), data;
  // Shrink until the PNG fits VRChat's 10 MB limit (base64 is ~4/3 of the bytes)
  for (let i = 0; i < 6; i++) {
    const out = document.createElement("canvas");
    out.width = ow; out.height = oh;
    const g = out.getContext("2d");
    g.imageSmoothingQuality = "high";
    cropPaint(g, ow, oh);
    data = out.toDataURL("image/png");
    if (data.length * 0.75 < MAX_UPLOAD - 64 * 1024) break;
    ow = Math.round(ow * 0.85); oh = Math.round(oh * 0.85);
  }
  CROP.busy = true; buildX();
  INV.uploading = true;
  const r = await api("upload_image", CROP.tag, data, {});
  INV.uploading = false;
  CROP.busy = false;
  if (!r?.ok) { buildX(); return apiError(r); }
  (INV.data[CROP.tag] ||= []).unshift(r.ok);
  const done = CROP.done;
  CROP = null;
  closeX();
  toast(t("uploaded"));
  if (done) done(r.ok); else if (view === "inventory") renderView();
}

// Photos and Icons go through the cropper; stickers / emoji keep their own flow
const _uploadFileC = uploadFile;
uploadFile = function (file) {
  if (!file) return;
  if (INV.tab === "gallery" || INV.tab === "icon") return openCropper(file, INV.tab, INV.tab === "gallery" ? "original" : "square");
  return _uploadFileC(file);
};

// Group edit: "Upload new" inside the icon / banner picker
function gUploadImage(kind) {
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = "image/*";
  inp.onchange = () => inp.files[0] && openCropper(inp.files[0], kind === "icon" ? "icon" : "gallery", kind === "icon" ? "square" : "banner",
    f => gSetImage(kind, f.id, f.url));
  inp.click();
}
const _gPickImageC = gPickImage;
gPickImage = async function (kind) {
  await _gPickImageC(kind);
  const body = document.querySelector("#xOverlay .igrid");
  body?.insertAdjacentHTML("beforebegin", `<div class="toolbar">${btn(t("cr_uploadNew"), `gUploadImage('${kind}')`, "primary sm", "upload")}</div>`);
};

document.head.insertAdjacentHTML("beforeend", `<style>
.cr-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.cr-bottom { display: flex; align-items: center; gap: 10px; }
.cr-bottom > .btn { flex-shrink: 0; }
.cr-body { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 16px; margin: 12px 0; align-items: start; }
.cr-stage-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0; }
#crStage { display: block; border-radius: 10px; background: repeating-conic-gradient(var(--track) 0 25%, transparent 0 50%) 0 0 / 16px 16px;
           cursor: grab; touch-action: none; max-width: 100%; }
#crStage.grab { cursor: grabbing; }
.cr-hint { font-size: 11.5px; color: var(--text2); }
.cr-legend { display: flex; flex-wrap: wrap; gap: 4px 12px; justify-content: center; font-size: 11px; color: var(--text2); }
.cr-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 5px; vertical-align: -1px; }
.cr-side { display: flex; flex-direction: column; gap: 10px; }
.cr-pv { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.cr-pv canvas { background: #111; border-radius: 8px; }
.cr-pv.wide canvas { height: auto; }
.cr-pv canvas.round { border-radius: 50%; }
.cr-pv small { font-size: 11px; color: var(--text2); }
.cr-chk { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; }
.cr-bottom input[type=range] { width: 180px; min-width: 90px; flex-shrink: 1; accent-color: var(--accent); }
.cr-bottom svg { width: 16px; height: 16px; color: var(--text2); }
.cr-out { flex: 1; min-width: 0; font-size: 12px; line-height: 1.35; color: var(--text2); }
.cr-out.warn { color: var(--red); }
@media (max-width: 760px) { .cr-body { grid-template-columns: 1fr; } }
</style>`);

// ======================= Group log: search, page size, export / Bulk actions by user ID with a manager note =======================
// Filters sent to VRChat: the chosen type, and a user (as the one acting or the one acted on) when the search is a usr_ ID
function gAuditQuery() {
  return { ...(GX.auditType ? { eventTypes: GX.auditType } : {}), ...(GX.auditUser ? { [GX.auditBy]: GX.auditUser } : {}) };
}
// Text search runs over what's loaded (VRChat can't search log text); it looks at the description, who did it, the type and the IDs
const gAuditMatch = l => !GX.auditQ || [l.description, l.actorDisplayName, l.eventType, l.actorId, l.targetId]
  .some(v => (v || "").toLowerCase().includes(GX.auditQ.toLowerCase()));
function gAuditSearch(v) {
  v = (v || "").trim();
  const id = v.match(/usr_[\w-]+/)?.[0];
  Object.assign(GX, id ? { auditUser: id, auditQ: "" } : { auditQ: v });
  GX.auditOff = 0;
  buildGroup();
  if (id) gLoad(true);
}
function gAuditUser(id, by) { Object.assign(GX, { auditUser: id || "", auditBy: by || GX.auditBy, auditQ: "", auditOff: 0 }); buildGroup(); gLoad(true); }
function gAuditHtml() {
  const c = CACHE.g_audit, all = c?.data?.results, types = got("g_auditTypes") || [];
  const list = all?.filter(gAuditMatch);
  const more = c?.data?.hasNext ?? all?.length === GX.auditN;
  const head = (types.length ? `<select class="field sm" onchange="GX.auditType=this.value;GX.auditOff=0;buildGroup();gLoad(true)">
      <option value="">${t("g_allTypes")}</option>${types.map(x => `<option value="${escA(x)}" ${GX.auditType === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select>` : "")
    + `<select class="field sm" onchange="GX.auditN=+this.value;GX.auditOff=0;buildGroup();gLoad(true)">${[25, 50, 100].map(n =>
      `<option value="${n}" ${GX.auditN === n ? "selected" : ""}>${t("pg_per", n)}</option>`).join("")}</select>`
    + `<div class="mwrap"><button class="btn sm" onclick="event.stopPropagation();toggleMenu(this)">${icon("download")}${t("g_export")}</button>
      <div class="menu"><button class="mi" onclick="closeMenus();gAuditExport('csv')">${icon("download")}<span>CSV</span></button>
        <button class="mi" onclick="closeMenus();gAuditExport('json')">${icon("download")}<span>JSON</span></button></div></div>`;
  const search = `<div class="toolbar"><input class="field grow" id="gaq" placeholder="${escA(t("g_auditPh"))}" value="${escA(GX.auditQ)}"
      onkeydown="if(event.key==='Enter')gAuditSearch(this.value)" oninput="if(!this.value&&GX.auditQ)gAuditSearch('')">
    ${GX.auditUser ? `<span class="gfilter">${icon("funnel")}<select class="field sm" onchange="gAuditUser(GX.auditUser,this.value)">
        <option value="targetIds" ${GX.auditBy === "targetIds" ? "selected" : ""}>${t("g_byTarget")}</option>
        <option value="actorIds" ${GX.auditBy === "actorIds" ? "selected" : ""}>${t("g_byActor")}</option></select>
      <code>${esc(GX.auditUser)}</code><button class="mini-btn" title="${t("clearSearch")}" onclick="gAuditUser('')">${icon("x")}</button></span>` : ""}</div>
    ${GX.auditQ && all ? `<div class="pcard-note">${t("g_matchN", list.length, all.length)}</div>` : ""}`;
  const rows = stateHtml(c && { ...c, data: list }) || list.map(l => {
    const tgt = /^usr_/.test(l.targetId || "") ? l.targetId : "";
    return `<div class="lrow"><div class="info"><div class="nm">${esc(l.description || l.eventType)}</div>
      <div class="sub">${esc(l.actorDisplayName || "")} · ${fmtIso(l.created_at)} · ${esc(l.eventType)}</div></div>
      ${tgt ? `<div class="acts"><button class="mini-btn" title="${t("g_filterUser")}" onclick="gAuditUser('${esc(tgt)}','targetIds')">${icon("funnel")}</button>
        <button class="mini-btn" title="${t("g_addSel")}" onclick="gSelAdd(['${esc(tgt)}'])">${icon("user-plus")}</button></div>` : ""}</div>`;
  }).join("");
  const total = c?.data?.totalCount;
  const pager = GX.auditOff || more ? `<div class="form-actions">${GX.auditOff ? btn("‹", "GX.auditOff=Math.max(0,GX.auditOff-GX.auditN);gLoad(true)", "sm") : ""}
    <span class="pcard-note" style="margin:0">${GX.auditOff + 1}–${GX.auditOff + (all?.length || 0)}${total ? " / " + Number(total).toLocaleString() : ""}</span>
    ${more ? btn("›", "GX.auditOff+=GX.auditN;gLoad(true)", "sm") : ""}</div>` : "";
  return [head, search + rows + pager];
}
// Every entry that matches the current filters (type, user, text), up to 5000, as a CSV or JSON file
async function gAuditExport(fmt) {
  const gid = groupOpen?.id, out = [], MAX = 5000;
  if (!gid) return;
  for (let off = 0; off < MAX; off += 100) {
    toast(t("g_exporting", out.length));
    const r = await vrc("getGroupAuditLogs", { groupId: gid, ...gAuditQuery(), n: 100, offset: off });
    if ("error" in r) { apiError(r); if (!out.length) return; break; }
    const page = r.ok?.results || [];
    out.push(...page);
    if (!(r.ok?.hasNext ?? page.length === 100)) break;
    await new Promise(res => setTimeout(res, 400));  // Stay well inside VRChat's rate limit
  }
  const rows = out.filter(gAuditMatch);
  const cols = ["created_at", "eventType", "actorDisplayName", "actorId", "targetId", "description", "data"];
  const cell = v => { const s = typeof v === "object" && v ? JSON.stringify(v) : String(v ?? ""); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const text = fmt === "csv" ? [cols.join(","), ...rows.map(l => cols.map(k => cell(l[k])).join(","))].join("\r\n") : JSON.stringify(rows, null, 2);
  const name = `${(groupOpen.shortCode || "group")}_audit_${new Date().toISOString().slice(0, 10)}.${fmt}`;
  const r = await api("save_text", name, text);
  if (r?.ok) toast(t("g_exported", rows.length));
}

// ---------- Bulk actions: a list of users (pasted IDs, the user search, or the log), then roles / note / kick / ban / unban for all of them ----------
async function gSelAdd(ids) {
  const fresh = [...new Set(ids)].filter(id => /^usr_[\w-]+$/.test(id) && !GX.sel.some(s => s.id === id));
  if (!fresh.length) return;
  GX.sel.push(...fresh.map(id => ({ id, name: id, loading: true })));
  toast(t("g_added", fresh.length));
  gBulkRefresh();
  for (const id of fresh) { await gSelLoad(id); await new Promise(res => setTimeout(res, 250)); }
}
// Member info for one selected user: name, roles and manager note (or "not a member", then just the name)
async function gSelLoad(id) {
  const s = GX.sel.find(x => x.id === id);
  if (!s || !groupOpen) return;
  const r = await vrc("getGroupMember", { groupId: groupOpen.id, userId: id });
  const m = r.ok && typeof r.ok === "object" && r.ok.membershipStatus === "member" ? r.ok : null;
  Object.assign(s, m ? { member: true, roles: m.roleIds || [], note: m.managerNotes || "" } : { member: false, roles: [], note: "" });
  // The member record has no name — take it from the profiles already loaded, or ask for the profile
  let name = m?.user?.displayName || PROFILES[id]?.displayName;
  if (!name) name = (await vrc("getUser", { userId: id })).ok?.displayName;
  s.name = name || s.name;
  s.loading = false;
  if (GX.sel.length === 1) GX.note = s.note;
  gBulkRefresh();
}
function gSelRemove(id) { GX.sel = GX.sel.filter(s => s.id !== id); gBulkRefresh(); }
function gBulkRefresh() {  // Redraw only this section, so text being typed elsewhere on the card stays
  const box = document.querySelector(".gadm-main .gbulk");
  if (!box) return;
  const focus = document.activeElement?.id;
  box.outerHTML = gBulkHtml();
  fillSlots(document.querySelector(".gadm-main"));
  if (focus && $(focus)) $(focus).focus();
}
function gBulkHtml() {
  const roles = (groupOpen.roles || []).filter(r => !r.defaultRole);
  const canRole = gCan("group-roles-assign") && roles.length, canKick = gCan("group-members-remove"), canBan = gCan("group-bans-manage"),
    canNote = gCan("group-members-manage");
  const n = GX.sel.length, none = n ? "" : "disabled";
  const roleName = id => (groupOpen.roles || []).find(r => r.id === id)?.name || "";
  const act = (label, ic, op, extra = "", danger) => `<button class="btn sm ${danger ? "danger" : ""}" ${none || extra}
    onclick="${danger ? `confirmBtn(this,()=>gBulkRun('${op}'))` : `gBulkRun('${op}')`}">${icon(ic)}${label}</button>`;
  return `<div class="gbulk">
    <div class="lbl">${t("g_userIds")}</div>
    <div class="toolbar"><input class="field grow" id="gselIn" placeholder="${escA(t("g_userIdsPh"))}" value="${escA(GX.selInput)}"
        oninput="GX.selInput=this.value" onkeydown="if(event.key==='Enter')gSelPaste()">
      ${btn(t("g_addIds"), "gSelPaste()", "sm", "user-plus")}${btn(t("g_pickUser"), "gUserPicker('pick')", "sm", "search")}</div>
    <div class="lbl">${t("g_selected", n)}${n ? `<button class="mini-btn" title="${t("g_clearSel")}" onclick="GX.sel=[];GX.note='';gBulkRefresh()">${icon("trash-2")}</button>` : ""}</div>
    ${n ? GX.sel.map(s => lrow({ uid: s.id, name: s.name, onclick: `showProfile('${esc(s.id)}')`,
        sub: s.loading ? t("loading") : `${s.member ? (s.roles || []).map(r => esc(roleName(r))).filter(Boolean).join(", ") || t("g_member") : t("g_notMember")}${s.note ? ` · ${icon("notebook-pen")}${esc(s.note.slice(0, 60))}` : ""}`,
        acts: `<button class="mini-btn" title="${t("remove")}" onclick="gSelRemove('${esc(s.id)}')">${icon("x")}</button>` })).join("")
      : `<div class="empty-state" style="height:60px">${t("g_noneSel")}</div>`}
    ${canNote ? `<div class="lbl">${t("g_note")}</div><textarea class="field" id="gnote" rows="3" maxlength="1000" placeholder="${escA(t("g_notePh"))}"
        oninput="GX.note=this.value">${esc(GX.note)}</textarea>${n > 1 ? `<div class="pcard-note">${t("g_noteMulti")}</div>` : ""}` : ""}
    ${canRole ? `<div class="lbl">${t("g_selRoles")}</div><div class="langpick">${roles.map(r =>
        `<button type="button" class="chip lang ${GX.selRoles.includes(r.id) ? "on" : ""}" onclick="gSelRole('${esc(r.id)}')">${esc(r.name)}</button>`).join("")}</div>` : ""}
    <div class="lbl">${t("g_actions")}</div>
    <div class="form-actions" style="justify-content:flex-start;flex-wrap:wrap">
      ${canRole ? act(t("g_addRoles"), "user-plus", "addRoles", GX.selRoles.length ? "" : "disabled") + act(t("g_removeRoles"), "user-minus", "removeRoles", GX.selRoles.length ? "" : "disabled") : ""}
      ${canNote ? act(t("g_saveNote"), "notebook-pen", "note") : ""}
      ${canKick ? act(t("g_kick"), "door-open", "kick", "", true) : ""}
      ${canBan ? act(t("g_ban"), "ban", "ban", "", true) + act(t("g_unban"), "user-check", "unban") : ""}</div></div>`;
}
function gSelPaste() {
  const ids = GX.selInput.match(/usr_[\w-]+/g) || [];
  if (!ids.length) return toast(t("g_noIds"));
  GX.selInput = "";
  if ($("gselIn")) $("gselIn").value = "";
  gSelAdd(ids);
}
function gSelRole(id) { GX.selRoles = GX.selRoles.includes(id) ? GX.selRoles.filter(x => x !== id) : [...GX.selRoles, id]; gBulkRefresh(); }
// One action for every selected user, one at a time; then a count of what worked and fresh info for each (never on yourself, except a note)
async function gBulkRun(kind) {
  const gid = groupOpen?.id, users = GX.sel.filter(s => s.id !== AUTH.id || kind === "note");
  if (!gid || !users.length) return;
  const calls = [];
  for (const s of users) {
    if (kind === "addRoles" || kind === "removeRoles")
      for (const rid of GX.selRoles) calls.push([kind === "addRoles" ? "addGroupMemberRole" : "removeGroupMemberRole", { userId: s.id, groupRoleId: rid }]);
    else if (kind === "note") calls.push(["updateGroupMember", { userId: s.id, managerNotes: GX.note }]);
    else calls.push([{ kick: "kickGroupMember", ban: "banGroupMember", unban: "unbanGroupMember" }[kind], { userId: s.id }]);
  }
  let ok = 0, fail = 0;
  for (const [op, p] of calls) {
    const r = await vrc(op, { groupId: gid, ...p });
    "error" in r ? fail++ : ok++;
    await new Promise(res => setTimeout(res, 300));
  }
  toast(t("g_bulkDone", ok, fail));
  ["g_mem", "g_bans", "g_audit"].forEach(k => delete CACHE[k]);
  users.forEach(s => s.loading = true);
  gBulkRefresh();
  for (const s of users) { await gSelLoad(s.id); await new Promise(res => setTimeout(res, 250)); }
}
// Members tab: page buttons, "page X of Y" (when the total is known: all members, no search or role filter) and how many per page
function gMemberPager(shown, total) {
  const n = GX.memberN, page = Math.floor(GX.memberOff / n) + 1, pages = total ? Math.max(1, Math.ceil(total / n)) : null;
  const more = shown === n && (!pages || page < pages);
  if (!GX.memberOff && !more && shown < 25) return "";
  const go = d => `GX.memberOff=Math.max(0,GX.memberOff+(${d})*GX.memberN);gLoad(true);$('gBody').scrollIntoView({block:'start'})`;
  return `<div class="form-actions gmp-pager">
    <button class="btn sm" ${GX.memberOff ? "" : "disabled"} onclick="${go(-1)}">${icon("chevron-left")}</button>
    <span class="pcard-note" style="margin:0">${pages ? t("g_pageOf", page, pages) : page}</span>
    <button class="btn sm" ${more ? "" : "disabled"} onclick="${go(1)}">${icon("chevron-right")}</button>
    <select class="field sm" style="width:auto" onchange="GX.memberN=+this.value;GX.memberOff=0;gLoad(true)">${[25, 50, 100].map(x =>
      `<option value="${x}" ${x === n ? "selected" : ""}>${t("pg_per", x)}</option>`).join("")}</select></div>`;
}
// Ban / "Select user": the group's members as a list, filtered as you type and split into pages; "All users" searches VRChat
// for people who aren't members (they can be banned too). Only the list redraws, so typing isn't interrupted
{
  const pickerBase = gUserPicker;
  gUserPicker = function (mode) {
    if (mode !== "ban" && mode !== "pick") return pickerBase(mode);
    const N = 25;
    const st = { scope: "members", q: "", off: 0, res: null, busy: false, err: false, seq: 0, timer: 0 };
    const load = async () => {
      const seq = ++st.seq, gid = groupOpen?.id;
      if (!gid) return;
      st.busy = true; draw();
      const id = st.q.match(/usr_[\w-]+/)?.[0];
      let r;
      if (id) r = { ok: [{ userId: id, user: { displayName: PROFILES[id]?.displayName || id } }] };
      else if (st.scope === "all") r = st.q ? await vrc("searchUsers", { search: st.q, n: N, offset: st.off }) : { ok: [] };
      else r = st.q ? await vrc("searchGroupMembers", { groupId: gid, query: st.q, n: N, offset: st.off })
        : await vrc("getGroupMembers", { groupId: gid, n: N, offset: st.off, sort: "joinedAt:desc" });
      if (seq !== st.seq) return;  // A newer search started meanwhile
      st.busy = false; st.err = "error" in r;
      const list = Array.isArray(r.ok) ? r.ok : r.ok?.results || [];
      // Members come as {userId, user, roleIds}; VRChat users as {id, displayName}
      st.res = list.map(x => x.userId ? { id: x.userId, name: x.user?.displayName || x.userId, roles: x.roleIds || [], joined: x.joinedAt }
        : { id: x.id, name: x.displayName || x.id });
      draw();
    };
    const roleNames = ids => (ids || []).map(r => (groupOpen.roles || []).find(x => x.id === r && !x.defaultRole)?.name).filter(Boolean).join(", ");
    const row = u => lrow({ uid: u.id, name: u.name, onclick: `showProfile('${esc(u.id)}')`,
      sub: [roleNames(u.roles), u.joined ? t("g_joined", fmtIso(u.joined, true)) : ""].filter(Boolean).join(" · "),
      acts: u.id === AUTH.id ? "" : mode === "ban"
        ? `<button class="btn sm danger" onclick="confirmBtn(this,()=>gDo('banGroupMember',{userId:'${esc(u.id)}'},'done','g_bans'))">${icon("ban")}${t("g_ban")}</button>`
        : GX.sel.some(s => s.id === u.id) ? `<span class="pcard-note" style="margin:0">${icon("check")}</span>`
        : btn(t("g_addIds"), `gSelAdd(['${esc(u.id)}']).then(()=>_gmpDraw())`, "primary sm", "user-plus") });
    const draw = () => {
      const box = $("gmpList");
      if (!box) return;
      const total = st.scope === "members" && !st.q ? groupOpen.memberCount : null;
      const pages = total ? Math.max(1, Math.ceil(total / N)) : null, page = Math.floor(st.off / N) + 1;
      const more = st.res?.length === N && (!pages || page < pages);
      box.innerHTML = (st.busy && !st.res ? `<div class="empty-state" style="height:80px">${t("loading")}</div>`
        : st.scope === "all" && !st.q ? `<div class="empty-state" style="height:80px">${t("g_allUsersHint")}</div>`
        : st.err ? `<div class="empty-state" style="height:80px">${t("errGeneric")}</div>`
        : !st.res?.length ? `<div class="empty-state" style="height:80px">${t("noResults")}</div>`
        : `<div class="gmp-rows ${st.busy ? "busy" : ""}">${st.res.map(row).join("")}</div>`)
        + (st.off || more ? `<div class="form-actions gmp-pager">
            <button class="btn sm" ${st.off ? "" : "disabled"} onclick="_gmpPage(-1)">${icon("chevron-left")}</button>
            <span class="pcard-note" style="margin:0">${pages ? t("g_pageOf", page, pages) : page}</span>
            <button class="btn sm" ${more ? "" : "disabled"} onclick="_gmpPage(1)">${icon("chevron-right")}</button></div>` : "");
      fillSlots(box);
    };
    window._gmpDraw = draw;
    window._gmpPage = d => { st.off = Math.max(0, st.off + d * N); load(); };
    window._gmpScope = s => { st.scope = s; st.off = 0; st.res = null;
      document.querySelectorAll(".gmp-scope button").forEach(b => b.classList.toggle("on", b.dataset.s === s)); load(); };
    window._gmpType = v => { st.q = v.trim(); st.off = 0; clearTimeout(st.timer); st.timer = setTimeout(load, 350); };
    openX(t(mode === "ban" ? "g_banUser" : "g_pickUser"), () => `<div class="toolbar" style="margin-bottom:8px">
        <input class="field grow" id="gupq" placeholder="${t("g_userPh")}" autocomplete="off" oninput="_gmpType(this.value)">
        <div class="segmented sm gmp-scope"><button data-s="members" class="on" onclick="_gmpScope('members')">${t("g_members")}</button>
          <button data-s="all" onclick="_gmpScope('all')">${t("g_allUsers")}</button></div></div>
      <div id="gmpList"></div>`,
    () => { $("gupq").focus(); });
    load();
  };
}
document.head.insertAdjacentHTML("beforeend", `<style>
.gmp-rows { max-height: min(52vh, 460px); overflow-y: auto; }
.gmp-rows.busy { opacity: .55; }
.gmp-pager { justify-content: center; align-items: center; gap: 10px; }
.gmp-pager .btn svg { width: 14px; height: 14px; }
</style>`);
tx({
  g_allUsers: ["ผู้ใช้ทั้งหมด", "All users", "全ユーザー"],
  g_allUsersHint: ["พิมพ์ชื่อเพื่อค้นหาผู้ใช้ทุกคนใน VRChat (รวมคนที่ไม่ได้อยู่ในกลุ่ม)", "Type a name to search everyone on VRChat (including people outside the group)", "名前を入力して VRChat の全ユーザーを検索（グループ外の人も）"],
  g_pageOf: [(p, n) => `หน้า ${p} / ${n}`, (p, n) => `Page ${p} of ${n}`, (p, n) => `${p} / ${n} ページ`],
});
Object.assign(UPD_I18N.ko, { g_allUsers: "모든 사용자", g_allUsersHint: "이름을 입력해 VRChat 전체 사용자 검색 (그룹 밖 사람 포함)", g_pageOf: (p, n) => `${p} / ${n} 페이지` });
Object.assign(UPD_I18N.ru, { g_allUsers: "Все пользователи", g_allUsersHint: "Введите имя для поиска по всем в VRChat (включая тех, кто не в группе)", g_pageOf: (p, n) => `Стр. ${p} из ${n}` });
Object.assign(UPD_I18N.vi, { g_allUsers: "Mọi người dùng", g_allUsersHint: "Nhập tên để tìm mọi người trên VRChat (kể cả người ngoài nhóm)", g_pageOf: (p, n) => `Trang ${p} / ${n}` });
Object.assign(UPD_I18N.zh, { g_allUsers: "所有用户", g_allUsersHint: "输入名称搜索 VRChat 上的所有人（包括群组外的人）", g_pageOf: (p, n) => `第 ${p} / ${n} 页` });
document.head.insertAdjacentHTML("beforeend", `<style>
.gfilter { display: inline-flex; align-items: center; gap: 6px; padding: 2px 4px 2px 8px; border-radius: 99px; background: var(--track); font-size: 12px; }
.gfilter > svg { width: 13px; height: 13px; color: var(--accent); }
.gfilter .field.sm { width: auto; padding: 2px 6px; }
.gfilter code { font-family: var(--mono); font-size: 11px; color: var(--text2); max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gbulk .lbl { display: flex; align-items: center; gap: 6px; margin: 14px 0 6px; font-size: 12px; font-weight: 600; color: var(--text2); }
.gbulk .lbl:first-child { margin-top: 0; }
.gbulk .sub svg { width: 11px; height: 11px; vertical-align: -1px; margin-right: 2px; }
.gbulk textarea { width: 100%; resize: vertical; }
</style>`);
tx({
  g_bulk: ["จัดการหลายคน", "Bulk actions", "一括操作"],
  g_auditPh: ["ค้นหาใน log (ชื่อ คำอธิบาย ประเภท) หรือใส่ usr_… เพื่อค้นจาก VRChat", "Search the log (name, description, type), or usr_… to search VRChat", "ログを検索（名前・説明・種類）、または usr_… で VRChat を検索"],
  g_byTarget: ["ผู้ถูกกระทำ", "Target", "対象"], g_byActor: ["ผู้กระทำ", "Actor", "実行者"],
  g_filterUser: ["ดู log ของผู้ใช้นี้", "Show this user's log", "このユーザーのログ"], g_addSel: ["เพิ่มในจัดการหลายคน", "Add to bulk actions", "一括操作に追加"],
  g_added: [n => `เพิ่มในจัดการหลายคน ${n} คน`, n => `Added ${n} to bulk actions`, n => `一括操作に ${n} 人追加`],
  g_matchN: [(n, m) => `ตรง ${n} จาก ${m} รายการที่โหลดมา`, (n, m) => `${n} of ${m} loaded entries match`, (n, m) => `読み込んだ ${m} 件中 ${n} 件が一致`],
  g_export: ["ส่งออก", "Export", "エクスポート"],
  g_exporting: [n => `กำลังโหลด log… ${n}`, n => `Loading the log… ${n}`, n => `ログを読み込み中… ${n}`],
  g_exported: [n => `ส่งออกแล้ว ${n} รายการ`, n => `Exported ${n} entries`, n => `${n} 件をエクスポートしました`],
  g_userIds: ["User ID", "User ID", "ユーザー ID"],
  g_userIdsPh: ["วาง usr_… ได้หลายอัน (ลิงก์หรือข้อความที่มี ID ก็ได้)", "Paste one or more usr_… (links or any text with IDs work too)", "usr_… を複数貼り付け（リンクや ID を含む文章でも可）"],
  g_addIds: ["เพิ่ม", "Add", "追加"], g_pickUser: ["เลือกผู้ใช้", "Select user", "ユーザーを選択"],
  g_noIds: ["ไม่พบ usr_… ในข้อความ", "No usr_… found in that text", "usr_… が見つかりません"],
  g_selected: [n => `ผู้ใช้ที่เลือก (${n})`, n => `Selected users (${n})`, n => `選択したユーザー (${n})`],
  g_clearSel: ["ล้างรายการ", "Clear list", "リストをクリア"], g_noneSel: ["ยังไม่ได้เลือกผู้ใช้", "No users selected", "ユーザーが選択されていません"],
  g_member: ["สมาชิก", "Member", "メンバー"], g_notMember: ["ไม่ได้เป็นสมาชิก", "Not a member", "メンバーではありません"],
  g_note: ["โน้ตผู้ดูแล", "Manager note", "管理メモ"], g_notePh: ["เห็นเฉพาะผู้ดูแลกลุ่ม", "Only group managers can see this", "グループ管理者のみ表示されます"],
  g_noteMulti: ["บันทึกโน้ตนี้ให้ทุกคนที่เลือก (แทนที่โน้ตเดิม)", "Saves this note for everyone selected (replacing their note)", "選択した全員にこのメモを保存します（既存のメモは置き換え）"],
  g_selRoles: ["บทบาท", "Roles", "ロール"], g_actions: ["การดำเนินการ", "Actions", "操作"],
  g_addRoles: ["เพิ่มบทบาท", "Add roles", "ロールを追加"], g_removeRoles: ["ลบบทบาท", "Remove roles", "ロールを削除"], g_saveNote: ["บันทึกโน้ต", "Save note", "メモを保存"],
  g_bulkDone: [(ok, f) => `สำเร็จ ${ok}${f ? ` · ไม่สำเร็จ ${f}` : ""}`, (ok, f) => `Done ${ok}${f ? ` · failed ${f}` : ""}`, (ok, f) => `成功 ${ok}${f ? ` · 失敗 ${f}` : ""}`],
});
Object.assign(UPD_I18N.ko, { g_bulk: "일괄 작업", g_auditPh: "로그 검색(이름, 설명, 유형) 또는 usr_… 로 VRChat 검색", g_byTarget: "대상", g_byActor: "실행자",
  g_filterUser: "이 사용자의 로그", g_addSel: "일괄 작업에 추가", g_added: n => `일괄 작업에 ${n}명 추가`, g_matchN: (n, m) => `불러온 ${m}개 중 ${n}개 일치`,
  g_export: "내보내기", g_exporting: n => `로그 불러오는 중… ${n}`, g_exported: n => `${n}개 내보냄`, g_userIds: "사용자 ID",
  g_userIdsPh: "usr_… 를 여러 개 붙여넣기 (링크나 ID가 든 글도 가능)", g_addIds: "추가", g_pickUser: "사용자 선택", g_noIds: "usr_… 를 찾지 못했습니다",
  g_selected: n => `선택한 사용자 (${n})`, g_clearSel: "목록 지우기", g_noneSel: "선택한 사용자가 없습니다", g_member: "멤버", g_notMember: "멤버 아님",
  g_note: "관리자 메모", g_notePh: "그룹 관리자만 볼 수 있습니다", g_noteMulti: "선택한 모두에게 이 메모를 저장합니다 (기존 메모 대체)",
  g_selRoles: "역할", g_actions: "작업", g_addRoles: "역할 추가", g_removeRoles: "역할 제거", g_saveNote: "메모 저장",
  g_bulkDone: (ok, f) => `성공 ${ok}${f ? ` · 실패 ${f}` : ""}` });
Object.assign(UPD_I18N.ru, { g_bulk: "Массовые действия", g_auditPh: "Поиск по журналу (имя, описание, тип) или usr_… для поиска в VRChat", g_byTarget: "Цель", g_byActor: "Кто сделал",
  g_filterUser: "Журнал этого пользователя", g_addSel: "Добавить в массовые действия", g_added: n => `Добавлено: ${n}`, g_matchN: (n, m) => `Совпадает ${n} из ${m} загруженных`,
  g_export: "Экспорт", g_exporting: n => `Загрузка журнала… ${n}`, g_exported: n => `Экспортировано: ${n}`, g_userIds: "ID пользователей",
  g_userIdsPh: "Вставьте один или несколько usr_… (подойдут ссылки и любой текст с ID)", g_addIds: "Добавить", g_pickUser: "Выбрать пользователя", g_noIds: "usr_… не найдено",
  g_selected: n => `Выбрано (${n})`, g_clearSel: "Очистить список", g_noneSel: "Никто не выбран", g_member: "Участник", g_notMember: "Не участник",
  g_note: "Заметка модератора", g_notePh: "Видна только менеджерам группы", g_noteMulti: "Сохранит эту заметку всем выбранным (заменит прежнюю)",
  g_selRoles: "Роли", g_actions: "Действия", g_addRoles: "Добавить роли", g_removeRoles: "Убрать роли", g_saveNote: "Сохранить заметку",
  g_bulkDone: (ok, f) => `Готово ${ok}${f ? ` · ошибок ${f}` : ""}` });
Object.assign(UPD_I18N.vi, { g_bulk: "Thao tác hàng loạt", g_auditPh: "Tìm trong nhật ký (tên, mô tả, loại) hoặc usr_… để tìm trên VRChat", g_byTarget: "Đối tượng", g_byActor: "Người thực hiện",
  g_filterUser: "Nhật ký của người này", g_addSel: "Thêm vào thao tác hàng loạt", g_added: n => `Đã thêm ${n} người`, g_matchN: (n, m) => `${n} / ${m} mục đã tải khớp`,
  g_export: "Xuất", g_exporting: n => `Đang tải nhật ký… ${n}`, g_exported: n => `Đã xuất ${n} mục`, g_userIds: "User ID",
  g_userIdsPh: "Dán một hoặc nhiều usr_… (liên kết hay văn bản có ID đều được)", g_addIds: "Thêm", g_pickUser: "Chọn người dùng", g_noIds: "Không tìm thấy usr_…",
  g_selected: n => `Đã chọn (${n})`, g_clearSel: "Xóa danh sách", g_noneSel: "Chưa chọn ai", g_member: "Thành viên", g_notMember: "Không phải thành viên",
  g_note: "Ghi chú quản lý", g_notePh: "Chỉ quản lý nhóm thấy được", g_noteMulti: "Lưu ghi chú này cho mọi người đã chọn (thay ghi chú cũ)",
  g_selRoles: "Vai trò", g_actions: "Thao tác", g_addRoles: "Thêm vai trò", g_removeRoles: "Gỡ vai trò", g_saveNote: "Lưu ghi chú",
  g_bulkDone: (ok, f) => `Thành công ${ok}${f ? ` · thất bại ${f}` : ""}` });
Object.assign(UPD_I18N.zh, { g_bulk: "批量操作", g_auditPh: "搜索日志（名称、描述、类型），或输入 usr_… 在 VRChat 中搜索", g_byTarget: "对象", g_byActor: "执行者",
  g_filterUser: "查看此用户的日志", g_addSel: "加入批量操作", g_added: n => `已加入 ${n} 人`, g_matchN: (n, m) => `已加载的 ${m} 条中有 ${n} 条匹配`,
  g_export: "导出", g_exporting: n => `正在加载日志… ${n}`, g_exported: n => `已导出 ${n} 条`, g_userIds: "用户 ID",
  g_userIdsPh: "粘贴一个或多个 usr_…（链接或含 ID 的文字也可以）", g_addIds: "添加", g_pickUser: "选择用户", g_noIds: "未找到 usr_…",
  g_selected: n => `已选用户 (${n})`, g_clearSel: "清空列表", g_noneSel: "尚未选择用户", g_member: "成员", g_notMember: "不是成员",
  g_note: "管理员备注", g_notePh: "仅群组管理员可见", g_noteMulti: "将此备注保存给所有已选用户（覆盖原备注）",
  g_selRoles: "角色", g_actions: "操作", g_addRoles: "添加角色", g_removeRoles: "移除角色", g_saveNote: "保存备注",
  g_bulkDone: (ok, f) => `成功 ${ok}${f ? ` · 失败 ${f}` : ""}` });

// ======================= Right-click menu for text boxes (WebView2's own menu is off outside debug mode) =======================
// Text boxes get undo / cut / copy / paste / delete / select all; selected text elsewhere on the page gets copy
const CM_FIELD = 'textarea, [contenteditable=""], [contenteditable="true"], input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]):not([type=button]):not([type=submit]):not([type=hidden])';
function cmSelected(el) {
  if (!el) return String(getSelection());
  if (el.isContentEditable) return String(getSelection());
  try { return el.value.slice(el.selectionStart, el.selectionEnd); } catch { return ""; }  // number inputs have no selection
}
async function cmDo(act) {
  const el = window._cmEl;
  closeMenus();
  if (act === "copy") return api("copy", window._cmText);
  if (!el) return;
  el.focus();
  if (act === "cut") { api("copy", cmSelected(el)); document.execCommand("delete"); }
  else if (act === "paste") { const text = await api("paste_text"); if (text) { el.focus(); document.execCommand("insertText", false, text); } }
  else if (act === "selectAll") el.select ? el.select() : document.execCommand("selectAll");
  else document.execCommand(act);  // undo / redo / delete — through the browser so Ctrl+Z still works afterwards
}
document.addEventListener("contextmenu", e => {
  const el = e.target.closest?.(CM_FIELD);
  const text = cmSelected(el);
  if (!el && !text.trim()) return;  // Nothing to offer here
  e.preventDefault();
  closeMenus();
  const ro = el && (el.readOnly || el.disabled), has = !!text, empty = el && !el.isContentEditable && !el.value;
  window._cmEl = el; window._cmText = text;
  const item = (act, ic, key, keys, off) => `<button class="mi" ${off ? "disabled" : ""} onclick="cmDo('${act}')">${icon(ic)}<span>${t(key)}</span><kbd>${keys}</kbd></button>`;
  const m = document.createElement("div");
  m.className = "menu floating open mwrap cmenu";
  m.innerHTML = el ? item("undo", "undo-2", "cm_undo", "Ctrl+Z", ro) + item("redo", "redo-2", "cm_redo", "Ctrl+Y", ro) + `<div class="msep"></div>`
      + item("cut", "scissors", "cm_cut", "Ctrl+X", ro || !has) + item("copy", "copy", "cm_copy", "Ctrl+C", !has)
      + item("paste", "clipboard-paste", "cm_paste", "Ctrl+V", ro) + item("delete", "trash-2", "cm_delete", "Del", ro || !has) + `<div class="msep"></div>`
      + item("selectAll", "text-select", "cm_selectAll", "Ctrl+A", empty)
    : item("copy", "copy", "cm_copy", "Ctrl+C", false);
  m.onmousedown = ev => ev.preventDefault();  // Keep the text box's focus and selection
  document.body.append(m);
  const z = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--z")) || 1;
  const W = innerWidth / z, H = innerHeight / z, x = e.clientX / z, y = e.clientY / z;
  m.style.left = Math.max(8, Math.min(W - m.offsetWidth - 8, x)) + "px";
  m.style.top = Math.max(8, y + m.offsetHeight > H - 8 ? y - m.offsetHeight : y) + "px";
});
addEventListener("keydown", e => { if (e.key === "Escape" && document.querySelector(".cmenu")) closeMenus(); }, true);
document.head.insertAdjacentHTML("beforeend", `<style>
.cmenu { min-width: 200px; }
.cmenu .mi:disabled { opacity: .38; pointer-events: none; }
.cmenu .mi kbd { margin-left: auto; padding-left: 16px; font: 11px var(--font); color: var(--text3); }
.cmenu .msep { height: 1px; margin: 4px 6px; background: var(--sep); }
</style>`);
tx({
  cm_undo: ["เลิกทำ", "Undo", "元に戻す"], cm_redo: ["ทำซ้ำ", "Redo", "やり直し"], cm_cut: ["ตัด", "Cut", "切り取り"], cm_copy: ["คัดลอก", "Copy", "コピー"],
  cm_paste: ["วาง", "Paste", "貼り付け"], cm_delete: ["ลบ", "Delete", "削除"], cm_selectAll: ["เลือกทั้งหมด", "Select all", "すべて選択"],
});
Object.assign(UPD_I18N.ko, { cm_undo: "실행 취소", cm_redo: "다시 실행", cm_cut: "잘라내기", cm_copy: "복사", cm_paste: "붙여넣기", cm_delete: "삭제", cm_selectAll: "모두 선택" });
Object.assign(UPD_I18N.ru, { cm_undo: "Отменить", cm_redo: "Повторить", cm_cut: "Вырезать", cm_copy: "Копировать", cm_paste: "Вставить", cm_delete: "Удалить", cm_selectAll: "Выделить всё" });
Object.assign(UPD_I18N.vi, { cm_undo: "Hoàn tác", cm_redo: "Làm lại", cm_cut: "Cắt", cm_copy: "Sao chép", cm_paste: "Dán", cm_delete: "Xóa", cm_selectAll: "Chọn tất cả" });
Object.assign(UPD_I18N.zh, { cm_undo: "撤销", cm_redo: "重做", cm_cut: "剪切", cm_copy: "复制", cm_paste: "粘贴", cm_delete: "删除", cm_selectAll: "全选" });

// ======================= SteamVR overlay: the page draws notices and the wrist panel; vroverlay.py shows them =======================
// Drawn here because the browser lays out Thai and colour emoji properly. Python asks for the wrist panel every couple of
// seconds (vrWristTick); notices are drawn when something happens (a friend comes online, an invite, a friend joins your room)
const vrOn = () => { const c = oiCfg(); return c.vr && c.vrToast ? c : null; };
let VR_FONT = `"Segoe UI Variable Text", "Segoe UI", "Leelawadee UI", "Yu Gothic UI", "Malgun Gothic", "Microsoft YaHei UI", "Segoe UI Emoji", sans-serif`;
// The app's look in VR: its font, light or dark, and glass tinted like its wallpaper. "Ink" is the text and icon colour on it
const VRT = { ink: "255,255,255", dark: true, glass: ["rgba(118,136,196,0.72)", "rgba(66,80,138,0.72)"], edge: "rgba(255,255,255,0.32)" };
const vrInk = a => `rgba(${VRT.ink},${a})`;
function vrTheme() {
  const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue(n).trim(), d = dark();
  const rgb = h => /^#[0-9a-f]{6}$/i.test(h) ? [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) : [118, 136, 196];
  const mix = (h, base, k, a) => `rgba(${rgb(h).map((c, i) => Math.round(c * (1 - k) + base[i] * k)).join(",")},${a})`;
  VRT.dark = d; VRT.ink = d ? "255,255,255" : "28,28,30";
  VRT.glass = d ? [mix(v("--wall-1"), [128, 136, 176], 0.55, 0.74), mix(v("--wall-2"), [56, 60, 88], 0.55, 0.74)]
    : [mix(v("--wall-1"), [255, 255, 255], 0.62, 0.86), mix(v("--wall-2"), [238, 240, 246], 0.62, 0.86)];
  VRT.edge = d ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.85)";
  const f = v("--font");
  if (f && f !== VR_FONT) {  // A font from Google Fonts: draw again once it's loaded
    VR_FONT = f;
    Promise.all([400, 600, 700].map(w => document.fonts.load(`${w} 30px ${f}`, "กขAa"))).then(() => vrwDraw(), () => {});
  }
}
function vrCanvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function vrRound(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
// Cut text to fit a width (by whole letters, so Thai vowels and tone marks stay with their letter)
function vrFit(g, s, w) {
  s = String(s || "");
  if (g.measureText(s).width <= w) return s;
  const parts = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)].map(x => x.segment);
  while (parts.length && g.measureText(parts.join("") + "…").width > w) parts.pop();
  return parts.join("") + "…";
}
// Wrap text into lines (at word breaks where the language has them; Thai words are found by the browser)
function vrWrap(g, s, w, max) {
  const out = [];
  for (const para of String(s || "").split("\n")) {
    let line = "";
    for (const { segment } of new Intl.Segmenter(undefined, { granularity: "word" }).segment(para)) {
      if (g.measureText(line + segment).width > w && line) { out.push(line.trimEnd()); line = segment.trimStart(); }
      else line += segment;
    }
    out.push(line);
  }
  return out.length > max ? [...out.slice(0, max - 1), vrFit(g, out.slice(max - 1).join(" "), w)] : out;
}
const vrImg = src => new Promise(res => { if (!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; setTimeout(() => res(null), 800); });
const vrColor = name => getComputedStyle(document.documentElement).getPropertyValue("--" + name).trim() || "#0a84ff";

// A notice: picture (profile picture, or an icon on a coloured tile), a title and one line under it
async function vrToast(title, body, { uid, ic = "bell", color = "blue" } = {}) {
  const W = 840, H = 180, P = 26, A = H - P * 2;
  const [cv, g] = vrCanvas(W, H);
  vrTheme();
  g.fillStyle = VRT.dark ? "rgba(28,28,32,0.94)" : "rgba(246,246,250,0.96)"; vrRound(g, 0, 0, W, H, 44); g.fill();
  g.strokeStyle = VRT.dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)"; g.lineWidth = 3; vrRound(g, 1.5, 1.5, W - 3, H - 3, 42); g.stroke();
  const pic = uid && await vrImg(PROFILES[uid]?.img);
  g.save(); g.beginPath(); g.arc(P + A / 2, P + A / 2, A / 2, 0, Math.PI * 2); g.clip();
  if (pic) g.drawImage(pic, P, P, A, A);
  else {
    g.fillStyle = vrColor(color); g.fillRect(P, P, A, A);
    const svg = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[ic] || ""}</svg>`], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svg), im = await vrImg(url);
    if (im) g.drawImage(im, P + A * 0.22, P + A * 0.22, A * 0.56, A * 0.56);
    URL.revokeObjectURL(url);
  }
  g.restore();
  const x = P * 2 + A, tw = W - x - P;
  g.fillStyle = vrInk(1); g.font = `600 46px ${VR_FONT}`; g.textBaseline = "alphabetic";
  g.fillText(vrFit(g, title, tw), x, P + 56);
  g.fillStyle = vrInk(0.68); g.font = `36px ${VR_FONT}`;
  g.fillText(vrFit(g, body, tw), x, P + 112);
  api("vr_frame", "toast", cv.toDataURL("image/png"));
}
function vrTest() { vrToast("VRC Nook", t("vr_testBody"), { uid: AUTH.id, ic: "glasses" }); }

// ---------- What makes a notice ----------
const _onFeedVr = window.onFeed;
window.onFeed = (list) => {
  _onFeedVr(list);
  const c = vrOn();
  if (!c || c.vrFriends === "off") return;
  for (const e of list)
    if (e.type === "online" && (c.vrFriends === "all" || favRecord("friend", e.u)))
      vrToast(e.name, t("ff_online", locLabel(e.d?.location)), { uid: e.u, ic: "user-check", color: "green" });
};
const _onNewNotifVr = window.onNewNotif;
window.onNewNotif = (n) => {
  _onNewNotifVr(n);
  if (vrOn()?.vrInvites) vrToast(n.name || "VRChat", t("n_" + n.type, n.worldName || ""), { uid: n.from, ic: n.type === "friendRequest" ? "user-plus" : "send", color: "purple" });
};
const _onPipelineVr = window.onPipelineEvent;
window.onPipelineEvent = (ev) => {
  _onPipelineVr(ev);
  if (ev.type === "notification-v2" && vrOn()?.vrInvites) vrToast(ev.content?.title || "VRChat", ev.content?.message || "", { ic: "bell", color: "orange" });
};
// A friend joins the room you're in. Not while you're arriving yourself (everyone already there "joins"), and not for old
// log lines read again when the app starts
let vrArrivedAt = 0;
const vrLogTime = s => { const m = (s || "").match(/^(\d{4})\.(\d\d)\.(\d\d) (\d\d):(\d\d):(\d\d)/); return m ? new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime() : 0; };
const _onBatchVr = window.onBatch;
window.onBatch = (b) => {
  _onBatchVr(b);
  const c = vrOn();
  for (const e of b.events || []) {
    const at = vrLogTime(e.t);
    if (e.k === "world" || e.k === "instance") vrArrivedAt = at;
    if (!c?.vrJoins || e.k !== "join" || !e.u || e.u === AUTH.id || !FRIENDS[e.u]) continue;
    if (Date.now() - at > 60000 || at - vrArrivedAt < 20000) continue;
    vrToast(e.v || FRIENDS[e.u].displayName, t("vr_joined"), { uid: e.u, ic: "log-in", color: "teal" });
  }
};
function oiOvUi(o) {
  const el = $("oiOv");
  if (!el) return;
  const on = oiCfg().vr;
  el.textContent = !on ? t("oi_toy_off") : o.error ? t("vr_err", o.error) : t("vr_st_" + (o.vr || "off"));
  el.style.color = on && o.vr === "ok" && !o.error ? "var(--green)" : on && (o.error || o.vr === "error") ? "var(--red)" : "";
}
document.head.insertAdjacentHTML("beforeend", `<style>
.oi-sub { margin: 14px 4px 4px; font-size: 11.5px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
.oi-sub:first-of-type { margin-top: 8px; }
</style>`);
tx({
  oi_vr: ["VR overlay", "VR overlay", "VR オーバーレイ"],
  vr_hint: ["แสดงในแว่นผ่าน SteamVR (ไม่ขึ้นถ้าเล่นแบบไม่ผ่าน SteamVR เช่น Virtual Desktop + VDXR)", "Shows in your headset through SteamVR (not when you play without SteamVR, e.g. Virtual Desktop with VDXR)", "SteamVR 経由でヘッドセットに表示（Virtual Desktop + VDXR など SteamVR なしでは表示されません）"],
  vr_st_off: ["ยังไม่เริ่ม", "Starting…", "開始中…"], vr_st_noSteamVR: ["รอ SteamVR…", "Waiting for SteamVR…", "SteamVR を待っています…"],
  vr_st_ok: ["ทำงานอยู่ในแว่น", "Showing in your headset", "ヘッドセットに表示中"], vr_st_error: ["ต่อ SteamVR ไม่ได้", "Can't reach SteamVR", "SteamVR に接続できません"],
  vr_err: [e => `แสดง overlay ไม่ได้: ${e}`, e => `Can't show the overlay: ${e}`, e => `オーバーレイを表示できません: ${e}`],
  vr_toasts: ["การแจ้งเตือนในแว่น", "Notices in your headset", "ヘッドセット内の通知"],
  vr_toast: ["แสดงการแจ้งเตือน", "Show notices", "通知を表示"], vr_toastHint: ["ลอยขึ้นตรงหน้าแป๊บหนึ่งแล้วหายไป", "Float in front of you for a few seconds", "目の前に数秒表示されます"],
  vr_test: ["ทดลอง", "Test", "テスト"], vr_testBody: ["การแจ้งเตือนจะขึ้นตรงนี้", "Notices show up here", "通知はここに表示されます"],
  vr_friends: ["เพื่อนออนไลน์", "Friends coming online", "フレンドのオンライン"],
  vr_fr_off: ["ไม่แจ้ง", "Off", "オフ"], vr_fr_fav: ["เฉพาะเพื่อนในรายการโปรด", "Favorite friends only", "お気に入りのみ"], vr_fr_all: ["เพื่อนทุกคน", "All friends", "すべてのフレンド"],
  vr_invites: ["คำเชิญและคำขอ", "Invites and requests", "招待とリクエスト"], vr_invitesHint: ["คำเชิญเข้าห้อง ขอให้เชิญ คำขอเป็นเพื่อน และแจ้งเตือนจากกลุ่ม", "Invites, invite requests, friend requests and group notices", "招待、リクエスト、フレンド申請、グループ通知"],
  vr_joins: ["เพื่อนเข้าห้องเดียวกัน", "Friends joining your room", "フレンドが同じルームに参加"], vr_joinsHint: ["ไม่แจ้งตอนเราเพิ่งเข้าห้อง (ทุกคนในห้องจะนับว่าเข้ามาใหม่)", "Not while you're arriving yourself", "自分の入室直後は通知しません"],
  vr_joined: ["เข้ามาในห้องนี้", "joined your room", "がルームに参加しました"],
  vr_wristSec: ["เมนูที่ข้อมือ", "Wrist menu", "手首メニュー"],
  vr_wrist: ["แสดงปุ่มที่ข้อมือ", "Show the wrist button", "手首ボタンを表示"], vr_wristHint: ["ปุ่ม VRC Nook กลมๆ ที่หันมาหาคุณเสมอ จิ้มด้วยปลาย controller อีกข้าง หรือชี้เลเซอร์แล้วกด trigger เพื่อเปิดเมนู: คีย์บอร์ด เพื่อน แจ้งเตือน ห้องนี้ Chatbox และข้อมูล", "A round VRC Nook button that always turns to face you: poke it with the tip of your other controller, or point the laser and pull the trigger, to open the menu — keyboard, friends, notifications, this room, Chatbox and info", "いつもこちらを向く丸い VRC Nook ボタン。もう片方のコントローラーの先でつつくか、レーザーで指してトリガーを引くとメニューが開きます：キーボード、フレンド、通知、このルーム、Chatbox、情報"],
  vr_hand: ["มือ", "Hand", "手"], vr_left: ["ซ้าย", "Left", "左"], vr_right: ["ขวา", "Right", "右"],
  vr_size: ["ขนาดปุ่ม (ซม.)", "Button size (cm)", "ボタンの大きさ (cm)"], vr_sizeHint: ["3–12 ซม. เมนูที่กางออกจะกว้างประมาณ 3.4 เท่า", "3–12 cm; the open menu is about 3.4 times as wide", "3–12 cm。開いたメニューは約 3.4 倍の幅"],
  vr_dist: ["ระยะจากมือ (ซม.)", "Distance from hand (cm)", "手からの距離 (cm)"],
  vr_distHint: ["ถอยไปทางข้อศอก ถ้าแผงซ้อนกับ controller ให้เพิ่มค่า", "Back towards the elbow — raise it if the panel overlaps the controller", "ひじ側へずらします。コントローラーと重なるなら大きく"],
  vr_gaze: ["แสดงเฉพาะตอนมองข้อมือ", "Only when you look at it", "見たときだけ表示"], vr_gazeHint: ["มองไปที่ข้อมือแล้วปุ่มจะค่อยๆ ขึ้น", "Look towards your wrist and it fades in", "手首のほうを見るとフェードイン"],
  vr_people: [n => `${n} คนในห้อง`, n => `${n} in the room`, n => `ルームに ${n} 人`],
});
Object.assign(UPD_I18N.ko, { oi_vr: "VR 오버레이", vr_hint: "SteamVR를 통해 헤드셋에 표시 (Virtual Desktop + VDXR 등 SteamVR 없이 플레이하면 표시되지 않음)",
  vr_st_off: "시작 중…", vr_st_noSteamVR: "SteamVR 기다리는 중…", vr_st_ok: "헤드셋에 표시 중", vr_st_error: "SteamVR에 연결할 수 없음", vr_err: e => `오버레이를 표시할 수 없음: ${e}`,
  vr_toasts: "헤드셋 알림", vr_toast: "알림 표시", vr_toastHint: "눈앞에 몇 초간 떠 있습니다", vr_test: "테스트", vr_testBody: "알림은 여기에 표시됩니다",
  vr_friends: "친구 접속", vr_fr_off: "끄기", vr_fr_fav: "즐겨찾기 친구만", vr_fr_all: "모든 친구", vr_invites: "초대와 요청", vr_invitesHint: "초대, 초대 요청, 친구 요청, 그룹 알림",
  vr_joins: "친구가 같은 방에 입장", vr_joinsHint: "내가 막 입장했을 때는 알리지 않음", vr_joined: "님이 방에 들어왔습니다", vr_wristSec: "손목 메뉴", vr_wrist: "손목 버튼 표시",
  vr_wristHint: "항상 나를 향하는 둥근 VRC Nook 버튼: 다른 컨트롤러 끝으로 누르거나 레이저로 가리키고 트리거를 당기면 메뉴가 열립니다 — 키보드, 친구, 알림, 이 방, Chatbox, 정보", vr_hand: "손", vr_left: "왼쪽", vr_right: "오른쪽", vr_size: "버튼 크기 (cm)", vr_sizeHint: "3–12 cm, 펼친 메뉴는 약 3.4배 너비", vr_dist: "손에서 거리 (cm)", vr_distHint: "팔꿈치 쪽으로 이동 — 컨트롤러와 겹치면 값을 키우세요", vr_gaze: "볼 때만 표시", vr_gazeHint: "손목 쪽을 보면 나타납니다", vr_people: n => `방에 ${n}명` });
Object.assign(UPD_I18N.ru, { oi_vr: "VR-оверлей", vr_hint: "Показывается в шлеме через SteamVR (не работает без SteamVR, например Virtual Desktop с VDXR)",
  vr_st_off: "Запуск…", vr_st_noSteamVR: "Ждём SteamVR…", vr_st_ok: "Показывается в шлеме", vr_st_error: "Нет связи со SteamVR", vr_err: e => `Не удаётся показать оверлей: ${e}`,
  vr_toasts: "Уведомления в шлеме", vr_toast: "Показывать уведомления", vr_toastHint: "Появляются перед вами на несколько секунд", vr_test: "Проверить", vr_testBody: "Уведомления появятся здесь",
  vr_friends: "Друзья в сети", vr_fr_off: "Выкл.", vr_fr_fav: "Только избранные", vr_fr_all: "Все друзья", vr_invites: "Приглашения и запросы", vr_invitesHint: "Приглашения, запросы приглашения, заявки в друзья и уведомления групп",
  vr_joins: "Друг зашёл в вашу комнату", vr_joinsHint: "Не в момент, когда вы сами заходите", vr_joined: "зашёл в вашу комнату", vr_wristSec: "Меню на запястье", vr_wrist: "Показывать кнопку на запястье",
  vr_wristHint: "Круглая кнопка VRC Nook, всегда повёрнутая к вам: коснитесь её кончиком другого контроллера или наведите лазер и нажмите курок, чтобы открыть меню — клавиатура, друзья, уведомления, комната, Chatbox и сведения", vr_hand: "Рука", vr_left: "Левая", vr_right: "Правая", vr_size: "Размер кнопки (см)", vr_sizeHint: "3–12 см; открытое меню примерно в 3,4 раза шире", vr_dist: "Расстояние от руки (см)", vr_distHint: "Сдвиг к локтю — увеличьте, если панель перекрывает контроллер", vr_gaze: "Только когда смотрите", vr_gazeHint: "Посмотрите на запястье — кнопка проявится", vr_people: n => `В комнате: ${n}` });
Object.assign(UPD_I18N.vi, { oi_vr: "Lớp phủ VR", vr_hint: "Hiện trong kính qua SteamVR (không hiện khi chơi không qua SteamVR, ví dụ Virtual Desktop với VDXR)",
  vr_st_off: "Đang bắt đầu…", vr_st_noSteamVR: "Đang chờ SteamVR…", vr_st_ok: "Đang hiện trong kính", vr_st_error: "Không kết nối được SteamVR", vr_err: e => `Không hiện được lớp phủ: ${e}`,
  vr_toasts: "Thông báo trong kính", vr_toast: "Hiện thông báo", vr_toastHint: "Hiện trước mặt vài giây", vr_test: "Thử", vr_testBody: "Thông báo sẽ hiện ở đây",
  vr_friends: "Bạn bè trực tuyến", vr_fr_off: "Tắt", vr_fr_fav: "Chỉ bạn yêu thích", vr_fr_all: "Tất cả bạn bè", vr_invites: "Lời mời và yêu cầu", vr_invitesHint: "Lời mời, yêu cầu mời, lời mời kết bạn và thông báo nhóm",
  vr_joins: "Bạn bè vào phòng của bạn", vr_joinsHint: "Không báo lúc chính bạn vừa vào", vr_joined: "đã vào phòng của bạn", vr_wristSec: "Menu ở cổ tay", vr_wrist: "Hiện nút ở cổ tay",
  vr_wristHint: "Nút tròn VRC Nook luôn quay về phía bạn: chạm bằng đầu tay cầm bên kia, hoặc chỉ tia laser rồi bóp cò, để mở menu — bàn phím, bạn bè, thông báo, phòng này, Chatbox và thông tin", vr_hand: "Tay", vr_left: "Trái", vr_right: "Phải", vr_size: "Cỡ nút (cm)", vr_sizeHint: "3–12 cm; menu mở ra rộng khoảng gấp 3,4 lần", vr_dist: "Khoảng cách từ tay (cm)", vr_distHint: "Lùi về phía khuỷu tay — tăng lên nếu bảng đè lên tay cầm", vr_gaze: "Chỉ hiện khi nhìn vào", vr_gazeHint: "Nhìn về phía cổ tay thì nút hiện dần", vr_people: n => `${n} người trong phòng` });
Object.assign(UPD_I18N.zh, { oi_vr: "VR 叠加层", vr_hint: "通过 SteamVR 显示在头显中（不经 SteamVR 游玩时不显示，例如 Virtual Desktop + VDXR）",
  vr_st_off: "正在启动…", vr_st_noSteamVR: "等待 SteamVR…", vr_st_ok: "正在头显中显示", vr_st_error: "无法连接 SteamVR", vr_err: e => `无法显示叠加层：${e}`,
  vr_toasts: "头显内通知", vr_toast: "显示通知", vr_toastHint: "在眼前显示几秒", vr_test: "测试", vr_testBody: "通知会显示在这里",
  vr_friends: "好友上线", vr_fr_off: "关闭", vr_fr_fav: "仅收藏的好友", vr_fr_all: "所有好友", vr_invites: "邀请和请求", vr_invitesHint: "邀请、请求邀请、好友请求和群组通知",
  vr_joins: "好友进入你的房间", vr_joinsHint: "你自己刚进入时不提醒", vr_joined: "进入了你的房间", vr_wristSec: "手腕菜单", vr_wrist: "显示手腕按钮",
  vr_wristHint: "始终朝向你的圆形 VRC Nook 按钮：用另一只手柄的尖端点一下，或用激光指着并扣下扳机，即可打开菜单——键盘、好友、通知、这个房间、Chatbox 和信息", vr_hand: "手", vr_left: "左手", vr_right: "右手", vr_size: "按钮大小 (cm)", vr_sizeHint: "3–12 cm；展开的菜单约为 3.4 倍宽", vr_dist: "离手距离 (cm)", vr_distHint: "向手肘方向移动——与手柄重叠时调大", vr_gaze: "仅在看时显示", vr_gazeHint: "看向手腕就会淡入", vr_people: n => `房间里 ${n} 人` });

// ======================= Wrist menu: a round VRC Nook button on your wrist that opens a control center above it =======================
// Poked with the other controller or pointed at with SteamVR's laser: vroverlay.py passes where it pressed (vrPoke: down /
// move / up, in the picture's pixels). Open, the panel shows three glass cards like visionOS's Control Center — the time,
// batteries, what's playing and notifications; quick switches and the pages (friends, this room, keyboard, settings); and
// the world you're in. Python asks for fresh pictures every couple of seconds (vrWristTick) and skips ones that didn't change
const VRW = { open: false, page: null, info: {}, at: 0, spots: [], down: null };
const VRW_PX = 256;                  // Pixels across the wrist button
const VRW_IDLE = 20000;              // The open control center closes after this long untouched (ms)
const VRD = { W: 1000, H: 800, tab: "friends", scroll: {}, max: 0, hover: null, down: null, drag: null, spots: [], msg: "", msgAt: 0, sent: new Set(),
  banned: new Set(), confirm: null };  // confirm: {uid, until} — a ban waits for a second press
const VRH = { W: 1560, H: 720 };     // The control center's picture
const VRD_ICONS = {};  // "name|color" -> Image (drawn white or coloured)
function vrdIcon(name, color = vrInk(1)) {
  const k = name + "|" + color;
  if (VRD_ICONS[k] !== undefined) return VRD_ICONS[k];
  VRD_ICONS[k] = null;
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`);
  vrImg(url).then(im => { VRD_ICONS[k] = im; vrwLoaded(); });
  return null;
}
const VRD_AV = {};  // picture URL -> Image
function vrdPic(src) {
  if (!src) return null;
  if (VRD_AV[src] !== undefined) return VRD_AV[src];
  VRD_AV[src] = null;
  vrImg(src).then(im => { VRD_AV[src] = im; vrwLoaded(); });
  return null;
}
const vrdAvatar = uid => vrdPic(PROFILES[uid]?.img);
const VRW_LOGO = {};  // The app's logo, by colour
function vrLogo(color = "#fff") {
  if (VRW_LOGO[color] !== undefined) return VRW_LOGO[color];
  VRW_LOGO[color] = null;
  const svg = LOGO_SVG.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" ').replaceAll("currentColor", color);
  vrImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)).then(im => { VRW_LOGO[color] = im; vrwLoaded(); });
  return null;
}
// Pictures finish loading one by one (a page of profile pictures): redraw once for all of them
let vrwLoadT = 0;
function vrwLoaded() { if (!vrwLoadT) vrwLoadT = setTimeout(() => { vrwLoadT = 0; vrwDraw(); }, 120); }
function vrDisc(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); }
function vrBadge(g, x, y, n, r = 34) {
  g.fillStyle = "#ff453a"; vrDisc(g, x, y, r); g.fill();
  g.fillStyle = "#fff"; g.font = `700 ${Math.round(r * 1.05)}px ${VR_FONT}`; g.textAlign = "center";
  g.fillText(n > 9 ? "9+" : n, x, y + r * 0.38); g.textAlign = "left";
}
function vrdSay(msg) { VRD.msg = msg; VRD.msgAt = Date.now(); vrwDraw("panel"); setTimeout(() => vrwDraw("panel"), 3600); }

// ---------- Icons drawn here (no emoji: they look different on every PC and some come out black) ----------
// kind: hmd / ctrl / trk / toy, in a box of size s centred on x, y
function vrGlyph(g, kind, x, y, s, color = vrInk(1)) {
  g.save(); g.translate(x, y); g.strokeStyle = g.fillStyle = color; g.lineWidth = s * 0.09; g.lineCap = g.lineJoin = "round";
  const u = s / 2;
  if (kind === "hmd") {  // Headset: visor with a nose cut-out, and the strap
    g.beginPath(); g.moveTo(-u * 0.95, -u * 0.45); g.lineTo(u * 0.95, -u * 0.45); g.quadraticCurveTo(u, -u * 0.45, u, -u * 0.3);
    g.lineTo(u, u * 0.3); g.quadraticCurveTo(u, u * 0.45, u * 0.8, u * 0.45); g.lineTo(u * 0.25, u * 0.45); g.lineTo(u * 0.12, u * 0.15);
    g.lineTo(-u * 0.12, u * 0.15); g.lineTo(-u * 0.25, u * 0.45); g.lineTo(-u * 0.8, u * 0.45); g.quadraticCurveTo(-u, u * 0.45, -u, u * 0.3);
    g.lineTo(-u, -u * 0.3); g.quadraticCurveTo(-u, -u * 0.45, -u * 0.95, -u * 0.45); g.closePath(); g.stroke();
  } else if (kind === "ctrl") {  // Controller: tracking ring on top of a grip
    g.beginPath(); g.ellipse(0, -u * 0.38, u * 0.62, u * 0.5, 0, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.roundRect(-u * 0.24, -u * 0.05, u * 0.48, u * 1.0, u * 0.24); g.fill();
  } else if (kind === "trk") {  // Tracker: a puck with three lights
    vrDisc(g, 0, 0, u * 0.8); g.stroke();
    for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 3; vrDisc(g, Math.cos(a) * u * 0.38, Math.sin(a) * u * 0.38, u * 0.13); g.fill(); }
  } else if (kind === "toy") {  // Toy: a capsule shaking
    g.beginPath(); g.roundRect(-u * 0.28, -u * 0.8, u * 0.56, u * 1.6, u * 0.28); g.fill();
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(0, 0, u * 0.62, sx > 0 ? -0.6 : Math.PI - 0.6, sx > 0 ? 0.6 : Math.PI + 0.6); g.stroke();
      g.beginPath(); g.arc(0, 0, u * 0.9, sx > 0 ? -0.5 : Math.PI - 0.5, sx > 0 ? 0.5 : Math.PI + 0.5); g.stroke(); }
  } else {  // Heart rate: a heart
    g.beginPath(); g.moveTo(0, u * 0.75);
    g.bezierCurveTo(-u * 1.1, 0, -u * 0.6, -u * 0.9, 0, -u * 0.35); g.bezierCurveTo(u * 0.6, -u * 0.9, u * 1.1, 0, 0, u * 0.75); g.fill();
  }
  g.restore();
}
// Battery: outline, how full, and a bolt while charging
function vrBattery(g, x, y, w, h, pct, charging) {
  const col = pct > 30 ? "#30d158" : pct > 15 ? "#ffd60a" : "#ff453a";
  g.strokeStyle = vrInk(0.75); g.lineWidth = 2.5; vrRound(g, x, y, w, h, h * 0.3); g.stroke();
  g.fillStyle = vrInk(0.75); vrRound(g, x + w + 2, y + h * 0.3, 4, h * 0.4, 2); g.fill();
  g.fillStyle = col; vrRound(g, x + 4, y + 4, Math.max(3, (w - 8) * Math.min(1, pct / 100)), h - 8, h * 0.18); g.fill();
  if (charging) {
    g.fillStyle = vrInk(1); g.beginPath(); const cx = x + w / 2, cy = y + h / 2, k = h * 0.42;
    g.moveTo(cx + k * 0.2, cy - k); g.lineTo(cx - k * 0.55, cy + k * 0.15); g.lineTo(cx - k * 0.02, cy + k * 0.15); g.lineTo(cx - k * 0.2, cy + k);
    g.lineTo(cx + k * 0.55, cy - k * 0.15); g.lineTo(cx + k * 0.02, cy - k * 0.15); g.closePath(); g.fill();
  }
}
// Media buttons: prev / play / pause / next
function vrMediaGlyph(g, kind, x, y, s) {
  g.save(); g.translate(x, y); g.fillStyle = vrInk(1); const u = s / 2;
  const tri = (x0, dir) => { g.beginPath(); g.moveTo(x0, -u * 0.6); g.lineTo(x0 + dir * u * 0.9, 0); g.lineTo(x0, u * 0.6); g.closePath(); g.fill(); };
  if (kind === "play") tri(-u * 0.35, 1);
  else if (kind === "pause") { g.fillRect(-u * 0.5, -u * 0.6, u * 0.32, u * 1.2); g.fillRect(u * 0.18, -u * 0.6, u * 0.32, u * 1.2); }
  else if (kind === "next") { tri(-u * 0.9, 1); tri(0, 1); }
  else { tri(u * 0.9, -1); tri(0, -1); }
  g.restore();
}
// A card of frosted glass (overlays can't blur what's behind them, so it's a soft see-through gradient with a bright edge)
function vrGlass(g, x, y, w, h, r) {
  const grad = g.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, VRT.glass[0]); grad.addColorStop(1, VRT.glass[1]);
  g.fillStyle = grad; vrRound(g, x, y, w, h, r); g.fill();
  g.strokeStyle = VRT.edge; g.lineWidth = 2; vrRound(g, x + 1, y + 1, w - 2, h - 2, r - 1); g.stroke();
}

// ---------- From Python ----------
// Time to redraw (clock, lists, batteries); info = devices with batteries and what's playing, and all = everything has to
// be sent again (the overlays were just made or shown again)
window.vrWristTick = (info = {}) => {
  VRW.info = info;
  if (VRW.open && Date.now() - VRW.at > VRW_IDLE && VRW.page !== "kb") { VRW.open = false; VRW.page = null; }
  vrwDraw(info.all || VRW.page !== "kb" ? "all" : "ring");  // The keyboard only changes when it's poked
};
// The other controller pressed, moved while pressing, or let go — on the wrist button ("wrist") or the panel
window.vrPoke = ({ o, t: kind, x, y, d }) => {
  VRW.at = Date.now();
  if (o === "wrist") {
    if (kind !== "down") return;
    VRW.open = !VRW.open;
    vrwPage(null);
    return;
  }
  if (kind === "scroll") {  // SteamVR's laser: the stick scrolls the list
    if (VRW.page && VRD.tab === VRW.page) { VRD.scroll[VRD.tab] = Math.max(0, Math.min(VRD.max, (VRD.scroll[VRD.tab] || 0) - d * 160)); vrwDraw("panel"); }
    return;
  }
  if (!VRW.page) return vrhPoke(kind, x, y);
  if (VRW.page === "kb") return vrkPoke(kind, x, y);
  vrdPoke(kind, x, y);
};
function vrwPage(k) {
  if (VRW.page === "kb" && k !== "kb") vrkStop();
  VRW.page = k;
  VRW.down = VRD.hover = VRD.down = null;
  vrwDraw();
}
// Redraw once after everything that changed in this go (pokes, pictures that finished loading): the button, the panel or
// both — each picture takes a while to make, so only what changed
let vrwQueued = null;
function vrwDraw(what = "all") {
  const was = vrwQueued;
  vrwQueued = !was || was === what ? what : "all";
  if (was) return;
  queueMicrotask(() => {
    const w = vrwQueued, c = oiCfg();
    vrwQueued = null;
    if (!c.vr || !c.vrWrist) return;
    vrTheme();
    if (w !== "panel") vrwRing(c);
    if (w !== "ring") vrwPanel(c);
  });
}
// The wrist button: the logo (and a count of notifications), or × while the control center is open
function vrwRing(c) {
  const N = VRW_PX, m = N / 2, r0 = m - 8, [cv, g] = vrCanvas(N, N);
  const glass = (r) => {
    const grad = g.createLinearGradient(0, m - r, 0, m + r);
    grad.addColorStop(0, VRT.glass[0].replace(/[\d.]+\)$/, "0.96)")); grad.addColorStop(1, VRT.glass[1].replace(/[\d.]+\)$/, "0.96)"));
    g.fillStyle = grad; vrDisc(g, m, m, r); g.fill();
  };
  if (VRW.open) {
    glass(r0 * 0.8);
    g.strokeStyle = VRT.edge; g.lineWidth = 4; vrDisc(g, m, m, r0 * 0.8 - 2); g.stroke();
    const im = vrdIcon("x", vrInk(1)); if (im) g.drawImage(im, m - 50, m - 50, 100, 100);
  } else {
    glass(r0);
    g.strokeStyle = vrColor("accent"); g.lineWidth = 12; vrDisc(g, m, m, r0 - 6); g.stroke();
    const im = vrLogo(vrInk(1)); if (im) g.drawImage(im, m - 76, m - 82, 152, 152);
    if (NOTIFS.length) vrBadge(g, m + r0 * 0.7, m - r0 * 0.7, NOTIFS.length);
  }
  api("vr_frame", "wrist", cv.toDataURL("image/png"), (c.vrBtn || OI_DEF.vrBtn) / 100);
}
function vrwPanel(c) {
  const w = (c.vrPanel || OI_DEF.vrPanel) / 100, p = VRW.page;
  if (!VRW.open) return api("vr_frame", "panel", "", 0);
  const [cv, k] = !p ? [vrhDraw(c), 1.4] : p === "kb" ? [vrkDraw(), 0] : [vrdDraw(p), 1];
  api("vr_frame", "panel", cv.toDataURL("image/png"), k ? w * k : (c.vrKb || OI_DEF.vrKb) / 100);
}
// Change an overlay or Chatbox setting from VR: saved like the OSC page does, and shown there if it's open
const VR_SET_IDS = { on: "oiOn", vrToast: "oiVrToast", vrGaze: "oiVrGaze", vrInput: "oiVrInput", vrHand: "oiVrHand", vrBtn: "oiVrBtn", vrPanel: "oiVrPanel", vrDist: "oiVrDist", vrX: "oiVrX", vrY: "oiVrY", vrKb: "oiVrKb" };
function vrSet(patch) {
  const c = { ...oiCfg(), ...patch };
  S.chatInfo = c; save(); api("info_set", c);
  for (const [k, v] of Object.entries(patch)) {
    const el = $(VR_SET_IDS[k]);
    if (el) { if (el.type === "checkbox") el.checked = v; else el.value = v; }
  }
  if ("vrPalm" in patch && $("oiVrShow")) $("oiVrShow").value = patch.vrPalm ? "palm" : "look";
  if ("on" in patch && $("oiOn")) oiTabsUi();
  vrwDraw();
}

// ---------- The control center: three glass cards ----------
function vrhDraw(c) {
  const { W, H } = VRH, [cv, g] = vrCanvas(W, H), spots = [], info = VRW.info || {};
  const spot = (id, x, y, w, h, fn) => spots.push({ id, x, y, w, h, fn });
  const pressed = id => VRW.down === id;
  const CW = 480, CH = 720, R = 56, X1 = 20, X2 = 540, X3 = 1060;
  for (const x of [X1, X2, X3]) vrGlass(g, x, 0, CW, CH, R);
  g.textBaseline = "alphabetic";

  // 1 — the time, batteries, what's playing, notifications
  const now = new Date(), cx1 = X1 + CW / 2;
  g.fillStyle = vrInk(0.9); g.font = `600 30px ${VR_FONT}`; g.textAlign = "center";
  g.fillText(now.toLocaleDateString(S.lang, { weekday: "short", day: "numeric", month: "short" }), cx1, 72);
  g.fillStyle = vrInk(1); g.font = `600 128px ${VR_FONT}`;
  g.fillText(now.toLocaleTimeString(S.lang, { hour: "2-digit", minute: "2-digit", hour12: !c.clock24 }), cx1, 196);
  const devs = [...(info.bpm ? [{ kind: "heart", bpm: info.bpm }] : []), ...(info.devices || []).filter(d => d.battery != null)].slice(0, 6);
  if (devs.length) {  // Up to three a row, centred; tapping them opens the devices page
    const cw = 140, rows = Math.ceil(devs.length / 3);
    devs.forEach((d, i) => {
      const row = Math.floor(i / 3), n = Math.min(3, devs.length - row * 3), col = i % 3;
      const x = cx1 - (n * cw) / 2 + col * cw + 10, y = 232 + row * 46;
      g.textAlign = "left";
      if (d.kind === "heart") {
        vrGlyph(g, "heart", x + 16, y + 14, 30, "#ff453a");
        g.fillStyle = vrInk(1); g.font = `700 24px ${VR_FONT}`; g.fillText(`${d.bpm}`, x + 40, y + 23);
        const nw = g.measureText(`${d.bpm}`).width;
        g.fillStyle = vrInk(0.6); g.font = `18px ${VR_FONT}`; g.fillText("bpm", x + 46 + nw, y + 23);
        return;
      }
      vrGlyph(g, d.kind, x + 16, y + 14, 30, vrInk(0.9));
      vrBattery(g, x + 38, y + 3, 44, 22, d.battery, d.charging);
      g.fillStyle = vrInk(1); g.font = `600 22px ${VR_FONT}`; g.fillText(`${d.battery}`, x + 92, y + 22);
    });
    if (pressed("devs")) { g.fillStyle = vrInk(0.12); vrRound(g, X1 + 20, 222, CW - 40, rows * 46 + 6, 20); g.fill(); }
    spot("devs", X1 + 20, 222, CW - 40, rows * 46 + 6, () => vrwPage("devices"));
  } else { g.fillStyle = vrInk(0.55); g.font = `24px ${VR_FONT}`; g.fillText(t("vw_noBattery"), cx1, 256); }
  g.textAlign = "left";
  // What's playing, with buttons (Windows' media controls: works with Spotify, YouTube in a browser, ...)
  const mx = X1 + 28, my = 336, mw = CW - 56, mh = 236, m = info.media;
  g.fillStyle = vrInk(0.12); vrRound(g, mx, my, mw, mh, 36); g.fill();
  g.fillStyle = vrInk(0.2); vrRound(g, mx + 24, my + 24, 76, 76, 16); g.fill();
  const mi = vrdIcon("music"); if (mi) g.drawImage(mi, mx + 42, my + 42, 40, 40);
  g.fillStyle = vrInk(1); g.font = `600 30px ${VR_FONT}`; g.fillText(vrFit(g, m?.title || t("vw_noMedia"), mw - 140), mx + 120, my + 58);
  if (m?.artist) { g.fillStyle = vrInk(0.65); g.font = `24px ${VR_FONT}`; g.fillText(vrFit(g, m.artist, mw - 140), mx + 120, my + 92); }
  if (m?.durS) {
    g.fillStyle = vrInk(0.25); vrRound(g, mx + 24, my + 124, mw - 48, 8, 4); g.fill();
    g.fillStyle = vrInk(1); vrRound(g, mx + 24, my + 124, Math.max(8, (mw - 48) * Math.min(1, m.posS / m.durS)), 8, 4); g.fill();
  }
  [["prev", -110], [m ? "pause" : "play", 0], ["next", 110]].forEach(([k, dx]) => {
    const bx = mx + mw / 2 + dx, by = my + 186, id = "m:" + k;
    if (pressed(id)) { g.fillStyle = vrInk(0.22); vrDisc(g, bx, by, 36); g.fill(); }
    vrMediaGlyph(g, k, bx, by, k === "pause" || k === "play" ? 48 : 40);
    spot(id, bx - 50, by - 40, 100, 80, () => api("media_ctl", k === "pause" || k === "play" ? "toggle" : k));
  });
  // Notifications
  const ny = 600, nn = NOTIFS.length;
  g.fillStyle = pressed("notifs") ? vrInk(0.24) : vrInk(0.12); vrRound(g, mx, ny, mw, 84, 42); g.fill();
  const bi = vrdIcon("bell"); if (bi) g.drawImage(bi, mx + 28, ny + 24, 36, 36);
  if (nn) vrBadge(g, mx + 62, ny + 24, nn, 14);
  g.fillStyle = vrInk(1); g.font = `600 28px ${VR_FONT}`; g.fillText(vrFit(g, t("vw_notifCount", nn), mw - 150), mx + 84, ny + 52);
  const ch = vrdIcon("chevron-right", vrInk(0.7)); if (ch) g.drawImage(ch, mx + mw - 58, ny + 24, 36, 36);
  spot("notifs", mx, ny, mw, 84, () => vrwPage("notifs"));

  // 2 — quick switches and the pages
  const tg = [["on", "message-square", "Chatbox", c.on, () => vrSet({ on: !c.on })],
    ["toast", c.vrToast ? "bell" : "bell-off", t("vw_notices"), c.vrToast, () => vrSet({ vrToast: !c.vrToast })],
    ["gaze", c.vrPalm ? "hand" : "eye", t(c.vrPalm ? "vw_palm" : "vw_gaze"), c.vrGaze, () => vrSet({ vrGaze: !c.vrGaze })],
    ["input", "hand", t("vw_in_" + (c.vrInput || "both")), true, () => vrSet({ vrInput: { both: "poke", poke: "laser", laser: "both" }[c.vrInput || "both"] })]];
  tg.forEach(([k, ic, label, on, fn], i) => {
    const bx = X2 + 72 + i * 112, by = 86, id = "t:" + k;
    g.fillStyle = on ? vrColor("accent") : vrInk(0.2); vrDisc(g, bx, by, 46); g.fill();
    if (pressed(id)) { g.fillStyle = vrInk(0.25); vrDisc(g, bx, by, 46); g.fill(); }
    const im = vrdIcon(ic, on ? "#fff" : vrInk(1)); if (im) g.drawImage(im, bx - 22, by - 22, 44, 44);
    g.fillStyle = vrInk(0.85); g.font = `20px ${VR_FONT}`; g.textAlign = "center"; g.fillText(vrFit(g, label, 108), bx, by + 76); g.textAlign = "left";
    spot(id, bx - 54, by - 50, 108, 140, fn);
  });
  const lx = X2 + 28, ly = 196, lw = CW - 56, rh = 92;
  g.fillStyle = vrInk(0.1); vrRound(g, lx, ly, lw, rh * 5, 36); g.fill();
  const online = Object.values(FRIENDS).filter(f => f.state === "online").length, people = lastBatch?.players?.length || 0;
  const ndev = (info.devices || []).length + (info.bpm ? 1 : 0);
  [["friends", "users-round", t("vd_friends"), online || ""], ["room", "map-pin", t("vd_room"), people || ""], ["devices", "battery-medium", t("vw_devShort"), ndev || ""],
    ["kb", "keyboard", t("vw_kb"), ""], ["settings", "settings", t("vw_settings"), ""]].forEach(([k, ic, label, val], i) => {
    const y = ly + i * rh, id = "p:" + k;
    if (pressed(id)) { g.fillStyle = vrInk(0.16); vrRound(g, lx + 8, y + 8, lw - 16, rh - 16, 28); g.fill(); }
    if (i) { g.fillStyle = vrInk(0.12); g.fillRect(lx + 92, y, lw - 116, 2); }
    const im = vrdIcon(ic); if (im) g.drawImage(im, lx + 32, y + rh / 2 - 20, 40, 40);
    g.fillStyle = vrInk(1); g.font = `600 30px ${VR_FONT}`; g.fillText(vrFit(g, label, lw - 200), lx + 92, y + rh / 2 + 11);
    if (val !== "") { g.fillStyle = vrInk(0.6); g.font = `26px ${VR_FONT}`; g.textAlign = "right"; g.fillText(val, lx + lw - 64, y + rh / 2 + 10); g.textAlign = "left"; }
    const cr = vrdIcon("chevron-right", vrInk(0.55)); if (cr) g.drawImage(cr, lx + lw - 52, y + rh / 2 - 15, 30, 30);
    spot(id, lx, y, lw, rh, () => vrwPage(k));
  });
  // What the Chatbox is sending, under the list
  g.fillStyle = vrInk(0.6); g.font = `22px ${VR_FONT}`;
  g.fillText(vrFit(g, c.on ? (info.chat || "").replace(/\n/g, "  ") || t("vd_chatOn") : t("vw_chatOff"), lw - 20), lx + 10, ly + rh * 5 + 44);

  // 3 — the world you're in
  const loc = myLoc(), L2 = parseLoc(loc), world = lastBatch?.world && lastBatch.world !== "-" ? lastBatch.world : "";
  const pic = vrdPic(WORLDS[L2.wid]?.img);
  g.save(); vrRound(g, X3, 0, CW, CH, R); g.clip();
  if (pic) {  // The world's picture, filling the card, darker towards the bottom
    const sc = Math.max(CW / pic.width, CH / pic.height), pw = pic.width * sc, ph = pic.height * sc;
    g.globalAlpha = 0.85; g.drawImage(pic, X3 + (CW - pw) / 2, (CH - ph) / 2, pw, ph); g.globalAlpha = 1;
    const sh = g.createLinearGradient(0, 0, 0, CH); sh.addColorStop(0, "rgba(20,24,48,0.35)"); sh.addColorStop(0.45, "rgba(20,24,48,0.6)"); sh.addColorStop(1, "rgba(20,24,48,0.8)");
    g.fillStyle = sh; g.fillRect(X3, 0, CW, CH);
  }
  g.restore();
  const ink0 = VRT.ink;
  if (pic) VRT.ink = "255,255,255";
  const cx3 = X3 + CW / 2;
  g.fillStyle = vrInk(0.22); vrDisc(g, X3 + 70, 70, 40); g.fill();
  const gi = vrdIcon("globe"); if (gi) g.drawImage(gi, X3 + 50, 50, 40, 40);
  if (world) {
    g.fillStyle = vrInk(0.22); vrRound(g, X3 + CW - 150, 44, 116, 52, 26); g.fill();
    const ui = vrdIcon("users-round"); if (ui) g.drawImage(ui, X3 + CW - 136, 56, 28, 28);
    g.fillStyle = vrInk(1); g.font = `600 26px ${VR_FONT}`; g.fillText(String(people), X3 + CW - 98, 80);
  }
  g.fillStyle = vrInk(1); g.font = `700 56px ${VR_FONT}`; g.textAlign = "center";
  const lines = world ? vrWrap(g, world, CW - 70, 3) : [t("vd_notInWorld")];
  if (!world) g.font = `600 36px ${VR_FONT}`;
  lines.forEach((l, i) => g.fillText(l, cx3, 300 + (i - (lines.length - 1) / 2) * 64));
  if (world && L2.wid) {
    const owner = vrOwner(loc);
    g.fillStyle = vrInk(0.8); g.font = `26px ${VR_FONT}`;
    g.fillText(vrFit(g, [itypeLabel(L2), owner === AUTH.id ? t("vw_owner") : ""].filter(Boolean).join(" · "), CW - 60), cx3, 300 + lines.length * 32 + 30);
  }
  g.textAlign = "left";
  g.fillStyle = pressed("room") ? vrInk(0.36) : vrInk(0.22); vrRound(g, X3 + 28, 600, CW - 56, 84, 42); g.fill();
  const pi = vrdIcon("users-round"); if (pi) g.drawImage(pi, X3 + 56, 624, 36, 36);
  g.fillStyle = vrInk(1); g.font = `600 28px ${VR_FONT}`; g.fillText(vrFit(g, t("vw_seePeople"), CW - 200), X3 + 108, 652);
  spot("room", X3, 0, CW, CH, () => vrwPage("room"));
  VRT.ink = ink0;
  VRW.spots = spots;
  return cv;
}
function vrhPoke(kind, x, y) {
  const hit = VRW.spots.findLast(s => x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h);
  if (kind === "down") { VRW.down = hit?.id || null; vrwDraw("panel"); }
  else if (kind === "up") {
    const was = VRW.down;
    VRW.down = null;
    if (hit && hit.id === was) hit.fn(); else vrwDraw("panel");
  }
}
// Who owns an instance, from its location: ~friends(usr_…), ~hidden(usr_…), ~private(usr_…) or ~group(grp_…)
function vrOwner(loc) { return (loc || "").match(/~(?:friends|hidden|private|group)\(((?:usr|grp)_[\w-]+)\)/)?.[1] || ""; }

// ---------- Pages (friends, notifications, room, settings) ----------
// Poke a button to press it; press and drag up or down to scroll the list
function vrdPoke(kind, x, y) {
  const hit = VRD.spots.findLast(s => x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h);
  if (kind === "down") { VRD.down = VRD.hover = hit?.id || null; VRD.drag = { y, s: VRD.scroll[VRD.tab] || 0, moved: false }; }
  else if (kind === "move" && VRD.drag) {
    const dy = y - VRD.drag.y;
    if (Math.abs(dy) > 30) VRD.drag.moved = true;
    if (!VRD.drag.moved) return;
    VRD.scroll[VRD.tab] = Math.max(0, Math.min(VRD.max, VRD.drag.s - dy));
    VRD.down = VRD.hover = null;
  } else if (kind === "up") {
    if (!VRD.drag?.moved && hit && hit.id === VRD.down) hit.fn();
    VRD.down = VRD.hover = VRD.drag = null;
  }
  vrwDraw("panel");
}
function vrdDraw(tab) {
  VRD.tab = tab;
  const { W, H } = VRD, [cv, g] = vrCanvas(W, H), spots = [];
  const spot = (id, x, y, w, h, fn) => spots.push({ id, x, y, w, h, fn });
  const hov = id => VRD.hover === id;
  vrGlass(g, 0, 0, W, H, 48);
  const X = 28, CW = W - X - 28, page = vrdPage(tab);
  // ‹ back to the control center, the title, and how many
  g.fillStyle = hov("back") ? vrInk(0.3) : vrInk(0.16); vrDisc(g, X + 30, 56, 38); g.fill();
  const bi = vrdIcon("chevron-left"); if (bi) g.drawImage(bi, X + 8, 34, 44, 44);
  spot("back", X - 20, 8, 110, 96, () => vrwPage(null));
  g.fillStyle = vrInk(1); g.font = `700 40px ${VR_FONT}`; g.fillText(vrFit(g, page.title, CW - 400), X + 84, 72);
  g.fillStyle = vrInk(0.7); g.font = `26px ${VR_FONT}`; g.textAlign = "right"; g.fillText(vrFit(g, page.sub || "", 280), W - 36, 68); g.textAlign = "left";
  const top = 108, bottom = H - 24, RH = 104;
  const total = page.rows.length * RH;
  VRD.max = Math.max(0, total - (bottom - top));
  const sc = Math.min(VRD.scroll[tab] || 0, VRD.max);
  g.save(); g.beginPath(); g.rect(X - 8, top, CW + 16, bottom - top); g.clip();
  if (!page.rows.length) { g.fillStyle = vrInk(0.45); g.font = `30px ${VR_FONT}`; g.textAlign = "center"; g.fillText(page.empty || "", X + CW / 2, top + 120); g.textAlign = "left"; }
  page.rows.forEach((r, i) => {
    const y = top + i * RH - sc;
    if (y + RH < top || y > bottom) return;
    if (r.id && hov(r.id)) { g.fillStyle = vrInk(0.1); vrRound(g, X - 8, y + 4, CW + 16, RH - 8, 22); g.fill(); }
    let x = X + 8;
    if (r.uid !== undefined || r.ic || r.glyph) {  // Picture: profile picture or an icon tile
      const av = r.uid && vrdAvatar(r.uid);
      g.save(); vrDisc(g, x + 36, y + RH / 2, 36); g.clip();
      if (av) g.drawImage(av, x, y + RH / 2 - 36, 72, 72);
      else {
        g.fillStyle = vrColor(r.color || "gray"); g.fillRect(x, y + RH / 2 - 36, 72, 72);
        if (r.glyph) vrGlyph(g, r.glyph, x + 36, y + RH / 2, 40, "#fff");
        else { const im = vrdIcon(r.ic || "user-round", "#fff"); if (im) g.drawImage(im, x + 18, y + RH / 2 - 18, 36, 36); }
      }
      g.restore();
      if (r.dot) { g.fillStyle = r.dot; vrDisc(g, x + 62, y + RH / 2 + 26, 11); g.fill(); g.strokeStyle = VRT.dark ? "#1c1c21" : "#fff"; g.lineWidth = 4; g.stroke(); }
      x += 92;
    }
    // Buttons on the right, then the text in what's left
    let bx = X + CW - 8;
    for (const b of [...(r.buttons || [])].reverse()) {
      if (b.sw !== undefined) {  // On/off switch
        const sw = 100, sy = y + RH / 2 - 28, id = r.key + ":sw";
        bx -= sw;
        g.fillStyle = b.sw ? vrColor("green") : vrInk(0.2); vrRound(g, bx, sy, sw, 56, 28); g.fill();
        g.fillStyle = "#fff"; vrDisc(g, b.sw ? bx + sw - 28 : bx + 28, sy + 28, 23); g.fill();
        spot(id, bx - 10, sy - 14, sw + 20, 84, b.fn);
        bx -= 14;
        continue;
      }
      g.font = `600 26px ${VR_FONT}`;
      const bw = Math.max(64, g.measureText(b.label).width + (b.ic ? 74 : 44)), by = y + RH / 2 - 30, id = r.key + ":" + b.label;
      bx -= bw;
      g.fillStyle = b.on === false ? vrInk(0.14) : vrColor(b.color || "accent"); if (hov(id)) g.globalAlpha = 0.7;
      vrRound(g, bx, by, bw, 60, 30); g.fill(); g.globalAlpha = 1;
      const fg = b.on === false ? vrInk(1) : "#fff", im = b.ic && vrdIcon(b.ic, fg); if (im) g.drawImage(im, bx + 22, by + 15, 30, 30);
      g.fillStyle = fg; g.fillText(b.label, bx + (b.ic ? 60 : 22), by + 40);
      spot(id, bx, by, bw, 60, b.fn);
      bx -= 14;
    }
    if (r.batt) {
      g.fillStyle = vrInk(1); g.font = `600 30px ${VR_FONT}`; g.textAlign = "right"; g.fillText(`${r.batt.pct}%`, bx, y + RH / 2 + 11); g.textAlign = "left";
      bx -= g.measureText(`${r.batt.pct}%`).width + 20 + 66;
      vrBattery(g, bx, y + RH / 2 - 16, 58, 32, r.batt.pct, r.batt.charging); bx -= 14;
    } else if (r.value) {
      g.fillStyle = vrInk(1); g.font = `700 32px ${VR_FONT}`; g.textAlign = "right"; g.fillText(r.value, bx, y + RH / 2 + 12); g.textAlign = "left";
      bx -= g.measureText(r.value).width + 20;
    }
    const tw = bx - x - 10;
    g.fillStyle = vrInk(1); g.font = `600 32px ${VR_FONT}`; g.fillText(vrFit(g, r.name, tw), x, y + (r.sub ? 46 : 62));
    if (r.sub) { g.fillStyle = vrInk(0.62); g.font = `26px ${VR_FONT}`; g.fillText(vrFit(g, r.sub, tw), x, y + 82); }
    if (r.id && r.fn) spot(r.id, X - 8, y + 4, bx - X, RH - 8, r.fn);
  });
  g.restore();
  if (VRD.max) {  // Scroll bar
    const th = Math.max(60, (bottom - top) * (bottom - top) / total), ty = top + (bottom - top - th) * (sc / VRD.max);
    g.fillStyle = vrInk(0.25); vrRound(g, W - 18, ty, 8, th, 4); g.fill();
  }
  if (VRD.msg && Date.now() - VRD.msgAt < 3500) {  // What just happened, at the bottom
    g.font = `600 28px ${VR_FONT}`;
    const mw = g.measureText(VRD.msg).width + 60;
    g.fillStyle = "rgba(48,209,88,0.95)"; vrRound(g, X + (CW - mw) / 2, H - 92, mw, 60, 30); g.fill();
    g.fillStyle = "#fff"; g.textAlign = "center"; g.fillText(VRD.msg, X + CW / 2, H - 52); g.textAlign = "left";
  }
  VRD.spots = spots;
  return cv;
}

// ---------- Keyboard: the pop-out keyboard's layout and in-game chat mode, poked on the wrist ----------
const VRK = { W: 1400, H: 660, buf: [], cur: 0, sel: false, shift: 0, down: null, rep: 0, spots: [], msg: "", msgOk: null, msgAt: 0, last: 0, typing: false, keep: 0, idle: 0 };
const VRK_MAX = 144, VRK_GAP = 1600;  // Chatbox max characters / send interval (VRChat rate-limits)
function vrkRows() {
  const lang = kbCur(), rows = kbRows(lang, VRK.shift), next = kbNext(lang, S.kbLangs), sc = VRK.shift ? "on" : "fn", lock = VRK.shift === 2;
  const keys = ri => [...rows[ri]].map((ch, i) => ({ id: `k${ri}_${i}`, ch, f: 1 }));
  return [
    { h: 0.7, keys: [["copy", "copy", t("kb_copy")], ["paste", "clipboard", t("kb_paste")], ["all", "text-select", t("kb_all")], ["clear", "eraser", t("vk_clear")]]
      .map(([id, ic, label]) => ({ id, ic, label, f: 1, cls: "fn", small: true })) },
    { h: 1, keys: [...keys(0), { id: "bs", ic: "delete", f: 1.5, cls: "fn" }] },
    { h: 1, keys: keys(1) },
    { h: 1, keys: [...keys(2), vrkWin() ? { id: "enter", ic: "corner-down-left", label: "Enter", f: 1.5, cls: "on" } : { id: "enter", ic: "send", label: t("ch_send"), f: 1.5, cls: "on" }] },
    { h: 1, keys: [{ id: "shift", ic: "arrow-big-up", f: 1.5, cls: sc, lock }, ...keys(3), { id: "shift2", ic: "arrow-big-up", f: 1.5, cls: sc, lock }] },
    { h: 1, keys: [{ id: "lang", ic: "languages", label: KB_LANGS[next].key, f: 1.5, cls: "fn" }, { id: "space", hint: `${KB_LANGS[lang].name} · ${t("kb_space")}`, f: 5, cls: "fn" },
      { id: "left", ic: "chevron-left", f: 1, cls: "fn" }, { id: "right", ic: "chevron-right", f: 1, cls: "fn" }] },
  ];
}
function vrkDraw() {
  // Windows mode types straight into the program, so there's no text box: the keyboard is that much shorter
  const K = VRK, win = vrkWin(), W = K.W, H = win ? K.H - 102 : K.H, [cv, g] = vrCanvas(W, H), spots = [], acc = vrColor("accent"), dim = vrInk(0.55);
  vrGlass(g, 0, 0, W, H, 40);
  // Title bar and ×
  const ki = vrdIcon("keyboard", dim); if (ki) g.drawImage(ki, 30, 20, 32, 32);
  g.fillStyle = dim; g.font = `26px ${VR_FONT}`; g.fillText(t("vw_kb"), 74, 46);
  const modes = [["chat", "message-square", "Chatbox"], ["win", "monitor", t("vk_win")]];
  g.font = `600 24px ${VR_FONT}`;
  const mw = modes.map(([, , l]) => g.measureText(l).width + 80), mx0 = (W - mw[0] - mw[1]) / 2 - 8;
  g.fillStyle = vrInk(0.08); vrRound(g, mx0, 10, mw[0] + mw[1] + 16, 52, 26); g.fill();
  let mx = mx0 + 8;
  modes.forEach(([id, ic, l], i) => {
    const on = (id === "win") === win;
    if (on) { g.fillStyle = acc; vrRound(g, mx, 16, mw[i], 40, 20); g.fill(); }
    const im = vrdIcon(ic, on ? "#fff" : vrInk(0.7)); if (im) g.drawImage(im, mx + 18, 24, 24, 24);
    g.fillStyle = on ? "#fff" : vrInk(0.7); g.fillText(l, mx + 52, 45);
    spots.push({ id: "mode:" + id, x: mx, y: 6, w: mw[i], h: 60, k: {} });
    mx += mw[i];
  });
  const size = oiCfg().vrKb || OI_DEF.vrKb, sx = W - 330;
  [["−", sx, "size:-"], ["+", sx + 170, "size:+"]].forEach(([l, x, id]) => {
    g.fillStyle = K.down === id ? acc : vrInk(0.08); vrRound(g, x, 10, 60, 52, 14); g.fill();
    g.fillStyle = vrInk(1); g.font = `600 32px ${VR_FONT}`; g.textAlign = "center"; g.fillText(l, x + 30, 47);
    spots.push({ id, x: x - 6, y: 0, w: 72, h: 70, k: {} });
  });
  g.fillStyle = dim; g.font = `24px ${VR_FONT}`; g.fillText(t("vw_cm", size), sx + 115, 45); g.textAlign = "left";
  g.fillStyle = K.down === "close" ? "#ff453a" : vrInk(0.07); vrRound(g, W - 100, 10, 80, 52, 14); g.fill();
  const xi = vrdIcon("x", vrInk(1)); if (xi) g.drawImage(xi, W - 76, 20, 32, 32);
  spots.push({ id: "close", x: W - 110, y: 0, w: 110, h: 70, k: {} });
  // What's typed, on one line (the end stays in view), with the count and what just happened
  if (!win) {
    const bx = 20, by = 72, bw = W - 40, bh = 88, n = K.buf.length, cnt = `${n} / ${VRK_MAX}`;
    g.fillStyle = vrInk(0.07); vrRound(g, bx, by, bw, bh, 20); g.fill();
    g.font = `24px ui-monospace, Consolas, monospace`;
    const cw = g.measureText(cnt).width;
    g.fillStyle = n >= VRK_MAX ? "#ff453a" : dim; g.fillText(cnt, bx + bw - 24 - cw, by + 54);
    let right = bx + bw - 24 - cw - 24;
    if (K.msg && Date.now() - K.msgAt < 2200) {
      g.font = `600 26px ${VR_FONT}`;
      const mw = g.measureText(K.msg).width;
      g.fillStyle = K.msgOk ? "#30d158" : K.msgOk === false ? "#ff453a" : dim; g.fillText(K.msg, right - mw, by + 54);
      right -= mw + 24;
    }
    const tx0 = bx + 24, tw = right - tx0;
    g.save(); g.beginPath(); g.rect(tx0 - 4, by, tw + 8, bh); g.clip();
    if (!n) {
      g.fillStyle = acc; g.fillRect(tx0, by + 20, 3, 48);
      g.fillStyle = vrInk(0.45); g.font = `32px ${VR_FONT}`; g.fillText(vrFit(g, t("vk_ph"), tw - 20), tx0 + 14, by + 56);
    } else {
      const line = s => s.replace(/\n/g, " ⏎ ");
      g.font = `500 38px ${VR_FONT}`;
      const before = line(K.buf.slice(0, K.cur).join("")), after = line(K.buf.slice(K.cur).join(""));
      const bwid = g.measureText(before).width, x0 = tx0 - Math.max(0, bwid - tw * 0.85);
      if (K.sel) { g.globalAlpha = 0.45; g.fillStyle = acc; g.fillRect(x0, by + 18, bwid + g.measureText(after).width, 52); g.globalAlpha = 1; }
      g.fillStyle = vrInk(1); g.fillText(before, x0, by + 58); g.fillText(after, x0 + bwid + 4, by + 58);
      if (!K.sel) { g.fillStyle = acc; g.fillRect(x0 + bwid, by + 18, 3, 52); }
    }
    g.restore();
  }
  // Keys
  const rows = vrkRows(), gap = 10, top = win ? 72 : 174, bottom = H - 16;
  const unitH = (bottom - top - gap * (rows.length - 1)) / rows.reduce((s, r) => s + r.h, 0), fs = Math.min(40, unitH * 0.42);
  let y = top;
  for (const row of rows) {
    const h = row.h * unitH, unitW = (W - 40 - gap * (row.keys.length - 1)) / row.keys.reduce((s, k) => s + k.f, 0);
    let x = 20;
    for (const k of row.keys) {
      const w = k.f * unitW, cx = x + w / 2, cy = y + h / 2;
      g.fillStyle = K.down === k.id || k.cls === "on" ? acc : k.cls === "fn" ? vrInk(0.07) : vrInk(0.13);
      vrRound(g, x, y, w, h, 16); g.fill();
      if (k.lock) { g.fillStyle = vrInk(0.85); g.fillRect(x + 12, y + h - 6, w - 24, 3); }
      const lit = K.down === k.id || k.cls === "on";
      g.fillStyle = lit ? "#fff" : vrInk(1); g.textAlign = "center";
      if (k.ch !== undefined) { g.font = `500 ${fs}px ${VR_FONT}`; g.fillText(kbKeyLabel(k.ch), cx, cy + fs * 0.36); }
      else if (k.hint) { g.fillStyle = dim; g.font = `${fs * 0.5}px ${VR_FONT}`; g.fillText(vrFit(g, k.hint, w - 20), cx, cy + fs * 0.18); }
      else {  // Icon, with its label after it when there is one
        const is = fs * (k.small ? 0.7 : 0.9), im = vrdIcon(k.ic, lit ? "#fff" : vrInk(1));
        g.font = `600 ${fs * (k.small ? 0.52 : 0.62)}px ${VR_FONT}`;
        const label = k.label ? vrFit(g, k.label, w - is - 40) : "", lw = label ? g.measureText(label).width + 12 : 0, x1 = cx - (is + lw) / 2;
        if (im) g.drawImage(im, x1, cy - is / 2, is, is);
        if (label) { g.textAlign = "left"; g.fillText(label, x1 + is + 12, cy + fs * 0.2); }
      }
      g.textAlign = "left";
      spots.push({ id: k.id, x, y, w, h, k });
      x += w + gap;
    }
    y += h + gap;
  }
  K.spots = spots;
  return cv;
}
function vrkPoke(kind, x, y) {
  if (kind === "up") { clearTimeout(VRK.rep); VRK.down = null; return vrwDraw("panel"); }
  if (kind !== "down") return;
  const s = VRK.spots.find(s => x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h);
  if (!s) return;
  if (s.id === "close") return vrwPage(null);
  if (s.id.startsWith("mode:")) {  // Shared with the pop-out keyboard
    const m = s.id.slice(5);
    if (m !== (vrkWin() ? "win" : "chat")) { vrkStop(); S.kbFloatMode = m; VRK.wprev = null; save(); }
    return vrwDraw("panel");
  }
  if (s.id.startsWith("size:")) {
    const v = oiCfg().vrKb || OI_DEF.vrKb, nv = Math.min(60, Math.max(20, v + (s.id === "size:+" ? 2 : -2)));
    VRK.down = s.id;
    return nv !== v ? vrSet({ vrKb: nv }) : vrwDraw("panel");
  }
  VRK.down = s.id;
  if (s.k.ch !== undefined) { vrkKey(s.k.ch); if (VRK.shift === 1) VRK.shift = 0; }
  else vrkAct(s.id === "shift2" ? "shift" : s.id);
  if (s.id === "bs") VRK.rep = setTimeout(function again() { vrkAct("bs"); vrwDraw("panel"); VRK.rep = setTimeout(again, 70); }, 450);
  vrwDraw("panel");
}
function vrkInsert(text) {
  const K = VRK;
  if (K.sel) { K.buf = []; K.cur = 0; K.sel = false; }
  const chars = [...text].slice(0, VRK_MAX - K.buf.length);
  if (!chars.length) return;
  K.buf.splice(K.cur, 0, ...chars); K.cur += chars.length;
  // VRChat shows at most 9 lines
  while (K.buf.filter(c => c === "\n").length > 8) { const i = K.buf.lastIndexOf("\n"); K.buf.splice(i, 1); if (K.cur > i) K.cur--; }
  vrkChanged();
}
// Korean syllable composition / Vietnamese + Pinyin tone marks on the character before the cursor
const vrkWin = () => S.kbFloatMode === "win";
// Windows mode: each key goes to the program that has focus right away (a Korean syllable or a tone mark replaces the
// letter just sent)
function vrkWinKey(ch) {
  const r = VRK.wprev ? kbCompose(kbCur(), VRK.wprev, ch) : null;
  if (r != null) { api("vr_press", "bs"); api("vr_type", r); VRK.wprev = [...r].pop(); }
  else { api("vr_type", ch); VRK.wprev = ch; }
}
function vrkWinAct(a) {
  const K = VRK;
  K.wprev = null;
  if (a === "enter") { api("vr_press", K.shift ? "newline" : "enter"); if (K.shift === 1) K.shift = 0; }
  else if (a === "space") api("vr_type", " ");
  else if (a === "clear") { api("vr_press", "all"); api("vr_press", "bs"); }
  else if (["bs", "left", "right", "all", "copy", "paste"].includes(a)) api("vr_press", a);
}
function vrkKey(ch) {
  if (vrkWin()) return vrkWinKey(ch);
  const K = VRK, r = !K.sel && K.cur > 0 ? kbCompose(kbCur(), K.buf[K.cur - 1], ch) : null;
  if (r == null) return vrkInsert(ch);
  K.buf.splice(K.cur - 1, 1, ...r); K.cur += [...r].length - 1;
  vrkChanged();
}
// In-game "typing…" dots: on while there's text, off when empty / sent / idle for 10 s
function vrkChanged() {
  if (!VRK.buf.length || S.chatTyping === false) return vrkStop();
  if (!VRK.typing) { VRK.typing = true; api("chat_typing", true); VRK.keep = setInterval(() => api("chat_typing", true), 4000); }
  clearTimeout(VRK.idle); VRK.idle = setTimeout(vrkStop, 10000);
}
function vrkStop() {
  clearInterval(VRK.keep); clearTimeout(VRK.idle);
  if (VRK.typing) { VRK.typing = false; api("chat_typing", false); }
}
function vrkSay(msg, ok = null) { VRK.msg = msg; VRK.msgOk = ok; VRK.msgAt = Date.now(); vrwDraw("panel"); setTimeout(() => vrwDraw("panel"), 2300); }
async function vrkSend() {
  const text = VRK.buf.join("").trim();
  if (!text) return;
  if (Date.now() - VRK.last < VRK_GAP) return vrkSay(t("vk_wait"));
  VRK.last = Date.now();
  vrkStop();
  const r = await api("chat_send", text, S.chatSound !== false);
  if (!r || r.error) return vrkSay(t("vk_fail"), false);
  if (r.id) window.onChatSent?.(r);  // Into the chat page's history too
  VRK.buf = []; VRK.cur = 0; VRK.sel = false;
  vrkSay(t("vk_sent"), true);
}
function vrkAct(a) {
  const K = VRK;
  if (vrkWin() && a !== "shift" && a !== "lang") return vrkWinAct(a);
  if (a === "shift") K.shift = (K.shift + 1) % 3;
  else if (a === "lang") { S.kbLang = kbNext(kbCur(), S.kbLangs); K.shift = 0; save(); }
  else if (a === "bs") { if (K.sel) { K.buf = []; K.cur = 0; K.sel = false; } else if (K.cur > 0) { K.buf.splice(K.cur - 1, 1); K.cur--; } vrkChanged(); }
  else if (a === "space") vrkInsert(" ");
  else if (a === "enter") { if (K.shift) { vrkInsert("\n"); if (K.shift === 1) K.shift = 0; } else vrkSend(); }
  else if (a === "left" || a === "right") { K.sel = false; K.cur = Math.max(0, Math.min(K.buf.length, K.cur + (a === "left" ? -1 : 1))); }
  else if (a === "all") K.sel = K.buf.length > 0;
  else if (a === "clear") { K.buf = []; K.cur = 0; K.sel = false; vrkChanged(); }
  else if (a === "copy") { if (K.buf.length) { api("copy", K.buf.join("")); vrkSay(t("kb_copied"), true); } }
  else if (a === "paste") api("clip_get").then(x => { if (x) { vrkInsert(String(x).replace(/\r/g, "")); vrwDraw("panel"); } });
}

// What each page lists: {title, sub, empty, rows: [{key, uid|ic, name, sub, dot, buttons: [{label, ic, color, fn}]}]}
function vrdPage(tab) {
  const dotOf = st => ({ "join me": "#42a5f5", active: "#30d158", "ask me": "#ff9f0a", busy: "#ff453a" })[(st || "").toLowerCase()] || "#30d158";
  if (tab === "friends") {
    const list = Object.values(FRIENDS).filter(f => f.state === "online")
      .sort((a, b) => (+!!favRecord("friend", b.id) - +!!favRecord("friend", a.id)) || (a.displayName || "").localeCompare(b.displayName || ""));
    return { title: t("vd_friends"), sub: t("vd_count", list.length), empty: AUTH.loggedIn ? t("vd_noFriends") : t("needLogin"),
      rows: list.map(f => {
        const L2 = parseLoc(f.location), canJoin = !!(L2.wid && L2.name);
        return { key: "f:" + f.id, uid: f.id, dot: dotOf(f.status), name: (favRecord("friend", f.id) ? "★ " : "") + (f.displayName || f.id),
          sub: [f.statusDescription, locLabel(f.location, f.state)].filter(Boolean).join(" · "),
          buttons: canJoin ? [{ label: t("vd_join"), ic: "rocket", fn: () => { doLaunch(f.location); vrdSay(t("vd_joining")); } },
            { label: t("inviteMe"), ic: "send", color: "purple", fn: () => { doInvite(f.location); vrdSay(t("inviteSent")); } }] : [] };
      }) };
  }
  if (tab === "notifs") {
    const list = [...NOTIFS].sort((a, b) => (b.t || "").localeCompare(a.t || ""));
    return { title: t("vd_notifs"), sub: t("vd_items", list.length), empty: t("noNotifs"),
      rows: list.map(n => {
        const drop = { label: t("vw_delete"), ic: "trash-2", color: "red", fn: () => { respond(n.id, false); vrdSay(t("dismissed")); } };
        const buttons = n.type === "friendRequest" ? [{ label: t("accept"), ic: "check", color: "green", fn: () => { respond(n.id, true); vrdSay(t("accepted")); } }, { ...drop, label: t("decline"), ic: undefined, color: undefined, on: false }]
          : n.type === "invite" && n.world ? [{ label: t("vd_join"), ic: "rocket", fn: () => { doLaunch(n.world); vrdSay(t("vd_joining")); } }, drop] : [drop];
        return { key: "n:" + n.id, uid: n.from, name: n.name || n.from, sub: `${t("n_" + n.type, n.worldName || WORLDS[parseLoc(n.world).wid]?.name || "")}${n.msg ? ` — “${n.msg}”` : ""}`, buttons };
      }) };
  }
  if (tab === "room") {
    const players = lastBatch?.players || [];
    const world = lastBatch?.world && lastBatch.world !== "-" ? lastBatch.world : "";
    const owner = vrOwner(myLoc()), mine = owner === AUTH.id;
    // A group's instance: ban from the group when you're allowed to (kick and warn exist only in the game's own menu)
    const gid = owner.startsWith("grp_") ? owner : "";
    if (gid && !GRP.perms && !GRP.permsLoading) gLoadPerms().then(() => vrwDraw("panel"));
    const perms = (GRP.perms?.[gid] || []).map(permName), canBan = !!gid && (perms.includes("*") || perms.includes("group-bans-manage"));
    const banBtn = uid => VRD.banned.has(uid) ? { label: t("vw_banned"), on: false, fn: () => {} }
      : VRD.confirm?.uid === uid && Date.now() < VRD.confirm.until
        ? { label: t("vw_banSure"), ic: "ban", color: "red", fn: async () => {
          VRD.confirm = null;
          const r = await vrc("banGroupMember", { groupId: gid, userId: uid });
          if ("error" in r) vrdSay(t("errGeneric")); else { VRD.banned.add(uid); vrdSay(t("vw_banned")); }
        } }
        : { label: t("vw_ban"), ic: "ban", color: "red", fn: () => { VRD.confirm = { uid, until: Date.now() + 4000 }; vrwDraw("panel"); setTimeout(() => vrwDraw("panel"), 4100); } };
    return { title: world || t("vd_room"), sub: [mine ? t("vw_owner") : canBan ? t("vw_canBan") : "", t("vd_count", players.length)].filter(Boolean).join(" · "), empty: t("vd_notInWorld"),
      rows: players.map(([uid, name]) => {
        const friend = !!FRIENDS[uid], me = uid === AUTH.id;
        const add = me || friend || !uid ? [] : VRD.sent.has(uid) ? [{ label: t("vd_requested"), on: false, fn: () => {} }]
          : [{ label: t("vd_addFriend"), ic: "user-plus", color: "green", fn: async () => {
            const r = await vrc("friend", { userId: uid });
            if ("error" in r) vrdSay(t("errGeneric")); else { VRD.sent.add(uid); vrdSay(t("vd_requested")); }
          } }];
        return { key: "p:" + uid, uid, name, sub: me ? t("vd_you") : friend ? t("vd_friendTag") : "", buttons: [...add, ...(canBan && !me && uid ? [banBtn(uid)] : [])] };
      }) };
  }
  if (tab === "devices") {
    const info = VRW.info || {}, list = info.devices || [];
    const kindName = { hmd: t("vw_k_hmd"), ctrl: t("vw_k_ctrl"), trk: t("vw_k_trk"), toy: t("vw_k_toy") };
    const color = { hmd: "blue", ctrl: "indigo", trk: "teal", toy: "pink" };
    // Named by model; the label says which hand or tracker (the headset's and toys' labels are emoji, left out)
    const side = l => l === "L" ? t("vr_left") : l === "R" ? t("vr_right") : /^T\d+$/.test(l || "") ? l : "";
    const rows = list.map((d, i) => ({ key: "d:" + (d.serial || i), glyph: d.kind, color: color[d.kind] || "gray", name: oiCfg().devNames?.[d.serial] || d.model || [kindName[d.kind] || d.kind, side(d.label)].filter(Boolean).join(" "),
      sub: [d.model ? [kindName[d.kind], side(d.label)].filter(Boolean).join(" ") : "", d.battery == null ? t("vw_noBatt") : d.charging ? t("vw_charging") : ""].filter(Boolean).join(" · "),
      batt: d.battery == null ? null : { pct: d.battery, charging: d.charging } }));
    if (info.bpm) rows.unshift({ key: "d:hr", glyph: "heart", color: "red", name: t("vw_heart"), sub: t("vw_hrLive"), value: `${info.bpm} bpm` });
    return { title: t("vw_devices"), sub: t("vd_items", rows.length), empty: t("vw_noDevices"), rows };
  }
  // Settings: the overlay's own, and the Chatbox switch
  const c = oiCfg(), input = c.vrInput || "both";
  const toggle = (key, on) => [{ label: "sw", sw: !!on, fn: () => vrSet({ [key]: !on }) }];
  const r1 = v => Math.round(v * 10) / 10;
  const step = (key, v, lo, hi, d) => [{ label: "−", on: v > lo ? undefined : false, fn: () => v > lo && vrSet({ [key]: r1(Math.max(lo, v - d)) }) },
    { label: "+", on: v < hi ? undefined : false, fn: () => v < hi && vrSet({ [key]: r1(Math.min(hi, v + d)) }) }];
  const btn = c.vrBtn || OI_DEF.vrBtn, panel = c.vrPanel || OI_DEF.vrPanel, dist = c.vrDist ?? OI_DEF.vrDist, px = c.vrX ?? 0, py = c.vrY ?? 0;
  return { title: t("vw_settings"), sub: "", rows: [
    { key: "s:on", ic: "message-square", color: c.on ? "green" : "gray", name: t("vd_chatOn"), sub: c.on ? t("vw_onNow") : t("vd_off"), buttons: toggle("on", c.on) },
    { key: "s:toast", ic: "bell", color: c.vrToast ? "blue" : "gray", name: t("vr_toast"), sub: t("vr_toastHint"), buttons: toggle("vrToast", c.vrToast) },
    { key: "s:gaze", ic: "eye", color: c.vrGaze ? "purple" : "gray", name: t("vr_gaze"), sub: t("vr_gazeHint"), buttons: toggle("vrGaze", c.vrGaze) },
    { key: "s:palm", ic: c.vrPalm ? "hand" : "eye", color: c.vrGaze ? "purple" : "gray", name: t("vr_palm"), sub: t(c.vrPalm ? "vr_show_palm" : "vr_show_look"),
      buttons: [["look", false], ["palm", true]].map(([k, v]) => ({ label: t("vr_show_" + k), on: !!c.vrPalm === v ? undefined : false, fn: () => vrSet({ vrPalm: v }) })) },
    { key: "s:input", ic: "hand", color: "orange", name: t("vr_input"), sub: t("vr_in_" + input),
      buttons: [{ label: t("vw_change"), fn: () => vrSet({ vrInput: { both: "poke", poke: "laser", laser: "both" }[input] }) }] },
    { key: "s:hand", ic: "hand", color: "teal", name: t("vr_hand"), sub: t(c.vrHand === "right" ? "vr_right" : "vr_left"),
      buttons: [{ label: t(c.vrHand === "right" ? "vr_left" : "vr_right"), fn: () => vrSet({ vrHand: c.vrHand === "right" ? "left" : "right" }) }] },
    { key: "s:btn", ic: "circle-plus", color: "indigo", name: t("vr_size"), sub: t("vw_cm", btn), buttons: step("vrBtn", btn, 3, 12, 1) },
    { key: "s:panel", ic: "picture-in-picture-2", color: "indigo", name: t("vr_panel"), sub: t("vw_cm", panel), buttons: step("vrPanel", panel, 15, 40, 2) },
    { key: "s:x", ic: "arrow-right-left", color: "indigo", name: t("vr_posX"), sub: t("vw_cm", px), buttons: step("vrX", px, -20, 20, 0.5) },
    { key: "s:y", ic: "arrow-up", color: "indigo", name: t("vr_posY"), sub: t("vw_cm", py), buttons: step("vrY", py, -20, 20, 0.5) },
    { key: "s:dist", ic: "map-pin", color: "indigo", name: t("vr_posZ"), sub: t("vw_cm", dist), buttons: step("vrDist", dist, -10, 40, 0.5) },
  ] };
}
tx({
  vd_friends: ["เพื่อนออนไลน์", "Friends online", "オンラインのフレンド"], vd_notifs: ["แจ้งเตือน", "Notifications", "通知"],
  vd_room: ["ห้องนี้", "This room", "このルーム"], vd_chat: ["Chatbox", "Chatbox", "Chatbox"],
  vd_count: [n => `${n} คน`, n => `${n}`, n => `${n} 人`], vd_items: [n => `${n} รายการ`, n => `${n}`, n => `${n} 件`],
  vd_tab_friends: ["เพื่อน", "Friends", "フレンド"], vd_tab_notifs: ["แจ้งเตือน", "Alerts", "通知"], vd_tab_room: ["ห้องนี้", "Room", "ルーム"], vd_tab_chat: ["Chatbox", "Chatbox", "Chatbox"], vd_join: ["เข้าร่วม", "Join", "参加"], vd_joining: ["กำลังเข้าร่วม…", "Joining…", "参加中…"],
  vd_noFriends: ["ไม่มีเพื่อนออนไลน์ตอนนี้", "No friends online right now", "オンラインのフレンドはいません"],
  vd_notInWorld: ["ยังไม่ได้อยู่ในโลก", "Not in a world yet", "まだワールドにいません"], vd_you: ["คุณ", "You", "あなた"], vd_friendTag: ["เพื่อน", "Friend", "フレンド"],
  vd_addFriend: ["เพิ่มเพื่อน", "Add friend", "フレンド申請"], vd_requested: ["ส่งคำขอแล้ว", "Request sent", "申請済み"],
  vd_chatOn: ["ส่งข้อมูลขึ้น Chatbox", "Send info to the Chatbox", "Chatbox に情報を送信"], vd_off: ["ปิดอยู่", "Off", "オフ"],
  vd_turnOn: ["เปิด", "Turn on", "オン"], vd_turnOff: ["ปิด", "Turn off", "オフ"],
  vd_chatOnNow: ["เปิดส่งขึ้น Chatbox แล้ว", "Chatbox info on", "Chatbox 送信オン"], vd_chatOffNow: ["ปิดส่งขึ้น Chatbox แล้ว", "Chatbox info off", "Chatbox 送信オフ"],
  vd_type: ["พิมพ์ข้อความ", "Type a message", "メッセージを入力"], vd_typeHint: ["พิมพ์บนคีย์บอร์ดที่ข้อมือ แล้วส่งขึ้น Chatbox", "On the wrist keyboard, sent to the Chatbox", "手首のキーボードで入力して Chatbox に送信"],
  vd_typeBtn: ["พิมพ์", "Type", "入力"], vd_send: ["ส่ง", "Send", "送信"], vd_chatSent: ["ส่งข้อความแล้ว", "Message sent", "送信しました"],
  vd_quick: ["กดสถานะเพื่อส่ง", "Tap a status to send it", "ステータスをタップで送信"],
});
Object.assign(UPD_I18N.ko, { vd_items: n => `${n}`, vd_tab_friends: "친구", vd_tab_notifs: "알림", vd_tab_room: "방", vd_tab_chat: "Chatbox", vd_friends: "접속 중인 친구", vd_notifs: "알림", vd_room: "이 방", vd_chat: "Chatbox", vd_count: n => `${n}`, vd_join: "참가", vd_joining: "참가하는 중…",
  vd_noFriends: "지금 접속한 친구가 없습니다", vd_notInWorld: "아직 월드에 없습니다", vd_you: "나", vd_friendTag: "친구", vd_addFriend: "친구 추가", vd_requested: "요청 보냄",
  vd_chatOn: "Chatbox에 정보 보내기", vd_off: "꺼짐", vd_turnOn: "켜기", vd_turnOff: "끄기", vd_chatOnNow: "Chatbox 보내기 켬", vd_chatOffNow: "Chatbox 보내기 끔",
  vd_type: "메시지 입력", vd_typeHint: "손목 키보드로 입력해 Chatbox에 보냄", vd_typeBtn: "입력", vd_send: "보내기", vd_chatSent: "메시지를 보냈습니다", vd_quick: "상태를 눌러 보내기", });
Object.assign(UPD_I18N.ru, { vd_items: n => `${n}`, vd_tab_friends: "Друзья", vd_tab_notifs: "Уведомл.", vd_tab_room: "Комната", vd_tab_chat: "Chatbox", vd_friends: "Друзья в сети", vd_notifs: "Уведомления", vd_room: "Эта комната", vd_chat: "Chatbox", vd_count: n => `${n}`, vd_join: "Войти", vd_joining: "Подключение…",
  vd_noFriends: "Сейчас никого из друзей нет в сети", vd_notInWorld: "Вы ещё не в мире", vd_you: "Вы", vd_friendTag: "Друг", vd_addFriend: "В друзья", vd_requested: "Заявка отправлена",
  vd_chatOn: "Отправлять в Chatbox", vd_off: "Выкл.", vd_turnOn: "Вкл.", vd_turnOff: "Выкл.", vd_chatOnNow: "Отправка в Chatbox включена", vd_chatOffNow: "Отправка в Chatbox выключена",
  vd_type: "Написать сообщение", vd_typeHint: "На клавиатуре на запястье, отправится в Chatbox", vd_typeBtn: "Написать", vd_send: "Отправить", vd_chatSent: "Сообщение отправлено", vd_quick: "Нажмите статус, чтобы отправить", });
Object.assign(UPD_I18N.vi, { vd_items: n => `${n}`, vd_tab_friends: "Bạn bè", vd_tab_notifs: "Thông báo", vd_tab_room: "Phòng", vd_tab_chat: "Chatbox", vd_friends: "Bạn bè trực tuyến", vd_notifs: "Thông báo", vd_room: "Phòng này", vd_chat: "Chatbox", vd_count: n => `${n}`, vd_join: "Tham gia", vd_joining: "Đang tham gia…",
  vd_noFriends: "Hiện không có bạn nào trực tuyến", vd_notInWorld: "Chưa ở trong thế giới nào", vd_you: "Bạn", vd_friendTag: "Bạn bè", vd_addFriend: "Kết bạn", vd_requested: "Đã gửi lời mời",
  vd_chatOn: "Gửi thông tin lên Chatbox", vd_off: "Tắt", vd_turnOn: "Bật", vd_turnOff: "Tắt", vd_chatOnNow: "Đã bật gửi Chatbox", vd_chatOffNow: "Đã tắt gửi Chatbox",
  vd_type: "Nhập tin nhắn", vd_typeHint: "Bằng bàn phím ở cổ tay, gửi lên Chatbox", vd_typeBtn: "Nhập", vd_send: "Gửi", vd_chatSent: "Đã gửi tin nhắn", vd_quick: "Chạm trạng thái để gửi", });
Object.assign(UPD_I18N.zh, { vd_items: n => `${n} 条`, vd_tab_friends: "好友", vd_tab_notifs: "通知", vd_tab_room: "房间", vd_tab_chat: "Chatbox", vd_friends: "在线好友", vd_notifs: "通知", vd_room: "这个房间", vd_chat: "Chatbox", vd_count: n => `${n}`, vd_join: "加入", vd_joining: "正在加入…",
  vd_noFriends: "现在没有在线好友", vd_notInWorld: "还没进入世界", vd_you: "你", vd_friendTag: "好友", vd_addFriend: "加好友", vd_requested: "已发送请求",
  vd_chatOn: "发送信息到 Chatbox", vd_off: "关闭", vd_turnOn: "开启", vd_turnOff: "关闭", vd_chatOnNow: "已开启 Chatbox 发送", vd_chatOffNow: "已关闭 Chatbox 发送",
  vd_type: "输入消息", vd_typeHint: "用手腕键盘输入并发送到 Chatbox", vd_typeBtn: "输入", vd_send: "发送", vd_chatSent: "已发送消息", vd_quick: "点击状态即可发送", });
tx({
  vr_panel: ["ขนาดหน้าต่าง (ซม.)", "Panel size (cm)", "パネルの大きさ (cm)"],
  vr_panelHint: ["ความกว้างของหน้าที่เปิดจากเมนู 15–40 ซม.", "Width of the pages the menu opens, 15–40 cm", "メニューから開くページの幅 15–40 cm"],
  vw_kb: ["คีย์บอร์ด", "Keyboard", "キーボード"],
  vk_ph: ["พิมพ์ แล้วกดส่งเพื่อขึ้น Chatbox", "Type, then press Send to put it in the Chatbox", "入力して送信で Chatbox に表示"],
  vk_sent: ["ส่งแล้ว", "Sent", "送信しました"],
  vk_fail: ["ส่งไม่สำเร็จ", "Couldn't send", "送信できませんでした"],
  vk_wait: ["รอสักครู่…", "Wait a moment…", "少しお待ちください…"],
  vk_clear: ["ล้าง", "Clear", "消去"],
});
Object.assign(UPD_I18N.ko, { vr_panel: "패널 크기 (cm)", vr_panelHint: "메뉴에서 여는 페이지 너비 15–40 cm", vw_kb: "키보드", vk_ph: "입력한 뒤 보내기를 누르면 Chatbox에 표시", vk_sent: "보냈습니다", vk_fail: "보내지 못했습니다", vk_wait: "잠시 기다리세요…", vk_clear: "지우기" });
Object.assign(UPD_I18N.ru, { vr_panel: "Размер панели (см)", vr_panelHint: "Ширина страниц из меню, 15–40 см", vw_kb: "Клавиатура", vk_ph: "Наберите текст и нажмите «Отправить»", vk_sent: "Отправлено", vk_fail: "Не удалось отправить", vk_wait: "Подождите…", vk_clear: "Очистить" });
Object.assign(UPD_I18N.vi, { vr_panel: "Cỡ bảng (cm)", vr_panelHint: "Chiều rộng các trang mở từ menu, 15–40 cm", vw_kb: "Bàn phím", vk_ph: "Gõ rồi bấm Gửi để hiện lên Chatbox", vk_sent: "Đã gửi", vk_fail: "Gửi không thành công", vk_wait: "Đợi một chút…", vk_clear: "Xóa" });
Object.assign(UPD_I18N.zh, { vr_panel: "面板大小 (cm)", vr_panelHint: "从菜单打开的页面宽度 15–40 cm", vw_kb: "键盘", vk_ph: "输入后按发送即可显示在 Chatbox", vk_sent: "已发送", vk_fail: "发送失败", vk_wait: "请稍候…", vk_clear: "清除" });
tx({
  vr_input: ["วิธีกด", "How to press", "押し方"],
  vr_in_both: ["จิ้ม หรือ เลเซอร์", "Poke or laser", "つつく・レーザー両方"],
  vr_in_poke: ["จิ้มด้วยปลาย controller", "Poke with the controller tip", "コントローラーの先でつつく"],
  vr_in_laser: ["เลเซอร์ + trigger", "Laser and trigger", "レーザーとトリガー"],
  vr_inputHint: ["เลเซอร์ใช้ของ SteamVR: ชี้ที่ปุ่มแล้วกด trigger เลื่อนรายการด้วยจอยสติ๊ก", "The laser is SteamVR's own: point at a button and pull the trigger; the stick scrolls lists", "レーザーは SteamVR のもの：ボタンを指してトリガー、スティックでリストをスクロール"],
});
Object.assign(UPD_I18N.ko, { vr_input: "누르는 방법", vr_in_both: "누르기 또는 레이저", vr_in_poke: "컨트롤러 끝으로 누르기", vr_in_laser: "레이저와 트리거", vr_inputHint: "레이저는 SteamVR 기본 레이저: 버튼을 가리키고 트리거, 스틱으로 목록 스크롤" });
Object.assign(UPD_I18N.ru, { vr_input: "Как нажимать", vr_in_both: "Касанием или лазером", vr_in_poke: "Касанием кончика контроллера", vr_in_laser: "Лазер и курок", vr_inputHint: "Лазер — стандартный от SteamVR: наведите на кнопку и нажмите курок, стиком прокручивается список" });
Object.assign(UPD_I18N.vi, { vr_input: "Cách bấm", vr_in_both: "Chạm hoặc laser", vr_in_poke: "Chạm bằng đầu tay cầm", vr_in_laser: "Laser và cò", vr_inputHint: "Laser là của SteamVR: chỉ vào nút rồi bóp cò; cần gạt để cuộn danh sách" });
Object.assign(UPD_I18N.zh, { vr_input: "按法", vr_in_both: "点按或激光", vr_in_poke: "用手柄尖端点按", vr_in_laser: "激光和扳机", vr_inputHint: "激光为 SteamVR 自带：指向按钮并扣扳机，摇杆滚动列表" });
tx({
  vw_settings: ["ตั้งค่า", "Settings", "設定"],
  vw_notices: ["แจ้งเตือน", "Notices", "通知"],
  vw_gaze: ["มองข้อมือ", "Look to show", "見て表示"],
  vw_noBattery: ["ไม่มีข้อมูลแบตเตอรี่", "No batteries to show", "バッテリー情報なし"],
  vw_noMedia: ["ไม่ได้เล่นเพลง", "Not playing", "再生していません"],
  vw_chatOff: ["Chatbox ปิดอยู่", "Chatbox is off", "Chatbox はオフ"],
  vw_seePeople: ["ดูคนในห้อง", "People here", "ルームの人"],
  vw_owner: ["คุณเป็นเจ้าของห้อง", "Your instance", "あなたのインスタンス"],
  vw_onNow: ["กำลังส่งอยู่", "Sending", "送信中"],
  vw_change: ["เปลี่ยน", "Change", "変更"],
  vw_ban: ["แบน", "Ban", "BAN"], vw_banSure: ["ยืนยันแบน?", "Ban — sure?", "本当に BAN?"], vw_banned: ["แบนจากกลุ่มแล้ว", "Banned from the group", "グループから BAN しました"],
  vw_canBan: ["แบนจากกลุ่มได้", "You can ban here", "ここで BAN できます"],
  vw_in_both: ["จิ้ม+เลเซอร์", "Both", "両方"], vw_in_poke: ["จิ้ม", "Poke", "つつく"], vw_in_laser: ["เลเซอร์", "Laser", "レーザー"],
  vw_notifCount: [n => n ? `${n} การแจ้งเตือน` : "ไม่มีการแจ้งเตือน", n => n ? `${n} notification${n > 1 ? "s" : ""}` : "No notifications", n => n ? `通知 ${n} 件` : "通知はありません"],
  vw_cm: [n => `${n} ซม.`, n => `${n} cm`, n => `${n} cm`],
});
Object.assign(UPD_I18N.ko, { vw_ban: "차단(밴)", vw_banSure: "정말 밴할까요?", vw_banned: "그룹에서 밴했습니다", vw_canBan: "여기서 밴할 수 있음", vw_in_both: "둘 다", vw_in_poke: "누르기", vw_in_laser: "레이저", vw_settings: "설정", vw_notices: "알림", vw_gaze: "볼 때 표시", vw_noBattery: "배터리 정보 없음", vw_noMedia: "재생 중 아님", vw_chatOff: "Chatbox 꺼짐", vw_seePeople: "방에 있는 사람", vw_owner: "내 인스턴스", vw_onNow: "보내는 중", vw_change: "변경", vw_notifCount: n => n ? `알림 ${n}개` : "알림 없음", vw_cm: n => `${n} cm` });
Object.assign(UPD_I18N.ru, { vw_ban: "Бан", vw_banSure: "Точно забанить?", vw_banned: "Забанен в группе", vw_canBan: "Здесь можно банить", vw_in_both: "Оба", vw_in_poke: "Касание", vw_in_laser: "Лазер", vw_settings: "Настройки", vw_notices: "Уведомл.", vw_gaze: "По взгляду", vw_noBattery: "Нет данных о заряде", vw_noMedia: "Ничего не играет", vw_chatOff: "Chatbox выключен", vw_seePeople: "Кто здесь", vw_owner: "Ваш инстанс", vw_onNow: "Отправляется", vw_change: "Сменить", vw_notifCount: n => n ? `Уведомлений: ${n}` : "Нет уведомлений", vw_cm: n => `${n} см` });
Object.assign(UPD_I18N.vi, { vw_ban: "Cấm", vw_banSure: "Chắc chắn cấm?", vw_banned: "Đã cấm khỏi nhóm", vw_canBan: "Bạn có thể cấm ở đây", vw_in_both: "Cả hai", vw_in_poke: "Chạm", vw_in_laser: "Laser", vw_settings: "Cài đặt", vw_notices: "Thông báo", vw_gaze: "Nhìn để hiện", vw_noBattery: "Không có thông tin pin", vw_noMedia: "Không phát", vw_chatOff: "Chatbox đang tắt", vw_seePeople: "Người trong phòng", vw_owner: "Phòng của bạn", vw_onNow: "Đang gửi", vw_change: "Đổi", vw_notifCount: n => n ? `${n} thông báo` : "Không có thông báo", vw_cm: n => `${n} cm` });
Object.assign(UPD_I18N.zh, { vw_ban: "封禁", vw_banSure: "确定封禁？", vw_banned: "已从群组封禁", vw_canBan: "你可以在这里封禁", vw_in_both: "两者", vw_in_poke: "点按", vw_in_laser: "激光", vw_settings: "设置", vw_notices: "通知", vw_gaze: "看时显示", vw_noBattery: "没有电量信息", vw_noMedia: "未在播放", vw_chatOff: "Chatbox 已关闭", vw_seePeople: "房间里的人", vw_owner: "你的房间", vw_onNow: "正在发送", vw_change: "更改", vw_notifCount: n => n ? `${n} 条通知` : "没有通知", vw_cm: n => `${n} cm` });
// New-instance dialog's strings (UPD_I18N exists only from here on)
Object.assign(UPD_I18N.ko, { ci_me: "바로 들어가기", ci_meHint: "만든 뒤 나에게 초대를 보냅니다 — 게임에서 수락하세요", ci_find: "친구 검색", ci_invite: "친구 초대", ci_invNone: "만든 뒤 초대할 친구를 선택하세요", ci_invPicked: n => `${n}명 선택`, ci_createInvite: n => `만들고 ${n}명 초대`,
  ci_offline: "오프라인", ci_noFriend: "친구를 찾을 수 없음", ci_inviting: n => `${n}명 초대하는 중…`, ci_invited: n => `${n}명을 초대했습니다`, ci_invitedSome: (ok, n) => `${n}명 중 ${ok}명 초대함` });
Object.assign(UPD_I18N.ru, { ci_me: "Сразу зайти", ci_meHint: "После создания придёт приглашение вам — примите его в игре", ci_find: "Найти друга", ci_invite: "Пригласить друзей", ci_invNone: "Отметьте друзей — приглашения уйдут после создания", ci_invPicked: n => `Выбрано: ${n}`, ci_createInvite: n => `Создать и пригласить (${n})`,
  ci_offline: "Не в сети", ci_noFriend: "Друзья не найдены", ci_inviting: n => `Приглашаем (${n})…`, ci_invited: n => `Приглашено: ${n}`, ci_invitedSome: (ok, n) => `Приглашено ${ok} из ${n}` });
Object.assign(UPD_I18N.vi, { ci_me: "Vào ngay", ci_meHint: "Gửi lời mời cho bạn sau khi tạo — chấp nhận trong game", ci_find: "Tìm bạn bè", ci_invite: "Mời bạn bè", ci_invNone: "Đánh dấu bạn bè để mời sau khi tạo", ci_invPicked: n => `Đã chọn ${n}`, ci_createInvite: n => `Tạo và mời ${n}`,
  ci_offline: "Ngoại tuyến", ci_noFriend: "Không tìm thấy bạn bè", ci_inviting: n => `Đang mời ${n}…`, ci_invited: n => `Đã mời ${n}`, ci_invitedSome: (ok, n) => `Đã mời ${ok}/${n}` });
Object.assign(UPD_I18N.zh, { ci_me: "立即进入", ci_meHint: "创建后向你发送邀请——在游戏中接受即可", ci_find: "搜索好友", ci_invite: "邀请好友", ci_invNone: "勾选好友，创建后发送邀请", ci_invPicked: n => `已选 ${n} 人`, ci_createInvite: n => `创建并邀请 ${n} 人`,
  ci_offline: "离线", ci_noFriend: "未找到好友", ci_inviting: n => `正在邀请 ${n} 人…`, ci_invited: n => `已邀请 ${n} 人`, ci_invitedSome: (ok, n) => `已邀请 ${ok}/${n} 人` });

tx({
  vw_devices: ["อุปกรณ์ที่เชื่อมต่อ", "Connected devices", "接続中のデバイス"], vw_devShort: ["อุปกรณ์", "Devices", "デバイス"], vw_noDevices: ["ยังไม่มีอุปกรณ์ที่เชื่อมต่อ", "No devices connected", "接続中のデバイスはありません"],
  vw_k_hmd: ["แว่น", "Headset", "ヘッドセット"], vw_k_ctrl: ["คอนโทรลเลอร์", "Controller", "コントローラー"], vw_k_trk: ["แทรคเกอร์", "Tracker", "トラッカー"], vw_k_toy: ["Intiface", "Intiface", "Intiface"],
  vw_noBatt: ["ไม่รายงานแบต", "No battery reading", "バッテリー情報なし"], vw_charging: ["กำลังชาร์จ", "Charging", "充電中"],
  vw_heart: ["อัตราการเต้นหัวใจ", "Heart rate", "心拍数"], vw_hrLive: ["เชื่อมต่ออยู่", "Connected", "接続中"],
  vr_posX: ["ตำแหน่ง X ซ้าย/ขวา (ซม.)", "Position X, left/right (cm)", "位置 X 左右 (cm)"], vr_posY: ["ตำแหน่ง Y ลง/ขึ้น (ซม.)", "Position Y, down/up (cm)", "位置 Y 上下 (cm)"],
  vr_posZ: ["ตำแหน่ง Z ระยะจากมือ (ซม.)", "Position Z, from the hand (cm)", "位置 Z 手からの距離 (cm)"],
  vr_posXHint: ["ค่าลบไปทางซ้าย ค่าบวกไปทางขวา ของ controller ปรับได้ทีละ 0.5", "Minus moves it left of the controller, plus right; steps of 0.5", "マイナスでコントローラーの左、プラスで右。0.5 刻み"],
  vr_posYHint: ["ค่าลบลงล่าง ค่าบวกขึ้นบน ปรับได้ทีละ 0.5", "Minus moves it down, plus up; steps of 0.5", "マイナスで下、プラスで上。0.5 刻み"],
});
Object.assign(UPD_I18N.ko, { vw_devShort: "기기", vw_devices: "연결된 기기", vw_noDevices: "연결된 기기가 없습니다", vw_k_hmd: "헤드셋", vw_k_ctrl: "컨트롤러", vw_k_trk: "트래커", vw_k_toy: "Intiface", vw_noBatt: "배터리 정보 없음", vw_charging: "충전 중",
  vw_heart: "심박수", vw_hrLive: "연결됨", vr_posX: "위치 X 좌/우 (cm)", vr_posY: "위치 Y 아래/위 (cm)", vr_posZ: "위치 Z 손에서 거리 (cm)",
  vr_posXHint: "마이너스는 컨트롤러 왼쪽, 플러스는 오른쪽 · 0.5 단위", vr_posYHint: "마이너스는 아래, 플러스는 위 · 0.5 단위" });
Object.assign(UPD_I18N.ru, { vw_devShort: "Устройства", vw_devices: "Подключённые устройства", vw_noDevices: "Нет подключённых устройств", vw_k_hmd: "Шлем", vw_k_ctrl: "Контроллер", vw_k_trk: "Трекер", vw_k_toy: "Intiface", vw_noBatt: "Нет данных о батарее", vw_charging: "Заряжается",
  vw_heart: "Пульс", vw_hrLive: "Подключено", vr_posX: "Позиция X, влево/вправо (см)", vr_posY: "Позиция Y, вниз/вверх (см)", vr_posZ: "Позиция Z, от руки (см)",
  vr_posXHint: "Минус — левее контроллера, плюс — правее; шаг 0,5", vr_posYHint: "Минус — ниже, плюс — выше; шаг 0,5" });
Object.assign(UPD_I18N.vi, { vw_devShort: "Thiết bị", vw_devices: "Thiết bị đã kết nối", vw_noDevices: "Chưa có thiết bị nào kết nối", vw_k_hmd: "Kính", vw_k_ctrl: "Tay cầm", vw_k_trk: "Tracker", vw_k_toy: "Intiface", vw_noBatt: "Không có thông tin pin", vw_charging: "Đang sạc",
  vw_heart: "Nhịp tim", vw_hrLive: "Đã kết nối", vr_posX: "Vị trí X, trái/phải (cm)", vr_posY: "Vị trí Y, xuống/lên (cm)", vr_posZ: "Vị trí Z, cách tay (cm)",
  vr_posXHint: "Âm sang trái tay cầm, dương sang phải; bước 0,5", vr_posYHint: "Âm xuống dưới, dương lên trên; bước 0,5" });
Object.assign(UPD_I18N.zh, { vw_devShort: "设备", vw_devices: "已连接的设备", vw_noDevices: "没有已连接的设备", vw_k_hmd: "头显", vw_k_ctrl: "手柄", vw_k_trk: "追踪器", vw_k_toy: "Intiface", vw_noBatt: "无电量信息", vw_charging: "充电中",
  vw_heart: "心率", vw_hrLive: "已连接", vr_posX: "位置 X 左/右 (cm)", vr_posY: "位置 Y 下/上 (cm)", vr_posZ: "位置 Z 离手距离 (cm)",
  vr_posXHint: "负数移到手柄左边，正数右边；每次 0.5", vr_posYHint: "负数向下，正数向上；每次 0.5" });

tx({
  vw_delete: ["ลบ", "Delete", "削除"], vk_win: ["Windows", "Windows", "Windows"],
  vk_winPh: ["พิมพ์ลงโปรแกรมที่เปิดอยู่บนคอมทันที (เช่น VRChat หรือเบราว์เซอร์)", "Types straight into the program in focus on your PC (VRChat, a browser…)", "PC で選択中のプログラムに直接入力（VRChat、ブラウザなど）"],
  vr_kbSize: ["ขนาดคีย์บอร์ด (ซม.)", "Keyboard size (cm)", "キーボードの大きさ (cm)"], vr_kbSizeHint: ["20–60 ซม. ปรับในหน้าคีย์บอร์ดบนข้อมือได้ด้วย", "20–60 cm; also on the wrist keyboard itself", "20–60 cm。手首のキーボードでも変更できます"],
  vr_palm: ["ท่าเรียกปุ่ม", "Gesture that shows it", "ボタンを出す動作"],
  vr_palmHint: ["ใช้ตอนเปิด \"แสดงเฉพาะตอนมองข้อมือ\" · ยกแขน: ยกข้อมือขึ้นมามอง · แบมือ: หงายฝ่ามือข้างที่มีปุ่มเข้าหาหน้า", "With \"Only when you look at it\" on · Raise arm: lift your wrist to look at it · Palm: turn the palm of that hand towards your face", "「見たときだけ表示」がオンのとき · 腕を上げる：手首を見る · 手のひら：ボタンのある手のひらを顔に向ける"],
  vr_show_look: ["ยกแขน", "Raise arm", "腕を上げる"], vr_show_palm: ["แบมือ", "Palm", "手のひら"], vw_palm: ["แบมือ", "Palm", "手のひら"],
});
Object.assign(UPD_I18N.ko, { vw_delete: "삭제", vk_win: "Windows", vk_winPh: "PC에서 선택된 프로그램에 바로 입력 (VRChat, 브라우저 등)", vr_kbSize: "키보드 크기 (cm)", vr_kbSizeHint: "20–60 cm · 손목 키보드에서도 바꿀 수 있음",
  vr_palm: "버튼을 띄우는 동작", vr_palmHint: "\"볼 때만 표시\"가 켜져 있을 때 · 팔 들기: 손목을 들어 보기 · 손바닥: 그 손의 손바닥을 얼굴 쪽으로", vr_show_look: "팔 들기", vr_show_palm: "손바닥", vw_palm: "손바닥" });
Object.assign(UPD_I18N.ru, { vw_delete: "Удалить", vk_win: "Windows", vk_winPh: "Печатает сразу в активную программу на ПК (VRChat, браузер…)", vr_kbSize: "Размер клавиатуры (см)", vr_kbSizeHint: "20–60 см; меняется и на самой клавиатуре",
  vr_palm: "Жест для кнопки", vr_palmHint: "Когда включено «Только когда смотрите» · Поднять руку: посмотреть на запястье · Ладонь: повернуть ладонь этой руки к лицу", vr_show_look: "Поднять руку", vr_show_palm: "Ладонь", vw_palm: "Ладонь" });
Object.assign(UPD_I18N.vi, { vw_delete: "Xóa", vk_win: "Windows", vk_winPh: "Gõ thẳng vào chương trình đang chọn trên PC (VRChat, trình duyệt…)", vr_kbSize: "Cỡ bàn phím (cm)", vr_kbSizeHint: "20–60 cm; chỉnh được ngay trên bàn phím ở cổ tay",
  vr_palm: "Cử chỉ hiện nút", vr_palmHint: "Khi bật \"Chỉ hiện khi nhìn vào\" · Giơ tay: nâng cổ tay lên nhìn · Lòng bàn tay: ngửa lòng bàn tay đó về phía mặt", vr_show_look: "Giơ tay", vr_show_palm: "Lòng bàn tay", vw_palm: "Bàn tay" });
Object.assign(UPD_I18N.zh, { vw_delete: "删除", vk_win: "Windows", vk_winPh: "直接输入到电脑上当前选中的程序（VRChat、浏览器等）", vr_kbSize: "键盘大小 (cm)", vr_kbSizeHint: "20–60 cm；也可在手腕键盘上调整",
  vr_palm: "显示按钮的手势", vr_palmHint: "开启“仅在看时显示”时 · 抬手：抬起手腕看 · 手掌：把那只手的掌心转向脸", vr_show_look: "抬手", vr_show_palm: "手掌", vw_palm: "手掌" });

// ---------- Feedback: the Discord server, at the bottom of the sidebar ----------
const FEEDBACK_URL = "https://discord.gg/S7nH9QJKX";
tx({ nav_vr: ["VR overlay", "VR overlay", "VR オーバーレイ"], feedback: ["Feedback", "Feedback", "フィードバック"],
  feedbackHint: ["แจ้งปัญหาหรือเสนอไอเดียใน Discord", "Report a problem or share an idea on Discord", "Discord で不具合の報告やアイデアを送る"] });
Object.assign(UPD_I18N.ko, { nav_vr: "VR 오버레이", feedback: "피드백", feedbackHint: "Discord에서 문제 신고나 아이디어 공유" });
Object.assign(UPD_I18N.ru, { nav_vr: "VR-оверлей", feedback: "Отзыв", feedbackHint: "Сообщить о проблеме или предложить идею в Discord" });
Object.assign(UPD_I18N.vi, { nav_vr: "Lớp phủ VR", feedback: "Góp ý", feedbackHint: "Báo lỗi hoặc gửi ý tưởng trên Discord" });
Object.assign(UPD_I18N.zh, { nav_vr: "VR 叠加层", feedback: "反馈", feedbackHint: "在 Discord 报告问题或分享想法" });
document.head.insertAdjacentHTML("beforeend", `<style>
.side-feedback { margin-top: auto; padding: 6px 10px 12px; border-top: 1px solid var(--sep); }
.side-feedback .nav-item { width: 100%; }
</style>`);
document.querySelector(".sidebar").insertAdjacentHTML("beforeend", `<div class="side-feedback"><button class="nav-item" id="feedbackBtn"
  onclick="feedbackOpen()"><span class="tile" style="--c:#5865f2">${icon("megaphone")}</span><span class="label"></span></button></div>`);
// It leaves the app for a website: say where first
function feedbackOpen() {
  openX(t("feedback"), () => `<p class="hint-inline" style="display:block;margin:4px 2px 10px">${t("fb_leave")}</p>
    <div class="locline">${icon("link")}<span class="w">${esc(FEEDBACK_URL)}</span></div>
    <div class="form-actions">${btn(t("cancel"), "closeX()")}${btn(t("fb_open"), "closeX();api('open_url',FEEDBACK_URL)", "primary", "external-link")}</div>`);
}
function feedbackUi() { const b = $("feedbackBtn"); b.querySelector(".label").textContent = t("feedback"); b.title = t("feedbackHint"); }
const _buildNavF = buildNav;
buildNav = function (...a) { feedbackUi(); return _buildNavF(...a); };
feedbackUi();
tx({ oi_devPerLine: ["อุปกรณ์ละ 1 บรรทัด", "One device per line", "1 行に 1 台"],
  oi_devPerLineHint: ["ขึ้นบรรทัดใหม่ทุกชิ้น (Chatbox แสดงได้สูงสุด 9 บรรทัด)", "Each device on its own line (the Chatbox shows up to 9 lines)", "デバイスごとに改行（Chatbox は最大 9 行）"],
  fb_leave: ["ปุ่มนี้จะเปิดเว็บไซต์ภายนอกในเบราว์เซอร์ (Discord ของ VRC Nook)", "This opens an outside website in your browser (VRC Nook's Discord)", "外部サイト（VRC Nook の Discord）をブラウザで開きます"],
  fb_open: ["เปิดลิงก์", "Open link", "リンクを開く"] });
Object.assign(UPD_I18N.ko, { oi_devPerLine: "기기마다 한 줄", oi_devPerLineHint: "기기마다 줄바꿈 (Chatbox는 최대 9줄)", fb_leave: "브라우저에서 외부 웹사이트(VRC Nook Discord)를 엽니다", fb_open: "링크 열기" });
Object.assign(UPD_I18N.ru, { oi_devPerLine: "Одно устройство в строке", oi_devPerLineHint: "Каждое устройство с новой строки (в чатбоксе до 9 строк)", fb_leave: "Откроется внешний сайт в браузере (Discord VRC Nook)", fb_open: "Открыть ссылку" });
Object.assign(UPD_I18N.vi, { oi_devPerLine: "Mỗi thiết bị một dòng", oi_devPerLineHint: "Xuống dòng cho từng thiết bị (Chatbox hiện tối đa 9 dòng)", fb_leave: "Sẽ mở một trang web bên ngoài trong trình duyệt (Discord của VRC Nook)", fb_open: "Mở liên kết" });
Object.assign(UPD_I18N.zh, { oi_devPerLine: "每个设备一行", oi_devPerLineHint: "每个设备单独一行（聊天框最多 9 行）", fb_leave: "将在浏览器中打开外部网站（VRC Nook 的 Discord）", fb_open: "打开链接" });
tx({ oi_devRename: ["คลิกเพื่อตั้งชื่อเอง (เว้นว่าง = ใช้ชื่อเดิม)", "Click to give it your own name (empty = its own name)", "クリックして名前を付ける（空欄 = 元の名前）"] });
Object.assign(UPD_I18N.ko, { oi_devRename: "클릭해서 이름 지정 (비우면 원래 이름)" });
Object.assign(UPD_I18N.ru, { oi_devRename: "Нажмите, чтобы задать своё имя (пусто — исходное)" });
Object.assign(UPD_I18N.vi, { oi_devRename: "Bấm để đặt tên riêng (để trống = tên gốc)" });
Object.assign(UPD_I18N.zh, { oi_devRename: "点击自定义名称（留空 = 原名）" });
