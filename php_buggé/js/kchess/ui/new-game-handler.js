/**
 * js/ui/new-game-handler.js
 * Gestion de l'interface de sélection de nouvelle partie avec mémoire (LocalStorage).
 */

const NewGameHandler = {
    selectedMode: 'bot', 
    selectedLevel: '1',
    selectedProfondeur: null,
    selectedColor: 'white',
    targetPage: 'app.php',

    init(targetPage) {
        this.targetPage = targetPage;

        // 1. Charger les dernières préférences enregistrées
        this.loadPreferences();

        // 2. Initialiser les événements
        this.bindEvents();

        // 3. Appliquer visuellement la sélection chargée
        this.applySelectionUI();

        console.log("🎮 NewGameHandler V1.0 initialisé avec mémoire");
    },

    loadPreferences() {
        // On récupère les valeurs ou on garde les valeurs par défaut (Level 1 Bot)
        this.selectedMode = localStorage.getItem('kchess_last_mode') || 'bot';
        this.selectedLevel = localStorage.getItem('kchess_last_level') || '1';
        this.selectedColor = localStorage.getItem('kchess_last_color') || 'white';
        // Note: profondeur peut être ajouté ici si besoin
    },

    savePreferences() {
        localStorage.setItem('kchess_last_mode', this.selectedMode);
        localStorage.setItem('kchess_last_level', this.selectedLevel);
        localStorage.setItem('kchess_last_color', this.selectedColor);
    },

    bindEvents() {
        // Sélection du mode (Bot ou Humain)
        document.querySelectorAll('.game-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // IMPORTANT : Si on clique sur l'icône info (i), on ne sélectionne pas le mode
                if (e.target.closest('.info-tooltip-wrapper')) {
                    return; 
                }
                this.handleModeSelection(e.currentTarget);
            });
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

    applySelectionUI() {
        // Activer visuellement le bouton de mode/level
        const selector = `.game-mode-btn[data-mode="${this.selectedMode}"][data-level="${this.selectedLevel}"]`;
        const activeBtn = document.querySelector(selector);
        if (activeBtn) {
            this.handleModeSelection(activeBtn, false); // false pour ne pas re-sauvegarder inutilement
        } else {
            // Sécurité : si le level stocké n'existe plus, on force l'humain ou le level 1
            const defaultBtn = document.querySelector('.btn-human');
            if (defaultBtn) this.handleModeSelection(defaultBtn);
        }

        // Activer visuellement la couleur
        const colorOption = document.querySelector(`.color-option[data-color="${this.selectedColor}"]`);
        if (colorOption) {
            this.handleColorSelection(colorOption, false);
        }
    },

    handleModeSelection(btn, shouldSave = true) {
        document.querySelectorAll('.game-mode-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        this.selectedMode = btn.dataset.mode;
        this.selectedLevel = btn.dataset.level;
        this.selectedProfondeur = btn.dataset.profondeur;

        // Activer le bouton de démarrage
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) startBtn.disabled = false;

        // Mettre à jour le texte de rappel (sous les boutons)
        const reminderText = document.getElementById('mode-reminder-text');
        const title = btn.querySelector('.mode-description span').innerText;
        if (reminderText) reminderText.innerText = title;

        if (shouldSave) this.savePreferences();
    },

    handleColorSelection(option, shouldSave = true) {
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        this.selectedColor = option.dataset.color;

        if (shouldSave) this.savePreferences();
    },

    startGame() {
        let finalColor = this.selectedColor;
        if (this.selectedColor === 'random') {
            finalColor = Math.random() > 0.5 ? 'white' : 'black';
        }

        const params = new URLSearchParams({
            mode: this.selectedMode,
            level: this.selectedLevel,
            color: finalColor
        });

        // Ajouter profondeur seulement si défini
        if (this.selectedProfondeur) {
            params.append('profondeur', this.selectedProfondeur);
        }

        const finalUrl = `${this.targetPage}?${params.toString()}`;
        
        console.log('🚀 Démarrage...', { url: finalUrl });
        window.location.href = finalUrl;
    }
};