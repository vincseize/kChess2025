<?php
// header.php
$version = time(); // ou $config['version'] si vous voulez une version stable
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($config['app_name']); ?> v<?php echo htmlspecialchars($config['version']); ?></title>
    
    <link rel="icon" href="img/favicon.png">

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
</head>