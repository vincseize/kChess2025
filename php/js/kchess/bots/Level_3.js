/**
 * Level_3 - Tactique & Finalisation
 * Version 2.5.0 - Migration complète vers GameFonctions v1.3.0
 *
 * v2.5.0 :
 *   - Toutes les méthodes communes sont dans GameFonctions v1.3.0
 *   - Conserve _scoreMoveQuickly (heuristique rapide propre à L3)
 */
class Level_3 {
    static VERSION = '2.5.0';

    constructor() {
        this.name = "Bot Level 3 (Tactique+)";
        this.level = 3;
        this.pieceValues = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
        this.gameFonctions = GameFonctions.attach(this);
    }

    async getMove() {
        try {
            const game = this.currentGame || window.chessGame?.core || window.chessGame;
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

            candidateMoves.forEach(move => {
                let score = this._scoreMoveQuickly(game, move, myColor, oppKing);

                const afterMove = this._simulateMove(game, move);
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
                        if (this.gameFonctions.isStalemateAfterMove(game, move, oppColor, afterMove)) {
                            score -= 50000;
                        }
                    }
                }

                move._quickScore = score;
            });

            candidateMoves.sort((a, b) => b._quickScore - a._quickScore);

            return this._finalize(candidateMoves[0]);

        } catch (err) {
            console.error('Level 3 decision error:', err);
            return null;
        }
    }

    _scoreMoveQuickly(game, move, color, opponentKing) {
        let score = Math.random() * 8;
        if (move.isCapture && move.targetPiece) {
            score += this._evaluateExchange(game, move, color) * 10;
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
            && (move.fromRow === 0 || move.fromRow === 7)) {
            score += 15;
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
            return (absRowDelta === 2 && absColDelta === 1)
                || (absRowDelta === 1 && absColDelta === 2);
        }
        if (type === 'king') return Math.max(absRowDelta, absColDelta) === 1;

        const isStraight = rowDelta === 0 || colDelta === 0;
        const isDiagonal = absRowDelta === absColDelta;
        if (type === 'rook' && !isStraight) return false;
        if (type === 'bishop' && !isDiagonal) return false;
        if (type === 'queen' && !isStraight && !isDiagonal) return false;
        if (type !== 'rook' && type !== 'bishop' && type !== 'queen') return false;

        const rowStep = Math.sign(rowDelta);
        const colStep = Math.sign(colDelta);
        let row = move.toRow + rowStep;
        let col = move.toCol + colStep;
        while (row !== targetRow || col !== targetCol) {
            const isVacatedOrigin = row === move.fromRow && col === move.fromCol;
            if (!isVacatedOrigin && this._getPieceCompat(game, row, col)) return false;
            row += rowStep;
            col += colStep;
        }
        return true;
    }
}
window.Level_3 = Level_3;