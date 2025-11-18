// chess-core.js - Classe principale ChessGame
class ChessGame {
    constructor() {
        this.pieceManager = new PieceManager();
        this.gameState = new GameState();
        this.moveValidator = null;
        this.board = null;
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.squares = [];
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.moveValidator = new MoveValidator(this);
        this.setupEventListeners();
        this.updateGameStatus();
        this.detectDeviceAndAdjust();
        
        console.log('✅ Jeu d\'échecs initialisé');
    }
    
    saveCurrentPosition() {
        const position = {};
        
        if (this.squares && this.squares.length > 0) {
            this.squares.forEach(square => {
                if (square.piece) {
                    const key = `${square.row}-${square.col}`;
                    position[key] = {
                        type: square.piece.type,
                        color: square.piece.color
                    };
                }
            });
            console.log('Position sauvegardée:', position);
        } else {
            console.log('Aucune position à sauvegarder, utilisation position initiale');
            return this.pieceManager.getInitialPosition();
        }
        
        return position;
    }
    
    createBoard() {
        const boardElement = document.getElementById('chessBoard');
        if (!boardElement) {
            console.error('Élément chessBoard non trouvé');
            return;
        }
        
        // Ajouter l'attribut data-flipped pour le CSS
        if (this.gameState.boardFlipped) {
            boardElement.setAttribute('data-flipped', 'true');
        } else {
            boardElement.setAttribute('data-flipped', 'false');
        }
        
        // SAUVEGARDER la position actuelle AVANT de vider
        const currentPosition = this.saveCurrentPosition();
        
        boardElement.innerHTML = '';
        this.squares = [];
        
        for (let displayRow = 0; displayRow < 8; displayRow++) {
            for (let displayCol = 0; displayCol < 8; displayCol++) {
                let actualRow, actualCol;
                
                if (this.gameState.boardFlipped) {
                    actualRow = 7 - displayRow;
                    actualCol = 7 - displayCol;
                } else {
                    actualRow = displayRow;
                    actualCol = displayCol;
                }
                
                const squareData = this.createSquare(displayRow, displayCol, actualRow, actualCol);
                const pieceKey = `${actualRow}-${actualCol}`;
                
                this.squares.push(squareData);
                
                // Placer les pièces selon la position sauvegardée
                if (currentPosition[pieceKey]) {
                    const piece = currentPosition[pieceKey];
                    this.placePieceOnSquare(piece, squareData);
                }
                
                boardElement.appendChild(squareData.element);
                squareData.element.addEventListener('click', () => this.handleSquareClick(displayRow, displayCol));
            }
        }
        
        console.log('Plateau recréé avec flip:', this.gameState.boardFlipped);
    }
    
