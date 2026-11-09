/**
 * js/ui/new-game-handler.js
 * v2.4.0 - Progression préservée + reset "R" partout
 *
 * - Verrouillage strict des levels (3 victoires requises sur le précédent)
 * - MAIS un level déjà entamé/complété reste déverrouillé (pas de cascade destructive)
 * - Bouton Reset "R" visible sur TOUTES les cards complétées (sélectionnées ou non)
 * - Reset → supprime les 3 victoires du level → re-verrouille le suivant
 */

const NewGameHandler = {
    selectedMode: null,
    selectedLevel: null,
    selectedProfondeur: null,
    selectedVariant: null,
    targetPage: 'app.php',

    // Clé de secours si BotTrainingProgress n'est pas encore chargé
    FALLBACK_STORAGE_KEY: 'kchess_training_progress',

    init(targetPage) {
        this.targetPage = targetPage;
        this.applyLockStates();
        this.applyCompletionStates();
        this.bindEvents();
        this.selectDefaultMode();
        console.log("🎮 NewGameHandler v2.4.0 initialisé (progression préservée + reset R)");
    },

    getStorageKey() {
        if (typeof BotTrainingProgress !== 'undefined' && BotTrainingProgress.storageKey) {
            return BotTrainingProgress.storageKey;
        }
        return this.FALLBACK_STORAGE_KEY;
    },

    getTrainingState() {
        try {
            const raw = localStorage.getItem(this.getStorageKey());
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
        } catch (e) {
            return {};
        }
    },

    saveTrainingState(state) {
        try {
            localStorage.setItem(this.getStorageKey(), JSON.stringify(state));
            return true;
        } catch (e) {
            console.warn('Impossible de sauvegarder la progression.', e);
            return false;
        }
    },

    isLevelComplete(level) {
        const state = this.getTrainingState();
        const entry = state[String(level)];
        if (!entry || typeof entry !== 'object') return false;
        return entry.white === true && entry.black === true && entry.random === true;
    },

    isLevelStarted(level) {
        const state = this.getTrainingState();
        const entry = state[String(level)];
        if (!entry || typeof entry !== 'object') return false;
        return entry.white === true || entry.black === true || entry.random === true;
    },

    isLevelUnlocked(level, prevLevel) {
        const lvl = parseInt(level, 10);
        if (isNaN(lvl) || lvl <= 1) return true;
        const prev = parseInt(prevLevel, 10);
        if (isNaN(prev) || prev <= 0) return true;

        // ★ Un level déjà entamé (au moins 1 victoire) reste déverrouillé,
        // même si le précédent a été reset. Évite la cascade destructive.
        if (this.isLevelStarted(lvl)) return true;

        return this.isLevelComplete(prev);
    },

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

    applyCompletionStates() {
        document.querySelectorAll('.level-accordion').forEach(acc => {
            const btn = acc.querySelector('.game-mode-btn');
            if (!btn) return;

            const level = parseInt(btn.dataset.level, 10);
            if (isNaN(level) || level < 1) return; // ignore Humain / 960

            const completed = this.isLevelComplete(level);
            const resetBtn = acc.querySelector('.level-reset-btn');

            acc.classList.toggle('is-completed', completed);
            // R visible dès qu'il y a une victoire à effacer
            if (resetBtn) resetBtn.hidden = !this.isLevelStarted(level);
        });
    },

    resetLevel(level) {
        const lvl = String(level);
        const state = this.getTrainingState();
        if (!state[lvl]) return false;

        const btn = document.querySelector(`.level-reset-btn[data-level="${lvl}"]`);
        const fill = (txt) => String(txt || '')
            .replace(/\{level\}/g, lvl)
            .replace(/\{next\}/g, String(parseInt(lvl, 10) + 1));

        // Petite explication + confirmation
        if (!window.confirm(fill(btn?.dataset.confirm))) return false;

        // Victoires remises à 0
        delete state[lvl];
        if (!this.saveTrainingState(state)) return false;

        if (typeof BotTrainingProgress !== 'undefined' && typeof BotTrainingProgress.render === 'function') {
            BotTrainingProgress.render();
        }
        // Le level suivant se reverrouille, ce level reste actif
        this.applyLockStates();
        this.applyCompletionStates();
        this.showToast(fill(btn?.dataset.done));

        console.log(`🔄 Level ${lvl} réinitialisé (victoires à 0).`);
        return true;
    },

    showToast(message) {
        if (!message) return;
        let toast = document.getElementById('levelToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'levelToast';
            toast.setAttribute('role', 'status');
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
    },

    bindEvents() {
        document.querySelectorAll('.game-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Ne pas déclencher si on a cliqué sur le bouton Reset
                if (e.target.closest('.level-reset-btn')) return;

                if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') {
                    e.preventDefault();
                    e.stopPropagation();
                    const prevLevel = btn.dataset.prevLevel;
                    if (prevLevel && prevLevel !== '0') this.notifyLocked(prevLevel);
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

        document.querySelectorAll('.level-reset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const level = btn.dataset.level;
                if (level) this.resetLevel(level);
            });
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (btn.dataset.level) this.resetLevel(btn.dataset.level);
                }
            });
        });

        document.getElementById('startChess960')?.addEventListener('click', () => {
            this.startGame({ mode: 'human', level: '0', profondeur: 'false', variant: 'chess960', color: 'white' });
        });
    },

    notifyLocked(prevLevel) {
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