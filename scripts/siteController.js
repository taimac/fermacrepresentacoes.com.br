/**
 * Fermac Representações — Site Controller
 *
 * OOP class-based controllers, no inline scripts, CSP-compliant.
 * Requires: translations/strings.js loaded before this file.
 */

/* ===================== Navbar Controller ===================== */

class NavbarController {
    constructor(navbarId = 'navbar') {
        this.navbar = document.getElementById(navbarId);
        if (this.navbar) {
            window.addEventListener('scroll', this._handleScroll.bind(this));
            this._setActiveLink();
        }
    }

    _handleScroll() {
        if (window.scrollY > 50) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }
    }

    // Compare whole resolved paths, not file names: /tecnico/index.html and
    // /index.html share a file name, and /tecnico/ has none.
    _setActiveLink() {
        const current = NavbarController.pagePath(window.location.pathname);
        this.navbar.querySelectorAll('.nav-links a').forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            let target;
            try {
                target = new URL(href, window.location.href);
            } catch (error) {
                return; // a malformed href must not stop the other controllers
            }
            if (target.origin === window.location.origin
                && NavbarController.pagePath(target.pathname) === current) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            }
        });
    }

    // "/a/index.html", "/a/index", "/a/" name one page; so do "/a/x.html"
    // and "/a/x" (GitHub Pages serves both).
    static pagePath(pathname) {
        return pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
    }
}

/* ===================== Mobile Menu Controller ===================== */

class MobileMenuController {
    constructor(menuBtnId = 'mobileMenuBtn', navLinksSelector = '.nav-links') {
        this.menuBtn = document.getElementById(menuBtnId);
        this.navLinks = document.querySelector(navLinksSelector);
        if (this.menuBtn && this.navLinks) {
            this.menuBtn.addEventListener('click', this._toggleMenu.bind(this));
            document.addEventListener('click', this._closeOnOutside.bind(this));
        }
    }

    _toggleMenu() {
        const isOpen = this.navLinks.classList.toggle('active');
        this.menuBtn.setAttribute('aria-expanded', isOpen);
    }

    _closeOnOutside(e) {
        if (
            this.navLinks.classList.contains('active') &&
            !this.navLinks.contains(e.target) &&
            !this.menuBtn.contains(e.target)
        ) {
            this.navLinks.classList.remove('active');
            this.menuBtn.setAttribute('aria-expanded', 'false');
        }
    }
}

/* ===================== Language Switcher Controller ===================== */

class LanguageSwitcherController {
    constructor(dictionary) {
        if (!dictionary) return;
        this.dict = dictionary;
        this.isLocalDev = ['127.0.0.1', 'localhost'].includes(window.location.hostname);
        this.lang = this.isLocalDev ? 'pt' : (localStorage.getItem('fermac-lang') || 'pt');

        if (this.isLocalDev) {
            this._updateToggleLabel();
            document.documentElement.lang = 'pt';
        } else {
            this._applyLanguage(this.lang);
        }
        this._bindToggle();
    }

    _applyLanguage(lang) {
        const strings = this.dict[lang];
        if (!strings) return;

        // Update all text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (strings[key] !== undefined) {
                el.textContent = strings[key];
            }
        });

        // Update placeholder attributes
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            if (strings[key] !== undefined) {
                el.setAttribute('placeholder', strings[key]);
            }
        });

        // Update aria-label attributes
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.dataset.i18nAria;
            if (strings[key] !== undefined) {
                el.setAttribute('aria-label', strings[key]);
            }
        });

        // Update document language
        document.documentElement.lang = lang;

        this._updateToggleLabel();
    }

    _updateToggleLabel() {
        const btn = document.getElementById('langToggle');
        if (btn) {
            btn.textContent = this.lang === 'pt' ? 'EN' : 'PT';
        }
    }

    _bindToggle() {
        const btn = document.getElementById('langToggle');
        if (!btn) return;
        btn.addEventListener('click', () => {
            this.lang = this.lang === 'pt' ? 'en' : 'pt';
            if (!this.isLocalDev) {
                localStorage.setItem('fermac-lang', this.lang);
            }
            this._applyLanguage(this.lang);
        });
    }
}

