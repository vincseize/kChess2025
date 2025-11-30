<?php
// index.php - Page d'accueil avec sélection du mode de jeu

function isMobileDevice() {
    $userAgent = $_SERVER['HTTP_USER_AGENT'];
    $mobileKeywords = [
        'Android', 'webOS', 'iPhone', 'iPad', 'iPod', 'BlackBerry', 
        'IEMobile', 'Opera Mini', 'Mobile'
    ];
    
    foreach ($mobileKeywords as $keyword) {
        if (stripos($userAgent, $keyword) !== false) {
            return true;
        }
    }
    return false;
}

$isMobile = isMobileDevice();
$version = '1.0';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CharlyChess - Nouvelle Partie</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <link rel="stylesheet" href="css/common-chess.css">
    <link rel="stylesheet" href="css/newGame-index.css?version=<?php echo $version; ?>">
</head>
<body>
    <div class="game-layout">

        <header>
            CharlyChess
        </header>

        <div class="main-content">
            <!-- Contenu de sélection de nouvelle partie -->
            <div class="new-game-container">
                <div class="new-game-content">
                    <!-- <h1 class="new-game-title">Nouvelle Partie</h1> -->

                    <!-- Sélection du mode de jeu -->
                    <div class="new-game-section">
                        <!-- <h2 class="section-title">Mode de Jeu</h2> -->
                        <div class="new-game-buttons">
                            <button class="game-mode-btn btn-human" data-mode="human" data-level="false" data-profondeur="false">
                                <div class="mode-description">
                                    <div class="mode-header">
                                        <i class="bi bi-people-fill mode-icon"></i>
                                        <span>Humain vs Humain</span>
                                    </div>
                                </div>
                                <i class="bi bi-check-lg"></i>
                            </button>

                            <button class="game-mode-btn btn-level-0" data-mode="bot" data-level="0" data-profondeur="0">
                                <div class="mode-description">
                                    <div class="mode-header">
                                        <i class="bi bi-cpu mode-icon"></i>
                                        <span>Niveau 0 - Aléatoire</span>
                                    </div>
                                    <div class="mode-details">
                                        <div class="mode-difficulty">Bot : Coups aléatoires</div>
                                        <div class="mode-difficulty">Profondeur 0</div>
                                    </div>
                                </div>
                                <i class="bi bi-check-lg"></i>
                            </button>

                            <button class="game-mode-btn btn-level-1" data-mode="bot" data-level="1" data-profondeur="0">
                                <div class="mode-description">
                                    <div class="mode-header">
                                        <i class="bi bi-robot mode-icon"></i>
                                        <span>Niveau 1 - CCMO</span>
                                    </div>
                                    <div class="mode-details">
                                        <div class="mode-difficulty">Bot : Check, Captures, Menaces, Optimisation</div>
                                        <div class="mode-difficulty">Profondeur 0</div>
                                    </div>
                                </div>
                                <i class="bi bi-check-lg"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Sélection de la couleur -->
                    <div class="new-game-section">
                        <!-- <h2 class="section-title">Couleur</h2> -->
                        <div class="color-selection">
                            <div class="color-options">
                                <div class="color-option selected" data-color="white">
                                    <div class="color-piece">
                                        <i class="fas fa-chess-queen" style="color: white; text-shadow: 1px 1px 2px black;"></i>
                                    </div>
                                    <div class="color-label">Blancs</div>
                                </div>
                                <div class="color-option" data-color="black">
                                    <div class="color-piece">
                                        <i class="fas fa-chess-queen" style="color: black;"></i>
                                    </div>
                                    <div class="color-label">Noirs</div>
                                </div>
                                <div class="color-option random" data-color="random">
                                    <div class="color-piece">
                                        <i class="bi bi-shuffle random-icon"></i>
                                    </div>
                                    <div class="color-label">Aléatoire</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Bouton de validation -->
                    <div class="start-game-section">
                        <button class="start-game-btn" id="startGameBtn">
                            <i class="fas fa-play-circle me-2"></i>Démarrer la Partie
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <footer class="main-footer">
            <div class="footer-content">
                <div class="footer-info">
                    CharlyChess © 2024 - Jeu d'échecs en ligne
                </div>
            </div>
        </footer>

    </div>

    <script>
        let selectedMode = 'human';
        let selectedLevel = 'false';
        let selectedProfondeur = 'false';
        let selectedColor = 'white';

        // Déterminer la page cible
        const isMobile = <?php echo $isMobile ? 'true' : 'false'; ?>;
        const targetPage = isMobile ? 'templates/templateChess-mobile.php' : 'templates/templateChess-desktop.php';

        // Gestion de la sélection du mode
        document.querySelectorAll('.game-mode-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                // Retirer la sélection précédente
                document.querySelectorAll('.game-mode-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                
                // Sélectionner le nouveau mode
                this.classList.add('selected');
                selectedMode = this.dataset.mode;
                selectedLevel = this.dataset.level;
                selectedProfondeur = this.dataset.profondeur;
                
                console.log('Mode sélectionné:', {
                    mode: selectedMode,
                    level: selectedLevel,
                    profondeur: selectedProfondeur
                });
            });
        });

        // Gestion de la sélection de la couleur
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.color-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                selectedColor = this.dataset.color;
                
                console.log('Couleur sélectionnée:', selectedColor);
            });
        });

        // Gestion du bouton de démarrage
        document.getElementById('startGameBtn').addEventListener('click', function() {
            let url = targetPage;
            
            // Gérer la couleur aléatoire
            let finalColor = selectedColor;
            if (selectedColor === 'random') {
                finalColor = Math.random() > 0.5 ? 'white' : 'black';
                console.log(`🎲 Couleur aléatoire: ${finalColor}`);
            }
            
            // Construire l'URL avec tous les paramètres harmonisés
            const params = new URLSearchParams({
                mode: selectedMode,
                level: selectedLevel,
                profondeur: selectedProfondeur,
                color: finalColor
            });
            
            url += '?' + params.toString();
            
            console.log('🚀 Démarrage de la partie:', { 
                mode: selectedMode,
                level: selectedLevel,
                profondeur: selectedProfondeur,
                originalColor: selectedColor,
                finalColor: finalColor,
                url: url,
                device: isMobile ? 'mobile' : 'desktop'
            });
            
            window.location.href = url;
        });

        // Animation au chargement
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Device détecté:', isMobile ? 'Mobile' : 'Desktop');
            
            // Assurer que le contenu est visible sur mobile
            setTimeout(() => {
                document.querySelector('.new-game-content').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 100);
        });
    </script>
</body>
</html>