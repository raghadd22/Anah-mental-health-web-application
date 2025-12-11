/* ============================================================
   JOURNAL.JS - (Journal Logic Only)
   * Auth, Date are handled in utils.js
============================================================ */

/* 1) HELPERS & STORAGE */
const store = {
  get() {
    const key = window.getStorageKey(); // من utils.js
    try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
  },
  set(data) {
    const key = window.getStorageKey(); // من utils.js
    localStorage.setItem(key, JSON.stringify(data));
  },
};

function wordCount(t = "") {
  if (!t) return 0;
  const m = t.trim().match(/\S+/g);
  return m ? m.length : 0;
}

/* ------------------------------------------------------------
   2) Arabic Emotion Label Mapping
   - This dictionary maps emotion keys coming from the lexicon
     (e.g., “happy”, “anger”, “sadness”) into the final Arabic
     emotion categories used in the application.
   - Additional mappings such as “tired” and “exhaustion” were
     added to ensure the model correctly captures fatigue-related
     expressions, improving overall emotion accuracy.
------------------------------------------------------------ */

const EMOTION_AR_LABEL = {
  happy: "سعيد", joy: "سعيد",
  angry: "غاضب", anger: "غاضب", disgust: "غاضب",
  sad: "حزين", sadness: "حزين", grief: "حزين",
  fear: "قلق", worried: "قلق", worry: "قلق", anxiety: "قلق", stress: "قلق",
  surprise: "متفاجئ", anticipation: "متوتر",
  ok: "هادئ",
  tired: "متعب", exhaustion: "متعب"
};

/* ------------------------------------------------------------
   Fallback Emotion Detection Rules
   - These rules act as a backup when the lexicon does not 
     detect any emotional keywords.
   - Each emotion category is associated with a list of common 
     Arabic words or phrases that users naturally write in 
     everyday journaling.
   - If the user's text contains any of these expressions, the 
     system assigns the corresponding mood as a fallback.
   - This improves robustness when:
       • The lexicon misses informal or dialect words
       • The user writes short sentences
       • The text contains no lexicon-matched tokens
------------------------------------------------------------ */

const MOOD_RULES = {
  "سعيد": ["سعيد", "مبسوط", "فرح", "جميل", "رائع", "ممتاز"],
  "حزين": ["حزين", "ضايق", "مهموم", "كئيب", "بكي"],
  "غاضب": ["غاضب", "معصب", "زعلان", "قهر", "كره"],
  "قلق": ["قلق", "خايف", "متوتر", "مرتعب"],
  "متعب": ["تعبان", "مرهق", "منهك", "مجهد", "متعب"],
  "هادئ": ["هادئ", "رايق", "عادي", "تمام", "الحمدلله"],
};

function fallbackDetectMood(text) {
  text = (text || "").toLowerCase();
  for (const mood in MOOD_RULES) {
    if (MOOD_RULES[mood].some((w) => text.includes(w))) return mood;
  }
  return "غير محدد";
}

/* ------------------------------------------------------------
   4.1) Lexicon Manual Overrides (Critical Fix)
   ------------------------------------------------------------
   The original wne_lexicon_en.json does not correctly classify
   several common Arabic words related to tiredness (e.g., 
   "متعب", "تعبان"), often mapping them incorrectly to 
   unrelated emotions such as anger or sadness.
------------------------------------------------------------ */
let LEXICON = null;
let lexiconPromise = null;

function loadLexicon() {
  if (lexiconPromise) return lexiconPromise;
  lexiconPromise = fetch("wne_lexicon_en.json")
    .then((r) => r.json())
    .then((j) => { LEXICON = j; return j; })
    .catch((e) => { console.error("Lexicon error:", e); return null; });
  return lexiconPromise;
}

function normalizeToken(tok) {
  if (!tok) return "";
  let s = tok.replace(/[\u064B-\u065F]/g, ""); 
  s = s.replace(/[^\u0600-\u06FF]+/g, ""); 
  return s;
}


const LEXICON_OVERRIDES = {
  "متعب":   { emotion: "tired" },
  "متعبة":  { emotion: "tired" },
  "تعبان":  { emotion: "tired" },
  "تعبانة": { emotion: "tired" },
};


