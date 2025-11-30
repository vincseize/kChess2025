// bot-manager.js - Gestion centralisée des bots (CORRIGÉ)
class BotManager {
    constructor(chessGame) {
        this.chessGame = chessGame;
        this.bot = null;
        this.botLevel = 0;
        this.isBotThinking = false;
        this.botColor = 'black';
        
        console.log('🤖 BotManager initialized');
    }

    setBotLevel(level, color = 'black') {
        this.botLevel = level;
        this.botColor = color;
        
        if (level === 0) {
            this.bot = null;
            console.log('🤖 Bot désactivé');
        } else if (level === 1) {
            this.bot = new Level_0();
            console.log(`🤖 Bot Level 0 activé (joue les ${color})`);
        }
        
        if (this.isBotTurn()) {
            console.log('🤖 C\'est au tour du bot de jouer, déclenchement automatique...');
            this.playBotMove();
        }
        
        return this.bot;
    }

    isBotTurn() {
        return this.bot && 
               this.botLevel > 0 && 
               !this.isBotThinking && 
               this.chessGame.gameState.gameActive &&
               this.chessGame.gameState.currentPlayer === this.botColor;
    }

// Dans bot-manager.js - CORRIGER playBotMove
async playBotMove() {
    if (!this.isBotTurn() || this.isBotThinking) {
        console.log('🚫 Bot cannot play now - not its turn or thinking');
        return;
    }
    
    this.isBotThinking = true;
    console.log('🤖 Bot thinking...');
    
    try {
        const thinkTime = 500 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, thinkTime));
        
        const currentFEN = FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board);
        const botMove = this.bot.getMove(currentFEN);
        
        if (botMove) {
            console.log('🤖 Bot playing move:', botMove);
            
            // CORRECTION : Utiliser this.chessGame.handleMove() qui existe maintenant
            const success = this.chessGame.handleMove(
                botMove.fromRow, 
                botMove.fromCol, 
                botMove.toRow, 
                botMove.toCol
            );
            
            if (!success) {
                console.error('❌ Bot move failed - move was invalid');
                // NE PAS retenter automatiquement pour éviter les boucles
            }
        } else {
            console.error('❌ Bot returned no move');
        }
        
    } catch (error) {
        console.error('❌ Bot error:', error);
    } finally {
        this.isBotThinking = false;
        
        // CORRECTION : Supprimer la relance automatique qui cause la boucle
        // Le bot sera rappelé naturellement par updateGameStatus si c'est encore son tour
    }
}

// SUPPRIMER ou COMMENTER la méthode retryBotMove qui cause des problèmes
/*
async retryBotMove(currentFEN) {
    // Cette méthode cause des boucles infinies - la supprimer
    console.log('🔄 Bot retry disabled to prevent infinite loops');
}
*/

    // async retryBotMove(currentFEN) {
    //     console.log('🔄 Bot retrying with different move...');
        
    //     try {
    //         // Régénérer un nouveau coup
    //         const newMove = this.bot.getMove(currentFEN);
            
    //         if (newMove) {
    //             console.log('🤖 Bot retry move:', newMove);
                
    //             // CORRECTION : Utiliser this.chessGame.handleMove() ici aussi
    //             const success = this.chessGame.handleMove(
    //                 newMove.fromRow, 
    //                 newMove.fromCol, 
    //                 newMove.toRow, 
    //                 newMove.toCol
    //             );
                
    //             if (!success) {
    //                 console.error('❌ Bot retry move also failed');
    //             }
    //         } else {
    //             console.error('❌ Bot could not generate a retry move');
    //         }
    //     } catch (error) {
    //         console.error('❌ Bot retry error:', error);
    //     }
    // }

    setBotColor(color) {
        if (color !== this.botColor) {
            this.botColor = color;
            console.log(`🤖 Bot color changed to: ${color}`);
            
            if (this.isBotTurn()) {
                this.playBotMove();
            }
        }
    }

    getBotStatus() {
        return {
            active: this.botLevel > 0,
            level: this.botLevel,
            color: this.botColor,
            thinking: this.isBotThinking,
            name: this.bot ? this.bot.name : 'Aucun'
        };
    }

    reactivateBot() {
        if (this.botLevel > 0) {
            console.log('🤖 Réactivation du bot pour la nouvelle partie');
            this.setBotLevel(this.botLevel, this.botColor);
        }
    }

    // Méthode pour forcer le bot à jouer (debug)
    forcePlay() {
        if (this.bot && this.botLevel > 0) {
            console.log('🤖 Forçage du coup du bot');
            this.playBotMove();
        } else {
            console.log('❌ Bot non activé');
        }
    }
}

window.BotManager = BotManager;