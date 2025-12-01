<?php
// templateChess-desktop.php
$version = time(); // ou $config['version'] si vous voulez une version stable

// Charger la configuration JSON
$config = json_decode(file_get_contents('../config/game-config.json'), true);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($config['app_name']); ?> v<?php echo htmlspecialchars($config['version']); ?></title>
    
    <link rel="icon" href="../img/favicon.png">

    <!-- PWA Meta Tags Essentiels -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="KChess">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#764ba2">

    <!-- Apple Touch Icons -->
    <link rel="apple-touch-icon" href="../img/icon-180x180.png">
    <link rel="apple-touch-icon" sizes="152x152" href="../img/icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="../img/icon-180x180.png">

    <!-- Manifest -->
    <link rel="manifest" href="../manifest.json">

    <!-- Bootstrap 5 -->
    <link href="../css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="../css/bootstrap-icons.css">


    <link rel="stylesheet" href="../css/all.min.css">
    <link rel="stylesheet" href="../css/common-chess.css">
    <link rel="stylesheet" href="../css/templateChess-desktop.css">


    <link href="../css/kchess/variables.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/layout.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/components.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/utilities.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/chess-board-base.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/chess-board-coordinates.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/chess-board-states.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/chess-board-pieces.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/chess-board-animations.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/chess-board-special.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/chess-pieces.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/responsive.css?version=<?php echo $version; ?>" rel="stylesheet">
    <link href="../css/kchess/promotion-modal.css?version=<?php echo $version; ?>" rel="stylesheet">

</head>
<body>

<div class="game-layout">

<header>
    <div class="header-level" id="headerLevel">L0</div>
    <?php echo htmlspecialchars($config['app_name']); ?>
</header>

    <div class="main-content">
        
        <!-- Rangée principale -->
        <div class="main-row">
            
            <!-- Colonne Nouvelle Partie -->
            <div class="new-game-col">
                <button class="new-game-btn" id="newGame">
                    <div class="new-game-btn-icon"><i class="fas fa-plus text-color2"></i></div>
                    <div class="new-game-btn-text">Nouvelle Partie</div>
                </button>
            </div>

            <!-- Colonne Échiquier -->
            <div class="chessboard-col">
                <div id="section-black" class="section-joueurs">
                    <div class="player-info">
                        <div class="player-name">Joueur 2 black<span class="mode"></span></div>
                        <div class="player-clock player-clock-black">10:00</div>
                    </div>
                </div>

                <div class="chessboard-container">


                    <!-- <div id="gameContent" class="section-board">
                        Zone de jeu (échecs)
                </div> -->
                    
                    
                <!-- <div class="chess-board-container mx-auto w-100 h-100 d-flex align-items-center justify-content-center"> -->
                    <div id="chessBoard" class="chess-board">
                        <!-- Le board sera généré en JavaScript -->
                    </div>
                <!-- </div> -->
                    
                </div>

                <div id="section-white" class="section-joueurs">
                    <div class="player-info">
                        <div class="player-name">Joueur 1 white<span class="mode"></span></div>
                        <div class="player-clock player-clock-white">10:00</div>
                    </div>
                </div>
            </div>

            <!-- Colonne Coups et contrôles -->
            <div class="controls-col">
                <div class="coups-section">
                    <div class="coups-header section-joueurs">
                        Historique des coups 
                        <span class="pgn" id="copyPGN">PGN</span>
                        <span class="fen" id="copyFEN">FEN</span>
                    </div>


                        <div id="moveHistory" class="move-history" style="max-height: 300px;">
                            <div class="text-center text-muted small p-3">
                                Aucun coup joué
                            </div>
                        </div>


                    <div class="coups-content">
                        <div class="coups-list">
                            
                        </div>
                    </div>
                </div>

                <div class="controls-section">
                    <div class="control-buttons">
                        <button class="control-btn" onclick="firstMove()">
                            <div class="control-btn-icon"><i class="fas fa-fast-backward text-color2"></i></div>
                            <div class="control-btn-text">Premier</div>
                        </button>
                        <button class="control-btn" onclick="previousMove()">
                            <div class="control-btn-icon"><i class="fas fa-arrow-left text-color2"></i></div>
                            <div class="control-btn-text">Précédent</div>
                        </button>
                        <button class="control-btn" onclick="nextMove()">
                            <div class="control-btn-icon"><i class="fas fa-arrow-right text-color2"></i></div>
                            <div class="control-btn-text">Suivant</div>
                        </button>
                        <button class="control-btn" onclick="lastMove()">
                            <div class="control-btn-icon"><i class="fas fa-fast-forward text-color2"></i></div>
                            <div class="control-btn-text">Dernier</div>
                        </button>
                        <button class="control-btn" onclickDES="flipBoard()" id="flipBoard">
                            <div class="control-btn-icon"><i class="fas fa-sync-alt text-color2"></i></div>
                            <div class="control-btn-text">Tourner</div>
                        </button>
                    </div>
                </div>
            </div>

        </div> <!-- FIN de .main-row -->

        <!-- Footer Sticky - EN DEHORS de .main-row -->
        <div class="sticky-footer">
            <div class="footer-content">
                <div class="footer-info">
                    Partie en cours • Temps restant: 08:45
                </div>
                <div class="footer-actions">
                    <button class="footer-btn" onclick="pauseGame()">Pause</button>
                    <button class="footer-btn" onclick="resignGame()">Abandonner</button>
                    <button class="footer-btn" onclick="offerDraw()">Proposer nulle</button>
                </div>
            </div>
        </div>

    </div> <!-- FIN de .main-content -->

</div> <!-- FIN de .game-layout -->

<?php

// Inclure le footer avec les scripts
require_once '../footer.php';  
?>
