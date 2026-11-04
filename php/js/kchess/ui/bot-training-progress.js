const BotTrainingProgress = {
    storageKey: 'kchess.botTrainingProgress.v1',
    types: ['white', 'black', 'random'],

    readProgress() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return {};

            const progress = JSON.parse(stored);
            if (!progress || typeof progress !== 'object' || Array.isArray(progress)) {
                console.warn('Le suivi des victoires bot enregistré est invalide.');
                return null;
            }
            return progress;
        } catch (error) {
            console.warn('Impossible de lire le suivi des victoires bot.', error);
            return null;
        }
    },

    render() {
        const progress = this.readProgress();
        if (!progress) return;

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

    normalizeColor(value) {
        const normalized = String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/ß/g, 'ss');

        if (normalized.includes('white') || normalized.includes('blanc') || normalized.includes('weiss')) return 'white';
        if (normalized.includes('black') || normalized.includes('noir') || normalized.includes('negra') || normalized.includes('schwarz')) return 'black';
        return null;
    },

    recordVictory(winnerColor) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') !== 'bot') return false;

        const level = params.get('level');
        const playerColor = this.normalizeColor(params.get('color'));
        const normalizedWinner = this.normalizeColor(winnerColor);
        if (!/^\d+$/.test(level || '') || !playerColor || normalizedWinner !== playerColor) return false;

        const requestedColor = params.get('trainingColor');
        const trainingType = this.types.includes(requestedColor) ? requestedColor : playerColor;
        const progress = this.readProgress();
        if (!progress) return false;

        const levelProgress = progress[level]
            && typeof progress[level] === 'object'
            && !Array.isArray(progress[level])
            ? progress[level]
            : {};
        if (levelProgress[trainingType] === true) return false;

        levelProgress[trainingType] = true;
        progress[level] = levelProgress;

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(progress));
            return true;
        } catch (error) {
            console.warn('Impossible de sauvegarder la victoire bot.', error);
            return false;
        }
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
