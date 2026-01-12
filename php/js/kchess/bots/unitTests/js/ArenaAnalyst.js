/**
 * js/ArenaAnalyst.js - Analyseur autonome amélioré
 * Écoute les événements de fin de partie et synchronise avec le serveur.
 * Gère désormais le cumul total des coups joués.
 */
class ArenaAnalyst {
    constructor() {
        this.resetCounters();
        this.initEventListeners();
        this.syncWithServer(); // Premier scan au chargement
    }

    initEventListeners() {
        // Écoute le signal de fin de partie envoyé par le moteur de stress test
        window.addEventListener('arena-game-finished', (e) => {
            const { winner, status, moves } = e.detail;
            this.addOneResult(winner, status, moves);
        });
    }

    async syncWithServer() {
        try {
            const response = await fetch('log_error.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'list_results' }) 
            });
            const games = await response.json();
            if (Array.isArray(games)) {
                this.resetCounters();
                games.forEach(game => this.parseGame(game));
                this.updateUI();
            }
        } catch (e) {
            console.error("ArenaAnalyst: Erreur synchro initiale", e);
        }
    }

    /**
     * Ajoute un résultat unique à la volée (pour mise à jour temps réel)
     */
    addOneResult(winner, status, moves) {
        this.parseGame({ winner, status, moves });
        this.updateUI();
    }

    /**
     * Analyse l'objet data d'une partie pour mettre à jour les compteurs
     */
    parseGame(game) {
        // 1. Normalisation des résultats de victoire
        const w = String(game.winner || '').toLowerCase();
        const s = String(game.status || '').toLowerCase();

        if (w === 'w' || w === 'white') {
            this.counters.white++;
        } else if (w === 'b' || w === 'black') {
            this.counters.black++;
        } else if (s.includes('draw') || s.includes('nulle') || s.includes('pat') || s.includes('stalemate')) {
            this.counters.draws++;
        }

        // 2. Cumul des coups (cherche 'moves' ou 'moveCount')
        let moveCount = parseInt(game.moves || game.moveCount || 0);
        if (!isNaN(moveCount)) {
            this.counters.totalMoves += moveCount;
        }
    }

    /**
     * Rafraîchit l'affichage du dashboard HTML
     */
    updateUI() {
        const elW = document.getElementById('dash-win-w');
        const elB = document.getElementById('dash-win-b');
        const elD = document.getElementById('dash-draws');
        const elM = document.getElementById('dash-moves');
        const elR = document.getElementById('dash-ratio');

        if (elW) elW.innerText = this.counters.white;
        if (elB) elB.innerText = this.counters.black;
        if (elD) elD.innerText = this.counters.draws;
        if (elM) elM.innerText = this.counters.totalMoves.toLocaleString(); // Formatage lisible (ex: 1 250)
        
        if (elR) {
            // Calcul du ratio de victoire Blancs / Noirs
            let ratio = this.counters.black === 0 ? this.counters.white : (this.counters.white / this.counters.black);
            elR.innerText = parseFloat(ratio).toFixed(2);
        }
    }

    /**
     * Remet à zéro les objets de données
     */
    resetCounters() {
        this.counters = { 
            white: 0, 
            black: 0, 
            draws: 0,
            totalMoves: 0 
        };
    }

    /**
     * Méthode publique pour réinitialiser complètement l'analyseur
     */
    reset() {
        this.resetCounters();
        this.updateUI();
    }
}

// Instance globale accessible depuis les autres scripts
window.arenaAnalyst = new ArenaAnalyst();