// core/game-status-manager.js - Gestion du statut de jeu (échec, mat, pat, nullité)
class GameStatusManager {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('🛡️ core/game-status-manager.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        }
    }
    
    // Méthode pour charger la configuration
    static loadConfig() {
        try {
            // Vérifier si la configuration globale existe
            if (window.appConfig && window.appConfig.debug) {
                const configValue = window.appConfig.debug.console_log;
                
                // Convertir la valeur en booléen
                if (typeof configValue === 'string') {
                    this.consoleLog = configValue.toLowerCase() === 'true';
                } else {
                    this.consoleLog = Boolean(configValue);
                }
                
                return true;
            }
            
            // Si window.appConfig n'existe pas, essayer de le charger
            if (typeof window.getConfig === 'function') {
                const configValue = window.getConfig('debug.console_log', 'true');
                this.consoleLog = configValue === true || configValue === 'true';
                return true;
            }
            
            // Si rien n'est disponible, garder la valeur par défaut
            if (this.consoleLog) {
                console.warn('⚠️ GameStatusManager: Aucune configuration trouvée, utilisation de la valeur par défaut');
            }
            return false;
            
        } catch (error) {
            console.error('❌ GameStatusManager: Erreur lors du chargement de la config:', error);
            return false;
        }
    }
    
    // Méthode pour déterminer la source de la configuration
    static getConfigSource() {
        if (window.appConfig) {
            return 'JSON config';
        } else if (typeof window.getConfig === 'function') {
            return 'fonction getConfig';
        } else {
            return 'valeur par défaut';
        }
    }
    
    // Méthode pour vérifier si on est en mode debug
    static isDebugMode() {
        return this.consoleLog;
    }

    constructor(chessGame) {
        this.chessGame = chessGame;
        this.lastCheckAlert = null;
        
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        if (this.constructor.consoleLog) {
            console.log('🛡️ [GameStatusManager] Gestionnaire de statut initialisé');
            console.log('🛡️ [GameStatusManager] ChessGame:', chessGame);
            console.log(`📊 ${this.constructor.getConfigSource()}: console_log = ${this.constructor.consoleLog}`);
        }
    }

    updateGameStatus() {
        // Vérifier la configuration avant chaque appel
        if (!this.constructor.consoleLog && window.appConfig) {
            this.constructor.loadConfig();
        }
        
        if (this.constructor.consoleLog) {
            console.log('\n🔍 [GameStatusManager] === VÉRIFICATION DU STATUT ===');
            console.log('🔍 [GameStatusManager] ORDRE CORRECT: 1. Mat → 2. Pat → 3. Nulle → 4. Échec');
        }
        
        // Retirer les anciennes surbrillances d'échec
        this.chessGame.board.squares.forEach(square => {
            if (square.element.classList.contains('king-in-check') || 
                square.element.classList.contains('checkmate') || 
                square.element.classList.contains('stalemate')) {
                square.element.classList.remove('king-in-check', 'checkmate', 'stalemate');
                if (this.constructor.consoleLog) {
                    console.log(`   🧹 Nettoyage surbrillance case [${square.row},${square.col}]`);
                }
            }
        });

        const currentFEN = FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board);
        
        if (this.constructor.consoleLog) {
            console.log(`📄 [GameStatusManager] FEN actuel: ${currentFEN.substring(0, 50)}...`);
            console.log(`📊 [GameStatusManager] Tour actuel: ${this.chessGame.gameState.currentPlayer === 'white' ? 'Blancs' : 'Noirs'}`);
            console.log(`📊 [GameStatusManager] Horloge 50 coups: ${this.chessGame.gameState.halfMoveClock}`);
            console.log(`🔄 [GameStatusManager] Historique: ${this.chessGame.gameState.moveHistory.length} coup(s)`);
        }
        
        // ORDRE CORRECT DES VÉRIFICATIONS :
        
        // 1. Vérifier l'échec et mat D'ABORD (le plus important)
        const mateEngine = new ChessMateEngine(currentFEN);
        const whiteCheckmate = mateEngine.isCheckmate('w');
        const blackCheckmate = mateEngine.isCheckmate('b');
        
