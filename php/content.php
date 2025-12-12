<?php
// content.php - Layout avec menu à gauche

// ==============================================
// 1. CHARGER LA CONFIGURATION DEPUIS VOTRE JSON
// ==============================================

// Charger le fichier config-loader.php qui charge votre JSON
require_once __DIR__ . '/config-loader.php';
$config = loadGameConfig();

// ==============================================
// 2. DÉTERMINER LA LANGUE
// ==============================================

// Si $lang n'est pas déjà définie, la déterminer
if (!isset($lang)) {
    $lang = isset($_GET['lang']) ? $_GET['lang'] : 'fr';
}

// S'assurer que c'est fr ou en
if (!in_array($lang, ['fr', 'en'])) {
    $lang = 'fr';
}

// ==============================================
// 3. RÉCUPÉRER LES TRADUCTIONS
// ==============================================

$translations = isset($config['lang'][$lang]) 
    ? $config['lang'][$lang] 
    : $config['lang']['fr']; // Fallback français
?>

<main class="container-fluid py-3">
    <div class="row g-3">
        <!-- Colonne de gauche - Menu (nouveau) -->
        <div class="col-xxl-2 col-xl-3 col-lg-3 col-md-4 col-12">
            <div class="menu-container h-100">
                <!-- Menu latéral -->
                <div class="card h-100">
                    <div class="card-body p-2">
                        <!-- ACTIONS RAPIDES - TOUJOURS VISIBLES SUR MOBILE -->
                        <div class="d-grid gap-2 mb-3 d-md-none">
                            <button class="btn btn-success btn-sm new-game-btn" id="newGameMobile">
                                <i class="bi bi-plus-circle me-1"></i> <?php echo $translations['new_game']; ?>
                            </button>
                            <button class="btn btn-outline-dark btn-sm flip-board-btn" id="flipBoardMobile">
                                <i class="bi bi-arrow-repeat me-1"></i> <?php echo $translations['flip_board']; ?>
                            </button>
                        </div>

                        <!-- Contenu du menu - SECTION RAPIDE SEULEMENT -->
                        <div id="menuContent" class="d-md-block">
                            <!-- Section rapide - VISIBLE UNIQUEMENT SUR DESKTOP -->
                            <div class="d-grid gap-2 d-none d-md-block">
                                <button class="btn btn-success btn-sm new-game-btn" id="newGame">
                                    <i class="bi bi-plus-circle me-1"></i> <?php echo $translations['new_game']; ?>
                                </button>
                                <button class="btn btn-outline-dark btn-sm flip-board-btn" id="flipBoard">
                                    <i class="bi bi-arrow-repeat me-1"></i> <?php echo $translations['flip_board']; ?>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Colonne du milieu - Échiquier (légèrement réduite) -->
        <div class="col-xxl-8 col-xl-6 col-lg-6 col-md-8 col-12">
            <div class="chess-container bg-light rounded-3 p-2 h-100 position-relative">
                <!-- Label JOUEUR ORDINATEUR en haut à gauche - AVEC ID -->
                <div class="position-absolute top-0 start-0 m-2">
                    <span id="topPlayerLabel" class="badge bg-dark text-white p-2">
                        <i class="bi bi-cpu me-1"></i> <?php echo $translations['computer_player']; ?> <?php echo $translations['black_player']; ?>
                    </span>
                </div>
                
                <!-- Label MOI en bas à gauche - AVEC ID -->
                <div class="position-absolute bottom-0 start-0 m-2">
                    <span id="bottomPlayerLabel" class="badge bg-white text-dark border border-dark p-2">
                        <i class="bi bi-person me-1"></i> <?php echo $translations['human_player']; ?> <?php echo $translations['white_player']; ?>
                    </span>
                </div>
                
                <div class="chess-board-container mx-auto w-100 h-100 d-flex align-items-center justify-content-center">
                    <div id="chessBoard" class="chess-board">
                        <!-- Le board sera généré en JavaScript -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Colonne de droite - Informations de jeu (simplifiée) -->
        <div class="col-xxl-2 col-xl-3 col-lg-3 col-12">
            <div class="game-info-container h-100 d-flex flex-column">
                
                <!-- Statut de la partie -->
                <div class="card mb-3 flex-grow-0">
                    <div class="card-body p-2">
                        <div class="game-status text-center">
                            <!-- Statut dynamique du joueur actuel -->
                            <div class="small text-muted mb-2" id="currentPlayer"><?php echo $translations['traitAuBlancs']; ?></div>
                            
                            <div class="row text-center small g-1">
                                <div class="col-6">
                                    <div class="fw-bold"><?php echo $translations['white_time_label']; ?></div>
                                    <div id="whiteTime" class="text-primary">00:00</div>
                                </div>
                                <div class="col-6">
                                    <div class="fw-bold"><?php echo $translations['black_time_label']; ?></div>
                                    <div id="blackTime" class="text-primary">00:00</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Historique des coups -->
                <div class="card flex-grow-1">
                    <div class="card-header bg-warning text-dark py-2 d-flex justify-content-between align-items-center">
                        <h4 class="h6 mb-0">
                            <i class="bi bi-clock-history me-1"></i>
                            <?php echo $translations['moves_title']; ?>
                        </h4>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-dark text-white p-1 px-2" id="copyPGN" title="<?php echo $translations['copy_pgn_title']; ?>">
                                <?php echo $translations['copy_pgn']; ?>
                            </button>
                            <button class="btn btn-sm btn-secondary text-white p-1 px-2" id="copyFEN" title="<?php echo $translations['copy_fen_title']; ?>">
                                <?php echo $translations['copy_fen']; ?>
                            </button>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div id="moveHistory" class="move-history" style="max-height: 300px;">
                            <div class="text-center text-muted small p-3">
                                <?php echo $translations['no_moves_played']; ?>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</main>

    <!-- Footer -->
    <footer class="bg-dark py-3 mt-auto">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-6">
                    <div class="d-flex align-items-center gap-3">
                        <span class="text-white-50"><?php echo $translations['app_name']; ?> v<?php echo htmlspecialchars($config['version']); ?></span>
                        <div class="d-flex gap-2">
                            <i class="bi bi-phone text-white-50" id="mobileIcon" style="display: none;"></i>
                            <i class="bi bi-tablet text-white-50" id="tabletIcon" style="display: none;"></i>
                            <i class="bi bi-laptop text-white-50" id="desktopIcon"></i>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 text-md-end">
                    <small class="text-white-50">
                        <?php echo $translations['footer_dev']; ?> <?php echo htmlspecialchars($config['author']); ?>
                        <?php echo $translations['footer_and']; ?> <?php echo htmlspecialchars($config['author2']); ?> | 
                        <?php echo $translations['footer_copyright']; ?><?php echo date('Y'); ?>
                    </small>
                </div>
            </div>
        </div>
    </footer>