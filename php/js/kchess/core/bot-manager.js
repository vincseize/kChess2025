// core/bot-manager.js - Version corrigée
class BotManager {
    constructor(chessGame) {
        this.chessGame = chessGame;
        this.bot = null;
        this.botLevel = 0;
        this.isBotThinking = false;
        this.botColor = 'black';
        this.moveCount = 0;
        this.maxRetries = 3;
        this.retryCount = 0;
        
        console.log('🤖 BotManager initialized');
    }

    setBotLevel(level, color = 'black') {
        console.log(`🤖 setBotLevel: level=${level}, color=${color}`);
        
        // Convertir en nombre
        level = parseInt(level);
        
        if (isNaN(level)) {
            console.error('❌ Niveau invalide:', level);
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
            console.log('🤖 Bot désactivé');
        } else if (level === 1) {
            // Niveau 1 = Level_0 (aléatoire)
            if (window.Level_0) {
                this.bot = new Level_0();
                console.log(`🤖 Bot Level 1 activé (Level_0 - aléatoire) - joue les ${color}`);
            } else {
                console.error('❌ Level_0 class not found');
            }
        } else if (level === 2) {
            // Niveau 2 = Level_1 (CCMO)
            if (window.Level_1) {
                this.bot = new Level_1();
                console.log(`🤖 Bot Level 2 activé (Level_1 - CCMO) - joue les ${color}`);
            } else {
                console.error('❌ Level_1 class not found');
            }
        } else {
            console.error(`❌ Niveau de bot inconnu: ${level}`);
        }
        
        // Si c'est le tour du bot, le faire jouer après un délai
        setTimeout(() => {
            if (this.isBotTurn()) {
                console.log('🤖 C\'est le tour du bot, déclenchement...');
                this.playBotMove();
            } else {
                console.log(`🤖 Pas le tour du bot (joueur: ${this.chessGame.gameState.currentPlayer})`);
            }
        }, 1000);
        
        return this.bot;
    }

    isBotTurn() {
        try {
            // Vérifications de base
            if (!this.chessGame || !this.chessGame.gameState) {
                return false;
            }
            
            if (!this.bot || this.botLevel === 0 || this.isBotThinking) {
                return false;
            }
            
            const gameActive = this.chessGame.gameState.gameActive;
            const currentPlayer = this.chessGame.gameState.currentPlayer;
            const isTurn = gameActive && currentPlayer === this.botColor;
            
            return isTurn;
            
        } catch (error) {
            console.error('❌ Error in isBotTurn:', error);
            return false;
        }
    }

    async playBotMove() {
        console.log(`🤖 playBotMove called. Level: ${this.botLevel}, Thinking: ${this.isBotThinking}`);
        
        // Vérifications initiales
        if (this.isBotThinking) {
            console.log('🚫 Bot déjà en train de penser');
            return;
        }
        
        const currentPlayerBefore = this.chessGame.gameState.currentPlayer;
        console.log(`🤖 Vérification tour: joueur=${currentPlayerBefore}, bot=${this.botColor}`);
        
        if (!this.isBotTurn()) {
            console.log(`🚫 Pas le tour du bot. Joueur: ${currentPlayerBefore}, Bot: ${this.botColor}`);
            return;
        }
        
        this.isBotThinking = true;
        this.moveCount++;
        console.log(`🤖 Bot commence à penser (move ${this.moveCount})...`);
        
        try {
            // Temps de réflexion très court (50-200ms) pour éviter le problème
            const thinkTime = 50 + Math.random() * 150;
            await new Promise(resolve => setTimeout(resolve, thinkTime));
            
            // Vérifier immédiatement avant de continuer
            const currentPlayerNow = this.chessGame.gameState.currentPlayer;
            console.log(`🤖 Après réflexion: joueur=${currentPlayerNow}`);
            
            if (currentPlayerNow !== this.botColor) {
                console.log('🤖 Plus le tour du bot après réflexion');
                this.isBotThinking = false;
                return;
            }
            
            // Générer le FEN
            const currentFEN = FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board);
            
            // Demander un coup au bot
            const botMove = this.bot.getMove(currentFEN);
            
            if (!botMove) {
                console.error('❌ Bot n\'a pas trouvé de coup');
                this.retryCount++;
                this.isBotThinking = false;
                
                if (this.retryCount < this.maxRetries) {
                    setTimeout(() => {
                        if (this.isBotTurn()) {
                            console.log(`🔄 Réessai ${this.retryCount}/${this.maxRetries}...`);
                            this.playBotMove();
                        }
                    }, 100);
                }
                return;
            }
            
            console.log(`🤖 Bot joue: ${botMove.fromRow},${botMove.fromCol} → ${botMove.toRow},${botMove.toCol}`);
            
            // Jouer le coup
            const success = this.chessGame.handleMove(
                botMove.fromRow, 
                botMove.fromCol, 
                botMove.toRow, 
                botMove.toCol
            );
            
            if (!success) {
                console.error('❌ Coup du bot échoué');
                this.retryCount++;
                this.isBotThinking = false;
                
                if (this.retryCount < this.maxRetries) {
                    setTimeout(() => {
                        if (this.isBotTurn()) {
                            console.log(`🔄 Réessai après échec ${this.retryCount}/${this.maxRetries}...`);
                            this.playBotMove();
                        }
                    }, 100);
                }
                return;
            }
            
            console.log('✅ Coup du bot réussi!');
            this.retryCount = 0; // Réinitialiser le compteur d'erreurs
            
        } catch (error) {
            console.error('❌ Erreur du bot:', error);
        } finally {
            // TOUJOURS libérer le verrou
            this.isBotThinking = false;
        }
    }

    setBotColor(color) {
        console.log(`🤖 setBotColor: ${color}`);
        this.botColor = color;
        this.retryCount = 0; // Réinitialiser les tentatives
        
        // Si c'est maintenant son tour, jouer
        setTimeout(() => {
            if (this.isBotTurn()) {
                console.log('🤖 Nouvelle couleur, déclenchement...');
                this.playBotMove();
            }
        }, 300);
    }

    getBotStatus() {
        const botType = this.botLevel === 0 ? 'Inactif' :
                      this.botLevel === 1 ? 'Level_0 (Aléatoire)' :
                      this.botLevel === 2 ? 'Level_1 (CCMO)' :
                      'Inconnu';
        
        return {
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
    }

    reactivateBot() {
        console.log('🤖 Réactivation du bot');
        if (this.botLevel > 0) {
            this.setBotLevel(this.botLevel, this.botColor);
        }
    }

    forcePlay() {
        console.log('🤖 Forçage du coup du bot');
        if (this.bot && this.botLevel > 0) {
            this.playBotMove();
        }
    }
    
    // Méthode de debug
    debug() {
        console.group('🤖 Bot Debug');
        console.log('Level:', this.botLevel);
        console.log('Color:', this.botColor);
        console.log('Thinking:', this.isBotThinking);
        console.log('Move Count:', this.moveCount);
        console.log('Retry Count:', this.retryCount);
        console.log('Bot instance:', this.bot);
        console.log('Is bot turn:', this.isBotTurn());
        
        if (this.chessGame && this.chessGame.gameState) {
            console.log('Current player:', this.chessGame.gameState.currentPlayer);
            console.log('Game active:', this.chessGame.gameState.gameActive);
        }
        console.groupEnd();
    }
}

window.BotManager = BotManager;