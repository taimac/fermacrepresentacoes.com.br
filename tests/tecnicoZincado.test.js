/**
 * Static tests for tecnico/zincado-galvanizado.html (T11, "Zincado /
 * galvanizado: o que significa Z275 e qual revestimento escolher").
 * Run from the repo root: node --test
 * No dependencies: node:test and node:assert only.
 *
 * The page is text only. These tests hold the shell (navbar, footer, CTA),
 * the links, the brand-neutral rule and the few numbers the page states.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

const PAGE = 'tecnico/zincado-galvanizado.html';
const HTML = read(PAGE);
const SHELL = read('tecnico/como-especificar.html');
const INDEX = read('tecnico/index.html');
const CONTROLLER = read('scripts/siteController.js');

const TITLE = 'Zincado / galvanizado: o que significa Z275 e qual revestimento escolher';
const CODE = 'FER-WEB-TEC-ZINCADO';
const CANONICAL = 'https://fermacrepresentacoes.com.br/tecnico/zincado-galvanizado.html';

const decodeEntities = value => value
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// Visible text: no comments, no scripts, no tags.
const visible = html => decodeEntities(html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')).trim();

const one = (html, pattern, what) => {
    const found = html.match(pattern);
    assert.ok(found, `${what} not found`);
    return found[0];
};

const section = id => one(HTML, new RegExp(`<section class="tec-group" id="${id}"[\\s\\S]*?</section>`), `section #${id}`);

const HERO = one(HTML, /<section class="tec-hero"[\s\S]*?<\/section>/, 'hero');
const CTA = one(HTML, /<aside class="tec-cta"[\s\S]*?<\/aside>/, 'CTA box');
const SOURCES = section('fontes');
const BODY = one(HTML, /<body[\s\S]*<\/body>/, 'body');
// What a reader meets (title, description, body) without the two places
// where an organisation may be named. The canonical link is left out: it
// carries the site's own domain.
const HEAD_TEXT = [
    one(HTML, /<title>[\s\S]*?<\/title>/, 'title'),
    one(HTML, /<meta name="description" content="[^"]*">/, 'meta description'),
].join(' ');
const NEUTRAL = HEAD_TEXT + ' ' + BODY.replace(CTA, ' ').replace(SOURCES, ' ');

/* ===== Shell ===== */

