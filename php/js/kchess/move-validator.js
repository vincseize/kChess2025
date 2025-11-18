// move-validator.js - Coordinateur principal des validateurs
class MoveValidator {
    constructor(board, gameState) {
        this.board = board;
        this.gameState = gameState;
        this.enPassantTarget = null;
        
        // Initialisation des validateurs spécialisés
        this.pieceValidators = {
            'pawn': new PawnMoveValidator(this.board, this.gameState),
            'knight': new KnightMoveValidator(this.board),
            'bishop': new BishopMoveValidator(this.board),
            'rook': new RookMoveValidator(this.board),
            'queen': new QueenMoveValidator(this.board),
            'king': new KingMoveValidator(this.board, this.gameState)
        };
    }

    getPossibleMoves(piece, fromRow, fromCol) {
        const validator = this.pieceValidators[piece.type];
        if (validator) {
            return validator.getPossibleMoves(piece, fromRow, fromCol);
        }
        return [];
    }

    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    isMoveValid(piece, fromRow, fromCol, toRow, toCol) {
        const possibleMoves = this.getPossibleMoves(piece, fromRow, fromCol);
        return possibleMoves.some(move => 
            move.row === toRow && move.col === toCol
        );
    }

    // Gestion de la prise en passant
    updateEnPassantTarget(move, piece) {
        if (piece.type === 'pawn' && move.isDoublePush) {
            const direction = piece.color === 'white' ? -1 : 1;
            this.enPassantTarget = {
                row: move.to.row + direction,
                col: move.to.col
            };
            console.log(`🎯 Cible en passant définie: [${this.enPassantTarget.row},${this.enPassantTarget.col}]`);
        } else {
            this.enPassantTarget = null;
        }
    }

    executeEnPassant(move) {
        if (move.type === 'en-passant' && move.capturedPawn) {
            const capturedSquare = this.board.getSquare(move.capturedPawn.row, move.capturedPawn.col);
            if (capturedSquare && capturedSquare.piece) {
                console.log(`🎯 Prise en passant exécutée sur [${move.capturedPawn.row},${move.capturedPawn.col}]`);
                capturedSquare.piece = null;
                capturedSquare.element.innerHTML = '';
            }
        }
    }
}

window.MoveValidator = MoveValidator;