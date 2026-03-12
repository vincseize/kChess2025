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
            
            // Initialisation du jeu
            this.initGame();

        } catch (error) {
            console.error("❌ Échec critique de l'initialisation ChessGame:", error.message);
        }
    }
    
    /**
     * Initialisation du cycle de vie du jeu
     */
    initGame() {
        const debug = this.constructor.consoleLog;
        
        // 1. Placement des pièces initiales
        this.loadInitialPosition();
        
        // 2. Configuration via URL (Bot, Couleur, etc.)
        // On le fait avant l'UI pour que le premier rendu soit correct
        this.applyUrlParamsConfiguration();
        
        // 3. Liaison UI et Event Listeners
        if (this.core && this.core.ui) {
            if (typeof this.core.ui.setupEventListeners === 'function') {
                this.core.ui.setupEventListeners();
            }
            if (typeof this.core.ui.updateUI === 'function') {
                this.core.ui.updateUI();
            }
        }
        
        if (debug) console.log('🚀 ChessGame: Système opérationnel');

        // 4. Vérification si le bot doit jouer (si bot est blanc)
        this.checkInitialBotMove();
    }

    // --- MÉTHODES DE JEU ---

    newGame() {
        if (this.constructor.consoleLog) console.log('🆕 Reset de la partie...');

        if (this.core.botManager) {
            this.core.botManager.stopThinking?.(); 
        }

        // Reset de l'état logique
        this.gameState.reset(); 
        
        // Notification au core
        this.core.newGame();
        
        // Reconstruction visuelle
        this.loadInitialPosition();
        
        // Ré-appliquer la config URL sans forcer le flip si déjà fait
        this.applyUrlParamsConfiguration();
        
        this.checkInitialBotMove();
    }

    handleSquareClick = (r, c) => this.core.handleSquareClick(r, c);
    
    /**
     * Bascule l'affichage de l'échiquier
     */
    flipBoard() {
        if (this.core && typeof this.core.flipBoard === 'function') {
            this.core.flipBoard();
        }
    }

    // --- GESTION DU BOT ---

    setBotLevel(level, color = 'black') {
        if (this.core && typeof this.core.setBotLevel === 'function') {
            return this.core.setBotLevel(level, color);
        } else {
            console.error("❌ Impossible de configurer le bot : méthode manquante sur le Core");
            return false;
        }
    }

    checkInitialBotMove() {
        const botStatus = this.getBotStatus();
        if (botStatus.active && botStatus.color === this.gameState.currentPlayer) {
            if (this.constructor.consoleLog) console.log("🤖 Le Bot commence la partie...");
            setTimeout(() => {
                if(this.core.playBotMove) this.core.playBotMove();
            }, 500);
        }
    }

    // --- UTILITAIRES DE CHARGEMENT ---

    loadInitialPosition() {
        // Crée le plateau s'il est vide
        if (!this.board.squares || this.board.squares.length === 0) {
            this.board.createBoard();
        }
        
        const pos = this.pieceManager.getInitialPosition();
        
        // Nettoyage sécurisé
        if (typeof this.board.clearBoard === 'function') {
            this.board.clearBoard();
        }
        
        // Placement des pièces selon la config initiale
        Object.keys(pos).forEach(key => {
            const [r, c] = key.split('-').map(Number);
            const sq = this.board.getSquare(r, c);
            if (sq) this.board.placePiece(pos[key], sq);
        });
    }

    /**
     * Analyse l'URL pour configurer la partie (Mode Bot, Niveau, Rotation)
     */
applyUrlParamsConfiguration() {
    const params = this.getUrlParams();
    
    // On ne traite l'URL que si le plateau n'a pas encore été manipulé manuellement
    if (params.color === 'black' && !this.gameState.boardFlipped) {
        this.flipBoard();
        return; 
    }

    // Si l'URL dit 'white' mais qu'on est déjà flipped, on NE FAIT RIEN.
    if (params.color === 'white' && this.gameState.boardFlipped) {
        return;
    }

    // ... reste du code pour le bot ...
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
        return (this.core && this.core.getFEN) ? this.core.getFEN() : "";
    }
}

// Initialisation globale
window.ChessGame = ChessGame;