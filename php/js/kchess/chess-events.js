// chess-events.js - Initialisation du jeu
document.addEventListener('DOMContentLoaded', function() {
    // Initialisation du jeu
    window.chessGame = new ChessGame();
    
    console.log('🎯 Jeu d\'échecs chargé avec succès');
    
    // Exposer globalement pour le débogage
    window.debugChess = {
        game: window.chessGame,
        pieces: window.chessGame.pieceManager,
        state: window.chessGame.gameState,
        board: window.chessGame.board,
        validator: window.chessGame.moveValidator
    };
});