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
$gameStarted = isset($_GET['mode']); // Si mode est présent, on lance l'interface de jeu

// Gestion de la session pour éviter les boucles de splashscreen
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
        :root { --padding-card: clamp(10px, 3vh, 25px); }
        html, body { height: 100%; margin: 0; padding: 0; background: #f8f9fa; overflow-x: hidden; }
        body { display: flex; flex-direction: column; }
        #gameSetupWrapper { flex: 1; display: flex; justify-content: center; align-items: center; width: 100%; padding: 20px 0; }
        .card-main-container { width: 95%; max-width: 500px; background: white; border-radius: 25px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); overflow: hidden; }
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

            // Injection dynamique du Bot spécifique
            if ($_GET['mode'] === 'bot') {
                $requestedLevel = intval($_GET['level'] ?? 1);
                $botPath = "js/kchess/bots/Level_" . $requestedLevel . ".js";
                
                // 1. On charge TOUJOURS la base d'abord
                echo '<script src="js/kchess/bots/BotBase.js?v=' . time() . '"></script>';

                // 2. On charge ensuite le niveau spécifique
                if (file_exists(__DIR__ . "/" . $botPath)) {
                    echo '<script src="' . $botPath . '?v=' . time() . '"></script>';
                }
            }
            
            require_once 'footer.php';
        ?>
    <?php endif; ?>

    <script>
        window.appConfig = <?php echo getAppConfigJson($config); ?>;
        
        // Gestion unifiée du SplashScreen et Service Worker
        if ('serviceWorker' in navigator) { 
            navigator.serviceWorker.register('sw.js').catch(e => console.error('SW error:', e)); 
        }

        window.addEventListener('load', function() {
            const splash = document.getElementById('splash-screen');
            if (splash) {
                setTimeout(() => {
                    splash.style.opacity = '0';
                    setTimeout(() => splash.remove(), 800); // On remove carrement du DOM
                }, 1500);
            }
        });
    </script>
</body>
</html>