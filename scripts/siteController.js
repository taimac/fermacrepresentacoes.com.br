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
        this.lang = localStorage.getItem('fermac-lang') || 'pt';
        this._applyLanguage(this.lang);
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

        // Update toggle button label (shows the OTHER language)
        const btn = document.getElementById('langToggle');
        if (btn) {
            btn.textContent = lang === 'pt' ? 'EN' : 'PT';
        }
    }

    _bindToggle() {
        const btn = document.getElementById('langToggle');
        if (!btn) return;
        btn.addEventListener('click', () => {
            this.lang = this.lang === 'pt' ? 'en' : 'pt';
            localStorage.setItem('fermac-lang', this.lang);
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

    // Page-specific
    if (document.body.classList.contains('home-page')) {
        new HomePageController();
        new ProductCarouselController();
    }
});
