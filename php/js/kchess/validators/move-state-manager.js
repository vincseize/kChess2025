// validators/move-state-manager.js - Gestion de l'état des sélections
class MoveStateManager {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('validators/move-state-manager.js loaded');
        }
    }

    constructor(game) {
        this.game = game;
        
        if (this.constructor.consoleLog) {
            console.log('🔧 MoveStateManager initialisé');
            console.log(`  - Game: ${game ? '✓' : '✗'}`);
        }
    }

    handlePieceSelection(row, col, square) {
        if (square.piece && square.piece.color === this.game.gameState.currentPlayer) {
            this.clearSelection();
            square.element.classList.add('selected');
            this.setSelection(row, col, square.piece);
            
            if (this.constructor.consoleLog) {
                console.log(`✅ Pièce sélectionnée: ${square.piece.color} ${square.piece.type} en [${row},${col}]`);
                console.log(`  Joueur: ${this.game.gameState.currentPlayer}`);
                console.log(`  Couleur valide: ${square.piece.color === this.game.gameState.currentPlayer ? '✓' : '✗'}`);
            }
            
            if (this.constructor.consoleLog) {
                console.log(`  Mouvements possibles: ${this.game.possibleMoves.length}`);
                if (this.game.possibleMoves.length > 0) {
                    this.game.possibleMoves.forEach((move, index) => {
                        const typeIcon = move.type === 'capture' ? '⚔️' : 
                                       move.type === 'en-passant' ? '🎯' : 
                                       move.special === 'castle' ? '🏰' : '➡️';
                        console.log(`    ${index + 1}. [${move.row},${move.col}] ${typeIcon} (${move.type}${move.special ? ', ' + move.special : ''})`);
                    });
                }
            }
        } else if (this.constructor.consoleLog) {
            console.log(`❌ Sélection impossible:`);
            console.log(`  - Pièce présente: ${square.piece ? '✓' : '✗'}`);
            if (square.piece) {
                console.log(`  - Couleur: ${square.piece.color} vs Joueur: ${this.game.gameState.currentPlayer}`);
                console.log(`  - Accès autorisé: ${square.piece.color === this.game.gameState.currentPlayer ? '✓' : '✗'}`);
            }
        }
    }

    setSelection(row, col, piece, possibleMoves = null) {
        this.game.selectedPiece = { row, col, piece };
        
        if (possibleMoves) {
            this.game.possibleMoves = possibleMoves;
            
            if (this.constructor.consoleLog) {
                console.log(`📋 Sélection avec mouvements fournis: ${possibleMoves.length} mouvements`);
            }
        } else {
            this.game.possibleMoves = this.game.moveValidator.getPossibleMoves(piece, row, col);
            
            if (this.constructor.consoleLog) {
                console.log(`📋 Sélection avec validation: ${this.game.possibleMoves.length} mouvements générés`);
            }
        }
        
        this.highlightPossibleMoves();
    }

    isMovePossible(toRow, toCol) {
        const isPossible = this.game.possibleMoves.some(move => 
            move.row === toRow && move.col === toCol
        );
        
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`  ↳ Vérification mouvement vers [${toRow},${toCol}]: ${isPossible ? '✓ possible' : '✗ impossible'}`);
        }
        
        return isPossible;
    }

    handleInvalidMove(toRow, toCol, toSquare) {
        if (this.constructor.consoleLog) {
            console.log(`❌ Mouvement non valide vers [${toRow},${toCol}]`);
        }
        
        if (this.shouldReselectOnInvalid(toSquare)) {
            if (this.constructor.consoleLog) {
                console.log(`  🔄 Resélection automatique (mobile)`);
            }
            this.handlePieceSelection(toRow, toCol, toSquare);
        } else {
            if (this.constructor.consoleLog) {
                console.log(`  🧹 Désélection simple`);
            }
            this.clearSelection();
        }
    }

    shouldReselectOnInvalid(toSquare) {
        const shouldReselect = window.innerWidth <= 768 && 
               toSquare.piece && 
               toSquare.piece.color === this.game.gameState.currentPlayer;
               
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`  ↳ Resélection sur mobile: ${shouldReselect ? '✓ OUI' : '✗ NON'}`);
            console.log(`    - Mobile: ${window.innerWidth <= 768}`);
            console.log(`    - Pièce présente: ${toSquare.piece ? '✓' : '✗'}`);
            if (toSquare.piece) {
                console.log(`    - Couleur valide: ${toSquare.piece.color === this.game.gameState.currentPlayer ? '✓' : '✗'}`);
            }
        }
        
        return shouldReselect;
    }

    highlightPossibleMoves() {
        if (this.constructor.consoleLog) {
            console.log(`💡 Mise en surbrillance des ${this.game.possibleMoves.length} mouvements possibles`);
        }
        
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
        
        // Compter par type
        let moveCount = 0;
        let captureCount = 0;
        let enPassantCount = 0;
        let castleCount = 0;
        
        // Appliquer les styles selon le type de mouvement
        this.game.possibleMoves.forEach(move => {
            const square = this.game.board.getSquare(move.row, move.col);
            if (square) {
                if (move.special === 'castle') {
                    square.element.classList.add('possible-castle');
                    castleCount++;
                    
                    if (this.constructor.consoleLog) {
                        console.log(`  🏰 Roque possible: [${move.row},${move.col}]`);
                    }
                } else if (move.type === 'en-passant') {
                    square.element.classList.add('possible-en-passant');
                    enPassantCount++;
                    
                    if (this.constructor.consoleLog) {
                        console.log(`  🎯 En passant possible: [${move.row},${move.col}]`);
                    }
                } else if (move.type === 'capture') {
                    square.element.classList.add('possible-capture');
                    captureCount++;
                    
                    if (this.constructor.consoleLog) {
                        console.log(`  ⚔️ Capture possible: [${move.row},${move.col}]`);
                    }
                } else {
                    square.element.classList.add('possible-move');
                    moveCount++;
                }
            }
        });
        
        if (this.constructor.consoleLog) {
            console.log(`  📊 Statistiques:`);
            console.log(`    - Déplacements: ${moveCount}`);
            console.log(`    - Captures: ${captureCount}`);
            console.log(`    - En passant: ${enPassantCount}`);
            console.log(`    - Roques: ${castleCount}`);
            console.log(`    - TOTAL: ${this.game.possibleMoves.length}`);
        }
    }

    clearSelection() {
        if (this.constructor.consoleLog) {
            const hadSelection = !!this.game.selectedPiece;
            console.log(`🧹 Nettoyage sélection: ${hadSelection ? 'avec sélection précédente' : 'aucune sélection'}`);
            
            if (hadSelection) {
                // CORRECTION ICI : Utiliser this.game.selectedPiece au lieu de this.game.game.selectedPiece
                console.log(`  Pièce précédente: ${this.game.selectedPiece.piece.color} ${this.game.selectedPiece.piece.type}`);
                console.log(`  Mouvements précédents: ${this.game.possibleMoves.length}`);
            }
        }
        
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
        
        if (this.constructor.consoleLog) {
            console.log(`  ✅ Sélection effacée`);
        }
    }
}

// Initialisation statique
MoveStateManager.init();

window.MoveStateManager = MoveStateManager;