/**
 * js/ui/new-game-handler.js
 * Gestion de l'interface de sélection de nouvelle partie.
 */

const NewGameHandler = {
    selectedMode: null,
    selectedLevel: null,
    selectedProfondeur: null,
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
    },

    handleModeSelection(btn) {
        document.querySelectorAll('.game-mode-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        this.selectedMode = btn.dataset.mode;
        this.selectedLevel = btn.dataset.level;
        this.selectedProfondeur = btn.dataset.profondeur;

        document.getElementById('startGameBtn').disabled = false;

        const botName = this.getBotDisplayName(this.selectedMode, this.selectedLevel);
        console.log('🕹️ Mode sélectionné:', { mode: this.selectedMode, level: this.selectedLevel, bot: botName });
    },

    handleColorSelection(option) {
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        this.selectedColor = option.dataset.color;
    },

    getBotDisplayName(mode, level) {
        if (mode === 'human') return 'Humain';
        if (level === '1') return 'Level_0 (Aléatoire)';
        if (level === '2') return 'Level_1 (CCMO)';
        return 'Inconnu';
    },

    startGame() {
        let finalColor = this.selectedColor;
        if (this.selectedColor === 'random') {
            finalColor = Math.random() > 0.5 ? 'white' : 'black';
        }

        const params = new URLSearchParams({
            mode: this.selectedMode,
            level: this.selectedLevel,
            profondeur: this.selectedProfondeur,
            color: finalColor
        });

        const finalUrl = `${this.targetPage}?${params.toString()}`;
        
        console.log('🚀 Démarrage de la partie...', { url: finalUrl });
        window.location.href = finalUrl;
    },

    selectDefaultMode() {
        const humanBtn = document.querySelector('.btn-human');
        if (humanBtn) humanBtn.click();

        // Scroll fluide pour mobile
        setTimeout(() => {
            const content = document.querySelector('.new-game-content');
            if (content) content.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
};