async function analyzeJournalText(text) {
  if (!text || !text.trim()) return null;
  const lex = await loadLexicon();
  if (!lex) return null;

  const stripped = text.replace(/[\u064B-\u065F]/g, "");
  const tokens = stripped.split(/\s+/).filter(Boolean);
  const counts = {};
  let total = 0;

  for (const raw of tokens) {
    const w = normalizeToken(raw);
    if (!w) continue;

 
    let info = LEXICON_OVERRIDES[w] || lex[w];


    if (!info && w.startsWith("ال")) info = lex[w.substring(2)];
    if (!info && (w.startsWith("و") || w.startsWith("ف"))) {
      info = lex[w.substring(1)];
      if (!info && w.length > 3 && w.substring(1).startsWith("ال")) info = lex[w.substring(3)];
    }
    if (!info && w.startsWith("ب")) info = lex[w.substring(1)];

    if (info && info.emotion) {
      const e = info.emotion;
      counts[e] = (counts[e] || 0) + 1;
      total++;
    }
  }

  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return { counts, totalMatches: total, dominant };
}

/* ------------------------------------------------------------
   patternsToSummary(patterns)
   ------------------------------------------------------------
   This function converts the raw lexical analysis results into
   a readable Arabic summary that can be shown in the journal 
   entry modal.
------------------------------------------------------------ */

function patternsToSummary(patterns) {
  if (!patterns || !patterns.totalMatches) return "لم تُرصد كلمات مزاجية واضحة.";
  
  // Aggregate counts by Arabic label
  const aggregated = {};
  for (const [emotion, count] of patterns.dominant) {
    const label = EMOTION_AR_LABEL[emotion] || emotion;
    aggregated[label] = (aggregated[label] || 0) + count;
  }

  // Sort aggregated emotions by count and take the top 3
  const parts = Object.entries(aggregated)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => `${label} (${count})`);

  return `أكثر الكلمات الدالة على مشاعر كانت: ${parts.join("، ")}.`;
}

/* 6) DOM Elements */
const note = document.getElementById("note");
const saveBtn = document.getElementById("save");
const clearBtn = document.getElementById("clearToday");
const entriesEl = document.getElementById("entries");
const allEntries = document.getElementById("allEntries");
const showAllBtn = document.getElementById("showAll");
const ratingText = document.getElementById("ratingText");
const curEl = document.getElementById("curStreak");
const bestEl = document.getElementById("bestStreak");
const achvCard = document.getElementById("achievements");
const showAchvBtn = document.getElementById("showAchv");
const noteInfo = document.getElementById("noteInfo");
const viewModal = document.getElementById("viewModal");
const closeModal = document.getElementById("closeModal");
const viewContent = document.getElementById("viewContent");
const deleteModal = document.getElementById("deleteConfirmModal");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const ratingFilterContainer = document.getElementById("ratingFilter");
const emptyNoteModal = document.getElementById("emptyNoteModal");
const closeEmptyNoteBtn = document.getElementById("closeEmptyNoteModal");



if (closeEmptyNoteBtn) {
  closeEmptyNoteBtn.onclick = () => {
    if (emptyNoteModal) emptyNoteModal.hidden = true;
  };
}

let selectedRating = 0;

/*Rating */
function initRating() {
  const ratingEl = document.getElementById("rating");
  if (!ratingEl) return;
  const stars = Array.from(ratingEl.querySelectorAll("button[data-v]"));
  function paint(n) {
    selectedRating = n;
    stars.forEach((btn) => {
      const v = Number(btn.dataset.v || "0");
      btn.classList.toggle("active", v <= n);
    });
    if (ratingText) ratingText.textContent = `قيّم يومك: ${n}/5`;
  }
  ratingEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-v]");
    if (btn) paint(Number(btn.dataset.v || "0"));
  });
  paint(0);
}