        if (this.constructor.consoleLog) {
            console.log('🔍 [GameStatusManager] Résultats vérification échec et mat:');
            console.log(`   • Échec et mat blanc: ${whiteCheckmate ? '✅ OUI - MAT!' : '❌ NON'}`);
            console.log(`   • Échec et mat noir: ${blackCheckmate ? '✅ OUI - MAT!' : '❌ NON'}`);
        }

        // 1a. Si échec et mat blanc
        if (whiteCheckmate) {
            if (this.constructor.consoleLog) {
                console.log('💀 [GameStatusManager] ÉCHEC ET MAT pour les blancs détecté - TRAITEMENT');
            }
            this.handleCheckmate('white');
            return;
        }
        
        // 1b. Si échec et mat noir
        if (blackCheckmate) {
            if (this.constructor.consoleLog) {
                console.log('💀 [GameStatusManager] ÉCHEC ET MAT pour les noirs détecté - TRAITEMENT');
            }
            this.handleCheckmate('black');
            return;
        }

        // 2. Vérifier le pat (seulement si pas d'échec et mat)
        // Utiliser ChessPatEngine si disponible, sinon ChessMateEngine
        let whiteStalemate = false;
        let blackStalemate = false;
        
        if (typeof ChessPatEngine !== 'undefined') {
            const patEngine = new ChessPatEngine(currentFEN);
            whiteStalemate = patEngine.isStalemate('w');
            blackStalemate = patEngine.isStalemate('b');
        } else {
            // Fallback: utiliser ChessMateEngine
            whiteStalemate = mateEngine.isStalemate('w');
            blackStalemate = mateEngine.isStalemate('b');
        }
        
        if (this.constructor.consoleLog) {
            console.log('🔍 [GameStatusManager] Résultats vérification pat:');
            console.log(`   • Pat blanc: ${whiteStalemate ? '✅ OUI - PAT!' : '❌ NON'}`);
            console.log(`   • Pat noir: ${blackStalemate ? '✅ OUI - PAT!' : '❌ NON'}`);
        }

        // 2a. Si pat blanc
        if (whiteStalemate) {
            if (this.constructor.consoleLog) {
                console.log('♟️ [GameStatusManager] PAT pour les blancs détecté - TRAITEMENT');
            }
            this.handleStalemate('white');
            return;
        }
        
        // 2b. Si pat noir
        if (blackStalemate) {
            if (this.constructor.consoleLog) {
                console.log('♟️ [GameStatusManager] PAT pour les noirs détecté - TRAITEMENT');
            }
            this.handleStalemate('black');
            return;
        }

        // 3. Vérifier les autres conditions de nullité (seulement si pas mat/pat)
        let drawResult = { isDraw: false, reason: null };
        
        if (typeof ChessNulleEngine !== 'undefined') {
            const fenHistory = this.chessGame.gameState.moveHistory.map(m => m.fen);
            const nulleEngine = new ChessNulleEngine(currentFEN, fenHistory);
            drawResult = nulleEngine.isDraw(this.chessGame.gameState.halfMoveClock);
        }
        
        if (this.constructor.consoleLog) {
            console.log('🔍 [GameStatusManager] Résultats autres nullités:');
            console.log(`   • Nulle: ${drawResult.isDraw ? `✅ OUI - ${drawResult.reason}` : '❌ NON'}`);
        }

        // 3a. Si nulle détectée
        if (drawResult.isDraw) {
            if (this.constructor.consoleLog) {
                console.log(`🤝 [GameStatusManager] NULLITÉ détectée: ${drawResult.reason} - TRAITEMENT`);
            }
            this.handleDraw(drawResult.reason);
            return;
        }

        // 4. Vérifier les échecs simples (seulement si pas mat/pat/nulle)
        // CORRECTION: Utiliser ChessMateEngine pour éviter la confusion
        const whiteInCheck = mateEngine.isKingInCheck('w');
        const blackInCheck = mateEngine.isKingInCheck('b');
        
        if (this.constructor.consoleLog) {
            console.log('🔍 [GameStatusManager] Résultats échec simple:');
            console.log(`   • Échec roi blanc: ${whiteInCheck ? '⚠️ OUI - ÉCHEC' : '❌ NON'}`);
            console.log(`   • Échec roi noir: ${blackInCheck ? '⚠️ OUI - ÉCHEC' : '❌ NON'}`);
        }

