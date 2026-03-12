<?php
// content.php - Layout Desktop avec menu à gauche et statut intégré
require_once __DIR__ . '/config-loader.php';
$config = loadGameConfig();

// Sécurité sur les clés de configuration
$lang = $config['current_lang'] ?? 'fr';
$translations = $config['lang'][$lang] ?? [];
$version = $config['version'] ?? '1.0.0';

/**
 * Helper de traduction sécurisé
 */
function t($key, $fallback = '') {
    global $translations;
    return htmlspecialchars($translations[$key] ?? $fallback ?: $key);
}
?>

<main class="container-fluid py-3">
    <div class="row g-3">
        <div class="col-xxl-2 col-xl-3 col-lg-3 col-md-4 col-12">
            <div class="card shadow-sm border-0 h-100">
                <div class="card-body p-3">
                    <div class="d-grid gap-2">
                        <a href="index.php" class="btn btn-primary btn-sm">
                            <i class="bi bi-house-door me-1"></i> <?php echo t('accueil'); ?>
                        </a>
                        
                        <button type="button" class="btn btn-success btn-sm new-game-btn" id="newGame">
                            <i class="bi bi-plus-circle me-1"></i> <?php echo t('new_game'); ?>
                        </button>

                        <button type="button" class="btn btn-outline-success btn-sm" id="playAgain">
                            <i class="bi bi-arrow-clockwise me-1"></i> <?php echo t('play_again', 'Rejouer'); ?>
                        </button>
                        
                        <hr class="my-2">

                        <button class="btn btn-outline-dark btn-sm flip-board-btn" id="flipBoardDesktop">
                            <i class="bi bi-arrow-repeat me-1"></i> <?php echo t('flip_board'); ?>
                        </button>

                        <div class="mt-3">
                            <div class="form-check form-switch small">
                                <input class="form-check-input" type="checkbox" id="soundToggle" checked>
                                <label class="form-check-input-label" for="soundToggle"><?php echo t('sounds', 'Sons'); ?></label>
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

                <div id="promotion-overlay" class="promotion-overlay d-none"></div>
            </div>
        </div>

        <div class="col-xxl-2 col-xl-3 col-lg-3 col-12">
            <div class="game-info-container h-100 d-flex flex-column">
                
                <div class="card mb-3 shadow-sm border-primary overflow-hidden">
                    <div id="currentPlayer" class="small fw-bold p-2 bg-light border-bottom text-center text-uppercase" style="letter-spacing: 1px;">
                        <?php echo t('traitAuBlancs'); ?>
                    </div>
                    <div class="row g-0 align-items-center bg-white text-center">
                        <div class="col-6 p-2 border-end" id="timerWhiteContainer">
                            <span class="text-muted d-block mb-1" style="font-size:0.65rem; font-weight: 800;">BLANCS</span>
                            <div id="whiteTime" class="fw-bold fs-5 text-primary font-monospace">00:00</div>
                            <div id="whiteInfo" class="text-success fw-bold" style="font-size:0.6rem; min-height: 12px;"></div>
                        </div>
                        <div class="col-6 p-2" id="timerBlackContainer">
                            <span class="text-muted d-block mb-1" style="font-size:0.65rem; font-weight: 800;">NOIRS</span>
                            <div id="blackTime" class="fw-bold fs-5 text-danger font-monospace">00:00</div>
                            <div id="blackInfo" class="text-success fw-bold" style="font-size:0.6rem; min-height: 12px;"></div>
                        </div>
                    </div>
                </div>

                <div class="card flex-grow-1 shadow-sm overflow-hidden">
                    <div class="card-header bg-warning text-dark py-2 d-flex justify-content-between align-items-center">
                        <h4 class="h6 mb-0 fw-bold"><i class="bi bi-clock-history me-1"></i> <?php echo t('moves_title'); ?></h4>
                        <div class="btn-group">
                            <button class="btn btn-xs btn-dark py-0 px-2" style="font-size:0.7rem" id="copyPGN" title="Copier PGN">PGN</button>
                            <button class="btn btn-xs btn-secondary py-0 px-2" style="font-size:0.7rem" id="copyFEN" title="Copier FEN">FEN</button>
                        </div>
                    </div>
                    <div class="card-body p-0 bg-white">
                        <div id="moveHistory" class="move-history" style="height: 350px; overflow-y: auto; font-family: 'Courier New', monospace; font-size: 0.85rem;">
                            <div class="text-center text-muted small p-3"><?php echo t('no_moves_played'); ?></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>

