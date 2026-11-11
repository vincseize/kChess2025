<?php
// data_save.php — enregistre config/players.json ou config/clubs.json (LOCALHOST uniquement)
// Lecture : tout le monde (via profile.php). Écriture : uniquement depuis ce poste.
require_once __DIR__ . '/local-only.php';
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function ds_out(array $d, int $code = 200): void {
    http_response_code($code);
    echo json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (!kchess_is_local()) ds_out(['ok' => false, 'error' => 'forbidden'], 403);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') ds_out(['ok' => false, 'error' => 'method'], 405);

$in = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($in)) ds_out(['ok' => false, 'error' => 'bad_json'], 400);

$kind = (string)($in['kind'] ?? '');
$list = $in['list'] ?? null;
if (!in_array($kind, ['players', 'clubs'], true) || !is_array($list)) ds_out(['ok' => false, 'error' => 'bad_request'], 400);

$clean = function ($v, int $max) {
    $v = trim(preg_replace('/\s+/u', ' ', (string)$v));
    return mb_substr($v, 0, $max);
};
$slug = function (string $s): string {
    $t = @iconv('UTF-8', 'ASCII//TRANSLIT', $s);
    $t = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', $t !== false && $t !== '' ? $t : $s), '-'));
    return $t !== '' ? $t : 'club';
};
$fideOk = fn($f) => is_string($f) && preg_match('/^\d{3,10}$/', $f);

$out = [];
if ($kind === 'players') {
    if (count($list) > 2000) ds_out(['ok' => false, 'error' => 'too_many'], 400);
    $seen = [];
    foreach ($list as $p) {
        if (!is_array($p)) continue;
        $fide = (string)($p['fide'] ?? '');
        $name = $clean($p['name'] ?? '', 80);
        if ($name === '' || !$fideOk($fide) || isset($seen[$fide])) continue;
        $seen[$fide] = true;
        $row = ['fide' => $fide, 'name' => $name];
        $fed = strtoupper($clean($p['federation'] ?? '', 3));
        if (preg_match('/^[A-Z]{3}$/', $fed)) $row['federation'] = $fed;
        $out[] = $row;
    }
    usort($out, fn($a, $b) => strcasecmp($a['name'], $b['name']));
    $file = __DIR__ . '/config/players.json';
    $payload = ['players' => $out];
} else {
    if (count($list) > 300) ds_out(['ok' => false, 'error' => 'too_many'], 400);
    $names = []; $ids = [];
    foreach ($list as $c) {
        if (!is_array($c)) continue;
        $name = $clean($c['name'] ?? '', 80);
        if ($name === '' || isset($names[mb_strtolower($name)])) continue;
        $names[mb_strtolower($name)] = true;
        $id = $slug((string)($c['id'] ?? $name)); $base = $id; $n = 2;
        while (isset($ids[$id])) $id = $base . '-' . $n++;
        $ids[$id] = true;
        $row = ['id' => $id, 'name' => $name];
        foreach (['city', 'region', 'country'] as $f) {
            $v = $clean($c[$f] ?? '', 60);
            if ($v !== '') $row[$f] = $v;
        }
        $pl = [];
        $seenP = [];
        foreach ((is_array($c['players'] ?? null) ? $c['players'] : []) as $p) {
            if (!is_array($p) || count($pl) >= 500) continue;
            $pn = $clean($p['name'] ?? '', 80);
            if ($pn === '') continue;
            $f = (string)($p['fide'] ?? '');
            $key = $fideOk($f) ? 'id:' . $f : 'n:' . mb_strtolower($pn);
            if (isset($seenP[$key])) continue;
            $seenP[$key] = true;
            $pl[] = $fideOk($f) ? ['name' => $pn, 'fide' => $f] : ['name' => $pn];
        }
        $row['players'] = $pl;
        $out[] = $row;
    }
    $file = __DIR__ . '/config/clubs.json';
    $payload = ['clubs' => $out];
}

$fh = fopen($file, 'c+');
if (!$fh) ds_out(['ok' => false, 'error' => 'write_failed'], 500);
flock($fh, LOCK_EX);
@copy($file, $file . '.bak');
rewind($fh);
ftruncate($fh, 0);
fwrite($fh, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
fflush($fh);
flock($fh, LOCK_UN);
fclose($fh);

ds_out(['ok' => true, 'list' => $out]);
