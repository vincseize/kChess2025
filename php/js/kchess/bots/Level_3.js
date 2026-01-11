/**
 * Level_3 - Niveau Tactique Anti-Kamikaze
 * Version : 1.0.7 - Stable structure
 */
class Level_3 {
    static VERSION = '1.0.7';
    static consoleLog = true;

    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log(`%c🤖 Level_3 v${this.VERSION} prêt`, "color: #3498db; font-weight: bold;");
    }

    static loadConfig() {
        try {
            const config = window.appConfig?.debug?.console_log ?? true;
            this.consoleLog = String(config) !== "false";
        } catch (e) { this.consoleLog = true; }
    }

    constructor() {
        this.name = "Bot Level 3";
        this.level = 3;
        this.pieceValues = { 'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 100 };
    }

    /**
     * POINT D'ENTRÉE PRINCIPAL (Utilisé par chess-events / bot-manager)
     */
    async getMove(gameCore = null) {
        const isDebug = Level_3.consoleLog;
        if (isDebug) console.group(`🎲 [Level_3] Analyse Tactique...`);

        try {
            const game = gameCore || window.chessGame?.core || window.chessGame;
            const player = game.gameState.currentPlayer;
            
            // Délai de réflexion
            await new Promise(resolve => setTimeout(resolve, 600));

            // 1. Récupération de TOUS les coups possibles
            const allMoves = this._getAllValidMoves(game, player);
            
            if (allMoves.length === 0) {
                if (isDebug) console.groupEnd();
                return null; 
            }

            // 2. TRI TACTIQUE (Séparation Sûr / Risqué)
            const oppColor = player === 'white' ? 'black' : 'white';
            const safeMoves = [];
            const riskyMoves = [];

            for (const move of allMoves) {
                const isSafe = !this.isSquareAttacked(game, move.toRow, move.toCol, oppColor);
                const isRiskyCapture = move.isCapture && !this._isCaptureSafe(game, move);

                if (isSafe && !isRiskyCapture) {
                    safeMoves.push(move);
                } else {
                    riskyMoves.push(move);
                }
            }

            // 3. LOGIQUE DE SÉLECTION (Priorités)
            let finalMove = null;

            // Priorité A : Capture sûre (On gagne du matos sans risque)
            const safeCaptures = safeMoves.filter(m => m.isCapture);
            if (safeCaptures.length > 0) {
                finalMove = safeCaptures[Math.floor(Math.random() * safeCaptures.length)];
                if (isDebug) console.log(`%c🎯 Capture Sûre: ${finalMove.notation}`, "color: #2ecc71");
            } 
            // Priorité B : Coup positionnel sûr
            else if (safeMoves.length > 0) {
                finalMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
                if (isDebug) console.log(`%c✅ Coup Sûr: ${finalMove.notation}`, "color: #3498db");
            } 
            // Priorité C : On évite au moins le suicide (Donner une grosse pièce pour rien)
            else {
                const nonSuicide = riskyMoves.filter(m => !this._isSuicideCapture(game, m));
                finalMove = nonSuicide.length > 0 ? 
                            nonSuicide[Math.floor(Math.random() * nonSuicide.length)] : 
                            allMoves[0];
                if (isDebug) console.warn(`%c⚠️ Mode Survie: ${finalMove.notation}`, "color: #f1c40f");
            }

            if (isDebug) {
                console.error("🚀 EXECUTION L3 :", finalMove.notation);
                console.groupEnd();
            }

            return this._addPromotion(finalMove);

        } catch (error) {
            console.error("❌ Level_3 Error:", error);
            if (isDebug) console.groupEnd();
            return null;
        }
    }

    /**
     * Méthodes utilitaires (Même structure que ton L2)
     */
    _getAllValidMoves(game, player) {
        const moves = [];
        const board = game.board;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board.getPiece?.(r, c) || (board.grid ? board.grid[r][c]?.piece : null);
                if (piece && piece.color === player) {
                    const targets = game.moveValidator.getPossibleMoves(piece, r, c);
                    targets.forEach(t => {
                        const targetPiece = board.getPiece?.(t.row, t.col) || (board.grid ? board.grid[t.row][t.col]?.piece : null);
                        moves.push({
                            fromRow: r, fromCol: c, toRow: t.row, toCol: t.col,
                            piece: piece,
                            isCapture: !!targetPiece,
                            targetPiece: targetPiece,
                            notation: this._simpleNotation(r, c, t.row, t.col)
                        });
                    });
                }
            }
        }
        return moves;
    }

    isSquareAttacked(game, row, col, byColor) {
        const board = game.board;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board.getPiece?.(r, c) || (board.grid ? board.grid[r][c]?.piece : null);
                if (p && p.color === byColor) {
                    const moves = game.moveValidator.getPossibleMoves(p, r, c);
                    if (moves.some(m => m.row === row && m.col === col)) return true;
                }
            }
        }
        return false;
    }

    _isCaptureSafe(game, move) {
        const attackerVal = this.pieceValues[move.piece.type];
        const targetVal = move.targetPiece ? this.pieceValues[move.targetPiece.type] : 0;
        return targetVal >= attackerVal;
    }

    _isSuicideCapture(game, move) {
        if (!move.isCapture) return false;
        const attackerVal = this.pieceValues[move.piece.type];
        const targetVal = move.targetPiece ? this.pieceValues[move.targetPiece.type] : 0;
        return attackerVal > (targetVal * 2);
    }

    _addPromotion(move) {
        if (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
            move.promotion = 'queen';
        }
        return move;
    }

    _simpleNotation(fR, fC, tR, tC) {
        return `${'abcdefgh'[fC]}${8 - fR}➔${'abcdefgh'[tC]}${8 - tR}`;
    }
}

// Initialisation identique au Level 2
Level_3.init();
window.Level_3 = Level_3;