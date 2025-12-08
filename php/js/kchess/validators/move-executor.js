// validators/move-executor.js - Exécution physique des mouvements
class MoveExecutor {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('validators/move-executor.js loaded');
        }
    }

    constructor(game) {
        this.game = game;
        
        if (this.constructor.consoleLog) {
            console.log('🔧 MoveExecutor initialisé');
            console.log(`  - Game: ${game ? '✓' : '✗'}`);
        }
    }

    prepareMoveExecution(toRow, toCol) {
        const selectedPiece = { ...this.game.selectedPiece };
        const fromSquare = this.game.board.getSquare(selectedPiece.row, selectedPiece.col);
        const toSquare = this.game.board.getSquare(toRow, toCol);
        const move = this.game.possibleMoves.find(m => m.row === toRow && m.col === toCol);
        
        if (!fromSquare || !toSquare) {
            if (this.constructor.consoleLog) {
                console.error('❌ Cases source/destination non trouvées');
            }
            return null;
        }

        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        if (!pieceElement) {
            if (this.constructor.consoleLog) {
                console.error('❌ Élément pièce non trouvé');
            }
            return null;
        }
        
        if (this.constructor.consoleLog) {
            console.log(`🎯 Préparation exécution mouvement:`);
            console.log(`  - Pièce: ${selectedPiece.piece.color} ${selectedPiece.piece.type}`);
            console.log(`  - De: [${selectedPiece.row},${selectedPiece.col}]`);
            console.log(`  - Vers: [${toRow},${toCol}]`);
            console.log(`  - Move trouvé: ${move ? '✓' : '✗'}`);
        }
        
        return { selectedPiece, fromSquare, toSquare, move, pieceElement };
    }

    executeNormalMove(fromSquare, toSquare, selectedPiece, move, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`\n🚀 EXÉCUTION MOUVEMENT NORMAL:`);
            console.log(`  ${selectedPiece.piece.color} ${selectedPiece.piece.type} de [${selectedPiece.row},${selectedPiece.col}] vers [${toRow},${toCol}]`);
        }
        
        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        this.transferPieceElement(pieceElement, fromSquare, toSquare, selectedPiece.piece);
        
        this.updateGameStateForMove(selectedPiece.piece, selectedPiece.row, selectedPiece.col, toRow, toCol);

        // Gestion promotion
        if (move && this.shouldPromote(move, selectedPiece.piece)) {
            if (this.constructor.consoleLog) {
                console.log(`👑 DÉTECTION PROMOTION`);
            }
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
        
        if (this.constructor.consoleLog) {
            console.log(`  🔄 Pièce transférée de ${fromSquare.element.className} vers ${toSquare.element.className}`);
        }
    }

    shouldPromote(move, piece) {
        const shouldPromote = move && this.game.promotionManager.checkPromotion(move, piece);
        
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`  🔍 Vérification promotion: ${shouldPromote ? 'OUI' : 'NON'}`);
        }
        
        return shouldPromote;
    }

    handlePromotion(toRow, toCol, selectedPiece, move, fromSquare, toSquare, pieceElement) {
        this.game.moveHandler.isPromoting = true;
        this.game.clearSelection();
        
        if (this.constructor.consoleLog) {
            console.log(`🎭 Démarrage processus de promotion`);
        }
        
        this.game.promotionManager.handlePromotion(
            toRow, toCol, selectedPiece.piece.color,
            (promotedPieceType) => {
                if (promotedPieceType) {
                    if (this.constructor.consoleLog) {
                        console.log(`✅ Promotion choisie: ${promotedPieceType}`);
                    }
                    this.finalizePromotion(toRow, toCol, promotedPieceType, move, selectedPiece);
                } else {
                    if (this.constructor.consoleLog) {
                        console.log(`❌ Promotion annulée`);
                    }
                    this.undoPromotionMove(fromSquare, toSquare, pieceElement, selectedPiece);
                }
                this.game.moveHandler.isPromoting = false;
            }
        );
    }

    finalizeNormalMove(toRow, toCol, move, selectedPiece) {
        if (this.constructor.consoleLog) {
            console.log(`✅ Mouvement normal finalisé`);
        }
        
        if (move) {
            this.game.moveValidator.updateEnPassantTarget(
                { 
                    from: { row: selectedPiece.row, col: selectedPiece.col },
                    to: { row: toRow, col: toCol },
                    isDoublePush: move.isDoublePush
                },
                selectedPiece.piece
            );
            
            if (this.constructor.consoleLog && move.isDoublePush) {
                console.log(`🎯 Cible en passant définie pour prochain coup`);
            }
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

        if (this.constructor.consoleLog) {
            console.log(`👑 Promotion finalisée: ${selectedPiece.piece.color} ${selectedPiece.piece.type} → ${promotedPieceType}`);
        }

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
        
        if (this.constructor.consoleLog) {
            console.log(`↩️ Promotion annulée - retour à la position initiale`);
        }
    }

    updateGameStateForMove(piece, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`🔄 Mise à jour gameState pour ${piece.color} ${piece.type}`);
        }
        
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
            this.game.gameState.hasKingMoved[piece.color] = true;
            
            if (this.constructor.consoleLog) {
                console.log(`  👑 Roi ${piece.color} marqué comme ayant bougé`);
            }
        }
        
        if (piece.type === 'rook') {
            const rookState = this.game.gameState.hasRookMoved[piece.color];
            
            if (fromCol === 7) {
                rookState.kingside = true;
                
                if (this.constructor.consoleLog) {
                    console.log(`  🏰 Tour côté roi ${piece.color} marquée comme ayant bougé`);
                }
            } else if (fromCol === 0) {
                rookState.queenside = true;
                
                if (this.constructor.consoleLog) {
                    console.log(`  🏰 Tour côté dame ${piece.color} marquée comme ayant bougé`);
                }
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
            
            if (this.constructor.consoleLog) {
                console.log(`  🏰 Roques désactivés pour ${color} (roi a bougé)`);
            }
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
                
                if (this.constructor.consoleLog) {
                    console.log(`  🏰 Roque côté roi désactivé pour ${color}`);
                }
            }
            
            if (selectedPiece.col === 0 && selectedPiece.row === startRow) {
                if (!this.game.gameState.castlingRights[color]) {
                    this.game.gameState.castlingRights[color] = {
                        kingside: true,
                        queenside: true
                    };
                }
                this.game.gameState.castlingRights[color].queenside = false;
                
                if (this.constructor.consoleLog) {
                    console.log(`  🏰 Roque côté dame désactivé pour ${color}`);
                }
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

// Initialisation statique
MoveExecutor.init();

window.MoveExecutor = MoveExecutor;