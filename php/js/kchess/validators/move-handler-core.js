// validators/move-handler-core.js - Cœur de la gestion des mouvements
class ChessGameMoveHandler {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('validators/move-handler-core.js loaded');
        }
    }

    constructor(game) {
        this.game = game;
        this.isPromoting = false;
        
        if (this.constructor.consoleLog) {
            console.log('🔧 ChessGameMoveHandler initialisé');
            console.log(`  - Game: ${game ? '✓' : '✗'}`);
        }
        
        // Initialiser les modules
        this.moveExecutor = new MoveExecutor(game);
        this.specialMovesHandler = new SpecialMovesHandler(game);
        this.moveStateManager = new MoveStateManager(game);
        this.validatorInterface = new ValidatorInterface(game);
    }

    // ========== MÉTHODES PRINCIPALES ==========

    handleSquareClick(displayRow, displayCol) {
        if (this.constructor.consoleLog) {
            console.log(`\n🎯 Click sur case [affichage:${displayRow},${displayCol}]`);
        }
        
        if (!this.validateGameState()) return;
        
        const { actualRow, actualCol, square } = this.getActualSquare(displayRow, displayCol);
        if (!square) return;

        this.logCurrentState(square, actualRow, actualCol);

        if (this.game.selectedPiece) {
            this.handleMovementPhase(actualRow, actualCol, square);
        } else {
            this.handleSelectionPhase(actualRow, actualCol, square);
        }
    }

    executeDirectMove(fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`\n⚡ EXÉCUTION MOUVEMENT DIRECT:`);
            console.log(`  De: [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        if (!this.game.gameState.gameActive || this.isPromoting) {
            if (this.constructor.consoleLog) {
                console.log(`❌ Jeu non actif ou promotion en cours`);
            }
            return false;
        }
        
        const fromSquare = this.game.board.getSquare(fromRow, fromCol);
        const toSquare = this.game.board.getSquare(toRow, toCol);
        
        if (!fromSquare || !toSquare || !fromSquare.piece) {
            if (this.constructor.consoleLog) {
                console.log(`❌ Cases ou pièce non valides`);
            }
            return false;
        }
        
        const possibleMoves = this.validatorInterface.getPossibleMoves(fromSquare.piece, fromRow, fromCol);
        const isValidMove = possibleMoves.some(move => move.row === toRow && move.col === toCol);
        
        if (!isValidMove) {
            if (this.constructor.consoleLog) {
                console.log(`❌ Mouvement non valide`);
                console.log(`  Mouvements possibles: ${possibleMoves.length}`);
                possibleMoves.forEach(move => {
                    console.log(`    → [${move.row},${move.col}] (${move.type})`);
                });
            }
            return false;
        }
        
        if (this.constructor.consoleLog) {
            console.log(`✅ Mouvement direct valide`);
        }
        
        this.moveStateManager.setSelection(fromRow, fromCol, fromSquare.piece, possibleMoves);
        this.executeMove(toRow, toCol);
        return true;
    }

    // ========== MÉTHODES DE VALIDATION ==========

    validateGameState() {
        if (!this.game.gameState.gameActive) {
            if (this.constructor.consoleLog) {
                console.log(`⚠️ Jeu non actif`);
            }
            return false;
        }
        
        if (this.isPromoting) {
            if (this.constructor.consoleLog) {
                console.log(`⚠️ Promotion en cours`);
            }
            return false;
        }
        
        return true;
    }

    getActualSquare(displayRow, displayCol) {
        const { actualRow, actualCol } = this.game.board.getActualCoordinates(displayRow, displayCol);
        
        if (this.constructor.consoleLog) {
            console.log(`  Coordonnées: affichage[${displayRow},${displayCol}] → réel[${actualRow},${actualCol}]`);
        }
        
        const square = this.game.board.getSquare(actualRow, actualCol);
        if (!square) {
            if (this.constructor.consoleLog) {
                console.error(`❌ Case non trouvée`);
            }
        }
        
        return { actualRow, actualCol, square };
    }

    // ========== DÉLÉGATION AUX MODULES ==========

    handleSelectionPhase(row, col, square) {
        if (this.constructor.consoleLog) {
            console.log(`\n🔍 PHASE DE SÉLECTION: case [${row},${col}]`);
        }
        
        this.moveStateManager.handlePieceSelection(row, col, square);
    }

    handleMovementPhase(row, col, square) {
        if (this.constructor.consoleLog) {
            console.log(`\n⚙️ PHASE DE MOUVEMENT: vers [${row},${col}]`);
        }
        
        if (!this.game.selectedPiece) {
            if (this.constructor.consoleLog) {
                console.error(`❌ Aucune pièce sélectionnée`);
            }
            return;
        }

        const isPossibleMove = this.moveStateManager.isMovePossible(row, col);
        
        if (this.constructor.consoleLog) {
            console.log(`  Mouvement possible: ${isPossibleMove ? '✓ OUI' : '✗ NON'}`);
        }

        if (isPossibleMove) {
            this.executeMove(row, col);
        } else {
            this.moveStateManager.handleInvalidMove(row, col, square);
        }
    }

    executeMove(toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`\n🚀 EXÉCUTION MOUVEMENT: vers [${toRow},${toCol}]`);
        }
        
        if (!this.validateMoveExecution()) return;
        
        const moveData = this.moveExecutor.prepareMoveExecution(toRow, toCol);
        if (!moveData) return;

        const { selectedPiece, fromSquare, toSquare, move } = moveData;

        if (this.constructor.consoleLog) {
            console.log(`  Détails mouvement:`, move);
        }

        // Délégation aux handlers spécialisés
        if (this.specialMovesHandler.handleSpecialMove(move, selectedPiece, fromSquare, toSquare, toRow, toCol)) {
            if (this.constructor.consoleLog) {
                console.log(`  ⚡ Mouvement spécial géré par SpecialMovesHandler`);
            }
            return;
        }

        // Mouvement normal
        if (this.constructor.consoleLog) {
            console.log(`  🔄 Exécution mouvement normal`);
        }
        
        this.moveExecutor.executeNormalMove(fromSquare, toSquare, selectedPiece, move, toRow, toCol);
    }

    validateMoveExecution() {
        if (this.isPromoting || !this.game.selectedPiece) {
            if (this.constructor.consoleLog) {
                console.log(`❌ Exécution bloquée:`);
                console.log(`  - Promotion en cours: ${this.isPromoting}`);
                console.log(`  - Pièce sélectionnée: ${!!this.game.selectedPiece}`);
            }
            return false;
        }
        
        if (this.constructor.consoleLog) {
            console.log(`✓ Exécution validée`);
        }
        
        return true;
    }

    // ========== MÉTHODES DE LOG ==========

    logCurrentState(square, row, col) {
        if (!this.constructor.consoleLog) return;
        
        console.log(`📋 ÉTAT ACTUEL:`);
        console.log(`  Pièce sélectionnée: ${this.game.selectedPiece ? 
            `${this.game.selectedPiece.piece.color} ${this.game.selectedPiece.piece.type}` : 'aucune'}`);
        console.log(`  Joueur actuel: ${this.game.gameState.currentPlayer}`);
        console.log(`  Pièce sur case: ${square.piece ? `${square.piece.color} ${square.piece.type}` : 'vide'}`);
        console.log(`  Promotion en cours: ${this.isPromoting}`);
        console.log(`  Coordonnées: [${row},${col}]`);
        
        if (this.game.selectedPiece) {
            console.log(`  Mouvements possibles: ${this.game.possibleMoves.length}`);
            if (this.game.possibleMoves.length > 0) {
                this.game.possibleMoves.forEach((move, index) => {
                    console.log(`    ${index + 1}. [${move.row},${move.col}] (${move.type})`);
                });
            }
        }
    }

    // ========== ACCÈS AUX MÉTHODES DES MODULES ==========

    clearSelection() {
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`  🧹 Nettoyage sélection`);
        }
        
        this.moveStateManager.clearSelection();
    }

    highlightPossibleMoves() {
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`  💡 Mise en surbrillance des mouvements possibles`);
        }
        
        this.moveStateManager.highlightPossibleMoves();
    }

    updateGameStateForMove(piece, fromRow, fromCol, toRow, toCol) {
        this.moveExecutor.updateGameStateForMove(piece, fromRow, fromCol, toRow, toCol);
    }
}

// Initialisation statique
ChessGameMoveHandler.init();

window.ChessGameMoveHandler = ChessGameMoveHandler;