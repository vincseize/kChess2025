// ui/chess-events.js - Initialisation du jeu SIMPLIFIÉE
class ChessEventsManager {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('ui/chess-events.js loaded');
        }
    }

    // ============================================
    // FONCTION GLOBALE POUR METTRE À JOUR LES LABELS
    // ============================================
    static updatePlayerLabels() {
        if (this.constructor.consoleLog) {
            console.log('\n🏷️ [ChessEvents] === MISE À JOUR DES LABELS ===');
        }
        
        const topLabel = document.getElementById('topPlayerLabel');
        const bottomLabel = document.getElementById('bottomPlayerLabel');
        
        if (!topLabel || !bottomLabel) {
            if (this.constructor.consoleLog) {
                console.warn('⚠️ [ChessEvents] Labels des joueurs non trouvés');
            }
            return;
        }
        
        try {
            // Récupérer l'état du plateau depuis le jeu
            let isFlipped = false;
            
            if (window.chessGame) {
                // Essayer d'obtenir l'état depuis le core
                if (window.chessGame.core && window.chessGame.core.gameState) {
                    isFlipped = window.chessGame.core.gameState.boardFlipped;
                }
            }
            
            if (this.constructor.consoleLog) {
                console.log(`🏷️ [ChessEvents] État du plateau: ${isFlipped ? 'retourné' : 'normal'}`);
            }
            
            // Récupérer le statut du bot
            const botStatus = window.chessGame && window.chessGame.getBotStatus ? 
                             window.chessGame.getBotStatus() : 
                             { active: false, level: 0, color: '' };
            
            if (this.constructor.consoleLog && botStatus.active) {
                console.log(`🤖 [ChessEvents] Bot actif: niveau ${botStatus.level}, couleur ${botStatus.color}`);
            }
            
            // Déterminer le texte pour chaque joueur
            let topText, bottomText, topClass, bottomClass;
            
            if (isFlipped) {
                // Plateau inversé: blancs en haut, noirs en bas
                topText = 'Blancs';
                bottomText = 'Noirs';
                
                // Ajouter "Bot" si le bot joue cette couleur
                if (botStatus.active && botStatus.color === 'white') {
                    topText = `Blancs (Bot Niv.${botStatus.level})`;
                    topClass = 'bot-player bot-color-white';
                    if (this.constructor.consoleLog) {
                        console.log('🤖 [ChessEvents] Bot joue les blancs (en haut)');
                    }
                }
                if (botStatus.active && botStatus.color === 'black') {
                    bottomText = `Noirs (Bot Niv.${botStatus.level})`;
                    bottomClass = 'bot-player bot-color-black';
                    if (this.constructor.consoleLog) {
                        console.log('🤖 [ChessEvents] Bot joue les noirs (en bas)');
                    }
                }
                
                // Classes CSS
                topClass = (topClass || '') + ' badge bg-white text-dark border border-dark p-2';
                bottomClass = (bottomClass || '') + ' badge bg-dark text-white p-2';
                
            } else {
                // Plateau normal: noirs en haut, blancs en bas
                topText = 'Noirs';
                bottomText = 'Blancs';
                
                // Ajouter "Bot" si le bot joue cette couleur
                if (botStatus.active && botStatus.color === 'black') {
                    topText = `Noirs (Bot Niv.${botStatus.level})`;
                    topClass = 'bot-player bot-color-black';
                    if (this.constructor.consoleLog) {
                        console.log('🤖 [ChessEvents] Bot joue les noirs (en haut)');
                    }
                }
                if (botStatus.active && botStatus.color === 'white') {
                    bottomText = `Blancs (Bot Niv.${botStatus.level})`;
                    bottomClass = 'bot-player bot-color-white';
                    if (this.constructor.consoleLog) {
                        console.log('🤖 [ChessEvents] Bot joue les blancs (en bas)');
                    }
                }
                
                // Classes CSS
                topClass = (topClass || '') + ' badge bg-dark text-white p-2';
                bottomClass = (bottomClass || '') + ' badge bg-white text-dark border border-dark p-2';
            }
            
            // Mettre à jour les labels
            const topIcon = botStatus.active && (
                (isFlipped && botStatus.color === 'white') || 
                (!isFlipped && botStatus.color === 'black')
            ) ? '<i class="bi bi-cpu me-1"></i>' : '<i class="bi bi-person me-1"></i>';
            
            const bottomIcon = botStatus.active && (
                (isFlipped && botStatus.color === 'black') || 
                (!isFlipped && botStatus.color === 'white')
            ) ? '<i class="bi bi-cpu me-1"></i>' : '<i class="bi bi-person me-1"></i>';
            
            topLabel.innerHTML = `${topIcon} ${topText}`;
            topLabel.className = topClass;
            
            bottomLabel.innerHTML = `${bottomIcon} ${bottomText}`;
            bottomLabel.className = bottomClass;
            
            if (this.constructor.consoleLog) {
                console.log('✅ [ChessEvents] Labels mis à jour avec succès:', { 
                    topText, 
                    bottomText, 
                    botActive: botStatus.active,
                    botLevel: botStatus.level,
                    botColor: botStatus.color 
                });
                console.log('🏷️ [ChessEvents] === FIN MISE À JOUR ===\n');
            }
            
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [ChessEvents] Erreur updatePlayerLabels: ${error.message}`);
            }
        }
    }
}

// ============================================
// INITIALISATION PRINCIPALE
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    if (ChessEventsManager.consoleLog) {
        console.log('\n🚀 [ChessEvents] === INITIALISATION ===');
        console.log('🚀 [ChessEvents] DOM Content Loaded - Début initialisation');
    }
    
    // Initialiser le jeu
    initializeChessGame();
    
    // Configurer les événements
    setupEventListeners();
    
    // Mettre à jour les labels initiaux après un délai
    setTimeout(() => {
        ChessEventsManager.updatePlayerLabels();
        if (ChessEventsManager.consoleLog) {
            console.log('✅ [ChessEvents] Labels initiaux mis à jour');
            console.log('🚀 [ChessEvents] === INITIALISATION TERMINÉE ===\n');
        }
    }, 800);
});

// ============================================
// INITIALISATION DU JEU
// ============================================
function initializeChessGame() {
    try {
        if (typeof ChessGame !== 'undefined' && !window.chessGame) {
            window.chessGame = new ChessGame();
            
            if (ChessEventsManager.consoleLog) {
                console.log('✅ [ChessEvents] ChessGame initialisé avec succès');
            }
            
            // Attacher la fonction updatePlayerLabels au jeu pour y accéder facilement
            if (window.chessGame.core) {
                window.chessGame.core.updatePlayerLabels = ChessEventsManager.updatePlayerLabels;
                
                if (ChessEventsManager.consoleLog) {
                    console.log('✅ [ChessEvents] updatePlayerLabels attaché au core');
                }
            }
        } else if (window.chessGame) {
            if (ChessEventsManager.consoleLog) {
                console.log('ℹ️ [ChessEvents] ChessGame déjà initialisé');
            }
        } else {
            if (ChessEventsManager.consoleLog) {
                console.log('❌ [ChessEvents] ChessGame non disponible');
            }
            // Réessayer après délai
            setTimeout(() => {
                if (typeof ChessGame !== 'undefined' && !window.chessGame) {
                    window.chessGame = new ChessGame();
                    
                    if (ChessEventsManager.consoleLog) {
                        console.log('✅ [ChessEvents] ChessGame initialisé avec délai');
                    }
                }
            }, 1500);
        }
    } catch (error) {
        if (ChessEventsManager.consoleLog) {
            console.log(`❌ [ChessEvents] Erreur initialisation ChessGame: ${error.message}`);
        }
    }
}

// ============================================
// CONFIGURATION DES ÉVÉNEMENTS
// ============================================
function setupEventListeners() {
    if (ChessEventsManager.consoleLog) {
        console.log('📱 [ChessEvents] Configuration des événements...');
    }
    
    // Configurer les boutons mobiles
    setupMobileButtons();
    
    // Configurer les boutons desktop
    setupDesktopButtons();
    
    // Observer les changements de l'URL
    setupURLObserver();
    
    // Mettre à jour les labels lors du redimensionnement
    window.addEventListener('resize', () => {
        if (ChessEventsManager.consoleLog) {
            console.log('🔄 [ChessEvents] Redimensionnement détecté');
        }
        setTimeout(ChessEventsManager.updatePlayerLabels, 100);
    });
}

// ============================================
// CONFIGURATION DES BOUTONS MOBILES
// ============================================
function setupMobileButtons() {
    const mobileButtons = [
        { 
            id: 'newGameMobile', 
            action: () => confirmNewGame(),
            description: 'Nouvelle partie mobile'
        },
        { 
            id: 'flipBoardMobile', 
            action: () => flipBoardWithLabelsUpdate(),
            description: 'Flip plateau mobile'
        }
    ];
    
    mobileButtons.forEach(button => {
        const element = document.getElementById(button.id);
        if (element) {
            if (ChessEventsManager.consoleLog) {
                console.log(`✅ [ChessEvents] Configuration bouton mobile: ${button.description}`);
            }
            
            // Cloner pour nettoyer les événements
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            // Événement click
            newElement.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (ChessEventsManager.consoleLog) {
                    console.log(`📱 [ChessEvents] Click sur ${button.description}`);
                }
                
                button.action();
            });
            
            // Événement touch pour mobile
            newElement.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (ChessEventsManager.consoleLog) {
                    console.log(`📱 [ChessEvents] Touch sur ${button.description}`);
                }
                
                button.action();
            });
            
            // Style pour meilleure expérience mobile
            newElement.style.cursor = 'pointer';
            newElement.style.touchAction = 'manipulation';
            newElement.style.userSelect = 'none';
            
        } else {
            if (ChessEventsManager.consoleLog) {
                console.warn(`⚠️ [ChessEvents] Bouton mobile ${button.id} non trouvé`);
            }
        }
    });
}

// ============================================
// CONFIGURATION DES BOUTONS DESKTOP
// ============================================
function setupDesktopButtons() {
    const desktopButtons = [
        { 
            selector: '#newGame', 
            action: () => confirmNewGame(),
            description: 'Nouvelle partie desktop'
        },
        { 
            selector: '#flipBoard', 
            action: () => flipBoardWithLabelsUpdate(),
            description: 'Flip plateau desktop'
        },
        { 
            selector: '.new-game-btn:not(#newGameMobile)', 
            action: () => confirmNewGame(),
            description: 'Nouvelle partie générique'
        },
        { 
            selector: '.flip-board-btn:not(#flipBoardMobile)', 
            action: () => flipBoardWithLabelsUpdate(),
            description: 'Flip plateau générique'
        }
    ];
    
    desktopButtons.forEach(button => {
        const elements = document.querySelectorAll(button.selector);
        elements.forEach(element => {
            // Cloner pour nettoyer les anciens événements
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            // Événement click
            newElement.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (ChessEventsManager.consoleLog) {
                    console.log(`🖥️ [ChessEvents] Click sur ${button.description}`);
                }
                
                button.action();
            });
        });
    });
    
    // Boutons de copie
    document.getElementById('copyPGN')?.addEventListener('click', () => copyPGN());
    document.getElementById('copyFEN')?.addEventListener('click', () => copyFEN());
}

// ============================================
// FONCTION POUR TOURNER LE PLATEAU
// ============================================
function flipBoardWithLabelsUpdate() {
    if (ChessEventsManager.consoleLog) {
        console.log('\n🔄 [ChessEvents] === FLIP DU PLATEAU ===');
    }
    
    if (window.chessGame && typeof window.chessGame.flipBoard === 'function') {
        // Appeler la fonction flip du jeu
        window.chessGame.flipBoard();
        
        if (ChessEventsManager.consoleLog) {
            console.log('🔄 [ChessEvents] Flip via window.chessGame.flipBoard()');
        }
        
        // Mettre à jour les labels après un court délai
        setTimeout(() => {
            ChessEventsManager.updatePlayerLabels();
            
            if (ChessEventsManager.consoleLog) {
                console.log('✅ [ChessEvents] Labels mis à jour après flip (via ChessGame)');
                console.log('🔄 [ChessEvents] === FIN FLIP ===\n');
            }
        }, 100);
    } else if (window.chessGame && window.chessGame.core && typeof window.chessGame.core.flipBoard === 'function') {
        // Alternative: appeler via core
        window.chessGame.core.flipBoard();
        
        if (ChessEventsManager.consoleLog) {
            console.log('🔄 [ChessEvents] Flip via window.chessGame.core.flipBoard()');
        }
        
        setTimeout(() => {
            ChessEventsManager.updatePlayerLabels();
            
            if (ChessEventsManager.consoleLog) {
                console.log('✅ [ChessEvents] Labels mis à jour après flip (via core)');
                console.log('🔄 [ChessEvents] === FIN FLIP ===\n');
            }
        }, 100);
    } else {
        if (ChessEventsManager.consoleLog) {
            console.log('❌ [ChessEvents] flipBoard non disponible');
            console.log('⚠️ [ChessEvents] Flip simulé (labels seulement)');
        }
        
        // Fallback: juste mettre à jour les labels visuellement
        ChessEventsManager.updatePlayerLabels();
    }
}

// ============================================
// CONFIRMATION NOUVELLE PARTIE
// ============================================
function confirmNewGame() {
    if (ChessEventsManager.consoleLog) {
        console.log('\n🆕 [ChessEvents] === NOUVELLE PARTIE ===');
    }
    
    if (window.chessGame) {
        // Nouvelle architecture modulaire
        if (window.chessGame.core && window.chessGame.core.ui && window.chessGame.core.ui.modalManager) {
            const result = window.chessGame.core.ui.modalManager.confirmNewGame();
            
            if (ChessEventsManager.consoleLog) {
                console.log(`✅ [ChessEvents] ModalManager confirmNewGame: ${result ? 'accepted' : 'canceled'}`);
            }
            
            if (result) {
                // Mettre à jour les labels après une nouvelle partie
                setTimeout(() => {
                    ChessEventsManager.updatePlayerLabels();
                    
                    if (ChessEventsManager.consoleLog) {
                        console.log('✅ [ChessEvents] Labels mis à jour après nouvelle partie');
                        console.log('🆕 [ChessEvents] === FIN NOUVELLE PARTIE ===\n');
                    }
                }, 800);
            }
            return result;
        }
        // Ancienne architecture
        else if (window.chessGame.core && window.chessGame.core.ui && typeof window.chessGame.core.ui.confirmNewGame === 'function') {
            const result = window.chessGame.core.ui.confirmNewGame();
            
            if (ChessEventsManager.consoleLog) {
                console.log(`✅ [ChessEvents] UI confirmNewGame: ${result ? 'accepted' : 'canceled'}`);
            }
            
            if (result) {
                setTimeout(() => {
                    ChessEventsManager.updatePlayerLabels();
                    
                    if (ChessEventsManager.consoleLog) {
                        console.log('✅ [ChessEvents] Labels mis à jour après nouvelle partie');
                        console.log('🆕 [ChessEvents] === FIN NOUVELLE PARTIE ===\n');
                    }
                }, 800);
            }
            return result;
        }
        // Fallback
        else {
            if (ChessEventsManager.consoleLog) {
                console.log('❌ [ChessEvents] Aucune méthode confirmNewGame disponible');
            }
            redirectToIndex();
            return false;
        }
    } else {
        if (ChessEventsManager.consoleLog) {
            console.log('❌ [ChessEvents] Jeu non initialisé');
        }
        redirectToIndex();
        return false;
    }
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================
function redirectToIndex() {
    if (ChessEventsManager.consoleLog) {
        console.log('🔄 [ChessEvents] Redirection vers index.php');
    }
    window.location.href = 'index.php';
}

function copyPGN() {
    if (window.chessGame && typeof window.chessGame.copyPGN === 'function') {
        window.chessGame.copyPGN();
        
        if (ChessEventsManager.consoleLog) {
            console.log('📋 [ChessEvents] PGN copié');
        }
    } else {
        if (ChessEventsManager.consoleLog) {
            console.warn('❌ [ChessEvents] copyPGN non disponible');
        }
    }
}

function copyFEN() {
    if (window.chessGame && typeof window.chessGame.copyFEN === 'function') {
        window.chessGame.copyFEN();
        
        if (ChessEventsManager.consoleLog) {
            console.log('📋 [ChessEvents] FEN copié');
        }
    } else {
        if (ChessEventsManager.consoleLog) {
            console.warn('❌ [ChessEvents] copyFEN non disponible');
        }
    }
}

// ============================================
// OBSERVATEUR D'URL
// ============================================
function setupURLObserver() {
    let lastURL = window.location.href;
    
    // Vérifier les changements d'URL toutes les 500ms
    const urlObserver = setInterval(() => {
        if (window.location.href !== lastURL) {
            lastURL = window.location.href;
            
            if (ChessEventsManager.consoleLog) {
                console.log('🔗 [ChessEvents] URL changée, mise à jour des labels');
            }
            
            setTimeout(ChessEventsManager.updatePlayerLabels, 500);
        }
    }, 500);
    
    // Nettoyer l'observateur si la page est déchargée
    window.addEventListener('beforeunload', () => {
        clearInterval(urlObserver);
        
        if (ChessEventsManager.consoleLog) {
            console.log('🧹 [ChessEvents] Observateur d\'URL nettoyé');
        }
    });
}

// ============================================
// ÉVÉNEMENTS DE VISIBILITÉ DE PAGE
// ============================================
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        if (ChessEventsManager.consoleLog) {
            console.log('👀 [ChessEvents] Page visible, mise à jour des labels');
        }
        
        setTimeout(ChessEventsManager.updatePlayerLabels, 200);
    }
});

// ============================================
// DEBUG ET EXPORTS
// ============================================
window.debugChessEvents = {
    game: () => window.chessGame,
    updateLabels: () => ChessEventsManager.updatePlayerLabels(),
    testFlip: () => flipBoardWithLabelsUpdate(),
    testNewGame: () => confirmNewGame(),
    getBoardState: () => {
        if (window.chessGame && window.chessGame.core && window.chessGame.core.gameState) {
            return {
                flipped: window.chessGame.core.gameState.boardFlipped,
                currentPlayer: window.chessGame.core.gameState.currentPlayer,
                gameActive: window.chessGame.core.gameState.gameActive
            };
        }
        return { flipped: false, currentPlayer: 'white', gameActive: false };
    },
    getBotStatus: () => {
        if (window.chessGame && window.chessGame.getBotStatus) {
            return window.chessGame.getBotStatus();
        }
        return { active: false, level: 0, color: '' };
    },
    forceUpdateLabels: () => {
        if (ChessEventsManager.consoleLog) {
            console.log('🔧 [ChessEvents] Forçage mise à jour des labels');
        }
        ChessEventsManager.updatePlayerLabels();
    }
};

// Initialisation statique
ChessEventsManager.init();

// Exporter la fonction globale
window.updatePlayerLabels = ChessEventsManager.updatePlayerLabels;

if (ChessEventsManager.consoleLog) {
    console.log('✅ [ChessEvents] chess-events.js chargé avec fonction updatePlayerLabels globale');
}