    createSquare(displayRow, displayCol, actualRow, actualCol) {
        const isWhite = (actualRow + actualCol) % 2 === 0;
        
        const squareElement = document.createElement('div');
        squareElement.className = `chess-square ${isWhite ? 'white' : 'black'}`;
        squareElement.dataset.row = actualRow;
        squareElement.dataset.col = actualCol;
        squareElement.dataset.displayRow = displayRow;
        squareElement.dataset.displayCol = displayCol;
        
        // Calculer les coordonnées d'affichage
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
    
    // Mettre à jour les coordonnées d'affichage
    updateSquareCoordinates(squareElement, actualRow, actualCol) {
        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const numbers = ['8', '7', '6', '5', '4', '3', '2', '1'];
        
        let coordinate = '';
        let hasHorizontal = false;
        let hasVertical = false;
        
        // Déterminer quelle case affiche quelle coordonnée selon l'orientation
        if (this.gameState.boardFlipped) {
            // Plateau flipé : a-h en haut, 1-8 à droite
            if (actualRow === 0) { // Ligne du haut (devenu le bas visuellement)
                coordinate = letters[7 - actualCol];
                hasHorizontal = true;
            }
            else if (actualCol === 7) { // Colonne de droite (devenu la gauche visuellement)
                coordinate = numbers[7 - actualRow];
                hasVertical = true;
            }
        } else {
            // Plateau normal : a-h en bas, 1-8 à gauche
            if (actualRow === 7) { // Ligne du bas
                coordinate = letters[actualCol];
                hasHorizontal = true;
            }
            else if (actualCol === 0) { // Colonne de gauche
                coordinate = numbers[actualRow];
                hasVertical = true;
            }
        }
        
        // Mettre à jour les attributs data
        if (coordinate) {
            squareElement.dataset.coordinate = coordinate;
            if (hasHorizontal) {
                squareElement.dataset.coordinateH = "true";
                squareElement.dataset.coordinateV = "false";
            }
            if (hasVertical) {
                squareElement.dataset.coordinateV = "true";
                squareElement.dataset.coordinateH = "false";
            }
        } else {
            squareElement.dataset.coordinate = "";
            squareElement.dataset.coordinateH = "false";
            squareElement.dataset.coordinateV = "false";
        }
    }
    
    placePieceOnSquare(piece, squareData) {
        const pieceElement = document.createElement('div');
        pieceElement.className = `chess-piece ${piece.color}`;
        pieceElement.innerHTML = this.pieceManager.getSymbol(piece.type, piece.color);
        pieceElement.dataset.pieceType = piece.type;
        pieceElement.dataset.pieceColor = piece.color;
        
        squareData.element.appendChild(pieceElement);
        squareData.piece = piece;
    }
    
    handleSquareClick(displayRow, displayCol) {
        if (!this.gameState.gameActive) return;
        
        let actualRow, actualCol;
        
        if (this.gameState.boardFlipped) {
            actualRow = 7 - displayRow;
            actualCol = 7 - displayCol;
        } else {
            actualRow = displayRow;
            actualCol = displayCol;
        }
        
        const square = this.getSquare(actualRow, actualCol);
        if (!square) return;
        
        const piece = square.piece;
        
        if (this.selectedPiece) {
            const isPossibleMove = this.possibleMoves.some(move => 
                move.row === actualRow && move.col === actualCol
            );
            
            if (isPossibleMove) {
                this.movePiece(actualRow, actualCol);
            } else {
                if (piece && piece.color === this.gameState.currentPlayer) {
                    this.selectPiece(actualRow, actualCol);
                } else {
                    this.clearSelection();
                }
            }
        } else {
            if (piece && piece.color === this.gameState.currentPlayer) {
                this.selectPiece(actualRow, actualCol);
            }
        }
    }
    
    selectPiece(row, col) {
        this.clearSelection();
        
        const square = this.getSquare(row, col);
        if (!square || !square.piece) return;
        
        square.element.classList.add('selected');
        this.selectedPiece = { row, col, piece: square.piece };
        this.possibleMoves = this.moveValidator.getPossibleMoves(square.piece, row, col);
        this.highlightPossibleMoves();
    }
    
    movePiece(toRow, toCol) {
        // Mettre à jour les informations après le mouvement
        this.updateGameInfo();
        this.updateMoveHistory();

        if (!this.selectedPiece) return;
        
        const fromSquare = this.getSquare(this.selectedPiece.row, this.selectedPiece.col);
        const toSquare = this.getSquare(toRow, toCol);
        
        if (!fromSquare || !toSquare) {
            this.clearSelection();
            return;
        }
        
        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        if (!pieceElement) {
            this.clearSelection();
            return;
        }
        
        pieceElement.classList.add('piece-moved');
        
        if (toSquare.piece) {
            console.log('Capture!', toSquare.piece);
        }
        
        toSquare.element.innerHTML = '';
        toSquare.element.appendChild(pieceElement);
        
        toSquare.piece = this.selectedPiece.piece;
        fromSquare.piece = null;
        
        this.gameState.recordMove(
            this.selectedPiece.row, 
            this.selectedPiece.col, 
            toRow, 
            toCol,
            this.selectedPiece.piece
        );
        
        this.gameState.switchPlayer();
        this.clearSelection();
        this.updateGameStatus();
        this.updateMoveHistory();
    }
    
    highlightPossibleMoves() {
        this.squares.forEach(square => {
            square.element.classList.remove('possible-move', 'possible-capture');
        });
        
        this.possibleMoves.forEach(move => {
            const square = this.getSquare(move.row, move.col);
            if (square) {
                if (move.type === 'capture') {
                    square.element.classList.add('possible-capture');
                } else {
                    square.element.classList.add('possible-move');
                }
            }
        });
    }
    
    clearSelection() {
        this.squares.forEach(squareData => {
            squareData.element.classList.remove('selected', 'possible-move', 'possible-capture');
        });
        this.selectedPiece = null;
        this.possibleMoves = [];
    }
    
    getPiece(row, col) {
        const square = this.getSquare(row, col);
        return square ? square.piece : null;
    }
    
    getSquare(row, col) {
        return this.squares.find(square => 
            square.row === row && square.col === col
        );
    }
    
    updateGameStatus() {
        const statusElement = document.getElementById('gameStatus');
        const playerElement = document.getElementById('currentPlayer');
        
        if (statusElement && playerElement) {
            playerElement.textContent = `Aux ${this.gameState.currentPlayer === 'white' ? 'blancs' : 'noirs'} de jouer`;
            statusElement.textContent = 'En cours';
            statusElement.className = 'h5 text-success';
        }
    }
    
    // Méthodes supplémentaires pour gérer les nouvelles fonctionnalités
    updateGameInfo() {
        this.updateMoveCount();
        this.updateGameStatus();
    }
    
    updateMoveCount() {
        const moveCountElement = document.getElementById('moveCount');
        if (moveCountElement) {
            moveCountElement.textContent = this.gameState.moveHistory.length;
        }
    }
    
    updateMoveHistory() {
        const historyElement = document.getElementById('moveHistory');
        if (!historyElement) return;
        
        historyElement.innerHTML = '';
        const moves = this.gameState.moveHistory;
        
        for (let i = 0; i < moves.length; i += 2) {
            const moveItem = document.createElement('div');
            moveItem.className = 'move-item';
            
            const whiteMove = moves[i];
            const blackMove = moves[i + 1];
            
            let moveText = `${whiteMove.number}. ${whiteMove.notation}`;
            if (blackMove) moveText += ` ${blackMove.notation}`;
            
            moveItem.textContent = moveText;
            historyElement.appendChild(moveItem);
        }
        
        if (moves.length === 0) {
            historyElement.innerHTML = '<div class="text-center text-muted small">Aucun coup joué</div>';
        }
    }
    
    detectDeviceAndAdjust() {
        if (typeof getQuickDeviceSummary === 'function') {
            const device = getQuickDeviceSummary();
            
            if (device.screen.width <= 768) {
                const mobileIcon = document.getElementById('mobileIcon');
                const desktopIcon = document.getElementById('desktopIcon');
                if (mobileIcon) mobileIcon.style.display = 'inline';
                if (desktopIcon) desktopIcon.style.display = 'none';
            }
        }
    }
    
    setupEventListeners() {
        const newGameBtn = document.getElementById('newGame');
        const flipBoardBtn = document.getElementById('flipBoard');
        const mobileNewGameBtn = document.getElementById('mobileNewGame');
        const mobileFlipBoardBtn = document.getElementById('mobileFlipBoard');
        const clearHistoryBtn = document.getElementById('clearHistory');
        
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearMoveHistory());
        }
        
