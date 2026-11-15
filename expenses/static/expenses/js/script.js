/* ========================================
   SPENDWISE — Core utilities
   Loaded on every page (via base.html defer)
======================================== */

(() => {
    'use strict';

    /* ---------- 1. Current date in topbar ---------- */
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString(undefined, opts);
    }

    /* ---------- 2. Active nav highlight ---------- */
    const path = location.pathname;
    document.querySelectorAll('.nav-link').forEach(a => {
        const href = a.getAttribute('href');
        if (href === '/' && path === '/') {
            a.classList.add('active');
        } else if (href !== '/' && path.startsWith(href)) {
            a.classList.add('active');
        } else {
            a.classList.remove('active');
        }
    });

    /* ---------- 3. Currency formatter (INR default, configurable) ---------- */
    let currencyCode = 'INR';
    let currencySymbol = '₹';
    let currencyLocale = 'en-IN';

    function setCurrency(code) {
        const map = {
            'USD': { symbol: '$', locale: 'en-US' },
            'EUR': { symbol: '€', locale: 'de-DE' },
            'GBP': { symbol: '£', locale: 'en-GB' },
            'INR': { symbol: '₹', locale: 'en-IN' },
            'AUD': { symbol: 'A$', locale: 'en-AU' },
        };
        const c = map[code] || map.INR;
        currencyCode = code;
        currencySymbol = c.symbol;
        currencyLocale = c.locale;
        document.dispatchEvent(new CustomEvent('currency:change', { detail: { code, symbol: currencySymbol } }));
    }

    window.formatCurrency = (val) => {
        const num = typeof val === 'number' ? val : parseFloat(val) || 0;
        return num.toLocaleString(currencyLocale, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    window.formatCurrencyPlain = (val) => {
        const num = typeof val === 'number' ? val : parseFloat(val) || 0;
        return num.toLocaleString(currencyLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    /* Load saved currency from localStorage (Prefs page can call setCurrency) */
    const saved = localStorage.getItem('sw_currency');
    if (saved) setCurrency(saved);

    /* ---------- 4. Toast Manager ---------- */
    let toastContainer = null;

    function ensureContainer() {
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        return toastContainer;
    }

    window.toast = function(message, type = 'info', duration = 4000) {
        const container = ensureContainer();
        const icons = { info: 'ℹ', success: '✓', error: '✕', warning: '⚠' };
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Dismiss">×</button>
        `;
        el.querySelector('.toast-close').onclick = () => removeToast(el);
        container.appendChild(el);
        if (duration > 0) setTimeout(() => removeToast(el), duration);
        return el;
    };

    function removeToast(el) {
        if (!el.classList.contains('removing')) {
            el.classList.add('removing');
            el.addEventListener('animationend', () => el.remove(), { once: true });
        }
    }

    /* Expose toast types */
    window.toast.success = (msg, d) => window.toast(msg, 'success', d);
    window.toast.error = (msg, d) => window.toast(msg, 'error', d);
    window.toast.warning = (msg, d) => window.toast(msg, 'warning', d);

    /* ---------- 5. Small helpers ---------- */
    window.$ = (sel, ctx = document) => ctx.querySelector(sel);
    window.$$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

    window.qs = (form) => new FormData(form);
    window.qsObj = (form) => Object.fromEntries(new FormData(form));

    /* Animate number counting */
    window.animateCount = (el, to, duration = 1000) => {
        const from = parseFloat(el.dataset.count) || 0;
        const start = performance.now();
        function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = window.formatCurrency(from + (to - from) * eased);
            if (p < 1) requestAnimationFrame(tick);
            else el.dataset.count = to;
        }
        requestAnimationFrame(tick);
    };

    /* ---------- 6. Page-loaded signal for page-specific scripts ---------- */
    document.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('js-ready');
    });
})();