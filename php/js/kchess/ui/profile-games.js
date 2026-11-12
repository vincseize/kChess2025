/**
 * js/kchess/ui/profile-games.js
 * Page "Mon profil" — 3 recherches + parties lues dans joueurs/{codeFIDE}.json
 *   1) Mon profil        : nom ou code FIDE → sources : JSON joueurs/, players.json, clubs.json,
 *                          localStorage, puis FIDE (fide.php). Sauvegardé en localStorage ET en JSON.
 *   2) Un autre joueur   : mêmes sources, fiche + parties connues + affiliation à un club.
 *   3) Un tournoi        : n° / lien FFE (import dans mon JSON) ou texte (tournois déjà connus).
 * À charger APRÈS profile-me.js (il remplace certaines de ses méthodes).
 */
(function () {
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    async function api(params, body) {
        const url = 'joueurs_api.php' + (body ? '' : '?' + new URLSearchParams(params));
        const opt = body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {};
        try {
            const r = await fetch(url, opt);
            return await r.json();
        } catch (e) { return { ok: false, error: 'network' }; }
    }

    const ERR = {
        ref_invalide: 'Numéro de tournoi invalide.',
        fide_invalide: 'Code FIDE invalide.',
        nom_invalide: 'Nom invalide.',
        ffe_injoignable: 'Le site de la FFE ne répond pas (réessayez plus tard).',
        grille_indisponible: 'La grille américaine de ce tournoi est indisponible.',
        tournoi_introuvable: 'Tournoi introuvable sur le site de la FFE.',
        joueur_absent_du_tournoi: 'Votre nom n\'apparaît pas dans ce tournoi.',
        ecriture_impossible: 'Écriture impossible dans php/joueurs/ (droits du dossier).',
        forbidden: 'Action réservée à l\'ordinateur local (localhost).',
        origin: 'Origine de la requête refusée.',
        network: 'Erreur réseau.'
    };
    const errText = (d) => ERR[d && d.error] || ('Erreur : ' + ((d && d.error) || 'inconnue'));

    Object.assign(ProfilePage, {
        // ───────────── candidats locaux (JSON + players.json + clubs + localStorage) ─────────────
        tokensMatch(name, q) {
            const hay = ' ' + this.norm(name).replace(/[^a-z0-9]+/g, ' ') + ' ';
            return this.norm(q).split(/[^a-z0-9]+/).filter(Boolean).every(t => hay.includes(t));
        },

        async localCandidates(q) {
            const map = new Map();
            const add = (fide, name, src, extra) => {
                fide = String(fide || '');
                const key = fide || ('n:' + this.norm(name));
                const cur = map.get(key) || { fide, name, sources: [] };
                if (!cur.name) cur.name = name;
                if (!cur.sources.includes(src)) cur.sources.push(src);
                Object.assign(cur, extra || {});
                map.set(key, cur);
            };
            const digits = q.replace(/[\s.]/g, '');
            const isId = /^\d{3,10}$/.test(digits);
            const ok = (fide, name) => isId ? String(fide || '').includes(digits) : this.tokensMatch(name, q);

            const d = await api({ action: 'list', q: isId ? digits : '' });
            (d.players || []).forEach(p => { if (ok(p.fide, p.name)) add(p.fide, p.name, 'JSON', { games: p.games }); });
            this.PLAYERS.forEach(p => { if (ok(p.fide, p.name)) add(p.fide, p.name, 'players.json'); });
            (this.CLUBS || []).forEach(c => (c.players || []).forEach(p => {
                if (ok(p.fide, p.name)) add(p.fide, p.name, c.name);
            }));
            try {
                const me = JSON.parse(localStorage.getItem('kchess.myProfilePlayer') || 'null');
                if (me && ok(me.fide, me.name)) add(me.fide, me.name, 'cet appareil');
            } catch (e) {}
            return [...map.values()];
        },

        async allCandidates(q) {
            const list = await this.localCandidates(q);
            const seen = new Set(list.filter(c => c.fide).map(c => c.fide));
            if (q.replace(/[\s.]/g, '').length >= 2 && !/^\d+$/.test(q.replace(/[\s.]/g, ''))) {
                try {
                    const r = await fetch('fide.php?q=' + encodeURIComponent(q));
                    const data = await r.json();
                    if (data.ok) (data.results || []).forEach(p => {
                        const id = String(p.id);
                        if (seen.has(id)) {
                            const c = list.find(x => x.fide === id);
                            if (c) { c.sources.push('FIDE'); c.federation = p.federation; c.standard = p.standard; }
                        } else {
                            list.push({ fide: id, name: p.name, sources: ['FIDE'], title: p.title, federation: p.federation, standard: p.standard });
                            seen.add(id);
                        }
                    });
                } catch (e) {}
            }
            return list;
        },

        renderPickList(box, list, title, onPick) {
            box.innerHTML = '';
            box.hidden = false;
            box.appendChild(this.note(title));
            const ul = document.createElement('ul');
            ul.className = 'profile-fide-pick';
            list.forEach(c => {
                const li = document.createElement('li');
                const b = document.createElement('button');
                b.type = 'button'; b.className = 'profile-fide-pick-btn';
                const n = document.createElement('span');
                n.textContent = (c.title ? c.title + ' ' : '') + c.name;
                const m = document.createElement('small');
                m.textContent = [c.fide ? 'FIDE ' + c.fide : 'sans code FIDE', c.federation, c.standard || null,
                    c.games ? c.games + ' parties' : null, c.sources.join(', ')].filter(Boolean).join(' · ');
                b.append(n, m);
                b.addEventListener('click', () => onPick(c));
                li.appendChild(b); ul.appendChild(li);
            });
            box.appendChild(ul);
        },

        // Fiche FIDE si possible, sinon repli sur les infos locales
        async resolvePlayer(c) {
            if (c.fide) {
                try {
                    const r = await fetch('fide.php?id=' + encodeURIComponent(c.fide));
                    const data = await r.json();
                    if (data.ok && data.player) return data.player;
                } catch (e) {}
            }
            return { id: c.fide, name: c.name, title: c.title || '', federation: c.federation || '', standard: c.standard || null };
        },

        // ───────────── 1. Mon profil ─────────────
        async searchMe(q) {
            const box = document.getElementById('profileMeResults');
            if (!box) return;
            if (!q) { this.clearMeResults(); return; }
            box.hidden = false; box.innerHTML = '';
            box.appendChild(this.note(this.T.loading));
            if (q.length < 2) { box.innerHTML = ''; box.appendChild(this.note('Entrez au moins 2 caractères.')); return; }

            const digits = q.replace(/[\s.]/g, '');
            if (/^\d{4,10}$/.test(digits)) return this.pickMe({ fide: digits, name: '', sources: [] });

            const list = await this.allCandidates(q);
            if (!list.length) { box.innerHTML = ''; box.appendChild(this.note(this.T.not_found)); return; }
            if (list.length === 1 && list[0].fide) return this.pickMe(list[0]);
            this.renderPickList(box, list, 'Plusieurs joueurs trouvés, choisissez le vôtre :', c => {
                if (!c.fide) { box.innerHTML = ''; box.appendChild(this.note('Ce joueur n\'a pas de code FIDE enregistré : recherchez-le par son code.', 'is-error')); return; }
                this.pickMe(c);
            });
        },

        async pickMe(c) {
            const box = document.getElementById('profileMeResults');
            box.hidden = false; box.innerHTML = '';
            box.appendChild(this.note(this.T.loading));
            const p = await this.resolvePlayer(c);
            if (!p.name) { box.innerHTML = ''; box.appendChild(this.note(this.T.not_found, 'is-error')); return; }
            const saved = await this.saveMyProfile(p);
            box.innerHTML = '';
            box.appendChild(this.note('✅ « ' + p.name + ' » est maintenant votre profil'
                + (saved === true ? ' (enregistré dans joueurs/' + p.id + '.json et sur cet appareil).'
                    : ' (enregistré sur cet appareil' + (saved ? ' — JSON : ' + saved : '') + ').')));
            this.renderMeCard(); this.renderMeClubs(); this.renderMeGames();
        },

        // localStorage + joueurs/{fide}.json. Renvoie true, ou un texte d'explication si le JSON n'a pas pu être écrit.
        async saveMyProfile(player) {
            if (!player || !player.id) return 'pas de code FIDE';
            try {
                localStorage.setItem(this.FIDE_KEY, String(player.id));
                localStorage.setItem('kchess.myProfilePlayer', JSON.stringify({
                    name: player.name, fide: String(player.id), title: player.title || '',
                    federation: player.federation || '', standard: player.standard || null,
                    rapid: player.rapid || null, blitz: player.blitz || null
                }));
            } catch (e) {}
            if (!window.PROFILE_LOCAL) return 'lecture seule hors localhost';
            const d = await api({}, {
                action: 'save_profile', fide: String(player.id), name: player.name, title: player.title || '',
                federation: player.federation || '', standard: player.standard, rapid: player.rapid, blitz: player.blitz
            });
            return d.ok ? true : errText(d);
        },

        // ───────────── 2. Rechercher un joueur ─────────────
        async searchPlayerToAssociate(q) {
            const box = document.getElementById('profilePlayerSearchResults');
            if (!box) return;
            if (!q) { box.hidden = true; return; }
            box.hidden = false; box.innerHTML = '';
            box.appendChild(this.note(this.T.loading));
            if (q.length < 2) { box.innerHTML = ''; box.appendChild(this.note('Entrez au moins 2 caractères.')); return; }

            const digits = q.replace(/[\s.]/g, '');
            if (/^\d{4,10}$/.test(digits)) return this.showPlayer({ fide: digits, name: '', sources: [] });
            const list = await this.allCandidates(q);
            if (!list.length) { box.innerHTML = ''; box.appendChild(this.note(this.T.not_found)); return; }
            if (list.length === 1 && list[0].fide) return this.showPlayer(list[0]);
            this.renderPickList(box, list, 'Plusieurs joueurs trouvés, choisissez :', c => {
                if (!c.fide) { box.innerHTML = ''; box.appendChild(this.note('Pas de code FIDE enregistré pour ce joueur.', 'is-error')); return; }
                this.showPlayer(c);
            });
        },

        async showPlayer(c) {
            const box = document.getElementById('profilePlayerSearchResults');
            box.hidden = false; box.innerHTML = '';
            box.appendChild(this.note(this.T.loading));
            const p = await this.resolvePlayer(c);
            if (!p.name) { box.innerHTML = ''; box.appendChild(this.note(this.T.not_found, 'is-error')); return; }
            const g = await this.fetchJsonGames(String(p.id));

            box.innerHTML = '';
            const card = document.createElement('article');
            card.className = 'profile-fide-card';
            const ratings = [p.standard && 'Std ' + p.standard, p.rapid && 'Rapide ' + p.rapid, p.blitz && 'Blitz ' + p.blitz].filter(Boolean).join(' · ');
            card.innerHTML = `<header class="profile-fide-head"><div>
                <h3>${esc((p.title ? p.title + ' ' : '') + p.name)}</h3>
                <p>${esc([p.federation, ratings].filter(Boolean).join(' · '))}</p>
                <p class="profile-fide-id">Code FIDE ${esc(p.id)}</p>
                <p class="profile-fide-note">${g.games.length
                    ? g.games.length + ' parties dans ' + g.tournaments.length + ' tournoi(s) (joueurs/' + esc(p.id) + '.json)'
                    : 'Aucune partie importée pour ce joueur.'}</p>
            </div></header><div class="profile-me-actions"></div>`;
            const actions = card.querySelector('.profile-me-actions');

            const mk = (icon, label, fn) => {
                const b = document.createElement('button');
                b.type = 'button'; b.className = 'home-feature-btn';
                b.innerHTML = `<i class="bi ${icon}" aria-hidden="true"></i> ${esc(label)}`;
                b.addEventListener('click', fn); actions.appendChild(b);
            };
            mk('bi-plus-circle', 'Associer à un club', () => this.openAffiliateDialog(p));
            if (g.games.length) mk('bi-list-ul', 'Voir ses parties', () => {
                let holder = card.querySelector('.pj-games');
                if (holder) { holder.remove(); return; }
                holder = document.createElement('ul'); holder.className = 'profile-games-list pj-games';
                this.fillGamesList(holder, g.games, 'all');
                card.appendChild(holder);
            });
            const a = document.createElement('a');
            a.className = 'home-feature-btn'; a.href = 'profile.php?view=players&fide=' + encodeURIComponent(p.id);
            a.innerHTML = '<i class="bi bi-box-arrow-up-right" aria-hidden="true"></i> Fiche complète';
            actions.appendChild(a);
            box.appendChild(card);
        },

        // ───────────── 3. Rechercher un tournoi ─────────────
        bindTournoiSearch() {
            const input = document.getElementById('profileTournoiSearchInput');
            if (!input || input.dataset.bound) return;
            input.dataset.bound = '1';
            const clearBtn = document.getElementById('profileTournoiSearchClear');
            const goBtn = document.getElementById('profileTournoiSearchBtn');
            const upd = () => { if (clearBtn) clearBtn.hidden = !input.value; };
            input.addEventListener('input', upd); upd();
            if (clearBtn) clearBtn.addEventListener('click', () => {
                input.value = ''; upd(); input.focus();
                const b = document.getElementById('profileTournoiResults'); b.innerHTML = ''; b.hidden = true;
            });
            const go = () => this.searchTournoi(input.value.trim());
            if (goBtn) goBtn.addEventListener('click', go);
            input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
        },

        async searchTournoi(q) {
            const box = document.getElementById('profileTournoiResults');
            if (!box) return;
            if (!q) { box.hidden = true; return; }
            box.hidden = false; box.innerHTML = '';
            box.appendChild(this.note(this.T.loading));

            // numéro ou lien FFE → fiche FFE (le serveur interroge la FFE, 1 requête)
            if (/Ref=\d+|Id\/\d+\//i.test(q) || /^\d{3,8}$/.test(q.replace(/\s/g, ''))) {
                const d = await api({ action: 'tournoi', ref: q });
                box.innerHTML = '';
                if (!d.ok) { box.appendChild(this.note(errText(d), 'is-error')); return; }
                return this.renderTournoi(box, d.tournament, []);
            }

            // texte → tournois déjà présents dans les JSON joueurs
            const d = await api({ action: 'tournois', q });
            box.innerHTML = '';
            const list = d.tournaments || [];
            if (!list.length) {
                box.appendChild(this.note('Aucun tournoi connu pour « ' + q + ' ». Pour en ajouter un : collez son numéro FFE ou le lien de sa fiche.'));
                return;
            }
            if (list.length === 1) return this.renderTournoi(box, list[0], list[0].players || []);
            box.appendChild(this.note(list.length + ' tournois connus :'));
            const ul = document.createElement('ul'); ul.className = 'profile-fide-pick';
            list.forEach(t => {
                const li = document.createElement('li'), b = document.createElement('button');
                b.type = 'button'; b.className = 'profile-fide-pick-btn';
                const n = document.createElement('span'); n.textContent = t.name;
                const m = document.createElement('small');
                m.textContent = [t.date, t.place, 'Ref ' + t.ref].filter(Boolean).join(' · ');
                b.append(n, m);
                b.addEventListener('click', () => { box.innerHTML = ''; this.renderTournoi(box, t, t.players || []); });
                li.appendChild(b); ul.appendChild(li);
            });
            box.appendChild(ul);
        },

        renderTournoi(box, t, players) {
            const me = (() => { try { return JSON.parse(localStorage.getItem('kchess.myProfilePlayer') || 'null'); } catch (e) { return null; } })();
            const card = document.createElement('article');
            card.className = 'profile-fide-card';
            const dates = t.date_end && t.date_end !== t.date ? t.date + ' → ' + t.date_end : (t.date || '');
            card.innerHTML = `<header class="profile-fide-head"><div>
                <h3>${esc(t.name)}</h3>
                <p>${esc([dates, t.place, t.rounds ? t.rounds + ' rondes' : '', t.cadence].filter(Boolean).join(' · '))}</p>
                <p class="profile-fide-id">Réf. FFE ${esc(t.ref)}${t.url ? ' · <a href="' + esc(t.url) + '" target="_blank" rel="noopener">fiche FFE</a>' : ''}</p>
                ${players.length ? '<p class="profile-fide-note">Joueurs importés : ' + esc(players.map(p => p.name).join(', ')) + '</p>' : ''}
            </div></header><div class="profile-me-actions"></div><div class="pj-import-msg"></div>`;
            const actions = card.querySelector('.profile-me-actions');
            const msg = card.querySelector('.pj-import-msg');

            const btn = document.createElement('button');
            btn.type = 'button'; btn.className = 'home-feature-btn';
            btn.innerHTML = '<i class="bi bi-download" aria-hidden="true"></i> Importer mes parties de ce tournoi';
            if (!me || !me.fide) { btn.disabled = true; btn.title = 'Associez d\'abord votre profil.'; }
            if (!window.PROFILE_LOCAL) { btn.disabled = true; btn.title = 'Import réservé à localhost.'; }
            btn.addEventListener('click', async () => {
                btn.disabled = true;
                msg.innerHTML = ''; msg.appendChild(this.note('Import en cours (2 requêtes vers la FFE)…'));
                const d = await api({}, { action: 'import', ref: String(t.ref), fide: me.fide, name: me.name });
                msg.innerHTML = '';
                if (!d.ok) {
                    let txt = errText(d);
                    if (d.players_in_tournament) txt += ' (' + d.players_in_tournament + ' joueurs dans ce tournoi — vérifiez l\'orthographe de votre nom sur la FFE.)';
                    msg.appendChild(this.note(txt, 'is-error')); btn.disabled = false; return;
                }
                msg.appendChild(this.note('✅ ' + d.games.length + ' partie(s) ajoutée(s) à joueurs/' + me.fide + '.json'
                    + (d.byes && d.byes.length ? ' (' + d.byes.length + ' ronde(s) sans adversaire)' : '') + '.'));
                this.renderMeGames();
                btn.disabled = false;
            });
            actions.appendChild(btn);
            box.appendChild(card);
        },

        // ───────────── Parties (lecture du JSON) ─────────────
        async fetchJsonGames(fide) {
            try {
                const r = await fetch('games.php?source=json&fide=' + encodeURIComponent(fide), { cache: 'no-store' });
                const d = await r.json();
                if (d.ok) return { games: d.games || [], tournaments: d.tournaments || [] };
            } catch (e) {}
            return { games: [], tournaments: [] };
        },

        resultKind(r) {
            if (r === '1-0' || r === '1.0' || r === '1') return 'win';
            if (r === '0-1' || r === '0.0' || r === '0') return 'loss';
            if (r === '1/2-1/2' || r === '0.5-0.5' || r === '0.5') return 'draw';
            return '';
        },

        fillGamesList(list, games, filter) {
            list.innerHTML = '';
            const colors = { win: 'rgba(63,185,80,.16)', loss: 'rgba(248,81,73,.16)', draw: 'transparent' };
            const labels = { win: '1-0', loss: '0-1', draw: '½-½' };
            games.filter(g => filter === 'all' || this.resultKind(g.result) === filter).forEach(g => {
                const k = this.resultKind(g.result);
                const li = document.createElement('li');
                li.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid var(--site-border);font-size:.85rem;background:' + (colors[k] || 'transparent');
                const left = document.createElement('div');
                const col = g.color === 'w' ? '⬜' : g.color === 'b' ? '⬛' : '';
                left.innerHTML = `<strong>${esc(g.opponent || 'Inconnu')}</strong>
                    ${g.opp_elo ? '<small style="color:var(--site-text-muted)"> (' + esc(g.opp_elo) + ')</small>' : ''} ${col}
                    <div style="font-size:.75rem;color:var(--site-text-muted)">${esc([g.date, g.round ? 'ronde ' + g.round : '', g.tournament, g.place].filter(Boolean).join(' · '))}</div>`;
                const res = document.createElement('span');
                res.style.cssText = 'font-weight:700;font-family:monospace;font-size:1rem';
                res.textContent = labels[k] || (g.result || '?');
                li.append(left, res);
                if (g.pgn && typeof PgnParser !== 'undefined' && typeof this.openGamePgn === 'function') {
                    li.style.cursor = 'pointer';
                    li.addEventListener('click', () => this.openGamePgn(g));
                }
                list.appendChild(li);
            });
            if (!list.children.length) {
                const li = document.createElement('li');
                li.style.cssText = 'padding:10px;color:var(--site-text-muted);font-size:.85rem';
                li.textContent = 'Aucune partie pour ce filtre.';
                list.appendChild(li);
            }
            Object.assign(list.style, { display: 'block', padding: '0', listStyle: 'none', borderRadius: '10px',
                border: '1px solid var(--site-border)', maxHeight: '420px', overflowY: 'auto' });
        },

        async renderMeGames() {
            const wrapper = document.getElementById('profileMeGames');
            const list = document.getElementById('profileGamesData');
            if (!wrapper || !list) return;
            const id = this.getStoredPlayer();
            if (!id) { wrapper.hidden = true; return; }
            wrapper.hidden = false;

            const { games, tournaments } = await this.fetchJsonGames(id);
            this.myGames = games;
            const summary = document.getElementById('profileGamesSummary');
            if (!games.length) {
                list.innerHTML = '<li style="color:var(--site-text-muted);font-size:.85rem;padding:10px">Aucune partie importée. Utilisez « Rechercher un tournoi » (numéro FFE) pour en ajouter.</li>';
                if (summary) summary.textContent = '';
                return;
            }
            const n = k => games.filter(g => this.resultKind(g.result) === k).length;
            const w = n('win'), d = n('draw'), l = n('loss');
            if (summary) summary.textContent = `${games.length} parties dans ${tournaments.length} tournoi(s) — ${w} gagnée(s), ${d} nulle(s), ${l} perdue(s)`;
            this.fillGamesList(list, games, this.currentGamesFilter);
            this.updateFilterButtons();
        },

        bindSyncGames() {
            const btn = document.getElementById('syncGamesBtn');
            if (btn) btn.addEventListener('click', () => this.renderMeGames());
        }
    });

    // Branche la recherche de tournoi après l'init standard de la vue "Mon profil"
    const baseInit = ProfilePage.initMeView;
    ProfilePage.initMeView = function () {
        baseInit.call(this);
        this.bindTournoiSearch();
        this.updateFilterButtons();
    };
})();