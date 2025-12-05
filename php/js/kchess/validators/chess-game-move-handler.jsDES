// chess-game-move-handler.js - Gestion des mouvements refactorisée
class ChessGameMoveHandler {
    constructor(game) {
        this.game = game;
        this.isPromoting = false;
    }

    // ========== MÉTHODES PRINCIPALES MUTUALISÉES ==========

    handleSquareClick(displayRow, displayCol) {
        DeviceLogger.log(`Click sur [display:${displayRow},${displayCol}]`);
        
        // VÉRIFICATIONS COMMUNES
        if (!this.validateGameState()) return;
        
        // CONVERSION COORDONNÉES
        const { actualRow, actualCol, square } = this.getActualSquare(displayRow, displayCol);
        if (!square) return;

        // LOG ÉTAT (commun)
        this.logCurrentState(square, actualRow, actualCol);

        // DÉLÉGATION AUX SOUS-MÉTHODES
        if (this.game.selectedPiece) {
            this.handleMovementPhase(actualRow, actualCol, square);
        } else {
            this.handleSelectionPhase(actualRow, actualCol, square);
        }
    }

    handlePieceSelection(row, col, square) {
        if (square.piece && square.piece.color === this.game.gameState.currentPlayer) {
            this.game.clearSelection();
            square.element.classList.add('selected');
            this.game.selectedPiece = { row, col, piece: square.piece };
            this.game.possibleMoves = this.game.moveValidator.getPossibleMoves(square.piece, row, col);
            this.game.highlightPossibleMoves();
            
            DeviceLogger.log(`Pièce sélectionnée: ${square.piece.type} ${square.piece.color} en [${row},${col}]`);
            DeviceLogger.debug('Mouvements possibles', this.game.possibleMoves);
        }
    }

    handlePieceMovement(toRow, toCol, toSquare) {
        DeviceLogger.log(`Tentative mouvement vers [${toRow},${toCol}]`);
        
        if (!this.game.selectedPiece) {
            DeviceLogger.error('Aucune pièce sélectionnée');
            return;
        }

        const isPossibleMove = this.isMovePossible(toRow, toCol);
        DeviceLogger.log(`Mouvement possible: ${isPossibleMove}`);

        if (isPossibleMove) {
            this.executeValidMove(toRow, toCol);
        } else {
            this.handleInvalidMove(toRow, toCol, toSquare);
        }
    }

    executeMove(toRow, toCol) {
        if (!this.validateMoveExecution()) return;
        
        const { selectedPiece, fromSquare, toSquare, move } = this.prepareMoveExecution(toRow, toCol);
        if (!this.validateMoveElements(selectedPiece, fromSquare, toSquare)) return;

        DeviceLogger.log(`Exécution mouvement`, move);

        // DÉLÉGATION AUX HANDLERS SPÉCIFIQUES
        if (this.handleSpecialMove(move, selectedPiece, fromSquare, toSquare, toRow, toCol)) {
            return; // Mouvement spécial traité
        }

        // MOUVEMENT NORMAL
        this.executeNormalMove(fromSquare, toSquare, selectedPiece, move, toRow, toCol);
    }

    executeDirectMove(fromRow, fromCol, toRow, toCol) {
        if (!this.game.gameState.gameActive || this.isPromoting) {
            DeviceLogger.log('Jeu non actif ou promotion en cours');
            return false;
        }
        
        const fromSquare = this.game.board.getSquare(fromRow, fromCol);
        const toSquare = this.game.board.getSquare(toRow, toCol);
        
        if (!fromSquare || !toSquare || !fromSquare.piece) {
            DeviceLogger.log('Cases ou pièce non valides');
            return false;
        }
        
        // Vérifier si le mouvement est valide
        const possibleMoves = this.game.moveValidator.getPossibleMoves(fromSquare.piece, fromRow, fromCol);
        const isValidMove = possibleMoves.some(move => move.row === toRow && move.col === toCol);
        
        if (!isValidMove) {
            DeviceLogger.log('Mouvement non valide');
            return false;
        }
        
        DeviceLogger.log(`Mouvement direct valide: [${fromRow},${fromCol}] -> [${toRow},${toCol}]`);
        
        // Sélectionner la pièce et exécuter le mouvement
        this.game.selectedPiece = { row: fromRow, col: fromCol, piece: fromSquare.piece };
        this.game.possibleMoves = possibleMoves;
        
        // Exécuter le mouvement
        this.executeMove(toRow, toCol);
        return true;
    }

    // ========== MÉTHODES EXTRACTED POUR MUTUALISATION ==========

