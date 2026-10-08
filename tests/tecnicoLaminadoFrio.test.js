/**
 * Static tests for tecnico/laminado-a-frio.html (T09, "Laminado a frio:
 * qual a diferença entre frio e quente, e quando usar").
 * Run from the repo root: node --test
 * No dependencies: node:test and node:assert only.
 *
 * The page is text only. These tests hold the shell (navbar, footer, CTA),
 * the links, the brand-neutral rule, the sources block and the few numbers
 * and designations the page states.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

const PAGE = 'tecnico/laminado-a-frio.html';
const HTML = read(PAGE);
const SHELL = read('tecnico/como-especificar.html');
const INDEX = read('tecnico/index.html');
const CONTROLLER = read('scripts/siteController.js');

const TITLE = 'Laminado a frio: qual a diferença entre frio e quente, e quando usar';
const CODE = 'FER-WEB-TEC-LAMINADO-FRIO';
const CANONICAL = 'https://fermacrepresentacoes.com.br/tecnico/laminado-a-frio.html';

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

test('the first screen says the difference between frio and quente', () => {
    const lead = visible(one(HERO, /<p class="tec-lead">[\s\S]*?<\/p>/, 'hero lead'));
    for (const piece of [
        'Laminado a quente é', 'Laminado a frio é esse mesmo aço', 'limpo e laminado de novo, sem aquecer',
        'recozimento', 'mais fina', 'espessura mais regular', 'superfície mais lisa', 'dobrar e estampar',
    ]) {
        assert.ok(lead.includes(piece), `the lead says "${piece}"`);
    }
    // Why the buyer meets the two names: the note right under the hero.
    const note = visible(one(HTML, /<p class="tec-note">[\s\S]*?<\/p>/, 'first note'));
    assert.ok(note.includes('Os dois nomes aparecem na cotação'));
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

test('the /tecnico index has a card for the page, after the earlier ones', () => {
    const cards = [...INDEX.matchAll(/<a class="tec-page-card" href="([^"]+)">\s*<span class="tec-page-card__title">([\s\S]*?)<\/span>\s*<span class="tec-page-card__text">([\s\S]*?)<\/span>/g)];
    const card = cards.find(match => match[1] === 'laminado-a-frio.html');
    assert.ok(card, 'card not found');
    assert.equal(visible(card[2]), TITLE);
    assert.ok(visible(card[3]).includes('laminado a quente'));
    const hrefs = cards.map(match => match[1]);
    assert.equal(hrefs.filter(href => href === 'laminado-a-frio.html').length, 1);
    for (const earlier of ['calculadora-peso.html', 'decodificador.html', 'como-especificar.html']) {
        assert.ok(hrefs.indexOf(earlier) !== -1 && hrefs.indexOf(earlier) < hrefs.indexOf('laminado-a-frio.html'), earlier);
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

test('the request list links to "Como especificar"', () => {
    const request = section('pedido');
    assert.ok(request.includes('<a href="como-especificar.html">Como especificar seu pedido de aço</a>'));
    const terms = [...request.matchAll(/<dt>([\s\S]*?)<\/dt>/g)].map(match => visible(match[1]));
    assert.deepEqual(terms, ['Família', 'Qualidade', 'Espessura e dimensões', 'Superfície', 'O uso, em uma frase']);
});

test('each list row has one term and one explanation', () => {
    const rows = [...HTML.matchAll(/<div class="tec-(?:check|reason|code)">([\s\S]*?)<\/div>/g)];
    assert.ok(rows.length >= 30);
    for (const [, row] of rows) {
        assert.equal(row.split('<dt>').length - 1, 1, row.slice(0, 60));
        assert.equal(row.split('<dd>').length - 1, 1, row.slice(0, 60));
    }
});

test('every part named in the outline is on the page, in order', () => {
    const ids = [...HTML.matchAll(/<section class="tec-group" id="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(ids, ['processo', 'diferencas', 'escolha', 'qualidades', 'pedido', 'fontes']);
    const toc = [...one(HTML, /<nav class="tec-toc"[\s\S]*?<\/nav>/, 'table of contents').matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(toc, ids);
    const differences = [...section('diferencas').matchAll(/<dt>([\s\S]*?)<\/dt>/g)].map(match => visible(match[1]));
    assert.deepEqual(differences, ['Faixa de espessura', 'Regularidade da espessura', 'Superfície', 'Pintura', 'Conformação', 'Custo']);
});

/* ===== Brand-neutral ===== */

