// js/chess-game.js - JavaScript commun pour desktop et mobile

// =============================================
// FONCTIONS UTILITAIRES
// =============================================

// Fonction pour récupérer les paramètres de l'URL
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        mode: params.get('mode') || 'human',
        level: params.get('level') || 'false',
        profondeur: params.get('profondeur') || 'false',
        color: params.get('color') || 'white'
    };
}

// Détection automatique du device
function isMobile() {
    return window.innerWidth <= 768;
}

// Fonction pour déterminer le type de joueur
function getPlayerType(mode, level) {
    if (mode === 'human') {
        return 'Humain';
    } else if (mode === 'bot') {
        const levelNames = {
            '0': 'Aléatoire',
            '1': 'CCMO',
            '2': 'Intermédiaire',
            '3': 'Avancé'
        };
        return `Bot ${levelNames[level] || `Niveau ${level}`}`;
    }
    return 'Humain';
}

// =============================================
// FONCTIONS DE JEU
// =============================================

// function nouvellePartie() {
//     console.log('Nouvelle Partie');
    
//     // Demander confirmation à l'utilisateur
//     const userConfirmed = confirm('Êtes-vous sûr de vouloir démarrer une nouvelle partie ?\n\nLa partie en cours sera perdue.');
    
//     if (userConfirmed) {
//         console.log('Utilisateur a confirmé - Redirection vers index.php');
        
//         // Mettre à jour le statut avant redirection
//         updateGameStatus('Redirection vers nouvelle partie');
        
//         // Redirection après un court délai pour laisser le temps à l'UI de se mettre à jour
//         setTimeout(() => {
//             window.location.href = '../index.php';
//         }, 500);
        
//     } else {
//         console.log('Utilisateur a annulé - Reste sur la page actuelle');
//         updateGameStatus('Nouvelle partie annulée');
//     }
// }

function firstMove() {
    console.log('Premier Coup');
    // Logique pour aller au premier coup
    updateGameStatus('Premier coup');
}

function lastMove() {
    console.log('Dernier Coup');
    // Logique pour aller au dernier coup
    updateGameStatus('Dernier coup');
}

function previousMove() {
    console.log('Coup précédent');
    // Logique pour le coup précédent
    updateGameStatus('Coup précédent');
}

function nextMove() {
    console.log('Coup suivant');
    // Logique pour le coup suivant
    updateGameStatus('Coup suivant');
}

function showAnalysis() {
    console.log('Afficher l\'analyse');
    // Logique pour l'analyse
    updateGameStatus('Analyse affichée');
}

function pauseGame() {
    console.log('Pause');
    // Logique pour pause
    updateGameStatus('Partie en pause');
}

function resignGame() {
    console.log('Abandonner');
    // Logique pour abandon
    if (confirm('Êtes-vous sûr de vouloir abandonner ?')) {
        updateGameStatus('Partie abandonnée');
    }
}

function offerDraw() {
    console.log('Proposer nulle');
    // Logique pour proposer nulle
    updateGameStatus('Nulle proposée');
}

// =============================================
// GESTION DE L'INTERFACE
// =============================================

// Fonction changeTab améliorée pour gérer les deux layouts
function changeTab(tabId) {
    console.log('Changement d\'onglet:', tabId);
    
    // Gestion desktop (si les éléments existent)
    const desktopContents = document.getElementsByClassName("tabcontent");
    if (desktopContents.length > 0) {
        for(let c of desktopContents) c.style.display = "none";
    }
    
    // Gestion des tabs actifs
    const tabs = document.getElementsByClassName("tab");
    for(let t of tabs) t.classList.remove("active");
    
    const activeTab = Array.from(tabs).find(tab => 
        tab.getAttribute('onclick') && tab.getAttribute('onclick').includes(`changeTab('${tabId}')`)
    );
    
    if(activeTab) activeTab.classList.add("active");
    
    // Affichage du contenu
    const selected = document.getElementById(tabId);
    if(selected) {
        selected.style.display = "block";
        
        // Gestion spéciale pour les tabs mobiles qui déclenchent des actions
        handleMobileTabAction(tabId);
    }
}

