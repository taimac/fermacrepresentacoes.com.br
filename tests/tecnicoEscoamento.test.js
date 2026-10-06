/**
 * Static tests for tecnico/escoamento-resistencia.html (T05, limite de
 * escoamento e resistência à tração, em linguagem simples).
 * Run from the repo root: node --test
 * No dependencies: node:test and node:assert only. The page is read as
 * text; nothing is rendered.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const TECNICO = path.join(ROOT, 'tecnico');
const PAGE = 'escoamento-resistencia.html';
const CODE = 'FER-WEB-TEC-ESCOAMENTO-RESISTENCIA';
const TITLE = 'Limite de escoamento e resistência à tração, em linguagem simples';

const read = (...parts) => fs.readFileSync(path.join(ROOT, ...parts), 'utf8');

const HTML = read('tecnico', PAGE);
const T03 = read('tecnico', 'como-especificar.html');
const INDEX = read('tecnico', 'index.html');

const CTA = /<aside class="tec-cta"[\s\S]*?<\/aside>/;
const EXAMPLE = /<(\w+)\b[^>]*\bdata-exemplo="ilustrativo"[^>]*>[\s\S]*?<\/\1>/g;

/** The visible text of a piece of HTML: no comments, no tags. */
function textOf(html) {
    return html
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
}

const block = (html, pattern, name) => {
    const match = html.match(pattern);
    assert.ok(match, `${name} is on the page`);
    return match[0];
};

/* ===== Shell ===== */

