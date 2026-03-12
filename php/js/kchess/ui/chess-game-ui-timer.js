// ui/chess-game-ui-timer.js - Version avec Incrément Automatique et Décompte

class ChessTimerManager {
    
    static consoleLog = false; 
    
    static init() {
        this.forceSilentMode();
        console.info('⏱️ ChessTimerManager: Système d\'incrément actif');
    }
    
    static loadConfig() {
        this.consoleLog = false;
        return true;
    }
    
    static forceSilentMode() {
        this.consoleLog = false;
    }

    constructor(ui) {
        ChessTimerManager.consoleLog = false;
        this.ui = ui;
        this.whiteTime = 600; 
        this.blackTime = 600;
        this.increment = 0;   
        
        this.timerInterval = null;
        this.isTimerRunning = false;
    }

    /**
     * Configure le timer via le JSON du bot
     */
    setTimerConfig(config) {
        if (!config) return;

        if (config.clock) {
            const baseTime = this.parseTimeString(config.clock);
            this.whiteTime = baseTime;
            this.blackTime = baseTime;
        }

        if (config.increment !== undefined) {
            const inc = config.increment;
            if (typeof inc === 'string' && inc.includes(':')) {
                this.increment = this.parseTimeString(inc);
            } else {
                this.increment = parseInt(inc) || 0;
            }
        }

        this.updateTimerDisplay();
        console.log(`⏱️ Config : ${this.whiteTime}s | Incrément : +${this.increment}s`);
    }

    /**
     * Gère le changement de tour ET ajoute l'incrément
     * @param {string} newColor - La couleur du joueur qui va commencer son tour
     */
    switchTurn(newColor) {
        // L'incrément s'ajoute au joueur qui VIENT de finir son coup
        const playerWhoJustFinished = (newColor === 'white') ? 'black' : 'white';
        
        // On n'ajoute l'incrément que si le timer tourne déjà (pour éviter le bonus au coup 0)
        if (this.isTimerRunning) {
            if (playerWhoJustFinished === 'white') {
                this.whiteTime += this.increment;
            } else {
                this.blackTime += this.increment;
            }
        }
        
        // Rafraîchir l'affichage (le gras change et le temps augmente visuellement)
        this.updateTimerDisplay();
    }

    startTimer() {
        if (this.timerInterval) this.stopTimer();
        if (!this.ui.game.gameState.gameActive) return;
        
        this.isTimerRunning = true;
        this.timerInterval = setInterval(() => {
            if (!this.ui.game.gameState.gameActive) {
                this.stopTimer();
                return;
            }
            
            const currentPlayer = this.ui.game.gameState.currentPlayer;
            
            if (currentPlayer === 'white') {
                if (this.whiteTime > 0) this.whiteTime--;
            } else {
                if (this.blackTime > 0) this.blackTime--;
            }
            
            this.updateTimerDisplay();

            if (this.whiteTime <= 0 || this.blackTime <= 0) {
                this.stopTimer();
                const winner = this.whiteTime <= 0 ? 'black' : 'white';
                this.ui.game.gameStatusManager?.endGameByTime(winner);
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isTimerRunning = false;
    }

    updateTimerDisplay() {
        const whiteEl = document.getElementById('whiteTime');
        const blackEl = document.getElementById('blackTime');
        const currentPlayer = this.ui.game.gameState.currentPlayer;
        
        if (whiteEl) {
            whiteEl.textContent = this.formatTime(this.whiteTime);
            whiteEl.style.fontWeight = (currentPlayer === 'white') ? 'bold' : 'normal';
            whiteEl.style.color = (currentPlayer === 'white') ? '#28a745' : '';
        }
        
        if (blackEl) {
            blackEl.textContent = this.formatTime(this.blackTime);
            blackEl.style.fontWeight = (currentPlayer === 'black') ? 'bold' : 'normal';
            blackEl.style.color = (currentPlayer === 'black') ? '#28a745' : '';
        }
    }

    parseTimeString(timeStr) {
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
        if (parts.length === 2) return (parts[0] * 60) + parts[1];
        return parseInt(timeStr) || 0;
    }

    formatTime(seconds) {
        if (seconds < 0) seconds = 0;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    resetTimers() {
        this.stopTimer();
        this.whiteTime = 600;
        this.blackTime = 600;
        this.increment = 0;
        this.updateTimerDisplay();
    }
}

ChessTimerManager.init();
window.ChessTimerManager = ChessTimerManager;