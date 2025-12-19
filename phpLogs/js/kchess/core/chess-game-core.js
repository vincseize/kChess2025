// core/chess-game-core.js - Classe principale orchestratrice MODULAIRE
class ChessGameCore {
    
    static consoleLog = true; // Valeur par défaut - sera écrasée par la config JSON
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('core/chess-game-core.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            console.info('🔇 chess-game-core.js: Mode silencieux activé');
        }
    }
    
    // Méthode pour charger la configuration depuis window.appConfig
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
                    console.log(`⚙️ ChessGameCore: Configuration chargée - console_log = ${this.consoleLog}`);
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
                console.warn('⚠️ ChessGameCore: Aucune configuration trouvée, utilisation de la valeur par défaut (true)');
            }
            return false;
            
        } catch (error) {
            console.error('❌ ChessGameCore: Erreur lors du chargement de la config:', error);
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

    constructor(board, gameState, moveValidator) {
        this.board = board;
        this.gameState = gameState;
        this.moveValidator = moveValidator;
        
        this.selectedPiece = null;
        this.possibleMoves = [];
        
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        if (this.constructor.consoleLog) {
            console.log('\n🏁 [ChessGameCore] === INITIALISATION ===');
            console.log('🏁 [ChessGameCore] Création du moteur de jeu');
            console.log('🏁 [ChessGameCore] Composants:');
            console.log('   • Board:', board);
            console.log('   • GameState:', gameState);
            console.log('   • MoveValidator:', moveValidator);
        } else {
            console.info('🏁 ChessGameCore initialisé');
        }
        
        // Initialiser les managers modulaires
        this.moveHandler = new ChessGameMoveHandler(this);
        this.ui = new ChessGameUI(this);
        this.promotionManager = new PromotionManager(this);
        this.botManager = new BotManager(this);
        this.gameStatusManager = new GameStatusManager(this);
        
        if (this.constructor.consoleLog) {
            console.log('🏁 [ChessGameCore] Managers modulaires initialisés:');
            console.log('   • MoveHandler:', this.moveHandler);
            console.log('   • UI:', this.ui);
            console.log('   • PromotionManager:', this.promotionManager);
            console.log('   • BotManager:', this.botManager);
            console.log('   • GameStatusManager:', this.gameStatusManager);
            console.log('✅ [ChessGameCore] === INITIALISATION TERMINÉE ===\n');
        }
    }
    
    // ============================================
    // MÉTHODES DÉLÉGUÉES PRINCIPALES
    // ============================================
    handleSquareClick = (displayRow, displayCol) => this.moveHandler.handleSquareClick(displayRow, displayCol);
    highlightPossibleMoves = () => this.moveHandler.highlightPossibleMoves();
    clearSelection = () => this.moveHandler.clearSelection();
    
    updateUI = () => {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            if (this.ui && this.ui.updateUI) {
                this.ui.updateUI();
            }
            if (this.gameStatusManager && this.gameStatusManager.updateGameStatus) {
                this.gameStatusManager.updateGameStatus();
            }
            return;
        }
        
        // Mode debug
        if (this.ui && this.ui.updateUI) {
            if (this.constructor.consoleLog) {
                console.log('🔄 [ChessGameCore] Mise à jour de l\'UI');
            }
            this.ui.updateUI();
        }
        if (this.gameStatusManager && this.gameStatusManager.updateGameStatus) {
            if (this.constructor.consoleLog) {
                console.log('🔄 [ChessGameCore] Mise à jour du statut du jeu');
            }
            this.gameStatusManager.updateGameStatus();
        }
    };

    // ============================================
    // GESTION DES MOUVEMENTS
    // ============================================
    handleMove(fromRow, fromCol, toRow, toCol) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            // Ne pas bloquer si c'est le bot qui joue
            if (!this.gameState.gameActive) {
                return false;
            }
            
            // Permettre au bot de jouer même si isBotThinking est true
            if (this.botManager.isBotThinking && this.gameState.currentPlayer !== this.botManager.botColor) {
                return false;
            }
            
            try {
                const success = this.moveHandler.executeDirectMove(fromRow, fromCol, toRow, toCol);
                
                if (success) {
                    this.ui.updateUI();
                    this.gameStatusManager.updateGameStatus();
                    return true;
                }
                
                return false;
            } catch (error) {
                return false;
            }
        }
        
        // Mode debug
        if (this.constructor.consoleLog) {
            console.log(`\n🎮 [ChessGameCore] === TENTATIVE DE MOUVEMENT ===`);
            console.log(`🎮 [ChessGameCore] Départ: [${fromRow},${fromCol}] → Arrivée: [${toRow},${toCol}]`);
            console.log(`🎮 [ChessGameCore] Jeu actif: ${this.gameState.gameActive ? '✅ OUI' : '❌ NON'}`);
            console.log(`🎮 [ChessGameCore] Joueur actuel: ${this.gameState.currentPlayer}`);
        }
        
        // Ne pas bloquer si c'est le bot qui joue
        if (!this.gameState.gameActive) {
            if (this.constructor.consoleLog) {
                console.log('🚫 [ChessGameCore] Jeu non actif - mouvement refusé');
            }
            return false;
        }
        
        // Permettre au bot de jouer même si isBotThinking est true
        if (this.botManager.isBotThinking && this.gameState.currentPlayer !== this.botManager.botColor) {
            if (this.constructor.consoleLog) {
                console.log('⏳ [ChessGameCore] Bot en réflexion - attente requise');
            }
            return false;
        }

        try {
            const success = this.moveHandler.executeDirectMove(fromRow, fromCol, toRow, toCol);
            
            if (success) {
                if (this.constructor.consoleLog) {
                    console.log('✅ [ChessGameCore] Mouvement exécuté avec succès');
                }
                
                // Mettre à jour l'UI
                this.ui.updateUI();
                
                // Vérifier le statut du jeu
                this.gameStatusManager.updateGameStatus();
                
                if (this.constructor.consoleLog) {
                    console.log('✅ [ChessGameCore] === MOUVEMENT RÉUSSI ===\n');
                }
                
                return true;
            } else {
                if (this.constructor.consoleLog) {
                    console.log('❌ [ChessGameCore] Mouvement échoué');
                    console.log('❌ [ChessGameCore] === MOUVEMENT ÉCHOUÉ ===\n');
                }
            }
            
            return false;
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [ChessGameCore] Erreur dans handleMove: ${error.message}`);
                console.error('ChessGameCore error:', error);
            }
            return false;
        }
    }

    // ============================================
    // MÉTHODE POUR METTRE À JOUR LE COMPTEUR DES 50 COUPS
    // ============================================
    updateHalfMoveClock(fromPiece, toPiece, toSquare) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            if (toPiece || fromPiece.type === 'pawn') {
                this.gameState.halfMoveClock = 0;
            } else {
                this.gameState.halfMoveClock++;
            }
            return;
        }
        
        // Mode debug
        if (toPiece || fromPiece.type === 'pawn') {
            this.gameState.halfMoveClock = 0;
            const reason = toPiece ? 'capture' : 'mouvement de pion';
            if (this.constructor.consoleLog) {
                console.log(`🔄 [ChessGameCore] HalfMoveClock réinitialisé à 0 (${reason})`);
                console.log(`   • Pièce source: ${fromPiece.type} (${fromPiece.color})`);
                if (toPiece) {
                    console.log(`   • Pièce cible: ${toPiece.type} (${toPiece.color})`);
                }
            }
        } else {
            this.gameState.halfMoveClock++;
            if (this.constructor.consoleLog) {
                console.log(`📈 [ChessGameCore] HalfMoveClock incrémenté: ${this.gameState.halfMoveClock}`);
                console.log(`   • Pièce: ${fromPiece.type} (${fromPiece.color})`);
                console.log(`   • Pas de capture ni de mouvement de pion`);
            }
        }
    }

    // ============================================
    // MÉTHODE POUR DÉPLACER UNE PIÈCE
    // ============================================
    movePiece(fromSquare, toSquare, promotionType = null) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            const fromPiece = fromSquare.piece;
            const toPiece = toSquare.piece;
            const previousFEN = FENGenerator.generateFEN(this.gameState, this.board);
            
            // Déplacer la pièce
            this.board.movePiece(fromSquare, toSquare);
            
            // Gérer la promotion
            if (promotionType) {
                this.promotionManager.promotePawn(toSquare, promotionType);
            }
            
            // Mettre à jour le compteur des 50 coups
            this.updateHalfMoveClock(fromPiece, toPiece, toSquare);
            
            // Sauvegarder le mouvement dans l'historique
            const moveData = {
                from: { row: fromSquare.row, col: fromSquare.col },
                to: { row: toSquare.row, col: toSquare.col },
                piece: fromPiece.type,
                color: fromPiece.color,
                captured: toPiece ? toPiece.type : null,
                fen: previousFEN
            };
            
            this.gameState.moveHistory.push(moveData);
            
            // Changer le tour
            const oldTurn = this.gameState.currentTurn;
            this.gameState.currentTurn = this.gameState.currentTurn === 'white' ? 'black' : 'white';
            
            this.clearSelection();
            this.gameStatusManager.updateGameStatus();
            return;
        }
        
        // Mode debug
        const fromPiece = fromSquare.piece;
        const toPiece = toSquare.piece;
        
        if (this.constructor.consoleLog) {
            console.log(`\n♟️ [ChessGameCore] === DÉPLACEMENT DE PIÈCE ===`);
            console.log(`♟️ [ChessGameCore] Départ: [${fromSquare.row},${fromSquare.col}]`);
            console.log(`♟️ [ChessGameCore] Arrivée: [${toSquare.row},${toSquare.col}]`);
            console.log(`♟️ [ChessGameCore] Pièce: ${fromPiece.type} (${fromPiece.color})`);
            if (toPiece) {
                console.log(`♟️ [ChessGameCore] Pièce cible: ${toPiece.type} (${toPiece.color})`);
            }
            if (promotionType) {
                console.log(`♟️ [ChessGameCore] Promotion en: ${promotionType}`);
            }
        }
        
        // Sauvegarder l'état avant le mouvement
        const previousFEN = FENGenerator.generateFEN(this.gameState, this.board);
        
        // Déplacer la pièce
        this.board.movePiece(fromSquare, toSquare);
        if (this.constructor.consoleLog) {
            console.log('♟️ [ChessGameCore] Pièce déplacée sur le plateau');
        }
        
        // Gérer la promotion
        if (promotionType) {
            if (this.constructor.consoleLog) {
                console.log(`♟️ [ChessGameCore] Promotion du pion en ${promotionType}`);
            }
            this.promotionManager.promotePawn(toSquare, promotionType);
        }
        
        // Mettre à jour le compteur des 50 coups
        this.updateHalfMoveClock(fromPiece, toPiece, toSquare);
        
        // Sauvegarder le mouvement dans l'historique
        const moveData = {
            from: { row: fromSquare.row, col: fromSquare.col },
            to: { row: toSquare.row, col: toSquare.col },
            piece: fromPiece.type,
            color: fromPiece.color,
            captured: toPiece ? toPiece.type : null,
            fen: previousFEN
        };
        
        this.gameState.moveHistory.push(moveData);
        if (this.constructor.consoleLog) {
            console.log(`📝 [ChessGameCore] Mouvement sauvegardé dans l'historique`);
            console.log(`   • Mouvement #${this.gameState.moveHistory.length}`);
            console.log(`   • Capture: ${moveData.captured || 'Aucune'}`);
        }
        
        // Changer le tour
        const oldTurn = this.gameState.currentTurn;
        this.gameState.currentTurn = this.gameState.currentTurn === 'white' ? 'black' : 'white';
        if (this.constructor.consoleLog) {
            console.log(`🔄 [ChessGameCore] Changement de tour: ${oldTurn} → ${this.gameState.currentTurn}`);
        }
        
        this.clearSelection();
        this.gameStatusManager.updateGameStatus();
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ChessGameCore] === DÉPLACEMENT TERMINÉ ===\n');
        }
    }

    // ============================================
    // DÉLÉGATION DES MÉTHODES BOT
    // ============================================
    setBotLevel(level, color = 'black') {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            return this.botManager.setBotLevel(level, color);
        }
        
        // Mode debug
        if (this.constructor.consoleLog) {
            console.log(`\n🤖 [ChessGameCore] Délégation de setBotLevel: niveau=${level}, couleur=${color}`);
        }
        return this.botManager.setBotLevel(level, color);
    }

    getBotStatus() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            return this.botManager.getBotStatus();
        }
        
        // Mode debug
        if (this.constructor.consoleLog) {
            console.log('🤖 [ChessGameCore] Délégation de getBotStatus');
        }
        return this.botManager.getBotStatus();
    }

    setBotColor(color) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            this.botManager.setBotColor(color);
            return;
        }
        
        // Mode debug
        if (this.constructor.consoleLog) {
            console.log(`🤖 [ChessGameCore] Délégation de setBotColor: couleur=${color}`);
        }
        this.botManager.setBotColor(color);
    }

    playBotMove() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            return this.botManager.playBotMove();
        }
        
        // Mode debug
        if (this.constructor.consoleLog) {
            console.log('🤖 [ChessGameCore] Délégation de playBotMove');
        }
        return this.botManager.playBotMove();
    }

    // ============================================
    // DÉLÉGATION DES MÉTHODES UI
    // ============================================
    showNotification(message, type = 'info') {
        // Mode silencieux - toujours afficher les notifications
        if (this.gameStatusManager && this.gameStatusManager.showNotification) {
            this.gameStatusManager.showNotification(message, type);
        } else {
            // Fallback simple
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
        }
    }

    // ============================================
    // MÉTHODE POUR TOURNER LE PLATEAU (SIMPLIFIÉE)
    // ============================================
    flipBoard() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            const currentPosition = this.board.saveCurrentPosition();
            this.gameState.boardFlipped = !this.gameState.boardFlipped;
            this.board.createBoard();
            
            Object.keys(currentPosition).forEach(key => {
                const [row, col] = key.split('-').map(Number);
                const square = this.board.getSquare(row, col);
                if (square) {
                    this.board.placePiece(currentPosition[key], square);
                }
            });
            
            this.clearSelection();
            if (this.gameStatusManager && this.gameStatusManager.updateGameStatus) {
                this.gameStatusManager.updateGameStatus();
            }
            
            if (typeof window.updatePlayerLabels === 'function') {
                window.updatePlayerLabels();
            }
            return;
        }
        
        // Mode debug
        if (this.constructor.consoleLog) {
            console.log(`\n🔄 [ChessGameCore] === FLIP DU PLATEAU ===`);
            console.log(`🔄 [ChessGameCore] Ancien état: ${this.gameState.boardFlipped ? 'retourné' : 'normal'}`);
        }
        
        // Sauvegarder la position actuelle
        const currentPosition = this.board.saveCurrentPosition();
        if (this.constructor.consoleLog) {
            console.log('🔄 [ChessGameCore] Position actuelle sauvegardée');
            console.log(`🔄 [ChessGameCore] ${Object.keys(currentPosition).length} pièce(s) à restaurer`);
        }
        
        // Inverser l'état du plateau
        this.gameState.boardFlipped = !this.gameState.boardFlipped;
        if (this.constructor.consoleLog) {
            console.log(`🔄 [ChessGameCore] Nouvel état: ${this.gameState.boardFlipped ? 'retourné' : 'normal'}`);
        }
        
        // Recréer le plateau
        this.board.createBoard();
        if (this.constructor.consoleLog) {
            console.log('🔄 [ChessGameCore] Plateau recréé');
        }
        
        // Restaurer les pièces
        Object.keys(currentPosition).forEach(key => {
            const [row, col] = key.split('-').map(Number);
            const square = this.board.getSquare(row, col);
            if (square) {
                this.board.placePiece(currentPosition[key], square);
            }
        });
        if (this.constructor.consoleLog) {
            console.log('🔄 [ChessGameCore] Pièces restaurées');
        }
        
        // Effacer la sélection
        this.clearSelection();
        if (this.constructor.consoleLog) {
            console.log('🔄 [ChessGameCore] Sélection effacée');
        }
        
        // Mettre à jour le statut du jeu
        if (this.gameStatusManager && this.gameStatusManager.updateGameStatus) {
            this.gameStatusManager.updateGameStatus();
        }
        
        // SIMPLE: Appeler la fonction globale pour mettre à jour les labels
        if (typeof window.updatePlayerLabels === 'function') {
            window.updatePlayerLabels();
            if (this.constructor.consoleLog) {
                console.log('🔄 [ChessGameCore] Labels des joueurs mis à jour');
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ChessGameCore] === FLIP TERMINÉ ===\n');
        }
    }

    // ============================================
    // NOUVELLE PARTIE
    // ============================================
    newGame() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            this.gameState.resetGame();
            this.clearSelection();
            this.loadInitialPosition();
            
            if (this.botManager.botLevel > 0) {
                this.botManager.setBotLevel(this.botManager.botLevel, this.botManager.botColor);
            }
            
            if (this.ui && this.ui.resetTimers) {
                this.ui.resetTimers();
            }
            
            this.updateUI();
            
            setTimeout(() => {
                if (typeof window.updatePlayerLabels === 'function') {
                    window.updatePlayerLabels();
                }
            }, 300);
            return;
        }
        
        // Mode debug
        if (this.constructor.consoleLog) {
            console.log(`\n🆕 [ChessGameCore] === NOUVELLE PARTIE ===`);
            console.log(`🆕 [ChessGameCore] Réinitialisation du jeu...`);
            console.log(`🆕 [ChessGameCore] Statut avant réinitialisation:`);
            console.log(`   • Joueur actuel: ${this.gameState.currentPlayer}`);
            console.log(`   • Plateau retourné: ${this.gameState.boardFlipped}`);
            console.log(`   • Bot niveau: ${this.botManager.botLevel}`);
            console.log(`   • Bot couleur: ${this.botManager.botColor}`);
        }
        
        // Réinitialiser l'état du jeu
        this.gameState.resetGame();
        if (this.constructor.consoleLog) {
            console.log('🆕 [ChessGameCore] GameState réinitialisé');
        }
        
        // Effacer la sélection
        this.clearSelection();
        if (this.constructor.consoleLog) {
            console.log('🆕 [ChessGameCore] Sélection effacée');
        }
        
        // Charger la position initiale
        this.loadInitialPosition();
        if (this.constructor.consoleLog) {
            console.log('🆕 [ChessGameCore] Position initiale chargée');
        }
        
        // Réactiver le bot si nécessaire
        if (this.botManager.botLevel > 0) {
            if (this.constructor.consoleLog) {
                console.log(`🤖 [ChessGameCore] Réactivation du bot (niveau ${this.botManager.botLevel})`);
            }
            this.botManager.setBotLevel(this.botManager.botLevel, this.botManager.botColor);
        }
        
        // Réinitialiser les timers
        if (this.ui && this.ui.resetTimers) {
            this.ui.resetTimers();
            if (this.constructor.consoleLog) {
                console.log('🆕 [ChessGameCore] Timers réinitialisés');
            }
        }
        
        // Mettre à jour l'UI
        this.updateUI();
        if (this.constructor.consoleLog) {
            console.log('🆕 [ChessGameCore] UI mise à jour');
        }
        
        // Mettre à jour les labels via la fonction globale
        setTimeout(() => {
            if (typeof window.updatePlayerLabels === 'function') {
                window.updatePlayerLabels();
                if (this.constructor.consoleLog) {
                    console.log('🆕 [ChessGameCore] Labels des joueurs mis à jour');
                }
            }
        }, 300);
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ChessGameCore] === NOUVELLE PARTIE PRÊTE ===\n');
        }
    }

    // ============================================
    // CHARGEMENT DE LA POSITION INITIALE
    // ============================================
    loadInitialPosition() {
        if (this.constructor.consoleLog) {
            console.log('🔧 [ChessGameCore] Chargement de la position initiale');
        }
        
        this.board.createBoard();
        
        if (this.constructor.consoleLog) {
            console.log('🔧 [ChessGameCore] Plateau créé');
            console.log('🔧 [ChessGameCore] NOTE: Les pièces doivent être placées séparément');
        }
    }

    // ============================================
    // MÉTHODE UTILITAIRE POUR DÉBOGAGE
    // ============================================
    getBoardInfo() {
        const info = {
            flipped: this.gameState.boardFlipped,
            currentPlayer: this.gameState.currentPlayer,
            gameActive: this.gameState.gameActive,
            botLevel: this.botManager.botLevel,
            botColor: this.botManager.botColor,
            halfMoveClock: this.gameState.halfMoveClock,
            moveHistoryCount: this.gameState.moveHistory.length
        };
        
        if (this.constructor.consoleLog) {
            console.log('📊 [ChessGameCore] Informations du plateau:', info);
        }
        
        return info;
    }
    
    // ============================================
    // NOUVELLE MÉTHODE : STATISTIQUES DU JEU
    // ============================================
    getGameStatistics() {
        const stats = {
            totalMoves: this.gameState.moveHistory.length,
            currentPlayer: this.gameState.currentPlayer,
            gameActive: this.gameState.gameActive,
            boardFlipped: this.gameState.boardFlipped,
            halfMoveClock: this.gameState.halfMoveClock,
            bot: this.getBotStatus(),
            timestamp: new Date().toISOString()
        };
        
        if (this.constructor.consoleLog) {
            console.log('📈 [ChessGameCore] Statistiques du jeu:', stats);
        }
        
        return stats;
    }
    
    // Méthode pour forcer la mise à jour de la configuration
    static reloadConfig() {
        const oldValue = this.consoleLog;
        this.loadConfig();
        
        if (this.consoleLog && oldValue !== this.consoleLog) {
            console.log(`🔄 ChessGameCore: Configuration rechargée: ${oldValue} → ${this.consoleLog}`);
        }
        return this.consoleLog;
    }
}

