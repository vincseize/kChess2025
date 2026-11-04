/**
 * js/ui/new-game-handler.js
 * Gestion de l'interface de sélection de nouvelle partie.
 */

const NewGameHandler = {
    selectedMode: null,
    selectedLevel: null,
    selectedProfondeur: null,
    selectedVariant: null,
    selectedColor: 'white',
    targetPage: 'app.php',

    init(targetPage) {
        this.targetPage = targetPage;
        this.bindEvents();
        this.selectDefaultMode();
        console.log("🎮 NewGameHandler initialisé");
    },

    bindEvents() {
        // Sélection du mode
        document.querySelectorAll('.game-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleModeSelection(e.currentTarget));
        });

        // Sélection de la couleur
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => this.handleColorSelection(e.currentTarget));
        });

        // Bouton démarrer
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }

        document.getElementById('startChess960')?.addEventListener('click', () => {
            this.startGame({ mode: 'human', level: '0', profondeur: 'false', variant: 'chess960' });
        });
    },

    handleModeSelection(btn) {
        document.querySelectorAll('.game-mode-btn').forEach(b => {
            b.classList.remove('selected');
            b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');

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

        document.getElementById('startGameBtn').disabled = false;

        const botName = this.getBotDisplayName(this.selectedMode, this.selectedLevel);
        console.log('🕹️ Mode sélectionné:', { mode: this.selectedMode, level: this.selectedLevel, bot: botName });
    },

    handleColorSelection(option) {
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('selected');
            opt.setAttribute('aria-pressed', 'false');
        });
        option.classList.add('selected');
        option.setAttribute('aria-pressed', 'true');
        this.selectedColor = option.dataset.color;
    },

    getBotDisplayName(mode, level) {
        if (mode === 'human') return 'Humain';
        if (level === '1') return 'Level_0 (Aléatoire)';
        if (level === '2') return 'Level_1 (CCMO)';
        return 'Inconnu';
    },

    startGame(overrides = {}) {
        let finalColor = this.selectedColor;
        if (this.selectedColor === 'random') {
            finalColor = Math.random() > 0.5 ? 'white' : 'black';
        }

        const params = new URLSearchParams({
            mode: overrides.mode || this.selectedMode,
            level: overrides.level || this.selectedLevel,
            profondeur: overrides.profondeur || this.selectedProfondeur,
            color: finalColor,
            ...((overrides.mode || this.selectedMode) === 'bot' ? { trainingColor: this.selectedColor } : {}),
            ...((overrides.variant || this.selectedVariant) ? { variant: overrides.variant || this.selectedVariant } : {})
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

        const botButtons = [...document.querySelectorAll('.game-mode-btn[data-mode="bot"]')];
        const defaultBot = botButtons.find(btn => btn.dataset.level === savedLevel)
            || botButtons.find(btn => btn.dataset.level === '1');

        if (defaultBot) defaultBot.click();
        else document.querySelector('.btn-human')?.click();
    }
};
