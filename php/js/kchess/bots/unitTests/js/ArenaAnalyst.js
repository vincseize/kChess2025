/**
 * js/ArenaAnalyst.js
 * Gère les statistiques de l'arène et la synchronisation avec le serveur.
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
            const { winner, status, moves } = e.detail;
            // On centralise l'ajout du résultat et le rafraîchissement UI
            this.addOneResult(winner, status, moves);
        });
    }

    /**
     * Ajoute un résultat unique et rafraîchit l'UI
     */
    addOneResult(winner, status, moves) {
        this.parseGame({ winner, status, moves });
        this.updateUI();
    }

    /**
     * Analyse l'objet data d'une partie pour mettre à jour les compteurs
     */
    parseGame(game) {
        // Normalisation des chaînes
        const w = String(game.winner || '').toLowerCase();
        const s = String(game.status || '').toLowerCase();

        // 1. Détection du vainqueur
        if (w === 'white' || w === 'w') {
            this.counters.white++;
        } else if (w === 'black' || w === 'b') {
            this.counters.black++;
        } else if (w === 'draw' || w === 'nulle' || s.includes('draw') || s.includes('nulle') || s.includes('pat')) {
            this.counters.draws++;
        }

        // 2. Cumul des coups
        let moveCount = parseInt(game.moves || game.moveCount || 0);
        if (!isNaN(moveCount)) {
            this.counters.totalMoves += moveCount;
        }
    }

    updateUI() {
        // --- 1. Mise à jour des compteurs textuels ---
        const elWinW = document.getElementById('dash-win-w');
        const elWinB = document.getElementById('dash-win-b');
        const elDraws = document.getElementById('dash-draws');
        const elMoves = document.getElementById('dash-moves');

        if (elWinW) elWinW.innerText = this.counters.white;
        if (elWinB) elWinB.innerText = this.counters.black;
        if (elDraws) elDraws.innerText = this.counters.draws;
        if (elMoves) elMoves.innerText = this.counters.totalMoves.toLocaleString();
        
        const totalGames = this.counters.white + this.counters.black + this.counters.draws;
        const totalDecisive = this.counters.white + this.counters.black;

        if (totalGames > 0) {
            // --- 2. Calcul du Win Ratio Global (W / D / B) ---
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
            const sDText = document.getElementById('ratio-d-text');
            const sB = document.getElementById('ratio-b');

            if (sW) sW.style.width = pW + "%";
            if (sB) sB.style.width = pB + "%";
            
            if (sD) {
                sD.style.width = pD + "%";
                if (sDText) sDText.innerText = pD + "%";

                // Gestion de la visibilité des indicateurs W / B dans la zone nulle
                const pDNum = parseFloat(pD);
                sD.style.justifyContent = (pDNum < 15) ? 'center' : 'space-between';
                
                // On cache les indicateurs "W" et "B" si la zone est trop étroite
                const indicators = sD.querySelectorAll('span:not(#ratio-d-text)');
                indicators.forEach(span => {
                    span.style.display = (pDNum < 15) ? 'none' : 'block';
                });
            }

            // Cache pour la fonction de copie
            const elR = document.getElementById('dash-ratio');
            if (elR) elR.innerText = `${pW}% / ${pD}% / ${pB}%`;

            // --- 3. Calcul du Ratio Pur (W vs B uniquement) ---
            const elPure = document.getElementById('dash-pure-ratio');
            if (elPure) {
                if (totalDecisive > 0) {
                    const pureW = Math.round((this.counters.white / totalDecisive) * 100);
                    const pureB = Math.round((this.counters.black / totalDecisive) * 100);
                    elPure.innerText = `${pureW}% / ${pureB}%`;
                } else {
                    elPure.innerText = "-- / --";
                }
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
        } catch (e) { 
            console.error("ArenaAnalyst Sync Error:", e); 
        }
    }

    reset() {
        this.resetCounters();
        this.updateUI();
    }
}

// Initialisation globale
window.arenaAnalyst = new ArenaAnalyst();