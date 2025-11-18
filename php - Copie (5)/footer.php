<?php
// footer.php
?>
    <!-- Footer -->
    <footer class="bg-dark text-white py-3 mt-auto">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-6">
                    <div class="d-flex align-items-center gap-3">
                        <span><?php echo htmlspecialchars($config['app_name']); ?> v<?php echo htmlspecialchars($config['version']); ?></span>
                        <div class="d-flex gap-2">
                            <i class="bi bi-phone" id="mobileIcon" style="display: none;"></i>
                            <i class="bi bi-tablet" id="tabletIcon" style="display: none;"></i>
                            <i class="bi bi-laptop" id="desktopIcon"></i>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 text-md-end">
                    <small>
                        Développé par <?php echo htmlspecialchars($config['author']); ?> | 
                        Version <?php echo htmlspecialchars($config['version']); ?> | 
                        Copyright LRDS 2024-<?php echo date('Y'); ?>
                    </small>
                </div>
            </div>
        </div>
    </footer>

    <!-- Scripts -->
<!-- <script src="js/kchess/pieces.js"></script>
<script src="js/kchess/game-state.js"></script>
<script src="js/kchess/move-validator.js"></script>
<script src="js/kchess/chess-board.js"></script>
<script src="js/kchess/chess-game.js"></script>
<script src="js/kchess/chess-events.js"></script> -->


<!-- Scripts -->
<script src="js/kchess/pieces.js"></script>
<script src="js/kchess/game-state.js"></script>
<script src="js/kchess/move-validator.js"></script>
<script src="js/kchess/chess-board.js"></script>

<!-- Nouveaux fichiers splités -->
<script src="js/kchess/chess-game-core.js"></script>
<script src="js/kchess/chess-game-move-handler.js"></script>
<script src="js/kchess/chess-game-ui.js"></script>

<script src="js/kchess/chess-events.js"></script>

</body>
</html>