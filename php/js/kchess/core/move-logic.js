// core/move-logic.js - Version utilisant la configuration JSON comme priorité
class MoveLogic {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('♟️ core/move-logic.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('♟️ MoveLogic: Mode silencieux activé (debug désactivé dans config)');
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
                        console.info('🔧 MoveLogic: console_log désactivé via config JSON');
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
                    console.log(`⚙️ MoveLogic: Configuration chargée - console_log = ${this.consoleLog} (valeur brute: "${configValue}")`);
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
                console.warn('⚠️ MoveLogic: Aucune configuration trouvée, utilisation de la valeur par défaut (true)');
            }
            return false;
            
        } catch (error) {
            console.error('❌ MoveLogic: Erreur lors du chargement de la config:', error);
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

    constructor(chessGame) {
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        this.chessGame = chessGame;
        
        if (this.constructor.consoleLog) {
            console.log('♟️ [MoveLogic] Logique de déplacement initialisée');
            console.log('♟️ [MoveLogic] ChessGame:', chessGame);
        }
    }

    movePiece(fromSquare, toSquare, promotionType = null) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            const fromPiece = fromSquare.piece;
            const toPiece = toSquare.piece;
            
            if (!fromPiece) return;
            
            // Sauvegarder l'état avant le mouvement
            const previousFEN = window.FENGenerator ? 
                window.FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board) : '';
            
            // Déplacer la pièce
            this.chessGame.board.movePiece(fromSquare, toSquare);
            
            // Gérer la promotion
            if (promotionType && this.chessGame.promotionManager) {
                this.chessGame.promotionManager.promotePawn(toSquare, promotionType);
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
            
            this.chessGame.gameState.moveHistory.push(moveData);
            
            // Changer le tour
            const oldTurn = this.chessGame.gameState.currentTurn;
            this.chessGame.gameState.currentTurn = this.chessGame.gameState.currentTurn === 'white' ? 'black' : 'white';
            
            this.chessGame.clearSelection();
            
            if (this.chessGame.gameStatusManager) {
                this.chessGame.gameStatusManager.updateGameStatus();
            }
            
            return;
        }
        
        // Mode debug activé
        console.log('\n♟️ [MoveLogic] === DÉPLACEMENT DE PIÈCE ===');
        console.log(`♟️ [MoveLogic] Départ: [${fromSquare.row},${fromSquare.col}]`);
        console.log(`♟️ [MoveLogic] Arrivée: [${toSquare.row},${toSquare.col}]`);
        
        const fromPiece = fromSquare.piece;
        const toPiece = toSquare.piece;
        
        console.log(`♟️ [MoveLogic] Pièce source: ${fromPiece?.type || '?'} (${fromPiece?.color || '?'})`);
        console.log(`♟️ [MoveLogic] Pièce cible: ${toPiece?.type || 'Aucune'} (${toPiece?.color || '?'})`);
        
        if (promotionType) {
            console.log(`♟️ [MoveLogic] Promotion en: ${promotionType}`);
        }
        
        if (!fromPiece) {
            console.error('❌ [MoveLogic] Aucune pièce à déplacer');
            return;
        }
        
        // Sauvegarder l'état avant le mouvement
        const previousFEN = window.FENGenerator ? 
            window.FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board) : '';
        
        if (previousFEN) {
            console.log(`📄 [MoveLogic] FEN avant mouvement: ${previousFEN.substring(0, 50)}...`);
        } else {
            console.warn('⚠️ [MoveLogic] FENGenerator non disponible pour générer FEN');
        }
        
        // Déplacer la pièce
        console.log('♟️ [MoveLogic] Déplacement de la pièce sur le plateau...');
        
        this.chessGame.board.movePiece(fromSquare, toSquare);
        
        console.log('✅ [MoveLogic] Pièce déplacée avec succès');
        
        // Gérer la promotion
        if (promotionType && this.chessGame.promotionManager) {
            console.log(`♟️ [MoveLogic] Promotion du pion en ${promotionType}...`);
            
            this.chessGame.promotionManager.promotePawn(toSquare, promotionType);
            
            console.log(`✅ [MoveLogic] Promotion effectuée: ${fromPiece.type} → ${promotionType}`);
        } else if (promotionType && !this.chessGame.promotionManager) {
            console.warn('⚠️ [MoveLogic] PromotionManager non disponible');
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
        
        this.chessGame.gameState.moveHistory.push(moveData);
        
        console.log(`📝 [MoveLogic] Mouvement enregistré dans l'historique:`);
        console.log(`   • Mouvement #${this.chessGame.gameState.moveHistory.length}`);
        console.log(`   • Pièce: ${moveData.piece} (${moveData.color})`);
        console.log(`   • Capture: ${moveData.captured || 'Aucune'}`);
        console.log(`   • Départ: [${moveData.from.row},${moveData.from.col}]`);
        console.log(`   • Arrivée: [${moveData.to.row},${moveData.to.col}]`);
        
        // Changer le tour
        const oldTurn = this.chessGame.gameState.currentTurn;
        this.chessGame.gameState.currentTurn = this.chessGame.gameState.currentTurn === 'white' ? 'black' : 'white';
        
        console.log(`🔄 [MoveLogic] Changement de tour: ${oldTurn} → ${this.chessGame.gameState.currentTurn}`);
        
        this.chessGame.clearSelection();
        
        console.log('🧹 [MoveLogic] Sélection nettoyée');
        
        if (this.chessGame.gameStatusManager) {
            this.chessGame.gameStatusManager.updateGameStatus();
        } else {
            console.warn('⚠️ [MoveLogic] GameStatusManager non disponible');
        }
        
        console.log('✅ [MoveLogic] === DÉPLACEMENT TERMINÉ ===\n');
    }

    updateHalfMoveClock(fromPiece, toPiece, toSquare) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            // Réinitialiser si coup de pion ou capture
            const isCapture = toPiece && toPiece.color !== fromPiece.color;
            const isPawnMove = fromPiece.type === 'pawn';
            
            if (isCapture || isPawnMove) {
                this.chessGame.gameState.halfMoveClock = 0;
            } else {
                this.chessGame.gameState.halfMoveClock++;
            }
            return;
        }
        
        // Mode debug
        console.log('🕒 [MoveLogic] Mise à jour horloge 50 coups...');
        console.log(`   • Pièce source: ${fromPiece.type}`);
        console.log(`   • Capture possible: ${toPiece ? 'OUI' : 'NON'}`);
        console.log(`   • Horloge avant: ${this.chessGame.gameState.halfMoveClock}`);
        
        // Réinitialiser si coup de pion ou capture
        const isCapture = toPiece && toPiece.color !== fromPiece.color;
        const isPawnMove = fromPiece.type === 'pawn';
        
        if (isCapture || isPawnMove) {
            const reason = isCapture ? 'capture' : 'mouvement pion';
            this.chessGame.gameState.halfMoveClock = 0;
            
            console.log(`🔄 [MoveLogic] Horloge réinitialisée à 0 (${reason})`);
        } else {
            this.chessGame.gameState.halfMoveClock++;
            
            console.log(`📈 [MoveLogic] Horloge incrémentée: ${this.chessGame.gameState.halfMoveClock}`);
        }
        
        console.log(`🕒 [MoveLogic] Horloge après: ${this.chessGame.gameState.halfMoveClock}/50`);
    }
    
    // NOUVELLE MÉTHODE : Simuler un mouvement (pour vérification)
    simulateMove(fromSquare, toSquare) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            const fromPiece = fromSquare.piece;
            const toPiece = toSquare.piece;
            
            if (!fromPiece) return null;
            
            // Vérifier si le mouvement est valide
            const possibleMoves = this.chessGame.moveValidator.getPossibleMoves(fromPiece, fromSquare.row, fromSquare.col);
            const isValid = possibleMoves.some(move => 
                move.row === toSquare.row && move.col === toSquare.col
            );
            
            return {
                isValid: isValid,
                fromPiece: fromPiece,
                toPiece: toPiece,
                isCapture: toPiece && toPiece.color !== fromPiece.color,
                possibleMoves: possibleMoves.length
            };
        }
        
        // Mode debug
        console.log('\n🧪 [MoveLogic] === SIMULATION DE MOUVEMENT ===');
        console.log(`🧪 [MoveLogic] Simulation: [${fromSquare.row},${fromSquare.col}] → [${toSquare.row},${toSquare.col}]`);
        
        const fromPiece = fromSquare.piece;
        const toPiece = toSquare.piece;
        
        if (!fromPiece) {
            console.log('❌ [MoveLogic] Simulation: aucune pièce au départ');
            return null;
        }
        
        // Vérifier si le mouvement est valide
        const possibleMoves = this.chessGame.moveValidator.getPossibleMoves(fromPiece, fromSquare.row, fromSquare.col);
        const isValid = possibleMoves.some(move => 
            move.row === toSquare.row && move.col === toSquare.col
        );
        
        console.log(`🧪 [MoveLogic] Mouvement ${isValid ? 'VALIDE' : 'INVALIDE'}`);
        if (toPiece) {
            console.log(`🧪 [MoveLogic] Capture possible: ${toPiece.color !== fromPiece.color ? 'OUI' : 'NON (même couleur)'}`);
        }
        console.log(`🧪 [MoveLogic] Mouvements possibles: ${possibleMoves.length}`);
        
        return {
            isValid: isValid,
            fromPiece: fromPiece,
            toPiece: toPiece,
            isCapture: toPiece && toPiece.color !== fromPiece.color,
            possibleMoves: possibleMoves.length
        };
    }
    
    // NOUVELLE MÉTHODE : Obtenir un résumé du mouvement
    getMoveSummary(moveData) {
        const summary = {
            from: `${String.fromCharCode(97 + moveData.from.col)}${8 - moveData.from.row}`,
            to: `${String.fromCharCode(97 + moveData.to.col)}${8 - moveData.to.row}`,
            piece: moveData.piece,
            color: moveData.color,
            captured: moveData.captured,
            moveNumber: Math.floor(moveData.moveHistoryIndex / 2) + 1,
            playerMove: moveData.color === 'white' ? 'Blancs' : 'Noirs'
        };
        
        if (this.constructor.consoleLog) {
            console.log('📋 [MoveLogic] Résumé du mouvement:', summary);
        }
        
        return summary;
    }
    
    // NOUVELLE MÉTHODE : Annuler le dernier mouvement
    undoLastMove() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            if (this.chessGame.gameState.moveHistory.length === 0) {
                return false;
            }
            
            const lastMove = this.chessGame.gameState.moveHistory.pop();
            
            // TODO: Implémenter l'annulation du mouvement sur le plateau
            // Cette méthode nécessiterait de sauvegarder l'état du plateau avant chaque coup
            
            // Changer le tour
            this.chessGame.gameState.currentTurn = 
                this.chessGame.gameState.currentTurn === 'white' ? 'black' : 'white';
            
            return true;
        }
        
        // Mode debug
        console.log('\n↩️ [MoveLogic] === ANNULATION DU DERNIER MOUVEMENT ===');
        
        if (this.chessGame.gameState.moveHistory.length === 0) {
            console.log('❌ [MoveLogic] Aucun mouvement à annuler');
            return false;
        }
        
        const lastMove = this.chessGame.gameState.moveHistory.pop();
        
        console.log('↩️ [MoveLogic] Dernier mouvement récupéré:', lastMove);
        console.log(`↩️ [MoveLogic] Annulation: ${lastMove.piece} de ${lastMove.from.row},${lastMove.from.col} à ${lastMove.to.row},${lastMove.to.col}`);
        
        // TODO: Implémenter l'annulation du mouvement sur le plateau
        // Cette méthode nécessiterait de sauvegarder l'état du plateau avant chaque coup
        console.log('⚠️ [MoveLogic] Annulation du plateau non encore implémentée');
        
        // Changer le tour
        const oldTurn = this.chessGame.gameState.currentTurn;
        this.chessGame.gameState.currentTurn = 
            this.chessGame.gameState.currentTurn === 'white' ? 'black' : 'white';
        
        console.log(`🔄 [MoveLogic] Retour au tour précédent: ${oldTurn} → ${this.chessGame.gameState.currentTurn}`);
        console.log(`📊 [MoveLogic] Historique restant: ${this.chessGame.gameState.moveHistory.length} mouvements`);
        console.log('✅ [MoveLogic] === ANNULATION TERMINÉE ===\n');
        
        return true;
    }
}

