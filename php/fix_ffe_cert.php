<?php
/**
 * fix_ffe_cert.php : à lancer UNE FOIS dans le navigateur, puis à supprimer.
 *
 * Problème : echecs.asso.fr n'envoie pas son certificat intermédiaire. Les navigateurs le
 * retrouvent seuls, pas curl ("unable to get local issuer certificate").
 * Ce script lit l'adresse de l'intermédiaire dans le certificat du site, le télécharge,
 * vérifie qu'il fonctionne, puis l'AJOUTE à la fin de php/cacert.pem.
 * La vérification HTTPS reste ACTIVE pour toutes les vraies requêtes.
 */
header('Content-Type: text/plain; charset=utf-8');
$host = 'www.echecs.asso.fr';
$bundle = __DIR__ . '/cacert.pem';
if (!is_file($bundle)) exit("php/cacert.pem est absent. Place-le d'abord.\n");

function pem_from_der(string $der): string {
    return "-----BEGIN CERTIFICATE-----\n" . chunk_split(base64_encode($der), 64, "\n") . "-----END CERTIFICATE-----\n";
}
function name_of(array $n): string { return $n['CN'] ?? ($n['O'] ?? json_encode($n)); }

// 1) Lire le certificat du site (sans échanger de données : on ne fait que le lire)
$ctx = stream_context_create(['ssl' => [
    'capture_peer_cert' => true, 'verify_peer' => false, 'verify_peer_name' => false, 'SNI_enabled' => true,
]]);
$fp = @stream_socket_client("ssl://$host:443", $en, $es, 15, STREAM_CLIENT_CONNECT, $ctx);
if (!$fp) exit("Connexion impossible : $es ($en)\n");
$p = stream_context_get_params($fp);
fclose($fp);
$leaf = $p['options']['ssl']['peer_certificate'] ?? null;
if (!$leaf) exit("Certificat du site introuvable.\n");
$info = openssl_x509_parse($leaf);
echo "Site        : " . name_of($info['subject']) . "\n";
echo "Emis par    : " . name_of($info['issuer']) . "\n";
$aia = $info['extensions']['authorityInfoAccess'] ?? '';
if (!preg_match('~CA Issuers - URI:(\S+)~', $aia, $m)) {
    exit("Aucune adresse d'intermediaire dans le certificat.\nAIA : $aia\n");
}
$url = $m[1];
echo "Intermediaire a telecharger : $url\n";

// 2) Télécharger l'intermédiaire (c'est un certificat public, DER ou PEM)
$ch = curl_init($url);
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => 20,
    CURLOPT_CAINFO => $bundle, CURLOPT_USERAGENT => 'KChess2025-club-training']);
$raw = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
if (!$raw || $code !== 200) exit("Telechargement impossible (HTTP $code).\n");

$pem = (strpos($raw, '-----BEGIN CERTIFICATE-----') !== false) ? $raw : pem_from_der($raw);
$inter = @openssl_x509_read($pem);
if (!$inter) exit("Le fichier telecharge n'est pas un certificat lisible (format inattendu).\n");
$ii = openssl_x509_parse($inter);
echo "Certificat  : " . name_of($ii['subject']) . "  (emis par " . name_of($ii['issuer']) . ")\n";

// 3) Garde-fous : pas un certificat racine auto-signé, et déjà présent ?
if ($ii['subject'] == $ii['issuer']) exit("Refuse : certificat auto-signe (racine). Je n'ajoute pas ca.\n");
openssl_x509_export($inter, $clean);
$body = preg_replace('~-----(BEGIN|END) CERTIFICATE-----|\s~', '', $clean);
$already = strpos(preg_replace('~\s~', '', file_get_contents($bundle)), $body) !== false;
if ($already) {
    echo "\nDeja present dans cacert.pem : l'erreur vient donc d'ailleurs. Colle-moi ce resultat.\n";
    exit;
}

// 4) Tester dans un bundle temporaire AVANT de toucher au vrai fichier
$tmp = sys_get_temp_dir() . '/kchess_bundle_test.pem';
file_put_contents($tmp, file_get_contents($bundle) . "\n" . $clean);
$ch = curl_init("https://$host/");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_NOBODY => true, CURLOPT_TIMEOUT => 20, CURLOPT_CAINFO => $tmp]);
curl_exec($ch);
$err = curl_error($ch); $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
@unlink($tmp);
if ($err) exit("Test echoue avec l'intermediaire : $err\nRien n'a ete modifie.\n");
echo "Test HTTPS  : OK (HTTP $http)\n";

// 5) Ajouter au vrai bundle (sauvegarde d'abord)
@copy($bundle, $bundle . '.bak');
file_put_contents($bundle, "\n# Intermediaire ajoute pour echecs.asso.fr : " . name_of($ii['subject']) . "\n" . $clean, FILE_APPEND);
echo "\nAjoute a php/cacert.pem (sauvegarde : cacert.pem.bak).\n";
echo "Termine. Relance ffe_raw.php. Tu peux supprimer fix_ffe_cert.php.\n";