/**
 * Level_1 - Le bot débutant (Aléatoire)
 * Logique : Choisit un coup au hasard parmi tous les coups légaux.
 */
class Level_1 {
    static consoleLog = true;

    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log('🤖 Level_1 (Random Bot) chargé');
    }

    static loadConfig() {
        try {
            const config = window.appConfig?.debug?.console_log ?? true;
            this.consoleLog = String(config) !== "false";
        } catch (e) { this.consoleLog = true; }
    }

    constructor() {
        this.name = "Bot Level 1";
        this.level = 1;
        this.constructor.loadConfig();
    }

    /**
     * Calcule le prochain coup
     */
    getMove(fen) {
        const isDebug = this.constructor.consoleLog;
        try {
            // On récupère l'instance globale du jeu
            const game = window.chessGame?.core || window.chessGame; 
            
            if (!game || !game.moveValidator) {
                console.error("❌ [Level_1] Moteur de jeu ou MoveValidator introuvable.");
                return null;
            }

            const currentPlayer = game.gameState.currentPlayer;
            const validMoves = this._getAllLegalMoves(game, currentPlayer);

            if (isDebug) console.group(`🤖 Réflexion Bot (${currentPlayer})`);

            if (validMoves.length === 0) {
                if (isDebug) {
                    console.warn(`⚠️ Aucune solution (Pat ou Mat).`);
                    console.groupEnd();
                }
                return null;
            }

            // Sélection aléatoire d'un coup
            const selectedMove = validMoves[Math.floor(Math.random() * validMoves.length)];

            if (isDebug) {
                console.log(`🎯 Coup choisi : ${selectedMove.notation}`);
                console.groupEnd();
            }

            return selectedMove;

        } catch (error) {
            console.error(`⛔ [Level_1] Erreur critique lors du calcul du coup :`, error);
            return null;
        }
    }

    /**
     * Scanne le plateau pour trouver tous les coups possibles de l'IA
     */
    _getAllLegalMoves(game, color) {
        const moves = [];
        const board = game.board;
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                // Tentative de récupération de la pièce de manière ultra-compatible
                let piece = null;
                if (typeof board.getPiece === 'function') {
                    piece = board.getPiece(r, c);
                } else if (board.grid && board.grid[r]) {
                    piece = board.grid[r][c];
                } else if (board.getSquare) {
                    piece = board.getSquare(r, c)?.piece;
                }
                
                if (piece && piece.color === color) {
                    // On demande au validateur tous les coups pour cette pièce
                    const pieceMoves = game.moveValidator.getPossibleMoves(piece, r, c);
                    
                    if (pieceMoves && Array.isArray(pieceMoves)) {
                        pieceMoves.forEach(m => {
                            moves.push({
                                fromRow: r,
                                fromCol: c,
                                toRow: m.row,
                                toCol: m.col,
                                piece: piece,
                                notation: this._simpleNotation(r, c, m.row, m.col)
                            });
                        });
                    }
                }
            }
        }
        return moves;
    }

    _simpleNotation(fR, fC, tR, tC) {
        const files = 'abcdefgh';
        return `${files[fC]}${8 - fR} ➔ ${files[tC]}${8 - tR}`;
    }
}

// Initialisation
Level_1.init();
window.Level_1 = Level_1;