test('outside the CTA box and the sources block the page names no organisation', () => {
    const names = [
        /fermac/i, /panatl[âa]ntica/i, /\bCSN\b/, /usiminas/i, /arcelor/i, /gerdau/i, /aperam/i, /nippon/i,
        /\bUSP\b/, /unicamp/i, /\bUFSC\b/, /polit[ée]cnica/i,
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
    assert.ok(entries.length >= 4);
    for (const entry of entries) {
        const links = [...entry.matchAll(/<a href="(https:\/\/[^"]+)" rel="noopener">/g)];
        assert.ok(links.length >= 1, visible(entry).slice(0, 40));
        assert.equal(entry.split('<a ').length - 1, links.length, 'every link is https with rel="noopener"');
        assert.ok(visible(entry).includes('Conferido:'), visible(entry).slice(0, 40));
    }
    assert.ok(!/href="https?:\/\//.test(BODY.replace(SOURCES, ' ')), 'no external link outside the sources block');
    assert.match(visible(SOURCES), /lida em \d{2}\/\d{2}\/\d{4}/);
});

test('the sources are a standards body, two steelmakers and university texts', () => {
    const publishers = [...SOURCES.matchAll(/<dt>([\s\S]*?)<\/dt>/g)].map(match => visible(match[1]));
    assert.deepEqual(publishers, ['ABNT', 'Usiminas', 'CSN', 'USP e Unicamp', 'UFSC']);
    for (const host of ['www.abntcatalogo.com.br', 'www.usiminas.com', 'www.csn.com.br', 'sites.fem.unicamp.br', 'repositorio.ufsc.br']) {
        assert.ok(SOURCES.includes(`href="https://${host}/`), host);
    }
});

test('the standards are cited by their current catalog entries, and named once in the text', () => {
    const sources = visible(SOURCES);
    for (const edition of ['ABNT NBR 5915-1:2013', 'ABNT NBR 5915-2:2013', 'ABNT NBR 6658:2020']) {
        assert.ok(sources.includes(edition), edition);
    }
    assert.ok(sources.includes('situação “em vigor”'));
    assert.ok(sources.includes('Citadas só como referência'));
    assert.equal(SOURCES.split('href="https://www.abntcatalogo.com.br/pnm.aspx?Q=').length - 1, 3);
    const text = visible(NEUTRAL);
    assert.equal(text.split('ABNT NBR 5915').length - 1, 1, 'NBR 5915 named once outside the sources block');
    assert.equal(text.split('ABNT NBR 6658').length - 1, 1, 'NBR 6658 named once outside the sources block');
    assert.ok(!/NBR \d{4,5}\s*[-:]/.test(text), 'no part and no edition year in the running text');
    assert.ok(!/\bASTM\b|\bEN 1\d{4}\b|\bJIS\b|\bSAE\b|\bDIN\b/.test(visible(HTML)), 'no other standard on the page');
    assert.equal(visible(HTML).match(/\bNBR\s?\d+/g).every(name => /5915|6658/.test(name)), true, 'no other NBR on the page');
});

/* ===== The designations and the numbers the page states ===== */

test('the quality names are the ones checked against the public sources', () => {
    const terms = [...section('qualidades').matchAll(/<dt>([\s\S]*?)<\/dt>/g)].map(match => visible(match[1]));
    assert.deepEqual(terms, [
        'Qualidade comercial', 'Qualidades de estampagem', 'Estampagem média (EM)', 'Estampagem profunda (EP)',
        'Estampagem extra profunda (EEP)', 'Outras famílias', 'No estoque',
    ]);
    // Upper-case codes in the running text: the stamping qualities, the two
    // description codes and the standards body. No producer's grade.
    const allowed = new Set(['EM', 'EP', 'EEP', 'FF', 'FQ', 'ABNT', 'NBR']);
    for (const code of visible(NEUTRAL).match(/\b[A-Z]{2,}\b/g)) {
        assert.ok(allowed.has(code), code);
    }
});

test('the only values on the page are the three checked ones', () => {
    const text = visible(NEUTRAL);
    // A number followed by a unit, anywhere outside the sources block and the CTA.
    const values = text.match(/\d[\d.,]*\s?(?:mm|°C|MPa|N\/mm²|%|kg|HRB|µm|micr[ôo]metros?|g\/m²)/g);
    assert.deepEqual([...new Set(values)].sort(), ['1,5 mm', '1.000 °C', '3 mm'].sort());
    assert.ok(text.includes('acima de 1.000 °C'));
    assert.ok(text.includes('até cerca de 3 mm'));
    assert.ok(text.includes('começa perto de 1,5 mm'));
    // The thickness figures are given as what public catalogs show, not as a supply range.
    const range = visible(one(section('diferencas'), /<div class="tec-reason">\s*<dt>Faixa de espessura<\/dt>[\s\S]*?<\/div>/, 'thickness row'));
    assert.ok(range.includes('Nos catálogos de usinas brasileiras conferidos para esta página'));
    assert.ok(range.includes('As faixas mudam de um fornecedor para outro'));
    // No width figure and no property value.
    assert.ok(!/largura[^.]*\d/.test(text), 'no width figure');
    assert.ok(!/\d\s?(?:MPa|%)/.test(visible(HTML)), 'no property value');
});

test('the comparison and the choice are guidance, not a guarantee', () => {
    assert.ok(visible(section('diferencas')).includes('É orientação geral'));
    assert.ok(visible(section('diferencas')).includes('não é garantia de resultado'));
    assert.ok(visible(section('escolha')).includes('orientação geral'));
    assert.ok(visible(section('escolha')).includes('não são garantia de resultado'));
    assert.ok(!/garantimos|garantid[oa]s?\b|com certeza|sempre melhor/i.test(visible(HTML)));
});

/* ===== The owner's placeholder ===== */

test('one marked placeholder naming the issue, followed by one neutral sentence', () => {
    const markers = [...HTML.matchAll(/<!--\s*PLACEHOLDER([\s\S]*?)-->\s*<p class="tec-note">([\s\S]*?)<\/p>/g)];
    assert.equal(markers.length, 1);
    assert.equal(HTML.split('PLACEHOLDER').length - 1, 1);
    assert.ok(markers[0][1].includes('issue #20'));
    const sentence = visible(markers[0][2]);
    assert.equal(sentence.split(/[.!?](?:\s|$)/).filter(Boolean).length, 1, 'one sentence');
    assert.ok(sentence.endsWith('.'));
    assert.ok(!/fermac|panatl[âa]ntica/i.test(sentence));
    assert.ok(!/\d/.test(sentence), 'no gauge or width in the placeholder sentence');
});
