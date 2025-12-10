// ui/chess-game-ui-clipboard.js - Version utilisant la configuration JSON comme priorité
class ChessClipboardManager {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('📋 ui/chess-game-ui-clipboard.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('📋 ChessClipboardManager: Mode silencieux activé (debug désactivé dans config)');
        }
    }
    
    // Méthode pour charger la configuration
    static loadConfig() {
        try {
            // Vérifier si la configuration globale existe
            if (window.appConfig && window.appConfig.debug) {
                const configValue = window.appConfig.debug.console_log;
                
                // CONVERSION CORRECTE - Gérer les string "false" et "true"
                if (configValue === "false") {
                    this.consoleLog = false;
                    if (configValue !== "false") {
                        console.info('🔧 ChessClipboardManager: console_log désactivé via config JSON');
                    }
                } else if (configValue === false) {
                    this.consoleLog = false;
                } else if (configValue === "true") {
                    this.consoleLog = true;
                } else if (configValue === true) {
                    this.consoleLog = true;
                } else {
                    // Pour toute autre valeur, utiliser Boolean()
                    this.consoleLog = Boolean(configValue);
                }
                
                // Log de confirmation (uniquement en mode debug)
                if (this.consoleLog) {
                    console.log(`⚙️ ChessClipboardManager: Configuration chargée - console_log = ${this.consoleLog} (valeur brute: "${configValue}")`);
                }
                return true;
            }
            
            // Si window.appConfig n'existe pas, essayer de le charger via fonction utilitaire
            if (typeof window.getConfig === 'function') {
                const configValue = window.getConfig('debug.console_log', 'true');
                
                if (configValue === "false") {
                    this.consoleLog = false;
                } else if (configValue === false) {
                    this.consoleLog = false;
                } else {
                    this.consoleLog = Boolean(configValue);
                }
                return true;
            }
            
            // Si rien n'est disponible, garder la valeur par défaut
            if (this.consoleLog) {
                console.warn('⚠️ ChessClipboardManager: Aucune configuration trouvée, utilisation de la valeur par défaut (true)');
            }
            return false;
            
        } catch (error) {
            console.error('❌ ChessClipboardManager: Erreur lors du chargement de la config:', error);
            return false;
        }
    }
    
    // Méthode pour déterminer la source de la configuration
    static getConfigSource() {
        if (window.appConfig) {
            return 'JSON config';
        } else if (typeof window.getConfig === 'function') {
            return 'fonction getConfig';
        } else {
            return 'valeur par défaut';
        }
    }
    
    // Méthode pour vérifier si on est en mode debug
    static isDebugMode() {
        return this.consoleLog;
    }

    constructor(ui) {
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        this.ui = ui;
        
        if (this.constructor.consoleLog) {
            console.log('📋 [ClipboardManager] Gestionnaire de presse-papier initialisé');
            console.log('📋 [ClipboardManager] UI parent:', ui);
        }
    }

    copyFENToClipboard() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            try {
                const fen = window.FENGenerator ? 
                    window.FENGenerator.generateFEN(this.ui.game.gameState, this.ui.game.board) : '';
                
                if (!fen) {
                    this.ui.showNotification('Erreur génération FEN', 'error');
                    return;
                }
                
                navigator.clipboard.writeText(fen).then(() => {
                    this.ui.showNotification('FEN copié dans le presse-papier !', 'success');
                }).catch(() => {
                    this.ui.showNotification('Erreur lors de la copie du FEN', 'error');
                    this.fallbackCopyFEN(fen);
                });
            } catch (error) {
                this.ui.showNotification('Erreur génération FEN', 'error');
            }
            return;
        }
        
        // Mode debug
        console.log('\n📄 [ClipboardManager] === COPIE FEN ===');
        console.log('📄 [ClipboardManager] Début de la copie FEN...');
        
        try {
            console.log('📄 [ClipboardManager] Génération du FEN...');
            
            const fen = window.FENGenerator ? 
                window.FENGenerator.generateFEN(this.ui.game.gameState, this.ui.game.board) : '';
            
            if (!fen) {
                console.log('❌ [ClipboardManager] FENGenerator non disponible ou erreur de génération');
                this.ui.showNotification('Erreur génération FEN', 'error');
                return;
            }
            
            console.log(`📄 [ClipboardManager] FEN généré: ${fen.substring(0, 60)}...`);
            console.log('📄 [ClipboardManager] Longueur du FEN:', fen.length, 'caractères');
            
            console.log('📄 [ClipboardManager] Copie dans le presse-papier...');
            
            navigator.clipboard.writeText(fen).then(() => {
                console.log('✅ [ClipboardManager] FEN copié avec succès');
                this.ui.showNotification('FEN copié dans le presse-papier !', 'success');
                console.log('📄 [ClipboardManager] Notification affichée');
                
            }).catch(err => {
                console.log(`❌ [ClipboardManager] Erreur lors de la copie FEN: ${err.message}`);
                console.error('Clipboard error:', err);
                this.ui.showNotification('Erreur lors de la copie du FEN', 'error');
                this.fallbackCopyFEN(fen);
            });
            
        } catch (error) {
            console.log(`❌ [ClipboardManager] Erreur génération FEN: ${error.message}`);
            console.error('FEN generation error:', error);
            this.ui.showNotification('Erreur génération FEN', 'error');
        }
        
        console.log('📄 [ClipboardManager] === FIN COPIE FEN ===\n');
    }

    copyPGNToClipboard() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            try {
                const pgn = this.ui.game.gameState.getFullPGN ? 
                    this.ui.game.gameState.getFullPGN() : '';
                
                if (!pgn) {
                    this.ui.showNotification('Erreur génération PGN', 'error');
                    return;
                }
                
                navigator.clipboard.writeText(pgn).then(() => {
                    this.ui.showNotification('PGN copié dans le presse-papier !', 'success');
                }).catch(() => {
                    this.ui.showNotification('Erreur lors de la copie du PGN', 'error');
                    this.fallbackCopyPGN(pgn);
                });
            } catch (error) {
                this.ui.showNotification('Erreur génération PGN', 'error');
            }
            return;
        }
        
        // Mode debug
        console.log('\n📜 [ClipboardManager] === COPIE PGN ===');
        console.log('📜 [ClipboardManager] Début de la copie PGN...');
        
        try {
            console.log('📜 [ClipboardManager] Génération du PGN...');
            
            const pgn = this.ui.game.gameState.getFullPGN ? 
                this.ui.game.gameState.getFullPGN() : '';
            
            if (!pgn) {
                console.log('❌ [ClipboardManager] Méthode getFullPGN non disponible');
                this.ui.showNotification('Erreur génération PGN', 'error');
                return;
            }
            
            console.log(`📜 [ClipboardManager] PGN généré: ${pgn.substring(0, 100)}...`);
            console.log('📜 [ClipboardManager] Longueur du PGN:', pgn.length, 'caractères');
            
            const moveCount = this.ui.game.gameState.moveHistory ? 
                this.ui.game.gameState.moveHistory.length : 0;
            console.log(`📜 [ClipboardManager] Nombre de coups: ${moveCount}`);
            
            console.log('📜 [ClipboardManager] Copie dans le presse-papier...');
            
            navigator.clipboard.writeText(pgn).then(() => {
                console.log('✅ [ClipboardManager] PGN copié avec succès');
                this.ui.showNotification('PGN copié dans le presse-papier !', 'success');
                console.log('📜 [ClipboardManager] Notification affichée');
                
            }).catch(err => {
                console.log(`❌ [ClipboardManager] Erreur lors de la copie PGN: ${err.message}`);
                console.error('Clipboard error:', err);
                this.ui.showNotification('Erreur lors de la copie du PGN', 'error');
                this.fallbackCopyPGN(pgn);
            });
            
        } catch (error) {
            console.log(`❌ [ClipboardManager] Erreur génération PGN: ${error.message}`);
            console.error('PGN generation error:', error);
            this.ui.showNotification('Erreur génération PGN', 'error');
        }
        
        console.log('📜 [ClipboardManager] === FIN COPIE PGN ===\n');
    }

    // Fallback pour les navigateurs sans clipboard API
    fallbackCopyFEN(fen) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = fen;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                textarea.setSelectionRange(0, 99999);
                
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);
                
                if (success) {
                    this.ui.showNotification('FEN copié (méthode fallback)', 'success');
                } else {
                    this.ui.showNotification('Impossible de copier le FEN', 'error');
                }
            } catch (error) {
                // Ignorer en mode silencieux
            }
            return;
        }
        
        // Mode debug
        console.log('🔧 [ClipboardManager] Tentative de fallback pour copie FEN...');
        
        try {
            const textarea = document.createElement('textarea');
            textarea.value = fen;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            textarea.setSelectionRange(0, 99999);
            
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (success) {
                console.log('✅ [ClipboardManager] Fallback FEN réussi');
                this.ui.showNotification('FEN copié (méthode fallback)', 'success');
            } else {
                console.log('❌ [ClipboardManager] Fallback FEN échoué');
                this.ui.showNotification('Impossible de copier le FEN', 'error');
            }
        } catch (error) {
            console.log(`❌ [ClipboardManager] Erreur fallback FEN: ${error.message}`);
        }
    }

    // Fallback pour les navigateurs sans clipboard API
    fallbackCopyPGN(pgn) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = pgn;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                textarea.setSelectionRange(0, 99999);
                
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);
                
                if (success) {
                    this.ui.showNotification('PGN copié (méthode fallback)', 'success');
                } else {
                    this.ui.showNotification('Impossible de copier le PGN', 'error');
                }
            } catch (error) {
                // Ignorer en mode silencieux
            }
            return;
        }
        
        // Mode debug
        console.log('🔧 [ClipboardManager] Tentative de fallback pour copie PGN...');
        
        try {
            const textarea = document.createElement('textarea');
            textarea.value = pgn;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            textarea.setSelectionRange(0, 99999);
            
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (success) {
                console.log('✅ [ClipboardManager] Fallback PGN réussi');
                this.ui.showNotification('PGN copié (méthode fallback)', 'success');
            } else {
                console.log('❌ [ClipboardManager] Fallback PGN échoué');
                this.ui.showNotification('Impossible de copier le PGN', 'error');
            }
        } catch (error) {
            console.log(`❌ [ClipboardManager] Erreur fallback PGN: ${error.message}`);
        }
    }
    
    // NOUVELLE MÉTHODE : Copie rapide du FEN pour debug
    quickCopyFEN() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            try {
                const fen = window.FENGenerator ? 
                    window.FENGenerator.generateFEN(this.ui.game.gameState, this.ui.game.board) : '';
                if (fen) {
                    navigator.clipboard.writeText(fen).catch(() => {});
                }
            } catch (error) {
                // Ignorer en mode silencieux
            }
            return;
        }
        
        // Mode debug
        console.log('⚡ [ClipboardManager] Copie rapide FEN demandée...');
        
        try {
            const fen = window.FENGenerator ? 
                window.FENGenerator.generateFEN(this.ui.game.gameState, this.ui.game.board) : '';
            
            if (!fen) {
                console.log('❌ [ClipboardManager] FENGenerator non disponible pour copie rapide');
                return;
            }
            
            navigator.clipboard.writeText(fen).then(() => {
                console.log('✅ [ClipboardManager] FEN copié silencieusement');
            }).catch(() => {
                // Ignorer les erreurs en mode silencieux
            });
        } catch (error) {
            console.log(`❌ [ClipboardManager] Erreur copie rapide FEN: ${error.message}`);
        }
    }
    
    // NOUVELLE MÉTHODE : Vérifier si le clipboard est disponible
    isClipboardAvailable() {
        const available = navigator.clipboard !== undefined;
        
        if (this.constructor.consoleLog) {
            console.log(`🔍 [ClipboardManager] Clipboard API disponible? ${available ? '✅ OUI' : '❌ NON'}`);
        }
        
        return available;
    }
    
    // NOUVELLE MÉTHODE : Obtenir les statistiques du FEN/PNG
    getClipboardStats() {
        const stats = {
            fen: {
                length: 0,
                generated: false
            },
            pgn: {
                length: 0,
                moveCount: 0,
                generated: false
            }
        };
        
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            try {
                const fen = window.FENGenerator ? 
                    window.FENGenerator.generateFEN(this.ui.game.gameState, this.ui.game.board) : '';
                if (fen) {
                    stats.fen.length = fen.length;
                    stats.fen.generated = true;
                }
            } catch (error) {
                // Ignorer en mode silencieux
            }
            
            try {
                const pgn = this.ui.game.gameState.getFullPGN ? 
                    this.ui.game.gameState.getFullPGN() : '';
                if (pgn) {
                    stats.pgn.length = pgn.length;
                    stats.pgn.moveCount = this.ui.game.gameState.moveHistory ? 
                        this.ui.game.gameState.moveHistory.length : 0;
                    stats.pgn.generated = true;
                }
            } catch (error) {
                // Ignorer en mode silencieux
            }
            return stats;
        }
        
        // Mode debug
        try {
            const fen = window.FENGenerator ? 
                window.FENGenerator.generateFEN(this.ui.game.gameState, this.ui.game.board) : '';
            
            if (fen) {
                stats.fen.length = fen.length;
                stats.fen.generated = true;
                console.log(`📊 [ClipboardManager] FEN: ${fen.length} caractères`);
            } else {
                console.log('❌ [ClipboardManager] FENGenerator non disponible pour stats');
            }
        } catch (error) {
            console.log(`❌ [ClipboardManager] Impossible de générer stats FEN: ${error.message}`);
        }
        
        try {
            const pgn = this.ui.game.gameState.getFullPGN ? 
                this.ui.game.gameState.getFullPGN() : '';
            
            if (pgn) {
                stats.pgn.length = pgn.length;
                stats.pgn.moveCount = this.ui.game.gameState.moveHistory ? 
                    this.ui.game.gameState.moveHistory.length : 0;
                stats.pgn.generated = true;
                console.log(`📊 [ClipboardManager] PGN: ${pgn.length} caractères, ${stats.pgn.moveCount} coups`);
            } else {
                console.log('❌ [ClipboardManager] getFullPGN non disponible pour stats');
            }
        } catch (error) {
            console.log(`❌ [ClipboardManager] Impossible de générer stats PGN: ${error.message}`);
        }
        
        return stats;
    }
    
    // NOUVELLE MÉTHODE : Tester toutes les fonctionnalités du clipboard
    testClipboardFunctions() {
        // Mode silencieux - ne rien faire
        if (!this.constructor.consoleLog) {
            return { tested: 0, success: 0 };
        }
        
        // Mode debug
        console.group('🧪 [ClipboardManager] Test des fonctionnalités clipboard');
        
        const results = {
            clipboardApi: this.isClipboardAvailable(),
            fenGeneration: false,
            pgnGeneration: false,
            uiAvailable: !!this.ui,
            gameAvailable: !!(this.ui && this.ui.game),
            gameStateAvailable: !!(this.ui && this.ui.game && this.ui.game.gameState),
            fenGeneratorAvailable: !!window.FENGenerator
        };
        
        try {
            const fenStats = this.getClipboardStats();
            results.fenGeneration = fenStats.fen.generated;
            results.pgnGeneration = fenStats.pgn.generated;
        } catch (error) {
            console.log(`❌ [ClipboardManager] Erreur lors du test: ${error.message}`);
        }
        
        console.log('📊 [ClipboardManager] Résultats du test:', results);
        console.groupEnd();
        
        return results;
    }
}

