<?php
// templateChess-desktop.php
$version = time(); // version pour forcer le cache

// Charger la configuration JSON
$config = json_decode(file_get_contents('../config/game-config.json'), true);

// Timer par défaut en minutes
$defaultTimer = 90;
$selectedTimer = isset($_GET['timer']) ? intval($_GET['timer']) : $defaultTimer;
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($config['app_name']); ?> v<?php echo htmlspecialchars($config['version']); ?></title>
    
    <link rel="icon" href="../img/favicon.png">

    <!-- PWA Meta Tags Essentiels -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="KChess">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#764ba2">

    <!-- Apple Touch Icons -->
    <link rel="apple-touch-icon" href="../img/icon-180x180.png">
    <link rel="apple-touch-icon" sizes="152x152" href="../img/icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="../img/icon-180x180.png">

    <!-- Manifest -->
    <link rel="manifest" href="../manifest.json">

    <!-- CSS existants -->
    <link href="../css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="../css/bootstrap-icons.css">
    <link rel="stylesheet" href="../css/all.min.css">
    <link rel="stylesheet" href="../css/common-chess.css">
    <link rel="stylesheet" href="../css/templateChess-desktop.css">

    <link href="../css/kchess/variables.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/layout.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/components.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/utilities.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/chess-board-base.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/chess-board-coordinates.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/chess-board-states.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/chess-board-pieces.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/chess-board-animations.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/chess-board-special.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/chess-pieces.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/responsive.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/promotion-modal.css?version=<?php echo $version; ?>" rel="stylesheet">

    <!-- SYSTÈME ANTI-DOUBLE FLIP -->
    <style>
    /* PROTECTION CONTRE LES FLIPS MULTIPLES */
    .flip-in-progress {
        pointer-events: none;
        opacity: 0.7;
        transition: opacity 0.3s;
    }
    
    /* FORÇAGE ABSOLU DES TIMERS */
    .player-clock-white,
    .player-clock-black {
        all: unset !important;
        display: inline-block !important;
        font-family: 'Courier New', monospace !important;
        font-weight: bold !important;
        font-size: 1.3em !important;
        padding: 8px 12px !important;
        border-radius: 6px !important;
        min-width: 80px !important;
        text-align: center !important;
        border: 3px solid !important;
        margin: 5px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
    }

    .player-clock-white {
        color: #000000 !important;
        background: #FFFFFF !important;
        border-color: #333333 !important;
    }

    .player-clock-black {
        color: #FFFFFF !important;
        background: #000000 !important;
        border-color: #666666 !important;
    }
    
    /* État initial caché pour éviter les flashes */
    .chess-board-container {
        visibility: hidden;
    }
    .chess-board-container.ready {
        visibility: visible;
        transition: visibility 0.3s;
    }
    </style>

</head>
<body>

<div class="game-layout">

<header>
    <div class="header-level" id="headerLevel">L0</div>
    <?php echo htmlspecialchars($config['app_name']); ?>
</header>

<div class="main-content">

    <div class="main-row">

        <div class="new-game-col">
            <button class="new-game-btn" id="newGame">
                <div class="new-game-btn-icon"><i class="fas fa-plus text-color2"></i></div>
                <div class="new-game-btn-text">Nouvelle Partie</div>
            </button>
        </div>

        <div class="chessboard-col">
            <div id="section-black" class="section-joueurs">
                <div class="player-info">
                    <div class="player-name">Joueur 2 black<span class="mode"></span></div>
                    <div class="player-clock player-clock-black"></div>
                </div>
            </div>

            <div class="chessboard-container" id="chessboardContainer">
                <div id="chessBoard" class="chess-board">
                    <!-- Le board sera généré en JS -->
                </div>
            </div>

            <div id="section-white" class="section-joueurs">
                <div class="player-info">
                    <div class="player-name">Joueur 1 white<span class="mode"></span></div>
                    <div class="player-clock player-clock-white"></div>
                </div>
            </div>
        </div>

        <div class="controls-col">
            <div class="coups-section">
                <div class="coups-header section-joueurs">
                    Historique des coups 
                    <span class="pgn" id="copyPGN">PGN</span>
                    <span class="fen" id="copyFEN">FEN</span>
                </div>

                <div id="moveHistory" class="move-history" style="max-height: 300px;">
                    <div class="text-center text-muted small p-3">
                        Aucun coup joué
                    </div>
                </div>
            </div>

            <div class="controls-section">
                <div class="control-buttons">
                    <button class="control-btn" onclick="firstMove()">
                        <div class="control-btn-icon"><i class="fas fa-fast-backward text-color2"></i></div>
                        <div class="control-btn-text">Premier</div>
                    </button>
                    <button class="control-btn" onclick="previousMove()">
                        <div class="control-btn-icon"><i class="fas fa-arrow-left text-color2"></i></div>
                        <div class="control-btn-text">Précédent</div>
                    </button>
                    <button class="control-btn" onclick="nextMove()">
                        <div class="control-btn-icon"><i class="fas fa-arrow-right text-color2"></i></div>
                        <div class="control-btn-text">Suivant</div>
                    </button>
                    <button class="control-btn" onclick="lastMove()">
                        <div class="control-btn-icon"><i class="fas fa-fast-forward text-color2"></i></div>
                        <div class="control-btn-text">Dernier</div>
                    </button>
                    <button class="control-btn" id="flipBoard">
                        <div class="control-btn-icon"><i class="fas fa-sync-alt text-color2"></i></div>
                        <div class="control-btn-text">Tourner</div>
                    </button>
                </div>
            </div>
        </div>

    </div> <!-- FIN .main-row -->

    <div class="sticky-footer">
        <div class="footer-content">
            <div class="footer-info">
                Partie en cours • Temps restant: 08:45
            </div>
            <div class="footer-actions">
                <button class="footer-btn" onclick="pauseGame()">Pause</button>
                <button class="footer-btn" onclick="resignGame()">Abandonner</button>
                <button class="footer-btn" onclick="offerDraw()">Proposer nulle</button>
            </div>
        </div>
    </div>

