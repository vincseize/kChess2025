/**
 * js/ui/profile.js
 * v1.3.0 - Lecture stricte de la clé réelle, aucune écriture
 */

const ProfilePage = {
    STORAGE_KEY: 'kchess.botTrainingProgress.v1',

    init() {
        this.bindSearch();
        this.bindResetAll();
        this.renderLevels();
        console.log('👤 ProfilePage v1.3.0 initialisée');
    },

    getTrainingState() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
        } catch (e) {
            console.warn('Progression illisible :', e);
            return {};
        }
    },

    isLevelComplete(entry) {
        return !!(entry && typeof entry === 'object'
            && entry.white === true && entry.black === true && entry.random === true);
    },

    getMaxLevelFromDOM() {
        const list = [...document.querySelectorAll('.game-mode-btn[data-mode="bot"]')]
            .map(btn => parseInt(btn.dataset.level, 10))
            .filter(n => !isNaN(n) && n > 0);
        return list.length ? Math.max(...list) : 0;
    },

    renderLevels() {
        const list = document.getElementById('profileLevelsList');
        const empty = document.getElementById('profileLevelsEmpty');
        const countEl = document.getElementById('profileLevelsCount');
        if (!list) return;

        const state = this.getTrainingState();
        const maxLevel = this.getMaxLevelFromDOM();

        const allLevels = new Set();
        for (let i = 1; i <= maxLevel; i++) allLevels.add(i);
        Object.keys(state).forEach(k => {
            const n = parseInt(k, 10);
            if (!isNaN(n) && n > 0) allLevels.add(n);
        });
        const levels = [...allLevels].sort((a, b) => a - b);
        const completed = levels.filter(n => this.isLevelComplete(state[String(n)]));

        list.innerHTML = '';
        completed.forEach(level => {
            const entry = state[String(level)] || {};
            const li = document.createElement('li');
            li.className = 'profile-level-item';
            li.innerHTML = `
                <span class="profile-level-badge">L${level}</span>
                <span class="profile-level-wins">
                    <span class="profile-win ${entry.white ? 'is-done' : ''}" title="Victoire Blancs">♔</span>
                    <span class="profile-win ${entry.black ? 'is-done' : ''}" title="Victoire Noirs">♚</span>
                    <span class="profile-win ${entry.random ? 'is-done' : ''}" title="Victoire Aléatoire"><i class="bi bi-shuffle"></i></span>
                </span>`;
            list.appendChild(li);
        });

        if (countEl) countEl.textContent = `${completed.length} / ${levels.length}`;
        if (empty) empty.hidden = completed.length > 0;
        list.hidden = completed.length === 0;
    },

    bindSearch() {
        const input = document.getElementById('profileSearchInput');
        const clearBtn = document.getElementById('profileSearchClear');
        if (!input) return;

        const updateClear = () => { if (clearBtn) clearBtn.hidden = input.value.length === 0; };
        input.addEventListener('input', updateClear);
        updateClear();

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                input.value = '';
                input.focus();
                updateClear();
            });
        }

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const q = input.value.trim();
                if (!q) return;
                console.log('🔍 Recherche joueur :', q);
            }
        });
    },

    bindResetAll() {
        const btn = document.getElementById('profileResetAllBtn');
        if (!btn) return;

        btn.addEventListener('click', () => {
            const ok = window.confirm(
                'Réinitialiser TOUS les levels ?\n\n' +
                'Toute votre progression sera définitivement effacée.'
            );
            if (!ok) return;

            try {
                localStorage.removeItem(this.STORAGE_KEY);
                localStorage.removeItem('kchess.selectedBotLevel');
            } catch (e) {
                console.warn('Impossible de réinitialiser la progression.', e);
            }

            if (typeof BotTrainingProgress !== 'undefined' && typeof BotTrainingProgress.render === 'function') {
                BotTrainingProgress.render();
            }
            this.renderLevels();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ProfilePage.init());