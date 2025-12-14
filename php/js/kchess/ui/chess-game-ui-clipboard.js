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
        this.game = ui?.game || null;
        
        if (this.constructor.consoleLog) {
            console.log('📋 [ClipboardManager] Gestionnaire de presse-papier initialisé');
            console.log('📋 [ClipboardManager] UI parent:', ui);
            console.log('📋 [ClipboardManager] Game référence:', this.game);
        }
    }

    copyFENToClipboard() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            try {
                // Essayer plusieurs sources pour obtenir le FEN
                const fen = this.getFEN();
                
                if (!fen) {
                    this.ui?.showNotification?.('Erreur génération FEN', 'error') || 
                    console.error('Erreur génération FEN');
                    return;
                }
                
                this.copyToClipboard(fen, 'FEN');
            } catch (error) {
                this.ui?.showNotification?.('Erreur génération FEN', 'error') || 
                console.error('Erreur génération FEN:', error);
            }
            return;
        }
        
        // Mode debug
        console.log('\n📄 [ClipboardManager] === COPIE FEN ===');
        console.log('📄 [ClipboardManager] Début de la copie FEN...');
        
        try {
            console.log('📄 [ClipboardManager] Tentative de génération FEN...');
            
            // Essayer plusieurs sources pour obtenir le FEN
            const fen = this.getFEN();
            
            if (!fen) {
                console.log('❌ [ClipboardManager] Impossible de générer le FEN');
                this.ui?.showNotification?.('Erreur génération FEN', 'error') || 
                console.error('Erreur génération FEN');
                return;
            }
            
            console.log(`📄 [ClipboardManager] FEN généré: ${fen.substring(0, 60)}...`);
            console.log('📄 [ClipboardManager] Longueur du FEN:', fen.length, 'caractères');
            
            console.log('📄 [ClipboardManager] Tentative de copie...');
            this.copyToClipboard(fen, 'FEN');
            
        } catch (error) {
            console.log(`❌ [ClipboardManager] Erreur génération FEN: ${error.message}`);
            console.error('FEN generation error:', error);
            this.ui?.showNotification?.('Erreur génération FEN', 'error') || 
            console.error('Erreur génération FEN');
        }
        
        console.log('📄 [ClipboardManager] === FIN COPIE FEN ===\n');
    }

    copyPGNToClipboard() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            try {
                // Essayer plusieurs sources pour obtenir le PGN
                const pgn = this.getPGN();
                
                if (!pgn) {
                    this.ui?.showNotification?.('Erreur génération PGN', 'error') || 
                    console.error('Erreur génération PGN');
                    return;
                }
                
                this.copyToClipboard(pgn, 'PGN');
            } catch (error) {
                this.ui?.showNotification?.('Erreur génération PGN', 'error') || 
                console.error('Erreur génération PGN:', error);
            }
            return;
        }
        
        // Mode debug
        console.log('\n📜 [ClipboardManager] === COPIE PGN ===');
        console.log('📜 [ClipboardManager] Début de la copie PGN...');
        
        try {
            console.log('📜 [ClipboardManager] Tentative de génération PGN...');
            
            // Essayer plusieurs sources pour obtenir le PGN
            const pgn = this.getPGN();
            
            if (!pgn) {
                console.log('❌ [ClipboardManager] Impossible de générer le PGN');
                this.ui?.showNotification?.('Erreur génération PGN', 'error') || 
                console.error('Erreur génération PGN');
                return;
            }
            
            console.log(`📜 [ClipboardManager] PGN généré: ${pgn.substring(0, 100)}...`);
            console.log('📜 [ClipboardManager] Longueur du PGN:', pgn.length, 'caractères');
            
            // Compter les mouvements si possible
            const moveCount = this.game?.gameState?.moveHistory?.length || 
                            this.ui?.game?.gameState?.moveHistory?.length || 0;
            console.log(`📜 [ClipboardManager] Nombre de coups estimé: ${moveCount}`);
            
            console.log('📜 [ClipboardManager] Tentative de copie...');
            this.copyToClipboard(pgn, 'PGN');
            
        } catch (error) {
            console.log(`❌ [ClipboardManager] Erreur génération PGN: ${error.message}`);
            console.error('PGN generation error:', error);
            this.ui?.showNotification?.('Erreur génération PGN', 'error') || 
            console.error('Erreur génération PGN');
        }
        
        console.log('📜 [ClipboardManager] === FIN COPIE PGN ===\n');
    }

    // NOUVELLE MÉTHODE : Générer le FEN depuis différentes sources
    getFEN() {
        try {
            // 1. Depuis FENGenerator global
            if (window.FENGenerator && window.FENGenerator.generateFEN) {
                const gameState = this.game?.gameState || this.ui?.game?.gameState;
                const board = this.game?.board || this.ui?.game?.board;
                
                if (gameState && board) {
                    return window.FENGenerator.generateFEN(gameState, board);
                }
            }
            
            // 2. Depuis le jeu directement
            if (this.game?.getFEN) {
                return this.game.getFEN();
            }
            
            if (this.ui?.game?.getFEN) {
                return this.ui.game.getFEN();
            }
            
            // 3. Depuis le core du jeu
            if (this.game?.core?.getFEN) {
                return this.game.core.getFEN();
            }
            
            // 4. Depuis gameState
            const gameState = this.game?.gameState || this.ui?.game?.gameState;
            if (gameState?.getFEN) {
                return gameState.getFEN();
            }
            
            // 5. FEN statique par défaut
            return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.error('❌ [ClipboardManager] Erreur génération FEN:', error);
            }
            return null;
        }
    }

    // NOUVELLE MÉTHODE : Générer le PGN depuis différentes sources
    getPGN() {
        try {
            // 1. Depuis le jeu directement
            if (this.game?.getPGN) {
                return this.game.getPGN();
            }
            
            if (this.ui?.game?.getPGN) {
                return this.ui.game.getPGN();
            }
            
            // 2. Depuis gameState
            const gameState = this.game?.gameState || this.ui?.game?.gameState;
            if (gameState?.getFullPGN) {
                return gameState.getFullPGN();
            }
            
            if (gameState?.getPGN) {
                return gameState.getPGN();
            }
            
            // 3. Depuis le core du jeu
            if (this.game?.core?.getPGN) {
                return this.game.core.getPGN();
            }
            
            // 4. Construire un PGN basique depuis l'historique
            if (gameState?.moveHistory && gameState.moveHistory.length > 0) {
                return this.buildBasicPGN(gameState.moveHistory);
            }
            
            // 5. PGN par défaut
            return '[Event "Partie d\'échecs"]\n[Site "?"]\n[Date "????.??.??"]\n[Round "?"]\n[White "?"]\n[Black "?"]\n[Result "*"]\n\n*';
            
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.error('❌ [ClipboardManager] Erreur génération PGN:', error);
            }
            return null;
        }
    }

    // NOUVELLE MÉTHODE : Construire un PGN basique depuis l'historique
    buildBasicPGN(moveHistory) {
        try {
            let pgn = '[Event "Partie d\'échecs"]\n';
            pgn += '[Site "?"]\n';
            pgn += '[Date "' + new Date().toISOString().split('T')[0] + '"]\n';
            pgn += '[Round "?"]\n';
            pgn += '[White "?"]\n';
            pgn += '[Black "?"]\n';
            pgn += '[Result "*"]\n\n';
            
            // Ajouter les coups
            moveHistory.forEach((move, index) => {
                if (index % 2 === 0) {
                    pgn += ((index / 2) + 1) + '. ';
                }
                pgn += (move.san || move.notation || '??') + ' ';
            });
            
            pgn += '*';
            return pgn;
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.error('❌ [ClipboardManager] Erreur construction PGN:', error);
            }
            return '[Event "Erreur génération PGN"]\n\n*';
        }
    }

    // NOUVELLE MÉTHODE : Copie générique vers le clipboard
