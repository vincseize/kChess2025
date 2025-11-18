// chess-game-core.js - Gestion principale du jeu avec détection d'échec
class ChessGameCore {
    constructor(board, gameState, moveValidator) {
        this.board = board;
        this.gameState = gameState;
        this.moveValidator = moveValidator;
        this.checkDetector = new CheckDetector(board, moveValidator);
        
        this.selectedPiece = null;
        this.possibleMoves = [];
        
        this.initializeGame();
    }

    initializeGame() {
        this.board.initializeBoard();
        this.gameState.initializeGame();
        console.log("♟️ Jeu d'échecs initialisé - Détection d'échec activée");
    }

    handleSquareClick(row, col) {
        if (!this.gameState.gameActive) {
            console.log("⏸️ Jeu en pause");
            return;
        }

        const clickedPiece = this.board.getPiece(row, col);
        console.log(`🖱️ Clic sur [${row},${col}] - Pièce: ${clickedPiece ? clickedPiece.color + ' ' + clickedPiece.type : 'vide'}`);

        // Si une pièce est déjà sélectionnée
        if (this.selectedPiece) {
            // Vérifie si le mouvement est légal
            if (this.isLegalMove(this.selectedPiece.piece, this.selectedPiece.row, this.selectedPiece.col, row, col)) {
                console.log("✅ Mouvement légal détecté - Exécution...");
                this.executeMove(this.selectedPiece.piece, this.selectedPiece.row, this.selectedPiece.col, row, col);
                this.clearSelection();
            } 
            // Clique sur une autre pièce de la même couleur
            else if (clickedPiece && clickedPiece.color === this.gameState.currentPlayer) {
                console.log("🔄 Sélection d'une nouvelle pièce");
                this.selectPiece(row, col);
            } 
            // Annulation de la sélection
            else {
                console.log("❌ Annulation de la sélection");
                this.clearSelection();
            }
        } 
        // Sélection d'une nouvelle pièce
        else if (clickedPiece && clickedPiece.color === this.gameState.currentPlayer) {
            console.log("📌 Sélection d'une pièce");
            this.selectPiece(row, col);
        } else {
            console.log("❌ Aucune pièce sélectionnable");
        }
    }

    // Vérifie si un mouvement est légal (sans mettre le roi en échec)
    isLegalMove(piece, fromRow, fromCol, toRow, toCol) {
        // Vérifie d'abord le mouvement de base
        const isValidBasicMove = this.moveValidator.isMoveValid(piece, fromRow, fromCol, toRow, toCol);
        if (!isValidBasicMove) {
            console.log(`❌ Mouvement de base invalide pour ${piece.type}`);
            return false;
        }

        // Vérifie que le mouvement ne met pas le roi en échec
        const isSafe = this.checkDetector.isMoveSafeFromCheck(piece, fromRow, fromCol, toRow, toCol);
        console.log(`🔒 Mouvement ${piece.type} [${fromRow},${fromCol}]->[${toRow},${toCol}] - Sécurisé: ${isSafe}`);
        return isSafe;
    }

    selectPiece(row, col) {
        const piece = this.board.getPiece(row, col);
        if (piece && piece.color === this.gameState.currentPlayer) {
            // Obtient seulement les mouvements légaux
            const legalMoves = this.checkDetector.getLegalMoves(piece, row, col);
            
            this.selectedPiece = { row, col, piece };
            this.possibleMoves = legalMoves;
            
            // Met en surbrillance
            this.board.getSquare(row, col).element.classList.add('selected');
            this.highlightPossibleMoves();
            
            console.log(`📌 Pièce sélectionnée: ${piece.color} ${piece.type} à [${row},${col}] - ${legalMoves.length} mouvements légaux`);
        }
    }

    executeMove(piece, fromRow, fromCol, toRow, toCol) {
        console.log(`🚀 Exécution mouvement: ${piece.color} ${piece.type} [${fromRow},${fromCol}] -> [${toRow},${toCol}]`);

        const move = {
            piece: piece.type,
            color: piece.color,
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            timestamp: new Date().toISOString()
        };

        // Gestion spéciale pour la prise en passant
        const targetPiece = this.board.getPiece(toRow, toCol);
        if (piece.type === 'pawn' && !targetPiece && fromCol !== toCol) {
            move.type = 'en-passant';
            move.capturedPawn = { 
                row: fromRow, 
                col: toCol 
            };
            console.log("🎯 Prise en passant détectée");
            this.moveValidator.executeEnPassant(move);
        } 
        // Capture normale
        else if (targetPiece) {
            move.type = 'capture';
            move.captured = targetPiece.type;
            console.log(`💥 Capture: ${targetPiece.color} ${targetPiece.type}`);
        } 
        // Mouvement normal
        else {
            move.type = 'move';
            console.log("➡️ Mouvement normal");
        }

        // Double push de pion pour la prise en passant
        if (piece.type === 'pawn' && Math.abs(fromRow - toRow) === 2) {
            move.isDoublePush = true;
            console.log("🏃 Double poussée de pion");
        }

        // Exécute le mouvement sur le plateau
        this.board.movePiece(fromRow, fromCol, toRow, toCol);
        
        // Met à jour la cible de prise en passant
        this.moveValidator.updateEnPassantTarget(move, piece);
        
        // Enregistre le mouvement
        this.gameState.recordMove(move);

        // Vérifie l'état du jeu APRÈS le mouvement
        this.checkGameState();
        
        // Change le joueur
        this.gameState.switchPlayer();
        console.log(`🔄 Tour suivant: ${this.gameState.currentPlayer}`);
    }

    checkGameState() {
        const currentPlayer = this.gameState.currentPlayer;
        const opponentColor = currentPlayer === 'white' ? 'black' : 'white';
        
        console.log(`🔍 Vérification état jeu - Joueur actuel: ${currentPlayer}, Adversaire: ${opponentColor}`);
        
        if (this.checkDetector.isCheckmate(opponentColor)) {
            console.log(`🎉 ÉCHEC ET MAT! ${currentPlayer} gagne!`);
            this.gameState.gameActive = false;
        } 
        else if (this.checkDetector.isKingInCheck(opponentColor)) {
            console.log(`⚡ ÉCHEC! Le roi ${opponentColor} est en échec`);
            
            // Met en surbrillance le roi en échec
            const kingPosition = this.checkDetector.findKingPosition(opponentColor);
            if (kingPosition) {
                this.board.highlightCheck(kingPosition.row, kingPosition.col);
            }
        }
        else if (this.checkDetector.isStalemate(opponentColor)) {
            console.log(`🤝 PAT! Match nul`);
            this.gameState.gameActive = false;
        }
        else {
            console.log(`✅ Aucun échec détecté pour ${opponentColor}`);
            this.board.clearCheckHighlights();
        }
    }

    highlightPossibleMoves() {
        this.board.clearHighlights();
        
        this.possibleMoves.forEach(move => {
            const square = this.board.getSquare(move.row, move.col);
            if (square) {
                if (move.type === 'en-passant') {
                    square.element.classList.add('possible-en-passant');
                } else if (move.type === 'capture') {
                    square.element.classList.add('possible-capture');
                } else {
                    square.element.classList.add('possible-move');
                }
            }
        });
    }

    clearSelection() {
        this.board.clearHighlights();
        this.selectedPiece = null;
        this.possibleMoves = [];
        console.log("🧹 Sélection effacée");
    }
}

window.ChessGameCore = ChessGameCore;