/**
 * Level_4 - Stratège UI
 * Version 1.9.5 - Focus : Agressivité & Percée
 */
class Level_4 {
    static VERSION = '1.9.5';

    constructor() {
        this.name = "Bot Level 4 (Minimax)";
        this.level = 4;
        this.pieceValues = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
    }

    async getMove() {
        try {
            const game = window.chessGame?.core || window.chessGame;
            if (!game) return null;

            const color = game.gameState.currentPlayer;
            const isWhite = color.toLowerCase().startsWith('w');
            const myColor = isWhite ? 'white' : 'black';
            const oppColor = isWhite ? 'black' : 'white';
            
            const allMoves = this._getAllLegalMoves(game, myColor);
            if (allMoves.length === 0) return null;

            const oppKing = this._findKing(game, oppColor);

            allMoves.forEach(m => {
                let score = 0;

                // 1. CAPTURES AGRESSIVES (x20 au lieu de x15)
                if (m.isCapture) {
                    score += (this.pieceValues[m.targetPiece.type] * 20);
                }

                // 2. SÉCURITÉ INTELLIGENTE (Moins punitive pour autoriser les échanges)
                if (this._isSquareAttacked(game, m.toRow, m.toCol, oppColor)) {
                    score -= (this.pieceValues[m.piece.type] * 10);
                }

                // 3. CHASSE AU ROI (Bonus de proximité radical)
                if (oppKing) {
                    const distAfter = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    score += (10 - distAfter) * 15; // Plus on est près, plus on gagne de points
                }

                // 4. PERCÉE DES PIONS (Forcer la promotion)
                if (m.piece.type === 'pawn') {
                    const rank = isWhite ? (7 - m.toRow) : m.toRow;
                    score += (rank * rank * 5); // Progression exponentielle
                    if (m.toRow === 0 || m.toRow === 7) score += 5000;
                }

                // 5. BONUS DE MISE EN ÉCHEC (Si détectable par ton moteur)
                if (m.isCheck) score += 150;

                m._finalScore = score + (Math.random() * 5);
            });

            allMoves.sort((a, b) => b._finalScore - a._finalScore);
            return this._finalize(allMoves[0]);
        } catch (err) { return null; }
    }

    _findKing(game, color) {
        const key = color.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this._getPieceCompat(game, r, c);
                if (p && p.type === 'king' && p.color.toLowerCase().startsWith(key)) return { r, c };
            }
        }
        return null;
    }

    _isSquareAttacked(game, row, col, byColor) {
        const key = byColor.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this._getPieceCompat(game, r, c);
                if (p && p.color.toLowerCase().startsWith(key)) {
                    const moves = game.moveValidator.getPossibleMoves(p, r, c);
                    if (moves && moves.some(m => m.row === row && m.col === col)) return true;
                }
            }
        }
        return false;
    }

    _getAllLegalMoves(game, color) {
        const moves = [];
        const myKey = color.toLowerCase().charAt(0);
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this._getPieceCompat(game, r, c);
                if (piece && piece.color.toLowerCase().startsWith(myKey)) {
                    const pMoves = game.moveValidator.getPossibleMoves(piece, r, c);
                    if (pMoves) {
                        pMoves.forEach(m => {
                            const target = this._getPieceCompat(game, m.row, m.col);
                            moves.push({
                                fromRow: r, fromCol: c, toRow: m.row, toCol: m.col,
                                piece: piece, targetPiece: target,
                                isCapture: !!target && !target.color.toLowerCase().startsWith(myKey),
                                isCheck: m.isCheck || false
                            });
                        });
                    }
                }
            }
        }
        return moves;
    }

    _getPieceCompat(game, r, c) {
        try {
            const board = game.board;
            if (board.getPiece) return board.getPiece(r, c);
            const grid = board.grid || board;
            const sq = grid[r] ? grid[r][c] : null;
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
window.Level_4 = Level_4;