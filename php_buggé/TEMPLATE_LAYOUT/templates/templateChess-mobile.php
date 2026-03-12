<?php
// templateChess-mobile.php
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CharlyChess</title>
    <link rel="stylesheet" href="../css/all.min.css">
    <link rel="stylesheet" href="../css/common-chess.css">
    <link rel="stylesheet" href="../css/templateChess-mobile.css">

</head>
<body>

<div class="game-layout">

    <header>
        CharlyChess
    </header>

    <div class="content-container">

        <div id="section-black" class="section-joueurs">
            <div class="player-info">
                <div class="player-name">Joueur 2 black<span class="level">level 0</span></div>
                <div class="player-clock player-clock-black">10:00</div>
            </div>
        </div>

        <div class="middle-div">
            <div id="gameContent" class="section-board">Zone de jeu (échecs)</div>
        </div>

        <div id="section-white" class="section-joueurs">
            <div class="player-info">
                <div class="player-name">Joueur 1 white<span class="level">level 0</span></div>
                <div class="player-clock player-clock-white">10:00</div>
            </div>
        </div>

        <!-- Tabs en bas -->
        <div class="tabs">
            <div class="tab tab-nouvellePartie" onclick="changeTab('tab-nouvellePartie')">
                <div class="tab-icon"><i class="fas fa-plus text-color2"></i></div>
                <div class="tab-text">Nouvelle Partie</div>
            </div>

            <div class="tab active" onclick="changeTab('tab-coups')">
                <div class="tab-icon"><i class="fas fa-chess-pawn text-color2"></i></div>
                <div class="tab-text">Coups</div>
            </div>

            <div class="tab" onclick="changeTab('tab-avant')">
                <div class="tab-icon"><i class="fas fa-arrow-left text-color2"></i></div>
                <div class="tab-text">Précédent</div>
            </div>
            <div class="tab" onclick="changeTab('tab-suivant')">
                <div class="tab-icon"><i class="fas fa-arrow-right text-color2"></i></div>
                <div class="tab-text">Suivant</div>
            </div>

            <div class="tab" onclick="changeTab('tab-tourner')">
                <div class="tab-icon"><i class="fas fa-sync-alt text-color2"></i></div>
                <div class="tab-text tab-textTourner">Tourner</div>
            </div>
        </div>

        <!-- Wrapper contenu -->
        <div class="tab-wrapper">
            <div id="tab-nouvellePartie" class="tabcontent">
                <h3>Nouvelle Partie</h3>
                <p>Options pour démarrer une nouvelle partie</p>
                <button onclick="nouvellePartie()" style="padding: 10px; margin: 5px;">Démarrer</button>
            </div>
            <div id="tab-coups" class="tabcontent tab-coups" style="display:block;">
                <h3>Historique des Coups
                    <span class="pgn">PGN</span>
                    <span class="fen">FEN</span>
                </h3>
                    <!-- <span class="pgn">PGN</span>
                    <span class="fen">FEN</span> -->
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
                    <p>21. Da1 Da5</p>
                    <p>22. Dxa5 Cxa5</p>
                    <p>23. Fe3 Cc4</p>
                    <p>24. Fxc4 bxc4</p>
                    <p>25. Ce2 Fe6</p>
                </div>
            </div>

            <div id="tab-avant" class="tabcontent">
                <h3>Contrôles de Navigation</h3>
                <p>Navigation dans l'historique des coups</p>
                <div style="display: flex; gap: 10px; justify-content: center; margin: 20px 0;">
                    <button onclick="firstMove()" style="padding: 10px;">Premier</button>
                    <button onclick="previousMove()" style="padding: 10px;">Précédent</button>
                    <button onclick="nextMove()" style="padding: 10px;">Suivant</button>
                    <button onclick="lastMove()" style="padding: 10px;">Dernier</button>
                </div>
            </div>
            <div id="tab-suivant" class="tabcontent">
                <h3>Contrôles de Jeu</h3>
                <p>Actions de jeu disponibles</p>
                <div style="display: flex; flex-direction: column; gap: 10px; margin: 20px 0;">
                    <button onclick="pauseGame()" style="padding: 10px;">Pause</button>
                    <button onclick="resignGame()" style="padding: 10px;">Abandonner</button>
                    <button onclick="offerDraw()" style="padding: 10px;">Proposer nulle</button>
                </div>
            </div>
            <div id="tab-tourner" class="tabcontent">
                <h3>Options d'affichage</h3>
                <p>Personnalisation de l'interface</p>
                <div style="display: flex; flex-direction: column; gap: 10px; margin: 20px 0;">
                    <button onclick="flipBoard()" style="padding: 10px;">Tourner l'échiquier</button>
                    <button onclick="toggleDarkMode()" style="padding: 10px;">Mode sombre</button>
                    <button onclick="showAnalysis()" style="padding: 10px;">Afficher l'analyse</button>
                </div>
            </div>
        </div>

        <div id="footer" class="footer"></div>

    </div>

</div>

<script src="../js/chess-game.js"></script>
</body>
</html>