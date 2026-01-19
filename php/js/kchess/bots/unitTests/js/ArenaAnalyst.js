/**
 * js/ArenaAnalyst.js
 * Correction : Support des rapports globaux et rafraîchissement UI forcé
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
            // On déduit les victoires si elles ne sont pas explicites
            // Ou on utilise tes clés spécifiques si ton script PHP les renvoie
            if (data.checkmatesWhite !== undefined) {
                this.counters.white += data.checkmatesWhite;
                this.counters.black += data.checkmatesBlack;
            }
            return;
        }

        // Gestion du format "Individuel"
        const w = String(data.winner || '').toLowerCase();
        const s = String(data.status || '').toLowerCase();

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
        
        // Update labels
        this._setTxt('dash-win-w', this.counters.white);
        this._setTxt('dash-win-b', this.counters.black);
        this._setTxt('dash-draws', this.counters.draws);
        this._setTxt('dash-moves', this.counters.totalMoves.toLocaleString());
        this._setTxt('count', total);

        if (total > 0) {
            const pW = ((this.counters.white / total) * 100).toFixed(1);
            const pD = ((this.counters.draws / total) * 100).toFixed(1);
            const pB = ((this.counters.black / total) * 100).toFixed(1);

            // Update Bars
            this._styleWidth('ratio-w', pW + "%");
            this._styleWidth('ratio-d', pD + "%");
            this._styleWidth('ratio-b', pB + "%");

            // Update Badges
            this._setTxt('badge-w', pW + "%");
            this._setTxt('badge-b', pB + "%");
            this._setTxt('ratio-d-text', pD + "%");

            // Ratio Pur (W/B)
            const decisive = this.counters.white + this.counters.black;
            if (decisive > 0) {
                const pureW = Math.round((this.counters.white / decisive) * 100);
                const pureB = Math.round((this.counters.black / decisive) * 100);
                this._setTxt('dash-pure-ratio', `${pureW}% / ${pureB}%`);
            }
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
        } catch (e) { console.error("Sync Error", e); }
    }

    reset() {
        this.resetCounters();
        this.updateUI();
    }
}
window.arenaAnalyst = new ArenaAnalyst();