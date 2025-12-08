// core/bot-manager.js - Version corrigée
class BotManager {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('core/bot-manager.js loaded');
        }
    }

    constructor(chessGame) {
        this.chessGame = chessGame;
        this.bot = null;
        this.botLevel = 0;
        this.isBotThinking = false;
        this.botColor = 'black';
        this.moveCount = 0;
        this.maxRetries = 3;
        this.retryCount = 0;
        
        if (this.constructor.consoleLog) {
            console.log('🤖 [BotManager] Gestionnaire de bot initialisé');
        }
    }

    setBotLevel(level, color = 'black') {
        if (this.constructor.consoleLog) {
            console.log(`\n⚙️ [BotManager] === CONFIGURATION DU BOT ===`);
            console.log(`⚙️ [BotManager] Niveau demandé: ${level}, Couleur: ${color}`);
            console.log(`⚙️ [BotManager] Bot actuel: niveau ${this.botLevel}, couleur ${this.botColor}`);
        }
        
        // Convertir en nombre
        level = parseInt(level);
        
        if (isNaN(level)) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [BotManager] Niveau invalide: ${level}`);
            }
            return null;
        }
        
        this.botLevel = level;
        this.botColor = color;
        this.moveCount = 0;
        this.retryCount = 0;
        
        // Désactiver le bot actuel
        this.bot = null;
        
        // Créer le nouveau bot selon le niveau
        if (level === 0) {
            if (this.constructor.consoleLog) {
                console.log(`🔴 [BotManager] Bot désactivé`);
            }
        } else if (level === 1) {
            // Niveau 1 = Level_1 (aléatoire)
            if (window.Level_1) {
                this.bot = new Level_1();
                if (this.constructor.consoleLog) {
                    console.log(`🟢 [BotManager] Bot Level 1 activé (Level_1 - aléatoire)`);
                    console.log(`🎨 [BotManager] Bot joue les ${color === 'white' ? 'Blancs' : 'Noirs'}`);
                    console.log(`🤖 [BotManager] Nom: ${this.bot.name}`);
                }
            } else {
                if (this.constructor.consoleLog) {
                    console.log(`❌ [BotManager] Classe Level_1 non trouvée`);
                }
            }
        } else if (level === 2) {
            // Niveau 2 = Level_2 (CCMO)
            if (window.Level_2) {
                this.bot = new Level_2();
                if (this.constructor.consoleLog) {
                    console.log(`🟢 [BotManager] Bot Level 2 activé (Level_2 - CCMO)`);
                    console.log(`🎨 [BotManager] Bot joue les ${color === 'white' ? 'Blancs' : 'Noirs'}`);
                    console.log(`🤖 [BotManager] Nom: ${this.bot.name}`);
                    console.log(`🎯 [BotManager] Stratégie: Check → Capture → Menace → Optimisation`);
                }
            } else {
                if (this.constructor.consoleLog) {
                    console.log(`❌ [BotManager] Classe Level_2 non trouvée`);
                }
            }
        } else {
            if (this.constructor.consoleLog) {
                console.log(`❌ [BotManager] Niveau de bot inconnu: ${level}`);
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log(`📊 [BotManager] Configuration finale: niveau=${this.botLevel}, couleur=${this.botColor}`);
        }
        
        // Si c'est le tour du bot, le faire jouer après un délai
        setTimeout(() => {
            const isTurn = this.isBotTurn();
            if (this.constructor.consoleLog) {
                console.log(`🤔 [BotManager] Vérification tour bot après délai: ${isTurn ? '✅ OUI' : '❌ NON'}`);
            }
            
            if (isTurn) {
                if (this.constructor.consoleLog) {
                    console.log(`🎯 [BotManager] C'est le tour du bot, déclenchement du coup...`);
                }
                this.playBotMove();
            } else {
                const currentPlayer = this.chessGame?.gameState?.currentPlayer || 'inconnu';
                if (this.constructor.consoleLog) {
                    console.log(`⏳ [BotManager] Pas le tour du bot (joueur: ${currentPlayer})`);
                }
            }
        }, 1000);
        
        if (this.constructor.consoleLog) {
            console.log(`✅ [BotManager] === FIN CONFIGURATION ===\n`);
        }
        
        return this.bot;
    }

    isBotTurn() {
        try {
            // Vérifications de base
            if (!this.chessGame || !this.chessGame.gameState) {
                if (this.constructor.consoleLog) {
                    console.log(`❌ [BotManager] Jeu ou gameState non disponible`);
                }
                return false;
            }
            
            if (!this.bot || this.botLevel === 0 || this.isBotThinking) {
                return false;
            }
            
            const gameActive = this.chessGame.gameState.gameActive;
            const currentPlayer = this.chessGame.gameState.currentPlayer;
            const isTurn = gameActive && currentPlayer === this.botColor;
            
            if (this.constructor.consoleLog && this.botLevel > 0) {
                const turnStatus = isTurn ? '✅ OUI' : '❌ NON';
                console.log(`🔄 [BotManager] Tour bot? ${turnStatus}`);
                console.log(`   • Jeu actif: ${gameActive ? '✅' : '❌'}`);
                console.log(`   • Joueur actuel: ${currentPlayer}`);
                console.log(`   • Couleur bot: ${this.botColor}`);
                console.log(`   • Bot niveau: ${this.botLevel}`);
                console.log(`   • En réflexion: ${this.isBotThinking ? '🤔' : '💤'}`);
            }
            
            return isTurn;
            
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [BotManager] Erreur dans isBotTurn: ${error.message}`);
            }
            return false;
        }
    }

    async playBotMove() {
        if (this.constructor.consoleLog) {
            console.log(`\n🤖 [BotManager] === DÉBUT DU TOUR DU BOT ===`);
            console.log(`🤖 [BotManager] Niveau: ${this.botLevel}, Couleur: ${this.botColor}`);
            console.log(`🤖 [BotManager] En réflexion: ${this.isBotThinking ? 'OUI ⏳' : 'NON ✅'}`);
        }
        
        // Vérifications initiales
        if (this.isBotThinking) {
            if (this.constructor.consoleLog) {
                console.log(`🚫 [BotManager] Bot déjà en train de penser - annulation`);
            }
            return;
        }
        
        const currentPlayerBefore = this.chessGame.gameState.currentPlayer;
        if (this.constructor.consoleLog) {
            console.log(`🔄 [BotManager] Joueur avant vérification: ${currentPlayerBefore}`);
            console.log(`🤖 [BotManager] Couleur bot: ${this.botColor}`);
        }
        
        if (!this.isBotTurn()) {
            if (this.constructor.consoleLog) {
                console.log(`🚫 [BotManager] Pas le tour du bot`);
                console.log(`   • Joueur actuel: ${currentPlayerBefore}`);
                console.log(`   • Couleur bot: ${this.botColor}`);
                console.log(`   • Vérification tour: ${this.isBotTurn() ? '✅' : '❌'}`);
            }
            return;
        }
        
        this.isBotThinking = true;
        this.moveCount++;
        if (this.constructor.consoleLog) {
            console.log(`🧠 [BotManager] Bot commence à penser... (coup ${this.moveCount})`);
            console.log(`⏱️ [BotManager] Temps de réflexion: 50-200ms`);
        }
        
        try {
            // Temps de réflexion très court (50-200ms) pour éviter le problème
            const thinkTime = 50 + Math.random() * 150;
            await new Promise(resolve => setTimeout(resolve, thinkTime));
            
            // Vérifier immédiatement avant de continuer
            const currentPlayerNow = this.chessGame.gameState.currentPlayer;
            if (this.constructor.consoleLog) {
                console.log(`🔄 [BotManager] Après réflexion: joueur=${currentPlayerNow}`);
                console.log(`   • Période de réflexion: ${thinkTime.toFixed(0)}ms`);
            }
            
            if (currentPlayerNow !== this.botColor) {
                if (this.constructor.consoleLog) {
                    console.log(`⚠️ [BotManager] Plus le tour du bot après réflexion`);
                    console.log(`   • Attendu: ${this.botColor}`);
                    console.log(`   • Actuel: ${currentPlayerNow}`);
                }
                this.isBotThinking = false;
                return;
            }
            
            // Générer le FEN
            const currentFEN = FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board);
            if (this.constructor.consoleLog) {
                console.log(`📋 [BotManager] FEN actuel: ${currentFEN.substring(0, 50)}...`);
            }
            
            // Demander un coup au bot
            const botMove = this.bot.getMove(currentFEN);
            
            if (!botMove) {
                if (this.constructor.consoleLog) {
                    console.log(`❌ [BotManager] Bot n'a pas trouvé de coup`);
                }
                this.retryCount++;
                this.isBotThinking = false;
                
                if (this.retryCount < this.maxRetries) {
                    if (this.constructor.consoleLog) {
                        console.log(`🔄 [BotManager] Réessai ${this.retryCount}/${this.maxRetries}...`);
                    }
                    setTimeout(() => {
                        if (this.isBotTurn()) {
                            this.playBotMove();
                        }
                    }, 100);
                } else {
                    if (this.constructor.consoleLog) {
                        console.log(`🚫 [BotManager] Nombre maximum de tentatives atteint (${this.maxRetries})`);
                    }
                }
                return;
            }
            
            if (this.constructor.consoleLog) {
                console.log(`🎯 [BotManager] Coup proposé par le bot:`);
                console.log(`   • Départ: [${botMove.fromRow},${botMove.fromCol}]`);
                console.log(`   • Arrivée: [${botMove.toRow},${botMove.toCol}]`);
                if (botMove.piece) {
                    console.log(`   • Pièce: ${botMove.piece.type} (${botMove.piece.color})`);
                }
                
                // Convertir en notation échecs
                const colToLetter = col => String.fromCharCode(97 + col);
                const rowToNumber = row => 8 - row;
                console.log(`   📝 Notation: ${colToLetter(botMove.fromCol)}${rowToNumber(botMove.fromRow)} → ${colToLetter(botMove.toCol)}${rowToNumber(botMove.toRow)}`);
            }
            
            // Jouer le coup
            const success = this.chessGame.handleMove(
                botMove.fromRow, 
                botMove.fromCol, 
                botMove.toRow, 
                botMove.toCol
            );
            
            if (!success) {
                if (this.constructor.consoleLog) {
                    console.log(`❌ [BotManager] Coup du bot échoué`);
                }
                this.retryCount++;
                this.isBotThinking = false;
                
                if (this.retryCount < this.maxRetries) {
                    if (this.constructor.consoleLog) {
                        console.log(`🔄 [BotManager] Réessai après échec ${this.retryCount}/${this.maxRetries}...`);
                    }
                    setTimeout(() => {
                        if (this.isBotTurn()) {
                            this.playBotMove();
                        }
                    }, 100);
                }
                return;
            }
            
            if (this.constructor.consoleLog) {
                console.log(`✅ [BotManager] Coup du bot réussi!`);
                console.log(`📊 [BotManager] Coups joués: ${this.moveCount}`);
                console.log(`🔄 [BotManager] Tentatives réinitialisées: ${this.retryCount} → 0`);
            }
            this.retryCount = 0; // Réinitialiser le compteur d'erreurs
            
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [BotManager] Erreur lors du tour du bot: ${error.message}`);
                console.error('BotManager error:', error);
            }
        } finally {
            // TOUJOURS libérer le verrou
            this.isBotThinking = false;
            if (this.constructor.consoleLog) {
                console.log(`✅ [BotManager] Verrou de réflexion libéré`);
                console.log(`🤖 [BotManager] === FIN DU TOUR DU BOT ===\n`);
            }
        }
    }

    setBotColor(color) {
        if (this.constructor.consoleLog) {
            console.log(`\n🎨 [BotManager] === CHANGEMENT DE COULEUR ===`);
            console.log(`🎨 [BotManager] Ancienne couleur: ${this.botColor}`);
            console.log(`🎨 [BotManager] Nouvelle couleur: ${color}`);
        }
        
        this.botColor = color;
        this.retryCount = 0; // Réinitialiser les tentatives
        
        // Si c'est maintenant son tour, jouer
        setTimeout(() => {
            if (this.isBotTurn()) {
                if (this.constructor.consoleLog) {
                    console.log(`🎯 [BotManager] Nouvelle couleur, déclenchement du coup...`);
                }
                this.playBotMove();
            } else {
                if (this.constructor.consoleLog) {
                    console.log(`⏳ [BotManager] Pas le tour du bot avec la nouvelle couleur`);
                }
            }
        }, 300);
        
        if (this.constructor.consoleLog) {
            console.log(`✅ [BotManager] === FIN CHANGEMENT DE COULEUR ===\n`);
        }
    }

    getBotStatus() {
        const botType = this.botLevel === 0 ? 'Inactif' :
                      this.botLevel === 1 ? 'Level_1 (Aléatoire)' :
                      this.botLevel === 2 ? 'Level_2 (CCMO)' :
                      'Inconnu';
        
        const status = {
            active: this.botLevel > 0,
            level: this.botLevel,
            color: this.botColor,
            thinking: this.isBotThinking,
            name: this.bot ? this.bot.name : 'Aucun',
            type: botType,
            moveCount: this.moveCount,
            retryCount: this.retryCount,
            maxRetries: this.maxRetries,
            isBotTurn: this.isBotTurn()
        };
        
        if (this.constructor.consoleLog) {
            console.log(`📊 [BotManager] Statut du bot:`, status);
        }
        
        return status;
    }

    reactivateBot() {
        if (this.constructor.consoleLog) {
            console.log(`\n🔄 [BotManager] === RÉACTIVATION DU BOT ===`);
            console.log(`🔄 [BotManager] Niveau: ${this.botLevel}, Couleur: ${this.botColor}`);
        }
        
        if (this.botLevel > 0) {
            this.setBotLevel(this.botLevel, this.botColor);
        }
        
        if (this.constructor.consoleLog) {
            console.log(`✅ [BotManager] === FIN RÉACTIVATION ===\n`);
        }
    }

    forcePlay() {
        if (this.constructor.consoleLog) {
            console.log(`\n⚡ [BotManager] === FORÇAGE DU COUP ===`);
            console.log(`⚡ [BotManager] Bot actif: ${this.bot && this.botLevel > 0 ? '✅ OUI' : '❌ NON'}`);
        }
        
        if (this.bot && this.botLevel > 0) {
            if (this.constructor.consoleLog) {
                console.log(`⚡ [BotManager] Lancement du coup forcé...`);
            }
            this.playBotMove();
        } else {
            if (this.constructor.consoleLog) {
                console.log(`❌ [BotManager] Bot non activé - impossible de forcer le coup`);
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log(`✅ [BotManager] === FIN FORÇAGE ===\n`);
        }
    }
    
    // Méthode de debug
    debug() {
        if (this.constructor.consoleLog) {
            console.group('🐛 [BotManager] Debug');
            console.log('Niveau:', this.botLevel);
            console.log('Couleur:', this.botColor);
            console.log('En réflexion:', this.isBotThinking);
            console.log('Nombre de coups:', this.moveCount);
            console.log('Tentatives:', this.retryCount);
            console.log('Instance bot:', this.bot);
            console.log('Tour du bot?', this.isBotTurn() ? '✅ OUI' : '❌ NON');
            
            if (this.chessGame && this.chessGame.gameState) {
                console.log('Joueur actuel:', this.chessGame.gameState.currentPlayer);
                console.log('Jeu actif:', this.chessGame.gameState.gameActive);
            }
            console.groupEnd();
        }
    }
}

// Initialisation statique
BotManager.init();

window.BotManager = BotManager;