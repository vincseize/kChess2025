// move-executor.js - Exécution physique des mouvements
class MoveExecutor {
    constructor(game) {
        this.game = game;
    }

    prepareMoveExecution(toRow, toCol) {
        const selectedPiece = { ...this.game.selectedPiece };
        const fromSquare = this.game.board.getSquare(selectedPiece.row, selectedPiece.col);
        const toSquare = this.game.board.getSquare(toRow, toCol);
        const move = this.game.possibleMoves.find(m => m.row === toRow && m.col === toCol);
        
        if (!fromSquare || !toSquare) {
            DeviceLogger.error('Cases source/destination non trouvées');
            return null;
        }

        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        if (!pieceElement) {
            DeviceLogger.error('Élément pièce non trouvé');
            return null;
        }
        
        return { selectedPiece, fromSquare, toSquare, move, pieceElement };
    }

    executeNormalMove(fromSquare, toSquare, selectedPiece, move, toRow, toCol) {
        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        this.transferPieceElement(pieceElement, fromSquare, toSquare, selectedPiece.piece);
        
        this.updateGameStateForMove(selectedPiece.piece, selectedPiece.row, selectedPiece.col, toRow, toCol);

        // Gestion promotion
        if (move && this.shouldPromote(move, selectedPiece.piece)) {
            this.handlePromotion(toRow, toCol, selectedPiece, move, fromSquare, toSquare, pieceElement);
            return;
        }
        
        this.finalizeNormalMove(toRow, toCol, move, selectedPiece);
    }

    transferPieceElement(pieceElement, fromSquare, toSquare, piece) {
        toSquare.element.innerHTML = '';
        toSquare.element.appendChild(pieceElement);
        toSquare.piece = piece;
        fromSquare.piece = null;
    }

    shouldPromote(move, piece) {
        return move && this.game.promotionManager.checkPromotion(move, piece);
    }

    handlePromotion(toRow, toCol, selectedPiece, move, fromSquare, toSquare, pieceElement) {
        this.game.moveHandler.isPromoting = true;
        this.game.clearSelection();
        
        this.game.promotionManager.handlePromotion(
            toRow, toCol, selectedPiece.piece.color,
            (promotedPieceType) => {
                if (promotedPieceType) {
                    this.finalizePromotion(toRow, toCol, promotedPieceType, move, selectedPiece);
                } else {
                    this.undoPromotionMove(fromSquare, toSquare, pieceElement, selectedPiece);
                }
                this.game.moveHandler.isPromoting = false;
            }
        );
    }

    finalizeNormalMove(toRow, toCol, move, selectedPiece) {
        DeviceLogger.log('Mouvement normal finalisé');
        
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

        this.updateCastlingRights(selectedPiece, toRow, toCol);

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

    finalizePromotion(toRow, toCol, promotedPieceType, move, selectedPiece) {
        const toSquare = this.game.board.getSquare(toRow, toCol);
        if (!toSquare) return;
        
        const newPiece = {
            type: promotedPieceType,
            color: selectedPiece.piece.color
        };
        
        toSquare.piece = newPiece;
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

    undoPromotionMove(fromSquare, toSquare, pieceElement, selectedPiece) {
        toSquare.element.innerHTML = '';
        toSquare.piece = null;
        
        fromSquare.element.appendChild(pieceElement);
        fromSquare.piece = selectedPiece.piece;
        
        this.game.clearSelection();
        DeviceLogger.log('Promotion annulée');
    }

    updateGameStateForMove(piece, fromRow, fromCol, toRow, toCol) {
        DeviceLogger.log(`Mise à jour gameState pour ${piece.type} ${piece.color}`);
        
        if (!this.game.gameState.hasKingMoved) {
            this.game.gameState.hasKingMoved = { white: false, black: false };
        }
        
        if (!this.game.gameState.hasRookMoved) {
            this.game.gameState.hasRookMoved = {
                white: { kingside: false, queenside: false },
                black: { kingside: false, queenside: false }
            };
        }

        if (piece.type === 'king') {
            DeviceLogger.log(`Roi ${piece.color} a bougé`);
            this.game.gameState.hasKingMoved[piece.color] = true;
        }
        
        if (piece.type === 'rook') {
            DeviceLogger.log(`Tour ${piece.color} a bougé`);
            
            const rookState = this.game.gameState.hasRookMoved[piece.color];
            
            if (fromCol === 7) {
                rookState.kingside = true;
                DeviceLogger.log(`Tour côté roi ${piece.color} marquée comme ayant bougé`);
            } else if (fromCol === 0) {
                rookState.queenside = true;
                DeviceLogger.log(`Tour côté dame ${piece.color} marquée comme ayant bougé`);
            }
        }
    }

    updateCastlingRights(selectedPiece, toRow, toCol) {
        const piece = selectedPiece.piece;
        const color = piece.color;

        if (piece.type === 'king') {
            if (!this.game.gameState.castlingRights[color]) {
                this.game.gameState.castlingRights[color] = {
                    kingside: false,
                    queenside: false
                };
            }
            this.game.gameState.castlingRights[color] = {
                kingside: false,
                queenside: false
            };
            DeviceLogger.log(`Roi ${color} a bougé - roques désactivés`);
        }

        if (piece.type === 'rook') {
            const startRow = color === 'white' ? 7 : 0;
            
            if (selectedPiece.col === 7 && selectedPiece.row === startRow) {
                if (!this.game.gameState.castlingRights[color]) {
                    this.game.gameState.castlingRights[color] = {
                        kingside: true,
                        queenside: true
                    };
                }
                this.game.gameState.castlingRights[color].kingside = false;
                DeviceLogger.log(`Tour côté roi ${color} a bougé - roque côté roi désactivé`);
            }
            
            if (selectedPiece.col === 0 && selectedPiece.row === startRow) {
                if (!this.game.gameState.castlingRights[color]) {
                    this.game.gameState.castlingRights[color] = {
                        kingside: true,
                        queenside: true
                    };
                }
                this.game.gameState.castlingRights[color].queenside = false;
                DeviceLogger.log(`Tour côté dame ${color} a bougé - roque côté dame désactivé`);
            }
        }
    }

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
}

window.MoveExecutor = MoveExecutor;