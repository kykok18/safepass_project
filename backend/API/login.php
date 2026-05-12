<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

$username = $input['username'] ?? '';
$kdf_hash_input = $input['kdf_hash'] ?? '';

if (!$username) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Username wajib']);
    exit();
}

require_once __DIR__ . '/../config/database.php';

$stmt = $conn->prepare("SELECT id_user, salt, kdf_hash FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
    exit();
}

$user = $result->fetch_assoc();

// ==========================
// MODE 1: Ambil SALT
// ==========================
if (empty($kdf_hash_input)) {
    echo json_encode([
        'success' => true,
        'salt' => $user['salt']
    ]);
    exit();
}

// ==========================
// MODE 2: Verifikasi LOGIN
// ==========================
if (!hash_equals($user['kdf_hash'], $kdf_hash_input)) {
    echo json_encode(['success' => false, 'message' => 'Password salah']);
    exit();
}

echo json_encode([
    'success' => true,
    'message' => 'Login berhasil'
]);

$stmt->close();
$conn->close();
