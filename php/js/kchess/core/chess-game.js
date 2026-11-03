// core/chess-game.js
class ChessGame {
    
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('♟️ core/chess-game.js chargé');
        }
    }
    
    static loadConfig() {
        try {
            if (window.appConfig && window.appConfig.debug) {
                const val = window.appConfig.debug.console_log;
                this.consoleLog = (val === "true" || val === true);
                return true;
            }
        } catch (e) { return false; }
        return false;
    }

    constructor() {
        this.constructor.loadConfig();
        const debug = this.constructor.consoleLog;

        if (debug) console.log('\n🎮 [ChessGame] Assemblage du moteur...');

        try {
            // 1. Initialisation des composants (SÉCURISÉE)
            this.pieceManager = new PieceManager();
            this.gameState = new GameState();
            this.board = new ChessBoard(this.gameState, this.pieceManager);
            
            // On s'assure que MoveValidator est bien chargé
            if (typeof MoveValidator === 'undefined') throw new Error("MoveValidator manquant");
            this.moveValidator = new MoveValidator(this.board, this.gameState);
            
            // 2. Initialisation du Coeur (Chef d'orchestre)
            this.core = new ChessGameCore(this.board, this.gameState, this.moveValidator);
            
            if (debug) console.log('✅ Architecture Core validée');
            this.init();

        } catch (error) {
            console.error("❌ Échec critique de l'initialisation ChessGame:", error.message);
        }
    }
    
    init() {
        const debug = this.constructor.consoleLog;
        
        // Placement des pièces
        this.loadInitialPosition();
        
        // Configuration via URL (Bot, Couleur, etc.)
        this.applyUrlParamsConfiguration();
        
        // Liaison UI
        if (this.core.ui) {
            if (typeof this.core.ui.setupEventListeners === 'function') {
                this.core.ui.setupEventListeners();
            }
            if (typeof this.core.ui.updateUI === 'function') {
                this.core.ui.updateUI();
            }
        }
        
        if (debug) console.log('🚀 ChessGame: Système opérationnel');

        // SÉCURITÉ : Si le bot doit commencer (cas où le bot est blanc)
        this.checkInitialBotMove();
    }

    // --- MÉTHODES DE JEU ---

    newGame() {
        if (this.constructor.consoleLog) console.log('🆕 Reset de la partie...');

        if (this.core.botManager) {
            this.core.botManager.stopThinking?.(); 
        }

        this.gameState.reset(); // Assurez-vous que GameState a une méthode reset
        this.core.newGame();
        this.loadInitialPosition();
        this.applyUrlParamsConfiguration();
        
        this.checkInitialBotMove();
    }

    handleSquareClick = (r, c) => this.core.handleSquareClick(r, c);
    
    flipBoard() {
        this.core.flipBoard();
    }

    // --- GESTION DU BOT ---

// Dans core/chess-game.js
setBotLevel(level, color = 'black') {
    if (this.core && typeof this.core.setBotLevel === 'function') {
        return this.core.setBotLevel(level, color);
    } else {
        console.error("❌ Impossible de configurer le bot : méthode manquante sur le Core");
        return false;
    }
}

    /**
     * Vérifie si c'est au tour du bot dès le début (ex: Bot joue les Blancs)
     */
    checkInitialBotMove() {
        const botStatus = this.getBotStatus();
        if (botStatus.active && botStatus.color === this.gameState.currentPlayer) {
            if (this.constructor.consoleLog) console.log("🤖 Le Bot commence la partie...");
            setTimeout(() => this.core.playBotMove(), 500);
        }
    }

    // --- UTILITAIRES DE CHARGEMENT ---

    loadInitialPosition() {
        // On ne recrée le plateau que si nécessaire pour éviter les fuites mémoire DOM
        if (this.board.squares?.length === 0) {
            this.board.createBoard();
        }
        
        const chess960 = new URLSearchParams(window.location.search).get('variant') === 'chess960';
        this.gameState.chess960 = chess960;
        const pos = this.pieceManager.getInitialPosition(chess960);
        if (chess960 && this.pieceManager.lastChess960Layout) {
            const { kingCol, rookCols } = this.pieceManager.lastChess960Layout;
            this.gameState.kingStartCols = { white: kingCol, black: kingCol };
            this.gameState.rookStartCols = {
                white: { queenside: rookCols[0], kingside: rookCols[1] },
                black: { queenside: rookCols[0], kingside: rookCols[1] }
            };
        } else {
            this.gameState.kingStartCols = { white: 4, black: 4 };
            this.gameState.rookStartCols = {
                white: { kingside: 7, queenside: 0 },
                black: { kingside: 7, queenside: 0 }
            };
        }
        this.board.clearBoard?.(); // Optionnel : vider le plateau avant de poser
        
        Object.keys(pos).forEach(key => {
            const [r, c] = key.split('-').map(Number);
            const sq = this.board.getSquare(r, c);
            if (sq) this.board.placePiece(pos[key], sq);
        });
    }

    applyUrlParamsConfiguration() {
        const params = this.getUrlParams();
        
        if (params.color === 'black' && !this.gameState.boardFlipped) {
            this.flipBoard(); // Utilise la méthode du Core pour rester synchronisé
        }

        if (params.mode === 'bot') {
            const level = parseInt(params.level) || 1;
            const humanColor = params.color || 'white';
            const botColor = (humanColor === 'white') ? 'black' : 'white';
            this.setBotLevel(level, botColor);
        }
    }

    getUrlParams() {
        const params = {};
        new URLSearchParams(window.location.search).forEach((v, k) => params[k] = v);
        return params;
    }

    getBotStatus() {
        if (this.core && this.core.botManager) {
            return {
                active: this.core.botManager.isActive,
                color: this.core.botManager.botColor
            };  
        }
        return { active: false };
    }

    getFEN() {
        if (window.FENGenerator) {
            return window.FENGenerator.generate(this.board, this.gameState);
        }
        return this.core.getFEN ? this.core.getFEN() : "";
    }
}
