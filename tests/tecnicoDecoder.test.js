/**
 * Tests for scripts/tecnicoDecoder.js (T02.1, decodificador de descrições).
 * Run from the repo root: node --test
 * No dependencies: node:test and node:assert only.
 *
 * The rows come from tecnico/decodificador.html itself, read the way the
 * page controller reads them, so the tests and the page cannot drift.
 * Every description here is synthetic.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const D = require('../scripts/tecnicoDecoder.js');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'tecnico', 'decodificador.html'), 'utf8');

const decodeEntities = value => value
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function readRows(html) {
    const rows = [];
    const rowPattern = /<div class="tec-code"([^>]*)><dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd><\/div>/g;
    let match;
    while ((match = rowPattern.exec(html)) !== null) {
        const attributes = {};
        for (const [, name, value] of match[1].matchAll(/data-([a-z-]+)(?:="([^"]*)")?/g)) {
            attributes[name] = value === undefined ? true : decodeEntities(value);
        }
        const explanation = match[3]
            .replace(/<span class="tec-tag">[\s\S]*?<\/span>/g, '')
            .replace(/<[^>]+>/g, '');
        rows.push(D.makeRow({
            code: decodeEntities(match[2].replace(/<[^>]+>/g, '')),
            explanation: decodeEntities(explanation),
            type: attributes.type,
            aliases: attributes.aliases,
            scope: attributes.scope,
            situacao: attributes.situacao,
            number: 'number' in attributes,
        }));
    }
    return rows;
}

const ROWS = readRows(HTML);

const decode = text => D.decode(text, ROWS);

// "CHAPA ✓ | LNE 38 ✗" style digest: text, status, and the row code.
const parts = text => decode(text).spans.map(part => [part.text, part.status, part.code || null]);

const R = D.STATUS.RECOGNISED;
const E = D.STATUS.THICKNESS;
const U = D.STATUS.UNRESOLVED;

/* ===== The rows on the page ===== */

test('every row on the page is read, with a type', () => {
    assert.equal(ROWS.length, (HTML.match(/<div class="tec-code"/g) || []).length);
    for (const row of ROWS) {
        assert.ok(row.code, 'a row has a code');
        assert.ok(row.explanation, `${row.code} has an explanation`);
        assert.ok(['forma', 'processo', 'dimensão', 'norma', 'grau', 'revestimento', 'acabamento', 'fabricante']
            .includes(row.type), `${row.code} has a known type, got ${row.type}`);
    }
});

test('the 30 original rows are still there, with their wording', () => {
    const original = {
        BOB: 'Bobina.',
        GR: 'Grossa, ou seja, chapa grossa.',
        'N,NN': 'Espessura em milímetros. É o primeiro número da descrição, escrito com vírgula (por exemplo, 0,50).',
        BbOL: 'Bobina oleada.',
        NO: 'Lantejoula normal, no zincado.',
        'ASTM A36': 'Aço estrutural ASTM A36.',
        NBR8300: 'Norma de chapas grossas.',
    };
    for (const [code, explanation] of Object.entries(original)) {
        const row = ROWS.find(candidate => candidate.code === code);
        assert.ok(row, `${code} is on the page`);
        assert.equal(row.explanation, explanation);
    }
    const codes = ['BOB', 'CHAPA', 'TIRA', 'GR', 'TR', 'BLANK', 'FF', 'FQ', 'LTQ', 'REL', 'N,NN', 'OL', 'DEC',
        'BbOL', 'ZC', 'REV', 'RV', 'CR', 'MI', 'NO', 'SAE1010', 'G4RL', 'ASTM A36', 'SAE1006', 'EEP',
        'NBR6658', 'NBR7008', 'NBR5007', 'NBR5915', 'NBR8300'];
    assert.equal(codes.length, 30);
    for (const code of codes) assert.ok(ROWS.some(row => row.code === code), `${code} is on the page`);
});

