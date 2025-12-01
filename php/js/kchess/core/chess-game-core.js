// core/chess-game-core.js - Classe principale orchestratrice MODULAIRE
class ChessGameCore {
    constructor(board, gameState, moveValidator) {
        this.board = board;
        this.gameState = gameState;
        this.moveValidator = moveValidator;
        
        this.selectedPiece = null;
        this.possibleMoves = [];
        
        // Initialiser les managers modulaires
        this.moveHandler = new ChessGameMoveHandler(this);
        this.ui = new ChessGameUI(this);
        this.promotionManager = new PromotionManager(this);
        this.botManager = new BotManager(this);
        this.gameStatusManager = new GameStatusManager(this);
        
        console.log('♟️ ChessGameCore initialized with modular managers');
    }
    
    // Méthodes déléguées principales
    handleSquareClick = (displayRow, displayCol) => this.moveHandler.handleSquareClick(displayRow, displayCol);
    highlightPossibleMoves = () => this.moveHandler.highlightPossibleMoves();
    clearSelection = () => this.moveHandler.clearSelection();
    updateUI = () => {
        this.ui.updateUI();
        this.gameStatusManager.updateGameStatus();
    };

    // MODIFIER LA MÉTHODE handleMove pour inclure le bot
// Dans chess-game-core.js - CORRIGER handleMove
handleMove(fromRow, fromCol, toRow, toCol) {
    // CORRECTION : Ne pas bloquer si c'est le bot qui joue
    if (!this.gameState.gameActive) {
        console.log('🚫 Jeu non actif');
        return false;
    }
    
    // CORRECTION : Permettre au bot de jouer même si isBotThinking est true
    // (car c'est le bot lui-même qui appelle cette méthode)
    if (this.botManager.isBotThinking && this.gameState.currentPlayer !== this.botManager.botColor) {
        console.log('🚫 Bot en réflexion, attendez...');
        return false;
    }

    try {
        const success = this.moveHandler.executeDirectMove(fromRow, fromCol, toRow, toCol);
        
        if (success) {
            // Mettre à jour l'UI
            this.ui.updateUI();
            
            // Vérifier le statut du jeu
            this.gameStatusManager.updateGameStatus();
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Erreur dans handleMove:', error);
        return false;
    }
}

    // NOUVELLE MÉTHODE : Mettre à jour le compteur des 50 coups
    updateHalfMoveClock(fromPiece, toPiece, toSquare) {
        if (toPiece || fromPiece.type === 'pawn') {
            this.gameState.halfMoveClock = 0;
            console.log(`🔄 HalfMoveClock réinitialisé à 0 (${toPiece ? 'capture' : 'mouvement pion'})`);
        } else {
            this.gameState.halfMoveClock++;
            console.log(`📈 HalfMoveClock incrémenté: ${this.gameState.halfMoveClock}`);
        }
    }

    // MODIFIER cette méthode pour réinitialiser le halfMoveClock
    movePiece(fromSquare, toSquare, promotionType = null) {
        const fromPiece = fromSquare.piece;
        const toPiece = toSquare.piece;
        
        // Sauvegarder l'état avant le mouvement
        const previousFEN = FENGenerator.generateFEN(this.gameState, this.board);
        
        // Déplacer la pièce
        this.board.movePiece(fromSquare, toSquare);
        
        // Gérer la promotion
        if (promotionType) {
            this.promotionManager.promotePawn(toSquare, promotionType);
        }
        
        // Mettre à jour le compteur des 50 coups
        this.updateHalfMoveClock(fromPiece, toPiece, toSquare);
        
        // Sauvegarder le mouvement dans l'historique
        this.gameState.moveHistory.push({
            from: { row: fromSquare.row, col: fromSquare.col },
            to: { row: toSquare.row, col: toSquare.col },
            piece: fromPiece.type,
            color: fromPiece.color,
            captured: toPiece ? toPiece.type : null,
            fen: previousFEN
        });
        
        // Changer le tour
        this.gameState.currentTurn = this.gameState.currentTurn === 'white' ? 'black' : 'white';
        
        this.clearSelection();
        this.gameStatusManager.updateGameStatus();
    }

    // Délégation des méthodes bot
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

    // Délégation des méthodes UI
    showNotification(message, type = 'info') {
        this.gameStatusManager.showNotification(message, type);
    }

// chess-game-core.js - dans la classe ChessGameCore
// Dans chess-game-core.js - méthode flipBoard()
flipBoard() {
    console.log('flipBoard de chess-game-core.js appelé');
    console.log('Flip du plateau - ancien état:', this.gameState.boardFlipped);
    
    const currentPosition = this.board.saveCurrentPosition();
    this.gameState.boardFlipped = !this.gameState.boardFlipped;
    this.board.createBoard();
    
    Object.keys(currentPosition).forEach(key => {
        const [row, col] = key.split('-').map(Number);
        const square = this.board.getSquare(row, col);
        if (square) {
            this.board.placePiece(currentPosition[key], square);
        }
    });
    
    this.clearSelection();
    this.gameStatusManager.updateGameStatus();
    
    console.log('Flip du plateau - nouvel état:', this.gameState.boardFlipped);
    
    // 🔥 SUPPRIMER OU COMMENTER CETTE PARTIE :
    // setTimeout(() => {
    //     if (typeof window.flipPlayerSections === 'function') {
    //         window.flipPlayerSections();
    //         console.log('✅ Sections joueurs également flipées');
    //     }
    // }, 50);
}


    newGame() {
        console.log('Nouvelle partie');
        this.gameState.resetGame();
        this.clearSelection();
        this.loadInitialPosition();
        
        // Réactiver le bot si il était activé
        if (this.botManager.botLevel > 0) {
            console.log('🤖 Réactivation du bot pour la nouvelle partie');
            this.botManager.setBotLevel(this.botManager.botLevel, this.botManager.botColor);
        }
        
        this.ui.resetTimers();
        this.updateUI();
    }

    loadInitialPosition() {
        this.board.createBoard();
        // Cette méthode sera implémentée selon votre structure de pièces
        console.log('🔧 loadInitialPosition à implémenter selon votre PieceManager');
    }
}

window.ChessGameCore = ChessGameCore;