copyToClipboard(text, type = 'texte') {
    const typeLower = type.toLowerCase();
    const typeUpper = type.toUpperCase();
    
    // Vérifier si l'API Clipboard est disponible
    const clipboardAvailable = navigator.clipboard !== undefined && 
                              typeof navigator.clipboard.writeText === 'function';
    
    // Mode silencieux
    if (!this.constructor.consoleLog) {
        if (clipboardAvailable) {
            navigator.clipboard.writeText(text).then(() => {
                this.ui?.showNotification?.(`${typeUpper} copié dans le presse-papier !`, 'success');
            }).catch(err => {
                console.error(`Erreur copie ${typeLower}:`, err);
                this.ui?.showNotification?.(`Erreur lors de la copie du ${typeUpper}`, 'error');
                this.fallbackCopy(text, type);
            });
        } else {
            // API non disponible, utiliser directement le fallback
            console.warn(`⚠️ Clipboard API non disponible, utilisation du fallback pour ${typeLower}`);
            this.fallbackCopy(text, type);
        }
        return;
    }
    
    // Mode debug
    console.log(`📋 [ClipboardManager] Copie ${typeLower}...`);
    console.log(`📋 [ClipboardManager] Clipboard API disponible? ${clipboardAvailable ? '✅ OUI' : '❌ NON'}`);
    
    if (clipboardAvailable) {
        navigator.clipboard.writeText(text).then(() => {
            console.log(`✅ [ClipboardManager] ${typeUpper} copié avec succès via Clipboard API`);
            this.ui?.showNotification?.(`${typeUpper} copié dans le presse-papier !`, 'success');
            
        }).catch(err => {
            console.log(`❌ [ClipboardManager] Erreur Clipboard API ${typeUpper}: ${err.message}`);
            this.ui?.showNotification?.(`Erreur lors de la copie du ${typeUpper}`, 'error');
            this.fallbackCopy(text, type);
        });
    } else {
        console.log(`📋 [ClipboardManager] Clipboard API non disponible, utilisation du fallback`);
        this.fallbackCopy(text, type);
    }
}

    // Fallback pour les navigateurs sans clipboard API
    fallbackCopy(text, type = 'texte') {
        const typeLower = type.toLowerCase();
        const typeUpper = type.toUpperCase();
        
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                textarea.setSelectionRange(0, 99999);
                
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);
                
                if (success) {
                    this.ui?.showNotification?.(`${typeUpper} copié (méthode fallback)`, 'success');
                } else {
                    this.ui?.showNotification?.(`Impossible de copier le ${typeUpper}`, 'error');
                }
            } catch (error) {
                // Ignorer en mode silencieux
            }
            return;
        }
        
        // Mode debug
        console.log(`🔧 [ClipboardManager] Tentative de fallback pour copie ${typeLower}...`);
        
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            textarea.setSelectionRange(0, 99999);
            
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (success) {
                console.log(`✅ [ClipboardManager] Fallback ${typeUpper} réussi`);
                this.ui?.showNotification?.(`${typeUpper} copié (méthode fallback)`, 'success');
            } else {
                console.log(`❌ [ClipboardManager] Fallback ${typeUpper} échoué`);
                this.ui?.showNotification?.(`Impossible de copier le ${typeUpper}`, 'error');
            }
        } catch (error) {
            console.log(`❌ [ClipboardManager] Erreur fallback ${typeUpper}: ${error.message}`);
        }
    }

    // Méthode existante renommée pour compatibilité
    fallbackCopyFEN(fen) {
        this.fallbackCopy(fen, 'FEN');
    }

    // Méthode existante renommée pour compatibilité
    fallbackCopyPGN(pgn) {
        this.fallbackCopy(pgn, 'PGN');
    }
    
    // NOUVELLE MÉTHODE : Copie rapide du FEN pour debug
