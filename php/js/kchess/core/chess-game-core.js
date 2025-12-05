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
    
    // ============================================
    // MÉTHODES DÉLÉGUÉES PRINCIPALES
    // ============================================
    handleSquareClick = (displayRow, displayCol) => this.moveHandler.handleSquareClick(displayRow, displayCol);
    highlightPossibleMoves = () => this.moveHandler.highlightPossibleMoves();
    clearSelection = () => this.moveHandler.clearSelection();
    
    updateUI = () => {
        if (this.ui && this.ui.updateUI) {
            this.ui.updateUI();
        }
        if (this.gameStatusManager && this.gameStatusManager.updateGameStatus) {
            this.gameStatusManager.updateGameStatus();
        }
    };

    // ============================================
    // GESTION DES MOUVEMENTS
    // ============================================
    handleMove(fromRow, fromCol, toRow, toCol) {
        // Ne pas bloquer si c'est le bot qui joue
        if (!this.gameState.gameActive) {
            console.log('🚫 Jeu non actif');
            return false;
        }
        
        // Permettre au bot de jouer même si isBotThinking est true
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

    // ============================================
    // MÉTHODE POUR METTRE À JOUR LE COMPTEUR DES 50 COUPS
    // ============================================
    updateHalfMoveClock(fromPiece, toPiece, toSquare) {
        if (toPiece || fromPiece.type === 'pawn') {
            this.gameState.halfMoveClock = 0;
            console.log(`🔄 HalfMoveClock réinitialisé à 0 (${toPiece ? 'capture' : 'mouvement pion'})`);
        } else {
            this.gameState.halfMoveClock++;
            console.log(`📈 HalfMoveClock incrémenté: ${this.gameState.halfMoveClock}`);
        }
    }

    // ============================================
    // MÉTHODE POUR DÉPLACER UNE PIÈCE
    // ============================================
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

    // ============================================
    // DÉLÉGATION DES MÉTHODES BOT
    // ============================================
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

    // ============================================
    // DÉLÉGATION DES MÉTHODES UI
    // ============================================
    showNotification(message, type = 'info') {
        if (this.gameStatusManager && this.gameStatusManager.showNotification) {
            this.gameStatusManager.showNotification(message, type);
        } else {
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
        }
    }

    // ============================================
    // MÉTHODE POUR TOURNER LE PLATEAU (SIMPLIFIÉE)
    // ============================================
    flipBoard() {
        console.log('🔄 Flip du plateau - ancien état:', this.gameState.boardFlipped);
        
        // Sauvegarder la position actuelle
        const currentPosition = this.board.saveCurrentPosition();
        
        // Inverser l'état du plateau
        this.gameState.boardFlipped = !this.gameState.boardFlipped;
        
        // Recréer le plateau
        this.board.createBoard();
        
        // Restaurer les pièces
        Object.keys(currentPosition).forEach(key => {
            const [row, col] = key.split('-').map(Number);
            const square = this.board.getSquare(row, col);
            if (square) {
                this.board.placePiece(currentPosition[key], square);
            }
        });
        
        // Effacer la sélection
        this.clearSelection();
        
        // Mettre à jour le statut du jeu
        if (this.gameStatusManager && this.gameStatusManager.updateGameStatus) {
            this.gameStatusManager.updateGameStatus();
        }
        
        console.log('🔄 Flip du plateau - nouvel état:', this.gameState.boardFlipped);
        
        // SIMPLE: Appeler la fonction globale pour mettre à jour les labels
        if (typeof window.updatePlayerLabels === 'function') {
            window.updatePlayerLabels();
        }
    }

    // ============================================
    // NOUVELLE PARTIE
    // ============================================
    newGame() {
        console.log('🔄 Nouvelle partie');
        
        // Réinitialiser l'état du jeu
        this.gameState.resetGame();
        
        // Effacer la sélection
        this.clearSelection();
        
        // Charger la position initiale
        this.loadInitialPosition();
        
        // Réactiver le bot si nécessaire
        if (this.botManager.botLevel > 0) {
            console.log('🤖 Réactivation du bot pour la nouvelle partie');
            this.botManager.setBotLevel(this.botManager.botLevel, this.botManager.botColor);
        }
        
        // Réinitialiser les timers
        if (this.ui && this.ui.resetTimers) {
            this.ui.resetTimers();
        }
        
        // Mettre à jour l'UI
        this.updateUI();
        
        // Mettre à jour les labels via la fonction globale
        setTimeout(() => {
            if (typeof window.updatePlayerLabels === 'function') {
                window.updatePlayerLabels();
                console.log('✅ Labels mis à jour après nouvelle partie');
            }
        }, 300);
    }

    // ============================================
    // CHARGEMENT DE LA POSITION INITIALE
    // ============================================
    loadInitialPosition() {
        this.board.createBoard();
        console.log('🔧 Plateau créé pour nouvelle partie');
        
        // Ici vous devez placer les pièces selon votre système
        // Exemple: this.board.setupInitialPieces();
    }

    // ============================================
    // MÉTHODE UTILITAIRE POUR DÉBOGAGE
    // ============================================
    getBoardInfo() {
        return {
            flipped: this.gameState.boardFlipped,
            currentPlayer: this.gameState.currentPlayer,
            gameActive: this.gameState.gameActive,
            botLevel: this.botManager.botLevel,
            botColor: this.botManager.botColor
        };
    }
}

// Exporter la classe
window.ChessGameCore = ChessGameCore;