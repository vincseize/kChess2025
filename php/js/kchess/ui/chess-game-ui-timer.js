// ui/chess-game-ui-timer.js

class ChessTimerManager {
    // Configuration de débogage locale (Priorité absolue si true)
    static LOCAL_DEBUG = false; 
    static MODULE_KEY = 'timer'; 

    constructor(ui) {
        this.ui = ui;
        
        // Initialisation de la permission de log
        this.canLog = AppLogManager.shouldLog(ChessTimerManager.MODULE_KEY, ChessTimerManager.LOCAL_DEBUG);

        this.whiteTime = 0;
        this.blackTime = 0;
        this.timerInterval = null;
        this.isTimerRunning = false;

        AppLogManager.log(this.canLog, '⏱️', 'Timer', 'Initialisé');
    }

    startTimer() {
        if (this.timerInterval) this.stopTimer();
        
        // Vérification du statut du jeu
        if (this.ui.game.gameState?.gameActive === false) {
            AppLogManager.log(this.canLog, '⚠️', 'Timer', 'Démarrage ignoré (jeu inactif)');
            return;
        }

        AppLogManager.log(this.canLog, '▶️', 'Timer', 'Démarrage');
        this.isTimerRunning = true;
        
        this.timerInterval = setInterval(() => {
            if (this.ui.game.gameState?.gameActive === false) {
                this.stopTimer();
                return;
            }
            
            const turn = this.ui.game.gameState?.currentPlayer || 'white';
            turn === 'white' ? this.whiteTime++ : this.blackTime++;
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            AppLogManager.log(this.canLog, '⏸️', 'Timer', 'Arrêt');
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isTimerRunning = false;
    }

    resetTimers() {
        AppLogManager.log(this.canLog, '🔄', 'Timer', 'Reset');
        this.stopTimer();
        this.whiteTime = 0;
        this.blackTime = 0;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const whiteElem = document.getElementById('whiteTime');
        const blackElem = document.getElementById('blackTime');
        const turn = this.ui.game.gameState?.currentPlayer;
        
        if (whiteElem) {
            whiteElem.textContent = this.formatTime(this.whiteTime);
            whiteElem.style.fontWeight = (turn === 'white') ? 'bold' : 'normal';
            whiteElem.style.color = (turn === 'white') ? '#28a745' : '';
        }
        
        if (blackElem) {
            blackElem.textContent = this.formatTime(this.blackTime);
            blackElem.style.fontWeight = (turn === 'black') ? 'bold' : 'normal';
            blackElem.style.color = (turn === 'black') ? '#28a745' : '';
        }
    }

    formatTime(seconds) {
        const s = Math.max(0, seconds);
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

window.ChessTimerManager = ChessTimerManager;