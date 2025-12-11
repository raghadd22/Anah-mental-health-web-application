const EMOTION_AR_LABEL = {
  // من wne_lexicon_en.json
  happy: "سعيد",
  joy: "سعيد",

  angry: "غاضب",
  anger: "غاضب",
  disgust: "غاضب", 

  sad: "حزين",
  sadness: "حزين",
  grief: "حزين",

  fear: "قلق",
  worried: "قلق",
  worry: "قلق",
  worries: "قلق",
  anxiety: "قلق",
  anxious: "قلق",
  stress: "قلق",
  stressed: "قلق",

  surprise: "متفاجئ",
  anticipation: "قلق",

  ok: "لا بأس",


  tired: "متعب",
  fatigue: "متعب",
  fatigued: "متعب",
  exhaustion: "متعب",
  exhausted: "متعب"
};



const EMOJI_WEIGHT = 3;

const MOOD_MAPPING = {
  // مفاتيح الليكسيكون (EN)
  "angry": "غاضب",
  "anger": "غاضب",
  "disgust": "غاضب",

  "sad": "حزين",
  "sadness": "حزين",
  "grief": "حزين",

  "happy": "سعيد",
  "joy": "سعيد",
  "happiness": "سعيد",

  "fear": "قلق",
  "worry": "قلق",
  "worries": "قلق",
  "stress": "قلق",
  "stressed": "قلق",
  "anxiety": "قلق",
  "anxious": "قلق",
  "anticipation": "قلق",


  "tired": "متعب",
  "exhausted": "متعب",
  "fatigue": "متعب",
  "fatigued": "متعب",
  "exhaustion": "متعب",

  "ok": "لا بأس",
  "calm": "لا بأس",
  "surprise": "لا بأس", 

  "غاضب": "غاضب",
  "سيئ": "غاضب",

  "حزين": "حزين",

  "سعيد": "سعيد",
  "رائع": "سعيد",

  "قلق": "قلق",

  "متعب": "متعب",
  "تعبان": "متعب",

  "لا بأس": "لا بأس",
  "هادئ": "لا بأس",
  "عادي": "لا بأس"
};

const MOOD_IMAGES = {
  "سعيد": "images/Habby.png",
  "لا بأس": "images/Ok.png",
  "غاضب": "images/Angry.png",
  "حزين": "images/Sad.png",
  "قلق": "images/worried.png",
  "متعب": "images/Tired.png",
  "غير محدد": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><text x='50%' y='50%' font-size='40' text-anchor='middle' dominant-baseline='middle'>❔</text></svg>"
};


function getJournalDB() {
  const user = JSON.parse(localStorage.getItem("currentUser") || "null");
  const key = (user && user.email) ? `journalData_${user.email}` : "journalData_guest";
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
}


function calculateEntryScores(entry) {
  let scores = {};
  let wordCount = 0;


  if (entry.patterns && entry.patterns.counts) {
    for (const [key, count] of Object.entries(entry.patterns.counts)) {
      const mood = MOOD_MAPPING[key] || "غير محدد";
      if (mood !== "غير محدد") {
        scores[mood] = (scores[mood] || 0) + count;
        wordCount += count;
      }
    }
  }

  let userMood = entry.emojiMood || entry.finalMood;
  if (userMood) {
    if (userMood.includes(":")) userMood = userMood.split(":")[1].trim(); // تنظيف النص

    const mood = MOOD_MAPPING[userMood] || "غير محدد";
    if (mood !== "غير محدد") {
      scores[mood] = (scores[mood] || 0) + EMOJI_WEIGHT;
      wordCount += EMOJI_WEIGHT;
    }
  }

  return { scores, wordCount };
}


function loadAnalyzedData(days) {
  const db = getJournalDB();
  const keys = Object.keys(db).sort();
  const now = new Date();

  let totalScores = {};
  let historyList = [];
  let totalWords = 0;

  keys.forEach(date => {
    const entry = db[date];
    const diff = Math.ceil(Math.abs(now - new Date(date)) / (1000 * 60 * 60 * 24));
    if (diff > days) return;

    const { scores, wordCount } = calculateEntryScores(entry);
    totalWords += wordCount;


    let dominant = "غير محدد";
    let max = -1;

    for (const [m, s] of Object.entries(scores)) {
      totalScores[m] = (totalScores[m] || 0) + s;
      if (s > max) { max = s; dominant = m; }
    }

   
    if (dominant === "غير محدد" && entry.emojiMood) {
      dominant = entry.emojiMood.split(":")[1]?.trim() || entry.emojiMood;
    }

    historyList.push({ date, dominant, scores });
  });

  return { totalScores, historyList, totalWords };
}


let chartInstance = null;

function renderDashboard(days) {
  const { totalScores, historyList, totalWords } = loadAnalyzedData(days);

  // Chart
  const ctx = document.getElementById("moodChart");
  if (ctx) {
    const labels = Object.keys(totalScores);
    const data = labels.map(mood =>
      totalWords > 0 ? Math.round((totalScores[mood] / totalWords) * 100) : 0
    );
    const bgColors = labels.map(l => {
      if (l === "غاضب") return "#ff6b6b";
      if (l === "سعيد") return "#1dd1a1";
      if (l === "حزين") return "#54a0ff";
      if (l === "قلق")  return "#ff9f43";
      if (l === "متعب") return "#feca57";
      return "#ccabd8";
    });

    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "النسبة المئوية للكلمات",
          data,
          backgroundColor: bgColors,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (tooltipItem) => tooltipItem.parsed.y + "%"
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value) => value + "%"
            }
          }
        }
      }
    });
  }

  // Top Moods
  const topEl = document.getElementById("topMoods");
  if (topEl) {
    topEl.innerHTML = "";
    const sorted = Object.entries(totalScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    const total = Object.values(totalScores).reduce((a, b) => a + b, 0);

    if (!sorted.length) {
      topEl.innerHTML = `<p class="an-subtext">لا توجد بيانات.</p>`;
    } else {
      sorted.forEach(([m, s]) => {
        const pct = Math.round((s / total) * 100);
        const img = MOOD_IMAGES[m] || MOOD_IMAGES["غير محدد"];
        topEl.innerHTML += `
          <div class="an-metric">
            <div class="an-metric-label">
              <img src="${img}" class="mood-icon" style="width:30px"> <span>${m}</span>
            </div>
            <span class="an-metric-value">${pct}%</span>
          </div>`;
      });
    }
  }

  // List
  const listEl = document.getElementById("moodList");
  if (listEl) {
    listEl.innerHTML = "";
    historyList.reverse().forEach(item => {
      const img = MOOD_IMAGES[item.dominant] || MOOD_IMAGES["غير محدد"];
      listEl.innerHTML += `
        <div class="an-mood-row">
          <div style="display:flex;align-items:center;gap:10px">
            <img src="${img}" class="mood-icon" style="width:36px"> <strong>${item.dominant}</strong>
          </div>
          <span class="an-tag">${item.date}</span>
        </div>`;
    });
    if (!historyList.length) {
      listEl.innerHTML = `<p class="an-subtext" style="padding:10px">فارغ.</p>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderDashboard(7);
  document.querySelectorAll(".an-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".an-chip").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      renderDashboard(parseInt(btn.dataset.range));
      const lbl = document.getElementById("analysisRange");
      if (lbl) lbl.textContent = btn.textContent;
    });
  });
});