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

    <!-- STYLE EMERGENCY FIX - AJOUTEZ CECI -->
    <style>
    /* CORRECTION URGENTE - Empêche l'affichage de "10:00" */
    .player-clock::before,
    .player-clock::after,
    .player-clock-white::before,
    .player-clock-white::after,
    .player-clock-black::before,
    .player-clock-black::after {
        content: "" !important;
        display: none !important;
    }
    
    /* Assure que le texte s'affiche correctement */
    .player-clock {
        min-width: 70px;
        text-align: center;
        font-family: 'Courier New', monospace;
        font-weight: bold;
        font-size: 1.2em;
        padding: 5px 10px;
        border-radius: 4px;
        display: inline-block;
    }
    
    /* Couleurs spécifiques */
    .player-clock-white {
        color: #000;
        background: #fff;
        border: 2px solid #333;
    }
    
    .player-clock-black {
        color: #fff;
        background: #000;
        border: 2px solid #666;
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

            <div class="chessboard-container">
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

<!-- Timer JS - VERSION CORRECTE -->
<script>
// =============================================
// CLASSE TIMER AMÉLIORÉE
// =============================================
class PlayerTimer {
    constructor(clockElement, totalMinutes) {
        this.clockElement = clockElement;
        this.totalSeconds = totalMinutes * 60;
        this.remainingSeconds = this.totalSeconds;
        this.intervalId = null;
        
        // Nettoyer et afficher immédiatement
        this.forceCleanDisplay();
    }
    
    // Force le nettoyage de tout contenu CSS
    forceCleanDisplay() {
        // Supprimer tout contenu existant
        this.clockElement.textContent = '';
        this.clockElement.innerHTML = '';
        
        // Créer un nouvel élément span pour contenir le temps
        const timeSpan = document.createElement('span');
        timeSpan.className = 'timer-display';
        timeSpan.style.fontFamily = "'Courier New', monospace";
        timeSpan.style.fontWeight = 'bold';
        timeSpan.style.fontSize = '1.2em';
        
        // Calculer et afficher le temps initial
        this.updateDisplayElement(timeSpan);
        
        // Remplacer le contenu
        this.clockElement.appendChild(timeSpan);
        this.displayElement = timeSpan;
    }
    
    updateDisplayElement(element) {
        const minutes = Math.floor(this.remainingSeconds / 60);
        const seconds = this.remainingSeconds % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        element.textContent = display;
        element.dataset.time = display;
    }

    start() {
        if (this.intervalId) return;
        this.intervalId = setInterval(() => {
            if (this.remainingSeconds <= 0) {
                this.stop();
                if (this.displayElement) {
                    this.displayElement.textContent = "00:00";
                }
                alert('Temps écoulé pour ' + this.clockElement.className);
                return;
            }
            this.remainingSeconds--;
            this.updateDisplay();
        }, 1000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    reset() {
        this.remainingSeconds = this.totalSeconds;
        this.updateDisplay();
        this.stop();
    }

    updateDisplay() {
        if (this.displayElement) {
            this.updateDisplayElement(this.displayElement);
        }
    }
}

// =============================================
// INITIALISATION DES TIMERS
// =============================================
const timerMinutes = <?php echo $selectedTimer; ?>;
console.log('⏱️ Timer configuré à:', timerMinutes, 'minutes');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Initialisation timers...');
    
    // Attendre un peu pour que tous les CSS soient chargés
    setTimeout(() => {
        const whiteClockElement = document.querySelector('.player-clock-white');
        const blackClockElement = document.querySelector('.player-clock-black');
        
        if (!whiteClockElement || !blackClockElement) {
            console.error('❌ Éléments timer non trouvés');
            return;
        }
        
        // Initialiser les timers
        window.whiteClock = new PlayerTimer(whiteClockElement, timerMinutes);
        window.blackClock = new PlayerTimer(blackClockElement, timerMinutes);
        
        // SEUL le timer blanc démarre au début
        window.currentPlayer = 'white';
        window.whiteClock.start();
        
        console.log('✅ Timers initialisés - Blancs:', timerMinutes + 'min, Noirs:', timerMinutes + 'min');
        
        // Nouvelle partie
        document.getElementById('newGame').addEventListener('click', () => {
            console.log('🔄 Nouvelle partie - réinitialisation timers');
            window.whiteClock.reset();
            window.blackClock.reset();
            window.currentPlayer = 'white';
            window.whiteClock.start();
        });
        
    }, 100); // Petit délai pour laisser le CSS se charger
});

// =============================================
// FONCTION POUR CHANGER DE TOUR
// =============================================
window.switchTurn = function() {
    if (!window.whiteClock || !window.blackClock) {
        console.error('❌ Timers non initialisés');
        return;
    }
    
    console.log('🔄 Changement de tour de', window.currentPlayer);
    
    if (window.currentPlayer === 'white') {
        window.whiteClock.stop();
        window.blackClock.start();
        window.currentPlayer = 'black';
    } else {
        window.blackClock.stop();
        window.whiteClock.start();
        window.currentPlayer = 'white';
    }
    
    console.log('✅ Nouveau tour:', window.currentPlayer);
};

// =============================================
// FONCTIONS DE DEBUG
// =============================================
window.testTimer = {
    switchTurn: () => {
        console.log('🧪 Test manuel switchTurn');
        window.switchTurn();
    },
    getStatus: () => {
        return {
            currentPlayer: window.currentPlayer,
            whiteRunning: window.whiteClock?.intervalId !== null,
            blackRunning: window.blackClock?.intervalId !== null,
            whiteTime: window.whiteClock?.remainingSeconds,
            blackTime: window.blackClock?.remainingSeconds
        };
    },
    simulateMove: () => {
        console.log('🧪 Simulation d\'un coup');
        window.switchTurn();
    },
    forceUpdate: () => {
        if (window.whiteClock) window.whiteClock.updateDisplay();
        if (window.blackClock) window.blackClock.updateDisplay();
        console.log('🔄 Affichage forcé');
    }
};

console.log('🎮 Système timer initialisé - PHP value:', timerMinutes);
</script>

<script>
// =============================================
// INTÉGRATION AVEC CHESSGAME
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Initialisation intégration ChessGame...');
    
    // Attendre que ChessGame soit disponible
    const checkChessGame = setInterval(() => {
        if (typeof window.chessGame !== 'undefined') {
            clearInterval(checkChessGame);
            console.log('🎮 ChessGame détecté, intégration en cours...');
            
            // Intégration avec handleMove
            if (window.chessGame.handleMove) {
                const originalHandleMove = window.chessGame.handleMove;
                window.chessGame.handleMove = function(fromRow, fromCol, toRow, toCol) {
                    const result = originalHandleMove.call(this, fromRow, fromCol, toRow, toCol);
                    if (result && window.switchTurn) {
                        console.log('✅ Coup valide - changement de timer');
                        window.switchTurn();
                    }
                    return result;
                };
                console.log('✅ Hook handleMove installé');
            }
            
            // Intégration avec newGame
            if (window.chessGame.newGame) {
                const originalNewGame = window.chessGame.newGame;
                window.chessGame.newGame = function() {
                    console.log('♟️ Nouvelle partie ChessGame');
                    const result = originalNewGame.apply(this, arguments);
                    
                    // Réinitialiser les timers
                    if (window.whiteClock && window.blackClock) {
                        window.whiteClock.reset();
                        window.blackClock.reset();
                        window.currentPlayer = 'white';
                        window.whiteClock.start();
                    }
                    
                    return result;
                };
                console.log('✅ Hook newGame installé');
            }
        }
    }, 100);
    
    // Timeout de sécurité
    setTimeout(() => {
        clearInterval(checkChessGame);
    }, 5000);
});

console.log(`
🎮 COMMANDES DISPONIBLES :
• testTimer.getStatus()    - Voir l'état des timers
• testTimer.simulateMove() - Simuler un coup (change de tour)
• testTimer.forceUpdate()  - Forcer l'affichage
• switchTurn()             - Changer manuellement de tour
`);
</script>

<?php
// Inclure le footer avec les scripts
require_once '../footer.php';  
?>