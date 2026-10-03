/**
 * Decodificador de descrições (/tecnico/decodificador.html)
 *
 * Pure decoding module: no DOM, no state. The page controller in
 * siteController.js reads the code rows from the page and calls it in the
 * browser (window.TecnicoDecoder); tests/tecnicoDecoder.test.js reads the
 * same rows from the HTML and calls it under `node --test` (require).
 *
 * decode(text, rows) splits a pasted material description into parts and
 * explains each part that has a row. It never guesses: a part with no row
 * is returned as "nao_conferido", and the original line is kept as typed.
 *
 *   normalise  strip accents, upper case; "2,00mm" → "2,00" + "MM";
 *              hyphens separate tokens ("300-Q03" → "300" + "Q03")
 *   match      whole tokens only, longest alias first, up to 3 tokens
 *              "4,75X1200" → "4,75" + "1200"; an edition or metric suffix
 *              on a standard is dropped ("6656:2016", "A572/A572M" → "A572")
 *   bind       N,NN (or N.N, N.NN) is the thickness; a norma or fabricante
 *              row, or any ASTM/NBR/SAE row, opens a scope, and a scoped
 *              row matches only inside its scope; GR is "grossa" unless a
 *              grade follows it ("GR 50", "GR B", "GR 50/55"); a run of
 *              unresolved tokens right after a marker is one part
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.TecnicoDecoder = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const MAX_WINDOW = 3;

    const STATUS = {
        RECOGNISED: 'reconhecido',
        THICKNESS: 'espessura',
        UNRESOLVED: 'nao_conferido',
    };

    // Types whose row opens a scope for the rows that follow it.
    const MARKER_TYPES = new Set(['norma', 'fabricante']);

    const THICKNESS_EXPLANATION = 'Espessura em milímetros.';

    // A thickness is written with a decimal comma ("0,50", "4,0"), or with a
    // dot and one or two decimals ("4.75"). Three decimals after a dot are
    // not read as a thickness: "1.200" in a description is a width.
    const THICKNESS = /^\d{1,3}(?:,\d{1,3}|\.\d{1,2})$/;
    const NUMBER_WITH_MM = /^(\d+(?:[.,]\d+)?)(MM)$/i;

    // What follows GR when GR names a grade, not "grossa": a number, a
    // number with a letter, a single class letter, or a pair ("50/55").
    const GRADE_LIKE = /^(\d+[A-Z]?|[A-E])(\/\d+)?$/;

    // Edition and metric suffixes on a standard's number, dropped before
    // matching: "6656:2016", "6656/2016", "A572/A572M", "A572M".
    const EDITION = /^([A-Z]*\d{3,5})[:/](?:19|20)\d{2}$/;
    const METRIC_PAIR = /^(A\d{2,4})\/A\d{2,4}M$/;
    const METRIC = /^(A\d{2,4})M$/;

    // Rows whose code names a standard family; recognising one starts a
    // new scope even when the row is a grade ("ASTM A36").
    const STANDARD_CODE = /^(?:NBR|ABNT|ASTM|SAE|AISI|EN|DIN|JIS|API|ISO)(?:\s|\d|$)/;

    // A standard this page has no row for still starts a new scope: a grade
    // after "NBR 6655" must not bind to an earlier producer or standard.
    const UNKNOWN_STANDARD = /^(?:NBR|ABNT|ASTM|SAE|AISI|EN|DIN|JIS|API|ISO)\d*$/;

    // Punctuation around a token that is not part of the code.
    const EDGE_PUNCTUATION = /^[,;:.()[\]"']+|[,;:.()[\]"']+$/g;

    // "Ç" → "C", "ã" → "A": accent- and case-blind.
    function fold(value) {
        return String(value).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
    }

    function standardPart(norm) {
        return norm.replace(EDITION, '$1').replace(METRIC_PAIR, '$1').replace(METRIC, '$1');
    }

    // An alias as a matching key: folded, hyphens read as spaces, single spaces.
    function keyOf(value) {
        return fold(value).replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
    }

    /*
     * Split a description into tokens that remember where they came from,
     * so every part can be shown as it was typed.
     * Returns [{ norm, start, end }] with offsets into the original text.
     */
    function tokenize(text) {
        const tokens = [];
        const source = String(text || '');
        const chunk = /[^\s-]+/g;
        let match;
        while ((match = chunk.exec(source)) !== null) {
            let start = match.index;
            let raw = match[0];
            const lead = raw.match(/^[,;:.()[\]"']+/);
            if (lead) {
                start += lead[0].length;
                raw = raw.slice(lead[0].length);
            }
            raw = raw.replace(EDGE_PUNCTUATION, '');
            if (!raw) continue;
            // "4,75X1200X3000": X between digits separates the measures.
            const pieces = [];
            const times = /(?<=\d)[xX](?=\d)/g;
            let from = 0;
            let cut;
            while ((cut = times.exec(raw)) !== null) {
                pieces.push([from, cut.index]);
                from = cut.index + 1;
            }
            pieces.push([from, raw.length]);
            pieces.forEach(([a, b]) => {
                const piece = raw.slice(a, b);
                const at = start + a;
                const withMm = piece.match(NUMBER_WITH_MM);
                if (withMm) {
                    tokens.push({ norm: fold(withMm[1]), start: at, end: at + withMm[1].length });
                    tokens.push({ norm: 'MM', start: at + withMm[1].length, end: at + piece.length });
                } else {
                    tokens.push({ norm: standardPart(fold(piece)), start: at, end: at + piece.length });
                }
            });
        }
        return tokens;
    }

    /*
     * One row as the decoder reads it. The page keeps rows as <dt>/<dd>
     * pairs with data-* attributes; both the controller and the tests
     * build rows through this function so they read them the same way.
     */
    function makeRow(fields) {
        const code = String(fields.code || '').trim();
        const aliases = String(fields.aliases || '')
            .split('|')
            .map(alias => alias.trim())
            .filter(Boolean);
        const scope = String(fields.scope || '').trim();
        return {
            code,
            type: String(fields.type || '').trim(),
            aliases,
            explanation: String(fields.explanation || '').trim(),
            scope: scope || null,
            situacao: String(fields.situacao || '').trim() || null,
            number: Boolean(fields.number),
        };
    }

    // The keys a row answers to. A scoped row answers only to its aliases,
    // because its code carries the scope ("ASTM A572 GR 50"); any other row
    // also answers to its own code.
    function keysOf(row) {
        const keys = row.scope ? row.aliases.slice() : [row.code].concat(row.aliases);
        return Array.from(new Set(keys.map(keyOf).filter(Boolean)));
    }

    function buildIndex(rows) {
        const index = new Map();
        rows.forEach((row, position) => {
            if (row.number) return; // the thickness is read by its shape
            keysOf(row).forEach(key => {
                if (!index.has(key)) index.set(key, []);
                index.get(key).push(position);
            });
        });
        return index;
    }

    function span(text, tokens, from, to, status, row, position) {
        const result = {
            text: text.slice(tokens[from].start, tokens[to - 1].end),
            status,
            start: tokens[from].start,
            end: tokens[to - 1].end,
        };
        if (status === STATUS.THICKNESS) {
            result.explanation = THICKNESS_EXPLANATION;
        }
        if (row) {
            result.code = row.code;
            result.type = row.type;
            result.explanation = row.explanation;
            if (row.scope) result.scope = row.scope;
            if (row.situacao) result.situacao = row.situacao;
            result.index = position;
        }
        return result;
    }

    /*
     * decode(text, rows) → { original, spans, recognized, total }
     *   spans: [{ text, status, start, end, code?, type?, explanation?,
     *             scope?, situacao?, index? }] in the order typed;
     *   status: 'reconhecido' | 'espessura' | 'nao_conferido';
     *   recognized: parts with status other than 'nao_conferido';
     *   total: all parts.
     * index is the row's position in `rows`.
     */
    function decode(text, rowsInput) {
        const original = String(text == null ? '' : text);
        const rows = (rowsInput || []).map(row => (Array.isArray(row.aliases) ? row : makeRow(row)));
        const index = buildIndex(rows);
        const numberRow = rows.findIndex(row => row.number);
        const tokens = tokenize(original);
        const spans = [];

        let scope = null;   // folded code of the marker in force
        let inRun = false;  // inside unresolved tokens right after a marker

        const scopeKey = value => keyOf(value);

        // Longest alias match at token i that fits the scope in force.
        function longest(i) {
            const limit = Math.min(MAX_WINDOW, tokens.length - i);
            for (let size = limit; size >= 1; size -= 1) {
                const key = tokens.slice(i, i + size).map(token => token.norm).join(' ');
                const candidates = index.get(key);
                if (!candidates) continue;
                // GR is "grossa" unless a whole number follows ("GR 50").
                const next = tokens[i + size];
                const usable = candidates.filter(position => {
                    const row = rows[position];
                    if (row.scope) return scope !== null && scopeKey(row.scope) === scope;
                    if (key === 'GR' && next && GRADE_LIKE.test(next.norm)) return false;
                    return true;
                });
                if (usable.length) {
                    // A scoped row is the more specific reading of the same words.
                    usable.sort((a, b) => Number(Boolean(rows[b].scope)) - Number(Boolean(rows[a].scope)));
                    return { position: usable[0], size };
                }
            }
            return null;
        }

        function unresolved(from, to) {
            const last = spans[spans.length - 1];
            if (inRun && last && last.status === STATUS.UNRESOLVED) {
                last.end = tokens[to - 1].end;
                last.text = original.slice(last.start, last.end);
                return;
            }
            spans.push(span(original, tokens, from, to, STATUS.UNRESOLVED));
        }

        let i = 0;
        while (i < tokens.length) {
            const token = tokens[i];

            if (THICKNESS.test(token.norm)) {
                const to = tokens[i + 1] && tokens[i + 1].norm === 'MM' ? i + 2 : i + 1;
                const thickness = span(original, tokens, i, to, STATUS.THICKNESS);
                if (numberRow >= 0) thickness.index = numberRow;
                spans.push(thickness);
                inRun = false;
                i = to;
                continue;
            }

            const match = longest(i);
            if (match) {
                const row = rows[match.position];
                spans.push(span(original, tokens, i, i + match.size, STATUS.RECOGNISED, row, match.position));
                if (MARKER_TYPES.has(row.type) || STANDARD_CODE.test(keyOf(row.code))) {
                    scope = scopeKey(row.code);
                    inRun = true;
                } else {
                    inRun = false;
                }
                i += match.size;
                continue;
            }

            if (UNKNOWN_STANDARD.test(token.norm)) {
                // A standard without a row: its own unresolved part, which
                // the tokens after it join, and no scope.
                scope = null;
                inRun = false;
                unresolved(i, i + 1);
                inRun = true;
                i += 1;
                continue;
            }

            // "GR 50", "GR B" with no standard that owns it: one unresolved part.
            const next = tokens[i + 1];
            const to = token.norm === 'GR' && next && GRADE_LIKE.test(next.norm) ? i + 2 : i + 1;
            unresolved(i, to);
            i = to;
        }

        const recognized = spans.filter(part => part.status !== STATUS.UNRESOLVED).length;
        return { original, spans, recognized, total: spans.length };
    }

    // "1 de 1 parte reconhecida", "5 de 6 partes reconhecidas".
    function summary(result) {
        const total = result.total;
        return result.recognized + ' de ' + total + (total === 1 ? ' parte reconhecida' : ' partes reconhecidas');
    }

    return {
        STATUS,
        MAX_WINDOW,
        fold,
        keyOf,
        tokenize,
        makeRow,
        decode,
        summary,
    };
}));
