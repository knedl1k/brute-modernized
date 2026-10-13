(function () {
    const storage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage : chrome.storage;
    let currentThemeMode = 'system';

    function makeSvg(children) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '15');
        svg.setAttribute('height', '15');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        for (const [tag, attrs] of children) {
            const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
            for (const [k, v] of Object.entries(attrs)) {
                child.setAttribute(k, v);
            }
            svg.appendChild(child);
        }
        return svg;
    }

    const THEMES = {
        system: {
            getIcon: () => makeSvg([
                ['rect', { x: '2', y: '3', width: '20', height: '14', rx: '2', ry: '2' }],
                ['line', { x1: '8', y1: '21', x2: '16', y2: '21' }],
                ['line', { x1: '12', y1: '17', x2: '12', y2: '21' }]
            ]),
            label: (dark) => `Auto (${dark ? 'Dark' : 'Light'})`,
            title: 'Theme: Auto / System (Click to switch)',
            next: 'dark'
        },
        dark: {
            getIcon: () => makeSvg([
                ['path', { d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' }]
            ]),
            label: () => 'Dark',
            title: 'Theme: Dark (Click to switch)',
            next: 'light'
        },
        light: {
            getIcon: () => makeSvg([
                ['circle', { cx: '12', cy: '12', r: '5' }],
                ['line', { x1: '12', y1: '1', x2: '12', y2: '3' }],
                ['line', { x1: '12', y1: '21', x2: '12', y2: '23' }],
                ['line', { x1: '4.22', y1: '4.22', x2: '5.64', y2: '5.64' }],
                ['line', { x1: '18.36', y1: '18.36', x2: '19.78', y2: '19.78' }],
                ['line', { x1: '1', y1: '12', x2: '3', y2: '12' }],
                ['line', { x1: '21', y1: '12', x2: '23', y2: '12' }],
                ['line', { x1: '4.22', y1: '19.78', x2: '5.64', y2: '18.36' }],
                ['line', { x1: '18.36', y1: '5.64', x2: '19.78', y2: '4.22' }]
            ]),
            label: () => 'Light',
            title: 'Theme: Light (Click to switch)',
            next: 'system'
        }
    };

    function isDarkActive(mode) {
        if (mode === 'dark') return true;
        if (mode === 'light') return false;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function updateMetaTags(effectiveDark) {
        const head = document.head || document.documentElement;
        if (!head) {
            document.addEventListener('DOMContentLoaded', () => updateMetaTags(effectiveDark), { once: true });
            return;
        }

        let csMeta = document.querySelector('meta[name="color-scheme"]');
        if (!csMeta) {
            csMeta = document.createElement('meta');
            csMeta.name = 'color-scheme';
            head.appendChild(csMeta);
        }
        csMeta.content = effectiveDark ? 'dark' : 'light';

        let drLock = document.querySelector('meta[name="darkreader-lock"]');
        if (effectiveDark) {
            if (!drLock) {
                drLock = document.createElement('meta');
                drLock.name = 'darkreader-lock';
                head.appendChild(drLock);
            }
        } else if (drLock) {
            drLock.remove();
        }
    }

    function updateNavbarButton(mode, effectiveDark) {
        const btn = document.getElementById('b-theme-toggle-btn');
        if (!btn) return;

        const cfg = THEMES[mode] || THEMES.system;
        const iconEl = btn.querySelector('.b-theme-icon');
        const textEl = btn.querySelector('.b-theme-label');

        if (iconEl) iconEl.replaceChildren(cfg.getIcon());
        if (textEl) textEl.textContent = cfg.label(effectiveDark);
        btn.title = cfg.title;
        btn.setAttribute('aria-label', cfg.title);
    }

    function applyTheme(mode) {
        currentThemeMode = mode || 'system';
        const root = document.documentElement;
        if (root) {
            root.setAttribute('data-theme', currentThemeMode);
        }

        const effectiveDark = isDarkActive(currentThemeMode);
        updateMetaTags(effectiveDark);
        updateNavbarButton(currentThemeMode, effectiveDark);
    }

    if (storage && storage.local) {
        storage.local.get({ theme: 'system' }, (res) => {
            applyTheme(res.theme || 'system');
        });
    } else {
        applyTheme('system');
    }

    if (storage && storage.onChanged) {
        storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && changes.theme) {
                applyTheme(changes.theme.newValue);
            }
        });
    }

    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (currentThemeMode === 'system') {
                updateMetaTags(e.matches);
                updateNavbarButton('system', e.matches);
            }
        });
    }

    function injectNavbarSwitcher() {
        if (document.getElementById('b-theme-toggle-li')) return;

        const targetNav = document.querySelector('.navbar-nav.navbar-right') ||
                          document.querySelector('.navbar .navbar-nav:last-of-type') ||
                          document.querySelector('#topmenu ul.nav');
        if (!targetNav) return;

        const li = document.createElement('li');
        li.id = 'b-theme-toggle-li';
        li.className = 'nav-item';

        const btn = document.createElement('button');
        btn.id = 'b-theme-toggle-btn';
        btn.type = 'button';

        const iconSpan = document.createElement('span');
        iconSpan.className = 'b-theme-icon';

        const labelSpan = document.createElement('span');
        labelSpan.className = 'b-theme-label';

        btn.append(iconSpan, labelSpan);

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const nextTheme = THEMES[currentThemeMode]?.next || 'dark';
            if (storage && storage.local) {
                storage.local.set({ theme: nextTheme });
            } else {
                applyTheme(nextTheme);
            }
        });

        li.appendChild(btn);
        targetNav.prepend(li);
        updateNavbarButton(currentThemeMode, isDarkActive(currentThemeMode));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectNavbarSwitcher);
    } else {
        injectNavbarSwitcher();
    }
})();
