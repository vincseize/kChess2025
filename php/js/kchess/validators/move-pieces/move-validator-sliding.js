// validators/move-pieces/move-validator-sliding.js - Validateur des pièces à déplacement linéaire
class SlidingMoveValidator {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('validators/move-pieces/move-validator-sliding.js loaded');
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

        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`    Exploration direction [${rowDir},${colDir}] depuis [${startRow},${startCol}]`);
        }

        while (this.isValidSquare(row, col)) {
            const targetPiece = this.board.getPiece(row, col);
            
            if (!targetPiece) {
                directionMoves.push({ row, col, type: 'move', step });
                
                if (this.constructor.consoleLog && this.constructor.consoleLog) {
                    console.log(`      Étape ${step}: [${row},${col}] → case vide`);
                }
            } else {
                if (targetPiece.color !== piece.color) {
                    directionMoves.push({ row, col, type: 'capture', step });
                    
                    if (this.constructor.consoleLog && this.constructor.consoleLog) {
                        const pieceChar = targetPiece.type.charAt(0).toUpperCase();
                        console.log(`      Étape ${step}: [${row},${col}] → ⚔️ capture ${targetPiece.color} ${targetPiece.type} (${pieceChar})`);
                    }
                } else {
                    if (this.constructor.consoleLog && this.constructor.consoleLog) {
                        console.log(`      Étape ${step}: [${row},${col}] → ❌ blocage par pièce alliée`);
                    }
                }
                break;
            }
            
            row += rowDir;
            col += colDir;
            step++;
        }

        if (this.constructor.consoleLog && step === 1 && this.constructor.consoleLog) {
            console.log(`      Aucun mouvement possible dans cette direction`);
        }

        return directionMoves;
    }

    isValidSquare(row, col) {
        const isValid = row >= 0 && row < 8 && col >= 0 && col < 8;
        
        if (this.constructor.consoleLog && this.constructor.consoleLog && row < 0 || row >= 8 || col < 0 || col >= 8) {
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
}

// Initialisation statique
SlidingMoveValidator.init();

window.SlidingMoveValidator = SlidingMoveValidator;