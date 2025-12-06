// validators/move-pieces/move-validator-bishop.js - Validateur des mouvements de fou
class BishopMoveValidator {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('validators/move-pieces/move-validator-bishop.js loaded');
        }
    }

    constructor(board, gameState) {
        this.board = board;
        this.gameState = gameState;
        
        if (this.constructor.consoleLog) {
            console.log('🔧 BishopMoveValidator initialisé');
            console.log(`  - Board: ${board ? '✓' : '✗'}`);
            console.log(`  - GameState: ${gameState ? '✓' : '✗'}`);
        }
    }

    getPossibleMoves(piece, row, col) {
        if (this.constructor.consoleLog) {
            console.log(`\n🗂️🔍 Recherche mouvements pour fou ${piece.color} en [${row},${col}]`);
        }
        
        const moves = [];
        const directions = [
            [1, 1],   // ↘️ SE (bas-droite)
            [1, -1],  // ↙️ SO (bas-gauche)
            [-1, 1],  // ↗️ NE (haut-droite)
            [-1, -1]  // ↖️ NO (haut-gauche)
        ];

        const pieceColor = piece.color;

        if (this.constructor.consoleLog) {
            console.log(`🗂️ Directions diagonales: ${directions.length} directions`);
        }

        // Générer tous les mouvements possibles
        directions.forEach(([rowDir, colDir], index) => {
            if (this.constructor.consoleLog) {
                const directionNames = ['↘️ SE', '↙️ SO', '↗️ NE', '↖️ NO'];
                console.log(`\n  Exploration ${directionNames[index]}: [${rowDir},${colDir}]`);
            }
            
            this.addSlidingMoves(moves, piece, row, col, rowDir, colDir);
        });

        if (this.constructor.consoleLog) {
            console.log(`\n🗂️📊 Résultat brut: ${moves.length} mouvements trouvés`);
            if (moves.length > 0) {
                moves.forEach((move, index) => {
                    const typeIcon = move.type === 'capture' ? '⚔️' : '➡️';
                    console.log(`  ${index + 1}. ${typeIcon} [${move.row},${move.col}] (${move.type})`);
                });
            }
        }

        // Filtrer les mouvements qui mettraient le roi en échec
        if (this.constructor.consoleLog) {
            console.log(`\n🗂️🛡️ Vérification échec au roi pour ${pieceColor}`);
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
            console.log(`\n🗂️✅ FINAL: Fou ${pieceColor} en [${row},${col}]`);
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

    addSlidingMoves(moves, piece, startRow, startCol, rowDir, colDir) {
        let row = startRow + rowDir;
        let col = startCol + colDir;
        let distance = 1;

        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`    Exploration diagonale [${rowDir},${colDir}] depuis [${startRow},${startCol}]`);
        }

        while (this.isValidSquare(row, col)) {
            const targetPiece = this.board.getPiece(row, col);
            
            if (!targetPiece) {
                moves.push({ row, col, type: 'move', distance });
                
                if (this.constructor.consoleLog && this.constructor.consoleLog) {
                    console.log(`      Distance ${distance}: [${row},${col}] → case vide`);
                }
            } else {
                if (targetPiece.color !== piece.color) {
                    moves.push({ row, col, type: 'capture', distance });
                    
                    if (this.constructor.consoleLog && this.constructor.consoleLog) {
                        console.log(`      Distance ${distance}: [${row},${col}] → ⚔️ capture ${targetPiece.color} ${targetPiece.type}`);
                    }
                } else {
                    if (this.constructor.consoleLog && this.constructor.consoleLog) {
                        console.log(`      Distance ${distance}: [${row},${col}] → ❌ blocage par ${targetPiece.color} ${targetPiece.type}`);
                    }
                }
                break;
            }
            
            row += rowDir;
            col += colDir;
            distance++;
        }

        if (this.constructor.consoleLog && distance === 1 && this.constructor.consoleLog) {
            console.log(`      Aucun mouvement possible dans cette direction`);
        }
    }

    // Vérifier si le mouvement mettrait le roi en échec
    wouldKingBeInCheckAfterMove(pieceColor, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`    ↳ Simulation: [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        try {
            // Créer une simulation du plateau
            const tempBoard = this.createTempBoard();
            
            // Déplacer le fou temporairement
            const bishopPiece = tempBoard[fromRow][fromCol];
            tempBoard[toRow][toCol] = bishopPiece;
            tempBoard[fromRow][fromCol] = null;
            
            if (this.constructor.consoleLog && this.constructor.consoleLog) {
                console.log(`      Simulation créée: fou déplacé`);
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
BishopMoveValidator.init();

window.BishopMoveValidator = BishopMoveValidator;