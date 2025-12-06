// validators/move-pieces/move-validator-knight.js - Validateur des mouvements de cavalier CORRIGÉ
class KnightMoveValidator {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('validators/move-pieces/move-validator-knight.js loaded');
        }
    }

    constructor(board, gameState) {
        this.board = board;
        this.gameState = gameState;
        
        if (this.constructor.consoleLog) {
            console.log('🔧 KnightMoveValidator initialisé');
            console.log(`  - Board: ${board ? '✓' : '✗'}`);
            console.log(`  - GameState: ${gameState ? '✓' : '✗'}`);
        }
    }

    getPossibleMoves(piece, row, col) {
        if (this.constructor.consoleLog) {
            console.log(`\n🐴🔍 Recherche mouvements pour cavalier ${piece.color} en [${row},${col}]`);
        }
        
        const moves = [];
        const knightMoves = [
            [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2]
        ];

        const pieceColor = piece.color;

        if (this.constructor.consoleLog) {
            console.log(`🐴 Mouvements en L possibles: ${knightMoves.length} directions`);
        }

        // Générer tous les mouvements possibles
        knightMoves.forEach(([rowOffset, colOffset], index) => {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;
            
            if (this.isValidSquare(newRow, newCol)) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                if (!targetPiece || targetPiece.color !== pieceColor) {
                    moves.push({ 
                        row: newRow, 
                        col: newCol, 
                        type: targetPiece ? 'capture' : 'move' 
                    });
                    
                    if (this.constructor.consoleLog) {
                        const directionDesc = this.getDirectionDescription(rowOffset, colOffset);
                        const pieceDesc = targetPiece ? 
                            `⚔️ ${targetPiece.color} ${targetPiece.type}` : 'case vide';
                        console.log(`  ${index + 1}. [${newRow},${newCol}] ${directionDesc} → ${pieceDesc}`);
                    }
                } else if (this.constructor.consoleLog) {
                    console.log(`  ${index + 1}. [${newRow},${newCol}] → ❌ bloqué par ${targetPiece.color} ${targetPiece.type} (allié)`);
                }
            } else if (this.constructor.consoleLog) {
                console.log(`  ${index + 1}. [${newRow},${newCol}] → ❌ hors plateau`);
            }
        });

        if (this.constructor.consoleLog) {
            console.log(`\n🐴📊 Résultat brut: ${moves.length} mouvements trouvés`);
        }

        // Filtrer les mouvements qui mettraient le roi en échec
        if (this.constructor.consoleLog) {
            console.log(`\n🐴🛡️ Vérification échec au roi pour ${pieceColor}`);
        }
        
        const validMoves = moves.filter(move => {
            const wouldBeInCheck = this.wouldKingBeInCheckAfterMove(pieceColor, row, col, move.row, move.col);
            
            if (this.constructor.consoleLog) {
                if (wouldBeInCheck) {
                    console.log(`  ❌ Mouvement [${row},${col}]->[${move.row},${move.col}] → mettrait le roi en échec`);
                } else {
                    console.log(`  ✓ Mouvement [${row},${col}]->[${move.row},${move.col}] (${move.type}) → sûr`);
                }
            }
            
            return !wouldBeInCheck;
        });

        if (this.constructor.consoleLog) {
            const filteredCount = moves.length - validMoves.length;
            console.log(`\n🐴✅ FINAL: Cavalier ${pieceColor} en [${row},${col}]`);
            console.log(`  - Mouvements bruts: ${moves.length}`);
            console.log(`  - Mouvements valides: ${validMoves.length}`);
            console.log(`  - Mouvements filtrés: ${filteredCount}`);
            
            if (validMoves.length > 0) {
                console.log(`  Mouvements valides:`);
                validMoves.forEach((move, index) => {
                    const typeIcon = move.type === 'capture' ? '⚔️' : ' ';
                    console.log(`  ${index + 1}. [${move.row},${move.col}] ${typeIcon}`);
                });
            } else {
                console.log(`  ⚠️ Aucun mouvement valide disponible`);
            }
        }
        
        return validMoves;
    }

    // NOUVELLE MÉTHODE : Description des mouvements en L
    getDirectionDescription(rowOffset, colOffset) {
        const descriptions = {
            '2,1': '↓→ (2 bas, 1 droite)',
            '2,-1': '↓← (2 bas, 1 gauche)',
            '-2,1': '↑→ (2 haut, 1 droite)',
            '-2,-1': '↑← (2 haut, 1 gauche)',
            '1,2': '→↓ (1 bas, 2 droite)',
            '1,-2': '←↓ (1 bas, 2 gauche)',
            '-1,2': '→↑ (1 haut, 2 droite)',
            '-1,-2': '←↑ (1 haut, 2 gauche)'
        };
        
        return descriptions[`${rowOffset},${colOffset}`] || `[${rowOffset},${colOffset}]`;
    }

    // Vérifier si le mouvement mettrait le roi en échec
    wouldKingBeInCheckAfterMove(pieceColor, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`    ↳ Simulation: [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        try {
            // Créer une simulation du plateau
            const tempBoard = this.createTempBoard();
            
            // Déplacer le cavalier temporairement
            const knightPiece = tempBoard[fromRow][fromCol];
            tempBoard[toRow][toCol] = knightPiece;
            tempBoard[fromRow][fromCol] = null;
            
            if (this.constructor.consoleLog && this.constructor.consoleLog) {
                console.log(`      Simulation créée: cavalier déplacé`);
            }
            
            // Générer un FEN temporaire
            const tempFEN = this.generateTempFEN(tempBoard, pieceColor);
            
            if (this.constructor.consoleLog && this.constructor.consoleLog) {
                console.log(`      FEN généré: ${tempFEN.substring(0, 30)}...`);
            }
            
            // Vérifier l'échec
            const engine = new ChessEngine(tempFEN);
            const colorCode = pieceColor === 'white' ? 'w' : 'b';
            const isInCheck = engine.isKingInCheck(colorCode);
            
            if (this.constructor.consoleLog && this.constructor.consoleLog) {
                console.log(`      Résultat: ${isInCheck ? 'ROI EN ÉCHEC ⚠️' : 'roi en sécurité ✓'}`);
            }
            
            return isInCheck;
            
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.error(`❌ Erreur dans wouldKingBeInCheckAfterMove:`, error);
            }
            return true; // En cas d'erreur, on bloque le mouvement par sécurité
        }
    }

    // Créer une copie temporaire du plateau
    createTempBoard() {
        const tempBoard = Array(8).fill().map(() => Array(8).fill(null));
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.board.getSquare(row, col);
                tempBoard[row][col] = square.piece ? {...square.piece} : null;
            }
        }
        return tempBoard;
    }

    // Générer un FEN temporaire
    generateTempFEN(tempBoard, currentPlayer) {
        let fen = '';
        
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            
            for (let col = 0; col < 8; col++) {
                const piece = tempBoard[row][col];
                
                if (!piece) {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    fen += this.pieceToFEN(piece);
                }
            }
            
            if (emptyCount > 0) {
                fen += emptyCount;
            }
            
            if (row < 7) {
                fen += '/';
            }
        }
        
        const nextPlayer = currentPlayer === 'white' ? 'b' : 'w';
        fen += ` ${nextPlayer} KQkq - 0 1`;
        
        return fen;
    }

    // Convertir une pièce en notation FEN
    pieceToFEN(piece) {
        const pieceMap = {
            'king': 'k',
            'queen': 'q',
            'rook': 'r', 
            'bishop': 'b',
            'knight': 'n',
            'pawn': 'p'
        };
        
        const fenCode = pieceMap[piece.type] || '?';
        return piece.color === 'white' ? fenCode.toUpperCase() : fenCode;
    }

    isValidSquare(row, col) {
        const isValid = row >= 0 && row < 8 && col >= 0 && col < 8;
        return isValid;
    }
}

// Initialisation statique
KnightMoveValidator.init();

window.KnightMoveValidator = KnightMoveValidator;