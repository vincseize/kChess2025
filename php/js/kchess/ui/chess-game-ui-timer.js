/**
 * ui/chess-game-ui-timer.js
 * Gère le décompte et l'application des incréments de temps.
 */
class ChessTimerManager {
    constructor(ui) {
        this.ui = ui;
        this.whiteTime = 600; // 10 minutes par défaut
        this.blackTime = 600;
        this.increment = 0;   // Secondes à ajouter par coup
        this.timerInterval = null;
        this.isTimerRunning = false;
    }

    /**
     * Reçoit la configuration (temps + incrément) du bot sélectionné
     */
    setTimerConfig(config) {
        if (!config) return;

        // Configuration du temps de base
        if (config.clock) {
            const baseSeconds = this.parseTimeString(config.clock);
            this.whiteTime = baseSeconds;
            this.blackTime = baseSeconds;
        }

        // Configuration de l'incrément
        if (config.increment !== undefined) {
            this.increment = parseInt(config.increment) || 0;
        }

        console.info(`⏱️ Timer Configuré : ${this.whiteTime}s | Incrément : +${this.increment}s`);
        this.updateTimerDisplay();
    }

    /**
     * Appelé par GameState.switchPlayer()
     */
    switchTurn(newColor) {
        // Le joueur qui vient de FINIR son coup (couleur opposée à newColor) reçoit l'incrément
        const previousPlayer = (newColor === 'white') ? 'black' : 'white';
        
        if (this.increment > 0) {
            if (previousPlayer === 'white') {
                this.whiteTime += this.increment;
            } else {
                this.blackTime += this.increment;
            }
            console.log(`➕ Incrément +${this.increment}s appliqué aux ${previousPlayer}`);
        }
        
        // On arrête le décompte en cours, on met à jour, et on relance pour le nouveau joueur
        this.stopTimer();
        this.updateTimerDisplay();

        if (this.ui.game.gameState.gameActive) {
            this.startTimer();
        }
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (!this.ui.game.gameState.gameActive) return;

        this.isTimerRunning = true;
        this.timerInterval = setInterval(() => {
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
                // Optionnel : notifier le GameStatusManager de la fin de partie par temps
                if (this.ui.game.gameStatusManager) {
                    this.ui.game.gameStatusManager.endGameByTime?.(winner);
                } else {
                    alert(`Temps écoulé ! Les ${winner === 'white' ? 'Blancs' : 'Noirs'} gagnent.`);
                }
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
        if (!timeStr) return 600;
        const parts = timeStr.split(':').map(Number);
        // Format HH:MM:SS
        if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
        // Format MM:SS
        if (parts.length === 2) return (parts[0] * 60) + parts[1];
        return parseInt(timeStr) || 600;
    }

    formatTime(seconds) {
        const mins = Math.floor(Math.max(0, seconds) / 60);
        const secs = Math.max(0, seconds) % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    resetTimers() {
        this.stopTimer();
        this.whiteTime = 600;
        this.blackTime = 600;
        this.updateTimerDisplay();
    }
}
window.ChessTimerManager = ChessTimerManager;