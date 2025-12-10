// validators/move-pieces/move-validator-sliding.js - Version utilisant la configuration JSON comme priorité
if (typeof SlidingMoveValidator !== 'undefined') {
    console.warn('⚠️ SlidingMoveValidator existe déjà. Vérifiez les doublons dans les imports.');
} else {

class SlidingMoveValidator {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('📏 validators/move-pieces/move-validator-sliding.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('📏 SlidingMoveValidator: Mode silencieux activé (debug désactivé dans config)');
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
                    console.log('📏 Configuration chargée depuis window.appConfig');
                }
            } else if (window.chessConfig) {
                // Configuration secondaire: window.chessConfig (pour compatibilité)
                if (window.chessConfig.debug !== undefined) {
                    this.consoleLog = window.chessConfig.debug;
                }
                
                if (this.consoleLog) {
                    console.log('📏 Configuration chargée depuis window.chessConfig (legacy)');
                }
            } else {
                // Fallback: valeurs par défaut
                if (this.consoleLog) {
                    console.log('📏 Configuration: valeurs par défaut utilisées');
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

    constructor(board) {
        this.board = board;
        
        if (this.constructor.consoleLog) {
            console.log('🔧 SlidingMoveValidator initialisé');
            console.log(`  - Board: ${board ? '✓' : '✗'}`);
        }
    }

    getSlidingMoves(piece, row, col, directions) {
        if (this.constructor.consoleLog) {
            console.log(`\n📏🔍 Déplacements linéaires pour ${piece.color} en [${row},${col}]`);
            console.log(`  Directions: ${directions.map(d => `[${d[0]},${d[1]}]`).join(', ')}`);
            console.log(`  Nombre de directions: ${directions.length}`);
        }
        
        const moves = [];
        let totalMovesFound = 0;
        
        directions.forEach(([rowDir, colDir], index) => {
            if (this.constructor.consoleLog) {
                console.log(`\n  Direction ${index + 1}: [${rowDir},${colDir}]`);
            }
            
            const directionMoves = this.addSlidingMoves([], piece, row, col, rowDir, colDir);
            moves.push(...directionMoves);
            
            if (this.constructor.consoleLog) {
                console.log(`    → ${directionMoves.length} mouvements dans cette direction`);
                directionMoves.forEach((move, moveIndex) => {
                    const typeEmoji = move.type === 'capture' ? '⚔️' : '➡️';
                    console.log(`      ${moveIndex + 1}. ${typeEmoji} [${move.row},${move.col}] (${move.type})`);
                });
            }
            
            totalMovesFound += directionMoves.length;
        });

        if (this.constructor.consoleLog) {
            console.log(`\n📏✅ Total: ${totalMovesFound} mouvements linéaires trouvés`);
        }
        
        return moves;
    }

    addSlidingMoves(moves, piece, startRow, startCol, rowDir, colDir) {
        const directionMoves = [];
        let row = startRow + rowDir;
        let col = startCol + colDir;
        let step = 1;

        if (this.constructor.consoleLog) {
            console.log(`    Exploration direction [${rowDir},${colDir}] depuis [${startRow},${startCol}]`);
        }

        while (this.isValidSquare(row, col)) {
            const targetPiece = this.board.getPiece(row, col);
            
            if (!targetPiece) {
                directionMoves.push({ row, col, type: 'move', step });
                
                if (this.constructor.consoleLog) {
                    console.log(`      Étape ${step}: [${row},${col}] → case vide`);
                }
            } else {
                if (targetPiece.color !== piece.color) {
                    directionMoves.push({ row, col, type: 'capture', step });
                    
                    if (this.constructor.consoleLog) {
                        const pieceChar = targetPiece.type.charAt(0).toUpperCase();
                        console.log(`      Étape ${step}: [${row},${col}] → ⚔️ capture ${targetPiece.color} ${targetPiece.type} (${pieceChar})`);
                    }
                } else {
                    if (this.constructor.consoleLog) {
                        console.log(`      Étape ${step}: [${row},${col}] → ❌ blocage par pièce alliée`);
                    }
                }
                break;
            }
            
            row += rowDir;
            col += colDir;
            step++;
        }

        if (this.constructor.consoleLog && step === 1) {
            console.log(`      Aucun mouvement possible dans cette direction`);
        }

        return directionMoves;
    }

    isValidSquare(row, col) {
        const isValid = row >= 0 && row < 8 && col >= 0 && col < 8;
        
        if (this.constructor.consoleLog && (row < 0 || row >= 8 || col < 0 || col >= 8)) {
            console.log(`      Case [${row},${col}] → hors plateau`);
        }
        
        return isValid;
    }

    // NOUVELLE MÉTHODE : Analyser une direction spécifique
    analyzeDirection(piece, startRow, startCol, rowDir, colDir) {
        if (!this.constructor.consoleLog) return [];
        
        console.log(`\n🧭🔍 Analyse direction [${rowDir},${colDir}] pour ${piece.color} en [${startRow},${startCol}]`);
        
        const moves = [];
        let row = startRow + rowDir;
        let col = startCol + colDir;
        let step = 1;
        let isBlocked = false;

        while (this.isValidSquare(row, col) && !isBlocked) {
            const targetPiece = this.board.getPiece(row, col);
            
            if (!targetPiece) {
                moves.push({ row, col, type: 'move' });
                console.log(`  Étape ${step}: [${row},${col}] → libre`);
            } else {
                if (targetPiece.color !== piece.color) {
                    moves.push({ row, col, type: 'capture' });
                    console.log(`  Étape ${step}: [${row},${col}] → ⚔️ capture ${targetPiece.color} ${targetPiece.type}`);
                    isBlocked = true;
                } else {
                    console.log(`  Étape ${step}: [${row},${col}] → ❌ bloqué par ${targetPiece.color} ${targetPiece.type}`);
                    isBlocked = true;
                }
            }
            
            row += rowDir;
            col += colDir;
            step++;
        }

        console.log(`  Total dans cette direction: ${moves.length} mouvements`);
        return moves;
    }

    // NOUVELLE MÉTHODE : Vérifier une ligne complète
    checkLine(piece, startRow, startCol, rowDir, colDir) {
        if (!this.constructor.consoleLog) return null;
        
        console.log(`\n📐 Vérification ligne [${rowDir},${colDir}] depuis [${startRow},${startCol}]`);
        
        const lineInfo = {
            piece: piece,
            start: { row: startRow, col: startCol },
            direction: { row: rowDir, col: colDir },
            squares: [],
            blockedBy: null,
            canCapture: false
        };

        let row = startRow + rowDir;
        let col = startCol + colDir;
        let distance = 1;

        while (this.isValidSquare(row, col)) {
            const targetPiece = this.board.getPiece(row, col);
            const squareInfo = {
                position: { row, col },
                distance: distance,
                hasPiece: !!targetPiece,
                piece: targetPiece
            };

            lineInfo.squares.push(squareInfo);

            if (targetPiece) {
                if (targetPiece.color !== piece.color) {
                    lineInfo.canCapture = true;
                    console.log(`  Distance ${distance}: [${row},${col}] → ⚔️ ennemi ${targetPiece.type}`);
                    break;
                } else {
                    lineInfo.blockedBy = { piece: targetPiece, distance: distance };
                    console.log(`  Distance ${distance}: [${row},${col}] → ❌ allié ${targetPiece.type}`);
                    break;
                }
            } else {
                console.log(`  Distance ${distance}: [${row},${col}] → vide`);
            }

            row += rowDir;
            col += colDir;
            distance++;
        }

        return lineInfo;
    }

    // NOUVELLE MÉTHODE : Obtenir un résumé des directions
    getDirectionsSummary(piece, row, col, directions) {
        if (!this.constructor.consoleLog) return null;
        
        console.log(`\n📊 Résumé des directions pour ${piece.color} en [${row},${col}]`);
        
        const summary = {
            piece: piece,
            position: { row, col },
            directions: []
        };

        directions.forEach(([rowDir, colDir], index) => {
            const lineInfo = this.checkLine(piece, row, col, rowDir, colDir);
            if (lineInfo) {
                summary.directions.push({
                    direction: [rowDir, colDir],
                    reach: lineInfo.squares.length,
                    canCapture: lineInfo.canCapture,
                    blockedBy: lineInfo.blockedBy
                });
                
                const directionDesc = `[${rowDir},${colDir}]`;
                const reachInfo = `${lineInfo.squares.length} cases`;
                const captureInfo = lineInfo.canCapture ? '⚔️ capture possible' : 'pas de capture';
                const blockInfo = lineInfo.blockedBy ? 
                    `❌ bloqué à ${lineInfo.blockedBy.distance} cases` : '✓ libre';
                
                console.log(`  Direction ${index + 1} ${directionDesc}: ${reachInfo}, ${captureInfo}, ${blockInfo}`);
            }
        });

        console.log(`  Total: ${summary.directions.length} directions analysées`);
        return summary;
    }
}

// Initialisation statique
SlidingMoveValidator.init();

window.SlidingMoveValidator = SlidingMoveValidator;

} // Fin du if de protection