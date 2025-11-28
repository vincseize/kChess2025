<?php
// footer.php
?>
<!-- footer.php -->

<!-- Scripts CORE -->
<script src="js/kchess/core/pieces.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/game-state.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/chess-board.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/fen-generator.js?version=<?php echo $version; ?>"></script>

<!-- Check Chess - BASE -->
<script src="js/kchess/check/checkChess.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/check/checkFenPostion.js?version=<?php echo $version; ?>"></script>

<!-- Validateurs de mouvements -->
<script src="js/kchess/validators/move-validator-pawn.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-validator-knight.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-validator-bishop.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-validator-rook.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-validator-queen.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-validator-king.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-validator-sliding.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-validator.js?version=<?php echo $version; ?>"></script>

<!-- BOTS -->
<script src="js/kchess/bots/Level_0.js?version=<?php echo $version; ?>"></script>

<!-- Check Chess Mat - AVANCÉ -->
<script src="js/kchess/check/checkChessMat.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/check/checkChessPat.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/check/checkChessNulle.js?version=<?php echo $version; ?>"></script>

<!-- Game Core - ARCHITECTURE MODULAIRE -->
<script src="js/kchess/core/bot-manager.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/game-status-manager.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/move-logic.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/chess-game-core.js?version=<?php echo $version; ?>"></script>

<!-- Game Handlers -->
<script src="js/kchess/validators/promotion-manager.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/chess-game-move-handler.js?version=<?php echo $version; ?>"></script>

<!-- Classe principale -->
<script src="js/kchess/core/chess-game.js?version=<?php echo $version; ?>"></script>

<!-- UI -->
<script src="js/kchess/ui/chess-game-ui.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/ui/chess-events.js?version=<?php echo $version; ?>"></script>

<!-- Interface de test bot (développement seulement) -->
<?php if ($_SERVER['HTTP_HOST'] === 'localhost' || $_SERVER['HTTP_HOST'] === '127.0.0.1'): ?>
<script src="js/kchess/bots/bot-test-interface.js?version=<?php echo $version; ?>"></script>
<?php endif; ?>

</body>
</html>