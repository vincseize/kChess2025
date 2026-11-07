<?php
/**
 * Bot_Process.php  —  Laboratoire de process des bots
 * Emplacement : php/js/kchess/bots/unitTests/Bot_Process.php
 *
 * - Diagramme du pipeline de chaque Level (lu depuis le bot lui-même : getter PIPELINE)
 * - Matrice "quel process dans quel level"
 * - Générateur de Level factice (config LadderBot + nouveaux process) exporté en Level_NN.js
 */
require_once __DIR__ . '/../../../../config-loader.php';
$version = getVersion();

// --- SCAN DYNAMIQUE DES BOTS (même logique que Bot_vs_Bot.php) ---
$botDir = __DIR__ . '/../';
$availableBots = [];
foreach (scandir($botDir) as $file) {
    if (preg_match('/^Level_(\d+)\.js$/', $file, $m)) {
        $availableBots[] = ['level' => (int)$m[1], 'file' => $file];
    }
}
usort($availableBots, function ($a, $b) { return $a['level'] - $b['level']; });
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧭 Process des Bots</title>
    <link rel="icon" type="image/svg+xml" href="../../../../img/icon.svg">
    <link rel="stylesheet" href="css/process-lab.css?v=<?php echo $version; ?>">
</head>
<body>

    <header class="pl-header">
        <h2>🧭 Process des Bots <span class="pl-sub">schéma de décision par level</span></h2>
        <nav class="pl-tabs" role="tablist">
            <button class="pl-tab active" data-tab="diagrams" role="tab">Diagrammes</button>
            <button class="pl-tab" data-tab="matrix" role="tab">Matrice</button>
            <button class="pl-tab" data-tab="builder" role="tab">Level factice</button>
        </nav>
        <a class="pl-link" href="Bot_vs_Bot.php">← Arène</a>
    </header>

    <div class="pl-legend" id="pl-legend"></div>

    <main class="pl-main">
        <section id="tab-diagrams" class="pl-view active">
            <div id="diagrams" class="pl-columns"></div>
        </section>

        <section id="tab-matrix" class="pl-view">
            <div class="pl-scroll"><table id="matrix" class="pl-matrix"></table></div>
        </section>

        <section id="tab-builder" class="pl-view">
            <div class="pl-builder">
                <div class="pl-form" id="builder-form"></div>
                <div class="pl-preview">
                    <h3>Aperçu du pipeline</h3>
                    <div id="builder-preview" class="pl-columns"></div>
                    <div id="builder-diff" class="pl-note"></div>
                </div>
                <div class="pl-export">
                    <h3>Export</h3>
                    <p class="pl-note">
                        Dépose le fichier dans <code>php/js/kchess/bots/</code> : l'arène le détecte
                        toute seule (<code>Level_NN.js</code>). Il apparaîtra aussi dans le menu du jeu :
                        supprime-le après le test.
                    </p>
                    <div class="pl-actions">
                        <button id="btn-copy" class="pl-btn">Copier</button>
                        <button id="btn-download" class="pl-btn pl-btn-primary">Télécharger Level_NN.js</button>
                        <button id="btn-reset" class="pl-btn pl-btn-danger">Réinitialiser</button>
                    </div>
                    <pre id="builder-code" class="pl-code"></pre>
                </div>
            </div>
        </section>
    </main>

    <aside id="pl-detail" class="pl-detail" hidden></aside>

    <script>
        window.PROCESS_LAB_LEVELS = <?php echo json_encode(array_column($availableBots, 'level')); ?>;
    </script>

    <!-- Uniquement ce qu'il faut pour instancier les bots (pas de moteur d'échecs) -->
    <script src="../game_fonctions.js?v=<?php echo $version; ?>"></script>
    <script src="../BotCore.js?v=<?php echo $version; ?>"></script>
    <script src="../LadderBot.js?v=<?php echo $version; ?>"></script>
    <?php foreach ($availableBots as $bot): ?>
        <script src="../<?php echo $bot['file']; ?>?v=<?php echo $version; ?>"></script>
    <?php endforeach; ?>

    <script src="js/process-lab.js?v=<?php echo $version; ?>"></script>
</body>
</html>
