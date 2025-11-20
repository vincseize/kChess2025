<?php
// content.php - Layout avec menu à gauche
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
                                <i class="bi bi-plus-circle me-1"></i> Nouvelle Partie
                            </button>
                            <button class="btn btn-outline-dark btn-sm flip-board-btn" id="flipBoardMobile">
                                <i class="bi bi-arrow-repeat me-1"></i> Tourner
                            </button>
                        </div>

                        <!-- Contenu du menu - SECTION RAPIDE SEULEMENT -->
                        <div id="menuContent" class="d-md-block">
                            <!-- Section rapide - VISIBLE UNIQUEMENT SUR DESKTOP -->
                            <div class="small text-muted mb-2 d-none d-md-block">Actions rapides</div>
                            <div class="d-grid gap-2 d-none d-md-block">
                                <button class="btn btn-success btn-sm new-game-btn" id="newGame">
                                    <i class="bi bi-plus-circle me-1"></i> Nouvelle Partie
                                </button>
                                <button class="btn btn-outline-dark btn-sm flip-board-btn" id="flipBoard">
                                    <i class="bi bi-arrow-repeat me-1"></i> Tourner
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
                <!-- Label JOUEUR ORDINATEUR en haut à gauche -->
                <div class="position-absolute top-0 start-0 m-2">
                    <span class="badge bg-dark text-white p-2">
                        <i class="bi bi-cpu me-1"></i> JOUEUR ORDINATEUR
                    </span>
                </div>
                
                <!-- Label MOI en bas à gauche -->
                <div class="position-absolute bottom-0 start-0 m-2">
                    <span class="badge bg-primary text-white p-2">
                        <i class="bi bi-person me-1"></i> MOI
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
                    <div class="card-header bg-info text-white py-2">
                        <h4 class="h6 mb-0 text-center">
                            <i class="bi bi-info-circle me-1"></i>
                            Statut
                        </h4>
                    </div>
                    <div class="card-body p-2">
                        <div class="game-status text-center">
                            <!-- <div class="h6 text-success mb-1" id="gameStatus">En cours</div> -->
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
                <div class="card flex-grow-1">
                    <div class="card-header bg-warning text-dark py-2 d-flex justify-content-between align-items-center">
                        <h4 class="h6 mb-0">
                            <i class="bi bi-clock-history me-1"></i>
                            Coups
                        </h4>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-dark text-white p-1 px-2" id="copyPGN" title="Copier le PGN">
                                PGN
                            </button>
                            <button class="btn btn-sm btn-secondary text-white p-1 px-2" id="copyFEN" title="Copier le FEN">
                                FEN
                            </button>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div id="moveHistory" class="move-history" style="max-height: 300px;">
                            <div class="text-center text-muted small p-3">
                                Aucun coup joué
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</main>