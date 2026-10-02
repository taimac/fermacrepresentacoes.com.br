/**
 * Tests for scripts/tecnicoPeso.js (T01, calculadora de peso teórico).
 * Run from the repo root: node --test
 * No dependencies: node:test and node:assert only.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const P = require('../scripts/tecnicoPeso.js');

const close = (actual, expected, tolerance, message) => {
    assert.ok(Math.abs(actual - expected) <= tolerance,
        `${message || ''} expected ${expected} ± ${tolerance}, got ${actual}`);
};

/* ===== Density ===== */

test('the only density is 7,85 kg/dm³', () => {
    assert.equal(P.DENSITY, 7.85);
});

/* ===== Deterministic case ===== */

test('chapa 6,30 × 1200 × 3000 → 178,04 kg', () => {
    const kg = P.chapa(6.3, 1200, 3000);
    close(kg, 178.038, 1e-9);
    assert.equal(P.formatKg(kg), '178,04 kg');
});

test('the same case from pt-BR text input', () => {
    const result = P.calculate('chapa', { espessura: '6,30', largura: '1200', comprimento: '3000' });
    assert.equal(result.ok, true);
    assert.equal(P.formatKg(result.kg), '178,04 kg');
    const dotted = P.calculate('chapa', { espessura: '6,30', largura: '1.200', comprimento: '3.000' });
    assert.equal(P.formatKg(dotted.kg), '178,04 kg');
});

/* ===== Geometric identities ===== */

test('bobina equals the volume of an annulus times the density', () => {
    const cases = [[400, 800, 245], [508, 1200, 1000], [610, 1500, 50]];
    for (const [di, de, w] of cases) {
        // Outer cylinder minus inner cylinder, radii in dm.
        const re = de / 200;
        const ri = di / 200;
        const annulus = Math.PI * re * re * (w / 100) - Math.PI * ri * ri * (w / 100);
        close(P.coilVolume(di, de, w), annulus, 1e-9);
        close(P.bobina(di, de, w), annulus * 7.85, 1e-9);
    }
});

test('bobina is linear in the width', () => {
    close(P.bobina(400, 800, 490), 2 * P.bobina(400, 800, 245), 1e-9);
});

test('a tira cut to length equals a chapa of the same size', () => {
    const cases = [[2, 100, 3000], [6.3, 1200, 3000], [0.5, 35, 2000]];
    for (const [e, l, c] of cases) {
        assert.equal(P.tira(e, l, c), P.chapa(e, l, c));
        const fromText = P.calculate('tira-comprimento', { espessura: String(e).replace('.', ','), largura: String(l), comprimento: String(c) });
        assert.equal(fromText.kg, P.chapa(e, l, c));
    }
});

test('a tira coil equals a bobina of the same size', () => {
    assert.equal(P.tiraRolo(400, 800, 100), P.bobina(400, 800, 100));
    const result = P.calculate('tira-rolo', { diametroInterno: '400', diametroExterno: '800', largura: '100' });
    assert.equal(result.kg, P.bobina(400, 800, 100));
});

test('the coil form and the length form agree for the unrolled length', () => {
    // A strip of thickness e wound from Øi to Øe has length π(Øe² − Øi²) / (4e).
    const e = 2;
    const di = 500;
    const de = 900;
    const w = 120;
    const length = Math.PI * (de * de - di * di) / (4 * e);
    close(P.tira(e, w, length), P.tiraRolo(di, de, w), 1e-9);
});

test('chapa does not depend on the order of the measures', () => {
    close(P.chapa(6.3, 1200, 3000), P.chapa(3000, 6.3, 1200), 1e-9);
});

/* ===== pt-BR input ===== */

test('parseNumber reads pt-BR decimals and thousands', () => {
    assert.equal(P.parseNumber('6,30'), 6.3);
    assert.equal(P.parseNumber(' 6,30 '), 6.3);
    assert.equal(P.parseNumber('0,5'), 0.5);
    assert.equal(P.parseNumber(',5'), 0.5);
    assert.equal(P.parseNumber('1200'), 1200);
    assert.equal(P.parseNumber('1.200'), 1200);
    assert.equal(P.parseNumber('1.200,5'), 1200.5);
    assert.equal(P.parseNumber('12.000'), 12000);
    assert.equal(P.parseNumber('6.30'), 6.3); // a dot that does not group by three is a decimal mark
    assert.equal(P.parseNumber('1.25'), 1.25);
    assert.equal(P.parseNumber('-5'), -5);
    // A thousands group never starts with zero: "0.500" is half a millimetre.
    assert.equal(P.parseNumber('0.500'), 0.5);
    assert.equal(P.parseNumber('0.250'), 0.25);
    // In the thickness field a lone dot is always decimal.
    assert.equal(P.parseNumber('1.250'), 1250);
    assert.equal(P.parseNumber('1.250', { dotIsDecimal: true }), 1.25);
    assert.equal(P.parseNumber('1.250,5', { dotIsDecimal: true }), 1250.5);
    // A trailing separator is ignored while typing.
    assert.equal(P.parseNumber('6,'), 6);
    assert.equal(P.parseNumber('6.'), 6);
    assert.equal(P.parseNumber('1.200,'), 1200);
});

