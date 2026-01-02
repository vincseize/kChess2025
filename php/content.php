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
                    <?php echo htmlspecialchars($translations['footer_dev']); ?> 
                    <?php echo htmlspecialchars($config['author']); ?>
                    <?php echo htmlspecialchars($translations['footer_and']); ?> 
                    <?php echo htmlspecialchars($config['author2']); ?> 
                    
                    <span class="mx-1">|</span>
                    
                    <?php echo $translations['footer_copyright']; ?><?php echo date('Y'); ?>
                </small>
            </div>
        </div>
    </div>
</footer>

<script>
// 1. Exposer les traductions à JavaScript
window.translations = <?php echo json_encode($translations, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE); ?>;

// 2. Fonction pour obtenir une traduction
window.getTranslation = function(key, defaultValue = '') {
    return window.translations && window.translations[key] ? window.translations[key] : defaultValue;
};

// 3. Fonction pour mettre à jour les labels des joueurs dynamiquement
window.updatePlayerLabels = function(isBotGame = false, botColor = null, botLevel = null) {
    const topPlayerLabel = document.getElementById('topPlayerLabel');
    const bottomPlayerLabel = document.getElementById('bottomPlayerLabel');
    
    if (!topPlayerLabel || !bottomPlayerLabel) return;
    
    // Conversion forcée en nombre pour le test (car l'URL donne une String)
    const levelNum = botLevel !== null ? Number(botLevel) : null;
    
    // Valeurs par défaut (Humain vs Humain)
    let topName = window.getTranslation('human_player', 'Humain');
    let topColorLabel = window.getTranslation('black_player', 'Noirs');
    let bottomName = window.getTranslation('human_player', 'Humain');
    let bottomColorLabel = window.getTranslation('white_player', 'Blancs');
    
    if (isBotGame && botColor) {
        // Déterminer le texte du Bot selon le niveau
        let botText = window.getTranslation('computer_player', 'Bot');
        if (levelNum === 1) {
            botText = window.getTranslation('bot_level1', 'Niveau 1');
        } else if (levelNum === 2) {
            botText = window.getTranslation('bot_level2', 'Niveau 2');
        }

        if (botColor === 'black') {
            topName = botText;
            topColorLabel = window.getTranslation('black_player', 'Noirs');
            bottomName = window.getTranslation('human_player', 'Humain');
            bottomColorLabel = window.getTranslation('white_player', 'Blancs');
        } else {
            topName = window.getTranslation('human_player', 'Humain');
            topColorLabel = window.getTranslation('black_player', 'Noirs');
            bottomName = botText;
            bottomColorLabel = window.getTranslation('white_player', 'Blancs');
        }
    }
    
    // Rendu HTML
    topPlayerLabel.innerHTML = `<i class="bi ${isBotGame && botColor === 'black' ? 'bi-cpu' : 'bi-person'} me-1"></i> ${topName} (${topColorLabel})`;
    bottomPlayerLabel.innerHTML = `<i class="bi ${isBotGame && botColor === 'white' ? 'bi-cpu' : 'bi-person'} me-1"></i> ${bottomName} (${bottomColorLabel})`;
};

// 4. Fonction pour mettre à jour le statut du tour
window.updateGameStatus = function(currentPlayer) {
    const currentPlayerElement = document.getElementById('currentPlayer');
    if (!currentPlayerElement) return;
    
    const key = (currentPlayer === 'white') ? 'traitAuBlancs' : 'traitAuxNoirs';
    const def = (currentPlayer === 'white') ? 'Trait aux Blancs' : 'Trait aux Noirs';
    currentPlayerElement.textContent = window.getTranslation(key, def);
};

// 5. Fonction pour mettre à jour le temps
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

// 6. INITIALISATION ET SURVEILLANCE
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌐 Langue chargée:', '<?php echo $lang; ?>');

    // Récupérer les paramètres de l'URL pour un affichage immédiat
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const level = params.get('level');
    const color = params.get('color');

    // Mettre à jour immédiatement l'UI selon l'URL
    if (mode === 'bot') {
        const botColor = (color === 'white') ? 'black' : 'white';
        window.updatePlayerLabels(true, botColor, level);
    } else {
        window.updatePlayerLabels(false);
    }

    // SURVEILLANCE : Synchronisation avec le moteur ChessGame quand il est prêt
    const engineCheck = setInterval(() => {
        if (window.chessGame && typeof window.chessGame.getBotStatus === 'function') {
            const status = window.chessGame.getBotStatus();
            if (status.active) {
                window.updatePlayerLabels(true, status.color, status.level);
            }
            clearInterval(engineCheck);
        }
    }, 200);

    // Arrêter la recherche après 5 secondes
    setTimeout(() => clearInterval(engineCheck), 5000);
});

// 7. Fonction pour changer de langue
window.changeLanguage = function(langCode) {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', langCode);
    window.location.href = url.toString();
};
</script>