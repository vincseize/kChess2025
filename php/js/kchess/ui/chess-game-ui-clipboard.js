// ui/chess-game-ui-clipboard.js - Gestion de la copie FEN/PNG
class ChessClipboardManager {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('ui/chess-game-ui-clipboard.js loaded');
        }
    }

    constructor(ui) {
        this.ui = ui;
        
        if (this.constructor.consoleLog) {
            console.log('📋 [ClipboardManager] Gestionnaire de presse-papier initialisé');
            console.log('📋 [ClipboardManager] UI parent:', ui);
        }
    }

    copyFENToClipboard() {
        if (this.constructor.consoleLog) {
            console.log('\n📄 [ClipboardManager] === COPIE FEN ===');
            console.log('📄 [ClipboardManager] Début de la copie FEN...');
        }
        
        try {
            if (this.constructor.consoleLog) {
                console.log('📄 [ClipboardManager] Génération du FEN...');
            }
            
            const fen = FENGenerator.generateFEN(this.ui.game.gameState, this.ui.game.board);
            
            if (this.constructor.consoleLog) {
                console.log(`📄 [ClipboardManager] FEN généré: ${fen.substring(0, 60)}...`);
                console.log('📄 [ClipboardManager] Longueur du FEN:', fen.length, 'caractères');
            }
            
            if (this.constructor.consoleLog) {
                console.log('📄 [ClipboardManager] Copie dans le presse-papier...');
            }
            
            navigator.clipboard.writeText(fen).then(() => {
                if (this.constructor.consoleLog) {
                    console.log('✅ [ClipboardManager] FEN copié avec succès');
                }
                
                this.ui.showNotification('FEN copié dans le presse-papier !', 'success');
                
                if (this.constructor.consoleLog) {
                    console.log('📄 [ClipboardManager] Notification affichée');
                }
                
            }).catch(err => {
                if (this.constructor.consoleLog) {
                    console.log(`❌ [ClipboardManager] Erreur lors de la copie FEN: ${err.message}`);
                    console.error('Clipboard error:', err);
                }
                
                this.ui.showNotification('Erreur lors de la copie du FEN', 'error');
                
                // Fallback pour les navigateurs sans clipboard API
                this.fallbackCopyFEN(fen);
            });
            
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [ClipboardManager] Erreur génération FEN: ${error.message}`);
                console.error('FEN generation error:', error);
            }
            
            this.ui.showNotification('Erreur génération FEN', 'error');
        }
        
        if (this.constructor.consoleLog) {
            console.log('📄 [ClipboardManager] === FIN COPIE FEN ===\n');
        }
    }

    copyPGNToClipboard() {
        if (this.constructor.consoleLog) {
            console.log('\n📜 [ClipboardManager] === COPIE PGN ===');
            console.log('📜 [ClipboardManager] Début de la copie PGN...');
        }
        
        try {
            if (this.constructor.consoleLog) {
                console.log('📜 [ClipboardManager] Génération du PGN...');
            }
            
            const pgn = this.ui.game.gameState.getFullPGN();
            
            if (this.constructor.consoleLog) {
                console.log(`📜 [ClipboardManager] PGN généré: ${pgn.substring(0, 100)}...`);
                console.log('📜 [ClipboardManager] Longueur du PGN:', pgn.length, 'caractères');
                
                // Compter le nombre de coups
                const moveCount = this.ui.game.gameState.moveHistory.length;
                console.log(`📜 [ClipboardManager] Nombre de coups: ${moveCount}`);
            }
            
            if (this.constructor.consoleLog) {
                console.log('📜 [ClipboardManager] Copie dans le presse-papier...');
            }
            
            navigator.clipboard.writeText(pgn).then(() => {
                if (this.constructor.consoleLog) {
                    console.log('✅ [ClipboardManager] PGN copié avec succès');
                }
                
                this.ui.showNotification('PGN copié dans le presse-papier !', 'success');
                
                if (this.constructor.consoleLog) {
                    console.log('📜 [ClipboardManager] Notification affichée');
                }
                
            }).catch(err => {
                if (this.constructor.consoleLog) {
                    console.log(`❌ [ClipboardManager] Erreur lors de la copie PGN: ${err.message}`);
                    console.error('Clipboard error:', err);
                }
                
                this.ui.showNotification('Erreur lors de la copie du PGN', 'error');
                
                // Fallback pour les navigateurs sans clipboard API
                this.fallbackCopyPGN(pgn);
            });
            
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [ClipboardManager] Erreur génération PGN: ${error.message}`);
                console.error('PGN generation error:', error);
            }
            
            this.ui.showNotification('Erreur génération PGN', 'error');
        }
        
        if (this.constructor.consoleLog) {
            console.log('📜 [ClipboardManager] === FIN COPIE PGN ===\n');
        }
    }

    // Fallback pour les navigateurs sans clipboard API
    fallbackCopyFEN(fen) {
        if (this.constructor.consoleLog) {
            console.log('🔧 [ClipboardManager] Tentative de fallback pour copie FEN...');
        }
        
        try {
            const textarea = document.createElement('textarea');
            textarea.value = fen;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            textarea.setSelectionRange(0, 99999);
            
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (success) {
                if (this.constructor.consoleLog) {
                    console.log('✅ [ClipboardManager] Fallback FEN réussi');
                }
                this.ui.showNotification('FEN copié (méthode fallback)', 'success');
            } else {
                if (this.constructor.consoleLog) {
                    console.log('❌ [ClipboardManager] Fallback FEN échoué');
                }
                this.ui.showNotification('Impossible de copier le FEN', 'error');
            }
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [ClipboardManager] Erreur fallback FEN: ${error.message}`);
            }
        }
    }

    // Fallback pour les navigateurs sans clipboard API
    fallbackCopyPGN(pgn) {
        if (this.constructor.consoleLog) {
            console.log('🔧 [ClipboardManager] Tentative de fallback pour copie PGN...');
        }
        
        try {
            const textarea = document.createElement('textarea');
            textarea.value = pgn;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            textarea.setSelectionRange(0, 99999);
            
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (success) {
                if (this.constructor.consoleLog) {
                    console.log('✅ [ClipboardManager] Fallback PGN réussi');
                }
                this.ui.showNotification('PGN copié (méthode fallback)', 'success');
            } else {
                if (this.constructor.consoleLog) {
                    console.log('❌ [ClipboardManager] Fallback PGN échoué');
                }
                this.ui.showNotification('Impossible de copier le PGN', 'error');
            }
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [ClipboardManager] Erreur fallback PGN: ${error.message}`);
            }
        }
    }
    
    // NOUVELLE MÉTHODE : Copie rapide du FEN pour debug
    quickCopyFEN() {
        if (this.constructor.consoleLog) {
            console.log('⚡ [ClipboardManager] Copie rapide FEN demandée...');
        }
        
        const fen = FENGenerator.generateFEN(this.ui.game.gameState, this.ui.game.board);
        
        // Copie silencieuse (sans notification)
        navigator.clipboard.writeText(fen).then(() => {
            if (this.constructor.consoleLog) {
                console.log('✅ [ClipboardManager] FEN copié silencieusement');
            }
        }).catch(() => {
            // Ignorer les erreurs en mode silencieux
        });
    }
    
    // NOUVELLE MÉTHODE : Vérifier si le clipboard est disponible
    isClipboardAvailable() {
        const available = navigator.clipboard !== undefined;
        
        if (this.constructor.consoleLog) {
            console.log(`🔍 [ClipboardManager] Clipboard API disponible? ${available ? '✅ OUI' : '❌ NON'}`);
        }
        
        return available;
    }
    
    // NOUVELLE MÉTHODE : Obtenir les statistiques du FEN/PNG
    getClipboardStats() {
        const stats = {
            fen: {
                length: 0,
                generated: false
            },
            pgn: {
                length: 0,
                moveCount: 0,
                generated: false
            }
        };
        
        try {
            const fen = FENGenerator.generateFEN(this.ui.game.gameState, this.ui.game.board);
            stats.fen.length = fen.length;
            stats.fen.generated = true;
            
            if (this.constructor.consoleLog) {
                console.log(`📊 [ClipboardManager] FEN: ${fen.length} caractères`);
            }
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [ClipboardManager] Impossible de générer stats FEN: ${error.message}`);
            }
        }
        
        try {
            const pgn = this.ui.game.gameState.getFullPGN();
            stats.pgn.length = pgn.length;
            stats.pgn.moveCount = this.ui.game.gameState.moveHistory.length;
            stats.pgn.generated = true;
            
            if (this.constructor.consoleLog) {
                console.log(`📊 [ClipboardManager] PGN: ${pgn.length} caractères, ${stats.pgn.moveCount} coups`);
            }
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [ClipboardManager] Impossible de générer stats PGN: ${error.message}`);
            }
        }
        
        return stats;
    }
}

// Initialisation statique
ChessClipboardManager.init();