/**
 * js/kchess/bots/BotCore.js
 * Classe parente universelle pour tous les bots K-Chess
 * Système de log débrayable via config
 */

if (typeof window.BotCore === 'undefined') {

    class BotCore {
        
        static consoleLog = false;
        static initialized = false;

        /**
         * Initialisation statique pour les Bots
         */
        static init() {
            this.loadConfig();
            this.initialized = true;
            
            // On utilise console.info/log directement ici car le système démarre
            if (this.consoleLog) {
                console.log('🤖 [BotCore] Système de réflexion prêt (Debug ON)');
            }
        }

        /**
         * Charge la config (identique à ChessBoard pour rester synchrone)
         */
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

        /**
         * Logger centralisé pour tous les Bots
         * Accessible via : BotCore.log(...) ou this.constructor.log(...) dans les sous-classes
         */
        static log(message, data = null, type = 'log') {
            if (!this.consoleLog) return;
            
            const prefix = '🤖 [BotCore] ';
            if (data) {
                console[type](prefix + message, data);
            } else {
                console[type](prefix + message);
            }
        }

        // --- MÉTHODES D'INSTANCE ---

        getGame() {
            return window.chessGame?.core || window.chessGame;
        }

        getPiece(board, r, c) {
            try {
                if (!board) return null;
                if (typeof board.getPiece === 'function') {
                    return board.getPiece(r, c);
                }
                const grid = board.grid || board;
                const sq = grid[r] ? grid[r][c] : null;
                if (!sq) return null;
                return sq.piece ? sq.piece : (sq.type ? sq : null);
            } catch (e) { 
                return null; 
            }
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

        finalize(move) {
            if (!move) return null;
            const res = {
                fromRow: move.fromRow, fromCol: move.fromCol,
                toRow: move.toRow, toCol: move.toCol,
                promotion: null
            };
            if (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
                res.promotion = 'queen';
                // Petit log de promotion si actif
                BotCore.log('Promotion automatique détectée', res);
            }
            return res;
        }
    }

    // --- INITIALISATION & EXPOSITION ---
    BotCore.init(); // On lance l'init immédiatement

    window.BotCore = BotCore;
    window.BotBase = BotCore;

} else {
    if (this.consoleLog) {  
        console.warn("⚠️ [BotCore] Déjà chargé.");  
    }
}