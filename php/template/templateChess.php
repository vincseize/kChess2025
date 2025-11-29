<?php
// templateChess.php    
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CharlyChess</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
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

<!-- CSS Desktop (toujours chargé) -->
<link rel="stylesheet" href="templateChess-desktop.css">

<!-- CSS Mobile (seulement sur mobile) -->
<link rel="stylesheet" href="templateChess-mobile.css" media="(max-width: 768px)">

</head>
<body>
<!-- Le reste de votre code reste identique -->

    <div class="game-layout">

        <header>
            CharlyChess
        </header>

        <div class="content-container">

            <div id="section-black" class="section-joueurs">
                <div class="player-info">
                    <div class="player-name">Joueur 2 black</div>
                    <div class="player-clock player-clock-black">10:00</div>
                </div>
            </div>

            <div class="middle-div">
                <div id="gameContent" class="section-board">Zone de jeu (échecs)</div>
            </div>

            <div id="section-white" class="section-joueurs">
                <div class="player-info">
                    <div class="player-name">Joueur 1 white</div>
                    <div class="player-clock player-clock-white">10:00</div>
                </div>
            </div>

            <!-- Tabs -->
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
                    <p>Contenu de nouvelle partie</p>
                </div>
                <div id="tab-coups" class="tabcontent tab-coups" style="display:block;">
                    <h3>Coups</h3>
                    <p>Historique des coups…</p>
                    <!-- Beaucoup de contenu pour tester le scroll -->
                    <p>1. e4 e5 2. Cf3 Cc6</p>
        <p>3. Fb5 a6 4. Fa4 Cf6</p>
        <p>5. O-O Fe7 6. Te1 b5</p>
        <p>7. Fb3 d6 8. c3 O-O</p>
        <p>9. h3 Cb8 10. d4 Cbd7</p>
        <p>11. Cbd2 Fb7 12. Fc2 Te8</p>
        <p>13. Cf1 Ff8 14. Cg3 g6</p>
        <p>15. Fg5 h6 16. Fd2 Fg7</p>
        <p>17. a4 c5 18. dxc5 dxc5</p>
        <p>19. axb5 axb5 20. Txa8 Fxa8</p>
        <p>21. Da1 Da5 22. Dxa5 Cxa5</p>
        <p>23. Fe3 Cc4 24. Fxc4 bxc4</p>
        <p>25. Ce2 Fe6 26. Cfd4 Fd7</p>
        <p>27. Cxc4 Cxc4 28. Fxc4 Fxc4</p>
        <p>29. Cxc4 Tb8 30. b3 Tb4</p>
        <p>31. Ce3 Tb5 32. Td1 Fe5</p>
        <p>33. f4 Fc7 34. Td7 Fb6</p>
                </div>

                <div id="tab-avant" class="tabcontent">
                    <h3>Précédent</h3>
                    <p>Contenu précédent</p>
                </div>
                <div id="tab-suivant" class="tabcontent">
                    <h3>Suivant</h3>
                    <p>Contenu suivant</p>
                </div>
                <div id="tab-tourner" class="tabcontent">
                    <h3>Tourner</h3>
                    <p>Contenu tourner</p>
                </div>
            </div>

        <div id="footer" class="footer"></div>

        </div>

    </div>

    <script>
    function changeTab(tabId) {
        const contents = document.getElementsByClassName("tabcontent");
        for(let c of contents) c.style.display="none";
        const tabs = document.getElementsByClassName("tab");
        for(let t of tabs) t.classList.remove("active");
        
        // Trouver l'onglet actif en cherchant celui qui a le bon onclick
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