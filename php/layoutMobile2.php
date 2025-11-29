<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jeu Mobile</title>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            --bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --text: black;
            --tab-bg: #dcdcdc;
            --tab-hover: #bcbcbc;
            --footer-bg: #2c3e50;
            background: var(--bg);
            color: var(--text);
        }

        /* MODE SOMBRE */
        body.dark {
            --bg: #1e1e1e;
            --text: #f3f3f3;
            --tab-bg: #333;
            --tab-hover: #444;
            --footer-bg: #111;
            background: var(--bg);
        }

        .theme-button {
            position: absolute;
            right: 10px;
            top: 10px;
            background: transparent;
            border: 0;
            font-size: 1.3rem;
            cursor: pointer;
            user-select: none;
        }

        .game-layout {
            display: flex;
            flex-direction: column;
            flex: 1;
        }

        header {
            height: 60px;
            background-color: #3498db;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
        }

        .content-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }

        .top-div, .player2-div {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .top-div {
            background-color: #ecf0f1;
            padding: 10px 0;
        }

        .middle-div {
            width: 100%;
            height: 0;
            padding-top: 100%;
            background-color: #e74c3c;
            position: relative;
        }

        .middle-div-content {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            color: white;
            font-weight: bold;
            font-size: 1.2rem;
            padding: 10px;
        }

        .player2-div {
            background-color: #bdc3c7;
            padding: 10px 0;
        }

        /* ---- TABS ---- */
        .tabs {
            background-color: #ecf0f1;
            display: flex;
            width: 100%;
            height: 50px;
        }

        .tab {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: var(--tab-bg);
            font-size: 1rem;
            cursor: pointer;
            user-select: none;
            gap: 5px;
        }

        .tab:active,
        .tab:hover {
            background-color: var(--tab-hover);
        }

        .tabcontent {
            display: none;
            padding: 15px;
            background: white;
            flex: 1;
            overflow-y: auto;
        }

        /* ---- FOOTER ---- */
        footer {
            height: 5px;
            width: 100%;
            background-color: var(--footer-bg);
        }
    </style>
</head>
<body>

    <div class="game-layout">

        <header>
            Header Principal

            <!-- BOUTON THEME -->
            <button class="theme-button" onclick="toggleTheme()">🌙</button>
        </header>

        <div class="content-container">

            <div class="top-div">Section du haut Joueur 1</div>

            <div class="middle-div">
                <div id="gameContent" class="middle-div-content">
                    <!-- On laisse VIDE comme demandé -->
                </div>
            </div>

            <div class="player2-div">Section du haut Joueur 2</div>

            <!-- 4 TABS -->
            <div class="tabs">
                <div class="tab" onclick="changeTab('Coups')">♟️ Coups</div>
                <div class="tab" onclick="changeTab('Tab2')">📄 Tab 2</div>
                <div class="tab" onclick="changeTab('Tab3')">⚙️ Tab 3</div>
                <div class="tab" onclick="changeTab('Tab4')">⭐ Tab 4</div>
            </div>

            <!-- TABS CONTENT -->
            <div id="Coups" class="tabcontent">
                <h3>Coups</h3>
                <p>Historique ou contenu…</p>
            </div>

            <div id="Tab2" class="tabcontent">
                <h3>Tab2</h3>
                <p>Contenu tab 2</p>
            </div>

            <div id="Tab3" class="tabcontent">
                <h3>Tab3</h3>
                <p>Contenu tab 3</p>
            </div>

            <div id="Tab4" class="tabcontent">
                <h3>Tab4</h3>
                <p>Contenu tab 4</p>
            </div>

        </div>

        <footer></footer>

    </div>

<script>
/* ------ TABS ------ */
function changeTab(tabId) {
    const contents = document.getElementsByClassName("tabcontent");

    for (let i = 0; i < contents.length; i++) {
        contents[i].style.display = "none";
    }

    const selected = document.getElementById(tabId);
    if (selected) {
        selected.style.display = "block";
    }
}

/* TAB défaut */
changeTab('Coups');

/* ------ THEME ------ */
function toggleTheme() {
    document.body.classList.toggle("dark");
}
</script>

</body>
</html>
