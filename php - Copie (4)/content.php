<?php
// content.php - Layout optimisé pour l'échiquier
?>

<main class="container-fluid py-3">
    <div class="row g-3">
        <!-- Colonne de gauche - Échiquier (beaucoup plus large) -->
        <div class="col-xxl-9 col-xl-8 col-lg-8 col-md-7 col-12">
            <div class="chess-container bg-light rounded-3 p-2 shadow h-100">
                <!-- Échiquier au centre, contrôles déplacés -->
                <div class="chess-board-container mx-auto w-100 h-100 d-flex align-items-center justify-content-center">
                    <div id="chessBoard" class="chess-board">
                        <!-- Le board sera généré en JavaScript -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Colonne de droite - Informations de jeu (plus compacte) -->
        <div class="col-xxl-3 col-xl-4 col-lg-4 col-md-5 col-12">
            <!-- Contrôles déplacés ici -->
            <div class="card mb-3">
                <div class="card-header bg-primary text-white py-2">
                    <h4 class="h6 mb-0 text-center">
                        <i class="bi bi-joystick me-1"></i>
                        Contrôles
                    </h4>
                </div>
                <div class="card-body p-2">
                    <div class="d-grid gap-2">
                        <button class="btn btn-success btn-sm" id="newGame">
                            <i class="bi bi-plus-circle me-1"></i> Nouvelle Partie
                        </button>
                        <button class="btn btn-outline-dark btn-sm" id="flipBoard">
                            <i class="bi bi-arrow-repeat me-1"></i> Tourner l'échiquier
                        </button>
                    </div>
                </div>
            </div>

            <!-- Le reste des informations (gardé tel quel mais plus compact) -->
            <div class="game-info-container h-100 d-flex flex-column">
                
                <!-- Statut de la partie -->
                <div class="card mb-2 flex-grow-0">
                    <div class="card-header bg-info text-white py-2">
                        <h4 class="h6 mb-0 text-center">
                            <i class="bi bi-info-circle me-1"></i>
                            Statut
                        </h4>
                    </div>
                    <div class="card-body p-2">
                        <div class="game-status text-center">
                            <div class="h6 text-success mb-1" id="gameStatus">En cours</div>
                            <div class="small text-muted mb-2" id="currentPlayer">Aux blancs de jouer</div>
                            
                            <div class="row text-center small g-1">
                                <div class="col-6">
                                    <div class="fw-bold">Coups</div>
                                    <div id="moveCount" class="text-primary">0</div>
                                </div>
                                <div class="col-6">
                                    <div class="fw-bold">Temps</div>
                                    <div id="gameTime" class="text-primary">00:00</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Historique des coups -->
                <div class="card flex-grow-1 mb-2">
                    <div class="card-header bg-warning text-dark py-2 d-flex justify-content-between align-items-center">
                        <h4 class="h6 mb-0">
                            <i class="bi bi-clock-history me-1"></i>
                            Coups
                        </h4>
                        <button class="btn btn-sm btn-outline-secondary p-1" id="clearHistory" title="Effacer l'historique">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                    <div class="card-body p-0">
                        <div id="moveHistory" class="move-history" style="max-height: 200px;">
                            <div class="text-center text-muted small p-2">
                                Aucun coup joué
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Informations des joueurs -->
                <div class="card flex-grow-0">
                    <div class="card-header bg-dark text-white py-2">
                        <h4 class="h6 mb-0 text-center">
                            <i class="bi bi-people me-1"></i>
                            Joueurs
                        </h4>
                    </div>
                    <div class="card-body p-2">
                        <div class="player-info mb-2">
                            <div class="d-flex align-items-center justify-content-between mb-1">
                                <span class="small fw-bold">
                                    <i class="bi bi-circle-fill text-success me-1"></i>
                                    Blanc
                                </span>
                                <span class="badge bg-light text-dark small">Vous</span>
                            </div>
                            <div class="progress" style="height: 4px;">
                                <div class="progress-bar bg-success" style="width: 50%"></div>
                            </div>
                        </div>
                        <div class="player-info">
                            <div class="d-flex align-items-center justify-content-between mb-1">
                                <span class="small fw-bold">
                                    <i class="bi bi-circle-fill text-dark me-1"></i>
                                    Noir
                                </span>
                                <span class="badge bg-secondary small">Adversaire</span>
                            </div>
                            <div class="progress" style="height: 4px;">
                                <div class="progress-bar bg-dark" style="width: 50%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>