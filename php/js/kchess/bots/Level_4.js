/**
 * Level_4_Berserker - Test de Force Brute
 * Objectif : Éliminer la prudence pour voir si le Bot domine enfin le L1
 */
class Level_4 {
    constructor() {
        this.name = "Bot Level 4 (Berserker)";
        this.level = 4;
        this.pieceValues = { 'pawn': 10, 'knight': 30, 'bishop': 30, 'rook': 50, 'queen': 90, 'king': 900 };
    }

    async getMove() {
        const game = window.chessGame?.core || window.chessGame;
        const player = game.gameState.currentPlayer;
        const allMoves = this._getAllLegalMoves(game, player);
        if (allMoves.length === 0) return null;

        const oppColor = player === 'white' ? 'black' : 'white';

        // TRI PAR PRIORITÉ PURE
        allMoves.sort((a, b) => {
            // 1. Priorité aux captures de grosses pièces
            if (a.isCapture && b.isCapture) {
                return this.pieceValues[b.targetPiece.type] - this.pieceValues[a.targetPiece.type];
            }
            if (a.isCapture) return -1;
            if (b.isCapture) return 1;

            // 2. Priorité à la poussée de pions vers la promotion
            if (a.piece.type === 'pawn' || b.piece.type === 'pawn') {
                const distA = player === 'white' ? a.toRow : 7 - a.toRow;
                const distB = player === 'white' ? b.toRow : 7 - b.toRow;
                return distA - distB;
            }

            return 0;
        });

        // On prend le premier (le meilleur selon nos critères de brute)
        return this._finalize(allMoves[0]);
    }

    _finalize(move) {
        if (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
            move.promotion = 'queen';
        }
        return move;
    }

    _getAllLegalMoves(game, color) {
        const moves = [];
        const board = game.board;
        const colorKey = color.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                let piece = this._getPiece(board, r, c);
                if (piece && piece.color.charAt(0).toLowerCase() === colorKey) {
                    let pMoves = game.moveValidator.getPossibleMoves(piece, r, c);
                    if (pMoves) {
                        pMoves.forEach(m => {
                            let target = this._getPiece(board, m.row, m.col);
                            moves.push({
                                fromRow: r, fromCol: c, toRow: m.row, toCol: m.col,
                                piece: piece, targetPiece: target,
                                isCapture: !!target && target.color.charAt(0).toLowerCase() !== colorKey
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
            let sq = board.getPiece ? board.getPiece(r, c) : (board.grid ? board.grid[r][c] : board[r][c]);
            if (sq && sq.piece) return sq.piece;
            return (sq && sq.type) ? sq : null;
        } catch (e) { return null; }
    }
}
window.Level_4 = Level_4;