// Gestion des actions spécifiques aux tabs mobiles
function handleMobileTabAction(tabId) {
    if (isMobile()) {
        switch(tabId) {
            case 'tab-nouvellePartie':
                // nouvellePartie();
                break;
            case 'tab-avant':
                previousMove();
                break;
            case 'tab-suivant':
                nextMove();
                break;
            case 'tab-tourner':
                flipBoard();
                break;
            // 'tab-coups' ne déclenche pas d'action, juste l'affichage
        }
    }
}

// Mise à jour du statut du jeu (commun aux deux versions)
function updateGameStatus(message) {
    console.log('Statut jeu:', message);
    
    // Mise à jour du footer desktop si présent
    const footerInfo = document.querySelector('.footer-info');
    if (footerInfo) {
        footerInfo.textContent = message + ' • Temps restant: 08:45';
    }
    
    // Mise à jour visuelle de l'échiquier
    const gameContent = document.getElementById('gameContent');
    if (gameContent) {
        gameContent.textContent = 'Zone de jeu: ' + message;
    }
}

// Gestion des horloges
function updateClocks() {
    const clockBlack = document.querySelector('.player-clock-black');
    const clockWhite = document.querySelector('.player-clock-white');
    
    if (clockBlack) clockBlack.textContent = '10:00';
    if (clockWhite) clockWhite.textContent = '10:00';
}

// =============================================
// GESTION DES JOUEURS ET PARAMÈTRES
// =============================================

// Fonction pour mettre à jour les infos des joueurs

// Fonction pour mettre à jour les infos des joueurs
function updatePlayerInfo() {
    const params = getUrlParams();
    console.log('Paramètres URL pour joueurs:', params);
    
    const playerWhite = document.querySelector('#section-white .player-name');
    const playerBlack = document.querySelector('#section-black .player-name');
    
    if (params.color === 'white') {
        // Joueur blanc = humain, Joueur noir = bot/humain
        if (playerWhite) {
            playerWhite.innerHTML = `Joueur 1 white<span class="mode">humain</span>`;
        }
        if (playerBlack) {
            const opponentText = params.mode === 'bot' ? `bot (niveau ${params.level})` : 'humain';
            playerBlack.innerHTML = `Joueur 2 black<span class="mode">${opponentText}</span>`;
        }
    } else {
        // Joueur blanc = bot/humain, Joueur noir = humain
        if (playerWhite) {
            const opponentText = params.mode === 'bot' ? `bot (niveau ${params.level})` : 'humain';
            playerWhite.innerHTML = `Joueur 1 white<span class="mode">${opponentText}</span>`;
        }
        if (playerBlack) {
            playerBlack.innerHTML = `Joueur 2 black<span class="mode">humain</span>`;
        }
    }
    
    console.log('✅ Infos joueurs mises à jour');
}

// Fonction pour mettre à jour le niveau dans le header
function updateHeaderLevel() {
    const params = getUrlParams();
    const headerLevel = document.getElementById('headerLevel');

    if (headerLevel) {
        if (params.mode === 'bot') {
            headerLevel.textContent = `L${params.level}`;
            headerLevel.style.display = 'block';
            
            // Couleurs selon le niveau
            const levelColors = {
                '0': '#FF6B6B', // Rouge pour niveau 0
                '1': '#4ECDC4', // Turquoise pour niveau 1
                '2': '#45B7D1', // Bleu pour niveau 2
                '3': '#96CEB4'  // Vert pour niveau 3
            };
            
            if (levelColors[params.level]) {
                headerLevel.style.background = levelColors[params.level];
            }
            
        } else {
            headerLevel.textContent = 'Humain';
            headerLevel.style.display = 'block';
            headerLevel.style.background = 'var(--color2)';
        }
        
        console.log('✅ Header niveau mis à jour:', headerLevel.textContent);
    }
}

