/**
 * js/ui/profile-clubs.js
 * Vue "Clubs" : recherche, édition locale, affiliation.
 * Dépend de profile-core.js
 */

Object.assign(ProfilePage, {

    // ── Lecture / écriture des clubs en localStorage ──
    readLocalClubs() {
        try {
            const raw = localStorage.getItem(this.CLUBS_KEY);
            if (!raw) return { clubs: [], overrides: {} };
            const parsed = JSON.parse(raw);
            return {
                clubs: Array.isArray(parsed.clubs) ? parsed.clubs : [],
                overrides: (parsed.overrides && typeof parsed.overrides === 'object') ? parsed.overrides : {}
            };
        } catch (e) { return { clubs: [], overrides: {} }; }
    },

    writeLocalClubs(data) {
        try {
            localStorage.setItem(this.CLUBS_KEY, JSON.stringify({
                clubs: Array.isArray(data.clubs) ? data.clubs : [],
                overrides: (data.overrides && typeof data.overrides === 'object') ? data.overrides : {}
            }));
        } catch (e) {}
    },

    get CLUBS() {
        const base = Array.isArray(window.PROFILE_CLUBS) ? window.PROFILE_CLUBS : [];
        const local = this.readLocalClubs();
        const byName = new Map();
        base.forEach(c => { if (c && c.name) byName.set(c.name, { ...c }); });
        local.clubs.forEach(c => { if (c && c.name) byName.set(c.name, { ...c }); });
        Object.entries(local.overrides).forEach(([name, patch]) => {
            const existing = byName.get(name) || { name };
            byName.set(name, { ...existing, ...patch });
        });
        return [...byName.values()].map(club => {
            const players = Array.isArray(club.players) ? club.players.filter(p => p && p.name) : [];
            const seen = new Set();
            return { ...club, players: players.filter(p => {
                const key = p.fide ? ('id:' + p.fide) : ('n:' + p.name.toLowerCase());
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })};
        });
    },

    clubsOfPlayer(id) {
        const sid = String(id);
        return this.CLUBS.filter(c => (c.players || []).some(pl => pl && String(pl.fide || '') === sid));
    },

    // Enregistre un club : JSON partagé en localhost, localStorage sinon
    async commitClub(patch) {
        if (window.PROFILE_LOCAL) {
            const list = (Array.isArray(window.PROFILE_CLUBS) ? window.PROFILE_CLUBS : []).map(c => ({ ...c }));
            const i = list.findIndex(c => c.name === patch.name);
            if (i >= 0) list[i] = { ...list[i], ...patch }; else list.push({ ...patch });
            const r = await this.saveShared('clubs', list);
            if (!r.ok) return false;
            // le JSON fait foi : on retire les copies locales de ce club
            const local = this.readLocalClubs();
            local.clubs = local.clubs.filter(c => c.name !== patch.name);
            delete local.overrides[patch.name];
            this.writeLocalClubs(local);
            return true;
        }
        const local = this.readLocalClubs();
        const base = (Array.isArray(window.PROFILE_CLUBS) ? window.PROFILE_CLUBS : []).find(c => c.name === patch.name);
        if (base) {
            local.overrides[patch.name] = patch;
            local.clubs = local.clubs.filter(c => c.name !== patch.name);
        } else {
            local.clubs = local.clubs.filter(c => c.name !== patch.name);
            local.clubs.push(patch);
        }
        this.writeLocalClubs(local);
        return true;
    },

    // ── Vue Clubs ──
    initClubsView() {
        const searchInput = document.getElementById('profileClubSearchInput');
        const searchClear = document.getElementById('profileClubSearchClear');
        const searchBtn = document.getElementById('profileClubSearchBtn');
        const regionEl = document.getElementById('profileClubRegion');
        const countryEl = document.getElementById('profileClubCountry');
        if (!searchInput) return;

        const updateClear = () => { if (searchClear) searchClear.hidden = searchInput.value.length === 0; };
        searchInput.addEventListener('input', updateClear);
        updateClear();

        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                searchInput.focus();
                updateClear();
                this.clearClubResults();
            });
        }

        const trigger = () => this.searchClubs(searchInput.value.trim());
        if (searchBtn) searchBtn.addEventListener('click', trigger);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); trigger(); }
        });
        [regionEl, countryEl].forEach(el => {
            if (!el) return;
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); trigger(); }
            });
        });

        this.renderHistory();
        this.updateClubStats();
        const qParam = new URLSearchParams(window.location.search).get('q');
        if (qParam) {
            searchInput.value = qParam;
            updateClear();
            this.searchClubs(qParam);
        } else {
            this.renderClubResults(this.CLUBS, searchInput.value.trim());
        }

        if (window.PROFILE_LOCAL) this.initClubsEditor();
    },

    updateClubStats() {
        const clubs = this.CLUBS;
        const countEl = document.getElementById('profileClubStatsCount');
        const playersEl = document.getElementById('profileClubStatsPlayers');
        if (countEl) countEl.textContent = String(clubs.length);
        if (playersEl) {
            const total = clubs.reduce((sum, c) => sum + (c.players || []).length, 0);
            playersEl.textContent = String(total);
        }
    },

    clearClubResults() {
        const box = document.getElementById('profileClubResults');
        if (!box) return;
        box.innerHTML = '';
        box.hidden = true;
    },

    searchClubs(q, silent) {
        if (q && !silent) this.addHistory({ q: String(q) }, 'club');
        const regionEl = document.getElementById('profileClubRegion');
        const countryEl = document.getElementById('profileClubCountry');
        const region = regionEl ? regionEl.value.trim() : '';
        const country = countryEl ? countryEl.value.trim() : '';
        const n = this.norm(q);
        const nRegion = this.norm(region);
        const nCountry = this.norm(country);
        const found = this.CLUBS.filter(c => {
            if (n && !this.norm(c.name).includes(n) && !this.norm(c.city).includes(n)) return false;
            if (nRegion) {
                const clubRegion = this.norm(c.region || '');
                const clubDept = this.norm(c.department || c.departement || '');
                const clubCity = this.norm(c.city || '');
                if (!clubRegion.includes(nRegion) && !clubDept.includes(nRegion) && !clubCity.includes(nRegion)) return false;
            }
            if (nCountry) {
                const clubCountry = this.norm(c.country || c.pays || '');
                if (!clubCountry.includes(nCountry)) return false;
            }
            return true;
        });
        this.renderClubResults(found, q);
    },

    renderClubResults(clubs, q) {
        const box = document.getElementById('profileClubResults');
        if (!box) return;
        box.innerHTML = '';
        box.hidden = false;

        if (!clubs.length) {
            box.appendChild(this.note(this.T.pf_club_none));
            return;
        }

        const card = document.createElement('article');
        card.className = 'profile-fide-card profile-club-card';

        const head = document.createElement('header');
        head.className = 'profile-club-head';
        const h = document.createElement('h3');
        h.textContent = q ? `Résultats pour « ${q} »` : 'Tous les clubs';
        const sub = document.createElement('p');
        sub.textContent = `${clubs.length} club(s)`;
        head.append(h, sub);
        card.appendChild(head);

        clubs.forEach(club => {
            const section = document.createElement('section');
            section.className = 'profile-club-section';

            const title = document.createElement('h4');
            title.className = 'profile-club-section-title';
            title.textContent = club.name;

            const info = document.createElement('p');
            info.className = 'profile-club-section-info';
            info.textContent = [club.city, club.region, club.country, `${(club.players || []).length} ${this.T.pf_club_players}`]
                .filter(Boolean).join(' · ');

            section.append(title, info);

            const players = (club.players || []).filter(p => p && p.name);
            if (!players.length) {
                const empty = document.createElement('p');
                empty.className = 'profile-fide-note';
                empty.textContent = this.T.pf_club_empty;
                section.appendChild(empty);
                card.appendChild(section);
                return;
            }

            const ul = document.createElement('ul');
            ul.className = 'profile-club-list';
            const sorted = players.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
            const rows = {};
            sorted.forEach(pl => {
                const li = document.createElement('li');
                const btn = document.createElement(pl.fide ? 'a' : 'div');
                btn.className = 'profile-club-player';
                if (pl.fide) btn.href = `profile.php?view=players&fide=${encodeURIComponent(pl.fide)}`;
                const name = document.createElement('span');
                name.textContent = pl.name;
                const meta = document.createElement('small');
                meta.textContent = pl.fide ? String(pl.fide) : '';
                btn.append(name, meta);
                li.appendChild(btn);
                ul.appendChild(li);
                if (pl.fide) rows[String(pl.fide)] = meta;
            });
            section.appendChild(ul);
            card.appendChild(section);

            const ids = Object.keys(rows);
            if (ids.length) {
                fetch('fide.php?ids=' + ids.join(','))
                    .then(r => r.json())
                    .then(data => {
                        if (!data.ok) return;
                        Object.entries(data.players || {}).forEach(([id, info]) => {
                            if (rows[id]) rows[id].textContent = id + (info.standard ? ' · ' + info.standard : '');
                        });
                    })
                    .catch(() => {});
            }
        });

        box.appendChild(card);
    },

    // ── Éditeur clubs / joueurs (2 sous-onglets) ──
    initClubsEditor() {
        const btn = document.getElementById('profileClubEditPlayers');
        const panel = document.getElementById('profileClubImport');
        if (!window.PROFILE_LOCAL || !btn || !panel) return;

        const tabs = panel.querySelectorAll('.profile-club-tab');
        const tabPanels = panel.querySelectorAll('.profile-club-tab-panel');
        const activateTab = (name) => {
            tabs.forEach(t => {
                const on = t.dataset.tab === name;
                t.classList.toggle('is-active', on);
                t.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            tabPanels.forEach(p => {
                p.hidden = p.dataset.panel !== name;
            });
            if (name === 'players') renderPlayersTab();
        };
        tabs.forEach(t => t.addEventListener('click', () => activateTab(t.dataset.tab)));

        // ── Sous-onglet Clubs ──
        const list = document.getElementById('profileClubImportList');
        const countEl = document.getElementById('profileClubCount');
        const newBtn = document.getElementById('profileClubImportNew');
        const editor = document.getElementById('profileClubEditor');
        const editorTitle = document.getElementById('profileClubEditorTitle');
        const fName = document.getElementById('profileClubName');
        const fCity = document.getElementById('profileClubCity');
        const fRegion = document.getElementById('profileClubRegionField');
        const fCountry = document.getElementById('profileClubCountryField');
        const msgClub = document.getElementById('profileClubMsg');
        const saveClub = document.getElementById('profileClubSave');
        const cancelClub = document.getElementById('profileClubCancel');
        if (!list || !editor || !fName) return;

        const currentClubs = () => this.CLUBS;

        const renderList = () => {
            const clubs = currentClubs();
            if (countEl) countEl.textContent = String(clubs.length);
            list.innerHTML = '';
            clubs.forEach(club => {
                const li = document.createElement('li');
                li.className = 'profile-club-import-row';
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'profile-club-import-item';
                b.innerHTML = `<span>${club.name}</span>
                    <small>${[club.city, club.region, club.country].filter(Boolean).join(' · ') || '—'} · ${(club.players || []).length} joueur(s)</small>`;
                b.addEventListener('click', () => openEditor(club.name));
                li.appendChild(b);
                list.appendChild(li);
            });
        };

        const openEditor = (name) => {
            const club = name
                ? (currentClubs().find(c => c.name === name) || { name: '', city: '', region: '', country: '' })
                : { name: '', city: '', region: '', country: '' };
            fName.value = club.name || '';
            fCity.value = club.city || '';
            fRegion.value = club.region || '';
            fCountry.value = club.country || '';
            if (editorTitle) editorTitle.textContent = name ? `Modifier « ${name} »` : 'Nouveau club';
            editor.hidden = false;
            if (msgClub) { msgClub.textContent = ''; msgClub.classList.remove('is-error'); }
            fName.focus();
        };

        const save = async () => {
            const name = fName.value.trim();
            if (!name) {
                if (msgClub) { msgClub.textContent = 'Le nom du club est requis.'; msgClub.classList.add('is-error'); }
                return;
            }
            const existing = currentClubs().find(c => c.name === name) || {};
            const patch = {
                ...existing,
                name,
                city: fCity.value.trim(),
                region: fRegion.value.trim(),
                country: fCountry.value.trim(),
                players: Array.isArray(existing.players) ? existing.players : []
            };
            if (!(await this.commitClub(patch))) {
                if (msgClub) { msgClub.textContent = 'Enregistrement impossible (config/clubs.json).'; msgClub.classList.add('is-error'); }
                return;
            }
            if (msgClub) { msgClub.textContent = `✅ « ${name} » enregistré.`; msgClub.classList.remove('is-error'); }
            editor.hidden = true;
            renderList();
            this.updateClubStats();
            this.searchClubs(document.getElementById('profileClubSearchInput')?.value.trim() || '', true);
        };

        btn.addEventListener('click', () => {
            panel.hidden = false;
            renderList();
            editor.hidden = true;
            activateTab('clubs');
            const pMsg = document.getElementById('profileClubPlayersMsg');
            if (pMsg) { pMsg.textContent = ''; pMsg.classList.remove('is-error'); }
        });
        if (newBtn) newBtn.addEventListener('click', () => openEditor(null));
        if (cancelClub) cancelClub.addEventListener('click', () => { editor.hidden = true; });
        if (saveClub) saveClub.addEventListener('click', save);

        // ── Sous-onglet Joueurs ──
        const playersSelect = document.getElementById('profileClubPlayersSelect');
        const playersLabel = document.getElementById('profileClubPlayersLabel');
        const playersInput = document.getElementById('profileClubImportInput');
        const playersMsg = document.getElementById('profileClubPlayersMsg');
        const playersSave = document.getElementById('profileClubPlayersSave');
        if (!playersSelect || !playersInput) return;

        const renderPlayersTab = () => {
            const clubs = currentClubs();
            if (!clubs.length) {
                playersSelect.innerHTML = '<option value="">— Aucun club —</option>';
                if (playersLabel) playersLabel.textContent = '—';
                playersInput.value = '';
                playersInput.disabled = true;
                if (playersMsg) {
                    playersMsg.textContent = 'Créez d’abord un club dans l’onglet Clubs.';
                    playersMsg.classList.add('is-error');
                }
                return;
            }
            playersInput.disabled = false;
            const current = playersSelect.value;
            playersSelect.innerHTML = clubs.map(c =>
                `<option value="${c.name.replace(/"/g, '&quot;')}">${c.name}</option>`
            ).join('');
            if (current && clubs.some(c => c.name === current)) playersSelect.value = current;
            loadPlayersForSelected();
        };

        const loadPlayersForSelected = () => {
            const name = playersSelect.value;
            if (!name) return;
            const club = currentClubs().find(c => c.name === name);
            if (playersLabel) playersLabel.textContent = name;
            playersInput.value = (club?.players || [])
                .map(p => p.fide ? `${p.name}, ${p.fide}` : p.name)
                .join('\n');
            if (playersMsg) { playersMsg.textContent = ''; playersMsg.classList.remove('is-error'); }
        };

        playersSelect.addEventListener('change', loadPlayersForSelected);

        if (playersSave) {
            playersSave.addEventListener('click', async () => {
                const name = playersSelect.value;
                if (!name) return;
                const lines = playersInput.value.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                const players = [];
                for (const line of lines) {
                    const parts = line.split(',').map(s => s.trim()).filter(Boolean);
                    if (!parts.length) continue;
                    const fide = parts.length >= 2 && /^\d{4,10}$/.test(parts[parts.length - 1])
                        ? parts.pop()
                        : null;
                    const playerName = parts.join(', ');
                    if (playerName) players.push(fide ? { name: playerName, fide } : { name: playerName });
                }
                const existing = currentClubs().find(c => c.name === name) || {};
                if (!(await this.commitClub({ ...existing, name, players }))) {
                    if (playersMsg) { playersMsg.textContent = 'Enregistrement impossible (config/clubs.json).'; playersMsg.classList.add('is-error'); }
                    return;
                }
                // les joueurs avec code FIDE rejoignent aussi players.json
                if (window.PROFILE_LOCAL) {
                    const all = this.PLAYERS.map(p => ({ ...p }));
                    players.filter(p => p.fide).forEach(p => {
                        if (!all.some(x => String(x.fide) === String(p.fide))) all.push({ fide: p.fide, name: p.name });
                    });
                    await this.saveShared('players', all);
                }
                if (playersMsg) {
                    playersMsg.textContent = `✅ ${players.length} joueur(s) enregistrés pour « ${name} ».`;
                    playersMsg.classList.remove('is-error');
                }
                this.updateClubStats();
                this.searchClubs(document.getElementById('profileClubSearchInput')?.value.trim() || '', true);
            });
        }
    },

    // ── Affiliation joueur → club ──
    async openAffiliateDialog(player) {
        const clubs = this.CLUBS;
        if (!clubs.length) {
            alert('Aucun club disponible. Créez-en un via "Gérer les clubs & joueurs" dans la vue Clubs.');
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
        const club = clubs[idx];
        const target = { ...club, players: Array.isArray(club.players) ? club.players.slice() : [] };
        if (target.players.some(p => String(p.fide || '') === String(player.id))) {
            alert(`« ${player.name} » est déjà dans « ${club.name} ».`);
            return;
        }
        target.players.push({ name: player.name, fide: String(player.id) });
        if (!(await this.commitClub(target))) { alert('Enregistrement impossible (config/clubs.json).'); return; }
        await this.upsertSharedPlayer(player);
        alert(`✅ « ${player.name} » ajouté à « ${club.name} ».`);
        this.renderPlayer(player, null);
    }
});