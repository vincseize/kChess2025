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
    
    <link rel="icon" href="img/icon.svg" type="image/svg+xml">
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
            // CHARGEMENT DYNAMIQUE DU SPLASHSCREEN
            $splashVersion = $config['splashscreen']['version'] ?? 0;
            $splashFile = 'splashscreens/splashscreen' . $splashVersion . '.php';
            
            if (file_exists(__DIR__ . '/' . $splashFile)) {
                require_once $splashFile;
            } else {
                require_once 'splashscreens/splashscreen0.php';
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
                
                echo '';
                echo '<script src="js/kchess/bots/BotBase.js?v=' . time() . '"></script>';

                if (file_exists(__DIR__ . "/" . $botPath)) {
                    echo '<script src="' . $botPath . '?v=' . time() . '"></script>';
                }
            }
            
            require_once 'footer.php';
        ?>
    <?php endif; ?>

    <script>
        window.appConfig = <?php echo getAppConfigJson($config); ?>;
        
        if ('serviceWorker' in navigator) { 
            navigator.serviceWorker.register('sw.js').catch(e => console.error('SW error:', e)); 
        }

        window.addEventListener('load', function() {
            const splash = document.getElementById('splash-screen');
            // TEMPS D'AFFICHAGE DYNAMIQUE DEPUIS JSON
            const displayTime = <?php echo $config['splashscreen']['display_time'] ?? 1500; ?>;
            
            if (splash) {
                setTimeout(() => {
                    splash.style.opacity = '0';
                    setTimeout(() => splash.remove(), 800);
                }, displayTime);
            }
        });
    </script>
</body>
</html>