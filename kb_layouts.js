// ======================= Keyboard layouts for every language (shared by the in-app and floating keyboards) =======================
// Each language: n = normal, s = Shift — 4 rows, each a list of keys (some emoji span several code points, so they're stored as arrays)
const KB_SPLIT = s => [...s];
const KB_LANGS = {
  th: { name: "ไทย", key: "ไทย",
        n: ["ๅ/-ภถุึคตจขช", "ๆไำพะัีรนยบลฃ", "ฟหกดเ้่าสวง", "ผปแอิืทมใฝ"].map(KB_SPLIT),
        s: ["+๑๒๓๔ู฿๕๖๗๘๙", "๐\"ฎฑธํ๊ณฯญฐ,ฅ", "ฤฆฏโฌ็๋ษศซ.", "()ฉฮฺ์?ฒฬฦ"].map(KB_SPLIT) },
  en: { name: "English", key: "EN",
        n: ["1234567890-", "qwertyuiop", "asdfghjkl'", "zxcvbnm,.?"].map(KB_SPLIT),
        s: ["!@#$%^&*()_", "QWERTYUIOP", "ASDFGHJKL\"", "ZXCVBNM;:!"].map(KB_SPLIT) },
  // Japanese: laid out by kana rows (あかさたな…), easier than JIS — Shift = voiced / small kana / punctuation (types kana only, no kanji conversion)
  ja: { name: "ひらがな", key: "あ",
        n: ["あいうえおかきくけこやゆよ", "さしすせそたちつてとわをん", "なにぬねのはひふへほ、。ー", "まみむめもらりるれろっ"].map(KB_SPLIT),
        s: ["ぁぃぅぇぉがぎぐげごゃゅょ", "ざじずぜぞだぢづでどゎ「」", "ぱぴぷぺぽばびぶべぼ！？…", "〜・（）『』゛゜ゔっ"].map(KB_SPLIT) },
  // Korean: 2-set layout (두벌식) — letters are composed into syllables automatically
  ko: { name: "한국어", key: "한",
        n: ["1234567890-", "ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔ", "ㅁㄴㅇㄹㅎㅗㅓㅏㅣ'", "ㅋㅌㅊㅍㅠㅜㅡ,.?"].map(KB_SPLIT),
        s: ["!@#$%^&*()_", "ㅃㅉㄸㄲㅆㅛㅕㅑㅒㅖ", "ㅁㄴㅇㄹㅎㅗㅓㅏㅣ\"", "ㅋㅌㅊㅍㅠㅜㅡ;:!"].map(KB_SPLIT) },
  ru: { name: "Русский", key: "РУ",
        n: ["1234567890-", "йцукенгшщзхъ", "фывапролджэ", "ячсмитьбю.?"].map(KB_SPLIT),
        s: ["!\"№;%:?*()_", "ЙЦУКЕНГШЩЗХЪ", "ФЫВАПРОЛДЖЭ", "ЯЧСМИТЬБЮ,!"].map(KB_SPLIT) },
  // Vietnamese: tone keys (◌́ ◌̀ ◌̉ ◌̃ ◌̣) pressed after a vowel — pressing the same tone again removes it
  vi: { name: "Tiếng Việt", key: "VI",
        n: ["̣́̀̉̃ăâđêôơư", "qwertyuiop", "asdfghjkl'", "zxcvbnm,.?"].map(KB_SPLIT),
        s: ["̣́̀̉̃ĂÂĐÊÔƠƯ", "QWERTYUIOP", "ASDFGHJKL\"", "ZXCVBNM;:!"].map(KB_SPLIT) },
  // Chinese Pinyin: 4 tone keys (◌̄ ◌́ ◌̌ ◌̀) pressed after a vowel (types Pinyin only, no conversion to Chinese characters)
  zh: { name: "拼音 Pīnyīn", key: "拼",
        n: ["̄́̌̀ü1234567", "qwertyuiop", "asdfghjkl'", "zxcvbnm，。？"].map(KB_SPLIT),
        s: ["̄́̌̀Ü890-!", "QWERTYUIOP", "ASDFGHJKL\"", "ZXCVBNM、；："].map(KB_SPLIT) },
  emoji: { name: "Emoji", key: "😀", pages: true,
        n: [["😀", "😂", "🤣", "😊", "😍", "🥰", "😘", "😎", "🤔", "😅", "😭", "😡"],
            ["😴", "🥺", "😳", "🙄", "😏", "🤗", "😇", "🤩", "😱", "🤯", "🥳", "😵"],
            ["❤️", "💕", "💔", "👍", "👎", "👏", "🙏", "👋", "✌️", "🤝", "💪", "🫶"],
            ["🔥", "✨", "🎉", "💯", "⭐", "🌸", "🐱", "🐶", "🍕", "☕", "🎮", "💤"]],
        s: [["😆", "😁", "😋", "😜", "🤪", "😬", "🥲", "😢", "😤", "😶", "🤫", "🤭"],
            ["👀", "👻", "💀", "🤖", "👽", "😺", "🙈", "🐰", "🦊", "🐻", "🐼", "🐧"],
            ["🎵", "🎶", "🎂", "🎁", "🍰", "🍓", "🍜", "🍣", "🍺", "🥂", "🌙", "☀️"],
            ["⚡", "🌈", "💖", "💜", "💙", "💚", "💛", "🧡", "🤍", "🖤", "✅", "❌"]] },
};
// Katakana = hiragana shifted by +0x60
const KB_KATA = rows => rows.map(r => r.map(c => c.replace(/[ぁ-ゖゝゞ]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60))));
KB_LANGS.jk = { name: "カタカナ", key: "ア", n: KB_KATA(KB_LANGS.ja.n), s: KB_KATA(KB_LANGS.ja.s) };
const KB_ORDER = ["th", "en", "ja", "jk", "ko", "ru", "vi", "zh", "emoji"];
const KB_MARK = /^[ัิ-ฺ็-๎]$/;  // Thai vowels/tone marks that attach to a consonant, shown on ◌

