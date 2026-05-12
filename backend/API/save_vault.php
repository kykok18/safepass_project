<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

$username = $input['username'] ?? '';
$ciphertext = $input['ciphertext'] ?? '';
$iv = $input['iv'] ?? '';
$salt = $input['salt'] ?? '';
$auth_tag = $input['auth_tag'] ?? '';

if (empty($username) || empty($ciphertext) || empty($iv) || empty($salt) || empty($auth_tag)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
    exit();
}

require_once __DIR__ . '/../config/database.php';

$userStmt = $conn->prepare("SELECT id_user FROM users WHERE username = ?");
$userStmt->bind_param("s", $username);
$userStmt->execute();
$userResult = $userStmt->get_result();

if ($userResult->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
    $userStmt->close();
    $conn->close();
    exit();
}

$user = $userResult->fetch_assoc();
$userStmt->close();

$checkStmt = $conn->prepare("SELECT id_vault FROM vaults WHERE user_id = ?");
$checkStmt->bind_param("i", $user['id_user']);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();
$hasVault = $checkResult->num_rows > 0;
$checkStmt->close();

if ($hasVault) {
    $stmt = $conn->prepare("UPDATE vaults SET encrypted_data = ?, salt = ?, iv = ?, auth_tag = ? WHERE user_id = ?");
    $stmt->bind_param("ssssi", $ciphertext, $salt, $iv, $auth_tag, $user['id_user']);
} else {
    $stmt = $conn->prepare("INSERT INTO vaults (user_id, encrypted_data, salt, iv, auth_tag) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("issss", $user['id_user'], $ciphertext, $salt, $iv, $auth_tag);
}

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Vault tersimpan']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal menyimpan vault: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
