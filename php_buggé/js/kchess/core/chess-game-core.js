/**
 * core/chess-game-core.js
 * Chef d'orchestre du moteur de jeu.
 */
class ChessGameCore {
    static consoleLog = true; 

    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log('🎮 core/chess-game-core.js chargé');
    }
    
    static loadConfig() {
        try {
            if (window.appConfig?.debug) {
                const configValue = window.appConfig.debug.console_log;
                this.consoleLog = (configValue === "false" || configValue === false) ? false : true;
            }
        } catch (error) { this.consoleLog = true; }
    }

    constructor(board, gameState, moveValidator) {
        this.board = board;
        this.gameState = gameState;
        this.moveValidator = moveValidator;
        
        this.selectedPiece = null;
        this.possibleMoves = [];
        
        this.ui = typeof ChessGameUI !== 'undefined' ? new ChessGameUI(this) : null;
        this.promotionManager = typeof PromotionManager !== 'undefined' ? new PromotionManager(this) : null;
        this.gameStatusManager = typeof GameStatusManager !== 'undefined' ? new GameStatusManager(this) : null;
        this.moveExecutor = typeof MoveExecutor !== 'undefined' ? new MoveExecutor(this) : null;
        this.moveHandler = typeof ChessGameMoveHandler !== 'undefined' ? new ChessGameMoveHandler(this) : null;
        this.botManager = typeof BotManager !== 'undefined' ? new BotManager(this) : null;

        if (this.constructor.consoleLog) console.log('✅ ChessGameCore: Architecture assemblée.');
    }
    
    handleSquareClick(row, col, isDirect = false) {
        if (!this.gameState?.gameActive) return;

        const isBotTurn = this.botManager?.isActive && 
                         (this.gameState.currentPlayer === this.botManager.botColor);
        
        if (isBotTurn && !isDirect) {
            console.warn("🚫 Action bloquée : C'est au tour de l'IA.");
            return; 
        }

        if (this.moveHandler) {
            this.moveHandler.handleSquareClick(row, col, isDirect);
        }
    }
    
    clearSelection() {
        this.selectedPiece = null;
        this.possibleMoves = [];
        
        if (this.moveHandler?.stateManager) {
            this.moveHandler.stateManager.clearSelection();
        } else if (this.ui?.clearHighlights) {
            this.ui.clearHighlights();
        }
    }

    updateUI() {
        if (this.ui?.updateUI) this.ui.updateUI();
        if (this.gameStatusManager?.updateGameStatus) {
            setTimeout(() => this.gameStatusManager.updateGameStatus(), 50);
        }

        if (this.constructor.consoleLog) {
            console.log(`🧩 [FEN] ${this.getFEN()}`);
        }
    }

    executeMove(fromRow, fromCol, toRow, toCol, promotionPiece = null) {
        if (!this.moveExecutor) return false;

        const piece = this.board.getPiece(fromRow, fromCol);
        if (!piece) return false;

        // 1. Détecter si c'est un mouvement de promotion
        const isPromotionMove = (piece.type === 'pawn' && (toRow === 0 || toRow === 7));

        // 2. Déplacer physiquement la pièce
        const success = this.moveExecutor.executeNormalMove(
            this.board.getSquare(fromRow, fromCol),
            this.board.getSquare(toRow, toCol),
            piece,
            { row: toRow, col: toCol, isPromotion: isPromotionMove },
            toRow, 
            toCol
        );

        if (success) {
            if (this.moveHandler?.stateManager) {
                this.moveHandler.stateManager.highlightLastMove(fromRow, fromCol, toRow, toCol);
            }

            // 3. Cas du BOT : Si une pièce de promotion est déjà spécifiée (ex: 'queen')
            // On transforme l'objet pièce AVANT d'enregistrer le coup
            if (isPromotionMove && promotionPiece) {
                piece.type = promotionPiece;
            }

            // 4. Enregistrer le coup dans l'historique
            this.gameState.recordMove(fromRow, fromCol, toRow, toCol, piece, promotionPiece);

            // 5. GESTION DU CHANGEMENT DE TOUR
            if (isPromotionMove && !promotionPiece) {
                // HUMAIN : On ne change pas le tour. On attend le clic sur la modal.
                if (this.constructor.consoleLog) console.log("⏳ Promotion humaine : Blocage du tour et ouverture modal.");
                
                // On met à jour l'UI pour voir le pion arriver sur la case
                if (this.ui?.updateUI) this.ui.updateUI();
                
                // On ouvre la modal
                if (this.promotionManager) {
                    this.promotionManager.showPromotionModal(toRow, toCol, piece.color);
                }
            } else {
                // NORMAL ou BOT : Le tour change normalement
                this.gameState.switchPlayer();
                this.updateUI(); 
            }

            return true;
        }
        return false;
    }

    checkBotTurn() {
        if (this.botManager?.isBotTurn()) {
            this.playBotMove();
        }
    }

    setBotLevel(level, color = 'black') {
        if (!this.botManager) return false;
        this.botManager.setBotLevel(level, color);
        return true;
    }

    playBotMove() {
        if (this.botManager && typeof this.botManager.playBotMove === 'function') {
            this.botManager.playBotMove();
        }
    }

    newGame() {
        this.clearSelection();
        document.querySelectorAll('.last-move-source, .last-move-dest').forEach(el => {
            el.classList.remove('last-move-source', 'last-move-dest');
        });

        if (this.botManager) this.botManager.isBotThinking = false;
        this.updateUI();
    }

    /**
     * Retourne le plateau (vue Noirs/Blancs)
     * Délègue maintenant à ChessBoard pour une gestion cohérente
     */
