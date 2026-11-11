<?php
// save_games.php — Sauvegarde les parties du profil dans config/games.json
require_once __DIR__ . '/local-only.php';
header('Content-Type: application/json; charset=utf-8');

if (!kchess_is_local()) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'forbidden']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method']);
    exit;
}

$in = json_decode(file_get_contents('php://input'), true);
if (!$in || !isset($in['fideId']) || !isset($in['games'])) {
    echo json_encode(['ok' => false, 'error' => 'missing_data']);
    exit;
}

$fideId = trim($in['fideId']);
$games = $in['games'];

$file = __DIR__ . '/config/games.json';
$fh = fopen($file, 'c+');
if (!$fh) {
    echo json_encode(['ok' => false, 'error' => 'write_failed']);
    exit;
}

flock($fh, LOCK_EX);
$raw = stream_get_contents($fh);
$data = $raw !== '' && $raw !== false ? json_decode($raw, true) : [];
if (!is_array($data)) $data = [];

// On écrase les anciennes parties de ce joueur avec les nouvelles
$data[$fideId] = $games;

rewind($fh);
ftruncate($fh, 0);
fwrite($fh, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
fflush($fh);
flock($fh, LOCK_UN);
fclose($fh);

echo json_encode(['ok' => true]);