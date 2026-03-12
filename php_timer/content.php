<?php
require_once __DIR__ . '/config-loader.php';
$config = loadGameConfig();
?>
<main class="container-fluid py-3">
    <div class="row g-3">
        <div class="col-xxl-2 col-xl-3 col-lg-3 col-md-4 col-12">
            <div class="card shadow-sm border-0 h-100">
                <div class="card-body p-3">
                    <div class="d-grid gap-2">
                        <a href="index.php" class="btn btn-primary btn-sm"><i class="bi bi-house-door me-1"></i> Accueil</a>
                        <button type="button" class="btn btn-success btn-sm" id="newGame"><i class="bi bi-plus-circle me-1"></i> Nouveau</button>
                        <button type="button" class="btn btn-outline-success btn-sm" id="playAgain">Rejouer</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-xxl-8 col-xl-6 col-lg-6 col-md-8 col-12">
            <div class="chess-container bg-light rounded-3 p-2 h-100 position-relative shadow-sm border">
                <div id="chessBoard" class="chess-board"></div>
            </div>
        </div>

        <div class="col-xxl-2 col-xl-3 col-lg-3 col-12">
            <div class="game-info-container h-100 d-flex flex-column">
                <div class="card mb-3 shadow-sm border-primary">
                    <div id="currentPlayer" class="small fw-bold p-2 bg-light border-bottom text-center">TRAIT AUX BLANCS</div>
                    <div class="row g-0 text-center">
                        <div class="col-6 p-3 border-end">
                            <small class="text-muted d-block">BLANCS</small>
                            <div id="whiteTime" class="fw-bold fs-4 text-primary">01:00</div>
                        </div>
                        <div class="col-6 p-3">
                            <small class="text-muted d-block">NOIRS</small>
                            <div id="blackTime" class="fw-bold fs-4 text-primary">01:00</div>
                        </div>
                    </div>
                </div>
                <div class="card flex-grow-1 shadow-sm overflow-hidden">
                    <div class="card-header bg-warning py-2"><h6 class="mb-0">Historique</h6></div>
                    <div class="card-body p-0">
                        <div id="moveHistory" class="p-2" style="max-height: 400px; overflow-y: auto; font-family: monospace; font-size: 0.85rem;"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>

<script>
window.TimerLogic = {
    whiteRemaining: 60,
    blackRemaining: 60,
    bonus: 0,
    activeColor: 'white',
    timerId: null,
    hasStarted: false,

    init: function(config, level) {
        this.stop();
        const cfg = config['bot_' + level] || config['bot_1'];
        const toSec = (s) => { 
            const p = s.split(':'); 
            return (parseInt(p[0]) * 3600) + (parseInt(p[1]) * 60) + (parseInt(p[2]) || 0); 
        };
        this.whiteRemaining = toSec(cfg.clock);
        this.blackRemaining = toSec(cfg.clock);
        this.bonus = toSec(cfg.increment);
        this.activeColor = 'white';
        this.hasStarted = false;
        this.refresh();
    },

    tick: function() {
        if (!this.hasStarted) return;
        if (this.activeColor === 'white') {
            if (this.whiteRemaining > 0) this.whiteRemaining--;
        } else {
            if (this.blackRemaining > 0) this.blackRemaining--;
        }
        this.refresh();
    },

    switchTurn: function() {
        if (!this.hasStarted) {
            this.hasStarted = true;
            if (this.timerId) clearInterval(this.timerId);
            this.timerId = setInterval(() => this.tick(), 1000);
        } else {
            // Appliquer le bonus au joueur qui vient de jouer
            if (this.activeColor === 'white') this.whiteRemaining += this.bonus;
            else this.blackRemaining += this.bonus;
        }
        this.activeColor = (this.activeColor === 'white') ? 'black' : 'white';
        this.refresh();
    },

    stop: function() {
        clearInterval(this.timerId);
        this.timerId = null;
    },

    refresh: function() {
        const fmt = (s) => {
            const m = Math.floor(s / 60).toString().padStart(2, '0');
            const sec = (s % 60).toString().padStart(2, '0');
            return `${m}:${sec}`;
        };
        // Sécurité Anti-Flicker : on force le contenu
        const wEl = document.getElementById('whiteTime');
        const bEl = document.getElementById('blackTime');
        if (wEl) wEl.innerText = fmt(this.whiteRemaining);
        if (bEl) bEl.innerText = fmt(this.blackRemaining);
        
        // Indicateur visuel du tour
        if (wEl) wEl.style.opacity = (this.activeColor === 'white') ? "1" : "0.4";
        if (bEl) bEl.style.opacity = (this.activeColor === 'black') ? "1" : "0.4";
    }
};
</script>