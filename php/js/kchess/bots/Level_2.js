/**
 * Level_2 - Stratégie CCMO optimisée
 * Check -> Capture -> Menace -> Optimisation
 * Version 1.4.0 - Intégration Diagnostic Fin de Partie
 */
class Level_2 {
    static VERSION = '1.4.0';
    static consoleLog = true;

    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log(`🤖 Level_2 v${this.VERSION} prêt (Stratégie CCMO)`);
    }

    static loadConfig() {
        try {
            const config = window.appConfig?.debug?.console_log ?? true;
            this.consoleLog = String(config) !== "false";
        } catch (e) { this.consoleLog = true; }
    }

    constructor() {
        this.name = "Bot Level 2 (CCMO)";
        this.level = 2;
        this.pieceValues = { 'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 100 };
    }

    async getMove(fen) {
        const isDebug = this.constructor.consoleLog;
        if (isDebug) console.group(`🎲 [Level_2] Analyse CCMO...`);
        
        try {
            const game = window.chessGame?.core || window.chessGame;
            const currentPlayer = game.gameState.currentPlayer;
            const allMoves = this.getAllValidMoves(game);
            
            // --- GESTION FIN DE PARTIE ---
            if (allMoves.length === 0) {
                const status = this._analyzeGameOver(fen, currentPlayer, game.moveHistory);
                if (isDebug) {
                    console.warn(`⚠️ Fin de partie : ${status.reason}`);
                    console.groupEnd();
                }
                return { error: 'game_over', reason: status.reason, details: status.details };
            }

            const oppColor = this._getOpponentColor(game);

            // Simulation d'un temps de réflexion
            await new Promise(resolve => setTimeout(resolve, 600));

            // 1. CAPTURES (Gain matériel)
            const captureMoves = allMoves.filter(m => m.isCapture);
            if (captureMoves.length > 0) {
                captureMoves.sort((a, b) => this.pieceValues[b.targetPiece.type] - this.pieceValues[a.targetPiece.type]);
                
                const safeCaptures = captureMoves.filter(m => {
                    const valAttacker = this.pieceValues[m.piece.type];
                    const valTarget = this.pieceValues[m.targetPiece.type];
                    const isAttacked = this.isSquareAttacked(game, m.toRow, m.toCol, oppColor);
                    return !isAttacked || (valTarget >= valAttacker);
                });

                if (safeCaptures.length > 0) return this.finalizeMove(safeCaptures, 'CAPTURE');
            }

            // 2. CHECK (Échec au roi)
            const checkMoves = allMoves.filter(m => m.isCheck);
            const safeChecks = checkMoves.filter(m => !this.isSquareAttacked(game, m.toRow, m.toCol, oppColor));
            if (safeChecks.length > 0) return this.finalizeMove(safeChecks, 'CHECK');

            // 3. POSITIONNEMENT (Centre)
            const centralMoves = allMoves.filter(m => {
                const isSafe = !this.isSquareAttacked(game, m.toRow, m.toCol, oppColor);
                const isCentral = m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5;
                return isSafe && isCentral;
            });
            if (centralMoves.length > 0) return this.finalizeMove(centralMoves, 'POSITIONNEMENT');

            // 4. DÉVELOPPEMENT (Coups sûrs)
            const absoluteSafeMoves = allMoves.filter(m => !this.isSquareAttacked(game, m.toRow, m.toCol, oppColor));
            return this.finalizeMove(absoluteSafeMoves.length > 0 ? absoluteSafeMoves : allMoves, 'DEVELOPPEMENT');

        } catch (error) {
            console.error("❌ Level_2 Error:", error);
            return { error: 'critical_error' };
        } finally {
            if (isDebug) console.groupEnd();
        }
    }

    /**
     * Diagnostic de fin de partie identique au Level_1
     */
    _analyzeGameOver(fen, color, history) {
        if (new ChessMateEngine(fen).isCheckmate(color)) {
            return { reason: 'checkmate', details: color === 'w' ? 'black' : 'white' };
        }
        if (new ChessPatEngine(fen).isStalemate(color)) {
            return { reason: 'stalemate', details: null };
        }
        return { reason: 'draw', details: 'nulle' };
    }

    getAllValidMoves(game) {
        const moves = [];
        const player = game.gameState.currentPlayer;
        const board = game.board;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board.getPiece?.(r, c) || board.getSquare?.(r, c)?.piece;
                
                if (piece && piece.color === player) {
                    const targets = game.moveValidator.getPossibleMoves(piece, r, c);
                    
                    targets.forEach(t => {
                        const targetPiece = board.getPiece?.(t.row, t.col) || board.getSquare?.(t.row, t.col)?.piece;
                        moves.push({
                            fromRow: r, fromCol: c, toRow: t.row, toCol: t.col,
                            piece: piece,
                            targetPiece: targetPiece,
                            isCapture: !!targetPiece && targetPiece.color !== player,
                            isCheck: this.checkIfMoveGivesCheck(game, piece, r, c, t.row, t.col),
                            notation: this._simpleNotation(r, c, t.row, t.col)
                        });
                    });
                }
            }
        }
        return moves;
    }

    // Vérifie si le coup met le roi adverse en échec
    checkIfMoveGivesCheck(game, piece, fR, fC, tR, tC) {
        const oppColor = this._getOpponentColor(game);
        // On récupère les coups de la pièce à sa nouvelle position
        const nextMoves = game.moveValidator.getPossibleMoves(piece, tR, tC);
        return nextMoves.some(m => {
            const p = game.board.getPiece?.(m.row, m.col) || game.board.getSquare?.(m.row, m.col)?.piece;
            return p && p.type === 'king' && p.color === oppColor;
        });
    }

    isSquareAttacked(game, row, col, byColor) {
        const board = game.board;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board.getPiece?.(r, r) || board.getSquare?.(r, c)?.piece;
                if (p && p.color === byColor) {
                    const moves = game.moveValidator.getPossibleMoves(p, r, c);
                    if (moves.some(m => m.row === row && m.col === col)) return true;
                }
            }
        }
        return false;
    }

    finalizeMove(moveList, strategy) {
        const move = moveList[Math.floor(Math.random() * moveList.length)];
        if (this.constructor.consoleLog) console.log(`🎯 [${strategy}] ${move.notation}`);
        return move;
    }

    _getOpponentColor(game) {
        return game.gameState.currentPlayer === 'white' ? 'black' : 'white';
    }

    _simpleNotation(fR, fC, tR, tC) {
        const files = 'abcdefgh';
        return `${files[fC]}${8 - fR} ➔ ${files[tC]}${8 - tR}`;
    }
}

Level_2.init();
window.Level_2 = Level_2;