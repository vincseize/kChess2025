/**
 * Level_4 - Stratège UI
 * Version 2.4.0 - Migration vers GameFonctions + tuning
 *
 * v2.4.0 :
 *   - Capture × 25 au lieu de × 20 (plus agressif)
 *   - Exposition × 12 au lieu de × 10 (plus prudent)
 */
class Level_4 {
    static VERSION = '2.4.0';

    constructor() {
        this.name = "Bot Level 4 (Minimax)";
        this.level = 4;
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

            const hasPlayedMove = game.gameState.moveHistory.some(move =>
                move.player?.toLowerCase().startsWith(myColor[0])
            );
            const openingMoves = hasPlayedMove
                ? allMoves
                : allMoves.filter(move =>
                    move.piece.type !== 'pawn' || (move.fromCol !== 0 && move.fromCol !== 7)
                );
            const candidateMoves = openingMoves.length > 0 ? openingMoves : allMoves;
            const oppKing = this._findKing(game, oppColor);

            candidateMoves.forEach(m => {
                let score = 0;

                if (m.isCapture) {
                    // ★ Capture × 25 au lieu de 20
                    score += this._evaluateExchange(game, m, myColor) * 25;
                }

                if (!m.isCapture) {
                    // ★ Exposition × 12 au lieu de 10
                    score -= this._evaluateMoveExposure(game, m, oppColor) * 12;
                }

                if (oppKing) {
                    const distAfter = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    score += (10 - distAfter) * 15;
                }

                if (m.piece.type === 'pawn') {
                    const rank = isWhite ? (7 - m.toRow) : m.toRow;
                    score += (rank * rank * 5);
                    if (m.toRow === 0 || m.toRow === 7) score += 5000;
                }

                if (m.isCheck) score += 150;

                if (m.details?.type === 'castling' && m.details.side === 'kingside') {
                    score += 100;
                }

                m._finalScore = score;
            });

            return this._finalize(this._getBestMove(candidateMoves));

        } catch (err) {
            console.error("L4 Error:", err);
            return null;
        }
    }

    _getBestMove(moves) {
        moves.sort((a, b) => b._finalScore - a._finalScore);
        const bestScore = moves[0]._finalScore;
        const threshold = bestScore > 0 ? bestScore * 0.90 : bestScore * 1.10;
        const candidates = moves.filter(m => m._finalScore >= threshold);
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
}
window.Level_4 = Level_4;