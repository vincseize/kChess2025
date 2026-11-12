<?php
// games.php — endpoint unique pour récupérer les parties d'un joueur (remplace fide_games.php + python)
//   games.php?source=lichess&id=PSEUDO[&max=50]
// Sources prévues : lichess (OK), fide / ffe (à venir, voir plus bas).
// Format renvoyé (même clés que celles lues par renderMeGames) :
//   { ok:true, source, games:[ {source,id,url,date,opponent,my_elo,opp_elo,result,color,
//                               tournament,white,black,pgn} ] }
// "result" est vu du côté du joueur : 1-0 = victoire, 0-1 = défaite, 1/2-1/2 = nulle.
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const GAMES_CACHE_TTL = 600;   // 10 min : on ménage Lichess
const GAMES_UA = 'KChess2025-club-training';

function games_out(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// GET HTTP avec curl (repli file_get_contents), renvoie [status, body]
function games_http(string $url, string $accept): array {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        // WAMP/XAMPP : si php/cacert.pem existe, on l'utilise pour vérifier le certificat HTTPS
        if (is_file(__DIR__ . '/cacert.pem')) curl_setopt($ch, CURLOPT_CAINFO, __DIR__ . '/cacert.pem');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_USERAGENT => GAMES_UA,
            CURLOPT_HTTPHEADER => ['Accept: ' . $accept],
        ]);
        $body = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return [$status, $body === false ? '' : (string)$body];
    }
    $ctx = stream_context_create(['http' => [
        'timeout' => 20, 'ignore_errors' => true,
        'header' => "Accept: $accept\r\nUser-Agent: " . GAMES_UA . "\r\n",
    ]]);
    $body = @file_get_contents($url, false, $ctx);
    $status = 0;
    if (!empty($http_response_header[0]) && preg_match('~\s(\d{3})\s~', $http_response_header[0], $m)) $status = (int)$m[1];
    return [$status, $body === false ? '' : $body];
}

function games_cache_read(string $file, bool $allowStale = false): ?array {
    if (!is_file($file)) return null;
    if (!$allowStale && (time() - filemtime($file)) >= GAMES_CACHE_TTL) return null;
    $d = json_decode((string)file_get_contents($file), true);
    return is_array($d) ? $d : null;
}

// "e4 e5 Nf3" -> "1. e4 e5 2. Nf3"
function games_pgn(string $moves, string $white, string $black, string $result, string $date): string {
    $tokens = preg_split('/\s+/', trim($moves), -1, PREG_SPLIT_NO_EMPTY);
    $out = '';
    foreach ($tokens as $i => $t) $out .= ($i % 2 === 0 ? (intdiv($i, 2) + 1) . '. ' : '') . $t . ' ';
    $tags = '[White "' . $white . "\"]\n[Black \"" . $black . "\"]\n[Date \"" . $date . "\"]\n[Result \"" . $result . "\"]\n\n";
    return $tags . trim($out) . ' ' . $result;
}

