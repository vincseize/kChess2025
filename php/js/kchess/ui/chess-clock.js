(() => {
    const text = window.clockTranslations;
    const presetButtons = [...document.querySelectorAll('.clock-preset')];
    const clockButtons = [...document.querySelectorAll('.clock-face')];
    const status = document.getElementById('clockStatus');
    const startPauseButton = document.getElementById('startPause');
    const resetButton = document.getElementById('resetClock');
    const settings = document.getElementById('clockSettings');
    const openSettingsButton = document.getElementById('openClockSettings');
    const tempoSelectionButton = document.getElementById('openTempoSelection');
    const closeSettingsButton = document.getElementById('closeClockSettings');
    const settingsFooter = document.querySelector('.clock-settings-footer');
    const homeButton = document.getElementById('clockHome');
    const customClockButton = document.getElementById('customClockButton');
    const customClockForm = document.getElementById('customClockForm');
    const customMinutesInput = document.getElementById('customMinutes');
    const customIncrementInput = document.getElementById('customIncrement');
    const finishedDialog = document.getElementById('clockFinished');
    const finishedMessage = document.getElementById('clockFinishedMessage');
    const restartButton = document.getElementById('restartClock');
    const chooseAnotherTempoButton = document.getElementById('chooseAnotherTempo');
    const savedPreset = localStorage.getItem('kchess.clock.lastPreset');

    let initialTime = 600;
    let increment = 0;
    let times = { white: initialTime, black: initialTime };
    let activePlayer = 'white';
    let running = false;
    let hasStarted = false;
    let ready = false;
    let intervalId = null;
    let lastTick = 0;

    const savedValues = savedPreset?.match(/^(\d+):(\d+)$/);
    if (savedValues) {
        const savedMinutes = Number(savedValues[1]);
        const savedIncrement = Number(savedValues[2]);
        if (savedMinutes >= 1 && savedMinutes <= 180 && savedIncrement <= 60) {
            initialTime = savedMinutes * 60;
            increment = savedIncrement;
            presetButtons.forEach(button => {
                const selected = Number(button.dataset.minutes) === savedMinutes
                    && Number(button.dataset.increment) === savedIncrement;
                button.classList.toggle('selected', selected);
                button.setAttribute('aria-pressed', String(selected));
            });
            times = { white: initialTime, black: initialTime };
        }
    }

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
            const panel = document.querySelector(`[data-player-panel="${player}"]`);
            const face = document.querySelector(`[data-player="${player}"].clock-face`);
            panel.classList.toggle('active', player === activePlayer && running);
            panel.classList.toggle('expired', times[player] <= 0);
            face.disabled = !(running && player === activePlayer)
                && !(ready && !hasStarted && player === 'black');
        }

        startPauseButton.querySelector('span').textContent = running
            ? text.pause
            : hasStarted ? text.resume : text.ready;
        startPauseButton.querySelector('i').className = running
            ? 'bi bi-pause-fill'
            : 'bi bi-play-fill';
        presetButtons.forEach(button => button.disabled = running);
        closeSettingsButton.hidden = !hasStarted;
        settingsFooter.classList.toggle('without-close', closeSettingsButton.hidden);
    }

    function stopAtFlag() {
        running = false;
        clearInterval(intervalId);
        intervalId = null;
        const loser = text[activePlayer];
        status.textContent = text.player_flagged.replace('{player}', loser);
        finishedMessage.textContent = text.player_flagged.replace('{player}', loser);
        finishedDialog.hidden = false;
        updateDisplay();
    }

    function tick() {
        if (!running) return;
        const now = Date.now();
        const elapsed = (now - lastTick) / 1000;
        lastTick = now;
        times[activePlayer] -= elapsed;
        if (times[activePlayer] <= 0) {
            times[activePlayer] = 0;
            stopAtFlag();
            return;
        }
        updateDisplay();
    }

    function start() {
        if (times.white <= 0 || times.black <= 0) {
            status.textContent = text.reset_before_resume;
            return;
        }
        running = true;
        hasStarted = true;
        lastTick = Date.now();
        settings.hidden = true;
        status.textContent = text.turn.replace('{player}', text[activePlayer]);
        intervalId = window.setInterval(tick, 100);
        updateDisplay();
    }

    function pause() {
        if (!running) return;
        tick();
        if (!running) return;
        running = false;
        clearInterval(intervalId);
        intervalId = null;
        status.textContent = text.paused;
        updateDisplay();
    }

    function openSettings() {
        pause();
        finishedDialog.hidden = true;
        settings.hidden = false;
        startPauseButton.focus();
    }

    function switchTurn() {
        if (!running) return;
        tick();
        if (!running) return;
        times[activePlayer] += increment;
        activePlayer = activePlayer === 'white' ? 'black' : 'white';
        lastTick = Date.now();
        status.textContent = text.turn.replace('{player}', text[activePlayer]);
        updateDisplay();
    }

    function prepareStart() {
        ready = true;
        settings.hidden = true;
        status.textContent = text.start_with_black;
        updateDisplay();
    }

    function reset() {
        running = false;
        clearInterval(intervalId);
        intervalId = null;
        times = { white: initialTime, black: initialTime };
        activePlayer = 'white';
        hasStarted = false;
        ready = false;
        finishedDialog.hidden = true;
        status.textContent = text.choose_tempo_start;
        updateDisplay();
    }

    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            initialTime = Number(button.dataset.minutes) * 60;
            increment = Number(button.dataset.increment);
            localStorage.setItem('kchess.clock.lastPreset', `${button.dataset.minutes}:${button.dataset.increment}`);
            customClockForm.hidden = true;
            presetButtons.forEach(preset => {
                const selected = preset === button;
                preset.classList.toggle('selected', selected);
                preset.setAttribute('aria-pressed', String(selected));
            });
            reset();
        });
    });

    customClockButton.addEventListener('click', () => {
        customClockForm.hidden = !customClockForm.hidden;
        if (!customClockForm.hidden) {
            customMinutesInput.value = String(Math.floor(initialTime / 60));
            customIncrementInput.value = String(increment);
            customMinutesInput.focus();
        }
    });

    customClockForm.addEventListener('submit', event => {
        event.preventDefault();
        if (!customClockForm.reportValidity()) return;

        const minutes = Number(customMinutesInput.value);
        const customIncrement = Number(customIncrementInput.value);
        if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180
            || !Number.isInteger(customIncrement) || customIncrement < 0 || customIncrement > 60) {
            return;
        }

        initialTime = minutes * 60;
        increment = customIncrement;
        localStorage.setItem('kchess.clock.lastPreset', `${minutes}:${customIncrement}`);
        presetButtons.forEach(button => {
            button.classList.remove('selected');
            button.setAttribute('aria-pressed', 'false');
        });
        customClockForm.hidden = true;
        reset();
        status.textContent = text.custom_tempo
            .replace('{minutes}', minutes)
            .replace('{increment}', customIncrement);
    });

    clockButtons.forEach(button => button.addEventListener('click', () => {
        if (!hasStarted && ready && button.dataset.player === 'black') {
            start();
        } else if (running && button.dataset.player === activePlayer) {
            switchTurn();
        }
    }));

    startPauseButton.addEventListener('click', () => {
        if (running) {
            pause();
        } else if (hasStarted) {
            start();
        } else {
            prepareStart();
        }
    });
    resetButton.addEventListener('click', reset);
    openSettingsButton.addEventListener('click', openSettings);
    tempoSelectionButton.addEventListener('click', openSettings);
    closeSettingsButton.addEventListener('click', () => {
        settings.hidden = true;
    });
    homeButton.addEventListener('click', () => {
        running = false;
        clearInterval(intervalId);
        intervalId = null;
        ready = false;
    });
    restartButton.addEventListener('click', () => {
        reset();
        ready = true;
        finishedDialog.hidden = true;
        status.textContent = text.start_with_black;
        updateDisplay();
    });
    chooseAnotherTempoButton.addEventListener('click', openSettings);

    document.addEventListener('keydown', event => {
        const targetIsButton = event.target instanceof Element && event.target.closest('button');
        if (event.code === 'Space' && !event.repeat && !targetIsButton) {
            event.preventDefault();
            switchTurn();
        } else if (event.key === 'Escape') {
            if (settings.hidden) openSettings();
            else if (hasStarted) settings.hidden = true;
        }
    });

    updateDisplay();
})();
