<?php
// index.php - dans le dossier php/
session_start();
require_once __DIR__ . '/config-loader.php'; 

$config = loadGameConfig();
$version = getVersion();
logConfigInfo($config);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title><?php echo htmlspecialchars($config['app_name']); ?> v<?php echo htmlspecialchars($config['version']); ?></title>
    
    <link rel="icon" href="img/favicon.png">
    <link rel="manifest" href="manifest.json">
    <link href="css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/bootstrap-icons.css">

    <style>
        /* 1. VERROUILLAGE TOTAL DE L'ÉCRAN */
        html, body {
            height: 100%;
            height: 100dvh;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            width: 100vw;
            background: #f8f9fa;
        }

        body {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            left: 0;
        }

        /* 2. NETTOYAGE RADICAL DES MARGES (On écrase tout) */
        #gameWrapper {
            flex: 1;
            width: 100%;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }

        /* Supprime les espaces au dessus/dessous du contenu principal */
        #gameWrapper main, 
        #gameWrapper .container, 
        #gameWrapper .container-fluid {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
        }

        /* Réduit l'espace des lignes Bootstrap */
        #gameWrapper .row {
            margin: 0 !important;
            padding: 0 !important;
        }

        /* Compresse la div blanche (Card) */
        #gameWrapper .card {
            margin-top: 5px !important; /* Juste un micro-espace en haut */
            margin-bottom: 0 !important;
            border: none !important;
            box-shadow: none !important;
        }

        #gameWrapper .card-body {
            padding: 10px !important; /* On serre le contenu interne */
        }

        /* On écrase les marges de tous les éléments de formulaire/texte */
        #gameWrapper h1, #gameWrapper h2, #gameWrapper h3, #gameWrapper h4,
        #gameWrapper p, #gameWrapper div, #gameWrapper section {
            margin-top: 0 !important;
            /* margin-bottom géré au cas par cas si besoin */
        }

        /* Force le bouton à remonter */
        #gameWrapper .mt-4, #gameWrapper .mt-3, #gameWrapper .py-3 {
            margin-top: 5px !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
        }

        /* 3. TAG VERSION */
        .version-tag {
            position: fixed;
            bottom: 4px;
            right: 8px;
            font-size: 0.6rem;
            color: #ffffff !important;
            background: rgba(0, 0, 0, 0.3);
            padding: 1px 5px;
            border-radius: 3px;
            z-index: 99999;
            pointer-events: none;
            font-family: monospace;
        }
    </style>
</head>
<body>

<div class="version-tag">
    v<?php echo htmlspecialchars($config['version']); ?>
</div>

<div id="gameWrapper">
    <?php require_once 'newGame.php'; ?>
</div>

<script>
    window.appConfig = <?php echo getAppConfigJson($config); ?>;

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js');
        });
    }

    // Désactive le scroll "élastique" qui fait apparaître du blanc
    document.body.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
    
    // Réactive le scroll uniquement pour la zone de jeu
    document.getElementById('gameWrapper').addEventListener('touchmove', function(e) {
        e.stopPropagation();
    }, { passive: true });
</script>

</body>
</html>