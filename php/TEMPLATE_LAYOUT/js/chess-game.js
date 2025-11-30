// chess-game.js - JavaScript commun pour desktop et mobile

// Fonctions de jeu communes
function nouvellePartie() {
    console.log('Nouvelle Partie');
    // Logique commune pour démarrer une nouvelle partie
    updateGameStatus('Nouvelle partie démarrée');
}

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

function flipBoard() {
    console.log('Tourner l\'échiquier');
    // Logique pour tourner l'échiquier
    const board = document.getElementById('gameContent');
    if (board) {
        board.classList.toggle('flipped');
    }
    updateGameStatus('Échiquier tourné');
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
                nouvellePartie();
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

// Détection automatique du device
function isMobile() {
    return window.innerWidth <= 768;
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

// Initialisation commune
document.addEventListener('DOMContentLoaded', function() {
    console.log('CharlyChess initialisé - Version:', isMobile() ? 'Mobile' : 'Desktop');
    
    // Initialisation des horloges
    updateClocks();
    
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


// Fonctions PGN et FEN - EN DEHORS du DOMContentLoaded
// Fonctions PGN et FEN - Doivent être GLOBALES
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

// SUPPRIMER ces fonctions qui causent la confusion :
// function pgn() { ... }
// function fen() { ... }

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