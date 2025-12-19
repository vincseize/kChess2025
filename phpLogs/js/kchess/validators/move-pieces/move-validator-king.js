// validators/move-pieces/move-validator-king.js - Version utilisant la configuration JSON comme priorité
class KingMoveValidator {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('♔ validators/move-pieces/move-validator-king.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('♔ KingMoveValidator: Mode silencieux activé (debug désactivé dans config)');
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
                    console.log('♔ Configuration chargée depuis window.appConfig');
                }
            } else if (window.chessConfig) {
                // Configuration secondaire: window.chessConfig (pour compatibilité)
                if (window.chessConfig.debug !== undefined) {
                    this.consoleLog = window.chessConfig.debug;
                }
                
                if (this.consoleLog) {
                    console.log('♔ Configuration chargée depuis window.chessConfig (legacy)');
                }
            } else {
                // Fallback: valeurs par défaut
                if (this.consoleLog) {
                    console.log('♔ Configuration: valeurs par défaut utilisées');
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
        
        if (this.constructor.consoleLog) {
            console.log('🔧 KingMoveValidator initialisé');
            console.log(`  - Board: ${board ? '✓' : '✗'}`);
            console.log(`  - GameState: ${gameState ? '✓' : '✗'}`);
        }
    }

    getPossibleMoves(piece, row, col) {
        if (this.constructor.consoleLog) {
            console.log(`\n♔🔍 Recherche mouvements pour roi ${piece.color} en [${row},${col}]`);
        }
        
        const moves = [];
        const directions = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];

        const kingColor = piece.color;
        
        if (this.constructor.consoleLog) {
            console.log(`♔ Mouvements adjacents: ${directions.length} directions`);
        }
        
        // Mouvements normaux
        directions.forEach(([rowDir, colDir], index) => {
            const newRow = row + rowDir;
            const newCol = col + colDir;
            
            if (this.isValidSquare(newRow, newCol)) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                
                if (!targetPiece || targetPiece.color !== kingColor) {
                    if (!this.wouldBeInCheck(kingColor, row, col, newRow, newCol)) {
                        if (!this.wouldBeAdjacentToOpponentKing(kingColor, newRow, newCol)) {
                            const moveType = targetPiece ? 'capture' : 'move';
                            moves.push({ 
                                row: newRow, 
                                col: newCol, 
                                type: moveType 
                            });
                            
                            if (this.constructor.consoleLog) {
                                const directionDesc = this.getDirectionDescription(rowDir, colDir);
                                const pieceDesc = targetPiece ? 
                                    `⚔️ ${targetPiece.color} ${targetPiece.type}` : 'case vide';
                                console.log(`  ${index + 1}. [${newRow},${newCol}] ${directionDesc} → ${pieceDesc}`);
                            }
                        } else if (this.constructor.consoleLog) {
                            console.log(`  ${index + 1}. [${newRow},${newCol}] → ❌ trop près du roi adverse`);
                        }
                    } else if (this.constructor.consoleLog) {
                        console.log(`  ${index + 1}. [${newRow},${newCol}] → ❌ mettrait le roi en échec`);
                    }
                } else if (this.constructor.consoleLog) {
                    console.log(`  ${index + 1}. [${newRow},${newCol}] → ❌ bloqué par ${targetPiece.color} ${targetPiece.type} (allié)`);
                }
            } else if (this.constructor.consoleLog) {
                console.log(`  ${index + 1}. [${newRow},${newCol}] → ❌ hors plateau`);
            }
        });

        if (this.constructor.consoleLog) {
            console.log(`\n♔📊 Résultat mouvements normaux: ${moves.length} mouvements`);
        }
        
        // Vérification du roque
        if (this.constructor.consoleLog) {
            console.log(`\n♔🏰 VÉRIFICATION ROQUE ${kingColor}:`);
            console.log(`  Position actuelle: [${row},${col}]`);
        }
        
        const isOnStartingSquare = this.isKingOnStartingSquare(kingColor, row, col);
        const hasMovedInGameState = this.hasKingMoved(kingColor);
        const canCastle = isOnStartingSquare && !hasMovedInGameState;
        
        if (this.constructor.consoleLog) {
            console.log(`  Sur case départ: ${isOnStartingSquare ? '✓' : '✗'}`);
            console.log(`  A bougé: ${hasMovedInGameState ? '✗' : '✓'}`);
            console.log(`  Roque possible: ${canCastle ? '✓' : '✗'}`);
        }
        
        if (canCastle) {
            const castleMoves = this.getCastleMoves(piece, row, col);
            moves.push(...castleMoves);
            
            if (this.constructor.consoleLog) {
                console.log(`  ${castleMoves.length} mouvement(s) de roque ajouté(s)`);
            }
        } else if (this.constructor.consoleLog) {
            console.log(`  ❌ Roque refusé pour ${kingColor}`);
        }

        if (this.constructor.consoleLog) {
            console.log(`\n♔✅ FINAL: Roi ${kingColor} en [${row},${col}]`);
            console.log(`  - Total mouvements: ${moves.length}`);
            
            if (moves.length > 0) {
                console.log(`  Mouvements valides:`);
                moves.forEach((move, index) => {
                    const typeIcon = move.type.includes('castle') ? '🏰' : 
                                   move.type === 'capture' ? '⚔️' : ' ';
                    const castleType = move.type.includes('castle') ? 
                        ` (${move.type.includes('kingside') ? 'petit roque' : 'grand roque'})` : '';
                    console.log(`  ${index + 1}. [${move.row},${move.col}] ${typeIcon}${castleType}`);
                });
            } else {
                console.log(`  ⚠️ Aucun mouvement valide disponible`);
            }
        }
        
        return moves;
    }

    // NOUVELLE MÉTHODE : Description des directions
    getDirectionDescription(rowDir, colDir) {
        const descriptions = {
            '1,0': '↓ bas',
            '-1,0': '↑ haut',
            '0,1': '→ droite',
            '0,-1': '← gauche',
            '1,1': '↘️ SE',
            '1,-1': '↙️ SO',
            '-1,1': '↗️ NE',
            '-1,-1': '↖️ NO'
        };
        
        return descriptions[`${rowDir},${colDir}`] || `[${rowDir},${colDir}]`;
    }

    // Vérifier si le roi est sur sa case de départ
    isKingOnStartingSquare(color, currentRow, currentCol) {
        const startingRow = color === 'white' ? 7 : 0;
        const startingCol = 4;
        
        const isOnStart = currentRow === startingRow && currentCol === startingCol;
        
        if (this.constructor.consoleLog) {
            console.log(`    ↳ Case départ ${color}: [${startingRow},${startingCol}] vs actuelle: [${currentRow},${currentCol}] = ${isOnStart ? '✓' : '✗'}`);
        }
        
        return isOnStart;
    }

    // Roques possibles
    getCastleMoves(king, row, col) {
        const moves = [];
        const color = king.color;
        
        if (this.constructor.consoleLog) {
            console.log(`\n♔🏰 Analyse roque pour ${color}`);
        }
        
        // Le roi ne doit pas être en échec
        if (this.isKingInCheck(color)) {
            if (this.constructor.consoleLog) {
                console.log(`  ❌ Roque impossible: roi ${color} en échec`);
            }
            return moves;
        }

        // Roque côté roi (petit roque)
        if (this.canCastleKingside(color)) {
            if (this.constructor.consoleLog) {
                console.log(`  ✓ Roque côté roi possible`);
            }
            const kingsideMove = this.createCastleMove(color, 'kingside');
            if (kingsideMove) moves.push(kingsideMove);
        }

        // Roque côté dame (grand roque)
        if (this.canCastleQueenside(color)) {
            if (this.constructor.consoleLog) {
                console.log(`  ✓ Roque côté dame possible`);
            }
            const queensideMove = this.createCastleMove(color, 'queenside');
            if (queensideMove) moves.push(queensideMove);
        }

        return moves;
    }

    // Vérifier via gameState si le roi a bougé
    hasKingMoved(color) {
        if (this.constructor.consoleLog) {
            console.log(`    ↳ Vérification déplacement roi ${color}`);
        }
        
        // Priorité à gameState s'il existe et est initialisé
        if (this.gameState && this.gameState.hasKingMoved) {
            const hasMoved = this.gameState.hasKingMoved[color];
            
            if (this.constructor.consoleLog) {
                console.log(`      gameState.hasKingMoved[${color}] = ${hasMoved}`);
            }
            
            return hasMoved === true;
        }
        
        // Si gameState n'est pas disponible, utiliser un fallback sécurisé
        if (this.constructor.consoleLog) {
            console.log(`      gameState non disponible, fallback`);
        }
        
        return this.hasKingMovedFallback(color);
    }

    // Fallback sécurisé pour vérifier si le roi a bougé
    hasKingMovedFallback(color) {
        const startRow = color === 'white' ? 7 : 0;
        const startCol = 4;
        
        const king = this.board.getPiece(startRow, startCol);
        const isOnStartSquare = king && king.type === 'king' && king.color === color;
        
        if (this.constructor.consoleLog) {
            console.log(`      fallback: roi ${color} sur [${startRow},${startCol}] = ${isOnStartSquare ? '✓' : '✗'}`);
        }
        
        return !isOnStartSquare;
    }

    // Vérifier le roque côté roi
    canCastleKingside(color) {
        if (this.constructor.consoleLog) {
            console.log(`  🔍 Roque côté roi (${color}):`);
        }
        
        // Vérifier si la tour côté roi n'a pas bougé
        if (this.hasRookMoved(color, 'kingside')) {
            if (this.constructor.consoleLog) {
                console.log(`    ❌ Tour côté roi a bougé`);
            }
            return false;
        }

        // Vérifier les cases vides entre roi et tour
        if (!this.areCastleSquaresEmpty(color, 'kingside')) {
            if (this.constructor.consoleLog) {
                console.log(`    ❌ Cases non vides`);
            }
            return false;
        }

        // Vérifier que les cases traversées ne sont pas attaquées
        if (!this.areCastleSquaresSafe(color, 'kingside')) {
            if (this.constructor.consoleLog) {
                console.log(`    ❌ Cases attaquées`);
            }
            return false;
        }

        if (this.constructor.consoleLog) {
            console.log(`    ✓ Conditions remplies`);
        }
        
        return true;
    }

    // Vérifier le roque côté dame
    canCastleQueenside(color) {
        if (this.constructor.consoleLog) {
            console.log(`  🔍 Roque côté dame (${color}):`);
        }
        
        // Vérifier si la tour côté dame n'a pas bougé
        if (this.hasRookMoved(color, 'queenside')) {
            if (this.constructor.consoleLog) {
                console.log(`    ❌ Tour côté dame a bougé`);
            }
            return false;
        }

        // Vérifier les cases vides entre roi et tour
        if (!this.areCastleSquaresEmpty(color, 'queenside')) {
            if (this.constructor.consoleLog) {
                console.log(`    ❌ Cases non vides`);
            }
            return false;
        }

        // Vérifier que les cases traversées ne sont pas attaquées
        if (!this.areCastleSquaresSafe(color, 'queenside')) {
            if (this.constructor.consoleLog) {
                console.log(`    ❌ Cases attaquées`);
            }
            return false;
        }

        if (this.constructor.consoleLog) {
            console.log(`    ✓ Conditions remplies`);
        }
        
        return true;
    }

    // Vérifier si les cases sont vides pour le roque
    areCastleSquaresEmpty(color, side) {
        const row = color === 'white' ? 7 : 0;
        
        if (side === 'kingside') {
            // Cases f et g doivent être vides
            const fEmpty = !this.board.getPiece(row, 5);
            const gEmpty = !this.board.getPiece(row, 6);
            
            if (this.constructor.consoleLog) {
                console.log(`      Cases [${row},5] (f): ${fEmpty ? '✓ vide' : '✗ occupée'}`);
                console.log(`      Cases [${row},6] (g): ${gEmpty ? '✓ vide' : '✗ occupée'}`);
            }
            
            return fEmpty && gEmpty;
        } else {
            // Cases b, c, d doivent être vides
            const bEmpty = !this.board.getPiece(row, 1);
            const cEmpty = !this.board.getPiece(row, 2);
            const dEmpty = !this.board.getPiece(row, 3);
            
            if (this.constructor.consoleLog) {
                console.log(`      Cases [${row},1] (b): ${bEmpty ? '✓ vide' : '✗ occupée'}`);
                console.log(`      Cases [${row},2] (c): ${cEmpty ? '✓ vide' : '✗ occupée'}`);
                console.log(`      Cases [${row},3] (d): ${dEmpty ? '✓ vide' : '✗ occupée'}`);
            }
            
            return bEmpty && cEmpty && dEmpty;
        }
    }

    // Vérifier si les cases traversées sont sûres
    areCastleSquaresSafe(color, side) {
        const row = color === 'white' ? 7 : 0;
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        if (side === 'kingside') {
            // Le roi traverse f et g - ces cases ne doivent pas être attaquées
            const fAttacked = this.isSquareAttacked(row, 5, opponentColor);
            const gAttacked = this.isSquareAttacked(row, 6, opponentColor);
            
            if (this.constructor.consoleLog) {
                console.log(`      Cases [${row},5] (f): ${fAttacked ? '✗ attaquée' : '✓ sûre'}`);
                console.log(`      Cases [${row},6] (g): ${gAttacked ? '✗ attaquée' : '✓ sûre'}`);
            }
            
            return !fAttacked && !gAttacked;
        } else {
            // Le roi traverse d et c - ces cases ne doivent pas être attaquées
            const dAttacked = this.isSquareAttacked(row, 3, opponentColor);
            const cAttacked = this.isSquareAttacked(row, 2, opponentColor);
            
            if (this.constructor.consoleLog) {
                console.log(`      Cases [${row},3] (d): ${dAttacked ? '✗ attaquée' : '✓ sûre'}`);
                console.log(`      Cases [${row},2] (c): ${cAttacked ? '✗ attaquée' : '✓ sûre'}`);
            }
            
            return !dAttacked && !cAttacked;
        }
    }

    // Vérifier si une tour a bougé
    hasRookMoved(color, side) {
        const row = color === 'white' ? 7 : 0;
        const rookCol = side === 'kingside' ? 7 : 0;
        
        if (this.constructor.consoleLog) {
            console.log(`    ↳ Tour ${side} ${color} en [${row},${rookCol}]`);
        }
        
        // Vérifier via gameState d'abord
        if (this.gameState && this.gameState.hasRookMoved && this.gameState.hasRookMoved[color]) {
            const rookState = this.gameState.hasRookMoved[color];
            const hasMoved = side === 'kingside' ? rookState.kingside : rookState.queenside;
            
            if (this.constructor.consoleLog) {
                console.log(`      gameState: ${hasMoved ? '✗ a bougé' : '✓ pas bougé'}`);
            }
            
            if (hasMoved) return true;
        }
        
        // Fallback: vérifier si la tour est présente
        const rook = this.board.getPiece(row, rookCol);
        const isRookPresent = rook && rook.type === 'rook' && rook.color === color;
        
        if (this.constructor.consoleLog) {
            console.log(`      fallback: ${isRookPresent ? '✓ présente' : '✗ absente'}`);
        }
        
        return !isRookPresent;
    }

    // Créer un mouvement de roque
    createCastleMove(color, side) {
        const row = color === 'white' ? 7 : 0;
        
        if (side === 'kingside') {
            return {
                row: row,
                col: 6,
                type: 'castle-kingside',
                special: 'castle'
            };
        } else {
            return {
                row: row,
                col: 2,
                type: 'castle-queenside', 
                special: 'castle'
            };
        }
    }

    // Vérifier si une case est attaquée
