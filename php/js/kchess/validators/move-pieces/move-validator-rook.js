// validators/move-pieces/move-validator-rook.js - Version utilisant la configuration JSON comme priorité
if (typeof RookMoveValidator !== 'undefined') {
    console.warn('⚠️ RookMoveValidator existe déjà. Vérifiez les doublons dans les imports.');
} else {

class RookMoveValidator {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('🏰 validators/move-pieces/move-validator-rook.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('🏰 RookMoveValidator: Mode silencieux activé (debug désactivé dans config)');
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
                    console.log('🏰 Configuration chargée depuis window.appConfig');
                }
            } else if (window.chessConfig) {
                // Configuration secondaire: window.chessConfig (pour compatibilité)
                if (window.chessConfig.debug !== undefined) {
                    this.consoleLog = window.chessConfig.debug;
                }
                
                if (this.consoleLog) {
                    console.log('🏰 Configuration chargée depuis window.chessConfig (legacy)');
                }
            } else {
                // Fallback: valeurs par défaut
                if (this.consoleLog) {
                    console.log('🏰 Configuration: valeurs par défaut utilisées');
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
            console.log('🔧 RookMoveValidator initialisé');
            console.log(`  - Board: ${board ? '✓' : '✗'}`);
            console.log(`  - GameState: ${gameState ? '✓' : '✗'}`);
        }
    }

    getPossibleMoves(piece, row, col) {
        if (this.constructor.consoleLog) {
            console.log(`\n🏰🔍 Recherche mouvements pour tour ${piece.color} en [${row},${col}]`);
        }
        
        const moves = [];
        const directions = [
            [1, 0],   // Bas
            [-1, 0],  // Haut
            [0, 1],   // Droite
            [0, -1]   // Gauche
        ];

        const pieceColor = piece.color;

        if (this.constructor.consoleLog) {
            console.log(`  Directions: Haut ▲, Bas ▼, Gauche ◀, Droite ▶`);
        }

        // Générer tous les mouvements possibles
        directions.forEach(([rowDir, colDir], index) => {
            if (this.constructor.consoleLog) {
                const directionNames = ['Bas ▼', 'Haut ▲', 'Droite ▶', 'Gauche ◀'];
                console.log(`\n  Exploration ${directionNames[index]}: [${rowDir},${colDir}]`);
            }
            
            this.addSlidingMoves(moves, piece, row, col, rowDir, colDir);
        });

        if (this.constructor.consoleLog) {
            console.log(`\n🏰📊 Résultat brut: ${moves.length} mouvements trouvés`);
            if (moves.length > 0) {
                moves.forEach((move, index) => {
                    const typeIcon = move.type === 'capture' ? '⚔️' : '➡️';
                    console.log(`  ${index + 1}. ${typeIcon} [${move.row},${move.col}] (${move.type})`);
                });
            }
        }

        // Filtrer les mouvements qui mettraient le roi en échec
        if (this.constructor.consoleLog) {
            console.log(`\n🏰🛡️ Vérification échec au roi pour ${pieceColor}`);
        }
        
        const validMoves = moves.filter(move => {
            const wouldBeInCheck = this.wouldKingBeInCheckAfterMove(pieceColor, row, col, move.row, move.col);
            
            if (this.constructor.consoleLog) {
                if (wouldBeInCheck) {
                    console.log(`  ❌ Mouvement [${row},${col}]->[${move.row},${move.col}] → mettrait le roi en échec`);
                } else {
                    console.log(`  ✓ Mouvement [${row},${col}]->[${move.row},${move.col}] → sûr`);
                }
            }
            
            return !wouldBeInCheck;
        });

        if (this.constructor.consoleLog) {
            const filteredCount = moves.length - validMoves.length;
            console.log(`\n🏰✅ Final: ${moves.length} mouvements bruts, ${validMoves.length} valides (${filteredCount} filtrés)`);
            
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

        while (this.isValidSquare(row, col)) {
            const targetPiece = this.board.getPiece(row, col);
            
            if (!targetPiece) {
                moves.push({ row, col, type: 'move', distance });
                
                if (this.constructor.consoleLog) {
                    console.log(`    Distance ${distance}: [${row},${col}] → libre`);
                }
            } else {
                if (targetPiece.color !== piece.color) {
                    moves.push({ row, col, type: 'capture', distance });
                    
                    if (this.constructor.consoleLog) {
                        console.log(`    Distance ${distance}: [${row},${col}] → ⚔️ ${targetPiece.color} ${targetPiece.type}`);
                    }
                } else {
                    if (this.constructor.consoleLog) {
                        console.log(`    Distance ${distance}: [${row},${col}] → ❌ bloqué par ${targetPiece.color} ${targetPiece.type}`);
                    }
                }
                break;
            }
            
            row += rowDir;
            col += colDir;
            distance++;
        }

        if (this.constructor.consoleLog && distance === 1) {
            console.log(`    Aucun mouvement dans cette direction`);
        }
    }

    // Vérifier si le mouvement mettrait le roi en échec
    wouldKingBeInCheckAfterMove(pieceColor, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`    ↳ Simulation: [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        try {
            // Créer une simulation du plateau
            const tempBoard = this.createTempBoard();
            
            // Déplacer la tour temporairement
            const rookPiece = tempBoard[fromRow][fromCol];
            tempBoard[toRow][toCol] = rookPiece;
            tempBoard[fromRow][fromCol] = null;
            
            if (this.constructor.consoleLog) {
                console.log(`      Simulation créée: tour déplacée`);
            }
            
            // Générer un FEN temporaire
            const tempFEN = this.generateTempFEN(tempBoard, pieceColor);
            
            if (this.constructor.consoleLog) {
                console.log(`      FEN généré: ${tempFEN.substring(0, 30)}...`);
            }
            
            // Vérifier l'échec
            const engine = new ChessEngine(tempFEN);
            const colorCode = pieceColor === 'white' ? 'w' : 'b';
            const isInCheck = engine.isKingInCheck(colorCode);
            
            if (this.constructor.consoleLog) {
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

    // NOUVELLE MÉTHODE : Vérifier si la tour peut roquer
    canCastle(piece, row, col, kingRow, kingCol) {
        if (!this.constructor.consoleLog) return false;
        
        console.log(`\n🏰👑 Vérification roque pour tour en [${row},${col}] et roi en [${kingRow},${kingCol}]`);
        
        // Vérifier si la tour n'a pas bougé
        const hasMoved = this.gameState?.hasPieceMoved?.(piece);
        if (hasMoved) {
            console.log(`  ❌ Tour a déjà bougé - pas de roque`);
            return false;
        }
        
        // Vérifier la direction
        const isLeftRook = col < kingCol;
        const direction = isLeftRook ? 'gauche (grand roque)' : 'droite (petit roque)';
        console.log(`  Direction: ${direction}`);
        
        // Vérifier les cases entre la tour et le roi
        const startCol = Math.min(col, kingCol) + 1;
        const endCol = Math.max(col, kingCol) - 1;
        let pathClear = true;
        
        for (let c = startCol; c <= endCol; c++) {
            const pieceBetween = this.board.getPiece(row, c);
            if (pieceBetween) {
                console.log(`  ❌ Case [${row},${c}] bloquée par ${pieceBetween.color} ${pieceBetween.type}`);
                pathClear = false;
                break;
            }
        }
        
        console.log(`  Chemin ${pathClear ? '✓ libre' : '✗ bloqué'}`);
        return pathClear && !hasMoved;
    }

    // NOUVELLE MÉTHODE : Afficher les informations de la tour
    displayRookInfo(piece, row, col) {
        if (!this.constructor.consoleLog) return;
        
        console.log(`\n🏰📋 INFORMATIONS TOUR:`);
        console.log(`  Position: [${row},${col}]`);
        console.log(`  Couleur: ${piece.color}`);
        console.log(`  A bougé: ${this.gameState?.hasPieceMoved?.(piece) ? 'Oui' : 'Non'}`);
        
        const moves = this.getPossibleMoves(piece, row, col);
        console.log(`  Mouvements disponibles: ${moves.length}`);
        
        // Analyse des directions
        const directions = [
            { name: 'Haut ▲', dir: [-1, 0] },
            { name: 'Bas ▼', dir: [1, 0] },
            { name: 'Gauche ◀', dir: [0, -1] },
            { name: 'Droite ▶', dir: [0, 1] }
        ];
        
        console.log(`  Portée par direction:`);
        directions.forEach(({ name, dir }) => {
            let distance = 0;
            let r = row + dir[0];
            let c = col + dir[1];
            
            while (this.isValidSquare(r, c) && !this.board.getPiece(r, c)) {
                distance++;
                r += dir[0];
                c += dir[1];
            }
            
            if (this.isValidSquare(r, c)) {
                const targetPiece = this.board.getPiece(r, c);
                if (targetPiece && targetPiece.color !== piece.color) {
                    distance++;
                }
            }
            
            console.log(`    ${name}: ${distance} cases`);
        });
    }
}

// Initialisation statique
RookMoveValidator.init();

window.RookMoveValidator = RookMoveValidator;

} // Fin du if de protection