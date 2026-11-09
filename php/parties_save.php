<?php
// parties_save.php — ajoute une partie dans config/parties.json (LOCALHOST uniquement)
require_once __DIR__ . '/local-only.php';
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function ps_out(array $d, int $code = 200): void {
    http_response_code($code);
    echo json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (!kchess_is_local()) ps_out(['ok' => false, 'error' => 'forbidden'], 403);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') ps_out(['ok' => false, 'error' => 'method'], 405);

$in = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($in)) ps_out(['ok' => false, 'error' => 'bad_json'], 400);

$clean = function ($v, int $max) {
    $v = trim(preg_replace('/\s+/u', ' ', (string)$v));
    return mb_substr($v, 0, $max);
};

$title = $clean($in['title'] ?? '', 80);
$players = $clean($in['players'] ?? '', 120);
$place = $clean($in['place'] ?? '', 80);
$year = (int)($in['year'] ?? 0);
$result = (string)($in['result'] ?? '');
$uci = $in['uci'] ?? null;
$san = $in['san'] ?? null;

if ($title === '' || $players === '') ps_out(['ok' => false, 'error' => 'missing_fields'], 400);
if ($year < 1400 || $year > 2100) ps_out(['ok' => false, 'error' => 'bad_year'], 400);
if (!in_array($result, ['1-0', '0-1', '1/2-1/2', '*'], true)) ps_out(['ok' => false, 'error' => 'bad_result'], 400);
if (!is_array($uci) || !is_array($san) || count($uci) < 2 || count($uci) > 400 || count($uci) !== count($san)) {
    ps_out(['ok' => false, 'error' => 'bad_moves'], 400);
}
foreach ($uci as $m) {
    if (!is_string($m) || !preg_match('/^[a-h][1-8][a-h][1-8][qrbn]?$/', $m)) ps_out(['ok' => false, 'error' => 'bad_moves'], 400);
}
foreach ($san as $m) {
    if (!is_string($m) || !preg_match('/^[A-Za-z0-9=+#\-]{2,10}$/', $m)) ps_out(['ok' => false, 'error' => 'bad_moves'], 400);
}

$file = __DIR__ . '/config/parties.json';
$fh = fopen($file, 'c+');
if (!$fh) ps_out(['ok' => false, 'error' => 'write_failed'], 500);
flock($fh, LOCK_EX);
$raw = stream_get_contents($fh);
$data = $raw !== '' && $raw !== false ? json_decode($raw, true) : ['games' => []];
if (!is_array($data) || !isset($data['games']) || !is_array($data['games'])) {
    flock($fh, LOCK_UN); fclose($fh);
    ps_out(['ok' => false, 'error' => 'corrupt_file'], 500);
}

// identifiant unique (slug)
$slug = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', iconv('UTF-8', 'ASCII//TRANSLIT', $title) ?: $title), '-'));
if ($slug === '') $slug = 'partie';
$ids = array_column($data['games'], 'id');
$id = $slug; $n = 2;
while (in_array($id, $ids, true)) $id = $slug . '-' . $n++;

$game = [
    'id' => $id,
    'title' => ['fr' => $title, 'en' => $title, 'es' => $title, 'de' => $title],
    'players' => $players,
    'place' => $place,
    'year' => $year,
    'result' => $result,
    'uci' => array_values($uci),
    'san' => array_values($san),
];
$data['games'][] = $game;

@copy($file, $file . '.bak');
rewind($fh);
ftruncate($fh, 0);
fwrite($fh, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
fflush($fh);
flock($fh, LOCK_UN);
fclose($fh);

ps_out(['ok' => true, 'game' => $game]);
