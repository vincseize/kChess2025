<?php
/**
 * app.php - Version Fusionnée (Routage Dynamique & Bots)
 * Gère : Desktop/Mobile + Configuration/Jeu + Injection de Bots
 */
session_start();

// 1. DÉSACTIVER LE CACHE
header("Cache-Control: no-cache, no-store, must-revalidate"); 
header("Pragma: no-cache"); 
header("Expires: 0"); 

require_once __DIR__ . '/config-loader.php'; 

// 2. INITIALISATION CONFIG
$config = loadGameConfig();
$version = getVersion();

// 3. DÉTECTION MOBILE
function isMobileDevice() {
    return preg_match('/(android|iphone|ipad|ipod|blackberry|opera mini|windows phone|mobile)/i', $_SERVER['HTTP_USER_AGENT']);
}
$isMobile = isMobileDevice();

// 4. ÉTAT DU JEU
$isManualReset = isset($_GET['new']);
$gameStarted = isset($_GET['mode']); // Si 'mode' est dans l'URL, on joue
$requestedLevel = isset($_GET['level']) ? intval($_GET['level']) : 1;

// Nettoyage si nouvelle partie
if ($isManualReset) {
    unset($_SESSION['from_app']);
}
?>
<!DOCTYPE html>
<html lang="<?php echo htmlspecialchars($config['current_lang']); ?>">
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
            --marge-entre-blocs: clamp(2px, 1.5vh, 15px); 
            --padding-card: clamp(10px, 3vh, 25px);
        }
        html, body { height: 100%; margin: 0; padding: 0; background: #f8f9fa; }
        body { display: flex; flex-direction: column; overflow-x: hidden; }
        
        /* Styles pour le wrapper de configuration */
        #gameSetupWrapper { flex: 1; display: flex; justify-content: center; align-items: center; width: 100%; padding: 20px 0; }
        .card-main-container { width: 95%; max-width: 500px; background: white; border-radius: 25px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); overflow: hidden; }
    </style>
</head>
<body>

    <?php if (!$gameStarted): ?>
        <?php 
        // Splashscreen uniquement si pas de reset manuel
        if (!$isManualReset && file_exists('splashscreens/splashscreen1.php')) {
            include 'splashscreens/splashscreen1.php'; 
        }
        ?>
        <div id="gameSetupWrapper">
            <div class="card-main-container">
                <div class="card-body-scroll" style="padding: var(--padding-card);">
                    <?php 
                        // Note: newGame.php utilisera 'app.php' comme targetPage
                        require_once 'newGame.php'; 
                    ?>
                </div>
            </div>
        </div>
    <?php else: ?>
        <?php 
            $_SESSION['from_app'] = true;
            require_once 'header.php'; // Scripts de base & BotCore

            // Routage interne du contenu
            if ($isMobile) {
                require_once 'content_mobile.php';
            } else {
                require_once 'content.php';
            }

            // Injection du Bot si mode bot activé
            if (isset($_GET['mode']) && $_GET['mode'] === 'bot') {
                $botPath = "js/kchess/bots/Level_" . $requestedLevel . ".js";
                $versionedBot = $botPath . "?v=" . time();
                if (file_exists(__DIR__ . "/" . $botPath)) {
                    echo '<script src="' . $versionedBot . '" defer></script>';
                } else {
                    echo '<script src="js/kchess/bots/Level_1.js?v=' . time() . '" defer></script>';
                }
            }
            
            require_once 'footer.php';
        ?>
    <?php endif; ?>

    <script>
        window.appConfig = <?php echo getAppConfigJson($config); ?>;
        
        (function() {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('new')) {
                console.log("🧹 Nettoyage storage...");
                localStorage.clear();
                sessionStorage.clear();
            }
        })();

        if ('serviceWorker' in navigator) { 
            navigator.serviceWorker.register('sw.js').catch(err => console.log('SW error:', err)); 
        }

        // Gestion du SplashScreen
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