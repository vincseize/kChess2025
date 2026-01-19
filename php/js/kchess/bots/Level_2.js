/**
 * Level_2 - Stratégie CCMO optimisée
 * Check -> Capture -> Menace -> Optimisation
 * Version 1.6.0 - Performance focus pour Stress Test
 */
class Level_2 {
    static VERSION = '1.6.0';

    constructor() {
        this.name = "Bot Level 2 (CCMO)";
        this.level = 2;
        this.pieceValues = { 'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 100 };
    }

    async getMove() {
        const game = window.chessGame?.core || window.chessGame;
        if (!game) return { error: 'engine_not_found' };

        const color = game.gameState.currentPlayer;
        const oppColor = color === 'white' ? 'black' : 'white';
        
        const allMoves = this._getAllLegalMoves(game, color);
        if (allMoves.length === 0) return null;

        // --- 1. CAPTURES RENTABLES (C de CCMO) ---
        const captureMoves = allMoves.filter(m => m.isCapture);
        if (captureMoves.length > 0) {
            // Trier par valeur de la pièce capturée (décroissant)
            captureMoves.sort((a, b) => this.pieceValues[b.targetPiece.type] - this.pieceValues[a.targetPiece.type]);
            
            // On vérifie la sécurité des 3 meilleures captures max
            for (let i = 0; i < Math.min(captureMoves.length, 3); i++) {
                const m = captureMoves[i];
                const isAttacked = this._isSquareAttacked(game, m.toRow, m.toCol, oppColor);
                
                // On joue si : case sûre OU gain de valeur net (ex: pion prend Reine)
                if (!isAttacked || this.pieceValues[m.targetPiece.type] >= this.pieceValues[m.piece.type]) {
                    return this._finalize(m);
                }
            }
        }

        // --- 2. ÉCHECS SÉCURISÉS (C de CCMO) ---
        // Note: La détection de l'échec est coûteuse, on ne filtre que si nécessaire
        const checkMoves = allMoves.filter(m => m.isCheck); 
        if (checkMoves.length > 0) {
            const safeCheck = checkMoves.find(m => !this._isSquareAttacked(game, m.toRow, m.toCol, oppColor));
            if (safeCheck) return this._finalize(safeCheck);
        }

        // --- 3. CENTRE SAFE & DÉVELOPPEMENT (O de CCMO) ---
        // On ne calcule safeMoves qu'une seule fois ici
        const safeMoves = allMoves.filter(m => !this._isSquareAttacked(game, m.toRow, m.toCol, oppColor));
        
        if (safeMoves.length > 0) {
            // Priorité aux cases centrales
            const central = safeMoves.filter(m => m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5);
            if (central.length > 0) {
                return this._finalize(central[Math.floor(Math.random() * central.length)]);
            }
            return this._finalize(safeMoves[Math.floor(Math.random() * safeMoves.length)]);
        }

        // --- 4. FALLBACK (Désespoir) ---
        return this._finalize(allMoves[Math.floor(Math.random() * allMoves.length)]);
    }

    /**
     * Optimisation : On arrête la boucle dès qu'un attaquant est trouvé
     */
    _isSquareAttacked(game, row, col, byColor) {
        const colorKey = byColor.charAt(0).toLowerCase();
        const board = game.board;
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this._getPiece(board, r, c);
                if (p && p.color.charAt(0).toLowerCase() === colorKey) {
                    const moves = game.moveValidator.getPossibleMoves(p, r, c);
                    // Utilisation de .some() pour sortir de la boucle immédiatement si trouvé
                    if (moves && moves.some(m => m.row === row && m.col === col)) return true;
                }
            }
        }
        return false;
    }

    _getAllLegalMoves(game, color) {
        const moves = [];
        const myColorKey = color.charAt(0).toLowerCase();
        const board = game.board;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                let piece = this._getPiece(board, r, c);
                if (piece && piece.color.charAt(0).toLowerCase() === myColorKey) {
                    let pieceMoves = game.moveValidator.getPossibleMoves(piece, r, c);
                    if (pieceMoves) {
                        pieceMoves.forEach(m => {
                            let target = this._getPiece(board, m.row, m.col);
                            moves.push({
                                fromRow: r, fromCol: c, toRow: m.row, toCol: m.col,
                                piece: piece, 
                                targetPiece: target,
                                isCapture: !!target && target.color.charAt(0).toLowerCase() !== myColorKey,
                                isCheck: m.isCheck || false // Dépend de si ton moteur marque l'échec
                            });
                        });
                    }
                }
            }
        }
        return moves;
    }

    _getPiece(board, r, c) {
        try {
            let sq = board.grid ? board.grid[r][c] : (board.getPiece ? board.getPiece(r,c) : board[r][c]);
            if (!sq) return null;
            return sq.piece ? sq.piece : (sq.type ? sq : null);
        } catch(e) { return null; }
    }

    _finalize(move) {
        // Auto-promotion en Reine
        if (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
            move.promotion = 'queen';
        }
        return move;
    }
}
window.Level_2 = Level_2;