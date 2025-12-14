// validators/move-pieces/move-validator.js - Version utilisant la configuration JSON comme priorité
if (typeof MoveValidator !== 'undefined') {
    console.warn('⚠️ MoveValidator existe déjà. Vérifiez les doublons dans les imports.');
} else {

class MoveValidator {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('✅ validators/move-pieces/move-validator.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('✅ MoveValidator: Mode silencieux activé (debug désactivé dans config)');
        }
    }
    
    // Méthode pour charger la configuration
    static loadConfig() {
        try {
            if (window.appConfig && window.appConfig.chess_engine) {
                // Configuration prioritaire: window.appConfig
                if (window.appConfig.chess_engine.console_log !== undefined) {
                    this.consoleLog = window.appConfig.chess_engine.console_log;
                }
                
                if (this.consoleLog) {
                    console.log('✅ Configuration chargée depuis window.appConfig');
                }
            } else if (window.chessConfig) {
                // Configuration secondaire: window.chessConfig (pour compatibilité)
                if (window.chessConfig.debug !== undefined) {
                    this.consoleLog = window.chessConfig.debug;
                }
                
                if (this.consoleLog) {
                    console.log('✅ Configuration chargée depuis window.chessConfig (legacy)');
                }
            } else {
                // Fallback: valeurs par défaut
                if (this.consoleLog) {
                    console.log('✅ Configuration: valeurs par défaut utilisées');
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement de la configuration:', error);
            // Garder les valeurs par défaut en cas d'erreur
        }
    }
    
    // Méthode pour déterminer la source de la configuration
    static getConfigSource() {
        if (window.appConfig && window.appConfig.chess_engine) {
            return 'window.appConfig';
        } else if (window.chessConfig) {
            return 'window.chessConfig (legacy)';
        } else {
            return 'valeur par défaut';
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
            if (moves.length > 0) {
                console.log(`  Détail des mouvements:`);
                moves.forEach((move, index) => {
                    const typeIcon = move.type === 'capture' ? '⚔️' : 
                                   move.type === 'en-passant' ? '🎯' : 
                                   move.type === 'castle' ? '🏰' : '➡️';
                    const typeText = move.type ? ` (${move.type})` : '';
                    console.log(`  ${index + 1}. → [${move.row},${move.col}] ${typeIcon}${typeText}`);
                });
            }
        }
        
        return moves;
    }

    isValidSquare(row, col) {
        const isValid = row >= 0 && row < 8 && col >= 0 && col < 8;
        
        if (this.constructor.consoleLog) {
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
                const move = possibleMoves.find(m => m.row === toRow && m.col === toCol);
                const moveType = move ? move.type : 'standard';
                console.log(`✅✅✅ MOUVEMENT VALIDE (${moveType})`);
            } else {
                console.log(`❌❌❌ MOUVEMENT INVALIDE`);
                console.log(`  Mouvements possibles:`);
                possibleMoves.forEach((move, index) => {
                    const typeIcon = move.type === 'capture' ? '⚔️' : 
                                   move.type === 'en-passant' ? '🎯' : 
                                   move.type === 'castle' ? '🏰' : ' ';
                    console.log(`  ${index + 1}. → [${move.row},${move.col}] ${typeIcon}`);
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
        
        console.log(`Validateurs disponibles:`);
        Object.entries(this.pieceValidators).forEach(([type, validator]) => {
            const status = validator ? '✓ actif' : '✗ inactif';
            const validatorClass = validator ? validator.constructor.name : 'Non trouvé';
            console.log(`  - ${type}: ${status} (${validatorClass})`);
        });
        
        console.log(`\nPlateau: ${this.board ? '✓ connecté' : '✗ non connecté'}`);
        console.log(`État du jeu: ${this.gameState ? '✓ connecté' : '✗ non connecté'}`);
    }

    // NOUVELLE MÉTHODE : Vérifier la disponibilité des validateurs
    checkValidatorsAvailability() {
        if (!this.constructor.consoleLog) return;
        
        console.log('\n🔍 VÉRIFICATION DISPONIBILITÉ VALIDATEURS:');
        
        const requiredValidators = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
        let allAvailable = true;
        
        requiredValidators.forEach(type => {
            const validator = this.pieceValidators[type];
            const isAvailable = validator !== undefined && validator !== null;
            const status = isAvailable ? '✓ disponible' : '❌ manquant';
            
            console.log(`  ${type}: ${status}`);
            
            if (!isAvailable) {
                allAvailable = false;
                console.warn(`    ⚠️ Le validateur ${type} n'est pas disponible!`);
            }
        });
        
        console.log(`\nRésultat: ${allAvailable ? '✅ Tous les validateurs sont disponibles' : '❌ Certains validateurs sont manquants'}`);
        return allAvailable;
    }

    // NOUVELLE MÉTHODE : Réinitialiser les validateurs
    resetValidators() {
        if (this.constructor.consoleLog) {
            console.log('🔄 Réinitialisation des validateurs...');
        }
        
        this.pieceValidators = {
            'pawn': new PawnMoveValidator(this.board, this.gameState),
            'knight': new KnightMoveValidator(this.board, this.gameState),
            'bishop': new BishopMoveValidator(this.board, this.gameState),
            'rook': new RookMoveValidator(this.board, this.gameState),
            'queen': new QueenMoveValidator(this.board, this.gameState),
            'king': new KingMoveValidator(this.board, this.gameState)
        };
        
        if (this.constructor.consoleLog) {
            console.log('✅ Validateurs réinitialisés');
        }
        
        return this.pieceValidators;
    }
}

// Initialisation statique
MoveValidator.init();

window.MoveValidator = MoveValidator;

} // Fin du if de protection