        // 4a. Si échec blanc
        if (whiteInCheck) {
            if (this.constructor.consoleLog) {
                console.log('🚨 [GameStatusManager] Échec pour les blancs détecté - TRAITEMENT');
            }
            this.handleCheck('white');
        }
        
        // 4b. Si échec noir
        if (blackInCheck) {
            if (this.constructor.consoleLog) {
                console.log('🚨 [GameStatusManager] Échec pour les noirs détecté - TRAITEMENT');
            }
            this.handleCheck('black');
        }

        // 5. Vérifier si c'est au bot de jouer (seulement si jeu en cours)
        if (!whiteCheckmate && !blackCheckmate && !whiteStalemate && !blackStalemate && !drawResult.isDraw) {
            if (this.chessGame.botManager && this.chessGame.botManager.isBotTurn()) {
                if (this.constructor.consoleLog) {
                    console.log('🤖 [GameStatusManager] C\'est au tour du bot de jouer');
                }
                this.chessGame.botManager.playBotMove();
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log('✅ [GameStatusManager] Statut du jeu: ACTIF (pas de mat/pat/nulle)');
            console.log('🔍 [GameStatusManager] === FIN VÉRIFICATION ===\n');
        }
    }

    // NOUVELLE MÉTHODE: Traitement spécifique pour échec (pas mat)
    handleCheck(kingColor) {
        const kingPos = this.findKingPosition(kingColor);
        
        if (this.constructor.consoleLog) {
            if (kingPos) {
                console.log(`🚨 [GameStatusManager] Roi ${kingColor} en échec en [${kingPos.row},${kingPos.col}]`);
            } else {
                console.log('❌ [GameStatusManager] Roi non trouvé!');
            }
        }
        
        if (kingPos) {
            const kingSquare = this.chessGame.board.getSquare(kingPos.row, kingPos.col);
            if (kingSquare) {
                kingSquare.element.classList.add('king-in-check');
                this.showCheckAlert(kingColor);
                
                if (this.constructor.consoleLog) {
                    console.log(`🚨 [GameStatusManager] Animation échec appliquée pour roi ${kingColor}`);
                }
            }
        }
    }

    handleCheckmate(kingColor) {
        if (this.constructor.consoleLog) {
            console.log('\n💀 [GameStatusManager] === TRAITEMENT ÉCHEC ET MAT ===');
            console.log(`💀 [GameStatusManager] Roi ${kingColor} est mat`);
        }
        
        const kingPos = this.findKingPosition(kingColor);
        
        if (this.constructor.consoleLog) {
            if (kingPos) {
                console.log(`💀 [GameStatusManager] Roi trouvé en [${kingPos.row},${kingPos.col}]`);
            } else {
                console.log('❌ [GameStatusManager] Roi non trouvé!');
            }
        }
        
        if (kingPos) {
            const kingSquare = this.chessGame.board.getSquare(kingPos.row, kingPos.col);
            if (kingSquare) {
                kingSquare.element.classList.add('checkmate');
                if (this.constructor.consoleLog) {
                    console.log('💀 [GameStatusManager] Animation checkmate appliquée');
                }
            }
        }
        
        const winner = kingColor === 'white' ? 'black' : 'white';
        const winnerText = winner === 'white' ? 'blancs' : 'noirs';
        const loserText = kingColor === 'white' ? 'blancs' : 'noirs';
        
        this.showNotification(
            `Échec et mat ! Roi ${loserText} mat. Les ${winnerText} gagnent !`, 
            'danger'
        );
        
        if (this.constructor.consoleLog) {
            console.log(`💀 [GameStatusManager] Notification envoyée: Victoire des ${winnerText}`);
        }
        
        this.endGame(winner);
        
        if (this.constructor.consoleLog) {
            console.log('✅ [GameStatusManager] === FIN ÉCHEC ET MAT ===\n');
        }
    }

