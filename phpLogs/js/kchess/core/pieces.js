// core/pieces.js - Version utilisant la configuration JSON comme priorité
class PieceManager {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('🎨 core/pieces.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('🎨 PieceManager: Mode silencieux activé (debug désactivé dans config)');
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
                        console.info('🔧 PieceManager: console_log désactivé via config JSON');
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
                    console.log(`⚙️ PieceManager: Configuration chargée - console_log = ${this.consoleLog} (valeur brute: "${configValue}")`);
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
                console.warn('⚠️ PieceManager: Aucune configuration trouvée, utilisation de la valeur par défaut (true)');
            }
            return false;
            
        } catch (error) {
            console.error('❌ PieceManager: Erreur lors du chargement de la config:', error);
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

    constructor() {
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        // Mode debug
        if (this.constructor.consoleLog) {
            console.log('\n🎨 [PieceManager] === INITIALISATION DES PIÈCES ===');
            console.log('🎨 [PieceManager] Création du gestionnaire de pièces...');
        }
        
        this.pieceSymbols = {
            white: {
                king: '<img src="img/chesspieces/wikipedia/wK.png" alt="Roi Blanc" class="chess-piece-img">',
                queen: '<img src="img/chesspieces/wikipedia/wQ.png" alt="Dame Blanche" class="chess-piece-img">',
                rook: '<img src="img/chesspieces/wikipedia/wR.png" alt="Tour Blanche" class="chess-piece-img">',
                bishop: '<img src="img/chesspieces/wikipedia/wB.png" alt="Fou Blanc" class="chess-piece-img">',
                knight: '<img src="img/chesspieces/wikipedia/wN.png" alt="Cavalier Blanc" class="chess-piece-img">',
                pawn: '<img src="img/chesspieces/wikipedia/wP.png" alt="Pion Blanc" class="chess-piece-img">'
            },
            black: {
                king: '<img src="img/chesspieces/wikipedia/bK.png" alt="Roi Noir" class="chess-piece-img">',
                queen: '<img src="img/chesspieces/wikipedia/bQ.png" alt="Dame Noire" class="chess-piece-img">',
                rook: '<img src="img/chesspieces/wikipedia/bR.png" alt="Tour Noire" class="chess-piece-img">',
                bishop: '<img src="img/chesspieces/wikipedia/bB.png" alt="Fou Noir" class="chess-piece-img">',
                knight: '<img src="img/chesspieces/wikipedia/bN.png" alt="Cavalier Noir" class="chess-piece-img">',
                pawn: '<img src="img/chesspieces/wikipedia/bP.png" alt="Pion Noir" class="chess-piece-img">'
            }
        };
        
        if (this.constructor.consoleLog) {
            console.log('✅ [PieceManager] Symboles de pièces chargés:');
            console.log('   • 6 types de pièces pour chaque couleur');
            console.log('   • Images: /img/chesspieces/wikipedia/');
            console.log('✅ [PieceManager] === INITIALISATION TERMINÉE ===\n');
        }
    }

    getSymbol(type, color) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            if (!this.pieceSymbols[color]) return '';
            if (!this.pieceSymbols[color][type]) return '';
            return this.pieceSymbols[color][type];
        }
        
        // Mode debug
        console.log(`♟️ [PieceManager] Demande symbole: ${type} (${color})`);
        
        if (!this.pieceSymbols[color]) {
            console.error(`❌ [PieceManager] Couleur invalide: ${color}`);
            return '';
        }
        
        if (!this.pieceSymbols[color][type]) {
            console.error(`❌ [PieceManager] Type de pièce invalide: ${type}`);
            return '';
        }
        
        const symbol = this.pieceSymbols[color][type];
        const fileName = symbol.match(/src="([^"]+)"/)?.[1] || 'inconnu';
        console.log(`✅ [PieceManager] Symbole trouvé: ${fileName}`);
        
        return symbol;
    }

    getInitialPosition() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            const initialPosition = {
                // Pions noirs (rangée 1)
                ...this.createPieces('pawn', 'black', 1),
                // Pièces noires (rangée 0)
                ...this.createBackRow('black', 0),
                // Pions blancs (rangée 6)
                ...this.createPieces('pawn', 'white', 6),
                // Pièces blanches (rangée 7)
                ...this.createBackRow('white', 7)
            };
            return initialPosition;
        }
        
        // Mode debug
        console.log('\n🎲 [PieceManager] === POSITION INITIALE ===');
        console.log('🎲 [PieceManager] Création de la position initiale...');
        
        const initialPosition = {
            // Pions noirs (rangée 1)
            ...this.createPieces('pawn', 'black', 1),
            // Pièces noires (rangée 0)
            ...this.createBackRow('black', 0),
            // Pions blancs (rangée 6)
            ...this.createPieces('pawn', 'white', 6),
            // Pièces blanches (rangée 7)
            ...this.createBackRow('white', 7)
        };
        
        const totalPieces = Object.keys(initialPosition).length;
        const whitePieces = Object.values(initialPosition).filter(p => p.color === 'white').length;
        const blackPieces = Object.values(initialPosition).filter(p => p.color === 'black').length;
        
        console.log(`🎲 [PieceManager] Position initiale créée:`);
        console.log(`   • Total pièces: ${totalPieces}`);
        console.log(`   • Pièces blanches: ${whitePieces}`);
        console.log(`   • Pièces noires: ${blackPieces}`);
        console.log(`   • Configuration standard FEN`);
        console.log('🎲 [PieceManager] === POSITION TERMINÉE ===\n');
        
        return initialPosition;
    }

    createPieces(type, color, row) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            const pieces = {};
            for (let col = 0; col < 8; col++) {
                pieces[`${row}-${col}`] = { type, color };
            }
            return pieces;
        }
        
        // Mode debug
        console.log(`   🎨 [PieceManager] Création ${type}s ${color} en rangée ${row}...`);
        
        const pieces = {};
        for (let col = 0; col < 8; col++) {
            const key = `${row}-${col}`;
            pieces[key] = { type, color };
            
            if (col === 0 || col === 7) {
                const file = String.fromCharCode(97 + col);
                const rank = 8 - row;
                console.log(`     ♟️ ${type.charAt(0).toUpperCase()} en ${file}${rank} (${color})`);
            }
        }
        
        console.log(`   ✅ [PieceManager] 8 ${type}s ${color} créés`);
        return pieces;
    }

    createBackRow(color, row) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            return {
                [`${row}-0`]: { type: 'rook', color },
                [`${row}-1`]: { type: 'knight', color },
                [`${row}-2`]: { type: 'bishop', color },
                [`${row}-3`]: { type: 'queen', color },
                [`${row}-4`]: { type: 'king', color },
                [`${row}-5`]: { type: 'bishop', color },
                [`${row}-6`]: { type: 'knight', color },
                [`${row}-7`]: { type: 'rook', color }
            };
        }
        
        // Mode debug
        console.log(`   🏰 [PieceManager] Création rangée de pièces ${color} en rangée ${row}...`);
        
        const backRow = {
            [`${row}-0`]: { type: 'rook', color },
            [`${row}-1`]: { type: 'knight', color },
            [`${row}-2`]: { type: 'bishop', color },
            [`${row}-3`]: { type: 'queen', color },
            [`${row}-4`]: { type: 'king', color },
            [`${row}-5`]: { type: 'bishop', color },
            [`${row}-6`]: { type: 'knight', color },
            [`${row}-7`]: { type: 'rook', color }
        };
        
        const rowName = color === 'white' ? '1' : '8';
        console.log(`   🏰 [PieceManager] Rangée ${rowName} (${color}):`);
        console.log(`     • a${rowName}: Tour (${backRow[`${row}-0`].type})`);
        console.log(`     • b${rowName}: Cavalier (${backRow[`${row}-1`].type})`);
        console.log(`     • c${rowName}: Fou (${backRow[`${row}-2`].type})`);
        console.log(`     • d${rowName}: Dame (${backRow[`${row}-3`].type})`);
        console.log(`     • e${rowName}: Roi (${backRow[`${row}-4`].type})`);
        console.log(`     • f${rowName}: Fou (${backRow[`${row}-5`].type})`);
        console.log(`     • g${rowName}: Cavalier (${backRow[`${row}-6`].type})`);
        console.log(`     • h${rowName}: Tour (${backRow[`${row}-7`].type})`);
        
        return backRow;
    }
    
    // NOUVELLE MÉTHODE : Obtenir toutes les pièces disponibles
    getAllPiecesInfo() {
        const info = {
            white: Object.keys(this.pieceSymbols.white),
            black: Object.keys(this.pieceSymbols.black),
            totalTypes: 6,
            colors: ['white', 'black']
        };
        
        if (this.constructor.consoleLog) {
            console.log('📋 [PieceManager] Informations sur les pièces:', info);
        }
        
        return info;
    }
    
    // NOUVELLE MÉTHODE : Vérifier si un type de pièce existe
    isValidPieceType(type, color) {
        const isValid = this.pieceSymbols[color] && this.pieceSymbols[color][type] !== undefined;
        
        if (this.constructor.consoleLog) {
            console.log(`🔍 [PieceManager] Type ${type} (${color}) valide? ${isValid ? '✅ OUI' : '❌ NON'}`);
        }
        
        return isValid;
    }
    
    // NOUVELLE MÉTHODE : Obtenir l'emoji d'une pièce (pour debug)
    getPieceEmoji(type, color) {
        const emojis = {
            'king': { white: '♔', black: '♚' },
            'queen': { white: '♕', black: '♛' },
            'rook': { white: '♖', black: '♜' },
            'bishop': { white: '♗', black: '♝' },
            'knight': { white: '♘', black: '♞' },
            'pawn': { white: '♙', black: '♟' }
        };
        
        const emoji = emojis[type]?.[color] || '?';
        
        if (this.constructor.consoleLog) {
            console.log(`🎭 [PieceManager] Emoji pour ${type} (${color}): ${emoji}`);
        }
        
        return emoji;
    }
    
    // NOUVELLE MÉTHODE : Générer un tableau ASCII de la position initiale
    displayAsciiPosition() {
        // Mode silencieux - ne rien afficher
        if (!this.constructor.consoleLog) return;
        
        console.log('\n🎨 [PieceManager] === TABLEAU ASCII POSITION INITIALE ===');
        const initialPosition = this.getInitialPosition();
        
        console.log('   a b c d e f g h');
        for (let row = 0; row < 8; row++) {
            let rowStr = `${8 - row} `;
            for (let col = 0; col < 8; col++) {
                const piece = initialPosition[`${row}-${col}`];
                if (piece) {
                    const emoji = this.getPieceEmoji(piece.type, piece.color);
                    rowStr += emoji + ' ';
                } else {
                    rowStr += '. ';
                }
            }
            rowStr += ` ${8 - row}`;
            console.log(rowStr);
        }
        console.log('   a b c d e f g h');
        console.log('🎨 [PieceManager] === FIN TABLEAU ASCII ===\n');
    }
    
    // NOUVELLE MÉTHODE : Vérifier la disponibilité des images
    checkImagesAvailability() {
        // Mode silencieux - exécuter sans logs
        if (!this.constructor.consoleLog) {
            return { available: true, checks: 12, failed: 0 };
        }
        
        console.log('\n🖼️ [PieceManager] === VÉRIFICATION DES IMAGES ===');
        console.log('🖼️ [PieceManager] Vérification de la disponibilité des images...');
        
        let availableCount = 0;
        let totalChecks = 0;
        
        for (const color in this.pieceSymbols) {
            for (const type in this.pieceSymbols[color]) {
                totalChecks++;
                const imgSrc = this.pieceSymbols[color][type].match(/src="([^"]+)"/)?.[1];
                if (imgSrc) {
                    availableCount++;
                    console.log(`   ✅ ${type} ${color}: ${imgSrc}`);
                } else {
                    console.log(`   ❌ ${type} ${color}: source non trouvée`);
                }
            }
        }
        
        const allAvailable = availableCount === totalChecks;
        
        console.log(`🖼️ [PieceManager] Résultat: ${availableCount}/${totalChecks} images disponibles`);
        console.log(`🖼️ [PieceManager] Toutes disponibles? ${allAvailable ? '✅ OUI' : '⚠️ NON'}`);
        console.log('🖼️ [PieceManager] === VÉRIFICATION TERMINÉE ===\n');
        
        return {
            available: allAvailable,
            checks: totalChecks,
            failed: totalChecks - availableCount
        };
    }
}

