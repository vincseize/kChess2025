// checkFenPosition.js - Vérificateur de notation FEN et validation de position
class ChessFenPosition {
    
    /**
     * Vérifie si une chaîne FEN est valide
     * @param {string} fen - La chaîne FEN à vérifier
     * @returns {boolean} - true si le FEN est valide, false sinon
     */
    static isValid(fen) {
        try {
            if (!fen || typeof fen !== 'string') {
                console.log('❌ FEN invalide: pas une chaîne');
                return false;
            }

            const parts = fen.trim().split(' ');
            
            // Un FEN doit avoir 6 parties
            if (parts.length !== 6) {
                console.log('❌ FEN invalide: doit avoir 6 parties');
                return false;
            }

            const [board, turn, castling, enPassant, halfMove, fullMove] = parts;

            // 1. Vérification syntaxique de base
            if (!this.isValidBasicFen(board, turn, castling, enPassant, halfMove, fullMove)) {
                return false;
            }

            // 2. Parse le plateau
            const boardState = this.parseBoard(board);
            
            // 3. Vérifications logiques avancées
            if (!this.hasExactlyOneKingEach(boardState)) {
                console.log('❌ Position invalide: nombre de rois incorrect');
                return false;
            }

            if (!this.isKingSafetyValid(boardState, turn)) {
                console.log('❌ Position invalide: rois en situation impossible');
                return false;
            }

            if (!this.isPawnStructureValid(boardState)) {
                console.log('❌ Position invalide: structure de pions impossible');
                return false;
            }

            if (!this.isCastlingRightsValid(boardState, castling)) {
                console.log('❌ Position invalide: droits de roque incohérents');
                return false;
            }

            if (!this.isEnPassantValid(boardState, enPassant, turn)) {
                console.log('❌ Position invalide: prise en passant incohérente');
                return false;
            }

            if (!this.isPieceCountValid(boardState)) {
                console.log('❌ Position invalide: nombre de pièces impossible');
                return false;
            }

            if (!this.isBishopConfigurationValid(boardState)) {
                console.log('❌ Position invalide: configuration des fous impossible');
                return false;
            }

            console.log('✅ Position FEN valide:', fen);
            return true;

        } catch (error) {
            console.log('❌ Erreur lors de la validation FEN:', error);
            return false;
        }
    }

    /**
     * Vérification syntaxique de base du FEN
     */
    static isValidBasicFen(board, turn, castling, enPassant, halfMove, fullMove) {
        // Plateau
        const rows = board.split('/');
        if (rows.length !== 8) {
            console.log('❌ Plateau doit avoir 8 rangées');
            return false;
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            let squareCount = 0;
            
            for (const char of row) {
                if (/^[KQRBNPkqrbnp]$/.test(char)) {
                    squareCount++;
                } else if (/^[1-8]$/.test(char)) {
                    squareCount += parseInt(char);
                } else {
                    console.log(`❌ Caractère invalide '${char}' dans la rangée ${8-i}`);
                    return false;
                }
            }
            
            if (squareCount !== 8) {
                console.log(`❌ Rangée ${8-i} a ${squareCount} cases au lieu de 8`);
                return false;
            }
        }

        // Tour
        if (!/^[wb]$/.test(turn)) {
            console.log(`❌ Tour invalide: '${turn}' (doit être 'w' ou 'b')`);
            return false;
        }

        // Roque
        if (castling !== '-' && !/^[KQkq]+$/.test(castling)) {
            console.log(`❌ Droits de roque invalides: '${castling}'`);
            return false;
        }

        // Prise en passant
        if (enPassant !== '-' && !/^[a-h][36]$/.test(enPassant)) {
            console.log(`❌ Prise en passant invalide: '${enPassant}'`);
            return false;
        }

        // Compteurs
        if (!/^\d+$/.test(halfMove) || !/^\d+$/.test(fullMove)) {
            console.log('❌ Compteurs de coups invalides');
            return false;
        }
        
        const halfMoveNum = parseInt(halfMove);
        const fullMoveNum = parseInt(fullMove);
        
        if (halfMoveNum < 0 || fullMoveNum < 1) {
            console.log('❌ Compteurs de coups hors limites');
            return false;
        }

        return true;
    }