// Initialisation statique
ChessClipboardManager.init();

// Exposer la classe globalement
window.ChessClipboardManager = ChessClipboardManager;

// Ajouter des fonctions utilitaires globales
window.ClipboardManagerUtils = {
    // Forcer le rechargement de la config
    reloadConfig: () => ChessClipboardManager.reloadConfig(),
    
    // Obtenir l'état actuel
    getState: () => ({
        consoleLog: ChessClipboardManager.consoleLog,
        source: ChessClipboardManager.getConfigSource(),
        debugMode: ChessClipboardManager.isDebugMode(),
        configValue: window.appConfig?.debug?.console_log
    }),
    
    // Activer/désactiver manuellement (temporaire)
    setConsoleLog: (value) => {
        const oldValue = ChessClipboardManager.consoleLog;
        ChessClipboardManager.consoleLog = Boolean(value);
        console.log(`🔧 ChessClipboardManager: consoleLog changé manuellement: ${oldValue} → ${ChessClipboardManager.consoleLog}`);
        return ChessClipboardManager.consoleLog;
    },
    
    // Tester la création d'un ClipboardManager
    testClipboardManager: (ui) => {
        console.group('🧪 Test ChessClipboardManager');
        const clipboardManager = new ChessClipboardManager(ui);
        console.log('ClipboardManager créé:', clipboardManager);
        console.log('Clipboard disponible?', clipboardManager.isClipboardAvailable());
        console.log('Statut config:', ChessClipboardManager.getConfigStatus());
        console.groupEnd();
        return clipboardManager;
    },
    
    // Tester le clipboard directement
    testClipboard: () => {
        console.group('🧪 Test Clipboard API');
        const available = navigator.clipboard !== undefined;
        console.log('Clipboard API disponible?', available);
        
        if (available) {
            const testText = 'Test clipboard - ' + new Date().toISOString();
            navigator.clipboard.writeText(testText).then(() => {
                console.log('✅ Test clipboard réussi');
                console.log('Texte copié:', testText);
            }).catch(err => {
                console.log('❌ Test clipboard échoué:', err.message);
            });
        }
        console.groupEnd();
        return available;
    }
};

// Méthode statique pour obtenir le statut de la configuration
ChessClipboardManager.getConfigStatus = function() {
    return {
        consoleLog: this.consoleLog,
        source: this.getConfigSource(),
        debugMode: this.isDebugMode(),
        appConfigAvailable: !!window.appConfig,
        configValue: window.appConfig?.debug?.console_log
    };
};

// Méthode statique pour forcer la mise à jour de la configuration
ChessClipboardManager.reloadConfig = function() {
    const oldValue = this.consoleLog;
    this.loadConfig();
    
    if (this.consoleLog && oldValue !== this.consoleLog) {
        console.log(`🔄 ChessClipboardManager: Configuration rechargée: ${oldValue} → ${this.consoleLog}`);
    }
    return this.consoleLog;
};

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            ChessClipboardManager.loadConfig();
            if (ChessClipboardManager.consoleLog) {
                console.log('✅ ChessClipboardManager: Configuration vérifiée après chargement du DOM');
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        ChessClipboardManager.loadConfig();
    }, 100);
}

// Message final basé sur la configuration
if (ChessClipboardManager.consoleLog) {
    console.log('✅ ChessClipboardManager prêt (mode debug activé)');
} else {
    console.info('✅ ChessClipboardManager prêt (mode silencieux)');
}