// Simplification de votre isSquareAttacked dans moveValidator
isSquareAttacked(row, col, attackerColor) {
    try {
        // Normalisation de la couleur : 'white' -> 'w', 'black' -> 'b'
        const colorCode = attackerColor.startsWith('w') ? 'w' : 'b';
        const currentFEN = this.gameState.getCurrentFEN(); // Utilisez le FEN actuel plutôt qu'un temp
        const engine = new ChessEngine(currentFEN);
        
        return engine.isSquareAttacked(row, col, colorCode);
    } catch (error) {
        console.error('❌ Erreur critique isSquareAttacked:', error);
        return true; 
    }
}

    // Vérifier si le roi est en échec
    isKingInCheck(color) {
        try {
            const tempBoard = this.createTempBoard();
            const tempFEN = this.generateTempFEN(tempBoard, color);
            const engine = new ChessEngine(tempFEN);
            return engine.isKingInCheck(color === 'white' ? 'w' : 'b');
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.error('❌ Erreur dans isKingInCheck:', error);
            }
            return true; // En cas d'erreur, considérer comme en échec pour sécurité
        }
    }

    wouldBeInCheck(kingColor, fromRow, fromCol, toRow, toCol) {
        try {
            const tempBoard = this.createTempBoard();
            const kingPiece = tempBoard[fromRow][fromCol];
            tempBoard[toRow][toCol] = kingPiece;
            tempBoard[fromRow][fromCol] = null;
            const tempFEN = this.generateTempFEN(tempBoard, kingColor);
            const engine = new ChessEngine(tempFEN);
            const isInCheck = engine.isKingInCheck(kingColor === 'white' ? 'w' : 'b');
            
            if (this.constructor.consoleLog) {
                console.log(`      Simulation [${fromRow},${fromCol}]->[${toRow},${toCol}]: ${isInCheck ? '✗ échec' : '✓ sûr'}`);
            }
            
            return isInCheck;
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.error('❌ Erreur dans wouldBeInCheck:', error);
            }
            return true;
        }
    }

    wouldBeAdjacentToOpponentKing(kingColor, newRow, newCol) {
        const opponentColor = kingColor === 'white' ? 'black' : 'white';
        const opponentKingPos = this.findKingPosition(opponentColor);
        if (!opponentKingPos) return false;
        const rowDiff = Math.abs(newRow - opponentKingPos.row);
        const colDiff = Math.abs(newCol - opponentKingPos.col);
        const areAdjacent = rowDiff <= 1 && colDiff <= 1;
        
        if (areAdjacent && this.constructor.consoleLog) {
            console.log(`      ⚠️ Rois adjacents: [${newRow},${newCol}] vs [${opponentKingPos.row},${opponentKingPos.col}]`);
        }
        
        return areAdjacent;
    }

    findKingPosition(color) {
        const kingType = 'king';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.board.getSquare(row, col);
                if (square.piece && square.piece.type === kingType && square.piece.color === color) {
                    return { row, col };
                }
            }
        }
        
        if (this.constructor.consoleLog) {
            console.warn(`❌ Roi ${color} non trouvé !`);
        }
        
        return null;
    }

    createTempBoard() {
        const tempBoard = Array(8).fill().map(() => Array(8).fill(null));
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.board.getSquare(row, col);
                if (square && square.piece) {
                    tempBoard[row][col] = { 
                        type: square.piece.type,
                        color: square.piece.color
                    };
                }
            }
        }
        return tempBoard;
    }

    convertPieceToFEN(piece) {
        if (!piece) return null;
        const pieceMap = {
            'king': 'k', 'queen': 'q', 'rook': 'r', 'bishop': 'b', 'knight': 'n', 'pawn': 'p'
        };
        const pieceCode = pieceMap[piece.type] || '?';
        return piece.color === 'white' ? pieceCode.toUpperCase() : pieceCode;
    }

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
                    fen += this.convertPieceToFEN(piece);
                }
            }
            if (emptyCount > 0) fen += emptyCount;
            if (row < 7) fen += '/';
        }
        const nextPlayer = currentPlayer === 'white' ? 'b' : 'w';
        fen += ` ${nextPlayer} KQkq - 0 1`;
        return fen;
    }

    isValidSquare(row, col) {
        const isValid = row >= 0 && row < 8 && col >= 0 && col < 8;
        return isValid;
    }
}

// Initialisation statique
KingMoveValidator.init();

window.KingMoveValidator = KingMoveValidator;