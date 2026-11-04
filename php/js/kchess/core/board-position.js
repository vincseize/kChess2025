/**
 * Données de position indépendantes de l'affichage du plateau.
 */
class BoardPosition {
    constructor() {
        this.grid = Array.from({ length: 8 }, () => Array(8).fill(null));
    }

    getPiece(row, col) {
        if (!this.isValidSquare(row, col)) return null;
        return this.grid[row][col];
    }

    setPiece(row, col, piece) {
        if (!this.isValidSquare(row, col)) {
            throw new RangeError(`Case hors du plateau : ${row},${col}`);
        }
        this.grid[row][col] = piece;
    }

    clear() {
        this.grid.forEach(row => row.fill(null));
    }

    isValidSquare(row, col) {
        return Number.isInteger(row) && Number.isInteger(col)
            && row >= 0 && row < 8 && col >= 0 && col < 8;
    }
}

window.BoardPosition = BoardPosition;
