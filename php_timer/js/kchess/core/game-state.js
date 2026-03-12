class GameState {
    constructor() {
        this.currentPlayer = 'white';
        this.gameActive = true;
        this.moveHistory = [];
        this.fullMoveNumber = 1;
    }

    /**
     * @param {Object} moveData - Données du coup {fR, fC, tR, tC, piece}
     */
    switchPlayer(moveData = null) {
        // 1. Priorité : Enregistrement et Affichage de l'historique
        if (moveData) {
            this.addMoveToHistory(moveData);
        }

        // 2. Mise à jour du Timer
        if (window.TimerLogic && this.gameActive) {
            window.TimerLogic.switchTurn();
        }

        // 3. Bascule du tour
        this.currentPlayer = (this.currentPlayer === 'white') ? 'black' : 'white';
        if (this.currentPlayer === 'white') this.fullMoveNumber++;
        
        // Mise à jour visuelle du bandeau de tour
        const label = document.getElementById('currentPlayer');
        if (label) {
            label.innerText = `TRAIT AUX ${this.currentPlayer === 'white' ? 'BLANCS' : 'NOIRS'}`;
        }
    }

    addMoveToHistory(move) {
        this.moveHistory.push(move);
        const historyEl = document.getElementById('moveHistory');
        if (historyEl) {
            const row = document.createElement('div');
            row.className = "move-row d-flex justify-content-between border-bottom py-1 px-2";
            row.style.fontSize = "0.85rem";
            row.style.fontFamily = "monospace";

            // Conversion coordonnées (0,0) -> a8
            const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
            const from = files[move.fC] + (8 - move.fR);
            const to = files[move.tC] + (8 - move.tR);
            
            const num = this.currentPlayer === 'white' ? `${this.fullMoveNumber}.` : "";
            row.innerHTML = `<span class="text-muted">${num}</span> <strong>${from} ➔ ${to}</strong>`;
            
            historyEl.appendChild(row);
            historyEl.scrollTop = historyEl.scrollHeight;
        }
    }

    reset() {
        this.currentPlayer = 'white';
        this.gameActive = true;
        this.moveHistory = [];
        this.fullMoveNumber = 1;
        const hist = document.getElementById('moveHistory');
        if (hist) hist.innerHTML = "";
        if (window.TimerLogic) window.TimerLogic.stop();
    }
}
window.GameState = GameState;