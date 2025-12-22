// core/chess-game.js - Version avec logs essentiels et priorité Config JSON
class ChessGame {
    
    static consoleLog = true; // Par défaut
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('♟️ core/chess-game.js chargé');
        } else {
            console.info('♟️ ChessGame: Mode silencieux activé');
        }
    }
    
    static loadConfig() {
        try {
            if (window.appConfig && window.appConfig.debug) {
                const val = window.appConfig.debug.console_log;
                this.consoleLog = (val === "true" || val === true);
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    constructor() {
        // Mise à jour de la config avant instanciation
        this.constructor.loadConfig();
        const debug = this.constructor.consoleLog;

        if (debug) console.log('\n🎮 [ChessGame] Initialisation du moteur...');

        // 1. Initialisation des composants atomiques
        this.pieceManager = new PieceManager();
        this.gameState = new GameState();
        this.board = new ChessBoard(this.gameState, this.pieceManager);
        this.moveValidator = new MoveValidator(this.board, this.gameState);
        
        // 2. Initialisation du Coeur (Chef d'orchestre logique)
        this.core = new ChessGameCore(this.board, this.gameState, this.moveValidator);
        
        if (debug) console.log('✅ Composants Core Chess initialisés');

        this.init();
    }
    
    init() {
        const debug = this.constructor.consoleLog;
        
        // Placement des pièces
        this.loadInitialPosition();
        
        // Configuration via URL (Bot, Couleur, etc.)
        this.applyUrlParamsConfiguration();
        
        // Liaison UI et Evénements via le Core
        if (this.core.ui) {
            if (typeof this.core.ui.setupEventListeners === 'function') {
                this.core.ui.setupEventListeners();
            }
            if (typeof this.core.ui.updateUI === 'function') {
                this.core.ui.updateUI();
            }
        }
        
        if (debug) console.log('🚀 ChessGame: Prêt à jouer.\n');
    }

    // --- MÉTHODES DE JEU (Délégation au Core) ---

    newGame() {
        const debug = this.constructor.consoleLog;
        if (debug) console.log('🆕 ChessGame: Lancement d\'une nouvelle partie');

        // Reset du Core
        this.core.newGame();
        
        // SÉCURITÉ : Reset explicite du BotManager pour éviter les blocages de tour
        if (this.core.botManager) {
            this.core.botManager.stopThinking?.(); 
        }

        // Ré-application des paramètres (Bot ou Humain)
        this.applyUrlParamsConfiguration();
        
        if (debug) console.log('✅ Nouvelle partie initialisée');
    }

    handleSquareClick = (r, c) => this.core.handleSquareClick(r, c);
    
    flipBoard() {
        if (this.constructor.consoleLog) console.log('🔄 ChessGame: Retournement du plateau');
        this.core.flipBoard();
    }

    // --- GESTION DU BOT ---

    setBotLevel(level, color = 'black') {
        if (this.constructor.consoleLog) {
            console.log(`🤖 ChessGame: Configuration Bot Lvl:${level} Color:${color}`);
        }
        return this.core.setBotLevel(level, color);
    }

    playBotMove() {
        return this.core.playBotMove();
    }

    // --- UTILITAIRES DE CHARGEMENT ---

    loadInitialPosition() {
        this.board.createBoard();
        const pos = this.pieceManager.getInitialPosition();
        
        Object.keys(pos).forEach(key => {
            const [r, c] = key.split('-').map(Number);
            const sq = this.board.getSquare(r, c);
            if (sq) this.board.placePiece(pos[key], sq);
        });
        
        if (this.constructor.consoleLog) console.log(`🎨 Position initiale chargée`);
    }

    applyUrlParamsConfiguration() {
        const params = this.getUrlParams();
        
        // 1. Gestion de la couleur (Flip)
        if (params.color === 'black' && !this.gameState.boardFlipped) {
            this.applyAutoFlip();
        }

        // 2. Gestion du Bot
        if (params.mode === 'bot') {
            const level = parseInt(params.level) || 1;
            const humanColor = params.color || 'white';
            const botColor = (humanColor === 'white') ? 'black' : 'white';
            this.setBotLevel(level, botColor);
        }
    }

    applyAutoFlip() {
        this.gameState.boardFlipped = !this.gameState.boardFlipped;
        this.board.createBoard();
        this.loadInitialPosition();
        this.core.clearSelection();
    }

    getUrlParams() {
        const params = {};
        new URLSearchParams(window.location.search).forEach((v, k) => params[k] = v);
        return params;
    }

    getGameState() {
        return {
            active: this.gameState.gameActive,
            turn: this.gameState.currentPlayer,
            history: this.gameState.moveHistory.length
        };
    }
    
    getBotStatus() {
        return this.core.getBotStatus ? this.core.getBotStatus() : { active: false };
    }

// --- ACCÈS AUX DONNÉES DE JEU ---

    getFEN() {
        // On délègue au générateur de FEN en utilisant l'état actuel
        if (window.FENGenerator) {
            return window.FENGenerator.generate(this.board, this.gameState);
        }
        
        // Fallback si FENGenerator n'est pas global (dépend de votre architecture)
        if (this.core && typeof this.core.getFEN === 'function') {
            return this.core.getFEN();
        }

        console.error('❌ FENGenerator non trouvé. Impossible de récupérer le FEN.');
        return "";
    }


}

// Initialisation au chargement
ChessGame.init();
window.ChessGame = ChessGame;