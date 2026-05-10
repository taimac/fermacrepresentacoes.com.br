<!--
Purpose: Document the standalone Fermac website repository scope and deployment boundary.
Date: 2026-05-07
Author: Codex
Domain: Fermac
-->

# Fermac Representações Website

Static website candidate for Fermac Representações.

## Status

**Live — pending HTTPS certificate.**

Repository is public. GitHub Pages is enabled from `main` / root. HTTPS cert is issued automatically by GitHub/Let's Encrypt (~30 min from Pages activation). Custom domain: `fermacrepresentacoes.com.br`.

Last deployment commit: `bb47538`

## Stack

Static HTML, CSS, and vanilla JavaScript.

## Local Review

Use the no-cache development server while editing:

```bash
python3 dev_server.py
```

Then open:

```text
http://127.0.0.1:8001/
```

The local controller watches HTML, CSS, JavaScript, and translation files and reloads the page after saves. On localhost, Portuguese text is read from the HTML by default so copy edits are visible immediately; use the language toggle only when checking English strings.

## Boundary

This repo is for the public website only. It should not contain private pipeline, email migration, CRM, client, or operational data.
