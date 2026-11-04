/**
 * Level_16 - Bot Killer
 * Version 6.0.0 - Basé sur SearchEngine + Evaluator
 *
 * Ce fichier ne contient plus la logique : il configure seulement
 * un Evaluator (pondérations) et un SearchEngine (pipeline).
 */
class Level_16 {
    static VERSION = '6.0.0';

    constructor() {
        this.name = "Bot Level 16 (Killer)";
        this.level = 16;

        // Attache GameFonctions avec les valeurs de pièces du bot
        this.pieceValues = {
            pawn: 1,
            knight: 3.2,
            bishop: 3.3,
            rook: 5,
            queen: 9,
            king: 100
        };
        this.gameFonctions = GameFonctions.attach(this);

        // Construit l'évaluateur avec les pondérations du niveau 16
        // Poids ajustés pour équilibrer capture vs pénalité réponse adverse
        this.evaluator = new Evaluator({
            pieceValues: {
                pawn: 100,
                knight: 320,
                bishop: 330,
                rook: 500,
                queen: 900,
                king: 20000
            },
            weights: {
                capture: 10,
                promotion: 1000,
                check: 1.5,
                centerOccupancy: 0.1,
                development: 0.05,
                exposure: -0.5,
                centerControl: 0.2,
                doubledPawns: -0.5,
                pawnIslands: -0.5,
                majorFile: 0.2,
                connectedPawns: 0.3,
                doubledRooks: 0.8,
                advancedRanks: 0.5,
                castling: 0.5
            },
            gameFonctions: this.gameFonctions
        });

        // Construit le moteur de recherche
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