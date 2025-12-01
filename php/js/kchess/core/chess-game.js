// core/chess-game.js - Classe principale qui orchestre tout
class ChessGame {
    constructor() {
        this.pieceManager = new PieceManager();
        this.gameState = new GameState();
        this.board = new ChessBoard(this.gameState, this.pieceManager);
        this.moveValidator = new MoveValidator(this.board, this.gameState);
        
        // Utiliser ChessGameCore pour la logique principale
        this.core = new ChessGameCore(this.board, this.gameState, this.moveValidator);
        
        console.log('♟️ ChessGame initialized with modular core');
        
        this.init();
    }
    
    init() {
        this.loadInitialPosition();
        this.applyUrlParamsConfiguration();
        
        // CORRECTION : Ne pas appeler initNotificationStyles() car elle est gérée automatiquement
        // par ChessStyleManager dans le constructeur de ChessGameUI
        if (this.core.ui && typeof this.core.ui.setupEventListeners === 'function') {
            this.core.ui.setupEventListeners();
        }
        
        if (this.core.ui && typeof this.core.ui.updateUI === 'function') {
            this.core.ui.updateUI();
        }
    }

    // Méthodes déléguées vers le core
    handleSquareClick = (displayRow, displayCol) => this.core.handleSquareClick(displayRow, displayCol);
    highlightPossibleMoves = () => this.core.highlightPossibleMoves();
    clearSelection = () => this.core.clearSelection();
    updateUI = () => this.core.updateUI();

    loadInitialPosition() {
        this.board.createBoard();
        const initialPosition = this.pieceManager.getInitialPosition();
        Object.keys(initialPosition).forEach(key => {
            const [row, col] = key.split('-').map(Number);
            const square = this.board.getSquare(row, col);
            if (square) {
                this.board.placePiece(initialPosition[key], square);
            }
        });
    }

    // Appliquer la configuration depuis les paramètres URL
    // chess-game.js - dans la classe ChessGame
applyUrlParamsConfiguration() {
    const urlParams = this.getUrlParams();
    console.log('Paramètres URL détectés:', urlParams);
    
    // --- GESTION DU FLIP AUTOMATIQUE ---
    const wantsBlackStart = urlParams.color === 'black';
    const wantsWhiteStart = urlParams.color === 'white';
    
    console.log(`🎯 Configuration couleur: ${urlParams.color}, Flip actuel: ${this.gameState.boardFlipped}`);
    
    // Appliquer le flip immédiatement si nécessaire
    if (wantsBlackStart && !this.gameState.boardFlipped) {
        console.log('🔀 Application du flip automatique pour color=black');
        this.core.flipBoard(); // Flip l'échiquier via le core
        
        // Ne pas appeler flipPlayerSections() ici - il sera géré par ChessGameCore
    }
    
    // Si white est demandé mais que le board est flipé, le remettre à l'endroit
    if (wantsWhiteStart && this.gameState.boardFlipped) {
        console.log('🔀 Retour à l\'endroit pour color=white');
        this.core.flipBoard();
    }
    
    // --- BOT ---
    const shouldActivateBot =
        urlParams.bot === '1' ||
        urlParams.bot === 'true' ||
        urlParams.mode === 'bot' ||
        urlParams.level === '0';
    
    if (shouldActivateBot) {
        console.log('🤖 Bot activé via URL');
        const botColor = urlParams.color === 'white' ? 'black' : 'white';
        this.core.setBotLevel(1, botColor);
    }
    
    // --- MODE ---
    if (urlParams.mode) {
        console.log('Mode de jeu :', urlParams.mode);
        this.gameMode = urlParams.mode;
    }
}


// applyAutoFlip(shouldFlipSections = false) {
//     console.log('Application du flip automatique');
    
//     this.gameState.boardFlipped = !this.gameState.boardFlipped;

//     // Reconstruction du plateau (DOM)
//     this.board.createBoard();
//     this.loadInitialPosition();
//     this.clearSelection();

//     // 🚀 ICI le DOM est prêt → maintenant on peut flipper les sections
//     if (shouldFlipSections && window.flipPlayerSections) {
//         console.log("Flip des sections joueurs (post-createBoard)");
//         window.flipPlayerSections();
//     }
// }


applyAutoFlip() {
    console.log("Application du flip automatique (simulation bouton flip)");

    // 🔵 1 — Si la fonction externe existe, on l’utilise
    if (typeof window.flipBoard === "function") {
        console.log("↪️ flip externe trouvé → appel direct");
        window.flipBoard();
        return;
    }

    // 🔵 2 — Sinon on flip via le Core interne
    // if (this.core && typeof this.core.flipBoard === "function") {
    //     console.log("↪️ flip interne via ChessGameCore");
    //     this.core.flipBoard();
    // } else {
    //     console.error("❌ flipBoard interne non disponible");
    // }
}



