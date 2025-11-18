// check-detector.js - Détection d'échec et mat
class CheckDetector {
    constructor(board, moveValidator) {
        this.board = board;
        this.moveValidator = moveValidator;
    }

    // Vérifie si le roi d'une couleur est en échec
    isKingInCheck(color) {
        const kingPosition = this.findKingPosition(color);
        if (!kingPosition) {
            console.log(`❌ Roi ${color} introuvable!`);
            return false;
        }

        const isInCheck = this.isSquareAttacked(kingPosition.row, kingPosition.col, color);
        console.log(`🔍 Roi ${color} en échec: ${isInCheck} (position: [${kingPosition.row},${kingPosition.col}])`);
        return isInCheck;
    }

    // Trouve la position du roi
    findKingPosition(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board.getPiece(row, col);
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        console.log(`❌ Roi ${color} non trouvé sur l'échiquier!`);
        return null;
    }

    // Vérifie si une case est attaquée par l'adversaire
    isSquareAttacked(row, col, defenderColor) {
        const attackerColor = defenderColor === 'white' ? 'black' : 'white';
        let attackCount = 0;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board.getPiece(r, c);
                if (piece && piece.color === attackerColor) {
                    const moves = this.moveValidator.getPossibleMoves(piece, r, c);
                    
                    // Vérifie si l'un des mouvements peut capturer la case cible
                    const canAttack = moves.some(move => 
                        move.row === row && move.col === col && 
                        (move.type === 'capture' || move.type === 'en-passant')
                    );
                    
                    if (canAttack) {
                        console.log(`⚔️ Case [${row},${col}] attaquée par ${attackerColor} ${piece.type} à [${r},${c}]`);
                        attackCount++;
                    }
                }
            }
        }
        
        console.log(`🎯 Case [${row},${col}] - ${attackCount} attaques détectées`);
        return attackCount > 0;
    }

    // Vérifie l'échec et mat
    isCheckmate(color) {
        const isInCheck = this.isKingInCheck(color);
        console.log(`♟️ Vérification échec et mat pour ${color} - En échec: ${isInCheck}`);
        
        if (!isInCheck) {
            return false;
        }

        const hasLegalMoves = this.hasAnyLegalMove(color);
        console.log(`♟️ Échec et mat pour ${color}: ${!hasLegalMoves}`);
        return !hasLegalMoves;
    }

    // Vérifie s'il existe au moins un mouvement légal
    hasAnyLegalMove(color) {
        let legalMoveCount = 0;
        
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = this.board.getPiece(fromRow, fromCol);
                if (piece && piece.color === color) {
                    const moves = this.moveValidator.getPossibleMoves(piece, fromRow, fromCol);
                    
                    for (const move of moves) {
                        if (this.isMoveSafeFromCheck(piece, fromRow, fromCol, move.row, move.col)) {
                            legalMoveCount++;
                            console.log(`✅ Mouvement légal trouvé: ${piece.type} [${fromRow},${fromCol}] -> [${move.row},${move.col}]`);
                        }
                    }
                }
            }
        }
        
        console.log(`📊 ${legalMoveCount} mouvements légaux trouvés pour ${color}`);
        return legalMoveCount > 0;
    }

    // Vérifie si un mouvement sort de l'échec
    isMoveSafeFromCheck(piece, fromRow, fromCol, toRow, toCol) {
        // Simule le mouvement
        const originalTargetPiece = this.board.getPiece(toRow, toCol);
        
        // Déplace la pièce
        this.board.setPiece(toRow, toCol, piece);
        this.board.setPiece(fromRow, fromCol, null);
        
        // Vérifie si le roi est toujours en échec après le mouvement
        const stillInCheck = this.isKingInCheck(piece.color);
        
        // Annule le mouvement
        this.board.setPiece(fromRow, fromCol, piece);
        this.board.setPiece(toRow, toCol, originalTargetPiece);
        
        console.log(`🔄 Test mouvement ${piece.type} [${fromRow},${fromCol}]->[${toRow},${toCol}] - Sécurisé: ${!stillInCheck}`);
        return !stillInCheck;
    }

    // Obtient tous les mouvements légaux (qui ne mettent pas le roi en échec)
    getLegalMoves(piece, fromRow, fromCol) {
        const possibleMoves = this.moveValidator.getPossibleMoves(piece, fromRow, fromCol);
        const legalMoves = possibleMoves.filter(move => 
            this.isMoveSafeFromCheck(piece, fromRow, fromCol, move.row, move.col)
        );
        
        console.log(`📋 ${piece.color} ${piece.type} à [${fromRow},${fromCol}] - ${legalMoves.length}/${possibleMoves.length} mouvements légaux`);
        return legalMoves;
    }

    // Vérifie la situation de pat (stalemate)
    isStalemate(color) {
        const isInCheck = this.isKingInCheck(color);
        console.log(`🤝 Vérification pat pour ${color} - En échec: ${isInCheck}`);
        
        if (isInCheck) {
            return false;
        }

        const hasLegalMoves = this.hasAnyLegalMove(color);
        console.log(`🤝 Pat pour ${color}: ${!hasLegalMoves}`);
        return !hasLegalMoves;
    }
}

window.CheckDetector = CheckDetector;