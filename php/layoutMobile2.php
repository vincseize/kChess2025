<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CharlyChess</title>
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

/* Corps */
body {
    font-family: Arial,sans-serif;
    min-height:100vh;
    display:flex;
    flex-direction:column;
    background:var(--color6);
    color:black;
    overflow-y: auto; /* Scroll pour toute la page */
}

body.dark {
    background:#1e1e1e;
    color:#f3f3f3;
}

/* Layout général */
.game-layout {
    display:flex; 
    flex-direction:column; 
    flex:1;
    min-height: 100vh; /* Assure que le layout prend toute la hauteur */
}

header {
    height:60px; 
    background:#3498db; 
    color:white; 
    display:flex; 
    justify-content:center; 
    align-items:center; 
    position:relative;
    font-size:1.5rem;
    font-weight:bold;
}

.content-container {
    flex:1;
    display:flex;
    flex-direction:column;
    min-height:0;
}

.section-top-board, .middle-div, .section-bottom-board {width:100%; display:flex; justify-content:center; align-items:center;}

.section-top-board {background:#ecf0f1; padding:10px 0;}
.middle-div {width:100%; height:0; padding-top:100%; background:#e74c3c; position:relative;}
.middle-div-content {position:absolute; top:0; left:0; width:100%; height:100%; display:flex; justify-content:center; align-items:center; text-align:center; color:white; font-weight:bold; font-size:1.2rem; padding:10px;}
.section-bottom-board {background:#bdc3c7; padding:10px 0;}

/* Tabs */
.tabs {
    display:flex; 
    background:#ecf0f1; 
    height:60px; /* Un peu plus haut pour accommoder le texte sous l'icône */
}

.tab {
    display:flex; 
    flex-direction: column; /* Changement important : colonne au lieu de ligne */
    justify-content: center; 
    align-items: center;
    background-color:var(--color6); 
    cursor:pointer; 
    gap:2px; /* Espace entre icône et texte */
    user-select:none;
    padding: 5px;
    text-align: center;
    flex: 1; /* Largeur égale par défaut */
}

/* Tab "Nouvelle Partie" plus large */
.tab-nouvellePartie {
    flex: 2; /* Prend 2 fois plus de place que les autres */
}

.tab:hover, .tab:active {background-color:var(--color7);}
.tab.active {background-color:var(--color7); font-weight:bold;}

.tab-icon {
    font-size: 1.6rem; /* Taille des icônes */
    line-height: 1;
}

.tab-text {
    font-size: 0.6em;
    line-height: 1.3;
    text-align: center;
}

.tab-textTourner {
    opacity: 1;
}

/* Wrapper contenu tab */
.tab-wrapper {
    flex:1;
    min-height:0;
    display:flex;
    flex-direction:column;
    overflow:hidden;
}

.tabcontent {
    flex:1;
    min-height:0;
    padding:15px;
    background:white;
    display:none;
}

/* Style spécifique pour la div Coups avec scroll interne */
.tab-coups {
    overflow-y: auto;  /* Scroll vertical uniquement pour cette div */
    height: 100%;
    max-height: 300px; /* Hauteur maximale pour forcer le scroll interne */
}

/* Les autres tabs n'ont pas de scroll interne */
#tab-nouvellePartie, #before, #next {
    overflow-y: visible;
}

/* Footer */
.footer {
    height: 15px; 
    width:100%; 
    background-color:var(--color8);
    margin-top: auto; /* Pousse le footer vers le bas */
}
.theme-button {position:absolute; right:10px; top:10px; background:transparent; border:0; font-size:1.3rem; cursor:pointer; user-select:none;}
</style>
</head>
<body>

<div class="game-layout">

    <header>
        CharlyChess
    </header>

    <div class="content-container">

        <div class="section-top-board">Section du haut Joueur 1</div>

        <div class="middle-div">
            <div id="gameContent" class="middle-div-content">Zone de jeu (échecs)</div>
        </div>

        <div class="section-bottom-board">Section du bas Joueur 2</div>

<!-- Tabs -->
<div class="tabs">

    <div class="tab tab-nouvellePartie" onclick="changeTab('tab-nouvellePartie')">
        <div class="tab-icon">➕</div>
        <div class="tab-text">Nouvelle Partie</div>
    </div>

    <div class="tab active" onclick="changeTab('tab-coups')">
        <div class="tab-icon">♟️</div>
        <div class="tab-text">Coups</div>
    </div>

    <div class="tab" onclick="changeTab('tab-avant')">
        <div class="tab-icon">⬅️</div>
        <div class="tab-text">Précédent</div>
    </div>
    <div class="tab" onclick="changeTab('tab-suivant')">
        <div class="tab-icon">➡️</div>
        <div class="tab-text">Suivant</div>
    </div>

    <div class="tab" onclick="changeTab('tab-tourner')">
        <div class="tab-icon">🔄</div>
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