    /**
     * Parse le plateau en structure de données
     */
    static parseBoard(board) {
        const state = {
            pieces: [],
            white: { king: null, pieces: [] },
            black: { king: null, pieces: [] },
            pieceCount: {
                K: 0, Q: 0, R: 0, B: 0, N: 0, P: 0,
                k: 0, q: 0, r: 0, b: 0, n: 0, p: 0
            }
        };

        const rows = board.split('/');
        
        for (let row = 0; row < 8; row++) {
            let col = 0;
            for (const char of rows[row]) {
                if (/^[1-8]$/.test(char)) {
                    const emptySquares = parseInt(char);
                    for (let i = 0; i < emptySquares; i++) {
                        state.pieces.push({ row, col: col + i, piece: null });
                    }
                    col += emptySquares;
                } else {
                    const piece = { row, col, piece: char };
                    state.pieces.push(piece);
                    
                    // Compter les pièces
                    state.pieceCount[char]++;
                    
                    // Stocker les rois
                    if (char === 'K') state.white.king = { row, col };
                    if (char === 'k') state.black.king = { row, col };
                    
                    // Stocker toutes les pièces par couleur
                    if (/^[KQRBNP]$/.test(char)) {
                        state.white.pieces.push(piece);
                    } else {
                        state.black.pieces.push(piece);
                    }
                    
                    col++;
                }
            }
        }

        return state;
    }

    /**
     * Vérifie qu'il y a exactement 1 roi de chaque couleur
     */
    static hasExactlyOneKingEach(boardState) {
        const hasWhiteKing = boardState.pieceCount.K === 1;
        const hasBlackKing = boardState.pieceCount.k === 1;
        
        if (!hasWhiteKing) console.log('❌ Doit avoir exactement 1 roi blanc');
        if (!hasBlackKing) console.log('❌ Doit avoir exactement 1 roi noir');
        
        return hasWhiteKing && hasBlackKing;
    }

    /**
     * Vérifie la sécurité des rois (ils ne peuvent pas être adjacents)
     */
    static isKingSafetyValid(boardState, turn) {
        const whiteKing = boardState.white.king;
        const blackKing = boardState.black.king;

        if (!whiteKing || !blackKing) return false;

        // Les rois ne peuvent pas être adjacents
        const rowDiff = Math.abs(whiteKing.row - blackKing.row);
        const colDiff = Math.abs(whiteKing.col - blackKing.col);
        
        if (rowDiff <= 1 && colDiff <= 1) {
            console.log('❌ Rois adjacents - position impossible');
            return false;
        }

        return true;
    }

    /**
     * Vérifie la structure des pions
     */
    static isPawnStructureValid(boardState) {
        // Les pions ne peuvent pas être sur la première ou dernière rangée
        for (const piece of boardState.pieces) {
            if (piece.piece === 'P' && (piece.row === 0 || piece.row === 7)) {
                console.log('❌ Pion blanc sur rangée impossible:', piece.row);
                return false;
            }
            if (piece.piece === 'p' && (piece.row === 0 || piece.row === 7)) {
                console.log('❌ Pion noir sur rangée impossible:', piece.row);
                return false;
            }
        }

        return true;
    }

    /**
     * Vérifie la cohérence des droits de roque
     */
    static isCastlingRightsValid(boardState, castling) {
        if (castling === '-') return true;

        // Vérifier que les rois sont bien sur leur case de départ
        if (castling.includes('K') && (!boardState.white.king || boardState.white.king.row !== 7 || boardState.white.king.col !== 4)) {
            console.log('❌ Droit de roque blanc côté roi mais roi pas en e1');
            return false;
        }
        if (castling.includes('Q') && (!boardState.white.king || boardState.white.king.row !== 7 || boardState.white.king.col !== 4)) {
            console.log('❌ Droit de roque blanc côté dame mais roi pas en e1');
            return false;
        }
        if (castling.includes('k') && (!boardState.black.king || boardState.black.king.row !== 0 || boardState.black.king.col !== 4)) {
            console.log('❌ Droit de roque noir côté roi mais roi pas en e8');
            return false;
        }
        if (castling.includes('q') && (!boardState.black.king || boardState.black.king.row !== 0 || boardState.black.king.col !== 4)) {
            console.log('❌ Droit de roque noir côté dame mais roi pas en e8');
            return false;
        }

        return true;
    }

