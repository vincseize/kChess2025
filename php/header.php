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

    <!-- CSS Chess réorganisé - NOUVELLE STRUCTURE -->
    <!-- Variables et base -->
    <link href="css/kchess/variables.css" rel="stylesheet">
    <link href="css/kchess/layout.css" rel="stylesheet">
    
    <!-- Composants UI -->
    <link href="css/kchess/components.css" rel="stylesheet">
    <link href="css/kchess/utilities.css" rel="stylesheet">
    
    <!-- Échiquier et pièces -->
    <link href="css/kchess/chess-board-base.css" rel="stylesheet">
    <link href="css/kchess/chess-board-coordinates.css" rel="stylesheet">
    <link href="css/kchess/chess-board-states.css" rel="stylesheet">
    <link href="css/kchess/chess-board-pieces.css" rel="stylesheet">
    <link href="css/kchess/chess-board-animations.css" rel="stylesheet">
    <link href="css/kchess/chess-board-special.css" rel="stylesheet">
    <link href="css/kchess/chess-pieces.css" rel="stylesheet">
    
    <!-- Responsive et modals -->
    <link href="css/kchess/responsive.css" rel="stylesheet">
    <link href="css/kchess/promotion-modal.css" rel="stylesheet">
</head>