<?php
/**
 * fide_raw.php : OUTIL DE TEST (à mettre dans php/, à supprimer ensuite).
 * Appelle FIDE depuis TON serveur (qui a accès à Internet) et affiche la réponse brute.
 *
 * Usage dans le navigateur :
 *   fide_raw.php?id=36009172              -> tournois des périodes antérieures (clic "earlier periods")
 *   fide_raw.php?id=36009172&mode=event   -> tournois des 6 derniers mois
 *   fide_raw.php?id=36009172&mode=opp     -> adversaires (JSON)
 */
header('Content-Type: text/plain; charset=utf-8');

$id = preg_replace('/\D/', '', (string)($_GET['id'] ?? ''));
if ($id === '' || strlen($id) > 12) { http_response_code(400); exit("id FIDE invalide\n"); }
$mode = $_GET['mode'] ?? 'calc';

$base = 'https://ratings.fide.com';
$referer = $base . '/profile/' . $id . '/calculations';
$post = null;
if ($mode === 'event')      $url = $base . '/a_calculations.phtml?event=' . $id;
elseif ($mode === 'opp')    $url = $base . '/a_data_opponents.php?a=1&pl=' . $id;
else { $url = $base . '/a_calculations.phtml'; $post = http_build_query(['action' => '2', 'plr_id' => $id]); }

$ch = curl_init($url);
// WAMP/XAMPP : si php/cacert.pem existe, on l'utilise pour vérifier le certificat HTTPS
if (is_file(__DIR__ . '/cacert.pem')) curl_setopt($ch, CURLOPT_CAINFO, __DIR__ . '/cacert.pem');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT        => 20,
    CURLOPT_USERAGENT      => 'Mozilla/5.0 (compatible; KChess2025-club-training)',
    CURLOPT_HTTPHEADER     => [
        'Referer: ' . $referer,
        'Origin: ' . $base,
        'X-Requested-With: XMLHttpRequest',
        'Accept: */*',
    ],
]);
if ($post !== null) { curl_setopt($ch, CURLOPT_POST, true); curl_setopt($ch, CURLOPT_POSTFIELDS, $post); }
$body = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err  = curl_error($ch);
curl_close($ch);

echo "URL    : $url\n";
echo "METHODE: " . ($post !== null ? "POST $post" : 'GET') . "\n";
echo "HTTP   : $code" . ($err ? "  ERREUR: $err" : '') . "\n";
echo "TAILLE : " . strlen((string)$body) . " octets\n";
echo str_repeat('-', 60) . "\n";
echo substr((string)$body, 0, 30000) . "\n";