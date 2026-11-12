<?php
/**
 * lib_ffe.php — import des parties d'un joueur depuis les pages de résultats de la FFE
 * et stockage dans joueurs/{codeFIDE}.json  (un fichier par joueur).
 *
 * Sources lues (2 requêtes par tournoi, cache 1 h) :
 *   FicheTournoi.aspx?Ref=N                                  -> nom, lieu, dates, cadence
 *   Resultats.aspx?URL=Tournois/Id/N/N&Action=Ga  (Grille)   -> toutes les rondes de tous les joueurs
 */
if (!defined('JOUEURS_DIR')) define('JOUEURS_DIR', __DIR__ . '/joueurs');
if (!defined('FFE_CACHE_DIR')) define('FFE_CACHE_DIR', __DIR__ . '/cache/ffe');
const FFE_BASE = 'https://www.echecs.asso.fr/';
const FFE_UA = 'KChess2025-club-training (suivi des parties des eleves du club)';

// ───────────────────────── réseau ─────────────────────────
function ffe_http(string $url, int $ttl = 3600): array {
    if (!is_dir(FFE_CACHE_DIR)) @mkdir(FFE_CACHE_DIR, 0775, true);
    $cf = FFE_CACHE_DIR . '/' . md5($url) . '.html';
    if ($ttl > 0 && is_file($cf) && time() - filemtime($cf) < $ttl) return [200, (string)file_get_contents($cf)];

    $ch = curl_init($url);
    if (is_file(__DIR__ . '/cacert.pem')) curl_setopt($ch, CURLOPT_CAINFO, __DIR__ . '/cacert.pem');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => 25,
        CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_ENCODING => '', CURLOPT_USERAGENT => FFE_UA,
    ]);
    $body = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $body = $body === false ? '' : (string)$body;
    if ($code === 200 && $body !== '') @file_put_contents($cf, $body);
    elseif (is_file($cf)) return [200, (string)file_get_contents($cf)];   // repli : cache périmé
    return [$code, $body];
}

