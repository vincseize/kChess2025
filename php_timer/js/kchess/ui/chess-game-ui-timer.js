// ui/chess-game-ui-timer.js - Version avec gestion de l'incrément

class ChessTimerManager {
    static consoleLog = false; 
    
    static init() {
        this.forceSilentMode();
        console.info('⏱️ ChessTimerManager: Gestion de l\'incrément activée');
    }
    
    static loadConfig() { this.consoleLog = false; return true; }
    static forceSilentMode() { this.consoleLog = false; }
    static getConfigSource() { return 'FORCÉ SILENCIEUX'; }
    static isDebugMode() { return false; }

    constructor(ui) {
        ChessTimerManager.consoleLog = false;
        this.ui = ui;
        this.whiteTime = 0;
        this.blackTime = 0;
        this.timerInterval = null;
        this.isTimerRunning = false;
        
        // --- AJOUT : Suivi du dernier joueur pour détecter le changement de tour ---
        this.lastPlayer = null;
    }

    // Méthode pour extraire les secondes de l'incrément (ex: "00:00:02" -> 2)
    getIncrementSeconds() {
        try {
            // On cherche l'incrément dans les paramètres de l'URL ou la config du bot
            const params = new URLSearchParams(window.location.search);
            const level = params.get('level');
            if (level && window.translations && window.translations.bots) {
                const botData = window.translations.bots['bot_' + level];
                if (botData && botData.increment) {
                    const parts = botData.increment.split(':');
                    return parseInt(parts[parts.length - 1]) || 0;
                }
            }
        } catch (e) { return 0; }
        return 0;
    }

    startTimer() {
        if (this.timerInterval) this.stopTimer();
        if (!this.ui.game.gameState.gameActive) return;
        
        this.isTimerRunning = true;
        this.lastPlayer = this.ui.game.gameState.currentPlayer;

        this.timerInterval = setInterval(() => {
            if (!this.ui.game.gameState.gameActive) {
                this.stopTimer();
                return;
            }
            
            const currentPlayer = this.ui.game.gameState.currentPlayer;

            // --- LOGIQUE D'INCRÉMENT : Si le joueur vient de changer ---
            if (this.lastPlayer !== null && this.lastPlayer !== currentPlayer) {
                const inc = this.getIncrementSeconds();
                if (inc > 0) {
                    // On ajoute l'incrément au joueur qui vient de FINIR son coup
                    if (this.lastPlayer === 'white') this.whiteTime += inc;
                    else this.blackTime += inc;
                }
                this.lastPlayer = currentPlayer;
            }

            // Décompte normal (ici on incrémente car c'est un temps passé, pas un compte à rebours)
            if (currentPlayer === 'white') {
                this.whiteTime++;
            } else {
                this.blackTime++;
            }
            
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isTimerRunning = false;
    }

    resumeTimer() {
        if (this.ui.game.gameState.gameActive && !this.isTimerRunning) {
            this.startTimer();
        }
    }

    resetTimers() {
        this.stopTimer();
        this.whiteTime = 0;
        this.blackTime = 0;
        this.lastPlayer = null;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const whiteTimerElement = document.getElementById('whiteTime');
        const blackTimerElement = document.getElementById('blackTime');
        const currentPlayer = this.ui.game.gameState.currentPlayer;
        
        if (whiteTimerElement) {
            whiteTimerElement.textContent = this.formatTime(this.whiteTime);
            whiteTimerElement.style.color = (currentPlayer === 'white') ? '#007bff' : '';
            whiteTimerElement.style.fontWeight = (currentPlayer === 'white') ? 'bold' : 'normal';
        }
        
        if (blackTimerElement) {
            blackTimerElement.textContent = this.formatTime(this.blackTime);
            blackTimerElement.style.color = (currentPlayer === 'black') ? '#dc3545' : '';
            blackTimerElement.style.fontWeight = (currentPlayer === 'black') ? 'bold' : 'normal';
        }
    }

    formatTime(seconds) {
        const s = Math.max(0, seconds);
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // ... (Reste des méthodes getTimerStats, checkTimerHealth, etc. inchangées)
}

ChessTimerManager.init();
window.ChessTimerManager = ChessTimerManager;