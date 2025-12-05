// chess-game-ui-timer.js - Gestion des timers
class ChessTimerManager {
    constructor(ui) {
        this.ui = ui;
        this.whiteTime = 0;
        this.blackTime = 0;
        this.gameStartTime = null;
        this.timerInterval = null;
        this.isTimerRunning = false;
    }

    startTimer() {
        if (this.timerInterval) {
            this.stopTimer();
        }
        
        if (!this.ui.game.gameState.gameActive) {
            console.log('⏱️ Timer non démarré - jeu non actif');
            return;
        }
        
        this.gameStartTime = Date.now();
        this.isTimerRunning = true;
        
        this.timerInterval = setInterval(() => {
            if (!this.ui.game.gameState.gameActive) {
                this.stopTimer();
                return;
            }
            
            if (this.ui.game.gameState.currentPlayer === 'white') {
                this.whiteTime++;
            } else {
                this.blackTime++;
            }
            
            this.updateTimerDisplay();
            
        }, 1000);
        
        console.log('⏱️ Timer démarré - Jeu actif');
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isTimerRunning = false;
        console.log('⏱️ Timer arrêté');
    }

    resumeTimer() {
        if (this.ui.game.gameState.gameActive && !this.isTimerRunning) {
            this.startTimer();
            console.log('⏱️ Timer repris');
        }
    }

    resetTimers() {
        this.stopTimer();
        this.whiteTime = 0;
        this.blackTime = 0;
        this.updateTimerDisplay();
        console.log('⏱️ Timers réinitialisés');
    }

    updateTimerDisplay() {
        const whiteTimerElement = document.getElementById('whiteTime');
        const blackTimerElement = document.getElementById('blackTime');
        
        if (whiteTimerElement) {
            whiteTimerElement.textContent = this.formatTime(this.whiteTime);
            if (this.ui.game.gameState.currentPlayer === 'white') {
                whiteTimerElement.style.fontWeight = 'bold';
                whiteTimerElement.style.color = '#28a745';
            } else {
                whiteTimerElement.style.fontWeight = 'normal';
                whiteTimerElement.style.color = '';
            }
        }
        
        if (blackTimerElement) {
            blackTimerElement.textContent = this.formatTime(this.blackTime);
            if (this.ui.game.gameState.currentPlayer === 'black') {
                blackTimerElement.style.fontWeight = 'bold';
                blackTimerElement.style.color = '#28a745';
            } else {
                blackTimerElement.style.fontWeight = 'normal';
                blackTimerElement.style.color = '';
            }
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}