test('a dotted thickness is read as millimetres with decimals', () => {
    const result = P.calculate('chapa', { espessura: '6.30', largura: '1.200', comprimento: '3.000' });
    assert.equal(P.formatKg(result.kg), '178,04 kg');
    const thin = P.calculate('chapa', { espessura: '1.250', largura: '1000', comprimento: '2000' });
    assert.equal(thin.values.espessura, 1.25);
});

test('parseNumber rejects what is not a number', () => {
    for (const text of ['', '   ', 'abc', '6,3,0', '1,200.5', '1e3', '6 mm', '1..2', '-', '12.00.0', 'Infinity']) {
        assert.ok(Number.isNaN(P.parseNumber(text)), `"${text}" should be rejected`);
    }
});

test('formatMeasure echoes measures without thousands dots', () => {
    assert.equal(P.formatMeasure(25400), '25400');
    assert.equal(P.formatMeasure(1200), '1200');
    assert.equal(P.formatMeasure(6.3, 2), '6,30');
    assert.equal(P.formatMeasure(1.25, 2), '1,25');
});

test('a dotted width is read as thousands, and the echo shows it plainly', () => {
    const result = P.calculate('chapa', { espessura: '2', largura: '25.400', comprimento: '1000' });
    assert.equal(result.values.largura, 25400);
    assert.equal(P.formatMeasure(result.values.largura), '25400');
});

test('formatKg uses pt-BR grouping and two decimals', () => {
    assert.equal(P.formatKg(1335.42), '1.335,42 kg');
    assert.equal(P.formatKg(0.5), '0,50 kg');
    assert.equal(P.formatKg(12.3456), '12,35 kg');
});

/* ===== Validation ===== */

test('every field must be filled', () => {
    const result = P.calculate('chapa', { espessura: '6,30', largura: '', comprimento: '3000' });
    assert.equal(result.ok, false);
    assert.deepEqual(Object.keys(result.errors), ['largura']);
});

test('measures must be positive numbers', () => {
    const zero = P.calculate('chapa', { espessura: '0', largura: '1200', comprimento: '3000' });
    assert.match(zero.errors.espessura, /maior que zero/);
    const negative = P.calculate('chapa', { espessura: '-6,30', largura: '1200', comprimento: '3000' });
    assert.match(negative.errors.espessura, /maior que zero/);
    const text = P.calculate('bobina', { diametroInterno: 'x', diametroExterno: '800', largura: '245' });
    assert.match(text.errors.diametroInterno, /vírgula/);
});

test('Øe must be greater than Øi', () => {
    for (const shape of ['bobina', 'tira-rolo']) {
        const equal = P.calculate(shape, { diametroInterno: '800', diametroExterno: '800', largura: '245' });
        assert.equal(equal.ok, false);
        assert.match(equal.errors.diametroExterno, /maior que o interno/);
        const inverted = P.calculate(shape, { diametroInterno: '800', diametroExterno: '400', largura: '245' });
        assert.equal(inverted.ok, false);
        assert.ok(P.calculate(shape, { diametroInterno: '400', diametroExterno: '800', largura: '245' }).ok);
    }
});

test('a measure above 100000 mm is refused with "Confira as medidas."', () => {
    assert.equal(P.MAX_MEASURE_MM, 100000);
    assert.ok(P.calculate('chapa', { espessura: '6,30', largura: '1200', comprimento: '100000' }).ok);
    const big = P.calculate('chapa', { espessura: '6,30', largura: '1200', comprimento: '100001' });
    assert.equal(big.ok, false);
    assert.equal(big.errors.comprimento, 'Confira as medidas.');
    const huge = P.calculate('bobina', { diametroInterno: '400', diametroExterno: '1' + '0'.repeat(60), largura: '245' });
    assert.equal(huge.ok, false);
    assert.equal(huge.errors.diametroExterno, 'Confira as medidas.');
});

test('an unknown shape is a programming error', () => {
    assert.throws(() => P.calculate('perfil', {}));
});

test('the only density the page shows is 7,85 kg/dm³', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'tecnico', 'calculadora-peso.html'), 'utf8');
    const densities = [...html.matchAll(/(\d+[,.]\d+)\s*kg\/dm³/g)].map(match => match[1]);
    assert.ok(densities.length > 0, 'the page states its density');
    assert.deepEqual([...new Set(densities)], ['7,85']);
    // Every factor in the formulas is 7,85 too.
    const factors = [...html.matchAll(/×\s*(\d+[,.]\d+)\s*</g)].map(match => match[1]);
    assert.deepEqual([...new Set(factors)], ['7,85']);
});
