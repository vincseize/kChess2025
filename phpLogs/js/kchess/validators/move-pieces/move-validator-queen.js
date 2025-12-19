// validators/move-pieces/move-validator-queen.js - Version utilisant la configuration JSON comme priorité
if (typeof QueenMoveValidator !== 'undefined') {
    console.warn('⚠️ QueenMoveValidator existe déjà. Vérifiez les doublons dans les imports.');
} else {

class QueenMoveValidator {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('👑 validators/move-pieces/move-validator-queen.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('👑 QueenMoveValidator: Mode silencieux activé (debug désactivé dans config)');
        }
    }
    
    // Méthode pour charger la configuration
    static loadConfig() {
        try {
            if (window.appConfig && window.appConfig.chess_engine) {
                // Configuration prioritaire: window.appConfig
                if (window.appConfig.chess_engine.console_log !== undefined) {
                    this.consoleLog = window.appConfig.chess_engine.console_log;
                }
                
                if (this.consoleLog) {
                    console.log('👑 Configuration chargée depuis window.appConfig');
                }
            } else if (window.chessConfig) {
                // Configuration secondaire: window.chessConfig (pour compatibilité)
                if (window.chessConfig.debug !== undefined) {
                    this.consoleLog = window.chessConfig.debug;
                }
                
                if (this.consoleLog) {
                    console.log('👑 Configuration chargée depuis window.chessConfig (legacy)');
                }
            } else {
                // Fallback: valeurs par défaut
                if (this.consoleLog) {
                    console.log('👑 Configuration: valeurs par défaut utilisées');
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement de la configuration:', error);
            // Garder les valeurs par défaut en cas d'erreur
        }
    }
    
    // Méthode pour déterminer la source de la configuration
    static getConfigSource() {
        if (window.appConfig && window.appConfig.chess_engine) {
            return 'window.appConfig';
        } else if (window.chessConfig) {
            return 'window.chessConfig (legacy)';
        } else {
            return 'valeur par défaut';
        }
    }

    constructor(board, gameState) {
        this.board = board;
        this.gameState = gameState;
        
        if (this.constructor.consoleLog) {
            console.log('🔧 QueenMoveValidator initialisé');
            console.log(`  - Board: ${board ? '✓' : '✗'}`);
            console.log(`  - GameState: ${gameState ? '✓' : '✗'}`);
        }
    }

    getPossibleMoves(piece, row, col) {
        if (this.constructor.consoleLog) {
            console.log(`\n👑🔍 Recherche mouvements pour reine ${piece.color} en [${row},${col}]`);
        }
        
        const pieceColor = piece.color;

        // La reine combine les mouvements du fou et de la tour
        const bishopValidator = new BishopMoveValidator(this.board, this.gameState);
        const rookValidator = new RookMoveValidator(this.board, this.gameState);
        
        if (this.constructor.consoleLog) {
            console.log(`👑 Composition: Fou + Tour`);
        }
        
        const bishopMoves = bishopValidator.getPossibleMoves(piece, row, col);
        const rookMoves = rookValidator.getPossibleMoves(piece, row, col);
        
        const allMoves = [...bishopMoves, ...rookMoves];
        
        if (this.constructor.consoleLog) {
            console.log(`👑 Reine ${pieceColor} en [${row},${col}]:`);
            console.log(`  - Mouvements diagonaux (Fou): ${bishopMoves.length}`);
            console.log(`  - Mouvements orthogonaux (Tour): ${rookMoves.length}`);
            console.log(`  - TOTAL: ${allMoves.length} mouvements valides`);
            
            if (allMoves.length > 0 && this.constructor.consoleLog) {
                console.log(`  Détail des mouvements:`);
                allMoves.forEach((move, index) => {
                    const typeIcon = move.type === 'capture' ? '⚔️' : ' ';
                    const isFromBishop = bishopMoves.some(bm => bm.row === move.row && bm.col === move.col);
                    const isFromRook = rookMoves.some(rm => rm.row === move.row && rm.col === move.col);
                    const source = isFromBishop && isFromRook ? 'Les deux' : isFromBishop ? 'Fou' : 'Tour';
                    console.log(`  ${index + 1}. [${move.row},${move.col}] ${typeIcon} (via ${source})`);
                });
            }
        }
        
        return allMoves;
    }
}

// Initialisation statique
QueenMoveValidator.init();

window.QueenMoveValidator = QueenMoveValidator;

} // Fin du if de protection