/* ===================== Animation Controller ===================== */

class AnimationController {
    constructor(selectors = []) {
        if (!('IntersectionObserver' in window) || selectors.length === 0) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => observer.observe(el));
        });
    }
}

/* ===================== Smooth Scroll Controller ===================== */

class SmoothScrollController {
    constructor() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const hash = this.getAttribute('href');
                let target = null;
                try {
                    target = document.querySelector(hash);
                } catch (error) {
                    return; // "#" alone, or not a valid selector
                }
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Move keyboard and screen-reader focus with the view
                    // (skip link, group chips), and keep the hash shareable.
                    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
                    target.focus({ preventScroll: true });
                    history.replaceState(null, '', hash);
                }
            });
        });
    }
}

/* ===================== Home Page Controller ===================== */

class HomePageController {
    constructor() {
        // Stat number hover scale
        document.querySelectorAll('.stat-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                const num = item.querySelector('.stat-item__number');
                if (num) num.style.transform = 'scale(1.08)';
            });
            item.addEventListener('mouseleave', () => {
                const num = item.querySelector('.stat-item__number');
                if (num) num.style.transform = 'scale(1)';
            });
        });
    }
}

/* ===================== Product Carousel Controller ===================== */

class ProductCarouselController {
    constructor(selector = '.product-carousel') {
        this.root = document.querySelector(selector);
        if (!this.root) return;

        this.slides = Array.from(this.root.querySelectorAll('.product-slide'));
        this.prevButton = this.root.querySelector('[data-carousel-prev]');
        this.nextButton = this.root.querySelector('[data-carousel-next]');
        this.index = 0;

        if (this.slides.length < 2) return;

        this.prevButton?.addEventListener('click', () => this.show(this.index - 1));
        this.nextButton?.addEventListener('click', () => this.show(this.index + 1));
        this.root.addEventListener('mouseenter', () => this.stop());
        this.root.addEventListener('mouseleave', () => this.start());
        this.start();
    }

    show(nextIndex) {
        this.slides[this.index].classList.remove('is-active');
        this.index = (nextIndex + this.slides.length) % this.slides.length;
        this.slides[this.index].classList.add('is-active');
    }

    start() {
        this.stop();
        this.timer = window.setInterval(() => this.show(this.index + 1), 5500);
    }

    stop() {
        if (this.timer) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
    }
}

/* ===================== Envie Sua Lista Page Controller ===================== */

class EnvieSuaListaController {
    constructor(wrapId = 'envie-form') {
        this.wrap = document.getElementById(wrapId);
        if (!this.wrap) return;

        this.form = this.wrap.querySelector('form');
        this.confirmation = this.wrap.querySelector('.envie-confirmation');
        if (!this.form || !this.confirmation) return;
        this.origem = this.form.querySelector('input[name="origem"]');
        this.openers = Array.from(document.querySelectorAll('button[data-origem][aria-controls="' + wrapId + '"]'));
        this.smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this._applyArrivalOrigem();
        this.openers.forEach(button => button.addEventListener('click', () => this.open(button)));
        this.form.addEventListener('submit', event => this._submit(event));
    }

    // A /tecnico page links here with ?origem=FER-WEB-TEC-<SLUG> (CAM-FER-001
    // §5). That code then replaces the card codes in the WhatsApp prefills
    // and in the form. Without it, or with anything else, the page keeps its
    // own codes (FER-WEB-WA, FER-WEB-FILE, FER-WEB-FORM).
    _applyArrivalOrigem() {
        let code;
        try {
            code = new URLSearchParams(window.location.search).get('origem');
        } catch (error) {
            return;
        }
        if (!code || code.length > 48 || !/^FER-WEB-TEC-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code)) return;