// NOUVELLE MÉTHODE : Copie rapide du FEN pour debug
quickCopyFEN() {
    // Mode silencieux
    if (!this.constructor.consoleLog) {
        try {
            const fen = this.getFEN();
            if (fen) {
                // Vérifier si l'API est disponible
                if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                    navigator.clipboard.writeText(fen).catch(() => {});
                } else {
                    // Fallback silencieux
                    this.fallbackCopy(fen, 'FEN');
                }
            }
        } catch (error) {
            // Ignorer en mode silencieux
        }
        return;
    }
    
    // Mode debug
    console.log('⚡ [ClipboardManager] Copie rapide FEN demandée...');
    
    try {
        const fen = this.getFEN();
        
        if (!fen) {
            console.log('❌ [ClipboardManager] Impossible de générer FEN pour copie rapide');
            return;
        }
        
        // Vérifier si l'API est disponible
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(fen).then(() => {
                console.log('✅ [ClipboardManager] FEN copié silencieusement via Clipboard API');
            }).catch(() => {
                console.log('⚠️ [ClipboardManager] Échec Clipboard API, tentative fallback...');
                this.fallbackCopy(fen, 'FEN');
            });
        } else {
            console.log('⚠️ [ClipboardManager] Clipboard API non disponible, utilisation fallback');
            this.fallbackCopy(fen, 'FEN');
        }
    } catch (error) {
        console.log(`❌ [ClipboardManager] Erreur copie rapide FEN: ${error.message}`);
    }
}
    
    // NOUVELLE MÉTHODE : Vérifier si le clipboard est disponible
