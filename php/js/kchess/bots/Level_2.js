/**
 * Level_2 - Stratégie CCMO (Check, Capture, Menace, Optimisation)
 * Version 2.1.4 - Mode Autonome (Sans Extends)
 */
class Level_2 {
    static VERSION = '2.1.4';

    constructor() {
        this.name = "Bot Level 2 (CCMO)";
        this.level = 2;
        this.pieceValues = { 
            'pawn': 1, 'knight': 3, 'bishop': 3, 
            'rook': 5, 'queen': 9, 'king': 100 
        };
    }

    async getMove() {
        try {
            // Accès direct au moteur via window
            const game = window.chessGame?.core || window.chessGame;
            if (!game) return null;

            const color = game.gameState.currentPlayer;
            const myColor = color.toLowerCase().startsWith('w') ? 'white' : 'black';
            const oppColor = myColor === 'white' ? 'black' : 'white';
            
            // 1. Récupération des coups via méthode interne
            const allMoves = this._getAllMoves(game, myColor);
            if (!allMoves || allMoves.length === 0) return null;

            // --- STRATÉGIE 1 : CAPTURES RENTABLES ---
            const captureMoves = allMoves.filter(m => m.isCapture && m.targetPiece);
            if (captureMoves.length > 0) {
                captureMoves.sort((a, b) => (this.pieceValues[b.targetPiece.type] || 0) - (this.pieceValues[a.targetPiece.type] || 0));
                
                for (let m of captureMoves) {
                    const isAttacked = this._isSquareAttacked(game, m.toRow, m.toCol, oppColor);
                    const targetVal = this.pieceValues[m.targetPiece.type] || 0;
                    const attackerVal = this.pieceValues[m.piece.type] || 0;

                    if (!isAttacked || targetVal >= attackerVal) {
                        return this._finalize(m);
                    }
                }
            }

            // --- STRATÉGIE 2 : CENTRE SAFE ---
            const safeMoves = allMoves.filter(m => !this._isSquareAttacked(game, m.toRow, m.toCol, oppColor));
            
            if (safeMoves.length > 0) {
                const central = safeMoves.filter(m => m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5);
                const source = central.length > 0 ? central : safeMoves;
                return this._finalize(source[Math.floor(Math.random() * source.length)]);
            }

            // --- STRATÉGIE 3 : FALLBACK ---
            return this._finalize(allMoves[Math.floor(Math.random() * allMoves.length)]);

        } catch (e) {
            console.error("❌ [Level_2] Erreur:", e);
            return null;
        }
    }

    // --- MÉTHODES INTERNES (Inspiration Level 16) ---

    _isSquareAttacked(game, row, col, byColor) {
        const colorKey = byColor.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this._getPiece(game.board, r, c);
                if (p && p.color.charAt(0).toLowerCase() === colorKey) {
                    const moves = game.moveValidator.getPossibleMoves(p, r, c);
                    if (moves && moves.some(m => m.row === row && m.col === col)) return true;
                }
            }
        }
        return false;
    }

    _getAllMoves(game, color) {
        const moves = [];
        const myColorKey = color.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this._getPiece(game.board, r, c);
                if (piece && piece.color.charAt(0).toLowerCase() === myColorKey) {
                    const possible = game.moveValidator.getPossibleMoves(piece, r, c);
                    if (possible) {
                        possible.forEach(m => {
                            const target = this._getPiece(game.board, m.row, m.col);
                            moves.push({
                                fromRow: r, fromCol: c, toRow: m.row, toCol: m.col,
                                piece: piece, targetPiece: target,
                                isCapture: !!target
                            });
                        });
                    }
                }
            }
        }
        return moves;
    }

    _getPiece(board, r, c) {
        try {
            let sq = board.grid ? board.grid[r][c] : (board.getPiece ? board.getPiece(r,c) : board[r][c]);
            if (!sq) return null;
            return sq.piece ? sq.piece : (sq.type ? sq : null);
        } catch(e) { return null; }
    }

    _finalize(move) {
        return {
            fromRow: move.fromRow,
            fromCol: move.fromCol,
            toRow: move.toRow,
            toCol: move.toCol,
            promotion: (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) ? 'queen' : null
        };
    }
}

window.Level_2 = Level_2;