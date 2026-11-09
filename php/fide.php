<?php
// fide.php — petit relais serveur vers l'API FIDE de Lichess (JSON public, sans clé)
//   fide.php?id=1503014   -> fiche d'un joueur + historique des classements
//   fide.php?q=carlsen    -> recherche par nom (liste)
// Les réponses sont gardées 24 h dans php/cache/fide/ pour ménager le service.
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const FIDE_API_BASE = 'https://lichess.org/api/fide';
const FIDE_CACHE_TTL = 86400;

function fide_out(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fide_get(string $url): ?array {
    $base = getenv('FIDE_API_BASE') ?: FIDE_API_BASE;   // surchargeable pour les tests
    $url = $base . $url;
    $cacheDir = __DIR__ . '/cache/fide';
    $cacheFile = $cacheDir . '/' . md5($url) . '.json';
    if (is_file($cacheFile) && (time() - filemtime($cacheFile)) < FIDE_CACHE_TTL) {
        $cached = json_decode((string)file_get_contents($cacheFile), true);
        if (is_array($cached)) return $cached;
    }

    $body = false;
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_USERAGENT => 'KChess2025-club-training',
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
        ]);
        $body = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($status === 404) return ['_not_found' => true];
        if ($status >= 400) $body = false;
    } else {
        $ctx = stream_context_create(['http' => [
            'timeout' => 8,
            'header' => "Accept: application/json\r\nUser-Agent: KChess2025-club-training\r\n",
            'ignore_errors' => false,
        ]]);
        $body = @file_get_contents($url, false, $ctx);
    }
    if ($body === false || $body === '') {
        // en cas de panne, on préfère une vieille réponse en cache à rien
        if (is_file($cacheFile)) {
            $stale = json_decode((string)file_get_contents($cacheFile), true);
            if (is_array($stale)) return $stale;
        }
        return null;
    }
    $data = json_decode($body, true);
    if (!is_array($data)) return null;
    if (!is_dir($cacheDir)) @mkdir($cacheDir, 0775, true);
    @file_put_contents($cacheFile, json_encode($data, JSON_UNESCAPED_UNICODE));
    return $data;
}

// "2015081568" -> ['y' => 2015, 'm' => 8, 'r' => 1568]
function fide_decode_history($list): array {
    $out = [];
    foreach ((array)$list as $n) {
        $n = (int)$n;
        if ($n <= 0) continue;
        $out[] = ['y' => intdiv($n, 1000000), 'm' => intdiv($n, 10000) % 100, 'r' => $n % 10000];
    }
    return $out;
}

// fide.php?ids=1503014,100  -> infos courtes de plusieurs joueurs (liste d'un club), 40 max
if (isset($_GET['ids'])) {
    $ids = array_slice(array_unique(array_filter(array_map(
        fn($x) => preg_replace('/\D/', '', $x), explode(',', (string)$_GET['ids'])
    ), fn($x) => $x !== '' && strlen($x) <= 10)), 0, 40);
    $players = [];
    foreach ($ids as $id) {
        $p = fide_get('/player/' . $id);
        if (is_array($p) && empty($p['_not_found'])) {
            $players[$id] = [
                'id' => $p['id'] ?? (int)$id, 'name' => $p['name'] ?? '', 'title' => $p['title'] ?? null,
                'federation' => $p['federation'] ?? '', 'standard' => $p['standard'] ?? 0,
                'rapid' => $p['rapid'] ?? 0, 'blitz' => $p['blitz'] ?? 0,
            ];
        }
    }
    fide_out(['ok' => true, 'players' => $players]);
}

if (isset($_GET['id'])) {
    $id = preg_replace('/\D/', '', (string)$_GET['id']);
    if ($id === '' || strlen($id) > 10) fide_out(['ok' => false, 'error' => 'bad_id'], 400);

    $player = fide_get('/player/' . $id);
    if ($player === null) fide_out(['ok' => false, 'error' => 'unreachable'], 502);
    if (!empty($player['_not_found'])) fide_out(['ok' => false, 'error' => 'not_found'], 404);

    $history = ['standard' => [], 'rapid' => [], 'blitz' => []];
    $raw = fide_get('/player/' . $id . '/ratings');
    if (is_array($raw) && empty($raw['_not_found'])) {
        foreach ($history as $k => $_) $history[$k] = fide_decode_history($raw[$k] ?? []);
    }
    fide_out(['ok' => true, 'player' => $player, 'history' => $history]);
}

if (isset($_GET['q'])) {
    $q = trim((string)$_GET['q']);
    if (mb_strlen($q) < 2 || mb_strlen($q) > 60) fide_out(['ok' => false, 'error' => 'bad_query'], 400);
    $list = fide_get('/player?q=' . rawurlencode($q));
    if ($list === null) fide_out(['ok' => false, 'error' => 'unreachable'], 502);
    if (!empty($list['_not_found'])) $list = [];
    fide_out(['ok' => true, 'results' => array_slice(array_values($list), 0, 20)]);
}

fide_out(['ok' => false, 'error' => 'missing_param'], 400);
