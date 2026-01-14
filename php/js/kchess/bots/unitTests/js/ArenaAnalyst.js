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
    // Éléments des compteurs classiques
    if (document.getElementById('dash-win-w')) document.getElementById('dash-win-w').innerText = this.counters.white;
    if (document.getElementById('dash-win-b')) document.getElementById('dash-win-b').innerText = this.counters.black;
    if (document.getElementById('dash-draws')) document.getElementById('dash-draws').innerText = this.counters.draws;
    if (document.getElementById('dash-moves')) document.getElementById('dash-moves').innerText = this.counters.totalMoves.toLocaleString();
    
    const totalGames = this.counters.white + this.counters.black + this.counters.draws;

    if (totalGames > 0) {
        const pW = ((this.counters.white / totalGames) * 100).toFixed(1);
        const pD = ((this.counters.draws / totalGames) * 100).toFixed(1);
        const pB = ((this.counters.black / totalGames) * 100).toFixed(1);

        // Mise à jour des badges externes
        const bW = document.getElementById('badge-w');
        const bB = document.getElementById('badge-b');
        if (bW) bW.innerText = pW + "%";
        if (bB) bB.innerText = pB + "%";

        // Mise à jour de la barre centrale animée
        const sW = document.getElementById('ratio-w');
        const sD = document.getElementById('ratio-d');
        const sB = document.getElementById('ratio-b');

        if (sW) sW.style.width = pW + "%";
        if (sB) sB.style.width = pB + "%";
        if (sD) {
            sD.style.width = pD + "%";
            sD.innerText = pD + "%"; // Pourcentage des nulles en jaune orangé
        }

        const elR = document.getElementById('dash-ratio');
        if (elR) elR.innerText = `${pW}% / ${pD}% / ${pB}%`;
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