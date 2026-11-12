<?php
/**
 * joueurs_api.php — API des fichiers joueurs/{codeFIDE}.json pour la page profil.
 *
 *  GET  ?action=list[&q=texte]        joueurs connus (nom ou code FIDE)            (lecture : tous)
 *  GET  ?action=tournois[&q=texte]    tournois connus dans les JSON (nom/lieu/ref) (lecture : tous)
 *  GET  ?action=tournoi&ref=N|URL     fiche FFE d'un tournoi (1 requête FFE, cache 1 h) (localhost)
 *  POST action=save_profile           {fide,name,title,federation,standard,rapid,blitz} crée/maj le JSON (localhost)
 *  POST action=import                 {ref,fide,name} importe un tournoi FFE dans le JSON   (localhost)
 */
require_once __DIR__ . '/local-only.php';
require_once __DIR__ . '/lib_ffe.php';
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function ja_out(array $d, int $code = 200): void {
    http_response_code($code);
    echo json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function ja_local_only(): void {
    if (!kchess_is_local()) ja_out(['ok' => false, 'error' => 'forbidden'], 403);
}
function ja_origin_ok(): bool {
    $o = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($o === '') return true;
    $h = parse_url($o, PHP_URL_HOST);
    return $h !== null && strcasecmp((string)$h, (string)($_SERVER['SERVER_NAME'] ?? '')) === 0
        || strcasecmp((string)$h, preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? ''))) === 0;
}

/** Tous les joueurs connus : [fide => données]. */
function ja_all(): array {
    $out = [];
    foreach (glob(JOUEURS_DIR . '/*.json') ?: [] as $f) {
        $fide = basename($f, '.json');
        if (!joueur_valid_id($fide)) continue;
        $out[$fide] = joueur_load($fide);
    }
    return $out;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$in = [];
if ($method === 'POST') {
    $in = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($in)) ja_out(['ok' => false, 'error' => 'bad_json'], 400);
}
$action = (string)($method === 'POST' ? ($in['action'] ?? '') : ($_GET['action'] ?? ''));
$q = ffe_norm((string)($_GET['q'] ?? ''));

if ($method === 'GET' && $action === 'list') {
    $res = [];
    foreach (ja_all() as $fide => $d) {
        if ($q !== '' && strpos(ffe_norm($d['name']) . ' ' . $fide, $q) === false) continue;
        $res[] = ['fide' => (string)$fide, 'name' => $d['name'], 'games' => count($d['games']),
                  'tournaments' => count($d['tournaments']), 'updated' => $d['updated']];
    }
    ja_out(['ok' => true, 'players' => $res]);
}

if ($method === 'GET' && $action === 'tournois') {
    $map = [];
    foreach (ja_all() as $fide => $d) {
        foreach ($d['tournaments'] as $t) {
            $ref = (string)($t['ref'] ?? '');
            if ($ref === '') continue;
            $hay = ffe_norm(($t['name'] ?? '') . ' ' . ($t['place'] ?? '') . ' ' . $ref . ' ' . ($t['date'] ?? ''));
            if ($q !== '' && strpos($hay, $q) === false) continue;
            if (!isset($map[$ref])) $map[$ref] = $t + ['players' => []];
            $map[$ref]['players'][] = ['fide' => (string)$fide, 'name' => $d['name']];
        }
    }
    $list = array_values($map);
    usort($list, fn($a, $b) => strcmp((string)($b['date'] ?? ''), (string)($a['date'] ?? '')));
    ja_out(['ok' => true, 'tournaments' => $list]);
}

if ($method === 'GET' && $action === 'tournoi') {
    ja_local_only();
    $ref = ffe_ref_from_input((string)($_GET['ref'] ?? ''));
    if (!preg_match('/^\d{1,8}$/', $ref)) ja_out(['ok' => false, 'error' => 'ref_invalide'], 400);
    [$c, $html] = ffe_http(FFE_BASE . 'FicheTournoi.aspx?Ref=' . $ref);
    if ($c !== 200 || $html === '') ja_out(['ok' => false, 'error' => 'ffe_injoignable', 'http' => $c], 502);
    $t = ffe_parse_fiche($html, $ref);
    if ($t['name'] === '') ja_out(['ok' => false, 'error' => 'tournoi_introuvable'], 404);
    ja_out(['ok' => true, 'tournament' => $t]);
}

if ($method === 'POST' && $action === 'save_profile') {
    ja_local_only();
    if (!ja_origin_ok()) ja_out(['ok' => false, 'error' => 'origin'], 403);
    $fide = preg_replace('/\D/', '', (string)($in['fide'] ?? ''));
    $name = trim(preg_replace('/\s+/u', ' ', (string)($in['name'] ?? '')));
    if (!joueur_valid_id($fide)) ja_out(['ok' => false, 'error' => 'fide_invalide'], 400);
    if ($name === '' || mb_strlen($name) > 80) ja_out(['ok' => false, 'error' => 'nom_invalide'], 400);
    $d = joueur_load($fide);
    $created = !is_file(joueur_path($fide));
    $d['name'] = $name;
    $meta = [];
    foreach (['title', 'federation'] as $k) $meta[$k] = mb_substr(trim((string)($in[$k] ?? '')), 0, 20);
    foreach (['standard', 'rapid', 'blitz'] as $k) $meta[$k] = is_numeric($in[$k] ?? null) ? (int)$in[$k] : null;
    $d['profile'] = ['identity' => $meta] + (isset($d['profile']) && is_array($d['profile']) ? $d['profile'] : []);
    if (!joueur_save($fide, $d)) ja_out(['ok' => false, 'error' => 'ecriture_impossible'], 500);
    ja_out(['ok' => true, 'created' => $created, 'fide' => $fide, 'games' => count($d['games']), 'tournaments' => count($d['tournaments'])]);
}

if ($method === 'POST' && $action === 'import') {
    ja_local_only();
    if (!ja_origin_ok()) ja_out(['ok' => false, 'error' => 'origin'], 403);
    $ref = ffe_ref_from_input((string)($in['ref'] ?? ''));
    $fide = preg_replace('/\D/', '', (string)($in['fide'] ?? ''));
    $name = (string)($in['name'] ?? '');
    $r = ffe_import($ref, $fide, $name, true);
    ja_out($r, $r['ok'] ? 200 : 422);
}

ja_out(['ok' => false, 'error' => 'bad_action'], 400);