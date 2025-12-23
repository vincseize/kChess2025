<?php
// header.php - dans le dossier php/
require_once __DIR__ . '/config-loader.php'; // Même dossier

$config = loadGameConfig();
$version = getVersion();
logConfigInfo($config);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($config['app_name']); ?> v<?php echo htmlspecialchars($config['version']); ?></title>
    
    <link rel="icon" href="img/favicon.png">

    <!-- PWA Meta Tags Essentiels -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="KChess">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#764ba2">

    <!-- Apple Touch Icons -->
    <link rel="apple-touch-icon" href="img/icon-180x180.png">
    <link rel="apple-touch-icon" sizes="152x152" href="img/icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="img/icon-180x180.png">

    <!-- Manifest -->
    <link rel="manifest" href="manifest.json">

    <!-- Bootstrap 5 -->
    <link href="css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/bootstrap-icons.css">

    <!-- Configuration JavaScript - NORMALISÉE -->
    <script>
        // Configuration globale normalisée - MÊME STRUCTURE POUR TOUTES LES PAGES
        window.appConfig = <?php echo getAppConfigJson($config); ?>;
        
        // Vérification et log de la configuration
        console.log('⚙️ Configuration header.php chargée:', {
            app: window.appConfig.app_name,
            version: window.appConfig.version,
            debug_console_log: window.appConfig.debug.console_log,
            chess_engine_console_log: window.appConfig.chess_engine.console_log,
            source: 'header.php'
        });
        

    </script>

    <!-- CSS Chess réorganisé - AVEC VERSION POUR CACHE -->
    <link href="css/kchess/variables.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="css/kchess/layout.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="css/kchess/components.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="css/kchess/utilities.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="css/kchess/chess-board-base.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="css/kchess/chess-board-coordinates.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="css/kchess/chess-board-states.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="css/kchess/chess-board-pieces.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="css/kchess/chess-board-animations.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="css/kchess/chess-board-special.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="css/kchess/chess-pieces.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="css/kchess/responsive.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="css/kchess/promotion-modal.css?version=<?php echo $version; ?>" rel="stylesheet">



</head>