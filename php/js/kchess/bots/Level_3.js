/**
 * Level_3 - Bot Level 3 (Tactique)
 * Depth 0 : échange statique, exposition, développement. Ne regarde pas la réponse adverse.
 * Configuration pure : toute la logique est dans LadderBot.js.
 */
class Level_3 extends LadderBot {
    static VERSION = '3.0.0';

    constructor() {
        super({
            name: "Bot Level 3 (Tactique)", level: 3, depth: 0, noise: 110,
            mateIn1: true, openingFilter: true, stalemateGuard: true, stalePieces: 12,
            conversion: false, repetition: false,
            replyLimit: 0, replyW: 0, kingAttackers: 0, mateThreat: false,
            w: { capture: 1, exposure: 1, promotion: 800, pawnAdvance: 3, centerSquare: 12, develop: 15, castle: 60, check: 30 }
        });
    }
}
window.Level_3 = Level_3;
