// lexicon-analyzer.js

let WNE_LEXICON = null;

/* ------------------------------------------------------------
   Load WNE Lexicon (once)
------------------------------------------------------------ */
async function loadWneLexicon() {
  if (WNE_LEXICON) return WNE_LEXICON;

  const res = await fetch('wne_lexicon_en.json'); // same name as in your project
  WNE_LEXICON = await res.json();
  return WNE_LEXICON;
}

/* ------------------------------------------------------------
   Simple Arabic normalization
   - unify letters (ا, ي, و, ه)
   - remove harakat (diacritics)
   - remove punctuation
------------------------------------------------------------ */
function normalizeArabic(text) {
  return text
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ًٌٍَُِّْ]/g, '')            // remove diacritics
    .replace(/[^\p{L}\p{N}_\s]+/gu, ' ');  // remove punctuation
}

/* ------------------------------------------------------------
   MAIN: pattern-based analysis (no numeric score)
   - returns detected emotions, hits, and a simple mainEmotion
------------------------------------------------------------ */
function analyzeWithWne(rawText) {
  if (!WNE_LEXICON) {
    console.warn('WNE_LEXICON not loaded yet. Call loadWneLexicon() first.');
    return {
      emotions: [],     // e.g. ['sad', 'fear']
      hits: [],         // e.g. [{word:'...', emotion:'sad'}]
      mainEmotion: 'neutral'
    };
  }

  const text = normalizeArabic(rawText);
  const tokens = text
    .split(/\s+/)
    .map(t => t.trim())
    .filter(Boolean);

  const hits = [];
  const emoSet = new Set();

  for (const token of tokens) {
    const entry = WNE_LEXICON[token];
    if (entry && entry.emotion) {
      hits.push({ word: token, emotion: entry.emotion });
      emoSet.add(entry.emotion);
    }
  }

  const emotions = Array.from(emoSet);
  const mainEmotion = emotions[0] || 'neutral'; // simple selection, no scoring

  return { emotions, hits, mainEmotion };
}

/* ------------------------------------------------------------
   Map lexicon emotion -> UI mood buttons
   (for home/journal integration)
------------------------------------------------------------ */
function mapEmotionToMood(emo) {
  switch (emo) {
    case 'happy':
      return 'veryhappy';
    case 'angry':
      return 'angry';
    case 'sad':
      return 'sad';
    case 'fear':
      return 'worried';
    case 'disgust':
      return 'angry';
    default:
      return 'ok';
  }
}

/* ------------------------------------------------------------
   Expose functions globally for other scripts
------------------------------------------------------------ */
window.loadWneLexicon = loadWneLexicon;
window.analyzeWithWne = analyzeWithWne;
window.mapEmotionToMood = mapEmotionToMood;
