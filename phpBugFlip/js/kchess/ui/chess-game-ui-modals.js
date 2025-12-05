// chess-game-ui-modals.js - Gestion des modals et confirmations
class ChessModalManager {
    constructor(ui) {
        this.ui = ui;
    }

    confirmNewGame() {
        console.log('🔄 Demande de nouvelle partie');
        
        this.ui.timerManager.stopTimer();
        
        if (this.createConfirmationModal()) {
            return;
        }
        
        const isConfirmed = confirm('Êtes-vous sûr de vouloir commencer une nouvelle partie ?\n\nLa partie en cours sera perdue.');
        
        if (isConfirmed) {
            console.log('✅ Confirmation - Nouvelle partie');
            this.executeNewGame();
        } else {
            console.log('❌ Annulation - Reprise de la partie');
            this.ui.timerManager.resumeTimer();
        }
    }

    createConfirmationModal() {
        if (document.getElementById('chessConfirmationModal')) {
            return true;
        }
        
        try {
            const modal = document.createElement('div');
            modal.id = 'chessConfirmationModal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: Arial, sans-serif;
            `;
            
            modal.innerHTML = `
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                ">
                    <h3 style="margin: 0 0 15px 0; color: #333;">Nouvelle partie</h3>
                    <p style="margin: 0 0 25px 0; color: #666; line-height: 1.5;">
                        Êtes-vous sûr de vouloir commencer une nouvelle partie ?<br>
                        <strong>La partie en cours sera perdue.</strong>
                    </p>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button id="confirmNewGame" style="
                            padding: 12px 25px;
                            background: #dc3545;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                            transition: background 0.3s;
                        ">Nouvelle Partie</button>
                        <button id="cancelNewGame" style="
                            padding: 12px 25px;
                            background: #6c757d;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                        ">Annuler</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            document.getElementById('confirmNewGame').addEventListener('click', () => {
                console.log('✅ Confirmation modal - Nouvelle partie');
                this.removeConfirmationModal();
                this.executeNewGame();
            });
            
            document.getElementById('cancelNewGame').addEventListener('click', () => {
                console.log('❌ Annulation modal - Reprise de la partie');
                this.removeConfirmationModal();
                this.ui.timerManager.resumeTimer();
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    console.log('❌ Fermeture modal - Reprise de la partie');
                    this.removeConfirmationModal();
                    this.ui.timerManager.resumeTimer();
                }
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur création modal:', error);
            return false;
        }
    }

    removeConfirmationModal() {
        const modal = document.getElementById('chessConfirmationModal');
        if (modal) {
            modal.remove();
        }
    }

    executeNewGame() {
        console.log('🎮 Début de nouvelle partie - Redirection vers index.php');
        this.ui.timerManager.stopTimer();
        
        setTimeout(() => {
            window.location.href = '../index.php';
        }, 500);
    }
}