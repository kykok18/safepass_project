<?php
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'safepass';

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Koneksi gagal: ' . $conn->connect_error]));
}
