/**
 * Level_1 - Le bot débutant (Aléatoire + Instinct de Capture)
 * Logique : Si une capture est possible, il a une forte probabilité de la choisir.
 */
class Level_1 {
    static VERSION = '1.5.0';

    constructor() {
        this.name = "Bot Level 1";
        this.level = 1;
    }

    async getMove(fen) {
        const game = window.chessGame?.core || window.chessGame; 
        if (!game) return { error: 'engine_not_found' };

        const currentPlayer = game.gameState.currentPlayer;
        const allMoves = this._getAllLegalMoves(game, currentPlayer);

        if (allMoves.length === 0) return { error: 'game_over' };

        // 1. On sépare les captures des coups normaux
        const captures = allMoves.filter(m => m.isCapture);
        let selectedMove;

        // 2. LOGIQUE D'AGRESSIVITÉ (50% de chances de capturer si possible)
        if (captures.length > 0 && Math.random() > 0.5) {
            selectedMove = captures[Math.floor(Math.random() * captures.length)];
            console.log(`⚔️ Level 1 a faim ! Capture choisie : ${selectedMove.notation}`);
        } else {
            selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
            console.log(`🎲 Level 1 joue au hasard : ${selectedMove.notation}`);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
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