/**
 * js/Level_1.js
 * Niveau 1 : Débutant - Joue des coups totalement aléatoires.
 */
class Level_1 extends BotBase {
    // Profondeur de recherche réelle (lue par newGame.php pour l'affichage)
    static SEARCH_DEPTH = 0;

    constructor() {
        super();
        this.name = "Bot Level 1";
    }

    /**
     * Process du niveau (étape 1 : configuration descriptive, le code ne lit pas encore les on/off).
     * Lu par Bot_Process.php (matrice / diagrammes).
     */
    get PROCESS_CONFIG() {
        return { coup_aleatoire: true };
    }

    get PIPELINE() { return Object.keys(this.PROCESS_CONFIG); }

    /**
     * Retourne un coup aléatoire parmi les coups légaux
     */
    async getMove() {
        const game = this.getGame();
        if (!game) return { error: 'engine_not_found' };

        // 1. Récupérer la couleur du joueur actuel
        const color = game.gameState.currentPlayer;

        // 2. Utiliser BotBase pour lister tous les coups légaux
        const allMoves = this.getMoves(game, color);

        // 3. Sécurité si plus de coups possibles (mat ou pat)
        if (allMoves.length === 0) return null;

        // 4. Sélectionner un coup au hasard
        const randomIndex = Math.floor(Math.random() * allMoves.length);
        const selectedMove = allMoves[randomIndex];

        // 5. Finaliser (gestion automatique de la promotion en Dame)
        return this.finalize(selectedMove);
    }
}

// Enregistrement global pour l'Arène et l'UI
window.Level_1 = Level_1;