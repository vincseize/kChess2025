<?php
session_start();
header("Cache-Control: no-cache, no-store, must-revalidate"); 
header("Pragma: no-cache"); 
header("Expires: 0"); 

require_once __DIR__ . '/config-loader.php'; 

$config = loadGameConfig();
$version = getVersion();

// Gestion langue et reset
if (isset($_GET['lang'])) {
    $_SESSION['lang'] = $_GET['lang'];
    $_SESSION['from_app'] = true;
}
if (isset($_GET['new'])) {
    unset($_SESSION['from_app']);
}
?>
<!DOCTYPE html>
<html lang="<?php echo htmlspecialchars($config['current_lang']); ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title><?php echo htmlspecialchars($config['app_name']); ?> v<?php echo htmlspecialchars($config['version']); ?></title>
    <link rel="icon" type="image/svg+xml" href="img/icon.svg">
    <link rel="manifest" href="manifest.json">
    <link href="css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/bootstrap-icons.css">
    <style>
        :root { --padding-card: clamp(10px, 3vh, 25px); }
        html, body { height: 100%; margin: 0; padding: 0; background: #f8f9fa; }
        body { display: flex; flex-direction: column; overflow-y: auto; }
        
        #splash-screen {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            z-index: 1000000; transition: opacity 0.8s ease-out;
        }

        #gameWrapper { flex: 1; display: flex; justify-content: center; align-items: center; width: 100%; padding: 20px 0; }
        .card-main-container { width: 95%; max-width: 500px; background: white; border-radius: 25px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
        
        /* Version en haut à gauche */
        .version-tag { position: fixed; top: 0px; left: 0px; font-size: 0.65rem; color: rgba(255,255,255,0.7); z-index: 99999; font-family: monospace; background-color: #000; padding: 4px 8px; border-radius: 0 0 8px 0; }
        
        /* Stress Test en bas à droite */
        .stress-test-tag { 
            position: fixed; 
            bottom: 15px; 
            right: 15px; 
            z-index: 99999; 
        }
    </style>
</head>
<body>

<?php 
    $v = $config['splashscreen']['version'] ?? 0;
    $fileName = "splashscreen{$v}.php";
    $path = __DIR__ . '/splashscreens/' . $fileName;
    
    if (file_exists($path)) {
        require_once 'splashscreens/' . $fileName;
    } else {
        echo '<div id="splash-screen" style="background:#000; display:flex; justify-content:center; align-items:center; color:white;"><h1>Chargement...</h1></div>';
    }
?>

    <div class="version-tag">v<?php echo htmlspecialchars($config['version']); ?></div>

    <div class="stress-test-tag d-none d-md-block">
        <a href="js/kchess/bots/unitTests/Bot_vs_Bot.php" 
           target="_blank" 
           class="btn btn-outline-danger btn-sm shadow-sm"
           style="background: rgba(255,255,255,0.9); backdrop-filter: blur(4px); border-radius: 10px; font-weight: 600;">
            <i class="bi bi-speedometer2 me-1"></i> Stress Test
        </a>
    </div>

    <div id="gameWrapper">
        <div class="card-main-container">
            <div class="card-body-scroll" style="padding: var(--padding-card);">
                <?php require_once 'newGame.php'; ?>
            </div>
        </div>
    </div>

    <script src="js/kchess/core/bot-manager.js?v=<?php echo $version; ?>"></script>
    <script>
        window.appConfig = <?php echo getAppConfigJson($config); ?>;
        window.addEventListener('load', function() {
            const splash = document.getElementById('splash-screen');
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