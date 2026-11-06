/**
 * Level_5 - Bot Level 5 (Pro)
 * Depth 1 : L4 + meilleure réponse adverse (8 captures/échecs), sécurité du roi, menace de mat en 1.
 * Configuration pure : toute la logique est dans LadderBot.js.
 */
class Level_5 extends LadderBot {
    static VERSION = '3.0.0';

    constructor() {
        super({
            name: "Bot Level 5 (Pro)", level: 5, depth: 1, noise: 130,
            mateIn1: true, openingFilter: true, stalemateGuard: true, stalePieces: 12,
            conversion: true, repetition: true,
            replyLimit: 8, replyW: 1, kingAttackers: 60, mateThreat: true,
            w: { capture: 1, exposure: 1, promotion: 800, pawnAdvance: 3, centerSquare: 12, develop: 15, castle: 60, check: 30, centerControl: 8, doubledPawns: 20 }
        });
    }
}
window.Level_5 = Level_5;
