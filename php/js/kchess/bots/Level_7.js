/**
 * Level_7 - Bot Level 7 (Structure)
 * Depth 1 : L6 + pions liés, tours doublées, fourchettes de cavalier.
 * Configuration pure : toute la logique est dans LadderBot.js.
 */
class Level_7 extends LadderBot {
    static VERSION = '3.0.0';

    constructor() {
        super({
            name: "Bot Level 7 (Structure)", level: 7, depth: 1, noise: 50,
            mateIn1: true, openingFilter: true, stalemateGuard: true, stalePieces: 12,
            conversion: true, repetition: true,
            replyLimit: 16, replyW: 1, kingAttackers: 60, mateThreat: true,
            w: { capture: 1, exposure: 1, promotion: 800, pawnAdvance: 3, centerSquare: 12, develop: 15, castle: 60, check: 30, centerControl: 8, doubledPawns: 20, majorFile: 10, connected: 15, doubledRooks: 25, fork: 1 }
        });
    }
}
window.Level_7 = Level_7;
