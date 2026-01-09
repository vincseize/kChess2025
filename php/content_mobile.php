<?php
// content_mobile.php - Layout optimisé avec support JSON complet
require_once __DIR__ . '/config-loader.php';
$config = loadGameConfig();

// Récupération des traductions
$lang = $config['current_lang'];
$translations = $config['lang'][$lang];
?>

<main class="container-fluid py-2 py-md-3">
    <div class="row g-2 g-md-3">
        <div class="col-md-4 col-lg-3 col-xxl-2">
            <div class="card shadow-sm mb-2 mb-md-0 border-0">
                <div class="card-body p-2">
                    <div class="d-grid gap-2">
                        <a href="index.php" class="btn btn-primary btn-sm">
                            <i class="bi bi-house-door me-1"></i> <?php echo htmlspecialchars($translations['accueil']); ?>
                        </a>

                        <button type="button" class="btn btn-success btn-sm new-game-btn" id="newGame" 
                                title="<?php echo htmlspecialchars($translations['new_game']); ?>">
                            <i class="bi bi-plus-circle me-1"></i> <?php echo htmlspecialchars($translations['new_game']); ?>
                        </button>

                        <button type="button" class="btn btn-outline-dark btn-sm flip-board-btn" id="flipBoardMobile"
                                title="<?php echo htmlspecialchars($translations['flip_board']); ?>">
                            <i class="bi bi-arrow-repeat me-1"></i> <?php echo htmlspecialchars($translations['flip_board']); ?>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-8 col-lg-6 col-xxl-8">
            <div class="chess-container bg-light rounded-3 p-1 p-md-2 position-relative shadow-sm border">
                <div class="position-absolute top-0 start-0 m-2" style="z-index: 10;">
                    <span id="topPlayerLabel" class="badge bg-dark text-white p-2 shadow-sm border border-secondary"></span>
                </div>
                
                <div class="position-absolute bottom-0 start-0 m-2" style="z-index: 10;">
                    <span id="bottomPlayerLabel" class="badge bg-white text-dark border border-dark p-2 shadow-sm"></span>
                </div>
                
                <div class="chess-board-container mx-auto d-flex align-items-center justify-content-center">
                    <div id="chessBoard" class="chess-board"></div>
                </div>
            </div>
        </div>

        <div class="col-12 col-lg-3 col-xxl-2">
            <div class="card mb-2 border-primary shadow-sm">
                <div class="card-body p-2 text-center">
                    <div id="currentPlayer" class="small fw-bold mb-2 p-1 rounded bg-light border">
                        <?php echo htmlspecialchars($translations['traitAuBlancs']); ?>
                    </div>
                    <div class="row g-0 small font-monospace">
                        <div class="col-6 border-end">
                            <div class="text-muted" style="font-size:0.7rem"><?php echo htmlspecialchars($translations['white_time_label']); ?></div>
                            <div id="whiteTime" class="fw-bold fs-6 text-primary">00:00</div>
                        </div>
                        <div class="col-6">
                            <div class="text-muted" style="font-size:0.7rem"><?php echo htmlspecialchars($translations['black_time_label']); ?></div>
                            <div id="blackTime" class="fw-bold fs-6 text-danger">00:00</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card shadow-sm">
                <div class="card-header bg-warning text-dark py-1 px-2 d-flex justify-content-between align-items-center">
                    <span class="small fw-bold"><i class="bi bi-clock-history"></i> <?php echo htmlspecialchars($translations['moves_title']); ?></span>
                    <div class="btn-group">
                        <button class="btn btn-dark btn-xs py-0 px-1" style="font-size:0.7rem" id="copyPGN">PGN</button>
                        <button class="btn btn-secondary btn-xs py-0 px-1" style="font-size:0.7rem" id="copyFEN">FEN</button>
                    </div>
                </div>
                <div id="moveHistory" class="card-body p-0 move-history" style="height: 180px; overflow-y: auto;">
                    <div class="text-center text-muted small p-3">
                        <?php echo htmlspecialchars($translations['no_moves_played']); ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>

<footer class="bg-dark py-3 mt-auto">
    <div class="container text-center text-md-start">
        <div class="row align-items-center">
            <div class="col-md-6 text-white-50 small">
                <?php echo htmlspecialchars($translations['app_name']); ?> v<?php echo htmlspecialchars($config['version']); ?>
            </div>
            <div class="col-md-6 text-md-end text-white-50 small">
                <?php echo $translations['footer_copyright']; ?><?php echo date('Y'); ?>
            </div>
        </div>
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
    if (botLevel) botName = window.getTranslation('bot_level' + botLevel, botName);

    if (isBotGame && botColor === 'black') {
        top.innerHTML = `<i class="bi bi-cpu"></i> ${botName} (${black})`;
        bottom.innerHTML = `<i class="bi bi-person"></i> ${human} (${white})`;
    } else if (isBotGame && botColor === 'white') {
        top.innerHTML = `<i class="bi bi-person"></i> ${human} (${black})`;
        bottom.innerHTML = `<i class="bi bi-cpu"></i> ${botName} (${white})`;
    } else {
        top.innerHTML = `<i class="bi bi-person"></i> ${human} (${black})`;
        bottom.innerHTML = `<i class="bi bi-person"></i> ${human} (${white})`;
    }
};

window.updateGameStatus = function(currentPlayer) {
    const el = document.getElementById('currentPlayer');
    if (el) {
        el.textContent = window.getTranslation(currentPlayer === 'white' ? 'traitAuBlancs' : 'traitAuxNoirs');
    }
};

window.updateTimeDisplay = function(w, b) {
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
                window.location.replace('index.php?new');
            }
        }, true); 
    });

    // 2. RESTAURATION DU BOUTON FLIP BOARD
    document.querySelectorAll('.flip-board-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.chessGame && typeof window.chessGame.flipBoard === 'function') {
                window.chessGame.flipBoard();
            }
        });
    });

    // Paramètres URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'bot') {
        const bCol = (params.get('color') === 'white') ? 'black' : 'white';
        window.updatePlayerLabels(true, bCol, params.get('level'));
    } else {
        window.updatePlayerLabels(false);
    }

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
.chess-board-container { width: 100%; max-width: 500px; aspect-ratio: 1 / 1; }
.move-history { font-family: monospace; font-size: 0.8rem; }
.btn-xs { padding: 1px 5px; font-size: 0.75rem; }
@media (max-width: 767px) {
    .badge { font-size: 0.7rem !important; }
    .chess-board-container { max-width: 95vw; }
}
</style>