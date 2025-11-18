<?php
// header.php
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

    <!-- CSS Chess organisé -->
    <link href="css/kchess/core.css" rel="stylesheet">
    <link href="css/kchess/chess-board-base.css" rel="stylesheet">
    <link href="css/kchess/chess-board-coordinates.css" rel="stylesheet">
    <link href="css/kchess/chess-board-states.css" rel="stylesheet">
    <link href="css/kchess/chess-board-pieces.css" rel="stylesheet">
    <link href="css/kchess/chess-board-animations.css" rel="stylesheet">
    <link href="css/kchess/chess-board-special.css" rel="stylesheet">
    <link href="css/kchess/chess-pieces.css" rel="stylesheet">
    
    <!-- Votre responsive existant -->
    <link href="css/kchess/responsive.css" rel="stylesheet">
</head>