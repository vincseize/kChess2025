// validators/move-executor.js
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
        } catch (error) { this.consoleLog = true; }
    }

    constructor(game) {
        this.game = game;
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
        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        if (!pieceElement) return;

        const isCapture = toSquare.piece !== null || move?.type === 'en-passant';

        if (this.constructor.consoleLog) {
            console.group(`🎯 Action : ${selectedPiece.piece.type} -> [${toRow},${toCol}] ${isCapture ? '(Capture)' : ''}`);
        }

        // 1. GESTION DU ROQUE
        if (move?.type === 'castling') {
            this.executeCastlingRookMove(move);
        }

        // 2. GESTION PRISE EN PASSANT (CORRECTION CRITIQUE)
        if (move?.type === 'en-passant') {
            // On supprime le pion capturé physiquement et logiquement
            const capRow = move.capturedPawn.row;
            const capCol = move.capturedPawn.col;
            this.clearSquare(capRow, capCol);
            
            if (this.constructor.consoleLog) {
                console.log(`🗡️ En Passant : Pion supprimé en [${capRow},${capCol}]`);
            }
        }

        // 3. TRANSFERT PHYSIQUE
        this.transferPieceElement(pieceElement, fromSquare, toSquare, selectedPiece.piece);
        
        // 4. MISE À JOUR DES DRAPEAUX
        this.updateMoveFlags(selectedPiece.piece, selectedPiece.row, selectedPiece.col, toRow, toCol);

        // 5. PROMOTION OU FINALISATION
        if (move?.isPromotion || this.checkManualPromotion(selectedPiece.piece, toRow)) {
            this.handlePromotion(toRow, toCol, selectedPiece, move, fromSquare, toSquare, pieceElement, isCapture);
        } else {
            this.finalizeMove(toRow, toCol, move, selectedPiece, isCapture);
        }

        if (this.constructor.consoleLog) console.groupEnd();
    }

    // Nouvelle méthode utilitaire pour nettoyer une case (DOM + Logique)
    clearSquare(row, col) {
        const square = this.game.board.getSquare(row, col);
        if (square) {
            square.piece = null;
            square.element.innerHTML = '';
        }
    }

    executeCastlingRookMove(move) {
        const rookFrom = move.rookFrom;
        const rookTo = move.rookTo;
        const fromSq = this.game.board.getSquare(rookFrom.row, rookFrom.col);
        const toSq = this.game.board.getSquare(rookTo.row, rookTo.col);
        const rookEl = fromSq.element.querySelector('.chess-piece');
        
        if (rookEl) {
            this.transferPieceElement(rookEl, fromSq, toSq, fromSq.piece);
            if (this.constructor.consoleLog) console.log("🏰 Tour déplacée pour le roque");
        }
    }

    transferPieceElement(pieceElement, fromSquare, toSquare, piece) {
        toSquare.element.innerHTML = ''; 
        toSquare.element.appendChild(pieceElement);
        toSquare.piece = piece;
        fromSquare.piece = null;
        fromSquare.element.innerHTML = ''; 
    }

    checkManualPromotion(piece, toRow) {
        return piece.type === 'pawn' && (toRow === 0 || toRow === 7);
    }

    handlePromotion(toRow, toCol, selectedPiece, move, fromSquare, toSquare, pieceElement, isCapture) {
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

    finalizeMove(toRow, toCol, move, selectedPiece, isCapture) {
        // Mise à jour de la cible En Passant dans le Validator (pour le prochain tour)
        if (this.game.moveValidator && typeof this.game.moveValidator.updateEnPassantTarget === 'function') {
            this.game.moveValidator.updateEnPassantTarget(
                { 
                    row: toRow, col: toCol,
                    from: { row: selectedPiece.row, col: selectedPiece.col },
                    isDoublePush: move?.isDoublePush || false
                },
                selectedPiece.piece
            );
        }

        this.game.gameState.recordMove(
            selectedPiece.row, selectedPiece.col, 
            toRow, toCol, 
            selectedPiece.piece,
            null,
            move?.type,
            isCapture
        );

        this.completeTurn();
    }

    finalizePromotion(toRow, toCol, type, move, selectedPiece, isCapture) {
        const toSquare = this.game.board.getSquare(toRow, toCol);
        const promotedPiece = { type: type, color: selectedPiece.piece.color };
        
        toSquare.piece = promotedPiece;
        toSquare.element.innerHTML = '';
        toSquare.element.appendChild(this.createPieceElement(promotedPiece));

        this.game.gameState.recordMove(
            selectedPiece.row, selectedPiece.col, 
            toRow, toCol, 
            selectedPiece.piece, 
            type,
            move?.type,
            isCapture
        );

        this.completeTurn();
    }

    undoMoveVisual(fromSquare, toSquare, pieceElement, selectedPiece) {
        toSquare.element.innerHTML = '';
        toSquare.piece = null;
        fromSquare.element.appendChild(pieceElement);
        fromSquare.piece = selectedPiece.piece;
        this.game.clearSelection();
    }

    completeTurn() {
        this.game.gameState.switchPlayer();
        if (this.game.clearSelection) this.game.clearSelection();
        if (this.game.updateUI) this.game.updateUI();
    }

    updateMoveFlags(piece, fromRow, fromCol, toRow, toCol) {
        const state = this.game.gameState;
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
        
        if (toRow === 0 || toRow === 7) {
            const opponentColor = color === 'white' ? 'black' : 'white';
            const rookRow = opponentColor === 'white' ? 7 : 0;
            if (toRow === rookRow) {
                if (toCol === 0) state.hasRookMoved[opponentColor].queenside = true;
                if (toCol === 7) state.hasRookMoved[opponentColor].kingside = true;
            }
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
        
        el.appendChild(img);
        return el;
    }
}

MoveExecutor.init();
window.MoveExecutor = MoveExecutor;
}