        document.querySelectorAll('a[data-origem][href^="https://wa.me/"]').forEach(link => {
            const href = link.getAttribute('href');
            const own = 'Ref.%3A%20' + link.dataset.origem;
            if (!href.endsWith(own)) return;
            link.setAttribute('href', href.slice(0, -own.length) + 'Ref.%3A%20' + code);
            link.dataset.origem = code;
        });
        this.openers.forEach(button => { button.dataset.origem = code; });
        if (this.origem) this.origem.value = code;
    }

    // "Escrever lista" opens the form; the hidden origem field records the
    // button that opened it. Files go through WhatsApp (card 2) since v1.1.
    open(button) {
        this.openers.forEach(other => {
            const pressed = other === button;
            other.setAttribute('aria-expanded', String(pressed));
            const card = other.closest('.envie-card');
            if (card) card.classList.toggle('is-pressed', pressed);
        });
        this.wrap.hidden = false;
        const behavior = this.smooth ? 'smooth' : 'auto';

        if (!this.form) {
            // Already sent: the confirmation stands where the form was.
            this.confirmation.scrollIntoView({ behavior, block: 'center' });
            return;
        }
        this.origem.value = button.dataset.origem;
        this.wrap.scrollIntoView({ behavior, block: 'start' });
    }

    async _submit(event) {
        event.preventDefault();
        if (!this.form.checkValidity()) {
            this.form.reportValidity();
            return;
        }
        const button = this.form.querySelector('button[type="submit"]');
        button.disabled = true;
        try {
            const response = await fetch(this.form.action, {
                method: 'POST',
                body: new FormData(this.form),
                headers: { Accept: 'application/json' },
            });
            if (!response.ok) throw new Error('Formspree answered ' + response.status);
            this._confirm();
        } catch (error) {
            // Never claim a list arrived when it did not: hand the same form to
            // Formspree as a normal post, so its own page reports the result.
            button.disabled = false;
            HTMLFormElement.prototype.submit.call(this.form);
        }
    }

    // Artboard 06: the confirmation replaces the form in the same place.
    _confirm() {
        this.form.remove();
        this.form = null;
        this.confirmation.hidden = false;
        const status = this.confirmation.querySelector('[role="status"]');
        status.textContent = status.dataset.message;
        // The focused submit button left with the form; keep keyboard and
        // screen-reader users at the answer instead of the top of the page.
        this.confirmation.focus({ preventScroll: true });
        this.confirmation.scrollIntoView({ behavior: this.smooth ? 'smooth' : 'auto', block: 'center' });
    }
}

/* ===================== Tecnico Decoder Controller ===================== */

// Decodificador de descrições: a lookup box over the code list. The list
// is plain HTML and readable without this script; the box only appears
// when the script runs.
class TecnicoDecoderController {
    constructor() {
        this.root = document.querySelector('[data-decoder]');
        this.box = document.querySelector('[data-decoder-search]');
        if (!this.root || !this.box) return;

        this.input = this.box.querySelector('input');
        this.status = this.box.querySelector('[role="status"]');
        this.empty = this.root.querySelector('[data-decoder-empty]');
        this.toc = document.querySelector('.tec-toc');
        this.groups = Array.from(this.root.querySelectorAll('.tec-group'));
        this.rows = Array.from(this.root.querySelectorAll('.tec-code')).map(row => ({
            row,
            code: TecnicoDecoderController.fold(row.querySelector('dt').textContent),
            text: TecnicoDecoderController.fold(row.textContent + ' ' + (row.dataset.terms || '')),
        }));

        this.box.hidden = false;
        this.input.addEventListener('input', () => this.filter());
    }

    // Case- and accent-insensitive, and blind to spaces, so "nbr 7008"
    // finds NBR7008 and "decapado" finds DEC.
    static fold(value) {
        return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '');
    }

    filter() {
        const query = TecnicoDecoderController.fold(this.input.value);
        // A short query that is a code matches codes only ("NO" is also
        // inside "normal"); longer words ("chapa", "tira") search everything.
        const byCode = query.length <= 2 && this.rows.some(({ code }) => code === query);
        // A typed measure ("1,25") also finds the thickness row; a bare
        // number ("7008", "36") searches the text like any other query.
        const isMeasure = /^\d+[,.]\d+$/.test(query);
        let shown = 0;
        this.rows.forEach(({ row, code, text }) => {
            const match = !query
                || (isMeasure && 'number' in row.dataset)
                || (byCode ? code.includes(query) : text.includes(query));
            row.hidden = !match;
            if (match) shown += 1;
        });
        this.groups.forEach(group => {
            group.hidden = !group.querySelector('.tec-code:not([hidden])');
        });
        if (this.toc) this.toc.hidden = Boolean(query);
        this.empty.hidden = shown > 0;
        this.status.textContent = query
            ? (shown === 1 ? '1 código encontrado.' : shown + ' códigos encontrados.')
            : '';
    }
}

