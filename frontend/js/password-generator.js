// ==============================
// Password Generator
// Fitur wajib SafePass
// ==============================

function generateRandomPassword() {
  // Ambil nilai dari form generator
  const length = parseInt(document.getElementById("passwordLength")?.value || 16);
  const useUppercase = document.getElementById("includeUppercase")?.checked !== false;
  const useLowercase = document.getElementById("includeLowercase")?.checked !== false;
  const useNumbers = document.getElementById("includeNumbers")?.checked !== false;
  const useSymbols = document.getElementById("includeSymbols")?.checked !== false;

  // Kumpulan karakter
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let charset = "";
  if (useLowercase) charset += lowercase;
  if (useUppercase) charset += uppercase;
  if (useNumbers) charset += numbers;
  if (useSymbols) charset += symbols;

  if (charset === "") {
    charset = lowercase + numbers; // fallback
  }

  // Generate password acak
  let password = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  // Pastikan minimal 1 karakter dari setiap jenis yang dipilih
  if (useUppercase && !/[A-Z]/.test(password)) {
    password = password.substring(1) + uppercase[Math.floor(Math.random() * uppercase.length)];
  }
  if (useLowercase && !/[a-z]/.test(password)) {
    password = password.substring(1) + lowercase[Math.floor(Math.random() * lowercase.length)];
  }
  if (useNumbers && !/[0-9]/.test(password)) {
    password = password.substring(1) + numbers[Math.floor(Math.random() * numbers.length)];
  }
  if (useSymbols && !/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
    password = password.substring(1) + symbols[Math.floor(Math.random() * symbols.length)];
  }

  return password;
}

function showPasswordGenerator() {
  // Cek apakah modal generator sudah ada, buat jika belum
  let modal = document.getElementById("generatorModal");
  if (!modal) {
    createGeneratorModal();
    modal = document.getElementById("generatorModal");
  }

  // Generate password pertama kali
  const password = generateRandomPassword();
  const inputField = document.getElementById("generatedPassword");
  if (inputField) inputField.value = password;

  modal.style.display = "flex";
}

function createGeneratorModal() {
  const modalHTML = `
        <div id="generatorModal" class="modal" style="display:none;">
            <div class="modal-content" style="max-width: 400px;">
                <h3>🔑 Password Generator</h3>
                
                <div class="form-group">
                    <label>Panjang Password: <span id="lengthValue">16</span></label>
                    <input type="range" id="passwordLength" min="8" max="32" value="16" style="width: 100%;">
                </div>
                
                <div class="form-group">
                    <label><input type="checkbox" id="includeUppercase" checked> Huruf Besar (A-Z)</label>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="includeLowercase" checked> Huruf Kecil (a-z)</label>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="includeNumbers" checked> Angka (0-9)</label>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="includeSymbols" checked> Simbol (!@#$%^&*)</label>
                </div>
                
                <div class="form-group">
                    <label>Password Hasil:</label>
                    <input type="text" id="generatedPassword" readonly style="font-family: monospace; background: #f0f0f0;">
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: space-between; margin-top: 15px;">
                    <button id="generateNewBtn" style="background: #007bff;">Generate Baru</button>
                    <button id="copyGeneratedBtn" style="background: #28a745;">📋 Copy</button>
                    <button id="usePasswordBtn" style="background: #ffc107; color:#333;">Gunakan</button>
                    <button id="closeGeneratorBtn" style="background: #dc3545;">Tutup</button>
                </div>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Event listeners
  const lengthSlider = document.getElementById("passwordLength");
  const lengthValue = document.getElementById("lengthValue");
  const generateBtn = document.getElementById("generateNewBtn");
  const copyBtn = document.getElementById("copyGeneratedBtn");
  const useBtn = document.getElementById("usePasswordBtn");
  const closeBtn = document.getElementById("closeGeneratorBtn");
  const generatedInput = document.getElementById("generatedPassword");

  if (lengthSlider) {
    lengthSlider.addEventListener("input", function () {
      lengthValue.innerText = this.value;
      generatedInput.value = generateRandomPassword();
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      generatedInput.value = generateRandomPassword();
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      if (generatedInput.value) {
        navigator.clipboard.writeText(generatedInput.value);
        alert("✅ Password disalin!");
      }
    });
  }

  if (useBtn) {
    useBtn.addEventListener("click", () => {
      const password = generatedInput.value;
      if (password) {
        const passwordField = document.getElementById("passwordEntry");
        if (passwordField) {
          passwordField.value = password;
        }
        closeGenerator();
        alert("✅ Password digunakan!");
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeGenerator);
  }
}

function closeGenerator() {
  const modal = document.getElementById("generatorModal");
  if (modal) modal.style.display = "none";
}

// Tambahkan tombol generator ke form tambah/edit password
function addGeneratorButtonToForm() {
  const formGroup = document.querySelector("#passwordEntry")?.parentElement;
  if (formGroup && !document.getElementById("generatorBtnAdded")) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerText = "🔑 Generate Password";
    btn.style.marginTop = "5px";
    btn.style.background = "#6c757d";
    btn.style.padding = "5px 10px";
    btn.style.fontSize = "12px";
    btn.onclick = showPasswordGenerator;
    btn.id = "generatorBtnAdded";
    formGroup.appendChild(btn);
  }
}

// Jalankan saat halaman siap
document.addEventListener("DOMContentLoaded", function () {
  // Tunggu sebentar sampai modal form tambah password terload
  setTimeout(addGeneratorButtonToForm, 500);
});
