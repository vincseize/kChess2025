/**
 * js/ui/new-game-handler.js
 * v2.2.0 - Déverrouillage progressif strict
 *
 * Règles :
 *  - Level 1 : toujours accessible
 *  - Level N (N ≥ 2) : accessible si Level N-1 a white + black + random validés
 *  - Level 16 : accessible si Level 8 est validé (précédent dans la liste)
 *  - Humain / Humain 960 : toujours accessibles
 *
 * Compatible avec bot-training-progress.js (storageKey = 'kchess.botTrainingProgress.v1')
 * Format : { "1": { white: true, black: true, random: true }, ... }
 */

const NewGameHandler = {
    selectedMode: null,
    selectedLevel: null,
    selectedProfondeur: null,
    selectedVariant: null,
    targetPage: 'app.php',

    init(targetPage) {
        this.targetPage = targetPage;
        this.applyLockStates();
        this.bindEvents();
        this.selectDefaultMode();
        console.log("🎮 NewGameHandler v2.2.0 initialisé (verrouillage strict)");
    },

    /**
     * Lit l'état d'entraînement depuis localStorage.
     */
    getTrainingState() {
        try {
            if (typeof BotTrainingProgress === 'undefined') return {};
            const raw = localStorage.getItem(BotTrainingProgress.storageKey);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
        } catch (e) {
            return {};
        }
    },

    /**
     * Vérifie si un level a les 3 victoires (white + black + random).
     */
    isLevelComplete(level) {
        const state = this.getTrainingState();
        const entry = state[String(level)];
        if (!entry || typeof entry !== 'object') return false;
        return entry.white === true
            && entry.black === true
            && entry.random === true;
    },

    /**
     * Vérifie si un level est déverrouillé.
     */
    isLevelUnlocked(level, prevLevel) {
        const lvl = parseInt(level, 10);
        if (isNaN(lvl) || lvl <= 1) return true; // humain (0) ou level 1
        const prev = parseInt(prevLevel, 10);
        if (isNaN(prev) || prev <= 0) return true; // pas de précédent défini → autorisé
        return this.isLevelComplete(prev);
    },

    /**
     * Applique l'état visuel verrouillé/déverrouillé sur toutes les cards.
     */
    applyLockStates() {
        document.querySelectorAll('.level-accordion').forEach(acc => {
            const btn = acc.querySelector('.game-mode-btn');
            if (!btn) return;

            const level = btn.dataset.level;
            const prevLevel = btn.dataset.prevLevel || acc.dataset.prevLevel || '0';
            const unlocked = this.isLevelUnlocked(level, prevLevel);
            const lock = acc.querySelector('.level-lock');

            if (unlocked) {
                acc.classList.remove('is-locked');
                btn.removeAttribute('aria-disabled');
                btn.disabled = false;
                if (lock) lock.hidden = true;
            } else {
                acc.classList.add('is-locked');
                btn.setAttribute('aria-disabled', 'true');
                btn.disabled = true;
                if (lock) lock.hidden = false;
            }
        });
    },

    bindEvents() {
        document.querySelectorAll('.game-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') {
                    e.preventDefault();
                    e.stopPropagation();
                    const prevLevel = btn.dataset.prevLevel;
                    if (prevLevel && prevLevel !== '0') {
                        this.notifyLocked(prevLevel);
                    }
                    return;
                }
                this.handleModeSelection(e.currentTarget);
            });
        });

        document.querySelectorAll('.start-level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const acc = btn.closest('.level-accordion');
                if (acc?.classList.contains('is-locked')) {
                    this.notifyLocked(btn.dataset.prevLevel || btn.dataset.level);
                    return;
                }
                this.startGameFromLevel(btn);
            });
        });

        document.querySelectorAll('.inline-color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleInlineColorSelection(e.currentTarget);
            });
        });

        document.getElementById('startChess960')?.addEventListener('click', () => {
            this.startGame({
                mode: 'human',
                level: '0',
                profondeur: 'false',
                variant: 'chess960',
                color: 'white'
            });
        });
    },

    notifyLocked(prevLevel) {
        // Flash rouge sur la carte du level précédent à valider
        const acc = document.querySelector(`.level-accordion[data-level="${prevLevel}"]`);
        if (acc) {
            acc.classList.add('flash');
            setTimeout(() => acc.classList.remove('flash'), 800);
            acc.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        console.warn(`🔒 Terminez d'abord le Level ${prevLevel} (blanc + noir + aléatoire) pour déverrouiller ce niveau.`);
    },

    handleModeSelection(btn) {
        const accordion = btn.closest('.level-accordion');
        const isAlreadySelected = btn.classList.contains('selected');

        document.querySelectorAll('.level-accordion').forEach(acc => {
            const b = acc.querySelector('.game-mode-btn');
            if (b) {
                b.classList.remove('selected');
                b.setAttribute('aria-pressed', 'false');
                b.setAttribute('aria-expanded', 'false');
            }
            acc.classList.remove('open');
        });

        if (isAlreadySelected) {
            this.selectedMode = null;
            this.selectedLevel = null;
            this.selectedProfondeur = null;
            this.selectedVariant = null;
            return;
        }

        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-expanded', 'true');
        if (accordion) accordion.classList.add('open');

        this.selectedMode = btn.dataset.mode;
        this.selectedLevel = btn.dataset.level;
        this.selectedProfondeur = btn.dataset.profondeur;
        this.selectedVariant = btn.dataset.variant || null;

        if (this.selectedMode === 'bot') {
            try {
                localStorage.setItem('kchess.selectedBotLevel', this.selectedLevel);
            } catch (error) {
                console.warn('Impossible de mémoriser le niveau du bot.', error);
            }
        }
    },

    handleInlineColorSelection(option) {
        const picker = option.closest('.inline-color-picker');
        if (!picker) return;

        picker.querySelectorAll('.inline-color-option').forEach(opt => {
            opt.classList.remove('selected');
            opt.setAttribute('aria-pressed', 'false');
        });
        option.classList.add('selected');
        option.setAttribute('aria-pressed', 'true');
    },

    getColorForLevel(level) {
        const accordion = document.querySelector(`.level-accordion[data-level="${level}"]`);
        if (!accordion) return 'white';
        const selected = accordion.querySelector('.inline-color-option.selected');
        return selected?.dataset.color || 'white';
    },

    startGameFromLevel(btn) {
        this.selectedMode = btn.dataset.mode;
        this.selectedLevel = btn.dataset.level;
        this.selectedProfondeur = btn.dataset.profondeur;
        this.selectedVariant = btn.dataset.variant || null;
        this.startGame();
    },

    startGame(overrides = {}) {
        const level = overrides.level || this.selectedLevel;
        const mode = overrides.mode || this.selectedMode;

        if (!mode || (mode === 'bot' && !level)) {
            console.warn('⚠️ Mode ou level manquant, impossible de démarrer.');
            return;
        }

        let finalColor = overrides.color || this.getColorForLevel(level) || 'white';
        if (finalColor === 'random') {
            finalColor = Math.random() > 0.5 ? 'white' : 'black';
        }

        const params = new URLSearchParams({
            mode: mode,
            level: level,
            profondeur: overrides.profondeur || this.selectedProfondeur || 'false',
            color: finalColor,
            ...(mode === 'bot' ? { trainingColor: this.getColorForLevel(level) } : {}),
            ...((overrides.variant || this.selectedVariant)
                ? { variant: overrides.variant || this.selectedVariant }
                : {})
        });

        const finalUrl = `${this.targetPage}?${params.toString()}`;
        console.log('🚀 Démarrage de la partie...', { url: finalUrl });
        window.location.href = finalUrl;
    },

    selectDefaultMode() {
        let savedLevel = null;
        try {
            savedLevel = localStorage.getItem('kchess.selectedBotLevel');
        } catch (error) {
            console.warn('Impossible de lire le niveau du bot mémorisé.', error);
        }

        const botButtons = [...document.querySelectorAll('.game-mode-btn[data-mode="bot"]:not([disabled])')];
        const defaultBot = botButtons.find(btn => btn.dataset.level === savedLevel)
            || botButtons.find(btn => btn.dataset.level === '1');

        if (defaultBot) defaultBot.click();
        else document.querySelector('.btn-human')?.click();
    }
};