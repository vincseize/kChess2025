<?php
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
        :root {
            --marge-entre-blocs: clamp(2px, 1.5vh, 15px); 
            --hauteur-input: clamp(30px, 5vh, 45px);
            --taille-police-label: clamp(0.7rem, 1.8vh, 1rem);
            --padding-card: clamp(10px, 3vh, 25px);
        }

        /* STRUCTURE */
        html, body {
            height: 100% !important; margin: 0 !important; padding: 0 !important;
            overflow: hidden !important; background: #f8f9fa;
        }
        body { display: flex; flex-direction: column; height: 100vh; height: 100dvh; }

        /* STYLE DU SPLASH (Gardé ici pour éviter le flash blanc au chargement) */
        #splash-screen {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            background: linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%);
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            z-index: 1000000; color: white; text-align: center;
            transition: opacity 0.8s ease-out, visibility 0.8s;
        }
        #snow-canvas { position: absolute; top: 0; left: 0; pointer-events: none; }
        #splash-content { position: relative; z-index: 2; }
        #splash-content h1 { font-size: 3.2rem; font-weight: 800; margin: 10px 0 0 0; }
        #splash-content h2 { font-size: 1.6rem; font-weight: 300; opacity: 0.95; font-style: italic; }

        @keyframes treeSway {
            0% { transform: rotate(-8deg); }
            50% { transform: rotate(8deg); }
            100% { transform: rotate(-8deg); }
        }
        .tree-anim { display: inline-block; animation: treeSway 2.5s ease-in-out infinite; }

        /* JEU & CARTE */
        #gameWrapper { flex: 1; display: flex; justify-content: center; align-items: center; width: 100%; }
        #gameWrapper .card {
            height: 90dvh !important; width: 95%; max-width: 500px;
            background: white !important; border-radius: 25px !important;
            box-shadow: 0 20px 50px rgba(0,0,0,0.2) !important;
            display: flex !important; flex-direction: column !important;
            border: none !important; overflow: hidden;
        }
        #gameWrapper .card-body {
            flex: 1 !important; display: flex !important; flex-direction: column !important;
            justify-content: space-between !important; padding: var(--padding-card) !important;
            overflow-y: auto;
        }

        #gameWrapper .form-label { font-size: var(--taille-police-label); font-weight: 600; color: #333; }
        #gameWrapper .form-select, #gameWrapper .form-control { 
            height: var(--hauteur-input) !important; margin-bottom: var(--marge-entre-blocs) !important;
            border-radius: 12px; 
        }
        #gameWrapper .btn-lg { 
            width: 100%; padding: clamp(12px, 2.5vh, 22px) !important;
            font-weight: 800; text-transform: uppercase; border-radius: 15px;
        }

        .version-tag {
            position: fixed; bottom: 5px; right: 10px; font-size: 0.65rem;
            color: rgba(255,255,255,0.7); z-index: 99999; font-family: monospace;
        }
    </style>
</head>
<body>

    <?php include 'splashscreens/splashscreen1.php'; ?>

    <div class="version-tag">v<?php echo htmlspecialchars($config['version']); ?></div>

    <div id="gameWrapper">
        <?php require_once 'newGame.php'; ?>
    </div>

    <script>
        window.appConfig = <?php echo getAppConfigJson($config); ?>;

        // --- SECURITE MOBILE ---
        if ('serviceWorker' in navigator) { navigator.serviceWorker.register('sw.js'); }
        document.body.addEventListener('touchmove', (e) => {
            if (!e.target.closest('.card-body')) e.preventDefault();
        }, { passive: false });
    </script>

</body>
</html>