test('exactly one h1, with the page title', () => {
    const headings = [...HTML.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
    assert.equal(headings.length, 1);
    assert.equal(visible(headings[0][1]), TITLE);
});

test('the canonical URL is the page itself', () => {
    const canonical = [...HTML.matchAll(/<link rel="canonical" href="([^"]+)">/g)].map(match => match[1]);
    assert.deepEqual(canonical, [CANONICAL]);
});

test('the first screen says what Z275 means', () => {
    const lead = visible(one(HERO, /<p class="tec-lead">[\s\S]*?<\/p>/, 'hero lead'));
    for (const piece of ['Z275', '275 gramas', 'por metro quadrado', 'somando as duas faces', 'não a espessura']) {
        assert.ok(lead.includes(piece), `the lead says "${piece}"`);
    }
});

test('the navbar and the footer sentence are the ones of the other pages', () => {
    const header = html => one(html, /<header>[\s\S]*?<\/header>/, 'navbar');
    const footer = html => one(html, /<footer class="tec-footer">[\s\S]*?<\/footer>/, 'footer');
    assert.equal(header(HTML), header(SHELL));
    assert.equal(footer(HTML), footer(SHELL));
});

test('every /tecnico page loads the same versions of the shared files', () => {
    const shared = html => [...html.matchAll(/(?:main\.css|tecnico\.css|siteController\.js)\?v=[\w.-]+/g)].map(match => match[0]).sort();
    assert.equal(shared(HTML).length, 3);
    const pages = fs.readdirSync(path.join(ROOT, 'tecnico')).filter(file => file.endsWith('.html'));
    for (const file of pages) {
        assert.deepEqual(shared(read(path.join('tecnico', file))), shared(HTML), file);
    }
});

/* ===== CTA and origin code ===== */

test('the CTA links to Envie sua lista with the page\'s origin code', () => {
    const hrefs = [...CTA.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(hrefs, [`../envie-sua-lista.html?origem=${CODE}`]);
    assert.equal(HTML.split(CODE).length - 1, 1, 'the code appears once on the page');
});

test('the form\'s own check accepts the origin code', () => {
    const limit = Number(one(CONTROLLER, /code\.length > (\d+)/, 'length limit').match(/\d+/)[0]);
    const source = CONTROLLER.match(/!\/(\^FER-WEB-TEC-[^\n]*?\$)\/\.test\(code\)/);
    assert.ok(source, 'origin pattern not found in siteController.js');
    assert.ok(CODE.length <= limit);
    assert.match(CODE, new RegExp(source[1]));
});

test('the CTA box is the one of "Como especificar", except for the code', () => {
    const shellCta = one(SHELL, /<aside class="tec-cta"[\s\S]*?<\/aside>/, 'shell CTA box');
    assert.equal(CTA, shellCta.replace('FER-WEB-TEC-COMO-ESPECIFICAR', CODE));
});

/* ===== Index card and links ===== */

test('the /tecnico index has a card for the page, after the earlier ones', () => {
    const cards = [...INDEX.matchAll(/<a class="tec-page-card" href="([^"]+)">\s*<span class="tec-page-card__title">([\s\S]*?)<\/span>\s*<span class="tec-page-card__text">([\s\S]*?)<\/span>/g)];
    const card = cards.find(match => match[1] === 'zincado-galvanizado.html');
    assert.ok(card, 'card not found');
    assert.equal(visible(card[2]), TITLE);
    assert.ok(visible(card[3]).includes('Z275'));
    const hrefs = cards.map(match => match[1]);
    for (const earlier of ['calculadora-peso.html', 'decodificador.html', 'como-especificar.html']) {
        assert.ok(hrefs.indexOf(earlier) !== -1 && hrefs.indexOf(earlier) < hrefs.indexOf('zincado-galvanizado.html'), earlier);
    }
});

test('every relative link resolves to a file, every anchor to an id', () => {
    const ids = new Set([...HTML.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]));
    const targets = [...BODY.matchAll(/\s(?:href|src)="([^"]+)"/g)].map(match => match[1]);
    assert.ok(targets.length > 10);
    for (const target of targets) {
        if (/^https?:\/\//.test(target)) continue;
        if (target.startsWith('#')) {
            assert.ok(ids.has(target.slice(1)), `anchor ${target}`);
            continue;
        }
        const file = target.split(/[?#]/)[0];
        const resolved = path.join(ROOT, 'tecnico', file.endsWith('/') ? file + 'index.html' : file);
        assert.ok(fs.existsSync(resolved) && fs.statSync(resolved).isFile(), `link ${target}`);
    }
    for (const [, labelled] of HTML.matchAll(/aria-labelledby="([^"]+)"/g)) {
        assert.ok(ids.has(labelled), `aria-labelledby ${labelled}`);
    }
});

test('each list row has one term and one explanation', () => {
    const rows = [...HTML.matchAll(/<div class="tec-(?:check|reason|code)">([\s\S]*?)<\/div>/g)];
    assert.ok(rows.length >= 25);
    for (const [, row] of rows) {
        assert.equal(row.split('<dt>').length - 1, 1, row.slice(0, 60));
        assert.equal(row.split('<dd>').length - 1, 1, row.slice(0, 60));
    }
});

/* ===== Brand-neutral ===== */

test('outside the CTA box and the sources block the page names no company', () => {
    const names = [
        /fermac/i, /panatl[âa]ntica/i, /\bCSN\b/, /usiminas/i, /unigal/i, /arcelor/i, /gerdau/i,
        /aperam/i, /nippon/i, /galvinfo/i, /zinc association/i,
    ];
    for (const name of names) {
        assert.ok(!name.test(NEUTRAL), `${name} outside the CTA box and the sources block`);
    }
});

test('the sources block names publishers only, and the company is only in the CTA box', () => {
    assert.ok(!/fermac|panatl[âa]ntica/i.test(HEAD_TEXT + ' ' + BODY.replace(CTA, ' ')), 'the company and the represented supplier stay in the CTA box');
    // No product brand of any producer, anywhere on the page.
    for (const brand of [/usigal/i, /galvalume/i, /galvanew/i, /zincalume/i, /magnelis/i, /®|™/]) {
        assert.ok(!brand.test(HTML), `${brand} on the page`);
    }
});

/* ===== Sources ===== */

test('every source has a link, and external links exist only in the sources block', () => {
    const entries = [...SOURCES.matchAll(/<div class="tec-check">([\s\S]*?)<\/div>/g)].map(match => match[1]);
    assert.ok(entries.length >= 5);
    for (const entry of entries) {
        const links = [...entry.matchAll(/<a href="(https:\/\/[^"]+)" rel="noopener">/g)];
        assert.ok(links.length >= 1, visible(entry).slice(0, 40));
        assert.equal(entry.split('<a ').length - 1, links.length, 'every link is https with rel="noopener"');
        assert.ok(visible(entry).includes('Conferido:') || visible(entry).includes('Citada só como referência'), visible(entry).slice(0, 40));
    }
    assert.ok(!/href="https?:\/\//.test(BODY.replace(SOURCES, ' ')), 'no external link outside the sources block');
    assert.match(visible(SOURCES), /lida em \d{2}\/\d{2}\/\d{4}/);
});

test('the standard is cited by its current catalog entry, and named once in the text', () => {
    const sources = visible(SOURCES);
    assert.ok(sources.includes('ABNT NBR 7008-1:2021'));
    assert.ok(sources.includes('situação “em vigor”'));
    assert.ok(SOURCES.includes('href="https://www.abntcatalogo.com.br/'));
    const text = visible(NEUTRAL);
    assert.equal(text.split('NBR 7008').length - 1, 1, 'named once outside the sources block');
    assert.ok(!/NBR 7008\s*[-:]/.test(text), 'no part and no edition year in the running text');
    assert.ok(!/\bASTM\b|\bEN 1\d{4}\b|\bJIS\b/.test(text), 'no other standard in the running text');
    assert.equal(visible(HTML).match(/\bNBR\s?\d+/g).every(name => /7008/.test(name)), true, 'no other NBR on the page');
});

/* ===== The numbers the page states ===== */

test('every designation on the page is one checked against the public source', () => {
    const allowed = new Set([
        'Z100', 'Z120', 'Z140', 'Z180', 'Z225', 'Z275', 'Z350', 'Z450', 'Z600',
        'ZF100', 'ZF120', 'ZF140', 'ZF180',
    ]);
    const found = visible(HTML).match(/\bZF?\d{2,3}\b/g);
    assert.ok(found.includes('Z275'));
    for (const designation of found) {
        assert.ok(allowed.has(designation), designation);
    }
    // In the running text, a number followed by g/m² is the number of a designation.
    const masses = [...visible(HTML).matchAll(/(\d+(?:[.,]\d+)?)(?:, \d+ ou \d+)?(?: ou \d+)? g\/m²/g)].map(match => match[0]);
    const numbers = new Set(masses.join(' ').match(/\d+(?:[.,]\d+)?/g));
    for (const number of numbers) {
        assert.ok(['100', '120', '140', '180', '225', '275', '20', '40'].includes(number), `${number} g/m²`);
    }
});

test('the thickness example and the per-face sum hold', () => {
    const text = visible(HTML);
    // Cited relation: 100 g/m² on both faces is about 7,1 micrometres per face.
    const perFace = 2.75 * 7.1;
    assert.ok(perFace > 19 && perFace < 20.5);
    assert.ok(text.includes('cerca de 7 micrômetros'));
    assert.ok(text.includes('perto de 20 micrômetros por face, ou 0,02 mm'));
    assert.ok(text.includes('Um micrômetro é a milésima parte do milímetro'));
    assert.equal(20 / 1000, 0.02);
    assert.ok(text.includes('20/20 soma 40 g/m²'));
    assert.equal(20 + 20, 40);
});

test('the choice is guidance, not a guarantee', () => {
    const choice = visible(section('escolha'));
    assert.ok(choice.includes('orientação geral'));
    assert.ok(choice.includes('não são garantia de vida útil'));
    assert.ok(!/garantimos|garantid[oa]s?\b|com certeza|sempre dura/i.test(visible(HTML)));
});

/* ===== The owner's placeholder ===== */

test('one marked placeholder, followed by one neutral sentence', () => {
    const markers = [...HTML.matchAll(/<!--\s*PLACEHOLDER[\s\S]*?-->\s*<p class="tec-note">([\s\S]*?)<\/p>/g)];
    assert.equal(markers.length, 1);
    assert.equal(HTML.split('PLACEHOLDER').length - 1, 1);
    const sentence = visible(markers[0][1]);
    assert.equal(sentence.split(/[.!?](?:\s|$)/).filter(Boolean).length, 1, 'one sentence');
    assert.ok(sentence.endsWith('.'));
    assert.ok(!/fermac|panatl[âa]ntica/i.test(sentence));
});
