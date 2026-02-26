/**
 * js/kchess/bots/BotCore.js
 * Classe parente universelle pour tous les bots K-Chess
 */

if (typeof window.BotCore === 'undefined') {

    class BotCore {
        
        static consoleLog = false;
        static initialized = false;

        static init() {
            this.loadConfig();
            this.initialized = true;
            if (this.consoleLog) {
                console.log('🤖 [BotCore] Système de réflexion prêt (Debug ON)');
            }
        }

        static loadConfig() {
            try {
                let configValue = false;
                if (window.appConfig && window.appConfig.debug) {
                    configValue = window.appConfig.debug.console_log;
                } else if (typeof window.getConfig === 'function') {
                    configValue = window.getConfig('debug.console_log', false);
                }
                this.consoleLog = (configValue === true || configValue === "true");
                return true;
            } catch (e) {
                this.consoleLog = false;
                return false;
            }
        }

        static log(message, data = null, type = 'log') {
            if (!this.consoleLog) return;
            const prefix = '🤖 [BotCore] ';
            if (data) { console[type](prefix + message, data); } 
            else { console[type](prefix + message); }
        }

        // --- MÉTHODES D'INSTANCE ---

        getGame() {
            return window.chessGame?.core || window.chessGame;
        }

        getPiece(board, r, c) {
            try {
                if (!board) return null;
                if (typeof board.getPiece === 'function') return board.getPiece(r, c);
                const grid = board.grid || board;
                const sq = grid[r] ? grid[r][c] : null;
                if (!sq) return null;
                return sq.piece ? sq.piece : (sq.type ? sq : null);
            } catch (e) { return null; }
        }

        /**
         * AJOUT : Vérifie si une case est attaquée par une couleur donnée
         */
        isSquareAttacked(game, row, col, byColor) {
            if (!game || !game.moveValidator) return false;
            const colorKey = byColor.charAt(0).toLowerCase();
            
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const p = this.getPiece(game.board, r, c);
                    // Si c'est une pièce adverse
                    if (p && p.color.charAt(0).toLowerCase() === colorKey) {
                        // On récupère ses coups possibles
                        const moves = game.moveValidator.getPossibleMoves(p, r, c);
                        if (moves && Array.isArray(moves)) {
                            if (moves.some(m => m.row === row && m.col === col)) return true;
                        }
                    }
                }
            }
            return false;
        }

        getMoves(game, color) {
            const moves = [];
            if (!game || !game.moveValidator) return moves;
            const myColorKey = color.charAt(0).toLowerCase();

            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const piece = this.getPiece(game.board, r, c);
                    if (piece && piece.color.charAt(0).toLowerCase() === myColorKey) {
                        const possible = game.moveValidator.getPossibleMoves(piece, r, c);
                        if (possible && Array.isArray(possible)) {
                            possible.forEach(m => {
                                const target = this.getPiece(game.board, m.row, m.col);
                                moves.push({
                                    fromRow: r, fromCol: c, toRow: m.row, toCol: m.col,
                                    piece: piece,
                                    targetPiece: target,
                                    isCapture: !!(target && target.color.charAt(0).toLowerCase() !== myColorKey)
                                });
                            });
                        }
                    }
                }
            }
            return moves;
        }

        findPiece(game, type, color) {
            const colorKey = color.toLowerCase().charAt(0);
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const p = this.getPiece(game.board, r, c);
                    if (p && p.type === type && p.color.toLowerCase().startsWith(colorKey)) {
                        return { r, c };
                    }
                }
            }
            return null;
        }

        getMaterialScore(game, color, customValues = null) {
            let total = 0;
            const key = color.charAt(0).toLowerCase();
            // Valeurs de secours si rien n'est passé
            const values = customValues || { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
            
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const p = this.getPiece(game.board, r, c);
                    if (p && p.color.toLowerCase().startsWith(key)) {
                        total += values[p.type] || 0;
                    }
                }
            }
            return total;
        }

        // Détecte si un coup mène à un échec et mat immédiat
        findMateInOne(game, color, moves) {
            for (const move of moves) {
                // On simule le coup
                const boardAfter = this.simulateMove(game, move);
                const oppColor = color === 'white' ? 'black' : 'white';
                
                // Si l'adversaire n'a plus de coups ET est en échec => Mat
                const oppMoves = this.getMoves({ ...game, board: boardAfter }, oppColor);
                if (oppMoves.length === 0 && this.isKingInCheck(boardAfter, oppColor, game.moveValidator)) {
                    return move;
                }
            }
            return null;
        }

