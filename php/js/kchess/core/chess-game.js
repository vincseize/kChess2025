// core/chess-game.js - Classe principale qui orchestre tout
class ChessGame {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('core/chess-game.js loaded');
        }
    }

    constructor() {
        if (this.constructor.consoleLog) {
            console.log('\n🎮 [ChessGame] === INITIALISATION DU JEU ===');
            console.log('🎮 [ChessGame] Création des composants de base...');
        }
        
        this.pieceManager = new PieceManager();
        this.gameState = new GameState();
        this.board = new ChessBoard(this.gameState, this.pieceManager);
        this.moveValidator = new MoveValidator(this.board, this.gameState);
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ChessGame] Composants créés:');
            console.log('   • PieceManager:', this.pieceManager);
            console.log('   • GameState:', this.gameState);
            console.log('   • ChessBoard:', this.board);
            console.log('   • MoveValidator:', this.moveValidator);
        }
        
        // Utiliser ChessGameCore pour la logique principale
        if (this.constructor.consoleLog) {
            console.log('🎮 [ChessGame] Création du moteur de jeu principal...');
        }
        this.core = new ChessGameCore(this.board, this.gameState, this.moveValidator);
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ChessGame] ChessGameCore initialisé:', this.core);
            console.log('✅ [ChessGame] === INITIALISATION TERMINÉE ===\n');
        }
        
        this.init();
    }
    
    init() {
        if (this.constructor.consoleLog) {
            console.log('\n⚙️ [ChessGame] === CONFIGURATION INITIALE ===');
        }
        
        this.loadInitialPosition();
        this.applyUrlParamsConfiguration();
        
        // CORRECTION : Ne pas appeler initNotificationStyles() car elle est gérée automatiquement
        // par ChessStyleManager dans le constructeur de ChessGameUI
        if (this.core.ui && typeof this.core.ui.setupEventListeners === 'function') {
            if (this.constructor.consoleLog) {
                console.log('⚙️ [ChessGame] Configuration des écouteurs d\'événements...');
            }
            this.core.ui.setupEventListeners();
        }
        
        if (this.core.ui && typeof this.core.ui.updateUI === 'function') {
            if (this.constructor.consoleLog) {
                console.log('⚙️ [ChessGame] Mise à jour initiale de l\'UI...');
            }
            this.core.ui.updateUI();
        }
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ChessGame] === CONFIGURATION TERMINÉE ===\n');
        }
    }

    // Méthodes déléguées vers le core
    handleSquareClick = (displayRow, displayCol) => this.core.handleSquareClick(displayRow, displayCol);
    highlightPossibleMoves = () => this.core.highlightPossibleMoves();
    clearSelection = () => this.core.clearSelection();
    updateUI = () => this.core.updateUI();

    loadInitialPosition() {
        if (this.constructor.consoleLog) {
            console.log('🎨 [ChessGame] Chargement de la position initiale...');
        }
        
        this.board.createBoard();
        const initialPosition = this.pieceManager.getInitialPosition();
        
        if (this.constructor.consoleLog) {
            console.log(`🎨 [ChessGame] ${Object.keys(initialPosition).length} pièce(s) à placer`);
        }
        
        let piecesPlaced = 0;
        Object.keys(initialPosition).forEach(key => {
            const [row, col] = key.split('-').map(Number);
            const square = this.board.getSquare(row, col);
            if (square) {
                this.board.placePiece(initialPosition[key], square);
                piecesPlaced++;
            }
        });
        
        if (this.constructor.consoleLog) {
            console.log(`✅ [ChessGame] ${piecesPlaced} pièce(s) placée(s) sur le plateau`);
        }
    }

    // Appliquer la configuration depuis les paramètres URL
    applyUrlParamsConfiguration() {
        const urlParams = this.getUrlParams();
        
        if (this.constructor.consoleLog) {
            console.log('\n🌐 [ChessGame] === CONFIGURATION PAR URL ===');
            console.log('🌐 [ChessGame] Paramètres URL détectés:', urlParams);
        }
        
        if (Object.keys(urlParams).length === 0) {
            if (this.constructor.consoleLog) {
                console.log('ℹ️ [ChessGame] Aucun paramètre URL détecté');
                console.log('🌐 [ChessGame] === FIN CONFIGURATION URL ===\n');
            }
            return;
        }
        
        // Configuration du flip basée sur le paramètre color
        if (urlParams.color === 'black' && !this.gameState.boardFlipped) {
            if (this.constructor.consoleLog) {
                console.log('🔄 [ChessGame] Configuration URL: color=black, application du flip automatique');
            }
            this.applyAutoFlip();
        } else if (urlParams.color === 'white' && this.gameState.boardFlipped) {
            if (this.constructor.consoleLog) {
                console.log('🔄 [ChessGame] Configuration URL: color=white, désactivation du flip');
            }
            this.applyAutoFlip();
        } else if (urlParams.color) {
            if (this.constructor.consoleLog) {
                console.log(`✅ [ChessGame] Configuration couleur OK: ${urlParams.color}`);
            }
        }
        
        // Configuration du bot selon les nouveaux niveaux
        // mode=bot, level=0 (désactivé), level=1 (Level_0), level=2 (Level_1)
        if (urlParams.mode === 'bot') {
            if (this.constructor.consoleLog) {
                console.log('🤖 [ChessGame] Configuration URL: bot activé');
            }
            
            // Récupérer le niveau du bot (0, 1 ou 2)
            const botLevel = parseInt(urlParams.level) || 1;
            
            // Déterminer la couleur du bot (opposée à celle du joueur)
            const humanColor = urlParams.color || 'white';
            const botColor = humanColor === 'white' ? 'black' : 'white';
            
            if (this.constructor.consoleLog) {
                console.log(`🤖 [ChessGame] Configuration bot:`);
                console.log(`   • Niveau: ${botLevel} (0=désactivé, 1=Aléatoire, 2=CCMO)`);
                console.log(`   • Couleur bot: ${botColor}`);
                console.log(`   • Couleur joueur: ${humanColor}`);
                console.log(`🤖 [ChessGame] Activation du bot...`);
            }
            
            // Activer le bot avec le bon niveau
            this.core.setBotLevel(botLevel, botColor);
        }
        
        if (urlParams.mode) {
            this.gameMode = urlParams.mode;
            if (this.constructor.consoleLog) {
                console.log(`🎮 [ChessGame] Mode de jeu: ${urlParams.mode === 'bot' ? 'Bot' : 'Humain vs Humain'}`);
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ChessGame] === CONFIGURATION URL APPLIQUÉE ===\n');
        }
    }

    applyAutoFlip() {
        if (this.constructor.consoleLog) {
            console.log('🔄 [ChessGame] Application du flip automatique');
            console.log(`   • Ancien état: ${this.gameState.boardFlipped ? 'retourné' : 'normal'}`);
        }
        
        this.gameState.boardFlipped = !this.gameState.boardFlipped;
        this.board.createBoard();
        this.loadInitialPosition();
        this.clearSelection();
        
        if (this.constructor.consoleLog) {
            console.log(`   • Nouvel état: ${this.gameState.boardFlipped ? 'retourné' : 'normal'}`);
            console.log('✅ [ChessGame] Flip automatique appliqué');
        }
    }

    getUrlParams() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        
        for (let [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        
        if (this.constructor.consoleLog && Object.keys(params).length > 0) {
            console.log('🔗 [ChessGame] Paramètres URL extraits:', params);
        }
        
        return params;
    }

    flipBoard() {
        if (this.constructor.consoleLog) {
            console.log('🔄 [ChessGame] Délégation de flipBoard() au core');
        }
        this.core.flipBoard();
    }

    newGame() {
        if (this.constructor.consoleLog) {
            console.log('\n🆕 [ChessGame] === NOUVELLE PARTIE ===');
            console.log('🆕 [ChessGame] Lancement d\'une nouvelle partie...');
        }
        
        this.core.newGame();
        // Réappliquer la configuration URL pour le flip
        this.applyUrlParamsConfiguration();
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ChessGame] === NOUVELLE PARTIE PRÊTE ===\n');
        }
    }

    clearMoveHistory() {
        if (this.constructor.consoleLog) {
            console.log('🧹 [ChessGame] Effacement de l\'historique des coups');
            console.log(`   • Avant: ${this.gameState.moveHistory.length} coup(s)`);
        }
        
        this.gameState.moveHistory = [];
        this.core.ui.updateMoveHistory();
        
        if (this.constructor.consoleLog) {
            console.log(`   • Après: ${this.gameState.moveHistory.length} coup(s)`);
            console.log('✅ [ChessGame] Historique effacé');
        }
    }

    // Délégation des méthodes bot
    setBotLevel(level, color = 'black') {
        if (this.constructor.consoleLog) {
            console.log('🤖 [ChessGame] Délégation setBotLevel au core');
        }
        return this.core.setBotLevel(level, color);
    }

    getBotStatus() {
        if (this.constructor.consoleLog) {
            console.log('🤖 [ChessGame] Délégation getBotStatus au core');
        }
        return this.core.getBotStatus();
    }

    setBotColor(color) {
        if (this.constructor.consoleLog) {
            console.log('🤖 [ChessGame] Délégation setBotColor au core');
        }
        this.core.setBotColor(color);
    }

    playBotMove() {
        if (this.constructor.consoleLog) {
            console.log('🤖 [ChessGame] Délégation playBotMove au core');
        }
        return this.core.playBotMove();
    }
    
    handleMove(fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`🎮 [ChessGame] Délégation handleMove: [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        return this.core.handleMove(fromRow, fromCol, toRow, toCol);
    }

    // Méthodes utilitaires pour le debug
    getGameState() {
        const state = {
            gameActive: this.gameState.gameActive,
            currentPlayer: this.gameState.currentPlayer,
            boardFlipped: this.gameState.boardFlipped,
            halfMoveClock: this.gameState.halfMoveClock,
            moveHistory: this.gameState.moveHistory.length
        };
        
        if (this.constructor.consoleLog) {
            console.log('📊 [ChessGame] État du jeu:', state);
        }
        
        return state;
    }

    // Méthode pour forcer le tour du bot (debug)
    forceBotTurn() {
        if (this.constructor.consoleLog) {
            console.log('\n⚡ [ChessGame] === FORÇAGE DU TOUR DU BOT ===');
        }
        
        const isBotTurn = this.core.botManager.isBotTurn();
        
        if (this.constructor.consoleLog) {
            console.log(`⚡ [ChessGame] Tour du bot? ${isBotTurn ? '✅ OUI' : '❌ NON'}`);
        }
        
        if (isBotTurn) {
            if (this.constructor.consoleLog) {
                console.log('⚡ [ChessGame] Forçage du coup du bot...');
            }
            this.core.botManager.playBotMove();
        } else {
            if (this.constructor.consoleLog) {
                console.log('⚡ [ChessGame] Pas le tour du bot actuellement');
                const status = this.getBotStatus();
                console.log('⚡ [ChessGame] Statut bot:', status);
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ChessGame] === FIN FORÇAGE ===\n');
        }
    }

    // Méthode pour tester le bot manuellement
    testBot() {
        if (this.constructor.consoleLog) {
            console.log('\n🧪 [ChessGame] === TEST MANUEL DU BOT ===');
            console.log('🧪 [ChessGame] Lancement du test...');
        }
        
        const botStatus = this.getBotStatus();
        
        if (this.constructor.consoleLog) {
            console.log('🧪 [ChessGame] Statut bot:', botStatus);
        }
        
        if (botStatus.active) {
            if (this.constructor.consoleLog) {
                console.log('✅ [ChessGame] Bot actif');
                console.log(`   • Niveau: ${botStatus.level}`);
                console.log(`   • Couleur: ${botStatus.color}`);
                console.log(`   • En réflexion: ${botStatus.thinking ? '🤔 OUI' : '💤 NON'}`);
            }
            
            // Tester la génération de coup
            const currentFEN = FENGenerator.generateFEN(this.gameState, this.board);
            if (this.constructor.consoleLog) {
                console.log(`🎯 [ChessGame] FEN actuel: ${currentFEN.substring(0, 50)}...`);
            }
            
            if (this.core.botManager.bot && this.core.botManager.bot.getMove) {
                const testMove = this.core.botManager.bot.getMove(currentFEN);
                if (testMove) {
                    if (this.constructor.consoleLog) {
                        console.log('🎯 [ChessGame] Coup test du bot trouvé:', testMove);
                        console.log(`   • Départ: [${testMove.fromRow},${testMove.fromCol}]`);
                        console.log(`   • Arrivée: [${testMove.toRow},${testMove.toCol}]`);
                    }
                } else {
                    if (this.constructor.consoleLog) {
                        console.log('❌ [ChessGame] Aucun coup test trouvé');
                    }
                }
            } else {
                if (this.constructor.consoleLog) {
                    console.log('❌ [ChessGame] Méthode getMove non disponible');
                }
            }
        } else {
            if (this.constructor.consoleLog) {
                console.log('❌ [ChessGame] Bot non activé');
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ChessGame] === FIN TEST ===\n');
        }
    }
    
    // NOUVELLE MÉTHODE : Obtenir un résumé complet
    getFullSummary() {
        const summary = {
            gameState: this.getGameState(),
            botStatus: this.getBotStatus(),
            boardInfo: this.core.getBoardInfo(),
            urlParams: this.getUrlParams(),
            timestamp: new Date().toISOString()
        };
        
        if (this.constructor.consoleLog) {
            console.log('📋 [ChessGame] Résumé complet:', summary);
        }
        
        return summary;
    }
}

// Initialisation statique
ChessGame.init();

window.ChessGame = ChessGame;

// Interface de debug globale
window.chessDebug = {
    // Informations du jeu
    gameInfo: () => {
        if (!window.chessGame) {
            console.log('❌ [chessDebug] Aucun jeu initialisé');
            return null;
        }
        
        const info = {
            game: window.chessGame,
            gameState: window.chessGame.getGameState(),
            botStatus: window.chessGame.getBotStatus(),
            core: window.chessGame.core
        };
        
        console.group('🎮 [chessDebug] INFOS DU JEU');
        console.log('Jeu:', info.game);
        console.log('État:', info.gameState);
        console.log('Bot:', info.botStatus);
        console.log('Core:', info.core);
        console.groupEnd();
        
        return info;
    },
    
    // Contrôle du bot
    activateBot: (level = 1, color = 'black') => {
        if (window.chessGame) {
            console.log(`🤖 [chessDebug] Activation bot niveau ${level}, couleur ${color}`);
            return window.chessGame.setBotLevel(level, color);
        }
        console.log('❌ [chessDebug] Jeu non initialisé');
        return null;
    },
    
    // Test du bot
    testBot: () => {
        if (window.chessGame) {
            console.log('🧪 [chessDebug] Test du bot');
            window.chessGame.testBot();
        } else {
            console.log('❌ [chessDebug] Jeu non initialisé');
        }
    },
    
    // Forcer un coup du bot
    forceBotMove: () => {
        if (window.chessGame) {
            console.log('⚡ [chessDebug] Forçage du coup du bot');
            window.chessGame.forceBotTurn();
        } else {
            console.log('❌ [chessDebug] Jeu non initialisé');
        }
    },
    
    // Statut complet
    status: () => {
        if (!window.chessGame) {
            console.log('❌ [chessDebug] Aucun jeu initialisé');
            return;
        }
        
        console.group('📊 [chessDebug] STATUT COMPLET');
        console.log('♟️ État du jeu:', window.chessGame.getGameState());
        console.log('🤖 Statut bot:', window.chessGame.getBotStatus());
        console.log('🔄 Tour actuel:', window.chessGame.gameState.currentPlayer);
        
        const currentFEN = FENGenerator.generateFEN(window.chessGame.gameState, window.chessGame.board);
        console.log('🎯 FEN actuel:', currentFEN);
        
        const urlParams = window.chessGame.getUrlParams();
        console.log('🔗 Paramètres URL:', urlParams);
        console.groupEnd();
    },
    
    // Réinitialisation
    resetGame: () => {
        if (window.chessGame) {
            console.log('🔄 [chessDebug] Réinitialisation du jeu');
            window.chessGame.newGame();
        } else {
            console.log('❌ [chessDebug] Jeu non initialisé');
        }
    },
    
    // Flip du plateau
    flipBoard: () => {
        if (window.chessGame) {
            console.log('🔄 [chessDebug] Flip du plateau');
            window.chessGame.flipBoard();
        } else {
            console.log('❌ [chessDebug] Jeu non initialisé');
        }
    },
    
    // Résumé complet
    fullSummary: () => {
        if (window.chessGame) {
            console.log('📋 [chessDebug] Résumé complet demandé');
            return window.chessGame.getFullSummary();
        }
        console.log('❌ [chessDebug] Jeu non initialisé');
        return null;
    }
};

// Message d'aide pour la console
if (ChessGame.consoleLog) {
    console.log(`
🎮 [ChessGame] COMMANDES DEBUG DISPONIBLES:

• chessDebug.status()       - Statut complet du jeu
• chessDebug.activateBot()  - Activer le bot
• chessDebug.testBot()      - Tester le bot
• chessDebug.forceBotMove() - Forcer un coup du bot
• chessDebug.resetGame()    - Nouvelle partie
• chessDebug.flipBoard()    - Flip du plateau
• chessDebug.fullSummary()  - Résumé complet
• chessDebug.gameInfo()     - Informations détaillées

• window.chessGame          - Accès direct au jeu
• chessGame.testBot()       - Test manuel du bot
• chessGame.forceBotTurn()  - Forcer le tour du bot
• chessGame.getFullSummary()- Résumé complet
`);
}