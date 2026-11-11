<?php
// save_club.php
require_once __DIR__ . '/local-only.php';
header('Content-Type: application/json; charset=utf-8');

// Sécurité : autorisé uniquement en localhost
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

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['clubName']) || !isset($input['player'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'missing_data']);
    exit;
}

$clubName = trim($input['clubName']);
$player = $input['player'];
$playerName = trim($player['name'] ?? '');
$playerFide = trim($player['fide'] ?? '');

if (!$clubName || !$playerName) {
    echo json_encode(['ok' => false, 'error' => 'invalid_player']);
    exit;
}

$clubsFile = __DIR__ . '/config/clubs.json';
if (!is_file($clubsFile)) {
    echo json_encode(['ok' => false, 'error' => 'clubs_json_not_found']);
    exit;
}

// Lecture du fichier avec verrou
$fh = fopen($clubsFile, 'c+');
if (!$fh) {
    echo json_encode(['ok' => false, 'error' => 'cannot_open']);
    exit;
}
flock($fh, LOCK_EX);
$raw = stream_get_contents($fh);
$data = json_decode($raw, true);

if (!isset($data['clubs']) || !is_array($data['clubs'])) {
    flock($fh, LOCK_UN); fclose($fh);
    echo json_encode(['ok' => false, 'error' => 'bad_format']);
    exit;
}

// Recherche du club
$found = false;
foreach ($data['clubs'] as &$club) {
    if ($club['name'] === $clubName) {
        $found = true;
        if (!isset($club['players'])) $club['players'] = [];
        
        // Vérifie si le joueur existe déjà
        $already = false;
        foreach ($club['players'] as $p) {
            if ($playerFide && isset($p['fide']) && $p['fide'] === $playerFide) {
                $already = true; break;
            }
            if (!$playerFide && isset($p['name']) && $p['name'] === $playerName) {
                $already = true; break;
            }
        }
        
        if (!$already) {
            $club['players'][] = [
                'name' => $playerName,
                'fide' => $playerFide
            ];
        }
        break;
    }
}
unset($club);

if (!$found) {
    flock($fh, LOCK_UN); fclose($fh);
    echo json_encode(['ok' => false, 'error' => 'club_not_found']);
    exit;
}

// Réécriture du fichier
@copy($clubsFile, $clubsFile . '.bak');
rewind($fh);
ftruncate($fh, 0);
fwrite($fh, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
fflush($fh);
flock($fh, LOCK_UN);
fclose($fh);

echo json_encode(['ok' => true, 'message' => 'Player added successfully']);