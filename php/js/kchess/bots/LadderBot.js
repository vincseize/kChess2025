/**
 * bots/LadderBot.js - v1.0.0
 * Moteur commun des niveaux 3 à 8 : UN pipeline, configuré par niveau (données, pas du code dupliqué).
 *
 * Profondeur :
 *   depth 0 (L3-L4) : évalue la position obtenue APRÈS son propre coup (échange statique, exposition de la
 *                     pièce jouée, structure). Ne regarde jamais les réponses adverses.
 *   depth 1 (L5-L8) : ajoute l'analyse de la meilleure réponse adverse (captures/échecs), la sécurité du roi
 *                     et la menace de mat en 1.
 *
 * Toutes les valeurs sont en centipions (pion = 100).
 * Chaque niveau expose PIPELINE (liste d'étapes) pour le futur schéma de process.
 */
class LadderBot {
    static VERSION = '1.0.0';

    constructor(cfg) {
        this.cfg = cfg;
        this.name = cfg.name;
        this.level = cfg.level;
        this.pieceValues = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20000 };
        this.gf = GameFonctions.attach(this);
    }

    /**
     * Process actifs du niveau et leurs paramètres, dans l'ordre du pipeline (source unique).
     * Lu par Bot_Process.php (matrice / diagrammes). Valeur : true ou { paramètres }.
     */
    get PROCESS_CONFIG() {
        const c = this.cfg, w = c.w || {};
        const pick = (...keys) => Object.fromEntries(keys.filter(k => w[k] !== undefined).map(k => [k, w[k]]));
        const p = {};
        if (c.mateIn1) p.mat_en_1 = true;
        if (c.openingFilter) p.filtre_ouverture = true;
        if (w.capture) p.echange_statique = pick('capture');
        if (w.exposure) p.exposition_piece_jouee = pick('exposure');
        const bonus = pick('promotion', 'pawnAdvance', 'centerSquare', 'develop', 'castle', 'check');
        if (Object.values(bonus).some(v => v > 0)) p.bonus_positionnels = bonus;
        if (w.centerControl || w.doubledPawns || w.majorFile) p.structure_base = pick('centerControl', 'doubledPawns', 'majorFile');
        if (w.connected || w.doubledRooks || w.fork || w.islands || w.advRanks) p.structure_avancee = pick('connected', 'doubledRooks', 'fork', 'islands', 'advRanks');
        if (c.stalemateGuard) p.garde_pat = { stalePieces: c.stalePieces };
        if (c.conversion) p.conversion_finale = true;
        if (c.repetition) p.anti_repetition = true;
        if (c.depth >= 1) {   // trois process indépendants : poids / drapeau à 0 = inactif
            if (c.replyW > 0 && c.replyLimit > 0) p.reponse_adverse = { replyLimit: c.replyLimit, replyW: c.replyW };
            if (c.kingAttackers > 0) p.securite_roi = { kingAttackers: c.kingAttackers };
            if (c.mateThreat) p.menace_mat_en_1 = { mateThreat: c.mateThreat };
        }
        p.choix = { noise: c.noise };
        return p;
    }

    /** Étapes actives du niveau, dans l'ordre : sert au schéma de process (dérivé de PROCESS_CONFIG). */
    get PIPELINE() {
        const arg = { reponse_adverse: v => `(${v.replyLimit})`, choix: v => `(bruit=${v.noise})` };
        return Object.entries(this.PROCESS_CONFIG).map(([id, v]) => id + (arg[id] ? arg[id](v) : ''));
    }

    async getMove() {
        try {
            const game = window.chessGame?.core || window.chessGame;
            if (!game) return null;
            const my = game.gameState.currentPlayer.toLowerCase().startsWith('w') ? 'white' : 'black';
            const opp = my === 'white' ? 'black' : 'white';
            const gf = this.gf, cfg = this.cfg;

            const moves = gf.getAllLegalMoves(game, my);
            if (!moves.length) return null;

            if (cfg.mateIn1) {
                for (const m of moves) {
                    const after = gf.simulateMove(game, m);
                    if (!after) continue;
                    if (gf.getAllLegalMoves(after, opp).length !== 0) continue;
                    const k = gf.findKing(after, opp);
                    if (k && gf.isSquareAttacked(after, k.row, k.col, my)) return gf.finalize(m);
                }
            }

            let cands = moves;
            if (cfg.openingFilter) {
                const played = game.gameState.moveHistory.some(h => h.player?.toLowerCase().startsWith(my[0]));
                if (!played) {
                    const f = moves.filter(m => m.piece.type !== 'pawn' || (m.fromCol !== 0 && m.fromCol !== 7));
                    if (f.length) cands = f;
                }
            }

            const ctx = this._context(game, my, opp);
            let best = null, bestS = -Infinity;
            for (const m of cands) {
                const s = this._score(game, m, my, opp, ctx) + (Math.random() * 2 - 1) * cfg.noise;
                if (s > bestS) { bestS = s; best = m; }
            }
            return gf.finalize(best);
        } catch (e) {
            console.error('LadderBot L' + this.level, e);
            return null;
        }
    }

    _context(game, my, opp) {
        const gf = this.gf, w = this.cfg.w;
        const ctx = {
            oppKing: gf.findKing(game, opp),
            balance: gf.getMaterialBalance(game, my),
            nPieces: gf.countPieces(game),
            plies: game.gameState.moveHistory.length,
            history: []
        };
        if (w.centerControl) ctx.center = gf.getCenterControlScore(game, my);
        if (w.doubledPawns) ctx.doubled = gf.getDoubledPawnCount(game, my);
        if (w.islands) ctx.islands = gf.getPawnIslandCount(game, my);
        if (w.majorFile) ctx.major = gf.getMajorPieceFileScore(game, my);
        if (w.connected) ctx.connected = gf.getConnectedPawnPairCount(game, my);
        if (w.doubledRooks) ctx.drooks = gf.getDoubledRookFileCount(game, my);
        if (w.advRanks) ctx.adv = gf.getAdvancedMajorPieceRankCount(game, my);
        if (this.cfg.repetition) {
            const sm = game.gameStatusManager;
            const keyOf = f => f.split(' ').slice(0, 2).join(' ');
            ctx.history = [...(sm?.positionHistory || []), sm?.currentPositionFen].filter(Boolean).map(keyOf);
        }
        return ctx;
    }

    _score(game, m, my, opp, ctx) {
        const gf = this.gf, cfg = this.cfg, w = cfg.w;
        const after = gf.simulateMove(game, m);
        if (!after) return -1e9;
        let s = 0;

        // 1. échange statique (capture) ou exposition de la pièce jouée (coup tranquille)
        if (m.isCapture && m.targetPiece) s += w.capture * gf.evaluateExchange(game, m, my);
        else s -= w.exposure * gf.evaluateMoveExposure(game, m, opp, after);

        // 2. promotion, avancée de pion, centre, développement, roque
        const isPromo = gf.isPromotionMove(m);
        if (isPromo) s += w.promotion;
        if (m.piece.type === 'pawn') {
            const rank = my === 'white' ? 7 - m.toRow : m.toRow;
            s += w.pawnAdvance * rank * rank;
        }
        if (m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5 && m.piece.type !== 'king') s += w.centerSquare;
        if (ctx.plies < 24 && (m.piece.type === 'knight' || m.piece.type === 'bishop')
            && m.fromRow === (my === 'white' ? 7 : 0)) s += w.develop;
        if (m.details?.type === 'castling') s += w.castle;
        if (ctx.plies < 24 && m.piece.type === 'king' && m.details?.type !== 'castling') s -= 40;
        if (m.isCheck) s += w.check;

        // 3. structure (deltas par rapport à la position actuelle)
        if (w.centerControl) s += w.centerControl * (gf.getCenterControlScore(after, my) - ctx.center);
        if (w.doubledPawns) s -= w.doubledPawns * (gf.getDoubledPawnCount(after, my) - ctx.doubled);
        if (w.islands) s -= w.islands * (gf.getPawnIslandCount(after, my) - ctx.islands);
        if (w.majorFile) s += w.majorFile * (gf.getMajorPieceFileScore(after, my) - ctx.major);
        if (w.connected) s += w.connected * (gf.getConnectedPawnPairCount(after, my) - ctx.connected);
        if (w.doubledRooks) s += w.doubledRooks * (gf.getDoubledRookFileCount(after, my) - ctx.drooks);
        if (w.advRanks) s += w.advRanks * (gf.getAdvancedMajorPieceRankCount(after, my) - ctx.adv);
        if (w.fork && m.piece.type === 'knight') {
            s += w.fork * gf.getSafeKnightForkBonus(game, m, my, { simulated: after, baseBonus: 120, perExtraTarget: 40, maximumBonus: 250 });
        }

        // 4. fin de partie : pat, conversion de l'avantage, répétitions
        if (cfg.stalemateGuard && ctx.nPieces <= cfg.stalePieces && gf.isStalemateAfterMove(game, m, opp, after)) s -= 50000;
        if (cfg.conversion && ctx.balance >= 300 && ctx.nPieces <= 10) {
            const oppMoves = gf.getAllLegalMoves(after, opp).length;
            s -= 6 * Math.min(oppMoves, 30);
            const mk = gf.findKing(after, my), ok = gf.findKing(after, opp);
            if (mk && ok) s += (7 - Math.max(Math.abs(mk.row - ok.row), Math.abs(mk.col - ok.col))) * 8;
        }
        if (cfg.repetition && ctx.balance >= 150) {
            const key = after.moveValidator.generateCurrentFEN(opp).split(' ').slice(0, 2).join(' ');
            let n = 0; for (const h of ctx.history) if (h === key) n++;
            s -= 120 * n;
        }

        // 5. depth 1 : réponse adverse, sécurité du roi, menace de mat en 1
        if (cfg.depth >= 1) {
            s -= cfg.replyW * gf.opponentBestReplyPenalty(after, opp, my, cfg.replyLimit) / 2;
            const k = gf.findKing(after, my);
            if (k) {
                const att = gf.countAttackersOnSquare(after, k.row, k.col, opp);
                if (att >= 2) s -= cfg.kingAttackers * att;
            }
            if (cfg.mateThreat && gf.isKingUnderThreat(after, my) && gf.opponentCanMateInOne(after, opp, my)) s -= 100000;
        }
        return s;
    }
}
window.LadderBot = LadderBot;