<div id="chess-notifications" class="position-fixed bottom-0 end-0 p-3" style="z-index: 1050"></div>

<footer class="bg-dark py-3 mt-auto">
    <div class="container text-center text-white-50">
        <small><?php echo t('app_name'); ?> v<?php echo $version; ?> | <?php echo date('Y'); ?></small>
    </div>
</footer>

<script>
// Transfert des traductions vers le JS
window.translations = <?php echo json_encode($translations, JSON_UNESCAPED_UNICODE); ?>;
window.getTranslation = (key, def = '') => window.translations[key] || def;

/**
 * Logique d'affichage des noms et icônes des joueurs
 */
window.updatePlayerLabels = function(isBotGame = false, botColor = null, botLevel = null) {
    const top = document.getElementById('topPlayerLabel');
    const bottom = document.getElementById('bottomPlayerLabel');
    if (!top || !bottom) return;

    const human = window.getTranslation('human_player', 'Humain');
    const white = window.getTranslation('white_player', 'Blancs');
    const black = window.getTranslation('black_player', 'Noirs');
    let botName = window.getTranslation('computer_player', 'Bot');
    
    // Récupération du nom spécifique du bot si dispo
    if (botLevel && window.translations.bots) {
        const botData = window.translations.bots['bot_' + botLevel];
        if (botData) botName = botData.title;
    }

    if (isBotGame) {
        if (botColor === 'black') {
            top.innerHTML = `<i class="bi bi-cpu me-1"></i> ${botName} (${black})`;
            bottom.innerHTML = `<i class="bi bi-person me-1"></i> ${human} (${white})`;
        } else {
            top.innerHTML = `<i class="bi bi-person me-1"></i> ${human} (${black})`;
            bottom.innerHTML = `<i class="bi bi-cpu me-1"></i> ${botName} (${white})`;
        }
    } else {
        top.innerHTML = `<i class="bi bi-person me-1"></i> ${human} 2 (${black})`;
        bottom.innerHTML = `<i class="bi bi-person me-1"></i> ${human} 1 (${white})`;
    }
};

/**
 * Formate le temps (secondes -> MM:SS)
 */
window.updateTimeDisplay = (w, b) => {
    const f = (s) => {
        const totalSec = Math.max(0, Math.floor(s));
        const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const sec = (totalSec % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    };
    const wEl = document.getElementById('whiteTime');
    const bEl = document.getElementById('blackTime');
    if (wEl) wEl.textContent = f(w);
    if (bEl) bEl.textContent = f(b);
};

document.addEventListener('DOMContentLoaded', function() {
    
    // GESTIONNAIRE NOUVELLE PARTIE
    document.querySelectorAll('.new-game-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm(window.getTranslation('confirm_new_game', 'Commencer une nouvelle partie ?'))) {
                if (window.localStorage) localStorage.clear();
                window.location.replace('index.php?new');
            }
        }); 
    });

    // REJOUER (Reload simple)
    const playAgainBtn = document.getElementById('playAgain');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.reload();
        });
    }

    // ROTATION DU PLATEAU
// DANS content.php (en bas du fichier)

