// validators/move-pieces/move-validator.js - Validateur de mouvements des pièces
class MoveValidator {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('validators/move-pieces/move-validator.js loaded');
        }
    }

    constructor(board, gameState) {
        this.board = board;
        this.gameState = gameState;
        this.enPassantTarget = null;
        
        if (this.constructor.consoleLog) {
            console.log('🔧 MoveValidator initialisé');
            console.log(`  - Board: ${board ? '✓' : '✗'}`);
            console.log(`  - GameState: ${gameState ? '✓' : '✗'}`);
        }
        
        // Initialisation des validateurs spécialisés
        this.pieceValidators = {
            'pawn': new PawnMoveValidator(this.board, this.gameState),
            'knight': new KnightMoveValidator(this.board, this.gameState),
            'bishop': new BishopMoveValidator(this.board, this.gameState),
            'rook': new RookMoveValidator(this.board, this.gameState),
            'queen': new QueenMoveValidator(this.board, this.gameState),
            'king': new KingMoveValidator(this.board, this.gameState)
        };
        
        if (this.constructor.consoleLog) {
            console.log(`  - Validateurs initialisés: ${Object.keys(this.pieceValidators).join(', ')}`);
        }
    }

    getPossibleMoves(piece, fromRow, fromCol) {
        if (this.constructor.consoleLog) {
            console.log(`🔍 Recherche mouvements possibles pour ${piece.color} ${piece.type} en [${fromRow},${fromCol}]`);
        }
        
        const validator = this.pieceValidators[piece.type];
        if (!validator) {
            if (this.constructor.consoleLog) {
                console.log(`❌ Aucun validateur trouvé pour le type: ${piece.type}`);
            }
            return [];
        }
        
        const moves = validator.getPossibleMoves(piece, fromRow, fromCol);
        
        if (this.constructor.consoleLog) {
            console.log(`✅ ${moves.length} mouvements possibles trouvés`);
            if (moves.length > 0 && this.constructor.consoleLog) {
                moves.forEach((move, index) => {
                    const type = move.type ? ` (${move.type})` : '';
                    console.log(`  ${index + 1}. → [${move.row},${move.col}]${type}`);
                });
            }
        }
        
        return moves;
    }

    isValidSquare(row, col) {
        const isValid = row >= 0 && row < 8 && col >= 0 && col < 8;
        
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`  ↳ Validation case [${row},${col}]: ${isValid ? '✓ valide' : '✗ hors plateau'}`);
        }
        
        return isValid;
    }

    isMoveValid(piece, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`\n✅🔍 Validation mouvement: ${piece.color} ${piece.type} de [${fromRow},${fromCol}] vers [${toRow},${toCol}]`);
        }
        
        const possibleMoves = this.getPossibleMoves(piece, fromRow, fromCol);
        const isValid = possibleMoves.some(move => 
            move.row === toRow && move.col === toCol
        );
        
        if (this.constructor.consoleLog) {
            if (isValid) {
                console.log(`✅✅✅ MOUVEMENT VALIDE`);
            } else {
                console.log(`❌❌❌ MOUVEMENT INVALIDE`);
                console.log(`  Mouvements possibles:`);
                possibleMoves.forEach(move => {
                    console.log(`    → [${move.row},${move.col}]`);
                });
            }
        }
        
        return isValid;
    }

    // Gestion de la prise en passant
    updateEnPassantTarget(move, piece) {
        if (piece.type === 'pawn' && move.isDoublePush) {
            const direction = piece.color === 'white' ? -1 : 1;
            this.enPassantTarget = {
                row: move.to.row + direction,
                col: move.to.col
            };
            
            if (this.constructor.consoleLog) {
                console.log(`🎯 Cible en passant définie: [${this.enPassantTarget.row},${this.enPassantTarget.col}]`);
            }
        } else {
            this.enPassantTarget = null;
            
            if (this.constructor.consoleLog && move) {
                console.log(`🎯 Cible en passant réinitialisée (pas de double poussée de pion)`);
            }
        }
    }

    executeEnPassant(move) {
        if (move.type === 'en-passant' && move.capturedPawn) {
            if (this.constructor.consoleLog) {
                console.log(`⚔️ Exécution prise en passant sur pion en [${move.capturedPawn.row},${move.capturedPawn.col}]`);
            }
            
            const capturedSquare = this.board.getSquare(move.capturedPawn.row, move.capturedPawn.col);
            if (capturedSquare && capturedSquare.piece) {
                capturedSquare.piece = null;
                capturedSquare.element.innerHTML = '';
                
                if (this.constructor.consoleLog) {
                    console.log(`⚔️✅ Pion capturé en [${move.capturedPawn.row},${move.capturedPawn.col}]`);
                }
            } else {
                if (this.constructor.consoleLog) {
                    console.log(`⚔️❌ Pion non trouvé à la position de capture`);
                }
            }
        }
    }

    // NOUVELLE MÉTHODE : Valider et exécuter un mouvement complet
    validateAndExecute(piece, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`\n🎮🔍 VALIDATION ET EXÉCUTION COMPLÈTE`);
            console.log(`Pièce: ${piece.color} ${piece.type}`);
            console.log(`De: [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        // 1. Valider le mouvement de base
        if (!this.isMoveValid(piece, fromRow, fromCol, toRow, toCol)) {
            if (this.constructor.consoleLog) {
                console.log(`❌❌❌ MOUVEMENT REFUSÉ: Invalide selon les règles`);
            }
            return { success: false, reason: 'invalid_move' };
        }
        
        // 2. Vérifier les collisions (sera fait par les validateurs spécialisés)
        // 3. Vérifier l'échec (sera fait par le moteur de jeu)
        
        if (this.constructor.consoleLog) {
            console.log(`✅✅✅ MOUVEMENT ACCEPTÉ`);
        }
        
        return { success: true };
    }

    // NOUVELLE MÉTHODE : Obtenir le validateur pour un type de pièce
    getValidator(pieceType) {
        const validator = this.pieceValidators[pieceType];
        
        if (this.constructor.consoleLog) {
            console.log(`🔍 Validateur pour ${pieceType}: ${validator ? '✓ trouvé' : '✗ non trouvé'}`);
        }
        
        return validator;
    }

    // NOUVELLE MÉTHODE : Afficher le résumé des validateurs
    displayValidatorsSummary() {
        if (!this.constructor.consoleLog) return;
        
        console.log('\n📋📋📋 RÉSUMÉ DES VALIDATEURS:');
        console.log(`Cible en passant: ${this.enPassantTarget ? 
            `[${this.enPassantTarget.row},${this.enPassantTarget.col}]` : 'Aucune'}`);
        
        Object.entries(this.pieceValidators).forEach(([type, validator]) => {
            console.log(`  - ${type}: ${validator ? '✓' : '✗'}`);
        });
    }
}

// Initialisation statique
MoveValidator.init();

window.MoveValidator = MoveValidator;