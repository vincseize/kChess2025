(() => {
    const text = window.clockTranslations;
    let presetButtons = [...document.querySelectorAll('.clock-preset')];
    const savedCustomTimesContainer = document.getElementById('savedCustomTimes');
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
    const divider = document.getElementById('clockDivider');
    const dividerActions = document.getElementById('dividerActions');
    const dividerConfirm = document.getElementById('dividerConfirm');
    const dividerReset = document.getElementById('dividerReset');
    const dividerPlayPause = document.getElementById('dividerPlayPause');
    const dividerTempo = document.getElementById('dividerTempo');
    const dividerSound = document.getElementById('dividerSound');
    const dividerTempoLabel = document.getElementById('dividerTempoLabel');
    const dividerResetYes = document.getElementById('dividerResetYes');
    const dividerResetNo = document.getElementById('dividerResetNo');
    const soundStorageKey = 'kchess.clock.sound';
    let soundOn = true;
    try { soundOn = localStorage.getItem(soundStorageKey) !== '0'; } catch (error) { /* son activé par défaut */ }
    const clickSound = new Audio(divider.dataset.soundSrc);
    clickSound.preload = 'auto';
    const customTimeStorageKey = 'kchess.clock.customTimes';

    let initialTime = 600;
    let increment = 0;
    let times = { white: initialTime, black: initialTime };
    let activePlayer = 'white';
    let running = false;
    let hasStarted = false;
    let ready = false;
    let intervalId = null;
    let lastTick = 0;

    function readCustomTimes() {
        try {
            const customTimes = JSON.parse(localStorage.getItem(customTimeStorageKey) || '[]');
            if (!Array.isArray(customTimes)) return [];
            const seen = new Set();
            return customTimes.filter(item => {
                if (!Number.isInteger(item.minutes) || item.minutes < 1 || item.minutes > 180
                    || !Number.isInteger(item.increment) || item.increment < 0 || item.increment > 60
                    || document.querySelector(`.clock-preset:not([data-custom="true"])[data-minutes="${item.minutes}"][data-increment="${item.increment}"]`)) {
                    return false;
                }
                const key = `${item.minutes}:${item.increment}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        } catch (error) {
            console.error('Unable to read saved custom time controls.', error);
            return [];
        }
    }

    function renderCustomTimes() {
        savedCustomTimesContainer.replaceChildren();
        let customTimes = readCustomTimes();
        const lastValues = localStorage.getItem('kchess.clock.lastPreset')?.match(/^(\d+):(\d+)$/);
        if (lastValues) {
            const lastMinutes = Number(lastValues[1]);
            const lastIncrement = Number(lastValues[2]);
            const isPredefined = document.querySelector(
                `.clock-preset:not([data-custom="true"])[data-minutes="${lastMinutes}"][data-increment="${lastIncrement}"]`
            );
            if (!isPredefined && !customTimes.some(item =>
                item.minutes === lastMinutes && item.increment === lastIncrement
            )) {
                customTimes.push({ minutes: lastMinutes, increment: lastIncrement });
                localStorage.setItem(customTimeStorageKey, JSON.stringify(customTimes));
            }
        }
        savedCustomTimesContainer.hidden = customTimes.length === 0;
        customTimes.forEach(({ minutes, increment: customIncrement }) => {
            const group = document.createElement('span');
            group.className = 'clock-saved-preset';
            const preset = document.createElement('button');
            preset.type = 'button';
            preset.className = 'clock-preset';
            preset.dataset.minutes = String(minutes);
            preset.dataset.increment = String(customIncrement);
            preset.dataset.custom = 'true';
            preset.setAttribute('aria-pressed', 'false');
            preset.textContent = `${minutes} +${customIncrement}`;
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'clock-remove-preset';
            remove.dataset.minutes = String(minutes);
            remove.dataset.increment = String(customIncrement);
            remove.setAttribute('aria-label', text.remove_custom_time);
            remove.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
            group.append(preset, remove);
            savedCustomTimesContainer.append(group);
        });
        presetButtons = [...document.querySelectorAll('.clock-preset')];
    }

    renderCustomTimes();

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
            // couleurs « actif » dès le départ (avant le 1er coup et en pause) : c'est le camp dont c'est le tour
            panel.classList.toggle('active', player === activePlayer && times[player] > 0);
            panel.classList.toggle('expired', times[player] <= 0);
            // avant le départ, un tap côté Noirs lance la partie (sans passer par « Prêt »)
            face.disabled = !(running && player === activePlayer)
                && !(!hasStarted && player === 'black');
        }

        startPauseButton.querySelector('span').textContent = running
            ? text.pause
            : hasStarted ? text.resume : text.ready;
        startPauseButton.querySelector('i').className = running
            ? 'bi bi-pause-fill'
            : 'bi bi-play-fill';
        document.querySelector('.clock-page').classList.toggle('not-started', !hasStarted);
        dividerTempoLabel.textContent = `${Math.floor(initialTime / 60)} +${increment}`;
        const playLabel = running ? text.pause : hasStarted ? text.resume : text.ready;
        dividerPlayPause.querySelector('i').className = running ? 'bi bi-pause-fill' : 'bi bi-play-fill';
        dividerPlayPause.setAttribute('aria-label', playLabel);
        dividerPlayPause.title = playLabel;
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

    function selectPreset(button) {
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
    }

    function bindPresetButton(button) {
        button.addEventListener('click', () => {
            selectPreset(button);
        });
    }

    presetButtons.forEach(bindPresetButton);

    savedCustomTimesContainer.addEventListener('click', event => {
        const removeButton = event.target.closest('.clock-remove-preset');
        if (!removeButton) return;

        const minutes = Number(removeButton.dataset.minutes);
        const removedIncrement = Number(removeButton.dataset.increment);
        const remainingTimes = readCustomTimes().filter(item =>
            item.minutes !== minutes || item.increment !== removedIncrement
        );
        localStorage.setItem(customTimeStorageKey, JSON.stringify(remainingTimes));
        const wasSelected = localStorage.getItem('kchess.clock.lastPreset') === `${minutes}:${removedIncrement}`;
        if (wasSelected) localStorage.setItem('kchess.clock.lastPreset', '10:0');
        renderCustomTimes();
        if (wasSelected) {
            const fallbackPreset = presetButtons.find(button =>
                button.dataset.minutes === '10' && button.dataset.increment === '0'
            );
            selectPreset(fallbackPreset);
        } else {
            updateDisplay();
        }
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
        const isPredefined = presetButtons.some(button =>
            button.dataset.custom !== 'true'
            && Number(button.dataset.minutes) === minutes
            && Number(button.dataset.increment) === customIncrement
        );
        if (!isPredefined) {
            const customTimes = readCustomTimes().filter(item =>
                item.minutes !== minutes || item.increment !== customIncrement
            );
            customTimes.push({ minutes, increment: customIncrement });
            localStorage.setItem(customTimeStorageKey, JSON.stringify(customTimes));
            renderCustomTimes();
        }
        const selectedButton = presetButtons.find(button =>
            Number(button.dataset.minutes) === minutes
            && Number(button.dataset.increment) === customIncrement
        );
        if (selectedButton) {
            selectPreset(selectedButton);
        } else {
            reset();
        }
        status.textContent = text.custom_tempo
            .replace('{minutes}', minutes)
            .replace('{increment}', customIncrement);
    });

    function playClick() {
        if (!soundOn) return;
        try {
            clickSound.currentTime = 0;
            const result = clickSound.play();
            if (result && typeof result.catch === 'function') result.catch(() => {});
        } catch (error) { /* son indisponible : on ignore */ }
    }

    function renderSoundButton() {
        dividerSound.setAttribute('aria-pressed', String(soundOn));
        const label = soundOn ? text.sound_on : text.sound_off;
        dividerSound.setAttribute('aria-label', label);
        dividerSound.title = label;
        dividerSound.querySelector('i').className = soundOn ? 'bi bi-volume-up-fill' : 'bi bi-volume-mute-fill';
    }

    function showResetConfirm(show) {
        dividerConfirm.hidden = !show;
        dividerActions.hidden = show;
        if (show) dividerResetNo.focus();
    }

    clockButtons.forEach(button => button.addEventListener('click', () => {
        if (!hasStarted && button.dataset.player === 'black') {
            playClick();
            start();
        } else if (running && button.dataset.player === activePlayer) {
            playClick();
            switchTurn();
        }
    }));

    // Barre centrale
    dividerPlayPause.addEventListener('click', () => {
        if (running) pause();
        else start();
    });
    dividerTempo.addEventListener('click', openSettings);
    dividerSound.addEventListener('click', () => {
        soundOn = !soundOn;
        try { localStorage.setItem(soundStorageKey, soundOn ? '1' : '0'); } catch (error) { /* ignore */ }
        renderSoundButton();
        playClick();   // petit aperçu quand on réactive le son
    });
    dividerReset.addEventListener('click', () => showResetConfirm(true));
    dividerResetNo.addEventListener('click', () => showResetConfirm(false));
    dividerResetYes.addEventListener('click', () => {
        reset();
        showResetConfirm(false);
    });
    renderSoundButton();

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
            if (running) playClick();
            switchTurn();
        } else if (event.key === 'Escape') {
            if (!dividerConfirm.hidden) showResetConfirm(false);
            else if (settings.hidden) openSettings();
            else if (hasStarted) settings.hidden = true;
        }
    });

    updateDisplay();
})();