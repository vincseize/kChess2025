// ui/chess-game-ui-timer.js - Gestion des timers
class ChessTimerManager {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('ui/chess-game-ui-timer.js loaded');
        }
    }

    constructor(ui) {
        this.ui = ui;
        this.whiteTime = 0;
        this.blackTime = 0;
        this.gameStartTime = null;
        this.timerInterval = null;
        this.isTimerRunning = false;
        
        if (this.constructor.consoleLog) {
            console.log('⏱️ ChessTimerManager initialisé');
            console.log(`  - UI: ${ui ? '✓' : '✗'}`);
            console.log(`  - Timers: Blanc=${this.whiteTime}s, Noir=${this.blackTime}s`);
            console.log(`  - État initial: ${this.isTimerRunning ? 'En cours' : 'Arrêté'}`);
        }
    }

    startTimer() {
        if (this.constructor.consoleLog) {
            console.log('\n⏱️ Démarrage du timer');
            console.log(`  - Timer actuellement: ${this.timerInterval ? 'en cours' : 'arrêté'}`);
            console.log(`  - Jeu actif: ${this.ui.game.gameState.gameActive ? '✓' : '✗'}`);
            console.log(`  - Joueur courant: ${this.ui.game.gameState.currentPlayer}`);
        }
        
        if (this.timerInterval) {
            if (this.constructor.consoleLog) {
                console.log('  ⚠️ Timer déjà en cours, arrêt préalable...');
            }
            this.stopTimer();
        }
        
        if (!this.ui.game.gameState.gameActive) {
            if (this.constructor.consoleLog) {
                console.log('  ❌ Timer non démarré - jeu non actif');
                console.log(`  - Statut jeu: ${this.ui.game.gameState.gameStatus || 'indéfini'}`);
            }
            return;
        }
        
        this.gameStartTime = Date.now();
        this.isTimerRunning = true;
        
        if (this.constructor.consoleLog) {
            console.log(`  - Heure de début: ${new Date(this.gameStartTime).toLocaleTimeString()}`);
            console.log(`  - Timer démarré pour: ${this.ui.game.gameState.currentPlayer}`);
        }
        
        this.timerInterval = setInterval(() => {
            if (!this.ui.game.gameState.gameActive) {
                if (this.constructor.consoleLog && this.constructor.consoleLog) {
                    console.log('    ⚠️ Jeu non actif, arrêt du timer...');
                }
                this.stopTimer();
                return;
            }
            
            const currentPlayer = this.ui.game.gameState.currentPlayer;
            
            if (currentPlayer === 'white') {
                this.whiteTime++;
                if (this.constructor.consoleLog && this.constructor.consoleLog) {
                    console.log(`    ⏱️ +1s Blanc: ${this.whiteTime}s total`);
                }
            } else {
                this.blackTime++;
                if (this.constructor.consoleLog && this.constructor.consoleLog) {
                    console.log(`    ⏱️ +1s Noir: ${this.blackTime}s total`);
                }
            }
            
            this.updateTimerDisplay();
            
        }, 1000);
        
        if (this.constructor.consoleLog) {
            console.log('  ✅ Timer démarré avec succès');
            console.log(`  - Interval ID: ${this.timerInterval ? 'défini' : 'non défini'}`);
            console.log(`  - Fréquence: 1000ms (1 seconde)`);
        }
    }

    stopTimer() {
        if (this.constructor.consoleLog) {
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
            
            if (this.constructor.consoleLog) {
                console.log('  ✅ Intervalle effacé');
            }
        }
        
        this.isTimerRunning = false;
        
        if (this.constructor.consoleLog) {
            console.log('  ✅ Timer arrêté');
        }
    }

    resumeTimer() {
        if (this.constructor.consoleLog) {
            console.log('\n⏱️ Reprise du timer');
            console.log(`  - Jeu actif: ${this.ui.game.gameState.gameActive ? '✓' : '✗'}`);
            console.log(`  - Timer en cours: ${this.isTimerRunning ? '✓' : '✗'}`);
        }
        
        if (this.ui.game.gameState.gameActive && !this.isTimerRunning) {
            if (this.constructor.consoleLog) {
                console.log('  ✅ Conditions remplies, redémarrage...');
            }
            this.startTimer();
            
            if (this.constructor.consoleLog) {
                console.log('  ✅ Timer repris');
            }
        } else {
            if (this.constructor.consoleLog) {
                console.log('  ⚠️ Timer non repris: conditions non remplies');
                if (!this.ui.game.gameState.gameActive) {
                    console.log('    - Jeu non actif');
                }
                if (this.isTimerRunning) {
                    console.log('    - Timer déjà en cours');
                }
            }
        }
    }

    resetTimers() {
        if (this.constructor.consoleLog) {
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
        
        if (this.constructor.consoleLog) {
            console.log(`  - Après: Blanc=${this.whiteTime}s, Noir=${this.blackTime}s`);
            console.log(`  - Temps effacé: Blanc ${previousWhite}s, Noir ${previousBlack}s`);
        }
        
        this.updateTimerDisplay();
        
        if (this.constructor.consoleLog) {
            console.log('  ✅ Timers réinitialisés');
            console.log('  ✅ Affichage mis à jour');
        }
    }

    updateTimerDisplay() {
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log('\n    ⏱️ Mise à jour de l\'affichage des timers');
        }
        
        const whiteTimerElement = document.getElementById('whiteTime');
        const blackTimerElement = document.getElementById('blackTime');
        
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`    - Élément Blanc: ${whiteTimerElement ? '✓' : '✗'}`);
            console.log(`    - Élément Noir: ${blackTimerElement ? '✓' : '✗'}`);
        }
        
        if (whiteTimerElement) {
            const whiteFormatted = this.formatTime(this.whiteTime);
            whiteTimerElement.textContent = whiteFormatted;
            
            if (this.ui.game.gameState.currentPlayer === 'white') {
                whiteTimerElement.style.fontWeight = 'bold';
                whiteTimerElement.style.color = '#28a745';
                
                if (this.constructor.consoleLog && this.constructor.consoleLog) {
                    console.log(`    - Blanc [${whiteFormatted}]: actif (gras, vert)`);
                }
            } else {
                whiteTimerElement.style.fontWeight = 'normal';
                whiteTimerElement.style.color = '';
                
                if (this.constructor.consoleLog && this.constructor.consoleLog) {
                    console.log(`    - Blanc [${whiteFormatted}]: inactif`);
                }
            }
        } else if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`    ⚠️ Élément whiteTime non trouvé`);
        }
        
        if (blackTimerElement) {
            const blackFormatted = this.formatTime(this.blackTime);
            blackTimerElement.textContent = blackFormatted;
            
            if (this.ui.game.gameState.currentPlayer === 'black') {
                blackTimerElement.style.fontWeight = 'bold';
                blackTimerElement.style.color = '#28a745';
                
                if (this.constructor.consoleLog && this.constructor.consoleLog) {
                    console.log(`    - Noir [${blackFormatted}]: actif (gras, vert)`);
                }
            } else {
                blackTimerElement.style.fontWeight = 'normal';
                blackTimerElement.style.color = '';
                
                if (this.constructor.consoleLog && this.constructor.consoleLog) {
                    console.log(`    - Noir [${blackFormatted}]: inactif`);
                }
            }
        } else if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`    ⚠️ Élément blackTime non trouvé`);
        }
    }

    formatTime(seconds) {
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`      Formatage: ${seconds} secondes`);
        }
        
        if (seconds < 0) {
            if (this.constructor.consoleLog && this.constructor.consoleLog) {
                console.warn(`      ⚠️ Temps négatif: ${seconds}s`);
            }
            seconds = 0;
        }
        
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`      Résultat: ${formatted} (${mins}m ${secs}s)`);
        }
        
        return formatted;
    }

    // Méthode utilitaire pour obtenir les statistiques des timers
    getTimerStats() {
        const stats = {
            whiteTime: this.whiteTime,
            blackTime: this.blackTime,
            totalTime: this.whiteTime + this.blackTime,
            isRunning: this.isTimerRunning,
            currentPlayer: this.ui.game.gameState.currentPlayer,
            gameActive: this.ui.game.gameState.gameActive,
            elapsedSinceStart: this.gameStartTime ? Date.now() - this.gameStartTime : 0
        };
        
        if (this.constructor.consoleLog) {
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
}

// Initialisation statique
ChessTimerManager.init();

window.ChessTimerManager = ChessTimerManager;