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
    <style>
        .config-group { margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px; }
        .config-group label { display: block; font-size: 11px; color: #8b949e; margin-bottom: 5px; text-transform: uppercase; font-weight: 600; }
        
        .config-group input, .config-group select { 
            width: 100%; background: #0d1117; border: 1px solid #30363d; color: #58a6ff; 
            padding: 10px; border-radius: 4px; font-weight: bold; outline: none;
            box-sizing: border-box;
        }

        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }

        .config-group select { color: #d29922; cursor: pointer; appearance: none; }
        .bot-setup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        
        .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; }
        
        .progress-container { margin-top: 10px; height: 4px; background: #21262d; border-radius: 2px; }
        #progress-bar { width: 0%; height: 100%; background: #238636; transition: width 0.3s; }

        .actions-container { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
        .actions-row { display: flex; gap: 5px; }
        .btn-secondary { 
            background: #21262d; font-size: 10px !important; flex: 1; height: 35px; 
            cursor: pointer; border: 1px solid #30363d; color: #c9d1d9; border-radius: 4px; 
        }
        .btn-secondary:hover { background: #30363d; }
        .btn-danger { color: #f85149 !important; border-color: rgba(248, 81, 73, 0.3) !important; width: 100%; }
        .btn-danger:hover { background: rgba(248, 81, 73, 0.1) !important; }

        #game-id-badge { font-family: monospace; padding: 2px 6px; background: #21262d; border-radius: 10px; font-size: 10px; }
        
        .random-opt { 
            display: flex; align-items: center; gap: 10px; padding: 10px; 
            background: rgba(88, 166, 255, 0.05); border-radius: 4px; margin-bottom: 15px;
            border: 1px solid rgba(88, 166, 255, 0.1);
        }
        .random-opt input { width: 16px; height: 16px; cursor: pointer; margin: 0; }
        .random-opt label { font-size: 11px; color: #58a6ff; font-weight: bold; cursor: pointer; margin: 0; text-transform: uppercase; }

        .stat-card { padding: 8px 15px !important; margin-bottom: 0px !important; min-height: auto !important; }
        .stat-value { font-size: 1.2em !important; line-height: 1 !important; }

        /* --- DASHBOARD BOTTOM --- */
        #stats-dashboard {
            position: fixed; bottom: 0; left: 0; right: 0;
            background: #161b22; border-top: 1px solid #30363d;
            padding: 12px 20px; display: grid;
            /* Passage à 6 colonnes pour inclure le ratio pur */
            grid-template-columns: repeat(4, 1fr) 1.2fr 1.8fr; gap: 15px;
            z-index: 100; box-shadow: 0 -5px 15px rgba(0,0,0,0.3);
            align-items: center;
        }
        .dash-item { display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .dash-label { font-size: 10px; color: #8b949e; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; text-align: center; }
        .dash-value { font-family: monospace; font-size: 20px; font-weight: bold; color: #c9d1d9; }
        .win-w { color: #ffffff; } 
        .win-b { color: #58a6ff; } 
        .win-d { color: #8b949e; }
        body { padding-bottom: 120px; }
    </style>
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
            <div class="stat-card" style="border-top: 4px solid #58a6ff; margin-bottom: 8px !important;">
                <div class="bot-setup-grid">
                    <div class="config-group">
                        <label>Blancs</label>
                        <select id="selectBotWhite">
                            <?php foreach ($availableBots as $bot): ?>
                                <option value="L<?php echo $bot['level']; ?>" <?php echo ($bot['level'] == 1) ? 'selected' : ''; ?>>
                                    <?php echo $bot['name']; ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="config-group">
                        <label>Noirs</label>
                        <select id="selectBotBlack">
                            <?php foreach ($availableBots as $bot): ?>
                                <option value="L<?php echo $bot['level']; ?>" <?php echo ($bot['level'] == 1) ? 'selected' : ''; ?>>
                                    <?php echo $bot['name']; ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>

                <div class="random-opt">
                    <input type="checkbox" id="checkRandomColors" checked>
                    <label for="checkRandomColors"> Couleur aléatoire</label>
                </div>

                <div class="config-group">
                    <label>Nombre de parties</label>
                    <input type="text" id="inputMaxGames" list="listGames" value="200" inputmode="numeric" 
                           onfocus="this.oldValue = this.value; this.value = '';" 
                           onblur="if(this.value == '') { this.value = this.oldValue; }">
                    <datalist id="listGames">
                        <option value="200"><option value="500"><option value="1000">
                    </datalist>
                </div>

                <div class="config-group">
                    <label>Coups max</label>
                    <input type="text" id="inputMaxMoves" list="listMoves" value="200" inputmode="numeric" 
                           onfocus="this.oldValue = this.value; this.value = '';" 
                           onblur="if(this.value == '') { this.value = this.oldValue; }">
                    <datalist id="listMoves">
                        <option value="200"><option value="500"><option value="1000">
                    </datalist>
                </div>

                <div class="progress-container"><div id="progress-bar"></div></div>
            </div>

            <div class="stats-row">
                <div class="stat-card">
                    <span class="stat-label">Terminées</span>
                    <span id="count" class="stat-value">0</span>
                </div>

                <div class="stat-card" style="border-top: 4px solid #f85149">
                    <span class="stat-label">Erreurs</span>
                    <span id="errors" class="stat-value" style="color: #f85149">0</span>
                </div>
            </div>

            <button id="startBtn" class="btn-test" style="width:100%; padding:15px; background:#238636; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; margin-top: 8px;">START ARENA TEST</button>

            <div class="actions-container">
                <div class="actions-row">
                    <button id="copyLogBtn" class="btn-secondary">COPIE LOGS</button>
                    <button id="copyFenBtn" class="btn-secondary">COPIE FENS</button>
                    <button id="copyStatsBtn" class="btn-secondary">COPIE STATS</button>
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
        <div class="dash-item" style="border-left: 1px solid #30363d">
            <span class="dash-label">Total Coups</span>
            <span id="dash-moves" class="dash-value" style="color: #aff5b4;">0</span>
        </div>

        <div class="dash-item" style="border-left: 1px solid #30363d">
            <span class="dash-label">Ratio (W / B)</span>
            <span id="dash-pure-ratio" class="dash-value" style="color: #d29922;">0% / 0%</span>
        </div>

<div class="dash-item" style="border-left: 1px solid #30363d; min-width: 280px;">
    <span class="dash-label">Win Ratio (W / D / B)</span>
    <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
        
        <div id="badge-w" style="width: 55px; height: 26px; background: #ffffff; color: #000; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; border-radius: 4px; flex-shrink: 0; border: 2px solid #30363d;">0%</div>

        <div id="dash-ratio-container" style="flex-grow: 1; height: 20px; display: flex; border-radius: 4px; overflow: hidden; border: 1px solid #30363d; background: #0d1117; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
            
            <div id="ratio-w" style="background: #ffffff; width: 33.3%; transition: width 0.5s ease; box-shadow: inset -2px 0 5px rgba(0,0,0,0.2);"></div>
            
            <div id="ratio-d" style="background: #343942; width: 33.4%; transition: width 0.5s ease; display: flex; align-items: center; justify-content: space-between; padding: 0 6px; color: #d29922; font-size: 10px; font-weight: 800; position: relative;">
                <span style="opacity: 0.5; color: #ffffff; font-size: 9px;"></span>
                <span id="ratio-d-text">0%</span>
                <span style="opacity: 0.5; color: #58a6ff; font-size: 9px;"></span>
            </div>
            
            <div id="ratio-b" style="background: #58a6ff; width: 33.3%; transition: width 0.5s ease; box-shadow: inset 2px 0 5px rgba(0,0,0,0.2);"></div>
        </div>

        <div style="width: 55px; height: 26px; background: #ffffff; display: flex; align-items: center; justify-content: center; border-radius: 4px; border: 2px solid #30363d; flex-shrink: 0; box-sizing: border-box;">
            <div id="badge-b" style="width: 100%; height: 100%; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; border-radius: 1px;">0%</div>
        </div>
    </div>
    <span id="dash-ratio" style="display:none;">0% / 0% / 0%</span>
</div>


    </div>

    <?php 
    ob_start();
    include __DIR__ . '/../../../../engine-scripts.php'; 
    $engineScripts = ob_get_clean();
    echo str_replace('src="js/', 'src="../../../../js/', $engineScripts);
    ?>

    <?php foreach ($availableBots as $bot): ?>
        <script src="../<?php echo $bot['file']; ?>?v=<?php echo $version; ?>"></script>
    <?php endforeach; ?>

    <script src="js/ArenaAnalyst.js?v=<?php echo $version; ?>"></script>
    <script src="js/stress-test-bot.js?v=<?php echo $version; ?>"></script>

    <script>
    document.addEventListener('DOMContentLoaded', () => {
        // --- LOG SELECTION CHANGE ---
        const handleBotChange = (e, side) => {
            console.log(`[ARENA] Bot ${side} changé pour : ${e.target.value}`);
        };
        document.getElementById('selectBotWhite').addEventListener('change', (e) => handleBotChange(e, 'BLANC'));
        document.getElementById('selectBotBlack').addEventListener('change', (e) => handleBotChange(e, 'NOIR'));

        // --- CLEAR SERVER LOGIC ---
        const clearBtn = document.getElementById('clearJsonBtn');
        if (clearBtn) {
            clearBtn.onclick = function() {
                if (!confirm("Supprimer tous les fichiers JSON sur le serveur ?")) return;
                fetch('log_error.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'clear_all' })
                })
                .then(r => r.json())
                .then(data => {
                    if (data.status === "cleared" || data.status === "success") {
                        if (window.arenaAnalyst) window.arenaAnalyst.reset();
                        alert("Serveur nettoyé !");
                        location.reload();
                    }
                })
                .catch(e => console.error("Erreur:", e));
            };
        }

        // --- COPY STATS LOGIC ---
        const copyStatsBtn = document.getElementById('copyStatsBtn');
        if (copyStatsBtn) {
            copyStatsBtn.onclick = function() {
                const stats = {
                    white: document.getElementById('dash-win-w').innerText,
                    black: document.getElementById('dash-win-b').innerText,
                    draws: document.getElementById('dash-draws').innerText,
                    moves: document.getElementById('dash-moves').innerText,
                    ratioGlobal: document.getElementById('dash-ratio').innerText,
                    ratioPure: document.getElementById('dash-pure-ratio').innerText,
                    total: document.getElementById('count').innerText
                };

                const text = `📊 ARENA STATS REPORT
-----------------------
Parties : ${stats.total}
Blancs  : ${stats.white} victoires
Noirs   : ${stats.black} victoires
Nulles  : ${stats.draws}
Coups   : ${stats.moves}
Ratio (W/D/B) : ${stats.ratioGlobal}
Ratio (W/B)   : ${stats.ratioPure} (Hors nulles)
-----------------------
Généré le : ${new Date().toLocaleString()}`;

                navigator.clipboard.writeText(text).then(() => {
                    const original = copyStatsBtn.innerText;
                    copyStatsBtn.innerText = "✅ COPIÉ";
                    setTimeout(() => copyStatsBtn.innerText = original, 1200);
                });
            };
        }
    });
    </script>
</body>
</html>