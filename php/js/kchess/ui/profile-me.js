/**
 * js/ui/profile-me.js
 * Vue "Mon profil" : recherche FIDE, association localStorage + club.
 * Dépend de profile-core.js
 */

Object.assign(ProfilePage, {

    initMeView() {
        this.renderLevels();
        this.bindResetAll();
        this.bindMeSearch();
        this.renderMeCard();
        this.renderMeClubs();
    },

    getStoredPlayer() {
        let id = null;
        try { id = localStorage.getItem(this.FIDE_KEY); } catch (e) {}
        if (!id || !/^\d+$/.test(id)) return null;
        return id;
    },

    // ── Recherche "Mon profil" ──
    bindMeSearch() {
        const input = document.getElementById('profileMeSearchInput');
        const clearBtn = document.getElementById('profileMeSearchClear');
        const goBtn = document.getElementById('profileMeSearchBtn');
        if (!input) return;

        const updateClear = () => { if (clearBtn) clearBtn.hidden = input.value.length === 0; };
        input.addEventListener('input', updateClear);
        updateClear();

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                input.value = '';
                input.focus();
                updateClear();
                this.clearMeResults();
            });
        }

        const trigger = () => this.searchMe(input.value.trim());
        if (goBtn) goBtn.addEventListener('click', trigger);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); trigger(); }
        });
    },

    clearMeResults() {
        const box = document.getElementById('profileMeResults');
        if (!box) return;
        box.innerHTML = '';
        box.hidden = true;
    },

    async searchMe(q) {
        const box = document.getElementById('profileMeResults');
        if (!box) return;
        if (!q) { this.clearMeResults(); return; }

        box.hidden = false;
        box.innerHTML = '';
        box.appendChild(this.note(this.T.loading));

        // Code FIDE (chiffres) → recherche directe
        const digits = q.replace(/[\s.]/g, '');
        if (/^\d{3,10}$/.test(digits)) {
            return this.loadMePlayer(digits);
        }
        if (q.length < 2) {
            box.innerHTML = '';
            box.appendChild(this.note('Entrez au moins 2 caractères.'));
            return;
        }

        try {
            const res = await fetch('fide.php?q=' + encodeURIComponent(q));
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || 'error');
            if (!data.results.length) {
                box.innerHTML = '';
                box.appendChild(this.note(this.T.not_found));
                return;
            }
            if (data.results.length === 1) {
                return this.loadMePlayer(data.results[0].id);
            }
            this.renderMePick(data.results);
        } catch (e) {
            box.innerHTML = '';
            box.appendChild(this.note(this.T.error, 'is-error'));
        }
    },

    renderMePick(results) {
        const box = document.getElementById('profileMeResults');
        if (!box) return;
        box.innerHTML = '';
        box.appendChild(this.note('Plusieurs joueurs trouvés, choisissez le vôtre :'));
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
            b.addEventListener('click', () => this.loadMePlayer(p.id));
            li.appendChild(b);
            ul.appendChild(li);
        });
        box.appendChild(ul);
    },

    async loadMePlayer(id) {
        const box = document.getElementById('profileMeResults');
        if (!box) return;
        box.hidden = false;
        box.innerHTML = '';
        box.appendChild(this.note(this.T.loading));

        try {
            const res = await fetch('fide.php?id=' + encodeURIComponent(id));
            const data = await res.json();
            if (!data.ok) {
                if (data.error === 'not_found') {
                    box.innerHTML = '';
                    box.appendChild(this.note(this.T.not_found));
                    return;
                }
                throw new Error(data.error || 'error');
            }
            await this.associatePlayer(data.player);
            box.innerHTML = '';
            box.appendChild(this.note(`✅ « ${data.player.name} » est maintenant associé à votre profil et ajouté au club La Dame de Bellefontaine.`));
            this.renderMeCard();
            this.renderMeClubs();
        } catch (e) {
            box.innerHTML = '';
            box.appendChild(this.note(this.T.error, 'is-error'));
        }
    },

    // ── Association : localStorage + club ──
    async associatePlayer(player) {
        if (!player || !player.id) return;

        // 1) Mon profil : toujours dans localStorage
        try { localStorage.setItem(this.FIDE_KEY, String(player.id)); } catch (e) {}

        // 2) Localhost : le joueur entre aussi dans les JSON partagés (players.json + clubs.json)
        if (window.PROFILE_LOCAL) {
            await this.upsertSharedPlayer(player);
            const CN = 'La Dame de Bellefontaine';
            const club = this.CLUBS.find(c => c.name === CN) || { name: CN, players: [] };
            const players = Array.isArray(club.players) ? club.players.slice() : [];
            if (!players.some(p => String(p.fide || '') === String(player.id))) {
                players.push({ name: player.name, fide: String(player.id) });
            }
            await this.commitClub({ ...club, players });
            return;
        }

        // 3) Visiteur : ajout au club "La Dame de Bellefontaine" dans localStorage
        const CLUB_NAME = 'La Dame de Bellefontaine';
        const local = this.readLocalClubs();
        const base = (Array.isArray(window.PROFILE_CLUBS) ? window.PROFILE_CLUBS : [])
            .find(c => c.name === CLUB_NAME);

        const existing = local.overrides[CLUB_NAME]
            || local.clubs.find(c => c.name === CLUB_NAME)
            || (base ? { ...base } : { name: CLUB_NAME, players: [] });

        existing.players = Array.isArray(existing.players) ? existing.players : [];
        const already = existing.players.some(p => String(p.fide || '') === String(player.id));
        if (!already) {
            existing.players.push({ name: player.name, fide: String(player.id) });
        }

        if (base) {
            local.overrides[CLUB_NAME] = existing;
            local.clubs = local.clubs.filter(c => c.name !== CLUB_NAME);
        } else {
            const i = local.clubs.findIndex(c => c.name === CLUB_NAME);
            if (i >= 0) local.clubs[i] = existing; else local.clubs.push(existing);
        }
        this.writeLocalClubs(local);
    },

    // ── Carte Mon profil ──
    async renderMeCard() {
        const loading = document.getElementById('profileMeLoading');
        const empty = document.getElementById('profileMeEmpty');
        const content = document.getElementById('profileMeContent');
        if (!content) return;

        const id = this.getStoredPlayer();

        if (!id) {
            if (loading) loading.hidden = true;
            if (empty) empty.hidden = false;
            content.hidden = true;
            return;
        }

        if (loading) loading.hidden = false;
        if (empty) empty.hidden = true;
        content.hidden = true;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const res = await fetch('fide.php?id=' + encodeURIComponent(id), { signal: controller.signal });
            clearTimeout(timeout);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            if (!data.ok) {
                if (loading) loading.hidden = true;
                if (empty) empty.hidden = false;
                return;
            }
            if (loading) loading.hidden = true;
            content.hidden = false;
            this.renderMePlayer(data.player, data.history);
        } catch (e) {
            clearTimeout(timeout);
            console.warn('Fiche FIDE indisponible :', e.message);
            if (loading) loading.hidden = true;
            if (empty) empty.hidden = false;
            const hint = empty && empty.querySelector('.profile-me-empty-hint');
            if (hint) hint.textContent = 'Impossible de charger la fiche FIDE. Vérifiez votre connexion.';
        }
    },

    renderMePlayer(p, history) {
        const content = document.getElementById('profileMeContent');
        if (!content) return;
        content.innerHTML = '';

        const card = document.createElement('article');
        card.className = 'profile-fide-card profile-me-player';

        const head = document.createElement('header');
        head.className = 'profile-fide-head';
        const photoUrl = p.photo && (p.photo.small || p.photo.medium);
        if (photoUrl && /^https:\/\//.test(photoUrl)) {
            const img = document.createElement('img');
            img.className = 'profile-fide-photo';
            img.src = photoUrl;
            img.alt = '';
            img.width = 72; img.height = 72;
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
        head.appendChild(who);
        card.appendChild(head);

        const grid = document.createElement('div');
        grid.className = 'profile-fide-ratings';
        [['standard', this.T.standard], ['rapid', this.T.rapid], ['blitz', this.T.blitz]].forEach(([k, label]) => {
            const cell = document.createElement('div');
            cell.className = 'profile-fide-rating';
            const v = document.createElement('strong'); v.textContent = p[k] ? String(p[k]) : this.T.unrated;
            const l = document.createElement('span'); l.textContent = label;
            cell.append(v, l); grid.appendChild(cell);
        });
        card.appendChild(grid);

        if (typeof this.sparkline === 'function') {
            const chart = this.sparkline(history && history.standard);
            if (chart) {
                const wrap = document.createElement('div');
                wrap.className = 'profile-fide-chart';
                const cap = document.createElement('span'); cap.textContent = this.T.history;
                wrap.append(cap, chart); card.appendChild(wrap);
            }
        }

        const actions = document.createElement('div');
        actions.className = 'profile-me-actions';

        const seeBtn = document.createElement('a');
        seeBtn.href = 'profile.php?view=players&fide=' + encodeURIComponent(p.id);
        seeBtn.className = 'home-feature-btn';
        seeBtn.innerHTML = '<i class="bi bi-box-arrow-up-right" aria-hidden="true"></i><span>Voir la fiche complète</span>';
        actions.appendChild(seeBtn);

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'profile-add-cancel';
        clearBtn.textContent = 'Retirer mon profil';
        clearBtn.addEventListener('click', () => {
            if (!window.confirm('Retirer ce joueur de votre profil ?')) return;
            try { localStorage.removeItem(this.FIDE_KEY); } catch (e) {}
            content.innerHTML = '';
            content.hidden = true;
            const empty = document.getElementById('profileMeEmpty');
            if (empty) empty.hidden = false;
            this.renderMeClubs();
        });
        actions.appendChild(clearBtn);

        card.appendChild(actions);
        content.appendChild(card);
    },

    renderMeClubs() {
        const box = document.getElementById('profileMeClubs');
        if (!box) return;
        box.innerHTML = '';
        const id = this.getStoredPlayer();
        if (!id) {
            const p = document.createElement('p');
            p.className = 'profile-fide-note';
            p.textContent = 'Associez un joueur à votre profil pour voir vos clubs.';
            box.appendChild(p);
            return;
        }
        const clubs = this.clubsOfPlayer(id);
        if (!clubs.length) {
            const p = document.createElement('p');
            p.className = 'profile-fide-note';
            p.textContent = 'Aucun club associé à ce joueur pour le moment.';
            box.appendChild(p);
            return;
        }
        const ul = document.createElement('ul');
        ul.className = 'profile-club-list';
        clubs.forEach(club => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = 'profile.php?view=clubs';
            a.className = 'profile-club-player';
            const name = document.createElement('span'); name.textContent = club.name;
            const meta = document.createElement('small');
            meta.textContent = [club.city, club.region, club.country].filter(Boolean).join(' · ');
            a.append(name, meta);
            li.appendChild(a);
            ul.appendChild(li);
        });
        box.appendChild(ul);
    }
});