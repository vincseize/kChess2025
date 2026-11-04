/**
 * Level_4 - Stratège UI
 * Version 3.1.0 - Ajout "menace adverse" (approximation depth-2 par captures)
 *
 * v3.1.0 :
 *   - Supprime le vrai minimax 2-ply (depth-2 → depth-1 avec threat detection).
 *   - Ajout _opponentBestReplyPenalty : détecte les captures adverses gagnantes.
 *   - Pénalité sécurité du roi (comme L16 v1.2.0).
 *   - Pénalité mat adverse en 1.
 *   - Conserve l'agressivité captures ×25 et la prudence exposition ×12.
 *   - Bruit augmenté à 5 (au lieu de 3) pour compenser la perte de profondeur.
 *
 * Objectif : performances proches de depth-2 (50-55%) mais 5x plus rapide.
 */
class Level_4 {
    static VERSION = '3.1.0';

    constructor() {
        this.name = "Bot Level 4 (Minimax)";
        this.level = 4;
        this.pieceValues = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
        this.gameFonctions = GameFonctions.attach(this);

        // Limite de captures adverses examinées
        this.maxOppCaptures = 8;
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

            // Mat en 1 : priorité absolue
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

            // Scoring depth-1 + threat detection
            candidateMoves.forEach(m => {
                let score = this._scoreMoveQuickly(game, m, myColor, oppKing);

                const afterMove = this._simulateMove(game, m);
                if (afterMove) {
                    // Pénalité exposition (déjà présente dans L4 original)
                    const exposure = this._evaluateMoveExposure(game, m, oppColor, afterMove);
                    score -= exposure * 12;

                    // Pénalité menace adverse (approximation depth-2)
                    score -= this._opponentBestReplyPenalty(afterMove, oppColor, myColor);

                    // Pénalité sécurité du roi
                    const myKingPos = this._findKing(afterMove, myColor);
                    if (myKingPos) {
                        const attackers = this._countAttackersOnSquare(
                            afterMove, myKingPos.r, myKingPos.c, oppColor
                        );
                        if (attackers >= 2) score -= 500 * attackers;
                    }

                    // Pénalité mat adverse en 1
                    if (this._isKingUnderThreatAfterMove(afterMove, myColor)) {
                        if (this._opponentCanMateInOne(afterMove, oppColor, myColor)) {
                            score -= 100000;
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

    /**
     * Détecte la meilleure capture adverse après un coup candidat.
     * Approximation rapide de depth-2 : ne simule que les captures.
     */
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
                const defended = this._isSquareAttacked(
                    simulatedGame, reply.toRow, reply.toCol, myColor
                );
                const gain = defended ? (targetVal - attackVal) : targetVal;
                if (gain > 0) net += gain;
            }

            if (reply.isCheck) net += 100;
            if (this._isPromotionMove(reply)) net += 5000;

            if (net > worstNet) worstNet = net;
            if (worstNet > 1000) break;
        }

        return worstNet * 2;   // × 2 pour rendre la pénalité dissuasive
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

    _scoreMoveQuickly(game, move, color, opponentKing) {
        // Bruit augmenté à 5 (compense la perte de profondeur)
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

    _evaluateExchange(game, move, color) {
        const immediateGain = this._getImmediateExchangeGain(game, move);
        if (immediateGain === 0) return 0;

        const details = move.details || {};
        const toRow = details.kingTo?.row ?? move.toRow;
        const toCol = details.kingTo?.col ?? move.toCol;
        const afterMove = this._simulateMove(game, move);
        const opponent = color === 'white' ? 'black' : 'white';
        return immediateGain - this._bestExchange(afterMove, toRow, toCol, opponent, 0);
    }

    _evaluateMoveExposure(game, move, opponent, afterMove = null) {
        const sim = afterMove || this._simulateMove(game, move);
        if (!sim) return 0;
        const toRow = move.details?.kingTo?.row ?? move.toRow;
        const toCol = move.details?.kingTo?.col ?? move.toCol;
        return this._bestExchange(sim, toRow, toCol, opponent, 0);
    }

    _getImmediateExchangeGain(game, move) {
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

    _bestExchange(game, targetRow, targetCol, capturingColor, depth = 0) {
        if (depth >= (this.gameFonctions.maxExchangeDepth || 8)) return 0;

        const target = this._getPieceCompat(game, targetRow, targetCol);
        if (!target || this._sameColor(target.color, capturingColor)) return 0;

        const capturedValue = this.pieceValues[target.type] || 0;
        let bestScore = 0;
        for (const move of this._getAllLegalMoves(game, capturingColor)) {
            if (move.toRow !== targetRow || move.toCol !== targetCol || !move.isCapture) continue;

            const promotionGain = move.piece.type === 'pawn' && (targetRow === 0 || targetRow === 7)
                ? (this.pieceValues.queen || 0) - (this.pieceValues.pawn || 0)
                : 0;
            const afterCapture = this._simulateMove(game, move);
            const score = capturedValue + promotionGain
                - this._bestExchange(afterCapture, targetRow, targetCol, this._oppositeColor(capturingColor), depth + 1);
            bestScore = Math.max(bestScore, score);
        }
        return bestScore;
    }

    _isPromotionMove(move) {
        return this.gameFonctions.isPromotionMove(move);
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

    _sameColor(a, b) {
        if (typeof a !== 'string' || typeof b !== 'string') return false;
        return a.charAt(0).toLowerCase() === b.charAt(0).toLowerCase();
    }

    _oppositeColor(color) {
        return this._sameColor(color, 'white') ? 'black' : 'white';
    }
}

window.Level_4 = Level_4;