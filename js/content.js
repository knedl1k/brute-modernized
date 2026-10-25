(function () {
    const storage = globalThis.browser?.storage || globalThis.chrome?.storage;
    const CACHE_KEY = 'b-theme-cache';
    let currentThemeMode = localStorage.getItem(CACHE_KEY) || 'system';

    function makeSvg(children) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        for (const [k, v] of Object.entries({
            width: '15', height: '15', viewBox: '0 0 24 24', fill: 'none',
            stroke: 'currentColor', 'stroke-width': '2',
            'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        })) {
            svg.setAttribute(k, v);
        }
        for (const [tag, attrs] of children) {
            const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
            for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
            svg.appendChild(child);
        }
        return svg;
    }

    const THEMES = {
        system: {
            icon: makeSvg([
                ['rect', { x: '2', y: '3', width: '20', height: '14', rx: '2', ry: '2' }],
                ['line', { x1: '8', y1: '21', x2: '16', y2: '21' }],
                ['line', { x1: '12', y1: '17', x2: '12', y2: '21' }]
            ]),
            label: (dark) => `Auto (${dark ? 'Dark' : 'Light'})`,
            title: 'Theme: Auto / System (Click to switch)',
            next: 'dark'
        },
        dark: {
            icon: makeSvg([
                ['path', { d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' }]
            ]),
            label: () => 'Dark',
            title: 'Theme: Dark (Click to switch)',
            next: 'light'
        },
        light: {
            icon: makeSvg([
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

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function isDarkActive(mode) {
        return mode === 'dark' || (mode !== 'light' && mediaQuery.matches);
    }

    function updateMetaTags(effectiveDark) {
        if (!document.head) {
            document.addEventListener('DOMContentLoaded', () => updateMetaTags(isDarkActive(currentThemeMode)), { once: true });
            return;
        }

        let csMeta = document.querySelector('meta[name="color-scheme"]');
        if (!csMeta) {
            csMeta = document.createElement('meta');
            csMeta.name = 'color-scheme';
            document.head.appendChild(csMeta);
        }
        csMeta.content = effectiveDark ? 'dark' : 'light';

        const drLock = document.querySelector('meta[name="darkreader-lock"]');
        if (effectiveDark && !drLock) {
            const meta = document.createElement('meta');
            meta.name = 'darkreader-lock';
            document.head.appendChild(meta);
        } else if (!effectiveDark && drLock) {
            drLock.remove();
        }
    }

    function updateNavbarButton(mode, effectiveDark) {
        const btn = document.getElementById('b-theme-toggle-btn');
        if (!btn) return;

        const cfg = THEMES[mode] || THEMES.system;
        btn.querySelector('.b-theme-icon')?.replaceChildren(cfg.icon.cloneNode(true));
        const textEl = btn.querySelector('.b-theme-label');
        if (textEl) textEl.textContent = cfg.label(effectiveDark);
        btn.title = cfg.title;
        btn.setAttribute('aria-label', cfg.title);
    }

    function applyTheme(mode) {
        currentThemeMode = THEMES[mode] ? mode : 'system';
        localStorage.setItem(CACHE_KEY, currentThemeMode);
        document.documentElement?.setAttribute('data-theme', currentThemeMode);

        const effectiveDark = isDarkActive(currentThemeMode);
        updateMetaTags(effectiveDark);
        updateNavbarButton(currentThemeMode, effectiveDark);
    }

    applyTheme(currentThemeMode);

    if (storage?.local) {
        storage.local.get({ theme: currentThemeMode }, (res) => {
            if (res.theme && res.theme !== currentThemeMode) applyTheme(res.theme);
        });
        storage.onChanged?.addListener((changes, area) => {
            if (area === 'local' && changes.theme) applyTheme(changes.theme.newValue);
        });
    }

    mediaQuery.addEventListener('change', () => {
        if (currentThemeMode === 'system') applyTheme('system');
    });

    // Prevent SyntaxHighlighter's quick-code feature from replacing code with a raw <textarea> on double-click
    window.addEventListener('dblclick', (e) => {
        const el = e.target instanceof Element ? e.target : e.target?.parentElement;
        if (el?.closest('.syntaxhighlighter')) {
            e.stopPropagation();
        }
    }, true);

    function injectNavbarSwitcher() {
        if (document.getElementById('b-theme-toggle-li')) return;

        const targetNav = document.querySelector('.navbar-nav.navbar-right, .navbar .navbar-nav:last-of-type, #topmenu ul.nav');
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
        btn.addEventListener('click', () => {
            const nextTheme = THEMES[currentThemeMode]?.next || 'dark';
            applyTheme(nextTheme);
            storage?.local.set({ theme: nextTheme });
        });

        li.appendChild(btn);
        targetNav.prepend(li);
        updateNavbarButton(currentThemeMode, isDarkActive(currentThemeMode));
    }

    function injectDeadlineFilter() {
        const card = document.querySelector('.card.card-warning');
        const header = card?.querySelector('.card-header');
        if (!card || !header || document.getElementById('b-hide-completed-btn')) return;

        const completedKeys = new Map();
        for (const courseCard of document.querySelectorAll('.col-md-8 .card')) {
            const courseTitle = courseCard.querySelector('.card-header a')?.textContent || '';
            const courseCode = courseTitle.split(' - ')[0]?.trim();

            for (const item of courseCard.querySelectorAll('a.list-group-item[href]')) {
                const href = item.getAttribute('href');
                const scoreText = item.querySelector('.badge.label-score')?.textContent || '';
                const match = scoreText.match(/(-?\d+(?:[.,]\d+)?)/);
                const done = match ? parseFloat(match[1].replace(',', '.')) > 0 : false;

                if (!completedKeys.has(href)) completedKeys.set(href, done);
                if (courseCode) {
                    const slug = href.split('/').pop();
                    const altHref = `/brute/student/course/${courseCode}/${slug}`;
                    if (!completedKeys.has(altHref)) completedKeys.set(altHref, done);
                }
            }
        }

        let completedCount = 0;
        for (const item of card.querySelectorAll('a.list-group-item[href]')) {
            if (completedKeys.get(item.getAttribute('href'))) {
                item.classList.add('b-deadline-completed');
                completedCount++;
            }
        }

        const FILTER_KEY = 'b-hide-completed-deadlines';
        let hideCompleted = localStorage.getItem(FILTER_KEY) === 'true';

        const btn = document.createElement('button');
        btn.id = 'b-hide-completed-btn';
        btn.type = 'button';

        const checkIcon = makeSvg([['polyline', { points: '20 6 9 17 4 12' }]]);
        checkIcon.setAttribute('width', '13');
        checkIcon.setAttribute('height', '13');
        const labelSpan = document.createElement('span');
        btn.append(checkIcon, labelSpan);

        function updateFilterState() {
            card.classList.toggle('b-hide-completed', hideCompleted);
            btn.classList.toggle('active', hideCompleted);
            labelSpan.textContent = `Hide done (${completedCount})`;
            btn.title = hideCompleted
                ? 'Completed deadlines (Score > 0) are hidden. Click to show all.'
                : 'Hide completed deadlines (Score > 0)';
        }

        btn.addEventListener('click', () => {
            hideCompleted = !hideCompleted;
            localStorage.setItem(FILTER_KEY, String(hideCompleted));
            updateFilterState();
        });

        updateFilterState();
        header.appendChild(btn);
    }

    function initPageEnhancements() {
        injectNavbarSwitcher();
        injectDeadlineFilter();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPageEnhancements, { once: true });
    } else {
        initPageEnhancements();
    }
})();
