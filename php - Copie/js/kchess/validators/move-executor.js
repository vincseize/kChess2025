/**
 * validators/move-executor.js
 * Gère l'exécution physique et logique des mouvements sur le plateau.
 */
if (typeof MoveExecutor !== 'undefined') {
    console.warn('⚠️ MoveExecutor existe déjà.');
} else {

class MoveExecutor {
    
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('🚀 MoveExecutor: Moteur d\'exécution prêt');
        }
    }
    
    static loadConfig() {
        try {
            if (window.appConfig?.chess_engine) {
                this.consoleLog = window.appConfig.chess_engine.console_log ?? true;
            }
        } catch (error) { 
            this.consoleLog = true; 
        }
    }

    constructor(game) {
        this.game = game;
    }

    /**
     * Exécute un mouvement (Standard, Roque, En Passant, Promotion)
     */
    executeNormalMove(fromSquare, toSquare, selectedPiece, move, toRow, toCol) {
        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        if (!pieceElement) return;

        // On mémorise les coordonnées de départ avant le transfert
        const fromRow = selectedPiece.row;
        const fromCol = selectedPiece.col;

        const isCapture = toSquare.piece !== null || move?.type === 'en-passant';

        if (this.constructor.consoleLog) {
            console.group(`🎯 Action : ${selectedPiece.piece?.type || 'piece'} -> [${toRow},${toCol}]`);
        }

        // 1. GESTION DU ROQUE
        if (move?.type === 'castling' || move?.type === 'castle') {
            this.executeCastlingRookMove(move);
        }

        // 2. GESTION PRISE EN PASSANT
        if (move?.type === 'en-passant' && move.capturedPawn) {
            this.clearSquare(move.capturedPawn.row, move.capturedPawn.col);
        }

        // 3. TRANSFERT PHYSIQUE ET LOGIQUE
        this.transferPieceElement(pieceElement, fromSquare, toSquare, selectedPiece.piece);
        
        // 4. MISE À JOUR DES DROITS (Roque / Premier mouvement)
        this.updateMoveFlags(selectedPiece.piece, fromRow, fromCol, toRow, toCol);

        // --- AJOUT : MISE EN VALEUR DU DERNIER COUP ---
        // On le fait juste après le transfert visuel
        if (this.game.ui && this.game.ui.highlightLastMove) {
            this.game.ui.highlightLastMove(fromRow, fromCol, toRow, toCol);
        }

        // 5. GESTION DE LA PROMOTION
        if (move?.isPromotion || this.checkManualPromotion(selectedPiece.piece, toRow)) {
            this.handlePromotion(toRow, toCol, selectedPiece, move, fromSquare, toSquare, pieceElement, isCapture);
        } else {
            this.finalizeMove(toRow, toCol, move, selectedPiece, isCapture);
        }

        if (this.constructor.consoleLog) console.groupEnd();
    }

    /**
     * Nettoie proprement une case (logique + visuel)
     */
    clearSquare(row, col) {
        const square = this.game.board.getSquare(row, col);
        if (square) {
            square.piece = null;
            square.element.innerHTML = '';
        }
    }

    /**
     * Déplace la tour lors d'un roque
     */
    executeCastlingRookMove(move) {
        const rookFrom = move.rookFrom;
        const rookTo = move.rookTo;
        const fromSq = this.game.board.getSquare(rookFrom.row, rookFrom.col);
        const toSq = this.game.board.getSquare(rookTo.row, rookTo.col);
        
        if (!fromSq || !toSq) return;
        
        const rookEl = fromSq.element.querySelector('.chess-piece');
        if (rookEl) {
            this.transferPieceElement(rookEl, fromSq, toSq, fromSq.piece);
        }
    }

    /**
     * Déplace l'élément DOM et met à jour les données de la case
     */
    transferPieceElement(pieceElement, fromSquare, toSquare, piece) {
        toSquare.element.innerHTML = ''; 
        toSquare.element.appendChild(pieceElement);
        
        toSquare.piece = piece;
        fromSquare.piece = null;
        fromSquare.element.innerHTML = ''; 
    }

    checkManualPromotion(piece, toRow) {
        return piece?.type === 'pawn' && (toRow === 0 || toRow === 7);
    }

    /**
     * Ouvre l'interface de choix de promotion
     */
    handlePromotion(toRow, toCol, selectedPiece, move, fromSquare, toSquare, pieceElement, isCapture) {
        if (!this.game.promotionManager) {
            console.error("❌ PromotionManager manquant !");
            this.finalizeMove(toRow, toCol, move, selectedPiece, isCapture);
            return;
        }

        this.game.promotionManager.handlePromotion(
            toRow, toCol, selectedPiece.piece.color,
            (promotedType) => {
                if (promotedType) {
                    this.finalizePromotion(toRow, toCol, promotedType, move, selectedPiece, isCapture);
                } else {
                    this.undoMoveVisual(fromSquare, toSquare, pieceElement, selectedPiece);
                }
            }
        );
    }

    finalizePromotion(toRow, toCol, type, move, selectedPiece, isCapture) {
        const toSquare = this.game.board.getSquare(toRow, toCol);
        const promotedPiece = { type: type, color: selectedPiece.piece.color };
        
        toSquare.piece = promotedPiece;
        toSquare.element.innerHTML = '';
        toSquare.element.appendChild(this.createPieceElement(promotedPiece));

        if (this.game.gameState?.recordMove) {
            this.game.gameState.recordMove(
                selectedPiece.row, selectedPiece.col, 
                toRow, toCol, 
                selectedPiece.piece, 
                type,
                'promotion',
                isCapture
            );
        }

        this.completeTurn();
    }

    finalizeMove(toRow, toCol, move, selectedPiece, isCapture) {
        if (this.game.gameState?.recordMove) {
            this.game.gameState.recordMove(
                selectedPiece.row, selectedPiece.col, 
                toRow, toCol, 
                selectedPiece.piece,
                null,
                move?.type || 'move',
                isCapture
            );
        }

        this.completeTurn();
    }

    undoMoveVisual(fromSquare, toSquare, pieceElement, selectedPiece) {
        toSquare.element.innerHTML = '';
        toSquare.piece = null;
        fromSquare.element.appendChild(pieceElement);
        fromSquare.piece = selectedPiece.piece;
        
        // En cas d'annulation, on nettoie aussi les highlights
        if (this.game.clearSelection) this.game.clearSelection();
    }

    /**
     * Logique de fin de tour : Nettoyage et changement de joueur
     */
    completeTurn() {
        // 1. NETTOYAGE UI : Crucial pour faire disparaître les "points"
        if (this.game.clearSelection) {
            this.game.clearSelection();
        }
        
        // 2. Changement de joueur
        if (this.game.gameState?.switchPlayer) {
            this.game.gameState.switchPlayer();
        }
        
        // 3. Vérification de l'état final
        if (this.game.checkGameOver) {
            setTimeout(() => this.game.checkGameOver(), 100);
        }
    }

    updateMoveFlags(piece, fromRow, fromCol, toRow, toCol) {
        const state = this.game.gameState;
        if (!state) return;
        const color = piece.color;
        if (!state.hasKingMoved) state.hasKingMoved = { white: false, black: false };
        if (!state.hasRookMoved) state.hasRookMoved = { 
            white: { kingside: false, queenside: false }, 
            black: { kingside: false, queenside: false } 
        };
        if (piece.type === 'king') state.hasKingMoved[color] = true;
        if (piece.type === 'rook') {
            if (fromCol === 0) state.hasRookMoved[color].queenside = true;
            else if (fromCol === 7) state.hasRookMoved[color].kingside = true;
        }
        const opponentColor = color === 'white' ? 'black' : 'white';
        const opponentRookRow = opponentColor === 'white' ? 7 : 0;
        if (toRow === opponentRookRow) {
            if (toCol === 0) state.hasRookMoved[opponentColor].queenside = true;
            if (toCol === 7) state.hasRookMoved[opponentColor].kingside = true;
        }
    }

    createPieceElement(piece) {
        const el = document.createElement('div');
        el.className = `chess-piece ${piece.color}`;
        el.dataset.piece = piece.type;
        el.dataset.color = piece.color;
        const codes = { king:'K', queen:'Q', rook:'R', bishop:'B', knight:'N', pawn:'P' };
        const img = document.createElement('img');
        img.src = `img/chesspieces/wikipedia/${piece.color[0]}${codes[piece.type]}.png`;
        img.className = 'chess-piece-img';
        img.draggable = false;
        el.appendChild(img);
        return el;
    }
}

MoveExecutor.init();
window.MoveExecutor = MoveExecutor;

}