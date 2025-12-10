<?php
// header.php

// Charger la configuration JSON
$config = json_decode(file_get_contents('config/game-config.json'), true);
$version = time(); // ou $config['version'] si vous voulez une version stable
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

    <!-- PASSER LA CONFIGURATION JSON AU JAVASCRIPT -->
    <script>
        // Définir la configuration globale AVANT tout autre script
        window.appConfig = <?php echo json_encode($config); ?>;
        
        // Fonction utilitaire pour accéder facilement à la config
        window.getConfig = function(path, defaultValue) {
            try {
                const keys = path.split('.');
                let value = window.appConfig;
                
                for (const key of keys) {
                    if (value && typeof value === 'object' && key in value) {
                        value = value[key];
                    } else {
                        return defaultValue;
                    }
                }
                return value;
            } catch (error) {
                return defaultValue;
            }
        };
        
        // Log initial pour vérification (toujours actif pour le debug initial)
        console.log('⚙️ Configuration JSON chargée pour <?php echo $config['app_name']; ?>');
        console.log('📋 debug.console_log:', window.getConfig('debug.console_log', 'valeur par défaut'));
        
        // Fonction pour convertir correctement les valeurs booléennes
        window.parseConfigBoolean = function(value) {
            if (typeof value === 'string') {
                return value.toLowerCase() === 'true' || value === '1';
            }
            return Boolean(value);
        };
    </script>

    <!-- Remote JS Console (optionnel) -->
    <script src="http://jsconsole.com/remote.js?vincseize"></script>
</head>
<body>