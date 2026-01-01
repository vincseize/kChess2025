/**
 * Level_1 - Le bot débutant (Aléatoire)
 * Logique : Choisit un coup au hasard parmi tous les coups légaux.
 * Intègre la communication avec les moteurs de fin de partie.
 */
class Level_1 {
    static VERSION = '1.4.1';
    static consoleLog = true;

    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log(`🤖 Level_1 (Random Bot) v${this.VERSION} chargé`);
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
    async getMove(fen) {
        const isDebug = this.constructor.consoleLog;
        try {
            // Récupération de l'instance globale
            const game = window.chessGame?.core || window.chessGame; 
            
            if (!game || !game.moveValidator) {
                console.error("❌ [Level_1] Moteur de jeu ou MoveValidator introuvable.");
                return { error: 'engine_not_found' };
            }

            const currentPlayer = game.gameState.currentPlayer;
            const validMoves = this._getAllLegalMoves(game, currentPlayer);

            if (isDebug) console.group(`🤖 Réflexion Bot (${currentPlayer})`);

            // --- CAS DE FIN DE PARTIE ---
            if (validMoves.length === 0) {
                const status = this._analyzeGameOver(fen, currentPlayer, game.moveHistory);
                
                if (isDebug) {
                    console.warn(`⚠️ Fin de partie détectée : ${status.reason}`);
                    console.groupEnd();
                }

                // On renvoie un objet structuré au lieu de null
                return { 
                    error: 'game_over', 
                    reason: status.reason, 
                    details: status.details 
                };
            }

            // --- SÉLECTION ALÉATOIRE ---
            // On ajoute un petit délai pour simuler la réflexion (500ms)
            await new Promise(resolve => setTimeout(resolve, 500));

            const selectedMove = validMoves[Math.floor(Math.random() * validMoves.length)];

            if (isDebug) {
                console.log(`🎯 Coup choisi : ${selectedMove.notation}`);
                console.groupEnd();
            }

            return selectedMove;

        } catch (error) {
            console.error(`⛔ [Level_1] Erreur critique :`, error);
            return { error: 'critical_error', message: error.message };
        }
    }

    /**
     * Analyse pourquoi le bot ne peut plus jouer
     */
    _analyzeGameOver(fen, color, history) {
        // 1. Vérifier le Mat
        const mateEngine = new ChessMateEngine(fen);
        if (mateEngine.isCheckmate(color)) {
            return { reason: 'checkmate', details: color === 'w' ? 'black' : 'white' };
        }

        // 2. Vérifier le Pat
        const patEngine = new ChessPatEngine(fen);
        if (patEngine.isStalemate(color)) {
            return { reason: 'stalemate', details: null };
        }

        // 3. Vérifier les autres nullités (matériel, répétition)
        const nulleEngine = new ChessNulleEngine(fen, history);
        const drawStatus = nulleEngine.isDraw(0); // On peut passer l'horloge réelle ici
        if (drawStatus.isDraw) {
            return { reason: 'draw', details: drawStatus.reason };
        }

        return { reason: 'unknown', details: null };
    }

    /**
     * Scanne le plateau pour trouver tous les coups possibles
     */
    _getAllLegalMoves(game, color) {
        const moves = [];
        const board = game.board;
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                let piece = this._getPieceFromBoard(board, r, c);
                
                if (piece && piece.color === color) {
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

    /**
     * Helper pour récupérer une pièce selon la structure du board
     */
    _getPieceFromBoard(board, r, c) {
        if (typeof board.getPiece === 'function') return board.getPiece(r, c);
        if (board.grid && board.grid[r]) return board.grid[r][c];
        if (board.getSquare) return board.getSquare(r, c)?.piece;
        return null;
    }

    _simpleNotation(fR, fC, tR, tC) {
        const files = 'abcdefgh';
        return `${files[fC]}${8 - fR} ➔ ${files[tC]}${8 - tR}`;
    }
}

// Initialisation
Level_1.init();
window.Level_1 = Level_1;