<?php
// index.php - dans le dossier php/
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
        // Configuration globale normalisée - MÊME STRUCTURE QUE HEADER.PHP
        window.appConfig = <?php echo getAppConfigJson($config); ?>;
        
        // Log de debug si activé
        <?php if ($config['debug']['console_log'] === true): ?>
        console.log('⚙️ Configuration index.php chargée:', {
            app: window.appConfig.app_name,
            version: window.appConfig.version,
            debug_console_log: window.appConfig.debug.console_log,
            chess_engine_console_log: window.appConfig.chess_engine.console_log,
            source: 'index.php'
        });
        
        alert('index.php - Configuration chargée:\n' +
              '- debug.console_log = ' + window.appConfig.debug.console_log + '\n' +
              '- chess_engine.console_log = ' + window.appConfig.chess_engine.console_log + '\n' +
              '- Les deux doivent être FALSE pour désactiver les logs!');
        <?php endif; ?>
    </script>

    <style>
        body {
            margin: 0;
            padding: 0;
            background: #f8f9fa;
        }
    </style>
</head>
<body>

<?php
// Inclure newGame.php - les variables $config et $version sont déjà disponibles
require_once 'newGame.php';
?>

</body>
</html>