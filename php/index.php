<?php
session_start();

// index.php - Point d'entrée principal avec Splashscreen piloté par JSON
header("Cache-Control: no-cache, no-store, must-revalidate"); 
header("Pragma: no-cache"); 
header("Expires: 0"); 

require_once __DIR__ . '/config-loader.php'; 

$config = loadGameConfig();
$version = $config['version'] ?? '1.0';
logConfigInfo($config);

// --- LOGIQUE DEBUG & CONFIG ---
$debug_log = [];
$ssConfig = $config['splashscreen'] ?? ['loading' => false, 'version' => 1, 'display_time' => 800];

$isManualReset = isset($_GET['new']);
$isChangingLang = isset($_GET['lang']);

// Si on force un "new", on vide la session splash
if ($isManualReset) {
    unset($_SESSION['splash_shown']);
    unset($_SESSION['from_app']);
    $debug_log[] = "Reset manuel détecté : Session nettoyée.";
}

// Détermination de l'affichage du splash
$splashShown = isset($_SESSION['splash_shown']);
$isComingFromApp = isset($_SESSION['from_app']) && $_SESSION['from_app'] === true;

// On affiche le splash si :
// 1. Activé dans le JSON
// 2. ET (C'est la première fois de la session OU c'est un reset manuel)
// 3. ET ce n'est pas juste un changement de langue
$shouldShowSplash = $ssConfig['loading'] && (!$splashShown || $isManualReset) && !$isChangingLang;

if ($shouldShowSplash) {
    $_SESSION['splash_shown'] = true; // On marque comme "vu" pour le prochain F5
    $debug_log[] = "Affichage du splash validé.";
} else {
    $debug_log[] = "Splash ignoré. Raisons : Loading=".($ssConfig['loading']?'Oui':'Non').", Déjà vu=".($splashShown?'Oui':'Non').", Langue=".($isChangingLang?'Oui':'Non');
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

        /* Style de base pour éviter le flash blanc avant le chargement du splash */
        #splash-screen {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            z-index: 1000000; display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            transition: opacity 0.8s ease;
            background: #1a2a6c; /* Couleur par défaut */
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
        } else {
            // Backup visuel si le fichier PHP est introuvable
            echo '<div id="splash-screen" style="background:red; color:white;">DEBUG: Fichier manquant : '.$splashPath.'</div>';
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
        console.log("🚀 Initialisation de l'application...");
        
        // Injection de la config PHP dans l'espace global JS
        window.appConfig = <?php echo getAppConfigJson($config); ?>;

        window.addEventListener('load', function() {
            console.log("🌐 Window Load : DOM et ressources prêts.");
            const splash = document.getElementById('splash-screen');
            
            if (splash) {
                // On récupère le temps du JSON ou 1500ms par défaut
                const displayTime = window.appConfig?.splashscreen?.display_time ?? 1500;
                console.log("⏲️ Splash détecté. Fermeture programmée dans : " + displayTime + "ms");

                setTimeout(() => {
                    console.log("🎬 Lancement de l'animation de sortie...");
                    splash.style.opacity = '0';
                    
                    // On attend la fin de la transition CSS (0.8s) pour nettoyer le DOM
                    setTimeout(() => { 
                        splash.style.display = 'none';
                        splash.remove(); 
                        console.log("🧹 Splash screen retiré du DOM.");
                    }, 800);
                }, displayTime);
            } else {
                console.log("ℹ️ Pas de splash screen à retirer.");
            }
        });

        // Service Worker
        if ('serviceWorker' in navigator) { 
            navigator.serviceWorker.register('sw.js').catch(err => console.log('SW error:', err)); 
        }
    </script>
</body>
</html>