// NOUVELLE MÉTHODE : Vérifier si le clipboard est disponible
isClipboardAvailable() {
    // Vérifier plusieurs conditions
    const available = navigator.clipboard !== undefined && 
                     typeof navigator.clipboard.writeText === 'function';
    
    // Vérifier aussi si on est en HTTPS ou localhost (requis pour l'API)
    const isSecureContext = window.isSecureContext || 
                           location.protocol === 'https:' || 
                           location.hostname === 'localhost' || 
                           location.hostname === '127.0.0.1';
    
    const reallyAvailable = available && isSecureContext;
    
    if (this.constructor.consoleLog) {
        console.log(`🔍 [ClipboardManager] Clipboard API disponible? ${available ? '✅ API présente' : '❌ API absente'}`);
        console.log(`🔍 [ClipboardManager] Contexte sécurisé? ${isSecureContext ? '✅ OUI' : '❌ NON'}`);
        console.log(`🔍 [ClipboardManager] Réellement utilisable? ${reallyAvailable ? '✅ OUI' : '❌ NON'}`);
        console.log(`🔍 [ClipboardManager] Protocole: ${location.protocol}, Hostname: ${location.hostname}`);
    }
    
    return reallyAvailable;
}
    
    // NOUVELLE MÉTHODE : Obtenir les statistiques du FEN/PNG
    getClipboardStats() {
        const stats = {
            fen: {
                length: 0,
                generated: false,
                source: 'none'
            },
            pgn: {
                length: 0,
                moveCount: 0,
                generated: false,
                source: 'none'
            }
        };
        
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            try {
                const fen = this.getFEN();
                if (fen) {
                    stats.fen.length = fen.length;
                    stats.fen.generated = true;
                }
            } catch (error) {
                // Ignorer en mode silencieux
            }
            
            try {
                const pgn = this.getPGN();
                if (pgn) {
                    stats.pgn.length = pgn.length;
                    stats.pgn.generated = true;
                    stats.pgn.moveCount = this.game?.gameState?.moveHistory?.length || 
                                        this.ui?.game?.gameState?.moveHistory?.length || 0;
                }
            } catch (error) {
                // Ignorer en mode silencieux
            }
            return stats;
        }
        
        // Mode debug
        try {
            const fen = this.getFEN();
            
            if (fen) {
                stats.fen.length = fen.length;
                stats.fen.generated = true;
                stats.fen.source = 'generated';
                console.log(`📊 [ClipboardManager] FEN: ${fen.length} caractères`);
            } else {
                console.log('❌ [ClipboardManager] Impossible de générer stats FEN');
            }
        } catch (error) {
            console.log(`❌ [ClipboardManager] Erreur génération stats FEN: ${error.message}`);
        }
        
        try {
            const pgn = this.getPGN();
            
            if (pgn) {
                stats.pgn.length = pgn.length;
                stats.pgn.generated = true;
                stats.pgn.source = 'generated';
                stats.pgn.moveCount = this.game?.gameState?.moveHistory?.length || 
                                    this.ui?.game?.gameState?.moveHistory?.length || 0;
                console.log(`📊 [ClipboardManager] PGN: ${pgn.length} caractères, ${stats.pgn.moveCount} coups`);
            } else {
                console.log('❌ [ClipboardManager] Impossible de générer stats PGN');
            }
        } catch (error) {
            console.log(`❌ [ClipboardManager] Erreur génération stats PGN: ${error.message}`);
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
            gameAvailable: !!this.game,
            gameStateAvailable: !!(this.game?.gameState || this.ui?.game?.gameState),
            fenGeneratorAvailable: !!window.FENGenerator,
            methods: {
                copyFENToClipboard: typeof this.copyFENToClipboard === 'function',
                copyPGNToClipboard: typeof this.copyPGNToClipboard === 'function',
                getFEN: typeof this.getFEN === 'function',
                getPGN: typeof this.getPGN === 'function'
            }
        };
        
        try {
            const fenStats = this.getClipboardStats();
            results.fenGeneration = fenStats.fen.generated;
            results.pgnGeneration = fenStats.pgn.generated;
            
            // Tester la copie FEN (sans réellement copier)
            console.log('🧪 [ClipboardManager] Test copie FEN...');
            const fen = this.getFEN();
            results.fenTest = !!fen;
            
            // Tester la copie PGN (sans réellement copier)
            console.log('🧪 [ClipboardManager] Test copie PGN...');
            const pgn = this.getPGN();
            results.pgnTest = !!pgn;
            
        } catch (error) {
            console.log(`❌ [ClipboardManager] Erreur lors du test: ${error.message}`);
            results.error = error.message;
        }
        
        console.log('📊 [ClipboardManager] Résultats du test:', results);
        console.groupEnd();
        
        return results;
    }

    // NOUVELLE MÉTHODE : Diagnostiquer pourquoi copyPGN ne marche pas
    diagnosePGNProblem() {
        if (!this.constructor.consoleLog) return null;
        
        console.group('🔍 [ClipboardManager] Diagnostic problème PGN');
        
        const diagnosis = {
            uiExists: !!this.ui,
            gameExists: !!this.game,
            gameStateExists: !!(this.game?.gameState || this.ui?.game?.gameState),
            methodsAvailable: {
                gameGetPGN: !!(this.game?.getPGN),
                gameStateGetFullPGN: !!(this.game?.gameState?.getFullPGN || this.ui?.game?.gameState?.getFullPGN),
                gameStateGetPGN: !!(this.game?.gameState?.getPGN || this.ui?.game?.gameState?.getPGN),
                coreGetPGN: !!(this.game?.core?.getPGN)
            },
            moveHistoryExists: !!(this.game?.gameState?.moveHistory || this.ui?.game?.gameState?.moveHistory),
            moveHistoryLength: this.game?.gameState?.moveHistory?.length || this.ui?.game?.gameState?.moveHistory?.length || 0
        };
        
        console.log('🔍 [ClipboardManager] Diagnostic:', diagnosis);
        
        // Essayer d'obtenir le PGN de différentes manières
        console.log('🔍 [ClipboardManager] Essai 1 - game.getPGN:');
        if (this.game?.getPGN) {
            try {
                const pgn = this.game.getPGN();
                console.log('✅ PGN obtenu via game.getPGN():', pgn?.substring(0, 100));
            } catch (e) {
                console.log('❌ Erreur:', e.message);
            }
        }
        
        console.log('🔍 [ClipboardManager] Essai 2 - gameState.getFullPGN:');
        const gameState = this.game?.gameState || this.ui?.game?.gameState;
        if (gameState?.getFullPGN) {
            try {
                const pgn = gameState.getFullPGN();
                console.log('✅ PGN obtenu via gameState.getFullPGN():', pgn?.substring(0, 100));
            } catch (e) {
                console.log('❌ Erreur:', e.message);
            }
        }
        
        console.log('🔍 [ClipboardManager] Essai 3 - Construction basique:');
        if (diagnosis.moveHistoryExists) {
            try {
                const pgn = this.buildBasicPGN(gameState.moveHistory);
                console.log('✅ PGN construit basique:', pgn?.substring(0, 100));
            } catch (e) {
                console.log('❌ Erreur:', e.message);
            }
        }
        
        console.groupEnd();
        return diagnosis;
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
    },
    
    // Diagnostiquer les problèmes de PGN
    diagnosePGN: (clipboardManager) => {
        if (!clipboardManager || typeof clipboardManager.diagnosePGNProblem !== 'function') {
            console.error('❌ ClipboardManager non disponible');
            return null;
        }
        return clipboardManager.diagnosePGNProblem();
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

// Ajouter un événement global pour tester le PGN
if (ChessClipboardManager.consoleLog) {
    window.addEventListener('keydown', (e) => {
        // Ctrl+Alt+P pour diagnostiquer le PGN
        if (e.ctrlKey && e.altKey && e.key === 'p') {
            e.preventDefault();
            console.log('🔧 Diagnostic PGN déclenché manuellement');
            
            // Trouver un ClipboardManager existant
            const chessGameUI = window.chessGameUI;
            if (chessGameUI?.clipboardManager) {
                chessGameUI.clipboardManager.diagnosePGNProblem();
            } else {
                console.log('❌ Aucun ClipboardManager trouvé');
            }
        }
        
        // Ctrl+Alt+C pour tester la copie PGN
        if (e.ctrlKey && e.altKey && e.key === 'c') {
            e.preventDefault();
            console.log('🔧 Test copie PGN déclenché manuellement');
            
            const chessGameUI = window.chessGameUI;
            if (chessGameUI?.clipboardManager) {
                chessGameUI.clipboardManager.copyPGNToClipboard();
            } else {
                console.log('❌ Aucun ClipboardManager trouvé pour tester');
            }
        }
    });
}