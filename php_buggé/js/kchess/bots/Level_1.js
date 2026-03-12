/**
 * js/kchess/bots/Level_1.js
 * Niveau 1 : Débutant - Coups aléatoires
 * Version 3.0.0 - Refactorisée sur BotCore
 */
class Level_1 extends BotCore {
    static VERSION = '3.0.0';

    constructor() {
        super();
        this.name = "Bot Level 1 (Random)";
        this.level = 1;
    }

    /**
     * Méthode principale de réflexion du bot
     */
    async getMove() {
        try {
            // 1. Récupération de l'instance du jeu via BotCore
            const game = this.getGame();
            if (!game) return null;

            // 2. Identification de la couleur
            const color = game.gameState.currentPlayer;
            const myColor = color.toLowerCase().startsWith('w') ? 'white' : 'black';

            // 3. Récupération de tous les coups légaux via la méthode héritée de BotCore
            const allMoves = this.getMoves(game, myColor);

            if (!allMoves || allMoves.length === 0) {
                BotCore.log(`${this.name} : Aucun coup possible (Pat ou Mat)`);
                return null;
            }

            // 4. Sélection purement aléatoire (Logique spécifique au Level 1)
            const selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];

            // 5. Logging via le système centralisé
            BotCore.log(`${this.name} joue : ${selectedMove.piece.type} vers [${selectedMove.toRow},${selectedMove.toCol}]`);

            // 6. Retourne le coup formaté via finalize (gère automatiquement les promotions en Reine)
            return this.finalize(selectedMove);

        } catch (err) {
            // Utilise le logger d'erreur de BotCore
            BotCore.log("Erreur critique dans Level_1", err, 'error');
            return null;
        }
    }
}

// Enregistrement dans le scope global pour être accessible par le BotManager
window.Level_1 = Level_1;