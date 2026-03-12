<?php
// index.php templateChess-desktop
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CharlyChess</title>
    <!-- <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"> -->
    <link rel="stylesheet" href="../../css/all.min.css">
    <style>
    * {margin:0;padding:0;box-sizing:border-box;}

    :root {
        /* couleurs */ 
        /* palette turquoise */ 
        --color1:#6B949E;   
        --color2:#447784;
        --color3:#255C69;   
        --color4:#0F434F;   
        --color5:#012B35;

        /* autres */   
        --color6:#dcdcdc;   
        --color7:#bcbcbc;   
        --color8:darkgray;
    }
    </style>
    <link rel="stylesheet" href="templateChess-desktop.css">
</head>
<body>

<div class="game-layout">

    <header>
        CharlyChess
    </header>

    <div class="main-content">
        
        <!-- Rangée principale -->
        <div class="main-row">
            
<!-- Colonne Nouvelle Partie -->
<!-- Colonne Nouvelle Partie -->
<div class="new-game-col">
    <button class="new-game-btn" onclick="nouvellePartie()">
        <div class="new-game-btn-icon"><i class="fas fa-plus text-color2"></i></div>
        <div class="new-game-btn-text">Nouvelle Partie</div>
    </button>
</div>

            <!-- Colonne Échiquier -->
            <div class="chessboard-col">
                <div id="section-black" class="section-joueurs">
                    <div class="player-info">
                        <div class="player-name">Joueur 2 black</div>
                        <div class="player-clock player-clock-black">10:00</div>
                    </div>
                </div>

                <div class="chessboard-container">
                    <div id="gameContent" class="section-board">Zone de jeu (échecs)</div>
                </div>

                <div id="section-white" class="section-joueurs">
                    <div class="player-info">
                        <div class="player-name">Joueur 1 white</div>
                        <div class="player-clock player-clock-white">10:00</div>
                    </div>
                </div>
            </div>

            <!-- Colonne Coups et contrôles -->
            <div class="controls-col">
                <div class="coups-section">
                    <div class="coups-header section-joueurs">
                        Historique des coups
                    </div>
                    <div class="coups-content">
                        <div class="coups-list">
                            <p>1. e4 e5</p>
                            <p>2. Cf3 Cc6</p>
                            <p>3. Fb5 a6</p>
                            <p>4. Fa4 Cf6</p>
                            <p>5. O-O Fe7</p>
                            <p>6. Te1 b5</p>
                            <p>7. Fb3 d6</p>
                            <p>8. c3 O-O</p>
                            <p>9. h3 Cb8</p>
                            <p>10. d4 Cbd7</p>
                            <p>11. Cbd2 Fb7</p>
                            <p>12. Fc2 Te8</p>
                            <p>13. Cf1 Ff8</p>
                            <p>14. Cg3 g6</p>
                            <p>15. Fg5 h6</p>
                            <p>16. Fd2 Fg7</p>
                            <p>17. a4 c5</p>
                            <p>18. dxc5 dxc5</p>
                            <p>19. axb5 axb5</p>
                            <p>20. Txa8 Fxa8</p>
                                                        <p>17. a4 c5</p>
                            <p>18. dxc5 dxc5</p>
                            <p>19. axb5 axb5</p>
                            <p>20. Txa8 Fxa8</p>
                        </div>
                    </div>
                </div>

                <div class="controls-section">
                    <div class="control-buttons">
                        <button class="control-btn" onclick="firstMove()">
                            <div class="control-btn-icon"><i class="fas fa-fast-backward text-color2"></i></div>
                            <div class="control-btn-text">Premier</div>
                        </button>
                        <button class="control-btn" onclick="previousMove()">
                            <div class="control-btn-icon"><i class="fas fa-arrow-left text-color2"></i></div>
                            <div class="control-btn-text">Précédent</div>
                        </button>
                        <button class="control-btn" onclick="nextMove()">
                            <div class="control-btn-icon"><i class="fas fa-arrow-right text-color2"></i></div>
                            <div class="control-btn-text">Suivant</div>
                        </button>
                        <button class="control-btn" onclick="lastMove()">
                            <div class="control-btn-icon"><i class="fas fa-fast-forward text-color2"></i></div>
                            <div class="control-btn-text">Dernier</div>
                        </button>
                        <button class="control-btn" onclick="flipBoard()">
                            <div class="control-btn-icon"><i class="fas fa-sync-alt text-color2"></i></div>
                            <div class="control-btn-text">Tourner</div>
                        </button>
                    </div>
                </div>
            </div>

        </div> <!-- FIN de .main-row -->

        <!-- Footer Sticky - EN DEHORS de .main-row -->
        <div class="sticky-footer">
            <div class="footer-content">
                <div class="footer-info">
                    Partie en cours • Temps restant: 08:45
                </div>
                <div class="footer-actions">
                    <button class="footer-btn" onclick="pauseGame()">Pause</button>
                    <button class="footer-btn" onclick="resignGame()">Abandonner</button>
                    <button class="footer-btn" onclick="offerDraw()">Proposer nulle</button>
                </div>
            </div>
        </div>

    </div> <!-- FIN de .main-content -->

</div> <!-- FIN de .game-layout -->

<script>
function changeTab(tabId) {
    // Votre fonction existante
}

function nouvellePartie() {
    console.log('Nouvelle Partie');
}

function firstMove() {
    console.log('Premier Coup');
}

function lastMove() {
    console.log('Dernier Coup');
}

function previousMove() {
    console.log('Coup précédent');
}

function nextMove() {
    console.log('Coup suivant');
}

function flipBoard() {
    console.log('Tourner l\'échiquier');
}

function showAnalysis() {
    console.log('Afficher l\'analyse');
}

function pauseGame() {
    console.log('Pause');
}

function resignGame() {
    console.log('Abandonner');
}

function offerDraw() {
    console.log('Proposer nulle');
}
</script>

<script>
function changeTab(tabId) {
    const contents = document.getElementsByClassName("tabcontent");
    for(let c of contents) c.style.display="none";
    const tabs = document.getElementsByClassName("tab");
    for(let t of tabs) t.classList.remove("active");
    
    const activeTab = Array.from(tabs).find(tab => 
        tab.getAttribute('onclick') === `changeTab('${tabId}')`
    );
    if(activeTab) activeTab.classList.add("active");
    
    const selected = document.getElementById(tabId);
    if(selected) selected.style.display="block";
}
</script>

</body>
</html>