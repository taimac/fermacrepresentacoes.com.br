/**
 * Static tests for tecnico/certificado-qualidade.html (T04, "Como ler um
 * certificado de qualidade").
 * Run from the repo root: node --test
 * No dependencies: node:test and node:assert only.
 *
 * The page is text only. These tests hold the shell (navbar, footer, CTA),
 * the links, the brand-neutral rule, the sources block, and the few numbers
 * and designations the page states.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

const PAGE = 'tecnico/certificado-qualidade.html';
const HTML = read(PAGE);
const SHELL = read('tecnico/como-especificar.html');
const INDEX = read('tecnico/index.html');
const CONTROLLER = read('scripts/siteController.js');

const TITLE = 'Como ler um certificado de qualidade';
const CODE = 'FER-WEB-TEC-CERTIFICADO';
const CANONICAL = 'https://fermacrepresentacoes.com.br/tecnico/certificado-qualidade.html';

const decodeEntities = value => value
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

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

test('the first screen names the three numbers and what the certificate does not decide', () => {
    const lead = visible(one(HERO, /<p class="tec-lead">[\s\S]*?<\/p>/, 'hero lead'));
    for (const piece of [
        'escoamento', 'resistência', 'alongamento', 'ensaio de tração',
        'começa a deformar de vez', 'antes de romper', 'esticou até partir',
        'não decidem por você',
    ]) {
        assert.ok(lead.includes(piece), `the lead says "${piece}"`);
    }
    // The note right under the hero: what the certificate is, and what it is not.
    const note = visible(one(HTML, /<p class="tec-note">[\s\S]*?<\/p>/, 'first note'));
    assert.ok(note.includes('documento de inspeção'));
    // The delivery of a certificate is conditional on the order.
    assert.match(note, /quando o pedido o exige/i);
    assert.ok(!/vem acompanhado do certificado/.test(visible(HTML)), 'no unconditional delivery promise');
    assert.ok(note.includes('Três números são o foco'));
    assert.ok(note.includes('não o que a sua peça vai aguentar'));
});

test('the navbar and the footer sentence are the ones of the other pages', () => {
    const header = html => one(html, /<header>[\s\S]*?<\/header>/, 'navbar');
    const footer = html => one(html, /<footer class="tec-footer">[\s\S]*?<\/footer>/, 'footer');
    assert.equal(header(HTML), header(SHELL));
    assert.equal(footer(HTML), footer(SHELL));
});

test('the head is the one of "Como especificar", except for what names the page', () => {
    const head = html => one(html, /<head>[\s\S]*?<\/head>/, 'head')
        .replace(/<meta name="description" content="[^"]*">/, '')
        .replace(/<title>[\s\S]*?<\/title>/, '')
        .replace(/<link rel="canonical" href="[^"]*">/, '');
    assert.equal(head(HTML), head(SHELL));
    assert.match(HTML, /<body class="tecnico-page">/);
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

test('the /tecnico index has a card for the page, after "Como especificar"', () => {
    const cards = [...INDEX.matchAll(/<a class="tec-page-card" href="([^"]+)">\s*<span class="tec-page-card__title">([\s\S]*?)<\/span>\s*<span class="tec-page-card__text">([\s\S]*?)<\/span>/g)];
    const card = cards.find(match => match[1] === 'certificado-qualidade.html');
    assert.ok(card, 'card not found');
    assert.equal(visible(card[2]), TITLE);
    assert.ok(visible(card[3]).includes('escoamento'));
    const hrefs = cards.map(match => match[1]);
    assert.equal(hrefs.filter(href => href === 'certificado-qualidade.html').length, 1);
    for (const earlier of ['calculadora-peso.html', 'decodificador.html', 'como-especificar.html']) {
        assert.ok(hrefs.indexOf(earlier) !== -1 && hrefs.indexOf(earlier) < hrefs.indexOf('certificado-qualidade.html'), earlier);
    }
    for (const later of ['escoamento-resistencia.html', 'zincado-galvanizado.html', 'laminado-a-frio.html']) {
        assert.ok(hrefs.indexOf(later) > hrefs.indexOf('certificado-qualidade.html'), later);
    }
    // Every card on the index leads to a page that exists.
    for (const href of hrefs) {
        assert.ok(fs.existsSync(path.join(ROOT, 'tecnico', href)), `card ${href}`);
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

test('the page links to "Como especificar" and to the page on the two numbers', () => {
    assert.ok(HTML.includes('<a href="como-especificar.html">Como especificar seu pedido de aço</a>'));
    assert.ok(HTML.includes('<a href="escoamento-resistencia.html">Escoamento e resistência à tração, em linguagem simples</a>'));
});

test('each list row has one term and one explanation', () => {
    const rows = [...HTML.matchAll(/<div class="tec-(?:check|reason|code)">([\s\S]*?)<\/div>/g)];
    assert.ok(rows.length >= 12);
    for (const [, row] of rows) {
        assert.equal(row.split('<dt>').length - 1, 1, row.slice(0, 60));
        assert.equal(row.split('<dd>').length - 1, 1, row.slice(0, 60));
    }
});

test('every part named in the outline is on the page, in order', () => {
    const ids = [...HTML.matchAll(/<section class="tec-group" id="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(ids, ['certificado', 'ensaio', 'escoamento', 'resistencia', 'alongamento', 'juntos', 'conferir', 'glossario', 'fontes']);
    const toc = [...one(HTML, /<nav class="tec-toc"[\s\S]*?<\/nav>/, 'table of contents').matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(toc, ids);
    const checks = [...section('conferir').matchAll(/<dt>([\s\S]*?)<\/dt>/g)].map(match => visible(match[1]));
    assert.equal(checks.length, 6);
    assert.ok(checks[0].includes('É o documento certo?'));
    // The checks that read a mechanical result are conditional: a document
    // that does not report one is not the case the page assumes.
    // The unit check covers the stress values only: elongation is in %.
    assert.match(checks[2], /escoamento ou resistência/);
    for (const conditional of checks.slice(2, 5)) {
        assert.match(conditional, /se o documento traz/i);
    }
    assert.ok(checks[5].includes('batem com o que foi especificado'));
});

/* ===== Brand-neutral ===== */