    getUrlParams() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        
        for (let [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        
        return params;
    }

    flipBoard() {
        this.core.flipBoard();
    }

    newGame() {
        this.core.newGame();
        // Réappliquer la configuration URL pour le flip
        this.applyUrlParamsConfiguration();
    }

    clearMoveHistory() {
        this.gameState.moveHistory = [];
        this.core.ui.updateMoveHistory();
    }

    // Délégation des méthodes bot
    setBotLevel(level, color = 'black') {
        return this.core.setBotLevel(level, color);
    }

    getBotStatus() {
        return this.core.getBotStatus();
    }

    setBotColor(color) {
        this.core.setBotColor(color);
    }

    playBotMove() {
        return this.core.playBotMove();
    }
    
    handleMove(fromRow, fromCol, toRow, toCol) {
        return this.core.handleMove(fromRow, fromCol, toRow, toCol);
    }

    // Méthodes utilitaires pour le debug
    getGameState() {
        return {
            gameActive: this.gameState.gameActive,
            currentPlayer: this.gameState.currentPlayer,
            boardFlipped: this.gameState.boardFlipped,
            halfMoveClock: this.gameState.halfMoveClock,
            moveHistory: this.gameState.moveHistory.length
        };
    }

    // Méthode pour forcer le tour du bot (debug)
    forceBotTurn() {
        console.log('🤖 Forçage du tour du bot');
        if (this.core.botManager.isBotTurn()) {
            this.core.botManager.playBotMove();
        } else {
            console.log('🤖 Pas le tour du bot actuellement');
            const status = this.getBotStatus();
            console.log('Statut bot:', status);
        }
    }

    // Méthode pour tester le bot manuellement
    testBot() {
        console.log('🧪 Test manuel du bot');
        const botStatus = this.getBotStatus();
        console.log('Statut bot:', botStatus);
        
        if (botStatus.active) {
            console.log('🤖 Bot actif, niveau:', botStatus.level);
            console.log('🤖 Bot couleur:', botStatus.color);
            console.log('🤖 En réflexion:', botStatus.thinking);
            
            // Tester la génération de coup
            const currentFEN = FENGenerator.generateFEN(this.gameState, this.board);
            console.log('🎯 FEN actuel:', currentFEN);
            
            if (this.core.botManager.bot && this.core.botManager.bot.getMove) {
                const testMove = this.core.botManager.bot.getMove(currentFEN);
                console.log('🎯 Coup test du bot:', testMove);
            }
        } else {
            console.log('❌ Bot non activé');
        }
    }
}

window.ChessGame = ChessGame;

// Interface de debug globale
window.chessDebug = {
    // Informations du jeu
    gameInfo: () => {
        if (!window.chessGame) {
            console.log('❌ Aucun jeu initialisé');
            return null;
        }
        return {
            game: window.chessGame,
            gameState: window.chessGame.getGameState(),
            botStatus: window.chessGame.getBotStatus(),
            core: window.chessGame.core
        };
    },
    
    // Contrôle du bot
    activateBot: (level = 1, color = 'black') => {
        if (window.chessGame) {
            console.log(`🤖 Activation bot niveau ${level}, couleur ${color}`);
            return window.chessGame.setBotLevel(level, color);
        }
        console.log('❌ Jeu non initialisé');
        return null;
    },
    
    // Test du bot
    testBot: () => {
        if (window.chessGame) {
            window.chessGame.testBot();
        } else {
            console.log('❌ Jeu non initialisé');
        }
    },
    
    // Forcer un coup du bot
    forceBotMove: () => {
        if (window.chessGame) {
            window.chessGame.forceBotTurn();
        } else {
            console.log('❌ Jeu non initialisé');
        }
    },
    
    // Statut complet
    status: () => {
        if (!window.chessGame) {
            console.log('❌ Aucun jeu initialisé');
            return;
        }
        
        console.group('🎮 STATUT COMPLET DU JEU');
        console.log('♟️ État du jeu:', window.chessGame.getGameState());
        console.log('🤖 Statut bot:', window.chessGame.getBotStatus());
        console.log('🔄 Tour actuel:', window.chessGame.gameState.currentPlayer);
        console.log('🎯 FEN actuel:', FENGenerator.generateFEN(window.chessGame.gameState, window.chessGame.board));
        console.groupEnd();
    },
    
    // Réinitialisation
    resetGame: () => {
        if (window.chessGame) {
            console.log('🔄 Réinitialisation du jeu');
            window.chessGame.newGame();
        } else {
            console.log('❌ Jeu non initialisé');
        }
    },
    
    // Flip du plateau
    flipBoard: () => {
        if (window.chessGame) {
            console.log('🔄 Flip du plateau');
            window.chessGame.flipBoard();
        } else {
            console.log('❌ Jeu non initialisé');
        }
    }
};

// Message d'aide pour la console
console.log(`
🎮 COMMANDES DEBUG DISPONIBLES:

• chessDebug.status()       - Statut complet du jeu
• chessDebug.activateBot()  - Activer le bot
• chessDebug.testBot()      - Tester le bot
• chessDebug.forceBotMove() - Forcer un coup du bot
• chessDebug.resetGame()    - Nouvelle partie
• chessDebug.flipBoard()    - Flip du plateau

• window.chessGame          - Accès direct au jeu
`);