/**
 * Level_4 - Stratège UI
 * Version 3.2.0 - Migration complète vers GameFonctions v1.3.0
 *
 * v3.2.0 :
 *   - Toutes les méthodes communes sont dans GameFonctions v1.3.0
 *   - Conserve _scoreMoveQuickly (heuristique rapide)
 *   - Conserve _evaluateMoveExposure (override avec exposition ×12)
 *   - Conserve _pieceAttacksSquare
 */
class Level_4 {
    static VERSION = '3.2.0';

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
            const myColor = (color.toLowerCase().startsWith('w')) ? 'white' : 'black';
            const oppColor = myColor === 'white' ? 'black' : 'white';

            const allMoves = this._getAllLegalMoves(game, myColor);
            if (!allMoves || allMoves.length === 0) return null;

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
                let score = this._scoreMoveQuickly(game, m, myColor, oppKing);

                const afterMove = this._simulateMove(game, m);
                if (afterMove) {
                    const exposure = this._evaluateMoveExposure(game, m, oppColor, afterMove);
                    score -= exposure * 12;

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

                m._quickScore = score;
            });

            candidateMoves.sort((a, b) => b._quickScore - a._quickScore);

            return this._finalize(candidateMoves[0]);

        } catch (err) {
            console.error('Level 4 decision error:', err);
            return null;
        }
    }

    _scoreMoveQuickly(game, move, color, opponentKing) {
        let score = Math.random() * 5;

        if (move.isCapture && move.targetPiece) {
            score += this._evaluateExchange(game, move, color) * 25;
        }

        if (move.piece.type === 'pawn') {
            const progress = color === 'white' ? 7 - move.toRow : move.toRow;
            score += progress * progress * 8;
            if (move.toRow === 0 || move.toRow === 7) score += 1500;
        }

        if (move.toRow >= 2 && move.toRow <= 5 && move.toCol >= 2 && move.toCol <= 5) {
            score += 30;
        }

        if (opponentKing && this._pieceAttacksSquare(game, move, opponentKing.r, opponentKing.c)) {
            score += 50;
        }

        if (game.gameState.moveHistory.length < 20
            && ['knight', 'bishop'].includes(move.piece.type)
            && (move.fromRow === (color === 'white' ? 7 : 0))) {
            score += 15;
        }

        if (move.details?.type === 'castling') {
            score += 100;
        }

        return score;
    }

    _pieceAttacksSquare(game, move, targetRow, targetCol) {
        const rowDelta = targetRow - move.toRow;
        const colDelta = targetCol - move.toCol;
        const absRowDelta = Math.abs(rowDelta);
        const absColDelta = Math.abs(colDelta);
        const type = move.piece.type;

        if (type === 'pawn') {
            const forward = move.piece.color.toLowerCase().startsWith('w') ? -1 : 1;
            return rowDelta === forward && absColDelta === 1;
        }
        if (type === 'knight') {
            return (absRowDelta === 2 && absColDelta === 1) || (absRowDelta === 1 && absColDelta === 2);
        }
        if (type === 'bishop') {
            return absRowDelta === absColDelta && absRowDelta > 0;
        }
        if (type === 'rook') {
            return (absRowDelta === 0 && absColDelta > 0) || (absColDelta === 0 && absRowDelta > 0);
        }
        if (type === 'queen') {
            return (absRowDelta === absColDelta && absRowDelta > 0) ||
                   (absRowDelta === 0 && absColDelta > 0) ||
                   (absColDelta === 0 && absRowDelta > 0);
        }
        if (type === 'king') {
            return absRowDelta <= 1 && absColDelta <= 1 && (absRowDelta > 0 || absColDelta > 0);
        }
        return false;
    }
}
window.Level_4 = Level_4;