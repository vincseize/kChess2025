// chess-game-ui-move-history.js - Gestion de l'historique des coups
class ChessMoveHistoryManager {
    constructor(ui) {
        this.ui = ui;
    }

    updateMoveHistory() {
        const moveHistoryElement = document.getElementById('moveHistory');
        if (!moveHistoryElement) return;
        
        const moves = this.ui.game.gameState.moveHistory;
        moveHistoryElement.innerHTML = '';
        moveHistoryElement.className = 'move-history-container';
        
        for (let i = 0; i < moves.length; i += 2) {
            const moveRowElement = document.createElement('div');
            moveRowElement.className = 'move-row';
            
            moveRowElement.addEventListener('click', () => {
                this.selectMoveRow(moveRowElement, i);
            });
            
            let moveHTML = '';
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = moves[i];
            const blackMove = moves[i + 1];
            
            moveHTML += `<span class="move-number">${moveNumber}.</span>`;
            
            if (whiteMove) {
                moveHTML += `<span class="white-move">${this.getMoveNotation(whiteMove)}</span>`;
            }
            
            if (blackMove) {
                moveHTML += `<span class="black-move">${this.getMoveNotation(blackMove)}</span>`;
            }
            
            moveRowElement.innerHTML = moveHTML;
            moveHistoryElement.appendChild(moveRowElement);
        }
        
        if (moves.length === 0) {
            moveHistoryElement.innerHTML = '<div class="text-center text-muted small p-3">Aucun coup joué</div>';
        }
        
        moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight;
    }

    selectMoveRow(rowElement, startIndex) {
        document.querySelectorAll('.move-row').forEach(row => {
            row.classList.remove('selected');
        });
        
        rowElement.classList.add('selected');
        console.log('📋 Ligne sélectionnée, coups:', startIndex, 'à', startIndex + 1);
    }

    getMoveNotation(move) {
        if (move.notation) return move.notation;
        
        const pieceSymbol = this.getPieceSymbol(move.piece);
        const toSquare = this.coordinatesToAlgebraic(move.to.row, move.to.col);
        
        let notation = '';
        
        if (move.piece.toLowerCase() === 'pawn') {
            notation = move.captured ? 
                `${this.coordinatesToAlgebraic(move.from.row, move.from.col).charAt(0)}x${toSquare}` : 
                toSquare;
        } else {
            notation = move.captured ? 
                `${pieceSymbol}x${toSquare}` : 
                `${pieceSymbol}${toSquare}`;
        }
        
        if (move.piece.toLowerCase() === 'king') {
            if (move.to.col - move.from.col === 2) {
                notation = 'O-O';
            } else if (move.to.col - move.from.col === -2) {
                notation = 'O-O-O';
            }
        }
        
        return notation;
    }

    coordinatesToAlgebraic(row, col) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        return files[col] + ranks[row];
    }

    getPieceSymbol(pieceType) {
        const symbols = {
            'king': 'K', 'queen': 'Q', 'rook': 'R', 
            'bishop': 'B', 'knight': 'N', 'pawn': ''
        };
        return symbols[pieceType.toLowerCase()] || '';
    }
}