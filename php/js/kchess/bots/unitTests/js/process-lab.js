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
        choix:    { label: 'Choix final',                                     color: '#3fb950' }
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
        bonus_positionnels:     { label: 'Bonus de position', group: 'score', implicit: true, desc: "Toujours actif dans LadderBot (absent de PIPELINE) : promotion, avance des pions, centre, développement, roque, échec.", w: ['promotion', 'pawnAdvance', 'centerSquare', 'develop', 'castle', 'check'] },
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
    const ORDER = Object.keys(CATALOG);

    // Bots sans getter PIPELINE : décrits ici (badge « doc »), à remplacer par un vrai getter plus tard
    const FALLBACK = {
        1:  ['coup_aleatoire'],
        16: ['ouverture_livre', 'mat_en_1', 'echange_statique', 'exposition_piece_jouee', 'bonus_positionnels',
             'structure_base', 'structure_avancee', 'garde_pat', 'reponse_adverse', 'securite_roi',
             'menace_mat_en_1', 'promotion_prioritaire', 'choix_meilleur']
    };

    // Clés connues pour le générateur de level factice
    const W_KEYS = ['capture', 'exposure', 'promotion', 'pawnAdvance', 'centerSquare', 'develop', 'castle', 'check',
                    'centerControl', 'doubledPawns', 'majorFile', 'connected', 'doubledRooks', 'fork', 'islands', 'advRanks'];
    const BOOL_KEYS = ['mateIn1', 'openingFilter', 'stalemateGuard', 'conversion', 'repetition', 'mateThreat'];
    const NUM_KEYS = ['noise', 'stalePieces', 'replyLimit', 'replyW', 'kingAttackers'];
    const DRAFT_KEY = 'kchess_process_lab_draft';

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
        return { n, name: inst.name || ('Level ' + n), cfg: inst.cfg || null, depth: depth === undefined ? '?' : depth,
                 source, steps: toSteps(raw) };
    }

    function insertImplicit(raw) {
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
            const b = el('button', 'pl-node' + (s.custom ? ' custom' : ''));
            b.style.setProperty('--c', color(s.id));
            b.dataset.step = s.id;
            b.appendChild(document.createTextNode(i.label));
            if (s.arg) b.appendChild(el('span', 'arg', s.arg));
            if (i.group === 'decision') b.appendChild(el('span', 'exit', '↳ joue le coup si trouvé'));
            if (s.custom) b.appendChild(el('span', 'tag custom', 'nouveau'));
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

        // paramètres (valeurs du level courant si connu)
        const cfg = ctx && ctx.cfg;
        if (cfg) {
            (i.c || []).forEach(k => box.appendChild(kv(k, cfg[k])));
            (i.w || []).forEach(k => box.appendChild(kv('w.' + k, cfg.w ? cfg.w[k] : undefined)));
        }
        const used = LEVELS.filter(l => l.steps && l.steps.some(s => s.id === id)).map(l => 'L' + l.n);
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
            root.appendChild(renderColumn('Level ' + lv.n, { text: 'depth ' + lv.depth, badge: lv.source }, lv.steps, lv));
        });
    }

    function renderMatrix() {
        const t = $('#matrix');
        t.innerHTML = '';
        const ok = LEVELS.filter(l => l.steps);
        const ids = [];
        ok.forEach(l => l.steps.forEach(s => { if (!ids.includes(s.id)) ids.push(s.id); }));
        ids.sort((a, b) => {
            const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
            return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
        });

        const hr = el('tr');
        hr.appendChild(el('th', null, 'Process'));
        ok.forEach(l => hr.appendChild(el('th', null, 'L' + l.n)));
        t.appendChild(hr);

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
                const s = l.steps.find(x => x.id === id);
                const td = el('td', s ? 'on' + (s.isNew ? ' new' : '') : 'off', s ? '●' : '·');
                if (s && s.arg) td.appendChild(el('span', 'arg', s.arg));
                tr.appendChild(td);
            });
            t.appendChild(tr);
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
        return { base: base ? base.n : null, level: 99, cfg, customs: [] };
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
        if (i >= 0) { raw.splice(i + 1, 0, 'bonus_positionnels'); flags.splice(i + 1, 0, null); }
        return toSteps(raw, flags);
    }

    function buildCode() {
        const c = draft.cfg, lv = draft.level;
        const q = (v) => JSON.stringify(v);
        const w = Object.keys(c.w || {}).filter(k => c.w[k] !== undefined && c.w[k] !== '')
            .map(k => k + ': ' + c.w[k]).join(', ');
        const L = [];
        L.push('/**');
        L.push(' * Level_' + lv + ' — level factice généré par Bot_Process.php (base : Level_' + (draft.base || '?') + ')');
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
        fsC.appendChild(el('p', 'pl-note', "Le score des process s'additionne : leur position dans le schéma est indicative (seuls « mat en 1 » et le filtre d'ouverture agissent avant le calcul)."));
        form.appendChild(fsC);

        updateOutputs();
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
    function refreshAll() { renderDiagrams(); renderMatrix(); if (draft) updateOutputs(); }

    function renderLegend() {
        const lg = $('#pl-legend');
        Object.keys(GROUPS).forEach(g => {
            const s = el('span'); const i = el('i'); i.style.background = GROUPS[g].color;
            s.appendChild(i); s.appendChild(document.createTextNode(GROUPS[g].label)); lg.appendChild(s);
        });
        const n = el('span'); const tg = el('b', null, '+'); tg.style.cssText = 'background:#3fb950;color:#0d1117;padding:0 5px;border-radius:3px;font-size:10px';
        n.appendChild(tg); n.appendChild(document.createTextNode(' nouveau par rapport au level précédent'));
        lg.appendChild(n);
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
        renderLegend();
        draft = loadDraft();
        renderDiagrams();
        renderMatrix();
        renderBuilder();
        bindExport();
        initTabs();
        window.processLab = { LEVELS, CATALOG, get draft() { return draft; } };
    });
})();
