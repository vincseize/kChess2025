<?php
// content.php - Layout avec menu à gauche
require_once __DIR__ . '/config-loader.php';
$config = loadGameConfig();

$lang = $config['current_lang'];
$translations = $config['lang'][$lang];
?>

<main class="container-fluid py-3">
    <div class="row g-3">
        <div class="col-xxl-2 col-xl-3 col-lg-3 col-md-4 col-12">
            <div class="menu-container h-100">
                <div class="card h-100 shadow-sm">
                    <div class="card-body p-2">
                        
            

                        <div id="menuContent" class="d-md-block">
                            <div class="d-grid gap-2 d-none d-md-block">
                            <a href="index.php" class="btn btn-primary btn-sm">
                                <i class="bi bi-house-door me-1"></i> <?php echo htmlspecialchars($translations['accueil']); ?>
                            </a>
                                
                                <button type="button" class="btn btn-success btn-sm new-game-btn" id="newGame">
                                    <i class="bi bi-plus-circle me-1"></i> <?php echo htmlspecialchars($translations['new_game']); ?>
                                </button>
                                
                            <button class="btn btn-outline-dark btn-sm flip-board-btn" id="flipBoardMobile"
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
                    <span id="topPlayerLabel" class="badge bg-dark text-white p-2 shadow-sm"></span>
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
                <div class="card mb-3 flex-grow-0 shadow-sm">
                    <div class="card-body p-2">
                        <div class="game-status text-center">
                            <div class="small text-muted mb-2" id="currentPlayer">
                                <?php echo htmlspecialchars($translations['traitAuBlancs']); ?>
                            </div>
                            <div class="row text-center small g-1">
                                <div class="col-6">
                                    <div class="fw-bold"><?php echo htmlspecialchars($translations['white_time_label']); ?></div>
                                    <div id="whiteTime" class="text-primary font-monospace">00:00</div>
                                </div>
                                <div class="col-6">
                                    <div class="fw-bold"><?php echo htmlspecialchars($translations['black_time_label']); ?></div>
                                    <div id="blackTime" class="text-primary font-monospace">00:00</div>
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
                        <div id="moveHistory" class="move-history" style="max-height: 300px; overflow-y: auto;">
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
window.translations = <?php echo json_encode($translations, JSON_UNESCAPED_UNICODE); ?>;
window.getTranslation = (key, def = '') => window.translations[key] || def;

// Fonctions de mise à jour (Labels, Temps, Statut)
window.updatePlayerLabels = function(isBotGame = false, botColor = null, botLevel = null) {
    const top = document.getElementById('topPlayerLabel');
    const bottom = document.getElementById('bottomPlayerLabel');
    if (!top || !bottom) return;

    const levelNum = Number(botLevel);
    let topName = window.getTranslation('human_player', 'Humain');
    let bottomName = window.getTranslation('human_player', 'Humain');
    let botText = window.getTranslation('computer_player', 'Bot');
    if (levelNum === 1) botText = window.getTranslation('bot_level1', 'Niveau 1');
    else if (levelNum === 2) botText = window.getTranslation('bot_level2', 'Niveau 2');

    const whiteLabel = window.getTranslation('white_player', 'Blancs');
    const blackLabel = window.getTranslation('black_player', 'Noirs');

    if (isBotGame && botColor === 'black') {
        top.innerHTML = `<i class="bi bi-cpu me-1"></i> ${botText} (${blackLabel})`;
        bottom.innerHTML = `<i class="bi bi-person me-1"></i> ${bottomName} (${whiteLabel})`;
    } else if (isBotGame && botColor === 'white') {
        top.innerHTML = `<i class="bi bi-person me-1"></i> ${topName} (${blackLabel})`;
        bottom.innerHTML = `<i class="bi bi-cpu me-1"></i> ${botText} (${whiteLabel})`;
    } else {
        top.innerHTML = `<i class="bi bi-person me-1"></i> ${topName} (${blackLabel})`;
        bottom.innerHTML = `<i class="bi bi-person me-1"></i> ${bottomName} (${whiteLabel})`;
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
    
    // 1. GESTION DU BOUTON NOUVELLE PARTIE (CORRECTIF DOUBLE DIALOGUE)
    document.querySelectorAll('.new-game-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation(); 

            const msg = window.getTranslation('new_game', 'Nouvelle Partie') + ' ?';
            if (confirm(msg)) {
                window.location.href = 'index.php?new';
            }
        }, true); 
    });

    // 2. GESTION DU BOUTON RETOURNER LE PLATEAU (FLIP BOARD)
    document.querySelectorAll('.flip-board-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            // On appelle la méthode flipBoard sur l'instance globale du jeu
            if (window.chessGame && typeof window.chessGame.flipBoard === 'function') {
                window.chessGame.flipBoard();
            } else {
                console.warn("⚠️ ChessGame.flipBoard() n'est pas encore prêt");
            }
        });
    });

    // Paramètres initiaux (URL)
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'bot') {
        const bCol = (params.get('color') === 'white') ? 'black' : 'white';
        window.updatePlayerLabels(true, bCol, params.get('level'));
    } else {
        window.updatePlayerLabels(false);
    }

    // Vérification de l'état du bot pour les labels
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