</div> <!-- FIN .main-content -->

</div> <!-- FIN .game-layout -->

<!-- FLIP MANAGER GLOBAL - DOIT ÊTRE ICI DANS TEMPLATE -->
<script>
// =============================================
// 1. FLIP MANAGER GLOBAL - EXÉCUTÉ EN PREMIER
// =============================================
window.FlipManager = {
    isFlipInProgress: false,
    autoFlipApplied: false,
    flipHistory: [],
    desiredColor: 'white',
    
    init: function() {
        console.log('🔒 FlipManager initialisé');
        this.flipHistory = [];
        this.isFlipInProgress = false;
        this.autoFlipApplied = false;
        
        // Récupérer les paramètres URL
        const params = this.getUrlParams();
        this.desiredColor = params.color || 'white';
        
        console.log('🔍 Paramètres URL:', params);
        console.log('🎯 Couleur désirée:', this.desiredColor);
        
        return this;
    },
    
    getUrlParams: function() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        for (let [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        return params;
    },
    
    needsAutoFlip: function() {
        const board = document.getElementById('chessBoard');
        const isCurrentlyFlipped = board ? board.classList.contains('flipped') : false;
        const shouldBeFlipped = this.desiredColor === 'black';
        
        return {
            needsFlip: shouldBeFlipped && !isCurrentlyFlipped,
            needsUnflip: !shouldBeFlipped && isCurrentlyFlipped,
            currentState: isCurrentlyFlipped ? 'flipped' : 'normal',
            desiredState: shouldBeFlipped ? 'flipped' : 'normal'
        };
    },
    
    safeFlipBoard: function() {
        if (this.isFlipInProgress) {
            console.log('🚫 Flip déjà en cours - ignoré');
            return false;
        }
        
        try {
            this.isFlipInProgress = true;
            document.body.classList.add('flip-in-progress');
            
            console.log('🔄 Début du flip sécurisé');
            
            // 1. Essayer ChessGame d'abord
            if (window.chessGame && typeof window.chessGame.flipBoard === 'function') {
                console.log('✅ Utilisation de chessGame.flipBoard()');
                window.chessGame.flipBoard();
            }
            // 2. Sinon fonction globale
            else if (typeof window.flipBoard === 'function') {
                console.log('✅ Utilisation de window.flipBoard()');
                window.flipBoard();
            }
            // 3. Fallback manuel
            else {
                console.log('⚠️ Fallback manuel');
                this.manualFlip();
            }
            
            // Historique
            this.flipHistory.push({
                timestamp: new Date().toISOString(),
                source: 'safeFlipBoard',
                desiredColor: this.desiredColor
            });
            
            console.log('✅ Flip sécurisé terminé');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur lors du flip:', error);
            return false;
        } finally {
            setTimeout(() => {
                this.isFlipInProgress = false;
                document.body.classList.remove('flip-in-progress');
            }, 500);
        }
    },
    
    manualFlip: function() {
        const board = document.getElementById('chessBoard');
        if (!board) return false;
        
        board.classList.toggle('flipped');
        
        const pieces = document.querySelectorAll('.chess-piece');
        pieces.forEach(piece => {
            if (board.classList.contains('flipped')) {
                piece.style.transform = 'rotate(180deg)';
            } else {
                piece.style.transform = 'rotate(0deg)';
            }
        });
        
        this.flipSections();
        return true;
    },
    
    flipSections: function() {
        const sectionWhite = document.getElementById('section-white');
        const sectionBlack = document.getElementById('section-black');
        const chessboardContainer = document.getElementById('chessboardContainer');
        const chessboardCol = document.querySelector('.chessboard-col');
        
        if (sectionWhite && sectionBlack && chessboardContainer && chessboardCol) {
            const currentOrder = Array.from(chessboardCol.children).map(child => child.id);
            
            if (currentOrder[0] === 'section-black') {
                chessboardCol.innerHTML = '';
                chessboardCol.appendChild(sectionWhite);
                chessboardCol.appendChild(chessboardContainer);
                chessboardCol.appendChild(sectionBlack);
                console.log('✅ Sections: Blanc en haut, Noir en bas');
            } else {
                chessboardCol.innerHTML = '';
                chessboardCol.appendChild(sectionBlack);
                chessboardCol.appendChild(chessboardContainer);
                chessboardCol.appendChild(sectionWhite);
                console.log('✅ Sections: Noir en haut, Blanc en bas');
            }
        }
    },
    
    applyAutoFlipOnce: function() {
        if (this.autoFlipApplied) {
            console.log('⚠️ Flip automatique déjà appliqué');
            return false;
        }
        
        const needs = this.needsAutoFlip();
        console.log('🔍 État flip:', needs);
        
        if (needs.needsFlip || needs.needsUnflip) {
            console.log(`🎯 Flip automatique nécessaire: ${needs.needsFlip ? 'FLIP' : 'UNFLIP'}`);
            
            setTimeout(() => {
                const success = this.safeFlipBoard();
                if (success) {
                    this.autoFlipApplied = true;
                    console.log('✅ Flip automatique appliqué UNE SEULE FOIS');
                    
                    // Montrer le board
                    const container = document.getElementById('chessboardContainer');
                    if (container) {
                        container.classList.add('ready');
                    }
                }
            }, 800);
            
            return true;
        }
        
        console.log('✅ Aucun flip automatique nécessaire');
        setTimeout(() => {
            const container = document.getElementById('chessboardContainer');
            if (container) {
                container.classList.add('ready');
            }
        }, 500);
        
        return false;
    },
    
    reset: function() {
        this.autoFlipApplied = false;
        console.log('🔄 FlipManager réinitialisé');
        
        setTimeout(() => {
            this.applyAutoFlipOnce();
        }, 1000);
    },
    
    debug: function() {
        const needs = this.needsAutoFlip();
        const board = document.getElementById('chessBoard');
        
        console.group('🔍 DEBUG FlipManager');
        console.log('Desired color:', this.desiredColor);
        console.log('Current flipped:', board ? board.classList.contains('flipped') : 'N/A');
        console.log('Needs flip:', needs);
        console.log('Auto flip applied:', this.autoFlipApplied);
        console.log('Flip in progress:', this.isFlipInProgress);
        console.log('Flip history:', this.flipHistory);
        console.groupEnd();
        
        return needs;
    }
};

// =============================================
// 2. INITIALISATION GLOBALE
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Initialisation FlipManager');
    
    // Initialiser FlipManager IMMÉDIATEMENT
    window.FlipManager.init();
    
    // Configurer les boutons
    setupGlobalButtons();
    
    // Appliquer flip auto avec délai
    setTimeout(() => {
        window.FlipManager.applyAutoFlipOnce();
    }, 1000);
});

