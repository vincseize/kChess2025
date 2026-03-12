<?php
session_start();

// index.php - Point d'entrée principal
header("Cache-Control: no-cache, no-store, must-revalidate"); 
header("Pragma: no-cache"); 
header("Expires: 0"); 

require_once __DIR__ . '/config-loader.php'; 

$config = loadGameConfig();
$version = $config['version'] ?? '1.0';
logConfigInfo($config);

// --- LOGIQUE DEBUG & CONFIG ---
$ssConfig = $config['splashscreen'] ?? ['loading' => false, 'version' => 1, 'display_time' => 800];

$isManualReset = isset($_GET['new']);
$isChangingLang = isset($_GET['lang']);

// Si on vient de l'application (clic sur Nouvelle Partie)
if ($isManualReset) {
    // On marque le splash comme déjà vu pour éviter qu'il s'affiche
    $_SESSION['splash_shown'] = true; 
    unset($_SESSION['from_app']);
}

// Détermination de l'affichage du splash
$splashShown = isset($_SESSION['splash_shown']);

// MODIFICATION ICI : 
// On affiche le splash SEULEMENT SI :
// 1. Activé dans le JSON 
// 2. ET qu'il n'a PAS encore été vu 
// 3. ET que ce n'est PAS un reset manuel (?new)
// 4. ET que ce n'est PAS un changement de langue
$shouldShowSplash = $ssConfig['loading'] && !$splashShown && !$isManualReset && !$isChangingLang;

if ($shouldShowSplash) {
    $_SESSION['splash_shown'] = true; 
}
?>
<!DOCTYPE html>
<html lang="<?php echo htmlspecialchars($config['current_lang'] ?? 'fr'); ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title><?php echo htmlspecialchars($config['app_name'] ?? 'Chess'); ?> v<?php echo $version; ?></title>
    
    <link rel="icon" href="img/favicon.png">
    <link rel="manifest" href="manifest.json">
    <link href="css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/bootstrap-icons.css">

    <style>
        :root {
            --padding-card: clamp(10px, 3vh, 25px);
        }
        html, body { height: 100%; margin: 0; padding: 0; background: #f8f9fa; }
        body { display: flex; flex-direction: column; overflow-y: auto !important; }

        #splash-screen {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            z-index: 1000000; display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            transition: opacity 0.8s ease;
            background: #1a2a6c; 
        }

        #gameWrapper { flex: 1; display: flex; justify-content: center; align-items: center; width: 100%; padding: 20px 0; }
        .card-main-container { width: 95%; max-width: 500px; background: white; border-radius: 25px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); overflow: hidden; }
        .version-tag { position: fixed; top: 0px; left: 0px; font-size: 0.65rem; color: rgba(255,255,255,0.7); z-index: 99999; font-family: monospace; background-color: #000; padding: 4px 8px; border-radius: 0 0 8px 0; }
    </style>
</head>
<body>

    <?php 
    if ($shouldShowSplash) {
        $splashPath = 'splashscreens/splashscreen'. $ssConfig['version'] .'.php';
        if (file_exists(__DIR__ . '/' . $splashPath)) {
            include $splashPath; 
        }
    }
    ?>

    <div class="version-tag">v<?php echo $version; ?></div>

    <div id="gameWrapper">
        <div class="card-main-container">
            <div class="card-body-scroll" style="padding: var(--padding-card);">
                <?php require_once 'newGame.php'; ?>
            </div>
        </div>
    </div>

    <?php 
    $coreFiles = ['js/kchess/bots/BotCore.js', 'js/kchess/bots/BotBase.js'];
    foreach ($coreFiles as $corePath) {
        if (file_exists(__DIR__ . '/' . $corePath)) {
            echo '    <script src="' . $corePath . '?v=' . $version . '"></script>' . PHP_EOL;
            break; 
        }
    }

    $botDir = __DIR__ . '/js/kchess/bots/';
    $botFiles = glob($botDir . 'Level_*.js');
    sort($botFiles, SORT_NATURAL);
    foreach ($botFiles as $file) {
        $fileName = basename($file);
        if ($fileName !== 'BotCore.js' && $fileName !== 'BotBase.js') {
            echo '    <script src="js/kchess/bots/' . $fileName . '?v=' . $version . '"></script>' . PHP_EOL;
        }
    }
    ?>
    <script src="js/kchess/core/bot-manager.js?v=<?php echo $version; ?>"></script>

    <script>
        window.appConfig = <?php echo getAppConfigJson($config); ?>;

        window.addEventListener('load', function() {
            const splash = document.getElementById('splash-screen');
            if (splash) {
                const displayTime = window.appConfig?.splashscreen?.display_time ?? 1500;
                setTimeout(() => {
                    splash.style.opacity = '0';
                    setTimeout(() => { 
                        splash.remove(); 
                    }, 800);
                }, displayTime);
            }
        });

        if ('serviceWorker' in navigator) { 
            navigator.serviceWorker.register('sw.js').catch(err => console.log('SW error:', err)); 
        }
    </script>
</body>
</html>