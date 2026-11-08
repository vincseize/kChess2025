/**
 * js/ui/new-game-handler.js
 * v2.1.0 - Couleur inline à droite du bouton Démarrer (par level)
 *
 * - Accordéon : clic sur un level ouvre son bouton Démarrer + picker de couleur
 * - Chaque level a son propre picker (white / black / random)
 * - Le bouton Démarrer récupère la couleur du picker de SON level
 */

const NewGameHandler = {
    selectedMode: null,
    selectedLevel: null,
    selectedProfondeur: null,
    selectedVariant: null,
    targetPage: 'app.php',

    init(targetPage) {
        this.targetPage = targetPage;
        this.bindEvents();
        this.selectDefaultMode();
        console.log("🎮 NewGameHandler v2.1.0 initialisé (couleur par level)");
    },

    bindEvents() {
        // Clic sur un mode → toggle accordéon
        document.querySelectorAll('.game-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleModeSelection(e.currentTarget));
        });

        // Clic sur un bouton "Démarrer" de level → lance la partie
        document.querySelectorAll('.start-level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.startGameFromLevel(btn);
            });
        });

        // Clic sur une couleur dans un picker inline
        document.querySelectorAll('.inline-color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleInlineColorSelection(e.currentTarget);
            });
        });

        // Chess960 button (raccourci en haut de la page d'accueil)
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

    /**
     * Toggle accordéon : si le bouton est déjà sélectionné, on referme.
     * Sinon, on ferme tous les autres et on ouvre celui-ci.
     */
    handleModeSelection(btn) {
        const accordion = btn.closest('.level-accordion');
        const isAlreadySelected = btn.classList.contains('selected');

        // Ferme tous les accordéons
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
            // L'utilisateur a cliqué sur le même level → on referme tout
            this.selectedMode = null;
            this.selectedLevel = null;
            this.selectedProfondeur = null;
            this.selectedVariant = null;
            return;
        }

        // Ouvre le nouveau
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

        console.log('🕹️ Mode sélectionné:', {
            mode: this.selectedMode,
            level: this.selectedLevel
        });
    },

    /**
     * Sélection de couleur dans un picker inline (spécifique au level ouvert).
     * Ne touche qu'au picker du même conteneur.
     */
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

    /**
     * Récupère la couleur sélectionnée dans le picker du level courant.
     */
    getColorForLevel(level) {
        const accordion = document.querySelector(`.level-accordion[data-level="${level}"]`);
        if (!accordion) return 'white';

        const selected = accordion.querySelector('.inline-color-option.selected');
        return selected?.dataset.color || 'white';
    },

    /**
     * Lance la partie avec le level du bouton cliqué.
     */
    startGameFromLevel(btn) {
        const mode = btn.dataset.mode;
        const level = btn.dataset.level;
        const profondeur = btn.dataset.profondeur;
        const variant = btn.dataset.variant || null;

        this.selectedMode = mode;
        this.selectedLevel = level;
        this.selectedProfondeur = profondeur;
        this.selectedVariant = variant;

        this.startGame();
    },

    startGame(overrides = {}) {
        const level = overrides.level || this.selectedLevel;
        const mode = overrides.mode || this.selectedMode;

        if (!mode || (mode === 'bot' && !level)) {
            console.warn('⚠️ Mode ou level manquant, impossible de démarrer.');
            return;
        }

        // Couleur : override > picker du level courant > white
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

        const botButtons = [...document.querySelectorAll('.game-mode-btn[data-mode="bot"]')];
        const defaultBot = botButtons.find(btn => btn.dataset.level === savedLevel)
            || botButtons.find(btn => btn.dataset.level === '1');

        if (defaultBot) defaultBot.click();
        else document.querySelector('.btn-human')?.click();
    }
};