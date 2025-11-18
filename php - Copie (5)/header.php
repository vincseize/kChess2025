<?php
// header.php
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($config['app_name']); ?> v<?php echo htmlspecialchars($config['version']); ?></title>
    
    <!-- <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='20' r='12' fill='%23333'/><path d='M 20 20 Q 32 8 44 20 Q 40 30 36 34 Q 34 36 32 37 Q 30 36 28 34 Q 24 30 20 20' fill='%23333'/><ellipse cx='32' cy='48' rx='16' ry='8' fill='%23333'/></svg>"> -->
    <link rel="icon" href="img/favicon.png">

    <!-- Bootstrap 5 -->
    <link href="css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/bootstrap-icons.css">

    <link href="css/kchess/core.css" rel="stylesheet">
    <link href="css/kchess/chess-board.css" rel="stylesheet">
    <link href="css/kchess/chess-pieces.css" rel="stylesheet">
    <link href="css/kchess/responsive.css" rel="stylesheet">
</head>