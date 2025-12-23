// bots/bot-test-interface.js - Interface de débogage et de contrôle des bots
class BotTestInterface {
    static consoleLog = true;
    static VERSION = '1.1.0';

    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log(`🤖 BotTestInterface v${this.VERSION} prêt`);
        }
    }

    /**
     * Charge la configuration de manière robuste (String "false" ou Boolean false)
     */
    static loadConfig() {
        try {
            const rawValue = window.appConfig?.debug?.console_log ?? true;
            this.consoleLog = rawValue === "false" ? false : Boolean(rawValue);
        } catch (e) {
            this.consoleLog = true;
        }
    }

    static getConfigSource() {
        return window.appConfig ? 'JSON config' : 'default';
    }

    constructor(chessGame) {
        this.chessGame = chessGame;
        this.testPanel = null;
        this.isVisible = false;
        this.constructor.loadConfig();
    }

    /**
     * Crée et affiche le panneau de contrôle dans le DOM
     */
    createTestPanel() {
        if (this.testPanel) this.testPanel.remove();

        this.testPanel = document.createElement('div');
        this.testPanel.id = 'bot-test-panel';
        this.testPanel.style.cssText = `
            position: fixed; top: 10px; right: 10px; z-index: 10000;
            background: #2c3e50; color: white; padding: 15px;
            border-radius: 8px; border: 1px solid #34495e;
            font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 12px;
            width: 280px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        `;

        this.updatePanelContent();
        document.body.appendChild(this.testPanel);
        this.isVisible = true;
    }

    /**
     * Génère le HTML dynamique basé sur l'état du jeu
     */
    updatePanelContent() {
        const status = this.chessGame.getBotStatus();
        
        this.testPanel.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #3e5871; padding-bottom:5px;">
                <span style="color:#3498db; font-weight:bold;">🤖 BOT DEBUGGER</span>
                <button id="close-test-panel" style="background:none; border:none; color:#95a5a6; cursor:pointer; font-size:16px;">&times;</button>
            </div>
            
            <div style="background:#34495e; padding:10px; border-radius:4px; margin-bottom:12px; line-height:1.6;">
                <b>Statut :</b> ${status.active ? '🟢 Actif' : '🔴 Inactif'}<br>
                <b>Bot :</b> ${status.name} (Lvl ${status.level})<br>
                <b>Couleur :</b> ${status.color === 'white' ? '⚪ Blanc' : '⚫ Noir'}
            </div>

            <div class="panel-section" style="margin-bottom:10px;">
                <div style="margin-bottom:5px; font-weight:bold; font-size:10px; color:#bdc3c7; text-transform:uppercase;">Niveaux</div>
                <div style="display:flex; gap:4px;">
                    <button class="btn-ctrl" data-action="level" data-val="0" style="flex:1; background:#e74c3c; border:none; color:white; padding:4px; border-radius:3px; cursor:pointer;">Off</button>
                    <button class="btn-ctrl" data-action="level" data-val="1" style="flex:1; background:#27ae60; border:none; color:white; padding:4px; border-radius:3px; cursor:pointer;">Lvl 1</button>
                    <button class="btn-ctrl" data-action="level" data-val="2" style="flex:1; background:#2980b9; border:none; color:white; padding:4px; border-radius:3px; cursor:pointer;">Lvl 2</button>
                </div>
            </div>

            <div class="panel-section" style="margin-bottom:10px;">
                <div style="margin-bottom:5px; font-weight:bold; font-size:10px; color:#bdc3c7; text-transform:uppercase;">Actions Directes</div>
                <div style="display:flex; gap:4px;">
                    <button id="force-move" style="flex:1; background:#f39c12; border:none; color:white; padding:6px; border-radius:3px; cursor:pointer; font-weight:bold;">Jouer Coup</button>
                    <button id="test-logic" style="flex:1; background:#8e44ad; border:none; color:white; padding:6px; border-radius:3px; cursor:pointer;">Simuler</button>
                </div>
            </div>

            <div id="test-results" style="background:#1a252f; padding:8px; border-radius:4px; font-family:monospace; font-size:10px; height:80px; overflow-y:auto; color:#2ecc71;">
                > Prêt pour diagnostic...
            </div>
        `;

        this.attachEvents();
    }

    attachEvents() {
        // Fermeture
        this.testPanel.querySelector('#close-test-panel').onclick = () => this.hideTestPanel();

        // Changement de niveau
        this.testPanel.querySelectorAll('[data-action="level"]').forEach(btn => {
            btn.onclick = () => {
                const lvl = parseInt(btn.dataset.val);
                this.chessGame.setBotLevel(lvl);
                this.log(`Niveau changé vers ${lvl}`);
                this.updatePanelContent();
            };
        });

        // Forcer coup
        this.testPanel.querySelector('#force-move').onclick = () => {
            this.log("Demande de coup forcée...");
            this.chessGame.playBotMove();
        };

        // Simuler/Tester logique
        this.testPanel.querySelector('#test-logic').onclick = () => this.runDiagnostic();
    }

    /**
     * Exécute une série de tests sur le bot actuel
     */
    runDiagnostic() {
        const bot = this.chessGame.core.bot;
        if (!bot) return this.log("❌ Erreur: Aucun bot chargé");

        try {
            const fen = window.FENGenerator?.generateFEN(this.chessGame.gameState, this.chessGame.board) || "N/A";
            const move = bot.getMove(fen);
            
            this.log(`FEN: ${fen.substring(0, 15)}...`);
            if (move) {
                this.log(`✅ Coup calculé: [${move.fromRow},${move.fromCol}] -> [${move.toRow},${move.toCol}]`);
            } else {
                this.log("⚠️ Le bot ne trouve pas de coup.");
            }
        } catch (e) {
            this.log(`❌ Crash: ${e.message}`);
        }
    }

    log(msg) {
        const logDiv = this.testPanel?.querySelector('#test-results');
        if (logDiv) {
            const time = new Date().toLocaleTimeString().split(' ')[0];
            logDiv.innerHTML = `<div>[${time}] ${msg}</div>` + logDiv.innerHTML;
        }
        if (this.constructor.consoleLog) console.log(`[BotInterface] ${msg}`);
    }

    hideTestPanel() {
        if (this.testPanel) {
            this.testPanel.remove();
            this.testPanel = null;
        }
        this.isVisible = false;
    }

    toggle() {
        this.isVisible ? this.hideTestPanel() : this.createTestPanel();
    }
}

// Initialisation
BotTestInterface.init();
window.BotTestInterface = BotTestInterface;

/**
 * Injection automatique du bouton de trigger en local
 */
document.addEventListener('DOMContentLoaded', () => {
    // On attend un peu que le jeu soit prêt
    setTimeout(() => {
        if (!window.chessGame || !BotTestInterface.consoleLog) return;

        const trigger = document.createElement('button');
        trigger.innerHTML = '🧪 Debug Bot';
        trigger.style.cssText = `
            position: fixed; bottom: 15px; right: 15px; z-index: 9999;
            background: #e74c3c; color: white; border: none; padding: 10px 15px;
            border-radius: 30px; cursor: pointer; font-weight: bold; font-size: 11px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: transform 0.2s;
        `;
        
        const ui = new BotTestInterface(window.chessGame);
        trigger.onclick = () => ui.toggle();
        trigger.onmouseover = () => trigger.style.transform = 'scale(1.1)';
        trigger.onmouseout = () => trigger.style.transform = 'scale(1.0)';
        
        document.body.appendChild(trigger);
        window.botTestInterfaceInstance = ui;
    }, 1500);
});