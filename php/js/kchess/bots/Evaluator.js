/**
 * bots/Evaluator.js
 * Moteur d'évaluation pur : score une position ou un coup.
 * Aucune boucle de recherche, aucune simulation — juste du scoring.
 *
 * Version : 1.0.0
 */
class Evaluator {
    static VERSION = '1.0.0';

    /**
     * @param {Object} options
     * @param {Object} options.pieceValues  { pawn, knight, bishop, rook, queen, king }
     * @param {Object} options.weights      Pondérations des heuristiques
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

        // Pondérations par défaut (peuvent être surchargées par niveau)
        this.weights = {
            centerControl: 0.2,
            doubledPawns: -0.5,
            pawnIslands: -0.5,
            majorFile: 0.2,
            connectedPawns: 0.3,
            doubledRooks: 0.8,
            advancedRanks: 0.5,
            exposure: -0.5,
            check: 1.5,
            capture: 10,
            promotion: 1000,
            castling: 0.5,
            development: 0.05,
            centerOccupancy: 0.1,
            ...(options.weights || {})
        };

        // Fonctions utilitaires (GameFonctions)
        this.gf = options.gameFonctions;
        if (!this.gf) throw new Error('Evaluator: gameFonctions requis.');
    }

    /**
     * Évalue une position statique du point de vue de `color`.
     * Retourne un score en "centipawns" (pawn = 100).
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

        // Bonus structurels (deltas entre les deux camps)
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
     * Évalue un coup candidat par rapport à une position de référence.
     * Combine : captures, promotion, échec, structure, exposition, fourchettes.
     *
     * @param {Object} game     Position avant le coup
     * @param {Object} move     Coup candidat (format GameFonctions)
     * @param {String} color    Couleur qui joue
     * @param {Object} baseline Scores précalculés de la position avant (économise des appels)
     * @param {Number} exposure Valeur exposée après le coup (calculée par SearchEngine)
     */
    scoreMove(game, move, color, baseline = {}, exposure = 0) {
        const opp = this._opposite(color);
        const simulated = this.gf.simulateMove(game, move);
        if (!simulated) return -Infinity;

        let score = 0;

        // 1. Capture
        if (move.isCapture && move.targetPiece) {
            const capVal = this.pieceValues[move.targetPiece.type] || 0;
            const atkVal = this.pieceValues[move.piece.type] || 0;
            score += this.weights.capture * (capVal / 100);
            score += this.gf.getFavorableTradeBonus(
                simulated, move, color, this.pieceValues.knight, 2
            );
            if (capVal > atkVal * 0.7) score += 0.5;
            if (exposure === 0) score += 0.3;
        }

        // 2. Promotion
        if (this.gf.isPromotionMove(move)) score += this.weights.promotion;

        // 3. Échec
        if (this._isKingInCheck(simulated, opp)) score += this.weights.check;

        // 4. Centre
        if (move.toRow >= 2 && move.toRow <= 5 && move.toCol >= 2 && move.toCol <= 5) {
            score += this.weights.centerOccupancy;
        }

        // 5. Développement en ouverture
        if (this.gf.countPieces(simulated) > 20
            && (move.piece?.type === 'knight' || move.piece?.type === 'bishop')) {
            score += this.weights.development;
        }

        // 6. Structure (deltas vs baseline)
        score += this.weights.exposure * (exposure / 100);
        score += this.weights.centerControl *
            (this.gf.getCenterControlScore(simulated, color) - (baseline.center || 0));
        score += this.weights.doubledPawns *
            (this.gf.getDoubledPawnCount(simulated, color) - (baseline.doubledPawns || 0));
        score += this.weights.pawnIslands *
            (this.gf.getPawnIslandCount(simulated, color) - (baseline.islands || 0));
        score += this.weights.majorFile *
            (this.gf.getMajorPieceFileScore(simulated, color) - (baseline.majorFiles || 0));
        score += this.weights.connectedPawns *
            (this.gf.getConnectedPawnPairCount(simulated, color) - (baseline.connectedPawns || 0));
        score += this.weights.doubledRooks *
            (this.gf.getDoubledRookFileCount(simulated, color) - (baseline.doubledRooks || 0));
        score += this.weights.advancedRanks *
            (this.gf.getAdvancedMajorPieceRankCount(simulated, color) - (baseline.advancedRanks || 0));

        // 7. Fourchette de cavalier
        score += this.gf.getSafeKnightForkBonus(simulated, move, color, {
            simulated,
            exposure,
            baseBonus: 1.2,
            perExtraTarget: 0.4,
            targetValueFactor: 0.1,
            maximumBonus: 2.5
        });

        // 8. Roque
        if (move.details?.type === 'castling') score += this.weights.castling;

        // 9. Sauver une pièce attaquée
        if (this._isSquareAttacked(simulated, move.fromRow, move.fromCol, opp)) {
            score += (this.pieceValues[move.piece.type] || 0) * 0.005;
        }

        return score;
    }

    /**
     * Capture les scores de structure d'une position (optimisation).
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