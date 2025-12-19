<?php
// content.php - Layout avec menu à gauche
// Charger la configuration pour accéder aux traductions
require_once __DIR__ . '/config-loader.php';
$config = loadGameConfig();

// Récupérer la langue actuelle
$lang = $config['current_lang'];
$translations = $config['lang'][$lang];
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
                            <button class="btn btn-success btn-sm new-game-btn" id="newGameMobile" 
                                    title="<?php echo htmlspecialchars($translations['new_game']); ?>">
                                <i class="bi bi-plus-circle me-1"></i> <?php echo htmlspecialchars($translations['new_game']); ?>
                            </button>
                            <button class="btn btn-outline-dark btn-sm flip-board-btn" id="flipBoardMobile"
                                    title="<?php echo htmlspecialchars($translations['flip_board']); ?>">
                                <i class="bi bi-arrow-repeat me-1"></i> <?php echo htmlspecialchars($translations['flip_board']); ?>
                            </button>
                        </div>

                        <!-- Contenu du menu - SECTION RAPIDE SEULEMENT -->
                        <div id="menuContent" class="d-md-block">
                            <!-- Section rapide - VISIBLE UNIQUEMENT SUR DESKTOP -->
                            <div class="d-grid gap-2 d-none d-md-block">
                                <button class="btn btn-success btn-sm new-game-btn" id="newGame"
                                        title="<?php echo htmlspecialchars($translations['new_game']); ?>">
                                    <i class="bi bi-plus-circle me-1"></i> <?php echo htmlspecialchars($translations['new_game']); ?>
                                </button>
                                <button class="btn btn-outline-dark btn-sm flip-board-btn" id="flipBoard"
                                        title="<?php echo htmlspecialchars($translations['flip_board']); ?>">
                                    <i class="bi bi-arrow-repeat me-1"></i> <?php echo htmlspecialchars($translations['flip_board']); ?>
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
                        <i class="bi bi-cpu me-1"></i> 
                        <span class="player-name"><?php echo htmlspecialchars($translations['human_player']); ?></span> 
                        <span class="player-color"><?php echo htmlspecialchars($translations['black_player']); ?></span>
                    </span>
                </div>
                
                <!-- Label MOI en bas à gauche - AVEC ID -->
                <div class="position-absolute bottom-0 start-0 m-2">
                    <span id="bottomPlayerLabel" class="badge bg-white text-dark border border-dark p-2">
                        <i class="bi bi-person me-1"></i> 
                        <span class="player-name"><?php echo htmlspecialchars($translations['human_player']); ?></span> 
                        <span class="player-color"><?php echo htmlspecialchars($translations['white_player']); ?></span>
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
                            <div class="small text-muted mb-2" id="currentPlayer">
                                <?php echo htmlspecialchars($translations['traitAuBlancs']); ?>
                            </div>
                            
                            <div class="row text-center small g-1">
                                <div class="col-6">
                                    <div class="fw-bold"><?php echo htmlspecialchars($translations['white_time_label']); ?></div>
                                    <div id="whiteTime" class="text-primary">00:00</div>
                                </div>
                                <div class="col-6">
                                    <div class="fw-bold"><?php echo htmlspecialchars($translations['black_time_label']); ?></div>
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
                            <?php echo htmlspecialchars($translations['moves_title']); ?>
                        </h4>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-dark text-white p-1 px-2" id="copyPGN" 
                                    title="<?php echo htmlspecialchars($translations['copy_pgn_title']); ?>">
                                <?php echo htmlspecialchars($translations['copy_pgn']); ?>
                            </button>
                            <button class="btn btn-sm btn-secondary text-white p-1 px-2" id="copyFEN"
                                    title="<?php echo htmlspecialchars($translations['copy_fen_title']); ?>">
                                <?php echo htmlspecialchars($translations['copy_fen']); ?>
                            </button>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div id="moveHistory" class="move-history" style="max-height: 300px;">
                            <div class="text-center text-muted small p-3">
                                <?php echo htmlspecialchars($translations['no_moves_played']); ?>
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
                    <span class="text-white-50"><?php echo htmlspecialchars($translations['app_name']); ?> v<?php echo htmlspecialchars($config['version']); ?></span>
                    <div class="d-flex gap-2">
                        <i class="bi bi-phone text-white-50" id="mobileIcon" 
                           title="<?php echo htmlspecialchars($translations['mobile_icon']); ?>" 
                           style="display: none;"></i>
                        <i class="bi bi-tablet text-white-50" id="tabletIcon" 
                           title="<?php echo htmlspecialchars($translations['tablet_icon']); ?>"
                           style="display: none;"></i>
                        <i class="bi bi-laptop text-white-50" id="desktopIcon"
                           title="<?php echo htmlspecialchars($translations['desktop_icon']); ?>"></i>
                    </div>
                </div>
            </div>
            <div class="col-md-6 text-md-end">
                <small class="text-white-50">
                    <?php echo htmlspecialchars($translations['footer_dev']); ?> <?php echo htmlspecialchars($config['author']); ?>
                    <?php echo htmlspecialchars($translations['footer_and']); ?> <?php echo htmlspecialchars($config['author2']); ?> | 
                    <?php echo htmlspecialchars($translations['footer_copyright']); ?><?php echo date('Y'); ?>
                </small>
            </div>
        </div>
    </div>
