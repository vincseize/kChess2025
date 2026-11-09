/**
 * js/kchess/ui/bot-training-progress.js
 * v2.0.0 - Auto-réparation, normalisation tolérante, logs explicites
 */

const BotTrainingProgress = {
    storageKey: 'kchess.botTrainingProgress.v1',
    types: ['white', 'black', 'random'],

    // ─────────────────────────────────────────────────────────────
    // Lecture / écriture
    // ─────────────────────────────────────────────────────────────

    readProgress() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return {};

            const progress = JSON.parse(stored);
            if (!progress || typeof progress !== 'object' || Array.isArray(progress)) {
                console.warn('⚠️ Suivi bot invalide, réinitialisation à {}');
                // Auto-réparation : on repart d'un objet vide propre
                // mais on N'ÉCRASE PAS tant qu'aucune victoire n'est enregistrée
                return {};
            }
            return progress;
        } catch (error) {
            console.warn('⚠️ Suivi bot illisible, réinitialisation à {}', error);
            return {};
        }
    },

    writeProgress(progress) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(progress));
            return true;
        } catch (error) {
            console.warn('Impossible de sauvegarder la progression bot.', error);
            return false;
        }
    },

    // ─────────────────────────────────────────────────────────────
    // Rendu visuel
    // ─────────────────────────────────────────────────────────────

    render() {
        const progress = this.readProgress();
        document.querySelectorAll('.bot-training-progress').forEach(container => {
            const level = container.dataset.trainingLevel;
            const levelProgress = progress[level] || {};
            const completedTypes = this.types.filter(type => levelProgress[type] === true);

            container.classList.toggle('is-complete', completedTypes.length === this.types.length);

            container.querySelectorAll('[data-training-type]').forEach(mark => {
                const isComplete = levelProgress[mark.dataset.trainingType] === true;
                mark.classList.toggle('is-complete', isComplete);
                mark.setAttribute(
                    'aria-label',
                    `${mark.dataset.label}: ${isComplete ? mark.dataset.doneLabel : mark.dataset.pendingLabel}`
                );
            });
        });
    },

    // ─────────────────────────────────────────────────────────────
    // Normalisation couleur (très tolérante)
    // ─────────────────────────────────────────────────────────────

    normalizeColor(value) {
        if (value == null) return null;
        const normalized = String(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();

        if (!normalized) return null;

        if (normalized === 'w' || normalized === 'b') {
            return normalized === 'w' ? 'white' : 'black';
        }
        if (normalized.includes('white') || normalized.includes('blanc') || normalized.includes('weiss') || normalized === 'w') {
            return 'white';
        }
        if (normalized.includes('black') || normalized.includes('noir') || normalized.includes('negra') || normalized.includes('schwarz') || normalized === 'b') {
            return 'black';
        }
        // Parfois '1-0' / '0-1' (notation PGN)
        if (normalized === '1-0') return 'white';
        if (normalized === '0-1') return 'black';
        return null;
    },

    // ─────────────────────────────────────────────────────────────
    // Enregistrement d'une victoire
    // ─────────────────────────────────────────────────────────────

    recordVictory(winnerColor) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') !== 'bot') {
            console.log('⏭️ recordVictory ignoré : mode ≠ bot');
            return false;
        }

        const level = params.get('level');
        if (!/^\d+$/.test(level || '')) {
            console.warn('⏭️ recordVictory ignoré : level invalide =', level);
            return false;
        }

        // Couleur du joueur : d'abord ?color=, sinon ?trainingColor=, sinon pas de match possible
        const playerColor = this.normalizeColor(params.get('color'))
                         || this.normalizeColor(params.get('trainingColor'));
        if (!playerColor) {
            console.warn('⏭️ recordVictory ignoré : couleur joueur introuvable dans l’URL');
            return false;
        }

        const normalizedWinner = this.normalizeColor(winnerColor);
        if (!normalizedWinner) {
            console.warn('⏭️ recordVictory ignoré : couleur gagnante non reconnue =', winnerColor);
            return false;
        }
        if (normalizedWinner !== playerColor) {
            console.log(`⏭️ recordVictory ignoré : le joueur (${playerColor}) n’a pas gagné (gagnant = ${normalizedWinner})`);
            return false;
        }

        // Type de victoire à créditer : trainingColor si valide, sinon couleur joueur
        const requestedType = this.normalizeColor(params.get('trainingColor'));
        const trainingType = this.types.includes(requestedType) ? requestedType : playerColor;

        const progress = this.readProgress();
        const levelProgress = (progress[level] && typeof progress[level] === 'object' && !Array.isArray(progress[level]))
            ? progress[level]
            : {};

        if (levelProgress[trainingType] === true) {
            console.log(`ℹ️ Level ${level} déjà validé en ${trainingType}`);
            return false;
        }

        levelProgress[trainingType] = true;
        progress[level] = levelProgress;

        if (!this.writeProgress(progress)) return false;

        console.log(`✅ Victoire enregistrée : Level ${level}, type=${trainingType}`, progress[level]);
        return true;
    },

    recordGameResult(result) {
        const winnerColor = this.normalizeColor(result);
        return winnerColor ? this.recordVictory(winnerColor) : false;
    },

    recordTimeLoss(loserColor) {
        const normalizedLoser = this.normalizeColor(loserColor);
        if (!normalizedLoser) return false;
        return this.recordVictory(normalizedLoser === 'white' ? 'black' : 'white');
    }
};

window.BotTrainingProgress = BotTrainingProgress;

document.addEventListener('DOMContentLoaded', () => BotTrainingProgress.render());