document.querySelectorAll('.flip-board-btn').forEach(btn => {
    btn.onclick = function(e) { // On utilise .onclick pour écraser d'éventuels conflits
        e.preventDefault();
        console.log("🔄 Tentative de Flip Board...");

        // 1. Appel au moteur (Core)
        // C'est l'instance globale 'chessGame' créée par votre moteur qu'il faut viser
        if (window.chessGame && window.chessGame.core) {
            window.chessGame.core.flipBoard();
            console.log("✅ Core flipBoard exécuté");
        } else {
            console.warn("⚠️ Moteur chessGame non trouvé");
        }

        // 2. Bascule visuelle CSS (optionnel si votre moteur ne le fait pas déjà)
        const boardEl = document.getElementById('chessBoard');
        if (boardEl) {
            boardEl.classList.toggle('flipped');
        }
    };
});

    // INITIALISATION DES LABELS VIA URL PARAMS
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const level = params.get('level');
    const color = params.get('color') || 'white';

    if (mode === 'bot') {
        const botColor = (color === 'white') ? 'black' : 'white';
        window.updatePlayerLabels(true, botColor, level);
    } else {
        window.updatePlayerLabels(false);
    }

    // Gestion de la copie FEN
    document.getElementById('copyFEN')?.addEventListener('click', () => {
        if (window.chessGame?.getFEN) {
            const fen = window.chessGame.getFEN();
            navigator.clipboard.writeText(fen);
            alert("FEN copié !");
        }
    });
});
</script>

<style>
/* --- OPTIMISATIONS UI GÉNÉRALES --- */
.btn-xs { padding: 1px 5px; font-size: 0.75rem; }

.move-history::-webkit-scrollbar { width: 6px; }
.move-history::-webkit-scrollbar-track { background: #f1f1f1; }
.move-history::-webkit-scrollbar-thumb { background: #bbb; border-radius: 10px; }
.move-history::-webkit-scrollbar-thumb:hover { background: #999; }

.font-monospace { font-family: 'Courier New', Courier, monospace !important; }

#whiteTime, #blackTime { 
    line-height: 1.2; 
    letter-spacing: -0.5px; 
    transition: opacity 0.3s; 
}

/* Animation du tour actif */
.active-timer { 
    background-color: rgba(25, 135, 84, 0.1); 
    border-radius: 4px; 
}

/* Notifications */
.chess-notification {
    background: #333;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    margin-top: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    transition: opacity 0.5s;
    z-index: 1000;
}


/* Plus besoin de rotation ! Juste du style de base */
/* Style de base du plateau */
.chess-board {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
    width: 100%;
    height: 100%;
    aspect-ratio: 1 / 1;
    border: 2px solid #333;
}

/* Style des cases */
.chess-square {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
}

.chess-square.white {
    background-color: #f0d9b5;
}

.chess-square.black {
    background-color: #b58863;
}

/* Style des coordonnées */
.chess-square .coordinate-label {
    position: absolute;
    bottom: 2px;
    right: 2px;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
    font-weight: bold;
    pointer-events: none;
    z-index: 1;
}

.chess-square.black .coordinate-label {
    color: rgba(255, 255, 255, 0.6);
}

/* Style des pièces */
.chess-piece {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2;
    cursor: pointer;
}

.chess-piece img {
    width: 80%;
    height: 80%;
    object-fit: contain;
}

/* Optionnel : Style pour la case sélectionnée */
.chess-square.selected {
    outline: 3px solid #ffaa00;
    outline-offset: -3px;
}

/* Optionnel : Style pour les coups possibles */
.chess-square.possible-move {
    position: relative;
}

.chess-square.possible-move::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    background-color: rgba(0, 255, 0, 0.3);
    border-radius: 50%;
    pointer-events: none;
    z-index: 3;
}

/* Optionnel : Style pour le dernier coup joué */
.chess-square.last-move-source {
    background-color: rgba(255, 255, 0, 0.2) !important;
}

.chess-square.last-move-dest {
    background-color: rgba(255, 255, 0, 0.3) !important;
}

</style>

<style>
/* 1. On tourne le plateau */
.chess-board.flipped {
    transform: rotate(180deg) !important;
}

/* 2. On redresse les pièces et les labels */
/* On cible .chess-piece (ta classe) et .piece (au cas où) */
.chess-board.flipped .chess-piece,
.chess-board.flipped .piece,
.chess-board.flipped .coordinate-label {
    transform: rotate(-180deg) !important;
}

/* 3. On redresse l'image à l'intérieur pour doubler la sécurité */
.chess-board.flipped .chess-piece img {
    transform: rotate(-180deg) !important;
}

/* 4. Fix pour éviter que les pièces sortent de leur case */
.chess-board.flipped .chess-piece {
    display: flex !important;
    justify-content: center;
    align-items: center;
}
</style>