    /**
     * Vérifie la cohérence de la prise en passant
     */
    static isEnPassantValid(boardState, enPassant, turn) {
        if (enPassant === '-') return true;

        const col = enPassant.charCodeAt(0) - 97; // a->0, b->1, etc.
        const row = 8 - parseInt(enPassant[1]);   // 3->5, 6->2

        // La case de prise en passant doit être vide
        if (this.hasPieceAt(boardState, row, col)) {
            console.log('❌ Case de prise en passant non vide');
            return false;
        }

        return true;
    }

    /**
     * Vérifie le nombre total de pièces (limites réalistes)
     */
    static isPieceCountValid(boardState) {
        const counts = boardState.pieceCount;

        // Maximum 16 pièces par couleur (règle de base)
        const whiteCount = counts.K + counts.Q + counts.R + counts.B + counts.N + counts.P;
        const blackCount = counts.k + counts.q + counts.r + counts.b + counts.n + counts.p;
        
        if (whiteCount > 16 || blackCount > 16) {
            console.log('❌ Trop de pièces sur l\'échiquier');
            return false;
        }

        // LIMITES RÉALISTES APRÈS PROMOTIONS
        // Maximum 9 dames (1 originale + 8 promotions)
        if (counts.Q > 9 || counts.q > 9) {
            console.log('❌ Trop de dames (max 9 par couleur)');
            return false;
        }

        // Maximum 10 tours (2 originales + 8 promotions)  
        if (counts.R > 10 || counts.r > 10) {
            console.log('❌ Trop de tours (max 10 par couleur)');
            return false;
        }

        // Maximum 10 fous (2 originaux + 8 promotions)
        if (counts.B > 10 || counts.b > 10) {
            console.log('❌ Trop de fous (max 10 par couleur)');
            return false;
        }

        // Maximum 10 cavaliers (2 originaux + 8 promotions)
        if (counts.N > 10 || counts.n > 10) {
            console.log('❌ Trop de cavaliers (max 10 par couleur)');
            return false;
        }

        // Maximum 8 pions (pas de promotion en pion)
        if (counts.P > 8 || counts.p > 8) {
            console.log('❌ Trop de pions (max 8 par couleur)');
            return false;
        }

        // Vérification cohérence : au moins 1 pièce de chaque couleur
        if (whiteCount === 0 || blackCount === 0) {
            console.log('❌ Au moins une couleur n\'a aucune pièce');
            return false;
        }

        // Vérification des promotions réalistes
        if (!this.isPromotionScenarioRealistic(counts)) {
            console.log('❌ Scénario de promotion irréaliste');
            return false;
        }

        return true;
    }

    /**
     * Vérifie si le scénario de promotion est réaliste
     */
    static isPromotionScenarioRealistic(counts) {
        // Calcul du nombre de pièces promotionnelles supplémentaires
        const whiteExtraQueens = Math.max(0, counts.Q - 1);
        const whiteExtraRooks = Math.max(0, counts.R - 2); 
        const whiteExtraBishops = Math.max(0, counts.B - 2);
        const whiteExtraKnights = Math.max(0, counts.N - 2);

        const blackExtraQueens = Math.max(0, counts.q - 1);
        const blackExtraRooks = Math.max(0, counts.r - 2);
        const blackExtraBishops = Math.max(0, counts.b - 2);
        const blackExtraKnights = Math.max(0, counts.n - 2);

        // Total des promotions
        const whitePromotions = whiteExtraQueens + whiteExtraRooks + whiteExtraBishops + whiteExtraKnights;
        const blackPromotions = blackExtraQueens + blackExtraRooks + blackExtraBishops + blackExtraKnights;

        // On ne peut pas avoir plus de promotions que de pions disparus
        const whiteMissingPawns = 8 - counts.P;
        const blackMissingPawns = 8 - counts.p;

        if (whitePromotions > whiteMissingPawns) {
            console.log(`❌ Promotions blanches impossibles: ${whitePromotions} promotions mais seulement ${whiteMissingPawns} pions manquants`);
            return false;
        }

        if (blackPromotions > blackMissingPawns) {
            console.log(`❌ Promotions noires impossibles: ${blackPromotions} promotions mais seulement ${blackMissingPawns} pions manquants`);
            return false;
        }

        return true;
    }