/* ------------------------------------------------------------
   getCurrentStreak(db)
   ------------------------------------------------------------
   Calculates the user's *current streak* — the number of
   consecutive days (up to today) in which the user wrote a
   journal entry.
------------------------------------------------------------ */
function getCurrentStreak(db) {
  const keys = Object.keys(db).sort();
  if (!keys.length) return 0;
  let streak = 1;
  for (let i = keys.length - 1; i > 0; i--) {
    const d1 = new Date(keys[i]);
    const d0 = new Date(keys[i - 1]);
    const diff = (d1 - d0) / 86400000;
    if (diff === 1) streak++; else break;
  }
  return streak;
}
/* ------------------------------------------------------------
   getBestStreak(db)
   ------------------------------------------------------------
   Calculates the user's *longest streak ever* — the maximum
   number of consecutive days they have journaled in the entire
   history of their entries.
------------------------------------------------------------ */
function getBestStreak(db) {
  const keys = Object.keys(db).sort();
  if (!keys.length) return 0;
  let best = 1, streak = 1;
  for (let i = 1; i < keys.length; i++) {
    const d1 = new Date(keys[i]);
    const d0 = new Date(keys[i - 1]);
    const diff = (d1 - d0) / 86400000;
    if (diff === 1) streak++; else streak = 1;
    if (streak > best) best = streak;
  }
  return best;
}
/* ------------------------------------------------------------
   updateStreaks()
   ------------------------------------------------------------
   Updates the streak counters displayed in the UI.
------------------------------------------------------------ */
function updateStreaks() {
  const db = store.get();
  if (curEl) curEl.textContent = getCurrentStreak(db);
  if (bestEl) bestEl.textContent = getBestStreak(db);
}

/* ------------------------------------------------------------
   renderEntries()
   ------------------------------------------------------------
   Renders the list of all journal entries in the UI.
------------------------------------------------------------ */
function renderEntries() {
  if (!entriesEl) return;
  const db = store.get();
  const keys = Object.keys(db).sort().reverse();
  if (!keys.length) { entriesEl.innerHTML = `<em>لا توجد مذكرات بعد.</em>`; return; }

  entriesEl.innerHTML = keys.map((k) => {
    const e = db[k] || {};
    const wc = wordCount(e.text || "");
    const rating = e.rating || 0;
    const emo = e.finalMood || "غير محدد";
    const line = (e.text || "").split("\n")[0];
    return `
      <div class="entry" data-key="${k}" data-rating="${rating}">
        <div class="meta">${k}</div>
        <small>${wc} كلمة · تقييم: ${rating}/5 · ${emo}</small>
        <div class="entry-preview">${line}</div>
      </div>`;
  }).join("");

  entriesEl.querySelectorAll(".entry").forEach((row) => {
    row.onclick = () => openEntry(row.dataset.key);
  });
}

/* ------------------------------------------------------------
   applyRatingFilter()
   ------------------------------------------------------------
   Filters the visible journal entries based on the selected
   rating value (0–5). The filter buttons simply toggle the
   "is-active" class and call this function.
------------------------------------------------------------ */
function applyRatingFilter(filterValue) {
  if (!entriesEl) return;
  entriesEl.querySelectorAll(".entry").forEach((card) => {
    const r = card.dataset.rating || "0";
    const show = filterValue === "all" || r === filterValue;
    card.style.display = show ? "" : "none";
  });
}

if (ratingFilterContainer) {
  ratingFilterContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".rating-filter");
    if (!btn) return;
    ratingFilterContainer.querySelectorAll(".rating-filter").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    applyRatingFilter(btn.dataset.rating || "all");
  });
}

/* ------------------------------------------------------------
   openEntry(dateKey)
   ------------------------------------------------------------
   Opens the journal entry modal and displays full details
   for the selected entry.
------------------------------------------------------------ */
function openEntry(dateKey) {
  const db = store.get();
  const e = db[dateKey];
  if (!e || !viewModal) return;

  // Always provide sensible defaults
  const words = wordCount(e.text || "");
  const rating = typeof e.rating === "number" ? e.rating : 0;
  const mood = e.finalMood || "غير محدد";
  const patterns = e.patterns || null;
  const summary = patternsToSummary(patterns);

  viewContent.innerHTML = `
    <h3>${dateKey}</h3>
    <small>${words} كلمة · تقييم: ${rating}/5 · ${mood}</small>
    <hr>
    <p>${(e.text || "").replace(/\n/g, "<br>")}</p>
    <p class="note-analysis">${summary}</p>
  `;
  viewModal.hidden = false;
}

if (closeModal) closeModal.onclick = () => (viewModal.hidden = true);