// ───────────────────────── utilitaires ─────────────────────────
function ffe_clean(string $s): string {
    $s = html_entity_decode($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $s = str_replace("\xC2\xA0", ' ', $s);
    return trim(preg_replace('/\s+/u', ' ', $s));
}
function ffe_norm(string $s): string {
    $s = ffe_clean($s);
    $t = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
    if ($t !== false && $t !== '') $s = $t;
    return strtoupper(trim(preg_replace('/[^A-Za-z0-9]+/', ' ', $s)));
}
function ffe_ref_from_input(string $in): string {
    $in = trim($in);
    if (preg_match('/Ref=(\d+)/i', $in, $m) || preg_match('#Id/(\d+)/#i', $in, $m)) return $m[1];
    return preg_replace('/\D/', '', $in);
}
function ffe_date_fr(string $s): string {
    static $mois = ['janvier'=>1,'fevrier'=>2,'février'=>2,'mars'=>3,'avril'=>4,'mai'=>5,'juin'=>6,'juillet'=>7,
        'aout'=>8,'août'=>8,'septembre'=>9,'octobre'=>10,'novembre'=>11,'decembre'=>12,'décembre'=>12];
    if (preg_match('/(\d{1,2})\s+([[:alpha:]éûèô]+)\s+(\d{4})/iu', $s, $m)) {
        $mo = $mois[mb_strtolower($m[2], 'UTF-8')] ?? 0;
        if ($mo) return sprintf('%04d-%02d-%02d', $m[3], $mo, $m[1]);
    }
    return '';
}

// ───────────────────────── FicheTournoi ─────────────────────────
function ffe_parse_fiche(string $html, string $ref): array {
    $get = function (string $id) use ($html): string {
        return preg_match('~id="ctl00_ContentPlaceHolderMain_' . $id . '"[^>]*>(.*?)</span>~s', $html, $m)
            ? ffe_clean(strip_tags($m[1])) : '';
    };
    $dates = $get('LabelDates');
    $parts = preg_split('/\s+-\s+/', $dates);
    $start = ffe_date_fr($parts[0] ?? '');
    $end = ffe_date_fr($parts[1] ?? '') ?: $start;
    return [
        'ref'       => (int)$ref,
        'name'      => $get('LabelNom'),
        'place'     => $get('LabelLieu'),
        'date'      => $start,
        'date_end'  => $end,
        'rounds'    => (int)$get('LabelNbrRondes'),
        'cadence'   => $get('LabelCadence'),
        'organizer' => $get('LabelOrganisateur'),
        'url'       => FFE_BASE . 'FicheTournoi.aspx?Ref=' . $ref,
    ];
}

// ───────────────────────── Grille américaine ─────────────────────────
/** Renvoie ['players'=>nb, 'found'=>bool, 'my_elo'=>int, 'rank'=>int, 'games'=>[...], 'byes'=>[...]] */
function ffe_parse_grille(string $html, string $playerName): array {
    $dom = new DOMDocument();
    $prev = libxml_use_internal_errors(true);
    $dom->loadHTML('<?xml encoding="UTF-8">' . $html);
    libxml_clear_errors(); libxml_use_internal_errors($prev);
    $xp = new DOMXPath($dom);

    $boxes = $xp->query("//div[contains(concat(' ', normalize-space(@class), ' '), ' papi_joueur_box ')]");
    $target = ffe_norm($playerName);
    $out = ['players' => $boxes->length, 'found' => false, 'my_elo' => 0, 'rank' => 0, 'games' => [], 'byes' => []];

    foreach ($boxes as $box) {
        $b = $xp->query('./b', $box)->item(0);
        if (!$b || ffe_norm($b->textContent) !== $target) continue;
        $out['found'] = true;

        $rows = $xp->query('.//table//tr', $box);
        foreach ($rows as $i => $tr) {
            $td = [];
            foreach ($xp->query('./td', $tr) as $c) $td[] = ffe_clean($c->textContent);
            if ($i === 0) {                                  // en-tête du joueur
                $out['rank']   = (int)($td[1] ?? 0);
                $out['my_elo'] = (int)preg_replace('/\D/', '', $td[4] ?? '');
                continue;
            }
            if (count($td) < 7 || !ctype_digit($td[0])) continue;
            $round = (int)$td[0];
            $color = strtoupper($td[1]) === 'B' ? 'w' : (strtoupper($td[1]) === 'N' ? 'b' : '');
            $raw   = $td[2];
            $oppRank = (int)$td[3];
            $oppName = $td[5] ?? '';
            if ($oppRank <= 0 || $oppName === '') { $out['byes'][] = ['round' => $round, 'raw' => $raw]; continue; }

            $r = str_replace(',', '.', $raw);
            if ($r === '1' || $r === '+') $res = '1-0';
            elseif ($r === '0' || $r === '-') $res = '0-1';
            elseif ($r === '0.5' || $r === '½' || $r === '=') $res = '1/2-1/2';
            else $res = '';                                   // résultat inconnu : on garde la ligne

            $out['games'][] = [
                'round'    => $round,
                'color'    => $color,
                'result'   => $res,
                'raw'      => $raw,
                'opponent' => $oppName,
                'opp_rank' => $oppRank,
                'opp_elo'  => (int)preg_replace('/\D/', '', $td[6] ?? ''),
                'my_elo'   => $out['my_elo'],
            ];
        }
        break;
    }
    return $out;
}

// ───────────────────────── fichier joueurs/{fide}.json ─────────────────────────
function joueur_valid_id(string $id): bool { return (bool)preg_match('/^\d{4,12}$/', $id); }
function joueur_path(string $fide): string { return JOUEURS_DIR . '/' . $fide . '.json'; }

function joueur_load(string $fide): array {
    $f = joueur_path($fide);
    $d = is_file($f) ? json_decode((string)file_get_contents($f), true) : null;
    if (!is_array($d)) $d = [];
    return $d + ['fide_id' => $fide, 'name' => '', 'updated' => '', 'tournaments' => [], 'games' => []];
}

/** Crée le dossier joueurs/ s'il n'existe pas (+ .htaccess qui interdit la lecture directe). Renvoie true s'il est utilisable. */
function joueurs_ensure_dir(): bool {
    if (!is_dir(JOUEURS_DIR)) @mkdir(JOUEURS_DIR, 0775, true);
    if (!is_dir(JOUEURS_DIR)) return false;
    $ht = JOUEURS_DIR . '/.htaccess';
    if (!is_file($ht)) @file_put_contents($ht, "Require all denied\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n");
    return is_writable(JOUEURS_DIR);
}

function joueur_save(string $fide, array $d): bool {
    if (!joueurs_ensure_dir()) return false;
    $d['updated'] = date('c');
    $json = json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    return $json !== false && file_put_contents(joueur_path($fide), $json, LOCK_EX) !== false;
}

// ───────────────────────── import d'un tournoi ─────────────────────────
function ffe_import(string $ref, string $fide, string $name, bool $save = true): array {
    if (!preg_match('/^\d{1,8}$/', $ref)) return ['ok' => false, 'error' => 'ref_invalide'];
    if (!joueur_valid_id($fide))          return ['ok' => false, 'error' => 'fide_invalide'];
    $name = trim($name);
    if ($name === '' || mb_strlen($name) > 80) return ['ok' => false, 'error' => 'nom_invalide'];

    [$c1, $fiche] = ffe_http(FFE_BASE . 'FicheTournoi.aspx?Ref=' . $ref);
    if ($c1 !== 200 || $fiche === '') return ['ok' => false, 'error' => 'ffe_injoignable', 'http' => $c1];
    $t = ffe_parse_fiche($fiche, $ref);
    if ($t['name'] === '') return ['ok' => false, 'error' => 'tournoi_introuvable'];

    usleep(600000);   // on ménage le site de la FFE
    [$c2, $grille] = ffe_http(FFE_BASE . 'Resultats.aspx?URL=Tournois/Id/' . $ref . '/' . $ref . '&Action=Ga');
    if ($c2 !== 200 || $grille === '') return ['ok' => false, 'error' => 'grille_indisponible', 'http' => $c2, 'tournament' => $t];

    $g = ffe_parse_grille($grille, $name);
    if (!$g['found']) return ['ok' => false, 'error' => 'joueur_absent_du_tournoi', 'players_in_tournament' => $g['players'], 'tournament' => $t];

    $games = [];
    foreach ($g['games'] as $x) {
        $games[] = [
            'source'         => 'ffe',
            'id'             => 'ffe-' . $ref . '-r' . $x['round'],
            'tournament_ref' => (int)$ref,
            'url'            => $t['url'],
            'date'           => $t['date'],
            'round'          => $x['round'],
            'opponent'       => $x['opponent'],
            'my_elo'         => $x['my_elo'] ?: '',
            'opp_elo'        => $x['opp_elo'] ?: '',
            'result'         => $x['result'],
            'color'          => $x['color'],
            'tournament'     => $t['name'],
            'place'          => $t['place'],
            'cadence'        => $t['cadence'],
            'pgn'            => '',
        ];
    }
    $t['games_count'] = count($games);
    $t['byes'] = count($g['byes']);
    $t['player_rank'] = $g['rank'];

    $d = joueur_load($fide);
    if ($d['name'] === '') $d['name'] = $name;
    $d['games'] = array_values(array_filter($d['games'], fn($x) => !(($x['source'] ?? '') === 'ffe' && (int)($x['tournament_ref'] ?? 0) === (int)$ref)));
    $d['tournaments'] = array_values(array_filter($d['tournaments'], fn($x) => !(($x['source'] ?? 'ffe') === 'ffe' && (int)($x['ref'] ?? 0) === (int)$ref)));
    $d['games'] = array_merge($d['games'], $games);
    $d['tournaments'][] = ['source' => 'ffe'] + $t;
    usort($d['games'], fn($a, $b) => strcmp((string)($b['date'] ?? ''), (string)($a['date'] ?? '')) ?: ((int)($b['round'] ?? 0) <=> (int)($a['round'] ?? 0)));
    usort($d['tournaments'], fn($a, $b) => strcmp((string)($b['date'] ?? ''), (string)($a['date'] ?? '')));

    if ($save && !joueur_save($fide, $d)) return ['ok' => false, 'error' => 'ecriture_impossible', 'path' => joueur_path($fide)];
    return ['ok' => true, 'saved' => $save, 'tournament' => $t, 'games' => $games, 'byes' => $g['byes'], 'file' => 'joueurs/' . $fide . '.json'];
}