/**
 * Level_8 - Level 7 avec priorité aux fourchettes de cavalier, aux pions groupés et aux pièces majeures avancées.
 * Version 1.2.0 - Migration vers GameFonctions
 */
class Level_8 {
    static VERSION = '1.2.0';

    constructor() {
        this.name = "Bot Level 8 (Fourchettes de cavalier)";
        this.level = 8;
        this.pieceValues = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
        this.centerValues = { 'pawn': 150, 'knight': 135, 'bishop': 100, 'rook': 55, 'queen': 45, 'king': 0 };
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

                if (m.isCapture) {
                    const capturedValue = this.pieceValues[m.targetPiece.type] || 0;
                    score += capturedValue * 20;
                    score += this._getFavorableTradeBonus(
                        game, m, myColor, this.pieceValues.knight, 100
                    );
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

    _getBestMove(moves) {
        moves.sort((a, b) => b._finalScore - a._finalScore);
        const bestScore = moves[0]._finalScore;
        const threshold = bestScore > 0 ? bestScore * 0.75 : bestScore * 1.25;
        const candidates = moves.filter(m => m._finalScore >= threshold);
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // ★ Surcharge locale : version ChessEngine plus précise
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

window.Level_8 = Level_8;