<?php
// content.php - Layout avec menu à gauche optimisé
require_once __DIR__ . '/config-loader.php';
$config = loadGameConfig();

$lang = $config['current_lang'];
$translations = $config['lang'][$lang];
?>

<main class="container-fluid py-3">
    <div class="row g-3">
        <div class="col-xxl-2 col-xl-3 col-lg-3 col-md-4 col-12">
            <div class="menu-container h-100">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body p-2">
                        <div id="menuContent" class="d-md-block">
                            <div class="d-grid gap-2 d-none d-md-block">
                                <a href="index.php" class="btn btn-primary btn-sm">
                                    <i class="bi bi-house-door me-1"></i> <?php echo htmlspecialchars($translations['accueil']); ?>
                                </a>
                                
                                <button type="button" class="btn btn-success btn-sm new-game-btn" id="newGame">
                                    <i class="bi bi-plus-circle me-1"></i> <?php echo htmlspecialchars($translations['new_game']); ?>
                                </button>

                                <button type="button" class="btn btn-outline-success btn-sm" id="playAgain">
                                    <i class="bi bi-arrow-clockwise me-1"></i> <?php echo htmlspecialchars($translations['play_again'] ?? 'Rejouer'); ?>
                                </button>
                                
                                <button class="btn btn-outline-dark btn-sm flip-board-btn" id="flipBoardDesktop"
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
            <div class="chess-container bg-light rounded-3 p-2 h-100 position-relative shadow-sm border">
                <div class="position-absolute top-0 start-0 m-2" style="z-index: 10;">
                    <span id="topPlayerLabel" class="badge bg-dark text-white p-2 shadow-sm border border-secondary"></span>
                </div>
                
                <div class="position-absolute bottom-0 start-0 m-2" style="z-index: 10;">
                    <span id="bottomPlayerLabel" class="badge bg-white text-dark border border-dark p-2 shadow-sm"></span>
                </div>

                <div class="chess-board-container mx-auto w-100 h-100 d-flex align-items-center justify-content-center">
                    <div id="chessBoard" class="chess-board"></div>
                </div>
            </div>
        </div>

        <div class="col-xxl-2 col-xl-3 col-lg-3 col-12">
            <div class="game-info-container h-100 d-flex flex-column">
                <div class="card mb-3 flex-grow-0 shadow-sm border-primary">
                    <div class="card-body p-2">
                        <div class="game-status text-center">
                            <div class="small fw-bold mb-2 p-1 rounded bg-light border" id="currentPlayer">
                                <?php echo htmlspecialchars($translations['traitAuBlancs']); ?>
                            </div>
                            <div class="row text-center small g-1">
                                <div class="col-6 border-end">
                                    <div class="text-muted" style="font-size:0.7rem"><?php echo htmlspecialchars($translations['white_time_label']); ?></div>
                                    <div id="whiteTime" class="fw-bold fs-6 text-primary font-monospace">00:00</div>
                                </div>
                                <div class="col-6">
                                    <div class="text-muted" style="font-size:0.7rem"><?php echo htmlspecialchars($translations['black_time_label']); ?></div>
                                    <div id="blackTime" class="fw-bold fs-6 text-danger font-monospace">00:00</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card flex-grow-1 shadow-sm">
                    <div class="card-header bg-warning text-dark py-2 d-flex justify-content-between align-items-center">
                        <h4 class="h6 mb-0 fw-bold"><i class="bi bi-clock-history me-1"></i> <?php echo htmlspecialchars($translations['moves_title']); ?></h4>
                        <div class="btn-group">
                            <button class="btn btn-xs btn-dark py-0 px-2" style="font-size:0.7rem" id="copyPGN">PGN</button>
                            <button class="btn btn-xs btn-secondary py-0 px-2" style="font-size:0.7rem" id="copyFEN">FEN</button>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div id="moveHistory" class="move-history" style="max-height: 400px; overflow-y: auto; font-family: monospace; font-size: 0.85rem;">
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
        <small><?php echo htmlspecialchars($translations['app_name']); ?> v<?php echo htmlspecialchars($config['version']); ?> | <?php echo date('Y'); ?></small>
    </div>
