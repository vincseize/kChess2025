/**
 * js/Level_1.js
 * Niveau 1 : Débutant - Joue des coups totalement aléatoires.
 * Mise à jour : Version unifiée avec système de log statique.
 */
class Level_1 extends BotBase {
    static VERSION = '1.1.0';
    static consoleLog = false;

    constructor() {
        super();
        this.name = "Bot Level 1 (Random)";
        this.level = 1;
        // Initialisation de la config au cas où
        this.constructor.loadConfig();
    }

    /**
     * Système de log statique unifié
     */
    static log(message, data = null, type = 'info') {
        if (!this.consoleLog && type === 'info') return;
        const icons = { info: '🤖', success: '✅', error: '❌', warn: '⚠️' };
        console.log(`${icons[type] || '⚪'} [${this.name}] ${message}`);
        if (data && this.consoleLog) console.dir(data);
    }

    /**
     * Charge la configuration de débug
     */
    static loadConfig() {
        try {
            const config = window.appConfig?.debug?.console_log;
            this.consoleLog = (config === true || config === "true");
        } catch (e) { this.consoleLog = false; }
    }

    /**
     * Retourne un coup aléatoire parmi les coups légaux
     */
    async getMove() {
        try {
            const game = this.getGame();
            if (!game) return { error: 'engine_not_found' };

            // 1. Récupérer la couleur du joueur actuel
            const color = game.gameState.currentPlayer;
            const myColor = color.toLowerCase().startsWith('w') ? 'white' : 'black';

            // 2. Utiliser BotBase pour lister tous les coups légaux
            const allMoves = this.getMoves(game, myColor);

            // 3. Sécurité si plus de coups possibles (mat ou pat)
            if (!allMoves || allMoves.length === 0) return null;

            // 4. Sélectionner un coup au hasard
            const randomIndex = Math.floor(Math.random() * allMoves.length);
            const selectedMove = allMoves[randomIndex];

            // 5. Log de réflexion (ne plante plus car la méthode statique existe)
            this.constructor.log(`Choix aléatoire parmi ${allMoves.length} possibilités`, selectedMove);

            // 6. Finaliser (gestion automatique de la promotion en Dame via BotBase)
            return this.finalize(selectedMove);

        } catch (err) {
            this.constructor.log("Erreur L1", err, 'error');
            return null;
        }
    }
}

// Enregistrement global pour l'Arène et l'UI
window.Level_1 = Level_1;