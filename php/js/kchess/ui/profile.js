/**
 * js/ui/profile.js
 * v1.6.0 - Recherche FIDE (code ou nom) + recherche par club + historique + parties (échiquier)
 *          + ajout d'une partie (localhost uniquement)
 * La progression des levels reste en lecture seule ; seul le reset global l'efface.
 */

const ProfilePage = {
    STORAGE_KEY: 'kchess.botTrainingProgress.v1',
    FIDE_KEY: 'kchess.profile.fideId',
    HISTORY_KEY: 'kchess.profile.searches',
    HISTORY_MAX: 20,
    mode: 'player',

    // Textes (surchargés par window.PROFILE_I18N venant de profile.php)
    T: Object.assign({
        loading: 'Recherche en cours…',
        not_found: 'Aucun joueur trouvé.',
        error: 'Service FIDE indisponible. Réessayez plus tard.',
        pick: 'Plusieurs joueurs trouvés, choisissez :',
        born: 'Né(e) en',
        federation: 'Fédération',
        title: 'Titre',
        standard: 'Standard',
        rapid: 'Rapide',
        blitz: 'Blitz',
        inactive: 'Inactif',
        history: 'Classement standard',
        unrated: '—',
        fide_id: 'Code FIDE',
        photo_credit: 'Photo',
        pf_recent: 'Recherches récentes',
        pf_clear_all: 'Tout effacer',
        pf_delete: 'Supprimer cette recherche',
        pf_other_games: 'Autres parties',
        pf_zoom: 'Voir en grand',
        pf_close: 'Fermer',
        pf_play: 'Lecture',
        pf_pause: 'Pause',
        pf_prev: 'Coup précédent',
        pf_next: 'Coup suivant',
        pf_start: 'Début',
        pf_end: 'Fin',
        pf_clear_confirm: 'Effacer toutes les recherches récentes ?',
        pf_search_by: 'Rechercher par',
        pf_mode_player: 'Joueur',
        pf_mode_club: 'Club',
        pf_club: 'Club',
        pf_club_placeholder: 'Nom du club',
        pf_club_hint: 'Tapez le nom d\'un club (ou laissez vide pour tous les clubs), puis Entrée.',
        pf_club_none: 'Aucun club trouvé.',
        pf_club_pick: 'Plusieurs clubs trouvés, choisissez :',
        pf_club_empty: 'Aucun joueur dans ce club pour le moment (config/clubs.json).',
        pf_club_players: 'joueurs',
        pf_add_game: 'Ajouter une partie',
        pf_add_saved: 'Partie ajoutée.',
        pf_add_err_empty: 'Collez les coups de la partie (PGN).',
        pf_add_err_fields: 'Renseignez le nom de la partie et les joueurs.',
        pf_add_err_move: 'Coup impossible n°{ply} : {move}',
        pf_add_err_save: 'Enregistrement impossible.'
    }, window.PROFILE_I18N || {}),

    init() {
        this.bindSearch();
        this.bindResetAll();
        this.renderLevels();
        this.bindMode();
        this.renderHistory();
        this.initGames();
        this.initAddGame();
        this.restoreLastPlayer();
        console.log('👤 ProfilePage v1.6.0 initialisée');
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
                this.clearFide();
            });
        }

        const goBtn = document.getElementById('profileSearchBtn');
        if (goBtn) {
            goBtn.addEventListener('click', () => {
                const q = input.value.trim();
                if (this.mode === 'club') return this.searchClub(q);
                if (q) this.search(q); else input.focus();
            });
        }

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const q = input.value.trim();
                if (this.mode === 'club') return this.searchClub(q);
                if (!q) return;
                this.search(q);
            }
        });
    },

    // ─────────── FIDE ───────────

    get fideBox() { return document.getElementById('profileFide'); },

    setBox(node) {
        const box = this.fideBox;
        if (!box) return;
        box.innerHTML = '';
        if (node) { box.appendChild(node); box.hidden = false; }
        else box.hidden = true;
    },

    note(text, cls) {
        const p = document.createElement('p');
        p.className = 'profile-fide-note' + (cls ? ' ' + cls : '');
        p.textContent = text;
        return p;
    },

    clearFide() { this.setBox(null); },

    async search(q) {
        const digits = q.replace(/[\s.]/g, '');
        if (/^\d{3,10}$/.test(digits)) return this.loadPlayer(digits);
        if (q.length < 2) return;
        this.setBox(this.note(this.T.loading));
        try {
            const res = await fetch('fide.php?q=' + encodeURIComponent(q));
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || 'error');
            if (!data.results.length) return this.setBox(this.note(this.T.not_found));
            if (data.results.length === 1) return this.loadPlayer(data.results[0].id);
            this.renderPick(data.results);
        } catch (e) {
            this.setBox(this.note(this.T.error, 'is-error'));
        }
    },

    renderPick(results) {
        const wrap = document.createElement('div');
        wrap.appendChild(this.note(this.T.pick));
        const ul = document.createElement('ul');
        ul.className = 'profile-fide-pick';
        results.forEach(p => {
            const li = document.createElement('li');
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'profile-fide-pick-btn';
            const name = document.createElement('span');
            name.textContent = (p.title ? p.title + ' ' : '') + p.name;
            const meta = document.createElement('small');
            meta.textContent = [p.federation, p.standard || null].filter(Boolean).join(' · ');
            b.append(name, meta);
            b.addEventListener('click', () => this.loadPlayer(p.id));
            li.appendChild(b);
            ul.appendChild(li);
        });
        wrap.appendChild(ul);
        this.setBox(wrap);
    },

    async loadPlayer(id, silent) {
        this.setBox(this.note(this.T.loading));
        try {
            const res = await fetch('fide.php?id=' + encodeURIComponent(id));
            const data = await res.json();
            if (!data.ok) {
                if (data.error === 'not_found') return this.setBox(this.note(this.T.not_found));
                throw new Error(data.error || 'error');
            }
            this.renderPlayer(data.player, data.history);
            try { localStorage.setItem(this.FIDE_KEY, String(data.player.id)); } catch (e) {}
            if (!silent) this.addHistory(data.player);
        } catch (e) {
            this.setBox(this.note(this.T.error, 'is-error'));
        }
    },

    restoreLastPlayer() {
        let id = null;
        try { id = localStorage.getItem(this.FIDE_KEY); } catch (e) {}
        if (id && /^\d+$/.test(id)) this.loadPlayer(id, true);
    },

    renderPlayer(p, history) {
        const card = document.createElement('article');
        card.className = 'profile-fide-card';

        const head = document.createElement('header');
        head.className = 'profile-fide-head';
        const photoUrl = p.photo && (p.photo.small || p.photo.medium);
        if (photoUrl && /^https:\/\//.test(photoUrl)) {
            const img = document.createElement('img');
            img.className = 'profile-fide-photo';
            img.src = photoUrl;
            img.alt = '';
            img.width = 64; img.height = 64;
            img.referrerPolicy = 'no-referrer';
            head.appendChild(img);
        }
        const who = document.createElement('div');
        const h = document.createElement('h3');
        h.textContent = p.name || '';
        const sub = document.createElement('p');
        sub.textContent = [p.title, p.federation, p.year ? this.T.born + ' ' + p.year : null]
            .filter(Boolean).join(' · ');
        const idp = document.createElement('p');
        idp.className = 'profile-fide-id';
        idp.textContent = this.T.fide_id + ' ' + p.id + (p.inactive ? ' · ' + this.T.inactive : '');
        who.append(h, sub, idp);
        const clubs = this.clubsOfPlayer(p.id);
        if (clubs.length) {
            const cp = document.createElement('p');
            cp.className = 'profile-fide-club';
            cp.append(this.T.pf_club + ' : ');
            clubs.forEach((c, i) => {
                if (i) cp.append(', ');
                const a = document.createElement('button');
                a.type = 'button';
                a.className = 'profile-fide-club-link';
                a.textContent = c.name;
                a.addEventListener('click', () => { this.setMode('club'); this.showClub(c); });
                cp.appendChild(a);
            });
            who.appendChild(cp);
        }
        head.appendChild(who);
        card.appendChild(head);

        const grid = document.createElement('div');
        grid.className = 'profile-fide-ratings';
        [['standard', this.T.standard], ['rapid', this.T.rapid], ['blitz', this.T.blitz]].forEach(([k, label]) => {
            const cell = document.createElement('div');
            cell.className = 'profile-fide-rating';
            const v = document.createElement('strong');
            v.textContent = p[k] ? String(p[k]) : this.T.unrated;
            const l = document.createElement('span');
            l.textContent = label;
            cell.append(v, l);
            grid.appendChild(cell);
        });
        card.appendChild(grid);

        const chart = this.sparkline(history && history.standard);
        if (chart) {
            const wrap = document.createElement('div');
            wrap.className = 'profile-fide-chart';
            const cap = document.createElement('span');
            cap.textContent = this.T.history;
            wrap.append(cap, chart);
            card.appendChild(wrap);
        }

        if (p.photo && p.photo.credit) {
            const c = document.createElement('p');
            c.className = 'profile-fide-credit';
            c.textContent = this.T.photo_credit + ' : ' + p.photo.credit;
            card.appendChild(c);
        }
        this.setBox(card);
    },

    sparkline(points) {
        if (!Array.isArray(points) || points.length < 2) return null;
        const W = 300, H = 70, pad = 4;
        const vals = points.map(x => x.r);
        const min = Math.min(...vals), max = Math.max(...vals);
        const span = Math.max(1, max - min);
        const xy = points.map((x, i) => [
            pad + (i / (points.length - 1)) * (W - 2 * pad),
            H - pad - ((x.r - min) / span) * (H - 2 * pad)
        ]);
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('role', 'img');
        const first = points[0], last = points[points.length - 1];
        svg.setAttribute('aria-label',
            `${first.m}/${first.y} ${first.r} → ${last.m}/${last.y} ${last.r}`);
        const line = document.createElementNS(ns, 'polyline');
        line.setAttribute('points', xy.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '));
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', 'currentColor');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-linejoin', 'round');
        line.setAttribute('vector-effect', 'non-scaling-stroke');
        svg.appendChild(line);
        return svg;
    },

    // ─────────── Historique des recherches ───────────

    readHistory() {
        try {
            const raw = JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '[]');
            return Array.isArray(raw) ? raw.filter(x => x && x.id && x.name) : [];
        } catch (e) { return []; }
    },

    writeHistory(list) {
        try { localStorage.setItem(this.HISTORY_KEY, JSON.stringify(list.slice(0, this.HISTORY_MAX))); } catch (e) {}
    },

    addHistory(p) {
        if (!p || !p.id || !p.name) return;
        const id = String(p.id);
        const list = this.readHistory().filter(x => String(x.id) !== id);
        list.unshift({ id, name: p.name, federation: p.federation || '', ts: Date.now() });
        this.writeHistory(list);
        this.renderHistory();
    },

    removeHistory(id) {
        try { if (localStorage.getItem(this.FIDE_KEY) === String(id)) localStorage.removeItem(this.FIDE_KEY); } catch (e) {}
        this.writeHistory(this.readHistory().filter(x => String(x.id) !== String(id)));
        this.renderHistory();
    },

    renderHistory() {
        const box = document.getElementById('profileHistory');
        if (!box) return;
        const list = this.readHistory();
        box.innerHTML = '';
        box.hidden = list.length === 0;
        if (!list.length) return;

        const head = document.createElement('div');
        head.className = 'profile-history-head';
        const h = document.createElement('span');
        h.textContent = this.T.pf_recent;
        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'profile-history-clear';
        clear.textContent = this.T.pf_clear_all;
        clear.addEventListener('click', () => {
            if (window.confirm(this.T.pf_clear_confirm)) {
                this.writeHistory([]);
                try { localStorage.removeItem(this.FIDE_KEY); } catch (e) {}
                this.renderHistory();
            }
        });
        head.append(h, clear);

        const ul = document.createElement('ul');
        ul.className = 'profile-history-list';
        list.forEach(item => {
            const li = document.createElement('li');
            const open = document.createElement('button');
            open.type = 'button';
            open.className = 'profile-history-item';
            const name = document.createElement('span');
            name.textContent = item.name;
            const meta = document.createElement('small');
            meta.textContent = [item.federation, item.id].filter(Boolean).join(' · ');
            open.append(name, meta);
            open.addEventListener('click', () => {
                const input = document.getElementById('profileSearchInput');
                if (input) { input.value = item.id; input.dispatchEvent(new Event('input')); }
                this.loadPlayer(item.id);
            });
            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'profile-history-del';
            del.title = this.T.pf_delete;
            del.setAttribute('aria-label', this.T.pf_delete + ' : ' + item.name);
            del.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
            del.addEventListener('click', () => this.removeHistory(item.id));
            li.append(open, del);
            ul.appendChild(li);
        });
        box.append(head, ul);
    },

    // ─────────── Parties (échiquier non incliné) ───────────

    GAMES: [],
    gameIdx: 0,
    ply: 0,
    timer: null,
    modalOpen: false,
    modalPlaying: false,

    START: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',

    initGames() {
        this.GAMES = Array.isArray(window.PROFILE_PARTIES) ? window.PROFILE_PARTIES : [];
        const board = document.getElementById('profileBoard');
        if (!board || !this.GAMES.length) return;
        this.gameIdx = 0;
        this.renderGameList();
        this.selectGame(0);

        const zoom = document.getElementById('profileBoardZoom');
        if (zoom) zoom.addEventListener('click', () => this.openModal());
        this.bindModal();
    },

    gameTitle(g) {
        const lang = window.PROFILE_LANG || 'fr';
        return (g.title && (g.title[lang] || g.title.fr)) || g.id;
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
        return pos; // index = ligne (0 = rangée 8) * 8 + colonne (0 = a)
    },

    sqIndex(sq) { return (8 - parseInt(sq[1], 10)) * 8 + (sq.charCodeAt(0) - 97); },

    applyMove(pos, uci) {
        const from = this.sqIndex(uci.slice(0, 2));
        const to = this.sqIndex(uci.slice(2, 4));
        const piece = pos[from];
        if (!piece) return;
        const type = piece[1];
        const color = piece[0];
        // prise en passant : pion en diagonale vers une case vide
        if (type === 'P' && (from % 8) !== (to % 8) && !pos[to]) {
            pos[to + (color === 'w' ? 8 : -8)] = '';
        }
        // roque : le roi fait 2 cases, la tour suit
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
        const pos = this.startPosition();
        for (let i = 0; i < ply; i++) this.applyMove(pos, game.uci[i]);
        return pos;
    },

    drawBoard(container, game, ply) {
        const pos = this.positionAt(game, ply);
        const last = ply > 0 ? game.uci[ply - 1] : null;
        const hl = last ? [this.sqIndex(last.slice(0, 2)), this.sqIndex(last.slice(2, 4))] : [];
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
    },

    renderGameList() {
        const ul = document.getElementById('profileGamesList');
        if (!ul) return;
        ul.innerHTML = '';
        this.GAMES.forEach((g, i) => {
            const li = document.createElement('li');
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'profile-game-item' + (i === this.gameIdx ? ' is-active' : '');
            b.dataset.idx = String(i);
            const t = document.createElement('span');
            t.textContent = this.gameTitle(g);
            const m = document.createElement('small');
            m.textContent = g.year;
            b.append(t, m);
            b.addEventListener('click', () => this.selectGame(i));
            li.appendChild(b);
            ul.appendChild(li);
        });
    },

    selectGame(i) {
        this.gameIdx = i;
        const g = this.GAMES[i];
        if (!g) return;
        document.querySelectorAll('.profile-game-item').forEach(b =>
            b.classList.toggle('is-active', parseInt(b.dataset.idx, 10) === i));
        const title = document.getElementById('profileGameTitle');
        const year = document.getElementById('profileGameYear');
        const who = document.getElementById('profileGamePlayers');
        if (title) title.textContent = this.gameTitle(g);
        if (year) year.textContent = g.year;
        if (who) who.textContent = g.players + (g.place ? ' · ' + g.place : '');
        this.ply = 0;
        this.drawMain();
        this.startAutoplay();
        if (this.modalOpen) this.drawModal();
    },

    drawMain() {
        const board = document.getElementById('profileBoard');
        if (board) this.drawBoard(board, this.GAMES[this.gameIdx], this.ply);
    },

    startAutoplay() {
        clearInterval(this.timer);
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.ply = this.GAMES[this.gameIdx].uci.length;
            this.drawMain();
            return;
        }
        this.timer = setInterval(() => {
            if (this.modalOpen) return;
            const g = this.GAMES[this.gameIdx];
            if (this.ply >= g.uci.length + 3) this.ply = 0;       // petite pause à la fin
            else this.ply++;
            this.drawMain();
        }, 1100);
    },

    // — grande vue (même page) —

    bindModal() {
        const modal = document.getElementById('profileGameModal');
        if (!modal) return;
        const q = s => modal.querySelector(s);
        q('[data-act="close"]').addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', e => { if (e.target === modal) this.closeModal(); });
        q('[data-act="start"]').addEventListener('click', () => this.modalGo(0, true));
        q('[data-act="prev"]').addEventListener('click', () => this.modalGo(this.ply - 1, true));
        q('[data-act="next"]').addEventListener('click', () => this.modalGo(this.ply + 1, true));
        q('[data-act="end"]').addEventListener('click', () => this.modalGo(this.GAMES[this.gameIdx].uci.length, true));
        q('[data-act="play"]').addEventListener('click', () => this.modalTogglePlay());
        document.addEventListener('keydown', e => {
            if (!this.modalOpen) return;
            if (e.key === 'Escape') this.closeModal();
            else if (e.key === 'ArrowLeft') this.modalGo(this.ply - 1, true);
            else if (e.key === 'ArrowRight') this.modalGo(this.ply + 1, true);
            else if (e.key === ' ') { e.preventDefault(); this.modalTogglePlay(); }
        });
    },

    openModal() {
        const modal = document.getElementById('profileGameModal');
        if (!modal) return;
        this.modalOpen = true;
        modal.hidden = false;
        document.body.classList.add('profile-modal-open');
        this.modalPlaying = true;
        this.drawModal();
        this.modalSchedule();
        modal.querySelector('[data-act="close"]').focus();
    },

    closeModal() {
        const modal = document.getElementById('profileGameModal');
        if (!modal) return;
        this.modalOpen = false;
        this.modalPlaying = false;
        clearTimeout(this.modalTimer);
        modal.hidden = true;
        document.body.classList.remove('profile-modal-open');
        this.drawMain();
        document.getElementById('profileBoardZoom')?.focus();
    },

    modalGo(ply, manual) {
        const g = this.GAMES[this.gameIdx];
        this.ply = Math.max(0, Math.min(g.uci.length, ply));
        if (manual) { this.modalPlaying = false; clearTimeout(this.modalTimer); }
        this.drawModal();
    },

    modalTogglePlay() {
        const g = this.GAMES[this.gameIdx];
        this.modalPlaying = !this.modalPlaying;
        if (this.modalPlaying && this.ply >= g.uci.length) this.ply = 0;
        this.drawModal();
        this.modalSchedule();
    },

    modalSchedule() {
        clearTimeout(this.modalTimer);
        if (!this.modalOpen || !this.modalPlaying) return;
        this.modalTimer = setTimeout(() => {
            const g = this.GAMES[this.gameIdx];
            if (this.ply >= g.uci.length) { this.modalPlaying = false; this.drawModal(); return; }
            this.ply++;
            this.drawModal();
            this.modalSchedule();
        }, 1200);
    },

    drawModal() {
        const modal = document.getElementById('profileGameModal');
        if (!modal) return;
        const g = this.GAMES[this.gameIdx];
        this.drawBoard(modal.querySelector('.profile-modal-board'), g, this.ply);
        modal.querySelector('.profile-modal-title').textContent = this.gameTitle(g) + ' · ' + g.year;
        modal.querySelector('.profile-modal-players').textContent =
            g.players + (g.place ? ' · ' + g.place : '') + ' · ' + g.result;
        // dernier coup en notation : "17. Rd8#" / "16... Nxb8"
        const n = this.ply;
        let txt = '';
        if (n > 0) {
            const moveNo = Math.floor((n - 1) / 2) + 1;
            txt = moveNo + ((n - 1) % 2 === 0 ? '. ' : '... ') + g.san[n - 1];
        }
        modal.querySelector('.profile-modal-move').textContent = txt || ' ';
        const counter = modal.querySelector('.profile-modal-count');
        counter.textContent = n + ' / ' + g.uci.length;
        const play = modal.querySelector('[data-act="play"]');
        play.innerHTML = '<i class="bi ' + (this.modalPlaying ? 'bi-pause-fill' : 'bi-play-fill') + '" aria-hidden="true"></i>';
        play.title = play.ariaLabel = this.modalPlaying ? this.T.pf_pause : this.T.pf_play;
    },

    // ─────────── Clubs ───────────

    get CLUBS() { return Array.isArray(window.PROFILE_CLUBS) ? window.PROFILE_CLUBS : []; },

    norm(str) {
        return String(str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    },

    clubsOfPlayer(id) {
        const sid = String(id);
        return this.CLUBS.filter(c => (c.players || []).some(pl => pl && String(pl.fide || '') === sid));
    },

    bindMode() {
        document.querySelectorAll('.profile-mode-btn').forEach(b =>
            b.addEventListener('click', () => this.setMode(b.dataset.mode)));
    },

    setMode(mode) {
        this.mode = mode === 'club' ? 'club' : 'player';
        document.querySelectorAll('.profile-mode-btn').forEach(b => {
            const on = b.dataset.mode === this.mode;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        const input = document.getElementById('profileSearchInput');
        const hint = document.querySelector('.profile-search-hint');
        const label = document.querySelector('.profile-search-label');
        if (!this.defaults) {
            this.defaults = {
                label: label ? label.textContent.trim() : '',
                ph: input ? input.placeholder : '',
                hint: hint ? hint.lastChild.textContent : ''
            };
        }
        if (label) label.textContent = this.mode === 'club' ? this.T.pf_club_placeholder : this.defaults.label;
        if (input) input.placeholder = this.mode === 'club' ? this.T.pf_club_placeholder : this.defaults.ph;
        if (hint) hint.lastChild.textContent = ' ' + (this.mode === 'club' ? this.T.pf_club_hint : this.defaults.hint.trim());
        const hist = document.getElementById('profileHistory');
        if (hist) hist.classList.toggle('is-off', this.mode === 'club');
        this.setBox(null);
        if (input) input.focus();
    },

    searchClub(q) {
        const n = this.norm(q);
        const found = this.CLUBS.filter(c => !n || this.norm(c.name).includes(n) || this.norm(c.city).includes(n));
        if (!found.length) return this.setBox(this.note(this.T.pf_club_none));
        if (found.length === 1) return this.showClub(found[0]);
        const wrap = document.createElement('div');
        wrap.appendChild(this.note(this.T.pf_club_pick));
        const ul = document.createElement('ul');
        ul.className = 'profile-fide-pick';
        found.forEach(c => {
            const li = document.createElement('li');
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'profile-fide-pick-btn';
            const name = document.createElement('span');
            name.textContent = c.name;
            const meta = document.createElement('small');
            meta.textContent = [c.city, (c.players || []).length + ' ' + this.T.pf_club_players].filter(Boolean).join(' · ');
            b.append(name, meta);
            b.addEventListener('click', () => this.showClub(c));
            li.appendChild(b);
            ul.appendChild(li);
        });
        wrap.appendChild(ul);
        this.setBox(wrap);
    },

    async showClub(club) {
        const players = (club.players || []).filter(p => p && p.name);
        const card = document.createElement('article');
        card.className = 'profile-fide-card profile-club-card';
        const head = document.createElement('header');
        head.className = 'profile-club-head';
        const h = document.createElement('h3');
        h.textContent = club.name;
        const sub = document.createElement('p');
        sub.textContent = [club.city, players.length + ' ' + this.T.pf_club_players].filter(Boolean).join(' · ');
        head.append(h, sub);
        card.appendChild(head);

        if (!players.length) {
            card.appendChild(this.note(this.T.pf_club_empty));
            return this.setBox(card);
        }

        const ul = document.createElement('ul');
        ul.className = 'profile-club-list';
        const sorted = players.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
        const rows = {};
        sorted.forEach(pl => {
            const li = document.createElement('li');
            const btn = document.createElement(pl.fide ? 'button' : 'div');
            btn.className = 'profile-club-player';
            if (pl.fide) {
                btn.type = 'button';
                btn.addEventListener('click', () => {
                    this.setMode('player');
                    const input = document.getElementById('profileSearchInput');
                    if (input) { input.value = pl.fide; input.dispatchEvent(new Event('input')); }
                    this.loadPlayer(pl.fide);
                });
            }
            const name = document.createElement('span');
            name.textContent = pl.name;
            const meta = document.createElement('small');
            meta.textContent = pl.fide ? String(pl.fide) : '';
            btn.append(name, meta);
            li.appendChild(btn);
            ul.appendChild(li);
            if (pl.fide) rows[String(pl.fide)] = meta;
        });
        card.appendChild(ul);
        this.setBox(card);

        // Elo FIDE chargés ensuite (une seule requête, mise en cache côté serveur)
        const ids = Object.keys(rows);
        if (!ids.length) return;
        try {
            const res = await fetch('fide.php?ids=' + ids.join(','));
            const data = await res.json();
            if (!data.ok) return;
            Object.entries(data.players || {}).forEach(([id, info]) => {
                if (rows[id]) rows[id].textContent = id + (info.standard ? ' · ' + info.standard : '');
            });
        } catch (e) { /* la liste reste affichée sans les Elo */ }
    },

    // ─────────── Ajout d'une partie (localhost) ───────────

    initAddGame() {
        const btn = document.getElementById('profileAddGame');
        const modal = document.getElementById('profileAddModal');
        const form = document.getElementById('profileAddForm');
        if (!window.PROFILE_LOCAL || !btn || !modal || !form) return;

        const msg = document.getElementById('profileAddMsg');
        const say = (t, err) => { msg.textContent = t || ''; msg.classList.toggle('is-error', !!err); };
        const open = () => { say(''); modal.hidden = false; document.body.classList.add('profile-modal-open'); form.pgn.focus(); };
        const close = () => { modal.hidden = true; document.body.classList.remove('profile-modal-open'); };

        btn.addEventListener('click', open);
        modal.querySelectorAll('[data-add="close"]').forEach(b => b.addEventListener('click', close));
        modal.addEventListener('click', e => { if (e.target === modal) close(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });

        // Préremplit depuis les en-têtes du PGN (White, Black, Site, Date, Event, Result)
        form.pgn.addEventListener('blur', () => {
            if (typeof PgnParser === 'undefined') return;
            const { tags } = PgnParser.tokenize(form.pgn.value);
            const clean = v => (v && v !== '?' && !/^\?+$/.test(v)) ? v : '';
            if (!form.players.value && clean(tags.White) && clean(tags.Black)) form.players.value = clean(tags.White) + ' – ' + clean(tags.Black);
            if (!form.place.value) form.place.value = clean(tags.Site).split(',')[0] || '';
            if (!form.year.value && /^\d{4}/.test(tags.Date || '')) form.year.value = tags.Date.slice(0, 4);
            if (!form.title.value && clean(tags.Event)) form.title.value = clean(tags.Event);
            if (['1-0', '0-1', '1/2-1/2'].includes(tags.Result)) form.result.value = tags.Result;
        });

        form.addEventListener('submit', async e => {
            e.preventDefault();
            say('');
            if (!form.pgn.value.trim()) return say(this.T.pf_add_err_empty, true);
            if (!form.title.value.trim() || !form.players.value.trim()) return say(this.T.pf_add_err_fields, true);
            const parsed = PgnParser.parse(form.pgn.value);
            if (!parsed.ok) {
                return say(parsed.error === 'empty' ? this.T.pf_add_err_empty
                    : this.T.pf_add_err_move.replace('{ply}', parsed.ply).replace('{move}', parsed.move), true);
            }
            const body = {
                title: form.title.value, players: form.players.value, place: form.place.value,
                year: parseInt(form.year.value, 10) || new Date().getFullYear(),
                result: form.result.value, uci: parsed.uci, san: parsed.san
            };
            try {
                const res = await fetch('parties_save.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'kchess' },
                    body: JSON.stringify(body)
                });
                const data = await res.json();
                if (!data.ok) return say(this.T.pf_add_err_save + ' (' + (data.error || res.status) + ')', true);
                this.GAMES.push(data.game);
                window.PROFILE_PARTIES = this.GAMES;
                this.renderGameList();
                this.selectGame(this.GAMES.length - 1);
                form.reset();
                close();
            } catch (err) {
                say(this.T.pf_add_err_save, true);
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