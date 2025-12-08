// bots/bot-test-interface.js - Interface de test pour les bots
class BotTestInterface {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('bots/bot-test-interface.js loaded');
        }
    }

    constructor(chessGame) {
        this.chessGame = chessGame;
        this.testPanel = null;
        this.isVisible = false;
        
        if (this.constructor.consoleLog) {
            console.log('🤖 [BotTestInterface] Interface de test pour bots initialisée');
        }
    }

    // Créer l'interface de test
    createTestPanel() {
        if (this.testPanel) {
            if (this.constructor.consoleLog) {
                console.log('🗑️ [BotTestInterface] Suppression de l\'ancien panneau de test');
            }
            this.testPanel.remove();
        }

        this.testPanel = document.createElement('div');
        this.testPanel.id = 'bot-test-panel';
        this.testPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            background: #2c3e50;
            color: white;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #34495e;
            font-family: Arial, sans-serif;
            font-size: 12px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;

        this.testPanel.innerHTML = this.getPanelHTML();
        document.body.appendChild(this.testPanel);

        this.attachEventListeners();
        this.isVisible = true;
        
        if (this.constructor.consoleLog) {
            console.log('✅ [BotTestInterface] Panneau de test créé et affiché');
        }
    }

    // HTML du panneau de test
    getPanelHTML() {
        const botStatus = this.chessGame.getBotStatus();
        
        if (this.constructor.consoleLog) {
            console.log('📊 [BotTestInterface] Récupération statut bot:', botStatus);
        }
        
        return `
            <div style="margin-bottom: 10px;">
                <strong style="color: #3498db;">🤖 Interface Test Bot</strong>
                <button id="close-test-panel" style="float: right; background: #e74c3c; color: white; border: none; border-radius: 3px; padding: 2px 6px; cursor: pointer;" title="Fermer le panneau">×</button>
            </div>
            
            <div style="background: #34495e; padding: 8px; border-radius: 4px; margin-bottom: 10px;">
                <strong>Statut actuel:</strong><br>
                • Actif: ${botStatus.active ? '✅' : '❌'}<br>
                • Niveau: ${botStatus.level}<br>
                • Couleur: ${botStatus.color}<br>
                • Nom: ${botStatus.name}<br>
                • Réflexion: ${botStatus.thinking ? '🤔' : '💤'}
            </div>

            <div style="margin-bottom: 10px;">
                <strong>Configuration:</strong>
                <div style="display: flex; gap: 5px; margin-top: 5px;">
                    <button class="bot-btn" data-level="0" style="flex: 1; background: #e74c3c; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer;">Désactiver</button>
                    <button class="bot-btn" data-level="1" style="flex: 1; background: #27ae60; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer;">Niveau 0</button>
                </div>
            </div>

            <div style="margin-bottom: 10px;">
                <strong>Couleur du bot:</strong>
                <div style="display: flex; gap: 5px; margin-top: 5px;">
                    <button class="color-btn" data-color="white" style="flex: 1; background: #ecf0f1; color: #2c3e50; border: none; padding: 5px; border-radius: 3px; cursor: pointer;">Blanc</button>
                    <button class="color-btn" data-color="black" style="flex: 1; background: #2c3e50; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer;">Noir</button>
                </div>
            </div>

            <div style="margin-bottom: 10px;">
                <strong>Actions:</strong>
                <div style="display: flex; gap: 5px; margin-top: 5px;">
                    <button id="force-bot-move" style="flex: 1; background: #f39c12; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer;">Forcer Coup</button>
                    <button id="test-bot" style="flex: 1; background: #9b59b6; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer;">Test Bot</button>
                </div>
            </div>

            <div style="margin-bottom: 10px;">
                <strong>Debug:</strong>
                <div style="display: flex; gap: 5px; margin-top: 5px;">
                    <button id="show-status" style="flex: 1; background: #95a5a6; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer;">Statut</button>
                    <button id="test-moves" style="flex: 1; background: #1abc9c; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer;">Coups Valides</button>
                </div>
            </div>

            <div id="test-results" style="background: #34495e; padding: 8px; border-radius: 4px; margin-top: 10px; font-size: 11px; max-height: 100px; overflow-y: auto;">
                <em>Résultats des tests...</em>
            </div>
        `;
    }

    // Attacher les événements
    attachEventListeners() {
        // Bouton fermer
        this.testPanel.querySelector('#close-test-panel').addEventListener('click', () => {
            this.hideTestPanel();
        });

        // Boutons niveau bot
        this.testPanel.querySelectorAll('.bot-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = parseInt(e.target.dataset.level);
                if (this.constructor.consoleLog) {
                    console.log(`⚙️ [BotTestInterface] Configuration du bot au niveau ${level}`);
                }
                this.chessGame.setBotLevel(level);
                this.updatePanel();
                this.logTest(`Bot niveau ${level} activé`);
            });
        });

        // Boutons couleur
        this.testPanel.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                if (this.constructor.consoleLog) {
                    console.log(`🎨 [BotTestInterface] Changement de couleur du bot: ${color}`);
                }
                this.chessGame.setBotColor(color);
                this.updatePanel();
                this.logTest(`Couleur bot changée: ${color}`);
            });
        });

        // Forcer un coup
        this.testPanel.querySelector('#force-bot-move').addEventListener('click', () => {
            if (this.constructor.consoleLog) {
                console.log('▶️ [BotTestInterface] Forçage d\'un coup par le bot');
            }
            this.logTest('Forçage coup bot...');
            this.chessGame.playBotMove();
        });

        // Tester le bot
        this.testPanel.querySelector('#test-bot').addEventListener('click', () => {
            if (this.constructor.consoleLog) {
                console.log('🧪 [BotTestInterface] Démarrage du test du bot');
            }
            this.testBot();
        });

        // Afficher statut
        this.testPanel.querySelector('#show-status').addEventListener('click', () => {
            if (this.constructor.consoleLog) {
                console.log('📈 [BotTestInterface] Affichage du statut détaillé du bot');
            }
            const status = this.chessGame.getBotStatus();
            this.logTest('Statut bot: ' + JSON.stringify(status, null, 2));
        });

        // Tester coups valides
        this.testPanel.querySelector('#test-moves').addEventListener('click', () => {
            if (this.constructor.consoleLog) {
                console.log('🔍 [BotTestInterface] Test des coups valides');
            }
            this.testValidMoves();
        });
    }

    // Mettre à jour le panneau
    updatePanel() {
        if (this.testPanel) {
            if (this.constructor.consoleLog) {
                console.log('🔄 [BotTestInterface] Mise à jour du panneau de test');
            }
            this.testPanel.innerHTML = this.getPanelHTML();
            this.attachEventListeners();
        }
    }

    // Cacher le panneau
    hideTestPanel() {
        if (this.testPanel) {
            if (this.constructor.consoleLog) {
                console.log('👋 [BotTestInterface] Fermeture du panneau de test');
            }
            this.testPanel.remove();
            this.testPanel = null;
        }
        this.isVisible = false;
    }

    // Basculer la visibilité
    toggleTestPanel() {
        if (this.isVisible) {
            this.hideTestPanel();
        } else {
            this.createTestPanel();
        }
    }

    // Logger les résultats de test
    logTest(message) {
        const resultsDiv = this.testPanel.querySelector('#test-results');
        if (resultsDiv) {
            const timestamp = new Date().toLocaleTimeString();
            resultsDiv.innerHTML = `<div>[${timestamp}] ${message}</div>` + resultsDiv.innerHTML;
        }
        console.log('📝 [BotTestInterface] ' + message);
    }

    // Tester le bot
    testBot() {
        this.logTest('Début test bot...');
        
        const bot = this.chessGame.core.bot;
        if (!bot) {
            if (this.constructor.consoleLog) {
                console.log('❌ [BotTestInterface] Aucun bot activé pour le test');
            }
            this.logTest('❌ Aucun bot activé');
            return;
        }

        try {
            const currentFEN = FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board);
            this.logTest(`FEN actuel: ${currentFEN}`);
            
            const move = bot.getMove(currentFEN);
            if (move) {
                this.logTest(`✅ Coup proposé: ${move.fromRow},${move.fromCol} → ${move.toRow},${move.toCol}`);
                if (this.constructor.consoleLog) {
                    console.log(`✅ [BotTestInterface] Coup proposé par le bot: ${move.fromRow},${move.fromCol} → ${move.toRow},${move.toCol}`);
                }
            } else {
                this.logTest('❌ Aucun coup proposé');
                if (this.constructor.consoleLog) {
                    console.log('❌ [BotTestInterface] Le bot n\'a proposé aucun coup');
                }
            }
        } catch (error) {
            this.logTest(`❌ Erreur test: ${error.message}`);
            if (this.constructor.consoleLog) {
                console.log(`❌ [BotTestInterface] Erreur lors du test: ${error.message}`);
            }
        }
    }

    // Tester les coups valides
    testValidMoves() {
        this.logTest('Test coups valides...');
        
        const bot = this.chessGame.core.bot;
        if (!bot || !bot.getAllValidMoves) {
            this.logTest('❌ Bot ou méthode getAllValidMoves non disponible');
            if (this.constructor.consoleLog) {
                console.log('❌ [BotTestInterface] Bot ou méthode getAllValidMoves non disponible');
            }
            return;
        }

        try {
            const moves = bot.getAllValidMoves();
            this.logTest(`📊 ${moves.length} coups valides trouvés`);
            
            if (this.constructor.consoleLog) {
                console.log(`📊 [BotTestInterface] ${moves.length} coups valides trouvés`);
            }
            
            // Afficher les 5 premiers coups
            moves.slice(0, 5).forEach((move, index) => {
                this.logTest(`• ${index + 1}: ${move.from.row},${move.from.col} → ${move.to.row},${move.to.col} (${move.piece.type})`);
            });
            
            if (moves.length > 5) {
                this.logTest(`... et ${moves.length - 5} autres coups`);
            }
        } catch (error) {
            this.logTest(`❌ Erreur test coups: ${error.message}`);
            if (this.constructor.consoleLog) {
                console.log(`❌ [BotTestInterface] Erreur lors du test des coups: ${error.message}`);
            }
        }
    }
}

// Auto-ajout de l'interface en développement
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.chessGame && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            if (BotTestInterface.consoleLog) {
                console.log('🚀 [BotTestInterface] Auto-ajout de l\'interface en environnement de développement');
            }
            
            window.botTestInterface = new BotTestInterface(window.chessGame);
            
            // Ajouter un bouton pour ouvrir l'interface
            const toggleBtn = document.createElement('button');
            toggleBtn.innerHTML = '🧪 Test Bot';
            toggleBtn.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                z-index: 9999;
                background: #e74c3c;
                color: white;
                border: none;
                border-radius: 20px;
                padding: 8px 12px;
                font-size: 12px;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            `;
            toggleBtn.addEventListener('click', () => {
                if (BotTestInterface.consoleLog) {
                    console.log('🎛️ [BotTestInterface] Bouton de test cliqué - basculement du panneau');
                }
                window.botTestInterface.toggleTestPanel();
            });
            
            document.body.appendChild(toggleBtn);
            if (BotTestInterface.consoleLog) {
                console.log('✅ [BotTestInterface] Interface de test bot ajoutée au DOM');
            }
        }
    }, 2000);
});

// Initialisation statique
BotTestInterface.init();

window.BotTestInterface = BotTestInterface;