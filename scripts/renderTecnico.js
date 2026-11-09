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
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LOCAL_LINK_PATTERN = /^[a-z0-9-]+\.html$/;

/**
 * The destination page drops an origin code longer than this:
 * `_applyArrivalOrigem()` in scripts/siteController.js returns early, leaving
 * the generic codes in place. A page that renders a longer code therefore
 * looks correct and silently loses its attribution, so the same limit is
 * enforced here. `tests/renderTecnico.test.js` reads the limit out of that
 * file to keep the two from drifting apart.
 */
const ORIGEM_MAX_LENGTH = 48;

/** Ids the page shell already uses. A section id may not take one of them. */
const SHELL_IDS = ['navbar', 'tec-nav-links', 'mobileMenuBtn', 'main-content', 'tec-title', 'tec-cta-title'];

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

/**
 * Inline markdown: bold, italic, code, and same-directory links only.
 * Anything that is not a bare `page.html` target stays literal text, so an
 * article cannot link off-site or into another directory.
 */
function inline(text) {
    return esc(text)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|\s)\*([^*]+)\*/g, '$1<em>$2</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (whole, label, target) =>
            LOCAL_LINK_PATTERN.test(target) ? `<a href="${target}">${label}</a>` : whole);
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
 * Section ids are made unique so two identical headings cannot produce
 * duplicate ids, a broken anchor and an ambiguous aria-labelledby.
 */
function renderBody(markdown) {
    const lines = markdown.split(/\r?\n/);
    const sections = [];
    // Reserved before the first heading is read: the shell's own ids, plus each
    // section's `<id>-title`, which is the h2's id and the anchor target. A
    // section called "Foo" followed by one called "Foo title" would otherwise
    // give the second section the first section's title id.
    const usedIds = new Set(SHELL_IDS);
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
            const base = slugify(title) || 'secao';
            let id = base;
            let n = 2;
            while (usedIds.has(id) || usedIds.has(`${id}-title`)) { id = `${base}-${n++}`; }
            usedIds.add(id);
            usedIds.add(`${id}-title`);
            current = { id, title, blocks: [] };
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
    if (meta.status === 'blocked') problems.push('status is blocked — a blocked article is not rendered');
    else if (meta.status !== 'draft' && meta.status !== 'approved') {
        problems.push(`status must be draft or approved, got "${meta.status || ''}"`);
    }
    if (meta.approved !== 'true' && meta.approved !== true) {
        problems.push('approved must be true — an unapproved article is not rendered');
    }
    if (meta.brand !== 'fermac') problems.push('brand must be fermac');
    if (meta.format !== 'article') problems.push('format must be article');
    if (!meta.slug) problems.push('slug is required');
    else if (!SLUG_PATTERN.test(meta.slug)) {
        problems.push(`slug "${meta.slug}" must match ${SLUG_PATTERN} — it becomes a filename and the canonical URL`);
    }
    const code = meta.attribution && meta.attribution.code;
    if (!code) problems.push('attribution.code is required');
    else if (!ORIGEM_PATTERN.test(code)) problems.push(`attribution.code "${code}" does not match ${ORIGEM_PATTERN}`);
    else if (code.length > ORIGEM_MAX_LENGTH) {
        problems.push(`attribution.code is ${code.length} characters and the destination accepts at most ${ORIGEM_MAX_LENGTH} — it would be dropped there and the page would lose its attribution`);
    }
    if (!meta.title) problems.push('title is required');
    if (!meta.description) problems.push('description is required');
    if (!sections.length) problems.push('no sections');
    return problems;
}

/** Single pass, so content that contains a placeholder token cannot be re-expanded. */
function fill(template, values) {
    return template.replace(/\{\{([A-Z]+)\}\}/g, (whole, key) =>
        Object.prototype.hasOwnProperty.call(values, key) ? values[key] : whole);
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
    return fill(template, {
        TITLE: esc(meta.title),
        DESCRIPTION: esc(meta.description),
        LEAD: esc(lead),
        SLUG: esc(meta.slug),
        ORIGEM: esc(meta.attribution.code),
        TOC: renderToc(sections),
        BODY: renderSections(sections),
    });
}

/** Resolve the output path: inside the repo it must be tecnico/, outside is a preview. */
function outputPath(slug, requested) {
    const target = path.resolve(requested || path.join(ROOT, 'tecnico', `${slug}.html`));
    const allowed = path.resolve(ROOT, 'tecnico') + path.sep;
    const insideRepo = target === ROOT || target.startsWith(ROOT + path.sep);
    if (insideRepo && !target.startsWith(allowed)) {
        fail(`refusing to write inside the repository outside tecnico/: ${target}`);
    }
    return target;
}

function parseArgs(argv) {
    const args = { input: null, out: null };
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--out') {
            args.out = argv[i + 1];
            if (!args.out) fail('--out needs a path');
            i += 1;
            continue;
        }
        if (arg.startsWith('--')) fail(`unknown option: ${arg}`);
        if (!args.input) args.input = arg;
        else fail(`unexpected argument: ${arg}`);
    }
    if (!args.input) fail('usage: node scripts/renderTecnico.js <article.md> [--out <path>]');
    return args;
}

function main(argv) {
    let args;
    let html;
    try {
        args = parseArgs(argv.slice(2));
        const text = fs.readFileSync(args.input, 'utf8');
        html = render(text);
        const target = outputPath(parseFrontmatter(text).meta.slug, args.out);
        fs.writeFileSync(target, html);
        console.log(`rendered ${target}`);
        console.log('next: create the branch, commit the page, open a draft PR — the script never publishes');
        return 0;
    } catch (error) {
        console.error(error.message);
        return 1;
    }
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { parseFrontmatter, render, renderBody, validate, slugify, outputPath, parseArgs };
