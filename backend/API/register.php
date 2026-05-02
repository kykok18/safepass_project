<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

$input = json_decode(file_get_contents('php://input'), true);

$username = $input['username'] ?? '';
$salt = $input['salt'] ?? '';
$kdf_hash = $input['kdf_hash'] ?? '';

if (empty($username) || empty($salt) || empty($kdf_hash)) {
    echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
    exit();
}

require_once __DIR__ . '/../config/database.php';

$stmt = $conn->prepare("INSERT INTO users (username, salt, kdf_hash) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $username, $salt, $kdf_hash);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Registrasi berhasil']);
} else {
    echo json_encode(['success' => false, 'message' => 'Username sudah terdaftar']);
}

$stmt->close();
$conn->close();
