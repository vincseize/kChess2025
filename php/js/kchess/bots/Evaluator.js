/**
 * bots/Evaluator.js
 * Moteur d'évaluation pur : score une position ou un coup.
 * Aucune boucle de recherche — juste du scoring.
 *
 * Version : 1.1.0
 *
 * Changelog v1.1.0 :
 *   - CORRIGÉ : scoreMove n'appelle plus simulateMove (double simulation).
 *     Le paramètre `simulated` est reçu du SearchEngine.
 *   - CORRIGÉ : le gain de capture n'est plus divisé par 100
 *     (incohérence d'échelle qui écrasait les captures).
 *   - CORRIGÉ : getFavorableTradeBonus aligné sur l'échelle pawn=100.
 *   - Toutes les valeurs (pieceValues, weights, bonus) en échelle pawn=100.
 */
class Evaluator {
    static VERSION = '1.1.0';

    /**
     * @param {Object} options
     * @param {Object} options.pieceValues  { pawn, knight, bishop, rook, queen, king }
     * @param {Object} options.weights      Pondérations des heuristiques (échelle pawn=100)
     * @param {Object} options.gameFonctions Instance GameFonctions attachée
     */
    constructor(options = {}) {
        this.pieceValues = {
            pawn: 100,
            knight: 320,
            bishop: 330,
            rook: 500,
            queen: 900,
            king: 20000,
            ...(options.pieceValues || {})
        };

        // Pondérations en échelle "pawn = 100" cohérente avec pieceValues
        this.weights = {
            centerControl: 20,       // × centerScore (0..8) → max ~160
            doubledPawns: -50,       // × count (0..8) → max -400
            pawnIslands: -50,
            majorFile: 20,
            connectedPawns: 30,
            doubledRooks: 80,
            advancedRanks: 50,
            exposure: -50,           // × (exposure/100)
            check: 150,
            capture: 10,             // × capVal direct → knight = 3200
            promotion: 100000,       // promotion = énorme
            castling: 50,
            development: 5,
            centerOccupancy: 10,
            ...(options.weights || {})
        };

        this.gf = options.gameFonctions;
        if (!this.gf) throw new Error('Evaluator: gameFonctions requis.');
    }

