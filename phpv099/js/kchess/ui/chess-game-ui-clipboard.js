/**
 * ui/chess-game-ui-clipboard.js - Version 1.3.1
 * Gestion unifiée du presse-papier avec système de logs synchronisé.
 * Supporte les modes Bot (Level/Color) et les diagnostics avancés.
 */
class ChessClipboardManager {
    
    static VERSION = '1.3.1';
    static consoleLog = true; // Par défaut avant chargement de la config

    // ============================================
    // 1. SYSTÈME DE LOGS UNIFIÉ
    // ============================================
    static log(message, type = 'info', data = null) {
        if (!this.consoleLog && (type === 'info' || type === 'config')) return;
        
        const icons = { 
            info: '📋', success: '✅', warn: '⚠️', 
            error: '❌', config: '⚙️', action: '📄' 
        };
        const icon = icons[type] || '⚪';
        const timestamp = new Date().toLocaleTimeString();
        
        console.log(`${icon} [ClipboardManager ${timestamp}] ${message}`);
        if (data && this.consoleLog) console.dir(data);
    }

    static init() {
        this.loadConfig();
        this.log(`Initialisé - v${this.VERSION} (${this.getConfigSource()})`, 'success');
    }

    static loadConfig() {
        try {
            const configValue = window.appConfig?.debug?.console_log ?? 
                               (typeof window.getConfig === 'function' ? window.getConfig('debug.console_log') : null);

            if (configValue !== null) {
                // Conversion propre : gère booléen et string "true"/"false"
                this.consoleLog = String(configValue).toLowerCase() !== "false";
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Erreur chargement config Clipboard:', error);
            return false;
        }
    }

    static getConfigSource() {
        if (window.appConfig) return 'JSON config';
        if (typeof window.getConfig === 'function') return 'getConfig utility';
        return 'default';
    }

    static isDebugMode() {
        return this.consoleLog;
    }

    // ============================================
    // 2. CONSTRUCTEUR ET INSTANCE
    // ============================================
    constructor(ui) {
        this.constructor.loadConfig();
        this.ui = ui;
        // Tente de lier le moteur via l'UI ou l'instance globale
        this.game = ui?.game || window.chessGame || null;
        
        this.constructor.log('Gestionnaire prêt', 'info', { ui: !!ui, game: !!this.game });
    }

    // ============================================
    // 3. LOGIQUE FEN
    // ============================================
    copyFENToClipboard() {
        this.constructor.log('Action : Copie FEN demandée', 'action');
        try {
            const fen = this.getFEN();
            if (!fen) {
                this.ui?.showNotification?.('Erreur génération FEN', 'error');
                return;
            }
            this.copyToClipboard(fen, 'FEN');
        } catch (error) {
            this.constructor.log(`Erreur copyFEN : ${error.message}`, 'error');
        }
    }

    getFEN() {
        try {
            if (window.FENGenerator?.generateFEN) {
                const state = this.game?.gameState || this.game?.core?.gameState;
                const board = this.game?.board || this.game?.core?.board;
                if (state && board) return window.FENGenerator.generateFEN(state, board);
            }
            const target = this.game?.core || this.game;
            if (typeof target?.getFEN === 'function') return target.getFEN();
            return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        } catch (error) {
            return null;
        }
    }

    // ============================================
    // 4. LOGIQUE PGN
    // ============================================
    copyPGNToClipboard() {
        this.constructor.log('Action : Copie PGN demandée', 'action');
        try {
            const pgn = this.getPGN();
            if (!pgn || pgn === this.getEmptyPGN()) {
                this.ui?.showNotification?.('Aucun coup à copier', 'info');
                return;
            }
            this.copyToClipboard(pgn, 'PGN');
        } catch (error) {
            this.ui?.showNotification?.('Erreur génération PGN', 'error');
        }
    }

    getPGN() {
        try {
            const state = this.game?.gameState || this.game?.core?.gameState;
            const pgnSource = this.game?.core || this.game;
            
            if (typeof pgnSource?.getPGN === 'function') {
                const pgn = pgnSource.getPGN();
                if (pgn && pgn.length > 50) return pgn;
            }
            if (state?.getFullPGN) return state.getFullPGN();
            if (state?.moveHistory?.length > 0) return this.buildBasicPGN(state.moveHistory);

            return this.getEmptyPGN();
        } catch (error) {
            return this.getEmptyPGN();
        }
    }

    buildBasicPGN(moveHistory) {
        try {
            const date = new Date().toISOString().split('T')[0].replace(/-/g, '.');
            const whiteName = document.getElementById('bottomPlayerLabel')?.innerText?.split('(')[0]?.trim() || 'Joueur Blanc';
            const blackName = document.getElementById('topPlayerLabel')?.innerText?.split('(')[0]?.trim() || 'Joueur Noir';

            let pgn = `[Event "Partie Amicale"]\n[Site "K-Chess Online"]\n[Date "${date}"]\n`;
            pgn += `[White "${whiteName}"]\n[Black "${blackName}"]\n[Result "*"]\n\n`;

            moveHistory.forEach((move, index) => {
                if (index % 2 === 0) pgn += `${(index / 2) + 1}. `;
                pgn += `${move.san || move.notation || '??'} `;
            });
            return pgn.trim() + " *";
        } catch (e) {
            return this.getEmptyPGN();
        }
    }

    getEmptyPGN() {
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '.');
        return `[Event "Partie d'échecs"]\n[Date "${date}"]\n[Result "*"]\n\n*`;
    }

