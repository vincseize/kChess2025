<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CharlyChess</title>
<style>
* {margin:0;padding:0;box-sizing:border-box;}

:root {
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

header {height:60px; background:#3498db; color:white; display:flex; justify-content:center; align-items:center; position:relative;}

.content-container {
    flex:1;
    display:flex;
    flex-direction:column;
    min-height:0;
}

.top-div, .middle-div, .player2-div {width:100%; display:flex; justify-content:center; align-items:center;}

.top-div {background:#ecf0f1; padding:10px 0;}
.middle-div {width:100%; height:0; padding-top:100%; background:#e74c3c; position:relative;}
.middle-div-content {position:absolute; top:0; left:0; width:100%; height:100%; display:flex; justify-content:center; align-items:center; text-align:center; color:white; font-weight:bold; font-size:1.2rem; padding:10px;}
.player2-div {background:#bdc3c7; padding:10px 0;}

/* Tabs */
.tabs {display:flex; background:#ecf0f1; height:50px;}
.tab {flex:1; display:flex; justify-content:center; align-items:center; background-color:var(--color6); cursor:pointer; gap:5px; user-select:none;}
.tab:hover, .tab:active {background-color:var(--color7);}
.tab.active {background-color:var(--color7); font-weight:bold;}

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
#Coups {
    overflow-y: auto;  /* Scroll vertical uniquement pour cette div */
    height: 100%;
    max-height: 300px; /* Hauteur maximale pour forcer le scroll interne */
}

/* Les autres tabs n'ont pas de scroll interne */
#Tab2, #before, #next {
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
        Header Principal
        <button class="theme-button" onclick="toggleTheme()">🌙</button>
    </header>

    <div class="content-container">

        <div class="top-div">Section du haut Joueur 1</div>

        <div class="middle-div">
            <div id="gameContent" class="middle-div-content">Zone de jeu (échecs)</div>
        </div>

        <div class="player2-div">Section du bas Joueur 2</div>

        <!-- Tabs -->
        <div class="tabs">
            <div class="tab active" onclick="changeTab('Coups')">♟️ Coups</div>
            <div class="tab" onclick="changeTab('Tab2')">📄 Tab2</div>
            <div class="tab" onclick="changeTab('before')">⚙️ <</div>
            <div class="tab" onclick="changeTab('next')">⭐ ></div>
        </div>

        <!-- Wrapper contenu -->
        <div class="tab-wrapper">
            <div id="Coups" class="tabcontent" style="display:block;">
                <h3>Coups</h3>
                <p>Historique des coups…</p>
                <!-- Beaucoup de contenu pour tester le scroll -->
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
                <p>26. Cfd4 Fd7</p>
                <p>27. Cxc4 Cxc4</p>
                <p>28. Fxc4 Fxc4</p>
                <p>29. Cxc4 Tb8</p>
                <p>30. b3 Tb4</p>
                <p>31. Ce3 Tb5</p>
                <p>32. Td1 Fe5</p>
                <p>33. f4 Fc7</p>
                <p>34. Td7 Fb6</p>
                <p>35. Tb7 Txb7</p>
                <p>36. Cxb7 Fxf2+</p>
                <p>37. Rxf2 Rf8</p>
                <p>38. Re3 Re7</p>
                <p>39. Cd6 f6</p>
                <p>40. g4 Rd7</p>
                <p>41. Rf3 Rc6</p>
                <p>42. Re4 Rd7</p>
                <p>43. h4 Rc6</p>
                <p>44. g5 hxg5</p>
                <p>45. hxg5 fxg5</p>
                <p>46. Cb7 Rd7</p>
                <p>47. Cd8 Re8</p>
                <p>48. Cc6 Rf7</p>
                <p>49. Cxe5+ Rg7</p>
                <p>50. Cc6 Rf6</p>
                <p>51. e5+ Rf7</p>
                <p>52. Cd4 g4</p>
                <p>53. Rf4 g3</p>
                <p>54. Rxg3 Re6</p>
                <p>55. Rf4 Rd5</p>
                <p>56. e6 Rxd4</p>
                <p>57. e7 c4</p>
                <p>58. e8=D c3</p>
                <p>59. De4+ Rc5</p>
                <p>60. Dxc3+ Rd5</p>
                <p>61. Dd3+ Rc5</p>
                <p>62. Re5 Rb4</p>
                <p>63. Dd4+ Ra3</p>
                <p>64. Db2+ Ra4</p>
                <p>65. Db4# 1-0</p>
            </div>
            <div id="Tab2" class="tabcontent">
                <h3>Tab 2</h3>
                <p>Contenu du deuxième onglet</p>
            </div>
            <div id="before" class="tabcontent">
                <h3>Précédent</h3>
                <p>Contenu précédent</p>
            </div>
            <div id="next" class="tabcontent">
                <h3>Suivant</h3>
                <p>Contenu suivant</p>
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
    const activeTab = document.querySelector(`.tab[onclick="changeTab('${tabId}')"]`);
    if(activeTab) activeTab.classList.add("active");
    const selected = document.getElementById(tabId);
    if(selected) selected.style.display="block";
}

function toggleTheme() {
    document.body.classList.toggle("dark");
}
</script>

</body>
</html>