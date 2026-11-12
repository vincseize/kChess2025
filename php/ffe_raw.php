<?php
/**
 * ffe_raw.php : OUTIL DE TEST (à mettre dans php/, à supprimer ensuite).
 * Télécharge UNE page de résultats FFE depuis ton serveur et affiche le HTML brut.
 *
 * Exemples (tournoi 74138) :
 *   ffe_raw.php?ref=74138&action=Ga     -> Grille (tous les joueurs, toutes les rondes)
 *   ffe_raw.php?ref=74138&action=01     -> Ronde 1
 *   ffe_raw.php?ref=74138&action=Ls     -> Liste des joueurs
 *   ffe_raw.php?ref=74138&action=Cl     -> Classement
 *   ffe_raw.php?ref=74138&mode=fiche    -> Fiche du tournoi
 */
// Le champ accepte un numéro (74138) OU une adresse FFE collée (FicheTournoi...Ref=74138 / Resultats...Id/74138/...)
$in = trim((string)($_GET['ref'] ?? ''));
if (preg_match('/Ref=(\d+)/i', $in, $m) || preg_match('#Id/(\d+)/#i', $in, $m)) $in = $m[1];
$ref = preg_replace('/\D/', '', $in);

if ($ref === '' || strlen($ref) > 8) {
    header('Content-Type: text/html; charset=utf-8');
    $msg = ($in !== '') ? '<p style="color:#b00">Numéro ou adresse non reconnu.</p>' : '';
    echo '<!doctype html><meta charset="utf-8"><title>FFE test</title>
<body style="font-family:sans-serif;max-width:560px;margin:40px auto;padding:0 16px">
<h2>Résultats FFE (test)</h2>' . $msg . '
<form method="get">
  <p><label>Numéro du tournoi ou adresse FFE<br>
  <input name="ref" style="width:100%;padding:8px" placeholder="74138" autofocus></label></p>
  <p><label>Page<br>
  <select name="action" style="padding:8px">
    <option value="Ga">Grille (toutes les rondes)</option>
    <option value="Ls">Joueurs</option>
    <option value="Cl">Classement</option>
    <option value="01">Ronde 1</option><option value="02">Ronde 2</option><option value="03">Ronde 3</option>
    <option value="04">Ronde 4</option><option value="05">Ronde 5</option><option value="06">Ronde 6</option>
    <option value="07">Ronde 7</option>
  </select></label></p>
  <p><button style="padding:8px 16px">Afficher</button></p>
</form></body>';
    exit;
}
header('Content-Type: text/plain; charset=utf-8');

$action = (string)($_GET['action'] ?? 'Ga');
if (!preg_match('/^(Ls|Ga|Cl|Fide|Stats|\d{2})$/', $action)) { http_response_code(400); exit("action invalide\n"); }

$base = 'https://www.echecs.asso.fr/';
$url = (($_GET['mode'] ?? '') === 'fiche')
    ? $base . 'FicheTournoi.aspx?Ref=' . $ref
    : $base . 'Resultats.aspx?URL=Tournois/Id/' . $ref . '/' . $ref . '&Action=' . $action;

// cache 1 h pour ne pas solliciter la FFE inutilement
$dir = __DIR__ . '/cache/ffe';
if (!is_dir($dir)) @mkdir($dir, 0775, true);
$cf = $dir . '/raw_' . md5($url) . '.html';
if (is_file($cf) && time() - filemtime($cf) < 3600) {
    $body = file_get_contents($cf); $code = 'cache'; $err = '';
} else {
    $ch = curl_init($url);
    // WAMP/XAMPP : si php/cacert.pem existe, on l'utilise pour vérifier le certificat HTTPS
    if (is_file(__DIR__ . '/cacert.pem')) curl_setopt($ch, CURLOPT_CAINFO, __DIR__ . '/cacert.pem');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_ENCODING       => '',
        CURLOPT_USERAGENT      => 'KChess2025-club-training (suivi des parties des eleves du club)',
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);
    if ($code === 200 && $body) @file_put_contents($cf, $body);
}

$cacert = __DIR__ . '/cacert.pem';
echo "VERSION: ffe_raw v3 (diagnostic certificat)\n";
echo "CACERT : " . (is_file($cacert) ? 'trouve (' . filesize($cacert) . ' octets) -> ' . $cacert : 'ABSENT -> ' . $cacert) . "\n";
echo "PHP/curl: " . PHP_VERSION . ' / ' . (function_exists('curl_version') ? curl_version()['version'] . ' ' . curl_version()['ssl_version'] : 'curl absent') . "\n";
echo "URL    : $url\n";
echo "HTTP   : $code" . ($err ? "  ERREUR: $err" : '') . "\n";
echo "TAILLE : " . strlen((string)$body) . " octets\n";
echo str_repeat('-', 60) . "\n";

// on n'affiche que la zone utile (entre le titre de page et le pied de page)
$b = (string)$body;
$i = strpos($b, 'id="page-titre"');
$j = strpos($b, '<!-- end #page -->');
if ($i !== false && $j !== false && $j > $i) $b = substr($b, $i, $j - $i);
echo substr($b, 0, 60000) . "\n";