// chess-events.js - Initialisation du jeu SIMPLIFIÉE
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Début initialisation');
    
    // Initialisation UNIQUE du jeu
    initializeChessGame();
    
    // Configuration des événements
    setupEventListeners();
    
    console.log('✅ Initialisation terminée');
});

// Initialisation simple du jeu
function initializeChessGame() {
    try {
        if (typeof ChessGame !== 'undefined' && !window.chessGame) {
            window.chessGame = new ChessGame();
            console.log('✅ ChessGame initialisé avec succès');
        } else if (window.chessGame) {
            console.log('ℹ️ ChessGame déjà initialisé');
        } else {
            console.error('❌ ChessGame non disponible');
            // Retry après délai
            setTimeout(() => {
                if (typeof ChessGame !== 'undefined' && !window.chessGame) {
                    window.chessGame = new ChessGame();
                    console.log('✅ ChessGame initialisé avec délai');
                }
            }, 1000);
        }
    } catch (error) {
        console.error('❌ Erreur initialisation ChessGame:', error);
    }
}

// Configuration simple des événements
function setupEventListeners() {
    console.log('📱 Configuration des événements...');
    
    // Boutons mobiles
    setupMobileButtons();
    
    // Boutons desktop
    setupDesktopButtons();
}

// FONCTION HELPER POUR NOUVELLE PARTIE (compatible avec les deux architectures)
function confirmNewGame() {
    if (window.chessGame) {
        // Nouvelle architecture modulaire
        if (window.chessGame.core && window.chessGame.core.ui && window.chessGame.core.ui.modalManager) {
            return window.chessGame.core.ui.modalManager.confirmNewGame();
        }
        // Ancienne architecture
        else if (window.chessGame.core && window.chessGame.core.ui && typeof window.chessGame.core.ui.confirmNewGame === 'function') {
            return window.chessGame.core.ui.confirmNewGame();
        }
        // Fallback
        else {
            console.error('❌ Aucune méthode confirmNewGame disponible');
            redirectToIndex();
        }
    } else {
        console.error('❌ Jeu non initialisé');
        redirectToIndex();
    }
}

// Configuration des boutons mobiles SIMPLIFIÉE
function setupMobileButtons() {
    const mobileButtons = [
        { 
            id: 'newGame', 
            action: () => confirmNewGame() // UTILISATION DE LA FONCTION HELPER
        },
        { 
            id: 'flipBoard', 
            action: () => flipBoard()
        }
    ];
    
    mobileButtons.forEach(button => {
        const element = document.getElementById(button.id);
        if (element) {
            console.log(`✅ Configuration de ${button.id}`);
            
            // Nettoyer et réattacher les événements
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            // Événements simples
            newElement.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`📱 Click sur ${button.id}`);
                button.action();
            });
            
            newElement.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`📱 Touch sur ${button.id}`);
                button.action();
            });
            
            // Style mobile
            newElement.style.cursor = 'pointer';
            newElement.style.touchAction = 'manipulation';
            
        } else {
            console.warn(`⚠️ ${button.id} non trouvé`);
        }
    });
}

// Configuration des boutons desktop
function setupDesktopButtons() {
    const desktopButtons = [
        { 
            selector: '#newGame', 
            action: () => confirmNewGame() // UTILISATION DE LA FONCTION HELPER
        },
        { 
            selector: '#flipBoard', 
            action: () => flipBoard()
        },
        { 
            selector: '.new-game-btn:not(#newGame)', 
            action: () => confirmNewGame() // UTILISATION DE LA FONCTION HELPER
        },
        { 
            selector: '.flip-board-btn:not(#flipBoard)', 
            action: () => flipBoard()
        }
    ];
    
    desktopButtons.forEach(button => {
        const elements = document.querySelectorAll(button.selector);
        elements.forEach(element => {
            // Nettoyer les anciens événements
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            // Nouvel événement
            newElement.addEventListener('click', function(e) {
                e.preventDefault();
                console.log(`🖥️ Click sur ${button.selector}`);
                button.action();
            });
        });
    });
}

// Actions simples
function redirectToIndex() {
    console.log('🔄 Redirection vers index.php');
    window.location.href = '../index.php';
}

// function flipBoard() {
//     console.log('🔄 Flip du plateau');
//     if (window.chessGame && typeof window.chessGame.flipBoard === 'function') {
//         window.chessGame.flipBoard();

//     } else {
//         console.error('❌ flipBoard non disponible');
//         // Fallback simple
//         alert('Fonction non disponible. Rechargement...');
//         window.location.reload();
//     }
// }


// function flipBoard() {
//     console.log('🔄 Flip du plateau');
    
