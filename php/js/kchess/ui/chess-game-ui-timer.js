/**
 * ui/chess-game-ui-timer.js
 * Gère le décompte et l'application des incréments de temps.
 *
 * v1.1.0 :
 *   - Flag `enabled` pour désactiver le timer (mode arène / stress test)
 *   - Méthodes `disable()` / `enable()`
 *   - `switchTurn()` et `startTimer()` court-circuités si désactivé
 */
class ChessTimerManager {
    constructor(ui) {
        this.ui = ui;
        this.whiteTime = 600; // 10 minutes par défaut
        this.blackTime = 600;
        this.increment = 0;   // Secondes à ajouter par coup
        this.initialTime = 600;
        this.timerInterval = null;
        this.isTimerRunning = false;
        this.enabled = true;  // ← NOUVEAU : flag global d'activation

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

    /**
     * Reçoit la configuration (temps + incrément) du bot sélectionné
     */
    setTimerConfig(config) {
        if (!config) return;

        // Configuration du temps de base
        if (config.clock) {
            const baseSeconds = this.parseTimeString(config.clock);
            this.initialTime = baseSeconds;
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
     * Active le timer (mode humain / bot normal).
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Désactive complètement le timer (mode arène / stress test).
     * Aucun setInterval ne sera lancé, aucune modale "temps écoulé" ne s'affichera.
     */
    disable() {
        this.enabled = false;
        this.stopTimer();
    }

    /**
     * Appelé par GameState.switchPlayer()
     */
    switchTurn(newColor) {
        // ← NOUVEAU : court-circuit si le timer est désactivé
        if (!this.enabled) {
            this.updateTimerDisplay();
            return;
        }

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
        if (!this.enabled) return;                    // ← NOUVEAU
        if (!this.ui.game.gameState.gameActive) return;
        if (this.isTimerRunning) return;

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
                const loser = this.whiteTime <= 0 ? 'white' : 'black';
                this.ui.game.gameState.gameActive = false;
                this.updateTimerDisplay();
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
        this.whiteTime = this.initialTime;
        this.blackTime = this.initialTime;
        this.updateTimerDisplay();
    }
}
window.ChessTimerManager = ChessTimerManager;