    validateGameState() {
        if (!this.game.gameState.gameActive) {
            DeviceLogger.log('Jeu non actif');
            return false;
        }
        
        if (this.isPromoting) {
            DeviceLogger.log('Promotion en cours');
            return false;
        }
        
        return true;
    }

    getActualSquare(displayRow, displayCol) {
        const { actualRow, actualCol } = this.game.board.getActualCoordinates(displayRow, displayCol);
        DeviceLogger.log(`Coordonnées: display[${displayRow},${displayCol}] -> actual[${actualRow},${actualCol}]`);
        
        const square = this.game.board.getSquare(actualRow, actualCol);
        if (!square) {
            DeviceLogger.error('Case non trouvée');
        }
        
        return { actualRow, actualCol, square };
    }

    logCurrentState(square, row, col) {
        DeviceLogger.debug('État actuel', {
            selectedPiece: this.game.selectedPiece ? 
                `${this.game.selectedPiece.piece.color} ${this.game.selectedPiece.piece.type}` : 'aucune',
            currentPlayer: this.game.gameState.currentPlayer,
            pieceOnSquare: square.piece ? `${square.piece.color} ${square.piece.type}` : 'vide',
            isPromoting: this.isPromoting,
            coordinates: `[${row},${col}]`
        });
    }

    handleSelectionPhase(row, col, square) {
        DeviceLogger.log('Tentative de sélection...');
        this.handlePieceSelection(row, col, square);
    }

    handleMovementPhase(row, col, square) {
        DeviceLogger.log('Tentative de mouvement...');
        this.handlePieceMovement(row, col, square);
    }

    isMovePossible(toRow, toCol) {
        return this.game.possibleMoves.some(move => 
            move.row === toRow && move.col === toCol
        );
    }

    executeValidMove(toRow, toCol) {
        DeviceLogger.log('Mouvement valide - exécution...');
        this.executeMove(toRow, toCol);
    }

    handleInvalidMove(toRow, toCol, toSquare) {
        DeviceLogger.log('Mouvement non valide');
        
        // COMPORTEMENT DIFFÉRENCIÉ MOBILE/DESKTOP
        if (this.shouldReselectOnInvalid(toSquare)) {
            DeviceLogger.log('Resélection automatique');
            this.handlePieceSelection(toRow, toCol, toSquare);
        } else {
            DeviceLogger.log('Désélection simple');
            this.game.clearSelection();
        }
    }

    shouldReselectOnInvalid(toSquare) {
        // Sur mobile, on permet la resélection directe
        // Sur desktop, comportement plus strict
        return DeviceLogger.isMobile() && 
               toSquare.piece && 
               toSquare.piece.color === this.game.gameState.currentPlayer;
    }

    validateMoveExecution() {
        if (this.isPromoting || !this.game.selectedPiece) {
            DeviceLogger.log(`Bloqué: promoting=${this.isPromoting}, selected=${!!this.game.selectedPiece}`);
            return false;
        }
        return true;
    }

    prepareMoveExecution(toRow, toCol) {
        const selectedPiece = { ...this.game.selectedPiece };
        const fromSquare = this.game.board.getSquare(selectedPiece.row, selectedPiece.col);
        const toSquare = this.game.board.getSquare(toRow, toCol);
        const move = this.game.possibleMoves.find(m => m.row === toRow && m.col === toCol);
        
        return { selectedPiece, fromSquare, toSquare, move };
    }

    validateMoveElements(selectedPiece, fromSquare, toSquare) {
        if (!fromSquare || !toSquare) {
            DeviceLogger.error('Cases source/destination non trouvées');
            return false;
        }

        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        if (!pieceElement) {
            DeviceLogger.error('Élément pièce non trouvé');
            return false;
        }
        
        return true;
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
        this.updateGameStateForMove(selectedPiece.piece, selectedPiece.row, selectedPiece.col, move.row, move.col);
        this.executeCastle(move, selectedPiece.piece, selectedPiece.row, selectedPiece.col);
        this.finalizeCastleMove(move, selectedPiece);
    }

    executeEnPassantMove(move, selectedPiece, fromSquare, toSquare, toRow, toCol) {
        DeviceLogger.log('Exécution prise en passant');
        this.game.moveValidator.executeEnPassant(move);
        
        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        this.transferPieceElement(pieceElement, fromSquare, toSquare, selectedPiece.piece);
        
        this.updateGameStateForMove(selectedPiece.piece, selectedPiece.row, selectedPiece.col, toRow, toCol);
        this.finalizeNormalMove(toRow, toCol, move, selectedPiece);
    }

