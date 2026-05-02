<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

$input = json_decode(file_get_contents('php://input'), true);

$username = $input['username'] ?? '';
$kdf_hash_input = $input['kdf_hash'] ?? '';

if (empty($username) || empty($kdf_hash_input)) {
    echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
    exit();
}

require_once __DIR__ . '/../config/database.php';

$stmt = $conn->prepare("SELECT salt, kdf_hash FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Username tidak ditemukan']);
    $stmt->close();
    $conn->close();
    exit();
}

$user = $result->fetch_assoc();

if ($user['kdf_hash'] !== $kdf_hash_input) {
    echo json_encode(['success' => false, 'message' => 'Password salah']);
    $stmt->close();
    $conn->close();
    exit();
}

echo json_encode([
    'success' => true,
    'message' => 'Login berhasil',
    'salt' => $user['salt']
]);

$stmt->close();
$conn->close();
