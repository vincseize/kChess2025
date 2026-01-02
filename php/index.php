<?php
session_start();
require_once __DIR__ . '/config-loader.php'; 

$config = loadGameConfig();
$version = getVersion();
logConfigInfo($config);

$isChangingLang = isset($_GET['lang']);
$isComingFromApp = (isset($_SESSION['from_app']) && $_SESSION['from_app'] === true) || $isChangingLang;

if ($isChangingLang) { $_SESSION['from_app'] = true; }
if ($isComingFromApp && !$isChangingLang) { unset($_SESSION['from_app']); }
?>
<!DOCTYPE html>
<html lang="<?php echo htmlspecialchars($config['current_lang']); ?>">
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

        /* STRUCTURE : On autorise le scroll body pour le mobile */
        html, body {
            height: 100%; margin: 0; padding: 0;
            background: #f8f9fa;
        }
        body { 
            display: flex; flex-direction: column; 
            overflow-y: auto !important; /* CRITIQUE : Permet de voir le bouton Start */
        }

        /* SPLASH */
        #splash-screen {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            background: linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%);
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            z-index: 1000000; color: white; text-align: center;
            transition: opacity 0.8s ease-out, visibility 0.8s;
        }

        /* JEU & CARTE */
        #gameWrapper { 
            flex: 1; display: flex; justify-content: center; align-items: center; 
            width: 100%; padding: 20px 0; 
        }
        
        /* Correction de la carte pour qu'elle ne bloque pas le scroll */
        .card-main-container {
            width: 95%; max-width: 500px;
            background: white; border-radius: 25px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.2);
            overflow: hidden;
            display: flex; flex-direction: column;
        }

        .card-body-scroll {
            padding: var(--padding-card);
            overflow-y: visible; /* On laisse le body gérer le scroll */
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
            position: fixed; top: 0px; left: 0px; font-size: 0.65rem;
            color: rgba(255,255,255,0.7); z-index: 99999;
            font-family: monospace; background-color: #000;
            padding: 4px 8px; border-radius: 8px;
        }
    </style>
</head>
<body>

    <?php 
    if (!$isComingFromApp && file_exists('splashscreens/splashscreen1.php')) {
        include 'splashscreens/splashscreen1.php'; 
    }
    ?>

    <div class="version-tag">v<?php echo htmlspecialchars($config['version']); ?></div>

    <div id="gameWrapper">
        <div class="card-main-container">
            <div class="card-body-scroll">
                <?php require_once 'newGame.php'; ?>
            </div>
        </div>
    </div>

    <!-- <script src="js/bots/Level_3.js?v=<?php echo $version; ?>"></script>
    <script src="js/bots/bot-manager.js?v=<?php echo $version; ?>"></script> -->

    <script>
        window.appConfig = <?php echo getAppConfigJson($config); ?>;

        if ('serviceWorker' in navigator) { 
            navigator.serviceWorker.register('sw.js').catch(err => console.log('SW error:', err)); 
        }

        // Script de masquage Splash
        window.addEventListener('load', function() {
            const splash = document.getElementById('splash-screen');
            if (splash) {
                setTimeout(() => {
                    splash.style.opacity = '0';
                    setTimeout(() => { splash.style.visibility = 'hidden'; }, 800);
                }, 1500);
            }
        });
    </script>
</body>
</html>