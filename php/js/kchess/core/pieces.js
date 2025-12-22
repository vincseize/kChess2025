// core/pieces.js - VERSION OPTIMISÉE (LOGS ET GESTION DES ASSETS)
class PieceManager {
    
    static VERSION = '1.2.0';
    static consoleLog = true;
    
    /**
     * Initialisation statique : charge la config JSON prioritaire
     */
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log(`🎨 PieceManager v${this.VERSION} chargé (${this.getConfigSource()})`);
        }
    }
    
    static loadConfig() {
        try {
            const rawValue = window.appConfig?.debug?.console_log ?? 
                             (typeof window.getConfig === 'function' ? window.getConfig('debug.console_log') : true);
            
            // Conversion sécurisée (gère les strings "false" du JSON)
            this.consoleLog = rawValue === "false" ? false : Boolean(rawValue);
            return true;
        } catch (error) {
            console.error('❌ PieceManager Config Error:', error);
            this.consoleLog = true;
            return false;
        }
    }

    static getConfigSource() {
        if (window.appConfig?.debug?.console_log !== undefined) return 'JSON Config';
        return 'Default/Helper';
    }

    constructor() {
        this.constructor.loadConfig();
        
        // Définition des chemins d'images (centralisée pour maintenance facile)
        const basePath = 'img/chesspieces/wikipedia';
        
        this.pieceSymbols = {
            white: {
                king:   `<img src="${basePath}/wK.png" alt="wK" class="chess-piece-img">`,
                queen:  `<img src="${basePath}/wQ.png" alt="wQ" class="chess-piece-img">`,
                rook:   `<img src="${basePath}/wR.png" alt="wR" class="chess-piece-img">`,
                bishop: `<img src="${basePath}/wB.png" alt="wB" class="chess-piece-img">`,
                knight: `<img src="${basePath}/wN.png" alt="wN" class="chess-piece-img">`,
                pawn:   `<img src="${basePath}/wP.png" alt="wP" class="chess-piece-img">`
            },
            black: {
                king:   `<img src="${basePath}/bK.png" alt="bK" class="chess-piece-img">`,
                queen:  `<img src="${basePath}/bQ.png" alt="bQ" class="chess-piece-img">`,
                rook:   `<img src="${basePath}/bR.png" alt="bR" class="chess-piece-img">`,
                bishop: `<img src="${basePath}/bB.png" alt="bB" class="chess-piece-img">`,
                knight: `<img src="${basePath}/bN.png" alt="bN" class="chess-piece-img">`,
                pawn:   `<img src="${basePath}/bP.png" alt="bP" class="chess-piece-img">`
            }
        };

        if (this.constructor.consoleLog) {
            console.log('✅ [PieceManager] Dictionnaire des pièces initialisé');
        }
    }

    /**
     * Récupère le HTML de la pièce
     */
    getSymbol(type, color) {
        const symbol = this.pieceSymbols[color]?.[type];
        
        if (!symbol) {
            if (this.constructor.consoleLog) console.warn(`⚠️ [PieceManager] Symbole introuvable: ${type} ${color}`);
            return '';
        }
        return symbol;
    }

    /**
     * Génère la structure de données pour le placement initial (Style FEN)
     */
    getInitialPosition() {
        const position = {};

        // Remplissage automatique des rangées
        const setupRow = (row, color, isBackRow) => {
            if (isBackRow) {
                const pieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
                pieces.forEach((type, col) => position[`${row}-${col}`] = { type, color });
            } else {
                for (let col = 0; col < 8; col++) {
                    position[`${row}-${col}`] = { type: 'pawn', color };
                }
            }
        };

        setupRow(0, 'black', true);
        setupRow(1, 'black', false);
        setupRow(6, 'white', false);
        setupRow(7, 'white', true);

        if (this.constructor.consoleLog) {
            console.log('🎲 [PieceManager] Position initiale générée (32 pièces)');
        }
        return position;
    }

    /**
     * DIAGNOSTIC : Affiche l'échiquier en ASCII dans la console
     */
    debugDisplayAscii() {
        if (!this.constructor.consoleLog) return;

        const emojis = {
            king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: 'P'
        };
        const pos = this.getInitialPosition();
        
        console.group('📊 État Initial de l\'Échiquier');
        for (let r = 0; r < 8; r++) {
            let line = `${8 - r} | `;
            for (let c = 0; c < 8; c++) {
                const p = pos[`${r}-${c}`];
                if (p) {
                    const char = emojis[p.type];
                    line += (p.color === 'white' ? char : char.toLowerCase()) + ' ';
                } else {
                    line += '. ';
                }
            }
            console.log(line);
        }
        console.log('    ----------------');
        console.log('    a b c d e f g h');
        console.groupEnd();
    }
}

// Initialisation immédiate
PieceManager.init();

// Exposition globale
window.PieceManager = PieceManager;

/**
 * UTILS : Helpers pour la console
 */
window.PieceDebug = {
    testIcons: () => {
        const pm = new PieceManager();
        pm.debugDisplayAscii();
        console.log("Exemple de rendu Dame Blanche:", pm.getSymbol('queen', 'white'));
    },
    reload: () => PieceManager.init()
};