test('the counts on the page match the rows', () => {
    const counts = [...HTML.matchAll(/<span data-decoder-count>(\d+)<\/span>/g)].map(match => Number(match[1]));
    assert.ok(counts.length >= 2, 'the hero and the empty message carry the count');
    for (const count of counts) assert.equal(count, ROWS.length);
    assert.ok(!/\b30 códigos\b/.test(HTML), 'no fixed "30 códigos" left');
});

test('situacao is one of the three values, and shown on the page when it is not "atual"', () => {
    for (const row of ROWS) {
        if (row.situacao) assert.ok(['atual', 'histórica', 'não conferida'].includes(row.situacao), row.code);
    }
    const tagged = [...HTML.matchAll(/data-situacao="([^"]+)"[^>]*><dt>([^<]+)<\/dt><dd>([\s\S]*?)<\/dd>/g)];
    assert.ok(tagged.length > 0);
    for (const [, situacao, code, dd] of tagged) {
        if (situacao === 'histórica') assert.match(dd, /<span class="tec-tag">histórica<\/span>/, code);
        if (situacao === 'não conferida') assert.match(dd, /<span class="tec-tag">situação não conferida<\/span>/, code);
        if (situacao === 'atual') assert.doesNotMatch(dd, /tec-tag/, code);
    }
});

test('a scope names a norma or fabricante row on the page', () => {
    const markers = new Set(ROWS.filter(row => row.type === 'norma' || row.type === 'fabricante').map(row => row.code));
    const scoped = ROWS.filter(row => row.scope);
    assert.ok(scoped.length >= 3, 'scope is needed by at least three rows');
    for (const row of scoped) {
        assert.ok(markers.has(row.scope), `${row.code} → ${row.scope}`);
        assert.ok(row.aliases.length > 0, `${row.code} has aliases`);
    }
});

test('no row is published for the terms whose meaning is not established', () => {
    for (const text of ['SAR 60', 'BNR 46', 'BNR 52', 'RW 550', 'Q03', 'ACAB', 'CSB', 'LNE 360', 'LNE 38']) {
        const result = decode(text);
        assert.equal(result.recognized, 0, text);
    }
    for (const term of ['SAR', 'BNR', 'Q03', 'ACAB', 'CSB', 'LNE 360', 'LNE 38']) {
        for (const row of ROWS) {
            assert.ok(!row.aliases.map(D.keyOf).includes(D.keyOf(term)), `${row.code} must not alias ${term}`);
            assert.notEqual(D.keyOf(row.code), D.keyOf(term));
        }
    }
});

/* ===== The eight acceptance examples (issue #14) ===== */

test('CHAPA GR LTQ 8,00 NBR 6656 LNE 38', () => {
    assert.deepEqual(parts('CHAPA GR LTQ 8,00 NBR 6656 LNE 38'), [
        ['CHAPA', R, 'CHAPA'],
        ['GR', R, 'GR'],
        ['LTQ', R, 'LTQ'],
        ['8,00', E, null],
        ['NBR 6656', R, 'NBR 6656'],
        ['LNE 38', U, null],
    ]);
    assert.equal(D.summary(decode('CHAPA GR LTQ 8,00 NBR 6656 LNE 38')), '5 de 6 partes reconhecidas');
});

test('CHAPA 2,00mm ASTM A 1011 GR50', () => {
    assert.deepEqual(parts('CHAPA 2,00mm ASTM A 1011 GR50'), [
        ['CHAPA', R, 'CHAPA'],
        ['2,00mm', E, null],
        ['ASTM A 1011', R, 'ASTM A1011'],
        ['GR50', R, 'ASTM A1011 GR 50'],
    ]);
});

test('TIRA ZC BOB 1,55 ASTM A 653 CSB CR MI', () => {
    assert.deepEqual(parts('TIRA ZC BOB 1,55 ASTM A 653 CSB CR MI'), [
        ['TIRA', R, 'TIRA'],
        ['ZC', R, 'ZC'],
        ['BOB', R, 'BOB'],
        ['1,55', E, null],
        ['ASTM A 653', R, 'ASTM A653'],
        ['CSB', U, null],
        ['CR', R, 'CR'],
        ['MI', R, 'MI'],
    ]);
    assert.equal(D.summary(decode('TIRA ZC BOB 1,55 ASTM A 653 CSB CR MI')), '7 de 8 partes reconhecidas');
});

