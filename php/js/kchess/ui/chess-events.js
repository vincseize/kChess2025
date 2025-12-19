/**
 * ui/chess-events.js
 * Gère les événements UI, les interactions boutons et la mise à jour des labels joueurs.
 * Priorise la configuration JSON globale (window.appConfig).
 */
class ChessEventsManager {
    
    static consoleLog = true; // Valeur par défaut
    
    static init() {
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('📱 ui/chess-events.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            console.info('📱 ChessEventsManager: Mode silencieux activé');
        }
    }
    
    static loadConfig() {
        try {
            // 1. Vérifier window.appConfig (JSON injecté par PHP)
            if (window.appConfig && window.appConfig.debug) {
                const val = window.appConfig.debug.console_log;
                // Gestion des types mixtes (boolean ou string "false")
                this.consoleLog = !(val === false || val === "false");
                return true;
            }
            
            // 2. Fallback via fonction utilitaire
            if (typeof window.getConfig === 'function') {
                const val = window.getConfig('debug.console_log', true);
                this.consoleLog = !(val === false || val === "false");
                return true;
            }
        } catch (e) {
            console.error('❌ Erreur config ChessEvents:', e);
        }
        return false;
    }

    static getConfigSource() {
        if (window.appConfig) return 'JSON config';
        if (typeof window.getConfig === 'function') return 'getConfig()';
        return 'default';
    }

    /**
     * Met à jour les noms, icônes et styles des badges joueurs
     */
    static updatePlayerLabels() {
        const isDebug = this.consoleLog;
        if (isDebug) console.log('\n🏷️ [ChessEvents] === MISE À JOUR DES LABELS ===');

        const topLabel = document.getElementById('topPlayerLabel');
        const bottomLabel = document.getElementById('bottomPlayerLabel');
        
        if (!topLabel || !bottomLabel) {
            if (isDebug) console.warn('⚠️ Labels HTML non trouvés');
            return;
        }

        try {
            // 1. Déterminer l'état (Inversé ? Bot présent ?)
            let isFlipped = window.chessGame?.core?.gameState?.boardFlipped || false;
            const botStatus = window.chessGame?.getBotStatus?.() || { active: false, level: 0, color: '' };
            
            // 2. Récupérer les traductions
            const t = this._getTranslations();
            const labels = {
                white: t.white || 'White',
                black: t.black || 'Black'
            };

            // 3. Logique d'attribution (Si flipped: Blancs en haut / Si normal: Noirs en haut)
            let topConfig = isFlipped ? { side: 'white', label: labels.white } : { side: 'black', label: labels.black };
            let botConfig = isFlipped ? { side: 'black', label: labels.black } : { side: 'white', label: labels.white };

            // 4. Construction du HTML
            const buildHTML = (config) => {
                const isBot = botStatus.active && botStatus.color === config.side;
                const icon = isBot ? 'bi-cpu' : 'bi-person';
                const botSuffix = isBot ? ` (${this._getBotName(botStatus.level, t)})` : '';
                const themeClass = config.side === 'white' ? 'bg-white text-dark border border-dark' : 'bg-dark text-white';
                const botClass = isBot ? `bot-player bot-color-${config.side}` : '';
                
                return {
                    html: `<i class="bi ${icon} me-1"></i> ${config.label}${botSuffix}`,
                    className: `badge p-2 ${themeClass} ${botClass}`.trim()
                };
            };

            const topUI = buildHTML(topConfig);
            const bottomUI = buildHTML(botConfig);

            // 5. Application au DOM
            topLabel.innerHTML = topUI.html;
            topLabel.className = topUI.className;
            bottomLabel.innerHTML = bottomUI.html;
            bottomLabel.className = bottomUI.className;

            if (isDebug) console.log('✅ Labels mis à jour', { isFlipped, botStatus });

        } catch (error) {
            if (isDebug) console.error('❌ Erreur updatePlayerLabels:', error);
        }
    }

    // --- Helpers privés ---

    static _getTranslations() {
        const cfg = window.appConfig;
        if (!cfg?.lang) return {};
        const langCode = cfg.current_lang || localStorage.getItem('charlychess_lang') || cfg.default_lang || 'fr';
        return cfg.lang[langCode] || cfg.lang['fr'] || {};
    }

    static _getBotName(level, translations) {
        if (translations[`bot_level${level}`]) return translations[`bot_level${level}`];
        return translations.bot_level1 ? translations.bot_level1.replace('1', level) : 'Bot';
    }
}

// ============================================
// INITIALISATION & ÉVÉNEMENTS GLOBAUX
// ============================================

function setupEventListeners() {
    const isDebug = ChessEventsManager.consoleLog;
    
    // Mapping des boutons : [Sélecteur CSS, Action, Description]
    const bindings = [
        ['#newGame', () => confirmNewGame(), 'New Game Desktop'],
        ['#newGameMobile', () => confirmNewGame(), 'New Game Mobile'],
        ['#flipBoard', () => flipBoardWithLabelsUpdate(), 'Flip Desktop'],
        ['#flipBoardMobile', () => flipBoardWithLabelsUpdate(), 'Flip Mobile']
    ];

    bindings.forEach(([selector, action, desc]) => {
        document.querySelectorAll(selector).forEach(el => {
            // Nettoyage et binding
            const newEl = el.cloneNode(true);
            el.parentNode.replaceChild(newEl, el);
            
            const handler = (e) => {
                e.preventDefault();
                if (isDebug) console.log(`Interaction: ${desc}`);
                action();
            };

            newEl.addEventListener('click', handler);
            newEl.addEventListener('touchend', handler);
            newEl.style.cursor = 'pointer';
        });
    });

    window.addEventListener('resize', () => {
        setTimeout(() => ChessEventsManager.updatePlayerLabels(), 150);
    });
}

function flipBoardWithLabelsUpdate() {
    const game = window.chessGame;
    const flipFn = game?.flipBoard || game?.core?.flipBoard;
    
    if (typeof flipFn === 'function') {
        flipFn.call(game?.flipBoard ? game : game.core);
        setTimeout(() => ChessEventsManager.updatePlayerLabels(), 100);
    }
}

function confirmNewGame() {
    const modal = window.chessGame?.core?.ui?.modalManager;
    
    if (typeof modal?.confirmNewGame === 'function') {
        return modal.confirmNewGame().then(res => {
            if (res) setTimeout(() => ChessEventsManager.updatePlayerLabels(), 800);
            return res;
        });
    }

    if (confirm('Nouvelle partie ?\nLa progression actuelle sera perdue.')) {
        window.location.reload();
    }
}

// Lancement au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    ChessEventsManager.init();
    
    // Initialisation du moteur si absent
    if (typeof ChessGame !== 'undefined' && !window.chessGame) {
        window.chessGame = new ChessGame();
    }

    setupEventListeners();

    // Premier rendu des labels
    setTimeout(() => ChessEventsManager.updatePlayerLabels(), 800);
});