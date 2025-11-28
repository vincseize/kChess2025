// game-status-manager.js - Gestion du statut de jeu (échec, mat, pat, nullité)
class GameStatusManager {
    constructor(chessGame) {
        this.chessGame = chessGame;
        this.lastCheckAlert = null;
    }

    updateGameStatus() {
        // Retirer les anciennes surbrillances d'échec
        this.chessGame.board.squares.forEach(square => {
            square.element.classList.remove('king-in-check', 'checkmate', 'stalemate');
        });

        const currentFEN = FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board);
        console.log('🔍 Vérification statut jeu avec FEN:', currentFEN);
        
        // Vérifier l'échec et mat
        const mateEngine = new ChessMateEngine(currentFEN);
        const whiteCheckmate = mateEngine.isCheckmate('w');
        const blackCheckmate = mateEngine.isCheckmate('b');
        
        // Vérifier le pat
        const patEngine = new ChessPatEngine(currentFEN);
        const whiteStalemate = patEngine.isStalemate('w');
        const blackStalemate = patEngine.isStalemate('b');
        
        // Vérifier les autres conditions de nullité
        const nulleEngine = new ChessNulleEngine(currentFEN, this.chessGame.gameState.moveHistory.map(m => m.fen));
        const drawResult = nulleEngine.isDraw(this.chessGame.gameState.halfMoveClock);
        
        console.log('🔍 Échec et mat blanc:', whiteCheckmate);
        console.log('🔍 Échec et mat noir:', blackCheckmate);
        console.log('🔍 Pat blanc:', whiteStalemate);
        console.log('🔍 Pat noir:', blackStalemate);
        console.log('🔍 Autres nullités:', drawResult);
        console.log('🔍 HalfMoveClock actuel:', this.chessGame.gameState.halfMoveClock);

        // 1. Vérifier l'échec et mat
        if (whiteCheckmate) {
            this.handleCheckmate('white');
            return;
        }
        
        if (blackCheckmate) {
            this.handleCheckmate('black');
            return;
        }

        // 2. Vérifier le pat
        if (whiteStalemate) {
            this.handleStalemate('white');
            return;
        }
        
        if (blackStalemate) {
            this.handleStalemate('black');
            return;
        }

        // 3. Vérifier les autres nullités
        if (drawResult.isDraw) {
            this.handleDraw(drawResult.reason);
            return;
        }

        // 4. Vérifier les échecs simples
        this.updateCheckDisplay(currentFEN);