test('CHAPA ASTM A572 GR 50 4,0mm', () => {
    assert.deepEqual(parts('CHAPA ASTM A572 GR 50 4,0mm'), [
        ['CHAPA', R, 'CHAPA'],
        ['ASTM A572', R, 'ASTM A572'],
        ['GR 50', R, 'ASTM A572 GR 50'],
        ['4,0mm', E, null],
    ]);
});

test('CHAPA FQ 2,65 CSN COR 420', () => {
    assert.deepEqual(parts('CHAPA FQ 2,65 CSN COR 420'), [
        ['CHAPA', R, 'CHAPA'],
        ['FQ', R, 'FQ'],
        ['2,65', E, null],
        ['CSN', R, 'CSN'],
        ['COR 420', R, 'CSN COR 420'],
    ]);
});

test('CSN ARQ CIVIL 300-Q03 ACAB', () => {
    const result = decode('CSN ARQ CIVIL 300-Q03 ACAB');
    assert.deepEqual(result.spans.map(part => [part.text, part.status, part.code || null]), [
        ['CSN', R, 'CSN'],
        ['ARQ CIVIL 300', R, 'CSN ARQ CIVIL 300'],
        ['Q03', U, null],
        ['ACAB', U, null],
    ]);
    assert.equal(result.spans[1].situacao, 'não conferida');
    assert.equal(D.summary(result), '2 de 4 partes reconhecidas');
});

test('USI SAC 350', () => {
    assert.deepEqual(parts('USI SAC 350'), [
        ['USI', R, 'USI'],
        ['SAC 350', R, 'USI SAC 350'],
    ]);
});

test('CHAPA FQ 4,75 USI LN600', () => {
    assert.deepEqual(parts('CHAPA FQ 4,75 USI LN600'), [
        ['CHAPA', R, 'CHAPA'],
        ['FQ', R, 'FQ'],
        ['4,75', E, null],
        ['USI', R, 'USI'],
        ['LN600', R, 'USI LN 600'],
    ]);
});

test('none of the acceptance examples returns zero', () => {
    for (const text of [
        'CHAPA GR LTQ 8,00 NBR 6656 LNE 38',
        'CHAPA 2,00mm ASTM A 1011 GR50',
        'TIRA ZC BOB 1,55 ASTM A 653 CSB CR MI',
        'CHAPA ASTM A572 GR 50 4,0mm',
        'CHAPA FQ 2,65 CSN COR 420',
        'CSN ARQ CIVIL 300-Q03 ACAB',
        'USI SAC 350',
        'CHAPA FQ 4,75 USI LN600',
    ]) {
        const result = decode(text);
        assert.ok(result.recognized > 0, text);
        assert.equal(result.original, text, 'the original line is kept');
    }
});

/* ===== Scope binding ===== */

test('GR 50 binds to the standard written before it', () => {
    const a572 = decode('CHAPA ASTM A572 GR 50').spans[2];
    const a1011 = decode('CHAPA ASTM A1011 GR 50').spans[2];
    assert.equal(a572.code, 'ASTM A572 GR 50');
    assert.equal(a572.scope, 'ASTM A572');
    assert.equal(a1011.code, 'ASTM A1011 GR 50');
    assert.equal(a1011.scope, 'ASTM A1011');
    assert.notEqual(a572.explanation, a1011.explanation);
    assert.match(a1011.explanation, /não diz de qual família/);
    assert.match(a1011.explanation, /SS/);
    assert.match(a1011.explanation, /HSLAS/);
});

test('the nearest standard wins when two are written', () => {
    const spans = decode('ASTM A572 ASTM A1011 GR 50').spans;
    assert.equal(spans[2].code, 'ASTM A1011 GR 50');
});

