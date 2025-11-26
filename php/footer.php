<?php
// footer.php
?>


<!-- Scripts -->
<script src="js/kchess/pieces.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/game-state.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/chess-board.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/checkFenPostion.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/fen-generator.js?version=<?php echo $version; ?>"></script>

<!-- Check Chess - BASE -->
<script src="js/kchess/checkChess.js?version=<?php echo $version; ?>"></script>

<!-- Check Chess Mat - AVANCÉ (hérite de checkChess) -->
<script src="js/kchess/checkChessMat.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/checkChessPat.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/checkChessNulle.js?version=<?php echo $version; ?>"></script>

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