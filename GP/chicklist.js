// chicklist.js – Today's Tasks + Progress Ring (with EDIT + Arabic digits support)

document.addEventListener("DOMContentLoaded", () => {
  /* ============================================================
    0. Storage and Helper Data
  ============================================================ */

  const STORAGE_KEY = "anaah_tasks_by_day";
  const MAX_MINUTES = 300; // أقصى مدة للمهمة الواحدة

  const todayISO = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();

  function loadAllDays() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveAllDays(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadTodayTasks() {
    const all = loadAllDays();
    return Array.isArray(all[todayISO]) ? all[todayISO] : [];
  }

  function saveTodayTasks(tasks) {
    const all = loadAllDays();
    all[todayISO] = tasks;
    saveAllDays(all);
  }

  function word(t = "") {
    return (t || "").trim();
  }

  // ✅ تحويل الأرقام العربية (٠١٢٣٤٥٦٧٨٩ / ۰۱۲۳۴۵۶۷۸۹) إلى أرقام إنجليزية
  function normalizeDigits(str = "") {
    const mapArabic = {
      "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
      "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9"
    };
    const mapPersian = {
      "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
      "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9"
    };

    return String(str)
      .replace(/[٠-٩]/g, (d) => mapArabic[d] || d)
      .replace(/[۰-۹]/g, (d) => mapPersian[d] || d);
  }

  // ✅ دالة لصياغة "دقيقة" بالعربي حسب الرقم
  function arabicMinutesLabel(num) {
    num = Number(num);

    if (num === 1) return "دقيقة واحدة";
    if (num === 2) return "دقيقتان";
    if (num >= 3 && num <= 10) return `${num} دقائق`;
    return `${num} دقيقة`;
  }

  /* =========================================================
     1. Element References
  ========================================================= */

  let selectedEmoji = "☀️";
  let editingIndex = null; // لو تحتوي رقم -> نحن في وضع التعديل

  const taskList          = document.getElementById("taskList");
  const startChallengeBtn = document.getElementById("startChallengeBtn");
  const newTaskContainer  = document.getElementById("newTaskContainer");
  const saveTaskBtn       = document.getElementById("saveTaskBtn");
  const emojiButtons      = document.querySelectorAll("#emojiSelector .emoji");

  const descInput = document.getElementById("taskDescription");
  const timeInput = document.getElementById("taskTime");

  const totalCountEl = document.getElementById("tasksTotalCount");
  const doneCountEl  = document.getElementById("tasksDoneCount");

  // Modals
  const emptyModal    = document.getElementById("emptyTaskModal");
  const closeEmptyBtn = document.getElementById("closeEmptyTaskModal");

  const timeModal     = document.getElementById("timeAlertModal");
  const closeTimeBtn  = document.getElementById("closeTimeAlertModal");

  // حلقة التقدم
  const ringFill       = document.querySelector(".progress-ring-fill");
  const progressTextEl = document.getElementById("progressText");

  let ringCircumference = 0;
  if (ringFill) {
    const r = ringFill.r.baseVal.value || 58;
    ringCircumference = 2 * Math.PI * r;
    ringFill.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
    ringFill.style.strokeDashoffset = ringCircumference;
  }

  /* =========================================================
     2. Progress Ring Functions
  ========================================================= */

  function setRingProgress(percent) {
    if (!ringFill || !progressTextEl || !ringCircumference) return;

    const safe = Math.max(0, Math.min(100, percent));
    const offset = ringCircumference * (1 - safe / 100);

    ringFill.style.strokeDashoffset = offset;
    progressTextEl.textContent = `${Math.round(safe)}%`;
  }

  function updateProgress(tasks) {
    if (!Array.isArray(tasks)) return;

    const total = tasks.length;
    const done  = tasks.filter(t => t.done).length;

    if (totalCountEl) totalCountEl.textContent = total;
    if (doneCountEl)  doneCountEl.textContent  = done;

    if (total === 0) {
      setRingProgress(0);
      return;
    }

    const percent = (done / total) * 100;
    setRingProgress(percent);
  }

  /* =========================================================
     3. Emoji Picker Helper
  ========================================================= */

  function setActiveEmoji(char) {
    if (!emojiButtons.length) return;
    emojiButtons.forEach(btn => {
      const isActive = btn.textContent.trim() === char;
      btn.classList.toggle("is-active", isActive);
      if (isActive) {
        selectedEmoji = char;
      }
    });
  }

  /* =========================================================
     4. Task Rendering
  ========================================================= */

  function renderTasks(tasks) {
    if (!taskList) return;

    if (!tasks.length) {
      taskList.innerHTML = `<p style="font-size:0.86rem; opacity:0.75;">لا توجد مهام بعد. اضغط "ابدأ تحدّي المهام" لإضافة أول مهمة.</p>`;
      updateProgress(tasks);
      return;
    }

    taskList.innerHTML = "";

    tasks.forEach((task, index) => {
      const card = document.createElement("div");
      card.className = "task-card";
      if (task.done) card.classList.add("is-done");
      card.dataset.index = index.toString();

      const minutesLabel = arabicMinutesLabel(task.minutes || 0);

      card.innerHTML = `
        <div class="task-details">
          <span class="emoji">${task.emoji || "☀️"}</span>
          <div>
            <div class="description">${task.description || ""}</div>
            <div class="time">المدة: ${minutesLabel}</div>
          </div>
        </div>
        <div class="task-actions">
          <button type="button" class="task-toggle">
            ${task.done ? "إلغاء" : "تم"}
          </button>
          <button type="button" class="task-edit">
            تعديل
          </button>
          <button type="button" class="task-delete" aria-label="حذف">
            ✕
          </button>
        </div>
      `;

      // زر "تم / إلغاء"
      const toggleBtn = card.querySelector(".task-toggle");
      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
          const all = loadTodayTasks();
          const item = all[index];
          if (!item) return;
          item.done = !item.done;
          saveTodayTasks(all);
          renderTasks(all);
        });
      }

      // زر الحذف
      const deleteBtn = card.querySelector(".task-delete");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          let all = loadTodayTasks();
          all.splice(index, 1);
          saveTodayTasks(all);
          renderTasks(all);
        });
      }

      // زر التعديل
      const editBtn = card.querySelector(".task-edit");
      if (editBtn) {
        editBtn.addEventListener("click", () => {
          const all = loadTodayTasks();
          const item = all[index];
          if (!item) return;

          if (descInput) descInput.value = item.description || "";
          if (timeInput) timeInput.value = item.minutes || "";
          setActiveEmoji(item.emoji || "☀️");

          editingIndex = index;
          if (saveTaskBtn) saveTaskBtn.textContent = "تحديث المهمة";

          showForm(true);
          if (descInput) {
            setTimeout(() => descInput.focus(), 40);
          }
        });
      }

      taskList.appendChild(card);
    });

    updateProgress(tasks);
  }

  /* =========================================================
     5. Emoji Picker Setup
  ========================================================= */

  function setupEmojiPicker() {
    if (!emojiButtons.length) return;

    emojiButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const char = btn.textContent.trim() || "☀️";
        setActiveEmoji(char);
      });
    });

    // الافتراضي
    setActiveEmoji("☀️");
  }

  /* =========================================================
     6. Form Management and Save Handling
  ========================================================= */

  function showForm(show) {
    if (!newTaskContainer) return;
    newTaskContainer.style.display = show ? "block" : "none";

    if (!show) {
      editingIndex = null;
      if (saveTaskBtn) saveTaskBtn.textContent = "حفظ المهمة";
    }
  }

  if (closeEmptyBtn && emptyModal) {
    closeEmptyBtn.addEventListener("click", () => {
      emptyModal.hidden = true;
    });
  }

  if (closeTimeBtn && timeModal) {
    closeTimeBtn.addEventListener("click", () => {
      timeModal.hidden = true;
    });
  }

  function handleSaveTask() {
    if (!saveTaskBtn || !descInput || !timeInput) return;

    saveTaskBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const desc = word(descInput.value);
      const minutesRaw = word(timeInput.value);

      // ✅ نحول الأرقام العربية إلى إنجليزية قبل الـ parseInt
      const normalized = normalizeDigits(minutesRaw);
      const minutes = parseInt(normalized, 10);

      // 1) التحقق من عنوان المهمة
      if (!desc) {
        if (emptyModal) emptyModal.hidden = false;
        return;
      }

      // 2) التحقق من الوقت (فارغ أو ليس رقم)
      if (!normalized || Number.isNaN(minutes) || minutes <= 0) {
        if (timeModal) {
          const body = timeModal.querySelector(".time-body");
          if (body) {
            body.innerHTML = `يجب تحديد وقت تقريبي للمهمة (بالدقائق).<br>اكتب رقمًا فقط (مثلاً: 15).`;
          }
          timeModal.hidden = false;
        }
        return;
      }

      // 3) التحقق من الحد الأعلى للوقت
      if (minutes > MAX_MINUTES) {
        if (timeModal) {
          const body = timeModal.querySelector(".time-body");
          if (body) {
            body.innerHTML = `
              المدة القصوى للمهمة الواحدة هي ${MAX_MINUTES} دقيقة تقريبًا (حوالي ٥ ساعات).<br>
              جربي تقسيم المهمة إلى مهام أصغر لراحة أفضل.
            `;
          }
          timeModal.hidden = false;
        }
        return;
      }

      // 4) حفظ / تحديث
      let tasks = loadTodayTasks();

      if (editingIndex !== null && editingIndex >= 0 && editingIndex < tasks.length) {
        tasks[editingIndex].description = desc;
        tasks[editingIndex].minutes     = minutes;
        tasks[editingIndex].emoji       = selectedEmoji;
      } else {
        tasks.push({
          emoji: selectedEmoji,
          description: desc,
          minutes,
          done: false,
          createdAt: Date.now()
        });
      }

      saveTodayTasks(tasks);

      // Reset form
      descInput.value = "";
      timeInput.value = "";
      editingIndex = null;
      saveTaskBtn.textContent = "حفظ المهمة";
      showForm(false);
      renderTasks(tasks);
    });
  }

  /* =========================================================
     7. Start Challenge Button
  ========================================================= */

  function setupStartButton() {
    if (!startChallengeBtn) return;

    startChallengeBtn.addEventListener("click", () => {
      const visible = newTaskContainer && newTaskContainer.style.display === "block";
      showForm(!visible);

      if (!visible && descInput) {
        editingIndex = null;
        saveTaskBtn.textContent = "حفظ المهمة";
        descInput.value = "";
        timeInput.value = "";
        setActiveEmoji("☀️");
        setTimeout(() => descInput.focus(), 50);
      }
    });
  }

  /* =========================================================
     8. App Initialization
  ========================================================= */

  const initialTasks = loadTodayTasks();
  renderTasks(initialTasks);
  setupEmojiPicker();
  handleSaveTask();
  setupStartButton();
});