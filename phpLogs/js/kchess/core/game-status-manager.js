// core/game-status-manager.js - VERSION FINALE CORRIGÉE (ORDRE ET HANDLEMATE)
class GameStatusManager {
    
    static consoleLog = true;
    
    static init() {
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('🛡️ GameStatusManager chargé - VERSION FINALE CORRIGÉE');
        }
    }
    
    static loadConfig() {
        try {
            if (window.appConfig?.chess_engine?.console_log !== undefined) {
                const val = window.appConfig.chess_engine.console_log;
                this.consoleLog = val === "false" ? false : Boolean(val);
            }
            else if (window.appConfig?.debug?.console_log !== undefined) {
                const val = window.appConfig.debug.console_log;
                this.consoleLog = val === "false" ? false : Boolean(val);
            }
            return true;
        } catch (error) {
            console.error('❌ GameStatusManager config error:', error);
            return false;
        }
    }

    constructor(chessGame) {
        this.chessGame = chessGame;
        this.lastCheckAlert = null;
        
        if (GameStatusManager.consoleLog) {
            console.log('🛡️ [GameStatusManager] Initialisé avec ordre corrigé');
        }
    }

    // ✅✅✅ MÉTHODE PRINCIPALE CORRIGÉE
    updateGameStatus() {
        if (GameStatusManager.consoleLog) {
            console.log('\n🔍 [GameStatusManager] === VÉRIFICATION STATUT ===');
            console.log('🔍 [GameStatusManager] ORDRE CORRECT: 1. Mat → 2. Pat → 3. Nulle → 4. Échec');
        }
        
        // Nettoyer les surbrillances
        this.chessGame.board.squares.forEach(square => {
            square.element.classList.remove('king-in-check', 'checkmate', 'stalemate');
        });

        // NOTE: FENGenerator et ChessMateEngine doivent être définis globalement ou importés
        if (typeof FENGenerator === 'undefined' || typeof ChessMateEngine === 'undefined') {
            console.error('FATAL: FENGenerator ou ChessMateEngine manquant. Arrêt de la vérification du statut.');
            return;
        }

        const currentFEN = FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board);
        
        if (GameStatusManager.consoleLog) {
            console.log(`📄 FEN actuel: ${currentFEN}`);
            console.log(`📊 Tour actuel: ${this.chessGame.gameState.currentPlayer}`);
        }
        
        // ✅✅✅ ORDRE CORRECT DES VÉRIFICATIONS
        
        // 1. VÉRIFIER ÉCHEC ET MAT D'ABORD (PRIORITÉ ABSOLUE)
        if (GameStatusManager.consoleLog) {
            console.log('\n🔍 ÉTAPE 1: Vérification échec et mat');
        }
        
        // La couleur matée est la couleur qui doit jouer
        const checkmateStatus = this.checkForCheckmate(currentFEN);
        if (checkmateStatus.found) {
            if (GameStatusManager.consoleLog) {
                console.log('💀 ÉCHEC ET MAT détecté pour', checkmateStatus.color);
            }
            this.handleCheckmate(checkmateStatus.color);
            return; // ARRÊTER ICI
        }
        
        // 2. VÉRIFIER PAT (seulement si pas de mat)
        if (GameStatusManager.consoleLog) {
            console.log('\n🔍 ÉTAPE 2: Vérification pat');
        }
        
        // La couleur patée est la couleur qui doit jouer
        const stalemateStatus = this.checkForStalemate(currentFEN);
        if (stalemateStatus.found) {
            if (GameStatusManager.consoleLog) {
                console.log('⚖️ PAT détecté pour', stalemateStatus.color);
            }
            this.handleStalemate(stalemateStatus.color);
            return; // ARRÊTER ICI
        }
        
        // 3. VÉRIFIER AUTRES NULLITÉS (optionnel: 50 coups, répétition, matériel insuffisant)
        const drawResult = this.checkForDraw(currentFEN);
        if (drawResult.isDraw) {
            if (GameStatusManager.consoleLog) {
                console.log('🤝 NULLITÉ détectée:', drawResult.reason);
            }
            this.handleDraw(drawResult.reason);
            return; // ARRÊTER ICI
        }
        
        // 4. VÉRIFIER ÉCHEC SIMPLE (seulement si pas mat/pat/nulle)
        if (GameStatusManager.consoleLog) {
            console.log('\n🔍 ÉTAPE 4: Vérification échec simple');
        }
        
        const checkStatus = this.checkForCheck(currentFEN);
        if (checkStatus.whiteInCheck) {
            this.handleCheck('white');
        }
        if (checkStatus.blackInCheck) {
            this.handleCheck('black');
        }
        
        // 5. Bot turn si jeu en cours
        if (this.chessGame.botManager && this.chessGame.botManager.isBotTurn()) {
            this.chessGame.botManager.playBotMove();
        }
    }

    // ✅ NOUVELLE MÉTHODE : Vérifier échec et mat
    checkForCheckmate(fen) {
        const engine = new ChessMateEngine(fen);
        const currentPlayer = fen.split(' ')[1];
        const color = currentPlayer === 'w' ? 'white' : 'black';
        
        // isCheckmate() doit vérifier si le joueur courant est en échec ET n'a pas de coup légal.
        const isMate = engine.isCheckmate(currentPlayer);
        
        if (GameStatusManager.consoleLog) {
            console.log(`♔ Vérification mat ${color}: ${isMate ? 'OUI' : 'NON'}`);
        }
        
        return {
            found: isMate,
            color: color
        };
    }

    // ✅ NOUVELLE MÉTHODE : Vérifier pat
    checkForStalemate(fen) {
        const engine = new ChessMateEngine(fen);
        const currentPlayer = fen.split(' ')[1];
        const color = currentPlayer === 'w' ? 'white' : 'black';
        
        // isStalemate() doit vérifier si le joueur courant N'EST PAS en échec ET n'a pas de coup légal.
        const isStale = engine.isStalemate(currentPlayer);
        
        if (GameStatusManager.consoleLog) {
            console.log(`⚖️ Vérification pat ${color}: ${isStale ? 'OUI' : 'NON'}`);
        }
        
        return {
            found: isStale,
            color: color
        };
    }

    // ✅ NOUVELLE MÉTHODE : Vérifier échec simple
    checkForCheck(fen) {
        const engine = new ChessMateEngine(fen);
        
        const whiteInCheck = engine.isKingInCheck('w');
        const blackInCheck = engine.isKingInCheck('b');
        
        if (GameStatusManager.consoleLog) {
            console.log(`⚠️ Vérification échec: blanc=${whiteInCheck}, noir=${blackInCheck}`);
        }
        
        return {
            whiteInCheck,
            blackInCheck
        };
    }

    // ✅ NOUVELLE MÉTHODE : Vérifier nullité
    checkForDraw(fen) {
        // Logique de nullité (répétition, 50 coups, matériel)
        // Ceci nécessiterait d'accéder à l'historique des FENs et de l'état du jeu.
        // Si ces vérifications ne sont pas implémentées dans ChessMateEngine, elles doivent être ajoutées ici.
        
        // Exemple de vérification (à implémenter)
        // const engine = new ChessMateEngine(fen);
        // if (engine.isThreefoldRepetition()) return { isDraw: true, reason: 'triple-répétition' };
        // if (engine.isFiftyMoveRule()) return { isDraw: true, reason: 'règle-50-coups' };
        // if (engine.isInsufficientMaterial()) return { isDraw: true, reason: 'matériel-insuffisant' };
        
        return {
            isDraw: false,
            reason: null
        };
    }

    // ✅ MÉTHODES DE TRAITEMENT
    handleCheck(kingColor) {
        const kingPos = this.findKingPosition(kingColor);
        if (kingPos) {
            const kingSquare = this.chessGame.board.getSquare(kingPos.row, kingPos.col);
            kingSquare.element.classList.add('king-in-check');
            this.showCheckAlert(kingColor);
        }
    }

    handleCheckmate(kingColor) {
        if (GameStatusManager.consoleLog) {
            console.log(`💀 TRAITEMENT MAT pour ${kingColor}`);
        }
        
        const kingPos = this.findKingPosition(kingColor);
        if (kingPos) {
            const kingSquare = this.chessGame.board.getSquare(kingPos.row, kingPos.col);
            kingSquare.element.classList.add('checkmate');
        }
        
        // Le GAGNANT est la couleur opposée au roi maté
        const winner = kingColor === 'white' ? 'black' : 'white';
        const winnerText = winner === 'white' ? 'blancs' : 'noirs';
        
        this.showNotification(
            `Échec et mat ! Les ${winnerText} gagnent !`, 
            'danger'
        );
        
        // Terminer la partie en indiquant le GAGNANT
        this.endGame(winner, 'checkmate'); 
    }

    handleStalemate(kingColor) {
        if (GameStatusManager.consoleLog) {
            console.log(`⚖️ TRAITEMENT PAT pour ${kingColor}`);
        }
        
        const kingPos = this.findKingPosition(kingColor);
        if (kingPos) {
            const kingSquare = this.chessGame.board.getSquare(kingPos.row, kingPos.col);
            kingSquare.element.classList.add('stalemate');
        }
        
        const kingText = kingColor === 'white' ? 'blanc' : 'noir';
        this.showNotification(`Pat ! Roi ${kingText} pat. Partie nulle.`, 'warning');
        
        // Terminer la partie en indiquant 'draw'
        this.endGame('draw', 'stalemate');
    }

    handleDraw(reason) {
        this.showNotification(`Partie nulle ! (${reason})`, 'info');
        this.endGame('draw', reason);
    }

    showCheckAlert(kingColor) {
        if (this.lastCheckAlert === kingColor) return;
        this.lastCheckAlert = kingColor;
        
        const kingText = kingColor === 'white' ? 'blanc' : 'noir';
        this.showNotification(`Roi ${kingText} en échec !`);
        
        setTimeout(() => {
            this.lastCheckAlert = null;
        }, 2000);
    }

    endGame(result, reason = null) {
        this.chessGame.gameState.gameActive = false;
        
        if (this.chessGame.ui && this.chessGame.ui.stopPlayerTimer) {
            this.chessGame.ui.stopPlayerTimer();
        }
        
        if (this.chessGame.ui && this.chessGame.ui.showGameOver) {
            // C'est l'appel à votre ChessModalManager qui gère l'affichage final
            this.chessGame.ui.showGameOver(result, reason); 
        }
        
        if (this.chessGame.botManager) {
            this.chessGame.botManager.isBotThinking = false;
        }
    }

    findKingPosition(color) {
        const kingType = 'king';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.chessGame.board.getSquare(row, col);
                if (square.piece && 
                    square.piece.type === kingType && 
                    square.piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    showNotification(message, type = 'info') {
        // Votre implémentation existante
        console.log(`🔔 Notification ${type}: ${message}`);
        
        const notification = document.createElement('div');
        notification.className = `chess-notification chess-notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialisation
GameStatusManager.init();
window.GameStatusManager = GameStatusManager;