    // ============================================
    // 5. MÉTHODES DE COPIE (NAVIGATEUR)
    // ============================================
    async copyToClipboard(text, type = 'Données') {
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                this.constructor.log(`${type} copié via API Clipboard`, 'success');
                this.ui?.showNotification?.(`${type.toUpperCase()} copié !`, 'success');
                return;
            } catch (err) {
                this.constructor.log(`Échec API Clipboard : ${err.message}`, 'warn');
            }
        }
        this.fallbackCopy(text, type);
    }

    fallbackCopy(text, type = 'Données') {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                this.constructor.log(`${type} copié via Fallback`, 'success');
                this.ui?.showNotification?.(`${type.toUpperCase()} copié !`, 'success');
            }
        } catch (err) {
            this.ui?.showNotification?.(`Erreur lors de la copie`, 'error');
        }
    }

    // ============================================
    // 6. OUTILS DE DEBUG ET DIAGNOSTIC
    // ============================================
    quickCopyFEN() {
        try {
            const fen = this.getFEN();
            if (!fen) return;
            if (this.isClipboardAvailable()) {
                navigator.clipboard.writeText(fen).catch(() => this.fallbackCopy(fen, 'FEN'));
            } else {
                this.fallbackCopy(fen, 'FEN');
            }
        } catch (e) {}
    }

    isClipboardAvailable() {
        const hasAPI = !!(navigator.clipboard && navigator.clipboard.writeText);
        const isSecure = window.isSecureContext || ['https:', 'http:'].includes(location.protocol); 
        return hasAPI && isSecure;
    }

    getClipboardStats() {
        const fen = this.getFEN();
        const pgn = this.getPGN();
        const moveHistory = this.game?.gameState?.moveHistory || this.ui?.game?.gameState?.moveHistory || [];
        return {
            fen: { length: fen?.length || 0, generated: !!fen },
            pgn: { length: pgn?.length || 0, moveCount: moveHistory.length }
        };
    }

    testClipboardFunctions() {
        const results = {
            version: this.constructor.VERSION,
            env: { secure: window.isSecureContext, api: !!navigator.clipboard },
            references: { ui: !!this.ui, game: !!this.game },
            stats: this.getClipboardStats()
        };
        this.constructor.log('Rapport de Test', 'info', results);
        return results;
    }

    diagnosePGNProblem() {
        if (!this.constructor.consoleLog) return;
        console.group('🔍 [ClipboardManager] Diagnostic PGN');
        const state = this.game?.gameState || this.ui?.game?.gameState;
        console.table({
            ui: !!this.ui,
            game: !!this.game,
            state: !!state,
            history: state?.moveHistory?.length || 0
        });
        console.log('Extraction Test:', this.getPGN()?.substring(0, 50));
        console.groupEnd();
    }
}

// --- INITIALISATION ET EXPOSITION ---
ChessClipboardManager.init();
window.ChessClipboardManager = ChessClipboardManager;

window.ClipboardUtils = {
    reload: () => ChessClipboardManager.loadConfig(),
    getStatus: () => ({ active: ChessClipboardManager.consoleLog, source: ChessClipboardManager.getConfigSource() }),
    test: () => (new ChessClipboardManager(window.chessGameUI)).testClipboardFunctions()
};

// Synchronisation avec appConfig après chargement
const finalizeClipboardInit = () => {
    setTimeout(() => {
        ChessClipboardManager.loadConfig();
        if (ChessClipboardManager.consoleLog) console.log('✅ ClipboardManager synchronisé');
    }, 150);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', finalizeClipboardInit);
} else {
    finalizeClipboardInit();
}

// Raccourcis Debug
document.addEventListener('keydown', (e) => {
    if (!ChessClipboardManager.consoleLog) return;
    if (e.ctrlKey && e.altKey) {
        const mgr = window.chessGameUI?.clipboardManager || new ChessClipboardManager(window.chessGameUI);
        if (e.key.toLowerCase() === 'p') { e.preventDefault(); mgr.diagnosePGNProblem(); }
        if (e.key.toLowerCase() === 'f') { e.preventDefault(); mgr.quickCopyFEN(); }
    }
});