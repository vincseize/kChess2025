// validators/validator-interface.js - Version utilisant la configuration JSON comme priorité
if (typeof ValidatorInterface !== 'undefined') {
    console.warn('⚠️ ValidatorInterface existe déjà. Vérifiez les doublons dans les imports.');
} else {

class ValidatorInterface {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('🔗 validators/validator-interface.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('🔗 ValidatorInterface: Mode silencieux activé (debug désactivé dans config)');
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
                    console.log('🔗 Configuration chargée depuis window.appConfig');
                }
            } else if (window.chessConfig) {
                // Configuration secondaire: window.chessConfig (pour compatibilité)
                if (window.chessConfig.debug !== undefined) {
                    this.consoleLog = window.chessConfig.debug;
                }
                
                if (this.consoleLog) {
                    console.log('🔗 Configuration chargée depuis window.chessConfig (legacy)');
                }
            } else {
                // Fallback: valeurs par défaut
                if (this.consoleLog) {
                    console.log('🔗 Configuration: valeurs par défaut utilisées');
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

    constructor(game) {
        this.game = game;
        
        if (this.constructor.consoleLog) {
            console.log('🔧 ValidatorInterface initialisé');
            console.log(`  - Game: ${game ? '✓' : '✗'}`);
            console.log(`  - MoveValidator: ${game?.moveValidator ? '✓' : '✗'}`);
            console.log(`  - Board: ${game?.board ? '✓' : '✗'}`);
            console.log(`  - GameState: ${game?.gameState ? '✓' : '✗'}`);
            console.log(`  - Configuration: console_log = ${this.constructor.consoleLog}`);
        }
    }

    getPossibleMoves(piece, row, col) {
        if (this.constructor.consoleLog) {
            console.log(`\n🔍 INTERFACE: Recherche mouvements pour ${piece.color} ${piece.type} en [${row},${col}]`);
        }
        
        if (!this.game || !this.game.moveValidator) {
            if (this.constructor.consoleLog) {
                console.error(`❌ MoveValidator non disponible`);
            }
            return [];
        }
        
        const moves = this.game.moveValidator.getPossibleMoves(piece, row, col);
        
        if (this.constructor.consoleLog) {
            console.log(`  ✅ Résultat: ${moves.length} mouvement(s) possible(s)`);
            
            if (moves.length > 0) {
                console.log(`  Détail des mouvements:`);
                moves.forEach((move, index) => {
                    const typeIcon = move.type === 'capture' ? '⚔️' : 
                                   move.type === 'en-passant' ? '🎯' : 
                                   move.special === 'castle' ? '🏰' : '➡️';
                    const specialInfo = move.special ? ` (${move.special})` : '';
                    const flags = [];
                    if (move.isDoublePush) flags.push('double');
                    if (move.isPromotion) flags.push('promotion');
                    const flagsInfo = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
                    console.log(`    ${index + 1}. [${move.row},${move.col}] ${typeIcon} ${move.type}${specialInfo}${flagsInfo}`);
                });
            } else {
                console.log(`  ⚠️ Aucun mouvement disponible`);
            }
        }
        
        return moves;
    }

    validateMove(piece, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`\n✅ INTERFACE: Validation mouvement`);
            console.log(`  Pièce: ${piece.color} ${piece.type}`);
            console.log(`  De: [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        // Validation rapide préalable
        if (!this.quickValidate(piece, fromRow, fromCol, toRow, toCol)) {
            if (this.constructor.consoleLog) {
                console.log(`  ❌ Échec validation rapide`);
            }
            return false;
        }
        
        const possibleMoves = this.getPossibleMoves(piece, fromRow, fromCol);
        const isValid = possibleMoves.some(move => 
            move.row === toRow && move.col === toCol
        );
        
        if (this.constructor.consoleLog) {
            console.log(`  Résultat validation: ${isValid ? '✓ VALIDE' : '✗ INVALIDE'}`);
            if (!isValid) {
                console.log(`  Raison: mouvement non présent dans ${possibleMoves.length} mouvements possibles`);
            }
        }
        
        return isValid;
    }

    isCheckAfterMove(piece, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`\n♔ INTERFACE: Vérification échec après mouvement`);
            console.log(`  Simulation: ${piece.color} ${piece.type} de [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        // Vérifier d'abord si le mouvement est valide
        if (!this.validateMove(piece, fromRow, fromCol, toRow, toCol)) {
            if (this.constructor.consoleLog) {
                console.log(`  ❌ Mouvement invalide - arrêt vérification échec`);
            }
            return true; // Par sécurité, considérer comme échec si mouvement invalide
        }
        
        // Simulation du mouvement pour vérifier l'échec
        const fromSquare = this.game.board.getSquare(fromRow, fromCol);
        const toSquare = this.game.board.getSquare(toRow, toCol);
        
        if (!fromSquare || !toSquare) {
            if (this.constructor.consoleLog) {
                console.error(`❌ Cases non trouvées:`);
                console.error(`  - From [${fromRow},${fromCol}]: ${fromSquare ? '✓' : '✗'}`);
                console.error(`  - To [${toRow},${toCol}]: ${toSquare ? '✓' : '✗'}`);
            }
            return true; // Par sécurité
        }

        // Sauvegarder l'état
        const originalToPiece = toSquare.piece;
        const originalFromPiece = fromSquare.piece;
        
        if (this.constructor.consoleLog) {
            console.log(`  📋 État original:`);
            console.log(`    - From: ${originalFromPiece ? originalFromPiece.color + ' ' + originalFromPiece.type : 'vide'}`);
            console.log(`    - To: ${originalToPiece ? originalToPiece.color + ' ' + originalToPiece.type : 'vide'}`);
        }

        // Simuler le mouvement
        toSquare.piece = fromSquare.piece;
        fromSquare.piece = null;
        
        if (this.constructor.consoleLog) {
            console.log(`  🔄 État simulé:`);
            console.log(`    - From: ${fromSquare.piece ? fromSquare.piece.color + ' ' + fromSquare.piece.type : 'vide'}`);
            console.log(`    - To: ${toSquare.piece ? toSquare.piece.color + ' ' + toSquare.piece.type : 'vide'}`);
        }

        // Vérifier l'échec
        let isInCheck = false;
        try {
            isInCheck = this.game.moveValidator.isKingInCheck(piece.color);
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.error(`❌ Erreur lors de la vérification d'échec:`, error);
            }
            isInCheck = true; // Par sécurité en cas d'erreur
        }
        
        if (this.constructor.consoleLog) {
            console.log(`  🛡️ Résultat échec: ${isInCheck ? '✓ ROI EN ÉCHEC' : '✗ roi en sécurité'}`);
        }

        // Restaurer l'état
        fromSquare.piece = originalFromPiece;
        toSquare.piece = originalToPiece;
        
        if (this.constructor.consoleLog) {
            console.log(`  🔙 État restauré`);
        }
        
        return isInCheck;
    }

    getMoveType(piece, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`\n📝 INTERFACE: Identification type de mouvement`);
            console.log(`  Pièce: ${piece.color} ${piece.type} de [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        const possibleMoves = this.getPossibleMoves(piece, fromRow, fromCol);
        const move = possibleMoves.find(m => m.row === toRow && m.col === toCol);
        const moveType = move ? move.type : null;
        
        if (this.constructor.consoleLog) {
            if (moveType) {
                const typeDescriptions = {
                    'move': 'déplacement simple',
                    'capture': 'prise',
                    'en-passant': 'prise en passant',
                    'castle-kingside': 'roque côté roi (petit roque)',
                    'castle-queenside': 'roque côté dame (grand roque)'
                };
                const description = typeDescriptions[moveType] || moveType;
                console.log(`  ✅ Type identifié: ${moveType} (${description})`);
                
                if (move.special) {
                    console.log(`  🎯 Mouvement spécial: ${move.special}`);
                }
                if (move.isDoublePush) {
                    console.log(`  🎯 Double poussée de pion`);
                }
                if (move.isPromotion) {
                    console.log(`  👑 Promotion possible`);
                }
            } else {
                console.log(`  ❌ Type non identifié (mouvement invalide)`);
            }
        }
        
        return moveType;
    }

    isSpecialMove(piece, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`\n🎯 INTERFACE: Vérification mouvement spécial`);
            console.log(`  Pièce: ${piece.color} ${piece.type} de [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        const possibleMoves = this.getPossibleMoves(piece, fromRow, fromCol);
        const move = possibleMoves.find(m => m.row === toRow && m.col === toCol);
        const isSpecial = move ? (move.special || move.type === 'en-passant') : false;
        
        if (this.constructor.consoleLog) {
            console.log(`  Résultat: ${isSpecial ? '✓ MOUVEMENT SPÉCIAL' : '✗ mouvement normal'}`);
            if (isSpecial && move) {
                if (move.special === 'castle') {
                    const castleType = move.type.includes('kingside') ? 'Petit roque (0-0)' : 'Grand roque (0-0-0)';
                    console.log(`  🏰 Type: ${castleType}`);
                } else if (move.type === 'en-passant') {
                    console.log(`  🎯 Type: Prise en passant`);
                }
            }
        }
        
        return isSpecial;
    }

    quickValidate(piece, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`  ↳ Validation rapide pour [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        // Validation basique des coordonnées
        if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) {
            if (this.constructor.consoleLog) {
                console.log(`    ❌ Coordonnées hors plateau`);
            }
            return false;
        }
        
        // Même case
        if (fromRow === toRow && fromCol === toCol) {
            if (this.constructor.consoleLog) {
                console.log(`    ❌ Même case (déplacement nul)`);
            }
            return false;
        }
        
        // Vérifier si la pièce existe
        const fromSquare = this.game.board?.getSquare(fromRow, fromCol);
        if (!fromSquare || !fromSquare.piece) {
            if (this.constructor.consoleLog) {
                console.log(`    ❌ Aucune pièce sur la case de départ`);
            }
            return false;
        }
        
        // Vérifier si c'est bien la bonne pièce
        if (fromSquare.piece.color !== piece.color || fromSquare.piece.type !== piece.type) {
            if (this.constructor.consoleLog) {
                console.log(`    ❌ Pièce ne correspond pas`);
            }
            return false;
        }
        
        if (this.constructor.consoleLog) {
            console.log(`    ✓ Validation rapide réussie`);
        }
        
        return true;
    }

    getMoveDetails(piece, fromRow, fromCol, toRow, toCol) {
        if (!this.constructor.consoleLog) {
            // Version silencieuse pour production
            const possibleMoves = this.getPossibleMoves(piece, fromRow, fromCol);
            const move = possibleMoves.find(m => m.row === toRow && m.col === toCol);
            
            if (!move) return null;
            
            return {
                isValid: true,
                type: move.type,
                special: move.special,
                coordinates: {
                    from: { row: fromRow, col: fromCol },
                    to: { row: toRow, col: toCol }
                },
                piece: {
                    type: piece.type,
                    color: piece.color
                },
                flags: {
                    isDoublePush: move.isDoublePush || false,
                    isPromotion: move.isPromotion || false,
                    isCapture: move.type === 'capture' || move.type === 'en-passant',
                    isSpecial: !!(move.special || move.type === 'en-passant')
                }
            };
        }
        
        console.log(`\n📋 INTERFACE: Informations détaillées du mouvement`);
        
        const possibleMoves = this.getPossibleMoves(piece, fromRow, fromCol);
        const move = possibleMoves.find(m => m.row === toRow && m.col === toCol);
        
        if (!move) {
            console.log(`  ❌ Mouvement non valide`);
            return null;
        }
        
        const details = {
            isValid: true,
            type: move.type,
            special: move.special,
            coordinates: {
                from: { row: fromRow, col: fromCol },
                to: { row: toRow, col: toCol }
            },
            piece: {
                type: piece.type,
                color: piece.color
            },
            flags: {
                isDoublePush: move.isDoublePush || false,
                isPromotion: move.isPromotion || false,
                isCapture: move.type === 'capture' || move.type === 'en-passant',
                isSpecial: !!(move.special || move.type === 'en-passant')
            },
            notation: this.generateNotation(move, piece, fromRow, fromCol, toRow, toCol)
        };
        
        console.log(`  ✅ Mouvement valide - Détails:`);
        console.log(`    - Type: ${details.type}`);
        console.log(`    - Spécial: ${details.special || 'non'}`);
        console.log(`    - Double poussée: ${details.flags.isDoublePush ? 'oui' : 'non'}`);
        console.log(`    - Promotion: ${details.flags.isPromotion ? 'oui' : 'non'}`);
        console.log(`    - Capture: ${details.flags.isCapture ? 'oui' : 'non'}`);
        console.log(`    - Notation: ${details.notation}`);
        
        return details;
    }

    // NOUVELLE MÉTHODE : Générer la notation algébrique
    generateNotation(move, piece, fromRow, fromCol, toRow, toCol) {
        const pieceLetters = {
            'king': 'K',
            'queen': 'Q',
            'rook': 'R',
            'bishop': 'B',
            'knight': 'N',
            'pawn': ''
        };
        
        const pieceLetter = pieceLetters[piece.type];
        const toFile = String.fromCharCode(97 + toCol); // a-h
        const toRank = 8 - toRow; // 1-8
        
        let notation = '';
        
        if (move.special === 'castle') {
            notation = move.type.includes('kingside') ? '0-0' : '0-0-0';
        } else if (move.type === 'en-passant') {
            notation = `${String.fromCharCode(97 + fromCol)}x${toFile}${toRank} e.p.`;
        } else {
            notation = pieceLetter || '';
            
            if (move.type === 'capture') {
                const fromFile = piece.type === 'pawn' ? String.fromCharCode(97 + fromCol) : '';
                notation += fromFile + 'x';
            }
            
            notation += `${toFile}${toRank}`;
            
            if (move.isPromotion) {
                notation += `=${pieceLetters['queen'] || 'Q'}`; // Par défaut dame
            }
        }
        
        return notation;
    }

    // NOUVELLE MÉTHODE : Vérifier l'état de l'interface
    checkInterfaceState() {
        if (!this.constructor.consoleLog) return;
        
        console.log(`\n🔍 ÉTAT VALIDATOR INTERFACE:`);
        console.log(`  Game connecté: ${this.game ? '✓' : '✗'}`);
        console.log(`  MoveValidator: ${this.game?.moveValidator ? '✓' : '✗'}`);
        console.log(`  Board: ${this.game?.board ? '✓' : '✗'}`);
        console.log(`  GameState: ${this.game?.gameState ? '✓' : '✗'}`);
        console.log(`  Configuration: console_log = ${this.constructor.consoleLog}`);
        console.log(`  Joueur actuel: ${this.game?.gameState?.currentPlayer || 'inconnu'}`);
        console.log(`  Pièce sélectionnée: ${this.game?.selectedPiece ? '✓' : '✗'}`);
    }

    // NOUVELLE MÉTHODE : Obtenir un résumé des fonctionnalités
    getInterfaceSummary() {
        const summary = {
            name: 'ValidatorInterface',
            version: '1.0.0',
            features: [
                'getPossibleMoves',
                'validateMove', 
                'isCheckAfterMove',
                'getMoveType',
                'isSpecialMove',
                'quickValidate',
                'getMoveDetails',
                'generateNotation'
            ],
            connected: {
                game: !!this.game,
                moveValidator: !!this.game?.moveValidator,
                board: !!this.game?.board,
                gameState: !!this.game?.gameState
            },
            config: {
                consoleLog: this.constructor.consoleLog,
                source: this.constructor.getConfigSource()
            }
        };
        
        if (this.constructor.consoleLog) {
            console.log(`\n📊 RÉSUMÉ VALIDATOR INTERFACE:`);
            console.log(JSON.stringify(summary, null, 2));
        }
        
        return summary;
    }
}

// Initialisation statique
ValidatorInterface.init();

window.ValidatorInterface = ValidatorInterface;

} // Fin du if de protection