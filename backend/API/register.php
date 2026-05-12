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
$salt = $input['salt'] ?? '';
$kdf_hash = $input['kdf_hash'] ?? '';

if (!$username || !$salt || !$kdf_hash) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
    exit();
}

require_once __DIR__ . '/../config/database.php';

// cek username
$stmt = $conn->prepare("SELECT id_user FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Username sudah terdaftar']);
    exit();
}
$stmt->close();

// insert user
$stmt = $conn->prepare("INSERT INTO users (username, salt, kdf_hash) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $username, $salt, $kdf_hash);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Registrasi berhasil']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal registrasi']);
}

$stmt->close();
$conn->close();
