/**
 * Level_8 - Bot Level 8 (Fourchettes)
 * Depth 1 : L7 + îlots de pions, rangées avancées, réponses adverses étendues (24).
 * Configuration pure : toute la logique est dans LadderBot.js.
 */
class Level_8 extends LadderBot {
    static VERSION = '3.0.0';

    constructor() {
        super({
            name: "Bot Level 8 (Fourchettes)", level: 8, depth: 1, noise: 20,
            mateIn1: true, openingFilter: true, stalemateGuard: true, stalePieces: 12,
            conversion: true, repetition: true,
            replyLimit: 24, replyW: 1, kingAttackers: 60, mateThreat: true,
            w: { capture: 1, exposure: 1, promotion: 800, pawnAdvance: 3, centerSquare: 12, develop: 15, castle: 60, check: 30, centerControl: 8, doubledPawns: 20, majorFile: 10, connected: 15, doubledRooks: 25, fork: 1, islands: 20, advRanks: 15 }
        });
    }
}
window.Level_8 = Level_8;
