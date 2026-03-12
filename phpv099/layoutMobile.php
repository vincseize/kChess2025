<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Layout Mobile avec Hauteur selon Contenu</title>
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
            /* Supprimé height: 40px */
            background-color: #ecf0f1;
            flex-shrink: 0;
            padding: 10px 0; /* Pour l'espacement */
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
        }
        
        .player2-div {
            /* Supprimé height: 40px */
            background-color: #bdc3c7;
            flex-shrink: 0;
            padding: 10px 0; /* Pour l'espacement */
        }
        
        .bottom-div {
            background-color: #ecf0f1;
            flex: 1; /* Prend toute la hauteur restante */
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        footer {
            height: 60px;
            background-color: #2c3e50;
            color: white;
        }
    </style>
</head>
<body>
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
</body>
</html>