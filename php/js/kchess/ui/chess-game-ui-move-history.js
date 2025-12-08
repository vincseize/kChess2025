// ui/chess-game-ui-move-history.js - Gestion de l'historique des coups
class ChessMoveHistoryManager {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('ui/chess-game-ui-move-history.js loaded');
        }
    }

    constructor(ui) {
        this.ui = ui;
        
        if (this.constructor.consoleLog) {
            console.log('📋 ChessMoveHistoryManager initialisé');
            console.log(`  - UI: ${ui ? '✓' : '✗'}`);
        }
    }

    updateMoveHistory() {
        if (this.constructor.consoleLog) {
            console.log('\n📋 Mise à jour de l\'historique des coups');
        }
        
        const moveHistoryElement = document.getElementById('moveHistory');
        if (!moveHistoryElement) {
            if (this.constructor.consoleLog) {
                console.log('  ❌ Élément moveHistory non trouvé');
            }
            return;
        }
        
        const moves = this.ui.game.gameState.moveHistory;
        
        if (this.constructor.consoleLog) {
            console.log(`  - Nombre de coups dans l'historique: ${moves.length}`);
            if (moves.length > 0) {
                console.log('  - Coups disponibles:');
                moves.forEach((move, index) => {
                    console.log(`    ${index + 1}. ${this.getMoveNotation(move)} (${move.piece})`);
                });
            }
        }
        
        moveHistoryElement.innerHTML = '';
        moveHistoryElement.className = 'move-history-container';
        
        if (moves.length === 0) {
            moveHistoryElement.innerHTML = '<div class="text-center text-muted small p-3">Aucun coup joué</div>';
            
            if (this.constructor.consoleLog) {
                console.log('  📝 Affichage: "Aucun coup joué"');
            }
            
            moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight;
            return;
        }
        
        let rowCount = 0;
        
        for (let i = 0; i < moves.length; i += 2) {
            rowCount++;
            const moveRowElement = document.createElement('div');
            moveRowElement.className = 'move-row';
            
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = moves[i];
            const blackMove = moves[i + 1];
            
            moveRowElement.addEventListener('click', () => {
                this.selectMoveRow(moveRowElement, i, moveNumber);
            });
            
            let moveHTML = '';
            moveHTML += `<span class="move-number">${moveNumber}.</span>`;
            
            if (whiteMove) {
                const whiteNotation = this.getMoveNotation(whiteMove);
                moveHTML += `<span class="white-move">${whiteNotation}</span>`;
                
                if (this.constructor.consoleLog) {
                    console.log(`  📝 Ligne ${moveNumber}. Blanc: ${whiteNotation}`);
                }
            }
            
            if (blackMove) {
                const blackNotation = this.getMoveNotation(blackMove);
                moveHTML += `<span class="black-move">${blackNotation}</span>`;
                
                if (this.constructor.consoleLog) {
                    console.log(`         Noir: ${blackNotation}`);
                }
            } else if (whiteMove) {
                if (this.constructor.consoleLog) {
                    console.log(`         Noir: (en attente)`);
                }
            }
            
            moveRowElement.innerHTML = moveHTML;
            moveHistoryElement.appendChild(moveRowElement);
        }
        
        if (this.constructor.consoleLog) {
            console.log(`  - ${rowCount} lignes créées dans l'historique`);
        }
        
        moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight;
        
        if (this.constructor.consoleLog) {
            console.log('  ✅ Historique mis à jour avec succès');
        }
    }

    selectMoveRow(rowElement, startIndex, moveNumber) {
        if (this.constructor.consoleLog) {
            console.log(`\n📋 Sélection de la ligne de mouvement ${moveNumber}`);
        }
        
        document.querySelectorAll('.move-row').forEach(row => {
            row.classList.remove('selected');
        });
        
        rowElement.classList.add('selected');
        
        const moves = this.ui.game.gameState.moveHistory;
        const whiteMove = moves[startIndex];
        const blackMove = moves[startIndex + 1];
        
        if (this.constructor.consoleLog) {
            if (whiteMove) {
                console.log(`  - Coup blanc: ${this.getMoveNotation(whiteMove)}`);
                console.log(`    De: [${whiteMove.from.row},${whiteMove.from.col}] → À: [${whiteMove.to.row},${whiteMove.to.col}]`);
                console.log(`    Pièce: ${whiteMove.piece} ${whiteMove.captured ? '(capture)' : ''}`);
            }
            
            if (blackMove) {
                console.log(`  - Coup noir: ${this.getMoveNotation(blackMove)}`);
                console.log(`    De: [${blackMove.from.row},${blackMove.from.col}] → À: [${blackMove.to.row},${blackMove.to.col}]`);
                console.log(`    Pièce: ${blackMove.piece} ${blackMove.captured ? '(capture)' : ''}`);
            }
            
            console.log(`  ✅ Ligne ${moveNumber} sélectionnée`);
        }
    }

    getMoveNotation(move) {
        if (!move) {
            if (this.constructor.consoleLog) {
                console.warn('  ⚠️ getMoveNotation: mouvement non défini');
            }
            return '';
        }
        
        if (move.notation) {
            if (this.constructor.consoleLog && this.constructor.consoleLog) {
                console.log(`    Notation prédéfinie: ${move.notation}`);
            }
            return move.notation;
        }
        
        const pieceSymbol = this.getPieceSymbol(move.piece);
        const fromSquare = this.coordinatesToAlgebraic(move.from.row, move.from.col);
        const toSquare = this.coordinatesToAlgebraic(move.to.row, move.to.col);
        
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`    Création notation: ${move.piece} de ${fromSquare} à ${toSquare}`);
        }
        
        let notation = '';
        
        if (move.piece.toLowerCase() === 'pawn') {
            notation = move.captured ? 
                `${fromSquare.charAt(0)}x${toSquare}` : 
                toSquare;
                
            if (this.constructor.consoleLog && this.constructor.consoleLog) {
                console.log(`    Pion: ${notation} ${move.captured ? '(capture)' : ''}`);
            }
        } else {
            notation = move.captured ? 
                `${pieceSymbol}x${toSquare}` : 
                `${pieceSymbol}${toSquare}`;
                
            if (this.constructor.consoleLog && this.constructor.consoleLog) {
                console.log(`    ${move.piece}: ${notation} ${move.captured ? '(capture)' : ''}`);
            }
        }
        
        if (move.piece.toLowerCase() === 'king') {
            if (move.to.col - move.from.col === 2) {
                notation = 'O-O';
                if (this.constructor.consoleLog && this.constructor.consoleLog) {
                    console.log(`    Roi: Petit roque`);
                }
            } else if (move.to.col - move.from.col === -2) {
                notation = 'O-O-O';
                if (this.constructor.consoleLog && this.constructor.consoleLog) {
                    console.log(`    Roi: Grand roque`);
                }
            }
        }
        
        return notation;
    }

    coordinatesToAlgebraic(row, col) {
        if (row < 0 || row > 7 || col < 0 || col > 7) {
            if (this.constructor.consoleLog) {
                console.warn(`  ⚠️ Coordonnées invalides: [${row},${col}]`);
            }
            return '??';
        }
        
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        const algebraic = files[col] + ranks[row];
        
        return algebraic;
    }

    getPieceSymbol(pieceType) {
        if (!pieceType) {
            if (this.constructor.consoleLog) {
                console.warn('  ⚠️ getPieceSymbol: type de pièce non défini');
            }
            return '?';
        }
        
        const symbols = {
            'king': 'K',
            'queen': 'Q', 
            'rook': 'R',
            'bishop': 'B',
            'knight': 'N',
            'pawn': ''
        };
        
        const symbol = symbols[pieceType.toLowerCase()] || '?';
        
        return symbol;
    }
}

// Initialisation statique
ChessMoveHistoryManager.init();

window.ChessMoveHistoryManager = ChessMoveHistoryManager;