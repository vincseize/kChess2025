/**
 * Level_3 - Tactique & Finalisation
 * Version 2.3.0 - Migration vers GameFonctions + tuning
 *
 * v2.3.0 :
 *   - Bruit aléatoire réduit de 15 à 5 (jeu plus solide)
 *   - 10 coups pré-classés au lieu de 8 (recherche plus large)
 *   - Conserve ses méthodes locales d'échange (en-passant fiable)
 */
class Level_3 {
    static VERSION = '2.3.0';

    constructor() {
        this.name = "Bot Level 3 (Tactique+)";
        this.level = 3;
        this.pieceValues = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
        this.currentGame = null;
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
                move._quickScore = this._scoreMoveQuickly(game, move, myColor, oppKing);
            });
            candidateMoves.sort((a, b) => b._quickScore - a._quickScore);

            const searchMoves = candidateMoves.slice(0, 10);
            let bestMove = null;
            let bestScore = -Infinity;

            for (const move of searchMoves) {
                const afterMove = this._simulateMove(game, move);
                const responses = this._getAllLegalMoves(afterMove, oppColor);

                if (responses.length === 0) {
                    const isCheckmate = afterMove.moveValidator.isKingInCheck(oppColor);
                    const score = isCheckmate ? 100000 : 0;
                    if (score > bestScore) {
                        bestMove = move;
                        bestScore = score;
                    }
                    continue;
                }

                let worstResponseScore = Infinity;
                for (const response of responses) {
                    const afterResponse = this._simulateMove(afterMove, response);
                    let responseScore = this._evaluatePosition(afterResponse, myColor);
                    if (response.isCapture || response.details?.isPromotion) {
                        const immediateGain = this._getImmediateExchangeGainLocal(afterMove, response);
                        const exchangeScore = this._evaluateExchangeLocal(afterMove, response, oppColor);
                        responseScore += immediateGain - exchangeScore;
                    }
                    worstResponseScore = Math.min(worstResponseScore, responseScore);

                    if (worstResponseScore + move._quickScore * 0.1 <= bestScore) break;
                }

                const score = worstResponseScore + move._quickScore * 0.1;
                if (score > bestScore) {
                    bestMove = move;
                    bestScore = score;
                }
            }

            return this._finalize(bestMove || searchMoves[0]);

        } catch (err) {
            console.error('Level 3 decision error:', err);
            return null;
        }
    }

    _scoreMoveQuickly(game, move, color, opponentKing) {
        // ★ Bruit réduit : 5 au lieu de 15
        let score = Math.random() * 5;
        if (move.isCapture && move.targetPiece) {
            score += this._evaluateExchangeLocal(game, move, color) * 10;
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

    _evaluateExchangeLocal(game, move, color) {
        const immediateGain = this._getImmediateExchangeGainLocal(game, move);
        if (immediateGain === 0) return 0;

        const details = move.details || {};
        const toRow = details.kingTo?.row ?? move.toRow;
        const toCol = details.kingTo?.col ?? move.toCol;
        const afterMove = this._simulateMove(game, move);
        const opponent = color === 'white' ? 'black' : 'white';
        return immediateGain - this._bestExchange(afterMove, toRow, toCol, opponent, 0);
    }

    _getImmediateExchangeGainLocal(game, move) {
        const details = move.details || {};
        const toRow = details.kingTo?.row ?? move.toRow;
        const toCol = details.kingTo?.col ?? move.toCol;
        const capturedPiece = (details.type === 'en-passant' || details.isEnPassant || move.isEnPassant)
            ? { type: 'pawn' }
            : this._getPieceCompat(game, toRow, toCol);
        const capturedValue = capturedPiece ? this.pieceValues[capturedPiece.type] || 0 : 0;
        const promotionGain = details.isPromotion || (move.piece.type === 'pawn' && (toRow === 0 || toRow === 7))
            ? this.pieceValues.queen - this.pieceValues.pawn
            : 0;
        return capturedValue + promotionGain;
    }

    _evaluatePosition(game, perspective) {
        const opponent = perspective === 'white' ? 'black' : 'white';
        const status = game.moveValidator.getGameStatus(perspective);
        if (status.status === 'checkmate') return -100000;
        if (status.status === 'stalemate') return 0;

        const attackEngine = new ChessEngine(game.moveValidator.generateCurrentFEN(perspective));
        let score = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this._getPieceCompat(game, row, col);
                if (!piece) continue;

                const sign = piece.color === perspective ? 1 : -1;
                score += sign * this.pieceValues[piece.type];
                if (attackEngine.isSquareAttacked(row, col, piece.color === 'white' ? 'b' : 'w')
                    && !attackEngine.isSquareAttacked(row, col, piece.color === 'white' ? 'w' : 'b')) {
                    score -= sign * this.pieceValues[piece.type] * 0.35;
                }

                const centerDistance = Math.min(
                    Math.abs(row - 3) + Math.abs(col - 3),
                    Math.abs(row - 3) + Math.abs(col - 4),
                    Math.abs(row - 4) + Math.abs(col - 3),
                    Math.abs(row - 4) + Math.abs(col - 4)
                );
                const centerWeight = { pawn: 3, knight: 8, bishop: 5, rook: 2, queen: 2, king: 0 }[piece.type] || 0;
                score += sign * Math.max(0, 4 - centerDistance) * centerWeight;

                if (piece.type === 'pawn') {
                    const progress = piece.color === 'white' ? 6 - row : row - 1;
                    score += sign * Math.max(0, progress) * 2;
                }
            }
        }

        if (game.moveValidator.isKingInCheck(perspective)) score -= 80;
        if (game.moveValidator.isKingInCheck(opponent)) score += 80;
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