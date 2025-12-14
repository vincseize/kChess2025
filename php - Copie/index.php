<?php
// index.php - dans le dossier php/
require_once __DIR__ . '/config-loader.php'; // Même dossier

$config = loadGameConfig();
$version = getVersion();

// GESTION DE LA LANGUE - REDIRECTION AUTOMATIQUE
// Vérifier si le paramètre lang est présent
if (!isset($_GET['lang'])) {
    // Rediriger automatiquement vers ?lang=fr
    header('Location: ?lang=fr');
    exit;
}

// Récupérer la langue depuis l'URL
$currentLang = isset($_GET['lang']) && in_array($_GET['lang'], ['fr', 'en']) 
    ? $_GET['lang'] 
    : 'fr'; // Fallback vers français

// Mettre à jour la configuration avec la langue
$config['current_lang'] = $currentLang;

logConfigInfo($config);
?>
<!DOCTYPE html>
<html lang="<?php echo $currentLang; ?>">
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
        // Configuration globale normalisée
        window.appConfig = <?php echo getAppConfigJson($config); ?>;
        
        // Ajouter la langue à la configuration
        window.appConfig.lang = '<?php echo $currentLang; ?>';
        
        // Ajouter les traductions
        window.appTranslations = <?php 
            echo json_encode(isset($config['lang'][$currentLang]) 
                ? $config['lang'][$currentLang] 
                : $config['lang']['fr']);
        ?>;
        
        // Log de debug si activé
        <?php if ($config['debug']['console_log'] === true): ?>
        console.log('⚙️ Configuration index.php chargée:', {
            app: window.appConfig.app_name,
            version: window.appConfig.version,
            lang: window.appConfig.lang,
            translations: window.appTranslations,
            source: 'index.php'
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
// Passer la langue à newGame.php
$lang = $currentLang;
require_once 'newGame.php';
?>

</body>
</html>