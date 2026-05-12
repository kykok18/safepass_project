// ==============================
// SafePass Auth (Register & Login)
// ==============================

function checkAuth() {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn");
  const currentPage = window.location.pathname.split("/").pop();

  if (currentPage === "dashboard.html" && isLoggedIn !== "true") {
    window.location.href = "login.html";
  }

  if ((currentPage === "login.html" || currentPage === "register.html") && isLoggedIn === "true") {
    window.location.href = "dashboard.html";
  }
}

// ============ REGISTER ============
async function handleRegister(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const messageDiv = document.getElementById("message");

  if (!username || !password) {
    messageDiv.innerHTML = '<p style="color: red;">Username dan password harus diisi!</p>';
    return;
  }

  if (password !== confirmPassword) {
    messageDiv.innerHTML = '<p style="color: red;">Konfirmasi password tidak cocok!</p>';
    return;
  }

  messageDiv.innerHTML = '<p style="color: blue;">🔐 Memproses registrasi...</p>';

  try {
    const salt = generateSalt();
    const kdfHash = await hashForVerification(password, salt);

    const response = await fetch("http://localhost/SAFEPASS_PROJECT/backend/API/register.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username,
        salt: salt,
        kdf_hash: kdfHash,
      }),
    });

    const data = await response.json();

    if (data.success) {
      messageDiv.innerHTML = '<p style="color: green;">✅ Registrasi berhasil! Silakan login.</p>';
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } else {
      messageDiv.innerHTML = '<p style="color: red;">❌ ' + data.message + "</p>";
    }
  } catch (error) {
    console.error(error);
    messageDiv.innerHTML = '<p style="color: red;">❌ Error: ' + error.message + "</p>";
  }
}

// ============ LOGIN ============
async function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const messageDiv = document.getElementById("message");

  if (!username || !password) {
    messageDiv.innerHTML = '<p style="color: red;">Username dan password harus diisi!</p>';
    return;
  }

  messageDiv.innerHTML = '<p style="color: blue;">🔐 Memproses login...</p>';

  try {
    // Step 1: Ambil salt dari server
    const saltResponse = await fetch(`http://localhost/SAFEPASS_PROJECT/backend/API/get_salt.php?username=${username}`);
    const saltData = await saltResponse.json();

    if (!saltData.success) {
      messageDiv.innerHTML = '<p style="color: red;">❌ Username tidak ditemukan</p>';
      return;
    }

    // Step 2: Hitung kdf_hash
    const kdfHash = await hashForVerification(password, saltData.salt);

    // Step 3: Kirim ke login.php
    const response = await fetch("http://localhost/SAFEPASS_PROJECT/backend/API/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username,
        kdf_hash: kdfHash,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Simpan data ke sessionStorage
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("username", username);
      sessionStorage.setItem("salt", saltData.salt);
      sessionStorage.setItem("masterPassword", password); // 🔐 untuk enkripsi

      messageDiv.innerHTML = '<p style="color: green;">✅ Login berhasil! Mengarahkan...</p>';

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } else {
      messageDiv.innerHTML = '<p style="color: red;">❌ ' + data.message + "</p>";
    }
  } catch (error) {
    console.error(error);
    messageDiv.innerHTML = '<p style="color: red;">❌ Error: ' + error.message + "</p>";
  }
}

// ============ LOGOUT ============
function handleLogout() {
  sessionStorage.clear();
  window.location.href = "login.html";
}

// ============ AUTO LOGOUT ============
let inactivityTimer;

function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(
    () => {
      handleLogout();
    },
    5 * 60 * 1000,
  );
}

function setupAutoLogout() {
  const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
  events.forEach((event) => {
    document.addEventListener(event, resetInactivityTimer);
  });
  resetInactivityTimer();
}

// ============ INITIALIZATION ============
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  if (window.location.pathname.includes("dashboard.html")) {
    setupAutoLogout();
    if (typeof loadDashboard === "function") {
      loadDashboard();
    }
  }
});
