/**
 * Level_3 - Tactique & Finalisation
 * Version 2.4.0 - Ajout "menace adverse" (approximation depth-2 par captures)
 *
 * v2.4.0 :
 *   - Ajout _opponentBestReplyPenalty : détecte les captures adverses gagnantes
 *     après chaque coup candidat, sans faire un vrai minimax complet.
 *   - Supprime l'appel au vrai minimax 2-ply (depth-2 → depth-1 avec threat detection).
 *   - Bruit aléatoire augmenté à 8 (au lieu de 5) pour compenser la perte de profondeur.
 *
 * Objectif : performances proches de depth-2 (50-55%) mais 5x plus rapide.
 */
class Level_3 {
    static VERSION = '2.4.0';

    constructor() {
        this.name = "Bot Level 3 (Tactique+)";
        this.level = 3;
        this.pieceValues = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
        this.currentGame = null;
        this.gameFonctions = GameFonctions.attach(this);

        // Limite de captures adverses examinées
        this.maxOppCaptures = 8;
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
            candidateMoves.forEach(move => {
                let score = this._scoreMoveQuickly(game, move, myColor, oppKing);

                const afterMove = this._simulateMove(game, move);
                if (afterMove) {
                    // Pénalité de menace adverse (approximation depth-2)
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

                move._quickScore = score;
            });

            candidateMoves.sort((a, b) => b._quickScore - a._quickScore);

            return this._finalize(candidateMoves[0]);

        } catch (err) {
            console.error('Level 3 decision error:', err);
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
        // Bruit augmenté à 8 (compense la perte de profondeur)
        let score = Math.random() * 8;
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

    _sameColor(a, b) {
        if (typeof a !== 'string' || typeof b !== 'string') return false;
        return a.charAt(0).toLowerCase() === b.charAt(0).toLowerCase();
    }
}
window.Level_3 = Level_3;