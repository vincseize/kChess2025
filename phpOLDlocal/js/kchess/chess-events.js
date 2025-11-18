// chess-events.js - Initialisation du jeu
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Initialisation du jeu d\'échecs...');
    
    try {
        // Vérifier que toutes les classes nécessaires sont disponibles
        if (typeof ChessBoard === 'undefined' || typeof GameState === 'undefined' || 
            typeof MoveValidator === 'undefined' || typeof ChessGameCore === 'undefined') {
            throw new Error('Classes de jeu non chargées');
        }

        // Initialiser les composants
        const board = new ChessBoard();
        const gameState = new GameState();
        const moveValidator = new MoveValidator(board, gameState);
        
        // Initialiser le jeu principal
        const chessGame = new ChessGameCore(board, gameState, moveValidator);
        
        // Exposer globalement pour le débogage
        window.chessGame = chessGame;
        window.debugChess = {
            game: chessGame,
            board: board,
            state: gameState,
            validator: moveValidator,
            checkDetector: chessGame.checkDetector
        };

        console.log('✅ Jeu d\'échecs initialisé avec succès');
        console.log('🐛 Debug disponible: window.debugChess');

        // Tester la détection d'échec immédiatement
        setTimeout(() => {
            console.log('🔍 Test initial de détection d\'échec...');
            const whiteInCheck = chessGame.checkDetector.isKingInCheck('white');
            const blackInCheck = chessGame.checkDetector.isKingInCheck('black');
            console.log(`⚪ Roi blanc en échec: ${whiteInCheck}`);
            console.log(`⚫ Roi noir en échec: ${blackInCheck}`);
        }, 100);

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation du jeu:', error);
        console.log('📋 Classes disponibles:', {
            ChessBoard: typeof ChessBoard,
            GameState: typeof GameState,
            MoveValidator: typeof MoveValidator,
            ChessGameCore: typeof ChessGameCore,
            CheckDetector: typeof CheckDetector
        });
    }
});