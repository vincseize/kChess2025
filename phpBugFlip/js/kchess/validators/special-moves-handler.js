// special-moves-handler.js - Gestion des mouvements spéciaux
class SpecialMovesHandler {
    constructor(game) {
        this.game = game;
    }

    handleSpecialMove(move, selectedPiece, fromSquare, toSquare, toRow, toCol) {
        if (!move) return false;

        if (move.special === 'castle') {
            this.executeCastleMove(move, selectedPiece);
            return true;
        }

        if (move.type === 'en-passant') {
            this.executeEnPassantMove(move, selectedPiece, fromSquare, toSquare, toRow, toCol);
            return true;
        }

        return false;
    }

    executeCastleMove(move, selectedPiece) {
        DeviceLogger.log(`Exécution roque: ${move.type}`);
        this.game.moveHandler.updateGameStateForMove(selectedPiece.piece, selectedPiece.row, selectedPiece.col, move.row, move.col);
        this.executeCastle(move, selectedPiece.piece, selectedPiece.row, selectedPiece.col);
        this.finalizeCastleMove(move, selectedPiece);
    }

    executeEnPassantMove(move, selectedPiece, fromSquare, toSquare, toRow, toCol) {
        DeviceLogger.log('Exécution prise en passant');
        this.game.moveValidator.executeEnPassant(move);
        
        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        this.transferPieceElement(pieceElement, fromSquare, toSquare, selectedPiece.piece);
        
        this.game.moveHandler.updateGameStateForMove(selectedPiece.piece, selectedPiece.row, selectedPiece.col, toRow, toCol);
        this.finalizeNormalMove(toRow, toCol, move, selectedPiece);
    }

    executeCastle(move, king, fromRow, fromCol) {
        const color = king.color;
        const row = color === 'white' ? 7 : 0;
        
        DeviceLogger.log(`Roque ${move.type} pour ${color} sur rangée ${row}`);

        if (move.type === 'castle-kingside') {
            this.movePiece(fromRow, fromCol, row, 6); // Roi e1→g1 / e8→g8
            this.movePiece(row, 7, row, 5);           // Tour h1→f1 / h8→f8
        } else if (move.type === 'castle-queenside') {
            this.movePiece(fromRow, fromCol, row, 2); // Roi e1→c1 / e8→c8
            this.movePiece(row, 0, row, 3);           // Tour a1→d1 / a8→d8
        }
        
        DeviceLogger.log(`Roque ${move.type} exécuté avec succès`);
    }

    movePiece(fromRow, fromCol, toRow, toCol) {
        const fromSquare = this.game.board.getSquare(fromRow, fromCol);
        const toSquare = this.game.board.getSquare(toRow, toCol);
        
        if (!fromSquare || !toSquare || !fromSquare.piece) {
            DeviceLogger.error('Impossible de déplacer la pièce pour le roque');
            return;
        }

        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        if (!pieceElement) return;

        toSquare.element.innerHTML = '';
        toSquare.element.appendChild(pieceElement);
        toSquare.piece = fromSquare.piece;
        fromSquare.piece = null;
        
        DeviceLogger.log(`Pièce déplacée de [${fromRow},${fromCol}] vers [${toRow},${toCol}]`);
    }

    finalizeCastleMove(move, selectedPiece) {
        DeviceLogger.log(`Finalisation du roque ${move.type}`);
        
        this.game.gameState.recordMove(
            selectedPiece.row, 
            selectedPiece.col, 
            move.row, 
            move.col,
            selectedPiece.piece,
            null,
            move.type
        );

        if (!this.game.gameState.hasKingMoved) {
            this.game.gameState.hasKingMoved = { white: false, black: false };
        }
        this.game.gameState.hasKingMoved[selectedPiece.piece.color] = true;
        DeviceLogger.log(`Roi ${selectedPiece.piece.color} a bougé - roques désactivés`);

        this.game.gameState.switchPlayer();
        this.game.clearSelection();
        this.game.updateUI();
    }

    transferPieceElement(pieceElement, fromSquare, toSquare, piece) {
        toSquare.element.innerHTML = '';
        toSquare.element.appendChild(pieceElement);
        toSquare.piece = piece;
        fromSquare.piece = null;
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
}

window.SpecialMovesHandler = SpecialMovesHandler;