    /**
     * Vérification supplémentaire : configuration réaliste des fous
     */
    static isBishopConfigurationValid(boardState) {
        // Maximum 2 fous de même couleur de case par camp
        const whiteLightBishops = this.countBishopsOnColor(boardState, 'white', 'light');
        const whiteDarkBishops = this.countBishopsOnColor(boardState, 'white', 'dark');
        const blackLightBishops = this.countBishopsOnColor(boardState, 'black', 'light');
        const blackDarkBishops = this.countBishopsOnColor(boardState, 'black', 'dark');

        // Théoriquement possible d'avoir 10 fous, mais max 2 sur même couleur de case
        if (whiteLightBishops > 2 || whiteDarkBishops > 2 || 
            blackLightBishops > 2 || blackDarkBishops > 2) {
            console.log('❌ Trop de fous sur la même couleur de case (max 2)');
            return false;
        }

        return true;
    }

    /**
     * Vérifie si une pièce spécifique est sur une case
     */
    static hasPieceAt(boardState, row, col, expectedPiece = null) {
        for (const piece of boardState.pieces) {
            if (piece.row === row && piece.col === col) {
                if (expectedPiece === null) {
                    return piece.piece !== null;
                }
                return piece.piece === expectedPiece;
            }
        }
        return false;
    }

    /**
     * Compte les fous sur une couleur de case spécifique
     */
    static countBishopsOnColor(boardState, color, squareColor) {
        let count = 0;
        const bishop = color === 'white' ? 'B' : 'b';
        
        for (const piece of boardState.pieces) {
            if (piece.piece === bishop) {
                const isLightSquare = (piece.row + piece.col) % 2 === 0;
                if ((squareColor === 'light' && isLightSquare) || 
                    (squareColor === 'dark' && !isLightSquare)) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * Analyse détaillée d'une position FEN
     */
    static analyze(fen) {
        const result = {
            isValid: false,
            errors: [],
            warnings: [],
            details: {}
        };

        try {
            result.isValid = this.isValid(fen);
            
            if (result.isValid) {
                const boardState = this.parseBoard(fen.split(' ')[0]);
                result.details.pieceCount = boardState.pieceCount;
                result.details.kings = {
                    white: boardState.white.king,
                    black: boardState.black.king
                };
                result.details.totalPieces = {
                    white: Object.values(boardState.pieceCount)
                        .filter((_, i) => i < 6) // K,Q,R,B,N,P
                        .reduce((a, b) => a + b, 0),
                    black: Object.values(boardState.pieceCount)
                        .filter((_, i) => i >= 6) // k,q,r,b,n,p  
                        .reduce((a, b) => a + b, 0)
                };
            }

        } catch (error) {
            result.errors.push(`Erreur d'analyse: ${error.message}`);
        }

        return result;
    }

    /**
     * Vérification rapide (sans analyse logique approfondie)
     */
    static quickCheck(fen) {
        try {
            if (!fen || typeof fen !== 'string') return false;
            
            const parts = fen.trim().split(' ');
            if (parts.length !== 6) return false;
            
            const [board, turn, castling, enPassant, halfMove, fullMove] = parts;
            
            return board.includes('/') &&
                   (turn === 'w' || turn === 'b') &&
                   (castling === '-' || /^[KQkq]+$/.test(castling)) &&
                   (enPassant === '-' || /^[a-h][36]$/.test(enPassant)) &&
                   !isNaN(parseInt(halfMove)) &&
                   !isNaN(parseInt(fullMove));
                   
        } catch {
            return false;
        }
    }
}

// Export pour Node.js et navigateur
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessFenPosition;
} else {
    window.ChessFenPosition = ChessFenPosition;
}