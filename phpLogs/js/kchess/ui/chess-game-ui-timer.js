// ui/chess-game-ui-timer.js

class ChessTimerManager {
    /**
     * CONFIGURATION DE DÉBOGAGE
     * localConsoleLog = true  -> Force les logs (Priorité sur le JSON)
     * localConsoleLog = false -> Suit la configuration du JSON
     */
    static localConsoleLog = true; 
    static MODULE_KEY = 'debug'; 

    constructor(ui) {
        this.ui = ui;
        
        // Calcul de la permission de log (Respecte la priorité demandée)
        this.canLog = AppLogManager.shouldLog(ChessTimerManager.MODULE_KEY, ChessTimerManager.localConsoleLog);

        this.whiteTime = 0;
        this.blackTime = 0;
        this.gameStartTime = null;
        this.timerInterval = null;
        this.isTimerRunning = false;

        if (this.canLog) {
            console.log(`⏱️ ChessTimerManager: Initialisé [Mode: ${ChessTimerManager.localConsoleLog ? 'FORCÉ LOCAL' : 'JSON'}]`);
        }
    }

startTimer() {
    if (this.timerInterval) this.stopTimer();
    
    // CONDITION MODIFIÉE : On autorise le démarrage si gameActive n'est pas explicitement FALSE
    // ou on s'assure que le moteur de jeu l'initialise bien.
    if (this.ui.game.gameState && this.ui.game.gameState.gameActive === false) {
        if (this.canLog) console.log('⏱️ Timer bloqué : gameState.gameActive est false');
        return;
    }

    if (this.canLog) console.log('⏱️ Démarrage du chronomètre');
    
    this.isTimerRunning = true;
    this.timerInterval = setInterval(() => {
        // On vérifie si le jeu a été arrêté entre temps
        if (this.ui.game.gameState && this.ui.game.gameState.gameActive === false) {
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
            if (this.canLog) console.log('⏱️ Arrêt du chronomètre');
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
        if (this.canLog) console.log('⏱️ Réinitialisation des temps');
        this.stopTimer();
        this.whiteTime = 0;
        this.blackTime = 0;
        this.gameStartTime = null;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const whiteElem = document.getElementById('whiteTime');
        const blackElem = document.getElementById('blackTime');
        const turn = this.ui.game.gameState.currentPlayer;
        
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

    // --- OUTILS DE DIAGNOSTIC (Gardés pour vos besoins) ---

    getTimerStats() {
        const stats = {
            white: this.formatTime(this.whiteTime),
            black: this.formatTime(this.blackTime),
            isRunning: this.isTimerRunning,
            gameActive: this.ui.game.gameState.gameActive
        };
        if (this.canLog) console.table(stats);
        return stats;
    }
    
    checkTimerHealth() {
        const health = {
            isRunning: this.isTimerRunning,
            hasInterval: !!this.timerInterval,
            domElements: !!document.getElementById('whiteTime') && !!document.getElementById('blackTime')
        };
        if (this.canLog) console.log('🔍 Health Check Timer:', health);
        return health;
    }
    
    repairTimer() {
        const health = this.checkTimerHealth();
        if (this.ui.game.gameState.gameActive && !health.isRunning) {
            if (this.canLog) console.warn('🛠️ Réparation : Relance du timer car le jeu est actif.');
            this.startTimer();
            return true;
        }
        return false;
    }
}

// Export global
window.ChessTimerManager = ChessTimerManager;

/**
 * UTILS GLOBAUX (TimerManagerUtils)
 * Pour tester depuis la console du navigateur
 */
window.TimerManagerUtils = {
    // Permet de voir l'état de la priorité sans recharger
    getDebugStatus: () => {
        const canLog = AppLogManager.shouldLog(ChessTimerManager.MODULE_KEY, ChessTimerManager.localConsoleLog);
        return {
            "Fichier Local (Static)": ChessTimerManager.localConsoleLog,
            "Config JSON Globale": window.appConfig?.debug?.console_log,
            "Permission Finale": canLog ? "✅ AUTORISÉ" : "🚫 SILENCIEUX"
        };
    },

    // Lance une batterie de tests rapides
    runQuickTest: (instance) => {
        if (!instance) return "❌ Instance manquante";
        console.log("🧪 Test Formatage (65s):", instance.formatTime(65) === "01:05" ? "OK" : "ERREUR");
        console.log("🧪 Test Stats:", instance.getTimerStats());
        return "Fin des tests.";
    }
};