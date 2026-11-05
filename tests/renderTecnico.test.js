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
    assert.equal((html.match(/origem=/g) || []).length, 1, 'exactly one attribution link');
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

test('HTML in the article is escaped, never executed', () => {
    const withMarkup = GOOD.replace('Texto final.', 'Texto com <script>alert(1)</script>.');
    const html = render(withMarkup);
    assert.ok(!html.includes('<script>alert(1)</script>'), 'script tag escaped');
    assert.match(html, /&lt;script&gt;/);
});
