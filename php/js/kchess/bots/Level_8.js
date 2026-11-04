/**
 * Level_8 - Fourchettes de cavalier, pions groupés, pièces majeures avancées
 * Version 1.3.0 - Ajout threat detection (approximation depth-2)
 *
 * v1.3.0 :
 *   - Ajout threat detection (comme L5/L6/L7)
 *   - Conserve les heuristiques spécifiques (îlots de pions, rangées avancées)
 */
class Level_8 {
    static VERSION = '1.3.0';

    constructor() {
        this.name = "Bot Level 8 (Fourchettes de cavalier)";
        this.level = 8;
        this.pieceValues = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
        this.centerValues = { 'pawn': 150, 'knight': 135, 'bishop': 100, 'rook': 55, 'queen': 45, 'king': 0 };
        this.gameFonctions = GameFonctions.attach(this);
        this.maxOppCaptures = 8;
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
            const doubledPawnsBefore = this._getDoubledPawnCount(game, myColor);
            const majorPieceFilesBefore = this._getMajorPieceFileScore(game, myColor);
            const connectedPawnsBefore = this._getConnectedPawnPairCount(game, myColor);
            const doubledRooksBefore = this._getDoubledRookFileCount(game, myColor);
            const pawnIslandsBefore = this._getPawnIslandCount(game, myColor);
            const advancedMajorRanksBefore = this._getAdvancedMajorPieceRankCount(game, myColor);

            allMoves.forEach(m => {
                let score = 0;
                const afterMove = this._simulateMove(game, m);
                const exposure = this._evaluateMoveExposure(game, m, oppColor, afterMove);

                // Heuristiques L8 originales
                if (m.isCapture) {
                    const capturedValue = this.pieceValues[m.targetPiece.type] || 0;
                    score += capturedValue * 20;
                    score += this._getFavorableTradeBonus(game, m, myColor, this.pieceValues.knight, 100);
                }
                score -= exposure * 12;
                score += (this._getCenterControlScore(afterMove, myColor) - centerControlBefore) * 12;
                score -= (this._getDoubledPawnCount(afterMove, myColor) - doubledPawnsBefore) * 25;
                score -= (this._getPawnIslandCount(afterMove, myColor) - pawnIslandsBefore) * 25;
                score += (this._getMajorPieceFileScore(afterMove, myColor) - majorPieceFilesBefore) * 12;
                score += (this._getConnectedPawnPairCount(afterMove, myColor) - connectedPawnsBefore) * 25;
                score += (this._getDoubledRookFileCount(afterMove, myColor) - doubledRooksBefore) * 30;
                score += (this._getAdvancedMajorPieceRankCount(afterMove, myColor) - advancedMajorRanksBefore) * 20;
                score += this.gameFonctions.getSafeKnightForkBonus(game, m, myColor, {
                    simulated: afterMove,
                    exposure
                });

                if (oppKing) {
                    const distAfter = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    score += (10 - distAfter) * 20;
                    const edgeDist = Math.max(Math.abs(oppKing.r - 3.5), Math.abs(oppKing.c - 3.5));
                    score += edgeDist * 25;
                }

                if (m.piece.type === 'pawn') {
                    const rank = isWhite ? (7 - m.toRow) : m.toRow;
                    score += rank * rank * 10;
                    if (m.details?.isPromotion || (m.toRow === 0 || m.toRow === 7)) {
                        score += 10000;
                    }
                }

                if (m.isCheck) score += 300;

                if (oppKing && !m.isCheck) {
                    const dist = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    if (dist <= 1) score -= 200;
                }

                score += this._getCenterValue(m.piece.type, m.toRow, m.toCol)
                    - this._getCenterValue(m.piece.type, m.fromRow, m.fromCol);

                if (m.details?.type === 'castling') {
                    score += 100;
                }

                // ★ NOUVEAU : threat detection
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

            const promotionMoves = allMoves.filter(move => this._isPromotionMove(move));
            if (promotionMoves.length > 0) {
                promotionMoves.sort((a, b) => b._finalScore - a._finalScore);
                return this._finalize(promotionMoves[0]);
            }

            return this._finalize(this._getBestMove(allMoves));
        } catch (err) {
            console.error('L8 Error:', err);
            return null;
        }
    }

    _getCenterValue(pieceType, row, col) {
        const distance = Math.min(
            ...[3, 4].flatMap(centerRow => [3, 4].map(centerCol =>
                Math.abs(row - centerRow) + Math.abs(col - centerCol)
            ))
        );
        const proximity = [1, 0.65, 0.3, 0.1][distance] || 0;
        return (this.centerValues[pieceType] || 0) * proximity;
    }

    _opponentBestReplyPenalty(simulatedGame, oppColor, myColor) {
        const replies = this._getAllLegalMoves(simulatedGame, oppColor);
        if (replies.length === 0) return 0;

        let worstNet = 0;
        let examined = 0;

        for (const reply of replies) {
            if (!reply.isCapture && !reply.isCheck) continue;
            if (++examined > this.maxOppCaptures) break;

            let net = 0;
            if (reply.isCapture && reply.targetPiece) {
                const attackVal = this.pieceValues[reply.piece.type] || 0;
                const targetVal = this.pieceValues[reply.targetPiece.type] || 0;
                const defended = this._isSquareAttacked(simulatedGame, reply.toRow, reply.toCol, myColor);
                const gain = defended ? (targetVal - attackVal) : targetVal;
                if (gain > 0) net += gain;
            }
            if (reply.isCheck) net += 100;
            if (this._isPromotionMove(reply)) net += 5000;

            if (net > worstNet) worstNet = net;
            if (worstNet > 1000) break;
        }
        return worstNet * 2;
    }

    _isKingUnderThreatAfterMove(afterMove, myColor) {
        if (!afterMove) return false;
        return this.gameFonctions.isKingUnderThreat(afterMove, myColor);
    }

    _opponentCanMateInOne(afterMove, oppColor, myColor) {
        return this.gameFonctions.opponentCanMateInOne(afterMove, oppColor, myColor);
    }

    _countAttackersOnSquare(game, row, col, byColor) {
        return this.gameFonctions.countAttackersOnSquare(game, row, col, byColor);
    }

    _getBestMove(moves) {
        moves.sort((a, b) => b._finalScore - a._finalScore);
        const bestScore = moves[0]._finalScore;
        const threshold = bestScore > 0 ? bestScore * 0.75 : bestScore * 1.25;
        const candidates = moves.filter(m => m._finalScore >= threshold);
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
}
window.Level_8 = Level_8;