flipBoard() {
    if (!this.gameState || !this.board) return;

    // 1. Inverser l'état logique
    this.gameState.boardFlipped = !this.gameState.boardFlipped;
    const isFlipped = this.gameState.boardFlipped;

    // 2. SAUVEGARDE DES PIÈCES (Crucial pour ne pas avoir un plateau vide)
    const pieces = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = this.board.getPiece(r, c);
            if (p) pieces.push({ r, c, piece: p });
        }
    }

    // 3. RECONSTRUCTION DU PLATEAU
    // On bloque les événements automatiques pendant la reconstruction
    this.board.createBoard(); 

    // 4. RE-PLACEMENT IMMÉDIAT DES PIÈCES
    pieces.forEach(item => {
        const sq = this.board.getSquare(item.r, item.c);
        if (sq) this.board.placePiece(item.piece, sq);
    });

    // 5. APPLICATION DU CSS AVEC PRIORITÉ
    const applyCSS = () => {
        const boardEl = document.getElementById('chessBoard') || document.querySelector('.chess-board');
        if (boardEl) {
            boardEl.classList.toggle('flipped', isFlipped);
        }
    };

    applyCSS();
    // On répète après un court délai pour écraser les scripts comme GameStatusFix
    setTimeout(applyCSS, 100);

    this.updateUI();
    console.log("🔄 Flip stable validé. Pièces restaurées :", pieces.length);
}

    /**
     * Ancienne méthode conservée pour compatibilité
     */
    legacyFlipBoard() {
        this.gameState.boardFlipped = !this.gameState.boardFlipped;
        
        const pieces = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board.getPiece(r, c);
                if (p) pieces.push({ r, c, piece: p });
            }
        }

        this.board.createBoard();
        
        pieces.forEach(item => {
            const sq = this.board.getSquare(item.r, item.c);
            if (sq) this.board.placePiece(item.piece, sq);
        });

        if (this.gameState.boardFlipped) {
            this.reorderBoardDisplay();
        }
    }

    reorderBoardDisplay() {
        const boardElement = document.getElementById('chessBoard');
        if (!boardElement) return;
        
        const squares = Array.from(boardElement.querySelectorAll('.chess-square'));
        squares.reverse().forEach(square => {
            boardElement.appendChild(square);
        });
    }

    getFEN() {
        return (typeof FENGenerator !== 'undefined') ? FENGenerator.generate(this.board, this.gameState) : "FENGenerator introuvable";
    }
}

ChessGameCore.init();
window.ChessGameCore = ChessGameCore;