test('exactly one h1, with the page title', () => {
    const headings = [...HTML.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
    assert.equal(headings.length, 1);
    assert.equal(textOf(headings[0][1]), TITLE);
    assert.match(HTML, new RegExp(`<title>${TITLE} — Biblioteca técnica</title>`));
});

test('the canonical URL is the page itself', () => {
    const canonical = [...HTML.matchAll(/<link rel="canonical" href="([^"]+)">/g)].map(match => match[1]);
    assert.deepEqual(canonical, [`https://fermacrepresentacoes.com.br/tecnico/${PAGE}`]);
});

test('the buyer\'s question is asked and answered in the hero', () => {
    const hero = block(HTML, /<section class="tec-hero"[\s\S]*?<\/section>/, 'the hero');
    const lead = textOf(block(hero, /<p class="tec-lead">[\s\S]*?<\/p>/, 'the lead'));
    assert.ok(lead.includes('Por que o escoamento importa para a minha peça?'));
    assert.ok(lead.length > 'Por que o escoamento importa para a minha peça?'.length + 40, 'the lead carries the answer too');
    assert.ok(HTML.indexOf('tec-lead') < HTML.indexOf('tec-toc'), 'the answer comes before any section');
});

test('the navbar and the footer sentence are the ones of the other pages', () => {
    const nav = /<nav class="navbar"[\s\S]*?<\/nav>/;
    assert.equal(block(HTML, nav, 'the navbar'), block(T03, nav, 'the navbar of T03'));
    const footer = /<footer class="tec-footer">[\s\S]*?<\/footer>/;
    assert.equal(block(HTML, footer, 'the footer'), block(T03, footer, 'the footer of T03'));
});

/* ===== CTA ===== */

test('the CTA links to Envie sua lista with the page\'s origin code', () => {
    const cta = block(HTML, CTA, 'the CTA box');
    const links = [...cta.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(links, [`../envie-sua-lista.html?origem=${CODE}`]);
    assert.equal((HTML.match(/origem=/g) || []).length, 1, 'one origin code on the page');
});

test('the form\'s own check accepts the origin code', () => {
    const controller = read('scripts', 'siteController.js');
    const source = controller.match(/!\/(\^FER-WEB-TEC-[^\n]*?\$)\/\.test\(code\)/);
    assert.ok(source, 'the pattern is still in scripts/siteController.js');
    assert.match(CODE, new RegExp(source[1]));
    const limit = controller.match(/code\.length > (\d+)/);
    assert.ok(limit, 'the length limit is still in scripts/siteController.js');
    assert.ok(CODE.length <= Number(limit[1]), `${CODE.length} characters, at most ${limit[1]}`);
});

test('the CTA box is the one of "Como especificar", except for the code', () => {
    const here = block(HTML, CTA, 'the CTA box');
    const there = block(T03, CTA, 'the CTA box of T03');
    assert.equal(here, there.replace('FER-WEB-TEC-COMO-ESPECIFICAR', CODE));
});

/* ===== Index card ===== */

test('the /tecnico index has a card for the page', () => {
    const cards = [...INDEX.matchAll(/<a class="tec-page-card" href="([^"]+)">([\s\S]*?)<\/a>/g)];
    const card = cards.filter(match => match[1] === PAGE);
    assert.equal(card.length, 1);
    const title = card[0][2].match(/<span class="tec-page-card__title">([\s\S]*?)<\/span>/);
    assert.equal(textOf(title[1]), TITLE);
    const text = card[0][2].match(/<span class="tec-page-card__text">([\s\S]*?)<\/span>/);
    assert.ok(textOf(text[1]).length > 40, 'the card says what the page is about');
});

/* ===== Links ===== */

test('every relative link on the page resolves to a file, every anchor to an id', () => {
    const targets = [...HTML.matchAll(/\b(?:href|src)="([^"]*)"/g)].map(match => match[1]);
    assert.ok(targets.length > 10);
    const ids = new Set([...HTML.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    let checked = 0;
    for (const target of targets) {
        if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target)) continue; // https:, mailto:, tel:
        assert.notEqual(target, '', 'no empty link');
        if (target.startsWith('#')) {
            assert.ok(ids.has(target.slice(1)), `${target} names an id on the page`);
            checked += 1;
            continue;
        }
        const clean = target.split('#')[0].split('?')[0];
        let file = path.resolve(TECNICO, clean);
        assert.ok(file.startsWith(ROOT + path.sep), `${target} stays inside the repo`);
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        assert.ok(fs.existsSync(file), `${target} resolves to a file`);
        checked += 1;
    }
    assert.ok(checked >= 12, `${checked} relative links checked`);
});

test('every /tecnico page loads the same version of the stylesheets', () => {
    const pages = fs.readdirSync(TECNICO).filter(name => name.endsWith('.html'));
    assert.ok(pages.includes(PAGE));
    for (const sheet of ['main.css', 'tecnico.css']) {
        const versions = new Set(pages.map(name => {
            const match = read('tecnico', name).match(new RegExp(`${sheet.replace('.', '\\.')}\\?v=([^"]+)"`));
            assert.ok(match, `${name} loads ${sheet} with a version`);
            return match[1];
        }));
        assert.equal(versions.size, 1, `${sheet}: ${[...versions].join(', ')}`);
    }
});

/* ===== The figure ===== */

test('the figure is one inline SVG with a title and a description', () => {
    const figures = [...HTML.matchAll(/<svg\b[\s\S]*?<\/svg>/g)].map(match => match[0]);
    assert.equal(figures.length, 1);
    const svg = figures[0];
    assert.ok(!/<img\b/.test(HTML), 'no image file on the page');
    const title = svg.match(/<title id="([^"]+)">([\s\S]*?)<\/title>/);
    const desc = svg.match(/<desc id="([^"]+)">([\s\S]*?)<\/desc>/);
    assert.ok(title && textOf(title[2]).length > 20, 'the SVG has a title');
    assert.ok(desc && textOf(desc[2]).length > 100, 'the SVG has a description');
    assert.match(svg, /^<svg\b[^>]*\brole="img"/);
    assert.match(svg, new RegExp(`^<svg\\b[^>]*\\baria-labelledby="${title[1]} ${desc[1]}"`));
    for (const word of ['LE', 'LR', 'limite de escoamento', 'limite de resistência à tração']) {
        assert.ok(desc[2].includes(word), `the description names ${word}`);
    }
});

