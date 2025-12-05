// chess-game-core.js - Version corrigée
class ChessGameCore {
    constructor(board, gameState, moveValidator) {
        this.board = board;
        this.gameState = gameState;
        this.moveValidator = moveValidator;
        
        this.selectedPiece = null;
        this.possibleMoves = [];
        
        // Managers modulaires
        this.moveHandler = new ChessGameMoveHandler(this);
        this.ui = new ChessGameUI(this);
        this.promotionManager = new PromotionManager(this);
        this.botManager = new BotManager(this);
        this.gameStatusManager = new GameStatusManager(this);
        
        console.log('♟️ ChessGameCore initialisé');
    }
    
    // Méthodes déléguées principales
    handleSquareClick = (displayRow, displayCol) => this.moveHandler.handleSquareClick(displayRow, displayCol);
    highlightPossibleMoves = () => this.moveHandler.highlightPossibleMoves();
    clearSelection = () => this.moveHandler.clearSelection();
    updateUI = () => {
        this.ui.updateUI();
        this.gameStatusManager.updateGameStatus();
    };

    handleMove(fromRow, fromCol, toRow, toCol) {
        if (!this.gameState.gameActive) {
            console.log('🚫 Jeu non actif');
            return false;
        }
        
        try {
            const success = this.moveHandler.executeDirectMove(fromRow, fromCol, toRow, toCol);
            
            if (success) {
                this.ui.updateUI();
                this.gameStatusManager.updateGameStatus();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Erreur handleMove:', error);
            return false;
        }
    }

    // FLIP SIMPLIFIÉ
    flipBoard() {
        console.log('🔄 ChessGameCore.flipBoard()');
        
        // Changer l'état dans gameState
        this.gameState.toggleFlip();
        
        // Sauvegarder la position actuelle
        const currentPosition = this.board.saveCurrentPosition();
        
        // Recréer le board
        this.board.createBoard();
        
        // Replacer les pièces
        Object.keys(currentPosition).forEach(key => {
            const [row, col] = key.split('-').map(Number);
            const square = this.board.getSquare(row, col);
            if (square) {
                this.board.placePiece(currentPosition[key], square);
            }
        });
        
        this.clearSelection();
        this.gameStatusManager.updateGameStatus();
        
        console.log('✅ Flip terminé, boardFlipped =', this.gameState.boardFlipped);
    }

    newGame() {
        console.log('Nouvelle partie via core');
        this.gameState.resetGame();
        this.clearSelection();
        this.loadInitialPosition();
        
        // Réactiver le bot si activé
        if (this.botManager.botLevel > 0) {
            console.log('🤖 Réactivation bot');
            this.botManager.setBotLevel(this.botManager.botLevel, this.botManager.botColor);
        }
        
        this.ui.resetTimers();
        this.updateUI();
    }

    loadInitialPosition() {
        this.board.createBoard();
        // Implémentation selon votre PieceManager
        console.log('🔧 Chargement position initiale');
    }

    // Délégation bot
    setBotLevel(level, color = 'black') {
        return this.botManager.setBotLevel(level, color);
    }

    getBotStatus() {
        return this.botManager.getBotStatus();
    }

    setBotColor(color) {
        this.botManager.setBotColor(color);
    }

    playBotMove() {
        return this.botManager.playBotMove();
    }
}

window.ChessGameCore = ChessGameCore;