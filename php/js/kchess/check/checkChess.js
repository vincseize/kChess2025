// check/checkChess.js - Moteur de vérification d'échec simple avec priorité à la config JSON
class ChessEngine {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('✅ check/checkChess.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            console.info('🔇 checkChess.js: Mode silencieux activé');
        }
    }
    
    // Méthode pour charger la configuration CORRIGÉE - vérifie chess_engine EN PREMIER
    static loadConfig(debugLoading = false) {
        try {
            if (debugLoading && this.consoleLog) {
                console.log('🔄 ChessEngine.loadConfig() appelé');
                console.log('🔍 Recherche de window.appConfig...');
            }
            
            let configValue = null;
            let configSource = '';
            
            // PRIORITÉ 1: window.appConfig.chess_engine.console_log (comme PawnMoveValidator)
            if (window.appConfig && window.appConfig.chess_engine) {
                configValue = window.appConfig.chess_engine.console_log;
                configSource = 'chess_engine';
                if (debugLoading && this.consoleLog) {
                    console.log(`📊 PRIO 1: chess_engine.console_log trouvé: "${configValue}" (type: ${typeof configValue})`);
                }
            }
            // PRIORITÉ 2: window.appConfig.debug.console_log
            else if (window.appConfig && window.appConfig.debug) {
                configValue = window.appConfig.debug.console_log;
                configSource = 'debug';
                if (debugLoading && this.consoleLog) {
                    console.log(`📊 PRIO 2: debug.console_log trouvé: "${configValue}" (type: ${typeof configValue})`);
                }
            }
            
            // Si une valeur de config a été trouvée
            if (configValue !== null) {
                // CONVERSION CORRECTE - Gérer les string "false" et "true"
                let newConsoleLog;
                if (configValue === "false") {
                    newConsoleLog = false;
                } else if (configValue === false) {
                    newConsoleLog = false;
                } else if (configValue === "true") {
                    newConsoleLog = true;
                } else if (configValue === true) {
                    newConsoleLog = true;
                } else {
                    // Pour toute autre valeur, utiliser Boolean()
                    newConsoleLog = Boolean(configValue);
                }
                
                // Mettre à jour seulement si la valeur a changé
                if (this.consoleLog !== newConsoleLog) {
                    if (debugLoading && this.consoleLog) {
                        console.log(`🔄 Changement de consoleLog via ${configSource}: ${this.consoleLog} → ${newConsoleLog}`);
                    }
                    this.consoleLog = newConsoleLog;
                } else if (debugLoading && this.consoleLog) {
                    console.log(`ℹ️ Pas de changement via ${configSource} (déjà ${this.consoleLog})`);
                }
                
                if (debugLoading && this.consoleLog) {
                    console.log(`🔧 Configuration finale: console_log = ${this.consoleLog} (source: ${configSource})`);
                }
                
                return true;
            }
            
            // Si window.appConfig n'existe pas, essayer de le charger via fonction utilitaire
            if (typeof window.getConfig === 'function') {
                if (debugLoading && this.consoleLog) {
                    console.log('🔍 Appel de window.getConfig()...');
                }
                const getConfigValue = window.getConfig('debug.console_log', 'true');
                
                if (getConfigValue === "false") {
                    this.consoleLog = false;
                } else if (getConfigValue === false) {
                    this.consoleLog = false;
                } else {
                    this.consoleLog = Boolean(getConfigValue);
                }
                
                if (debugLoading && this.consoleLog) {
                    console.log(`📊 Valeur getConfig: "${getConfigValue}" → ${this.consoleLog}`);
                }
                return true;
            }
            
            // Si rien n'est disponible, garder la valeur par défaut
            if (this.consoleLog && debugLoading) {
                console.log('⚠️ ChessEngine: Aucune configuration trouvée, utilisation de la valeur par défaut');
            }
            return false;
            
        } catch (error) {
            console.error('❌ ChessEngine: Erreur lors du chargement de la config:', error);
            return false;
        }
    }
    
    // Méthode pour déterminer la source de la configuration
    static getConfigSource() {
        if (window.appConfig && window.appConfig.chess_engine) {
            return 'chess_engine config';
        } else if (window.appConfig && window.appConfig.debug) {
            return 'debug config';
        } else if (typeof window.getConfig === 'function') {
            return 'fonction getConfig';
        } else {
            return 'valeur par défaut';
        }
    }
    
    // Méthode pour vérifier si on est en mode debug
    static isDebugMode() {
        return this.consoleLog;
    }

    constructor(fen) {
        this.fen = fen;
        this.board = this.parseFEN(fen);
        const parts = fen.split(' ');
        this.turn = parts[1]; // 'w' pour blanc, 'b' pour noir
        
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        if (this.constructor.consoleLog) {
            console.log('🔧 ChessEngine créé avec FEN:', fen.substring(0, 50) + (fen.length > 50 ? '...' : ''));
            console.log(`📊 Source config: ${this.constructor.getConfigSource()}`);
            this.displayBoard(); // Afficher le plateau à la création
        } else {
            console.info('🔧 ChessEngine créé (mode silencieux)');
        }
    }

    parseFEN(fen) {
        const board = Array(8).fill().map(() => Array(8).fill(null));
        const boardPart = fen.split(' ')[0];
        let row = 0, col = 0;
        
        for (const char of boardPart) {
            if (char === '/') {
                row++;
                col = 0;
            } else if (isNaN(char)) {
                board[row][col] = char;
                col++;
            } else {
                col += parseInt(char);
            }
        }
        return board;
    }

    getPiece(row, col) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
        return this.board[row][col];
    }

    findKing(color) {
        if (this.constructor.consoleLog) {
            console.log(`👑 Recherche du roi ${color === 'w' ? 'blanc' : 'noir'}`);
        }
        
        const king = color === 'w' ? 'K' : 'k';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === king) {
                    if (this.constructor.consoleLog) {
                        console.log(`👑✅ Roi ${color === 'w' ? 'blanc' : 'noir'} trouvé en [${row},${col}]`);
                    }
                    return { row, col };
                }
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log(`👑❌ Roi ${color === 'w' ? 'blanc' : 'noir'} NON TROUVÉ!`);
        }
        return null;
    }

    isSquareAttacked(row, col, attackerColor) {
        // Mode silencieux - exécuter sans logs
        if (!this.constructor.consoleLog) {
            const directions = {
                rook: [[-1,0], [1,0], [0,-1], [0,1]],
                bishop: [[-1,-1], [-1,1], [1,-1], [1,1]],
                queen: [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]],
                knight: [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]]
            };

            const pawnAttacks = attackerColor === 'w' 
                ? [[1, -1], [1, 1]]   // Pions blancs attaquent vers le bas
                : [[-1, -1], [-1, 1]]; // Pions noirs attaquent vers le haut

            // Vérifier les pions
            for (const [dr, dc] of pawnAttacks) {
                const r = row + dr, c = col + dc;
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const piece = this.getPiece(r, c);
                    const pawn = attackerColor === 'w' ? 'P' : 'p';
                    if (piece === pawn) return true;
                }
            }

            // Vérifier les cavaliers
            for (const [dr, dc] of directions.knight) {
                const r = row + dr, c = col + dc;
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const piece = this.getPiece(r, c);
                    const knight = attackerColor === 'w' ? 'N' : 'n';
                    if (piece === knight) return true;
                }
            }

            // Vérifier les directions (tours, fous, dame)
            for (const [type, dirs] of [['rook', directions.rook], ['bishop', directions.bishop], ['queen', directions.queen]]) {
                for (const [dr, dc] of dirs) {
                    let r = row + dr, c = col + dc;
                    
                    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                        const piece = this.getPiece(r, c);
                        if (piece) {
                            const pieceType = piece.toLowerCase();
                            const isAttackerColor = (attackerColor === 'w') === (piece === piece.toUpperCase());
                            
                            if (isAttackerColor) {
                                if (type === 'rook' && (pieceType === 'r' || pieceType === 'q')) return true;
                                if (type === 'bishop' && (pieceType === 'b' || pieceType === 'q')) return true;
                                if (type === 'queen' && pieceType === 'q') return true;
                            }
                            break;
                        }
                        r += dr;
                        c += dc;
                    }
                }
            }
            
            return false;
        }
        
        // Mode debug - avec logs
        if (this.constructor.consoleLog) {
            console.log(`\n🔍🔍🔍 Vérification case [${row},${col}] attaquée par ${attackerColor === 'w' ? 'blancs' : 'noirs'}`);
        }
        
        const directions = {
            rook: [[-1,0], [1,0], [0,-1], [0,1]],
            bishop: [[-1,-1], [-1,1], [1,-1], [1,1]],
            queen: [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]],
            knight: [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]]
        };

        const pawnAttacks = attackerColor === 'w' 
            ? [[1, -1], [1, 1]]   // Pions blancs attaquent vers le bas
            : [[-1, -1], [-1, 1]]; // Pions noirs attaquent vers le haut

        if (this.constructor.consoleLog) {
            console.log(`🎯 Directions d'attaque des pions ${attackerColor}:`, pawnAttacks);
        }

        // Vérifier les pions
        for (const [dr, dc] of pawnAttacks) {
            const r = row + dr, c = col + dc;
            
            if (this.constructor.consoleLog) {
                console.log(`  → Vérification case [${r},${c}] pour un pion ${attackerColor}`);
            }
            
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const piece = this.getPiece(r, c);
                const pawn = attackerColor === 'w' ? 'P' : 'p';
                
                if (this.constructor.consoleLog) {
                    console.log(`    Pièce trouvée: '${piece}', attendu: '${pawn}'`);
                }
                
                if (piece === pawn) {
                    if (this.constructor.consoleLog) {
                        console.log(`🎯✅✅✅ PION TROUVÉ! Pion ${attackerColor} attaque depuis [${r},${c}] vers [${row},${col}]`);
                    }
                    return true;
                }
            }
        }

        // Vérifier les cavaliers
        for (const [dr, dc] of directions.knight) {
            const r = row + dr, c = col + dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const piece = this.getPiece(r, c);
                const knight = attackerColor === 'w' ? 'N' : 'n';
                if (piece === knight) {
                    if (this.constructor.consoleLog) {
                        console.log(`🐴✅ Cavalier ${attackerColor} attaque depuis [${r},${c}]`);
                    }
                    return true;
                }
            }
        }

        // Vérifier les directions (tours, fous, dame)
        for (const [type, dirs] of [['rook', directions.rook], ['bishop', directions.bishop], ['queen', directions.queen]]) {
            for (const [dr, dc] of dirs) {
                let r = row + dr, c = col + dc;
                
                while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const piece = this.getPiece(r, c);
                    if (piece) {
                        const pieceType = piece.toLowerCase();
                        const isAttackerColor = (attackerColor === 'w') === (piece === piece.toUpperCase());
                        
                        if (isAttackerColor) {
                            if (type === 'rook' && (pieceType === 'r' || pieceType === 'q')) {
                                if (this.constructor.consoleLog) {
                                    console.log(`🏰✅ ${type} ${attackerColor} attaque depuis [${r},${c}]`);
                                }
                                return true;
                            }
                            if (type === 'bishop' && (pieceType === 'b' || pieceType === 'q')) {
                                if (this.constructor.consoleLog) {
                                    console.log(`🗼✅ ${type} ${attackerColor} attaque depuis [${r},${c}]`);
                                }
                                return true;
                            }
                            if (type === 'queen' && pieceType === 'q') {
                                if (this.constructor.consoleLog) {
                                    console.log(`👑✅ ${type} ${attackerColor} attaque depuis [${r},${c}]`);
                                }
                                return true;
                            }
                        }
                        break;
                    }
                    r += dr;
                    c += dc;
                }
            }
        }

        if (this.constructor.consoleLog) {
            console.log(`🔍❌❌❌ AUCUNE ATTAQUE détectée sur [${row},${col}]`);
        }
        return false;
    }

    // Vérifie l'échec pour une couleur spécifique
    isKingInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) {
            if (this.constructor.consoleLog) {
                console.log(`❌ Roi ${color} non trouvé!`);
            }
            return false;
        }
        
        if (this.constructor.consoleLog) {
            console.log(`\n♔♔♔ Vérification échec pour roi ${color === 'w' ? 'blanc' : 'noir'} en [${kingPos.row},${kingPos.col}]`);
        }
        
        const attackerColor = color === 'w' ? 'b' : 'w';
        const isInCheck = this.isSquareAttacked(kingPos.row, kingPos.col, attackerColor);
        
        if (this.constructor.consoleLog) {
            const pieceNotation = color === 'w' ? '♔' : '♚';
            const checkStatus = isInCheck ? 'EN ÉCHEC ⚠️' : 'sans échec ✓';
            console.log(`♔ ${pieceNotation} Roi ${color === 'w' ? 'blanc' : 'noir'} en [${kingPos.row},${kingPos.col}] - ${checkStatus}`);
        }
        
        return isInCheck;
    }

    areKingsAdjacent() {
        const whiteKing = this.findKing('w');
        const blackKing = this.findKing('b');
        
        if (!whiteKing || !blackKing) return false;
        
        const rowDiff = Math.abs(whiteKing.row - blackKing.row);
        const colDiff = Math.abs(whiteKing.col - blackKing.col);
        
        const areAdjacent = rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
        
        if (this.constructor.consoleLog) {
            console.log(`👑↔️👑 Rois adjacents? Blanc[${whiteKing.row},${whiteKing.col}] ↔ Noir[${blackKing.row},${blackKing.col}] = ${areAdjacent ? 'OUI ⚠️' : 'NON ✓'}`);
        }
        
        return areAdjacent;
    }

    // Compatibilité
    isCheck() {
        const isCheck = this.isKingInCheck(this.turn);
        
        if (this.constructor.consoleLog) {
            console.log(`⚠️ Vérification échec pour ${this.turn === 'w' ? 'Blancs' : 'Noirs'} (tour actuel): ${isCheck ? 'EN ÉCHEC' : 'Pas d\'échec'}`);
        }
        
        return isCheck;
    }

    // MÉTHODE CORRIGÉE: Vérifier l'échec et mat
    isCheckmate(color = null) {
        const playerColor = color || this.turn;
        const isInCheck = this.isKingInCheck(playerColor);
        
        if (!isInCheck) {
            if (this.constructor.consoleLog) {
                console.log(`♔❌ Pas d'échec et mat: le roi ${playerColor === 'w' ? 'blanc' : 'noir'} n'est pas en échec`);
            }
            return false;
        }
        
        // Vérifier s'il existe au moins un coup légal
        const legalMoves = this.getAllLegalMoves(playerColor);
        
        if (this.constructor.consoleLog) {
            console.log(`♔🔍 Échec détecté pour ${playerColor === 'w' ? 'blancs' : 'noirs'}`);
            console.log(`♔📊 Nombre de coups légaux disponibles: ${legalMoves.length}`);
            
            if (legalMoves.length === 0) {
                console.log(`♔✅✅✅ ÉCHEC ET MAT CONFIRMÉ! Aucun coup légal disponible`);
                
                // Afficher les détails
                const kingPos = this.findKing(playerColor);
                if (kingPos) {
                    console.log(`   Roi ${playerColor === 'w' ? 'blanc' : 'noir'} en [${kingPos.row},${kingPos.col}]`);
                    console.log(`   Cases adjacentes examinées:`);
                    
                    // Vérifier chaque case autour du roi
                    const directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
                    directions.forEach(([dr, dc], idx) => {
                        const r = kingPos.row + dr;
                        const c = kingPos.col + dc;
                        const attackStatus = this.isSquareAttacked(r, c, playerColor === 'w' ? 'b' : 'w');
                        const piece = this.getPiece(r, c);
                        console.log(`   ${idx+1}. [${r},${c}]: ${
                            r < 0 || r >= 8 || c < 0 || c >= 8 ? 'hors plateau' :
                            piece ? `occupé par ${piece}` :
                            attackStatus ? 'attaquée' : 'disponible'
                        }`);
                    });
                }
            } else {
                console.log(`♔❌ Pas mat: ${legalMoves.length} coup(s) légal(aux) disponible(s)`);
            }
        }
        
        return legalMoves.length === 0;
    }

    // MÉTHODE CORRIGÉE: Vérifier le pat
    isStalemate(color = null) {
        const playerColor = color || this.turn;
        const isInCheck = this.isKingInCheck(playerColor);
        
        if (isInCheck) {
            if (this.constructor.consoleLog) {
                console.log(`♔❌ Pas de pat: le roi ${playerColor === 'w' ? 'blanc' : 'noir'} est en échec (ce serait un échec et mat)`);
            }
            return false;
        }
        
        // Vérifier s'il existe au moins un coup légal
        const legalMoves = this.getAllLegalMoves(playerColor);
        
        if (this.constructor.consoleLog) {
            console.log(`♔🔍 Vérification pat pour ${playerColor === 'w' ? 'blancs' : 'noirs'}`);
            console.log(`♔📊 Nombre de coups légaux disponibles: ${legalMoves.length}`);
            
            if (legalMoves.length === 0) {
                console.log(`♔⚖️⚖️⚖️ PAT CONFIRMÉ! Aucun coup légal disponible mais pas en échec`);
            } else {
                console.log(`♔❌ Pas pat: ${legalMoves.length} coup(s) légal(aux) disponible(s)`);
            }
        }
        
        return legalMoves.length === 0;
    }

    // NOUVELLE MÉTHODE: Générer tous les coups légaux pour une couleur
    getAllLegalMoves(color) {
        if (this.constructor.consoleLog) {
            console.log(`\n🎯 GENERATION TOUS LES COUPS LÉGAUX pour ${color === 'w' ? 'blancs' : 'noirs'}`);
        }
        
        const moves = [];
        
        // Pour chaque pièce de la couleur demandée
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    const pieceColor = piece === piece.toUpperCase() ? 'w' : 'b';
                    if (pieceColor === color) {
                        const pieceMoves = this.getPieceLegalMoves(piece, row, col, color);
                        moves.push(...pieceMoves);
                    }
                }
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log(`📊 TOTAL mouvements légaux: ${moves.length}`);
            if (moves.length > 0) {
                moves.forEach((move, idx) => {
                    console.log(`  ${idx+1}. ${move.piece} [${move.from[0]},${move.from[1]}] → [${move.to[0]},${move.to[1]}] (${move.type})`);
                });
            }
        }
        
        return moves;
    }

    // NOUVELLE MÉTHODE: Obtenir les mouvements légaux d'une pièce spécifique
    getPieceLegalMoves(piece, row, col, playerColor) {
        const moves = [];
        const pieceType = piece.toLowerCase();
        
        switch(pieceType) {
            case 'k': // ROI
                moves.push(...this.getKingMoves(row, col, playerColor));
                break;
            case 'q': // DAME
                moves.push(...this.getQueenMoves(row, col, playerColor));
                break;
            case 'r': // TOUR
                moves.push(...this.getRookMoves(row, col, playerColor));
                break;
            case 'b': // FOU
                moves.push(...this.getBishopMoves(row, col, playerColor));
                break;
            case 'n': // CAVALIER
                moves.push(...this.getKnightMoves(row, col, playerColor));
                break;
            case 'p': // PION
                moves.push(...this.getPawnMoves(row, col, playerColor));
                break;
        }
        
        return moves;
    }

    // NOUVELLE MÉTHODE: Mouvements du roi
    getKingMoves(row, col, playerColor) {
        const moves = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const target = this.board[newRow][newCol];
                
                // Vérifier que la case est vide ou contient une pièce adverse
                if (!target || (playerColor === 'w') !== (target === target.toUpperCase())) {
                    // Vérifier que le roi ne se met pas en échec
                    if (!this.wouldMovePutKingInCheck(row, col, newRow, newCol, playerColor)) {
                        // Vérifier que les rois ne sont pas adjacents
                        if (!this.wouldKingsBeAdjacent(newRow, newCol, playerColor)) {
                            moves.push({
                                piece: 'k',
                                from: [row, col],
                                to: [newRow, newCol],
                                type: target ? 'capture' : 'move'
                            });
                        }
                    }
                }
            }
        }
        
        return moves;
    }

    // NOUVELLE MÉTHODE: Vérifier si un mouvement mettrait le roi en échec
    wouldMovePutKingInCheck(fromRow, fromCol, toRow, toCol, playerColor) {
        // Créer une copie du plateau
        const tempBoard = JSON.parse(JSON.stringify(this.board));
        const piece = tempBoard[fromRow][fromCol];
        
        // Effectuer le mouvement temporaire
        tempBoard[toRow][toCol] = piece;
        tempBoard[fromRow][fromCol] = null;
        
        // Créer un moteur temporaire
        const tempFEN = this.generateFENFromBoard(tempBoard, playerColor === 'w' ? 'b' : 'w');
        const tempEngine = new ChessEngine(tempFEN);
        
        // Vérifier si le roi est en échec
        return tempEngine.isKingInCheck(playerColor);
    }

    // NOUVELLE MÉTHODE: Vérifier si les rois seraient adjacents après un mouvement
    wouldKingsBeAdjacent(newRow, newCol, playerColor) {
        const opponentColor = playerColor === 'w' ? 'b' : 'w';
        const opponentKing = this.findKing(opponentColor);
        
        if (!opponentKing) return false;
        
        const rowDiff = Math.abs(newRow - opponentKing.row);
        const colDiff = Math.abs(newCol - opponentKing.col);
        
        return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
    }

    // NOUVELLE MÉTHODE: Mouvements de la dame
    getQueenMoves(row, col, playerColor) {
        return [
            ...this.getRookMoves(row, col, playerColor),
            ...this.getBishopMoves(row, col, playerColor)
        ];
    }

    // NOUVELLE MÉTHODE: Mouvements de la tour
    getRookMoves(row, col, playerColor) {
        const moves = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dr, dc] of directions) {
            let r = row + dr;
            let c = col + dc;
            
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const target = this.board[r][c];
                
                if (target) {
                    // Si c'est une pièce adverse, on peut capturer
                    if ((playerColor === 'w') !== (target === target.toUpperCase())) {
                        // Vérifier que le mouvement ne met pas le roi en échec
                        if (!this.wouldMovePutKingInCheck(row, col, r, c, playerColor)) {
                            moves.push({
                                piece: 'r',
                                from: [row, col],
                                to: [r, c],
                                type: 'capture'
                            });
                        }
                    }
                    break; // Arrêter dans tous les cas
                } else {
                    // Case vide
                    if (!this.wouldMovePutKingInCheck(row, col, r, c, playerColor)) {
                        moves.push({
                            piece: 'r',
                            from: [row, col],
                            to: [r, c],
                            type: 'move'
                        });
                    }
                    r += dr;
                    c += dc;
                }
            }
        }
        
        return moves;
    }

    // NOUVELLE MÉTHODE: Mouvements du fou
    getBishopMoves(row, col, playerColor) {
        const moves = [];
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        
        for (const [dr, dc] of directions) {
            let r = row + dr;
            let c = col + dc;
            
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const target = this.board[r][c];
                
                if (target) {
                    if ((playerColor === 'w') !== (target === target.toUpperCase())) {
                        if (!this.wouldMovePutKingInCheck(row, col, r, c, playerColor)) {
                            moves.push({
                                piece: 'b',
                                from: [row, col],
                                to: [r, c],
                                type: 'capture'
                            });
                        }
                    }
                    break;
                } else {
                    if (!this.wouldMovePutKingInCheck(row, col, r, c, playerColor)) {
                        moves.push({
                            piece: 'b',
                            from: [row, col],
                            to: [r, c],
                            type: 'move'
                        });
                    }
                    r += dr;
                    c += dc;
                }
            }
        }
        
        return moves;
    }

    // NOUVELLE MÉTHODE: Mouvements du cavalier
    getKnightMoves(row, col, playerColor) {
        const moves = [];
        const jumps = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        for (const [dr, dc] of jumps) {
            const r = row + dr;
            const c = col + dc;
            
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const target = this.board[r][c];
                
                if (!target || (playerColor === 'w') !== (target === target.toUpperCase())) {
                    if (!this.wouldMovePutKingInCheck(row, col, r, c, playerColor)) {
                        moves.push({
                            piece: 'n',
                            from: [row, col],
                            to: [r, c],
                            type: target ? 'capture' : 'move'
                        });
                    }
                }
            }
        }
        
        return moves;
    }

    // NOUVELLE MÉTHODE: Mouvements du pion
    getPawnMoves(row, col, playerColor) {
        const moves = [];
        const isWhite = playerColor === 'w';
        const direction = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;
        const promotionRow = isWhite ? 0 : 7;
        
        // Avance simple
        const forwardRow = row + direction;
        if (forwardRow >= 0 && forwardRow < 8 && !this.board[forwardRow][col]) {
            if (!this.wouldMovePutKingInCheck(row, col, forwardRow, col, playerColor)) {
                moves.push({
                    piece: 'p',
                    from: [row, col],
                    to: [forwardRow, col],
                    type: forwardRow === promotionRow ? 'promotion' : 'move'
                });
            }
            
            // Avance double depuis la position initiale
            if (row === startRow) {
                const doubleRow = row + (2 * direction);
                if (!this.board[doubleRow][col] && !this.board[forwardRow][col]) {
                    if (!this.wouldMovePutKingInCheck(row, col, doubleRow, col, playerColor)) {
                        moves.push({
                            piece: 'p',
                            from: [row, col],
                            to: [doubleRow, col],
                            type: 'double-push'
                        });
                    }
                }
            }
        }
        
        // Prises
        for (const dc of [-1, 1]) {
            const captureRow = row + direction;
            const captureCol = col + dc;
            
            if (captureRow >= 0 && captureRow < 8 && captureCol >= 0 && captureCol < 8) {
                const target = this.board[captureRow][captureCol];
                
                if (target && (playerColor === 'w') !== (target === target.toUpperCase())) {
                    if (!this.wouldMovePutKingInCheck(row, col, captureRow, captureCol, playerColor)) {
                        moves.push({
                            piece: 'p',
                            from: [row, col],
                            to: [captureRow, captureCol],
                            type: captureRow === promotionRow ? 'promotion-capture' : 'capture'
                        });
                    }
                }
            }
        }
        
        return moves;
    }

    // NOUVELLE MÉTHODE: Générer FEN depuis un plateau
    generateFENFromBoard(board, turn) {
        let fen = '';
        
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                
                if (!piece) {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    fen += piece;
                }
            }
            
            if (emptyCount > 0) fen += emptyCount;
            if (row < 7) fen += '/';
        }
        
        fen += ` ${turn} KQkq - 0 1`;
        return fen;
    }

    // NOUVELLE MÉTHODE: Ordre de vérification correct
    checkGameStatus(color = null) {
        const playerColor = color || this.turn;
        
        if (this.constructor.consoleLog) {
            console.log(`\n🎮🎮🎮 VÉRIFICATION STATUT JEU (${playerColor === 'w' ? 'Blancs' : 'Noirs'})`);
            console.log(`🎮 ORDRE CORRECT: 1. Mat → 2. Pat → 3. Nulle`);
        }
        
        // 1. Vérifier l'échec et mat
        const isMate = this.isCheckmate(playerColor);
        if (isMate) {
            if (this.constructor.consoleLog) {
                console.log(`🎮✅✅✅ ÉCHEC ET MAT! Le roi ${playerColor === 'w' ? 'blanc' : 'noir'} est mat`);
            }
            return 'checkmate';
        }
        
        // 2. Vérifier le pat
        const isStalemate = this.isStalemate(playerColor);
        if (isStalemate) {
            if (this.constructor.consoleLog) {
                console.log(`🎮⚖️⚖️⚖️ PAT! Match nul par pat`);
            }
            return 'stalemate';
        }
        
        // 3. Vérifier les autres cas de nullité (50 coups, répétition, matériel insuffisant)
        // TODO: Implémenter ces vérifications
        
        if (this.constructor.consoleLog) {
            console.log(`🎮✓ Jeu en cours, pas de mat/pat/nulle détecté`);
        }
        return 'in_progress';
    }

    // Afficher le plateau complet
    displayBoard() {
        if (!this.constructor.consoleLog) return;
        
        console.log('\n📊📊📊 PLATEAU COMPLET:');
        console.log('   a b c d e f g h');
        for (let row = 0; row < 8; row++) {
            let line = `${8 - row} `;
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                line += (piece || '.') + ' ';
            }
            console.log(line + ` ${8 - row}`);
        }
        console.log('   a b c d e f g h\n');
    }

    // Obtenir un résumé du plateau
    getBoardSummary() {
        if (!this.constructor.consoleLog) return {};
        
        const summary = {
            turn: this.turn === 'w' ? 'Blancs' : 'Noirs',
            whiteKing: this.findKing('w'),
            blackKing: this.findKing('b'),
            whiteInCheck: this.isKingInCheck('w'),
            blackInCheck: this.isKingInCheck('b'),
            kingsAdjacent: this.areKingsAdjacent(),
            gameStatus: this.checkGameStatus()
        };
        
        return summary;
    }

    // Afficher le résumé
    displaySummary() {
        if (!this.constructor.consoleLog) return;
        
        console.log('\n📋📋📋 RÉSUMÉ DU PLATEAU:');
        const summary = this.getBoardSummary();
        
        console.log(`Tour actuel: ${summary.turn}`);
        console.log(`Roi blanc: ${summary.whiteKing ? `[${summary.whiteKing.row},${summary.whiteKing.col}]` : 'NON TROUVÉ'}`);
        console.log(`Roi noir: ${summary.blackKing ? `[${summary.blackKing.row},${summary.blackKing.col}]` : 'NON TROUVÉ'}`);
        console.log(`Échec blanc: ${summary.whiteInCheck ? 'OUI ⚠️' : 'NON ✓'}`);
        console.log(`Échec noir: ${summary.blackInCheck ? 'OUI ⚠️' : 'NON ✓'}`);
        console.log(`Rois adjacents: ${summary.kingsAdjacent ? 'OUI ⚠️' : 'NON ✓'}`);
        console.log(`Statut jeu: ${summary.gameStatus === 'checkmate' ? 'ÉCHEC ET MAT!' : 
                                  summary.gameStatus === 'stalemate' ? 'PAT!' : 
                                  summary.gameStatus === 'in_progress' ? 'En cours' : summary.gameStatus}`);
    }
    
    // Méthode pour forcer la mise à jour de la configuration
    static reloadConfig() {
        const oldValue = this.consoleLog;
        this.loadConfig();
        
        if (this.consoleLog && oldValue !== this.consoleLog) {
            console.log(`🔄 ChessEngine: Configuration rechargée: ${oldValue} → ${this.consoleLog}`);
        }
        return this.consoleLog;
    }
}

