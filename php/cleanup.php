<?php
// cleanup.php — supprime les fichiers de test/diagnostic. LOCALHOST uniquement.
// 1) Ouvrir cleanup.php            → simple vérification (rien n'est supprimé)
// 2) Cliquer « Supprimer »         → suppression + contrôle que tout a bien disparu
// Le script se supprime lui-même à la fin.
require_once __DIR__ . '/local-only.php';
if (!kchess_is_local()) { http_response_code(403); exit('Réservé à localhost.'); }
header('Content-Type: text/html; charset=utf-8');

$dir = __DIR__;
$cibles = ['ffe_raw.php', 'fide_raw.php', 'fix_ffe_cert.php', 'fide_games.php', 'get_opponents.py', 'cacert.pem.bak'];
$requis = ['lib_ffe.php', 'import_ffe.php', 'joueurs_api.php', 'games.php', 'cacert.pem', 'local-only.php'];
$h = fn($s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
$go = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && ($_POST['go'] ?? '') === '1';

// Fichiers du projet qui mentionnent encore une cible (hors la cible elle-même et ce script)
$refs = [];
foreach (glob($dir . '/*.php') ?: [] as $f) {
    $b = basename($f);
    if ($b === 'cleanup.php' || in_array($b, $cibles, true)) continue;
    $src = (string)file_get_contents($f);
    foreach ($cibles as $c) if (strpos($src, $c) !== false) $refs[] = "$b mentionne $c";
}

// Fichiers requis manquants → on refuse de supprimer
$manque = array_filter($requis, fn($r) => !is_file("$dir/$r"));
$bloque = $manque ? 'Fichiers requis manquants : ' . implode(', ', $manque) : '';

$rapport = [];
if ($go && !$bloque) {
    foreach ($cibles as $c) {
        $p = "$dir/$c";
        if (!file_exists($p)) { $rapport[$c] = ['—', 'déjà absent']; continue; }
        $ok = @unlink($p);
        clearstatcache(true, $p);
        $rapport[$c] = (!$ok || file_exists($p)) ? ['✗', 'ÉCHEC (droits ?)'] : ['✓', 'supprimé'];
    }
    // contrôle final : les fichiers requis sont toujours là
    foreach ($requis as $r) if (!is_file("$dir/$r")) $rapport["REQUIS $r"] = ['✗', 'DISPARU !'];
    $echecs = array_filter($rapport, fn($x) => $x[0] === '✗');
    if (!$echecs) @unlink(__FILE__);
}
?><!doctype html><meta charset="utf-8"><title>Nettoyage</title>
<style>body{font:15px system-ui;max-width:680px;margin:30px auto;padding:0 14px}td,th{padding:5px 10px;border-bottom:1px solid #ccc;text-align:left}
.ok{color:#1a7f37}.ko{color:#cf222e}button{padding:8px 16px;font-size:15px}</style>
<h1>Nettoyage php/</h1>
<?php if ($bloque): ?><p class="ko"><b><?= $h($bloque) ?></b> — rien n'est supprimé.</p><?php endif; ?>
<table><tr><th>Fichier</th><th>État</th></tr>
<?php foreach ($cibles as $c): ?>
<tr><td><?= $h($c) ?></td><td><?php
  if ($rapport) { [$s,$m] = $rapport[$c]; echo '<span class="' . ($s === '✗' ? 'ko' : 'ok') . '">' . $s . ' ' . $h($m) . '</span>'; }
  else echo file_exists("$dir/$c") ? 'présent' : 'absent'; ?></td></tr>
<?php endforeach; ?></table>

<h3>Contrôles</h3><ul>
<?php foreach ($requis as $r): ?><li class="<?= is_file("$dir/$r") ? 'ok' : 'ko' ?>"><?= is_file("$dir/$r") ? '✓' : '✗' ?> <?= $h($r) ?> (à conserver)</li><?php endforeach; ?>
<?php foreach ($refs as $r): ?><li class="ko">⚠ <?= $h($r) ?></li><?php endforeach; ?>
<?php if (!$refs): ?><li class="ok">✓ aucun autre fichier php/ ne référence les fichiers à supprimer</li><?php endif; ?>
</ul>

<?php if ($go): ?>
  <p><b><?= empty($echecs) && !$bloque ? '✅ Nettoyage terminé et vérifié. cleanup.php s\'est supprimé.' : '❌ Des échecs : corrigez les droits puis relancez.' ?></b></p>
<?php elseif (!$bloque): ?>
  <form method="post"><input type="hidden" name="go" value="1"><button>Supprimer ces fichiers</button></form>
<?php endif; ?>