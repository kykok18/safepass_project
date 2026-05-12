// ==============================
// SafePass Vault (CRUD Password)
// ==============================

let currentVault = [];
let editIndex = -1;

// Alert test
alert("vault.js loaded - OK");

async function loadDashboard() {
  const username = sessionStorage.getItem("username");
  if (!username) {
    window.location.href = "login.html";
    return;
  }
  document.getElementById("usernameDisplay").innerText = username;
  await loadVaultFromServer();
  displayVault();
}

async function loadVaultFromServer() {
  const username = sessionStorage.getItem("username");
  const masterPassword = sessionStorage.getItem("masterPassword");
  if (!username || !masterPassword) {
    currentVault = [];
    return;
  }
  try {
    const res = await fetch(`http://localhost/SAFEPASS_PROJECT/backend/API/get_vault.php?username=${username}`);
    const data = await res.json();
    if (data.success && data.vault && data.vault.ciphertext) {
      const decrypted = await decryptVault(masterPassword, data.vault.ciphertext, data.vault.iv, data.vault.salt, data.vault.auth_tag);
      currentVault = JSON.parse(decrypted).entries || [];
    } else {
      currentVault = [];
    }
    sessionStorage.setItem("vault", JSON.stringify(currentVault));
  } catch (e) {
    console.error(e);
    currentVault = [];
  }
}

async function saveVaultToServer() {
  const username = sessionStorage.getItem("username");
  const masterPassword = sessionStorage.getItem("masterPassword");
  if (!username || !masterPassword) return false;
  try {
    const plaintext = JSON.stringify({ entries: currentVault });
    const encrypted = await encryptVault(masterPassword, plaintext);
    const res = await fetch("http://localhost/SAFEPASS_PROJECT/backend/API/save_vault.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, ciphertext: encrypted.ciphertext, iv: encrypted.iv, salt: encrypted.salt, auth_tag: encrypted.authTag }),
    });
    const data = await res.json();
    return data.success === true;
  } catch (e) {
    return false;
  }
}

function displayVault() {
  const container = document.getElementById("vaultList");
  if (!container) return;
  if (!currentVault.length) {
    container.innerHTML = '<p class="empty-message">Belum ada password tersimpan.</p>';
    return;
  }
  let html = "";
  for (let i = 0; i < currentVault.length; i++) {
    const e = currentVault[i];
    html += `<div class="password-card">
      <h3>🔐 ${escapeHtml(e.service)}</h3>
      <p><strong>Username:</strong> ${escapeHtml(e.username)}</p>
      <p><strong>Password:</strong> <span class="password-value">••••••••</span></p>
      <div class="card-actions">
        <button class="btn-show" data-index="${i}">👁️ Tampilkan</button>
        <button class="btn-copy" data-index="${i}">📋 Copy</button>
        <button class="btn-edit" data-index="${i}">✏️ Edit</button>
        <button class="btn-delete" data-index="${i}">🗑️ Hapus</button>
      </div>
      ${e.notes ? `<p><strong>📝 Catatan:</strong> ${escapeHtml(e.notes)}</p>` : ""}
    </div>`;
  }
  container.innerHTML = html;
  document.querySelectorAll(".btn-show").forEach((btn) => btn.addEventListener("click", () => showPassword(parseInt(btn.dataset.index))));
  document.querySelectorAll(".btn-copy").forEach((btn) => btn.addEventListener("click", () => copyPassword(currentVault[parseInt(btn.dataset.index)].password)));
  document.querySelectorAll(".btn-edit").forEach((btn) => btn.addEventListener("click", () => showEditModal(parseInt(btn.dataset.index))));
  document.querySelectorAll(".btn-delete").forEach((btn) => btn.addEventListener("click", () => deletePassword(parseInt(btn.dataset.index))));
}