test('the figure has no axis values: its only digits number the three stretches', () => {
    const svg = HTML.match(/<svg\b[\s\S]*?<\/svg>/)[0];
    const labels = [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(match => textOf(match[1]));
    assert.ok(labels.length >= 8);
    const numbered = labels.filter(label => /\d/.test(label));
    assert.deepEqual(numbered, ['1. Estica', '2. Estica', '3. Cede']);
    for (const label of ['LE', 'LR', 'Tensão']) assert.ok(labels.includes(label), `${label} is on the figure`);
});

/* ===== Identity and numbers ===== */

test('outside the CTA box the page names no company and no supplier', () => {
    const outside = HTML.replace(CTA, '');
    assert.notEqual(outside, HTML);
    const names = ['Fermac', 'Panatlântica', 'Panatlantica', 'Usiminas', 'USI', 'CSN', 'Gerdau', 'ArcelorMittal',
        'Arcelor', 'Aperam', 'Acesita', 'Cosipa', 'COS', 'CST', 'Villares', 'Zwick', 'ZwickRoell', 'Instron'];
    for (const name of names) {
        const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${name}(?![\\p{L}\\p{N}])`, name === name.toUpperCase() ? 'u' : 'iu');
        assert.doesNotMatch(outside, pattern, `${name} outside the CTA box`);
    }
    // The CTA box does name the company: the check above is not vacuous.
    assert.match(block(HTML, CTA, 'the CTA box'), /Fermac/);
});

test('one block is marked as the illustrative example, and says so', () => {
    const examples = [...HTML.matchAll(EXAMPLE)].map(match => match[0]);
    assert.equal(examples.length, 1);
    const text = textOf(examples[0]);
    assert.match(text, /^Exemplo ilustrativo/);
    assert.match(text, /não é de nenhum aço/);
});

test('no value in MPa, N/mm² or kgf/mm² outside the illustrative example', () => {
    const outside = HTML.replace(EXAMPLE, '');
    assert.notEqual(outside, HTML);
    for (const part of [textOf(outside), ...[...outside.matchAll(/\bcontent="([^"]*)"/g)].map(match => match[1])]) {
        assert.doesNotMatch(part, /\d\s*(?:MPa|N\/mm|kgf)/, 'a number with a unit of stress or force');
    }
    // The only number-and-unit relation outside the example is the kgf/mm² factor.
    assert.ok(textOf(outside).includes('multiplique o número por 9,80665'));
});

test('the arithmetic of the illustrative example holds', () => {
    const text = textOf(HTML.match(EXAMPLE)[0]);
    const mpa = Number(text.match(/(\d+) MPa/)[1]);
    const area = Number(text.match(/(\d+) mm²/)[1]);
    const newtons = Number(text.match(/com ([\d.]+) newtons/)[1].replace('.', ''));
    const kgf = Number(text.match(/perto de (\d+) kgf/)[1]);
    assert.equal(mpa * area, newtons); // 1 MPa = 1 N/mm²
    assert.equal(Math.round(newtons / 9.80665), kgf);
});

/* ===== Terms ===== */

test('LE and LR lead; each symbol of the test standard appears once', () => {
    const text = textOf(HTML);
    assert.ok(text.includes('limite de escoamento (LE)'));
    assert.ok(text.includes('limite de resistência à tração (LR)'));
    for (const symbol of ['Re', 'ReH', 'ReL', 'Rp0,2', 'Rm']) {
        const found = text.match(new RegExp(`(?<![\\p{L}\\p{N}])${symbol}(?![\\p{L}\\p{N}])`, 'gu')) || [];
        assert.equal(found.length, 1, `${symbol} appears once, found ${found.length}`);
    }
    assert.match(text, /também aparecem como símbolos/);
    for (const term of ['alongamento', 'ensaio de tração', 'corpo de prova', 'MPa']) {
        assert.ok(text.includes(term), `${term} is on the page`);
    }
});

test('the standard is named once, with no edition year, and no other standard is', () => {
    const text = textOf(HTML.replace(/<footer[\s\S]*?<\/footer>/, ''));
    assert.equal((text.match(/ABNT NBR ISO 6892-1/g) || []).length, 1);
    assert.doesNotMatch(text, /6892-1\s*[:(]\s*\d{4}/);
    assert.doesNotMatch(text.replace('ABNT NBR ISO 6892-1', ''), /\b(?:NBR|ASTM|SAE|DIN|EN|JIS)\s?\d/);
});
