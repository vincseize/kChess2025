// ui/chess-game-ui-timer.js - Version complète avec même structure que PawnMoveValidator
if (typeof ChessTimerManager !== 'undefined') {
    console.warn('⚠️ ChessTimerManager existe déjà. Vérifiez les doublons dans les imports.');
} else {

class ChessTimerManager {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // ALERT DE DEBUG - Voir si la config est chargée
        // alert(`DEBUG ChessTimerManager.init():\n` +
        //       `- window.appConfig existe: ${!!window.appConfig}\n` +
        //       `- window.appConfig?.debug?.console_log: ${window.appConfig?.debug?.console_log}\n` +
        //       `- window.appConfig?.chess_engine?.console_log: ${window.appConfig?.chess_engine?.console_log}`);
        
        // Charger la configuration
        this.loadConfig();
        
        // ALERT après loadConfig pour voir le résultat
        // alert(`DEBUG après loadConfig():\n` +
        //       `- this.consoleLog: ${this.consoleLog}\n` +
        //       `- Source config: ${this.getConfigSource()}\n` +
        //       `- Mode debug: ${this.consoleLog ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('⏱️ ui/chess-game-ui-timer.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('⏱️ ChessTimerManager: Mode silencieux activé (debug désactivé dans config)');
        }
    }
    
    // Méthode pour charger la configuration - MÊME PATTERN QUE PAWNMOVEVALIDATOR
    static loadConfig() {
        try {
            if (window.appConfig && window.appConfig.chess_engine) {
                // Configuration prioritaire: window.appConfig.chess_engine (comme PawnMoveValidator)
                if (window.appConfig.chess_engine.console_log !== undefined) {
                    this.consoleLog = window.appConfig.chess_engine.console_log;
                    if (this.consoleLog) {
                        console.log('⏱️ Configuration chargée depuis window.appConfig.chess_engine');
                    }
                }
            } else if (window.appConfig && window.appConfig.debug) {
                // Configuration alternative: window.appConfig.debug (votre structure actuelle)
                if (window.appConfig.debug.console_log !== undefined) {
                    this.consoleLog = window.appConfig.debug.console_log;
                    if (this.consoleLog) {
                        console.log('⏱️ Configuration chargée depuis window.appConfig.debug');
                    }
                }
            } else if (window.chessConfig) {
                // Configuration secondaire: window.chessConfig (pour compatibilité)
                if (window.chessConfig.debug !== undefined) {
                    this.consoleLog = window.chessConfig.debug;
                    if (this.consoleLog) {
                        console.log('⏱️ Configuration chargée depuis window.chessConfig (legacy)');
                    }
                }
            } else {
                // Fallback: valeurs par défaut
                if (this.consoleLog) {
                    console.log('⏱️ Configuration: valeurs par défaut utilisées');
                }
            }
            
            // Log de confirmation (uniquement en mode debug)
            if (this.consoleLog) {
                console.log(`🔧 ChessTimerManager: console_log = ${this.consoleLog}`);
            }
            return true;
            
        } catch (error) {
            console.error('❌ ChessTimerManager: Erreur lors du chargement de la config:', error);
            return false;
        }
    }
    
    // Méthode pour déterminer la source de la configuration
    static getConfigSource() {
        if (window.appConfig && window.appConfig.chess_engine) {
            return 'window.appConfig.chess_engine';
        } else if (window.appConfig && window.appConfig.debug) {
            return 'window.appConfig.debug';
        } else if (window.chessConfig) {
            return 'window.chessConfig (legacy)';
        } else {
            return 'valeur par défaut';
        }
    }
    
    // Méthode pour vérifier si on est en mode debug
    static isDebugMode() {
        return this.consoleLog;
    }

    constructor(ui) {
        // Vérifier que la configuration est à jour
        ChessTimerManager.loadConfig();
        
        this.ui = ui;
        this.whiteTime = 0;
        this.blackTime = 0;
        this.gameStartTime = null;
        this.timerInterval = null;
        this.isTimerRunning = false;
        
        if (ChessTimerManager.consoleLog) {
            console.log('⏱️ ChessTimerManager initialisé');
            console.log(`  - UI: ${ui ? '✓' : '✗'}`);
            console.log(`  - Timers: Blanc=${this.whiteTime}s, Noir=${this.blackTime}s`);
            console.log(`  - État initial: ${this.isTimerRunning ? 'En cours' : 'Arrêté'}`);
        }
    }

    startTimer() {
        const isDebug = ChessTimerManager.consoleLog;
        
        if (isDebug) {
            console.log('\n⏱️ Démarrage du timer');
            console.log(`  - Timer actuellement: ${this.timerInterval ? 'en cours' : 'arrêté'}`);
            console.log(`  - Jeu actif: ${this.ui.game.gameState.gameActive ? '✓' : '✗'}`);
            console.log(`  - Joueur courant: ${this.ui.game.gameState.currentPlayer}`);
        }
        
        if (this.timerInterval) {
            if (isDebug) {
                console.log('  ⚠️ Timer déjà en cours, arrêt préalable...');
            }
            this.stopTimer();
        }
        
        if (!this.ui.game.gameState.gameActive) {
            if (isDebug) {
                console.log('  ❌ Timer non démarré - jeu non actif');
                console.log(`  - Statut jeu: ${this.ui.game.gameState.gameStatus || 'indéfini'}`);
            }
            return;
        }
        
        this.gameStartTime = Date.now();
        this.isTimerRunning = true;
        
        if (isDebug) {
            console.log(`  - Heure de début: ${new Date(this.gameStartTime).toLocaleTimeString()}`);
            console.log(`  - Timer démarré pour: ${this.ui.game.gameState.currentPlayer}`);
        }
        
        this.timerInterval = setInterval(() => {
            if (!this.ui.game.gameState.gameActive) {
                if (isDebug) {
                    console.log('    ⚠️ Jeu non actif, arrêt du timer...');
                }
                this.stopTimer();
                return;
            }
            
            const currentPlayer = this.ui.game.gameState.currentPlayer;
            
            if (currentPlayer === 'white') {
                this.whiteTime++;
                if (isDebug) {
                    console.log(`    ⏱️ +1s Blanc: ${this.whiteTime}s total`);
                }
            } else {
                this.blackTime++;
                if (isDebug) {
                    console.log(`    ⏱️ +1s Noir: ${this.blackTime}s total`);
                }
            }
            
            this.updateTimerDisplay();
        }, 1000);
        
        if (isDebug) {
            console.log('  ✅ Timer démarré avec succès');
            console.log(`  - Interval ID: ${this.timerInterval ? 'défini' : 'non défini'}`);
            console.log(`  - Fréquence: 1000ms (1 seconde)`);
        }
    }

    stopTimer() {
        const isDebug = ChessTimerManager.consoleLog;
        
        if (isDebug) {
            console.log('\n⏱️ Arrêt du timer');
            console.log(`  - Timer en cours: ${this.timerInterval ? '✓' : '✗'}`);
            console.log(`  - Timer actif: ${this.isTimerRunning ? '✓' : '✗'}`);
            
            if (this.timerInterval) {
                const elapsed = Date.now() - (this.gameStartTime || Date.now());
                console.log(`  - Durée écoulée: ${Math.floor(elapsed / 1000)} secondes`);
                console.log(`  - Temps final: Blanc=${this.whiteTime}s, Noir=${this.blackTime}s`);
            }
        }
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            if (isDebug) {
                console.log('  ✅ Intervalle effacé');
            }
        }
        
        this.isTimerRunning = false;
        
        if (isDebug) {
            console.log('  ✅ Timer arrêté');
        }
    }

    resumeTimer() {
        const isDebug = ChessTimerManager.consoleLog;
        
        if (isDebug) {
            console.log('\n⏱️ Reprise du timer');
            console.log(`  - Jeu actif: ${this.ui.game.gameState.gameActive ? '✓' : '✗'}`);
            console.log(`  - Timer en cours: ${this.isTimerRunning ? '✓' : '✗'}`);
        }
        
        if (this.ui.game.gameState.gameActive && !this.isTimerRunning) {
            if (isDebug) {
                console.log('  ✅ Conditions remplies, redémarrage...');
            }
            this.startTimer();
            if (isDebug) {
                console.log('  ✅ Timer repris');
            }
        } else if (isDebug) {
            console.log('  ⚠️ Timer non repris: conditions non remplies');
            if (!this.ui.game.gameState.gameActive) {
                console.log('    - Jeu non actif');
            }
            if (this.isTimerRunning) {
                console.log('    - Timer déjà en cours');
            }
        }
    }

    resetTimers() {
        const isDebug = ChessTimerManager.consoleLog;
        
        if (isDebug) {
            console.log('\n⏱️ Réinitialisation des timers');
            console.log(`  - Avant: Blanc=${this.whiteTime}s, Noir=${this.blackTime}s`);
            console.log(`  - Timer en cours: ${this.timerInterval ? '✓' : '✗'}`);
        }
        
        this.stopTimer();
        
        const previousWhite = this.whiteTime;
        const previousBlack = this.blackTime;
        
        this.whiteTime = 0;
        this.blackTime = 0;
        this.gameStartTime = null;
        
        if (isDebug) {
            console.log(`  - Après: Blanc=${this.whiteTime}s, Noir=${this.blackTime}s`);
            console.log(`  - Temps effacé: Blanc ${previousWhite}s, Noir ${previousBlack}s`);
        }
        
        this.updateTimerDisplay();
        
        if (isDebug) {
            console.log('  ✅ Timers réinitialisés');
            console.log('  ✅ Affichage mis à jour');
        }
    }

    updateTimerDisplay() {
        const isDebug = ChessTimerManager.consoleLog;
        
        if (isDebug) {
            console.log('\n    ⏱️ Mise à jour de l\'affichage des timers');
        }
        
        const whiteTimerElement = document.getElementById('whiteTime');
        const blackTimerElement = document.getElementById('blackTime');
        
        if (isDebug) {
            console.log(`    - Élément Blanc: ${whiteTimerElement ? '✓' : '✗'}`);
            console.log(`    - Élément Noir: ${blackTimerElement ? '✓' : '✗'}`);
        }
        
        if (whiteTimerElement) {
            const whiteFormatted = this.formatTime(this.whiteTime);
            whiteTimerElement.textContent = whiteFormatted;
            
            if (this.ui.game.gameState.currentPlayer === 'white') {
                whiteTimerElement.style.fontWeight = 'bold';
                whiteTimerElement.style.color = '#28a745';
                if (isDebug) {
                    console.log(`    - Blanc [${whiteFormatted}]: actif (gras, vert)`);
                }
            } else {
                whiteTimerElement.style.fontWeight = 'normal';
                whiteTimerElement.style.color = '';
                if (isDebug) {
                    console.log(`    - Blanc [${whiteFormatted}]: inactif`);
                }
            }
        } else if (isDebug) {
            console.log(`    ⚠️ Élément whiteTime non trouvé`);
        }
        
        if (blackTimerElement) {
            const blackFormatted = this.formatTime(this.blackTime);
            blackTimerElement.textContent = blackFormatted;
            
            if (this.ui.game.gameState.currentPlayer === 'black') {
                blackTimerElement.style.fontWeight = 'bold';
                blackTimerElement.style.color = '#28a745';
                if (isDebug) {
                    console.log(`    - Noir [${blackFormatted}]: actif (gras, vert)`);
                }
            } else {
                blackTimerElement.style.fontWeight = 'normal';
                blackTimerElement.style.color = '';
                if (isDebug) {
                    console.log(`    - Noir [${blackFormatted}]: inactif`);
                }
            }
        } else if (isDebug) {
            console.log(`    ⚠️ Élément blackTime non trouvé`);
        }
    }

    formatTime(seconds) {
        const isDebug = ChessTimerManager.consoleLog;
        
        if (isDebug) {
            console.log(`      Formatage: ${seconds} secondes`);
        }
        
        if (seconds < 0) {
            if (isDebug) {
                console.warn(`      ⚠️ Temps négatif: ${seconds}s`);
            }
            seconds = 0;
        }
        
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (isDebug) {
            console.log(`      Résultat: ${formatted} (${mins}m ${secs}s)`);
        }
        
        return formatted;
    }

    // Méthode utilitaire pour obtenir les statistiques des timers
    getTimerStats() {
        const isDebug = ChessTimerManager.consoleLog;
        const stats = {
            whiteTime: this.whiteTime,
            blackTime: this.blackTime,
            totalTime: this.whiteTime + this.blackTime,
            isRunning: this.isTimerRunning,
            currentPlayer: this.ui.game.gameState.currentPlayer,
            gameActive: this.ui.game.gameState.gameActive,
            elapsedSinceStart: this.gameStartTime ? Date.now() - this.gameStartTime : 0
        };
        
        if (isDebug) {
            console.log('\n⏱️ Statistiques des timers:');
            console.log(`  - Blanc: ${this.formatTime(stats.whiteTime)} (${stats.whiteTime}s)`);
            console.log(`  - Noir: ${this.formatTime(stats.blackTime)} (${stats.blackTime}s)`);
            console.log(`  - Total: ${stats.totalTime}s`);
            console.log(`  - Timer actif: ${stats.isRunning ? '✓' : '✗'}`);
            console.log(`  - Joueur courant: ${stats.currentPlayer}`);
            console.log(`  - Jeu actif: ${stats.gameActive ? '✓' : '✗'}`);
            console.log(`  - Écoulé depuis début: ${Math.floor(stats.elapsedSinceStart / 1000)}s`);
        }
        
        return stats;
    }
    
    // NOUVELLE MÉTHODE : Obtenir les temps formatés séparément
    getFormattedTimes() {
        return {
            white: this.formatTime(this.whiteTime),
            black: this.formatTime(this.blackTime),
            whiteSeconds: this.whiteTime,
            blackSeconds: this.blackTime
        };
    }
    
    // NOUVELLE MÉTHODE : Vérifier si le timer fonctionne correctement
    checkTimerHealth() {
        if (!ChessTimerManager.consoleLog) {
            // Mode silencieux
            const health = {
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
            
            return health;
        }
        
        // Mode debug
        console.group('🔍 Vérification santé du timer');
        
        const health = {
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
        
        console.log('État du timer:', this.isTimerRunning ? '✅ EN COURS' : '❌ ARRÊTÉ');
        console.log('Interval défini:', this.timerInterval ? '✅ OUI' : '❌ NON');
        console.log('Jeu actif:', health.gameActive ? '✅ OUI' : '❌ NON');
        console.log('UI valide:', health.uiValid ? '✅ OUI' : '❌ NON');
        console.log('GameState valide:', health.gameStateValid ? '✅ OUI' : '❌ NON');
        console.log('Éléments DOM:');
        console.log('  - whiteTime:', health.timeElementsExist.white ? '✅ TROUVÉ' : '❌ MANQUANT');
        console.log('  - blackTime:', health.timeElementsExist.black ? '✅ TROUVÉ' : '❌ MANQUANT');
        
        // Vérifier les temps actuels
        const times = this.getTimerStats();
        console.log('Temps actuels:');
        console.log(`  - Blanc: ${times.whiteTime}s`);
        console.log(`  - Noir: ${times.blackTime}s`);
        
        console.groupEnd();
        
        return health;
    }
    
    // NOUVELLE MÉTHODE : Réparer le timer s'il est cassé
    repairTimer() {
        if (!ChessTimerManager.consoleLog) {
            // Mode silencieux
            // Vérifier l'état actuel
            const health = this.checkTimerHealth();
            
            // Réinitialiser si le jeu est actif mais le timer ne tourne pas
            if (health.gameActive && !health.timerRunning && health.gameStateValid) {
                this.stopTimer();
                this.startTimer();
                return { repaired: true, reason: 'Timer arrêté mais jeu actif' };
            }
            
            // Arrêter le timer si le jeu n'est pas actif
            if (!health.gameActive && health.timerRunning) {
                this.stopTimer();
                return { repaired: true, reason: 'Timer en cours mais jeu inactif' };
            }
            
            return { repaired: false, reason: 'Aucune réparation nécessaire' };
        }
        
        // Mode debug
        console.group('🔧 Réparation du timer');
        
        const health = this.checkTimerHealth();
        let repairNeeded = false;
        let repairReason = '';
        
        if (!health.uiValid || !health.gameStateValid) {
            console.log('❌ UI ou GameState non valide, réparation impossible');
            console.groupEnd();
            return { repaired: false, reason: 'UI ou GameState invalide' };
        }
        
        // Cas 1: Jeu actif mais timer arrêté
        if (health.gameActive && !health.timerRunning) {
            console.log('⚠️ Jeu actif mais timer arrêté - redémarrage...');
            repairNeeded = true;
            repairReason = 'Timer arrêté mais jeu actif';
            this.stopTimer();
            this.startTimer();
            console.log('✅ Timer redémarré');
        }
        
        // Cas 2: Jeu inactif mais timer en cours
        if (!health.gameActive && health.timerRunning) {
            console.log('⚠️ Jeu inactif mais timer en cours - arrêt...');
            repairNeeded = true;
            repairReason = 'Timer en cours mais jeu inactif';
            this.stopTimer();
            console.log('✅ Timer arrêté');
        }
        
        // Cas 3: Éléments DOM manquants mais timer en cours
        if (health.timerRunning && (!health.timeElementsExist.white || !health.timeElementsExist.black)) {
            console.log('⚠️ Timer en cours mais éléments DOM manquants - recréation affichage...');
            repairNeeded = true;
            repairReason = 'Éléments DOM manquants';
            this.updateTimerDisplay();
            console.log('✅ Affichage mis à jour');
        }
        
        if (!repairNeeded) {
            console.log('✅ Aucune réparation nécessaire - timer en bon état');
        }
        
        console.groupEnd();
        
        return {
            repaired: repairNeeded,
            reason: repairReason || 'Aucune réparation nécessaire'
        };
    }
}

// Initialisation statique
ChessTimerManager.init();

// Exposer la classe globalement
window.ChessTimerManager = ChessTimerManager;

// Ajouter des fonctions utilitaires globales
window.TimerManagerUtils = {
    // Forcer le rechargement de la config
    reloadConfig: () => {
        ChessTimerManager.loadConfig();
        if (ChessTimerManager.consoleLog) {
            console.log('🔄 Configuration rechargée manuellement');
        }
        return ChessTimerManager.consoleLog;
    },
    
    // Obtenir l'état actuel
    getState: () => ({
        consoleLog: ChessTimerManager.consoleLog,
        source: ChessTimerManager.getConfigSource(),
        debugMode: ChessTimerManager.isDebugMode(),
        configValue: window.appConfig?.debug?.console_log
    }),
    
    // Activer/désactiver manuellement (temporaire)
    setConsoleLog: (value) => {
        const oldValue = ChessTimerManager.consoleLog;
        ChessTimerManager.consoleLog = Boolean(value);
        if (ChessTimerManager.consoleLog) {
            console.log(`🔧 consoleLog changé manuellement: ${oldValue} → ${ChessTimerManager.consoleLog}`);
        }
        return ChessTimerManager.consoleLog;
    },
    
    // Tester la création d'un TimerManager
    testTimerManager: (ui) => {
        if (ChessTimerManager.consoleLog) {
            console.group('🧪 Test ChessTimerManager');
        }
        const timerManager = new ChessTimerManager(ui);
        if (ChessTimerManager.consoleLog) {
            console.log('TimerManager créé:', timerManager);
            console.log('Statistiques:', timerManager.getTimerStats());
            console.log('Santé:', timerManager.checkTimerHealth());
            console.groupEnd();
        }
        return timerManager;
    },
    
    // Tester le fonctionnement du timer
    testTimerFunctions: (timerManager) => {
        if (!timerManager) {
            console.error('❌ TimerManager non fourni');
            return null;
        }
        
        if (!ChessTimerManager.consoleLog) {
            return { tests: {}, passed: false };
        }
        
        console.group('🧪 Test des fonctions du timer');
        
        const tests = {
            startTimer: false,
            stopTimer: false,
            resetTimer: false,
            updateDisplay: false,
            formatTime: false,
            getStats: false
        };
        
        try {
            // Tester formatTime
            const formatted = timerManager.formatTime(65);
            tests.formatTime = formatted === '01:05';
            console.log(`Formatage temps (65s): ${formatted} - ${tests.formatTime ? '✅' : '❌'}`);
            
            // Tester getStats
            const stats = timerManager.getTimerStats();
            tests.getStats = !!stats;
            console.log(`Statistiques obtenues: ${tests.getStats ? '✅' : '❌'}`);
            
            // Tester updateDisplay
            timerManager.updateTimerDisplay();
            tests.updateDisplay = true;
            console.log(`Affichage mis à jour: ${tests.updateDisplay ? '✅' : '❌'}`);
            
            // Tester stopTimer (si en cours)
            if (timerManager.isTimerRunning) {
                timerManager.stopTimer();
                tests.stopTimer = !timerManager.isTimerRunning;
                console.log(`Timer arrêté: ${tests.stopTimer ? '✅' : '❌'}`);
            }
            
            // Tester startTimer
            timerManager.startTimer();
            tests.startTimer = timerManager.isTimerRunning;
            console.log(`Timer démarré: ${tests.startTimer ? '✅' : '❌'}`);
            
            // Tester resetTimer
            timerManager.resetTimers();
            const afterReset = timerManager.getTimerStats();
            tests.resetTimer = afterReset.whiteTime === 0 && afterReset.blackTime === 0;
            console.log(`Timer réinitialisé: ${tests.resetTimer ? '✅' : '❌'}`);
            
            // Arrêter le timer après test
            timerManager.stopTimer();
            
        } catch (error) {
            console.log(`❌ Erreur lors du test: ${error.message}`);
        }
        
        const passedTests = Object.values(tests).filter(Boolean).length;
        const totalTests = Object.keys(tests).length;
        
        console.log(`\n📊 Résultat: ${passedTests}/${totalTests} tests réussis`);
        console.groupEnd();
        
        return { tests, passed: passedTests === totalTests };
    }
};

// Méthode statique pour obtenir le statut de la configuration
ChessTimerManager.getConfigStatus = function() {
    return {
        consoleLog: this.consoleLog,
        source: this.getConfigSource(),
        debugMode: this.isDebugMode(),
        appConfigAvailable: !!window.appConfig,
        configValue: window.appConfig?.debug?.console_log
    };
};

// Méthode statique pour forcer la mise à jour de la configuration
ChessTimerManager.reloadConfig = function() {
    const oldValue = this.consoleLog;
    this.loadConfig();
    
    if (this.consoleLog && oldValue !== this.consoleLog) {
        console.log(`🔄 ChessTimerManager: Configuration rechargée: ${oldValue} → ${this.consoleLog}`);
    }
    return this.consoleLog;
};

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            ChessTimerManager.loadConfig();
            if (ChessTimerManager.consoleLog) {
                console.log('✅ ChessTimerManager: Configuration vérifiée après chargement du DOM');
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        ChessTimerManager.loadConfig();
    }, 100);
}

// Message final basé sur la configuration
if (ChessTimerManager.consoleLog) {
    console.log('✅ ChessTimerManager prêt (mode debug activé)');
} else {
    console.info('✅ ChessTimerManager prêt (mode silencieux)');
}

} // Fin du if de protection