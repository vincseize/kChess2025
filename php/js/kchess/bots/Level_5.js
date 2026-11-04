/**
 * Level_5 - Grand Maître UI
 * Version 2.6.0 - Migration complète vers GameFonctions v1.3.0
 * Toutes les méthodes communes sont dans GameFonctions.
 * Ce fichier ne contient QUE le pipeline de décision et les poids spécifiques.
 */
class Level_5 {
    static VERSION = '2.6.0';

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

            // Mat en 1 prioritaire
            for (const m of allMoves) {
                const after = this._simulateMove(game, m);
                if (!after) continue;
                const oppMoves = this._getAllLegalMoves(after, oppColor);
                if (oppMoves.length !== 0) continue;
                const king = this._findKing(after, oppColor);
                if (king && this._isSquareAttacked(after, king.r, king.c, myColor)) {
                    return this._finalize(m);
                }
            }

            const oppKing = this._findKing(game, oppColor);
            const centerControlBefore = this._getCenterControlScore(game, myColor);

            allMoves.forEach(m => {
                let score = 0;
                const afterMove = this._simulateMove(game, m);

                if (m.isCapture) score += (this.pieceValues[m.targetPiece.type] * 20);
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
                if (m.details?.type === 'castling') score += 100;

                if (oppKing && !m.isCheck) {
                    const dist = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    if (dist <= 1) score -= 200;
                }

                if (afterMove) {
                    score -= this._opponentBestReplyPenalty(afterMove, oppColor, myColor);

                    const myKingPos = this._findKing(afterMove, myColor);
                    if (myKingPos) {
                        const attackers = this._countAttackersOnSquare(afterMove, myKingPos.r, myKingPos.c, oppColor);
                        if (attackers >= 2) score -= 500 * attackers;
                    }

                    if (this._isKingUnderThreatAfterMove(afterMove, myColor)) {
                        if (this._opponentCanMateInOne(afterMove, oppColor, myColor)) {
                            score -= 100000;
                        }
                    }

                    if (this._countPieces(afterMove) <= 12) {
                        if (this.gameFonctions.isStalemateAfterMove(game, m, oppColor, afterMove)) {
                            score -= 50000;
                        }
                    }
                }

                m._finalScore = score;
            });

            return this._finalize(this._getBestMove(allMoves));
        } catch (err) {
            console.error('L5 Error:', err);
            return null;
        }
    }
}
window.Level_5 = Level_5;