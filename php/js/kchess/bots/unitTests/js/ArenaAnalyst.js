/**
 * js/ArenaAnalyst.js
 * Correction : Support des rapports globaux et affichage du Ratio Pur
 */
class ArenaAnalyst {
    constructor() {
        this.resetCounters();
        this.initEventListeners();
        this.syncWithServer();
    }

    resetCounters() {
        this.counters = { white: 0, black: 0, draws: 0, totalMoves: 0 };
    }

    initEventListeners() {
        window.addEventListener('arena-game-finished', (e) => {
            this.addOneResult(e.detail);
        });
    }

    addOneResult(data) {
        this.parseGame(data);
        this.updateUI();
    }

    parseGame(data) {
        if (!data) return;

        // Gestion du format "Rapport Global" (Stress Test JSON)
        if (data.gamesPlayed !== undefined) {
            this.counters.draws += (data.draws || 0);
            this.counters.totalMoves += (data.totalMoves || 0);
            if (data.checkmatesWhite !== undefined) {
                this.counters.white += data.checkmatesWhite;
                this.counters.black += data.checkmatesBlack;
            }
            return;
        }

        // Gestion du format "Individuel"
        const w = String(data.winner || '').toLowerCase();

        if (w === 'white' || w === 'w') {
            this.counters.white++;
        } else if (w === 'black' || w === 'b') {
            this.counters.black++;
        } else {
            this.counters.draws++;
        }

        let moveCount = parseInt(data.moves || data.moveCount || data.totalMoves || 0);
        if (!isNaN(moveCount)) this.counters.totalMoves += moveCount;
    }

    updateUI() {
        const total = this.counters.white + this.counters.black + this.counters.draws;
        
        // Update labels basiques
        this._setTxt('dash-win-w', this.counters.white);
        this._setTxt('dash-win-b', this.counters.black);
        this._setTxt('dash-draws', this.counters.draws);
        this._setTxt('dash-moves', this.counters.totalMoves.toLocaleString());
        this._setTxt('count', total);

        if (total > 0) {
            // 1. Calcul Ratio Global (incluant les nulles)
            const pW = ((this.counters.white / total) * 100).toFixed(1);
            const pD = ((this.counters.draws / total) * 100).toFixed(1);
            const pB = ((this.counters.black / total) * 100).toFixed(1);

            // Mise à jour visuelle des barres
            this._styleWidth('ratio-w', pW + "%");
            this._styleWidth('ratio-d', pD + "%");
            this._styleWidth('ratio-b', pB + "%");

            // Mise à jour des badges texte
            this._setTxt('badge-w', pW + "%");
            this._setTxt('badge-b', pB + "%");
            this._setTxt('ratio-d-text', pD + "%");

            // 2. Calcul Ratio Pur (Uniquement Blancs vs Noirs)
            const decisive = this.counters.white + this.counters.black;
            if (decisive > 0) {
                const pureW = Math.round((this.counters.white / decisive) * 100);
                const pureB = Math.round((this.counters.black / decisive) * 100);
                this._setTxt('dash-pure-ratio', `${pureW}% / ${pureB}%`);
            } else {
                this._setTxt('dash-pure-ratio', `0% / 0%`);
            }
        } else {
            this._setTxt('dash-pure-ratio', `0% / 0%`);
        }
    }

    _setTxt(id, val) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }

    _styleWidth(id, val) {
        const el = document.getElementById(id);
        if (el) el.style.width = val;
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
                games.forEach(g => this.parseGame(g));
                this.updateUI();
            }
        } catch (e) { 
            console.error("Sync Error", e); 
        }
    }

    reset() {
        this.resetCounters();
        this.updateUI();
    }
}

// Initialisation globale
window.arenaAnalyst = new ArenaAnalyst();