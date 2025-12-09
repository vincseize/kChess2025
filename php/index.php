<?php
// index.php
$version = time();

// Charger la configuration JSON
$config = json_decode(file_get_contents('config/game-config.json'), true);

// Vérifier si le chargement a réussi
if (json_last_error() !== JSON_ERROR_NONE) {
    die("Erreur de chargement de la configuration JSON: " . json_last_error_msg());
}
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

    <!-- Configuration JavaScript -->
    <script>
        // Passer la configuration PHP à JavaScript
        window.appConfig = <?php echo json_encode($config, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
        
        // Log de debug si activé
        <?php if ($config['debug']['console_log'] === "true"): ?>
        console.log('⚙️ Configuration chargée:', {
            app: window.appConfig.app_name,
            version: window.appConfig.version,
            debug: window.appConfig.debug.console_log
        });
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