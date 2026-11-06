/**
 * Level_6 - Bot Level 6 (Centre)
 * Depth 1 : L5 + réponses adverses élargies (12) + colonnes ouvertes pour tours/dames.
 * Configuration pure : toute la logique est dans LadderBot.js.
 */
class Level_6 extends LadderBot {
    static VERSION = '3.0.0';

    constructor() {
        super({
            name: "Bot Level 6 (Centre)", level: 6, depth: 1, noise: 85,
            mateIn1: true, openingFilter: true, stalemateGuard: true, stalePieces: 12,
            conversion: true, repetition: true,
            replyLimit: 12, replyW: 1, kingAttackers: 60, mateThreat: true,
            w: { capture: 1, exposure: 1, promotion: 800, pawnAdvance: 3, centerSquare: 12, develop: 15, castle: 60, check: 30, centerControl: 8, doubledPawns: 20, majorFile: 10 }
        });
    }
}
window.Level_6 = Level_6;