// Initialisation statique
ChessEngine.init();

// Exposer la classe globalement
window.ChessEngine = ChessEngine;

// Ajouter des fonctions utilitaires globales
window.ChessEngineUtils = {
    // Forcer le rechargement de la config
    reloadConfig: () => ChessEngine.reloadConfig(),
    
    // Tester la configuration
    testConfig: () => {
        console.group('🧪 Test de configuration ChessEngine');
        console.log('consoleLog actuel:', ChessEngine.consoleLog);
        console.log('Source config:', ChessEngine.getConfigSource());
        console.log('window.appConfig disponible:', !!window.appConfig);
        
        if (window.appConfig) {
            console.log('Valeur chess_engine.console_log dans appConfig:', 
                window.appConfig.chess_engine?.console_log, 
                '(type:', typeof window.appConfig.chess_engine?.console_log + ')');
            console.log('Valeur debug.console_log dans appConfig:', 
                window.appConfig.debug?.console_log, 
                '(type:', typeof window.appConfig.debug?.console_log + ')');
        }
        
        console.log('Mode debug activé:', ChessEngine.isDebugMode());
        console.groupEnd();
        
        return ChessEngine.consoleLog;
    },
    
    // Obtenir l'état actuel
    getState: () => ({
        consoleLog: ChessEngine.consoleLog,
        source: ChessEngine.getConfigSource(),
        debugMode: ChessEngine.isDebugMode(),
        chessEngineConfigValue: window.appConfig?.chess_engine?.console_log,
        debugConfigValue: window.appConfig?.debug?.console_log
    }),
    
    // Vérifier la configuration JSON
    checkJSONConfig: () => {
        if (window.appConfig) {
            return {
                exists: true,
                chess_engine: window.appConfig.chess_engine,
                debug: window.appConfig.debug,
                chess_engine_value: window.appConfig.chess_engine?.console_log,
                chess_engine_type: typeof window.appConfig.chess_engine?.console_log,
                debug_value: window.appConfig.debug?.console_log,
                debug_type: typeof window.appConfig.debug?.console_log
            };
        }
        return { exists: false };
    },
    
    // Tester le moteur d'échec
    testEngine: (fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") => {
        console.log('🧪 Test ChessEngine avec FEN:', fen);
        const engine = new ChessEngine(fen);
        
        // Exécuter les vérifications uniquement si debug activé
        if (ChessEngine.consoleLog) {
            console.log('✓ Blanc en échec?', engine.isKingInCheck('w'));
            console.log('✓ Noir en échec?', engine.isKingInCheck('b'));
            console.log('✓ Échec (tour actuel)?', engine.isCheck());
            console.log('✓ Rois adjacents?', engine.areKingsAdjacent());
            console.log('✓ Statut jeu?', engine.checkGameStatus());
        }
        
        return engine;
    },
    
    // NOUVELLE FONCTION: Tester spécifiquement l'échec et mat
    testCheckmate: (fen = "1R4k1/8/6K1/4p3/1p2P2P/1P1P4/2P2PP1/1NB3N1 b - - 22 37") => {
        console.log('\n=== TEST ÉCHEC ET MAT SPÉCIFIQUE ===');
        const engine = new ChessEngine(fen);
        
        console.log(`FEN: ${fen}`);
        console.log(`Tour: ${engine.turn === 'w' ? 'Blancs' : 'Noirs'}`);
        
        engine.displayBoard();
        
        const blackInCheck = engine.isKingInCheck('b');
        const isCheckmate = engine.isCheckmate('b');
        
        console.log(`\n=== RÉSULTATS ===`);
        console.log(`Roi noir en échec? ${blackInCheck ? '✅ OUI' : '❌ NON'}`);
        console.log(`Échec et mat? ${isCheckmate ? '✅✅✅ OUI - MAT!' : '❌ NON'}`);
        
        if (isCheckmate) {
            console.log(`\n=== ANALYSE DU MAT ===`);
            const kingPos = engine.findKing('b');
            console.log(`Roi noir en [${kingPos.row},${kingPos.col}]`);
            
            console.log('Cases autour du roi:');
            const adj = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
            adj.forEach(([dr, dc], i) => {
                const r = kingPos.row + dr;
                const c = kingPos.col + dc;
                const piece = engine.getPiece(r, c);
                const attacked = engine.isSquareAttacked(r, c, 'w');
                console.log(`  ${i+1}. [${r},${c}]: ${piece || 'vide'} - ${attacked ? 'attaqué' : 'sûr'}`);
            });
            
            const legalMoves = engine.getAllLegalMoves('b');
            console.log(`\nCoups légaux pour les noirs: ${legalMoves.length}`);
        }
        
        return { blackInCheck, isCheckmate };
    }
};

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            ChessEngine.loadConfig();
            if (ChessEngine.consoleLog) {
                console.log('✅ ChessEngine: Configuration vérifiée après chargement du DOM');
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        ChessEngine.loadConfig();
    }, 100);
}