    executeNormalMove(fromSquare, toSquare, selectedPiece, move, toRow, toCol) {
        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        this.transferPieceElement(pieceElement, fromSquare, toSquare, selectedPiece.piece);
        
        this.updateGameStateForMove(selectedPiece.piece, selectedPiece.row, selectedPiece.col, toRow, toCol);

        // GESTION PROMOTION
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
        this.isPromoting = true;
        this.game.clearSelection();
        
        this.game.promotionManager.handlePromotion(
            toRow, toCol, selectedPiece.piece.color,
            (promotedPieceType) => {
                if (promotedPieceType) {
                    this.finalizePromotion(toRow, toCol, promotedPieceType, move, selectedPiece);
                } else {
                    this.undoPromotionMove(fromSquare, toSquare, pieceElement, selectedPiece);
                }
                this.isPromoting = false;
            }
        );
    }

    // ========== MÉTHODES EXISTANTES CONSERVÉES ==========

    updateGameStateForMove(piece, fromRow, fromCol, toRow, toCol) {
        DeviceLogger.log(`Mise à jour gameState pour ${piece.type} ${piece.color}`);
        
        // Initialiser gameState si nécessaire
        if (!this.game.gameState.hasKingMoved) {
            this.game.gameState.hasKingMoved = { white: false, black: false };
            DeviceLogger.log(`Initialisation de hasKingMoved`);
        }
        
        if (!this.game.gameState.hasRookMoved) {
            this.game.gameState.hasRookMoved = {
                white: { kingside: false, queenside: false },
                black: { kingside: false, queenside: false }
            };
            DeviceLogger.log(`Initialisation de hasRookMoved`);
        }

        // Marquer le roi comme ayant bougé
        if (piece.type === 'king') {
            DeviceLogger.log(`Roi ${piece.color} a bougé de [${fromRow},${fromCol}] vers [${toRow},${toCol}]`);
            this.game.gameState.hasKingMoved[piece.color] = true;
            DeviceLogger.debug('hasKingMoved après mouvement', this.game.gameState.hasKingMoved);
        }
        
        // Marquer les tours comme ayant bougé
        if (piece.type === 'rook') {
            DeviceLogger.log(`Tour ${piece.color} a bougé de [${fromRow},${fromCol}]`);
            
            const rookState = this.game.gameState.hasRookMoved[piece.color];
            
            // Vérifier si c'est la tour côté roi (colonne 7)
            if (fromCol === 7) {
                rookState.kingside = true;
                DeviceLogger.log(`Tour côté roi ${piece.color} marquée comme ayant bougé`);
            } 
            // Vérifier si c'est la tour côté dame (colonne 0)
            else if (fromCol === 0) {
                rookState.queenside = true;
                DeviceLogger.log(`Tour côté dame ${piece.color} marquée comme ayant bougé`);
            }
            
            DeviceLogger.debug('hasRookMoved après mouvement', this.game.gameState.hasRookMoved);
        }
    }

    executeCastle(move, king, fromRow, fromCol) {
        const color = king.color;
        const row = color === 'white' ? 7 : 0;
        
        DeviceLogger.log(`Roque ${move.type} pour ${color} sur rangée ${row}`);

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

        // CORRECTION: Marquer explicitement que le roi a bougé
        if (!this.game.gameState.hasKingMoved) {
            this.game.gameState.hasKingMoved = { white: false, black: false };
        }
        this.game.gameState.hasKingMoved[selectedPiece.piece.color] = true;
        DeviceLogger.log(`Roi ${selectedPiece.piece.color} a bougé - roques désactivés`);

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
            DeviceLogger.log(`Roi ${color} a bougé - roques désactivés`);
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
                DeviceLogger.log(`Tour côté roi ${color} a bougé - roque côté roi désactivé`);
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

    undoPromotionMove(fromSquare, toSquare, pieceElement, selectedPiece) {
        toSquare.element.innerHTML = '';
        toSquare.piece = null;
        
        fromSquare.element.appendChild(pieceElement);
        fromSquare.piece = selectedPiece.piece;
        
        this.game.clearSelection();
        DeviceLogger.log('Promotion annulée');
    }

    highlightPossibleMoves() {
        // Réinitialiser tous les styles
        this.game.board.squares.forEach(square => {
            square.element.classList.remove(
                'selected', 
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
                    DeviceLogger.log(`Case de roque highlightée: [${move.row},${move.col}]`);
                } else if (move.type === 'en-passant') {
                    square.element.classList.add('possible-en-passant');
                } else if (move.type === 'capture') {
                    square.element.classList.add('possible-capture');
                } else {
                    square.element.classList.add('possible-move');
                }
            }
        });
        
        DeviceLogger.log(`${this.game.possibleMoves.length} mouvements highlightés`);
    }

    clearSelection() {
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
        
        DeviceLogger.log('Sélection effacée');
    }
}

window.ChessGameMoveHandler = ChessGameMoveHandler;