/* ===================== Tecnico Peso Controller ===================== */

// Calculadora de peso teórico: the form over scripts/tecnicoPeso.js (loaded
// before this file as window.TecnicoPeso). The formulas on the page are
// plain HTML and readable without this script; the form only appears when
// the script runs. Results are computed on "Calcular" and then follow
// every edit of the measures; changing the shape starts over, so the new
// shape's empty fields are not flagged before the user types.
class TecnicoPesoController {
    constructor(calc) {
        this.calc = calc;
        this.form = document.querySelector('[data-peso-form]');
        if (!this.calc || !this.form) return;

        this.tiraChoice = this.form.querySelector('[data-peso-tira]');
        this.fields = new Map(Array.from(this.form.querySelectorAll('.tec-field')).map(field => [
            field.dataset.field,
            { field, input: field.querySelector('input'), error: field.querySelector('.tec-field__error') },
        ]));
        this.result = this.form.querySelector('[data-peso-result]');
        this.value = this.form.querySelector('[data-peso-value]');
        this.measures = this.form.querySelector('[data-peso-measures]');
        this.status = this.form.querySelector('[data-peso-status]');
        this.live = false;

        this.form.hidden = false;
        this._applyShape();
        this.form.addEventListener('change', event => {
            if (event.target.type === 'radio') {
                this._applyShape();
                this._reset();
            }
        });
        this.form.addEventListener('input', event => {
            if (this.live && event.target.type !== 'radio') this._update(false);
        });
        this.form.addEventListener('submit', event => {
            event.preventDefault();
            this.live = true;
            this._update(true);
        });
    }

    // "chapa", "bobina", "tira-comprimento" or "tira-rolo"
    _shape() {
        const forma = this.form.querySelector('input[name="forma"]:checked').value;
        if (forma !== 'tira') return forma;
        return 'tira-' + this.form.querySelector('input[name="tira"]:checked').value;
    }

    // Show only the fields the shape needs; values typed in shared fields
    // (largura) are kept when the shape changes.
    _applyShape() {
        const shape = this._shape();
        this.tiraChoice.hidden = !shape.startsWith('tira');
        const needed = this.calc.SHAPES[shape].fields;
        this.fields.forEach(({ field, input }, key) => {
            field.hidden = !needed.includes(key);
            if (field.hidden) this._setError(key, '');
            input.disabled = field.hidden;
        });
    }

    // Back to the state before the first "Calcular": no result, no errors.
    _reset() {
        this.live = false;
        this.result.hidden = true;
        this.status.textContent = '';
        this.fields.forEach((_, key) => this._setError(key, ''));
    }

    // Empty the live region first, so the same message twice is announced
    // twice.
    _announce(message) {
        this.status.textContent = '';
        window.requestAnimationFrame(() => { this.status.textContent = message; });
    }

    _setError(key, message) {
        const { input, error } = this.fields.get(key);
        error.textContent = message;
        if (message) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
    }

    _update(fromSubmit) {
        const shape = this._shape();
        const needed = this.calc.SHAPES[shape].fields;
        const raw = {};
        needed.forEach(key => { raw[key] = this.fields.get(key).input.value; });
        const outcome = this.calc.calculate(shape, raw);

        needed.forEach(key => this._setError(key, outcome.ok ? '' : (outcome.errors[key] || '')));
        if (!outcome.ok) {
            this.result.hidden = true;
            if (fromSubmit) {
                const first = needed.find(key => outcome.errors[key]);
                this.fields.get(first).input.focus();
                this._announce('Confira as medidas destacadas.');
            } else {
                this.status.textContent = '';
            }
            return;
        }

        const weight = this.calc.formatKg(outcome.kg);
        const measures = this._describe(shape, outcome.values);
        this.value.textContent = weight;
        this.measures.textContent = measures;
        this.result.hidden = false;
        // Announce on "Calcular" only; edits update the visible result
        // quietly and leave no stale announcement behind.
        if (fromSubmit) this._announce('Peso teórico: ' + weight + '. ' + measures + '.');
        else this.status.textContent = '';
    }

