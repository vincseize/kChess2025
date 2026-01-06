<?php
// js/kchess/bots/unitTests/Bot_vs_Bot.php
require_once __DIR__ . '/../../../../config-loader.php'; 
$version = getVersion();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>🧪 Stress Test Bot Arena</title>
    <link rel="stylesheet" href="css/stress-test.css?v=<?php echo $version; ?>">
    <style>
        .config-group { margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px; }
        .config-group label { display: block; font-size: 11px; color: #8b949e; margin-bottom: 5px; text-transform: uppercase; font-weight: 600; }
        .config-group input, .config-group select { 
            width: 100%; background: #0d1117; border: 1px solid #30363d; color: #58a6ff; 
            padding: 8px; border-radius: 4px; font-weight: bold; outline: none;
        }
        .config-group select { color: #d29922; cursor: pointer; appearance: none; }
        .config-group select:focus { border-color: #58a6ff; }
        .bot-setup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        .progress-container { margin-top: 10px; height: 4px; background: #21262d; border-radius: 2px; display: none; }
        #progress-bar { width: 0%; height: 100%; background: #238636; transition: width 0.3s; }
        .actions-group { display: flex; gap: 5px; margin-top: 10px; }
        .btn-secondary { background: #21262d; font-size: 10px !important; flex: 1; height: 35px; cursor: pointer; border: 1px solid #30363d; color: #c9d1d9; border-radius: 4px; }
        .btn-secondary:hover { background: #30363d; }
        #game-id-badge { font-family: monospace; padding: 2px 6px; background: #21262d; border-radius: 10px; font-size: 10px; }
    </style>
</head>
<body>

<script>
    window.PIECE_IMAGE_PATH = window.location.origin + '/__kChess2025/php/img/chesspieces/wikipedia/';
    window.appConfig = { piece_path: window.PIECE_IMAGE_PATH, debug: { console_log: false } };
</script>

    <h2>🧪 Stress Test : <span style="color: #6e7681; font-weight: normal;">Bot Arena</span></h2>

    <div id="sandbox-ui" style="display: none;">
        <div id="topPlayerLabel"></div><div id="bottomPlayerLabel"></div>
        <div id="chessBoard"></div><div id="moveHistory"></div>
        <div id="currentPlayer"></div><div id="botIndicatorContainer"></div>
        <button id="newGameMobile"></button><button id="flipBoardMobile"></button>
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
            <div class="stat-card" style="border-top: 4px solid #58a6ff">
                <span class="stat-label">Configuration</span>
                
                <div class="bot-setup-grid">
                    <div class="config-group">
                        <label>Blancs</label>
                        <select id="selectBotWhite">
                            <option value="L1">LEVEL 1</option>
                            <option value="L2">LEVEL 2</option>
                        </select>
                    </div>
                    <div class="config-group">
                        <label>Noirs</label>
                        <select id="selectBotBlack">
                            <option value="L1">LEVEL 1</option>
                            <option value="L2">LEVEL 2</option>
                        </select>
                    </div>
                </div>

                <div class="config-group">
                    <label>Nombre de parties</label>
                    <input type="number" id="inputMaxGames" value="50" min="1">
                </div>
                <div class="config-group">
                    <label>Coups max / partie</label>
                    <input type="number" id="inputMaxMoves" value="100" min="1">
                </div>
                
                <div class="progress-container" id="p-container" style="display:block;">
                    <div id="progress-bar"></div>
                </div>
            </div>

            <div class="stat-card">
                <span class="stat-label">Terminées</span>
                <span id="count" class="stat-value">0</span>
            </div>

            <div class="stat-card" style="border-top: 4px solid #f85149">
                <span class="stat-label">Erreurs</span>
                <span id="errors" class="stat-value" style="color: #f85149">0</span>
            </div>

            <button id="startBtn" class="btn-test">START ARENA TEST</button>

            <div class="actions-group">
                <button id="copyLogBtn" class="btn-secondary">COPIE LOGS</button>
                <button id="copyFenBtn" class="btn-secondary">COPIE FENS</button>
                <button id="clearJsonBtn" class="btn-secondary" style="color: #f85149">CLEAR SERVER</button>
            </div>
        </div>
    </div>

    <?php 
    ob_start();
    include __DIR__ . '/../../../../engine-scripts.php'; 
    $engineScripts = ob_get_clean();
    echo str_replace('src="js/', 'src="../../../../js/', $engineScripts);
    ?>

    <script src="js/stress-test-bot.js?v=<?php echo $version; ?>"></script>
</body>
</html>