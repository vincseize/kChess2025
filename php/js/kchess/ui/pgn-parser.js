/**
 * js/kchess/ui/pgn-parser.js
 * v1.0.0 - Lecture d'un PGN : coups légaux (SAN) -> coordonnées (uci) + notation propre.
 * Utilisé par la page profil (ajout d'une partie, en local uniquement).
 */
const PgnParser = {
    // Cases : index 0 = a8 ... 63 = h1 ; pièces 'wP', 'bN'...
    START: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',

    newState() {
        const pos = new Array(64).fill('');
        this.START.split('/').forEach((row, r) => {
            let c = 0;
            for (const ch of row) {
                if (/\d/.test(ch)) { c += +ch; continue; }
                pos[r * 8 + c] = (ch === ch.toUpperCase() ? 'w' : 'b') + ch.toUpperCase();
                c++;
            }
        });
        return { pos, turn: 'w', castle: { wK: true, wQ: true, bK: true, bQ: true }, ep: -1 };
    },

    sq(i) { return String.fromCharCode(97 + (i % 8)) + (8 - Math.floor(i / 8)); },
    idx(s) { return (8 - +s[1]) * 8 + (s.charCodeAt(0) - 97); },

    attacked(pos, target, byColor) {
        const r0 = Math.floor(target / 8), c0 = target % 8;
        const at = (r, c) => (r >= 0 && r < 8 && c >= 0 && c < 8) ? pos[r * 8 + c] : '';
        // pions
        const pr = byColor === 'w' ? r0 + 1 : r0 - 1;
        for (const dc of [-1, 1]) if (at(pr, c0 + dc) === byColor + 'P') return true;
        // cavaliers
        for (const [dr, dc] of [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]])
            if (at(r0 + dr, c0 + dc) === byColor + 'N') return true;
        // roi
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++)
            if ((dr || dc) && at(r0 + dr, c0 + dc) === byColor + 'K') return true;
        // lignes et diagonales
        const rays = [[[1,0],[-1,0],[0,1],[0,-1]], 'RQ', [[1,1],[1,-1],[-1,1],[-1,-1]], 'BQ'];
        for (let k = 0; k < 4; k += 2) {
            for (const [dr, dc] of rays[k]) {
                let r = r0 + dr, c = c0 + dc;
                while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const p = pos[r * 8 + c];
                    if (p) { if (p[0] === byColor && rays[k + 1].includes(p[1])) return true; break; }
                    r += dr; c += dc;
                }
            }
        }
        return false;
    },

    kingSq(pos, color) { return pos.indexOf(color + 'K'); },
    inCheck(pos, color) {
        const k = this.kingSq(pos, color);
        return k >= 0 && this.attacked(pos, k, color === 'w' ? 'b' : 'w');
    },

    // Applique un coup {from,to,promo,castle,ep} et renvoie le nouvel état
    play(st, m) {
        const pos = st.pos.slice();
        const piece = pos[m.from], color = piece[0];
        const castle = Object.assign({}, st.castle);
        let ep = -1;
        pos[m.to] = piece; pos[m.from] = '';
        if (m.ep) pos[m.to + (color === 'w' ? 8 : -8)] = '';
        if (m.castle) {
            const row = Math.floor(m.from / 8) * 8;
            if (m.castle === 'K') { pos[row + 5] = pos[row + 7]; pos[row + 7] = ''; }
            else { pos[row + 3] = pos[row]; pos[row] = ''; }
        }
        if (m.promo) pos[m.to] = color + m.promo;
        if (piece[1] === 'P' && Math.abs(m.to - m.from) === 16) ep = (m.from + m.to) / 2;
        if (piece[1] === 'K') { castle[color + 'K'] = false; castle[color + 'Q'] = false; }
        for (const [s, key] of [[56,'wQ'],[63,'wK'],[0,'bQ'],[7,'bK']])
            if (m.from === s || m.to === s) castle[key] = false;
        return { pos, turn: color === 'w' ? 'b' : 'w', castle, ep };
    },

    pseudoMoves(st) {
        const { pos, turn, castle, ep } = st, out = [];
        const enemy = turn === 'w' ? 'b' : 'w';
        for (let i = 0; i < 64; i++) {
            const p = pos[i];
            if (!p || p[0] !== turn) continue;
            const r = Math.floor(i / 8), c = i % 8, t = p[1];
            const add = (to, extra) => out.push(Object.assign({ from: i, to, piece: t }, extra || {}));
            if (t === 'P') {
                const dir = turn === 'w' ? -1 : 1, start = turn === 'w' ? 6 : 1, last = turn === 'w' ? 0 : 7;
                const push = (to, extra) => {
                    if (Math.floor(to / 8) === last) for (const pr of 'QRBN') add(to, Object.assign({ promo: pr }, extra || {}));
                    else add(to, extra);
                };
                const f1 = (r + dir) * 8 + c;
                if (r + dir >= 0 && r + dir < 8 && !pos[f1]) {
                    push(f1);
                    if (r === start && !pos[(r + 2 * dir) * 8 + c]) add((r + 2 * dir) * 8 + c);
                }
                for (const dc of [-1, 1]) {
                    const cc = c + dc; if (cc < 0 || cc > 7 || r + dir < 0 || r + dir > 7) continue;
                    const to = (r + dir) * 8 + cc;
                    if (pos[to] && pos[to][0] === enemy) push(to, { capture: true });
                    else if (to === ep) add(to, { capture: true, ep: true });
                }
            } else if (t === 'N' || t === 'K') {
                const d = t === 'N' ? [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]]
                                    : [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
                for (const [dr, dc] of d) {
                    const rr = r + dr, cc = c + dc; if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
                    const to = rr * 8 + cc, q = pos[to];
                    if (!q) add(to); else if (q[0] === enemy) add(to, { capture: true });
                }
                if (t === 'K' && !this.attacked(pos, i, enemy)) {
                    const row = turn === 'w' ? 56 : 0;
                    if (i === row + 4) {
                        if (castle[turn + 'K'] && !pos[row + 5] && !pos[row + 6] && pos[row + 7] === turn + 'R'
                            && !this.attacked(pos, row + 5, enemy) && !this.attacked(pos, row + 6, enemy))
                            add(row + 6, { castle: 'K' });
                        if (castle[turn + 'Q'] && !pos[row + 3] && !pos[row + 2] && !pos[row + 1] && pos[row] === turn + 'R'
                            && !this.attacked(pos, row + 3, enemy) && !this.attacked(pos, row + 2, enemy))
                            add(row + 2, { castle: 'Q' });
                    }
                }
            } else {
                const d = t === 'R' ? [[1,0],[-1,0],[0,1],[0,-1]] : t === 'B' ? [[1,1],[1,-1],[-1,1],[-1,-1]]
                        : [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
                for (const [dr, dc] of d) {
                    let rr = r + dr, cc = c + dc;
                    while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
                        const to = rr * 8 + cc, q = pos[to];
                        if (!q) add(to); else { if (q[0] === enemy) add(to, { capture: true }); break; }
                        rr += dr; cc += dc;
                    }
                }
            }
        }
        return out;
    },

    legalMoves(st) {
        return this.pseudoMoves(st).filter(m => !this.inCheck(this.play(st, m).pos, st.turn));
    },

    // Nettoie le texte d'un PGN et renvoie { tags, tokens }
    tokenize(text) {
        const tags = {};
        let t = String(text || '').replace(/\r/g, '');
        t = t.replace(/^\s*\[(\w+)\s+"([^"]*)"\]\s*$/gm, (_, k, v) => { tags[k] = v; return ''; });
        t = t.replace(/\{[^}]*\}/g, ' ').replace(/;[^\n]*/g, ' ');
        let prev;
        do { prev = t; t = t.replace(/\([^()]*\)/g, ' '); } while (t !== prev);   // variantes
        t = t.replace(/\$\d+/g, ' ').replace(/\d+\.(\.\.)?/g, ' ').replace(/\b(1-0|0-1|1\/2-1\/2|\*)\s*$/, ' ');
        const tokens = t.split(/\s+/).map(x => x.replace(/[!?]+$/, '')).filter(Boolean)
            .filter(x => !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(x));
        return { tags, tokens };
    },

    parse(text) {
        const { tags, tokens } = this.tokenize(text);
        if (!tokens.length) return { ok: false, error: 'empty' };
        let st = this.newState();
        const uci = [], san = [];
        for (let n = 0; n < tokens.length; n++) {
            const raw = tokens[n];
            const tok = raw.replace(/[+#]+$/, '').replace(/0/g, 'O');
            let cands = [];
            if (/^O-O(-O)?$/.test(tok)) {
                const side = tok === 'O-O' ? 'K' : 'Q';
                cands = this.legalMoves(st).filter(m => m.castle === side);
            } else {
                const m = /^([KQRBN])?([a-h])?([1-8])?(x)?([a-h][1-8])(?:=?([QRBN]))?$/.exec(tok);
                if (!m) return { ok: false, error: 'syntax', move: raw, ply: n + 1 };
                const piece = m[1] || 'P', to = this.idx(m[5]);
                cands = this.legalMoves(st).filter(x =>
                    x.piece === piece && x.to === to && !x.castle &&
                    (!m[2] || this.sq(x.from)[0] === m[2]) &&
                    (!m[3] || this.sq(x.from)[1] === m[3]) &&
                    (piece !== 'P' || (m[4] ? true : x.from % 8 === to % 8)) &&
                    ((x.promo || '') === (m[6] || '')));
                if (piece === 'P' && m[4] === undefined) cands = cands.filter(x => !x.capture);
            }
            if (cands.length !== 1) return { ok: false, error: cands.length ? 'ambiguous' : 'illegal', move: raw, ply: n + 1 };
            const mv = cands[0];
            const next = this.play(st, mv);
            const check = this.inCheck(next.pos, next.turn);
            const mate = check && this.legalMoves(next).length === 0;
            // notation propre (SAN) recalculée
            let s;
            if (mv.castle) s = mv.castle === 'K' ? 'O-O' : 'O-O-O';
            else {
                let dis = '';
                if (mv.piece !== 'P') {
                    const others = this.legalMoves(st).filter(x => x.piece === mv.piece && x.to === mv.to && x.from !== mv.from);
                    if (others.length) {
                        const sameFile = others.some(x => x.from % 8 === mv.from % 8);
                        const sameRank = others.some(x => Math.floor(x.from / 8) === Math.floor(mv.from / 8));
                        dis = !sameFile ? this.sq(mv.from)[0] : !sameRank ? this.sq(mv.from)[1] : this.sq(mv.from);
                    }
                }
                s = (mv.piece === 'P' ? (mv.capture ? this.sq(mv.from)[0] : '') : mv.piece + dis)
                    + (mv.capture ? 'x' : '') + this.sq(mv.to) + (mv.promo ? '=' + mv.promo : '');
            }
            san.push(s + (mate ? '#' : check ? '+' : ''));
            uci.push(this.sq(mv.from) + this.sq(mv.to) + (mv.promo ? mv.promo.toLowerCase() : ''));
            st = next;
        }
        return { ok: true, uci, san, tags };
    }
};

if (typeof window !== 'undefined') window.PgnParser = PgnParser;
if (typeof module !== 'undefined') module.exports = PgnParser;
