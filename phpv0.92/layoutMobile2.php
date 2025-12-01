<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jeu Mobile - Écran d'Accueil</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        /* Écran d'accueil */
        .welcome-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: white;
            text-align: center;
            padding: 20px;
        }
        
        .welcome-screen.hidden {
            display: none;
        }
        
        .logo {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .game-title {
            font-size: 1.8rem;
            margin-bottom: 10px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        .game-subtitle {
            font-size: 1rem;
            margin-bottom: 40px;
            opacity: 0.9;
        }
        
        .menu-buttons {
            display: flex;
            flex-direction: column;
            gap: 15px;
            width: 100%;
            max-width: 280px;
        }
        
        .menu-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 25px;
            padding: 15px 30px;
            color: white;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }
        
        .menu-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        
        .menu-btn.primary {
            background: #e74c3c;
            border-color: #e74c3c;
        }
        
        /* Layout du jeu (caché au début) */
        .game-layout {
            display: none;
            flex: 1;
            flex-direction: column;
        }
        
        .game-layout.active {
            display: flex;
        }
        
        header, .second-header, footer {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
        }
        
        header {
            height: 60px;
            background-color: #3498db;
            color: white;
        }
        
        .second-header {
            height: 50px;
            background-color: #2980b9;
            color: white;
        }
        
        .content-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }
        
        .top-div, .middle-div, .player2-div, .bottom-div {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .top-div {
            background-color: #ecf0f1;
            flex-shrink: 0;
            padding: 10px 0;
        }
        
        .middle-div {
            width: 100%;
            height: 0;
            padding-top: 100%;
            background-color: #e74c3c;
            position: relative;
            flex-shrink: 0;
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
            color: white;
            font-weight: bold;
            font-size: 1.2rem;
        }
        
        .player2-div {
            background-color: #bdc3c7;
            flex-shrink: 0;
            padding: 10px 0;
        }
        
        .bottom-div {
            background-color: #ecf0f1;
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        footer {
            height: 60px;
            background-color: #2c3e50;
            color: white;
        }
        
        /* Bouton retour */
        .back-btn {
            position: absolute;
            top: 15px;
            left: 15px;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 8px 15px;
            border-radius: 15px;
            cursor: pointer;
            backdrop-filter: blur(10px);
        }
    </style>
</head>
<body>
    <!-- Écran d'accueil -->
    <div class="welcome-screen" id="welcomeScreen">
        <div class="logo">🎮</div>
        <h1 class="game-title">Mon Jeu Mobile</h1>
        <p class="game-subtitle">Affrontez votre ami dans ce jeu passionnant</p>
        
        <div class="menu-buttons">
            <button class="menu-btn primary" onclick="startGame()">
                Jouer Maintenant
            </button>
            <button class="menu-btn" onclick="showRules()">
                Règles du Jeu
            </button>
            <button class="menu-btn" onclick="showSettings()">
                Paramètres
            </button>
        </div>
    </div>

    <!-- Layout du jeu -->
    <div class="game-layout" id="gameLayout">
        <button class="back-btn" onclick="showWelcomeScreen()">← Retour</button>
        
        <header>Header Principal</header>
        <div class="second-header">Deuxième Header</div>
        <div class="content-container">
            <div class="top-div">Section du haut Joueur 1</div>
            <div class="middle-div">
                <div class="middle-div-content">Carré Rouge</div>
            </div>
            <div class="player2-div">Section du haut Joueur 2</div>
            <div class="bottom-div">Footer Sticky 1</div>
        </div>
        <footer>Footer Sticky2</footer>
    </div>

    <script>
        function startGame() {
            document.getElementById('welcomeScreen').classList.add('hidden');
            document.getElementById('gameLayout').classList.add('active');
        }
        
        function showWelcomeScreen() {
            document.getElementById('welcomeScreen').classList.remove('hidden');
            document.getElementById('gameLayout').classList.remove('active');
        }
        
        function showRules() {
            alert('Règles du jeu:\n\n1. Chaque joueur a son tour\n2. Le carré rouge est la zone de jeu\n3. Le dernier à jouer gagne!');
        }
        
        function showSettings() {
            alert('Paramètres:\n\n- Volume: 80%\n- Vibrations: Activé\n- Notifications: Désactivé');
        }
    </script>
</body>
</html>