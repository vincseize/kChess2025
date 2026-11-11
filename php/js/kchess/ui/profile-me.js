/**
 * js/ui/profile-me.js
 * Vue "Mon profil" : recherche FIDE, association localStorage + parties.
 */

Object.assign(ProfilePage, {
    currentGamesFilter: 'all', // 'all', 'win', 'loss', 'draw'

    initMeView() {
        this.renderLevels();
        this.bindResetAll();
        this.bindMeSearch();
        this.bindPlayerSearch();
        this.renderMeCard();
        this.renderMeClubs();
        this.renderMeGames();
        this.bindSyncGames();
        this.bindGameFilters();
    },

    getStoredPlayer() {
        let id = null;
        try { id = localStorage.getItem(this.FIDE_KEY); } catch (e) {}
        if (!id || !/^\d+$/.test(id)) return null;
        return id;
    },

    // ── 1. Recherche "Mon Profil" ──
    bindMeSearch() {
        const input = document.getElementById('profileMeSearchInput');
        const clearBtn = document.getElementById('profileMeSearchClear');
        const goBtn = document.getElementById('profileMeSearchBtn');
        if (!input) return;

        const updateClear = () => { if (clearBtn) clearBtn.hidden = input.value.length === 0; };
        input.addEventListener('input', updateClear);
        updateClear();

        if (clearBtn) clearBtn.addEventListener('click', () => {
            input.value = ''; input.focus(); updateClear(); this.clearMeResults();
        });

        const trigger = () => this.searchMe(input.value.trim());
        if (goBtn) goBtn.addEventListener('click', trigger);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); trigger(); } });
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

        const digits = q.replace(/[\s.]/g, '');
        if (/^\d{3,10}$/.test(digits)) return this.loadMePlayer(digits);
        if (q.length < 2) {
            box.innerHTML = ''; box.appendChild(this.note('Entrez au moins 2 caractères.')); return;
        }

        try {
            const res = await fetch('fide.php?q=' + encodeURIComponent(q));
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || 'error');
            if (!data.results.length) {
                box.innerHTML = ''; box.appendChild(this.note(this.T.not_found)); return;
            }
            if (data.results.length === 1) return this.loadMePlayer(data.results[0].id);
            this.renderMePick(data.results);
        } catch (e) {
            box.innerHTML = ''; box.appendChild(this.note(this.T.error, 'is-error'));
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
            b.type = 'button'; b.className = 'profile-fide-pick-btn';
            const name = document.createElement('span');
            name.textContent = (p.title ? p.title + ' ' : '') + p.name;
            const meta = document.createElement('small');
            meta.textContent = [p.federation, p.standard || null].filter(Boolean).join(' · ');
            b.append(name, meta);
            b.addEventListener('click', () => this.loadMePlayer(p.id));
            li.appendChild(b); ul.appendChild(li);
        });
        box.appendChild(ul);
    },

    async loadMePlayer(id) {
        const box = document.getElementById('profileMeResults');
        if (!box) return;
        box.hidden = false; box.innerHTML = '';
        box.appendChild(this.note(this.T.loading));

        try {
            const res = await fetch('fide.php?id=' + encodeURIComponent(id));
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || 'error');
            this.saveMyProfile(data.player);
            box.innerHTML = '';
            box.appendChild(this.note(`✅ « ${data.player.name} » est maintenant votre profil.`));
            this.renderMeCard();
            this.renderMeClubs();
            this.renderMeGames();
        } catch (e) {
            box.innerHTML = ''; box.appendChild(this.note(this.T.error, 'is-error'));
        }
    },

    saveMyProfile(player) {
        if (!player || !player.id) return;
        try {
            localStorage.setItem(this.FIDE_KEY, String(player.id));
            localStorage.setItem('kchess.myProfilePlayer', JSON.stringify({
                name: player.name, fide: String(player.id), title: player.title || '',
                federation: player.federation || '', standard: player.standard || null,
                rapid: player.rapid || null, blitz: player.blitz || null
            }));
        } catch (e) {}
    },

    // ── 2. Recherche Joueur pour affiliation ──
    bindPlayerSearch() {
        const input = document.getElementById('profilePlayerSearchInput');
        const clearBtn = document.getElementById('profilePlayerSearchClear');
        const goBtn = document.getElementById('profilePlayerSearchBtn');
        if (!input) return;

        const updateClear = () => { if (clearBtn) clearBtn.hidden = input.value.length === 0; };
        input.addEventListener('input', updateClear);
        updateClear();

        if (clearBtn) clearBtn.addEventListener('click', () => {
            input.value = ''; input.focus(); updateClear(); document.getElementById('profilePlayerSearchResults').hidden = true;
        });

        const trigger = () => this.searchPlayerToAssociate(input.value.trim());
        if (goBtn) goBtn.addEventListener('click', trigger);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); trigger(); } });
    },

    async searchPlayerToAssociate(q) {
        const box = document.getElementById('profilePlayerSearchResults');
        if (!box) return;
        if (!q) { box.hidden = true; return; }

        box.hidden = false; box.innerHTML = '';
        box.appendChild(this.note(this.T.loading));

        const digits = q.replace(/[\s.]/g, '');
        if (/^\d{3,10}$/.test(digits)) return this.loadPlayerToAssociate(digits);
        
        try {
            const res = await fetch('fide.php?q=' + encodeURIComponent(q));
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || 'error');
            if (!data.results.length) {
                box.innerHTML = ''; box.appendChild(this.note(this.T.not_found)); return;
            }
            if (data.results.length === 1) return this.loadPlayerToAssociate(data.results[0].id);
            
            box.innerHTML = '';
            box.appendChild(this.note('Plusieurs joueurs trouvés, choisissez :'));
            const ul = document.createElement('ul');
            ul.className = 'profile-fide-pick';
            data.results.forEach(p => {
                const li = document.createElement('li');
                const b = document.createElement('button');
                b.type = 'button'; b.className = 'profile-fide-pick-btn';
                const name = document.createElement('span');
                name.textContent = (p.title ? p.title + ' ' : '') + p.name;
                const meta = document.createElement('small');
                meta.textContent = [p.federation, p.standard || null].filter(Boolean).join(' · ');
                b.append(name, meta);
                b.addEventListener('click', () => this.loadPlayerToAssociate(p.id));
                li.appendChild(b); ul.appendChild(li);
            });
            box.appendChild(ul);
        } catch (e) {
            box.innerHTML = ''; box.appendChild(this.note(this.T.error, 'is-error'));
        }
    },

    async loadPlayerToAssociate(id) {
        const box = document.getElementById('profilePlayerSearchResults');
        if (!box) return;
        box.innerHTML = '';
        box.appendChild(this.note(this.T.loading));

        try {
            const res = await fetch('fide.php?id=' + encodeURIComponent(id));
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || 'error');
            
            box.innerHTML = '';
            const card = document.createElement('article');
            card.className = 'profile-fide-card';
            card.innerHTML = `
                <header class="profile-fide-head">
                    <div>
                        <h3>${data.player.name}</h3>
                        <p class="profile-fide-id">Code FIDE ${data.player.id}</p>
                    </div>
                </header>
                <div class="profile-me-actions">
                    <button type="button" class="home-feature-btn" id="btnAssociateClub">
                        <i class="bi bi-plus-circle"></i> Associer à un club
                    </button>
                </div>
            `;
            box.appendChild(card);

            document.getElementById('btnAssociateClub').addEventListener('click', () => {
                if (typeof this.openAffiliateDialog === 'function') {
                    this.openAffiliateDialog(data.player);
                } else {
                    alert("Erreur: Impossible d'ouvrir la fenêtre d'affiliation.");
                }
            });

        } catch (e) {
            box.innerHTML = ''; box.appendChild(this.note(this.T.error, 'is-error'));
        }
    },

    // ── Carte Mon profil ──
    async renderMeCard() {
        const loading = document.getElementById('profileMeLoading');
        const empty = document.getElementById('profileMeEmpty');
        const content = document.getElementById('profileMeContent');
        if (!content) return;

        let savedPlayer = null;
        try {
            const raw = localStorage.getItem('kchess.myProfilePlayer');
            if (raw) savedPlayer = JSON.parse(raw);
        } catch(e) {}

        const id = this.getStoredPlayer();

        if (!id && !savedPlayer) {
            if (loading) loading.hidden = true; if (empty) empty.hidden = false; content.hidden = true; return;
        }

        if (loading) loading.hidden = false; if (empty) empty.hidden = true; content.hidden = true;

        if (id && /^\d+$/.test(id)) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            try {
                const res = await fetch('fide.php?id=' + encodeURIComponent(id), { signal: controller.signal });
                clearTimeout(timeout);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const data = await res.json();
                if (!data.ok) throw new Error('FIDE error');
                
                if (loading) loading.hidden = true;
                content.hidden = false;
                this.renderMePlayer(data.player, data.history);
                return;
            } catch (e) {
                clearTimeout(timeout);
                console.warn('Fiche FIDE indisponible :', e.message);
            }
        }

        if (loading) loading.hidden = true;
        content.hidden = false;
        this.renderMePlayer(savedPlayer, null);
    },

    renderMePlayer(p, history) {
        const content = document.getElementById('profileMeContent');
        if (!content) return;
        content.innerHTML = '';

        const card = document.createElement('article');
        card.className = 'profile-fide-card profile-me-player';

        const head = document.createElement('header');
        head.className = 'profile-fide-head';

        const who = document.createElement('div');
        const h = document.createElement('h3'); h.textContent = p.name || '';
        const sub = document.createElement('p');
        sub.textContent = [p.title, p.federation, p.year ? this.T.born + ' ' + p.year : null].filter(Boolean).join(' · ');
        const idp = document.createElement('p');
        idp.className = 'profile-fide-id';
        idp.textContent = this.T.fide_id + ' ' + (p.id || p.fide || '—');
        who.append(h, sub, idp);
        head.appendChild(who);
        card.appendChild(head);

        if (p.standard || p.rapid || p.blitz) {
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
        }

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

        if (p.id || p.fide) {
            const seeBtn = document.createElement('a');
            seeBtn.href = 'profile.php?view=players&fide=' + encodeURIComponent(p.id || p.fide);
            seeBtn.className = 'home-feature-btn';
            seeBtn.innerHTML = '<i class="bi bi-box-arrow-up-right" aria-hidden="true"></i><span>Voir la fiche complète</span>';
            actions.appendChild(seeBtn);
        }

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'profile-add-cancel';
        clearBtn.textContent = 'Retirer mon profil';
        clearBtn.addEventListener('click', () => {
            if (!window.confirm('Retirer ce joueur de votre profil ?')) return;
            try { 
                localStorage.removeItem(this.FIDE_KEY); 
                localStorage.removeItem('kchess.myProfilePlayer');
            } catch (e) {}
            content.innerHTML = ''; content.hidden = true;
            const empty = document.getElementById('profileMeEmpty');
            if (empty) empty.hidden = false;
            this.renderMeClubs();
            this.renderMeGames();
        });
        actions.appendChild(clearBtn);

        card.appendChild(actions);
        content.appendChild(card);
    },

    renderMeClubs() {
        const box = document.getElementById('profileMeClubs');
        if (!box) return;
        box.innerHTML = '';
        
        let myProfileId = null;
        let myProfileName = null;
        try {
            const raw = localStorage.getItem('kchess.myProfilePlayer');
            if (raw) {
                const p = JSON.parse(raw);
                myProfileId = String(p.fide || p.id || '');
                myProfileName = p.name;
            }
        } catch(e) {}
        const id = this.getStoredPlayer() || myProfileId;

        if (!id && !myProfileName) {
            const clubs = this.CLUBS;
            if (!clubs.length) {
                const p = document.createElement('p'); p.className = 'profile-fide-note';
                p.textContent = 'Aucun club enregistré.'; box.appendChild(p); return;
            }
            const hint = document.createElement('p'); hint.className = 'profile-fide-note'; hint.style.marginBottom = '10px';
            hint.textContent = 'Associez votre profil pour voir vos clubs. En attendant, voici les clubs enregistrés :';
            box.appendChild(hint);

            const ul = document.createElement('ul'); ul.className = 'profile-club-list';
            clubs.forEach(club => {
                const li = document.createElement('li');
                const a = document.createElement('a'); a.href = 'club.php?nom=' + encodeURIComponent(club.name); a.className = 'profile-club-player';
                const name = document.createElement('span'); name.textContent = club.name;
                const meta = document.createElement('small');
                meta.textContent = [(club.players || []).length + ' joueurs', club.city, club.region].filter(Boolean).join(' · ');
                a.append(name, meta); li.appendChild(a); ul.appendChild(li);
            });
            box.appendChild(ul);
            return;
        }

        const clubs = this.CLUBS.filter(c => {
            return (c.players || []).some(pl => {
                const isIdMatch = id && String(pl.fide || '') === String(id);
                const isNameMatch = myProfileName && this.norm(pl.name) === this.norm(myProfileName);
                return isIdMatch || isNameMatch;
            });
        });

        if (!clubs.length) {
            const p = document.createElement('p'); p.className = 'profile-fide-note';
            p.textContent = 'Aucun club associé à ce joueur pour le moment.'; box.appendChild(p); return;
        }
        const ul = document.createElement('ul'); ul.className = 'profile-club-list';
        clubs.forEach(club => {
            const li = document.createElement('li');
            const a = document.createElement('a'); a.href = 'club.php?nom=' + encodeURIComponent(club.name); a.className = 'profile-club-player';
            const name = document.createElement('span'); name.textContent = club.name;
            const meta = document.createElement('small');
            meta.textContent = [club.city, club.region, club.country].filter(Boolean).join(' · ');
            a.append(name, meta); li.appendChild(a); ul.appendChild(li);
        });
        box.appendChild(ul);
    },

    // ── 3. Gestion des parties (Filtres + Tri) ──
    bindGameFilters() {
        const filterWins = document.getElementById('filterWins');
        const filterLosses = document.getElementById('filterLosses');
        const filterDraws = document.getElementById('filterDraws');
        const filterAll = document.getElementById('filterAll');
        
        if (filterAll) {
            filterAll.addEventListener('click', () => {
                this.currentGamesFilter = 'all';
                this.updateFilterButtons();
                this.renderMeGames();
            });
        }
        if (filterWins) {
            filterWins.addEventListener('click', () => {
                this.currentGamesFilter = 'win';
                this.updateFilterButtons();
                this.renderMeGames();
            });
        }
        if (filterLosses) {
            filterLosses.addEventListener('click', () => {
                this.currentGamesFilter = 'loss';
                this.updateFilterButtons();
                this.renderMeGames();
            });
        }
        if (filterDraws) {
            filterDraws.addEventListener('click', () => {
                this.currentGamesFilter = 'draw';
                this.updateFilterButtons();
                this.renderMeGames();
            });
        }
    },

    updateFilterButtons() {
        ['filterAll', 'filterWins', 'filterLosses', 'filterDraws'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.classList.toggle('active', btn.dataset.filter === this.currentGamesFilter);
        });
    },

    renderMeGames() {
        const wrapper = document.getElementById('profileMeGames');
        const list = document.getElementById('profileGamesData');
        if (!wrapper || !list) return;

        const id = this.getStoredPlayer();
        if (!id) {
            wrapper.hidden = true;
            return;
        }

        wrapper.hidden = false;
        list.innerHTML = '';

        let games = [];
        try {
            const raw = localStorage.getItem('kchess.myGames');
            if (raw) games = JSON.parse(raw);
        } catch (e) {}

        if (!games.length) {
            list.innerHTML = '<li style="color: var(--site-text-muted); font-size: 0.85rem; padding: 10px;">Aucune partie enregistrée. Cliquez sur "Synchroniser" ou ajoutez-les manuellement.</li>';
            return;
        }

        // Calcul du résumé (Stats)
        let total = games.length;
        let wins = games.filter(g => (g.result === '1-0' || g.result === '1.0')).length;
        let draws = games.filter(g => (g.result === '0.5-0.5' || g.result === '1/2-1/2' || g.result === '0.5')).length;
        let losses = total - wins - draws;

        const summaryEl = document.getElementById('profileGamesSummary');
        if (summaryEl) {
            summaryEl.textContent = `${total} parties (${wins} gagnées, ${draws} nulles, ${losses} perdues)`;
        }

        // Tri chronologique (plus récent d'abord)
        games.sort((a, b) => {
            const dateA = a.date || '';
            const dateB = b.date || '';
            return dateB.localeCompare(dateA);
        });

        // Application du filtre
        let filteredGames = games.filter(g => {
            const isWin = (g.result === '1-0' || g.result === '1.0');
            const isDraw = (g.result === '0.5-0.5' || g.result === '1/2-1/2' || g.result === '0.5');
            
            if (this.currentGamesFilter === 'win' && !isWin) return false;
            if (this.currentGamesFilter === 'loss' && (isWin || isDraw)) return false;
            if (this.currentGamesFilter === 'draw' && !isDraw) return false;
            return true;
        });

        // Affichage
        filteredGames.forEach(g => {
            const li = document.createElement('li');
            
            li.style.display = 'flex';
            li.style.flexDirection = 'column';
            li.style.padding = '10px 12px';
            li.style.borderBottom = '1px solid var(--site-border)';
            li.style.fontSize = '0.85rem';
            
            const dateStr = g.date ? `<span style="color: var(--site-text-muted); font-size: 0.75rem; min-width: 80px;">${g.date}</span>` : '';
            const tournamentStr = g.tournament ? `<span style="color: var(--site-text-muted); font-size: 0.75rem; margin-left: 8px;">(${g.tournament})</span>` : '';
            const opponentName = g.opponent || g.white || 'Inconnu';
            
            // Gestion des Elo (s'ils existent)
            const myElo = g.my_elo ? `<span style="font-size:0.7rem; color:var(--site-text-muted);">(${g.my_elo})</span>` : '';
            const oppElo = g.opp_elo ? `<span style="font-size:0.7rem; color:var(--site-text-muted);">(${g.opp_elo})</span>` : '';

            // Couleur du résultat
            let resultColor = 'var(--site-text-muted)';
            if (g.result === '1-0' || g.result === '1.0') resultColor = 'var(--success-color)';
            else if (g.result === '0-1' || g.result === '0.0') resultColor = '#f85149';

            li.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${dateStr}
                        <div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <strong>${opponentName}</strong> ${oppElo}
                            </div>
                            <div style="font-size: 0.75rem; color: var(--site-text-muted);">
                                Moi ${myElo} vs Adversaire ${oppElo}
                            </div>
                        </div>
                    </div>
                    <span style="color: ${resultColor}; font-weight: bold; font-family: monospace; font-size: 1rem;">${g.result || '?'}</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--site-text-muted); margin-top: 4px;">
                    ${tournamentStr}
                </div>
            `;
            
            list.appendChild(li);
        });
        
        list.style.display = 'block';
        list.style.padding = '0';
        list.style.listStyle = 'none';
        list.style.background = 'var(--site-surface)';
        list.style.borderRadius = '10px';
        list.style.border = '1px solid var(--site-border)';
        list.style.maxHeight = '400px'; // Scroll
        list.style.overflowY = 'auto';
    },

    bindSyncGames() {
        const btn = document.getElementById('syncGamesBtn');
        if (!btn) return;

        btn.addEventListener('click', async () => {
            const id = this.getStoredPlayer();
            if (!id) { alert('Associez d\'abord votre profil.'); return; }

            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Synchro...';
            btn.disabled = true;

            try {
                const res = await fetch(`fide_games.php?id=${encodeURIComponent(id)}`);
                const data = await res.json();

                if (!data.ok) {
                    alert('Impossible de récupérer les parties : ' + (data.error || 'Erreur inconnue'));
                    return;
                }

                const games = data.games || [];
                if (!games.length) {
                    alert('Aucune partie trouvée sur le site de la FIDE.');
                    return;
                }

                try {
                    localStorage.setItem('kchess.myGames', JSON.stringify(games));
                } catch (e) {
                    alert('Erreur de sauvegarde locale.');
                }

                this.renderMeGames();
                alert(`✅ ${games.length} parties synchronisées.`);

            } catch (e) {
                alert('Erreur réseau lors de la synchronisation.');
            } finally {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }
        });
    }
});