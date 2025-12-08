// core/chess-board.js - Gestion du plateau physique
class ChessBoard {
    
    static consoleLog = false; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('core/chess-board.js loaded');
        }
    }

    constructor(gameState, pieceManager) {
        this.gameState = gameState;
        this.pieceManager = pieceManager;
        this.squares = [];
        
        if (this.constructor.consoleLog) {
            console.log('🏁 [ChessBoard] Plateau d\'échecs initialisé');
            console.log('📊 [ChessBoard] GameState:', gameState);
            console.log('♟️ [ChessBoard] PieceManager:', pieceManager);
        }
    }

    createBoard() {
        const boardElement = document.getElementById('chessBoard');
        if (!boardElement) {
            if (this.constructor.consoleLog) {
                console.log('❌ [ChessBoard] Élément #chessBoard non trouvé');
            }
            return;
        }

        const boardFlipped = this.gameState.boardFlipped;
        boardElement.setAttribute('data-flipped', boardFlipped.toString());
        boardElement.innerHTML = '';
        this.squares = [];

        if (this.constructor.consoleLog) {
            console.log(`\n🎨 [ChessBoard] === CRÉATION DU PLATEAU ===`);
            console.log(`🎨 [ChessBoard] Plateau ${boardFlipped ? 'retourné' : 'normal'}`);
            console.log(`🎨 [ChessBoard] Élément DOM:`, boardElement);
            console.log(`🎨 [ChessBoard] Création de 64 cases...`);
        }

        for (let displayRow = 0; displayRow < 8; displayRow++) {
            for (let displayCol = 0; displayCol < 8; displayCol++) {
                const { actualRow, actualCol } = this.getActualCoordinates(displayRow, displayCol);
                const squareData = this.createSquare(displayRow, displayCol, actualRow, actualCol);
                this.squares.push(squareData);
                boardElement.appendChild(squareData.element);
            }
        }

        if (this.constructor.consoleLog) {
            console.log(`✅ [ChessBoard] Plateau créé avec ${this.squares.length} cases`);
            console.log(`🎨 [ChessBoard] === FIN CRÉATION ===\n`);
            
            // Afficher un résumé du plateau
            this.displayBoardSummary();
        }
    }

    getActualCoordinates(displayRow, displayCol) {
        let actualRow, actualCol;
        
        if (this.gameState.boardFlipped) {
            actualRow = 7 - displayRow;
            actualCol = 7 - displayCol;
            if (this.constructor.consoleLog) {
                console.log(`  🔄 [ChessBoard] Coordonnées retournées:`);
                console.log(`     • Affichage: [${displayRow},${displayCol}]`);
                console.log(`     • Réel: [${actualRow},${actualCol}]`);
            }
        } else {
            actualRow = displayRow;
            actualCol = displayCol;
            if (this.constructor.consoleLog) {
                console.log(`  📍 [ChessBoard] Coordonnées normales:`);
                console.log(`     • Affichage: [${displayRow},${displayCol}]`);
                console.log(`     • Réel: [${actualRow},${actualCol}]`);
            }
        }
        
        return { actualRow, actualCol };
    }

    createSquare(displayRow, displayCol, actualRow, actualCol) {
        const isWhite = (actualRow + actualCol) % 2 === 0;
        const colorClass = isWhite ? 'white' : 'black';
        
        if (this.constructor.consoleLog) {
            const colorEmoji = isWhite ? '⬜' : '⬛';
            console.log(`  🟦 [ChessBoard] Case [${displayRow},${displayCol}] → [${actualRow},${actualCol}]`);
            console.log(`     • Couleur: ${colorClass} ${colorEmoji}`);
            console.log(`     • Calcul: (${actualRow} + ${actualCol}) % 2 = ${(actualRow + actualCol) % 2}`);
        }

        const squareElement = document.createElement('div');
        squareElement.className = `chess-square ${colorClass}`;
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
        
        if (this.constructor.consoleLog) {
            console.log(`     • DOM: classe="${squareElement.className}"`);
            console.log(`     • Dataset: row=${actualRow}, col=${actualCol}`);
            console.log(`     • Display: row=${displayRow}, col=${displayCol}`);
        }
        
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
                if (this.constructor.consoleLog) {
                    console.log(`     📍 [ChessBoard] Vue noire: lettre en haut`);
                }
            }
            if (actualCol === 7) {
                verticalCoord = numbers[actualRow];
                hasVertical = true;
                if (this.constructor.consoleLog) {
                    console.log(`     📍 [ChessBoard] Vue noire: chiffre à droite`);
                }
            }
        } else {
            // Vue blanche : lettres en bas (ligne 7), chiffres à gauche (colonne 0)
            if (actualRow === 7) {
                horizontalCoord = letters[actualCol];
                hasHorizontal = true;
                if (this.constructor.consoleLog) {
                    console.log(`     📍 [ChessBoard] Vue blanche: lettre en bas`);
                }
            }
            if (actualCol === 0) {
                verticalCoord = numbers[actualRow];
                hasVertical = true;
                if (this.constructor.consoleLog) {
                    console.log(`     📍 [ChessBoard] Vue blanche: chiffre à gauche`);
                }
            }
        }

        // Stocker les deux coordonnées séparément
        squareElement.dataset.coordHorizontal = horizontalCoord;
        squareElement.dataset.coordVertical = verticalCoord;
        squareElement.dataset.coordinateH = hasHorizontal.toString();
        squareElement.dataset.coordinateV = hasVertical.toString();
        
        if (this.constructor.consoleLog) {
            if (hasHorizontal || hasVertical) {
                console.log(`     📍 [ChessBoard] Coordonnées: ${horizontalCoord}${verticalCoord}`);
                console.log(`     📍 [ChessBoard] HasHorizontal: ${hasHorizontal}, HasVertical: ${hasVertical}`);
            }
        }
    }

    placePiece(piece, squareData) {
        if (this.constructor.consoleLog) {
            console.log(`\n♟️ [ChessBoard] === PLACEMENT DE PIÈCE ===`);
            console.log(`♟️ [ChessBoard] Pièce: ${piece.type} (${piece.color})`);
            console.log(`♟️ [ChessBoard] Case: [${squareData.row},${squareData.col}]`);
            console.log(`♟️ [ChessBoard] Display: [${squareData.displayRow},${squareData.displayCol}]`);
        }

        const pieceElement = document.createElement('div');
        pieceElement.className = `chess-piece ${piece.color}`;
        pieceElement.innerHTML = this.pieceManager.getSymbol(piece.type, piece.color);
        pieceElement.dataset.pieceType = piece.type;
        pieceElement.dataset.pieceColor = piece.color;
        
        squareData.element.appendChild(pieceElement);
        squareData.piece = piece;

        if (this.constructor.consoleLog) {
            console.log(`♟️ [ChessBoard] Élément créé: classe="${pieceElement.className}"`);
            console.log(`♟️ [ChessBoard] HTML: ${pieceElement.innerHTML.substring(0, 50)}...`);
            console.log(`♟️ [ChessBoard] === FIN PLACEMENT ===\n`);
        }
    }

    getSquare(row, col) {
        if (this.constructor.consoleLog) {
            console.log(`🔍 [ChessBoard] Recherche case [${row},${col}]`);
        }
        
        const square = this.squares.find(square => square.row === row && square.col === col);
        
        if (this.constructor.consoleLog) {
            if (square) {
                console.log(`✅ [ChessBoard] Case trouvée:`, square);
                console.log(`   • Display: [${square.displayRow},${square.displayCol}]`);
                console.log(`   • Pièce: ${square.piece ? square.piece.type + ' (' + square.piece.color + ')' : 'Aucune'}`);
            } else {
                console.log(`❌ [ChessBoard] Case [${row},${col}] non trouvée`);
            }
        }
        
        return square;
    }

    getPiece(row, col) {
        if (this.constructor.consoleLog) {
            console.log(`🔍 [ChessBoard] Recherche pièce en [${row},${col}]`);
        }
        
        const square = this.getSquare(row, col);
        const piece = square ? square.piece : null;
        
        if (this.constructor.consoleLog) {
            if (piece) {
                console.log(`✅ [ChessBoard] Pièce trouvée: ${piece.type} (${piece.color})`);
            } else {
                console.log(`❌ [ChessBoard] Pas de pièce en [${row},${col}]`);
            }
        }
        
        return piece;
    }

    clearBoard() {
        if (this.constructor.consoleLog) {
            console.log(`\n🧹 [ChessBoard] === VIDAGE DU PLATEAU ===`);
            console.log(`🧹 [ChessBoard] Nombre de cases: ${this.squares.length}`);
        }
        
        let piecesCleared = 0;
        
        this.squares.forEach(square => {
            if (square.piece) {
                piecesCleared++;
            }
            square.element.innerHTML = '';
            square.piece = null;
        });
        
        if (this.constructor.consoleLog) {
            console.log(`🧹 [ChessBoard] ${piecesCleared} pièce(s) supprimée(s)`);
            console.log(`🧹 [ChessBoard] === FIN VIDAGE ===\n`);
        }
    }

    saveCurrentPosition() {
        if (this.constructor.consoleLog) {
            console.log(`\n💾 [ChessBoard] === SAUVEGARDE POSITION ===`);
            console.log(`💾 [ChessBoard] Sauvegarde de la position actuelle...`);
        }
        
        const position = {};
        let pieceCount = 0;
        
        this.squares.forEach(square => {
            if (square.piece) {
                const key = `${square.row}-${square.col}`;
                position[key] = { type: square.piece.type, color: square.piece.color };
                pieceCount++;
                
                if (this.constructor.consoleLog) {
                    console.log(`  💾 [ChessBoard] Pièce sauvegardée: ${key} → ${square.piece.type} (${square.piece.color})`);
                }
            }
        });
        
        if (this.constructor.consoleLog) {
            console.log(`💾 [ChessBoard] ${pieceCount} pièce(s) sauvegardée(s)`);
            console.log(`💾 [ChessBoard] Position:`, position);
            console.log(`💾 [ChessBoard] === FIN SAUVEGARDE ===\n`);
        }
        
        return position;
    }
    
    // NOUVELLE MÉTHODE : Afficher un résumé du plateau
    displayBoardSummary() {
        if (!this.constructor.consoleLog) return;
        
        console.log(`\n📊 [ChessBoard] === RÉSUMÉ DU PLATEAU ===`);
        console.log(`📊 [ChessBoard] Nombre de cases: ${this.squares.length}`);
        console.log(`📊 [ChessBoard] Plateau retourné: ${this.gameState.boardFlipped ? '✅ OUI' : '❌ NON'}`);
        
        // Compter les pièces par couleur et type
        const pieceStats = {
            white: {},
            black: {},
            total: 0
        };
        
        this.squares.forEach(square => {
            if (square.piece) {
                const piece = square.piece;
                const color = piece.color;
                const type = piece.type;
                
                if (!pieceStats[color][type]) {
                    pieceStats[color][type] = 0;
                }
                pieceStats[color][type]++;
                pieceStats.total++;
            }
        });
        
        console.log(`📊 [ChessBoard] Pièces totales: ${pieceStats.total}`);
        console.log(`📊 [ChessBoard] Pièces blanches:`, pieceStats.white);
        console.log(`📊 [ChessBoard] Pièces noires:`, pieceStats.black);
        console.log(`📊 [ChessBoard] === FIN RÉSUMÉ ===\n`);
    }
    
    // NOUVELLE MÉTHODE : Afficher la grille des coordonnées
    displayCoordinatesGrid() {
        if (!this.constructor.consoleLog) return;
        
        console.log(`\n🗺️ [ChessBoard] === GRILLE DE COORDONNÉES ===`);
        for (let row = 0; row < 8; row++) {
            let rowStr = `  ${8-row} `;
            for (let col = 0; col < 8; col++) {
                const square = this.getSquare(row, col);
                if (square) {
                    const piece = square.piece;
                    const pieceChar = piece ? 
                        (piece.color === 'white' ? piece.type.charAt(0).toUpperCase() : piece.type.charAt(0).toLowerCase()) : 
                        '.';
                    rowStr += pieceChar + ' ';
                } else {
                    rowStr += '. ';
                }
            }
            console.log(rowStr);
        }
        console.log('    a b c d e f g h');
        console.log(`🗺️ [ChessBoard] === FIN GRILLE ===\n`);
    }
}

// Initialisation statique
ChessBoard.init();

window.ChessBoard = ChessBoard;