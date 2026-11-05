#!/usr/bin/env node
/**
 * Render an approved Editorial article into a /tecnico page.
 *
 * Purpose: turn one approved markdown article into the site's existing page
 * shell, so publishing is a review of a rendered page rather than a hand-built
 * HTML file. It renders; it never commits, pushes, merges or publishes.
 *
 * Date: 2026-11-05
 * Author: Coordinator A
 * Domain: Fermac
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'tecnico', '_template.html');
const ORIGEM_PATTERN = /^FER-WEB-TEC-[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

function fail(message) {
    throw new Error(message);
}

/** Parse the small YAML subset the editorial contract uses. */
function parseFrontmatter(text) {
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
    if (!match) fail('article has no YAML frontmatter');
    const meta = {};
    let current = null;
    for (const raw of match[1].split(/\r?\n/)) {
        if (!raw.trim() || raw.trim().startsWith('#')) continue;
        const indented = /^\s+/.test(raw);
        if (indented && current) {
            const [key, ...rest] = raw.trim().split(':');
            if (rest.length) meta[current][key.trim()] = rest.join(':').trim().replace(/^["']|["']$/g, '');
            continue;
        }
        const idx = raw.indexOf(':');
        if (idx < 0) continue;
        const key = raw.slice(0, idx).trim();
        const value = raw.slice(idx + 1).trim();
        if (!value) {
            meta[key] = {};
            current = key;
        } else {
            meta[key] = value.replace(/^["']|["']$/g, '');
            current = null;
        }
    }
    return { meta, body: text.slice(match[0].length) };
}

/** Escape text for HTML. Markdown in, HTML out, never HTML in. */
function esc(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function inline(text) {
    return esc(text)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|\s)\*([^*]+)\*/g, '$1<em>$2</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function slugify(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
}

/**
 * Convert the article markdown into page sections.
 * `##` opens a section; `###` becomes a subsection heading inside it.
 * The first `##` level is not assumed to be a title — the hero carries the title.
 */
function renderBody(markdown) {
    const lines = markdown.split(/\r?\n/);
    const sections = [];
    let current = null;
    let paragraph = [];
    let list = null;

    const flushParagraph = () => {
        if (!paragraph.length) return;
        const text = paragraph.join(' ').trim();
        if (text) current.blocks.push(`<p class="tec-text">${inline(text)}</p>`);
        paragraph = [];
    };
    const flushList = () => {
        if (!list) return;
        current.blocks.push(`<ul class="tec-list" role="list">\n${list.map(item => `                        <li>${inline(item)}</li>`).join('\n')}\n                    </ul>`);
        list = null;
    };

    for (const raw of lines) {
        const line = raw.trimEnd();
        if (!line.trim()) { flushParagraph(); flushList(); continue; }

        const h2 = /^##\s+(.*)$/.exec(line);
        const h3 = /^###\s+(.*)$/.exec(line);
        const bullet = /^[-*]\s+(.*)$/.exec(line);

        if (h2) {
            flushParagraph(); flushList();
            const title = h2[1].trim();
            current = { id: slugify(title), title, blocks: [] };
            sections.push(current);
            continue;
        }
        if (h3) {
            flushParagraph(); flushList();
            if (!current) fail('a ### heading appeared before any ## section');
            current.blocks.push(`<h3 class="tec-subtitle">${inline(h3[1].trim())}</h3>`);
            continue;
        }
        if (bullet) {
            flushParagraph();
            if (!current) fail('a list item appeared before any ## section');
            list = list || [];
            list.push(bullet[1].trim());
            continue;
        }
        flushList();
        if (!current) fail('article text appeared before any ## section');
        paragraph.push(line.trim());
    }
    flushParagraph(); flushList();

    if (!sections.length) fail('article has no ## sections');
    return sections;
}

function renderSections(sections) {
    return sections.map(section => `                <section class="tec-group" id="${section.id}" aria-labelledby="${section.id}-title">
                    <h2 class="tec-group__title" id="${section.id}-title">${inline(section.title)}</h2>
${section.blocks.map(block => '                    ' + block).join('\n')}
                </section>`).join('\n\n');
}

function renderToc(sections) {
    return sections.map(section => `                        <li><a href="#${section.id}">${inline(section.title)}</a></li>`).join('\n');
}

/** Validate everything the publication gate depends on. */
function validate(meta, sections) {
    const problems = [];
    if (meta.status !== 'draft' && meta.status !== 'approved') {
        problems.push(`status must be draft or approved, got "${meta.status || ''}"`);
    }
    if (meta.approved !== 'true' && meta.approved !== true) {
        problems.push('approved must be true — an unapproved article is not rendered');
    }
    if (meta.brand !== 'fermac') problems.push('brand must be fermac');
    if (meta.format !== 'article') problems.push('format must be article');
    if (!meta.slug) problems.push('slug is required');
    const code = meta.attribution && meta.attribution.code;
    if (!code) problems.push('attribution.code is required');
    else if (!ORIGEM_PATTERN.test(code)) problems.push(`attribution.code "${code}" does not match ${ORIGEM_PATTERN}`);
    if (!meta.title) problems.push('title is required');
    if (!meta.description) problems.push('description is required');
    if (!sections.length) problems.push('no sections');
    return problems;
}

function render(articleText) {
    const { meta, body } = parseFrontmatter(articleText);
    const sections = renderBody(body);
    const problems = validate(meta, sections);
    if (problems.length) {
        const error = new Error('article is not publishable:\n  - ' + problems.join('\n  - '));
        error.problems = problems;
        throw error;
    }
    const template = fs.readFileSync(TEMPLATE, 'utf8');
    const lead = meta.lead || meta.description;
    return template
        .replace(/\{\{TITLE\}\}/g, esc(meta.title))
        .replace(/\{\{DESCRIPTION\}\}/g, esc(meta.description))
        .replace(/\{\{LEAD\}\}/g, esc(lead))
        .replace(/\{\{SLUG\}\}/g, esc(meta.slug))
        .replace(/\{\{ORIGEM\}\}/g, esc(meta.attribution.code))
        .replace('{{TOC}}', renderToc(sections))
        .replace('{{BODY}}', renderSections(sections));
}

function main(argv) {
    const args = argv.slice(2);
    const input = args.find(arg => !arg.startsWith('--'));
    const outIndex = args.indexOf('--out');
    if (!input) {
        console.error('usage: node scripts/renderTecnico.js <article.md> [--out <path>]');
        return 2;
    }
    let html;
    try {
        html = render(fs.readFileSync(input, 'utf8'));
    } catch (error) {
        console.error(error.message);
        return 1;
    }
    const target = outIndex > -1 ? args[outIndex + 1] : path.join(ROOT, 'tecnico', `${parseFrontmatter(fs.readFileSync(input, 'utf8')).meta.slug}.html`);
    fs.writeFileSync(target, html);
    console.log(`rendered ${target}`);
    console.log('next: create the branch, commit the page, open a draft PR — the script never publishes');
    return 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { parseFrontmatter, render, renderBody, validate, slugify };