        if (newGameBtn) newGameBtn.addEventListener('click', () => this.newGame());
        if (flipBoardBtn) flipBoardBtn.addEventListener('click', () => this.flipBoard());
        if (mobileNewGameBtn) mobileNewGameBtn.addEventListener('click', () => this.newGame());
        if (mobileFlipBoardBtn) mobileFlipBoardBtn.addEventListener('click', () => this.flipBoard());
        
        window.addEventListener('orientationChange', (e) => {
            this.detectDeviceAndAdjust();
        });
    }
    
    clearMoveHistory() {
        this.gameState.moveHistory = [];
        this.updateMoveHistory();
        this.updateMoveCount();
    }
    
    flipBoard() {
        console.log('Flip du plateau - ancien état:', this.gameState.boardFlipped);
        
        this.gameState.boardFlipped = !this.gameState.boardFlipped;
        this.createBoard(); // Recrée tout le board avec les nouvelles coordonnées
        this.clearSelection();
        
        console.log('Flip du plateau - nouvel état:', this.gameState.boardFlipped);
    }
    
    newGame() {
        console.log('Nouvelle partie');
        
        this.gameState.resetGame();
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.squares = [];
        this.createBoard();
        this.updateGameStatus();
        this.updateMoveHistory();
    }
}

// Export pour utilisation globale
window.ChessGame = ChessGame;