// Initialisation statique
MoveLogic.init();

// Exposer la classe globalement
window.MoveLogic = MoveLogic;

// Ajouter des fonctions utilitaires globales
window.MoveLogicUtils = {
    // Forcer le rechargement de la config
    reloadConfig: () => MoveLogic.reloadConfig(),
    
    // Obtenir l'état actuel
    getState: () => ({
        consoleLog: MoveLogic.consoleLog,
        source: MoveLogic.getConfigSource(),
        debugMode: MoveLogic.isDebugMode(),
        configValue: window.appConfig?.debug?.console_log
    }),
    
    // Activer/désactiver manuellement (temporaire)
    setConsoleLog: (value) => {
        const oldValue = MoveLogic.consoleLog;
        MoveLogic.consoleLog = Boolean(value);
        console.log(`🔧 MoveLogic: consoleLog changé manuellement: ${oldValue} → ${MoveLogic.consoleLog}`);
        return MoveLogic.consoleLog;
    },
    
    // Tester la création d'un MoveLogic
    testMoveLogic: (chessGame) => {
        console.group('🧪 Test MoveLogic');
        const moveLogic = new MoveLogic(chessGame);
        console.log('MoveLogic créé:', moveLogic);
        console.log('Statut config:', MoveLogic.getConfigStatus());
        console.groupEnd();
        return moveLogic;
    }
};

// Méthode statique pour obtenir le statut de la configuration
MoveLogic.getConfigStatus = function() {
    return {
        consoleLog: this.consoleLog,
        source: this.getConfigSource(),
        debugMode: this.isDebugMode(),
        appConfigAvailable: !!window.appConfig,
        configValue: window.appConfig?.debug?.console_log
    };
};

// Méthode statique pour forcer la mise à jour de la configuration
MoveLogic.reloadConfig = function() {
    const oldValue = this.consoleLog;
    this.loadConfig();
    
    if (this.consoleLog && oldValue !== this.consoleLog) {
        console.log(`🔄 MoveLogic: Configuration rechargée: ${oldValue} → ${this.consoleLog}`);
    }
    return this.consoleLog;
};

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            MoveLogic.loadConfig();
            if (MoveLogic.consoleLog) {
                console.log('✅ MoveLogic: Configuration vérifiée après chargement du DOM');
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        MoveLogic.loadConfig();
    }, 100);
}

// Message final basé sur la configuration
if (MoveLogic.consoleLog) {
    console.log('✅ MoveLogic prêt (mode debug activé)');
} else {
    console.info('✅ MoveLogic prêt (mode silencieux)');
}