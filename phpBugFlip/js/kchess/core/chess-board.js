// chess-board.js - Gestion du plateau physique
class ChessBoard {
    constructor(gameState, pieceManager) {
        this.gameState = gameState;
        this.pieceManager = pieceManager;
        this.squares = [];
    }

    createBoard() {
        const boardElement = document.getElementById('chessBoard');
        if (!boardElement) return;

        boardElement.setAttribute('data-flipped', this.gameState.boardFlipped.toString());
        boardElement.innerHTML = '';
        this.squares = [];

        for (let displayRow = 0; displayRow < 8; displayRow++) {
            for (let displayCol = 0; displayCol < 8; displayCol++) {
                const { actualRow, actualCol } = this.getActualCoordinates(displayRow, displayCol);
                const squareData = this.createSquare(displayRow, displayCol, actualRow, actualCol);
                this.squares.push(squareData);
                boardElement.appendChild(squareData.element);
            }
        }
    }

    getActualCoordinates(displayRow, displayCol) {
        if (this.gameState.boardFlipped) {
            return { actualRow: 7 - displayRow, actualCol: 7 - displayCol };
        }
        return { actualRow: displayRow, actualCol: displayCol };
    }

    createSquare(displayRow, displayCol, actualRow, actualCol) {
        const isWhite = (actualRow + actualCol) % 2 === 0;
        const squareElement = document.createElement('div');
        squareElement.className = `chess-square ${isWhite ? 'white' : 'black'}`;
        squareElement.dataset.row = actualRow;
        squareElement.dataset.col = actualCol;
        squareElement.dataset.displayRow = displayRow;
        squareElement.dataset.displayCol = displayCol;

        this.updateSquareCoordinates(squareElement, actualRow, actualCol);

        const squareData = {
            element: squareElement,
            row: actualRow,
            col: actualCol,
            displayRow: displayRow,
            displayCol: displayCol,
            piece: null
        };

        squareElement.__squareData = squareData;
        return squareData;
    }

  updateSquareCoordinates(squareElement, actualRow, actualCol) {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const numbers = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    let horizontalCoord = '';
    let verticalCoord = '';
    let hasHorizontal = false;
    let hasVertical = false;

    if (this.gameState.boardFlipped) {
        // Vue noire : lettres en haut (ligne 0), chiffres à droite (colonne 7)
        if (actualRow === 0) {
            horizontalCoord = letters[actualCol];
            hasHorizontal = true;
        }
        if (actualCol === 7) {
            verticalCoord = numbers[actualRow];
            hasVertical = true;
        }
    } else {
        // Vue blanche : lettres en bas (ligne 7), chiffres à gauche (colonne 0)
        if (actualRow === 7) {
            horizontalCoord = letters[actualCol];
            hasHorizontal = true;
        }
        if (actualCol === 0) {
            verticalCoord = numbers[actualRow];
            hasVertical = true;
        }
    }

    // Stocker les deux coordonnées séparément
    squareElement.dataset.coordHorizontal = horizontalCoord;
    squareElement.dataset.coordVertical = verticalCoord;
    squareElement.dataset.coordinateH = hasHorizontal.toString();
    squareElement.dataset.coordinateV = hasVertical.toString();
}
    placePiece(piece, squareData) {
        const pieceElement = document.createElement('div');
        pieceElement.className = `chess-piece ${piece.color}`;
        pieceElement.innerHTML = this.pieceManager.getSymbol(piece.type, piece.color);
        pieceElement.dataset.pieceType = piece.type;
        pieceElement.dataset.pieceColor = piece.color;
        
        squareData.element.appendChild(pieceElement);
        squareData.piece = piece;
    }

    getSquare(row, col) {
        return this.squares.find(square => square.row === row && square.col === col);
    }

    getPiece(row, col) {
        const square = this.getSquare(row, col);
        return square ? square.piece : null;
    }

    clearBoard() {
        this.squares.forEach(square => {
            square.element.innerHTML = '';
            square.piece = null;
        });
    }

    saveCurrentPosition() {
        const position = {};
        this.squares.forEach(square => {
            if (square.piece) {
                const key = `${square.row}-${square.col}`;
                position[key] = { type: square.piece.type, color: square.piece.color };
            }
        });
        return position;
    }
}

window.ChessBoard = ChessBoard;