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
<script src="js/kchess/pieces.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/game-state.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/chess-board.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/fen-generator.js?version=<?php echo $version; ?>"></script>

<!-- Check Chess - BASE -->
<script src="js/kchess/checkChess.js?version=<?php echo $version; ?>"></script>

<!-- Check Chess Mat - AVANCÉ (hérite de checkChess) -->
<script src="js/kchess/checkChessMat.js?version=<?php echo $version; ?>"></script>

<!-- Validateurs de mouvements -->
<script src="js/kchess/move-validator-pawn.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/move-validator-knight.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/move-validator-bishop.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/move-validator-rook.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/move-validator-queen.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/move-validator-king.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/move-validator.js?version=<?php echo $version; ?>"></script>

<!-- Game Core -->
<script src="js/kchess/promotion-manager.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/chess-game-core.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/chess-game-move-handler.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/chess-game-ui.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/chess-events.js?version=<?php echo $version; ?>"></script>

<script>

console.clear();

</script>

</body>
</html>