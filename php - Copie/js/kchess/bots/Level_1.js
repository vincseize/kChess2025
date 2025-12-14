// bots/Level_1.js - Bot Random Move avec support JSON + traductions
class Level_1 {

    static consoleLog = true; // valeur par défaut
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('🤖 bots/Level_1.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        }
    }

    static loadConfig() {
        try {
            if (window.appConfig && window.appConfig.debug) {
                const cfg = window.appConfig.debug.console_log;
                // conversion stricte
                this.consoleLog = (cfg === true || cfg === "true");
                return true;
            }
            if (typeof window.getConfig === 'function') {
                const cfg = window.getConfig('debug.console_log', 'true');
                this.consoleLog = (cfg === true || cfg === "true");
                return true;
            }
            return true; // défaut
        } catch(e) {
            console.error('❌ Level_1: erreur loadConfig', e);
            return false;
        }
    }

    static getConfigSource() {
        if (window.appConfig) return 'JSON config';
        if (typeof window.getConfig === 'function') return 'fonction getConfig';
        return 'valeur par défaut';
    }

    static isDebugMode() { return this.consoleLog; }

    constructor() {
        this.name = "Bot Level 1";
        this.level = 1;

        // Vérifier config
        this.constructor.loadConfig();

        if (this.constructor.consoleLog) {
            console.log(`🤖 [Level_1] Bot Level 1 initialisé`);
        }
    }

    getMove(fen) {
        // Debug log
        if (this.constructor.consoleLog) {
            console.log(`🎲 [Level_1] Calcul du coup pour FEN: ${fen}`);
        }

        const game = window.chessGame;
        if (!game || !game.core || !game.core.moveValidator) return null;

        const validMoves = [];
        const currentPlayer = game.gameState.currentPlayer;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const square = game.board.getSquare(r,c);
                if (square && square.piece && square.piece.color === currentPlayer) {
                    const moves = game.core.moveValidator.getPossibleMoves(square.piece,r,c);
                    moves.forEach(mv => validMoves.push({fromRow:r,fromCol:c,toRow:mv.row,toCol:mv.col,piece:square.piece}));
                }
            }
        }

        if (validMoves.length === 0) return null;

        const idx = Math.floor(Math.random() * validMoves.length);
        const move = validMoves[idx];

        if (this.constructor.consoleLog) {
            const t = window.appTranslations;
            const playerText = currentPlayer === 'white' ? t.traitAuBlancs : t.traitAuxNoirs;
            console.log(`📊 [Level_1] Joueur: ${playerText}, coups valides: ${validMoves.length}, coup choisi: [${move.fromRow},${move.fromCol}]→[${move.toRow},${move.toCol}]`);
        }

        return move;
    }

    getStatus() {
        return {
            name: this.name,
            level: this.level,
            type: "Random Move Bot",
            description: "Effectue des coups aléatoires parmi les mouvements légaux",
            config: {
                console_log: this.constructor.consoleLog,
                source: this.constructor.getConfigSource(),
                app_config_available: !!window.appConfig
            }
        };
    }

    simulateMove(fromRow, fromCol, toRow, toCol) {
        const game = window.chessGame;
        if (!game) return false;
        const square = game.board.getSquare(fromRow,fromCol);
        if (!square || !square.piece) return false;
        const moves = game.core.moveValidator.getPossibleMoves(square.piece, fromRow, fromCol);
        return moves.some(mv => mv.row===toRow && mv.col===toCol);
    }

    static reloadConfig() {
        const old = this.consoleLog;
        this.loadConfig();
        if (this.consoleLog && old!==this.consoleLog) {
            console.log(`🔄 Level_1: config rechargée ${old}→${this.consoleLog}`);
        }
        return this.consoleLog;
    }

    static testConfig() {
        console.group('🧪 Test Level_1');
        console.log('consoleLog:', this.consoleLog);
        console.log('Source:', this.getConfigSource());
        console.log('window.appConfig:', !!window.appConfig);
        console.log('JSON debug.console_log:', window.appConfig?.debug?.console_log);
        console.log('Mode debug activé:', this.isDebugMode());
        console.groupEnd();
        return this.consoleLog;
    }
}

// Init statique
Level_1.init();
window.Level_1 = Level_1;

// Utilitaires globaux
window.Level1Utils = {
    reloadConfig: () => Level_1.reloadConfig(),
    testConfig: () => Level_1.testConfig(),
    getState: () => ({
        consoleLog: Level_1.consoleLog,
        source: Level_1.getConfigSource(),
        debugMode: Level_1.isDebugMode(),
        configValue: window.appConfig?.debug?.console_log
    }),
    setConsoleLog: v => {
        const old = Level_1.consoleLog;
        Level_1.consoleLog = Boolean(v);
        console.log(`🔧 Level_1: consoleLog ${old}→${Level_1.consoleLog}`);
        return Level_1.consoleLog;
    },
    checkJSONConfig: () => window.appConfig ? { exists:true, debug:window.appConfig.debug, value:window.appConfig.debug?.console_log } : {exists:false}
};
