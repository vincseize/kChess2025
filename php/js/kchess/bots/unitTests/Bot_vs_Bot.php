<?php
/**
 * Bot_vs_Bot.php
 * Emplacement : php/js/kchess/bots/unitTests/Bot_vs_Bot.php
 */
require_once __DIR__ . '/../../../../config-loader.php'; 
$version = getVersion();

// --- SCAN DYNAMIQUE DES BOTS ---
$botDir = __DIR__ . '/../'; 
$availableBots = [];

if (is_dir($botDir)) {
    $files = scandir($botDir);
    foreach ($files as $file) {
        // On ne scanne que les fichiers Level_X.js
        if (preg_match('/Level_(\d+)\.js$/', $file, $matches)) {
            $level = (int)$matches[1];
            $availableBots[] = [
                'level' => $level,
                'name' => "LEVEL " . $level,
                'file' => $file
            ];
        }
    }
}
usort($availableBots, function($a, $b) { return $a['level'] - $b['level']; });

if (empty($availableBots)) {
    $availableBots[] = ['level' => 1, 'name' => 'LEVEL 1', 'file' => 'Level_1.js'];
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>🧪 Stress Test Bot Arena</title>
    <link rel="stylesheet" href="css/stress-test.css?v=<?php echo $version; ?>">
</head>
<body>

<script>
    window.PIECE_IMAGE_PATH = '/__kChess2025/php/img/chesspieces/wikipedia/';
    window.appConfig = { 
        piece_path: window.PIECE_IMAGE_PATH, 
        debug: { console_log: false } 
    };
</script>

    <h2>🧪 Stress Test : <span style="color: #6e7681; font-weight: normal;">Bot Arena</span></h2>

    <div id="sandbox-ui" style="display: none;">
        <div id="chessBoard"></div>
    </div>

    <div class="test-container">
        <div class="log-panel">
            <div class="log-header">
                <span>CONSOLE DE SIMULATION</span>
                <span id="game-id-badge">IDLE</span>
            </div>
            <div id="log-content"></div>
        </div>

        <div class="side-panel">
            <div class="stat-card" style="border-top: 4px solid var(--accent-blue);">
                <div class="bot-setup-grid">
                    <div class="config-group">
                        <label>Blancs</label>
                        <select id="selectBotWhite">
                            <?php foreach ($availableBots as $bot): ?>
                                <option value="L<?php echo $bot['level']; ?>" <?php echo ($bot['level'] == 3) ? 'selected' : ''; ?>>
                                    <?php echo $bot['name']; ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="config-group">
                        <label>Noirs</label>
                        <select id="selectBotBlack">
                            <?php foreach ($availableBots as $bot): ?>
                                <option value="L<?php echo $bot['level']; ?>" <?php echo ($bot['level'] == 2) ? 'selected' : ''; ?>>
                                    <?php echo $bot['name']; ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>

                <div class="random-opt">
                    <div>
                        <input type="checkbox" id="checkRandomColors">
                        <label for="checkRandomColors"> Aléatoire</label>
                    </div>
                    <div>
                        <input type="checkbox" id="checkShowDraws">
                        <label for="checkShowDraws"> Afficher nulles</label>
                    </div>
                    <div>
                        <input type="checkbox" id="checkShowStalemates" checked>
                        <label for="checkShowStalemates"> Afficher pats</label>
                    </div>
                </div>

                <div class="config-group">
                    <label>Nombre de parties</label>
                    <input type="text" id="inputMaxGames" list="listGames" value="200" inputmode="numeric" 
                           onfocus="this.oldValue = this.value; this.value = '';" 
                           onblur="if(this.value == '') { this.value = this.oldValue; }">
                    <datalist id="listGames">
                        <option value="200"><option value="500"><option value="1000">
                        <option value="2000"><option value="5000"><option value="10000">
                    </datalist>
                </div>

                <div class="config-group">
                    <label>Coups max</label>
                    <input type="text" id="inputMaxMoves" list="listMoves" value="200" inputmode="numeric" 
                           onfocus="this.oldValue = this.value; this.value = '';" 
                           onblur="if(this.value == '') { this.value = this.oldValue; }">
                    <datalist id="listMoves">
                        <option value="200"><option value="300"><option value="400">
                    </datalist>
                </div>

                <div class="progress-container"><div id="progress-bar"></div></div>
            </div>

            <div class="stats-mini-grid">
                <div class="stat-card-mini">
                    <span class="stat-label">Terminées</span>
                    <span id="count" class="stat-value-mini">0</span>
                </div>
                <div class="stat-card-mini error-border">
                    <span class="stat-label">Erreurs</span>
                    <span id="errors" class="stat-value-mini error-text">0</span>
                </div>
            </div>

            <button id="startBtn" class="btn-test">START ARENA TEST</button>

            <div class="actions-container">
                <div class="actions-row-full">
                    <button id="copyLogBtn" class="btn-secondary">LOGS</button>
                    <button id="copyFenBtn" class="btn-secondary">FENS</button>
                    <button id="copyStatsBtn" class="btn-secondary">STATS</button>
                </div>
                <button id="clearJsonBtn" class="btn-secondary btn-danger">CLEAR SERVER STORAGE</button>
            </div>
        </div>
    </div>

    <div id="stats-dashboard">
        <div class="dash-item">
            <span class="dash-label">Victoires Blancs</span>
            <span id="dash-win-w" class="dash-value win-w">0</span>
        </div>
        <div class="dash-item">
            <span class="dash-label">Victoires Noirs</span>
            <span id="dash-win-b" class="dash-value win-b">0</span>
        </div>
        <div class="dash-item">
            <span class="dash-label">Nulles</span>
            <span id="dash-draws" class="dash-value win-d">0</span>
        </div>
        <div class="dash-item">
            <span class="dash-label">Pats</span>
            <span id="dash-stalemates" class="dash-value" style="color: var(--accent-yellow);">0</span>
        </div>
        <div class="dash-item dash-sep">
            <span class="dash-label">Total Coups</span>
            <span id="dash-moves" class="dash-value" style="color: #aff5b4;">0</span>
        </div>
        
        <div class="dash-item dash-sep" style="min-width: 280px;">
            <span class="dash-label">Win Ratio (W / D / B)</span>
            <div class="ratio-bar-wrapper">
                <div id="badge-w" class="ratio-badge badge-white">0%</div>
                <div id="dash-ratio-container">
                    <div id="ratio-w"></div>
                    <div id="ratio-d"><span id="ratio-d-text">0%</span></div>
                    <div id="ratio-b"></div>
                </div>
                <div id="badge-b" class="ratio-badge badge-black">0%</div>
            </div>
        </div>

        <div class="dash-item dash-sep">
            <span class="dash-label">Ratio Victoires (W / B)</span>
            <span id="dash-pure-ratio" class="dash-value" style="color: #58a6ff;">0% / 0%</span>
        </div>
    </div>

    <?php 
    ob_start();
    include __DIR__ . '/../../../../engine-scripts.php'; 
    $engineScripts = ob_get_clean();
    echo str_replace('src="js/', 'src="../../../../js/', $engineScripts);
    ?>

    <script src="../BoardAnalyzer.js?v=<?php echo $version; ?>"></script>
    <script src="../BotCore.js?v=<?php echo $version; ?>"></script>

    <?php foreach ($availableBots as $bot): ?>
        <script src="../<?php echo $bot['file']; ?>?v=<?php echo $version; ?>"></script>
    <?php endforeach; ?>

    <script src="js/ArenaAnalyst.js?v=<?php echo $version; ?>"></script>
    <script src="js/stress-test-bot.js?v=<?php echo $version; ?>"></script>

</body>
</html>