/**
 * ChessBoard - Gestion de l'affichage physique et de la grille du jeu
 */
class ChessBoard {
    
    static consoleLog = false; 
    static initialized = false;

    /**
     * Initialisation statique du composant
     */
    static init() {
        this.loadConfig();
        this.initialized = true;
        
        if (this.consoleLog) {
            console.log('🚀 [ChessBoard] Système initialisé (Mode Debug)');
        } else {
            console.info('🔇 [ChessBoard] Système initialisé (Mode Silencieux)');
        }
    }

    /**
     * Charge la configuration depuis window.appConfig
     */
    static loadConfig() {
        try {
            // Par défaut, on reste sur false
            let configValue = false; 

            if (window.appConfig && window.appConfig.debug) {
                configValue = window.appConfig.debug.console_log;
            } else if (typeof window.getConfig === 'function') {
                // Ici, on passe 'false' en valeur de secours (3ème argument)
                configValue = window.getConfig('debug.console_log', false);
            }

            // Conversion stricte
            // On n'active le log QUE si on a explicitement le booléen true ou la string "true"
            this.consoleLog = (configValue === true || configValue === "true");
            
            return true;
        } catch (error) {
            // En cas d'erreur, on reste silencieux
            this.consoleLog = false;
            return false;
        }
    }

    /**
     * Logger centralisé pour ChessBoard
     */
    static log(message, data = null, type = 'log') {
        // Si les logs sont désactivés, on bloque TOUT (log, info, warn, etc.)
        if (!this.consoleLog) return; 
        
        const prefix = '♟️ [ChessBoard] ';
        if (data) {
            console[type](prefix + message, data);
        } else {
            console[type](prefix + message);
        }
    }

    // --- Méthodes d'instance ---

    constructor(gameState, pieceManager) {
        this.gameState = gameState;
        this.pieceManager = pieceManager;
        this.squares = [];
        
        // Rafraîchir la config à l'instanciation
        this.constructor.loadConfig();
        
        ChessBoard.log('Plateau instancié', { gameState, pieceManager });
    }

