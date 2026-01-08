/**
 * Level_1 - Le bot débutant (Aléatoire + Instinct de Capture)
 * Logique : Priorise les captures 50% du temps, sinon joue au hasard.
 */
class Level_1 {
    static VERSION = '1.5.5';

    constructor() {
        this.name = "Bot Level 1";
        this.level = 1;
    }

    async getMove() {
        const game = window.chessGame?.core || window.chessGame; 
        if (!game) return { error: 'engine_not_found' };

        const currentPlayer = game.gameState.currentPlayer;
        const allMoves = this._getAllLegalMoves(game, currentPlayer);

        if (allMoves.length === 0) return { error: 'game_over' };

        const captures = allMoves.filter(m => m.isCapture);
        let selectedMove;

        // Logique d'agressivité
        if (captures.length > 0 && Math.random() > 0.5) {
            selectedMove = captures[Math.floor(Math.random() * captures.length)];
        } else {
            selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
        }

        // SÉCURITÉ PROMOTION : Toujours promouvoir en Dame pour éviter de bloquer l'UI
        if (selectedMove.piece?.type === 'pawn' && (selectedMove.toRow === 0 || selectedMove.toRow === 7)) {
            selectedMove.promotion = 'queen';
        }

        return selectedMove;
    }

    _getAllLegalMoves(game, color) {
        const moves = [];
        const board = game.board;
        const myColorKey = color.charAt(0).toLowerCase();

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                let piece = this._getPiece(board, r, c);
                if (piece && piece.color.charAt(0).toLowerCase() === myColorKey) {
                    let pieceMoves = game.moveValidator.getPossibleMoves(piece, r, c);
                    if (pieceMoves) {
                        pieceMoves.forEach(m => {
                            let target = this._getPiece(board, m.row, m.col);
                            let isCap = target && target.color.charAt(0).toLowerCase() !== myColorKey;
                            moves.push({
                                fromRow: r, fromCol: c,
                                toRow: m.row, toCol: m.col,
                                piece: piece,
                                isCapture: isCap,
                                notation: this._simpleNotation(r, c, m.row, m.col)
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

    _simpleNotation(fR, fC, tR, tC) {
        return `${'abcdefgh'[fC]}${8 - fR}➔${'abcdefgh'[tC]}${8 - tR}`;
    }
}
window.Level_1 = Level_1;