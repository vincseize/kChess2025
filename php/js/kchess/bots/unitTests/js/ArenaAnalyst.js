/**
 * js/ArenaAnalyst.js
 */
class ArenaAnalyst {
    constructor() {
        this.resetCounters();
        this.initEventListeners();
        this.syncWithServer();
    }

    resetCounters() {
        this.counters = { 
            white: 0, 
            black: 0, 
            draws: 0,
            totalMoves: 0 
        };
    }

    initEventListeners() {
        window.addEventListener('arena-game-finished', (e) => {
            const { winner, status, moves, pWhite, pBlack } = e.detail;
            
            // On utilise directement addOneResult qui centralise la logique
            this.addOneResult(winner, status, moves);
        });
    }

    /**
     * Ajoute un résultat unique et rafraîchit l'UI
     */
    addOneResult(winner, status, moves) {
        // On normalise les données pour parseGame
        this.parseGame({ winner, status, moves });
        this.updateUI();
    }

    /**
     * Analyse l'objet data d'une partie pour mettre à jour les compteurs
     */
    parseGame(game) {
        // Normalisation : on gère le fait que game.winner peut être une chaîne ou un objet
        const w = String(game.winner || '').toLowerCase();
        const s = String(game.status || '').toLowerCase();

        // 1. Détection du vainqueur (Correction de la logique de filtrage)
        if (w === 'white' || w === 'w') {
            this.counters.white++;
        } else if (w === 'black' || w === 'b') {
            this.counters.black++;
        } else if (w === 'draw' || w === 'nulle' || s.includes('nulle') || s.includes('draw') || s.includes('pat')) {
            this.counters.draws++;
        }

        // 2. Cumul des coups
        let moveCount = parseInt(game.moves || game.moveCount || 0);
        if (!isNaN(moveCount)) {
            this.counters.totalMoves += moveCount;
        }
    }

    updateUI() {
        const elW = document.getElementById('dash-win-w');
        const elB = document.getElementById('dash-win-b');
        const elD = document.getElementById('dash-draws');
        const elM = document.getElementById('dash-moves');
        const elR = document.getElementById('dash-ratio');

        if (elW) elW.innerText = this.counters.white;
        if (elB) elB.innerText = this.counters.black;
        if (elD) elD.innerText = this.counters.draws;
        if (elM) elM.innerText = this.counters.totalMoves.toLocaleString();
        
        if (elR) {
            let totalWins = this.counters.white + this.counters.black;
            if (this.counters.black === 0) {
                elR.innerText = this.counters.white > 0 ? "100% W" : "0.00";
            } else {
                let ratio = (this.counters.white / this.counters.black);
                elR.innerText = parseFloat(ratio).toFixed(2);
            }
        }
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
        } catch (e) { console.error("ArenaAnalyst Sync Error:", e); }
    }

    reset() {
        this.resetCounters();
        this.updateUI();
    }
}

window.arenaAnalyst = new ArenaAnalyst();