// chess-game-move-handler.js - Gestion des mouvements et sélections
class ChessGameMoveHandler {
    constructor(game) {
        this.game = game;
        this.isPromoting = false;
    }

    handleSquareClick(displayRow, displayCol) {
        if (!this.game.gameState.gameActive || this.isPromoting) return;
        
        const { actualRow, actualCol } = this.game.board.getActualCoordinates(displayRow, displayCol);
        const square = this.game.board.getSquare(actualRow, actualCol);
        if (!square) return;

        if (this.game.selectedPiece) {
            this.handlePieceMovement(actualRow, actualCol, square);
        } else {
            this.handlePieceSelection(actualRow, actualCol, square);
        }
    }

    handlePieceSelection(row, col, square) {
        if (square.piece && square.piece.color === this.game.gameState.currentPlayer) {
            this.game.clearSelection();
            square.element.classList.add('selected');
            this.game.selectedPiece = { row, col, piece: square.piece };
            this.game.possibleMoves = this.game.moveValidator.getPossibleMoves(square.piece, row, col);
            this.game.highlightPossibleMoves();
        }
    }

    handlePieceMovement(toRow, toCol, toSquare) {
        const isPossibleMove = this.game.possibleMoves.some(move => 
            move.row === toRow && move.col === toCol
        );

        if (isPossibleMove) {
            this.executeMove(toRow, toCol);
        } else {
            this.game.clearSelection();
            this.handlePieceSelection(toRow, toCol, toSquare);
        }
    }

    executeMove(toRow, toCol) {
        if (this.isPromoting || !this.game.selectedPiece) return;
        
        // Sauvegarder les informations de la pièce sélectionnée AVANT toute opération
        const selectedPiece = { ...this.game.selectedPiece };
        const fromSquare = this.game.board.getSquare(selectedPiece.row, selectedPiece.col);
        const toSquare = this.game.board.getSquare(toRow, toCol);

        if (!fromSquare || !toSquare) return;

        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        if (!pieceElement) return;
        
        const move = this.game.possibleMoves.find(m => m.row === toRow && m.col === toCol);
        
        // Gestion de la prise en passant
        if (move && move.type === 'en-passant') {
            console.log('🎯 Exécution d\'une prise en passant');
            this.game.moveValidator.executeEnPassant(move);
            
            toSquare.element.innerHTML = '';
            toSquare.element.appendChild(pieceElement);
            toSquare.piece = selectedPiece.piece;
            fromSquare.piece = null;
            
            this.finalizeNormalMove(toRow, toCol, move, selectedPiece);
            return;
        }

        // Déplacer la pièce
        toSquare.element.innerHTML = '';
        toSquare.element.appendChild(pieceElement);
        toSquare.piece = selectedPiece.piece;
        fromSquare.piece = null;

        // Vérifier la promotion
        if (move && this.game.promotionManager.checkPromotion(move, selectedPiece.piece)) {
            this.isPromoting = true;
            this.game.clearSelection();
            
            this.game.promotionManager.handlePromotion(
                toRow, 
                toCol, 
                selectedPiece.piece.color,
                (promotedPieceType) => {
                    if (promotedPieceType) {
                        console.log(`♟️ Promotion en ${promotedPieceType}`);
                        this.finalizeMoveAfterPromotion(toRow, toCol, promotedPieceType, move, selectedPiece);
                    } else {
                        this.undoPromotionMove(fromSquare, toSquare, pieceElement, selectedPiece);
                    }
                    this.isPromoting = false;
                }
            );
            return;
        }
        
        // Générer le FEN actuel du plateau
        const currentFEN = FENGenerator.generateFEN(this.game.gameState, this.game.board);
        console.log('🔍 FEN généré:', currentFEN);
        const game = new ChessEngine(currentFEN);
        const isKingInCheck = game.isCheck();
        console.log('🔍 Échec après déplacement:', isKingInCheck);

        this.finalizeNormalMove(toRow, toCol, move, selectedPiece);
    }

    finalizeMoveAfterPromotion(toRow, toCol, promotedPieceType, move, selectedPiece) {
        const toSquare = this.game.board.getSquare(toRow, toCol);
        if (!toSquare) return;
        
        // Créer l'objet pièce
        const newPiece = {
            type: promotedPieceType,
            color: selectedPiece.piece.color
        };
        
        toSquare.piece = newPiece;
        
        // Créer l'élément pièce avec image
        toSquare.element.innerHTML = '';
        const newPieceElement = this.createPieceElement(newPiece);
        toSquare.element.appendChild(newPieceElement);

        this.game.gameState.recordMove(
            selectedPiece.row, 
            selectedPiece.col, 
            toRow, 
            toCol,
            selectedPiece.piece,
            promotedPieceType
        );

        this.game.gameState.switchPlayer();
        this.game.clearSelection();
        this.game.updateUI();
    }

    finalizeNormalMove(toRow, toCol, move, selectedPiece) {
        if (move) {
            this.game.moveValidator.updateEnPassantTarget(
                { 
                    from: { row: selectedPiece.row, col: selectedPiece.col },
                    to: { row: toRow, col: toCol },
                    isDoublePush: move.isDoublePush
                },
                selectedPiece.piece
            );
        }

        this.game.gameState.recordMove(
            selectedPiece.row, 
            selectedPiece.col, 
            toRow, 
            toCol,
            selectedPiece.piece
        );

        this.game.gameState.switchPlayer();
        this.game.clearSelection();
        this.game.updateUI();
    }

    // Méthode pour créer un élément pièce AVEC IMAGE
    createPieceElement(piece) {
        const pieceElement = document.createElement('div');
        pieceElement.className = `chess-piece ${piece.color}`;
        
        const prefix = piece.color === 'white' ? 'w' : 'b';
        const pieceCodes = {
            'king': 'K',
            'queen': 'Q',
            'rook': 'R',
            'bishop': 'B',
            'knight': 'N',
            'pawn': 'P'
        };
        
        const img = document.createElement('img');
        img.src = `img/chesspieces/wikipedia/${prefix}${pieceCodes[piece.type]}.png`;
        img.alt = `${piece.type} ${piece.color}`;
        img.className = 'chess-piece-img';
        
        pieceElement.appendChild(img);
        pieceElement.setAttribute('data-piece', piece.type);
        pieceElement.setAttribute('data-color', piece.color);
        
        return pieceElement;
    }

    undoPromotionMove(fromSquare, toSquare, pieceElement, selectedPiece) {
        toSquare.element.innerHTML = '';
        toSquare.piece = null;
        
        fromSquare.element.appendChild(pieceElement);
        fromSquare.piece = selectedPiece.piece;
        
        this.game.clearSelection();
        console.log('❌ Promotion annulée');
    }

    highlightPossibleMoves() {
        this.game.board.squares.forEach(square => {
            square.element.classList.remove('possible-move', 'possible-capture', 'possible-en-passant');
        });
        
        this.game.possibleMoves.forEach(move => {
            const square = this.game.board.getSquare(move.row, move.col);
            if (square) {
                if (move.type === 'en-passant') {
                    square.element.classList.add('possible-en-passant');
                } else if (move.type === 'capture') {
                    square.element.classList.add('possible-capture');
                } else {
                    square.element.classList.add('possible-move');
                }
            }
        });
    }

    clearSelection() {
        this.game.board.squares.forEach(square => {
            square.element.classList.remove('selected', 'possible-move', 'possible-capture', 'possible-en-passant');
        });
        this.game.selectedPiece = null;
        this.game.possibleMoves = [];
    }
}

window.ChessGameMoveHandler = ChessGameMoveHandler;