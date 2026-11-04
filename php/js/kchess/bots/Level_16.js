/**
 * Level_16 - Bot Killer
 * Version 6.0.1 - Basé sur SearchEngine + Evaluator
 *
 * Changelog v6.0.1 :
 *   - CORRIGÉ : pieceValues en échelle pawn=100 partout
 *     (cohérence entre GameFonctions et Evaluator).
 *   - Poids calibrés sur l'échelle pawn=100.
 */
class Level_16 {
    static VERSION = '6.0.1';

    constructor() {
        this.name = "Bot Level 16 (Killer)";
        this.level = 16;

        // ⚠️ Échelle pawn=100 UNIQUE pour GameFonctions et Evaluator
        this.pieceValues = {
            pawn: 100,
            knight: 320,
            bishop: 330,
            rook: 500,
            queen: 900,
            king: 20000
        };
        this.gameFonctions = GameFonctions.attach(this);

        this.evaluator = new Evaluator({
            pieceValues: this.pieceValues,
            weights: {
                capture: 10,             // × 100..900 → 1000..9000
                promotion: 100000,
                check: 150,
                centerOccupancy: 10,
                development: 5,
                exposure: -50,           // × (exposure/100)
                centerControl: 20,
                doubledPawns: -50,
                pawnIslands: -50,
                majorFile: 20,
                connectedPawns: 30,
                doubledRooks: 80,
                advancedRanks: 50,
                castling: 50
            },
            gameFonctions: this.gameFonctions
        });

        this.search = new SearchEngine(
            this.evaluator,
            this.gameFonctions,
            {
                enableOpening: true,
                enableMateInOne: true,
                enableMateInTwo: false,
                enableEndgame: true,
                maxOppReplies: 10,
                mateInTwoMaxCandidates: 12
            }
        );
    }

    async getMove() {
        const game = window.chessGame?.core || window.chessGame;
        if (!game) return { error: 'engine_not_found' };
        return this.search.findBestMove(game);
    }
}

window.Level_16 = Level_16;