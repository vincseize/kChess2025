// ui/chess-game-ui-timer.js - Version SILENCIEUX (Sans protection)

class ChessTimerManager {
    
    // FORCÉ À FALSE - Ignorer complètement la config JSON
    static consoleLog = false; // Toujours false
    
    static init() {
        // NE PAS charger la configuration (elle pourrait changer consoleLog à true)
        this.forceSilentMode();
        
        // Ne loguer que si consoleLog est true (mais il est toujours false)
        if (this.consoleLog) {
            console.log('⏱️ ui/chess-game-ui-timer.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux
            console.info('⏱️ ChessTimerManager: Mode silencieux forcé (ignoré config globale)');
        }
    }
    
    // Méthode pour charger la configuration - MODIFIÉE POUR IGNORER CONFIG
    static loadConfig() {
        try {
            // TOUJOURS FALSE - Ignorer complètement window.appConfig
            this.consoleLog = false;
            return true;
        } catch (error) {
            // Pas de log d'erreur non plus
            return false;
        }
    }
    
    // Méthode pour forcer le mode silencieux
    static forceSilentMode() {
        this.consoleLog = false;
    }
    
    // Méthode pour déterminer la source de la configuration
    static getConfigSource() {
        return 'FORCÉ SILENCIEUX (ignoré config JSON)';
    }
    
    // Méthode pour vérifier si on est en mode debug
    static isDebugMode() {
        return false; // Toujours false
    }

    constructor(ui) {
        // S'assurer que consoleLog est false
        ChessTimerManager.consoleLog = false;
        
        this.ui = ui;
        this.whiteTime = 0;
        this.blackTime = 0;
        this.gameStartTime = null;
        this.timerInterval = null;
        this.isTimerRunning = false;
        
        // Aucun log ici (consoleLog = false)
    }

    startTimer() {
        const isDebug = ChessTimerManager.consoleLog; // = false
        
        if (this.timerInterval) {
            this.stopTimer();
        }
        
        if (!this.ui.game.gameState.gameActive) {
            return;
        }
        
        this.gameStartTime = Date.now();
        this.isTimerRunning = true;
        
        this.timerInterval = setInterval(() => {
            if (!this.ui.game.gameState.gameActive) {
                this.stopTimer();
                return;
            }
            
            const currentPlayer = this.ui.game.gameState.currentPlayer;
            
            if (currentPlayer === 'white') {
                this.whiteTime++;
            } else {
                this.blackTime++;
            }
            
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        const isDebug = ChessTimerManager.consoleLog; // = false
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.isTimerRunning = false;
    }

    resumeTimer() {
        const isDebug = ChessTimerManager.consoleLog; // = false
        
        if (this.ui.game.gameState.gameActive && !this.isTimerRunning) {
            this.startTimer();
        }
    }

    resetTimers() {
        const isDebug = ChessTimerManager.consoleLog; // = false
        
        this.stopTimer();
        
        this.whiteTime = 0;
        this.blackTime = 0;
        this.gameStartTime = null;
        
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const isDebug = ChessTimerManager.consoleLog; // = false
        
        const whiteTimerElement = document.getElementById('whiteTime');
        const blackTimerElement = document.getElementById('blackTime');
        
        if (whiteTimerElement) {
            const whiteFormatted = this.formatTime(this.whiteTime);
            whiteTimerElement.textContent = whiteFormatted;
            
            if (this.ui.game.gameState.currentPlayer === 'white') {
                whiteTimerElement.style.fontWeight = 'bold';
                whiteTimerElement.style.color = '#28a745';
            } else {
                whiteTimerElement.style.fontWeight = 'normal';
                whiteTimerElement.style.color = '';
            }
        }
        
        if (blackTimerElement) {
            const blackFormatted = this.formatTime(this.blackTime);
            blackTimerElement.textContent = blackFormatted;
            
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
        if (seconds < 0) {
            seconds = 0;
        }
        
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    getTimerStats() {
        return {
            whiteTime: this.whiteTime,
            blackTime: this.blackTime,
            totalTime: this.whiteTime + this.blackTime,
            isRunning: this.isTimerRunning,
            currentPlayer: this.ui.game.gameState.currentPlayer,
            gameActive: this.ui.game.gameState.gameActive,
            elapsedSinceStart: this.gameStartTime ? Date.now() - this.gameStartTime : 0
        };
    }
    
    getFormattedTimes() {
        return {
            white: this.formatTime(this.whiteTime),
            black: this.formatTime(this.blackTime),
            whiteSeconds: this.whiteTime,
            blackSeconds: this.blackTime
        };
    }
    
    checkTimerHealth() {
        return {
            timerRunning: this.isTimerRunning,
            intervalSet: !!this.timerInterval,
            gameActive: this.ui.game.gameState.gameActive,
            uiValid: !!this.ui,
            gameStateValid: !!this.ui?.game?.gameState,
            timeElementsExist: {
                white: !!document.getElementById('whiteTime'),
                black: !!document.getElementById('blackTime')
            }
        };
    }
    
    repairTimer() {
        const health = this.checkTimerHealth();
        
        if (health.gameActive && !health.timerRunning && health.gameStateValid) {
            this.stopTimer();
            this.startTimer();
            return { repaired: true, reason: 'Timer arrêté mais jeu actif' };
        }
        
        if (!health.gameActive && health.timerRunning) {
            this.stopTimer();
            return { repaired: true, reason: 'Timer en cours mais jeu inactif' };
        }
        
        return { repaired: false, reason: 'Aucune réparation nécessaire' };
    }
}

// Initialisation statique
ChessTimerManager.init();

// Exposer la classe globalement
window.ChessTimerManager = ChessTimerManager;

// Ajouter des fonctions utilitaires globales
window.TimerManagerUtils = {
    reloadConfig: () => {
        ChessTimerManager.loadConfig();
        return ChessTimerManager.consoleLog;
    },
    
    getState: () => ({
        consoleLog: ChessTimerManager.consoleLog,
        source: ChessTimerManager.getConfigSource(),
        debugMode: ChessTimerManager.isDebugMode(),
        configValue: false
    }),
    
    setConsoleLog: (value) => {
        ChessTimerManager.consoleLog = false;
        return ChessTimerManager.consoleLog;
    },
    
    testTimerManager: (ui) => {
        return new ChessTimerManager(ui);
    },
    
    testTimerFunctions: (timerManager) => {
        if (!timerManager) return null;
        
        const tests = {
            startTimer: false,
            stopTimer: false,
            resetTimer: false,
            updateDisplay: false,
            formatTime: false,
            getStats: false
        };
        
        try {
            const formatted = timerManager.formatTime(65);
            tests.formatTime = formatted === '01:05';
            
            const stats = timerManager.getTimerStats();
            tests.getStats = !!stats;
            
            timerManager.updateTimerDisplay();
            tests.updateDisplay = true;
            
            if (timerManager.isTimerRunning) {
                timerManager.stopTimer();
                tests.stopTimer = !timerManager.isTimerRunning;
            }
            
            timerManager.startTimer();
            tests.startTimer = timerManager.isTimerRunning;
            
            timerManager.resetTimers();
            const afterReset = timerManager.getTimerStats();
            tests.resetTimer = afterReset.whiteTime === 0 && afterReset.blackTime === 0;
            
            timerManager.stopTimer();
            
        } catch (error) {}
        
        return { tests, passed: false };
    }
};

// Méthodes statiques additionnelles
ChessTimerManager.getConfigStatus = function() {
    return {
        consoleLog: this.consoleLog,
        source: this.getConfigSource(),
        debugMode: this.isDebugMode(),
        appConfigAvailable: !!window.appConfig,
        configValue: false
    };
};

ChessTimerManager.reloadConfig = function() {
    this.loadConfig();
    return this.consoleLog;
};

// Vérification finale au chargement
const forceReload = () => {
    setTimeout(() => {
        ChessTimerManager.loadConfig();
    }, 100);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceReload);
} else {
    forceReload();
}

