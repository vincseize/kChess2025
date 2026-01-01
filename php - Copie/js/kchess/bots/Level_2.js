/**
 * Level_2 - Stratégie CCMO optimisée
 * Check -> Capture -> Menace -> Optimisation
 */
class Level_2 {
    static consoleLog = true;
    static VERSION = '1.3.1';

    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log(`🤖 Level_2 v${this.VERSION} prêt (Stratégie CCMO)`);
    }

    static loadConfig() {
        try {
            const config = window.appConfig?.debug?.console_log ?? true;
            this.consoleLog = String(config) !== "false";
        } catch (e) { this.consoleLog = true; }
    }

    constructor() {
        this.name = "Bot Level 2 (CCMO)";
        this.level = 2;
        this.pieceValues = { 'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 100 };
    }

    getMove(fen) {
        const isDebug = this.constructor.consoleLog;
        if (isDebug) console.group(`🎲 [Level_2] Analyse CCMO...`);
        
        try {
            // Utilisation du même accès que Level_1 pour la compatibilité
            const game = window.chessGame?.core || window.chessGame;
            const allMoves = this.getAllValidMoves(game);
            
            if (allMoves.length === 0) return null;

            const oppColor = this._getOpponentColor(game);

            // 1. CAPTURE : Chercher le gain matériel (Priorité avant le Check car manger est souvent mieux)
            const captureMoves = allMoves.filter(m => m.isCapture);
            if (captureMoves.length > 0) {
                // Trier par valeur de la pièce cible (manger la Reine d'abord)
                captureMoves.sort((a, b) => this.pieceValues[b.targetPiece.type] - this.pieceValues[a.targetPiece.type]);
                
                // On ne prend que les captures qui ne sont pas des suicides (sauf si on mange plus gros)
                const safeCaptures = captureMoves.filter(m => {
                    const valAttacker = this.pieceValues[m.piece.type];
                    const valTarget = this.pieceValues[m.targetPiece.type];
                    const isAttacked = this.isSquareAttacked(game, m.toRow, m.toCol, oppColor);
                    return !isAttacked || (valTarget >= valAttacker);
                });

                if (safeCaptures.length > 0) return this.finalizeMove(safeCaptures, 'CAPTURE');
            }

            // 2. CHECK : Mettre en échec (si c'est safe)
            const checkMoves = allMoves.filter(m => m.isCheck);
            const safeChecks = checkMoves.filter(m => !this.isSquareAttacked(game, m.toRow, m.toCol, oppColor));
            if (safeChecks.length > 0) return this.finalizeMove(safeChecks, 'CHECK');

            // 3. MENACE / CENTRE : Cases sûres au centre
            const centralMoves = allMoves.filter(m => {
                const isSafe = !this.isSquareAttacked(game, m.toRow, m.toCol, oppColor);
                const isCentral = m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5;
                return isSafe && isCentral;
            });
            if (centralMoves.length > 0) return this.finalizeMove(centralMoves, 'POSITIONNEMENT');

            // 4. OPTIMISATION : Coup par défaut (parmi les coups jugés sûrs)
            const absoluteSafeMoves = allMoves.filter(m => !this.isSquareAttacked(game, m.toRow, m.toCol, oppColor));
            return this.finalizeMove(absoluteSafeMoves.length > 0 ? absoluteSafeMoves : allMoves, 'DEVELOPPEMENT');

        } catch (error) {
            console.error("❌ Level_2 Error:", error);
            return null;
        } finally {
            if (isDebug) console.groupEnd();
        }
    }

    getAllValidMoves(game) {
        const moves = [];
        const player = game.gameState.currentPlayer;
        const board = game.board;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board.getPiece?.(r, c) || board.getSquare?.(r, c)?.piece;
                
                if (piece && piece.color === player) {
                    const targets = game.moveValidator.getPossibleMoves(piece, r, c);
                    
                    targets.forEach(t => {
                        const targetPiece = board.getPiece?.(t.row, t.col) || board.getSquare?.(t.row, t.col)?.piece;
                        moves.push({
                            fromRow: r, fromCol: c, toRow: t.row, toCol: t.col,
                            piece: piece,
                            targetPiece: targetPiece,
                            isCapture: !!targetPiece && targetPiece.color !== player,
                            isCheck: this.checkIfMoveGivesCheck(game, piece, r, c, t.row, t.col),
                            notation: this._simpleNotation(r, c, t.row, t.col)
                        });
                    });
                }
            }
        }
        return moves;
    }

    // Version simplifiée pour Level 2 : Est-ce qu'on attaque le roi après le coup ?
    checkIfMoveGivesCheck(game, piece, fR, fC, tR, tC) {
        const oppColor = this._getOpponentColor(game);
        // On récupère les cases que la pièce contrôlera APRES le mouvement
        const nextMoves = game.moveValidator.getPossibleMoves(piece, tR, tC);
        return nextMoves.some(m => {
            const p = game.board.getPiece?.(m.row, m.col) || game.board.getSquare?.(m.row, m.col)?.piece;
            return p && p.type === 'king' && p.color === oppColor;
        });
    }

    isSquareAttacked(game, row, col, byColor) {
        const board = game.board;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board.getPiece?.(r, c) || board.getSquare?.(r, c)?.piece;
                if (p && p.color === byColor) {
                    const moves = game.moveValidator.getPossibleMoves(p, r, c);
                    if (moves.some(m => m.row === row && m.col === col)) return true;
                }
            }
        }
        return false;
    }

    finalizeMove(moveList, strategy) {
        const move = moveList[Math.floor(Math.random() * moveList.length)];
        if (this.constructor.consoleLog) console.log(`🎯 [${strategy}] ${move.notation}`);
        return move;
    }

    _getOpponentColor(game) {
        return game.gameState.currentPlayer === 'white' ? 'black' : 'white';
    }

    _simpleNotation(fR, fC, tR, tC) {
        const files = 'abcdefgh';
        return `${files[fC]}${8 - fR} ➔ ${files[tC]}${8 - tR}`;
    }
}

Level_2.init();
window.Level_2 = Level_2;