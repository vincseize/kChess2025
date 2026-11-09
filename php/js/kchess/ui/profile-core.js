/**
 * js/ui/profile-core.js
 * Noyau partagé : constantes, helpers, levels, échiquier.
 * Doit être chargé AVANT les 3 vues et profile.js
 */

const ProfilePage = {
    // ── Constantes ──
    STORAGE_KEY: 'kchess.botTrainingProgress.v1',
    FIDE_KEY: 'kchess.profile.fideId',
    HISTORY_KEY: 'kchess.profile.searches',
    HISTORY_MAX: 20,
    CLUBS_KEY: 'kchess.clubs.v1',
    mode: 'player',

    // ── État des parties ──
    GAMES: [], gameIdx: 0, ply: 0, timer: null,
    modalOpen: false, modalPlaying: false, modalTimer: null,
    START: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',

    // ── Textes (surchargés par window.PROFILE_I18N) ──
    T: Object.assign({
        loading: 'Recherche en cours…', not_found: 'Aucun joueur trouvé.',
        error: 'Service FIDE indisponible. Réessayez plus tard.',
        pick: 'Plusieurs joueurs trouvés, choisissez :',
        born: 'Né(e) en', federation: 'Fédération', title: 'Titre',
        standard: 'Standard', rapid: 'Rapide', blitz: 'Blitz',
        inactive: 'Inactif', history: 'Classement standard',
        unrated: '—', fide_id: 'Code FIDE', photo_credit: 'Photo',
        pf_recent: 'Recherches récentes', pf_clear_all: 'Tout effacer',
        pf_delete: 'Supprimer cette recherche',
        pf_other_games: 'Autres parties', pf_zoom: 'Voir en grand',
        pf_close: 'Fermer', pf_play: 'Lecture', pf_pause: 'Pause',
        pf_prev: 'Coup précédent', pf_next: 'Coup suivant',
        pf_start: 'Début', pf_end: 'Fin',
        pf_clear_confirm: 'Effacer toutes les recherches récentes ?',
        pf_club: 'Club', pf_club_players: 'joueurs',
        pf_club_none: 'Aucun club trouvé.',
        pf_club_pick: 'Plusieurs clubs trouvés, choisissez :',
        pf_club_empty: 'Aucun joueur dans ce club pour le moment.',
        pf_add_game: 'Ajouter une partie', pf_add_saved: 'Partie ajoutée.',
        pf_add_err_empty: 'Collez les coups de la partie (PGN).',
        pf_add_err_fields: 'Renseignez le nom de la partie et les joueurs.',
        pf_add_err_move: 'Coup impossible n°{ply} : {move}',
        pf_add_err_save: 'Enregistrement impossible.'
    }, window.PROFILE_I18N || {}),

    // ═══════════════════════════════════════════════════════════
    // HELPERS GÉNÉRIQUES
    // ═══════════════════════════════════════════════════════════

    norm(str) {
        return String(str || '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().trim();
    },

    note(text, cls) {
        const p = document.createElement('p');
        p.className = 'profile-fide-note' + (cls ? ' ' + cls : '');
        p.textContent = text;
        return p;
    },

    // ═══════════════════════════════════════════════════════════
    // LEVELS (utilisé par Mon profil)
    // ═══════════════════════════════════════════════════════════

    getTrainingState() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
        } catch (e) { return {}; }
    },

    isLevelComplete(entry) {
        return !!(entry && typeof entry === 'object'
            && entry.white === true && entry.black === true && entry.random === true);
    },

    getMaxLevelFromDOM() {
        const list = [...document.querySelectorAll('.game-mode-btn[data-mode="bot"]')]
            .map(btn => parseInt(btn.dataset.level, 10))
            .filter(n => !isNaN(n) && n > 0);
        return list.length ? Math.max(...list) : 16;
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
        this.renderHeroBadges();
        if (empty) empty.hidden = completed.length > 0;
        list.hidden = completed.length === 0;
    },

    // Badges des levels terminés, sous le texte du hero (toutes les vues)
    renderHeroBadges() {
        const state = this.getTrainingState();
        const done = Object.keys(state)
            .map(k => parseInt(k, 10))
            .filter(n => !isNaN(n) && n > 0 && this.isLevelComplete(state[String(n)]))
            .sort((a, b) => a - b);
        document.querySelectorAll('.profile-hero-badges').forEach(box => {
            box.innerHTML = '';
            box.hidden = done.length === 0;
            done.forEach(n => {
                const b = document.createElement('span');
                b.className = 'profile-level-badge';
                b.title = 'Level ' + n + ' terminé';
                b.textContent = 'L' + n;
                box.appendChild(b);
            });
        });
    },

    // ═══════════════════════════════════════════════════════════
    // LISTES PARTAGÉES (config/players.json, config/clubs.json)
    // Lecture : tout le monde. Écriture : localhost uniquement.
    // ═══════════════════════════════════════════════════════════

    async saveShared(kind, list) {
        if (!window.PROFILE_LOCAL) return { ok: false, error: 'forbidden' };
        try {
            const res = await fetch('data_save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kind, list })
            });
            const data = await res.json();
            if (!data.ok) return { ok: false, error: data.error || 'error' };
            if (kind === 'players') window.PROFILE_PLAYERS = data.list;
            else window.PROFILE_CLUBS = data.list;
            return { ok: true, list: data.list };
        } catch (e) { return { ok: false, error: 'network' }; }
    },

    get PLAYERS() {
        return Array.isArray(window.PROFILE_PLAYERS) ? window.PROFILE_PLAYERS.filter(p => p && p.name) : [];
    },

    // Ajoute / met à jour un joueur dans players.json (localhost)
    async upsertSharedPlayer(player) {
        if (!window.PROFILE_LOCAL || !player || !player.id) return false;
        const list = this.PLAYERS.map(p => ({ ...p }));
        const fide = String(player.id);
        const entry = { fide, name: player.name, federation: player.federation || '' };
        const i = list.findIndex(p => String(p.fide) === fide);
        if (i >= 0) list[i] = { ...list[i], ...entry }; else list.push(entry);
        return (await this.saveShared('players', list)).ok;
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
            } catch (e) {}
            if (typeof BotTrainingProgress !== 'undefined' && typeof BotTrainingProgress.render === 'function') {
                BotTrainingProgress.render();
            }
            this.renderLevels();
        });
    },

    // ═══════════════════════════════════════════════════════════
    // ÉCHIQUIER (utilisé par Joueurs)
    // ═══════════════════════════════════════════════════════════

    isValidGame(g) {
        return !!(g && Array.isArray(g.uci) && Array.isArray(g.san) &&
            g.uci.length >= 2 && g.uci.length === g.san.length &&
            g.uci.every(m => typeof m === 'string' && /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(m)));
    },

    startPosition() {
        const pos = new Array(64).fill('');
        this.START.split('/').forEach((row, r) => {
            let c = 0;
            for (const ch of row) {
                if (/\d/.test(ch)) { c += parseInt(ch, 10); continue; }
                const color = ch === ch.toUpperCase() ? 'w' : 'b';
                pos[r * 8 + c] = color + ch.toUpperCase();
                c++;
            }
        });
        return pos;
    },

    sqIndex(sq) { return (8 - parseInt(sq[1], 10)) * 8 + (sq.charCodeAt(0) - 97); },

    applyMove(pos, uci) {
        if (typeof uci !== 'string' || uci.length < 4) return;
        const from = this.sqIndex(uci.slice(0, 2));
        const to = this.sqIndex(uci.slice(2, 4));
        const piece = pos[from];
        if (!piece) return;
        const type = piece[1];
        const color = piece[0];
        if (type === 'P' && (from % 8) !== (to % 8) && !pos[to]) {
            pos[to + (color === 'w' ? 8 : -8)] = '';
        }
        if (type === 'K' && Math.abs((to % 8) - (from % 8)) === 2) {
            const row = Math.floor(from / 8) * 8;
            if (to % 8 === 6) { pos[row + 5] = pos[row + 7]; pos[row + 7] = ''; }
            else { pos[row + 3] = pos[row + 0]; pos[row + 0] = ''; }
        }
        pos[to] = piece;
        pos[from] = '';
        if (uci.length === 5) pos[to] = color + uci[4].toUpperCase();
    },

    positionAt(game, ply) {
        if (!game || !Array.isArray(game.uci)) return this.startPosition();
        const pos = this.startPosition();
        const max = Math.min(ply, game.uci.length);
        for (let i = 0; i < max; i++) {
            const m = game.uci[i];
            if (typeof m !== 'string') break;
            this.applyMove(pos, m);
        }
        return pos;
    },

    drawBoard(container, game, ply) {
        if (!container || !game || !Array.isArray(game.uci)) return;
        const pos = this.positionAt(game, ply);
        const last = ply > 0 && ply <= game.uci.length ? game.uci[ply - 1] : null;
        const hl = (typeof last === 'string' && last.length >= 4)
            ? [this.sqIndex(last.slice(0, 2)), this.sqIndex(last.slice(2, 4))]
            : [];
        container.innerHTML = '';
        for (let i = 0; i < 64; i++) {
            const r = Math.floor(i / 8), c = i % 8;
            const sq = document.createElement('div');
            sq.className = 'pb-sq ' + ((r + c) % 2 === 0 ? 'is-light' : 'is-dark') + (hl.includes(i) ? ' is-last' : '');
            sq.dataset.sq = String.fromCharCode(97 + c) + (8 - r);
            if (pos[i]) {
                const img = document.createElement('img');
                img.src = 'img/chesspieces/wikipedia/' + pos[i] + '.png';
                img.alt = '';
                img.draggable = false;
                sq.dataset.p = pos[i];
                sq.appendChild(img);
            }
            container.appendChild(sq);
        }
    }
};

window.ProfilePage = ProfilePage;