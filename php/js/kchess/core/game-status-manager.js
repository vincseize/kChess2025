// core/game-status-manager.js - Gestion du statut de jeu (échec, mat, pat, nullité)
class GameStatusManager {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('core/game-status-manager.js loaded');
        }
    }

    constructor(chessGame) {
        this.chessGame = chessGame;
        this.lastCheckAlert = null;
        
        if (this.constructor.consoleLog) {
            console.log('🛡️ [GameStatusManager] Gestionnaire de statut initialisé');
            console.log('🛡️ [GameStatusManager] ChessGame:', chessGame);
        }
    }

    updateGameStatus() {
        if (this.constructor.consoleLog) {
            console.log('\n🔍 [GameStatusManager] === VÉRIFICATION DU STATUT ===');
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
            console.log(`📊 [GameStatusManager] Horloge 50 coups: ${this.chessGame.gameState.halfMoveClock}`);
            console.log(`🔄 [GameStatusManager] Historique: ${this.chessGame.gameState.moveHistory.length} coup(s)`);
        }
        
        // Vérifier l'échec et mat
        const mateEngine = new ChessMateEngine(currentFEN);
        const whiteCheckmate = mateEngine.isCheckmate('w');
        const blackCheckmate = mateEngine.isCheckmate('b');
        
        // Vérifier le pat
        const patEngine = new ChessPatEngine(currentFEN);
        const whiteStalemate = patEngine.isStalemate('w');
        const blackStalemate = patEngine.isStalemate('b');
        
        // Vérifier les autres conditions de nullité
        const fenHistory = this.chessGame.gameState.moveHistory.map(m => m.fen);
        const nulleEngine = new ChessNulleEngine(currentFEN, fenHistory);
        const drawResult = nulleEngine.isDraw(this.chessGame.gameState.halfMoveClock);
        
        if (this.constructor.consoleLog) {
            console.log('🔍 [GameStatusManager] Résultats vérification:');
            console.log(`   • Échec et mat blanc: ${whiteCheckmate ? '✅ OUI' : '❌ NON'}`);
            console.log(`   • Échec et mat noir: ${blackCheckmate ? '✅ OUI' : '❌ NON'}`);
            console.log(`   • Pat blanc: ${whiteStalemate ? '✅ OUI' : '❌ NON'}`);
            console.log(`   • Pat noir: ${blackStalemate ? '✅ OUI' : '❌ NON'}`);
            console.log(`   • Autres nullités: ${drawResult.isDraw ? `✅ ${drawResult.reason}` : '❌ NON'}`);
        }

        // 1. Vérifier l'échec et mat
        if (whiteCheckmate) {
            if (this.constructor.consoleLog) {
                console.log('💀 [GameStatusManager] ÉCHEC ET MAT pour les blancs détecté');
            }
            this.handleCheckmate('white');
            return;
        }
        
        if (blackCheckmate) {
            if (this.constructor.consoleLog) {
                console.log('💀 [GameStatusManager] ÉCHEC ET MAT pour les noirs détecté');
            }
            this.handleCheckmate('black');
            return;
        }

        // 2. Vérifier le pat
        if (whiteStalemate) {
            if (this.constructor.consoleLog) {
                console.log('♟️ [GameStatusManager] PAT pour les blancs détecté');
            }
            this.handleStalemate('white');
            return;
        }
        
        if (blackStalemate) {
            if (this.constructor.consoleLog) {
                console.log('♟️ [GameStatusManager] PAT pour les noirs détecté');
            }
            this.handleStalemate('black');
            return;
        }

        // 3. Vérifier les autres nullités
        if (drawResult.isDraw) {
            if (this.constructor.consoleLog) {
                console.log(`🤝 [GameStatusManager] NULLITÉ détectée: ${drawResult.reason}`);
            }
            this.handleDraw(drawResult.reason);
            return;
        }

        // 4. Vérifier les échecs simples
        this.updateCheckDisplay(currentFEN);

        // 5. Vérifier si c'est au bot de jouer
        if (this.chessGame.botManager.isBotTurn()) {
            if (this.constructor.consoleLog) {
                console.log('🤖 [GameStatusManager] C\'est au tour du bot de jouer');
            }
            this.chessGame.botManager.playBotMove();
        }
        
        if (this.constructor.consoleLog) {
            console.log('✅ [GameStatusManager] Statut du jeu: ACTIF');
            console.log('🔍 [GameStatusManager] === FIN VÉRIFICATION ===\n');
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
        
        const currentFEN = FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board);
        const fenHistory = this.chessGame.gameState.moveHistory.map(m => m.fen);
        const nulleEngine = new ChessNulleEngine(currentFEN, fenHistory);
        
        const message = nulleEngine.getDrawMessage(reason);
        const description = nulleEngine.getDrawDescription(reason);
        
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

    updateCheckDisplay(currentFEN) {
        if (this.constructor.consoleLog) {
            console.log('🚨 [GameStatusManager] Vérification des échecs...');
        }
        
        const engine = new ChessEngine(currentFEN);
        const whiteInCheck = engine.isKingInCheck('w');
        const blackInCheck = engine.isKingInCheck('b');

        if (this.constructor.consoleLog) {
            console.log(`   • Échec roi blanc: ${whiteInCheck ? '✅ OUI' : '❌ NON'}`);
            console.log(`   • Échec roi noir: ${blackInCheck ? '✅ OUI' : '❌ NON'}`);
        }

        if (whiteInCheck) {
            const kingPos = this.findKingPosition('white');
            
            if (this.constructor.consoleLog) {
                if (kingPos) {
                    console.log(`🚨 [GameStatusManager] Roi blanc en échec en [${kingPos.row},${kingPos.col}]`);
                }
            }
            
            if (kingPos) {
                const kingSquare = this.chessGame.board.getSquare(kingPos.row, kingPos.col);
                if (kingSquare) {
                    kingSquare.element.classList.add('king-in-check');
                    this.showCheckAlert('white');
                    
                    if (this.constructor.consoleLog) {
                        console.log('🚨 [GameStatusManager] Animation échec appliquée pour roi blanc');
                    }
                }
            }
        }

        if (blackInCheck) {
            const kingPos = this.findKingPosition('black');
            
            if (this.constructor.consoleLog) {
                if (kingPos) {
                    console.log(`🚨 [GameStatusManager] Roi noir en échec en [${kingPos.row},${kingPos.col}]`);
                }
            }
            
            if (kingPos) {
                const kingSquare = this.chessGame.board.getSquare(kingPos.row, kingPos.col);
                if (kingSquare) {
                    kingSquare.element.classList.add('king-in-check');
                    this.showCheckAlert('black');
                    
                    if (this.constructor.consoleLog) {
                        console.log('🚨 [GameStatusManager] Animation échec appliquée pour roi noir');
                    }
                }
            }
        }
    }

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
        
        this.chessGame.botManager.isBotThinking = false;
        
        if (this.constructor.consoleLog) {
            console.log('🤖 [GameStatusManager] Bot désactivé');
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
}

// Initialisation statique
GameStatusManager.init();

// Ajouter ces styles CSS pour les notifications améliorées
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