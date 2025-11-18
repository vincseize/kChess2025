<?php
// footer.php
?>
    <!-- Footer -->
    <footer class="bg-dark py-3 mt-auto">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-6">
                    <div class="d-flex align-items-center gap-3">
                        <span class="text-white-50"><?php echo htmlspecialchars($config['app_name']); ?> v<?php echo htmlspecialchars($config['version']); ?></span>
                        <div class="d-flex gap-2">
                            <i class="bi bi-phone text-white-50" id="mobileIcon" style="display: none;"></i>
                            <i class="bi bi-tablet text-white-50" id="tabletIcon" style="display: none;"></i>
                            <i class="bi bi-laptop text-white-50" id="desktopIcon"></i>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 text-md-end">
                    <small class="text-white-50">
                        Dev. <?php echo htmlspecialchars($config['author']); ?>
                        <?php echo htmlspecialchars($config['author2']); ?> | 
                        &copy; LRDS 2024-<?php echo date('Y'); ?>
                    </small>
                </div>
            </div>
        </div>
    </footer>

<!-- Scripts -->
<!-- <script src="js/kchess/pieces.js"></script>
<script src="js/kchess/game-state.js"></script>
<script src="js/kchess/chess-board.js"></script>
<script src="js/kchess/move-validator.js"></script>
<script src="js/kchess/promotion-manager.js"></script> -->

<!-- Game Core -->
<!-- <script src="js/kchess/chess-game-core.js"></script>
<script src="js/kchess/chess-game-move-handler.js"></script>
<script src="js/kchess/chess-game-ui.js"></script>

<script src="js/kchess/chess-events.js"></script> -->

<!-- Scripts -->
<script src="js/kchess/pieces.js"></script>
<script src="js/kchess/game-state.js"></script>
<script src="js/kchess/chess-board.js"></script>

<!-- Validateurs de mouvements (splités) -->
<script src="js/kchess/move-validator-pawn.js"></script>
<script src="js/kchess/move-validator-knight.js"></script>
<script src="js/kchess/move-validator-bishop.js"></script>
<script src="js/kchess/move-validator-rook.js"></script>
<script src="js/kchess/move-validator-queen.js"></script>
<script src="js/kchess/move-validator-king.js"></script>
<script src="js/kchess/move-validator.js"></script> <!-- Doit être chargé en dernier -->

<!-- Game Core -->
<script src="js/kchess/promotion-manager.js"></script>
<script src="js/kchess/chess-game-core.js"></script>
<script src="js/kchess/chess-game-move-handler.js"></script>
<script src="js/kchess/chess-game-ui.js"></script>
<script src="js/kchess/chess-events.js"></script>


</body>
</html>