    /**
     * Retourne le plateau (vue Noirs/Blancs)
     */
    flipBoard() {
    if (!this.gameState || !this.board) return;

    // 1. Inverser l'état
    this.gameState.boardFlipped = !this.gameState.boardFlipped;
    const isFlipped = this.gameState.boardFlipped;

    // 2. Sauvegarde des pièces
    const pieces = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = this.board.getPiece(r, c);
            if (p) pieces.push({ r, c, piece: p });
        }
    }

    // 3. Reconstruction du HTML
    this.board.createBoard();

    // 4. RE-PLACEMENT DES PIÈCES
    pieces.forEach(item => {
        const sq = this.board.getSquare(item.r, item.c);
        if (sq) this.board.placePiece(item.piece, sq);
    });

    // 5. FORCE LA CLASSE CSS (avec un léger délai pour laisser le DOM respirer)
    setTimeout(() => {
        const boardEl = document.getElementById('chessBoard');
        if (boardEl) {
            if (isFlipped) {
                boardEl.classList.add('flipped');
            } else {
                boardEl.classList.remove('flipped');
            }
            console.log("🛠️ État final de la classe flipped :", boardEl.classList.contains('flipped'));
        }
    }, 10);

    this.clearSelection();
    this.updateUI();
}

    /**
     * Réorganise l'ordre des cases dans le DOM pour l'orientation retournée
     */
    reorderBoardDisplay() {
        const boardElement = document.getElementById('chessBoard');
        if (!boardElement) return;
        
        ChessBoard.log('🔄 Réorganisation du DOM pour la vue retournée');
        
        // Récupérer toutes les cases dans l'ordre actuel du DOM
        const squares = Array.from(boardElement.children);
        
        // Inverser l'ordre (pour que a8 devienne h1, etc.)
        squares.reverse().forEach(square => {
            boardElement.appendChild(square);
        });
        
        // Mettre à jour les classes de coordonnées après réorganisation
        this.updateCoordinateClasses();
    }

    /**
     * Met à jour les classes CSS des coordonnées après flip
     */
    updateCoordinateClasses() {
        this.squares.forEach(square => {
            const element = square.element;
            const row = square.row;
            const col = square.col;
            
            // Retirer les anciennes classes de coordonnées
            element.classList.remove('coord-rank', 'coord-file');
            
            // Ajouter les nouvelles classes selon l'orientation
            if (!this.gameState.boardFlipped) {
                // Vue BLANCS : Chiffres sur la colonne 'a' (col 0), Lettres sur la rangée '1' (row 7)
                if (col === 0) element.classList.add('coord-rank');
                if (row === 7) element.classList.add('coord-file');
            } else {
                // Vue NOIRS : Chiffres sur la colonne 'h' (col 7), Lettres sur la rangée '8' (row 0)
                if (col === 7) element.classList.add('coord-rank');
                if (row === 0) element.classList.add('coord-file');
            }
        });
    }

    /**
     * Génère le plateau HTML
     */
    createBoard() {
        const boardElement = document.getElementById('chessBoard');
        if (!boardElement) {
            ChessBoard.log('Élément #chessBoard non trouvé', null, 'error');
            return;
        }

        const flipped = this.gameState.boardFlipped;
        boardElement.setAttribute('data-flipped', flipped);
        boardElement.innerHTML = '';
        this.squares = [];

        ChessBoard.log(`Construction : Mode ${flipped ? 'Retourné (Noir)' : 'Normal (Blanc)'}`);

        // Créer les cases dans l'ordre naturel (a8 en premier)
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const squareData = this.createSquare(row, col);
                this.squares.push(squareData);
                boardElement.appendChild(squareData.element);
            }
        }

        ChessBoard.log(`Plateau créé avec ${this.squares.length} cases`);
        
        // IMPORTANT: Si on est en mode flipped, réorganiser immédiatement
        // Mais attention: on ne veut pas le faire pendant le flipBoard car on le fait après
        // On le fait seulement à la création initiale
        if (flipped && this.squares.length > 0 && !this._isFlipping) {
            this.reorderBoardDisplay();
        }
        
        this.displayBoardSummary();
    }

    /**
     * Crée une case individuelle (DOM + Données)
     */
    createSquare(row, col) {
        const isWhite = (row + col) % 2 === 0;
        const colorClass = isWhite ? 'white' : 'black';
        
        const squareElement = document.createElement('div');
        squareElement.className = `chess-square ${colorClass}`;
        
        // Datasets pour CSS et Logique - TOUJOURS les coordonnées réelles
        Object.assign(squareElement.dataset, {
            row: row,
            col: col
        });

        this.addCoordinatesLabels(squareElement, row, col);

        const squareData = {
            element: squareElement,
            row: row,
            col: col,
            piece: null
        };

        // Référence circulaire utile pour les événements au clic
        squareElement.__squareData = squareData;
        
        return squareData;
    }

    /**
     * Ajoute les labels 'a-h' et '1-8' à l'intérieur des cases
     */
    addCoordinatesLabels(squareElement, row, col) {
        const letters = 'abcdefgh';
        const numbers = '87654321';
        
        // Injecter les coordonnées dans le dataset
        squareElement.dataset.file = letters[col];
        squareElement.dataset.rank = numbers[row];
        
        // Ajouter un label visuel dans la case
        const label = document.createElement('span');
        label.className = 'coordinate-label';
        label.textContent = `${letters[col]}${numbers[row]}`;
        squareElement.appendChild(label);
    }
    
    /**
     * Place visuellement une pièce sur une case (Support Texte ou Image)
     */
    placePiece(piece, squareData) {
        // Vider la case d'abord (mais garder le label de coordonnées)
        const label = squareData.element.querySelector('.coordinate-label');
        squareData.element.innerHTML = '';
        if (label) squareData.element.appendChild(label);
        
        const pieceElement = document.createElement('div');
        pieceElement.className = `chess-piece ${piece.color}`;
        
        // On récupère le chemin depuis la config globale
        const basePath = (window.appConfig && window.appConfig.piece_path) ? window.appConfig.piece_path : '';
        
        // Si on veut utiliser des images (ex: wP.png)
        if (basePath) {
            const imgName = `${piece.color[0]}${this.getPieceLetter(piece.type)}.png`;
            pieceElement.style.backgroundImage = `url('${basePath}${imgName}')`;
            pieceElement.style.backgroundSize = 'contain';
            pieceElement.style.backgroundRepeat = 'no-repeat';
            pieceElement.style.backgroundPosition = 'center';
        } else {
            // Repli sur le symbole texte si pas de chemin image
            pieceElement.innerHTML = this.pieceManager.getSymbol(piece.type, piece.color);
        }
        
        Object.assign(pieceElement.dataset, {
            pieceType: piece.type,
            pieceColor: piece.color
        });

        squareData.element.appendChild(pieceElement);
        squareData.piece = piece;
    }

    // Utilitaire pour transformer 'pawn' en 'P', 'knight' en 'N', etc.
    getPieceLetter(type) {
        const map = { 'pawn': 'P', 'knight': 'N', 'bishop': 'B', 'rook': 'R', 'queen': 'Q', 'king': 'K' };
        return map[type] || 'P';
    }

    /**
     * Récupère les données d'une case par ses coordonnées réelles
     */
    getSquare(row, col) {
        return this.squares.find(s => s.row === row && s.col === col) || null;
    }

    /**
     * Vide le plateau
     */
    clearBoard() {
        this.squares.forEach(sq => {
            sq.element.innerHTML = '';
            sq.piece = null;
            // Remettre le label de coordonnées
            this.addCoordinatesLabels(sq.element, sq.row, sq.col);
        });
        ChessBoard.log('Plateau vidé', null, 'info');
    }

    // --- Utilitaires de Debug ---

    displayBoardSummary() {
        if (!this.constructor.consoleLog) return;

        const stats = this.squares.reduce((acc, sq) => {
            if (sq.piece) {
                const color = sq.piece.color;
                acc[color] = (acc[color] || 0) + 1;
                acc.total++;
            }
            return acc;
        }, { white: 0, black: 0, total: 0 });

        console.table({
            "Flipped": this.gameState.boardFlipped,
            "Total Pièces": stats.total,
            "Blancs": stats.white,
            "Noirs": stats.black
        });
    }

    displayCoordinatesGrid() {
        if (!this.constructor.consoleLog) return;
        
        let grid = "";
        for (let r = 0; r < 8; r++) {
            let rowStr = `${8-r} | `;
            for (let c = 0; c < 8; c++) {
                const p = this.getSquare(r, c)?.piece;
                rowStr += p ? ` ${p.type[0]} ` : " . ";
            }
            grid += rowStr + "\n";
        }
        grid += "    -----------------------\n      a  b  c  d  e  f  g  h";
        console.log("%cGrille actuelle :\n" + grid, "font-family: monospace; color: #4CAF50;");
    }
}

// Initialisation au chargement
ChessBoard.init();
window.ChessBoard = ChessBoard;