/**
 * validators/move-executor.js
 * Version 1.5.4 - Fix createPieceElement Missing Method
 */

if (typeof MoveExecutor !== 'undefined') {
    console.warn('⚠️ MoveExecutor existe déjà.');
} else {

class MoveExecutor {
    
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log('🚀 MoveExecutor: Moteur d\'exécution prêt');
    }
    
    static loadConfig() {
        try {
            const config = window.appConfig?.debug?.console_log ?? true;
            this.consoleLog = String(config) !== "false";
        } catch (error) { this.consoleLog = true; }
    }

    constructor(game) {
        this.game = game;
    }

    /**
     * CRÉATION VISUELLE DE LA PIÈCE (Correction de l'erreur)
     */
    createPieceElement(piece) {
        const img = document.createElement('img');
        const colorChar = piece.color[0].toLowerCase();
        const typeChar = this.getPieceLetter(piece.type);
        
        // On utilise le même chemin d'image que le reste du jeu
        img.src = `img/chesspieces/wikipedia/${colorChar}${typeChar}.png`;
        img.className = 'chess-piece chess-piece-img'; // Ajoutez vos classes CSS ici
        img.dataset.type = piece.type;
        img.dataset.color = piece.color;
        
        return img;
    }

    getPieceLetter(type) {
        const letters = { 'pawn': 'P', 'knight': 'N', 'bishop': 'B', 'rook': 'R', 'queen': 'Q', 'king': 'K' };
        return letters[type.toLowerCase()] || 'P';
    }

    prepareMoveExecution(toRow, toCol) {
        if (!this.game.selectedPiece) return null;
        const selectedPiece = { ...this.game.selectedPiece };
        const fromSquare = this.game.board.getSquare(selectedPiece.row, selectedPiece.col);
        const toSquare = this.game.board.getSquare(toRow, toCol);
        const move = this.game.possibleMoves ? 
            this.game.possibleMoves.find(m => m.row === toRow && m.col === toCol) : null;
        if (!fromSquare || !toSquare) return null;
        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        return { selectedPiece, fromSquare, toSquare, move, pieceElement };
    }

    executeNormalMove(fromSquare, toSquare, selectedPiece, move, toRow, toCol) {
        if (move?.type === 'castling' && this.game.gameState?.chess960) {
            return this.executeChess960Castle(selectedPiece, move);
        }

        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        if (!pieceElement) return;
        const isCapture = toSquare.piece !== null || move?.type === 'en-passant';

        if (this.constructor.consoleLog) console.group(`🎯 Action : ${selectedPiece.piece?.type} -> [${toRow},${toCol}]`);

        if (move?.type === 'castling' || move?.type === 'castle') this.executeCastlingRookMove(move);
        if (move?.type === 'en-passant' && move.capturedPawn) this.clearSquare(move.capturedPawn.row, move.capturedPawn.col);

        this.transferPieceElement(pieceElement, fromSquare, toSquare, selectedPiece.piece);
        this.updateMoveFlags(selectedPiece.piece, selectedPiece.row, selectedPiece.col, toRow, toCol);

        const isPromotion = move?.isPromotion || this.checkManualPromotion(selectedPiece.piece, toRow);
        if (isPromotion) {
            if (this.game.moveHandler) this.game.moveHandler.isPromoting = true;
            this.handlePromotion(toRow, toCol, selectedPiece, move, fromSquare, toSquare, pieceElement, isCapture);
        } else {
            this.finalizeMove(toRow, toCol, move, selectedPiece, isCapture);
        }
        if (this.constructor.consoleLog) console.groupEnd();
    }

    executeChess960Castle(selectedPiece, move) {
        const color = selectedPiece.piece.color;
        const row = selectedPiece.row;
        const board = this.game.board;
        const kingFrom = board.getSquare(row, selectedPiece.col);
        const rookFrom = board.getSquare(move.rookFrom.row, move.rookFrom.col);
        const kingTo = board.getSquare(move.kingTo.row, move.kingTo.col);
        const rookTo = board.getSquare(move.rookTo.row, move.rookTo.col);
        const king = kingFrom?.piece;
        const rook = rookFrom?.piece;

        if (!king || !rook || rook.type !== 'rook' || rook.color !== color || !kingTo || !rookTo) {
            console.error('Roque Chess960 impossible : pièces ou cases manquantes.');
            return false;
        }

        const affectedSquares = new Set([kingFrom, rookFrom, kingTo, rookTo]);
        affectedSquares.forEach(square => {
            square.piece = null;
            square.element.innerHTML = '';
        });

        king.row = move.kingTo.row;
        king.col = move.kingTo.col;
        king.hasMoved = true;
        rook.row = move.rookTo.row;
        rook.col = move.rookTo.col;
        rook.hasMoved = true;
        board.placePiece(king, kingTo);
        board.placePiece(rook, rookTo);

        const state = this.game.gameState;
        state.hasKingMoved[color] = true;
        state.hasRookMoved[color][move.side] = true;
        state.recordMove(
            selectedPiece.row,
            selectedPiece.col,
            move.kingTo.row,
            move.kingTo.col,
            king,
            null,
            'castling'
        );
        this.completeTurn();
        return true;
    }

    handlePromotion(toRow, toCol, selectedPiece, move, fromSquare, toSquare, pieceElement, isCapture) {
        const pm = this.game.promotionManager;
        if (!pm) {
            this.finalizePromotion(toRow, toCol, 'queen', move, selectedPiece, isCapture);
            return;
        }
        pm.showPromotionModal(toRow, toCol, selectedPiece.piece.color, (promotedType) => {
            if (promotedType) {
                this.finalizePromotion(toRow, toCol, promotedType, move, selectedPiece, isCapture);
            } else {
                if (this.game.moveHandler) this.game.moveHandler.isPromoting = false;
                this.undoMoveVisual(fromSquare, toSquare, pieceElement, selectedPiece);
            }
        });
    }

    finalizePromotion(row, col, pieceType, move, selectedPiece, isCapture) {
        const square = this.game.board.getSquare(row, col);
        const color = selectedPiece.piece.color;

        if (square) {
            square.piece.type = pieceType.toLowerCase();
            square.element.innerHTML = ''; 
            // APPEL DE LA MÉTHODE AJOUTÉE CI-DESSUS
            const newPieceEl = this.createPieceElement({
                type: pieceType.toLowerCase(),
                color: color
            });
            square.element.appendChild(newPieceEl);
        }

        if (this.game.gameState?.recordMove) {
            this.game.gameState.recordMove(
                selectedPiece.row, selectedPiece.col, row, col, 
                selectedPiece.piece, pieceType.toLowerCase(), 'promotion', isCapture
            );
        }

        if (this.game.moveHandler) this.game.moveHandler.isPromoting = false;
        this.completeTurn();
    }

    finalizeMove(toRow, toCol, move, selectedPiece, isCapture) {
        if (this.game.gameState?.recordMove) {
            this.game.gameState.recordMove(
                selectedPiece.row, selectedPiece.col, toRow, toCol, 
                selectedPiece.piece, null, move?.type || 'move', isCapture
            );
        }
        this.completeTurn();
    }

    completeTurn() {
        if (this.game.gameState?.switchPlayer) this.game.gameState.switchPlayer();
        if (this.game.clearSelection) this.game.clearSelection();
        if (this.game.updateUI) this.game.updateUI();
        if (this.game.checkBotTurn) this.game.checkBotTurn();
    }

    transferPieceElement(pieceElement, fromSquare, toSquare, piece) {
        toSquare.element.innerHTML = ''; 
        toSquare.element.appendChild(pieceElement);
        toSquare.piece = piece;
        fromSquare.piece = null;
        fromSquare.element.innerHTML = ''; 
    }

    clearSquare(row, col) {
        const square = this.game.board.getSquare(row, col);
        if (square) {
            square.piece = null;
            square.element.innerHTML = '';
        }
    }

    executeCastlingRookMove(move) {
        const fromSq = this.game.board.getSquare(move.rookFrom.row, move.rookFrom.col);
        const toSq = this.game.board.getSquare(move.rookTo.row, move.rookTo.col);
        if (fromSq && toSq) {
            const rookEl = fromSq.element.querySelector('.chess-piece');
            if (rookEl) this.transferPieceElement(rookEl, fromSq, toSq, fromSq.piece);
        }
    }

    undoMoveVisual(fromSquare, toSquare, pieceElement, selectedPiece) {
        toSquare.element.innerHTML = '';
        toSquare.piece = null;
        fromSquare.element.appendChild(pieceElement);
        fromSquare.piece = selectedPiece.piece;
        if (this.game.clearSelection) this.game.clearSelection();
    }

    checkManualPromotion(piece, toRow) {
        return piece?.type === 'pawn' && (toRow === 0 || toRow === 7);
    }

    updateMoveFlags(piece, fromRow, fromCol, toRow, toCol) {
        const state = this.game.gameState;
        if (!state) return;
        const color = piece.color;
        if (piece.type === 'king') state.hasKingMoved[color] = true;
        if (piece.type === 'rook') {
            const rookCols = state.rookStartCols?.[color];
            if (fromCol === (rookCols?.queenside ?? 0)) state.hasRookMoved[color].queenside = true;
            else if (fromCol === (rookCols?.kingside ?? 7)) state.hasRookMoved[color].kingside = true;
        }
    }
}

MoveExecutor.init();
window.MoveExecutor = MoveExecutor;
}