    handleStalemate(kingColor) {
        if (this.constructor.consoleLog) {
            console.log('\n♟️ [GameStatusManager] === TRAITEMENT PAT ===');
            console.log(`♟️ [GameStatusManager] Roi ${kingColor} est pat`);
        }
        
        const kingPos = this.findKingPosition(kingColor);
        
        if (this.constructor.consoleLog) {
            if (kingPos) {
                console.log(`♟️ [GameStatusManager] Roi trouvé en [${kingPos.row},${kingPos.col}]`);
            }
        }
        
        if (kingPos) {
            const kingSquare = this.chessGame.board.getSquare(kingPos.row, kingPos.col);
            if (kingSquare) {
                kingSquare.element.classList.add('stalemate');
                if (this.constructor.consoleLog) {
                    console.log('♟️ [GameStatusManager] Animation stalemate appliquée');
                }
            }
        }
        
        const kingText = kingColor === 'white' ? 'blanc' : 'noir';
        this.showNotification(`Pat ! Roi ${kingText} pat. Partie nulle.`, 'warning');
        
        if (this.constructor.consoleLog) {
            console.log('♟️ [GameStatusManager] Notification envoyée: Partie nulle par pat');
        }
        
        this.endGame('draw');
        
        if (this.constructor.consoleLog) {
            console.log('✅ [GameStatusManager] === FIN PAT ===\n');
        }
    }

    handleDraw(reason) {
        if (this.constructor.consoleLog) {
            console.log('\n🤝 [GameStatusManager] === TRAITEMENT NULLITÉ ===');
            console.log(`🤝 [GameStatusManager] Raison: ${reason}`);
        }
        
        let message = '';
        let description = '';
        
        if (typeof ChessNulleEngine !== 'undefined') {
            const currentFEN = FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board);
            const fenHistory = this.chessGame.gameState.moveHistory.map(m => m.fen);
            const nulleEngine = new ChessNulleEngine(currentFEN, fenHistory);
            
            message = nulleEngine.getDrawMessage(reason);
            description = nulleEngine.getDrawDescription(reason);
        } else {
            // Messages par défaut
            const drawMessages = {
                'repetition': 'Répétition triple',
                'fiftyMoves': 'Règle des 50 coups', 
                'insufficientMaterial': 'Matériel insuffisant',
                'stalemate': 'Pat'
            };
            message = `Partie nulle !`;
            description = drawMessages[reason] || 'Égalité';
        }
        
        this.showNotification(`${message} ${description}`, 'info');
        
        if (this.constructor.consoleLog) {
            console.log(`🤝 [GameStatusManager] Notification: ${message}`);
            console.log(`🤝 [GameStatusManager] Description: ${description}`);
        }
        
        this.endGame('draw', reason);
        
