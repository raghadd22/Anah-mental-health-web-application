/* ============================================================
   UTILS.JS – Shared utilities for all pages
   (Date, Theme, User, Logout, Menus)
============================================================ */


document.addEventListener("DOMContentLoaded", () => {
  initDateDisplay();
  initThemeToggle();
  initUserAuth();
  initFooterYear();
  initMobileMenu(); 
});

/* ------------------------------------------------------------
   1) Date Management – supports all pages
------------------------------------------------------------ */
function initDateDisplay() {
// Possible Elements in Different Pages
  const elements = [
    document.getElementById("today-date"),    // Welcome
    document.getElementById("homeToday"),     // Home
    document.getElementById("journal-today")  // Journal
  ];

  const now = new Date();
  const formatter = new Intl.DateTimeFormat("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dateString = formatter.format(now);

  elements.forEach(el => {
    if (el) el.textContent = dateString;
  });
}

function initFooterYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* ------------------------------------------------------------
   2) Theme Management (Dark/Light Mode)
------------------------------------------------------------ */
function initThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  
  // استرجاع الثيم عند التحميل
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("is-dark");
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("is-dark");
      const isDark = document.body.classList.contains("is-dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });
  }
}

/* ------------------------------------------------------------
   3) User Management & Logout (User & Auth)
------------------------------------------------------------ */
function initUserAuth() {
  const authBtn = document.getElementById("authButton");
  if (!authBtn) return;

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch { user = null; }

// 1. Guest state (not logged in)
  if (!user || !user.name) {
    authBtn.textContent = "تسجيل / دخول";
    authBtn.href = "SignOrLogin.html";
    authBtn.classList.remove("auth-chip");
    return;
  }

  // 2. Logged-in user state  
  authBtn.textContent = `مرحبًا، ${user.name}`;
  authBtn.href = "#"; // نمنع الانتقال
  authBtn.classList.add("auth-chip");

  // Automatically inject the logout modal
  injectLogoutModal();

  // Click on the name -> open modal
  authBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const modal = document.getElementById("globalLogoutModal");
    if (modal) modal.hidden = false;
  });
}

function injectLogoutModal() {
  if (document.getElementById("globalLogoutModal")) return;

  const modalHTML = `
    <div id="globalLogoutModal" class="journal-modal" hidden>
      <div class="journal-modal-dialog" style="text-align: center; max-width: 400px;">
        <h3>تسجيل الخروج</h3>
        <p style="margin: 15px 0;">هل أنتِ متأكدة أنك تريدين تسجيل الخروج؟</p>
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
          <button id="utilsConfirmLogout" class="pill-button pill-primary" style="background: #ff6b6b; color: white;">نعم، خروج</button>
          <button id="utilsCancelLogout" class="pill-button pill-ghost">تراجع</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Enable Buttons
  document.getElementById("utilsConfirmLogout").addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "SignOrLogin.html";
  });
  document.getElementById("utilsCancelLogout").addEventListener("click", () => {
    document.getElementById("globalLogoutModal").hidden = true;
  });
}

/* ------------------------------------------------------------
   4) General Helper Functions - usable in any file
------------------------------------------------------------ */
// Function to get the unified storage key

window.getStorageKey = function() {
  const user = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (user && user.email) return `journalData_${user.email}`;
  return "journalData_guest";
};

// Function to get today's date in unified ISO format
window.getTodayISO = function() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};