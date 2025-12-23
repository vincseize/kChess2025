/**
 * core/chess-game-core.js
 * Classe principale orchestratrice (Version 1.4.6 - Stable Flip & No-Reset)
 */

class ChessGameCore {
    
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('🎮 core/chess-game-core.js chargé');
        }
    }
    
    static loadConfig() {
        try {
            if (window.appConfig?.debug) {
                const configValue = window.appConfig.debug.console_log;
                this.consoleLog = (configValue === "false" || configValue === false) ? false : true;
            }
        } catch (error) {
            console.error('❌ ChessGameCore: Erreur config:', error);
            this.consoleLog = true;
        }
    }

    constructor(board, gameState, moveValidator) {
        this.board = board;
        this.gameState = gameState;
        this.moveValidator = moveValidator;
        
        this.selectedPiece = null;
        this.possibleMoves = [];
        
        this.moveHandler = new ChessGameMoveHandler(this);
        this.ui = new ChessGameUI(this);
        this.promotionManager = new PromotionManager(this);
        this.botManager = new BotManager(this);
        this.gameStatusManager = new GameStatusManager(this);
        
        if (this.constructor.consoleLog) {
            console.group('🏁 [ChessGameCore] Initialisation');
            console.log('• Modules liés : MoveHandler, UI, Promotion, Bot, Status');
            console.groupEnd();
        }
    }
    
    handleSquareClick(displayRow, displayCol) {
        if (!this.gameState || !this.gameState.gameActive) return;
        if (this.moveHandler) this.moveHandler.handleSquareClick(displayRow, displayCol);
    }
    
    clearSelection() {
        this.selectedPiece = null;
        this.possibleMoves = [];
        if (this.moveHandler?.moveStateManager) {
            this.moveHandler.moveStateManager.clearSelection();
        }
    }

    /**
     * Retourne le plateau sans affecter la logique de jeu (Triple répétition, Pat, etc.)
     */
    flipBoard() {
        if (this.constructor.consoleLog) console.log('🔄 [ChessGameCore] Exécution du Flip Visuel');
        
        if (!this.gameState || !this.board) return;

        // 1. On inverse l'état logique du flip
        this.gameState.boardFlipped = !this.gameState.boardFlipped;
        
        // 2. On sauvegarde les pièces par coordonnées
        const currentPieces = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const sq = this.board.getSquare(r, c);
                if (sq && sq.piece) {
                    currentPieces.push({ piece: sq.piece, row: r, col: c });
                }
            }
        }

        // 3. Reconstruction visuelle (Détruit et recrée les <div>)
        if (typeof this.board.createBoard === 'function') {
            this.board.createBoard();
            
            // 4. On replace les pièces sans déclencher d'événements de mouvement
            currentPieces.forEach(item => {
                const newSq = this.board.getSquare(item.row, item.col);
                if (newSq) {
                    this.board.placePiece(item.piece, newSq);
                }
            });
        }
        
        this.clearSelection();
        
        // 5. Mise à jour UI sans recalculer l'analyse de fin de partie
        if (this.ui?.updateUI) this.ui.updateUI();

        if (this.constructor.consoleLog) console.log('🔄 [ChessGameCore] Flip terminé (Visuel uniquement)');
    }
    
    updateUI() {
        // Rendu des pièces
        if (this.ui?.updateUI) this.ui.updateUI();

        // Analyse du statut de la partie (Echec, Mat, Pat, Répétition)
        const statusManager = window._gameStatusManager || this.gameStatusManager;
        if (statusManager && typeof statusManager.updateGameStatus === 'function') {
            statusManager.updateGameStatus();
        }
    }

    handleMove(fromRow, fromCol, toRow, toCol) {
        try {
            if (!this.gameState?.gameActive) return false;
            const fromSq = this.board.getSquare(fromRow, fromCol);
            const toSq = this.board.getSquare(toRow, toCol);

            if (!fromSq?.piece) return false;
            this.movePiece(fromSq, toSq);
            return true;
        } catch (error) {
            return false;
        }
    }

    movePiece(fromSquare, toSquare, promotionType = null) {
        const piece = fromSquare.piece;
        const capturedPiece = toSquare.piece;

        // 1. DATA
        toSquare.piece = piece;
        fromSquare.piece = null;
        piece.row = toSquare.row;
        piece.col = toSquare.col;
        piece.hasMoved = true;

        // 2. VISUEL
        fromSquare.element.innerHTML = ''; 
        toSquare.element.innerHTML = '';  
        this.board.placePiece(piece, toSquare);

        // 3. PROMOTION
        if (promotionType && this.promotionManager) {
            this.promotionManager.promotePawn(toSquare, promotionType);
        }

        // 4. HISTORIQUE
        this.updateHalfMoveClock(piece, capturedPiece);
        if (this.gameState?.recordMove) {
            this.gameState.recordMove(fromSquare.row, fromSquare.col, toSquare.row, toSquare.col, piece, capturedPiece);
        }

        // 5. CHANGEMENT DE TOUR
        if (typeof this.gameState?.switchPlayer === 'function') {
            this.gameState.switchPlayer();
        } else {
            this.gameState.currentPlayer = (this.gameState.currentPlayer === 'white') ? 'black' : 'white';
        }
        
        this.clearSelection();
        this.updateUI();
    }

    updateHalfMoveClock(piece, captured) {
        if (!this.gameState) return;
        if (captured || piece.type === 'pawn') {
            this.gameState.halfMoveClock = 0;
        } else {
            this.gameState.halfMoveClock++;
        }
    }

    newGame() {
        if (this.gameState) {
            this.gameState.reset?.() || (this.gameState.gameActive = true);
            this.gameState.currentPlayer = 'white';
            this.gameState.moveHistory = [];
        }
        this.clearSelection();
        this.loadInitialPosition();
        this.updateUI();
    }

    loadInitialPosition() {
        if (this.board?.createBoard) this.board.createBoard();
    }

    playBotMove() { return this.botManager?.playBotMove(); }
    setBotLevel(l, c) { return this.botManager?.setBotLevel(l, c); }
}

ChessGameCore.init();