</footer>

<script>
window.translations = <?php echo json_encode($translations, JSON_UNESCAPED_UNICODE); ?>;
window.getTranslation = (key, def = '') => window.translations[key] || def;

window.updatePlayerLabels = function(isBotGame = false, botColor = null, botLevel = null) {
    const top = document.getElementById('topPlayerLabel');
    const bottom = document.getElementById('bottomPlayerLabel');
    if (!top || !bottom) return;

    const human = window.getTranslation('human_player', 'Humain');
    const white = window.getTranslation('white_player', 'Blancs');
    const black = window.getTranslation('black_player', 'Noirs');
    let botName = window.getTranslation('computer_player', 'Bot');
    
    if (botLevel) {
        botName = window.getTranslation('bot_level' + botLevel, botName);
        if (botName === 'Bot') botName = window.getTranslation('bot_' + botLevel, 'Niveau ' + botLevel);
    }

    if (isBotGame && botColor === 'black') {
        top.innerHTML = `<i class="bi bi-cpu me-1"></i> ${botName} (${black})`;
        bottom.innerHTML = `<i class="bi bi-person me-1"></i> ${human} (${white})`;
    } else if (isBotGame && botColor === 'white') {
        top.innerHTML = `<i class="bi bi-person me-1"></i> ${human} (${black})`;
        bottom.innerHTML = `<i class="bi bi-cpu me-1"></i> ${botName} (${white})`;
    } else {
        top.innerHTML = `<i class="bi bi-person me-1"></i> ${human} (${black})`;
        bottom.innerHTML = `<i class="bi bi-person me-1"></i> ${human} (${white})`;
    }
};

window.updateGameStatus = (currentPlayer) => {
    const el = document.getElementById('currentPlayer');
    if (el) el.textContent = window.getTranslation(currentPlayer === 'white' ? 'traitAuBlancs' : 'traitAuxNoirs');
};

window.updateTimeDisplay = (w, b) => {
    const f = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
    if (document.getElementById('whiteTime')) document.getElementById('whiteTime').textContent = f(w);
    if (document.getElementById('blackTime')) document.getElementById('blackTime').textContent = f(b);
};

document.addEventListener('DOMContentLoaded', function() {
    
// 1. NOUVELLE PARTIE DIRECTE (FORCE)
document.querySelectorAll('.new-game-btn').forEach(btn => {
    // On clone le bouton pour supprimer tous les anciens écouteurs d'événements (le confirm qui traîne)
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation(); // Empêche les autres scripts JS de voir le clic
        
        // Nettoyage manuel au cas où pour être sûr de repartir à zéro
        if (window.localStorage) localStorage.clear();
        if (window.sessionStorage) sessionStorage.clear();
        
        window.location.replace('index.php?new'); // .replace est mieux pour éviter les boucles de retour arrière
    }, true); 
});

    // 2. REJOUER (Même paramètres)
    const playAgainBtn = document.getElementById('playAgain');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = window.location.href;
        });
    }

    // 3. FLIP BOARD
    document.querySelectorAll('.flip-board-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.chessGame && typeof window.chessGame.flipBoard === 'function') {
                window.chessGame.flipBoard();
            }
        });
    });

    // Init Labels via URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'bot') {
        const bCol = (params.get('color') === 'white') ? 'black' : 'white';
        window.updatePlayerLabels(true, bCol, params.get('level'));
    } else {
        window.updatePlayerLabels(false);
    }

    // Sync Bot Status
    const engineCheck = setInterval(() => {
        if (window.chessGame?.getBotStatus) {
            const s = window.chessGame.getBotStatus();
            if (s.active) window.updatePlayerLabels(true, s.color, s.level);
            clearInterval(engineCheck);
        }
    }, 200);
    setTimeout(() => clearInterval(engineCheck), 5000);
});
</script>

<style>
.btn-xs { padding: 1px 5px; font-size: 0.75rem; }
.move-history::-webkit-scrollbar { width: 4px; }
.move-history::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
</style>