test('outside the CTA box and the sources block the page names no organisation', () => {
    const names = [
        /fermac/i, /panatl[âa]ntica/i, /\bCSN\b/, /usiminas/i, /arcelor/i, /gerdau/i, /aperam/i, /nippon/i,
        /zwickroell/i, /\bUSP\b/, /unicamp/i, /\bUFSC\b/, /polit[ée]cnica/i,
    ];
    for (const name of names) {
        assert.ok(!name.test(NEUTRAL), `${name} outside the CTA box and the sources block`);
    }
});

test('the sources block names publishers only, and the company is only in the CTA box', () => {
    assert.ok(!/fermac|panatl[âa]ntica/i.test(HEAD_TEXT + ' ' + BODY.replace(CTA, ' ')), 'the company and the represented supplier stay in the CTA box');
    // No product brand or producer's own grade name, anywhere on the page.
    for (const brand of [/\bUSI-/i, /\bTBR\b/, /extra fino/i, /sincron/i, /®|™/]) {
        assert.ok(!brand.test(HTML), `${brand} on the page`);
    }
});

/* ===== Sources ===== */

test('every source has a link, and external links exist only in the sources block', () => {
    const entries = [...SOURCES.matchAll(/<div class="tec-check">([\s\S]*?)<\/div>/g)].map(match => match[1]);
    assert.ok(entries.length >= 2);
    for (const entry of entries) {
        const links = [...entry.matchAll(/<a href="(https:\/\/[^"]+)" rel="noopener">/g)];
        assert.ok(links.length >= 1, visible(entry).slice(0, 40));
        assert.equal(entry.split('<a ').length - 1, links.length, 'every link is https with rel="noopener"');
        assert.ok(visible(entry).includes('Conferido:'), visible(entry).slice(0, 40));
        // One checking date per link.
        assert.equal((visible(entry).match(/Conferido:/g) || []).length, links.length);
    }
    assert.ok(!/href="https?:\/\//.test(BODY.replace(SOURCES, ' ')), 'no external link outside the sources block');
    assert.match(visible(SOURCES), /lida em \d{2}\/\d{2}\/\d{4}/);
});

test('the sources are the standards body and the publisher of the plain-language definitions', () => {
    const publishers = [...SOURCES.matchAll(/<dt>([\s\S]*?)<\/dt>/g)].map(match => visible(match[1]));
    assert.deepEqual(publishers, ['ISO', 'ZwickRoell']);
    for (const host of ['www.iso.org', 'www.zwickroell.com']) {
        assert.ok(SOURCES.includes(`href="https://${host}/`), host);
    }
});

test('the standards are cited by their current catalog entries, and named once in the text', () => {
    const sources = visible(SOURCES);
    for (const edition of ['ISO 10474:2013', 'ISO 404:2013', 'ISO 6892-1:2019']) {
        assert.ok(sources.includes(edition), edition);
    }
    const text = visible(NEUTRAL);
    for (const standard of ['ISO 10474', 'ISO 404', 'ISO 6892-1']) {
        assert.equal(text.split(standard).length - 1, 1, `${standard} named once outside the sources block`);
    }
    // No edition year in the running text; the part number belongs to the
    // standard's own designation.
    assert.ok(!/:20\d\d/.test(text), 'no edition year in the running text');
    assert.ok(!/\bNBR\b|\bASTM\b|\bEN \d{4}\b|\bJIS\b|\bSAE\b|\bDIN\b/.test(visible(HTML)), 'no other standard on the page');
});

/* ===== The numbers and the designations the page states ===== */

test('the symbols are the ones checked against the public sources', () => {
    // The symbols carry subscripts, so the visible text reads "R eH"; the
    // checks run on the text without spaces.
    const flat = html => visible(html).replace(/\s+/g, '');
    const yield_ = flat(section('escoamento'));
    for (const piece of ['Re', 'ReH', 'ReL', 'Rp0,2', 'MPa']) {
        assert.ok(yield_.includes(piece), piece);
    }
    const strength = flat(section('resistencia'));
    assert.ok(strength.includes('Rm'));
    assert.ok(strength.includes('Rm=Fm/S0'));
    const elongation = flat(section('alongamento'));
    for (const piece of ['A=ΔL/L0×100', 'A5', 'A10', '5,65', '11,3']) {
        assert.ok(elongation.includes(piece), piece);
    }
    // The page never says that every value printed comes from the tensile test.
    assert.ok(!/valores impressos no certificado/.test(visible(HTML)), 'no claim about all printed values');
    // The page never says the results belong to the delivered lot.
    assert.ok(!/lote|corrida/i.test(visible(HTML)), 'no lot-specific claim on the page');
    // The page never says the certificate decides what the part carries.
    assert.ok(!/aguenta o esforço|garantia de resultado|não é garantia/i.test(visible(HTML)), 'no guarantee wording');
    // The Rm guidance does not rule a design use out: the certificate's Rm alone
    // is simply not enough to dimension a component.
    assert.ok(!/não para dimensionar/.test(visible(HTML)), 'no categorical exclusion of the design use');
    assert.ok(visible(section('resistencia')).includes('o certificado não basta'), 'the warning is kept');
});

test('the only property values on the page are the ones of the illustrative example', () => {
    const text = visible(NEUTRAL);
    const example = visible(one(HTML, /<p class="tec-example"[\s\S]*?<\/p>/, 'example'));
    assert.ok(example.includes('Exemplo ilustrativo'));
    assert.ok(example.includes('não são um grau'));
    assert.ok(example.includes('não são uma especificação'));
    assert.ok(example.includes('não representam um valor típico'));
    // A number followed by a unit, anywhere outside the sources block and the CTA.
    const values = text.match(/\d[\d.,]*\s?(?:mm|°C|MPa|N\/mm²|%|kgf)/g);
    assert.deepEqual([...new Set(values)].sort(), ['0,2%', '1 MPa', '1 N/mm²', '24%', '350 MPa', '430 MPa'].sort());
    // The example is the only place with property values; the other two
    // numbers are the definition of Rp0,2 and the equivalence of the units.
    assert.equal((text.match(/350 MPa/g) || []).length, 1);
    assert.equal((text.match(/430 MPa/g) || []).length, 1);
    assert.equal((text.match(/24%/g) || []).length, 1);
    assert.ok(!/\d\s?(?:MPa|%)/.test(visible(section('ensaio'))), 'no property value in the test section');
    assert.ok(!/\d\s?(?:MPa|%)/.test(visible(section('juntos')).replace(example, ' ')), 'no property value outside the example');
    assert.ok(visible(section('glossario')).includes('1 MPa = 1 N/mm²'), 'the unit equivalence is in the glossary');
    // No other property value and no grade value.
    assert.ok(!/\b(S355|S235|SAE|ASTM)\s?\d/.test(visible(HTML)), 'no grade designation on the page');
});

test('the reading of the three numbers is guidance, not a guarantee', () => {
    assert.ok(visible(section('juntos')).includes('Não é uma medida de distância até a ruptura'));
    assert.ok(visible(section('juntos')).includes('não é cálculo de projeto'));
    // The yield factor is not presented as a margin: the consulted source supports
    // the calculation of the ratio only.
    assert.ok(!/folga/.test(visible(HTML)), 'the ratio is not read as a margin');
    assert.ok(visible(section('certificado')).includes('nunca de um número isolado do certificado'));
    assert.ok(!/garantimos|garantid[oa]s?\b|com certeza|sempre melhor/i.test(visible(HTML)));
});

/* ===== The owner's placeholder ===== */

test('one marked placeholder naming the issue, followed by one neutral sentence', () => {
    const markers = [...HTML.matchAll(/<!--\s*PLACEHOLDER([\s\S]*?)-->\s*<p class="tec-note">([\s\S]*?)<\/p>/g)];
    assert.equal(markers.length, 1);
    assert.equal(HTML.split('PLACEHOLDER').length - 1, 1);
    assert.ok(markers[0][1].includes('issue #22'));
    const sentence = visible(markers[0][2]);
    assert.equal(sentence.split(/[.!?](?:\s|$)/).filter(Boolean).length, 1, 'one sentence');
    assert.ok(sentence.endsWith('.'));
    assert.ok(!/fermac|panatl[âa]ntica/i.test(sentence));
    assert.ok(!/\d/.test(sentence), 'no number in the placeholder sentence');
});
