<?php
// content.php - Layout avec menu à gauche - Synchronisé JSON v0.99
require_once __DIR__ . '/config-loader.php';
$config = loadGameConfig();

$lang = $config['current_lang'] ?? 'fr';
$translations = $config['lang'][$lang];
// On récupère la config des horloges pour l'affichage initial
$botsClock = $config['bots_clock'] ?? [];
?>

<main class="container-fluid py-3">
    <div class="row g-3">
        <div class="col-xxl-2 col-xl-3 col-lg-3 col-md-4 col-12">
            <div class="menu-container h-100">
                <div class="card h-100 shadow-sm">
                    <div class="card-body p-2">
                        <div id="menuContent" class="d-md-block">
                            <div class="d-grid gap-2">
                                <a href="index.php" class="btn btn-primary btn-sm">
                                    <i class="bi bi-house-door me-1"></i> <?php echo htmlspecialchars($translations['accueil']); ?>
                                </a>
                                
                                <button type="button" class="btn btn-success btn-sm new-game-btn" id="newGame">
                                    <i class="bi bi-plus-circle me-1"></i> <?php echo htmlspecialchars($translations['new_game']); ?>
                                </button>
                                
                                <button class="btn btn-outline-dark btn-sm flip-board-btn" id="flipBoard"
                                        title="<?php echo htmlspecialchars($translations['flip_board']); ?>">
                                    <i class="bi bi-arrow-repeat me-1"></i> <?php echo htmlspecialchars($translations['flip_board']); ?>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-xxl-8 col-xl-6 col-lg-6 col-md-8 col-12">
            <div class="chess-container bg-light rounded-3 p-2 h-100 position-relative">
                <div class="position-absolute top-0 start-0 m-2" style="z-index: 10;">
                    <span id="topPlayerLabel" class="badge bg-dark text-white p-2 shadow-sm">--</span>
                </div>
                <div class="position-absolute bottom-0 start-0 m-2" style="z-index: 10;">
                    <span id="bottomPlayerLabel" class="badge bg-white text-dark border border-dark p-2 shadow-sm">--</span>
                </div>
                <div class="chess-board-container mx-auto w-100 h-100 d-flex align-items-center justify-content-center">
                    <div id="chessBoard" class="chess-board"></div>
                </div>
            </div>
        </div>

        <div class="col-xxl-2 col-xl-3 col-lg-3 col-12">
            <div class="game-info-container h-100 d-flex flex-column">
                <div class="card mb-3 flex-grow-0 shadow-sm">
                    <div class="card-body p-2">
                        <div class="game-status text-center">
                            <div class="small text-muted mb-2" id="currentPlayer">
                                <?php echo htmlspecialchars($translations['traitAuBlancs']); ?>
                            </div>
                            <div class="row text-center small g-1">
                                <div class="col-6 border-end">
                                    <div class="fw-bold"><?php echo htmlspecialchars($translations['white_time_label']); ?></div>
                                    <div id="whiteTime" class="text-primary font-monospace fw-bold fs-5">00:00</div>
                                </div>
                                <div class="col-6">
                                    <div class="fw-bold"><?php echo htmlspecialchars($translations['black_time_label']); ?></div>
                                    <div id="blackTime" class="text-primary font-monospace fw-bold fs-5">00:00</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card flex-grow-1 shadow-sm">
                    <div class="card-header bg-warning text-dark py-2 d-flex justify-content-between align-items-center">
                        <h4 class="h6 mb-0"><i class="bi bi-clock-history me-1"></i> <?php echo htmlspecialchars($translations['moves_title']); ?></h4>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-dark p-1 px-2" id="copyPGN">PGN</button>
                            <button class="btn btn-sm btn-secondary p-1 px-2" id="copyFEN">FEN</button>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div id="moveHistory" class="move-history" style="max-height: 400px; overflow-y: auto;">
                            <div class="text-center text-muted small p-3"><?php echo htmlspecialchars($translations['no_moves_played']); ?></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>

<footer class="bg-dark py-3 mt-auto">
    <div class="container text-center text-white-50">
        <small><?php echo htmlspecialchars($translations['app_name']); ?> v<?php echo $config['version']; ?> | <?php echo date('Y'); ?></small>
    </div>