test('GR 50 with no standard is one unresolved part, not "grossa"', () => {
    assert.deepEqual(parts('CHAPA GR 50 6,30'), [
        ['CHAPA', R, 'CHAPA'],
        ['GR 50', U, null],
        ['6,30', E, null],
    ]);
    assert.deepEqual(parts('CHAPA GR50'), [['CHAPA', R, 'CHAPA'], ['GR50', U, null]]);
});

test('GR 50 after a producer is not a standard grade', () => {
    assert.equal(decode('CSN GR 50').spans[1].status, U);
});

test('a brand grade binds to its producer: USI LN 600 is not NBR 6655 LN', () => {
    assert.equal(decode('CHAPA USI LN 600').spans[2].code, 'USI LN 600');
    assert.match(decode('USI LN600').spans[1].explanation, /Não é o grau LN da NBR 6655/);
    // NBR 6655 has no row: its grade stays unresolved, and is one part with the standard.
    assert.deepEqual(parts('CHAPA NBR 6655 LN 28'), [
        ['CHAPA', R, 'CHAPA'],
        ['NBR 6655 LN 28', U, null],
    ]);
    // LN 600 with no producer before it is not the Usiminas grade.
    assert.equal(decode('CHAPA LN 600').recognized, 1);
    // An unknown standard ends the producer's scope.
    assert.equal(decode('USI NBR 6655 LN 600').recognized, 1);
});

test('the same words under different producers are different rows', () => {
    assert.equal(decode('CSN COR 420').spans[1].code, 'CSN COR 420');
    assert.equal(decode('CST COR 400').spans[1].code, 'CST COR 400');
    assert.equal(decode('CST COR 400').spans[1].situacao, 'histórica');
    assert.equal(decode('COS-AR-COR 400').spans[1].code, 'COS-AR-COR 400');
    assert.equal(decode('COS AR COR 300').spans[1].code, 'COS-AR-COR 300');
    // COR 400 is a CST and Cosipa designation, not a CSN one.
    assert.equal(decode('CSN COR 400').recognized, 1);
    // COR 420 after Usiminas is not a CSN grade.
    assert.equal(decode('USI COR 420').recognized, 1);
});

test('LNE 380 binds to NBR 6656', () => {
    assert.equal(decode('NBR 6656 LNE 380').spans[1].code, 'NBR 6656 LNE 380');
    assert.equal(decode('NBR6656 LNE380').spans[1].code, 'NBR 6656 LNE 380');
    assert.equal(decode('CHAPA LNE 380').recognized, 1);
});

test('a run of unresolved tokens right after a marker is one part', () => {
    assert.deepEqual(parts('USI XPTO 99 ZC'), [
        ['USI', R, 'USI'],
        ['XPTO 99', U, null],
        ['ZC', R, 'ZC'],
    ]);
    // Away from a marker, each unresolved token is its own part.
    assert.deepEqual(parts('CHAPA XPTO 99'), [
        ['CHAPA', R, 'CHAPA'],
        ['XPTO', U, null],
        ['99', U, null],
    ]);
});

/* ===== GR and whole tokens ===== */

test('GR alone is "grossa"', () => {
    const gr = decode('CHAPA GR FQ').spans[1];
    assert.equal(gr.code, 'GR');
    assert.equal(gr.explanation, 'Grossa, ou seja, chapa grossa.');
    // A thickness after GR is not a grade number.
    assert.equal(decode('CHAPA GR 8,00').spans[1].code, 'GR');
});

test('whole tokens only: no part matches inside a word', () => {
    assert.equal(decode('A').recognized, 0);
    assert.equal(decode('A B').recognized, 0);
    assert.deepEqual(parts('CSN CORE 420'), [
        ['CSN', R, 'CSN'],
        ['CORE 420', U, null],
    ]);
    assert.deepEqual(parts('CHAPAS ZCX'), [['CHAPAS', U, null], ['ZCX', U, null]]);
    assert.equal(decode('NORMAL').recognized, 0, '"NO" is not inside "NORMAL"');
});

test('case and accents do not matter', () => {
    assert.deepEqual(parts('chapa fq 2,65 csn cor 420').map(part => part[1]), [R, R, E, R, R]);
    assert.equal(decode('Chápa').spans[0].code, 'CHAPA');
});

