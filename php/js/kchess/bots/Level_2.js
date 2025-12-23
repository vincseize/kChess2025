// bots/Level_2.js - Stratégie CCMO (Check -> Capture -> Menace -> Optimisation)
if (typeof Level_2 !== 'undefined') {
    console.warn('⚠️ Level_2 existe déjà.');
} else {

class Level_2 {
    static consoleLog = true;
    static VERSION = '1.2.1';

    /**
     * Initialisation statique pour la configuration globale
     */
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log(`🤖 Level_2 v${this.VERSION} chargé (Stratégie CCMO)`);
        }
    }

    static loadConfig() {
        try {
            const rawValue = window.appConfig?.debug?.console_log ?? true;
            this.consoleLog = rawValue === "false" ? false : Boolean(rawValue);
        } catch (e) {
            this.consoleLog = true;
        }
    }

    static getConfigSource() {
        return window.appConfig ? 'JSON config' : 'default';
    }

    constructor() {
        this.name = "Bot Level 2 (CCMO)";
        this.level = 2;
        this.constructor.loadConfig();
    }

    /**
     * Point d'entrée principal pour le moteur de jeu
     */
    getMove(fen) {
        if (this.constructor.consoleLog) console.group(`🎲 [Level_2] Analyse CCMO en cours...`);
        
        try {
            const game = window.chessGame || window.gameInstance;
            if (!game?.core?.moveValidator) {
                console.error("❌ Level_2: MoveValidator introuvable.");
                return null;
            }

            // Récupération de tous les coups possibles avec leurs caractéristiques
            const allMoves = this.getAllValidMoves(game);
            
            if (allMoves.length === 0) {
                if (this.constructor.consoleLog) console.warn("Fin de partie ou aucun coup légal.");
                return null;
            }

            // --- APPLICATION DE LA STRATÉGIE CCMO ---

            // 1. CHECK (Mise en échec du Roi adverse)
            const checkMoves = allMoves.filter(m => m.isCheck);
            if (checkMoves.length > 0) return this.finalizeMove(checkMoves, 'CHECK (Echec)');

            // 2. CAPTURE (Gains de pièces)
            const captureMoves = allMoves.filter(m => m.isCapture);
            if (captureMoves.length > 0) {
                // Optionnel: Trier par valeur de pièce capturée ici si besoin
                return this.finalizeMove(captureMoves, 'CAPTURE');
            }

            // 3. MENACE (Contrôle du centre et sécurité)
            const threatMoves = this.getThreatMoves(allMoves, game);
            if (threatMoves.length > 0) return this.finalizeMove(threatMoves, 'MENACE (Positionnement)');

            // 4. OPTIMISATION (Développement par défaut)
            return this.finalizeMove(allMoves, 'OPTIMISATION (Aléatoire)');

        } catch (error) {
            console.error("❌ Erreur critique Level_2:", error);
            return null;
        } finally {
            if (this.constructor.consoleLog) console.groupEnd();
        }
    }

    /**
     * Analyse chaque mouvement légal pour identifier captures et échecs
     */
    getAllValidMoves(game) {
        const moves = [];
        const player = game.gameState.currentPlayer;
        const opponentColor = player === 'white' ? 'black' : 'white';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = game.board.getPiece(r, c);
                if (piece && piece.color === player) {
                    const targets = game.core.moveValidator.getPossibleMoves(piece, r, c);
                    
                    targets.forEach(t => {
                        const targetPiece = game.board.getPiece(t.row, t.col);
                        
                        // Simulation rapide pour voir si le coup met en échec
                        const isCheck = this.simulatesCheck(game, piece, r, c, t.row, t.col, opponentColor);

                        moves.push({
                            fromRow: r, fromCol: c,
                            toRow: t.row, toCol: t.col,
                            piece: piece,
                            targetPiece: targetPiece,
                            isCapture: !!targetPiece && targetPiece.color !== piece.color,
                            isCheck: isCheck,
                            notation: `${String.fromCharCode(97 + c)}${8 - r}→${String.fromCharCode(97 + t.col)}${8 - t.row}`
                        });
                    });
                }
            }
        }
        return moves;
    }

    /**
     * Filtre les coups "Menace" : cases sûres + contrôle stratégique
     */
    getThreatMoves(moves, game) {
        const opponentColor = game.gameState.currentPlayer === 'white' ? 'black' : 'white';
        
        return moves.filter(m => {
            // Sécurité : Ne pas se déplacer sur une case attaquée par l'adversaire
            const isSafe = !this.isSquareAttacked(game, m.toRow, m.toCol, opponentColor);
            
            // Stratégie : Favoriser le centre (cases d4, d5, e4, e5 et alentours)
            const isCentral = m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5;
            
            // Stratégie : Sortir les pièces mineures au début
            const isDevelopment = ['knight', 'bishop'].includes(m.piece.type);

            return isSafe && (isCentral || isDevelopment);
        });
    }

    /**
     * Vérifie si une case est sous le feu de l'ennemi
     */
    isSquareAttacked(game, row, col, byColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = game.board.getPiece(r, c);
                if (p && p.color === byColor) {
                    // Note: On utilise ici une version simplifiée pour éviter la récursion
                    // On regarde si la pièce peut théoriquement atteindre la case
                    const moves = game.core.moveValidator.getPossibleMoves(p, r, c);
                    if (moves.some(m => m.row === row && m.col === col)) return true;
                }
            }
        }
        return false;
    }

    /**
     * Simule si le mouvement provoque un échec au Roi adverse
     */
    simulatesCheck(game, piece, fR, fC, tR, tC, opponentColor) {
        // Cette logique repose sur le fait que le moveValidator peut 
        // détecter si le roi adverse est en prise après le coup
        // Pour le Level 2, on vérifie si la pièce menace le roi sur sa nouvelle case
        const movesAfter = game.core.moveValidator.getPossibleMoves(piece, tR, tC);
        return movesAfter.some(m => {
            const target = game.board.getPiece(m.row, m.col);
            return target && target.type === 'king' && target.color === opponentColor;
        });
    }

    /**
     * Choisi un coup aléatoire parmi la liste filtrée par la meilleure stratégie disponible
     */
    finalizeMove(moveList, strategy) {
        const move = moveList[Math.floor(Math.random() * moveList.length)];
        if (this.constructor.consoleLog) {
            console.log(`🎯 Stratégie [${strategy}]`);
            console.log(`👉 Sélection : ${move.notation} (${move.piece.type})`);
        }
        return move;
    }
}

// Initialisation
Level_2.init();
window.Level_2 = Level_2;

}