        if (this.constructor.consoleLog) {
            console.log('✅ [GameStatusManager] === FIN NULLITÉ ===\n');
        }
    }

    // MÉTHODE showCheckAlert inchangée (garder la vôtre)
    showCheckAlert(kingColor) {
        if (this.lastCheckAlert === kingColor) {
            if (this.constructor.consoleLog) {
                console.log(`⚠️ [GameStatusManager] Alerte échec déjà affichée pour ${kingColor}`);
            }
            return;
        }
        
        this.lastCheckAlert = kingColor;
        
        const kingText = kingColor === 'white' ? 'blanc' : 'noir';
        this.showNotification(`Roi ${kingText} en échec !`);
        
        if (this.constructor.consoleLog) {
            console.log(`🚨 [GameStatusManager] Alerte échec pour roi ${kingColor}`);
        }
        
        setTimeout(() => {
            this.lastCheckAlert = null;
            if (this.constructor.consoleLog) {
                console.log(`🔄 [GameStatusManager] Réinitialisation alerte échec pour ${kingColor}`);
            }
        }, 2000);
    }

    endGame(result, reason = null) {
        if (this.constructor.consoleLog) {
            console.log('\n🏁 [GameStatusManager] === FIN DE PARTIE ===');
            console.log(`🏁 [GameStatusManager] Résultat: ${result}`);
            if (reason) console.log(`🏁 [GameStatusManager] Raison: ${reason}`);
        }
        
        this.chessGame.gameState.gameActive = false;
        
        let message = '';
        if (result === 'draw') {
            const drawMessages = {
                'repetition': 'Répétition triple',
                'fiftyMoves': 'Règle des 50 coups', 
                'insufficientMaterial': 'Matériel insuffisant',
                null: 'Partie nulle'
            };
            message = `Partie nulle ! (${drawMessages[reason] || 'Égalité'})`;
        } else {
            const winnerText = result === 'white' ? 'blancs' : 'noirs';
            message = `Partie terminée ! Vainqueur : ${winnerText}`;
        }
        
        if (this.constructor.consoleLog) {
            console.log(`🏁 [GameStatusManager] Message final: ${message}`);
        }
        
        if (this.chessGame.ui && this.chessGame.ui.stopPlayerTimer) {
            this.chessGame.ui.stopPlayerTimer();
            if (this.constructor.consoleLog) {
                console.log('⏱️ [GameStatusManager] Timers arrêtés');
            }
        }
        
        if (this.chessGame.ui && this.chessGame.ui.showGameOver) {
            this.chessGame.ui.showGameOver(result, reason);
            if (this.constructor.consoleLog) {
                console.log('🎮 [GameStatusManager] UI game over déclenchée');
            }
        }
        
        if (this.chessGame.botManager) {
            this.chessGame.botManager.isBotThinking = false;
            if (this.constructor.consoleLog) {
                console.log('🤖 [GameStatusManager] Bot désactivé');
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log('✅ [GameStatusManager] === FIN DE PARTIE TERMINÉE ===\n');
        }
    }

    findKingPosition(color) {
        if (this.constructor.consoleLog) {
            console.log(`👑 [GameStatusManager] Recherche roi ${color}...`);
        }
        
        const kingType = 'king';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.chessGame.board.getSquare(row, col);
                if (square.piece && 
                    square.piece.type === kingType && 
                    square.piece.color === color) {
                    
                    if (this.constructor.consoleLog) {
                        console.log(`✅ [GameStatusManager] Roi ${color} trouvé à [${row},${col}]`);
                    }
                    
                    return { row, col };
                }
            }
        }
        
        if (this.constructor.consoleLog) {
            console.warn(`❌ [GameStatusManager] Roi ${color} non trouvé !`);
        }
        
        return null;
    }

    showNotification(message, type = 'info') {
        if (this.constructor.consoleLog) {
            console.log(`🔔 [GameStatusManager] Notification: ${type} - ${message}`);
        }
        
        const existingNotifications = document.querySelectorAll('.chess-notification');
        if (existingNotifications.length > 0 && this.constructor.consoleLog) {
            console.log(`🗑️ [GameStatusManager] Suppression de ${existingNotifications.length} notification(s) existante(s)`);
        }
        
        existingNotifications.forEach(notif => {
            notif.remove();
        });

        const notification = document.createElement('div');
        notification.className = `chess-notification chess-notification-${type}`;
        
        const icons = {
            'danger': '💀',
            'warning': '♟️', 
            'info': 'ℹ️'
        };
        const icon = icons[type] || 'ℹ️';
        notification.innerHTML = `${icon} ${message}`;

        if (this.constructor.consoleLog) {
            console.log(`📝 [GameStatusManager] Création notification DOM: classe="${notification.className}"`);
        }
        
        document.body.appendChild(notification);

        setTimeout(() => {
            if (this.constructor.consoleLog) {
                console.log('⏰ [GameStatusManager] Suppression programmée de la notification');
            }
            
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                    if (this.constructor.consoleLog) {
                        console.log('✅ [GameStatusManager] Notification supprimée du DOM');
                    }
                }
            }, 300);
        }, 5000);
    }
    
    // NOUVELLE MÉTHODE: Test spécifique pour votre situation FEN
    testSpecificFEN(fen = "1R4k1/8/6K1/4p3/1p2P2P/1P1P4/2P2PP1/1NB3N1 b - - 22 37") {
        console.log('\n🧪🧪🧪 TEST SPÉCIFIQUE FEN DÉTECTION MAT 🧪🧪🧪');
        console.log('FEN:', fen);
        
        // 1. Test avec ChessMateEngine
        const mateEngine = new ChessMateEngine(fen);
        console.log('\n=== TEST CHESSMATEENGINE ===');
        console.log('• Roi noir en échec?', mateEngine.isKingInCheck('b'));
        console.log('• Échec et mat noir?', mateEngine.isCheckmate('b'));
        console.log('• Pat noir?', mateEngine.isStalemate('b'));
        
        // 2. Test avec ChessEngine (ancien)
        const checkEngine = new ChessEngine(fen);
        console.log('\n=== TEST CHESSENGINE ===');
        console.log('• Roi noir en échec?', checkEngine.isKingInCheck('b'));
        console.log('• Échec et mat noir?', checkEngine.isCheckmate('b'));
        console.log('• Pat noir?', checkEngine.isStalemate('b'));
        
        // 3. Vérifier les coups légaux
        console.log('\n=== COUPS LÉGAUX NOIRS ===');
        // Si ChessMateEngine a getAllLegalMoves
        if (typeof mateEngine.getAllLegalMoves === 'function') {
            const legalMoves = mateEngine.getAllLegalMoves('b');
            console.log(`Nombre de coups légaux: ${legalMoves.length}`);
            if (legalMoves.length === 0) {
                console.log('✅ CONFIRMÉ: Aucun coup légal = ÉCHEC ET MAT');
            }
        }
        
        // 4. Simuler l'appel de updateGameStatus
        console.log('\n=== SIMULATION UPDATEGAMESTATUS ===');
        console.log('Tour actuel:', fen.split(' ')[1] === 'w' ? 'Blancs' : 'Noirs');
        console.log('Devrait détecter: ÉCHEC ET MAT NOIR');
        
        return {
            mateEngine,
            checkEngine,
            fen: fen,
            expectedResult: 'checkmate_black'
        };
    }
}

