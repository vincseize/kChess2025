/**
 * js/process-lab.js — Laboratoire de process des bots
 *
 * Source de vérité : le getter PIPELINE de chaque bot (LadderBot L3-L8, Level_2).
 * Les bots sans PIPELINE (L1, L16) sont décrits dans FALLBACK ci-dessous (badge « doc »).
 * Pour ajouter un process connu : une entrée dans CATALOG (libellé, famille, description).
 */
(function () {
    'use strict';

    // ------------------------------------------------------------------
    // Familles de process
    // ------------------------------------------------------------------
    const GROUPS = {
        decision: { label: 'Décision immédiate (joue le coup et s\'arrête)', color: '#f85149' },
        filtre:   { label: 'Filtre (écarte des coups)',                       color: '#d29922' },
        score:    { label: 'Score (ajoute des points à chaque coup)',         color: '#58a6ff' },
        choix:    { label: 'Choix final',                                     color: '#3fb950' },
        ecmo:     { label: 'ECMO — principe de réflexion (factice)',          color: '#bc8cff' }
    };

    // ------------------------------------------------------------------
    // Catalogue des process connus.  w:[...] = poids cfg.w ; c:[...] = clés cfg
    // ------------------------------------------------------------------
    const CATALOG = {
        ouverture_livre:        { label: "Livre d'ouverture", group: 'decision', desc: "Pendant les 6 premiers coups, rejoue le coup du livre si la position y figure." },
        mat_en_1:               { label: 'Mat en 1', group: 'decision', desc: "Si un coup met l'adversaire mat, le joue immédiatement." },
        captures_rentables:     { label: 'Captures rentables', group: 'decision', desc: "Teste jusqu'à 3 captures (la plus chère d'abord) ; joue la première qui est protégée ou qui prend au moins autant que la pièce jouée." },
        promotion_prioritaire:  { label: 'Promotion prioritaire', group: 'decision', desc: "S'il existe un coup de promotion, le joue en priorité." },
        filtre_ouverture:       { label: "Filtre d'ouverture", group: 'filtre', desc: "Au 1er coup, écarte les pions des colonnes a et h (si d'autres coups existent)." },
        garde_pat:              { label: 'Garde anti-pat', group: 'filtre', desc: "Évite les coups qui provoquent le pat en fin de partie (peu de pièces).", c: ['stalePieces'] },
        coup_sur:               { label: 'Coups sûrs', group: 'filtre', desc: "Écarte les coups qui finissent sur une case attaquée par l'adversaire." },
        centre_sur:             { label: 'Centre (coups sûrs)', group: 'filtre', desc: "Parmi les coups sûrs, préfère ceux qui arrivent dans le centre (c3–f6)." },
        echange_statique:       { label: 'Échange statique', group: 'score', desc: "Capture : gain net de la séquence de prises et reprises sur la case.", w: ['capture'] },
        exposition_piece_jouee: { label: 'Exposition pièce jouée', group: 'score', desc: "Coup tranquille : pénalise la pièce jouée si elle arrive sur une case attaquée ou mal défendue.", w: ['exposure'] },
        bonus_positionnels:     { label: 'Bonus de position', group: 'score', desc: "Promotion, avance des pions, centre, développement, roque, échec.", w: ['promotion', 'pawnAdvance', 'centerSquare', 'develop', 'castle', 'check'] },
        structure_base:         { label: 'Structure de base', group: 'score', desc: "Variation du contrôle du centre, des pions doublés, des colonnes des pièces lourdes.", w: ['centerControl', 'doubledPawns', 'majorFile'] },
        structure_avancee:      { label: 'Structure avancée', group: 'score', desc: "Pions liés, tours doublées, fourchettes de cavalier, îlots de pions, rangées avancées.", w: ['connected', 'doubledRooks', 'fork', 'islands', 'advRanks'] },
        conversion_finale:      { label: 'Conversion finale', group: 'score', desc: "Avec un net avantage matériel et peu de pièces : réduit les coups adverses et rapproche le roi." },
        anti_repetition:        { label: 'Anti-répétition', group: 'score', desc: "Pénalise les coups qui répètent une position quand le bot est en avantage." },
        reponse_adverse:        { label: 'Réponse adverse', group: 'score', desc: "depth 1 : examine la meilleure réponse adverse (captures/échecs) et pénalise le coup.", c: ['replyLimit', 'replyW'] },
        securite_roi:           { label: 'Sécurité du roi', group: 'score', desc: "Pénalise un coup qui laisse 2 attaquants ou plus sur le roi.", c: ['kingAttackers'] },
        menace_mat_en_1:        { label: 'Menace de mat en 1', group: 'score', desc: "Pénalité énorme si, après le coup, l'adversaire peut mater en 1.", c: ['mateThreat'] },
        choix:                  { label: 'Choix (meilleur + bruit)', group: 'choix', desc: "Joue le meilleur score + un bruit aléatoire : plus le bruit est fort, plus le bot se trompe.", c: ['noise'] },
        choix_meilleur:         { label: 'Meilleur score', group: 'choix', desc: "Joue le coup au meilleur score." },
        repli_aleatoire:        { label: 'Repli aléatoire', group: 'choix', desc: "Dernier recours : coup au hasard parmi les coups restants." },
        coup_aleatoire:         { label: 'Coup aléatoire', group: 'choix', desc: "Choisit au hasard parmi tous les coups légaux (promotion en dame automatique)." }
    };

    // Principe ECMO : Échecs → Captures → Menaces → Optimisation (process factices, ajoutés via la matrice)
    const ECMO_IDS = ['ecmo_echecs', 'ecmo_captures', 'ecmo_menaces', 'ecmo_optimisation'];
    Object.assign(CATALOG, {
        ecmo_echecs:       { label: 'ECMO · Échecs', group: 'ecmo', factice: true, desc: "É : examiner d'abord les coups qui donnent échec (mat en 1, gain de temps, roi adverse acculé)." },
        ecmo_captures:     { label: 'ECMO · Captures', group: 'ecmo', factice: true, desc: "C : examiner ensuite les prises : gain net, pièce protégée ou non (échange statique)." },
        ecmo_menaces:      { label: 'ECMO · Menaces', group: 'ecmo', factice: true, desc: "M : repérer les pièces attaquées (les siennes, celles de l'adversaire) et les menaces adverses à parer ; créer ses propres menaces (fourchettes)." },
        ecmo_optimisation: { label: 'ECMO · Optimisation', group: 'ecmo', factice: true, desc: "O : sans échec, capture ni menace, améliorer la pièce la moins active ou la structure (développement, centre, roque)." }
    });

    // Ordre canonique des process (sert à trier la matrice et à placer un process ajouté)
    const ORDER = ['ouverture_livre', 'mat_en_1', 'filtre_ouverture', 'ecmo_echecs', 'ecmo_captures', 'captures_rentables',
        'echange_statique', 'exposition_piece_jouee', 'bonus_positionnels', 'ecmo_menaces', 'structure_base', 'structure_avancee',
        'garde_pat', 'centre_sur', 'coup_sur', 'conversion_finale', 'anti_repetition', 'reponse_adverse', 'securite_roi',
        'menace_mat_en_1', 'ecmo_optimisation', 'promotion_prioritaire', 'choix', 'choix_meilleur', 'repli_aleatoire', 'coup_aleatoire'];
    const rankOf = (id) => { const i = ORDER.indexOf(id); return i < 0 ? 999 : i; };

    // Règles de placement ECMO par rapport aux process existants (le pipeline réel n'est jamais modifié)
    //   É : après mat en 1 / filtre d'ouverture, sinon au début
    //   C : avant les captures (captures rentables / échange statique)
    //   M : avant « réponse adverse » (depth 1), sinon après bonus de position / exposition, sinon avant « coups sûrs »
    //   O : juste avant le choix final
    const ECMO_RULES = {
        ecmo_echecs:       { afterLast: ['ouverture_livre', 'mat_en_1', 'filtre_ouverture'], start: true },
        ecmo_captures:     { before: ['captures_rentables', 'echange_statique'] },
        ecmo_menaces:      { before: ['reponse_adverse'], afterLast: ['bonus_positionnels', 'exposition_piece_jouee'], before2: ['coup_sur'] },
        ecmo_optimisation: {}
    };

    // Repli uniquement si un bot n'expose ni PIPELINE ni PROCESS_CONFIG (badge « doc »)
    const FALLBACK = {
        1:  ['coup_aleatoire'],
        16: ['ouverture_livre', 'mat_en_1', 'echange_statique', 'exposition_piece_jouee', 'bonus_positionnels',
             'structure_base', 'structure_avancee', 'reponse_adverse', 'garde_pat', 'securite_roi',
             'menace_mat_en_1', 'promotion_prioritaire', 'choix_meilleur']
    };

    // Clés connues pour le générateur de level factice
    const W_KEYS = ['capture', 'exposure', 'promotion', 'pawnAdvance', 'centerSquare', 'develop', 'castle', 'check',
                    'centerControl', 'doubledPawns', 'majorFile', 'connected', 'doubledRooks', 'fork', 'islands', 'advRanks'];
    const BOOL_KEYS = ['mateIn1', 'openingFilter', 'stalemateGuard', 'conversion', 'repetition', 'mateThreat'];
    const NUM_KEYS = ['noise', 'stalePieces', 'replyLimit', 'replyW', 'kingAttackers'];
    const DRAFT_KEY = 'kchess_process_lab_draft';

    // Valeurs par défaut quand un process est activé sur un level qui n'en avait pas les poids (poids de L8)
    const DEFAULT_W = { capture: 1, exposure: 1, promotion: 800, pawnAdvance: 3, centerSquare: 12, develop: 15, castle: 60, check: 30,
                        centerControl: 8, doubledPawns: 20, majorFile: 10, connected: 15, doubledRooks: 25, fork: 1, islands: 20, advRanks: 15 };
    const DEFAULT_CFG = { depth: 0, noise: 50, mateIn1: false, openingFilter: false, stalemateGuard: false, stalePieces: 12,
                          conversion: false, repetition: false, replyLimit: 8, replyW: 1, kingAttackers: 60, mateThreat: false, w: {} };
    // Poids lus sans garde par LadderBot : toujours écrits dans l'export (0 = inactif), sinon NaN
    const UNGUARDED_W = ['capture', 'exposure', 'promotion', 'pawnAdvance', 'centerSquare', 'develop', 'castle', 'check'];
    // Process que LadderBot sait réellement exécuter
    const LADDER_SUPPORTED = ['mat_en_1', 'filtre_ouverture', 'echange_statique', 'exposition_piece_jouee', 'bonus_positionnels',
                              'structure_base', 'structure_avancee', 'garde_pat', 'conversion_finale', 'anti_repetition',
                              'reponse_adverse', 'securite_roi', 'menace_mat_en_1', 'choix'];

    // ------------------------------------------------------------------
    // Utilitaires
    // ------------------------------------------------------------------
    const $ = (sel, root = document) => root.querySelector(sel);
    const el = (tag, cls, text) => {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    };
    const parse = (raw) => {
        const m = /^([a-z0-9_]+)(?:\((.*)\))?$/i.exec(raw);
        return m ? { id: m[1], arg: m[2] || '' } : { id: raw, arg: '' };
    };
    const info = (id) => CATALOG[id] || { label: id, group: 'score', desc: 'Process non référencé dans CATALOG (process-lab.js).' };
    const color = (id) => GROUPS[info(id).group].color;
    const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };

    // ------------------------------------------------------------------
    // Lecture des levels
    // ------------------------------------------------------------------
    function toSteps(rawList, extra) {
        return rawList.map((raw, i) => Object.assign({ raw, ...parse(raw) }, extra && extra[i] ? extra[i] : {}));
    }

    function levelInfo(n) {
        const cls = window['Level_' + n];
        if (!cls) return { n, error: 'Level_' + n + ' non chargé' };
        let inst;
        try { inst = new cls(); } catch (e) { return { n, error: e.message }; }

        let raw, source;
        if (Array.isArray(inst.PIPELINE)) { raw = inst.PIPELINE.slice(); source = 'bot'; }
        else { raw = (FALLBACK[n] || []).slice(); source = 'doc'; }

        const isLadder = typeof LadderBot !== 'undefined' && inst instanceof LadderBot;
        if (isLadder) insertImplicit(raw);

        const depth = (cls.SEARCH_DEPTH !== undefined) ? cls.SEARCH_DEPTH : (inst.cfg && inst.cfg.depth);
        let processConfig = null;
        try { processConfig = inst.PROCESS_CONFIG || null; } catch (e) { /* ignore */ }
        return { n, name: inst.name || ('Level ' + n), cfg: inst.cfg || null, processConfig, depth: depth === undefined ? '?' : depth,
                 source, steps: toSteps(raw) };
    }

    function insertImplicit(raw) {
        if (raw.some(s => parse(s).id === 'bonus_positionnels')) return;   // déjà dans le PIPELINE du bot
        const i = raw.findIndex(s => parse(s).id === 'exposition_piece_jouee');
        if (i >= 0) raw.splice(i + 1, 0, 'bonus_positionnels');
    }

    // ------------------------------------------------------------------
    // Rendu d'une colonne de diagramme
    // ------------------------------------------------------------------
    let selected = null;

    function renderColumn(title, meta, steps, ctx) {
        const col = el('div', 'pl-col');
        const head = el('div', 'pl-col-head');
        head.appendChild(el('div', 'pl-col-title', title));
        const m = el('div', 'pl-col-meta', meta.text || '');
        if (meta.badge) { m.appendChild(document.createTextNode(' ')); m.appendChild(el('span', 'pl-badge ' + meta.badge, meta.badge === 'bot' ? 'lu du bot' : 'doc')); }
        head.appendChild(m);
        col.appendChild(head);

        col.appendChild(el('div', 'pl-terminal', 'coups légaux'));
        steps.forEach((s) => {
            col.appendChild(el('div', 'pl-edge', '▼'));
            const i = info(s.id);
            const b = el('button', 'pl-node' + ((s.custom || s.added) ? ' custom' : '') + (s.removed ? ' removed' : ''));
            b.style.setProperty('--c', color(s.id));
            b.dataset.step = s.id;
            b.appendChild(document.createTextNode(i.label));
            if (s.arg) b.appendChild(el('span', 'arg', s.arg));
            if (i.group === 'decision') b.appendChild(el('span', 'exit', '↳ joue le coup si trouvé'));
            if (s.custom) b.appendChild(el('span', 'tag custom', 'nouveau'));
            else if (s.added) b.appendChild(el('span', 'tag custom', 'factice'));
            else if (s.removed) b.appendChild(el('span', 'tag removed', 'retiré'));
            else if (s.isNew) b.appendChild(el('span', 'tag new', '+'));
            else if (i.implicit) b.appendChild(el('span', 'tag impl', 'implicite'));
            if (selected && selected !== s.id) b.classList.add('dim');
            b.addEventListener('click', () => showDetail(s.id, ctx));
            col.appendChild(b);
        });
        col.appendChild(el('div', 'pl-edge', '▼'));
        col.appendChild(el('div', 'pl-terminal', 'coup joué'));
        return col;
    }

    function markNew(levels) {
        levels.forEach((lv, idx) => {
            if (!lv.steps) return;
            const prev = levels.slice(0, idx).reverse().find(l => l.steps);
            const prevIds = new Set(prev ? prev.steps.map(s => s.id) : []);
            lv.steps.forEach(s => { s.isNew = prev ? !prevIds.has(s.id) : false; });
        });
    }

    // ------------------------------------------------------------------
    // Panneau de détail
    // ------------------------------------------------------------------
    let LEVELS = [];

    function showDetail(id, ctx) {
        selected = (selected === id) ? null : id;
        refreshAll();
        const box = $('#pl-detail');
        if (!selected) { box.hidden = true; return; }
        const i = info(id);
        box.style.setProperty('--c', color(id));
        box.innerHTML = '';
        const close = el('button', 'close', '✕');
        close.addEventListener('click', () => { selected = null; box.hidden = true; refreshAll(); });
        box.appendChild(close);
        box.appendChild(el('h4', null, i.label));
        const idLine = el('div', 'pl-note');
        idLine.appendChild(el('code', null, id));
        idLine.appendChild(document.createTextNode(' · ' + GROUPS[i.group].label));
        box.appendChild(idLine);
        box.appendChild(el('p', null, i.desc));
        if (i.factice) box.appendChild(el('p', 'pl-note', 'Process factice : il n\'existe pas dans le code des bots, il sert à visualiser où il s\'insérerait.'));

        // paramètres (valeurs du level courant si connu)
        const pc = ctx && ctx.processConfig && ctx.processConfig[id];
        const cfg = ctx && ctx.cfg;
        if (pc && typeof pc === 'object') {
            Object.keys(pc).forEach(k => box.appendChild(kv(k, pc[k])));
        } else if (cfg) {
            (i.c || []).forEach(k => box.appendChild(kv(k, cfg[k])));
            (i.w || []).forEach(k => box.appendChild(kv('w.' + k, cfg.w ? cfg.w[k] : undefined)));
        }
        const used = LEVELS.filter(l => l.steps && effectiveSteps(l).some(s => s.id === id && !s.removed)).map(l => 'L' + l.n);
        box.appendChild(el('div', 'lv', 'Présent dans : ' + (used.join(', ') || '—')));
        box.hidden = false;
    }
    function kv(k, v) {
        const d = el('div', 'kv');
        d.appendChild(el('span', null, k));
        d.appendChild(el('span', null, v === undefined ? '—' : String(v)));
        return d;
    }

    // ------------------------------------------------------------------
    // Vues : diagrammes + matrice
    // ------------------------------------------------------------------
    function renderDiagrams() {
        const root = $('#diagrams');
        root.innerHTML = '';
        LEVELS.forEach(lv => {
            if (lv.error) { const c = el('div', 'pl-col error', 'L' + lv.n + ' : ' + lv.error); root.appendChild(c); return; }
            root.appendChild(renderColumn('Level ' + lv.n, { text: 'depth ' + lv.depth, badge: lv.source }, effectiveSteps(lv), lv));
        });
    }

    // ------------------------------------------------------------------
    // Modifications factices (overlay) : ajouter / enlever un process par level, sans toucher aux bots
    // ------------------------------------------------------------------
    const OVERLAY_KEY = 'kchess_process_lab_overlay_v1';
    let overlay = { enabled: true, levels: {} };

    const isChoice = (id) => info(id).group === 'choix';

    /** Index d'insertion de `id` dans la liste d'ids, selon les règles ECMO ou l'ordre canonique. */
    function placeIndex(ids, id) {
        let choiceIdx = ids.length;
        for (let i = ids.length - 1; i >= 0; i--) { if (isChoice(ids[i])) { choiceIdx = i; break; } }
        const R = ECMO_RULES[id];
        const firstOf = (list) => { for (const a of (list || [])) { const i = ids.indexOf(a); if (i >= 0) return i; } return -1; };
        const lastOf = (list) => { let m = -1; (list || []).forEach(a => { const i = ids.lastIndexOf(a); if (i > m) m = i; }); return m; };
        if (R) {
            let i = firstOf(R.before); if (i >= 0) return i;
            i = lastOf(R.afterLast); if (i >= 0) return i + 1;
            i = firstOf(R.before2); if (i >= 0) return i;
            if (R.start) return 0;
            return choiceIdx;
        }
        const r = rankOf(id);
        for (let i = 0; i < ids.length; i++) { if (rankOf(ids[i]) > r) return Math.min(i, choiceIdx); }
        return choiceIdx;
    }

    /** Étapes du level + modifications factices (retirées marquées, ajoutées insérées au bon endroit). */
    function effectiveSteps(lv) {
        const steps = (lv.steps || []).map(s => Object.assign({}, s));
        const ov = overlay.enabled ? overlay.levels[lv.n] : null;
        if (!ov) return steps;
        steps.forEach(s => { if (ov.removed.includes(s.id)) s.removed = true; });
        const nativeIds = new Set(steps.map(s => s.id));
        const key = (id) => { const e = ECMO_IDS.indexOf(id); return e >= 0 ? [0, e] : [1, rankOf(id)]; };
        ov.added.filter(id => !nativeIds.has(id))
            .sort((a, b) => { const x = key(a), y = key(b); return (x[0] - y[0]) || (x[1] - y[1]); })
            .forEach(id => { steps.splice(placeIndex(steps.map(s => s.id), id), 0, { raw: id, id, arg: '', added: true }); });
        return steps;
    }

    function levelOverlay(n) {
        if (!overlay.levels[n]) overlay.levels[n] = { added: [], removed: [] };
        return overlay.levels[n];
    }
    function saveOverlay() { lsSet(OVERLAY_KEY, JSON.stringify(overlay)); }
    function loadOverlay() {
        try {
            const o = JSON.parse(lsGet(OVERLAY_KEY) || 'null');
            if (o && o.levels) { overlay = { enabled: o.enabled !== false, levels: o.levels }; return; }
        } catch (e) { /* ignore */ }
        applyEcmoEverywhere();   // première visite : ECMO visible sur tous les levels
        overlay.enabled = true;
    }
    function applyEcmoEverywhere() {
        LEVELS.filter(l => l.steps).forEach(l => {
            const ov = levelOverlay(l.n), native = new Set(l.steps.map(s => s.id));
            ECMO_IDS.forEach(id => { if (!native.has(id) && !ov.added.includes(id)) ov.added.push(id); });
        });
    }
    function removeEcmoEverywhere() {
        Object.keys(overlay.levels).forEach(n => { overlay.levels[n].added = overlay.levels[n].added.filter(id => !ECMO_IDS.includes(id)); });
    }
    function overlayCount() {
        return Object.keys(overlay.levels).reduce((t, n) => t + overlay.levels[n].added.length + overlay.levels[n].removed.length, 0);
    }
    function overlaySummary() {
        const lines = [];
        LEVELS.filter(l => l.steps).forEach(l => {
            const ov = overlay.levels[l.n]; if (!ov) return;
            const parts = ov.added.map(id => '+' + id).concat(ov.removed.map(id => '-' + id));
            if (parts.length) lines.push('L' + l.n + ' : ' + parts.join(', '));
        });
        return lines.join('\n') || '(aucune modification)';
    }

    function toggleCell(n, id) {
        const lv = LEVELS.find(l => l.n === n);
        if (!lv || !lv.steps) return;
        const ov = levelOverlay(n);
        const list = lv.steps.some(s => s.id === id) ? ov.removed : ov.added;   // natif → retiré ; absent → ajouté
        const i = list.indexOf(id);
        if (i >= 0) list.splice(i, 1); else list.push(id);
        overlay.enabled = true;
        saveOverlay();
        refreshAll();
    }

    function renderMatrix() {
        const t = $('#matrix');
        t.innerHTML = '';
        const ok = LEVELS.filter(l => l.steps);
        const eff = {};
        ok.forEach(l => { eff[l.n] = effectiveSteps(l); });

        // lignes : tous les process connus (pour pouvoir en ajouter) + ceux inconnus du catalogue présents dans un level
        const ids = ORDER.slice();
        ok.forEach(l => l.steps.forEach(s => { if (!ids.includes(s.id)) ids.push(s.id); }));

        const hr = el('tr');
        hr.appendChild(el('th', null, 'Process'));
        ok.forEach(l => hr.appendChild(el('th', null, 'L' + l.n)));
        t.appendChild(hr);

        const er = el('tr');
        er.appendChild(el('td', 'rowname', 'exporter ⤓'));
        ok.forEach(l => {
            const td = el('td'); const b = el('button', 'pl-th-btn', '⤓');
            b.title = 'Envoyer cette colonne vers « Level factice » pour la télécharger en Level_NN.js';
            b.addEventListener('click', () => sendColumnToBuilder(l));
            td.appendChild(b); er.appendChild(td);
        });
        t.appendChild(er);

        const dr = el('tr');
        dr.appendChild(el('td', 'rowname', 'depth'));
        ok.forEach(l => dr.appendChild(el('td', null, String(l.depth))));
        t.appendChild(dr);

        ids.forEach(id => {
            const tr = el('tr');
            const name = el('td', 'rowname', info(id).label);
            name.style.setProperty('--c', color(id));
            name.addEventListener('click', () => showDetail(id, null));
            tr.appendChild(name);
            ok.forEach(l => {
                const s = eff[l.n].find(x => x.id === id);
                let cls = 'off', txt = '·', title = 'Cliquer pour ajouter (factice)';
                if (s && s.removed) { cls = 'rm'; txt = '✕'; title = 'Retiré (factice) — cliquer pour remettre'; }
                else if (s && s.added) { cls = 'add'; txt = '●'; title = 'Ajouté (factice) — cliquer pour enlever'; }
                else if (s) {
                    cls = 'on' + (s.isNew ? ' new' : ''); txt = '●'; title = 'Présent dans le bot — cliquer pour enlever (factice)';
                    const pc = l.processConfig && l.processConfig[id];
                    if (pc && typeof pc === 'object' && Object.keys(pc).length) title += '\n' + Object.keys(pc).map(k => k + ' = ' + pc[k]).join(', ');
                }
                const td = el('td', cls + ' cell', txt);
                td.title = title;
                if (s && s.arg) td.appendChild(el('span', 'arg', s.arg));
                td.addEventListener('click', () => toggleCell(l.n, id));
                tr.appendChild(td);
            });
            t.appendChild(tr);
        });

        const cr = el('tr');
        cr.appendChild(el('td', 'rowname', 'étapes actives'));
        ok.forEach(l => cr.appendChild(el('td', null, String(eff[l.n].filter(s => !s.removed).length))));
        t.appendChild(cr);
    }

    function updateToolbar() {
        const cb = $('#ov-enabled'); if (cb) cb.checked = overlay.enabled;
        const c = $('#ov-count'); if (c) c.textContent = overlayCount() + ' modification(s) factice(s)';
    }
    function bindToolbar() {
        const cb = $('#ov-enabled');
        cb.addEventListener('change', () => { overlay.enabled = cb.checked; saveOverlay(); refreshAll(); });
        $('#ov-ecmo').addEventListener('click', () => { applyEcmoEverywhere(); overlay.enabled = true; saveOverlay(); refreshAll(); });
        $('#ov-noecmo').addEventListener('click', () => { removeEcmoEverywhere(); saveOverlay(); refreshAll(); });
        $('#ov-clear').addEventListener('click', () => { overlay.levels = {}; saveOverlay(); refreshAll(); });
        $('#ov-copy').addEventListener('click', async (e) => {
            try { await navigator.clipboard.writeText(overlaySummary()); e.target.textContent = '✅ Copié'; }
            catch (err) { e.target.textContent = 'Copie impossible'; }
            setTimeout(() => { e.target.textContent = 'Copier les modifs'; }, 1200);
        });
    }

    // ------------------------------------------------------------------
    // Level factice
    // ------------------------------------------------------------------
    let draft = null;

    function baseLevels() { return LEVELS.filter(l => l.cfg && typeof LadderBot !== 'undefined'); }

    function newDraft(baseN) {
        const base = baseLevels().find(l => l.n === baseN) || baseLevels()[0];
        const cfg = base ? JSON.parse(JSON.stringify(base.cfg)) : { depth: 0, noise: 50, w: {} };
        cfg.name = 'Bot Level 99 (test)';
        return { base: base ? base.n : null, level: 99, cfg, customs: [], from: '', warn: [] };
    }

    function loadDraft() {
        try { const d = JSON.parse(lsGet(DRAFT_KEY) || 'null'); if (d && d.cfg) return d; } catch (e) { /* ignore */ }
        return newDraft(baseLevels().length ? baseLevels()[0].n : null);
    }
    function saveDraft() { lsSet(DRAFT_KEY, JSON.stringify(draft)); }

    function draftCfg() {
        const c = JSON.parse(JSON.stringify(draft.cfg));
        c.level = draft.level;
        return c;
    }

    /** Pipeline du draft : vrai PIPELINE de LadderBot + process implicites + process custom. */
    function draftSteps() {
        const inst = new LadderBot(draftCfg());
        const raw = inst.PIPELINE.slice();
        const flags = raw.map(() => null);
        // même algorithme que le PIPELINE exporté (sur le pipeline réel, sans l'étape implicite)
        draft.customs.forEach(c => {
            const idx = Math.max(0, Math.min(raw.length, raw.length - c.fromEnd));
            raw.splice(idx, 0, c.name);
            flags.splice(idx, 0, { custom: true });
        });
        const i = raw.findIndex(s => parse(s).id === 'exposition_piece_jouee');
        if (i >= 0 && !raw.some(r => parse(r).id === 'bonus_positionnels')) { raw.splice(i + 1, 0, 'bonus_positionnels'); flags.splice(i + 1, 0, null); }
        return toSteps(raw, flags);
    }

    function buildCode() {
        const c = draft.cfg, lv = draft.level;
        const q = (v) => JSON.stringify(v);
        const wAll = Object.assign({}, c.w || {});
        UNGUARDED_W.forEach(k => { if (wAll[k] === undefined || wAll[k] === '') wAll[k] = 0; });
        const w = Object.keys(wAll).filter(k => wAll[k] !== '' && (UNGUARDED_W.includes(k) || Number(wAll[k]) !== 0))
            .map(k => k + ': ' + wAll[k]).join(', ');
        const L = [];
        L.push('/**');
        L.push(' * Level_' + lv + ' — level factice généré par Bot_Process.php (base : Level_' + (draft.base || '?') + ')');
        if (draft.from) L.push(' * Source : ' + draft.from);
        (draft.warn || []).forEach(x => L.push(' * ⚠ ' + x));
        L.push(' * Configuration LadderBot' + (draft.customs.length ? ' + process ajoutés : ' + draft.customs.map(x => x.name).join(', ') : '') + '.');
        L.push(' */');
        L.push('class Level_' + lv + ' extends LadderBot {');
        L.push("    static VERSION = '0.1.0-test';");
        L.push('');
        L.push('    constructor() {');
        L.push('        super({');
        L.push('            name: ' + q(c.name || ('Bot Level ' + lv + ' (test)')) + ', level: ' + lv + ', depth: ' + (c.depth || 0) + ', noise: ' + (c.noise || 0) + ',');
        L.push('            mateIn1: ' + !!c.mateIn1 + ', openingFilter: ' + !!c.openingFilter + ', stalemateGuard: ' + !!c.stalemateGuard + ', stalePieces: ' + (c.stalePieces || 0) + ',');
        L.push('            conversion: ' + !!c.conversion + ', repetition: ' + !!c.repetition + ',');
        L.push('            replyLimit: ' + (c.replyLimit || 0) + ', replyW: ' + (c.replyW || 0) + ', kingAttackers: ' + (c.kingAttackers || 0) + ', mateThreat: ' + !!c.mateThreat + ',');
        L.push('            w: { ' + w + ' }');
        L.push('        });');
        L.push('    }');

        if (draft.customs.length) {
            L.push('');
            L.push('    /** Étapes du schéma de process (lu par Bot_Process.php). */');
            L.push('    get PIPELINE() {');
            L.push('        const p = [...super.PIPELINE];');
            draft.customs.forEach(x => L.push("        p.splice(Math.max(0, p.length - " + x.fromEnd + "), 0, '" + x.name + "');"));
            L.push('        return p;');
            L.push('    }');
            L.push('');
            L.push('    /** Score LadderBot + process ajoutés. */');
            L.push('    _score(game, m, my, opp, ctx) {');
            L.push('        let s = super._score(game, m, my, opp, ctx);');
            draft.customs.forEach(x => L.push('        s += ' + (Number(x.weight) || 1) + ' * this._proc_' + x.name + '(game, m, my, opp, ctx);'));
            L.push('        return s;');
            L.push('    }');
            draft.customs.forEach(x => {
                L.push('');
                L.push('    /** Process « ' + x.name + ' » : renvoie des centipions (+ = bon pour le bot). */');
                L.push('    _proc_' + x.name + '(game, m, my, opp, ctx) {');
                L.push('        const after = this.gf.simulateMove(game, m);   // position après le coup');
                L.push('        if (!after) return 0;');
                L.push('        // TODO : ta logique ici (m.piece, m.isCapture, m.toRow, m.toCol, ctx.plies, ...)');
                L.push('        return 0;');
                L.push('    }');
            });
        }
        L.push('}');
        L.push('window.Level_' + lv + ' = Level_' + lv + ';');
        return L.join('\n') + '\n';
    }

    /**
     * Colonne de la matrice (état affiché : process natifs + modifications factices) → draft de Level_NN.js.
     * Seuls les process que LadderBot exécute vraiment deviennent de la config ; les ECMO deviennent des squelettes.
     */
    function columnToDraft(lv) {
        const on = new Set(effectiveSteps(lv).filter(s => !s.removed).map(s => s.id));
        const cfg = JSON.parse(JSON.stringify(lv.cfg || DEFAULT_CFG));
        cfg.w = cfg.w || {};
        const w = cfg.w;

        // process à poids : actif = au moins un poids > 0 (défauts si aucun), inactif = tous à 0
        ['echange_statique', 'exposition_piece_jouee', 'bonus_positionnels', 'structure_base', 'structure_avancee'].forEach(id => {
            const keys = info(id).w || [];
            if (on.has(id)) { if (!keys.some(k => w[k] > 0)) keys.forEach(k => { w[k] = DEFAULT_W[k]; }); }
            else keys.forEach(k => { w[k] = 0; });
        });
        // drapeaux
        cfg.mateIn1 = on.has('mat_en_1');
        cfg.openingFilter = on.has('filtre_ouverture');
        cfg.stalemateGuard = on.has('garde_pat');
        if (cfg.stalemateGuard && !(cfg.stalePieces > 0)) cfg.stalePieces = 12;
        cfg.conversion = on.has('conversion_finale');
        cfg.repetition = on.has('anti_repetition');
        // depth 1 : trois process indépendants (poids / drapeau à 0 = inactif)
        if (on.has('reponse_adverse')) { if (!(cfg.replyW > 0)) cfg.replyW = 1; if (!(cfg.replyLimit > 0)) cfg.replyLimit = 8; }
        else { cfg.replyW = 0; cfg.replyLimit = 0; }
        if (on.has('securite_roi')) { if (!(cfg.kingAttackers > 0)) cfg.kingAttackers = 60; } else cfg.kingAttackers = 0;
        cfg.mateThreat = on.has('menace_mat_en_1');
        cfg.depth = (cfg.replyW > 0 || cfg.kingAttackers > 0 || cfg.mateThreat) ? 1 : 0;
        if (!(cfg.noise >= 0)) cfg.noise = 50;
        const level = draft ? draft.level : 99;
        cfg.name = 'Bot Level ' + level + ' (test)';

        // ECMO présents dans la colonne → squelettes placés comme dans la matrice
        const arr = new LadderBot(Object.assign({}, cfg, { level })).PIPELINE.map(r => parse(r).id);
        const customs = [];
        ECMO_IDS.filter(id => on.has(id)).forEach(id => {
            const idx = placeIndex(arr, id);
            customs.push({ name: id, weight: 1, fromEnd: arr.length - idx });
            arr.splice(idx, 0, id);
        });

        const warn = [];
        const ignored = [...on].filter(id => !LADDER_SUPPORTED.includes(id) && !ECMO_IDS.includes(id));
        if (ignored.length) warn.push('Non exécutables par LadderBot (ignorés) : ' + ignored.map(id => info(id).label).join(', ') + '.');
        if (!on.has('choix')) warn.push('« Choix (meilleur + bruit) » est toujours présent dans LadderBot : bruit conservé (' + cfg.noise + ').');
        if (customs.length) warn.push('ECMO : squelettes qui renvoient 0 (à coder dans _proc_ecmo_*).');

        return { base: lv.cfg ? lv.n : null, level, cfg, customs, from: 'matrice, colonne L' + lv.n, warn };
    }

    function sendColumnToBuilder(lv) {
        if (typeof LadderBot === 'undefined') return;
        if (draft && (draft.customs.length || draft.from) && !confirm('Remplacer le level factice en cours par la colonne L' + lv.n + ' ?')) return;
        draft = columnToDraft(lv);
        saveDraft();
        renderBuilder();
        const tab = $('.pl-tab[data-tab=builder]'); if (tab) tab.click();
    }

    function renderBuilder() {
        const form = $('#builder-form');
        form.innerHTML = '';
        if (typeof LadderBot === 'undefined' || !baseLevels().length) {
            form.appendChild(el('p', 'pl-note', 'LadderBot ou les levels 3-8 ne sont pas chargés.'));
            return;
        }
        form.appendChild(el('h3', null, 'Level factice'));

        // base + numéro + nom
        const rBase = el('div', 'pl-row'); rBase.appendChild(el('label', null, 'Copier depuis'));
        const sel = el('select');
        baseLevels().forEach(l => { const o = el('option', null, 'Level ' + l.n); o.value = l.n; if (l.n === draft.base) o.selected = true; sel.appendChild(o); });
        sel.addEventListener('change', () => { const keepCustoms = draft.customs; draft = newDraft(Number(sel.value)); draft.customs = keepCustoms; saveDraft(); renderBuilder(); });
        rBase.appendChild(sel); form.appendChild(rBase);

        form.appendChild(numRow('Numéro du level', draft.level, v => { draft.level = Math.max(17, Math.round(v) || 99); }, 'Level_NN.js (≥ 17 conseillé)'));
        const rName = el('div', 'pl-row'); rName.appendChild(el('label', null, 'Nom'));
        const inName = el('input'); inName.type = 'text'; inName.value = draft.cfg.name || '';
        inName.addEventListener('input', () => { draft.cfg.name = inName.value; saveDraft(); updateOutputs(); });
        rName.appendChild(inName); form.appendChild(rName);

        // depth
        const rDepth = el('div', 'pl-row'); rDepth.appendChild(el('label', null, 'Depth'));
        const sd = el('select');
        [0, 1].forEach(d => { const o = el('option', null, 'depth ' + d); o.value = d; if (Number(draft.cfg.depth) === d) o.selected = true; sd.appendChild(o); });
        sd.addEventListener('change', () => { draft.cfg.depth = Number(sd.value); saveDraft(); updateOutputs(); });
        rDepth.appendChild(sd); form.appendChild(rDepth);

        // process activables
        const fsBool = el('div', 'pl-fieldset'); fsBool.appendChild(el('span', 'pl-legend-title', 'Process activables'));
        const labels = { mateIn1: 'Mat en 1', openingFilter: "Filtre d'ouverture", stalemateGuard: 'Garde anti-pat', conversion: 'Conversion finale', repetition: 'Anti-répétition', mateThreat: 'Menace de mat en 1 (depth 1)' };
        BOOL_KEYS.forEach(k => {
            const r = el('div', 'pl-row'); r.appendChild(el('label', null, labels[k]));
            const cb = el('input'); cb.type = 'checkbox'; cb.checked = !!draft.cfg[k];
            cb.addEventListener('change', () => { draft.cfg[k] = cb.checked; saveDraft(); updateOutputs(); });
            r.appendChild(cb); fsBool.appendChild(r);
        });
        form.appendChild(fsBool);

        // numériques
        const fsNum = el('div', 'pl-fieldset'); fsNum.appendChild(el('span', 'pl-legend-title', 'Paramètres'));
        const nlabels = { noise: 'Bruit (erreur)', stalePieces: 'Pièces max pour anti-pat', replyLimit: 'Réponses adverses examinées', replyW: 'Poids réponse adverse', kingAttackers: 'Pénalité attaquants sur roi' };
        NUM_KEYS.forEach(k => fsNum.appendChild(numRow(nlabels[k], draft.cfg[k], v => { draft.cfg[k] = v; })));
        form.appendChild(fsNum);

        // poids
        const fsW = el('div', 'pl-fieldset'); fsW.appendChild(el('span', 'pl-legend-title', 'Poids (0 ou vide = process inactif)'));
        W_KEYS.forEach(k => {
            const r = el('div', 'pl-row'); r.appendChild(el('label', null, k));
            const inp = el('input'); inp.type = 'number'; inp.step = 'any';
            inp.value = (draft.cfg.w && draft.cfg.w[k] !== undefined) ? draft.cfg.w[k] : '';
            inp.addEventListener('input', () => {
                draft.cfg.w = draft.cfg.w || {};
                if (inp.value === '') delete draft.cfg.w[k]; else draft.cfg.w[k] = Number(inp.value);
                saveDraft(); updateOutputs();
            });
            r.appendChild(inp); fsW.appendChild(r);
        });
        form.appendChild(fsW);

        // nouveaux process
        const fsC = el('div', 'pl-fieldset'); fsC.appendChild(el('span', 'pl-legend-title', 'Nouveaux process (squelette généré)'));
        draft.customs.forEach((c, idx) => {
            const row = el('div', 'pl-custom');
            row.appendChild(el('span', 'nm', c.name));
            const wInp = el('input'); wInp.type = 'number'; wInp.step = 'any'; wInp.value = c.weight; wInp.title = 'Poids';
            wInp.addEventListener('input', () => { c.weight = Number(wInp.value) || 1; saveDraft(); updateOutputs(); });
            row.appendChild(wInp);
            const up = el('button', 'pl-icon', '↑'); up.title = 'Plus tôt dans le schéma';
            up.addEventListener('click', () => { c.fromEnd++; saveDraft(); updateOutputs(); });
            const dn = el('button', 'pl-icon', '↓'); dn.title = 'Plus tard dans le schéma';
            dn.addEventListener('click', () => { c.fromEnd = Math.max(1, c.fromEnd - 1); saveDraft(); updateOutputs(); });
            const rm = el('button', 'pl-icon', '✕');
            rm.addEventListener('click', () => { draft.customs.splice(idx, 1); saveDraft(); renderBuilder(); });
            [up, dn, rm].forEach(b => row.appendChild(b));
            fsC.appendChild(row);
        });
        const add = el('div', 'pl-row');
        const nm = el('input'); nm.type = 'text'; nm.placeholder = 'ex: garde_du_roque';
        const addBtn = el('button', 'pl-btn', '+ Ajouter');
        addBtn.addEventListener('click', () => {
            const name = nm.value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
            if (!name || /^[0-9]/.test(name) || draft.customs.some(c => c.name === name)) { nm.focus(); return; }
            draft.customs.push({ name, weight: 1, fromEnd: 1 });
            saveDraft(); renderBuilder();
        });
        add.appendChild(nm); add.appendChild(addBtn);
        fsC.appendChild(add);
        const ecmoRow = el('div', 'pl-row');
        const ecmoBtn = el('button', 'pl-btn', '+ ECMO (4 process, bon endroit)');
        ecmoBtn.addEventListener('click', () => { addEcmoToDraft(); saveDraft(); renderBuilder(); });
        ecmoRow.appendChild(ecmoBtn); fsC.appendChild(ecmoRow);
        fsC.appendChild(el('p', 'pl-note', "Le score des process s'additionne : leur position dans le schéma est indicative (seuls « mat en 1 » et le filtre d'ouverture agissent avant le calcul)."));
        form.appendChild(fsC);

        updateOutputs();
    }

    /** Ajoute les 4 process ECMO au draft, positionnés selon les mêmes règles que la matrice. */
    function addEcmoToDraft() {
        const arr = new LadderBot(draftCfg()).PIPELINE.map(r => parse(r).id);
        draft.customs.forEach(c => { arr.splice(Math.max(0, Math.min(arr.length, arr.length - c.fromEnd)), 0, c.name); });
        ECMO_IDS.forEach(id => {
            if (draft.customs.some(c => c.name === id)) return;
            const idx = placeIndex(arr, id);
            draft.customs.push({ name: id, weight: 1, fromEnd: arr.length - idx });
            arr.splice(idx, 0, id);
        });
    }

    function numRow(label, value, onSet, title) {
        const r = el('div', 'pl-row'); const l = el('label', null, label); if (title) l.title = title;
        r.appendChild(l);
        const inp = el('input'); inp.type = 'number'; inp.step = 'any'; inp.value = value === undefined ? '' : value;
        inp.addEventListener('input', () => { onSet(inp.value === '' ? 0 : Number(inp.value)); saveDraft(); updateOutputs(); });
        r.appendChild(inp);
        return r;
    }

    function updateOutputs() {
        const prev = $('#builder-preview');
        prev.innerHTML = '';
        let steps;
        try { steps = draftSteps(); } catch (e) { prev.appendChild(el('div', 'pl-col error', e.message)); return; }

        const base = baseLevels().find(l => l.n === draft.base);
        const baseIds = new Set(base ? base.steps.map(s => s.id) : []);
        steps.forEach(s => { s.isNew = !s.custom && base ? !baseIds.has(s.id) : false; });
        prev.appendChild(renderColumn('Level ' + draft.level, { text: 'depth ' + draft.cfg.depth }, steps, { cfg: draftCfg() }));
        if (base) prev.appendChild(renderColumn('Level ' + base.n + ' (base)', { text: 'depth ' + base.depth, badge: base.source }, base.steps.map(s => Object.assign({}, s, { isNew: false })), base));

        const ids = new Set(steps.map(s => s.id));
        const removed = base ? base.steps.filter(s => !ids.has(s.id)).map(s => info(s.id).label) : [];
        const added = steps.filter(s => s.isNew || s.custom).map(s => info(s.id).label);
        $('#builder-diff').textContent = 'Par rapport à Level ' + (draft.base || '?') + ' — ajoutés : ' + (added.join(', ') || 'aucun') + ' · retirés : ' + (removed.join(', ') || 'aucun');
        $('#builder-code').textContent = buildCode();
        const wEl = $('#builder-warn'); if (wEl) wEl.textContent = (draft.warn || []).map(x => '⚠ ' + x).join('\n');
        $('#btn-download').textContent = 'Télécharger Level_' + draft.level + '.js';
    }

    function bindExport() {
        $('#btn-copy').addEventListener('click', async (e) => {
            try { await navigator.clipboard.writeText(buildCode()); e.target.textContent = '✅ Copié'; }
            catch (err) { e.target.textContent = 'Copie impossible'; }
            setTimeout(() => { e.target.textContent = 'Copier'; }, 1200);
        });
        $('#btn-download').addEventListener('click', () => {
            const blob = new Blob([buildCode()], { type: 'text/javascript' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'Level_' + draft.level + '.js';
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        });
        $('#btn-reset').addEventListener('click', () => {
            if (!confirm('Réinitialiser le level factice ?')) return;
            draft = newDraft(baseLevels().length ? baseLevels()[0].n : null); saveDraft(); renderBuilder();
        });
    }

    // ------------------------------------------------------------------
    // Init
    // ------------------------------------------------------------------
    function refreshAll() { renderDiagrams(); renderMatrix(); updateToolbar(); if (draft) updateOutputs(); }

    function renderLegend() {
        const lg = $('#pl-legend');
        Object.keys(GROUPS).forEach(g => {
            const s = el('span'); const i = el('i'); i.style.background = GROUPS[g].color;
            s.appendChild(i); s.appendChild(document.createTextNode(GROUPS[g].label)); lg.appendChild(s);
        });
        const n = el('span'); const tg = el('b', null, '+'); tg.style.cssText = 'background:#3fb950;color:#0d1117;padding:0 5px;border-radius:3px;font-size:10px';
        n.appendChild(tg); n.appendChild(document.createTextNode(' nouveau par rapport au level précédent'));
        lg.appendChild(n);
        const f = el('span'); const tf = el('b', null, 'factice'); tf.style.cssText = 'background:#bc8cff;color:#0d1117;padding:0 5px;border-radius:3px;font-size:10px';
        f.appendChild(tf); f.appendChild(document.createTextNode(' ajouté (modification fictive)')); lg.appendChild(f);
        const r = el('span'); const tr2 = el('b', null, 'retiré'); tr2.style.cssText = 'background:#f85149;color:#0d1117;padding:0 5px;border-radius:3px;font-size:10px';
        r.appendChild(tr2); r.appendChild(document.createTextNode(' enlevé (modification fictive)')); lg.appendChild(r);
    }

    function initTabs() {
        document.querySelectorAll('.pl-tab').forEach(btn => btn.addEventListener('click', () => {
            document.querySelectorAll('.pl-tab').forEach(b => b.classList.toggle('active', b === btn));
            document.querySelectorAll('.pl-view').forEach(v => v.classList.toggle('active', v.id === 'tab-' + btn.dataset.tab));
            lsSet('kchess_process_lab_tab', btn.dataset.tab);
        }));
        const saved = lsGet('kchess_process_lab_tab');
        const target = saved && document.querySelector('.pl-tab[data-tab="' + saved + '"]');
        if (target) target.click();
    }

    document.addEventListener('DOMContentLoaded', () => {
        LEVELS = (window.PROCESS_LAB_LEVELS || []).map(levelInfo);
        markNew(LEVELS);
        loadOverlay();
        renderLegend();
        draft = loadDraft();
        renderDiagrams();
        renderMatrix();
        renderBuilder();
        bindExport();
        bindToolbar();
        updateToolbar();
        initTabs();
        window.processLab = { LEVELS, CATALOG, columnToDraft, effectiveSteps, get overlay() { return overlay; }, get draft() { return draft; } };
    });
})();
