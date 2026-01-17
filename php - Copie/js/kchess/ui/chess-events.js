/**
 * ui/chess-events.js - Version 1.4.0
 * Système unifié : Gestion UI + Contrôleur de Bot Automatique
 */
class ChessEventsManager {
    static VERSION = '1.4.0';
    static consoleLog = true;

    // ============================================
    // 1. SYSTÈME DE LOGS
    // ============================================
    static log(message, type = 'info', data = null) {
        if (!this.consoleLog && (type === 'info' || type === 'config')) return;
        const timestamp = new Date().toLocaleTimeString();
        const icons = { info: '🔍', success: '✅', warn: '⚠️', error: '❌', config: '⚙️', action: '⚡' };
        console.log(`${icons[type] || '⚪'} [ChessEvents ${timestamp}] ${message}`);
        if (data && this.consoleLog) console.dir(data);
    }

    // ============================================
    // 2. CONFIGURATION & INITIALISATION
    // ============================================
    static init() {
        this.loadConfig();
        this.log(`Initialisé - v${this.VERSION}`, 'success');
    }

    static loadConfig() {
        try {
            const config = window.appConfig?.debug || window.appConfig?.chess_engine;
            if (config?.console_log !== undefined) {
                this.consoleLog = String(config.console_log).toLowerCase() !== "false";
            }
        } catch (e) { return false; }
    }

    static getTranslations() {
        try {
            const cfg = window.appConfig;
            const langCode = cfg?.current_lang || localStorage.getItem('charlychess_lang') || 'fr';
            return cfg?.lang?.[langCode] || cfg?.lang?.['fr'] || {};
        } catch (e) { return {}; }
    }

    // ============================================
    // 3. MISE À JOUR DE L'INTERFACE (Labels)
    // ============================================
    static updatePlayerLabels() {
        const topLabel = document.getElementById('topPlayerLabel');
        const bottomLabel = document.getElementById('bottomPlayerLabel');
        if (!topLabel || !bottomLabel) return;

        try {
            const t = this.getTranslations();
            const game = window.chessGame?.core || window.chessGame;
            const isFlipped = game?.gameState?.boardFlipped || false;
            
            const urlParams = new URLSearchParams(window.location.search);
            const isBotMode = urlParams.get('mode') === 'bot';
            const levelFromUrl = urlParams.get('level') || 1;
            const playerColor = urlParams.get('color') || 'white';
            const botColor = (playerColor === 'white') ? 'black' : 'white';

            const labels = { white: t.white || 'Blancs', black: t.black || 'Noirs' };
            let topColor = isFlipped ? 'white' : 'black';
            let bottomColor = isFlipped ? 'black' : 'white';

            const buildUI = (color) => {
                let text = labels[color];
                const isBot = isBotMode && color === botColor;
                let cssClass = `badge p-2 ${color === 'white' ? 'bg-white text-dark border border-dark' : 'bg-dark text-white'}`;
                
                if (isBot) {
                    text += ` (Bot Niv. ${levelFromUrl})`;
                    cssClass += ` bot-player bot-color-${color}`;
                }
                const icon = isBot ? 'bi-cpu' : 'bi-person';
                return { html: `<i class="bi ${icon} me-1"></i> ${text}`, className: cssClass };
            };

            const topUI = buildUI(topColor);
            const bottomUI = buildUI(bottomColor);

            topLabel.innerHTML = topUI.html; topLabel.className = topUI.className;
            bottomLabel.innerHTML = bottomUI.html; bottomLabel.className = bottomUI.className;
        } catch (error) {
            this.log(`Erreur labels: ${error.message}`, 'error');
        }
    }
}

// ============================================
// 4. LE "CERVEAU" : CONTRÔLEUR DU BOT
// ============================================
/**
 * Cette fonction surveille le changement de tour et fait jouer le bot.
 */
/**
 * Cette fonction surveille le changement de tour et fait jouer le bot.
 * Version évolutive : Gère dynamiquement les niveaux (Level_1, Level_2, Level_3, etc.)
 */