//     const sectionWhite = document.getElementById('section-white');
//     const sectionBlack = document.getElementById('section-black');
//     const chessboardContainer = document.querySelector('.chessboard-container');
//     const chessboardCol = document.querySelector('.chessboard-col');
    
//     if (sectionWhite && sectionBlack && chessboardContainer && chessboardCol) {
//         // Vérifier la position actuelle
//         const currentOrder = Array.from(chessboardCol.children).map(child => child.id);
//         console.log('Ordre actuel:', currentOrder);
        
//         // Intervertir simplement
//         if (currentOrder[0] === 'section-black') {
//             // Noir en haut → mettre Blanc en haut
//             chessboardCol.innerHTML = '';
//             chessboardCol.appendChild(sectionWhite);
//             chessboardCol.appendChild(chessboardContainer);
//             chessboardCol.appendChild(sectionBlack);
//             console.log('✅ Nouvel ordre: Blanc en haut, Noir en bas');
//         } else {
//             // Blanc en haut → mettre Noir en haut
//             chessboardCol.innerHTML = '';
//             chessboardCol.appendChild(sectionBlack);
//             chessboardCol.appendChild(chessboardContainer);
//             chessboardCol.appendChild(sectionWhite);
//             console.log('✅ Nouvel ordre: Noir en haut, Blanc en bas');
//         }
        
//         updateGameStatus('Plateau tourné');
        
//     } else {
//         console.error('❌ Éléments non trouvés pour le flip');
//         fallbackFlip();
//     }
// }


function newGame() {
    console.log('🔄 Nouvelle partie');
    if (window.chessGame && typeof window.chessGame.newGame === 'function') {
        window.chessGame.newGame();
    } else {
        console.error('❌ newGame non disponible');
    }
}




// Variable pour suivre l'état du flip
let isBoardFlipped = false;

function flipBoard() {
    console.log('🔄 Flip du plateau');
    
    // 1. Flip de l'échiquier (si disponible)
    if (window.chessGame && typeof window.chessGame.flipBoard === 'function') {
        window.chessGame.flipBoard();
        console.log('✅ Échiquier flipé');
    } else {
        console.warn('⚠️ Flip échiquier non disponible');
        // Fallback manuel pour l'échiquier si besoin
        // manualChessboardFlip();
    }
    
    // 2. Intervertir les sections joueurs
    flipPlayerSections();
    
    // 3. Mettre à jour l'état
    isBoardFlipped = !isBoardFlipped;
    updateGameStatus(isBoardFlipped ? 'Plateau tourné (Noir en bas)' : 'Plateau normal (Blanc en bas)');
}

function flipPlayerSections() {
    const sectionWhite = document.getElementById('section-white');
    const sectionBlack = document.getElementById('section-black');
    const chessboardContainer = document.querySelector('.chessboard-container');
    const chessboardCol = document.querySelector('.chessboard-col');
    
    if (sectionWhite && sectionBlack && chessboardContainer && chessboardCol) {
        const currentOrder = Array.from(chessboardCol.children).map(child => child.id);
        console.log('Ordre actuel:', currentOrder);
        
        if (currentOrder[0] === 'section-black') {
            // Noir en haut → mettre Blanc en haut
            chessboardCol.innerHTML = '';
            chessboardCol.appendChild(sectionWhite);
            chessboardCol.appendChild(chessboardContainer);
            chessboardCol.appendChild(sectionBlack);
            console.log('✅ Nouvel ordre: Blanc en haut, Noir en bas');
        } else {
            // Blanc en haut → mettre Noir en haut
            chessboardCol.innerHTML = '';
            chessboardCol.appendChild(sectionBlack);
            chessboardCol.appendChild(chessboardContainer);
            chessboardCol.appendChild(sectionWhite);
            console.log('✅ Nouvel ordre: Noir en haut, Blanc en bas');
        }
    } else {
        console.error('❌ Éléments non trouvés pour le flip joueurs');
    }
}

function manualChessboardFlip() {
    // Fallback manuel pour l'échiquier si chessGame n'est pas disponible
    const chessBoard = document.getElementById('chessBoard');
    if (chessBoard) {
        chessBoard.classList.toggle('flipped');
        console.log('✅ Échiquier flipé manuellement');
    }
}















// Export pour debug
window.debugChess = {
    game: () => window.chessGame,
    botStatus: () => window.chessGame?.getBotStatus?.(),
    forceBot: (level = 1, color = 'black') => window.chessGame?.setBotLevel?.(level, color),
    testFlip: () => flipBoard(),
    testNewGame: () => newGame(),
    // CORRECTION : Utiliser la fonction helper
    testConfirmation: () => confirmNewGame()
};