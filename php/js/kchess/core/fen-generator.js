/**
 * core/fen-generator.js
 * Générateur de notation FEN (Forsyth-Edwards Notation)
 * Gère la conversion de l'état du jeu et du plateau en chaîne de caractères standard.
 */
class FENGenerator {
    
    static consoleLog = true; 
    
    /**
     * Initialise le générateur avec la configuration globale
     */
    static init() {
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('📄 core/fen-generator.js chargé');
        } else {
            console.info('📄 FENGenerator: Mode silencieux activé');
        }
    }
    
    static loadConfig() {
        try {
            if (window.appConfig?.debug) {
                this.consoleLog = window.appConfig.debug.console_log ?? true;
            } else if (typeof window.getConfig === 'function') {
                this.consoleLog = window.getConfig('debug.console_log') ?? true;
            }
        } catch (error) {
            this.consoleLog = true;
        }
    }

    /**
     * MÉTHODE PRINCIPALE : Génère la FEN complète
     * @param {Object} gameState - État actuel (tour, roques, en passant)
     * @param {Object} board - Le plateau (UI ou Logique)
     */
    static generateFEN(gameState, board) {
        if (!gameState || !board) {
            console.error('❌ [FENGenerator] Paramètres manquants pour générer la FEN');
            return null;
        }

        if (this.consoleLog) console.group('📄 [FENGenerator] Génération');

        try {
            // 1. Position des pièces (Le plateau)
            const boardPart = this.generateBoardPart(board);
            
            // 2. Trait au joueur (w/b)
            const currentPlayer = gameState.currentPlayer === 'white' ? 'w' : 'b';
            
            // 3. Droits de roque
            const castlingRights = this.generateCastlingRights(gameState, board);
            
            // 4. Case en passant
            const enPassant = gameState.enPassantTarget || '-';
            
            // 5. Horloges (50 coups et numéro de tour)
            const halfMoves = gameState.halfMoveClock ?? 0;
            const fullMoves = Math.floor((gameState.moveHistory?.length || 0) / 2) + 1;
            
            const fen = `${boardPart} ${currentPlayer} ${castlingRights} ${enPassant} ${halfMoves} ${fullMoves}`;
            
            if (this.consoleLog) {
                console.log(`✅ FEN: ${fen}`);
                this.validateFEN(fen);
                console.groupEnd();
            }
            
            return fen;
        } catch (error) {
            console.error('❌ [FENGenerator] Erreur critique:', error);
            console.groupEnd();
            return '8/8/8/8/8/8/8/8 w - - 0 1'; // FEN de secours (vide)
        }
    }

    /**
     * Génère la structure du plateau (ex: rnbqkbnr/pppppppp/...)
     */
    static generateBoardPart(board) {
        let fenRows = [];
        
        for (let row = 0; row < 8; row++) {
            let rowStr = '';
            let emptyCount = 0;
            
            for (let col = 0; col < 8; col++) {
                // PONT DE COMPATIBILITÉ : On gère board.getSquare(r,c) et board.grid[r][c]
                let square = null;
                if (typeof board.getSquare === 'function') {
                    square = board.getSquare(row, col);
                } else if (board.grid) {
                    square = board.grid[row][col];
                }

                // Récupération de la pièce (qu'elle soit dans .piece ou directe)
                const piece = square?.piece || (square?.type ? square : null);

                if (!piece) {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        rowStr += emptyCount;
                        emptyCount = 0;
                    }
                    rowStr += this.getPieceChar(piece);
                }
            }
            
            if (emptyCount > 0) rowStr += emptyCount;
            fenRows.push(rowStr);
        }
        
        const finalBoard = fenRows.join('/');

        // Alerte si le plateau est vide (ce qui cause le bug du Stalemate)
        if (finalBoard === '8/8/8/8/8/8/8/8') {
            console.warn('⚠️ [FENGenerator] Le plateau généré est vide ! Vérifiez la source "board".');
        }

        return finalBoard;
    }

    /**
     * Calcule les droits de roque (KQkq)
     */
    static generateCastlingRights(gameState, board) {
        let rights = '';
        
        // Sécurité : si les données de mouvement sont absentes, on assume aucun droit
        if (!gameState.hasKingMoved) return '-';

        if (this.canCastle(gameState, board, 'white', 'kingside')) rights += 'K';
        if (this.canCastle(gameState, board, 'white', 'queenside')) rights += 'Q';
        if (this.canCastle(gameState, board, 'black', 'kingside')) rights += 'k';
        if (this.canCastle(gameState, board, 'black', 'queenside')) rights += 'q';
        
        return rights || '-';
    }

    /**
     * Vérifie si un roque est théoriquement possible pour la FEN
     */
    static canCastle(gameState, board, color, side) {
        const row = (color === 'white') ? 7 : 0;
        const rookCol = (side === 'kingside') ? 7 : 0;

        // 1. Le roi a-t-il bougé ?
        if (gameState.hasKingMoved?.[color]) return false;

        // 2. La tour a-t-elle bougé ?
        if (gameState.hasRookMoved?.[color]?.[side]) return false;

        // 3. Vérification de la présence des pièces (pour éviter les erreurs de FEN sur plateau vide)
        const getP = (r, c) => {
            const s = typeof board.getSquare === 'function' ? board.getSquare(r, c) : board.grid?.[r][c];
            return s?.piece || (s?.type ? s : null);
        };

        const king = getP(row, 4);
        const rook = getP(row, rookCol);

        if (king?.type !== 'king' || king?.color !== color) return false;
        if (rook?.type !== 'rook' || rook?.color !== color) return false;

        return true;
    }

    /**
     * Mappe une pièce vers son caractère FEN
     */
    static getPieceChar(piece) {
        const map = {
            'white': { 'king':'K', 'queen':'Q', 'rook':'R', 'bishop':'B', 'knight':'N', 'pawn':'P' },
            'black': { 'king':'k', 'queen':'q', 'rook':'r', 'bishop':'b', 'knight':'n', 'pawn':'p' }
        };
        
        try {
            return map[piece.color][piece.type];
        } catch (e) {
            console.error('❌ [FENGenerator] Pièce invalide:', piece);
            return '';
        }
    }

    /**
     * Valide le format de la FEN générée
     */
    static validateFEN(fen) {
        const parts = fen.split(' ');
        if (parts.length !== 6) {
            console.error('⚠️ [FENGenerator] Format FEN invalide (doit avoir 6 segments)');
            return false;
        }
        return true;
    }

    static getConfigSource() {
        if (window.appConfig) return 'window.appConfig';
        return 'default';
    }
}

// Initialisation immédiate
FENGenerator.init();
window.FENGenerator = FENGenerator;