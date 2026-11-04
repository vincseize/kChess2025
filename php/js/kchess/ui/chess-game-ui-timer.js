/**
 * ui/chess-game-ui-timer.js
 * v1.2.1 : garde-fou supplémentaire dans setInterval
 */
class ChessTimerManager {
    static globallyDisabled = false;

    constructor(ui) {
        this.ui = ui;
        this.whiteTime = 600;
        this.blackTime = 600;
        this.increment = 0;
        this.initialTime = 600;
        this.timerInterval = null;
        this.isTimerRunning = false;
        this.enabled = !ChessTimerManager.globallyDisabled;

        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'bot') {
            const levelMinutes = Number(params.get('level'));
            if (Number.isInteger(levelMinutes) && levelMinutes > 0) {
                this.setTimerConfig({ clock: `${levelMinutes}:00`, increment: '0' });
            }
        }

        const gameTimeControl = document.getElementById('gameTimeControl');
        if (params.get('mode') === 'human' && gameTimeControl) {
            const [minutes, increment] = gameTimeControl.value.split(':').map(Number);
            this.setTimerConfig({ clock: `${minutes}:00`, increment: String(increment) });
        }
    }

    setTimerConfig(config) {
        if (!config) return;

        if (config.clock) {
            const baseSeconds = this.parseTimeString(config.clock);
            this.initialTime = baseSeconds;
            this.whiteTime = baseSeconds;
            this.blackTime = baseSeconds;
        }

        if (config.increment !== undefined) {
            this.increment = parseInt(config.increment) || 0;
        }

        console.info(`⏱️ Timer Configuré : ${this.whiteTime}s | Incrément : +${this.increment}s`);
        this.updateTimerDisplay();
    }

    enable() {
        this.enabled = true;
        ChessTimerManager.globallyDisabled = false;
    }

    disable() {
        this.enabled = false;
        this.stopTimer();
        ChessTimerManager.globallyDisabled = true;
    }

    switchTurn(newColor) {
        if (!this.enabled || ChessTimerManager.globallyDisabled) {
            this.updateTimerDisplay();
            return;
        }

        const previousPlayer = (newColor === 'white') ? 'black' : 'white';

        if (this.increment > 0) {
            if (previousPlayer === 'white') {
                this.whiteTime += this.increment;
            } else {
                this.blackTime += this.increment;
            }
            console.log(`➕ Incrément +${this.increment}s appliqué aux ${previousPlayer}`);
        }

        this.stopTimer();
        this.updateTimerDisplay();

        if (this.ui.game.gameState.gameActive) {
            this.startTimer();
        }
    }

    startTimer() {
        if (!this.enabled) return;
        if (ChessTimerManager.globallyDisabled) return;
        if (!this.ui.game.gameState.gameActive) return;
        if (this.isTimerRunning) return;

        this.isTimerRunning = true;
        this.timerInterval = setInterval(() => {
            // ★ v1.2.1 : garde-fou supplémentaire dans la boucle
            if (ChessTimerManager.globallyDisabled) {
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
                const loser = this.whiteTime <= 0 ? 'white' : 'black';
                this.ui.game.gameState.gameActive = false;
                this.updateTimerDisplay();
                // ★ Appel masqué par ChessModalManager.showTimeLoss qui vérifie globallyDisabled
                this.ui.modalManager?.showTimeLoss?.(loser);
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
        const colors = window.appConfig?.colors || {};
        const whiteColor = colors.clock_white || '#FFFFFF';
        const blackColor = colors.clock_black || colors.primary || '#0891B2';
        const expiredColor = colors.clock_expired || '#ff0000';

        if (whiteEl) {
            whiteEl.textContent = this.formatTime(this.whiteTime);
            whiteEl.style.fontWeight = (currentPlayer === 'white') ? 'bold' : 'normal';
            if (this.whiteTime <= 0) whiteEl.style.setProperty('color', expiredColor, 'important');
            else whiteEl.style.setProperty('color', whiteColor, 'important');
        }

        if (blackEl) {
            blackEl.textContent = this.formatTime(this.blackTime);
            blackEl.style.fontWeight = (currentPlayer === 'black') ? 'bold' : 'normal';
            if (this.blackTime <= 0) blackEl.style.setProperty('color', expiredColor, 'important');
            else blackEl.style.setProperty('color', blackColor, 'important');
        }
    }

    parseTimeString(timeStr) {
        if (!timeStr) return 600;
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
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
        this.whiteTime = this.initialTime;
        this.blackTime = this.initialTime;
        this.updateTimerDisplay();
    }
}
window.ChessTimerManager = ChessTimerManager;