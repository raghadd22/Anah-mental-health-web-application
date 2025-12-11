// signOrlogin.js

document.addEventListener("DOMContentLoaded", () => {
/* =====================================
     0) Reveal elements with animation
  ====================================== */
  document
    .querySelectorAll(".anim-glass-in, .anim-fade-up, .reveal")
    .forEach((el) => el.classList.add("is-visible"));

  /* ============================================================
     Error Modal Definition - inside DOMContentLoaded to ensure loaded
  ============================================================ */
  const authErrorModal = document.getElementById("authErrorModal");
  const authErrorMsg = document.getElementById("authErrorMessage");
  const closeAuthErrorBtn = document.getElementById("closeAuthError");
  

  // Close button logic
  if (closeAuthErrorBtn && authErrorModal) {
    closeAuthErrorBtn.addEventListener("click", () => {
      authErrorModal.hidden = true;
    });
  }

  // Helper function to show authentication error
  function showAuthError(message) {
    if (authErrorMsg) authErrorMsg.textContent = message;
    if (authErrorModal) authErrorModal.hidden = false;
  }

/* ============================================================
     [INTERACTION] Success Modal Handling
     Manages the post-registration user flow.
     Objective: Acknowledge success and redirect the user to the Login interface.
  ============================================================ */
  
  const successModal = document.getElementById("successModal");
  const closeSuccessBtn = document.getElementById("closeSuccessModal");

  
  if (closeSuccessBtn && successModal) {
    closeSuccessBtn.addEventListener("click", (e) => {
      e.preventDefault();
      
      
      successModal.hidden = true;

      document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".auth-panel").forEach(p => p.classList.remove("active"));

      const loginTab = document.querySelector('.auth-tab[data-target="login-panel"]');
      const loginPanel = document.getElementById("login-panel");

      if (loginTab) loginTab.classList.add("active");
      if (loginPanel) loginPanel.classList.add("active");

      
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  /* =====================================
     1) Tabs: Login / Sign Up
    ====================================== */

  const tabs = document.querySelectorAll(".auth-tab");
  const panels = document.querySelectorAll(".auth-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      const targetId = tab.dataset.target;
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add("active");
    });
  });

  /* =====================================
     2) Bottom links swapping (e.g., "Already have an account?")
  ====================================== */
  document.querySelectorAll(".swap-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId =
        btn.dataset.swap === "signup" ? "signup-panel" : "login-panel";
      const targetTab = document.querySelector(
        `.auth-tab[data-target="${targetId}"]`
      );
      if (targetTab) {
        targetTab.click();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

  /* =====================================
     3) Show / Hide password toggle
  ====================================== */
  document.querySelectorAll(".peek").forEach((btn) => {
    const input = btn.previousElementSibling;
    const icon = btn.querySelector(".peek-icon");

    if (!input || !icon) return;

    btn.addEventListener("click", () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      icon.src = isPassword ? "images/seen.png" : "images/eyebrow.png";
      icon.alt = isPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور";
    });
  });

  /* =====================================
     4) Users storage in LocalStorage
  ====================================== */
  function getUsers() {
    return JSON.parse(localStorage.getItem("users") || "[]");
  }

  function setUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
  }

  function saveUserAccount(name, email, password) {
    const users = getUsers();
    if (users.some((u) => u.email === email)) {
      return { ok: false, msg: "البريد مستخدم مسبقًا" };
    }
    users.push({ name, email, password });
    setUsers(users);
    return { ok: true };
  }

  function loginUser(email, password) {
    const users = getUsers();
    return (
      users.find((u) => u.email === email && u.password === password) || null
    );
  }

  function updateUserPassword(email, newPassword) {
    const users = getUsers();
    const idx = users.findIndex((u) => u.email === email);
    if (idx === -1) return false;
    users[idx].password = newPassword;
    setUsers(users);
    return true;
  }

  /* =====================================
     5) Password strength validation
  ====================================== */
  function validatePasswordStrength(password) {
    if (!password || password.length < 8) {
      return { ok: false, msg: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." };
    }
    if (!/[A-Za-zأ-ي]/.test(password)) {
      return { ok: false, msg: "كلمة المرور يجب أن تحتوي على حرف واحد على الأقل." };
    }
    if (!/[0-9]/.test(password)) {
      return { ok: false, msg: "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل." };
    }
    if (!/[!@#$%^&*()_\-+=\[{\]};:'\",.<>/?\\|]/.test(password)) {
      return { ok: false, msg: "كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل." };
    }
    return { ok: true };
  }

  /* =====================================
     6) Sign Up
  ====================================== */
  const signupForm = document.getElementById("signup-panel");

  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // ... (جلب البيانات والتحقق منها كما هو) ...
      const name = signupForm.querySelector("#signup-name")?.value.trim() || "";
      const email = signupForm.querySelector("#signup-email")?.value.trim() || "";
      const passVal = signupForm.querySelector("#signup-password")?.value.trim() || "";
      const confirmInput = signupForm.querySelector("#signup-password-confirm");
      const confirm = confirmInput?.value.trim() || "";

      if (!email || !passVal || !name) {
        showAuthError("يرجى تعبئة جميع الحقول");
        return;
      }

      const strength = validatePasswordStrength(passVal);
      if (!strength.ok) {
        showAuthError(strength.msg);
        return;
      }

      if (passVal !== confirm) {
        showAuthError("كلمتا المرور غير متطابقتين");
        return;
      }

      const result = saveUserAccount(name, email, passVal);
      if (!result.ok) {
        showAuthError(result.msg);
        return;
      }
      
      const successModal = document.getElementById("successModal");
      if (successModal) {
        successModal.hidden = false; 
      }
    });
  }

  /* =====================================
     7) Login
  ====================================== */
  const loginForm = document.getElementById("login-panel");
  const rememberCheckbox = document.getElementById("remember-me");
  const loginEmailInput = loginForm?.querySelector("#login-email");

  const rememberedEmail = localStorage.getItem("rememberedEmail");
  const rememberFlag = localStorage.getItem("rememberMe");

  if (rememberFlag === "1" && rememberedEmail && loginEmailInput && rememberCheckbox) {
    loginEmailInput.value = rememberedEmail;
    rememberCheckbox.checked = true;
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = loginForm.querySelector("#login-email")?.value.trim() || "";
      const pass = loginForm.querySelector("#login-password")?.value.trim() || "";

      if (!email || !pass) {
        showAuthError("يرجى إدخال البريد وكلمة المرور");
        return;
      }

      const user = loginUser(email, pass);

      if (!user) {
        showAuthError("بيانات الدخول غير صحيحة، يرجى التأكد من البريد وكلمة المرور.");
        return;
      }

      localStorage.setItem("currentUser", JSON.stringify(user));

      if (rememberCheckbox && rememberCheckbox.checked) {
        localStorage.setItem("rememberMe", "1");
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("rememberedEmail");
      }

      window.location.href = "home.html";
    });
  }

  /* =====================================
     8) Forgot password
  ====================================== */
  const forgotLink = document.getElementById("forgot-password-link");

  if (forgotLink) {
    forgotLink.addEventListener("click", (e) => {
      e.preventDefault();
      const emailInput = document.querySelector("#login-email");
      const defaultEmail = emailInput?.value.trim() || "";
      const email = prompt("أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور:", defaultEmail);

      if (!email) return;

      const users = getUsers();
      const user = users.find((u) => u.email === email);

      if (!user) {
        showAuthError("لا يوجد حساب مسجّل بهذا البريد.");
        return;
      }

      const newPass = prompt("أدخل كلمة مرور جديدة قوية:");
      if (!newPass) return;

      const strength = validatePasswordStrength(newPass);
      if (!strength.ok) {
        showAuthError(strength.msg);
        return;
      }

      const updated = updateUserPassword(email, newPass);
      if (updated) {
        alert("تم تحديث كلمة المرور بنجاح.");
      } else {
        showAuthError("حدث خطأ أثناء التحديث.");
      }
    });
  }

  //6.5) Password strength indicator

  (function setupPasswordStrength() {
    const pwInput = document.getElementById("signup-password");
    const strengthWrap = document.getElementById("signup-strength");
    const strengthText = document.getElementById("signup-strength-text");

    if (!pwInput || !strengthWrap || !strengthText) return;

    function evaluateStrength(password) {
      let score = 0;
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
      if (/\d/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;

      if (!password) return { level: 0, label: "—" };
      if (score <= 2) return { level: 1, label: "ضعيفة" };
      if (score <= 4) return { level: 2, label: "متوسطة" };
      return { level: 3, label: "قوية" };
    }

    function updateStrengthUI(password) {
      const { level, label } = evaluateStrength(password);
      strengthWrap.classList.remove("is-weak", "is-medium", "is-strong");
      strengthText.textContent = label;
      if (level === 1) strengthWrap.classList.add("is-weak");
      else if (level === 2) strengthWrap.classList.add("is-medium");
      else if (level === 3) strengthWrap.classList.add("is-strong");
    }

    pwInput.addEventListener("input", (e) => {
      updateStrengthUI(e.target.value);
    });
  })();

  /* =====================================
     9) Footer year
  ====================================== */
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();
});