// Fonction pour appliquer les paramètres de partie
// Fonction pour appliquer les paramètres de partie
function applyGameSettings() {
    const params = getUrlParams();
    console.log('🔧 Application des paramètres:', params);
    
    // Logique pour configurer la partie selon les paramètres
    if (params.mode === 'bot') {
        console.log(`🎮 Mode Bot activé - Niveau: ${params.level}, Profondeur: ${params.profondeur}`);
    } else {
        console.log('🎮 Mode Humain vs Humain');
    }
    
    // Appliquer la couleur sélectionnée - SI NOIR, FLIP AUTOMATIQUE
    if (params.color === 'black') {
        console.log('🔄 Échiquier orienté pour les Noirs - Flip automatique');
        applyInitialFlip();
    }
}

// Fonction pour appliquer le flip initial basé sur les paramètres
// chess-game.js
// =============================================
// FONCTIONS FLIP AMÉLIORÉES
// =============================================

// Fonction pour appliquer le flip initial basé sur les paramètres
function applyAutoFlip() {
    console.log("Application du flip automatique (flip interne ChessGameCore)");

    // Vérifier toutes les 100ms si ChessGameCore est prêt
    const interval = setInterval(() => {
        if (window.chessGame?.core?.flipBoard) {
            console.log("↪️ Flip interne trouvé → appel ChessGameCore.flipBoard()");
            window.chessGame.core.flipBoard();
            clearInterval(interval);

            // Mettre à jour les sections joueurs après flip
            flipPlayerSections();
            isBoardFlipped = true;
            updateGameStatus('Plateau tourné (Noir en bas)');
        }
    }, 1000);
}




// Fonction pour forcer un état de flip spécifique
function setBoardFlipped(shouldBeFlipped) {
    console.log(`🎯 Réglage flip: ${shouldBeFlipped ? 'flipé' : 'normal'}`);
    
    const currentState = isBoardFlipped;
    
    // Si l'état actuel ne correspond pas à l'état désiré, appliquer flip
    if (currentState !== shouldBeFlipped) {
        console.log(`🔄 État différent, application du flip...`);
        flipBoard();
    } else {
        console.log(`✅ État déjà correct (${shouldBeFlipped ? 'flipé' : 'normal'})`);
    }
}

// Fonction pour vérifier et appliquer l'état initial basé sur les paramètres
function checkAndApplyInitialOrientation() {
    const params = getUrlParams();
    
    // Si color=black, l'échiquier doit être flipé (Noirs en bas)
    if (params.color === 'black') {
        console.log('🎯 Orientation initiale: Noirs en bas (flip requis)');
        setBoardFlipped(true);
    } else {
        console.log('🎯 Orientation initiale: Blancs en bas (normal)');
        setBoardFlipped(false);
    }
}


// Fonction simple pour calculer et appliquer la hauteur
function setChessboardContainerHeight() {
    const chessboardCol = document.querySelector('.chessboard-col');
    const sectionBlack = document.getElementById('section-black');
    const sectionWhite = document.getElementById('section-white');
    const chessboardContainer = document.querySelector('.chessboard-container');
    
    if (chessboardCol && sectionBlack && sectionWhite && chessboardContainer) {
        // Hauteur totale de la colonne
        const colHeight = chessboardCol.clientHeight;
        
        // Hauteur des sections joueurs
        const blackHeight = sectionBlack.offsetHeight;
        const whiteHeight = sectionWhite.offsetHeight;
        
        // Calculer la hauteur disponible (avec petite marge)
        const availableHeight = colHeight - blackHeight - whiteHeight - 5;
        
        // Appliquer la hauteur au container
        chessboardContainer.style.width = `${availableHeight}px`;
        
        console.log('📏 Hauteur appliquée:', {
            colHeight,
            blackHeight, 
            whiteHeight,
            availableHeight
        });
    }
}



