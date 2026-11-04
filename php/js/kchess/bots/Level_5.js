/**
 * Level_5 - Grand Maître UI
 * Version 2.4.0 - Migration vers GameFonctions
 */
class Level_5 {
    static VERSION = '2.4.0';

    constructor() {
        this.name = "Bot Level 5 (Pro)";
        this.level = 5;
        this.pieceValues = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
        this.gameFonctions = GameFonctions.attach(this);
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
            const centerControlBefore = this._getCenterControlScore(game, myColor);

            allMoves.forEach(m => {
                let score = 0;
                const afterMove = this._simulateMove(game, m);

                if (m.isCapture) {
                    score += (this.pieceValues[m.targetPiece.type] * 20);
                }
                score -= this._evaluateMoveExposure(game, m, oppColor, afterMove) * 12;
                score += (this._getCenterControlScore(afterMove, myColor) - centerControlBefore) * 12;

                if (oppKing) {
                    const distAfter = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    score += (10 - distAfter) * 20;
                    const edgeDist = Math.max(Math.abs(oppKing.r - 3.5), Math.abs(oppKing.c - 3.5));
                    score += edgeDist * 25;
                }

                if (m.piece.type === 'pawn') {
                    const rank = isWhite ? (7 - m.toRow) : m.toRow;
                    score += (rank * rank * 10);
                    if (m.toRow === 0 || m.toRow === 7) score += 10000;
                }

                if (m.isCheck) score += 300;

                if (m.details?.type === 'castling') {
                    score += 100;
                }

                if (oppKing && !m.isCheck) {
                    const dist = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    if (dist <= 1) score -= 200;
                }

                m._finalScore = score;
            });

            return this._finalize(this._getBestMove(allMoves));

        } catch (err) {
            console.error('L5 Error:', err);
            return null;
        }
    }

    _getBestMove(moves) {
        moves.sort((a, b) => b._finalScore - a._finalScore);
        const bestScore = moves[0]._finalScore;
        const threshold = bestScore > 0 ? bestScore * 0.75 : bestScore * 1.25;
        const candidates = moves.filter(m => m._finalScore >= threshold);
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // ★ Surcharge locale : version ChessEngine plus précise que l'adapter
    _getCenterControlScore(game, color) {
        const fen = game.moveValidator.generateCurrentFEN(color);
        const engine = new ChessEngine(fen);
        const colorKey = color === 'white' ? 'w' : 'b';
        let score = 0;

        for (const [row, col] of [[3, 3], [3, 4], [4, 3], [4, 4]]) {
            const piece = this._getPieceCompat(game, row, col);
            if (piece?.color === color) score += 1;
            if (engine.isSquareAttacked(row, col, colorKey)) score += 1;
        }
        return score;
    }
}
window.Level_5 = Level_5;