// Message final basé sur la configuration
if (ChessEngine.consoleLog) {
    console.log('✅ ChessEngine prêt (mode debug activé)');
} else {
    console.info('✅ ChessEngine prêt (mode silencieux)');
}

// Fonction de test pour vérifier depuis la console (toujours disponible)
window.testChessEngineConfig = function() {
    console.log('=== TEST CONFIGURATION ChessEngine ===');
    const state = window.ChessEngineUtils.getState();
    console.log('État actuel:', state);
    console.log('=== FIN TEST ===');
    return state;
};

// Fonction pour tester l'ordre de vérification
window.testCheckOrder = function() {
    console.log('=== TEST ORDRE VÉRIFICATION ===');
    console.log('Ordre CORRECT:');
    console.log('1. Échec et mat (Checkmate)');
    console.log('2. Pat (Stalemate)');
    console.log('3. Nulle (50 coups, répétition, etc.)');
    console.log('=== FIN TEST ===');
};

// NOUVELLE FONCTION: Tester l'échec et mat avec votre FEN spécifique
window.testMyFEN = function() {
    console.log('\n🔍🔍🔍 TEST DE VOTRE FEN SPÉCIFIQUE 🔍🔍🔍');
    return window.ChessEngineUtils.testCheckmate("1R4k1/8/6K1/4p3/1p2P2P/1P1P4/2P2PP1/1NB3N1 b - - 22 37");
};