<?php
session_start();

// 1. PROTECTION CACHE & CHARGEMENT CONFIG
header("Cache-Control: no-cache, no-store, must-revalidate"); 
header("Pragma: no-cache"); 
header("Expires: 0"); 

require_once __DIR__ . '/config-loader.php'; 
$config = loadGameConfig();
$version = getVersion();

// 2. LOGIQUE DE ROUTAGE
$isMobile = preg_match('/(android|iphone|ipad|ipod|blackberry|opera mini|windows phone|mobile)/i', $_SERVER['HTTP_USER_AGENT']);
$isManualReset = isset($_GET['new']);
$gameStarted = isset($_GET['mode']); 

if ($isManualReset) {
    unset($_SESSION['from_app']);
}
?>
<!DOCTYPE html>
<html lang="<?php echo $config['current_lang']; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title><?php echo htmlspecialchars($config['app_name']); ?> v<?php echo $version; ?></title>
    
    <link rel="icon" href="img/favicon.png">
    <link rel="manifest" href="manifest.json">
    <link href="css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/bootstrap-icons.css">

    <style>
        :root { 
            --padding-card: clamp(10px, 3vh, 25px); 
            
            /* --- INJECTION DYNAMIQUE DES COULEURS JSON --- */
            --square-white: <?php echo $config['colors']['square_white']; ?>;
            --square-black: <?php echo $config['colors']['square_black']; ?>;
            --chess-selected: <?php echo $config['colors']['selected']; ?>;
            --chess-move: <?php echo $config['colors']['move_indicator'] ?? '#32CD32'; ?>;
        }

        /* Styles de base */
        html, body { height: 100%; margin: 0; padding: 0; background: #f8f9fa; overflow-x: hidden; font-family: system-ui, -apple-system, sans-serif; }
        body { display: flex; flex-direction: column; }
        
        /* Application des couleurs sur l'échiquier (Prioritaire) */
        .chess-square.white { background-color: var(--square-white) !important; }
        .chess-square.black { background-color: var(--square-black) !important; }

        /* Contraste automatique des coordonnées internes */
        .chess-square.white::before, .chess-square.white::after { color: var(--square-black); opacity: 0.6; }
        .chess-square.black::before, .chess-square.black::after { color: var(--square-white); opacity: 0.8; }

        /* Layout Setup */
        #gameSetupWrapper { flex: 1; display: flex; justify-content: center; align-items: center; width: 100%; padding: 20px 0; }
        .card-main-container { width: 95%; max-width: 500px; background: white; border-radius: 25px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); overflow: hidden; }
        
        /* Transition fluide pour le splash */
        #splash-screen { transition: opacity 0.8s ease; }
    </style>
</head>
<body>

    <?php if (!$gameStarted): ?>
        <?php 
            if (!$isManualReset && file_exists('splashscreens/splashscreen1.php')) {
                include 'splashscreens/splashscreen1.php'; 
            }
        ?>
        <div id="gameSetupWrapper">
            <div class="card-main-container">
                <div class="card-body-scroll" style="padding: var(--padding-card);">
                    <?php require_once 'newGame.php'; ?>
                </div>
            </div>
        </div>

    <?php else: ?>
        <?php 
            $_SESSION['from_app'] = true;
            require_once 'header.php'; 

            // Choix du contenu selon le device
            require_once ($isMobile ? 'content_mobile.php' : 'content.php');

            // Injection dynamique du Bot
            if ($_GET['mode'] === 'bot') {
                $requestedLevel = intval($_GET['level'] ?? 1);
                $botPath = "js/kchess/bots/Level_" . $requestedLevel . ".js";
                
                echo '<script src="js/kchess/bots/BotCore.js?v=' . $version . '"></script>';

                if (file_exists(__DIR__ . "/" . $botPath)) {
                    echo '<script src="' . $botPath . '?v=' . $version . '"></script>';
                } else {
                    echo '<script src="js/kchess/bots/Level_1.js?v=' . $version . '"></script>';
                }
            }
            
            require_once 'footer.php';
        ?>
    <?php endif; ?>

    <script>
        // Passage de la config PHP vers JS
        window.appConfig = <?php echo getAppConfigJson($config); ?>;
        
        // PWA Service Worker
        if ('serviceWorker' in navigator) { 
            navigator.serviceWorker.register('sw.js').catch(e => console.error('SW error:', e)); 
        }

        // Nettoyage Splash Screen piloté par le JSON
        window.addEventListener('load', function() {
            const splash = document.getElementById('splash-screen');
            
            // On récupère le temps d'affichage depuis la config (800ms dans ton cas)
            // On ajoute un fallback à 1000 au cas où la variable manquerait
            const displayTime = window.appConfig.splashscreen.display_time || 1000;

            if (splash) {
                setTimeout(() => {
                    splash.style.opacity = '0';
                    // On attend la fin de la transition CSS (0.8s) pour supprimer l'élément
                    setTimeout(() => splash.remove(), 800); 
                }, displayTime);
            }
        });
    </script>
</body>
</html>