// =============================================
// GESTION PGN/FEN
// =============================================

function exportPGN() {
    console.log('Export PGN');
    // Logique d'export PGN
    // alert('Export PGN - Fonctionnalité à implémenter');
}

function exportFEN() {
    console.log('Export FEN');
    // Logique d'export FEN
    // alert('Export FEN - Fonctionnalité à implémenter');
}

// Initialisation des boutons PGN/FEN
function initializePgnFenButtons() {
    const pgnButtons = document.querySelectorAll('.pgn');
    const fenButtons = document.querySelectorAll('.fen');
    
    pgnButtons.forEach(btn => {
        // Utiliser exportPGN directement
        btn.addEventListener('click', exportPGN);
    });
    
    fenButtons.forEach(btn => {
        // Utiliser exportFEN directement
        btn.addEventListener('click', exportFEN);
    });
    
    console.log(`Boutons initialisés: ${pgnButtons.length} PGN, ${fenButtons.length} FEN`);
}

// =============================================
// INITIALISATION
// =============================================

// Initialisation commune
document.addEventListener('DOMContentLoaded', function() {
    console.log('CharlyChess initialisé - Version:', isMobile() ? 'Mobile' : 'Desktop');
    
    // Récupérer et appliquer les paramètres URL
    const params = getUrlParams();
    console.log('Paramètres de partie:', params);
    
    // Mettre à jour les infos des joueurs
    updatePlayerInfo();
    updateHeaderLevel();
    
    // Appliquer les paramètres de jeu
// Fonction pour appliquer les paramètres de partie
function applyGameSettings() {
    const params = getUrlParams();
    console.log('🔧 Application des paramètres:', params);
    
    // Logique pour configurer la partie selon les paramètres
    if (params.mode === 'bot') {
        console.log(`🎮 Mode Bot activé - Niveau: ${params.level}, Profondeur: ${params.profondeur}`);
    } else {
        console.log('🎮 Mode Humain vs Humain');
    }
    
    // Appliquer la couleur sélectionnée - SI NOIR, FLIP AUTOMATIQUE
    if (params.color === 'black') {
        console.log('🔄 Échiquier orienté pour les Noirs - Flip automatique');
        // Ne pas appeler flipBoard() ici car il faut attendre l'init
        // L'appel se fera via checkAndApplyInitialOrientation()
    }
}
    
    // Initialisation des horloges
    updateClocks();
    

    setTimeout(setChessboardContainerHeight, 100);

    // Recalculer quand la fenêtre change de taille
    window.addEventListener('resize', setChessboardContainerHeight);



    // Initialisation des événements communs
    const gameContent = document.getElementById('gameContent');
    if (gameContent) {
        gameContent.addEventListener('click', function() {
            console.log('Échiquier cliqué');
            updateGameStatus('Échiquier interactif');
        });
    }
    
    // Adaptation responsive
    window.addEventListener('resize', function() {
        console.log('Redimensionnement - Mobile:', isMobile());
    });
    
    // Afficher le premier tab par défaut sur mobile
    if (isMobile()) {
        const firstTab = document.querySelector('.tab.active');
        if (firstTab) {
            const tabId = firstTab.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (tabId) {
                const content = document.getElementById(tabId);
                if (content) content.style.display = 'block';
            }
        }
    }

    // Initialisation des événements PGN/FEN
    initializePgnFenButtons();
});

// =============================================
// FONCTIONS GLOBALES POUR HTML
// =============================================

// Ces fonctions doivent être globales pour être accessibles depuis le HTML
// window.nouvellePartie = nouvellePartie;
window.firstMove = firstMove;
window.lastMove = lastMove;
window.previousMove = previousMove;
window.nextMove = nextMove;
window.showAnalysis = showAnalysis;
window.pauseGame = pauseGame;
window.resignGame = resignGame;
window.offerDraw = offerDraw;
window.changeTab = changeTab;
window.exportPGN = exportPGN;
window.exportFEN = exportFEN;