// Initialisation statique
GameStatusManager.init();

// Injecter les styles CSS (garder votre version)
const notificationStyles = `
<style>
.chess-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 10px;
    color: white;
    font-weight: bold;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.5);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.1);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 16px;
    text-align: center;
    line-height: 1.4;
}

.chess-notification-danger {
    background: linear-gradient(135deg, #dc3545, #c82333);
    border-left: 4px solid #ff6b7a;
}

.chess-notification-warning {
    background: linear-gradient(135deg, #ffc107, #e0a800);
    border-left: 4px solid #ffd54f;
    color: #212529;
}

.chess-notification-info {
    background: linear-gradient(135deg, #17a2b8, #138496);
    border-left: 4px solid #4fd1e0;
}

.chess-notification-success {
    background: linear-gradient(135deg, #28a745, #1e7e34);
    border-left: 4px solid #4cff6a;
}

@keyframes slideIn {
    from { 
        transform: translateX(100%); 
        opacity: 0; 
    }
    to { 
        transform: translateX(0); 
        opacity: 1; 
    }
}

@keyframes slideOut {
    from { 
        transform: translateX(0); 
        opacity: 1; 
    }
    to { 
        transform: translateX(100%); 
        opacity: 0; 
    }
}

/* Styles pour le roi en échec */
.king-in-check {
    box-shadow: 0 0 20px red !important;
    animation: pulse-check 1.5s infinite;
}

@keyframes pulse-check {
    0% { box-shadow: 0 0 10px red; }
    50% { box-shadow: 0 0 25px red; }
    100% { box-shadow: 0 0 10px red; }
}

/* Styles pour échec et mat */
.checkmate {
    box-shadow: 0 0 25px #dc3545 !important;
    animation: pulse-mate 2s infinite;
}

@keyframes pulse-mate {
    0% { box-shadow: 0 0 15px #dc3545; }
    50% { box-shadow: 0 0 35px #dc3545; }
    100% { box-shadow: 0 0 15px #dc3545; }
}

/* Styles pour pat */
.stalemate {
    box-shadow: 0 0 20px #ffc107 !important;
    animation: pulse-stale 2s infinite;
}

@keyframes pulse-stale {
    0% { box-shadow: 0 0 10px #ffc107; }
    50% { box-shadow: 0 0 25px #ffc107; }
    100% { box-shadow: 0 0 10px #ffc107; }
}
</style>
`;

