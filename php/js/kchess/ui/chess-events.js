// chess-events.js - Initialisation du jeu SIMPLIFIÉE
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Début initialisation');
    
    // Initialisation UNIQUE du jeu
    initializeChessGame();
    
    // Configuration des événements
    setupEventListeners();
    
    console.log('✅ Initialisation terminée');
});

// Initialisation simple du jeu
function initializeChessGame() {
    try {
        if (typeof ChessGame !== 'undefined' && !window.chessGame) {
            window.chessGame = new ChessGame();
            console.log('✅ ChessGame initialisé avec succès');
        } else if (window.chessGame) {
            console.log('ℹ️ ChessGame déjà initialisé');
        } else {
            console.error('❌ ChessGame non disponible');
            // Retry après délai
            setTimeout(() => {
                if (typeof ChessGame !== 'undefined' && !window.chessGame) {
                    window.chessGame = new ChessGame();
                    console.log('✅ ChessGame initialisé avec délai');
                }
            }, 1000);
        }
    } catch (error) {
        console.error('❌ Erreur initialisation ChessGame:', error);
    }
}

// Configuration simple des événements
function setupEventListeners() {
    console.log('📱 Configuration des événements...');
    
    // Boutons mobiles
    setupMobileButtons();
    
    // Boutons desktop
    setupDesktopButtons();
}

// Configuration des boutons mobiles SIMPLIFIÉE
function setupMobileButtons() {
    const mobileButtons = [
        { id: 'newGameMobile', action: () => redirectToIndex() },
        { id: 'flipBoardMobile', action: () => flipBoard() }
    ];
    
    mobileButtons.forEach(button => {
        const element = document.getElementById(button.id);
        if (element) {
            console.log(`✅ Configuration de ${button.id}`);
            
            // Nettoyer et réattacher les événements
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            // Événements simples
            newElement.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`📱 Click sur ${button.id}`);
                button.action();
            });
            
            newElement.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`📱 Touch sur ${button.id}`);
                button.action();
            });
            
            // Style mobile
            newElement.style.cursor = 'pointer';
            newElement.style.touchAction = 'manipulation';
            
        } else {
            console.warn(`⚠️ ${button.id} non trouvé`);
        }
    });
}

// Configuration des boutons desktop
function setupDesktopButtons() {
    const desktopButtons = [
        { selector: '#newGame', action: () => redirectToIndex() },
        { selector: '#flipBoard', action: () => flipBoard() },
        { selector: '.new-game-btn:not(#newGameMobile)', action: () => redirectToIndex() },
        { selector: '.flip-board-btn:not(#flipBoardMobile)', action: () => flipBoard() }
    ];
    
    desktopButtons.forEach(button => {
        const elements = document.querySelectorAll(button.selector);
        elements.forEach(element => {
            element.addEventListener('click', function(e) {
                e.preventDefault();
                console.log(`🖥️ Click sur ${button.selector}`);
                button.action();
            });
        });
    });
}

// Actions simples
function redirectToIndex() {
    console.log('🔄 Redirection vers index.php');
    window.location.href = 'index.php';
}

function flipBoard() {
    console.log('🔄 Flip du plateau');
    if (window.chessGame && typeof window.chessGame.flipBoard === 'function') {
        window.chessGame.flipBoard();
    } else {
        console.error('❌ flipBoard non disponible');
        // Fallback simple
        alert('Fonction non disponible. Rechargement...');
        window.location.reload();
    }
}

function newGame() {
    console.log('🔄 Nouvelle partie');
    if (window.chessGame && typeof window.chessGame.newGame === 'function') {
        window.chessGame.newGame();
    } else {
        console.error('❌ newGame non disponible');
    }
}

// Fallback simple après délai
setTimeout(() => {
    console.debug('🔧 Vérification finale...');
    setupMobileButtons();
}, 2000);

// Export pour debug
window.debugChess = {
    game: () => window.chessGame,
    botStatus: () => window.chessGame?.getBotStatus?.(),
    forceBot: (level = 1, color = 'black') => window.chessGame?.setBotLevel?.(level, color),
    testFlip: () => flipBoard(),
    testNewGame: () => newGame()
};