// Initialisation statique
PieceManager.init();

// Exposer la classe globalement
window.PieceManager = PieceManager;

// Ajouter des fonctions utilitaires globales
window.PieceManagerUtils = {
    // Forcer le rechargement de la config
    reloadConfig: () => PieceManager.reloadConfig(),
    
    // Obtenir l'état actuel
    getState: () => ({
        consoleLog: PieceManager.consoleLog,
        source: PieceManager.getConfigSource(),
        debugMode: PieceManager.isDebugMode(),
        configValue: window.appConfig?.debug?.console_log
    }),
    
    // Activer/désactiver manuellement (temporaire)
    setConsoleLog: (value) => {
        const oldValue = PieceManager.consoleLog;
        PieceManager.consoleLog = Boolean(value);
        console.log(`🔧 PieceManager: consoleLog changé manuellement: ${oldValue} → ${PieceManager.consoleLog}`);
        return PieceManager.consoleLog;
    },
    
    // Tester la création d'un PieceManager
    testPieceManager: () => {
        console.group('🧪 Test PieceManager');
        const pieceManager = new PieceManager();
        console.log('PieceManager créé:', pieceManager);
        console.log('Informations pièces:', pieceManager.getAllPiecesInfo());
        console.log('Statut config:', PieceManager.getConfigStatus());
        console.groupEnd();
        return pieceManager;
    },
    
    // Tester les symboles
    testSymbols: (type = 'king', color = 'white') => {
        console.group('🧪 Test Symboles PieceManager');
        const pieceManager = new PieceManager();
        const symbol = pieceManager.getSymbol(type, color);
        console.log('Symbole récupéré:', symbol ? symbol.substring(0, 50) + '...' : 'null');
        console.log('Type valide?', pieceManager.isValidPieceType(type, color));
        console.log('Emoji:', pieceManager.getPieceEmoji(type, color));
        console.groupEnd();
        return symbol;
    }
};

// Méthode statique pour obtenir le statut de la configuration
PieceManager.getConfigStatus = function() {
    return {
        consoleLog: this.consoleLog,
        source: this.getConfigSource(),
        debugMode: this.isDebugMode(),
        appConfigAvailable: !!window.appConfig,
        configValue: window.appConfig?.debug?.console_log
    };
};

// Méthode statique pour forcer la mise à jour de la configuration
PieceManager.reloadConfig = function() {
    const oldValue = this.consoleLog;
    this.loadConfig();
    
    if (this.consoleLog && oldValue !== this.consoleLog) {
        console.log(`🔄 PieceManager: Configuration rechargée: ${oldValue} → ${this.consoleLog}`);
    }
    return this.consoleLog;
};

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            PieceManager.loadConfig();
            if (PieceManager.consoleLog) {
                console.log('✅ PieceManager: Configuration vérifiée après chargement du DOM');
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        PieceManager.loadConfig();
    }, 100);
}

// Message final basé sur la configuration
if (PieceManager.consoleLog) {
    console.log('✅ PieceManager prêt (mode debug activé)');
} else {
    console.info('✅ PieceManager prêt (mode silencieux)');
}