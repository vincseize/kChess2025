// check/checkFenPosition.js - Version avec consoleLog configurable
class ChessFenPosition {
    
    static consoleLog = true; // Valeur par défaut - sera écrasée par la config JSON
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('✅ check/checkFenPosition.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            console.info('🔇 checkFenPosition.js: Mode silencieux activé');
        }
    }
    
    // Méthode pour charger la configuration CORRIGÉE
    static loadConfig() {
        try {
            // Vérifier si la configuration globale existe
            if (window.appConfig && window.appConfig.debug) {
                const configValue = window.appConfig.debug.console_log;
                
                // CONVERSION CORRECTE - Gérer les string "false" et "true"
                if (configValue === "false") {
                    this.consoleLog = false;
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
                    console.log(`⚙️ ChessFenPosition: Configuration chargée - console_log = ${this.consoleLog}`);
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
                console.warn('⚠️ ChessFenPosition: Aucune configuration trouvée, utilisation de la valeur par défaut (true)');
            }
            return false;
            
        } catch (error) {
            console.error('❌ ChessFenPosition: Erreur lors du chargement de la config:', error);
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

    static isValid(fen) {
        try {
            if (!fen || typeof fen !== 'string') return false;
            
            const parts = fen.trim().split(' ');
            if (parts.length !== 6) return false;
            
            const [board, turn, castling, enPassant, halfMove, fullMove] = parts;
            
            // Vérifications essentielles
            if (!this.validateBoard(board)) return false;
            if (!/^[wb]$/.test(turn)) return false;
            if (!this.validateCastling(castling)) return false;
            if (!this.validateEnPassant(enPassant)) return false;
            if (!this.validateCounters(halfMove, fullMove)) return false;
            
            if (this.consoleLog) {
                console.log('✅ Position FEN valide:', fen.substring(0, 50) + (fen.length > 50 ? '...' : ''));
            }
            
            return true;
            
        } catch (error) {
            if (this.consoleLog) {
                console.log('❌ Erreur validation FEN:', error);
            }
            return false;
        }
    }
    
    static validateBoard(board) {
        // Mode silencieux - sans logs
        if (!this.consoleLog) {
            const rows = board.split('/');
            if (rows.length !== 8) return false;
            
            // Vérifier chaque rangée
            for (let i = 0; i < 8; i++) {
                let count = 0;
                for (const char of rows[i]) {
                    if (/^[KQRBNPkqrbnp]$/.test(char)) {
                        count++;
                    } else if (/^[1-8]$/.test(char)) {
                        count += parseInt(char);
                    } else {
                        return false;
                    }
                }
                if (count !== 8) return false;
                
                // Pions pas sur rangée 1 ou 8
                if (i === 0 && rows[i].includes('P')) return false;
                if (i === 7 && rows[i].includes('p')) return false;
            }
            
            // Exactement 1 roi par couleur
            const whiteKings = (board.match(/K/g) || []).length;
            const blackKings = (board.match(/k/g) || []).length;
            
            if (whiteKings !== 1) return false;
            if (blackKings !== 1) return false;
            
            return true;
        }
        
        // Mode debug - avec logs
        const rows = board.split('/');
        if (rows.length !== 8) {
            if (this.consoleLog) console.log('❌ Plateau doit avoir 8 rangées');
            return false;
        }
        
        // Vérifier chaque rangée
        for (let i = 0; i < 8; i++) {
            let count = 0;
            for (const char of rows[i]) {
                if (/^[KQRBNPkqrbnp]$/.test(char)) {
                    count++;
                } else if (/^[1-8]$/.test(char)) {
                    count += parseInt(char);
                } else {
                    if (this.consoleLog) console.log(`❌ Caractère invalide '${char}' dans la rangée ${8-i}`);
                    return false;
                }
            }
            if (count !== 8) {
                if (this.consoleLog) console.log(`❌ Rangée ${8-i} a ${count} cases au lieu de 8`);
                return false;
            }
            
            // Pions pas sur rangée 1 ou 8
            if (i === 0 && rows[i].includes('P')) {
                if (this.consoleLog) console.log('❌ Pion blanc sur rangée 8 (impossible)');
                return false;
            }
            if (i === 7 && rows[i].includes('p')) {
                if (this.consoleLog) console.log('❌ Pion noir sur rangée 1 (impossible)');
                return false;
            }
        }
        
        // Exactement 1 roi par couleur
        const whiteKings = (board.match(/K/g) || []).length;
        const blackKings = (board.match(/k/g) || []).length;
        
        if (whiteKings !== 1) {
            if (this.consoleLog) console.log(`❌ Doit avoir exactement 1 roi blanc, trouvé: ${whiteKings}`);
            return false;
        }
        if (blackKings !== 1) {
            if (this.consoleLog) console.log(`❌ Doit avoir exactement 1 roi noir, trouvé: ${blackKings}`);
            return false;
        }
        
        return true;
    }
    
    static validateCastling(castling) {
        const isValid = castling === '-' || /^[KQkq]+$/.test(castling);
        if (!isValid && this.consoleLog) {
            console.log(`❌ Droits de roque invalides: '${castling}'`);
        }
        return isValid;
    }
    
    static validateEnPassant(enPassant) {
        const isValid = enPassant === '-' || /^[a-h][36]$/.test(enPassant);
        if (!isValid && this.consoleLog) {
            console.log(`❌ Prise en passant invalide: '${enPassant}'`);
        }
        return isValid;
    }
    
    static validateCounters(halfMove, fullMove) {
        // Mode silencieux
        if (!this.consoleLog) {
            if (!/^\d+$/.test(halfMove) || !/^\d+$/.test(fullMove)) {
                return false;
            }
            
            const halfMoveNum = parseInt(halfMove);
            const fullMoveNum = parseInt(fullMove);
            
            if (halfMoveNum < 0 || halfMoveNum > 100) return false;
            if (fullMoveNum < 1) return false;
            
            return true;
        }
        
        // Mode debug
        if (!/^\d+$/.test(halfMove) || !/^\d+$/.test(fullMove)) {
            if (this.consoleLog) console.log('❌ Compteurs de coups invalides');
            return false;
        }
        
        const halfMoveNum = parseInt(halfMove);
        const fullMoveNum = parseInt(fullMove);
        
        // CORRECTION IMPORTANTE : halfMove doit être entre 0 et 100
        // 0 = juste après capture/mouvement pion
        // 100 = nullité par règle des 50 coups
        if (halfMoveNum < 0 || halfMoveNum > 100) {
            if (this.consoleLog) console.log(`❌ Halfmove clock invalide: ${halfMoveNum} (doit être 0-100)`);
            return false;
        }
        
        // fullMove doit être >= 1 (pas de partie à 0 coup)
        if (fullMoveNum < 1) {
            if (this.consoleLog) console.log(`❌ Fullmove counter invalide: ${fullMoveNum} (doit être >= 1)`);
            return false;
        }
        
        return true;
    }
    
    static quickCheck(fen) {
        try {
            if (!fen || typeof fen !== 'string') return false;
            
            const parts = fen.trim().split(' ');
            if (parts.length !== 6) return false;
            
            // Vérification ultra-rapide
            return parts[0].includes('/') &&        // Board avec /
                   /^[wb]$/.test(parts[1]) &&       // Tour valide
                   /^\d+$/.test(parts[4]) &&        // Halfmove numérique
                   /^\d+$/.test(parts[5]);          // Fullmove numérique
                   
        } catch {
            return false;
        }
    }
    
    /**
     * Analyse détaillée d'un FEN
     */
    static analyze(fen) {
        const result = {
            isValid: false,
            errors: [],
            warnings: [],
            details: {}
        };
        
        try {
            result.isValid = this.isValid(fen);
            
            if (result.isValid) {
                const parts = fen.split(' ');
                const [board, turn, castling, enPassant, halfMove, fullMove] = parts;
                
                result.details = {
                    board: board,
                    turn: turn === 'w' ? 'white' : 'black',
                    castling: castling === '-' ? 'aucun' : castling,
                    enPassant: enPassant === '-' ? 'aucune' : enPassant,
                    halfMoveClock: parseInt(halfMove),
                    fullMoveNumber: parseInt(fullMove),
                    halfMoveStatus: this.getHalfMoveStatus(parseInt(halfMove))
                };
                
                // Avertissement si proche de la nullité
                if (parseInt(halfMove) >= 90) {
                    result.warnings.push(`⚠️ Proche de la nullité par règle des 50 coups: ${halfMove}/100`);
                }
                
                if (parseInt(halfMove) >= 100) {
                    result.warnings.push(`🎯 Nullité par règle des 50 coups atteinte!`);
                }
                
                if (this.consoleLog) {
                    console.log('📊 Analyse FEN:', result);
                }
            }
            
        } catch (error) {
            result.errors.push(`Erreur d'analyse: ${error.message}`);
            if (this.consoleLog) {
                console.log('❌ Erreur analyse FEN:', error);
            }
        }
        
        return result;
    }
    
    /**
     * Statut du halfmove clock
     */
    static getHalfMoveStatus(halfMove) {
        if (halfMove === 0) return 'Réinitialisé (capture ou mouvement pion récent)';
        if (halfMove < 50) return `Normal (${halfMove} demi-coups)`;
        if (halfMove < 90) return `Élevé - ${halfMove} demi-coups depuis dernière capture/mouvement pion`;
        if (halfMove < 100) return `⚠️ Critique - ${halfMove}/100 (proche nullité 50 coups)`;
        return `🎯 Nullité - 100/100 (règle des 50 coups appliquée)`;
    }
    
    // Méthode pour forcer la mise à jour de la configuration
    static reloadConfig() {
        const oldValue = this.consoleLog;
        this.loadConfig();
        
        if (this.consoleLog && oldValue !== this.consoleLog) {
            console.log(`🔄 ChessFenPosition: Configuration rechargée: ${oldValue} → ${this.consoleLog}`);
        }
        return this.consoleLog;
    }
    
    /**
     * Configurer le mode debug (manuellement)
     */
    static setDebugMode(enabled) {
        this.consoleLog = enabled;
        console.log(`🔧 ChessFenPosition debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }
}

// Initialisation statique
ChessFenPosition.init();

// Exposer la classe globalement
window.ChessFenPosition = ChessFenPosition;

// Ajouter des fonctions utilitaires globales
window.ChessFenPositionUtils = {
    // Forcer le rechargement de la config
    reloadConfig: () => ChessFenPosition.reloadConfig(),
    
    // Tester la configuration
    testConfig: () => {
        console.group('🧪 Test de configuration ChessFenPosition');
        console.log('consoleLog actuel:', ChessFenPosition.consoleLog);
        console.log('Source config:', ChessFenPosition.getConfigSource());
        console.log('window.appConfig disponible:', !!window.appConfig);
        
        if (window.appConfig) {
            console.log('Valeur debug.console_log dans appConfig:', 
                window.appConfig.debug?.console_log,
                '(type:', typeof window.appConfig.debug?.console_log + ')');
        }
        
        console.log('Mode debug activé:', ChessFenPosition.isDebugMode());
        console.groupEnd();
        
        return ChessFenPosition.consoleLog;
    },
    
    // Obtenir l'état actuel
    getState: () => ({
        consoleLog: ChessFenPosition.consoleLog,
        source: ChessFenPosition.getConfigSource(),
        debugMode: ChessFenPosition.isDebugMode(),
        configValue: window.appConfig?.debug?.console_log
    }),
    
    // Vérifier la configuration JSON
    checkJSONConfig: () => {
        if (window.appConfig) {
            return {
                exists: true,
                debug: window.appConfig.debug,
                console_log_value: window.appConfig.debug?.console_log,
                console_log_type: typeof window.appConfig.debug?.console_log
            };
        }
        return { exists: false };
    },
    
    // Tester un FEN
    testFEN: (fen) => {
        console.group('🧪 Test FEN');
        const result = ChessFenPosition.analyze(fen);
        console.log('Résultat:', result);
        console.groupEnd();
        return result;
    },
    
    // Validation rapide
    quickValidate: (fen) => {
        return ChessFenPosition.quickCheck(fen);
    }
};

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            ChessFenPosition.loadConfig();
            if (ChessFenPosition.consoleLog) {
                console.log('✅ ChessFenPosition: Configuration vérifiée après chargement du DOM');
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        ChessFenPosition.loadConfig();
    }, 100);
}

// Message final basé sur la configuration
if (ChessFenPosition.consoleLog) {
    console.log('✅ ChessFenPosition prêt (mode debug activé)');
} else {
    console.info('✅ ChessFenPosition prêt (mode silencieux)');
}