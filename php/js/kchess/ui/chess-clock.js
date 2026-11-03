(() => {
    const presetButtons = [...document.querySelectorAll('.clock-preset')];
    const clockButtons = [...document.querySelectorAll('.clock-player')];
    const status = document.getElementById('clockStatus');
    const startPauseButton = document.getElementById('startPause');
    const resetButton = document.getElementById('resetClock');

    let initialTime = 600;
    let increment = 0;
    let times = { white: initialTime, black: initialTime };
    let activePlayer = 'white';
    let running = false;
    let intervalId = null;
    let lastTick = 0;

    const timeElements = {
        white: document.getElementById('whiteTime'),
        black: document.getElementById('blackTime')
    };

    function formatTime(totalSeconds) {
        const seconds = Math.max(0, Math.ceil(totalSeconds));
        return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }

    function updateDisplay() {
        for (const player of ['white', 'black']) {
            timeElements[player].textContent = formatTime(times[player]);
            const button = document.querySelector(`[data-player="${player}"]`);
            button.classList.toggle('active', player === activePlayer && running);
            button.classList.toggle('expired', times[player] <= 0);
            button.disabled = !running || player !== activePlayer;
        }

        startPauseButton.querySelector('span').textContent = running ? 'Pause' : 'Démarrer';
        startPauseButton.querySelector('i').className = running ? 'bi bi-pause-fill' : 'bi bi-play-fill';
        presetButtons.forEach(button => button.disabled = running);
        resetButton.disabled = false;
    }

    function stopAtFlag() {
        running = false;
        clearInterval(intervalId);
        intervalId = null;
        status.textContent = `${activePlayer === 'white' ? 'Blancs' : 'Noirs'} : temps écoulé.`;
        updateDisplay();
    }

    function tick() {
        if (!running) return;
        const now = Date.now();
        times[activePlayer] -= (now - lastTick) / 1000;
        lastTick = now;
        if (times[activePlayer] <= 0) {
            times[activePlayer] = 0;
            stopAtFlag();
            return;
        }
        updateDisplay();
    }

    function start() {
        if (times.white <= 0 || times.black <= 0) return;
        running = true;
        lastTick = Date.now();
        status.textContent = `Aux ${activePlayer === 'white' ? 'Blancs' : 'Noirs'} de jouer.`;
        intervalId = window.setInterval(tick, 100);
        updateDisplay();
    }

    function pause() {
        tick();
        if (!running) return;
        running = false;
        clearInterval(intervalId);
        intervalId = null;
        status.textContent = 'Pendule en pause.';
        updateDisplay();
    }

    function switchTurn() {
        if (!running) return;
        tick();
        if (!running) return;
        times[activePlayer] += increment;
        activePlayer = activePlayer === 'white' ? 'black' : 'white';
        lastTick = Date.now();
        status.textContent = `Aux ${activePlayer === 'white' ? 'Blancs' : 'Noirs'} de jouer.`;
        updateDisplay();
    }

    function reset() {
        running = false;
        clearInterval(intervalId);
        intervalId = null;
        times = { white: initialTime, black: initialTime };
        activePlayer = 'white';
        status.textContent = 'Choisissez une cadence puis démarrez.';
        updateDisplay();
    }

    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            initialTime = Number(button.dataset.minutes) * 60;
            increment = Number(button.dataset.increment);
            presetButtons.forEach(preset => {
                const selected = preset === button;
                preset.classList.toggle('selected', selected);
                preset.setAttribute('aria-pressed', String(selected));
            });
            reset();
        });
    });

    clockButtons.forEach(button => button.addEventListener('click', () => {
        if (button.dataset.player === activePlayer) switchTurn();
    }));

    startPauseButton.addEventListener('click', () => running ? pause() : start());
    resetButton.addEventListener('click', reset);

    document.addEventListener('keydown', event => {
        const targetIsButton = event.target instanceof Element && event.target.closest('button');
        if (event.code === 'Space' && !event.repeat && !targetIsButton) {
            event.preventDefault();
            switchTurn();
        } else if (event.key === 'Escape' && running) {
            pause();
        }
    });

    updateDisplay();
})();
