/**
 * Level_2 - Stratégie CCMO optimisée
 * Version 1.6.1 - Performance focus pour Stress Test
 */
class Level_2 {
    static VERSION = '1.6.1';

    constructor() {
        this.name = "Bot Level 2 (CCMO)";
        this.level = 2;
        this.pieceValues = { 'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 100 };
    }

    async getMove() {
        try {
            const game = window.chessGame?.core || window.chessGame;
            if (!game) return null;

            const color = game.gameState.currentPlayer;
            const oppColor = color.toLowerCase().startsWith('w') ? 'black' : 'white';
            
            const allMoves = this._getAllLegalMoves(game, color);
            if (!allMoves || allMoves.length === 0) return null;

            // --- 1. CAPTURES RENTABLES ---
            const captureMoves = allMoves.filter(m => m.isCapture);
            if (captureMoves.length > 0) {
                captureMoves.sort((a, b) => this.pieceValues[b.targetPiece.type] - this.pieceValues[a.targetPiece.type]);
                
                for (let i = 0; i < Math.min(captureMoves.length, 3); i++) {
                    const m = captureMoves[i];
                    const isAttacked = this._isSquareAttacked(game, m.toRow, m.toCol, oppColor);
                    if (!isAttacked || this.pieceValues[m.targetPiece.type] >= this.pieceValues[m.piece.type]) {
                        return this._finalize(m);
                    }
                }
            }

            // --- 2. CENTRE SAFE & DÉVELOPPEMENT ---
            const safeMoves = allMoves.filter(m => !this._isSquareAttacked(game, m.toRow, m.toCol, oppColor));
            
            if (safeMoves.length > 0) {
                const central = safeMoves.filter(m => m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5);
                if (central.length > 0) {
                    return this._finalize(central[Math.floor(Math.random() * central.length)]);
                }
                return this._finalize(safeMoves[Math.floor(Math.random() * safeMoves.length)]);
            }

            // --- 3. FALLBACK ---
            return this._finalize(allMoves[Math.floor(Math.random() * allMoves.length)]);
        } catch (e) {
            return null;
        }
    }

    _isSquareAttacked(game, row, col, byColor) {
        const colorKey = byColor.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this._getPiece(game, r, c);
                if (p && p.color.toLowerCase().startsWith(colorKey)) {
                    const moves = game.moveValidator.getPossibleMoves(p, r, c);
                    if (moves && moves.some(m => m.row === row && m.col === col)) return true;
                }
            }
        }
        return false;
    }

    _getAllLegalMoves(game, color) {
        const moves = [];
        const myColorKey = color.charAt(0).toLowerCase();

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this._getPiece(game, r, c);
                if (piece && piece.color.toLowerCase().startsWith(myColorKey)) {
                    const pMoves = game.moveValidator.getPossibleMoves(piece, r, c);
                    if (pMoves) {
                        pMoves.forEach(m => {
                            const target = this._getPiece(game, m.row, m.col);
                            moves.push({
                                fromRow: r, fromCol: c, toRow: m.row, toCol: m.col,
                                piece: piece, 
                                targetPiece: target,
                                isCapture: !!target && !target.color.toLowerCase().startsWith(myColorKey)
                            });
                        });
                    }
                }
            }
        }
        return moves;
    }

    _getPiece(game, r, c) {
        try {
            const board = game.board;
            if (board.getPiece) return board.getPiece(r, c);
            const grid = board.grid || board;
            const sq = grid[r][c];
            return sq?.piece || (sq?.type ? sq : null);
        } catch(e) { return null; }
    }

    _finalize(move) {
        if (!move) return null;
        return {
            fromRow: move.fromRow, fromCol: move.fromCol,
            toRow: move.toRow, toCol: move.toCol,
            promotion: (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) ? 'queen' : undefined
        };
    }
}
window.Level_2 = Level_2;