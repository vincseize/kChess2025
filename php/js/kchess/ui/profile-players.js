/**
 * js/ui/profile-players.js
 * Vue "Joueurs" : recherche FIDE, historique, parties animées.
 * Dépend de profile-core.js
 */

Object.assign(ProfilePage, {

    // Stockage temporaire de l'historique du joueur pour changer de courbe
    currentPlayerHistory: null,

    // ── Zone FIDE ──
    get fideBox() { return document.getElementById('profileFide'); },
    setBox(node) {
        const box = this.fideBox;
        if (!box) return;
        box.innerHTML = '';
        if (node) { box.appendChild(node); box.hidden = false; }
        else box.hidden = true;
    },
    clearFide() { this.setBox(null); },

    // ── NOUVEAU : Chargement direct (via URL ?fide=...) ──
    initDirectPlayerView(id) {
        const searchContainer = document.getElementById('profileSearchContainer');
        if (searchContainer) searchContainer.hidden = true;

        this.loadPlayer(id, true);

        const titleEl = document.getElementById('profile-title-players');
        const descEl = document.querySelector('#profileViewPlayers .hero-description');
        const kickerEl = document.querySelector('#profileViewPlayers .hero-kicker');

        if (kickerEl) kickerEl.innerHTML = 'Profil joueur<br>App Chess Club training';
        if (titleEl) titleEl.innerHTML = 'Mon Profil,<br><span>Chargement…</span>';
        if (descEl) descEl.textContent = "Voici la fiche détaillée de ce joueur.";
    },

    // ── Barre de recherche FIDE ──
    bindSearch() {
        const input = document.getElementById('profileSearchInput');
        const clearBtn = document.getElementById('profileSearchClear');
        if (!input) return;
        const updateClear = () => { if (clearBtn) clearBtn.hidden = input.value.length === 0; };
        input.addEventListener('input', updateClear);
        updateClear();
        if (clearBtn) clearBtn.addEventListener('click', () => {
            input.value = '';
            input.focus();
            updateClear();
            this.clearFide();
        });
        const goBtn = document.getElementById('profileSearchBtn');
        if (goBtn) goBtn.addEventListener('click', () => {
            const q = input.value.trim();
            if (q) this.search(q); else input.focus();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const q = input.value.trim();
                if (!q) return;
                this.search(q);
            }
        });
    },

    // ── Recherche FIDE ──
    async search(q) {
        this.addHistory({ q: String(q), ts: Date.now() }, 'player');
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
            
            // On sauvegarde l'historique pour les boutons de graphique
            this.currentPlayerHistory = data.history;

            this.renderPlayer(data.player, data.history);
            
            // Mise à jour du titre si on est arrivé par un lien direct
            if (window.PROFILE_TARGET_ID) {
                const titleEl = document.getElementById('profile-title-players');
                if (titleEl) {
                    titleEl.innerHTML = `Mon Profil,<br><span>${data.player.name}</span>`;
                }
            }

            try { localStorage.setItem(this.FIDE_KEY, String(data.player.id)); } catch (e) {}
            if (!silent) this.addHistory(data.player, 'player');
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
        const h = document.createElement('h3'); h.textContent = p.name || '';
        const sub = document.createElement('p');
        sub.textContent = [p.title, p.federation, p.year ? this.T.born + ' ' + p.year : null].filter(Boolean).join(' · ');
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
                const a = document.createElement('a');
                a.href = 'club.php?nom=' + encodeURIComponent(c.name);
                a.className = 'profile-fide-club-link';
                a.textContent = c.name;
                cp.appendChild(a);
            });
            who.appendChild(cp);
        }

        if (window.PROFILE_LOCAL) {
            const affiliate = document.createElement('button');
            affiliate.type = 'button';
            affiliate.className = 'profile-fide-affiliate';
            affiliate.innerHTML = '<i class="bi bi-plus-circle" aria-hidden="true"></i> Affilier à un club';
            affiliate.addEventListener('click', () => this.openAffiliateDialog(p));
            who.appendChild(affiliate);

            const setMe = document.createElement('button');
            setMe.type = 'button';
            setMe.className = 'profile-fide-affiliate';
            setMe.style.marginLeft = '6px';
            setMe.innerHTML = '<i class="bi bi-person-check" aria-hidden="true"></i> C’est moi';
            setMe.addEventListener('click', () => {
                try { 
                    localStorage.setItem(this.FIDE_KEY, String(p.id)); 
                    localStorage.setItem('kchess.myProfilePlayer', JSON.stringify({
                        name: p.name, fide: String(p.id), title: p.title || '', federation: p.federation || '',
                        standard: p.standard || null, rapid: p.rapid || null, blitz: p.blitz || null
                    }));
                } catch (e) {}
                alert(`« ${p.name} » est maintenant associé à votre profil.`);
            });
            who.appendChild(setMe);
        }

        head.appendChild(who);
        card.appendChild(head);

        // ── Nouveau : Boutons de classement cliquables ──
        const grid = document.createElement('div');
        grid.className = 'profile-fide-ratings';
        
        const modes = [
            { key: 'standard', label: this.T.standard },
            { key: 'rapid', label: this.T.rapid },
            { key: 'blitz', label: this.T.blitz }
        ];

        modes.forEach((m, index) => {
            const cell = document.createElement('button');
            cell.type = 'button';
            // On ajoute une classe 'is-active' au premier (standard) par défaut
            cell.className = 'profile-fide-rating' + (index === 0 ? ' is-active' : '');
            cell.dataset.mode = m.key;
            cell.style.border = 'none';
            cell.style.cursor = 'pointer';
            cell.style.background = 'var(--site-surface)'; // Reprend le style existant

            const v = document.createElement('strong'); 
            v.textContent = p[m.key] ? String(p[m.key]) : this.T.unrated;
            const l = document.createElement('span'); 
            l.textContent = m.label;
            
            cell.append(v, l);

            // Action au clic
            cell.addEventListener('click', () => {
                // Retirer la classe 'is-active' de tous les boutons
                grid.querySelectorAll('.profile-fide-rating').forEach(btn => btn.classList.remove('is-active'));
                // Ajouter au bouton cliqué
                cell.classList.add('is-active');
                // Redessiner le graphique pour ce mode
                this.updateChart(m.key);
            });

            grid.appendChild(cell);
        });
        card.appendChild(grid);

        // ── Le graphique (initialisé par défaut avec Standard) ──
        const chartContainer = document.createElement('div');
        chartContainer.className = 'profile-fide-chart';
        const cap = document.createElement('span'); 
        cap.textContent = this.T.history + ' (' + this.T.standard + ')';
        const chartSvg = this.sparkline(history && history.standard);
        if (chartSvg) {
            chartContainer.append(cap, chartSvg);
        } else {
            chartContainer.style.display = 'none'; // Cacher si pas de données
        }
        card.appendChild(chartContainer);

        // Stockage de référence pour updateChart
        this.chartContainer = chartContainer;
        this.chartCaption = cap;

        if (p.photo && p.photo.credit) {
            const c = document.createElement('p');
            c.className = 'profile-fide-credit';
            c.textContent = this.T.photo_credit + ' : ' + p.photo.credit;
            card.appendChild(c);
        }
        this.setBox(card);
    },

    // ── Nouvelle fonction pour mettre à jour le graphique ──
    updateChart(mode) {
        if (!this.chartContainer) return;
        
        const modeLabels = {
            standard: this.T.standard,
            rapid: this.T.rapid,
            blitz: this.T.blitz
        };

        // Mettre à jour le sous-titre
        if (this.chartCaption) {
            this.chartCaption.textContent = this.T.history + ' (' + modeLabels[mode] + ')';
        }

        // Supprimer l'ancien SVG
        const oldSvg = this.chartContainer.querySelector('svg');
        if (oldSvg) oldSvg.remove();

        // Générer le nouveau
        const data = this.currentPlayerHistory && this.currentPlayerHistory[mode];
        const newSvg = this.sparkline(data);
        
        if (newSvg) {
            this.chartContainer.appendChild(newSvg);
            this.chartContainer.style.display = 'block';
        } else {
            this.chartContainer.style.display = 'none';
        }
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
        svg.setAttribute('aria-label', `${first.m}/${first.y} ${first.r} → ${last.m}/${last.y} ${last.r}`);
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

    // ── Historique (inchangé) ──
    readHistory() {
        try {
            const raw = localStorage.getItem(this.HISTORY_KEY);
            if (!raw) return { player: [], club: [] };
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return { player: parsed.filter(x => x && (x.id || x.q)), club: [] };
            return {
                player: Array.isArray(parsed.player) ? parsed.player.filter(x => x && (x.id || x.q)) : [],
                club:   Array.isArray(parsed.club)   ? parsed.club.filter(x => x && (x.q || x.name))   : []
            };
        } catch (e) { return { player: [], club: [] }; }
    },

    writeHistory(data) {
        try {
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify({
                player: (data.player || []).slice(0, this.HISTORY_MAX),
                club:   (data.club   || []).slice(0, this.HISTORY_MAX)
            }));
        } catch (e) {}
    },

    addHistory(entry, kind) {
        if (!entry) return;
        kind = kind === 'club' ? 'club' : 'player';
        const data = this.readHistory();
        const list = data[kind] || [];
        const key = entry.id ? ('id:' + entry.id) : ('q:' + String(entry.q || '').toLowerCase());
        const filtered = list.filter(x => {
            const k = x.id ? ('id:' + x.id) : ('q:' + String(x.q || '').toLowerCase());
            return k !== key;
        });
        filtered.unshift({
            id: entry.id ? String(entry.id) : null,
            name: entry.name || null,
            federation: entry.federation || '',
            q: entry.q || null,
            ts: Date.now()
        });
        data[kind] = filtered;
        this.writeHistory(data);
        this.renderHistory();
    },

    removeHistory(entry, kind) {
        kind = kind === 'club' ? 'club' : 'player';
        const data = this.readHistory();
        data[kind] = (data[kind] || []).filter(x => {
            if (entry.id) return String(x.id) !== String(entry.id);
            return String(x.q || '').toLowerCase() !== String(entry.q || '').toLowerCase();
        });
        if (entry.id) {
            try {
                if (localStorage.getItem(this.FIDE_KEY) === String(entry.id)) {
                    localStorage.removeItem(this.FIDE_KEY);
                }
            } catch (e) {}
        }
        this.writeHistory(data);
        this.renderHistory();
    },

    renderHistory() {
        const box = document.getElementById('profileHistory');
        if (!box) return;
        const data = this.readHistory();
        const list = data[this.mode] || [];
        box.innerHTML = '';
        box.hidden = list.length === 0 || this.mode === 'club';
        if (!list.length || this.mode === 'club') return;
        const head = document.createElement('div');
        head.className = 'profile-history-head';
        const h = document.createElement('span'); h.textContent = this.T.pf_recent;
        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'profile-history-clear';
        clear.textContent = this.T.pf_clear_all;
        clear.addEventListener('click', () => {
            if (window.confirm(this.T.pf_clear_confirm)) {
                const current = this.readHistory();
                current.player = [];
                this.writeHistory(current);
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
            name.textContent = item.name || item.q || '';
            const meta = document.createElement('small');
            meta.textContent = [item.federation, item.id].filter(Boolean).join(' · ');
            open.append(name, meta);
            open.addEventListener('click', () => {
                const input = document.getElementById('profileSearchInput');
                const query = item.id || item.q || '';
                if (input) { input.value = query; input.dispatchEvent(new Event('input')); }
                if (item.id) this.loadPlayer(item.id);
                else if (item.q) this.search(item.q);
            });
            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'profile-history-del';
            del.title = this.T.pf_delete;
            del.setAttribute('aria-label', this.T.pf_delete + ' : ' + (item.name || item.q));
            del.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
            del.addEventListener('click', () => this.removeHistory(item, 'player'));
            li.append(open, del);
            ul.appendChild(li);
        });
        box.append(head, ul);
    },

    // ── Parties animées ──
    initGames() {
        const raw = Array.isArray(window.PROFILE_PARTIES) ? window.PROFILE_PARTIES : [];
        this.GAMES = raw.filter(g => this.isValidGame(g));
        if (this.GAMES.length !== raw.length) {
            console.warn(`⚠️ ${raw.length - this.GAMES.length} partie(s) invalide(s) ignorée(s)`);
        }
        const board = document.getElementById('profileBoard');
        if (!board || !this.GAMES.length) {
            const preview = document.querySelector('.profile-board-preview');
            if (preview) preview.hidden = true;
            return;
        }
        this.gameIdx = 0;
        this.renderGameList();
        this.selectGame(0);
        const zoom = document.getElementById('profileBoardZoom');
        if (zoom) zoom.addEventListener('click', () => this.openModal());
        this.bindModal();
    },

    gameTitle(g) {
        const lang = window.PROFILE_LANG || 'fr';
        return (g.title && (g.title[lang] || g.title.fr)) || g.id || 'Partie';
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
            const t = document.createElement('span'); t.textContent = this.gameTitle(g);
            const m = document.createElement('small'); m.textContent = g.year;
            b.append(t, m);
            b.addEventListener('click', () => this.selectGame(i));
            li.appendChild(b);
            ul.appendChild(li);
        });
    },

    selectGame(i) {
        this.gameIdx = i;
        const g = this.GAMES[i]; if (!g) return;
        document.querySelectorAll('.profile-game-item').forEach(b =>
            b.classList.toggle('is-active', parseInt(b.dataset.idx, 10) === i));
        const title = document.getElementById('profileGameTitle');
        const year = document.getElementById('profileGameYear');
        const who = document.getElementById('profileGamePlayers');
        if (title) title.textContent = this.gameTitle(g);
        if (year) year.textContent = g.year;
        if (who) who.textContent = g.players + (g.place ? ' · ' + g.place : '');
        this.ply = 0; this.drawMain(); this.startAutoplay();
        if (this.modalOpen) this.drawModal();
    },

    drawMain() {
        const board = document.getElementById('profileBoard');
        const g = this.GAMES[this.gameIdx];
        if (board && g) this.drawBoard(board, g, this.ply);
    },

    startAutoplay() {
        clearInterval(this.timer);
        const g = this.GAMES[this.gameIdx];
        if (!g || !Array.isArray(g.uci)) return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.ply = g.uci.length; this.drawMain(); return;
        }
        this.timer = setInterval(() => {
            if (this.modalOpen) return;
            const game = this.GAMES[this.gameIdx];
            if (!game || !Array.isArray(game.uci)) return;
            if (this.ply >= game.uci.length + 3) this.ply = 0; else this.ply++;
            this.drawMain();
        }, 1100);
    },

    // ── Modale ──
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
        this.modalOpen = true; modal.hidden = false;
        document.body.classList.add('profile-modal-open');
        this.modalPlaying = true; this.drawModal(); this.modalSchedule();
        modal.querySelector('[data-act="close"]').focus();
    },

    closeModal() {
        const modal = document.getElementById('profileGameModal');
        if (!modal) return;
        this.modalOpen = false; this.modalPlaying = false;
        clearTimeout(this.modalTimer);
        modal.hidden = true;
        document.body.classList.remove('profile-modal-open');
        this.drawMain();
        document.getElementById('profileBoardZoom')?.focus();
    },

    modalGo(ply, manual) {
        const g = this.GAMES[this.gameIdx]; if (!g) return;
        this.ply = Math.max(0, Math.min(g.uci.length, ply));
        if (manual) { this.modalPlaying = false; clearTimeout(this.modalTimer); }
        this.drawModal();
    },

    modalTogglePlay() {
        const g = this.GAMES[this.gameIdx]; if (!g) return;
        this.modalPlaying = !this.modalPlaying;
        if (this.modalPlaying && this.ply >= g.uci.length) this.ply = 0;
        this.drawModal(); this.modalSchedule();
    },

    modalSchedule() {
        clearTimeout(this.modalTimer);
        if (!this.modalOpen || !this.modalPlaying) return;
        this.modalTimer = setTimeout(() => {
            const g = this.GAMES[this.gameIdx]; if (!g) return;
            if (this.ply >= g.uci.length) { this.modalPlaying = false; this.drawModal(); return; }
            this.ply++; this.drawModal(); this.modalSchedule();
        }, 1200);
    },

    drawModal() {
        const modal = document.getElementById('profileGameModal');
        const g = this.GAMES[this.gameIdx];
        if (!modal || !g) return;
        this.drawBoard(modal.querySelector('.profile-modal-board'), g, this.ply);
        modal.querySelector('.profile-modal-title').textContent = this.gameTitle(g) + ' · ' + g.year;
        modal.querySelector('.profile-modal-players').textContent =
            g.players + (g.place ? ' · ' + g.place : '') + ' · ' + g.result;
        const n = this.ply;
        let txt = '';
        if (n > 0 && Array.isArray(g.san) && g.san[n - 1]) {
            const moveNo = Math.floor((n - 1) / 2) + 1;
            txt = moveNo + ((n - 1) % 2 === 0 ? '. ' : '... ') + g.san[n - 1];
        }
        modal.querySelector('.profile-modal-move').textContent = txt || ' ';
        modal.querySelector('.profile-modal-count').textContent = n + ' / ' + g.uci.length;
        const play = modal.querySelector('[data-act="play"]');
        play.innerHTML = '<i class="bi ' + (this.modalPlaying ? 'bi-pause-fill' : 'bi-play-fill') + '" aria-hidden="true"></i>';
        play.title = play.ariaLabel = this.modalPlaying ? this.T.pf_pause : this.T.pf_play;
    },

    // ── Affiliation joueur → club (Appel serveur JSON) ──
    async openAffiliateDialog(player) {
        const clubs = this.CLUBS;
        if (!clubs.length) {
            alert('Aucun club disponible.');
            return;
        }
        const names = clubs.map(c => c.name);
        const choice = window.prompt(
            'Affilier ce joueur à quel club ?\n\n' +
            names.map((n, i) => `${i + 1}. ${n}`).join('\n') +
            '\n\nEntrez le numéro :',
            '1'
        );
        if (!choice) return;
        const idx = parseInt(choice, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= clubs.length) {
            alert('Numéro invalide.');
            return;
        }
        const clubName = clubs[idx].name;
        
        try {
            const res = await fetch('save_club.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clubName: clubName,
                    player: { name: player.name, fide: String(player.id) }
                })
            });
            const data = await res.json();
            
            if (data.ok) {
                alert(`✅ « ${player.name} » a été ajouté au club « ${clubName} » dans clubs.json.`);
                window.location.reload();
            } else {
                alert('Erreur serveur : ' + (data.error || 'Inconnue'));
            }
        } catch (e) {
            alert('Impossible de contacter le serveur pour enregistrer dans le JSON.');
        }
    },

    // ── Ajout de partie ──
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
            e.preventDefault(); say('');
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
                if (this.isValidGame(data.game)) {
                    this.GAMES.push(data.game);
                    window.PROFILE_PARTIES = this.GAMES;
                    this.renderGameList();
                    this.selectGame(this.GAMES.length - 1);
                }
                form.reset(); close();
            } catch (err) { say(this.T.pf_add_err_save, true); }
        });
    }
});