        // 5. Vérifier si c'est au bot de jouer
        if (this.chessGame.botManager.isBotTurn()) {
            console.log('🤖 C\'est au tour du bot de jouer');
            this.chessGame.botManager.playBotMove();
        }
    }

    handleCheckmate(kingColor) {
        const kingPos = this.findKingPosition(kingColor);
        console.log('💀 ÉCHEC ET MAT ! Roi', kingColor, 'trouvé à:', kingPos);
        
        if (kingPos) {
            const kingSquare = this.chessGame.board.getSquare(kingPos.row, kingPos.col);
            if (kingSquare) {
                kingSquare.element.classList.add('checkmate');
            }
        }
        
        const winner = kingColor === 'white' ? 'black' : 'white';
        this.showNotification(`Échec et mat ! Roi ${kingColor === 'white' ? 'blanc' : 'noir'} mat. Les ${winner === 'white' ? 'blancs' : 'noirs'} gagnent !`, 'danger');
        console.log(`💀 ÉCHEC ET MAT ! Victoire des ${winner === 'white' ? 'blancs' : 'noirs'}`);
        
        this.endGame(winner);
    }

    handleStalemate(kingColor) {
        const kingPos = this.findKingPosition(kingColor);
        console.log('♟️ PAT ! Roi', kingColor, 'trouvé à:', kingPos);
        
        if (kingPos) {
            const kingSquare = this.chessGame.board.getSquare(kingPos.row, kingPos.col);
            if (kingSquare) {
                kingSquare.element.classList.add('stalemate');
            }
        }
        
        this.showNotification(`Pat ! Roi ${kingColor === 'white' ? 'blanc' : 'noir'} pat. Partie nulle.`, 'warning');
        console.log(`♟️ PAT ! Partie nulle`);
        
        this.endGame('draw');
    }

    handleDraw(reason) {
        const currentFEN = FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board);
        const nulleEngine = new ChessNulleEngine(currentFEN, this.chessGame.gameState.moveHistory.map(m => m.fen));
        
        const message = nulleEngine.getDrawMessage(reason);
        const description = nulleEngine.getDrawDescription(reason);
        
        this.showNotification(`${message} ${description}`, 'info');
        console.log(`🤝 NULLITÉ ! ${message}`);
        
        this.endGame('draw', reason);
    }

    updateCheckDisplay(currentFEN) {
        const engine = new ChessEngine(currentFEN);
        const whiteInCheck = engine.isKingInCheck('w');
        const blackInCheck = engine.isKingInCheck('b');

        console.log('🔍 Échec roi blanc:', whiteInCheck);
        console.log('🔍 Échec roi noir:', blackInCheck);

        if (whiteInCheck) {
            const kingPos = this.findKingPosition('white');
            console.log('🚨 ROI BLANC EN ÉCHEC trouvé à:', kingPos);
            if (kingPos) {
                const kingSquare = this.chessGame.board.getSquare(kingPos.row, kingPos.col);
                if (kingSquare) {
                    kingSquare.element.classList.add('king-in-check');
                    this.showCheckAlert('white');
                }
            }
        }

        if (blackInCheck) {
            const kingPos = this.findKingPosition('black');
            console.log('🚨 ROI NOIR EN ÉCHEC trouvé à:', kingPos);
            if (kingPos) {
                const kingSquare = this.chessGame.board.getSquare(kingPos.row, kingPos.col);
                if (kingSquare) {
                    kingSquare.element.classList.add('king-in-check');
                    this.showCheckAlert('black');
                }
            }
        }
    }

    showCheckAlert(kingColor) {
        if (this.lastCheckAlert === kingColor) return;
        
        this.lastCheckAlert = kingColor;
        
        this.showNotification(`Roi ${kingColor === 'white' ? 'blanc' : 'noir'} ECHEC`);
        console.log(`🚨 ÉCHEC ! Roi ${kingColor} en danger`);
        
        setTimeout(() => {
            this.lastCheckAlert = null;
        }, 2000);
    }

    endGame(result, reason = null) {
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
            message = `Partie terminée ! Vainqueur : ${result}`;
        }
        
        console.log(`🏆 ${message}`);
        
        if (this.chessGame.ui && this.chessGame.ui.stopPlayerTimer) {
            this.chessGame.ui.stopPlayerTimer();
        }
        
        if (this.chessGame.ui && this.chessGame.ui.showGameOver) {
            this.chessGame.ui.showGameOver(result, reason);
        }
        
        this.chessGame.botManager.isBotThinking = false;
    }

    findKingPosition(color) {
        const kingType = 'king';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.chessGame.board.getSquare(row, col);
                if (square.piece && 
                    square.piece.type === kingType && 
                    square.piece.color === color) {
                    console.log(`🔍 Roi ${color} trouvé à [${row},${col}]`);
                    return { row, col };
                }
            }
        }
        console.warn(`❌ Roi ${color} non trouvé !`);
        return null;
    }

    showNotification(message, type = 'info') {
        console.log('🔔 Tentative d\'affichage notification:', message);
        
        const existingNotifications = document.querySelectorAll('.chess-notification');
        existingNotifications.forEach(notif => {
            console.log('🗑️ Suppression notification existante');
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

        console.log('📝 Ajout de la notification au DOM');
        document.body.appendChild(notification);

        setTimeout(() => {
            console.log('⏰ Suppression programmée de la notification');
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                    console.log('✅ Notification supprimée');
                }
            }, 300);
        }, 3000);
    }
}