function games_lichess(string $user, int $max): array {
    $cacheDir = __DIR__ . '/cache/games';
    $cacheFile = $cacheDir . '/lichess_' . strtolower($user) . '_' . $max . '.json';
    $cached = games_cache_read($cacheFile);
    if ($cached !== null) return ['ok' => true, 'games' => $cached, 'cached' => true];

    $url = 'https://lichess.org/api/games/user/' . rawurlencode($user)
         . '?max=' . $max . '&moves=true&opening=true&clocks=false&evals=false';
    [$status, $body] = games_http($url, 'application/x-ndjson');

    if ($status === 404) return ['ok' => false, 'error' => 'user_not_found'];
    if ($status === 429) return ['ok' => false, 'error' => 'rate_limited'];
    if ($status >= 400 || $body === '') {
        $stale = games_cache_read($cacheFile, true);   // panne : vieille réponse plutôt que rien
        if ($stale !== null) return ['ok' => true, 'games' => $stale, 'cached' => true, 'stale' => true];
        return ['ok' => false, 'error' => 'unreachable'];
    }

    $me = strtolower($user);
    $games = [];
    foreach (preg_split('/\R/', $body, -1, PREG_SPLIT_NO_EMPTY) as $line) {
        $g = json_decode($line, true);
        if (!is_array($g) || ($g['variant'] ?? 'standard') !== 'standard') continue;
        if (in_array($g['status'] ?? '', ['aborted', 'noStart'], true)) continue;

        $w = $g['players']['white'] ?? [];
        $b = $g['players']['black'] ?? [];
        $wName = $w['user']['name'] ?? (isset($w['aiLevel']) ? 'Stockfish niv. ' . $w['aiLevel'] : 'Anonyme');
        $bName = $b['user']['name'] ?? (isset($b['aiLevel']) ? 'Stockfish niv. ' . $b['aiLevel'] : 'Anonyme');
        $iAmWhite = strtolower($w['user']['id'] ?? '') === $me;
        $iAmBlack = strtolower($b['user']['id'] ?? '') === $me;
        if (!$iAmWhite && !$iAmBlack) continue;

        $winner = $g['winner'] ?? null;            // 'white' | 'black' | absent = nulle
        $mine = $iAmWhite ? 'white' : 'black';
        $result = $winner === null ? '1/2-1/2' : ($winner === $mine ? '1-0' : '0-1');
        $absolute = $winner === null ? '1/2-1/2' : ($winner === 'white' ? '1-0' : '0-1');
        $date = gmdate('Y-m-d', intdiv((int)($g['createdAt'] ?? 0), 1000));
        $opening = $g['opening']['name'] ?? '';
        $speed = $g['speed'] ?? '';

        $games[] = [
            'source'     => 'lichess',
            'id'         => $g['id'] ?? '',
            'url'        => 'https://lichess.org/' . ($g['id'] ?? ''),
            'date'       => $date,
            'opponent'   => $iAmWhite ? $bName : $wName,
            'my_elo'     => ($iAmWhite ? ($w['rating'] ?? null) : ($b['rating'] ?? null)),
            'opp_elo'    => ($iAmWhite ? ($b['rating'] ?? null) : ($w['rating'] ?? null)),
            'result'     => $result,
            'color'      => $iAmWhite ? 'w' : 'b',
            'tournament' => trim($speed . ($opening ? ' · ' . $opening : ''), ' ·'),
            'white'      => $wName,
            'black'      => $bName,
            'pgn'        => games_pgn((string)($g['moves'] ?? ''), $wName, $bName, $absolute, str_replace('-', '.', $date)),
        ];
    }

    if (!is_dir($cacheDir)) @mkdir($cacheDir, 0775, true);
    @file_put_contents($cacheFile, json_encode($games, JSON_UNESCAPED_UNICODE));
    return ['ok' => true, 'games' => $games];
}

$source = strtolower((string)($_GET['source'] ?? ''));
$id = trim((string)($_GET['id'] ?? ''));

if ($source === 'lichess') {
    if (!preg_match('/^[A-Za-z0-9_-]{2,30}$/', $id)) games_out(['ok' => false, 'error' => 'bad_id'], 400);
    $max = max(1, min(100, (int)($_GET['max'] ?? 50)));
    $res = games_lichess($id, $max);
    $res['source'] = 'lichess';
    games_out($res, $res['ok'] ? 200 : 502);
}

// À brancher quand on aura un exemple réel de la page :
//  - 'fide' : https://ratings.fide.com/profile/{id}/calculations (HTML, pas d'API, sans les coups)
//  - 'ffe'  : echecs.asso.fr (ASP.NET, fiche joueur / parties de tournoi)
// Lecture du fichier joueurs/{codeFIDE}.json (alimenté par import_ffe.php) — le dossier n'est pas public
if ($source === 'json') {
    require_once __DIR__ . '/lib_ffe.php';
    $fide = (string)($_GET['fide'] ?? '');
    if (!joueur_valid_id($fide)) games_out(['ok' => false, 'error' => 'bad_id'], 400);
    $d = joueur_load($fide);
    games_out(['ok' => true, 'source' => 'json', 'fide_id' => $fide, 'name' => $d['name'], 'updated' => $d['updated'],
               'tournaments' => $d['tournaments'], 'games' => $d['games']]);
}

if ($source === 'fide' || $source === 'ffe') {
    games_out(['ok' => false, 'error' => 'not_implemented', 'source' => $source], 501);
}

games_out(['ok' => false, 'error' => 'bad_source'], 400);