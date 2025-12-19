/**
 * Gestionnaire de presse-papier pour les échecs
 * Gère la copie FEN/PGN avec un système de logs débrayable via config JSON
 */
class ChessClipboardManager {
    
    // Valeur par défaut
    static consoleLog = true;
    
    static init() {
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('📋 [Clipboard] Système de logs actif');
            console.log(`⚙️ Source config: ${this.getConfigSource()}`);
        } else {
            console.info('📋 [Clipboard] Mode silencieux (logs désactivés)');
        }
    }
    
    static loadConfig() {
        try {
            let configValue = null;

            // Priorité 1: window.appConfig (JSON)
            if (window.appConfig?.debug) {
                configValue = window.appConfig.debug.console_log;
            } 
            // Priorité 2: Fonction utilitaire
            else if (typeof window.getConfig === 'function') {
                configValue = window.getConfig('debug.console_log');
            }

            // Traitement de la valeur
            if (configValue === "false" || configValue === false) {
                this.consoleLog = false;
            } else if (configValue === "true" || configValue === true) {
                this.consoleLog = true;
            } else if (configValue !== null) {
                this.consoleLog = Boolean(configValue);
            }
            
            return true;
        } catch (error) {
            console.error('❌ [Clipboard] Erreur chargement config:', error);
            return false;
        }
    }
    
    static getConfigSource() {
        if (window.appConfig?.debug?.console_log !== undefined) return 'JSON config';
        if (typeof window.getConfig === 'function') return 'fonction getConfig';
        return 'valeur par défaut';
    }

    constructor(ui) {
        // Rafraîchir la config à l'instanciation
        this.constructor.loadConfig();
        
        this.ui = ui;
        this.game = ui?.game || null;
        
        if (this.constructor.consoleLog) {
            console.log('📋 [ClipboardManager] Initialisé avec succès', { 
                ui: !!ui, 
                game: !!this.game 
            });
        }
    }

    // --- LOGIQUE DE COPIE ---

    copyFENToClipboard() {
        const isDebug = this.constructor.consoleLog;
        if (isDebug) console.log('\n📄 [ClipboardManager] === DÉBUT COPIE FEN ===');
        
        try {
            const fen = this.getFEN();
            if (!fen) {
                if (isDebug) console.error('❌ [ClipboardManager] Échec génération FEN');
                this.ui?.showNotification?.('Erreur génération FEN', 'error');
                return;
            }
            
            if (isDebug) console.log(`📄 [ClipboardManager] FEN généré (${fen.length} chars)`);
            this.copyToClipboard(fen, 'FEN');
            
        } catch (error) {
            if (isDebug) console.error('❌ [ClipboardManager] Crash copie FEN:', error);
            this.ui?.showNotification?.('Erreur critique copie FEN', 'error');
        }
        
        if (isDebug) console.log('📄 [ClipboardManager] === FIN COPIE FEN ===\n');
    }

    copyPGNToClipboard() {
        const isDebug = this.constructor.consoleLog;
        if (isDebug) console.log('\n📜 [ClipboardManager] === DÉBUT COPIE PGN ===');
        
        try {
            const pgn = this.getPGN();
            const isEmpty = !pgn || pgn === this.getEmptyPGN();
            
            if (isEmpty) {
                if (isDebug) console.log('📜 [ClipboardManager] PGN vide, annulation.');
                this.ui?.showNotification?.('Aucun coup à copier', 'info');
                return;
            }
            
            if (isDebug) console.log(`📜 [ClipboardManager] PGN généré (${pgn.length} chars)`);
            this.copyToClipboard(pgn, 'PGN');
            
        } catch (error) {
            if (isDebug) console.error('❌ [ClipboardManager] Crash copie PGN:', error);
            this.ui?.showNotification?.('Erreur critique copie PGN', 'error');
        }
        
        if (isDebug) console.log('📜 [ClipboardManager] === FIN COPIE PGN ===\n');
    }

    // --- MOTEUR DE GÉNÉRATION ---

    getFEN() {
        try {
            const gameState = this.game?.gameState || this.ui?.game?.gameState;
            const board = this.game?.board || this.ui?.game?.board;

            // 1. FENGenerator global
            if (window.FENGenerator?.generateFEN && gameState && board) {
                return window.FENGenerator.generateFEN(gameState, board);
            }
            // 2. Méthodes internes
            return this.game?.getFEN?.() || this.ui?.game?.getFEN?.() || 
                   this.game?.core?.getFEN?.() || gameState?.getFEN?.() || 
                   'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        } catch (e) { return null; }
    }

    getPGN() {
        try {
            const gameState = this.game?.gameState || this.ui?.game?.gameState;
            
            // Tentatives successives
            let pgn = this.game?.getPGN?.() || this.ui?.game?.getPGN?.() || 
                      gameState?.getFullPGN?.() || gameState?.getPGN?.() ||
                      this.game?.core?.getPGN?.();

            if (pgn && pgn.trim() !== '') return pgn;

            // Fallback: construction manuelle
            if (gameState?.moveHistory?.length > 0) {
                return this.buildBasicPGN(gameState.moveHistory);
            }

            return this.getEmptyPGN();
        } catch (e) { return this.getEmptyPGN(); }
    }

    buildBasicPGN(moveHistory) {
        let pgn = `[Event "Partie d'échecs"]\n[Date "${new Date().toISOString().split('T')[0]}"]\n[Result "*"]\n\n`;
        moveHistory.forEach((move, i) => {
            if (i % 2 === 0) pgn += `${(i / 2) + 1}. `;
            pgn += `${move.san || move.notation || '??'} `;
        });
        return pgn + '*';
    }

    getEmptyPGN() {
        return `[Event "Partie d'échecs"]\n[Date "${new Date().toISOString().split('T')[0]}"]\n[Result "*"]\n\n*`;
    }

    // --- BAS NIVEAU : CLIPBOARD ---

    copyToClipboard(text, type = 'TEXTE') {
        const isDebug = this.constructor.consoleLog;
        const canUseAPI = navigator.clipboard && window.isSecureContext;

        if (isDebug) console.log(`📋 [Clipboard] Utilisation de l'API: ${canUseAPI ? '✅ Standard' : '⚠️ Fallback'}`);

        if (canUseAPI) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    this.ui?.showNotification?.(`${type} copié !`, 'success');
                })
                .catch(err => {
                    if (isDebug) console.error('API Error, trying fallback:', err);
                    this.fallbackCopy(text, type);
                });
        } else {
            this.fallbackCopy(text, type);
        }
    }

    fallbackCopy(text, type) {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed'; // Évite le scroll
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (success) {
                this.ui?.showNotification?.(`${type} copié !`, 'success');
            } else {
                throw new Error('execCommand copy failed');
            }
        } catch (err) {
            if (this.constructor.consoleLog) console.error('❌ [Clipboard] Fallback failed:', err);
            this.ui?.showNotification?.(`Erreur de copie ${type}`, 'error');
        }
    }

    // --- DIAGNOSTICS ---

    diagnosePGNProblem() {
        if (!this.constructor.consoleLog) return;
        
        console.group('🔍 [ClipboardManager] Diagnostic PGN');
        const gameState = this.game?.gameState || this.ui?.game?.gameState;
        console.table({
            'Game Instance': !!this.game,
            'GameState Instance': !!gameState,
            'Move History Count': gameState?.moveHistory?.length || 0,
            'Method getPGN': !!this.game?.getPGN,
            'Method getFullPGN': !!gameState?.getFullPGN,
            'Secure Context (HTTPS)': window.isSecureContext
        });
        console.groupEnd();
    }
}

// Initialisation & Exposition
ChessClipboardManager.init();
window.ChessClipboardManager = ChessClipboardManager;

// Utils globaux
window.ClipboardManagerUtils = {
    toggleDebug: (val) => {
        ChessClipboardManager.consoleLog = val;
        console.log(`Logs Clipboard: ${val ? 'ON' : 'OFF'}`);
    },
    quickTest: () => new ChessClipboardManager(window.chessUI).copyFENToClipboard()
};