    // The measures as they were read, so "1.250" typed as a thickness is
    // visible as 1.250 mm rather than silently used.
    _describe(shape, v) {
        const m = (mm, min) => this.calc.formatMeasure(mm, min);
        if (shape === 'bobina' || shape === 'tira-rolo') {
            const name = shape === 'bobina' ? 'Bobina' : 'Rolo de tira';
            return name + ': Øi ' + m(v.diametroInterno) + ' mm, Øe ' + m(v.diametroExterno)
                + ' mm, largura ' + m(v.largura) + ' mm';
        }
        const name = shape === 'chapa' ? 'Chapa' : 'Tira';
        return name + ' ' + m(v.espessura, 2) + ' × ' + m(v.largura) + ' × ' + m(v.comprimento)
            + ' mm (espessura × largura × comprimento)';
    }
}

/* ===================== Local Dev Auto Refresh ===================== */

class DevAutoRefreshController {
    constructor() {
        const host = window.location.hostname;
        if (!['127.0.0.1', 'localhost'].includes(host)) return;

        this.fingerprints = new Map();
        this.paths = [
            window.location.pathname || '/index.html',
            '/translations/strings.js',
            '/styles/pages/main.css',
            '/styles/base/reset.css',
            '/styles/base/variables.css',
            '/styles/base/typography.css',
            '/styles/utils/layout.css',
            '/styles/components/buttons.css',
            '/styles/components/card.css',
            '/styles/components/navbar.css',
            '/styles/components/hero.css',
            '/styles/components/footer.css',
            '/styles/components/sections.css',
            '/styles/components/stats-bar.css',
            '/styles/components/how-it-works.css',
            '/styles/components/whatsapp.css',
            '/styles/components/lang-switcher.css',
            '/styles/responsive/breakpoints.css',
            '/styles/utils/animation.css',
            '/scripts/siteController.js',
        ];
        this._prime();
    }

    async _fingerprint(path) {
        const response = await fetch(`${path}?dev-check=${Date.now()}`, {
            method: 'HEAD',
            cache: 'no-store',
        });
        return [
            response.headers.get('last-modified') || '',
            response.headers.get('content-length') || '',
        ].join('|');
    }

    async _prime() {
        try {
            await Promise.all(this.paths.map(async path => {
                this.fingerprints.set(path, await this._fingerprint(path));
            }));
            window.setInterval(() => this._check(), 1200);
        } catch (error) {
            window.setTimeout(() => this._prime(), 2000);
        }
    }

    async _check() {
        try {
            for (const path of this.paths) {
                const next = await this._fingerprint(path);
                if (this.fingerprints.get(path) && this.fingerprints.get(path) !== next) {
                    window.location.reload();
                    return;
                }
                this.fingerprints.set(path, next);
            }
        } catch (error) {
            // Local development convenience only; ignore transient server restarts.
        }
    }
}

/* ===================== Initialization ===================== */

document.addEventListener('DOMContentLoaded', () => {
    new NavbarController();
    new MobileMenuController();
    new SmoothScrollController();
    new AnimationController([
        '.stat-item',
        '.hiw-step',
        '.product-card',
        '.value-card',
        '.differential-item',
    ]);

    // Language switcher — requires FERMAC_TRANSLATIONS from strings.js
    if (typeof FERMAC_TRANSLATIONS !== 'undefined') {
        new LanguageSwitcherController(FERMAC_TRANSLATIONS);
    }
    new DevAutoRefreshController();

    // Page-specific
    if (document.body.classList.contains('home-page')) {
        new HomePageController();
        new ProductCarouselController();
    }
    if (document.body.classList.contains('envie-page')) {
        new EnvieSuaListaController();
    }
    if (document.body.classList.contains('tecnico-decoder-page')) {
        new TecnicoDecoderController();
    }
    if (document.body.classList.contains('tecnico-peso-page')) {
        new TecnicoPesoController(window.TecnicoPeso);
    }
});
