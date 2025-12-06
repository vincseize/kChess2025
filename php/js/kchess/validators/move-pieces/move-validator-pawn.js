// validators/move-pieces/move-validator-pawn.js - Validateur des mouvements de pion CORRIGÉ
class PawnMoveValidator {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('validators/move-pieces/move-validator-pawn.js loaded');
        }
    }

    constructor(board, gameState) {
        this.board = board;
        this.gameState = gameState;
        
        if (this.constructor.consoleLog) {
            console.log('🔧 PawnMoveValidator initialisé');
            console.log(`  - Board: ${board ? '✓' : '✗'}`);
            console.log(`  - GameState: ${gameState ? '✓' : '✗'}`);
        }
    }

    getPossibleMoves(piece, row, col) {
        if (this.constructor.consoleLog) {
            console.log(`\n♟️🔍 Recherche mouvements pour pion ${piece.color} en [${row},${col}]`);
        }
        
        const moves = [];
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        const enPassantRow = piece.color === 'white' ? 3 : 4;
        const promotionRow = piece.color === 'white' ? 0 : 7;

        const pieceColor = piece.color;

        if (this.constructor.consoleLog) {
            console.log(`♟️ Configuration:`);
            console.log(`  - Direction: ${direction > 0 ? '▼ vers le bas' : '▲ vers le haut'}`);
            console.log(`  - Rang de départ: ${startRow}`);
            console.log(`  - Rang en passant: ${enPassantRow}`);
            console.log(`  - Rang de promotion: ${promotionRow}`);
        }

        // Mouvement vers l'avant
        if (this.isValidSquare(row + direction, col) && !this.board.getPiece(row + direction, col)) {
            const isPromotion = (row + direction) === promotionRow;
            
            moves.push({ 
                row: row + direction, 
                col: col, 
                type: 'move',
                isPromotion: isPromotion
            });
            
            if (this.constructor.consoleLog) {
                console.log(`♟️▲ Avancée simple: [${row + direction},${col}]${isPromotion ? ' (PROMOTION!)' : ''}`);
            }
            
            // Double mouvement depuis la position initiale
            if (row === startRow && !this.board.getPiece(row + 2 * direction, col)) {
                moves.push({ 
                    row: row + 2 * direction, 
                    col: col, 
                    type: 'move',
                    isDoublePush: true
                });
                
                if (this.constructor.consoleLog) {
                    console.log(`♟️▲▲ Double avancée: [${row + 2 * direction},${col}] (depuis rang de départ)`);
                }
            }
        } else if (this.constructor.consoleLog) {
            console.log(`♟️❌ Avancée bloquée`);
        }

        // Prises en diagonale normales
        [-1, 1].forEach(offset => {
            const targetRow = row + direction;
            const targetCol = col + offset;
            
            if (this.isValidSquare(targetRow, targetCol)) {
                const targetPiece = this.board.getPiece(targetRow, targetCol);
                if (targetPiece && targetPiece.color !== pieceColor) {
                    const isPromotion = targetRow === promotionRow;
                    
                    moves.push({ 
                        row: targetRow, 
                        col: targetCol, 
                        type: 'capture',
                        isPromotion: isPromotion
                    });
                    
                    if (this.constructor.consoleLog) {
                        const side = offset === -1 ? 'gauche ↙️' : 'droite ↘️';
                        console.log(`♟️⚔️ Prise ${side}: [${targetRow},${targetCol}] ${targetPiece.color} ${targetPiece.type}${isPromotion ? ' (PROMOTION!)' : ''}`);
                    }
                } else if (this.constructor.consoleLog) {
                    const side = offset === -1 ? 'gauche' : 'droite';
                    console.log(`♟️❌ Pas de prise ${side}: case [${targetRow},${targetCol}] ${targetPiece ? 'alliée' : 'vide'}`);
                }
            } else if (this.constructor.consoleLog) {
                const side = offset === -1 ? 'gauche' : 'droite';
                console.log(`♟️❌ Prise ${side}: hors plateau`);
            }
        });

        // Prise en passant
        if (row === enPassantRow) {
            if (this.constructor.consoleLog) {
                console.log(`♟️🎯 Vérification prise en passant (rang ${enPassantRow})`);
            }
            
            [-1, 1].forEach(offset => {
                const targetCol = col + offset;
                const targetRow = row + direction;
                const isPromotion = targetRow === promotionRow;
                
                if (this.isValidSquare(row, targetCol)) {
                    const adjacentPiece = this.board.getPiece(row, targetCol);
                    
                    if (adjacentPiece && 
                        adjacentPiece.type === 'pawn' && 
                        adjacentPiece.color !== pieceColor &&
                        this.isEnPassantPossible(row, targetCol, pieceColor)) {
                        
                        moves.push({
                            row: targetRow,
                            col: targetCol,
                            type: 'en-passant',
                            capturedPawn: { row: row, col: targetCol },
                            isPromotion: isPromotion
                        });
                        
                        if (this.constructor.consoleLog) {
                            console.log(`♟️⚔️ En passant! Pion ${adjacentPiece.color} en [${row},${targetCol}] → capture en [${targetRow},${targetCol}]${isPromotion ? ' (PROMOTION!)' : ''}`);
                        }
                    } else if (this.constructor.consoleLog) {
                        const side = offset === -1 ? 'gauche' : 'droite';
                        const reason = !adjacentPiece ? 'pas de pion' : 
                                     adjacentPiece.type !== 'pawn' ? 'pas un pion' : 
                                     adjacentPiece.color === pieceColor ? 'allié' : 
                                     'pas de double poussée récente';
                        console.log(`♟️❌ Pas d'en passant ${side}: ${reason}`);
                    }
                }
            });
        }

        // Filtrer les mouvements qui mettraient le roi en échec
        if (this.constructor.consoleLog) {
            console.log(`\n♟️🛡️ Vérification échec au roi pour ${pieceColor}`);
        }
        
        const validMoves = moves.filter(move => {
            const wouldBeInCheck = this.wouldKingBeInCheckAfterMove(pieceColor, row, col, move.row, move.col);
            
            if (this.constructor.consoleLog) {
                if (wouldBeInCheck) {
                    console.log(`  ❌ Mouvement [${row},${col}]->[${move.row},${move.col}] → mettrait le roi en échec`);
                } else {
                    const moveType = move.type === 'en-passant' ? 'en passant' : move.type;
                    console.log(`  ✓ Mouvement [${row},${col}]->[${move.row},${move.col}] (${moveType}) → sûr`);
                }
            }
            
            return !wouldBeInCheck;
        });

        if (this.constructor.consoleLog) {
            const filteredCount = moves.length - validMoves.length;
            console.log(`\n♟️✅ FINAL: Pion ${pieceColor} en [${row},${col}]`);
            console.log(`  - Mouvements bruts: ${moves.length}`);
            console.log(`  - Mouvements valides: ${validMoves.length}`);
            console.log(`  - Mouvements filtrés: ${filteredCount}`);
            
            if (validMoves.length > 0) {
                console.log(`  Mouvements valides:`);
                validMoves.forEach((move, index) => {
                    const typeIcon = move.type === 'capture' ? '⚔️' : 
                                   move.type === 'en-passant' ? '🎯' : ' ';
                    const promotion = move.isPromotion ? ' ♛' : '';
                    const double = move.isDoublePush ? ' (double)' : '';
                    console.log(`  ${index + 1}. [${move.row},${move.col}] ${typeIcon}${promotion}${double}`);
                });
            } else {
                console.log(`  ⚠️ Aucun mouvement valide disponible`);
            }
        }
        
        return validMoves;
    }

    // Vérifier si le mouvement mettrait le roi en échec
    wouldKingBeInCheckAfterMove(pieceColor, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`    ↳ Simulation: [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        try {
            // Créer une simulation du plateau
            const tempBoard = this.createTempBoard();
            
            // Déplacer le pion temporairement
            const pawnPiece = tempBoard[fromRow][fromCol];
            tempBoard[toRow][toCol] = pawnPiece;
            tempBoard[fromRow][fromCol] = null;
            
            if (this.constructor.consoleLog && this.constructor.consoleLog) {
                console.log(`      Simulation créée: pion déplacé`);
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

    isEnPassantPossible(pawnRow, pawnCol, attackerColor) {
        const lastMove = this.gameState.moveHistory[this.gameState.moveHistory.length - 1];
        
        if (!lastMove) return false;

        const isDoublePush = Math.abs(lastMove.from.row - lastMove.to.row) === 2;
        const isPawnMove = lastMove.piece === 'pawn';
        const isAdjacentPawn = lastMove.to.row === pawnRow && lastMove.to.col === pawnCol;
        const isOpponentColor = lastMove.color !== attackerColor;
        
        const isPossible = isDoublePush && isPawnMove && isAdjacentPawn && isOpponentColor;
        
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            if (lastMove) {
                console.log(`      Dernier coup: ${lastMove.color} ${lastMove.piece} [${lastMove.from.row},${lastMove.from.col}]→[${lastMove.to.row},${lastMove.to.col}]`);
                console.log(`      Conditions: double=${isDoublePush}, pion=${isPawnMove}, adjacent=${isAdjacentPawn}, adversaire=${isOpponentColor}`);
                console.log(`      En passant possible: ${isPossible ? 'OUI' : 'NON'}`);
            }
        }
        
        return isPossible;
    }

    isValidSquare(row, col) {
        const isValid = row >= 0 && row < 8 && col >= 0 && col < 8;
        return isValid;
    }
}

// Initialisation statique
PawnMoveValidator.init();

window.PawnMoveValidator = PawnMoveValidator;