    /**
     * Évalue une position statique du point de vue de `color`.
     * Retourne un score en centipawns (pawn = 100).
     */
    scorePosition(game, color) {
        const opp = this._opposite(color);
        let score = 0;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.gf.getPiece(game, r, c);
                if (!piece) continue;
                const sign = this._sameColor(piece.color, color) ? 1 : -1;
                score += sign * (this.pieceValues[piece.type] || 0);
            }
        }

        score += this.weights.centerControl * this.gf.getCenterControlScore(game, color);
        score -= this.weights.centerControl * this.gf.getCenterControlScore(game, opp);
        score += this.weights.doubledPawns * this.gf.getDoubledPawnCount(game, color);
        score += this.weights.pawnIslands * this.gf.getPawnIslandCount(game, color);
        score += this.weights.connectedPawns * this.gf.getConnectedPawnPairCount(game, color);
        score += this.weights.majorFile * this.gf.getMajorPieceFileScore(game, color);
        score += this.weights.doubledRooks * this.gf.getDoubledRookFileCount(game, color);
        score += this.weights.advancedRanks * this.gf.getAdvancedMajorPieceRankCount(game, color);

        return score;
    }

    /**
     * Évalue un coup candidat.
     *
     * @param {Object} game      Position avant le coup
     * @param {Object} move      Coup candidat
     * @param {String} color     Couleur qui joue
     * @param {Object} baseline  Scores de structure avant le coup
     * @param {Number} exposure  Valeur exposée après le coup
     * @param {Object} simulated Position simulée (calculée par SearchEngine, optionnelle)
     */
    scoreMove(game, move, color, baseline = {}, exposure = 0, simulated = null) {
        const opp = this._opposite(color);
        const afterMove = simulated || this.gf.simulateMove(game, move);
        if (!afterMove) return -Infinity;

        let score = 0;

        // 1. Capture — échelle pawn=100 (knight capturé = 320 × 10 = 3200)
        if (move.isCapture && move.targetPiece) {
            const capVal = this.pieceValues[move.targetPiece.type] || 0;
            const atkVal = this.pieceValues[move.piece.type] || 0;
            score += this.weights.capture * capVal;
            score += this.gf.getFavorableTradeBonus(
                afterMove, move, color, this.pieceValues.knight, 50
            );
            if (capVal > atkVal * 0.7) score += 50;
            if (exposure === 0) score += 30;
        }

        // 2. Promotion
        if (this.gf.isPromotionMove(move)) score += this.weights.promotion;

        // 3. Échec
        if (this._isKingInCheck(afterMove, opp)) score += this.weights.check;

        // 4. Centre (occupation de la case d'arrivée)
        if (move.toRow >= 2 && move.toRow <= 5 && move.toCol >= 2 && move.toCol <= 5) {
            score += this.weights.centerOccupancy;
        }

        // 5. Développement en ouverture
        if (this.gf.countPieces(afterMove) > 20
            && (move.piece?.type === 'knight' || move.piece?.type === 'bishop')) {
            score += this.weights.development;
        }

        // 6. Structure — deltas vs baseline
        score += this.weights.exposure * (exposure / 100);
        score += this.weights.centerControl *
            (this.gf.getCenterControlScore(afterMove, color) - (baseline.center || 0));
        score += this.weights.doubledPawns *
            (this.gf.getDoubledPawnCount(afterMove, color) - (baseline.doubledPawns || 0));
        score += this.weights.pawnIslands *
            (this.gf.getPawnIslandCount(afterMove, color) - (baseline.islands || 0));
        score += this.weights.majorFile *
            (this.gf.getMajorPieceFileScore(afterMove, color) - (baseline.majorFiles || 0));
        score += this.weights.connectedPawns *
            (this.gf.getConnectedPawnPairCount(afterMove, color) - (baseline.connectedPawns || 0));
        score += this.weights.doubledRooks *
            (this.gf.getDoubledRookFileCount(afterMove, color) - (baseline.doubledRooks || 0));
        score += this.weights.advancedRanks *
            (this.gf.getAdvancedMajorPieceRankCount(afterMove, color) - (baseline.advancedRanks || 0));

        // 7. Fourchette de cavalier — échelle pawn=100
        score += this.gf.getSafeKnightForkBonus(afterMove, move, color, {
            simulated: afterMove,
            exposure,
            baseBonus: 120,
            perExtraTarget: 40,
            targetValueFactor: 0.1,
            maximumBonus: 250
        });

        // 8. Roque
        if (move.details?.type === 'castling') score += this.weights.castling;

        // 9. Sauver une pièce attaquée
        if (this._isSquareAttacked(afterMove, move.fromRow, move.fromCol, opp)) {
            score += (this.pieceValues[move.piece.type] || 0) * 0.5;
        }

        return score;
    }

    /**
     * Capture les scores de structure d'une position.
     * Appelé une fois avant de scorer N coups candidats.
     */
    captureBaseline(game, color) {
        return {
            center: this.gf.getCenterControlScore(game, color),
            doubledPawns: this.gf.getDoubledPawnCount(game, color),
            islands: this.gf.getPawnIslandCount(game, color),
            majorFiles: this.gf.getMajorPieceFileScore(game, color),
            connectedPawns: this.gf.getConnectedPawnPairCount(game, color),
            doubledRooks: this.gf.getDoubledRookFileCount(game, color),
            advancedRanks: this.gf.getAdvancedMajorPieceRankCount(game, color)
        };
    }

    // --- Helpers privés ---

    _isKingInCheck(game, color) {
        const king = this.gf.findKing(game, color);
        if (!king) return false;
        return this._isSquareAttacked(game, king.row, king.col, this._opposite(color));
    }

    _isSquareAttacked(game, row, col, byColor) {
        const key = byColor.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.gf.getPiece(game, r, c);
                if (!piece || piece.color.charAt(0).toLowerCase() !== key) continue;
                const moves = game.moveValidator.getPossibleMoves(piece, r, c) || [];
                if (moves.some(m => m.row === row && m.col === col)) return true;
            }
        }
        return false;
    }

    _sameColor(a, b) {
        if (typeof a !== 'string' || typeof b !== 'string') return false;
        return a.charAt(0).toLowerCase() === b.charAt(0).toLowerCase();
    }

    _opposite(color) {
        return (color || '').toLowerCase().startsWith('w') ? 'black' : 'white';
    }
}

window.Evaluator = Evaluator;