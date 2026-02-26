/**
 * js/kchess/bots/Level_1.js
 * Niveau 1 : Débutant - Coups aléatoires
 * Basé sur BotCore v2.0
 */
class Level_1 extends BotCore {
    static VERSION = '2.0.1';

    constructor() {
        super();
        this.name = "Bot Level 1 (Random)";
        this.level = 1;
    }

    async getMove() {
        try {
            const game = this.getGame();
            if (!game) return null;

            const color = game.gameState.currentPlayer;
            const myColor = color.toLowerCase().startsWith('w') ? 'white' : 'black';

            // getMoves est hérité de BotCore
            const allMoves = this.getMoves(game, myColor);

            if (!allMoves || allMoves.length === 0) return null;

            // Sélection aléatoire
            const selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];

            // Utilise le logger statique hérité de BotCore
            BotCore.log(`${this.name} joue : ${selectedMove.piece.type} vers [${selectedMove.toRow},${selectedMove.toCol}]`);

            // finalize est hérité de BotCore (gère la promotion Queen)
            return this.finalize(selectedMove);

        } catch (err) {
            BotCore.log("Erreur L1", err, 'error');
            return null;
        }
    }
}

// Enregistrement global
window.Level_1 = Level_1;