// Initialisation statique
ChessGameCore.init();

// Exposer des fonctions utilitaires globales
window.ChessGameCoreUtils = {
    // Forcer le rechargement de la config
    reloadConfig: () => ChessGameCore.reloadConfig(),
    
    // Tester la configuration
    testConfig: () => {
        console.group('🧪 Test de configuration ChessGameCore');
        console.log('consoleLog actuel:', ChessGameCore.consoleLog);
        console.log('Source config:', ChessGameCore.getConfigSource());
        console.log('window.appConfig disponible:', !!window.appConfig);
        
        if (window.appConfig) {
            console.log('Valeur debug.console_log dans appConfig:', 
                window.appConfig.debug?.console_log, 
                '(type:', typeof window.appConfig.debug?.console_log + ')');
        }
        
        console.log('Mode debug activé:', ChessGameCore.isDebugMode());
        console.groupEnd();
        
        return ChessGameCore.consoleLog;
    },
    
    // Obtenir l'état actuel
    getState: () => ({
        consoleLog: ChessGameCore.consoleLog,
        source: ChessGameCore.getConfigSource(),
        debugMode: ChessGameCore.isDebugMode(),
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
    }
};

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            ChessGameCore.loadConfig();
            if (ChessGameCore.consoleLog) {
                console.log('✅ ChessGameCore: Configuration vérifiée après chargement du DOM');
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        ChessGameCore.loadConfig();
    }, 100);
}

// Message final basé sur la configuration
if (ChessGameCore.consoleLog) {
    console.log('✅ ChessGameCore prêt (mode debug activé)');
} else {
    console.info('✅ ChessGameCore prêt (mode silencieux)');
}

window.ChessGameCore = ChessGameCore;