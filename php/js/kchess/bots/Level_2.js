// bots/Level_2.js - Version CORRIGÉE avec priorité à la config JSON
class Level_2 {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('🤖 bots/Level_2.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
            console.log(`🎯 Stratégie CCMO activée: Check → Capture → Menace → Optimisation`);
        }
    }
    
    // Méthode pour charger la configuration
    static loadConfig() {
        try {
            // Vérifier si la configuration globale existe
            if (window.appConfig && window.appConfig.debug) {
                const configValue = window.appConfig.debug.console_log;
                
                // Convertir la valeur en booléen
                if (typeof configValue === 'string') {
                    this.consoleLog = configValue.toLowerCase() === 'true';
                } else {
                    this.consoleLog = Boolean(configValue);
                }
                
                return true;
            }
            
            // Si window.appConfig n'existe pas, essayer de le charger
            if (typeof window.getConfig === 'function') {
                const configValue = window.getConfig('debug.console_log', 'true');
                this.consoleLog = configValue === true || configValue === 'true';
                return true;
            }
            
            // Si rien n'est disponible, garder la valeur par défaut
            if (this.consoleLog) {
                console.warn('⚠️ Level_2: Aucune configuration trouvée, utilisation de la valeur par défaut');
            }
            return false;
            
        } catch (error) {
            console.error('❌ Level_2: Erreur lors du chargement de la config:', error);
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
        this.name = "Bot Level 1 (CCMO)";
        this.level = 1;
        
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        if (this.constructor.consoleLog) {
            console.log(`🤖 [Level_2] Bot Level 1 initialisé - "CCMO Strategy Bot"`);
            console.log(`📊 ${this.constructor.getConfigSource()}: console_log = ${this.constructor.consoleLog}`);
            console.log(`🎯 [Level_2] Stratégie: Check → Capture → Menace → Optimisation`);
        }
    }

    // Méthode principale pour obtenir un coup - NE DOIT PAS retourner de Promise!
    getMove(fen) {
        // Vérifier la configuration avant chaque appel
        if (!this.constructor.consoleLog && window.appConfig) {
            this.constructor.loadConfig();
        }
        
        if (this.constructor.consoleLog) {
            console.log(`\n🎲 [Level_2] === DÉBUT CALCUL DU COUP ===`);
            console.log(`📋 [Level_2] FEN reçu: ${fen.substring(0, 50)}...`);
            console.log(`🔄 [Level_2] Application de la stratégie CCMO`);
        }

        try {
            const game = window.chessGame;
            if (!game || !game.core || !game.core.moveValidator) {
                if (this.constructor.consoleLog) {
                    console.log(`❌ [Level_2] Jeu ou moteur de mouvement non disponible`);
                }
                return null; // Retourne null, PAS une Promise!
            }

            // Obtenir tous les coups valides
            const allMoves = this.getAllValidMoves();
            
            if (allMoves.length === 0) {
                if (this.constructor.consoleLog) {
                    console.log(`🚫 [Level_2] Aucun coup valide disponible!`);
                }
                return null;
            }

            if (this.constructor.consoleLog) {
                console.log(`📊 [Level_2] Base de coups: ${allMoves.length} mouvement(s) légal(aux)`);
            }

            // Étape 1: CHECK - Rechercher un coup qui met en échec
            const checkMoves = this.getCheckMoves(allMoves);
            if (checkMoves.length > 0) {
                if (this.constructor.consoleLog) {
                    console.log(`✅ [Level_2] CHECK: ${checkMoves.length} coup(s) d'échec trouvé(s)`);
                }
                const selected = this.selectRandomMove(checkMoves);
                this.logMoveSelection(selected, 'CHECK');
                return selected;
            }

            // Étape 2: CAPTURE - Rechercher un coup de capture
            const captureMoves = this.getCaptureMoves(allMoves);
            if (captureMoves.length > 0) {
                if (this.constructor.consoleLog) {
                    console.log(`✅ [Level_2] CAPTURE: ${captureMoves.length} coup(s) de capture trouvé(s)`);
                }
                const selected = this.selectRandomMove(captureMoves);
                this.logMoveSelection(selected, 'CAPTURE');
                return selected;
            }

            // Étape 3: MENACE - Déplacer une pièce vers une case menacante
            const threatMoves = this.getThreatMoves(allMoves);
            if (threatMoves.length > 0) {
                if (this.constructor.consoleLog) {
                    console.log(`✅ [Level_2] MENACE: ${threatMoves.length} coup(s) de menace trouvé(s)`);
                }
                const selected = this.selectRandomMove(threatMoves);
                this.logMoveSelection(selected, 'MENACE');
                return selected;
            }

            // Étape 4: OPTIMISATION - Mouvement normal (développement)
            if (this.constructor.consoleLog) {
                console.log(`✅ [Level_2] OPTIMISATION: Utilisation d'un coup aléatoire`);
            }
            const selected = this.selectRandomMove(allMoves);
            this.logMoveSelection(selected, 'OPTIMISATION');
            return selected;

        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [Level_2] ERREUR lors du calcul du coup: ${error.message}`);
                console.error('Level_2 error:', error);
            }
            return null;
        }
    }

    // Obtenir tous les coups valides
    getAllValidMoves() {
        const game = window.chessGame;
        const validMoves = [];
        
        if (!game || !game.core || !game.core.moveValidator) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [Level_2] getAllValidMoves: Composants du jeu non disponibles`);
            }
            return validMoves;
        }
        
        const currentPlayer = game.gameState.currentPlayer;
        
        if (this.constructor.consoleLog) {
            console.log(`🔍 [Level_2] Recherche des coups pour ${currentPlayer === 'white' ? 'Blancs' : 'Noirs'}`);
        }

        // Parcourir toutes les pièces du joueur actuel
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const square = game.board.getSquare(fromRow, fromCol);
                
                if (square && square.piece && square.piece.color === currentPlayer) {
                    const piece = square.piece;
                    
                    if (this.constructor.consoleLog) {
                        console.log(`  👉 [Level_2] Pièce ${piece.type.charAt(0).toUpperCase()} en [${fromRow},${fromCol}]`);
                    }
                    
                    const possibleMoves = game.core.moveValidator.getPossibleMoves(
                        piece, 
                        fromRow, 
                        fromCol
                    );
                    
                    if (this.constructor.consoleLog && possibleMoves.length > 0) {
                        console.log(`    📍 ${possibleMoves.length} mouvement(s) possible(s)`);
                    }
                    
                    possibleMoves.forEach(move => {
                        const targetSquare = game.board.getSquare(move.row, move.col);
                        const targetPiece = targetSquare?.piece;
                        
                        validMoves.push({
                            fromRow: fromRow,
                            fromCol: fromCol,
                            toRow: move.row,
                            toCol: move.col,
                            piece: piece,
                            moveData: move,
                            targetPiece: targetPiece,
                            isCapture: targetPiece && targetPiece.color !== piece.color
                        });
                        
                        if (this.constructor.consoleLog) {
                            const captureInfo = targetPiece ? 
                                ` → capture ${targetPiece.type}` : 
                                '';
                            console.log(`      → [${fromRow},${fromCol}] → [${move.row},${move.col}]${captureInfo}`);
                        }
                    });
                }
            }
        }

        if (this.constructor.consoleLog) {
            console.log(`📊 [Level_2] Total coups valides: ${validMoves.length}`);
        }
        return validMoves;
    }

    // Filtrer les coups qui mettent en échec
    getCheckMoves(moves) {
        const game = window.chessGame;
        const checkMoves = [];
        
        if (!game || !game.core) return checkMoves;
        
        moves.forEach(move => {
            // Pour simplifier, on vérifie si c'est une capture de roi (échec)
            if (move.targetPiece && move.targetPiece.type === 'king') {
                checkMoves.push(move);
                if (this.constructor.consoleLog) {
                    console.log(`♚ [Level_2] MOVE CHECK: ${move.piece.type} → roi adverse en [${move.toRow},${move.toCol}]`);
                }
            }
            // Note: Dans une vraie implémentation, il faudrait simuler le coup
        });
        
        if (this.constructor.consoleLog) {
            console.log(`📋 [Level_2] Coups CHECK identifiés: ${checkMoves.length}`);
        }
        
        return checkMoves;
    }

    // Filtrer les coups de capture
    getCaptureMoves(moves) {
        const captureMoves = moves.filter(move => {
            const isCapture = move.targetPiece && move.targetPiece.color !== move.piece.color;
            if (isCapture && this.constructor.consoleLog) {
                console.log(`⚔️ [Level_2] MOVE CAPTURE: ${move.piece.type} → ${move.targetPiece.type} en [${move.toRow},${move.toCol}]`);
            }
            return isCapture;
        });
        
        if (this.constructor.consoleLog) {
            console.log(`📋 [Level_2] Coups CAPTURE identifiés: ${captureMoves.length}`);
        }
        
        return captureMoves;
    }

    // Filtrer les coups de menace (se déplacer vers des cases "intéressantes")
    getThreatMoves(moves) {
        const threatMoves = [];
        const game = window.chessGame;
        
        if (!game || !game.core) return threatMoves;
        
        moves.forEach(move => {
            // Éviter les mouvements dangereux (case attaquée par l'adversaire)
            const opponentColor = move.piece.color === 'white' ? 'black' : 'white';
            if (this.isSquareAttacked(move.toRow, move.toCol, opponentColor)) {
                if (this.constructor.consoleLog) {
                    console.log(`⚠️ [Level_2] Case [${move.toRow},${move.toCol}] attaquée - mouvement évité`);
                }
                return; // Éviter cette case
            }
            
            // Se déplacer vers le centre (bon pour le développement)
            const isCenterMove = this.isCenterSquare(move.toRow, move.toCol);
            
            // Se déplacer avec une pièce mineure (cavalier, fou) en premier
            const isMinorPiece = move.piece.type === 'knight' || move.piece.type === 'bishop';
            
            // Prioriser les mouvements vers le centre ou avec des pièces mineures
            if (isCenterMove || isMinorPiece) {
                threatMoves.push(move);
                const reason = isCenterMove ? "centre" : "pièce mineure";
                if (this.constructor.consoleLog) {
                    console.log(`🎯 [Level_2] MOVE MENACE (${reason}): ${move.piece.type} → [${move.toRow},${move.toCol}]`);
                }
            }
        });
        
        if (this.constructor.consoleLog) {
            console.log(`📋 [Level_2] Coups MENACE identifiés: ${threatMoves.length}`);
        }
        
        return threatMoves;
    }

    // Vérifier si une case est attaquée par l'adversaire
    isSquareAttacked(row, col, attackerColor) {
        const game = window.chessGame;
        if (!game || !game.core) return false;
        
        if (this.constructor.consoleLog) {
            console.log(`  🔍 [Level_2] Vérification case [${row},${col}] attaquée par ${attackerColor}`);
        }
        
        // Vérifier toutes les pièces adverses
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const square = game.board.getSquare(r, c);
                if (square && square.piece && square.piece.color === attackerColor) {
                    const possibleMoves = game.core.moveValidator.getPossibleMoves(square.piece, r, c);
                    
                    // Vérifier si cette pièce peut attaquer la case cible
                    const canAttack = possibleMoves.some(move => 
                        move.row === row && move.col === col
                    );
                    
                    if (canAttack && this.constructor.consoleLog) {
                        console.log(`    ⚠️ [Level_2] Case attaquée par ${square.piece.type} en [${r},${c}]`);
                        return true;
                    }
                }
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log(`    ✅ [Level_2] Case [${row},${col}] non attaquée`);
        }
        
        return false;
    }

    // Vérifier si une case est au centre de l'échiquier
    isCenterSquare(row, col) {
        // Cases centrales (d4, d5, e4, e5)
        const centerRows = [3, 4]; // 0-indexed
        const centerCols = [3, 4]; // 0-indexed
        
        const isCenter = centerRows.includes(row) && centerCols.includes(col);
        
        if (this.constructor.consoleLog) {
            console.log(`    🎯 [Level_2] Case [${row},${col}] ${isCenter ? 'est au centre' : 'n\'est pas au centre'}`);
        }
        
        return isCenter;
    }

    // Sélectionner un coup aléatoire
    selectRandomMove(moves) {
        if (!moves || moves.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * moves.length);
        const selectedMove = moves[randomIndex];
        
        if (this.constructor.consoleLog) {
            console.log(`🎲 [Level_2] Sélection aléatoire: index ${randomIndex + 1}/${moves.length}`);
        }
        
        return selectedMove;
    }

    // Logger la sélection du coup
    logMoveSelection(move, strategyType) {
        if (!move) return;
        
        if (this.constructor.consoleLog) {
            console.log(`\n✅ [Level_2] === COUP SÉLECTIONNÉ ===`);
            console.log(`📝 Stratégie: ${strategyType}`);
            console.log(`♟️ Pièce: ${move.piece.type} (${move.piece.color})`);
            console.log(`📍 Départ: [${move.fromRow},${move.fromCol}]`);
            console.log(`📍 Arrivée: [${move.toRow},${move.toCol}]`);
            
            // Convertir en notation échecs
            const colToLetter = col => String.fromCharCode(97 + col);
            const rowToNumber = row => 8 - row;
            console.log(`📝 Notation: ${colToLetter(move.fromCol)}${rowToNumber(move.fromRow)} → ${colToLetter(move.toCol)}${rowToNumber(move.toRow)}`);
            
            if (move.targetPiece) {
                console.log(`🎯 Capture: ${move.targetPiece.type} (${move.targetPiece.color})`);
            }
            
            console.log(`✅ [Level_2] === FIN CALCUL DU COUP ===\n`);
        }
    }

    // NOUVELLE MÉTHODE : Obtenir des statistiques sur les coups
    getMoveStatistics(moves) {
        const stats = {
            total: moves.length,
            captures: moves.filter(m => m.targetPiece && m.targetPiece.color !== m.piece.color).length,
            centerMoves: moves.filter(m => this.isCenterSquare(m.toRow, m.toCol)).length,
            minorPieceMoves: moves.filter(m => m.piece.type === 'knight' || m.piece.type === 'bishop').length
        };
        
        if (this.constructor.consoleLog) {
            console.log(`📈 [Level_2] Statistiques des coups:`, stats);
        }
        
        return stats;
    }
    
    // NOUVELLE MÉTHODE : Obtenir le statut du bot
    getStatus() {
        return {
            name: this.name,
            level: this.level,
            type: "CCMO Strategy Bot",
            description: "Stratégie: Check → Capture → Menace → Optimisation",
            config: {
                console_log: this.constructor.consoleLog,
                source: this.constructor.getConfigSource(),
                app_config_available: !!window.appConfig
            }
        };
    }
    
    // Méthode pour tester la configuration
    static testConfig() {
        console.group('🧪 Test de configuration Level_2');
        console.log('consoleLog actuel:', this.consoleLog);
        console.log('Source config:', this.getConfigSource());
        console.log('window.appConfig disponible:', !!window.appConfig);
        
        if (window.appConfig) {
            console.log('Valeur debug.console_log dans appConfig:', 
                window.appConfig.debug?.console_log);
        }
        
        console.log('Mode debug activé:', this.isDebugMode());
        console.groupEnd();
        
        return this.consoleLog;
    }
}