/* ------------------------------------------------------------
   SAVE Journal Entry
   ------------------------------------------------------------
   Triggered when the user clicks the "Save" button.
   Purpose:
   - Ensures correct emotion detection (lexicon first, fallback second)
   - Persists all journal data and keeps UI fresh and synchronized.
------------------------------------------------------------ */
if (saveBtn && note) {
  saveBtn.onclick = async () => {
    const text = (note.value || "").trim();
    if (!text) {
      if (emptyNoteModal) emptyNoteModal.hidden = false;
      return;
    }

    const db = store.get();
    const iso = window.getTodayISO(); //  utils.js

    let patterns = null;
    try { patterns = await analyzeJournalText(text); } 
    catch (err) { console.error(err); }

    let finalMood = "غير محدد";


    if (patterns && patterns.dominant.length) {
      const emoKey = patterns.dominant[0][0];
      if (EMOTION_AR_LABEL[emoKey]) {
        finalMood = EMOTION_AR_LABEL[emoKey];
      }
    }

    if (finalMood === "غير محدد") {
      const fb = fallbackDetectMood(text);
      if (fb !== "غير محدد") finalMood = fb;
    }

    db[iso] = {
      ...db[iso],
      text,
      words: wordCount(text),
      rating: selectedRating,
      savedAt: Date.now(),
      patterns,
      finalMood,
    };

    store.set(db);
    note.value = "";
    renderEntries();
    updateStreaks();
    updateAchievements();
    if (noteInfo) noteInfo.innerHTML = `<i class="fi fi-sr-info"></i><p><strong>تحليل الأنماط:</strong> ${patternsToSummary(patterns)}</p>`;
  };
}

/* ------------------------------------------------------------
   13) Delete Today's Entry
   ------------------------------------------------------------
   deleteBtn (trash icon) → opens a confirmation modal.
   confirmDeleteBtn       → permanently removes today's entry.
   cancelDeleteBtn        → simply closes the modal.
------------------------------------------------------------ */
if (clearBtn) clearBtn.onclick = () => deleteModal.hidden = false;

if (confirmDeleteBtn) {
  confirmDeleteBtn.onclick = () => {
    const db = store.get();
    const iso = window.getTodayISO(); // من utils.js
    if (db[iso]) { delete db[iso]; store.set(db); }
    if (note) note.value = "";
    if (noteInfo) noteInfo.innerHTML = `<i class="fi fi-sr-info"></i><p>حرصًا على دقة تحليل مشاعرك...</p>`;
    renderEntries();
    updateStreaks();
    updateAchievements();
    deleteModal.hidden = true;
  };
}
if (cancelDeleteBtn) cancelDeleteBtn.onclick = () => deleteModal.hidden = true;

/* ------------------------------------------------------------
   updateAchievements()
   ------------------------------------------------------------
   Recalculates and updates all achievement badges based on
   the user’s journaling activity.
------------------------------------------------------------ */
function updateAchievements() {
  const db = store.get();
  const totalEntries = Object.keys(db).length;
  const currentStreak = getCurrentStreak(db);
  const rules = [
    { id: "achv-1", unlocked: totalEntries >= 1, icon: "🌱" },
    { id: "achv-2", unlocked: currentStreak >= 3, icon: "🔥" },
    { id: "achv-3", unlocked: totalEntries >= 5, icon: "✍️" },
    { id: "achv-4", unlocked: currentStreak >= 7, icon: "🏆" },
  ];
  rules.forEach((r) => {
    const c = document.getElementById(r.id);
    if (c && r.unlocked) {
      c.classList.add("is-unlocked");
      c.querySelector(".achv-icon").textContent = r.icon;
      c.querySelector(".achv-badge").textContent = "مكتمل";
    }
  });
}

/* ------------------------------------------------------------
   15) UI Toggles & Initialization
   ------------------------------------------------------------
   - showAllBtn:     Toggles the visibility of the full entries list.
   - showAchvBtn:    Toggles the visibility of the Achievements card.
------------------------------------------------------------ */
if (showAllBtn) showAllBtn.onclick = () => (allEntries.hidden = !allEntries.hidden);
if (showAchvBtn) showAchvBtn.onclick = () => (achvCard.hidden = !achvCard.hidden);

initRating();
loadLexicon();
renderEntries();
updateStreaks();
updateAchievements();