function showPassword(i) {
  alert(`Password: ${currentVault[i].password}`);
}
function copyPassword(pwd) {
  navigator.clipboard.writeText(pwd);
  alert("✅ Password disalin!");
}
function showAddModal() {
  editIndex = -1;
  document.getElementById("modalTitle").innerText = "Tambah Password Baru";
  clearModalFields();
  document.getElementById("passwordModal").style.display = "flex";
}
function showEditModal(i) {
  editIndex = i;
  const e = currentVault[i];
  document.getElementById("modalTitle").innerText = "Edit Password";
  document.getElementById("serviceName").value = e.service;
  document.getElementById("usernameEntry").value = e.username;
  document.getElementById("passwordEntry").value = e.password;
  document.getElementById("notes").value = e.notes || "";
  document.getElementById("passwordModal").style.display = "flex";
}
function clearModalFields() {
  document.getElementById("serviceName").value = "";
  document.getElementById("usernameEntry").value = "";
  document.getElementById("passwordEntry").value = "";
  document.getElementById("notes").value = "";
}
function closeModal() {
  document.getElementById("passwordModal").style.display = "none";
}
async function savePassword() {
  const service = document.getElementById("serviceName").value.trim();
  const username = document.getElementById("usernameEntry").value.trim();
  const password = document.getElementById("passwordEntry").value;
  const notes = document.getElementById("notes").value.trim();
  if (!service || !username || !password) {
    alert("Semua harus diisi!");
    return;
  }
  const newEntry = { service, username, password, notes };
  if (editIndex === -1) currentVault.push(newEntry);
  else currentVault[editIndex] = newEntry;
  sessionStorage.setItem("vault", JSON.stringify(currentVault));
  await saveVaultToServer();
  displayVault();
  closeModal();
}
async function deletePassword(i) {
  if (!confirm("Yakin hapus?")) return;
  currentVault.splice(i, 1);
  sessionStorage.setItem("vault", JSON.stringify(currentVault));
  await saveVaultToServer();
  displayVault();
}
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

// EXPORT
async function exportVault() {
  alert("Export: mulai");
  const mp = sessionStorage.getItem("masterPassword");
  if (!mp) {
    alert("❌ Master password tidak ada. Login ulang.");
    window.location.href = "login.html";
    return;
  }
  if (!currentVault.length) {
    alert("⚠️ Tidak ada data.");
    return;
  }
  const exportBtn = document.getElementById("exportVaultBtn");
  const original = exportBtn.innerHTML;
  exportBtn.innerHTML = "⏳ Mengekspor...";
  exportBtn.disabled = true;
  try {
    const exportData = { version: "1.0", exportedAt: new Date().toISOString(), username: sessionStorage.getItem("username"), entries: currentVault };
    const plain = JSON.stringify(exportData, null, 2);
    alert("Export: enkripsi dimulai");
    const enc = await encryptVault(mp, plain);
    alert("Export: enkripsi selesai");
    const fileContent = JSON.stringify({ type: "SAFEPASS_VAULT_EXPORT", version: "1.0", data: enc }, null, 2);
    const blob = new Blob([fileContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `safepass_backup_${Date.now()}.sfpass`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert("✅ Export berhasil!");
  } catch (e) {
    alert("❌ Export error: " + e.message);
  } finally {
    exportBtn.innerHTML = original;
    exportBtn.disabled = false;
  }
}

// IMPORT
async function importVault(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = "";
  const mp = sessionStorage.getItem("masterPassword");
  if (!mp) {
    alert("❌ Login ulang");
    window.location.href = "login.html";
    return;
  }
  if (!file.name.endsWith(".sfpass")) {
    alert("❌ Harus file .sfpass");
    return;
  }
  const importBtn = document.getElementById("importVaultBtn");
  const original = importBtn.innerHTML;
  importBtn.innerHTML = "⏳ Mengimpor...";
  importBtn.disabled = true;
  try {
    const content = await file.text();
    const json = JSON.parse(content);
    if (json.type !== "SAFEPASS_VAULT_EXPORT") throw new Error("Bukan export SafePass");
    if (json.version !== "1.0") throw new Error("Versi tidak kompatibel");
    const decrypted = await decryptVault(mp, json.data.ciphertext, json.data.iv, json.data.salt, json.data.authTag);
    const imported = JSON.parse(decrypted);
    if (!imported.entries || !Array.isArray(imported.entries)) throw new Error("Format salah");
    if (!confirm(`Import ${imported.entries.length} entri? Data saat ini ${currentVault.length} entri. Lanjut?`)) return;
    const existing = new Set(currentVault.map((e) => `${e.service}|${e.username}`));
    let added = 0,
      dup = 0;
    for (const entry of imported.entries) {
      const key = `${entry.service}|${entry.username}`;
      if (!existing.has(key)) {
        currentVault.push(entry);
        existing.add(key);
        added++;
      } else dup++;
    }
    sessionStorage.setItem("vault", JSON.stringify(currentVault));
    await saveVaultToServer();
    displayVault();
    alert(`✅ Import selesai: ${added} ditambahkan, ${dup} duplikat diabaikan.`);
  } catch (e) {
    alert("❌ Import gagal: " + e.message);
  } finally {
    importBtn.innerHTML = original;
    importBtn.disabled = false;
  }
}