</footer>

<script>
/**
 * Transfert des données JSON vers le JS
 */
window.translations = <?php echo json_encode($translations, JSON_UNESCAPED_UNICODE); ?>;
window.botsConfig = <?php echo json_encode($config['bots_clock'] ?? []); ?>;

/**
 * Helper de traduction pour gérer les clés imbriquées (ex: 'bots.bot_1.title')
 */
window.getTranslation = (key, def = '') => {
    return key.split('.').reduce((o, i) => (o ? o[i] : def), window.translations) || def;
};

/**
 * Met à jour les labels des joueurs (haut et bas) selon le mode de jeu
 */
window.updatePlayerLabels = function(isBotGame = false, botColor = null, botLevel = null) {
    const top = document.getElementById('topPlayerLabel');
    const bottom = document.getElementById('bottomPlayerLabel');
    if (!top || !bottom) return;

    const whiteLabel = window.getTranslation('white_player', 'Blancs');
    const blackLabel = window.getTranslation('black_player', 'Noirs');
    const humanName = window.getTranslation('human_player', 'Humain');
    
    let botName = window.getTranslation('computer_player', 'Bot');
    if (botLevel) {
        botName = window.getTranslation(`bots.bot_${botLevel}.title`, `Bot Niv.${botLevel}`);
    }

    if (isBotGame) {
        if (botColor === 'black') {
            top.innerHTML = `<i class="bi bi-cpu me-1"></i> ${botName} (${blackLabel})`;
            bottom.innerHTML = `<i class="bi bi-person me-1"></i> ${humanName} (${whiteLabel})`;
        } else {
            top.innerHTML = `<i class="bi bi-person me-1"></i> ${humanName} (${blackLabel})`;
            bottom.innerHTML = `<i class="bi bi-cpu me-1"></i> ${botName} (${whiteLabel})`;
        }
    } else {
        top.innerHTML = `<i class="bi bi-person me-1"></i> ${humanName} (${blackLabel})`;
        bottom.innerHTML = `<i class="bi bi-person me-1"></i> ${humanName} (${whiteLabel})`;
    }
};

/**
 * Affiche le temps initial statique basé sur la config bots_clock du JSON
 */
window.initTimeDisplay = (botLevel = null) => {
    let timeStr = "10:00"; // Défaut
    if (botLevel && window.botsConfig[`bot_${botLevel}`]) {
        const fullClock = window.botsConfig[`bot_${botLevel}`].clock;
        // Formatage MM:SS (on retire le "00:" initial du format HH:MM:SS si présent)
        timeStr = fullClock.startsWith("00:") ? fullClock.substring(3) : fullClock;
    }
    
    const wEl = document.getElementById('whiteTime');
    const bEl = document.getElementById('blackTime');
    if (wEl) wEl.textContent = timeStr;
    if (bEl) bEl.textContent = timeStr;
};

/**
 * INITIALISATION PRINCIPALE
 */
document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const level = params.get('level');
    const color = params.get('color') || 'white';

    // 1. Initialisation de l'affichage UI
    if (mode === 'bot') {
        const botColor = (color === 'white') ? 'black' : 'white';
        window.updatePlayerLabels(true, botColor, level);
        window.initTimeDisplay(level);

        // 2. Synchronisation dynamique avec le moteur de jeu (Incrément + Horloge logicielle)
        setTimeout(() => {
            const timer = window.chessGame?.core?.ui?.timerManager;
            const botConfig = window.botsConfig[`bot_${level}`];
            
            if (timer && botConfig) {
                console.log(`⏱️ Config Timer appliquée : Bot Niveau ${level} (+${botConfig.increment}s)`);
                timer.setTimerConfig(botConfig);
            }
        }, 500); // Délai de sécurité pour l'instanciation de chessGame
    } else {
        window.updatePlayerLabels(false);
    }

    // 3. Gestion des boutons d'interface
    document.querySelectorAll('.new-game-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm(window.getTranslation('new_game') + ' ?')) {
                window.location.href = 'index.php?new';
            }
        });
    });

    document.querySelectorAll('.flip-board-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.chessGame?.flipBoard) {
                window.chessGame.flipBoard();
            }
        });
    });
});
</script>