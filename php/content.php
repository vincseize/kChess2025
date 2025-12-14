<?php
// content.php - Layout avec menu à gauche
// Inclure config-loader pour accéder aux traductions
require_once __DIR__ . '/config-loader.php';

// Charger la configuration
$config = loadGameConfig();
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
                        <i class="bi bi-cpu me-1"></i> <span class="player-name"><?php echo htmlspecialchars($translations['human_player']); ?></span> <span class="player-color"><?php echo htmlspecialchars($translations['black_player']); ?></span>
                    </span>
                </div>
                
                <!-- Label MOI en bas à gauche - AVEC ID -->
                <div class="position-absolute bottom-0 start-0 m-2">
                    <span id="bottomPlayerLabel" class="badge bg-white text-dark border border-dark p-2">
                        <i class="bi bi-person me-1"></i> <span class="player-name"><?php echo htmlspecialchars($translations['human_player']); ?></span> <span class="player-color"><?php echo htmlspecialchars($translations['white_player']); ?></span>
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
                            <div class="small text-muted mb-2" id="currentPlayer"><?php echo htmlspecialchars($translations['traitAuBlancs']); ?></div>
                            
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

<!-- Script pour gérer la traduction dynamique en JavaScript -->
<script>
// Exposer les traductions à JavaScript
window.translations = <?php echo json_encode($translations, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE); ?>;

// Fonction pour obtenir une traduction
window.getTranslation = function(key, defaultValue = '') {
    return window.translations && window.translations[key] ? window.translations[key] : defaultValue;
};

// Fonction pour mettre à jour tous les textes traduisibles
window.updateAllTranslations = function() {
    // Mettre à jour les boutons
    const updateElement = (selector, text, attribute = 'textContent') => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (el[attribute] !== undefined) {
                el[attribute] = text;
            }
        });
    };
    
    // Mettre à jour les boutons desktop
    const newGameBtn = document.getElementById('newGame');
    const flipBoardBtn = document.getElementById('flipBoard');
    const copyPGNBtn = document.getElementById('copyPGN');
    const copyFENBtn = document.getElementById('copyFEN');
    
    if (newGameBtn) {
        newGameBtn.innerHTML = `<i class="bi bi-plus-circle me-1"></i> ${window.getTranslation('new_game', 'New Game')}`;
        newGameBtn.title = window.getTranslation('new_game', 'New Game');
    }
    
    if (flipBoardBtn) {
        flipBoardBtn.innerHTML = `<i class="bi bi-arrow-repeat me-1"></i> ${window.getTranslation('flip_board', 'Flip')}`;
        flipBoardBtn.title = window.getTranslation('flip_board', 'Flip');
    }
    
    if (copyPGNBtn) {
        copyPGNBtn.textContent = window.getTranslation('copy_pgn', 'PGN');
        copyPGNBtn.title = window.getTranslation('copy_pgn_title', 'Copy PGN');
    }
    
    if (copyFENBtn) {
        copyFENBtn.textContent = window.getTranslation('copy_fen', 'FEN');
        copyFENBtn.title = window.getTranslation('copy_fen_title', 'Copy FEN');
    }
    
    // Mettre à jour les boutons mobile
    const newGameMobileBtn = document.getElementById('newGameMobile');
    const flipBoardMobileBtn = document.getElementById('flipBoardMobile');
    
    if (newGameMobileBtn) {
        newGameMobileBtn.innerHTML = `<i class="bi bi-plus-circle me-1"></i> ${window.getTranslation('new_game', 'New Game')}`;
        newGameMobileBtn.title = window.getTranslation('new_game', 'New Game');
    }
    
    if (flipBoardMobileBtn) {
        flipBoardMobileBtn.innerHTML = `<i class="bi bi-arrow-repeat me-1"></i> ${window.getTranslation('flip_board', 'Flip')}`;
        flipBoardMobileBtn.title = window.getTranslation('flip_board', 'Flip');
    }
    
    // Mettre à jour les labels du temps
    const whiteTimeLabel = document.querySelector('.fw-bold:nth-child(1)');
    const blackTimeLabel = document.querySelector('.fw-bold:nth-child(2)');
    
    if (whiteTimeLabel) {
        whiteTimeLabel.textContent = window.getTranslation('white_time_label', 'White Time');
    }
    
    if (blackTimeLabel) {
        blackTimeLabel.textContent = window.getTranslation('black_time_label', 'Black Time');
    }
    
    // Mettre à jour le titre de l'historique
    const movesTitle = document.querySelector('.card-header h4');
    if (movesTitle) {
        movesTitle.innerHTML = `<i class="bi bi-clock-history me-1"></i> ${window.getTranslation('moves_title', 'Moves')}`;
    }
    
    // Mettre à jour le message d'historique vide
    const noMovesMsg = document.querySelector('#moveHistory .text-center');
    if (noMovesMsg && noMovesMsg.textContent.includes('Aucun coup') || noMovesMsg.textContent.includes('No moves')) {
        noMovesMsg.textContent = window.getTranslation('no_moves_played', 'No moves played');
    }
    
    // Mettre à jour le footer
    const footerAppName = document.querySelector('footer .text-white-50:first-child');
    if (footerAppName) {
        const version = footerAppName.textContent.match(/v\d+\.\d+/)[0] || 'v0.95';
        footerAppName.textContent = `${window.getTranslation('app_name', 'CharlyChess')} ${version}`;
    }
    
    const footerDev = document.querySelector('footer small');
    if (footerDev) {
        const author = "<?php echo $config['author']; ?>";
        const author2 = "<?php echo $config['author2']; ?>";
        const year = new Date().getFullYear();
        footerDev.innerHTML = `
            ${window.getTranslation('footer_dev', 'Dev.')} ${author}
            ${window.getTranslation('footer_and', 'and')} ${author2} | 
            ${window.getTranslation('footer_copyright', '&copy; LRDS 2024-')}${year}
        `;
    }
    
    // Mettre à jour les tooltips des icônes de dispositif
    const mobileIcon = document.getElementById('mobileIcon');
    const tabletIcon = document.getElementById('tabletIcon');
    const desktopIcon = document.getElementById('desktopIcon');
    
    if (mobileIcon) {
        mobileIcon.title = window.getTranslation('mobile_icon', 'Phone');
    }
    if (tabletIcon) {
        tabletIcon.title = window.getTranslation('tablet_icon', 'Tablet');
    }
    if (desktopIcon) {
        desktopIcon.title = window.getTranslation('desktop_icon', 'Desktop');
    }
    
    // Mettre à jour le statut du joueur si nécessaire
    const currentPlayerElement = document.getElementById('currentPlayer');
    if (currentPlayerElement) {
        const currentText = currentPlayerElement.textContent;
        if (currentText.includes('blancs') || currentText.includes('White')) {
            currentPlayerElement.textContent = window.getTranslation('traitAuBlancs', 'White to move');
        } else if (currentText.includes('noirs') || currentText.includes('Black')) {
            currentPlayerElement.textContent = window.getTranslation('traitAuxNoirs', 'Black to move');
        }
    }
    
    console.log('✅ Traductions mises à jour');
};

// Exécuter la mise à jour des traductions au chargement
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.updateAllTranslations();
    }, 100);
});
</script>