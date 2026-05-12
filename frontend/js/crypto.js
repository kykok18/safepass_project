// ==============================
// SafePass Crypto (Client-Side)
// Argon2id + AES-GCM
// ==============================

// ===== Config =====
const KDF_CONFIG = {
  time: 2, // Jumlah iterasi (tingkatkan untuk produksi: 3-4)
  mem: 19456, // Memory usage 19MB (16MB + 3MB)
  hashLen: 32, // Panjang hash 32 bytes (256 bit)
  parallelism: 1, // Jumlah thread parallel
};

// ===== Utils =====
function toBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function randomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}

function generateSalt() {
  return toBase64(randomBytes(16));
}

// ===== Key Derivation (Argon2id) =====
async function deriveKey(masterPassword, saltBytes) {
  // Validasi input
  if (!masterPassword || typeof masterPassword !== "string") {
    throw new Error("Master password tidak valid");
  }
  if (!saltBytes || saltBytes.length === 0) {
    throw new Error("Salt tidak valid");
  }

  const result = await argon2.hash({
    pass: masterPassword,
    salt: saltBytes,
    time: KDF_CONFIG.time,
    mem: KDF_CONFIG.mem,
    hashLen: KDF_CONFIG.hashLen,
    parallelism: KDF_CONFIG.parallelism,
    type: argon2.types.Argon2id, // type: 2 (Argon2id)
    encoded: false,
  });

  if (!result || !result.hash) {
    throw new Error("Gagal melakukan key derivation");
  }

  return crypto.subtle.importKey("raw", result.hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

// ===== Hash untuk verifikasi login =====
async function hashForVerification(masterPassword, saltBase64) {
  if (!masterPassword || !saltBase64) {
    throw new Error("Password dan salt wajib diisi");
  }

  const saltBytes = fromBase64(saltBase64);
  const result = await argon2.hash({
    pass: masterPassword,
    salt: saltBytes,
    time: KDF_CONFIG.time,
    mem: KDF_CONFIG.mem,
    hashLen: KDF_CONFIG.hashLen,
    parallelism: KDF_CONFIG.parallelism,
    type: argon2.types.Argon2id,
    encoded: false,
  });

  return toBase64(result.hash);
}

// ===== ENKRIPSI VAULT =====
async function encryptVault(masterPassword, plaintext) {
  // Validasi input
  if (!masterPassword || typeof masterPassword !== "string") {
    throw new Error("Master password tidak valid");
  }
  if (!plaintext || typeof plaintext !== "string") {
    throw new Error("Data yang akan dienkripsi tidak valid");
  }

  const encoder = new TextEncoder();

  // Generate salt (16 bytes) dan IV (12 bytes) yang acak
  const salt = randomBytes(16);
  const iv = randomBytes(12);

  // Derive key dari master password dan salt
  const key = await deriveKey(masterPassword, salt);

  // Enkripsi data dengan AES-GCM
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128, // 128-bit authentication tag
    },
    key,
    encoder.encode(plaintext),
  );

  // Pisahkan ciphertext dan auth tag (16 bytes terakhir)
  const encryptedArray = new Uint8Array(encrypted);
  const authTag = encryptedArray.slice(-16);
  const ciphertext = encryptedArray.slice(0, -16);

  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
    salt: toBase64(salt),
    authTag: toBase64(authTag),
  };
}

// ===== DEKRIPSI VAULT =====
async function decryptVault(masterPassword, ciphertextBase64, ivBase64, saltBase64, authTagBase64) {
  // Validasi input
  if (!masterPassword || typeof masterPassword !== "string") {
    throw new Error("Master password tidak valid");
  }
  if (!ciphertextBase64 || !ivBase64 || !saltBase64 || !authTagBase64) {
    throw new Error("Data enkripsi tidak lengkap");
  }

  const decoder = new TextDecoder();

  // Decode semua komponen dari Base64
  let ciphertext, iv, salt, authTag;
  try {
    ciphertext = fromBase64(ciphertextBase64);
    iv = fromBase64(ivBase64);
    salt = fromBase64(saltBase64);
    authTag = fromBase64(authTagBase64);
  } catch (e) {
    throw new Error("Format data enkripsi tidak valid");
  }

  // Derive key dari master password dan salt
  const key = await deriveKey(masterPassword, salt);

  // Gabungkan ciphertext dan auth tag
  const encryptedData = new Uint8Array(ciphertext.length + authTag.length);
  encryptedData.set(ciphertext, 0);
  encryptedData.set(authTag, ciphertext.length);

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
        tagLength: 128,
      },
      key,
      encryptedData,
    );
    return decoder.decode(decrypted);
  } catch (e) {
    // Bedakan jenis error untuk debugging
    if (e.name === "OperationError") {
      throw new Error("Dekripsi gagal: password salah atau data rusak");
    }
    throw new Error("Dekripsi gagal: " + e.message);
  }
}

// ===== Simpan master password saat login =====
function setMasterPassword(password) {
  if (!password) {
    console.warn("Peringatan: Menyimpan master password kosong");
  }
  sessionStorage.setItem("masterPassword", password);
}

function getMasterPassword() {
  return sessionStorage.getItem("masterPassword");
}

function clearMasterPassword() {
  sessionStorage.removeItem("masterPassword");
}

// ===== Export =====
window.SafePassCrypto = {
  generateSalt,
  hashForVerification,
  encryptVault,
  decryptVault,
  setMasterPassword,
  getMasterPassword,
  clearMasterPassword,
};