// Initialisation statique
Level_2.init();

// Exposer la classe globalement
window.Level_2 = Level_2;

// Ajouter des fonctions utilitaires globales
window.Level2Utils = {
    // Forcer le rechargement de la config
    reloadConfig: () => {
        Level_2.loadConfig();
        console.log(`🔧 Level_2: Configuration rechargée: ${Level_2.consoleLog}`);
        return Level_2.consoleLog;
    },
    
    // Tester la configuration
    testConfig: () => Level_2.testConfig(),
    
    // Obtenir l'état actuel
    getState: () => ({
        consoleLog: Level_2.consoleLog,
        source: Level_2.getConfigSource(),
        debugMode: Level_2.isDebugMode()
    }),
    
    // Obtenir les statistiques de la partie actuelle
    getGameStats: () => {
        const game = window.chessGame;
        if (!game) return null;
        
        const bot = new Level_2();
        const moves = bot.getAllValidMoves();
        return bot.getMoveStatistics(moves);
    }
};

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            Level_2.loadConfig();
            if (Level_2.consoleLog) {
                console.log('✅ Level_2: Configuration vérifiée après chargement du DOM');
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        Level_2.loadConfig();
    }, 100);
}

// Log final (si activé)
if (Level_2.consoleLog) {
    console.log('✅ Level_2 CCMO Bot prêt à utiliser la configuration JSON');
}