function kbEnabled(list) {
  const ok = (Array.isArray(list) ? list : []).filter(k => KB_LANGS[k]);
  return ok.length ? KB_ORDER.filter(k => ok.includes(k)) : ["th", "en"];
}
function kbNext(cur, list) {
  const on = kbEnabled(list), i = on.indexOf(cur);
  return on[(i + 1) % on.length];
}
function kbRows(lang, shift) { const L = KB_LANGS[lang] || KB_LANGS.en; return L[shift ? "s" : "n"]; }
function kbKeyLabel(ch) { return KB_MARK.test(ch) || /^\p{M}$/u.test(ch) ? "◌" + ch : ch; }

// ---------- Character composition: Korean (syllables) / Vietnamese + Pinyin (tones) ----------
// Returns the text that "replaces the previous character", or null (append normally)
const KB_TONES = { vi: [..."̣́̀̉̃"], zh: [..."̄́̌̀"] };
function kbCompose(lang, prev, ch) {
  if (lang === "ko") return kbHangul(prev, ch);
  const tones = KB_TONES[lang];
  if (!tones || !tones.includes(ch) || !prev || !/\p{L}/u.test(prev)) return null;
  const base = [...prev.normalize("NFD")], had = base.find(c => tones.includes(c));
  const bare = base.filter(c => !tones.includes(c));
  // The dot below (◌̣) must come before the hat/horn in Unicode order — append it and let normalize sort it
  return (bare.join("") + (had === ch ? "" : ch)).normalize("NFC");
}

// ---------- Compose Korean letters into syllables ----------
const KO_L = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const KO_V = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
const KO_T = ["", ..."ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ"];
const KO_CV = { "ㅗㅏ": "ㅘ", "ㅗㅐ": "ㅙ", "ㅗㅣ": "ㅚ", "ㅜㅓ": "ㅝ", "ㅜㅔ": "ㅞ", "ㅜㅣ": "ㅟ", "ㅡㅣ": "ㅢ" };
const KO_CT = { "ㄱㅅ": "ㄳ", "ㄴㅈ": "ㄵ", "ㄴㅎ": "ㄶ", "ㄹㄱ": "ㄺ", "ㄹㅁ": "ㄻ", "ㄹㅂ": "ㄼ", "ㄹㅅ": "ㄽ", "ㄹㅌ": "ㄾ", "ㄹㅍ": "ㄿ", "ㄹㅎ": "ㅀ", "ㅂㅅ": "ㅄ" };
const KO_SPLIT = Object.fromEntries(Object.entries(KO_CT).map(([ab, c]) => [c, [...ab]]));
const koSyl = (l, v, t = 0) => String.fromCharCode(0xAC00 + (l * 21 + v) * 28 + t);
// prev = character before the cursor, j = key pressed — returns the text that "replaces prev", or null (append normally)
function kbHangul(prev, j) {
  if (!prev || ![...KO_L, ...KO_V, ...KO_T].includes(j)) return null;
  const isV = KO_V.includes(j), code = prev.charCodeAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const s = code - 0xAC00, L = Math.floor(s / 588), V = Math.floor(s % 588 / 28), T = s % 28;
    if (!T) {
      if (isV) { const cv = KO_CV[KO_V[V] + j]; return cv ? koSyl(L, KO_V.indexOf(cv)) : null; }
      const t = KO_T.indexOf(j);
      return t > 0 ? koSyl(L, V, t) : null;
    }
    const tc = KO_T[T];
    if (!isV) { const ct = KO_CT[tc + j]; return ct ? koSyl(L, V, KO_T.indexOf(ct)) : null; }
    // A vowel after a final consonant = the consonant moves to start the new syllable
    const sp = KO_SPLIT[tc];
    if (sp) return koSyl(L, V, KO_T.indexOf(sp[0])) + koSyl(KO_L.indexOf(sp[1]), KO_V.indexOf(j));
    return koSyl(L, V) + koSyl(KO_L.indexOf(tc), KO_V.indexOf(j));
  }
  if (isV && KO_L.includes(prev)) return koSyl(KO_L.indexOf(prev), KO_V.indexOf(j));
  if (isV && KO_V.includes(prev)) return KO_CV[prev + j] || null;
  return null;
}