// Injecter les styles dans le document
if (!document.querySelector('#chess-notification-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'chess-notification-styles';
    styleElement.textContent = notificationStyles;
    document.head.appendChild(styleElement);
    
    if (GameStatusManager.consoleLog) {
        console.log('🎨 [GameStatusManager] Styles de notification injectés');
    }
}

// Exposer la classe globalement
window.GameStatusManager = GameStatusManager;

// Ajouter des fonctions utilitaires globales
window.GameStatusManagerUtils = {
    // Forcer le rechargement de la config
    reloadConfig: () => {
        GameStatusManager.loadConfig();
        console.log(`🔧 GameStatusManager: Configuration rechargée: ${GameStatusManager.consoleLog}`);
        return GameStatusManager.consoleLog;
    },
    
    // Obtenir l'état actuel
    getState: () => ({
        consoleLog: GameStatusManager.consoleLog,
        source: GameStatusManager.getConfigSource(),
        debugMode: GameStatusManager.isDebugMode()
    }),
    
    // Tester la configuration
    testConfig: () => {
        console.group('🧪 Test de configuration GameStatusManager');
        console.log('consoleLog actuel:', GameStatusManager.consoleLog);
        console.log('Source config:', GameStatusManager.getConfigSource());
        console.log('window.appConfig disponible:', !!window.appConfig);
        
        if (window.appConfig) {
            console.log('Valeur debug.console_log dans appConfig:', 
                window.appConfig.debug?.console_log);
        }
        
        console.log('Mode debug activé:', GameStatusManager.isDebugMode());
        console.groupEnd();
        
        return GameStatusManager.consoleLog;
    },
    
    // Tester la détection d'échec et mat
    testCheckmateDetection: () => {
        const manager = new GameStatusManager(window.chessGame);
        return manager.testSpecificFEN();
    }
};

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            GameStatusManager.loadConfig();
            if (GameStatusManager.consoleLog) {
                console.log('✅ GameStatusManager: Configuration vérifiée après chargement du DOM');
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        GameStatusManager.loadConfig();
    }, 100);
}

// Log final (si activé)
if (GameStatusManager.consoleLog) {
    console.log('✅ GameStatusManager prêt avec ordre de vérification corrigé');
}

// NOUVELLE FONCTION GLOBALE: Tester votre FEN spécifique
window.testMyCheckmateFEN = function() {
    console.log('\n🔍🔍🔍 TEST DE VOTRE FEN SPÉCIFIQUE 🔍🔍🔍');
    console.log('Position: 1R4k1/8/6K1/4p3/1p2P2P/1P1P4/2P2PP1/1NB3N1 b - - 22 37');
    console.log('Analyse: Roi noir en g8, Tour blanche en b8, Roi blanc en g6');
    
    // Créer un moteur de test
    const fen = "1R4k1/8/6K1/4p3/1p2P2P/1P1P4/2P2PP1/1NB3N1 b - - 22 37";
    const mateEngine = new ChessMateEngine(fen);
    
    console.log('\n=== PLATEAU ===');
    mateEngine.displayBoard();
    
    console.log('\n=== VÉRIFICATIONS ===');
    const blackInCheck = mateEngine.isKingInCheck('b');
    const whiteInCheck = mateEngine.isKingInCheck('w');
    const isCheckmate = mateEngine.isCheckmate('b');
    
    console.log(`• Roi noir en échec? ${blackInCheck ? '✅ OUI' : '❌ NON'}`);
    console.log(`• Roi blanc en échec? ${whiteInCheck ? '✅ OUI' : '❌ NON'}`);
    console.log(`• Échec et mat? ${isCheckmate ? '✅✅✅ OUI - MAT!' : '❌ NON'}`);
    
    if (isCheckmate) {
        console.log('\n=== ANALYSE DU MAT ===');
        const kingPos = mateEngine.findKing('b');
        console.log(`Roi noir en [${kingPos.row},${kingPos.col}] (g8)`);
        
        console.log('Cases autour du roi:');
        const adj = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        adj.forEach(([dr, dc], i) => {
            const r = kingPos.row + dr;
            const c = kingPos.col + dc;
            const piece = mateEngine.getPiece(r, c);
            const attacked = mateEngine.isSquareAttacked(r, c, 'w');
            console.log(`  ${i+1}. [${r},${c}]: ${piece || 'vide'} - ${attacked ? '⚔️ attaquée' : '✓ sûre'}`);
        });
        
        console.log('\n✅ CONCLUSION: C\'est bien un échec et mat !');
        console.log('✅ GameStatusManager devrait afficher "Échec et mat" et non juste "Échec"');
    } else {
        console.log('\n❌ PROBLÈME: Pas détecté comme échec et mat !');
        console.log('❌ Vérifiez ChessMateEngine.isCheckmate()');
    }
    
    return { blackInCheck, whiteInCheck, isCheckmate };
};