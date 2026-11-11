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

        this.updateClubStats();
        this.renderClubResults(this.CLUBS, searchInput.value.trim());

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

    searchClubs(q) {
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

        const wrap = document.createElement('div');
        wrap.className = 'profile-club-sections';

        clubs.forEach(club => {
            const details = document.createElement('details');
            details.className = 'profile-club-section';

            // ── Le summary contient le chevron (pour ouvrir) et le lien (pour naviguer)
            const summary = document.createElement('summary');
            summary.className = 'profile-club-section-title';

            const icon = document.createElement('i');
            icon.className = 'bi bi-chevron-right profile-club-chevron';
            icon.style.pointerEvents = 'auto';

            const titleLink = document.createElement('a');
            titleLink.href = 'club.php?nom=' + encodeURIComponent(club.name);
            titleLink.textContent = club.name;
            titleLink.className = 'profile-club-link';
            // Bloque la propagation pour ne pas que le summary s'ouvre en cliquant sur le lien
            titleLink.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            summary.append(icon, titleLink);

            const info = document.createElement('p');
            info.className = 'profile-club-section-info';
            info.textContent = [club.city, club.region, club.country, `${(club.players || []).length} ${this.T.pf_club_players}`]
                .filter(Boolean).join(' · ');

            details.appendChild(summary);
            details.appendChild(info);

            const players = (club.players || []).filter(p => p && p.name);
            if (!players.length) {
                const empty = document.createElement('p');
                empty.className = 'profile-fide-note';
                empty.textContent = this.T.pf_club_empty;
                details.appendChild(empty);
            } else {
                const ul = document.createElement('ul');
                ul.className = 'profile-club-list';
                const sorted = players.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
                const rows = {};

                sorted.forEach(pl => {
                    const li = document.createElement('li');
                    const btn = document.createElement(pl.fide && /^\d+$/.test(pl.fide) ? 'a' : 'div');
                    btn.className = 'profile-club-player';
                    if (pl.fide && /^\d+$/.test(pl.fide)) {
                        btn.href = `profile.php?view=players&fide=${encodeURIComponent(pl.fide)}`;
                    }
                    const name = document.createElement('span');
                    name.textContent = pl.name;
                    const meta = document.createElement('small');
                    meta.textContent = pl.fide ? String(pl.fide) : '';
                    btn.append(name, meta);
                    li.appendChild(btn);
                    ul.appendChild(li);
                    if (pl.fide && /^\d+$/.test(pl.fide)) rows[String(pl.fide)] = meta;
                });

                details.appendChild(ul);

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
            }

            wrap.appendChild(details);
        });

        box.appendChild(wrap);
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

        const save = () => {
            const name = fName.value.trim();
            if (!name) {
                if (msgClub) { msgClub.textContent = 'Le nom du club est requis.'; msgClub.classList.add('is-error'); }
                return;
            }
            const local = this.readLocalClubs();
            const existingBase = (Array.isArray(window.PROFILE_CLUBS) ? window.PROFILE_CLUBS : [])
                .find(c => c.name === name);
            const existingLocal = local.clubs.find(c => c.name === name);
            const existingOverride = local.overrides[name];
            const existing = existingOverride || existingLocal || existingBase || {};

            const patch = {
                ...existing,
                name,
                city: fCity.value.trim(),
                region: fRegion.value.trim(),
                country: fCountry.value.trim(),
                players: Array.isArray(existing.players) ? existing.players : []
            };

            if (existingBase) {
                local.overrides[name] = patch;
                local.clubs = local.clubs.filter(c => c.name !== name);
            } else {
                local.clubs = local.clubs.filter(c => c.name !== name);
                local.clubs.push(patch);
            }
            this.writeLocalClubs(local);
            if (msgClub) { msgClub.textContent = `✅ « ${name} » enregistré.`; msgClub.classList.remove('is-error'); }
            editor.hidden = true;
            renderList();
            this.updateClubStats();
            this.searchClubs(document.getElementById('profileClubSearchInput')?.value.trim() || '');
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
            playersSave.addEventListener('click', () => {
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
                const local = this.readLocalClubs();
                const existingBase = (Array.isArray(window.PROFILE_CLUBS) ? window.PROFILE_CLUBS : [])
                    .find(c => c.name === name);
                const existingLocal = local.clubs.find(c => c.name === name);
                const existingOverride = local.overrides[name];
                const existing = existingOverride || existingLocal || existingBase || {};

                const patch = { ...existing, name, players };
                if (existingBase) {
                    local.overrides[name] = patch;
                    local.clubs = local.clubs.filter(c => c.name !== name);
                } else {
                    local.clubs = local.clubs.filter(c => c.name !== name);
                    local.clubs.push(patch);
                }
                this.writeLocalClubs(local);
                if (playersMsg) {
                    playersMsg.textContent = `✅ ${players.length} joueur(s) enregistrés pour « ${name} ».`;
                    playersMsg.classList.remove('is-error');
                }
                this.updateClubStats();
                this.searchClubs(document.getElementById('profileClubSearchInput')?.value.trim() || '');
            });
        }
    },

    // ── Affiliation joueur → club ──
    openAffiliateDialog(player) {
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
        const local = this.readLocalClubs();
        const base = (Array.isArray(window.PROFILE_CLUBS) ? window.PROFILE_CLUBS : [])
            .find(c => c.name === club.name);
        const target = (local.clubs.find(c => c.name === club.name))
            || (local.overrides[club.name])
            || (base ? { ...base } : { name: club.name, players: [] });

        target.players = Array.isArray(target.players) ? target.players : [];
        if (target.players.some(p => String(p.fide || '') === String(player.id))) {
            alert(`« ${player.name} » est déjà dans « ${club.name} ».`);
            return;
        }
        target.players.push({ name: player.name, fide: String(player.id) });

        if (base) {
            local.overrides[club.name] = target;
        } else {
            const i = local.clubs.findIndex(c => c.name === club.name);
            if (i >= 0) local.clubs[i] = target; else local.clubs.push(target);
        }
        this.writeLocalClubs(local);
        alert(`✅ « ${player.name} » ajouté à « ${club.name} ».`);
        this.renderPlayer(player, null);
    }
});