/**
         * Version robuste de simulation pour les calculs rapides
         */
        simulateMove(game, move) {
            try {
                // On récupère la grille peu importe la structure (grid ou board direct)
                const oldGrid = game.board.grid || game.board;
                if (!oldGrid || !Array.isArray(oldGrid)) {
                    throw new Error("Structure de plateau invalide pour simulation");
                }

                // On crée une copie profonde de la grille (map des lignes + spread des colonnes)
                const newGrid = oldGrid.map(row => [...row]);
                
                const movingPiece = this.getPiece(game.board, move.fromRow, move.fromCol);
                if (!movingPiece) return { grid: newGrid };

                // On déplace la pièce dans la nouvelle grille
                newGrid[move.fromRow][move.fromCol] = null;
                
                // On gère la structure de l'objet case (soit {piece: p}, soit p directement)
                const hasPieceWrapper = oldGrid[move.fromRow][move.fromCol]?.piece !== undefined;
                
                if (hasPieceWrapper) {
                    newGrid[move.toRow][move.toCol] = { piece: { ...movingPiece } };
                } else {
                    newGrid[move.toRow][move.toCol] = { ...movingPiece };
                }

                // Gestion de la promotion dans la simulation
                if (movingPiece.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
                    const targetCell = newGrid[move.toRow][move.toCol];
                    if (hasPieceWrapper) targetCell.piece.type = 'queen';
                    else targetCell.type = 'queen';
                }

                return { grid: newGrid };
            } catch (e) {
                BotCore.log("Erreur critique simulation", e, 'error');
                return game.board; // Fallback
            }
        }

        /**
         * Vérifie si le roi d'une couleur est en échec
         */
        isKingInCheck(board, color, moveValidator) {
            const kingPos = this._findKingInGrid(board, color);
            if (!kingPos) return false;
            
            const oppColor = (color === 'white' || color.startsWith('w')) ? 'black' : 'white';
            
            // On crée un mini objet game factice pour réutiliser isSquareAttacked
            const tempGame = { board: board, moveValidator: moveValidator };
            return this.isSquareAttacked(tempGame, kingPos.r, kingPos.c, oppColor);
        }

        /**
         * Helper interne pour trouver le roi dans une grille brute (simulation)
         */
        _findKingInGrid(board, color) {
            const grid = board.grid || board;
            const key = color.charAt(0).toLowerCase();
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const p = this.getPiece(grid, r, c);
                    if (p && p.type === 'king' && p.color.toLowerCase().startsWith(key)) {
                        return { r, c };
                    }
                }
            }
            return null;
        }

        finalize(move) {
            if (!move) return null;
            const res = {
                fromRow: move.fromRow, fromCol: move.fromCol,
                toRow: move.toRow, toCol: move.toCol,
                promotion: null
            };
            if (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
                res.promotion = 'queen';
                BotCore.log('Promotion automatique détectée', res);
            }
            return res;
        }
    }

    BotCore.init();
    window.BotCore = BotCore;
    window.BotBase = BotCore;

} else {
    // Correction ici : BotCore au lieu de this pour le consoleLog
    if (window.BotCore.consoleLog) {  
        console.warn("⚠️ [BotCore] Déjà chargé.");  
    }
}