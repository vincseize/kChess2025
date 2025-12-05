// ui/chess-events.js - Version simplifiée
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 chess-events.js chargé - Version simplifiée');
    
    // Petit délai pour éviter les conflits
    setTimeout(() => {
        initializeGame();
    }, 200);
});

function initializeGame() {
    try {
        // ChessGame devrait déjà être initialisé par ses propres scripts
        if (typeof ChessGame !== 'undefined' && !window.chessGame) {
            window.chessGame = new ChessGame();
            console.log('✅ ChessGame initialisé depuis chess-events.js');
        } else if (window.chessGame) {
            console.log('ℹ️ ChessGame déjà initialisé');
        }
    } catch (error) {
        console.error('❌ Erreur initialisation ChessGame:', error);
    }
}

// Les fonctions globales sont déjà définies dans templateChess-desktop.php
// flipBoard(), newGame(), getUrlParams() utilisent FlipManager

// Interface debug spécifique
window.debugEvents = {
    checkFlipManager: function() {
        console.log('🔍 Vérification FlipManager depuis chess-events');
        if (window.FlipManager) {
            return window.FlipManager.debug();
        } else {
            console.error('❌ FlipManager non disponible');
            return null;
        }
    }
};