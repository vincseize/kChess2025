/**
 * core/game-status-manager.js
 * Version 1.2.1 - Sécurisée contre les FEN vides
 */
class GameStatusManager {
    
    static VERSION = '1.2.1';
    static consoleLog = true;
    static logHistory = [];
    static MAX_LOGS = 100;

    /**
     * Système de journalisation interne
     */
    static log(message, type = 'info', data = null) {
        if (!this.consoleLog && type === 'info') return;

        const timestamp = new Date().toLocaleTimeString();
        const entry = { timestamp, type, message, data };
        
        this.logHistory.push(entry);
        if (this.logHistory.length > this.MAX_LOGS) this.logHistory.shift();

        const icons = { 
            info: '🔍', success: '✅', warn: '⚠️', 
            error: '❌', critical: '🚨', death: '💀' 
        };
        const icon = icons[type] || '⚪';
        
        console.log(`${icon} [GameStatusManager ${timestamp}] ${message}`);
        if (data && this.consoleLog) console.dir(data);
    }
    
    static init() {
        this.loadConfig();
        this.log(`Initialisé - Version ${this.VERSION}`, 'success');
        
        // Exposer les outils de debug
        window.debugStatus = () => {
            console.table(this.logHistory);
        };
    }
    
    static loadConfig() {
        try {
            const config = window.appConfig?.chess_engine || window.appConfig?.debug;
            if (config?.console_log !== undefined) {
                this.consoleLog = String(config.console_log).toLowerCase() !== "false";
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
        GameStatusManager.log('Nouvelle instance créée pour ChessGame', 'info');
    }

    /**
     * MÉTHODE PRINCIPALE : Cycle de vérification
     * Priorité : Mat > Pat > Nulle > Échec
     */
    updateGameStatus() {
        GameStatusManager.log('=== DÉBUT VÉRIFICATION STATUT ===', 'info');
        
        // 1. Nettoyage UI
        this.cleanUIEffects();

        // 2. Vérification des dépendances
        if (typeof FENGenerator === 'undefined' || typeof ChessMateEngine === 'undefined') {
            GameStatusManager.log('Dépendances manquantes (FENGenerator/ChessMateEngine)', 'critical');
            return;
        }

        // 3. Génération et Validation de la FEN
        const currentFEN = FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board);
        
        // SÉCURITÉ CRITIQUE : Si la FEN est vide ou corrompue, on ne valide PAS le statut.
        // Cela empêche le bug du "Pat au bout d'un coup" dû à un plateau non lu.
        if (!currentFEN || currentFEN.includes('8/8/8/8/8/8/8/8')) {
            GameStatusManager.log('FEN invalide ou plateau vide détecté. Analyse annulée pour éviter un faux Pat.', 'error');
            return;
        }

        const currentPlayer = this.chessGame.gameState.currentPlayer;
        const fenSide = currentFEN.split(' ')[1]; // 'w' ou 'b'

        GameStatusManager.log(`Analyse FEN: ${currentFEN}`, 'info', { player: currentPlayer, side: fenSide });

        // --- ORDRE DE PRIORITÉ ABSOLU ---

        // ÉTAPE 1: ÉCHEC ET MAT
        const checkmateStatus = this.checkForCheckmate(currentFEN);
        if (checkmateStatus.found) {
            GameStatusManager.log(`MAT DÉTECTÉ pour ${checkmateStatus.color}`, 'death');
            this.handleCheckmate(checkmateStatus.color);
            return; 
        }

        // ÉTAPE 2: PAT (Stalemate)
        const stalemateStatus = this.checkForStalemate(currentFEN);
        if (stalemateStatus.found) {
            GameStatusManager.log(`PAT DÉTECTÉ pour ${stalemateStatus.color}`, 'warn');
            this.handleStalemate(stalemateStatus.color);
            return;
        }

        // ÉTAPE 3: AUTRES NULLITÉS (Matériel insuffisant...)
        const drawResult = this.checkForDraw(currentFEN);
        if (drawResult.isDraw) {
            GameStatusManager.log(`NULLITÉ: ${drawResult.reason}`, 'warn');
            this.handleDraw(drawResult.reason);
            return;
        }

        // ÉTAPE 4: ÉCHEC SIMPLE
        const checkStatus = this.checkForCheck(currentFEN);
        if (checkStatus.whiteInCheck) this.handleCheck('white');
        if (checkStatus.blackInCheck) this.handleCheck('black');

        // ÉTAPE 5: TOUR DU BOT
        this.triggerBotIfNeeded();
        
        GameStatusManager.log('Fin de vérification - Jeu en cours', 'info');
    }

    // --- LOGIQUE DE DÉTECTION (Appels Moteur) ---

    checkForCheckmate(fen) {
        const engine = new ChessMateEngine(fen);
        const side = fen.split(' ')[1]; // On vérifie le joueur dont c'est le tour
        const isMate = engine.isCheckmate(side);
        return { found: isMate, color: side === 'w' ? 'white' : 'black' };
    }

    checkForStalemate(fen) {
        const engine = new ChessMateEngine(fen);
        const side = fen.split(' ')[1];
        const isStale = engine.isStalemate(side);
        return { found: isStale, color: side === 'w' ? 'white' : 'black' };
    }

    checkForCheck(fen) {
        const engine = new ChessMateEngine(fen);
        return {
            whiteInCheck: engine.isKingInCheck('w'),
            blackInCheck: engine.isKingInCheck('b')
        };
    }

    checkForDraw(fen) {
        // Logique extensible : Matériel insuffisant ou règle des 50 coups
        return { isDraw: false, reason: null };
    }

    // --- TRAITEMENTS ET UI ---

    handleCheck(kingColor) {
        this.highlightKing(kingColor, 'king-in-check');
        this.showCheckAlert(kingColor);
    }

    handleCheckmate(kingColor) {
        this.highlightKing(kingColor, 'checkmate');
        const winner = kingColor === 'white' ? 'black' : 'white';
        const winnerName = winner === 'white' ? 'blancs' : 'noirs';
        
        this.showNotification(`Échec et mat ! Les ${winnerName} gagnent !`, 'danger');
        this.endGame(winner, 'checkmate'); 
    }

    handleStalemate(kingColor) {
        this.highlightKing(kingColor, 'stalemate');
        this.showNotification(`Pat ! Partie nulle.`, 'warning');
        this.endGame('draw', 'stalemate');
    }

    handleDraw(reason) {
        this.showNotification(`Partie nulle ! (${reason})`, 'info');
        this.endGame('draw', reason);
    }

    highlightKing(color, className) {
        const pos = this.findKingPosition(color);
        if (pos) {
            const square = this.chessGame.board.getSquare(pos.row, pos.col);
            if (square && square.element) {
                square.element.classList.add(className);
            }
        }
    }

    cleanUIEffects() {
        if (!this.chessGame.board?.squares) return;
        this.chessGame.board.squares.forEach(sq => {
            if (sq.element) {
                sq.element.classList.remove('king-in-check', 'checkmate', 'stalemate');
            }
        });
    }

    showCheckAlert(kingColor) {
        if (this.lastCheckAlert === kingColor) return;
        this.lastCheckAlert = kingColor;
        
        const colorName = kingColor === 'white' ? 'blanc' : 'noir';
        this.showNotification(`Roi ${colorName} en échec !`);
        
        setTimeout(() => { this.lastCheckAlert = null; }, 2000);
    }

    triggerBotIfNeeded() {
        if (this.chessGame.botManager && this.chessGame.botManager.isBotTurn()) {
            GameStatusManager.log('Activation du mouvement Bot', 'info');
            // Petit délai pour laisser l'UI respirer
            setTimeout(() => {
                this.chessGame.botManager.playBotMove();
            }, 250);
        }
    }

    endGame(result, reason) {
        GameStatusManager.log(`FIN DE PARTIE : ${result} (${reason})`, 'critical');
        this.chessGame.gameState.gameActive = false;
        
        if (this.chessGame.ui?.stopPlayerTimer) this.chessGame.ui.stopPlayerTimer();
        if (this.chessGame.ui?.showGameOver) this.chessGame.ui.showGameOver(result, reason);
        if (this.chessGame.botManager) this.chessGame.botManager.isBotThinking = false;
    }

    findKingPosition(color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const sq = this.chessGame.board.getSquare(r, c);
                if (sq?.piece?.type === 'king' && sq?.piece?.color === color) {
                    return { row: r, col: c };
                }
            }
        }
        return null;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `chess-notification chess-notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-suppression après 5 secondes
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 4500);
    }
}

// Initialisation globale
GameStatusManager.init();
window.GameStatusManager = GameStatusManager;