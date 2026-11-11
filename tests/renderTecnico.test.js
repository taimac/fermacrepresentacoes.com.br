#!/usr/bin/env node
/**
 * Contract tests for the /tecnico renderer.
 *
 * Purpose: prove that an approved article becomes the site's page shell with
 * its source block, its internal links and its origin code intact — and that an
 * unapproved or incomplete article is refused rather than rendered.
 *
 * Date: 2026-11-05
 * Author: Coordinator A
 * Domain: Fermac
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { render } = require('../scripts/renderTecnico.js');

const GOOD = `---
status: approved
approved: true
brand: fermac
format: article
slug: pagina-de-teste
title: Página de teste
description: Uma descrição de teste com o tamanho que a meta espera.
lead: Uma entrada curta para o hero.
attribution:
  code: FER-WEB-TEC-PAGINA-TESTE
  target: ../envie-sua-lista.html
---

## Primeira parte

Um parágrafo com **negrito** e um \`código\`.

- primeiro item
- segundo item

### Uma subsecção

Outro parágrafo.

## Segunda parte

Texto final.
`;

test('an approved Fermac article renders the page shell', () => {
    const html = render(GOOD);
    assert.match(html, /<h1 class="tec-title" id="tec-title">Página de teste<\/h1>/);
    assert.match(html, /<title>Página de teste — Biblioteca técnica<\/title>/);
    assert.match(html, /rel="canonical" href="https:\/\/fermacrepresentacoes\.com\.br\/tecnico\/pagina-de-teste\.html"/);
});

test('the origin code is the one the article declared', () => {
    const html = render(GOOD);
    assert.match(html, /envie-sua-lista\.html\?origem=FER-WEB-TEC-PAGINA-TESTE/);
    const ctaLinks = [...html.matchAll(/<a [^>]*href="[^"]*origem=[^"]*"/g)];
    assert.equal(ctaLinks.length, 1, 'exactly one attribution link');
});

test('every section becomes an anchored section and an outline entry', () => {
    const html = render(GOOD);
    const ids = [...html.matchAll(/<section class="tec-group" id="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(ids, ['primeira-parte', 'segunda-parte']);
    const toc = /<nav class="tec-toc"[\s\S]*?<\/nav>/.exec(html)[0];
    const anchors = [...toc.matchAll(/<a href="#([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(anchors, ids);
    for (const id of anchors) assert.ok(html.includes(`id="${id}"`), `${id} resolves`);
});

test('markdown becomes prose, not raw markup', () => {
    const html = render(GOOD);
    assert.match(html, /<strong>negrito<\/strong>/);
    assert.match(html, /<code>código<\/code>/);
    assert.match(html, /<h3 class="tec-subtitle">Uma subsecção<\/h3>/);
    assert.match(html, /<li>primeiro item<\/li>/);
    assert.ok(!html.includes('**negrito**'), 'no leftover markdown');
});

test('the CTA keeps the wording that states no deadline', () => {
    const html = render(GOOD);
    assert.match(html, /condições da representada/);
    assert.ok(!/1 dia útil/.test(html), 'no quotation deadline');
});

test('an unapproved article is refused', () => {
    const unapproved = GOOD.replace('approved: true', 'approved: false');
    assert.throws(() => render(unapproved), /approved must be true/);
});

test('malformed frontmatter cannot override the approval gate', () => {
    const indentedOverride = GOOD.replace('approved: true', 'approved: false\n  approved: true');
    const duplicateOverride = GOOD.replace('approved: true', 'approved: false\napproved: true');
    assert.throws(() => render(indentedOverride), /unexpected indentation/);
    assert.throws(() => render(duplicateOverride), /duplicate frontmatter field "approved"/);
});

test('duplicate nested attribution fields are refused', () => {
    const duplicateCode = GOOD.replace(
        '  code: FER-WEB-TEC-PAGINA-TESTE',
        '  code: FER-WEB-TEC-PAGINA-TESTE\n  code: FER-WEB-TEC-OUTRA',
    );
    assert.throws(() => render(duplicateCode), /duplicate frontmatter field "attribution\.code"/);
});

test('a Fermac article without an attribution code is refused', () => {
    const noCode = GOOD.replace(/\n  code: FER-WEB-TEC-PAGINA-TESTE/, '');
    assert.throws(() => render(noCode), /attribution\.code is required/);
});

test('an attribution code outside the pattern is refused', () => {
    const bad = GOOD.replace('FER-WEB-TEC-PAGINA-TESTE', 'PAGINA-TESTE');
    assert.throws(() => render(bad), /does not match/);
});

test('an outline is not rendered as an article', () => {
    const outline = GOOD.replace('format: article', 'format: outline');
    assert.throws(() => render(outline), /format must be article/);
});

test('a non-Fermac brand is refused', () => {
    const personal = GOOD.replace('brand: fermac', 'brand: personal');
    assert.throws(() => render(personal), /brand must be fermac/);
});

test('missing frontmatter is refused', () => {
    assert.throws(() => render('## Só um título\n\ntexto'), /no YAML frontmatter/);
});

test('blank and non-scalar title and description fields are refused', () => {
    for (const bad of [
        GOOD.replace('title: Página de teste', 'title:'),
        GOOD.replace('description: Uma descrição de teste com o tamanho que a meta espera.', 'description:'),
        GOOD.replace('title: Página de teste', 'title:\n  nested: value'),
        GOOD.replace('description: Uma descrição de teste com o tamanho que a meta espera.', 'description:\n  nested: value'),
    ]) {
        assert.throws(() => render(bad), /title must be a non-empty string|description must be a non-empty string/);
    }
});

test('a blank or non-scalar optional lead is refused', () => {
    for (const lead of ['lead:', 'lead:\n  nested: value']) {
        const bad = GOOD.replace('lead: Uma entrada curta para o hero.', lead);
        assert.throws(() => render(bad), /lead must be a non-empty string when provided/);
    }
});

test('HTML in the article is escaped, never executed', () => {
    const withMarkup = GOOD.replace('Texto final.', 'Texto com <script>alert(1)</script>.');
    const html = render(withMarkup);
    assert.ok(!html.includes('<script>alert(1)</script>'), 'script tag escaped');
    assert.match(html, /&lt;script&gt;/);
});

test('two sections with the same heading do not collide', () => {
    const repeated = GOOD + '\n## Primeira parte\n\nRepetida.\n';
    const html = render(repeated);
    const ids = [...html.matchAll(/<section class="tec-group" id="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, 'ids are unique');
    assert.deepEqual(ids, ['primeira-parte', 'segunda-parte', 'primeira-parte-2']);
});

test('a section heading cannot take an id the page shell already uses', () => {
    const colliding = GOOD + '\n## Main content\n\nOutra parte.\n';
    const html = render(colliding);
    const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.filter(id => id === 'main-content').length, 1, 'the shell keeps main-content');
    const sectionIds = [...html.matchAll(/<section class="tec-group" id="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(sectionIds, ['primeira-parte', 'segunda-parte', 'main-content-2']);
});

test('a section title id cannot take another section id', () => {
    // "Foo" reserves both `foo` and `foo-title`; the second heading must not
    // claim `foo-title`, or its outline link lands on the first section.
    const tricky = GOOD + '\n## Primeira parte title\n\nDepois.\n';
    const html = render(tricky);
    const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, 'no duplicate ids anywhere in the page');
    const sectionIds = [...html.matchAll(/<section class="tec-group" id="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(sectionIds, ['primeira-parte', 'segunda-parte', 'primeira-parte-title-2']);
});

test('an attribution code longer than the destination accepts is refused', () => {
    const long = 'FER-WEB-TEC-' + 'A'.repeat(40); // 52 characters
    const bad = GOOD.replace('FER-WEB-TEC-PAGINA-TESTE', long);
    assert.throws(() => render(bad), /at most 48/);
});

test('the renderer and the destination agree on the code length limit', () => {
    // The destination silently drops a longer code, so this is not cosmetic:
    // a mismatch means a rendered page loses its attribution at the CTA.
    const fs = require('node:fs');
    const path = require('node:path');
    const root = path.resolve(__dirname, '..');
    const controller = fs.readFileSync(path.join(root, 'scripts', 'siteController.js'), 'utf8');
    const match = /code\.length\s*>\s*(\d+)/.exec(controller);
    assert.ok(match, 'siteController.js states its length limit');
    const destinationLimit = Number(match[1]);
    assert.equal(destinationLimit, 48, 'destination limit is what the renderer assumes');
    const atLimit = 'FER-WEB-TEC-' + 'A'.repeat(destinationLimit - 'FER-WEB-TEC-'.length);
    assert.equal(atLimit.length, destinationLimit);
    assert.doesNotThrow(() => render(GOOD.replace('FER-WEB-TEC-PAGINA-TESTE', atLimit)), 'a code at the limit renders');
    const overLimit = atLimit + 'A';
    assert.throws(() => render(GOOD.replace('FER-WEB-TEC-PAGINA-TESTE', overLimit)), /at most 48/);
});

test('a slug that could escape the tecnico directory is refused', () => {
    for (const slug of ['../index', 'a/b', 'Pagina', 'pagina teste']) {
        const bad = GOOD.replace('slug: pagina-de-teste', `slug: ${slug}`);
        assert.throws(() => render(bad), /must match/, `slug "${slug}" refused`);
    }
});

test('a blocked article is refused even if approved is true', () => {
    const blocked = GOOD.replace('status: approved', 'status: blocked');
    assert.throws(() => render(blocked), /status is blocked/);
});

test('a same-directory internal link is rendered as a link', () => {
    const linked = GOOD.replace('Texto final.', 'Veja [o decodificador](decodificador.html).');
    const html = render(linked);
    assert.match(html, /<a href="decodificador.html">o decodificador<\/a>/);
});

test('a link that leaves the directory or the site stays literal text', () => {
    for (const target of ['../index.html', 'https://example.com', 'sub/page.html']) {
        const linked = GOOD.replace('Texto final.', `Veja [x](${target}).`);
        const html = render(linked);
        assert.ok(!html.includes(`<a href="${target}">x</a>`), `${target} not linked from the article`);
        assert.ok(html.includes(`[x](${target})`), 'left as literal text');
    }
});

test('the template has not drifted from the live shell', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const root = path.resolve(__dirname, '..');
    const shell = fs.readFileSync(path.join(root, 'tecnico', 'como-especificar.html'), 'utf8');
    const template = fs.readFileSync(path.join(root, 'tecnico', '_template.html'), 'utf8');
    const assets = [...shell.matchAll(/href="(\.\.\/styles\/[^"]+)"/g)].map(m => m[1]);
    assert.ok(assets.length >= 2, 'shell carries its stylesheets');
    for (const asset of assets) assert.ok(template.includes(asset), `template carries ${asset}`);
    const script = /\.\.\/scripts\/siteController\.js\?v=[^"]+/.exec(shell);
    assert.ok(template.includes(script[0]), 'template carries the current script version');
    const navbar = /<nav class="navbar"[\s\S]*?<\/nav>/.exec(shell)[0];
    assert.ok(template.includes(navbar), 'navbar is the live one');
    const footer = /<footer class="tec-footer">[\s\S]*?<\/footer>/.exec(shell)[0];
    assert.ok(template.includes(footer), 'footer is the live one');
    const ctaText = /<p class="tec-cta__text">([^<]+)<\/p>/.exec(shell)[1];
    assert.ok(template.includes(ctaText), 'CTA wording is the live wording');
});

test('the output path cannot leave tecnico/ inside the repository', () => {
    const path = require('node:path');
    const { outputPath } = require('../scripts/renderTecnico.js');
    assert.throws(() => outputPath('ok', path.join(__dirname, '..', 'index.html')), /outside tecnico/);
    assert.throws(() => outputPath('ok', path.join(__dirname, '..', 'tecnico', '..', 'index.html')), /outside tecnico/);
    assert.ok(outputPath('ok').endsWith('/tecnico/ok.html'));
    assert.equal(outputPath('ok', '/tmp/preview.html'), '/tmp/preview.html', 'a preview outside the repo is allowed');
});