</footer>

<!-- Script pour gérer la traduction dynamique -->
<script>
// Exposer les traductions à JavaScript
window.translations = <?php echo json_encode($translations, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE); ?>;

// Fonction pour obtenir une traduction
window.getTranslation = function(key, defaultValue = '') {
    return window.translations && window.translations[key] ? window.translations[key] : defaultValue;
};

// Fonction pour mettre à jour les labels des joueurs dynamiquement
window.updatePlayerLabels = function(isBotGame = false, botColor = null, botLevel = null) {
    const topPlayerLabel = document.getElementById('topPlayerLabel');
    const bottomPlayerLabel = document.getElementById('bottomPlayerLabel');
    
    if (!topPlayerLabel || !bottomPlayerLabel) return;
    
    // Par défaut: humain vs humain
    let topPlayerName = window.getTranslation('human_player', 'Human');
    let topPlayerColor = window.getTranslation('black_player', 'Black');
    let bottomPlayerName = window.getTranslation('human_player', 'Human');
    let bottomPlayerColor = window.getTranslation('white_player', 'White');
    
    // Si c'est une partie contre un bot
    if (isBotGame && botColor) {
        if (botColor === 'black') {
            // Bot en haut (noir), humain en bas (blanc)
            topPlayerName = window.getTranslation('computer_player', 'Bot');
            topPlayerColor = window.getTranslation('black_player', 'Black');
            bottomPlayerName = window.getTranslation('human_player', 'Human');
            bottomPlayerColor = window.getTranslation('white_player', 'White');
            
            // Ajouter le niveau du bot si disponible
            if (botLevel) {
                topPlayerName = window.getTranslation(botLevel === 1 ? 'bot_level1' : 'bot_level2', `Bot Level ${botLevel}`);
            }
        } else {
            // Bot en bas (blanc), humain en haut (noir)
            topPlayerName = window.getTranslation('human_player', 'Human');
            topPlayerColor = window.getTranslation('black_player', 'Black');
            bottomPlayerName = window.getTranslation('computer_player', 'Bot');
            bottomPlayerColor = window.getTranslation('white_player', 'White');
            
            // Ajouter le niveau du bot si disponible
            if (botLevel) {
                bottomPlayerName = window.getTranslation(botLevel === 1 ? 'bot_level1' : 'bot_level2', `Bot Level ${botLevel}`);
            }
        }
    }
    
    // Mettre à jour les labels
    topPlayerLabel.innerHTML = `<i class="bi ${isBotGame && botColor === 'black' ? 'bi-cpu' : 'bi-person'} me-1"></i> ${topPlayerName} ${topPlayerColor}`;
    bottomPlayerLabel.innerHTML = `<i class="bi ${isBotGame && botColor === 'white' ? 'bi-cpu' : 'bi-person'} me-1"></i> ${bottomPlayerName} ${bottomPlayerColor}`;
};

// Fonction pour mettre à jour le statut du tour
window.updateGameStatus = function(currentPlayer) {
    const currentPlayerElement = document.getElementById('currentPlayer');
    if (!currentPlayerElement) return;
    
    if (currentPlayer === 'white') {
        currentPlayerElement.textContent = window.getTranslation('traitAuBlancs', 'White to move');
    } else {
        currentPlayerElement.textContent = window.getTranslation('traitAuxNoirs', 'Black to move');
    }
};

// Fonction pour mettre à jour le temps
window.updateTimeDisplay = function(whiteTime, blackTime) {
    const whiteTimeElement = document.getElementById('whiteTime');
    const blackTimeElement = document.getElementById('blackTime');
    
    if (whiteTimeElement) whiteTimeElement.textContent = formatTime(whiteTime);
    if (blackTimeElement) blackTimeElement.textContent = formatTime(blackTime);
};

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌐 Langue chargée:', '<?php echo $lang; ?>');
    console.log('🌐 Traductions disponibles:', Object.keys(window.translations));
    
    // Mettre à jour les labels par défaut (humain vs humain)
    window.updatePlayerLabels();
    

});

// Fonction pour changer de langue
window.changeLanguage = function(langCode) {
    // Rediriger avec le nouveau paramètre de langue
    const url = new URL(window.location.href);
    url.searchParams.set('lang', langCode);
    window.location.href = url.toString();
};
</script>