/* ===== Spacing and units ===== */

test('spacing variants decode to the same row', () => {
    const same = (a, b) => assert.equal(decode(a).spans.at(-1).code, decode(b).spans.at(-1).code, `${a} = ${b}`);
    same('NBR6656', 'NBR 6656');
    same('ABNT NBR 6656', 'NBR 6656');
    same('ASTM A 1011', 'ASTM A1011');
    same('ASTM-A1011', 'ASTM A1011');
    same('ASTM A1011 GR50', 'ASTM A1011 GR 50');
    same('ASTM A 572 GR50', 'ASTM A572 GR 50');
    same('NBR 7008', 'NBR7008');
    same('USI-SAC-350', 'USI SAC 350');
    assert.equal(decode('NBR6656').spans[0].code, 'NBR 6656');
    assert.equal(decode('ASTM A 1011').spans[0].code, 'ASTM A1011');
});

test('thickness with "mm", glued or apart, is one part', () => {
    assert.deepEqual(parts('2,00mm'), [['2,00mm', E, null]]);
    assert.deepEqual(parts('4,0 mm'), [['4,0 mm', E, null]]);
    assert.deepEqual(parts('4,0 MM CHAPA'), [['4,0 MM', E, null], ['CHAPA', R, 'CHAPA']]);
    const thickness = decode('CHAPA 2,00mm').spans[1];
    assert.equal(thickness.explanation, 'Espessura em milímetros.');
    assert.equal(ROWS[thickness.index].code, 'N,NN');
});

test('a dotted number is not a thickness', () => {
    assert.equal(decode('1.200').spans[0].status, U);
    assert.equal(decode('1200').spans[0].status, U);
});

test('a number-suffix hyphen splits the parts', () => {
    assert.deepEqual(parts('USI SAC 350-Q03').map(part => part[0]), ['USI', 'SAC 350', 'Q03']);
});

test('punctuation around a part is not part of it', () => {
    assert.deepEqual(parts('CHAPA, ZC; 2,00.').map(part => part[0]), ['CHAPA', 'ZC', '2,00']);
});

/* ===== Repeats, unknowns, empty ===== */

test('a repeated term is decoded each time', () => {
    const result = decode('CHAPA CHAPA ZC ZC');
    assert.equal(result.total, 4);
    assert.equal(result.recognized, 4);
    assert.equal(decode('CSN COR 420 CSN COR 420').recognized, 4);
});

test('an all-unknown description does not crash and marks every part', () => {
    const result = decode('XQZ 123 WWW-9 ABC');
    assert.equal(result.recognized, 0);
    assert.ok(result.total >= 4);
    for (const part of result.spans) {
        assert.equal(part.status, U);
        assert.equal(part.code, undefined);
        assert.equal(part.explanation, undefined);
    }
    assert.equal(D.summary(result), '0 de ' + result.total + ' partes reconhecidas');
});

test('empty and blank input give no parts', () => {
    for (const text of ['', '   ', null, undefined]) {
        const result = decode(text);
        assert.equal(result.total, 0);
        assert.deepEqual(result.spans, []);
    }
});

test('each part is the text as typed, with its offsets', () => {
    const text = '  chapa   ASTM  a 1011   gr50 ';
    for (const part of decode(text).spans) {
        assert.equal(text.slice(part.start, part.end), part.text);
    }
    assert.deepEqual(decode(text).spans.map(part => part.text), ['chapa', 'ASTM  a 1011', 'gr50']);
});

test('summary wording', () => {
    assert.equal(D.summary({ recognized: 1, total: 1 }), '1 de 1 parte reconhecida');
    assert.equal(D.summary({ recognized: 0, total: 2 }), '0 de 2 partes reconhecidas');
});

test('decode does not need rows from the page to run', () => {
    const rows = [{ code: 'ZZ', type: 'forma', explanation: 'Teste.' }];
    assert.deepEqual(D.decode('ZZ 1,00 YY', rows).spans.map(part => part.status), [R, E, U]);
});