async function handleBotTurn() {
    const game = window.chessGame?.core || window.chessGame;
    if (!game || !game.gameState || !game.gameState.gameActive) return;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') !== 'bot') return;

    const playerColor = urlParams.get('color') || 'white';
    const botColor = (playerColor === 'white') ? 'black' : 'white';
    const currentTurn = game.gameState.currentPlayer;

    // Si c'est au tour du bot
    if (currentTurn === botColor) {
        ChessEventsManager.log(`Tour du Bot détecté (${botColor})`, 'info');

        const level = urlParams.get('level') || '1';
        let botInstance = null;

        // --- SÉLECTION DYNAMIQUE DU BOT ---
        // Cherche d'abord la classe exacte (ex: Level_3)
        const className = `Level_${level}`;
        
        if (typeof window[className] !== 'undefined') {
            botInstance = new window[className]();
            ChessEventsManager.log(`Instanciation de ${className}`, 'success');
        } 
        // Repli (Fallback) : Si le niveau demandé n'existe pas, on cherche le plus haut possible
        else {
            ChessEventsManager.log(`${className} non trouvé, recherche d'une alternative...`, 'warn');
            const availableLevels = [3, 2, 1];
            for (const l of availableLevels) {
                if (typeof window[`Level_${l}`] !== 'undefined') {
                    botInstance = new window[`Level_${l}`]();
                    ChessEventsManager.log(`Repli sur Level_${l}`, 'info');
                    break;
                }
            }
        }

        if (!botInstance) {
            ChessEventsManager.log("❌ Erreur critique : Aucun moteur de Bot (Level_X) n'est chargé dans la page.", "error");
            return;
        }

        // Délai de réflexion "humain" pour ne pas jouer instantanément
        await new Promise(r => setTimeout(r, 800));

        try {
            // Appel du moteur (supporte getMove ou makeMove pour la compatibilité)
            const move = botInstance.getMove ? await botInstance.getMove() : await botInstance.makeMove(game);

            if (move && !move.error) {
                ChessEventsManager.log(`Bot joue : ${move.notation}`, 'success');
                
                // EXECUTION DES CLICS SIMULÉS
                // 1. Sélection de la pièce
                game.handleSquareClick(move.fromRow, move.fromCol, true);
                
                // 2. Clic sur la destination (léger délai pour laisser l'UI respirer)
                setTimeout(() => {
                    game.handleSquareClick(move.toRow, move.toCol, true);
                }, 250);
            }
        } catch (error) {
            ChessEventsManager.log(`Erreur pendant le calcul du bot: ${error.message}`, 'error');
        }
    }
}

// ============================================
// 5. INITIALISATION & ÉVÉNEMENTS GLOBAUX
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    ChessEventsManager.init();
    
    if (typeof ChessGame !== 'undefined' && !window.chessGame) {
        window.chessGame = new ChessGame();
    }

    // Liaison pour mettre à jour les labels quand le moteur change d'état
    if (window.chessGame?.core) {
        // On intercepte le changement de tour
        const originalSwitch = window.chessGame.core.gameState.switchPlayer;
        if (originalSwitch) {
            window.chessGame.core.gameState.switchPlayer = function() {
                originalSwitch.apply(this, arguments);
                ChessEventsManager.updatePlayerLabels();
                handleBotTurn(); // Déclenche le bot après chaque changement de tour
            };
        }
    }

    // Setup Boutons
    const bindActions = (selector, action) => {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener('click', (e) => { e.preventDefault(); action(); });
        });
    };

    bindActions('#newGame, .new-game-btn', () => {
        if (confirm('Nouvelle partie ?')) window.location.reload();
    });

    bindActions('#flipBoard, .flip-board-btn', () => {
        const target = window.chessGame?.core || window.chessGame;
        if (target?.flipBoard) {
            target.flipBoard();
            setTimeout(() => ChessEventsManager.updatePlayerLabels(), 100);
        }
    });

    // Premier check au chargement
    setTimeout(() => {
        ChessEventsManager.updatePlayerLabels();
        handleBotTurn(); // Au cas où le bot doit commencer (si joueur = noir)
    }, 1000);
});

// Exports
window.ChessEventsManager = ChessEventsManager;
window.updatePlayerLabels = () => ChessEventsManager.updatePlayerLabels();