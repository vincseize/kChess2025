// ui/chess-game-ui-timer.js - Version Complète avec Gestion Incrément

class ChessTimerManager {
    
    static consoleLog = false; 
    
    static init() {
        this.forceSilentMode();
        // Un seul log informatif au démarrage
        console.info('⏱️ ChessTimerManager: Système initialisé (Incrément supporté)');
    }
    
    static loadConfig() {
        this.consoleLog = false;
        return true;
    }
    
    static forceSilentMode() {
        this.consoleLog = false;
    }
    
    static getConfigSource() {
        return 'FORCÉ SILENCIEUX';
    }

    constructor(ui) {
        ChessTimerManager.consoleLog = false;
        
        this.ui = ui;
        this.whiteTime = 600; // 10 min par défaut
        this.blackTime = 600;
        this.increment = 0;   // Valeur récupérée du JSON
        
        this.timerInterval = null;
        this.isTimerRunning = false;
    }

    /**
     * Applique la configuration issue du JSON des bots
     */
    setTimerConfig(config) {
        if (!config) return;

        // 1. Temps principal (ex: "00:05:00")
        if (config.clock) {
            const baseTime = this.parseTimeString(config.clock);
            this.whiteTime = baseTime;
            this.blackTime = baseTime;
        }

        // 2. Incrément (ex: "2" ou "00:00:02")
        if (config.increment !== undefined) {
            const inc = config.increment;
            if (typeof inc === 'string' && inc.includes(':')) {
                this.increment = this.parseTimeString(inc);
            } else {
                this.increment = parseInt(inc) || 0;
            }
        }

        this.updateTimerDisplay();
    }

    /**
     * Déclenche l'incrément pour le joueur qui vient de jouer
     * Appelé depuis GameState.switchPlayer()
     */
    switchTurn(newColor) {
        // Le joueur qui vient de finir est l'opposé de newColor
        const previousColor = (newColor === 'white') ? 'black' : 'white';
        
        // On n'ajoute l'incrément que si la partie est en cours
        if (this.isTimerRunning) {
            if (previousColor === 'white') {
                this.whiteTime += this.increment;
            } else {
                this.blackTime += this.increment;
            }
        }
        
        this.updateTimerDisplay();
    }

    /**
     * Démarre le décompte d'une seconde
     */
    startTimer() {
        if (this.timerInterval) this.stopTimer();
        if (!this.ui.game.gameState.gameActive) return;
        
        this.isTimerRunning = true;
        
        this.timerInterval = setInterval(() => {
            // Sécurité si le jeu s'arrête entre deux intervalles
            if (!this.ui.game.gameState.gameActive) {
                this.stopTimer();
                return;
            }
            
            const currentPlayer = this.ui.game.gameState.currentPlayer;
            
            // Décrémentation du joueur actif
            if (currentPlayer === 'white') {
                if (this.whiteTime > 0) this.whiteTime--;
            } else {
                if (this.blackTime > 0) this.blackTime--;
            }
            
            this.updateTimerDisplay();

            // Vérification de la chute du drapeau (temps écoulé)
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

    resumeTimer() {
        if (this.ui.game.gameState.gameActive && !this.isTimerRunning) {
            this.startTimer();
        }
    }

    resetTimers() {
        this.stopTimer();
        this.whiteTime = 600;
        this.blackTime = 600;
        this.increment = 0;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const whiteTimerElement = document.getElementById('whiteTime');
        const blackTimerElement = document.getElementById('blackTime');
        const currentPlayer = this.ui.game.gameState.currentPlayer;
        
        if (whiteTimerElement) {
            whiteTimerElement.textContent = this.formatTime(this.whiteTime);
            this.applyActiveStyle(whiteTimerElement, currentPlayer === 'white');
        }
        
        if (blackTimerElement) {
            blackTimerElement.textContent = this.formatTime(this.blackTime);
            this.applyActiveStyle(blackTimerElement, currentPlayer === 'black');
        }
    }

    applyActiveStyle(el, isActive) {
        if (isActive) {
            el.style.fontWeight = 'bold';
            el.style.color = '#28a745'; // Vert "actif"
        } else {
            el.style.fontWeight = 'normal';
            el.style.color = '';
        }
    }

    /**
     * Utilitaire : Formate les secondes en MM:SS
     */
    formatTime(seconds) {
        if (seconds < 0) seconds = 0;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Utilitaire : Parseur de chaînes de temps
     */
    parseTimeString(timeStr) {
        if (!timeStr) return 0;
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
        if (parts.length === 2) return (parts[0] * 60) + parts[1];
        return parseInt(timeStr) || 0;
    }

    getTimerStats() {
        return {
            whiteTime: this.whiteTime,
            blackTime: this.blackTime,
            increment: this.increment,
            isRunning: this.isTimerRunning
        };
    }
}

// Initialisation et exposition globale
ChessTimerManager.init();
window.ChessTimerManager = ChessTimerManager;