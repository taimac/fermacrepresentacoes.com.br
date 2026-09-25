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

    _setActiveLink() {
        const current = window.location.pathname.split('/').pop() || 'index.html';
        this.navbar.querySelectorAll('.nav-links a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes(current)) {
                link.classList.add('active');
            }
        });
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
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        this.origem = this.form.querySelector('input[name="origem"]');
        this.fileInput = this.form.querySelector('input[type="file"]');
        this.fileText = this.form.querySelector('.envie-drop__text');
        this.fileTextDefault = this.fileText ? this.fileText.textContent : '';
        this.confirmation = this.wrap.querySelector('.envie-confirmation');
        this.openers = Array.from(document.querySelectorAll('button[data-origem][aria-controls="' + wrapId + '"]'));
        this.smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.openers.forEach(button => button.addEventListener('click', () => this.open(button)));
        if (this.fileInput) {
            this.fileInput.addEventListener('change', () => this._showFileName());
        }
        this.form.addEventListener('submit', event => this._submit(event));
    }

    // "Enviar arquivo" and "Escrever lista" open the same form; the hidden
    // origem field records which one did.
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
        if (button.dataset.origem === 'FER-WEB-FILE' && this.fileInput) {
            this.fileInput.focus({ preventScroll: true });
            this.fileInput.closest('.envie-drop').scrollIntoView({ behavior, block: 'center' });
        } else {
            this.wrap.scrollIntoView({ behavior, block: 'start' });
        }
    }

    _showFileName() {
        if (!this.fileText) return;
        const file = this.fileInput.files && this.fileInput.files[0];
        this.fileText.textContent = file ? file.name : this.fileTextDefault;
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
        this.confirmation.scrollIntoView({ behavior: this.smooth ? 'smooth' : 'auto', block: 'center' });
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
});
