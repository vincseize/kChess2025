/**
 * ui/chess-events.js - Version 1.3.2
 * Système unifié de gestion des événements et de l'interface.
 * Correction : Affichage robuste du niveau du Bot et correction syntaxique.
 */
class ChessEventsManager {
    
    static VERSION = '1.3.2';
    static consoleLog = true;

    // ============================================
    // 1. SYSTÈME DE LOGS STATIQUE
    // ============================================
    static log(message, type = 'info', data = null) {
        if (!this.consoleLog && (type === 'info' || type === 'config')) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const icons = { 
            info: '🔍', success: '✅', warn: '⚠️', 
            error: '❌', config: '⚙️', lang: '🌐', action: '⚡' 
        };
        const icon = icons[type] || '⚪';
        
        console.log(`${icon} [ChessEvents ${timestamp}] ${message}`);
        if (data && this.consoleLog) console.dir(data);
    }

    // ============================================
    // 2. CONFIGURATION ET INITIALISATION
    // ============================================
    static init() {
        this.loadConfig();
        this.log(`Initialisé - v${this.VERSION} (${this.getConfigSource()})`, 'success');
    }

    static loadConfig() {
        try {
            const config = window.appConfig?.debug || window.appConfig?.chess_engine;
            if (config?.console_log !== undefined) {
                this.consoleLog = String(config.console_log).toLowerCase() !== "false";
                return true;
            }
            if (typeof window.getConfig === 'function') {
                const val = window.getConfig('debug.console_log', 'true');
                this.consoleLog = String(val).toLowerCase() !== "false";
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    static getConfigSource() {
        if (window.appConfig) return 'JSON config';
        if (typeof window.getConfig === 'function') return 'getConfig utility';
        return 'default';
    }

    // ============================================
    // 3. GESTION DE LA LOCALISATION
    // ============================================
    static getTranslations() {
        try {
            const cfg = window.appConfig;
            if (!cfg || !cfg.lang) return {};

            let langCode = cfg.current_lang || localStorage.getItem('charlychess_lang');

            if (!langCode || !cfg.lang[langCode]) {
                const browserLang = (navigator.language || 'fr').substring(0, 2);
                langCode = cfg.lang[browserLang] ? browserLang : (cfg.default_lang || 'fr');
            }

            return cfg.lang[langCode] || cfg.lang['fr'] || {};
        } catch (error) {
            return {};
        }
    }

    // ============================================
    // 4. MISE À JOUR DE L'INTERFACE (UI)
    // ============================================
    static updatePlayerLabels() {
        const topLabel = document.getElementById('topPlayerLabel');
        const bottomLabel = document.getElementById('bottomPlayerLabel');
        
        if (!topLabel || !bottomLabel) return;

        try {
            const t = this.getTranslations();
            const isFlipped = window.chessGame?.core?.gameState?.boardFlipped || false;
            
            // 1. CHERCHER LE NIVEAU PARTOUT (URL d'abord, puis moteur)
            const urlParams = new URLSearchParams(window.location.search);
            const levelFromUrl = urlParams.get('level');
            
            let botStatus = window.chessGame?.getBotStatus?.() || { active: false, level: 0, color: '' };
            
            // FORCE le mode bot si l'URL le dit, même si le moteur dit non
            if (urlParams.get('mode') === 'bot') {
                botStatus.active = true;
                // Le verrou : Priorité absolue à l'URL pour le numéro du niveau
                botStatus.level = levelFromUrl || botStatus.level || 1; 
                
                if (!botStatus.color) {
                    botStatus.color = urlParams.get('color') === 'black' ? 'white' : 'black';
                }
            }

            const labels = { white: t.white || 'White', black: t.black || 'Black' };
            let topColor = isFlipped ? 'white' : 'black';
            let bottomColor = isFlipped ? 'black' : 'white';

            const buildUI = (color) => {
                let text = labels[color];
                const isBot = botStatus.active && botStatus.color === color;
                let cssClass = `badge p-2 ${color === 'white' ? 'bg-white text-dark border border-dark' : 'bg-dark text-white'}`;
                
                if (isBot) {
                    // On utilise botStatus.level qui est maintenant verrouillé avec l'URL
                    const botLevelText = this.getBotText(botStatus.level, t);
                    text += ` (${botLevelText})`;
                    cssClass += ` bot-player bot-color-${color}`;
                }

                const icon = isBot ? 'bi-cpu' : 'bi-person';
                return { html: `<i class="bi ${icon} me-1"></i> ${text}`, className: cssClass };
            };

            const topUI = buildUI(topColor);
            const bottomUI = buildUI(bottomColor);

            topLabel.innerHTML = topUI.html;
            topLabel.className = topUI.className;
            bottomLabel.innerHTML = bottomUI.html;
            bottomLabel.className = bottomUI.className;

            this.log(`Labels fixés - Bot: ${botStatus.color}, Level: ${botStatus.level}`, 'success');

        } catch (error) {
            this.log(`Erreur updateLabels: ${error.message}`, 'error');
        }
    }

    /**
     * Traduction ou construction du texte du Bot
     */
    static getBotText(level, translations) {
        if (!level || level === 0) return translations.computer_player || 'Bot';
        
        // Tentative clé specifique (ex: bot_level_1)
        const key = `bot_level_${level}`;
        if (translations[key]) return translations[key];
        
        // Fallback standard
        return `Bot Level ${level}`;
    }
} // Fin de la classe ChessEventsManager


// ============================================
// 5. FONCTIONS GLOBALES D'ACTION (Hors classe)
// ============================================

function flipBoardWithLabelsUpdate() {
    ChessEventsManager.log('Action : Flip Board', 'action');
    const target = window.chessGame?.flipBoard ? window.chessGame : window.chessGame?.core;

    if (typeof target?.flipBoard === 'function') {
        target.flipBoard();
        // Petit délai pour laisser le temps au moteur de mettre à jour son gameState
        setTimeout(() => ChessEventsManager.updatePlayerLabels(), 100);
    } else {
        ChessEventsManager.updatePlayerLabels();
    }
}

function confirmNewGame() {
    ChessEventsManager.log('Action : Demande Nouvelle Partie', 'action');
    const modal = window.chessGame?.core?.ui?.modalManager;
    
    if (typeof modal?.confirmNewGame === 'function') {
        return modal.confirmNewGame().then(result => {
            if (result) setTimeout(() => ChessEventsManager.updatePlayerLabels(), 800);
            return result;
        });
    }

    if (confirm('Nouvelle partie ?\n\nLa partie actuelle sera perdue.')) {
        window.location.href = 'index.php';
        return true;
    }
    return false;
}

function copyPGN() {
    if (window.chessGame?.copyPGN) {
        window.chessGame.copyPGN();
        ChessEventsManager.log('PGN copié', 'success');
    }
}

function copyFEN() {
    if (window.chessGame?.copyFEN) {
        window.chessGame.copyFEN();
        ChessEventsManager.log('FEN copié', 'success');
    }
}

// ============================================
// 6. INITIALISATION DU DOM ET ÉVÉNEMENTS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    ChessEventsManager.init();
    
    // Initialisation ChessGame si nécessaire
    if (typeof ChessGame !== 'undefined' && !window.chessGame) {
        window.chessGame = new ChessGame();
    }

    // Liaison avec le core pour les futures mises à jour
    if (window.chessGame?.core) {
        window.chessGame.core.updatePlayerLabels = () => ChessEventsManager.updatePlayerLabels();
    }

    // Setup Boutons avec clonage pour éviter les doubles events (Bootstrap/Mobile)
    const bindActions = (selector, action) => {
        document.querySelectorAll(selector).forEach(el => {
            const newEl = el.cloneNode(true); 
            el.parentNode.replaceChild(newEl, el);
            newEl.addEventListener('click', (e) => { e.preventDefault(); action(); });
            newEl.style.cursor = 'pointer';
        });
    };

    bindActions('#newGame, .new-game-btn', confirmNewGame);
    bindActions('#flipBoard, .flip-board-btn', flipBoardWithLabelsUpdate);
    
    if (document.getElementById('copyPGN')) document.getElementById('copyPGN').onclick = copyPGN;
    if (document.getElementById('copyFEN')) document.getElementById('copyFEN').onclick = copyFEN;

    // Observateur de changement d'URL (pour mettre à jour les labels sans recharger)
    let lastURL = window.location.href;
    setInterval(() => {
        if (window.location.href !== lastURL) {
            lastURL = window.location.href;
            setTimeout(() => ChessEventsManager.updatePlayerLabels(), 500);
        }
    }, 500);

    // Rafraîchissement quand l'onglet redevient actif
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) setTimeout(() => ChessEventsManager.updatePlayerLabels(), 200);
    });

    // Finalisation au chargement
    setTimeout(() => ChessEventsManager.updatePlayerLabels(), 800);
});

// Exports pour accès extérieur
window.updatePlayerLabels = () => ChessEventsManager.updatePlayerLabels();
window.ChessEventsManager = ChessEventsManager;