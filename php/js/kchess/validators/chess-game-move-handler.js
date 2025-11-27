// chess-game-move-handler.js - Gestion des mouvements et sélections AVEC ROQUE
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
            
            console.log(`🎯 Pièce sélectionnée: ${square.piece.type} ${square.piece.color} en [${row},${col}]`);
            console.log(`🎯 Mouvements possibles:`, this.game.possibleMoves);
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
            // Resélectionner si on clique sur une autre pièce de la même couleur
            if (toSquare.piece && toSquare.piece.color === this.game.gameState.currentPlayer) {
                this.handlePieceSelection(toRow, toCol, toSquare);
            }
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
        
        console.log(`🚀 Exécution du mouvement:`, move);

        // CORRECTION: Mise à jour gameState AVANT le mouvement
        this.updateGameStateForMove(selectedPiece.piece, selectedPiece.row, selectedPiece.col, toRow, toCol);

        // Gestion du ROQUE
        if (move && move.special === 'castle') {
            console.log(`🏰 Exécution d'un roque: ${move.type}`);
            this.executeCastle(move, selectedPiece.piece, selectedPiece.row, selectedPiece.col);
            this.finalizeCastleMove(move, selectedPiece);
            return;
        }

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

        // Déplacer la pièce normalement
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
        
        this.finalizeNormalMove(toRow, toCol, move, selectedPiece);
    }

    // NOUVELLE MÉTHODE: Mise à jour de gameState pour les mouvements
    updateGameStateForMove(piece, fromRow, fromCol, toRow, toCol) {
        console.log(`🔧 Mise à jour gameState pour ${piece.type} ${piece.color}`);
        
        // Initialiser gameState si nécessaire
        if (!this.game.gameState.hasKingMoved) {
            this.game.gameState.hasKingMoved = { white: false, black: false };
            console.log(`🔧 Initialisation de hasKingMoved`);
        }
        
        if (!this.game.gameState.hasRookMoved) {
            this.game.gameState.hasRookMoved = {
                white: { kingside: false, queenside: false },
                black: { kingside: false, queenside: false }
            };
            console.log(`🔧 Initialisation de hasRookMoved`);
        }

        // Marquer le roi comme ayant bougé
        if (piece.type === 'king') {
            console.log(`♔ Mise à jour gameState: roi ${piece.color} a bougé de [${fromRow},${fromCol}] vers [${toRow},${toCol}]`);
            this.game.gameState.hasKingMoved[piece.color] = true;
            
            // Debug
            console.log(`♔ gameState.hasKingMoved après mouvement:`, this.game.gameState.hasKingMoved);
        }
        
        // Marquer les tours comme ayant bougé
        if (piece.type === 'rook') {
            console.log(`♜ Mise à jour gameState: tour ${piece.color} a bougé de [${fromRow},${fromCol}]`);
            
            const rookState = this.game.gameState.hasRookMoved[piece.color];
            
            // Vérifier si c'est la tour côté roi (colonne 7)
            if (fromCol === 7) {
                rookState.kingside = true;
                console.log(`♜ Tour côté roi ${piece.color} marquée comme ayant bougé`);
            } 
            // Vérifier si c'est la tour côté dame (colonne 0)
            else if (fromCol === 0) {
                rookState.queenside = true;
                console.log(`♜ Tour côté dame ${piece.color} marquée comme ayant bougé`);
            }
            
            console.log(`♜ gameState.hasRookMoved après mouvement:`, this.game.gameState.hasRookMoved);
        }
    }

    // EXÉCUTION DU ROQUE
    executeCastle(move, king, fromRow, fromCol) {
        const color = king.color;
        const row = color === 'white' ? 7 : 0;
        
        console.log(`🏰 Roque ${move.type} pour ${color} sur rangée ${row}`);

        if (move.type === 'castle-kingside') {
            // Déplacer le roi de e1 à g1 (ou e8 à g8)
            this.movePiece(fromRow, fromCol, row, 6);
            
            // Déplacer la tour de h1 à f1 (ou h8 à f8)
            this.movePiece(row, 7, row, 5);
            
        } else if (move.type === 'castle-queenside') {
            // Déplacer le roi de e1 à c1 (ou e8 à c8)
            this.movePiece(fromRow, fromCol, row, 2);
            
            // Déplacer la tour de a1 à d1 (ou a8 à d8)
            this.movePiece(row, 0, row, 3);
        }
        
        console.log(`🏰 Roque ${move.type} exécuté avec succès`);
    }

    // Méthode utilitaire pour déplacer une pièce
    movePiece(fromRow, fromCol, toRow, toCol) {
        const fromSquare = this.game.board.getSquare(fromRow, fromCol);
        const toSquare = this.game.board.getSquare(toRow, toCol);
        
        if (!fromSquare || !toSquare || !fromSquare.piece) {
            console.error('❌ Impossible de déplacer la pièce pour le roque');
            return;
        }

        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        if (!pieceElement) return;

        toSquare.element.innerHTML = '';
        toSquare.element.appendChild(pieceElement);
        toSquare.piece = fromSquare.piece;
        fromSquare.piece = null;
        
        console.log(`➡️ Pièce déplacée de [${fromRow},${fromCol}] vers [${toRow},${toCol}]`);
    }

    // FINALISATION DU ROQUE
    finalizeCastleMove(move, selectedPiece) {
        console.log(`🏰 Finalisation du roque ${move.type}`);
        
        this.game.gameState.recordMove(
            selectedPiece.row, 
            selectedPiece.col, 
            move.row, 
            move.col,
            selectedPiece.piece,
            null,
            move.type // Spécifier que c'est un roque
        );

        // CORRECTION: Marquer explicitement que le roi a bougé
        if (!this.game.gameState.hasKingMoved) {
            this.game.gameState.hasKingMoved = { white: false, black: false };
        }
        this.game.gameState.hasKingMoved[selectedPiece.piece.color] = true;
        console.log(`♔ Roi ${selectedPiece.piece.color} a bougé - roques désactivés`);

        this.game.gameState.switchPlayer();
        this.game.clearSelection();
        this.game.updateUI();
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
        console.log('✅ Mouvement normal finalisé');
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

        // CORRECTION: La mise à jour des droits de roque se fait maintenant dans updateGameStateForMove
        // Cette méthode est conservée pour la compatibilité
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

    // Mettre à jour les droits de roque (méthode existante conservée)
    updateCastlingRights(selectedPiece, toRow, toCol) {
        const piece = selectedPiece.piece;
        const color = piece.color;

        // Si le roi bouge, perdre tous les droits de roque
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
            console.log(`♔ Roi ${color} a bougé - roques désactivés`);
        }

        // Si une tour bouge, perdre le droit de roque de ce côté
        if (piece.type === 'rook') {
            const startRow = color === 'white' ? 7 : 0;
            
            // Tour côté roi (colonne 7/h)
            if (selectedPiece.col === 7 && selectedPiece.row === startRow) {
                if (!this.game.gameState.castlingRights[color]) {
                    this.game.gameState.castlingRights[color] = {
                        kingside: true,
                        queenside: true
                    };
                }
                this.game.gameState.castlingRights[color].kingside = false;
                console.log(`🏰 Tour côté roi ${color} a bougé - roque côté roi désactivé`);
            }
            
            // Tour côté dame (colonne 0/a)
            if (selectedPiece.col === 0 && selectedPiece.row === startRow) {
                if (!this.game.gameState.castlingRights[color]) {
                    this.game.gameState.castlingRights[color] = {
                        kingside: true,
                        queenside: true
                    };
                }
                this.game.gameState.castlingRights[color].queenside = false;
                console.log(`🏰 Tour côté dame ${color} a bougé - roque côté dame désactivé`);
            }
        }
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
        // Réinitialiser tous les styles
        this.game.board.squares.forEach(square => {
            square.element.classList.remove(
                'possible-move', 
                'possible-capture', 
                'possible-en-passant', 
                'possible-castle'
            );
        });
        
        // Appliquer les styles selon le type de mouvement
        this.game.possibleMoves.forEach(move => {
            const square = this.game.board.getSquare(move.row, move.col);
            if (square) {
                if (move.special === 'castle') {
                    square.element.classList.add('possible-castle');
                    console.log(`🏰 Case de roque highlightée: [${move.row},${move.col}]`);
                } else if (move.type === 'en-passant') {
                    square.element.classList.add('possible-en-passant');
                } else if (move.type === 'capture') {
                    square.element.classList.add('possible-capture');
                } else {
                    square.element.classList.add('possible-move');
                }
            }
        });
        
        console.log(`🎯 ${this.game.possibleMoves.length} mouvements highlightés`);
    }

    clearSelection() {

        // console.clear();

        this.game.board.squares.forEach(square => {
            square.element.classList.remove(
                'selected', 
                'possible-move', 
                'possible-capture', 
                'possible-en-passant', 
                'possible-castle'
            );
        });
        this.game.selectedPiece = null;
        this.game.possibleMoves = [];
        
        console.log('🧹 Sélection effacée');
    }
}

window.ChessGameMoveHandler = ChessGameMoveHandler;