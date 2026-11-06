/**
 * Level_4 - Bot Level 4 (Stratège)
 * Depth 0 : L3 + centre, pions doublés, conversion de l'avantage, anti-répétition.
 * Configuration pure : toute la logique est dans LadderBot.js.
 */
class Level_4 extends LadderBot {
    static VERSION = '3.0.0';

    constructor() {
        super({
            name: "Bot Level 4 (Stratège)", level: 4, depth: 0, noise: 55,
            mateIn1: true, openingFilter: true, stalemateGuard: true, stalePieces: 12,
            conversion: true, repetition: true,
            replyLimit: 0, replyW: 0, kingAttackers: 0, mateThreat: false,
            w: { capture: 1, exposure: 1, promotion: 800, pawnAdvance: 3, centerSquare: 12, develop: 15, castle: 60, check: 30, centerControl: 8, doubledPawns: 20 }
        });
    }
}
window.Level_4 = Level_4;
