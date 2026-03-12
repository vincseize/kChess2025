// chess-interface.js
class ChessInterface {
    constructor() {
        this.init();
    }

    init() {
        this.createChessBoard();
        this.setupEventListeners();
        this.generateMoveHistory();
    }

    createChessBoard() {
        const board = document.querySelector('.chess-board');
        const files = 'abcdefgh';
        
        // Créer les cases
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `chess-square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                square.dataset.position = `${files[col]}${8 - row}`;
                
                board.appendChild(square);
            }
        }

        // Ajouter les coordonnées
        this.addBoardCoordinates();
    }

    addBoardCoordinates() {
        const board = document.querySelector('.chess-board');
        
        // Fichiers (a-h)
        const files = document.createElement('div');
        files.className = 'coordinates files';
        files.innerHTML = 'a b c d e f g h';
        
        // Rangs (1-8)
        const ranks = document.createElement('div');
        ranks.className = 'coordinates ranks';
        ranks.innerHTML = '8<br>7<br>6<br>5<br>4<br>3<br>2<br>1';
        
        board.appendChild(files);
        board.appendChild(ranks);
    }

    setupEventListeners() {
    // Écouteur pour tous les boutons de rotation (Desktop et Mobile)
    // On utilise la classe .flip-board-btn définie dans content.php
    document.querySelectorAll('.flip-board-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.flipBoard();
        });
    });

    // Écouteur pour Nouvelle Partie
    document.querySelectorAll('.new-game-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.newGame();
        });
    });

    // Ecouteur pour Rejouer
    const playAgainBtn = document.getElementById('playAgain');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => window.location.reload());
    }
}

    newGame() {
        // Simulation nouvelle partie
        document.querySelector('.turn-text').textContent = 'White to move';
        document.querySelector('.notation-display').textContent = 'New game started...';
        this.generateMoveHistory();
        
        // Feedback visuel
        this.showNotification('New game started!');
    }

    flipBoard() {
    const board = document.getElementById('chessBoard'); // ID utilisé dans content.php
    if (!board) return;

    // 1. Animation visuelle (CSS)
    board.classList.toggle('flipped');
    
    // 2. Synchronisation avec le moteur de jeu (ChessGame)
    // C'est ici que le lien se faisait mal :
    if (window.chessGame && window.chessGame.core) {
        window.chessGame.core.flipBoard(); 
    }

    this.showNotification('Plateau retourné');
}

    undoMove() {
        this.showNotification('Last move undone');
    }

    generateMoveHistory() {
        const moves = [
            '1. e4 e5', '2. Nf3 Nc6', '3. Bb5 a6', 
            '4. Ba4 Nf6', '5. O-O Be7', '6. Re1 b5',
            '7. Bb3 d6', '8. c3 O-O', '9. h3 Nb8'
        ];
        
        const moveList = document.querySelector('.move-list');
        moveList.innerHTML = moves.map(move => 
            `<div class="move-item">${move}</div>`
        ).join('');
    }

    showNotification(message) {
        // Créer une notification toast
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialiser l'interface quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    new ChessInterface();
});