// =============================================
// 3. CONFIGURATION DES BOUTONS GLOBAUX
// =============================================
function setupGlobalButtons() {
    // Bouton flip
    const flipButton = document.getElementById('flipBoard');
    if (flipButton) {
        const newButton = flipButton.cloneNode(true);
        flipButton.parentNode.replaceChild(newButton, flipButton);
        
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔄 Bouton flip cliqué manuellement');
            window.FlipManager.safeFlipBoard();
        });
        
        newButton.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📱 Bouton flip touché');
            window.FlipManager.safeFlipBoard();
        });
    }
    
    // Bouton nouvelle partie
    const newGameButton = document.getElementById('newGame');
    if (newGameButton) {
        const newButton = newGameButton.cloneNode(true);
        newGameButton.parentNode.replaceChild(newButton, newGameButton);
        
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🔄 Nouvelle partie demandée');
            window.FlipManager.reset();
            
            if (window.chessGame && typeof window.chessGame.newGame === 'function') {
                window.chessGame.newGame();
            }
        });
    }
}

// =============================================
// 4. FONCTIONS GLOBALES POUR COMPATIBILITÉ
// =============================================
window.flipBoard = function() {
    console.log('🔄 flipBoard() global appelé');
    return window.FlipManager.safeFlipBoard();
};

window.newGame = function() {
    console.log('🔄 newGame() global appelé');
    if (window.chessGame && typeof window.chessGame.newGame === 'function') {
        return window.chessGame.newGame();
    }
    return false;
};

window.getUrlParams = function() {
    return window.FlipManager.getUrlParams();
};

// =============================================
// 5. INTERFACE DEBUG
// =============================================
window.debugGlobal = {
    status: function() {
        console.group('🔧 DEBUG GLOBAL');
        window.FlipManager.debug();
        console.log('ChessGame disponible:', window.chessGame ? 'OUI' : 'NON');
        console.groupEnd();
    },
    
    testFlip: function() {
        console.log('🧪 Test flip manuel');
        window.FlipManager.safeFlipBoard();
    },
    
    forceAutoFlip: function() {
        console.log('🧪 Forçage flip automatique');
        window.FlipManager.autoFlipApplied = false;
        window.FlipManager.applyAutoFlipOnce();
    }
};

console.log('🎮 FlipManager global prêt - Commandes: debugGlobal.status(), debugGlobal.testFlip()');
</script>

<?php
// Inclure le footer avec les scripts
require_once '../footer.php';  
?>

</body>
</html>