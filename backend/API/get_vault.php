<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit();
}

$username = $_GET['username'] ?? '';

if (empty($username)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Username harus diisi']);
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

$vaultStmt = $conn->prepare("SELECT encrypted_data, salt, iv, auth_tag FROM vaults WHERE user_id = ?");
$vaultStmt->bind_param("i", $user['id_user']);
$vaultStmt->execute();
$vaultResult = $vaultStmt->get_result();

if ($vaultResult->num_rows > 0) {
    $vault = $vaultResult->fetch_assoc();
    echo json_encode([
        'success' => true,
        'vault' => [
            'ciphertext' => $vault['encrypted_data'],
            'salt' => $vault['salt'],
            'iv' => $vault['iv'],
            'auth_tag' => $vault['auth_tag']
        ]
    ]);
} else {
    echo json_encode([
        'success' => true,
        'vault' => null
    ]);
}

$vaultStmt->close();
$conn->close();
