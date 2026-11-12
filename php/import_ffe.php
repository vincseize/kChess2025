<?php
/**
 * import_ffe.php — page d'import (entraîneur) : ajoute les parties d'un tournoi FFE
 * dans joueurs/{codeFIDE}.json.   Ouvrir : .../php/import_ffe.php
 */
require_once __DIR__ . '/lib_ffe.php';
header('Content-Type: text/html; charset=utf-8');
$h = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');

$dirOk = joueurs_ensure_dir();   // crée php/joueurs/ s'il n'existe pas
$result = null;
// VALEURS DE TEST en dur (à retirer plus tard) : tournoi, code FIDE, nom sur la FFE
$in = [
    'tournoi' => (string)($_GET['tournoi'] ?? '74138'),
    'fide'    => (string)($_GET['fide'] ?? '36009172'),
    'nom'     => (string)($_GET['nom'] ?? 'POTTIER Charles'),
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // protection simple : la requête doit venir de cette même page/ce même site
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== ($_SERVER['SERVER_NAME'] ?? '')) {
        http_response_code(403); exit('Origine refusée.');
    }
    $in = ['tournoi' => (string)($_POST['tournoi'] ?? ''), 'fide' => trim((string)($_POST['fide'] ?? '')), 'nom' => trim((string)($_POST['nom'] ?? ''))];
    $ref = ffe_ref_from_input($in['tournoi']);
    $result = ffe_import($ref, $in['fide'], $in['nom'], true);
}

$errors = [
    'ref_invalide' => 'Numéro ou adresse de tournoi non reconnu.',
    'fide_invalide' => 'Le code FIDE doit contenir uniquement des chiffres (4 à 12).',
    'nom_invalide' => 'Indique le nom tel qu\'écrit sur la FFE, par exemple : POTTIER Charles.',
    'ffe_injoignable' => 'Le site de la FFE ne répond pas (vérifie php/cacert.pem et ta connexion).',
    'tournoi_introuvable' => 'Ce tournoi n\'existe pas sur la FFE.',
    'grille_indisponible' => 'La grille de ce tournoi n\'est pas (encore) publiée.',
    'joueur_absent_du_tournoi' => 'Ce joueur n\'apparaît pas dans ce tournoi. Vérifie l\'orthographe du nom (NOM Prénom).',
    'ecriture_impossible' => 'Impossible d\'écrire le fichier : le dossier php/joueurs doit être modifiable.',
];
$lbl = ['1-0' => 'Victoire', '0-1' => 'Défaite', '1/2-1/2' => 'Nulle', '' => '?'];
?>
<!doctype html>
<html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Import FFE</title>
<style>
 body{font-family:system-ui,sans-serif;max-width:640px;margin:32px auto;padding:0 16px;line-height:1.4}
 label{display:block;margin:12px 0 4px;font-weight:600}
 input{width:100%;padding:9px;box-sizing:border-box;font:inherit}
 button{margin-top:16px;padding:10px 18px;font:inherit;cursor:pointer}
 table{border-collapse:collapse;width:100%;margin-top:12px}
 td,th{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left;font-size:.92rem}
 .ok{background:#e8f6ea;padding:10px 12px;border-radius:6px} .ko{background:#fdeaea;padding:10px 12px;border-radius:6px}
 small{color:#666}
 td.win{background:#e3f4e6;color:#1e6b2f;font-weight:600}
 td.loss{background:#fbe5e5;color:#9b1c1c;font-weight:600}
 td.draw{background:#eef0f3;color:#444;font-weight:600}
</style>
<h2>Importer un tournoi FFE</h2>
<?php if (!$dirOk): ?>
  <p class="ko">Le dossier <code><?= $h(JOUEURS_DIR) ?></code> n'a pas pu être créé ou n'est pas modifiable. Crée-le à la main (clic droit, Nouveau dossier).</p>
<?php else: ?>
  <p><small>Dossier des joueurs : <code><?= $h(JOUEURS_DIR) ?></code> (créé automatiquement)</small></p>
<?php endif; ?>
<form method="post">
  <label for="t">Tournoi : numéro ou adresse FFE</label>
  <input id="t" name="tournoi" value="<?= $h($in['tournoi']) ?>" placeholder="74138" required autofocus>
  <label for="f">Code FIDE du joueur (nom du fichier JSON)</label>
  <input id="f" name="fide" value="<?= $h($in['fide']) ?>" placeholder="36009172" required inputmode="numeric">
  <label for="n">Nom sur la FFE</label>
  <input id="n" name="nom" value="<?= $h($in['nom']) ?>" placeholder="POTTIER Charles" required>
  <button>Importer</button>
</form>

<?php if ($result): ?>
  <?php if (!$result['ok']): ?>
    <p class="ko"><?= $h($errors[$result['error']] ?? $result['error']) ?>
    <?php if (isset($result['players_in_tournament'])): ?><br><small><?= (int)$result['players_in_tournament'] ?> joueurs trouvés dans la grille.</small><?php endif; ?>
    <?php if (isset($result['http'])): ?><br><small>Code HTTP : <?= (int)$result['http'] ?></small><?php endif; ?></p>
  <?php else: $t = $result['tournament']; ?>
    <p class="ok"><b><?= count($result['games']) ?> parties</b> enregistrées dans <code><?= $h($result['file']) ?></code><br>
    <?= $h($t['name']) ?> — <?= $h($t['place']) ?> — <?= $h($t['date']) ?> <small>(<?= $h($t['cadence']) ?>)</small>
    <?php if ($result['byes']): ?><br><small><?= count($result['byes']) ?> ronde(s) sans adversaire (exempt/absent), non comptée(s).</small><?php endif; ?></p>
    <table><tr><th>Rd</th><th>Couleur</th><th>Joueur</th><th>Elo</th><th>Adversaire</th><th>Elo</th><th>Résultat</th></tr>
    <?php foreach ($result['games'] as $g): ?>
      <tr><td><?= (int)$g['round'] ?></td><td><?= $g['color'] === 'w' ? 'Blancs' : 'Noirs' ?></td>
      <td><?= $h($in['nom']) ?></td><td><?= $h($g['my_elo']) ?></td>
      <td><?= $h($g['opponent']) ?></td><td><?= $h($g['opp_elo']) ?></td><td class="<?= ['1-0' => 'win', '0-1' => 'loss', '1/2-1/2' => 'draw'][$g['result']] ?? '' ?>"><?= $h($lbl[$g['result']] ?? '?') ?></td></tr>
    <?php endforeach; ?></table>
  <?php endif; ?>
<?php endif; ?>
</html>