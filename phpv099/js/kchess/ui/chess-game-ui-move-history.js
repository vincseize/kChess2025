// ui/chess-game-ui-move-history.js - Gestion de l'historique des coups
class ChessMoveHistoryManager {
    
    static consoleLog = false; // Valeur par défaut - sera écrasée par la config JSON
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('ui/chess-game-ui-move-history.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            console.info('🔇 ChessMoveHistoryManager: Mode silencieux activé');
        }
    }
    
    // Méthode pour charger la configuration depuis window.appConfig
    static loadConfig() {
        try {
            // Vérifier si la configuration globale existe
            if (window.appConfig && window.appConfig.debug) {
                const configValue = window.appConfig.debug.console_log;
                
                // CONVERSION CORRECTE - Gérer les string "false" et "true"
                if (configValue === "false") {
                    this.consoleLog = false;
                } else if (configValue === false) {
                    this.consoleLog = false;
                } else if (configValue === "true") {
                    this.consoleLog = true;
                } else if (configValue === true) {
                    this.consoleLog = true;
                } else {
                    // Pour toute autre valeur, utiliser Boolean()
                    this.consoleLog = Boolean(configValue);
                }
                
                // Log de confirmation (uniquement en mode debug)
                if (this.consoleLog) {
                    console.log(`⚙️ ChessMoveHistoryManager: Configuration chargée - console_log = ${this.consoleLog}`);
                }
                return true;
            }
            
            // Si window.appConfig n'existe pas, essayer de le charger via fonction utilitaire
            if (typeof window.getConfig === 'function') {
                const configValue = window.getConfig('debug.console_log', 'true');
                
                if (configValue === "false") {
                    this.consoleLog = false;
                } else if (configValue === false) {
                    this.consoleLog = false;
                } else {
                    this.consoleLog = Boolean(configValue);
                }
                return true;
            }
            
            // Si rien n'est disponible, garder la valeur par défaut
            if (this.consoleLog) {
                console.warn('⚠️ ChessMoveHistoryManager: Aucune configuration trouvée, utilisation de la valeur par défaut (true)');
            }
            return false;
            
        } catch (error) {
            console.error('❌ ChessMoveHistoryManager: Erreur lors du chargement de la config:', error);
            return false;
        }
    }
    
    // Méthode pour déterminer la source de la configuration
    static getConfigSource() {
        if (window.appConfig) {
            return 'JSON config';
        } else if (typeof window.getConfig === 'function') {
            return 'fonction getConfig';
        } else {
            return 'valeur par défaut';
        }
    }
    
    // Méthode pour vérifier si on est en mode debug
    static isDebugMode() {
        return this.consoleLog;
    }

    constructor(ui) {
        this.ui = ui;
        
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        if (this.constructor.consoleLog) {
            console.log('📋 ChessMoveHistoryManager initialisé');
            console.log(`  - UI: ${ui ? '✓' : '✗'}`);
        }
    }

    updateMoveHistory() {
        // Vérifier la configuration avant l'action
        if (!this.constructor.consoleLog && window.appConfig) {
            this.constructor.loadConfig();
        }
        
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
        // Vérifier la configuration avant l'action
        if (!this.constructor.consoleLog && window.appConfig) {
            this.constructor.loadConfig();
        }
        
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
            if (this.constructor.consoleLog) {
                console.log(`    Notation prédéfinie: ${move.notation}`);
            }
            return move.notation;
        }
        
        const pieceSymbol = this.getPieceSymbol(move.piece);
        const fromSquare = this.coordinatesToAlgebraic(move.from.row, move.from.col);
        const toSquare = this.coordinatesToAlgebraic(move.to.row, move.to.col);
        
        if (this.constructor.consoleLog) {
            console.log(`    Création notation: ${move.piece} de ${fromSquare} à ${toSquare}`);
        }
        
        let notation = '';
        
        if (move.piece.toLowerCase() === 'pawn') {
            notation = move.captured ? 
                `${fromSquare.charAt(0)}x${toSquare}` : 
                toSquare;
                
            if (this.constructor.consoleLog) {
                console.log(`    Pion: ${notation} ${move.captured ? '(capture)' : ''}`);
            }
        } else {
            notation = move.captured ? 
                `${pieceSymbol}x${toSquare}` : 
                `${pieceSymbol}${toSquare}`;
                
            if (this.constructor.consoleLog) {
                console.log(`    ${move.piece}: ${notation} ${move.captured ? '(capture)' : ''}`);
            }
        }
        
        if (move.piece.toLowerCase() === 'king') {
            if (move.to.col - move.from.col === 2) {
                notation = 'O-O';
                if (this.constructor.consoleLog) {
                    console.log(`    Roi: Petit roque`);
                }
            } else if (move.to.col - move.from.col === -2) {
                notation = 'O-O-O';
                if (this.constructor.consoleLog) {
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
    
    // Méthode pour forcer la mise à jour de la configuration
    static reloadConfig() {
        const oldValue = this.consoleLog;
        this.loadConfig();
        
        if (this.consoleLog && oldValue !== this.consoleLog) {
            console.log(`🔄 ChessMoveHistoryManager: Configuration rechargée: ${oldValue} → ${this.consoleLog}`);
        }
        return this.consoleLog;
    }
}

// Initialisation statique
ChessMoveHistoryManager.init();

// Exposer des fonctions utilitaires globales
window.ChessMoveHistoryManagerUtils = {
    // Forcer le rechargement de la config
    reloadConfig: () => ChessMoveHistoryManager.reloadConfig(),
    
    // Obtenir l'état de la configuration
    getConfigState: () => ({
        consoleLog: ChessMoveHistoryManager.consoleLog,
        source: ChessMoveHistoryManager.getConfigSource(),
        debugMode: ChessMoveHistoryManager.isDebugMode(),
        configValue: window.appConfig?.debug?.console_log
    }),
    
    // Tester la configuration
    testConfig: () => {
        console.group('🧪 Test de configuration ChessMoveHistoryManager');
        console.log('consoleLog actuel:', ChessMoveHistoryManager.consoleLog);
        console.log('Source config:', ChessMoveHistoryManager.getConfigSource());
        console.log('window.appConfig disponible:', !!window.appConfig);
        
        if (window.appConfig) {
            console.log('Valeur debug.console_log dans appConfig:', 
                window.appConfig.debug?.console_log, 
                '(type:', typeof window.appConfig.debug?.console_log + ')');
        }
        
        console.log('Mode debug activé:', ChessMoveHistoryManager.isDebugMode());
        console.groupEnd();
        
        return ChessMoveHistoryManager.consoleLog;
    }
};

window.ChessMoveHistoryManager = ChessMoveHistoryManager;