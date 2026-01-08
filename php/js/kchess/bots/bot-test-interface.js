// bots/bot-test-interface.js
if (typeof BotTestInterface !== 'undefined') {
    console.warn('⚠️ BotTestInterface déjà chargé.');
} else {

class BotTestInterface {
    static consoleLog = true;
    static VERSION = '1.2.0';

    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log(`🤖 BotTestInterface v${this.VERSION} prêt`);
    }

    static loadConfig() {
        try {
            const config = window.appConfig?.debug?.console_log ?? true;
            this.consoleLog = String(config) !== "false";
        } catch (e) { this.consoleLog = true; }
    }

    constructor(chessGame) {
        this.chessGame = chessGame;
        this.testPanel = null;
        this.isVisible = false;
        this.constructor.loadConfig();
    }

    /**
     * Crée le panneau de contrôle avec un design plus "Console"
     */
    createTestPanel() {
        if (this.testPanel) this.testPanel.remove();

        this.testPanel = document.createElement('div');
        this.testPanel.id = 'bot-test-panel';
        this.testPanel.style.cssText = `
            position: fixed; top: 10px; right: 10px; z-index: 10000;
            background: #1e1e1e; color: #d4d4d4; padding: 15px;
            border-radius: 8px; border: 1px solid #333;
            font-family: 'Consolas', monospace; font-size: 12px;
            width: 300px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;

        this.updatePanelContent();
        document.body.appendChild(this.testPanel);
        this.isVisible = true;
    }

    updatePanelContent() {
        if (!this.testPanel) return;
        
        // Récupération sécurisée du statut via le BotManager de la partie
        const status = this.chessGame.botManager?.getStatus() || { level: 0, active: false };
        
        this.testPanel.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid #333; padding-bottom:5px;">
                <span style="color:#007acc; font-weight:bold;">> BOT_DEBUGGER_OS</span>
                <button id="close-test-panel" style="background:none; border:none; color:#666; cursor:pointer;">[X]</button>
            </div>
            
            <div style="background:#252526; padding:8px; border-radius:4px; margin-bottom:12px; border-left: 3px solid ${status.active ? '#4ec9b0' : '#f44747'}">
                <b>Status:</b> ${status.active ? 'RUNNING' : 'STOPPED'}<br>
                <b>Level:</b> ${status.level} | <b>Moves:</b> ${status.moveCount || 0}
            </div>

            <div style="margin-bottom:10px;">
                <div style="font-size:10px; color:#666; margin-bottom:4px;">SWITCH_LEVEL</div>
                <div style="display:flex; gap:4px;">
                    ${[0, 1, 2, 3].map(l => `
                        <button class="btn-lvl" data-val="${l}" style="flex:1; background:${status.level === l ? '#007acc' : '#333'}; border:none; color:white; padding:4px; cursor:pointer;">${l === 0 ? 'OFF' : l}</button>
                    `).join('')}
                </div>
            </div>

            <div style="display:flex; gap:4px; margin-bottom:10px;">
                <button id="force-move" style="flex:2; background:#333; border:1px solid #555; color:#ce9178; padding:6px; cursor:pointer;">Execute_Move()</button>
                <button id="test-diag" style="flex:1; background:#333; border:1px solid #555; color:#9cdcfe; padding:6px; cursor:pointer;">Diag</button>
            </div>

            <div id="test-results" style="background:#000; padding:8px; border-radius:4px; font-size:10px; height:120px; overflow-y:auto; color:#b5cea8; border:1px solid #333;">
                <div>> Initializing diagnostic...</div>
            </div>
        `;

        this.attachEvents();
    }

    attachEvents() {
        this.testPanel.querySelector('#close-test-panel').onclick = () => this.toggle();
        
        this.testPanel.querySelectorAll('.btn-lvl').forEach(btn => {
            btn.onclick = () => {
                const lvl = parseInt(btn.dataset.val);
                this.chessGame.botManager?.setBotLevel(lvl);
                this.updatePanelContent();
                this.log(`Level set to: ${lvl}`);
            };
        });

        this.testPanel.querySelector('#force-move').onclick = () => {
            this.log("Manual trigger: playBotMove()");
            this.chessGame.botManager?.playBotMove();
        };

        this.testPanel.querySelector('#test-diag').onclick = () => this.runDiagnostic();
    }

    runDiagnostic() {
        const bm = this.chessGame.botManager;
        if (!bm || !bm.bot) return this.log("ERR: NO_BOT_ACTIVE");

        try {
            const fen = window.FENGenerator?.generateFEN(this.chessGame.gameState, this.chessGame.board) || "N/A";
            this.log(`FEN_DAT: ${fen.substring(0, 20)}...`);
            
            const start = performance.now();
            const move = bm.bot.getMove(fen);
            const end = performance.now();
            
            if (move) {
                this.log(`SUCCESS: Move found in ${(end-start).toFixed(1)}ms`);
                this.log(`SRC: [${move.fromRow},${move.fromCol}] DST: [${move.toRow},${move.toCol}]`);
            } else {
                this.log("WARN: BOT_RETURNED_NULL");
            }
        } catch (e) {
            this.log(`CRASH: ${e.message}`);
        }
    }

    log(msg) {
        const logDiv = this.testPanel?.querySelector('#test-results');
        if (logDiv) {
            const entry = document.createElement('div');
            entry.style.marginBottom = '2px';
            entry.innerHTML = `<span style="color:#666">[${new Date().toLocaleTimeString().split(' ')[0]}]</span> ${msg}`;
            logDiv.appendChild(entry);
            logDiv.scrollTop = logDiv.scrollHeight;
        }
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.isVisible ? this.createTestPanel() : (this.testPanel?.remove(), this.testPanel = null);
    }
}

BotTestInterface.init();
window.BotTestInterface = BotTestInterface;

// Injection simplifiée
if (document.readyState === 'complete') {
    injectTrigger();
} else {
    window.addEventListener('load', injectTrigger);
}

function injectTrigger() {
    setTimeout(() => {
        if (!window.chessGame) return;
        const trigger = document.createElement('div');
        trigger.innerHTML = '⚙️';
        trigger.title = 'Bot Debugger';
        trigger.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; z-index: 9999;
            background: #333; color: white; width: 40px; height: 40px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 50%; cursor: pointer; font-size: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        `;
        
        const ui = new BotTestInterface(window.chessGame);
        trigger.onclick = () => ui.toggle();
        document.body.appendChild(trigger);
    }, 1000);
}

}