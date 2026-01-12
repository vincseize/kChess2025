/**
 * js/ArenaAnalyst.js - Analyseur autonome
 * Écoute les événements de fin de partie et synchronise avec le serveur.
 */
class ArenaAnalyst {
    constructor() {
        this.counters = { white: 0, black: 0, draws: 0 };
        this.initEventListeners();
        this.syncWithServer(); // Premier scan au chargement
    }

    initEventListeners() {
        // Cette ligne rend l'analyste autonome : il attend un signal
        window.addEventListener('arena-game-finished', (e) => {
            const { winner, status } = e.detail;
            this.addOneResult(winner, status);
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

    addOneResult(winner, status) {
        this.parseGame({ winner, status });
        this.updateUI();
    }

    parseGame(game) {
        // Normalisation des résultats
        const w = String(game.winner).toLowerCase();
        const s = String(game.status).toLowerCase();

        if (w === 'w' || w === 'white') {
            this.counters.white++;
        } else if (w === 'b' || w === 'black') {
            this.counters.black++;
        } else if (s.includes('draw') || s.includes('nulle') || s.includes('pat') || s.includes('stalemate')) {
            this.counters.draws++;
        }
    }

    updateUI() {
        const elW = document.getElementById('dash-win-w');
        const elB = document.getElementById('dash-win-b');
        const elD = document.getElementById('dash-draws');
        const elR = document.getElementById('dash-ratio');

        if (elW) elW.innerText = this.counters.white;
        if (elB) elB.innerText = this.counters.black;
        if (elD) elD.innerText = this.counters.draws;
        
        if (elR) {
            let ratio = this.counters.black === 0 ? this.counters.white : (this.counters.white / this.counters.black);
            elR.innerText = parseFloat(ratio).toFixed(2);
        }
    }

    resetCounters() {
        this.counters = { white: 0, black: 0, draws: 0 };
    }

    reset() {
        this.resetCounters();
        this.updateUI();
    }
}

// Instance globale
window.arenaAnalyst = new ArenaAnalyst();