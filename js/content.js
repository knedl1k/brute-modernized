(function () {
    const storage = globalThis.browser?.storage || globalThis.chrome?.storage;
    const CACHE_KEY = 'b-theme-cache';
    const PRESET_CACHE_KEY = 'b-preset-cache';

    const PRESETS = {
        default: { label: 'Default', mode: 'both' },
        christmas: { label: 'Christmas', mode: 'both' },
        halloween: { label: 'Halloween', mode: 'both' }
    };

    let currentThemeMode = localStorage.getItem(CACHE_KEY) || 'system';
    let currentPreset = localStorage.getItem(PRESET_CACHE_KEY) || 'default';

    function makeSvg(children) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        for (const [k, v] of Object.entries({
            width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none',
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

    function getEffectiveMode(mode, preset) {
        const presetMode = PRESETS[preset]?.mode;
        return (presetMode === 'dark' || presetMode === 'light') ? presetMode : mode;
    }

    function isDarkActive(mode) {
        return mode === 'dark' || (mode !== 'light' && mediaQuery.matches);
    }

    function updateMetaTags(effectiveDark) {
        if (!document.head) {
            document.addEventListener('DOMContentLoaded', () => {
                updateMetaTags(isDarkActive(getEffectiveMode(currentThemeMode, currentPreset)));
            }, { once: true });
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

    function updateNavbarButton(mode, effectiveDark, preset = currentPreset) {
        const modeLi = document.getElementById('b-theme-toggle-li');
        if (modeLi) {
            const presetMode = PRESETS[preset]?.mode;
            modeLi.style.display = (presetMode && presetMode !== 'both') ? 'none' : '';
        }

        const btn = document.getElementById('b-theme-toggle-btn');
        if (btn) {
            const cfg = THEMES[mode] || THEMES.system;
            btn.querySelector('.b-theme-icon')?.replaceChildren(cfg.icon.cloneNode(true));
            const textEl = btn.querySelector('.b-theme-label');
            if (textEl) textEl.textContent = cfg.label(effectiveDark);
            btn.title = cfg.title;
            btn.setAttribute('aria-label', cfg.title);
        }

        const presetBtn = document.getElementById('b-preset-btn');
        if (presetBtn) {
            const presetLabel = PRESETS[preset]?.label || 'Default';
            const textEl = presetBtn.querySelector('.b-preset-label');
            if (textEl) textEl.textContent = presetLabel;
            presetBtn.title = `Theme: ${presetLabel}`;
        }

        for (const opt of document.querySelectorAll('#b-preset-menu .b-preset-option')) {
            const isActive = opt.dataset.preset === preset;
            opt.classList.toggle('active', isActive);
            opt.setAttribute('aria-checked', String(isActive));
            const check = opt.querySelector('.b-preset-check');
            if (check) check.style.visibility = isActive ? 'visible' : 'hidden';
        }
    }

    function applyTheme(mode, preset = currentPreset) {
        currentThemeMode = THEMES[mode] ? mode : 'system';
        currentPreset = PRESETS[preset] ? preset : 'default';
        localStorage.setItem(CACHE_KEY, currentThemeMode);
        localStorage.setItem(PRESET_CACHE_KEY, currentPreset);

        const effectiveMode = getEffectiveMode(currentThemeMode, currentPreset);
        document.documentElement?.setAttribute('data-preset', currentPreset);
        document.documentElement?.setAttribute('data-theme', effectiveMode);

        const effectiveDark = isDarkActive(effectiveMode);
        updateMetaTags(effectiveDark);
        updateNavbarButton(currentThemeMode, effectiveDark, currentPreset);
    }

    applyTheme(currentThemeMode, currentPreset);

    if (storage?.local) {
        storage.local.get({ theme: currentThemeMode, preset: currentPreset }, (res) => {
            const nextMode = res.theme || currentThemeMode;
            const nextPreset = res.preset || currentPreset;
            if (nextMode !== currentThemeMode || nextPreset !== currentPreset) {
                applyTheme(nextMode, nextPreset);
            }
        });
        storage.onChanged?.addListener((changes, area) => {
            if (area !== 'local') return;
            if (changes.theme || changes.preset) {
                applyTheme(
                    changes.theme ? changes.theme.newValue : currentThemeMode,
                    changes.preset ? changes.preset.newValue : currentPreset
                );
            }
        });
    }

    mediaQuery.addEventListener('change', () => {
        if (getEffectiveMode(currentThemeMode, currentPreset) === 'system') {
            applyTheme(currentThemeMode, currentPreset);
        }
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

        const presetLi = document.createElement('li');
        presetLi.id = 'b-preset-select-li';
        presetLi.className = 'nav-item';

        const presetBtn = document.createElement('button');
        presetBtn.id = 'b-preset-btn';
        presetBtn.type = 'button';
        presetBtn.setAttribute('aria-haspopup', 'true');
        presetBtn.setAttribute('aria-expanded', 'false');

        const presetIcon = document.createElement('span');
        presetIcon.className = 'b-preset-icon';
        presetIcon.appendChild(makeSvg([
            ['circle', { cx: '13.5', cy: '6.5', r: '.5', fill: 'currentColor' }],
            ['circle', { cx: '17.5', cy: '10.5', r: '.5', fill: 'currentColor' }],
            ['circle', { cx: '8.5', cy: '7.5', r: '.5', fill: 'currentColor' }],
            ['circle', { cx: '6.5', cy: '12.5', r: '.5', fill: 'currentColor' }],
            ['path', { d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z' }]
        ]));

        const presetLabel = document.createElement('span');
        presetLabel.className = 'b-preset-label';

        const presetCaret = document.createElement('span');
        presetCaret.className = 'b-preset-caret';
        const caretSvg = makeSvg([['polyline', { points: '6 9 12 15 18 9' }]]);
        caretSvg.setAttribute('width', '12');
        caretSvg.setAttribute('height', '12');
        presetCaret.appendChild(caretSvg);

        presetBtn.append(presetIcon, presetLabel, presetCaret);

        const menu = document.createElement('div');
        menu.id = 'b-preset-menu';
        menu.setAttribute('role', 'menu');

        function setMenuOpen(open) {
            menu.classList.toggle('open', open);
            presetBtn.setAttribute('aria-expanded', String(open));
        }

        for (const [key, cfg] of Object.entries(PRESETS)) {
            const opt = document.createElement('button');
            opt.type = 'button';
            opt.className = 'b-preset-option';
            opt.dataset.preset = key;
            opt.setAttribute('role', 'menuitemradio');

            const nameSpan = document.createElement('span');
            nameSpan.textContent = cfg.label;

            const checkSvg = makeSvg([['polyline', { points: '20 6 9 17 4 12' }]]);
            checkSvg.classList.add('b-preset-check');
            checkSvg.setAttribute('width', '13');
            checkSvg.setAttribute('height', '13');

            opt.append(nameSpan, checkSvg);
            opt.addEventListener('click', () => {
                applyTheme(currentThemeMode, key);
                storage?.local.set({ preset: key });
                setMenuOpen(false);
            });
            menu.appendChild(opt);
        }

        presetBtn.addEventListener('click', () => {
            setMenuOpen(!menu.classList.contains('open'));
        });

        document.addEventListener('click', (e) => {
            if (!presetLi.contains(e.target)) setMenuOpen(false);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') setMenuOpen(false);
        });

        presetLi.append(presetBtn, menu);

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
            applyTheme(nextTheme, currentPreset);
            storage?.local.set({ theme: nextTheme });
        });

        li.appendChild(btn);
        targetNav.prepend(presetLi, li);

        const effectiveMode = getEffectiveMode(currentThemeMode, currentPreset);
        updateNavbarButton(currentThemeMode, isDarkActive(effectiveMode), currentPreset);
        initPriorityNavbar();
    }

    function getNavIconPaths(label) {
        const key = label.trim().toLowerCase();
        if (key === 'index') {
            return [
                ['path', { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }],
                ['polyline', { points: '9 22 9 12 15 12 15 22' }]
            ];
        }
        if (key === 'assignments') {
            return [
                ['path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }],
                ['polyline', { points: '14 2 14 8 20 8' }],
                ['path', { d: 'M9 15l2 2 4-4' }]
            ];
        }
        if (key === 'reservation') {
            return [
                ['rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }],
                ['line', { x1: '16', y1: '2', x2: '16', y2: '6' }],
                ['line', { x1: '8', y1: '2', x2: '8', y2: '6' }],
                ['line', { x1: '3', y1: '10', x2: '21', y2: '10' }]
            ];
        }
        if (key.includes('conference')) {
            return [
                ['polygon', { points: '23 7 16 12 23 17 23 7' }],
                ['rect', { x: '1', y: '5', width: '15', height: '14', rx: '2', ry: '2' }]
            ];
        }
        if (key.includes('wiki')) {
            return [
                ['path', { d: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' }],
                ['path', { d: 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' }]
            ];
        }
        if (key === 'forum') {
            return [
                ['path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' }]
            ];
        }
        if (key === 'contact') {
            return [
                ['path', { d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' }],
                ['polyline', { points: '22 6 12 13 2 6' }]
            ];
        }
        return [
            ['circle', { cx: '12', cy: '12', r: '10' }],
            ['polygon', { points: '16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76' }]
        ];
    }

    function initPriorityNavbar() {
        if (document.getElementById('b-nav-more-li')) return;

        const leftNav = document.querySelector('.navbar .navbar-nav.me-auto, #topmenu .navbar-nav:not(.navbar-right)');
        if (!leftNav) return;

        const navItems = [...leftNav.children].filter((el) => el.tagName === 'LI');
        if (navItems.length === 0) return;

        const moreLi = document.createElement('li');
        moreLi.id = 'b-nav-more-li';
        moreLi.className = 'nav-item b-nav-hidden';

        const moreBtn = document.createElement('button');
        moreBtn.id = 'b-nav-more-btn';
        moreBtn.type = 'button';
        moreBtn.setAttribute('aria-haspopup', 'true');
        moreBtn.setAttribute('aria-expanded', 'false');

        const moreIcon = document.createElement('span');
        moreIcon.className = 'b-more-icon';
        moreIcon.appendChild(makeSvg([
            ['line', { x1: '3', y1: '6', x2: '21', y2: '6' }],
            ['line', { x1: '3', y1: '12', x2: '21', y2: '12' }],
            ['line', { x1: '3', y1: '18', x2: '21', y2: '18' }]
        ]));

        const moreLabel = document.createElement('span');
        moreLabel.className = 'b-more-label';
        moreLabel.textContent = 'More';

        const moreCount = document.createElement('span');
        moreCount.className = 'b-more-count';
        moreCount.textContent = '0';

        const moreCaret = document.createElement('span');
        moreCaret.className = 'b-more-caret';
        const caretSvg = makeSvg([['polyline', { points: '6 9 12 15 18 9' }]]);
        caretSvg.setAttribute('width', '12');
        caretSvg.setAttribute('height', '12');
        moreCaret.appendChild(caretSvg);

        moreBtn.append(moreIcon, moreLabel, moreCount, moreCaret);

        const moreMenu = document.createElement('div');
        moreMenu.id = 'b-nav-more-menu';
        moreMenu.setAttribute('role', 'menu');

        const overflowLinks = navItems.map((li) => {
            const srcLink = li.querySelector(':scope > a, :scope > .nav-link') || li.querySelector('a');
            const label = srcLink?.textContent?.trim() || li.textContent.trim();
            const isActive = li.classList.contains('active') || Boolean(srcLink?.classList.contains('active'));

            const clone = document.createElement('a');
            clone.className = `b-more-item b-nav-hidden${isActive ? ' active' : ''}`;
            clone.href = srcLink?.getAttribute('href') || '#';
            clone.setAttribute('role', 'menuitem');

            const iconSpan = document.createElement('span');
            iconSpan.className = 'b-more-item-icon';
            iconSpan.appendChild(makeSvg(getNavIconPaths(label)));

            const textSpan = document.createElement('span');
            textSpan.textContent = label;

            clone.append(iconSpan, textSpan);
            moreMenu.appendChild(clone);
            return { el: clone, active: isActive };
        });

        function setMoreOpen(open) {
            if (!open) {
                moreMenu.classList.remove('open');
                moreBtn.setAttribute('aria-expanded', 'false');
                moreMenu.style.left = '';
                return;
            }
            moreMenu.style.left = '0px';
            moreMenu.classList.add('open');
            moreBtn.setAttribute('aria-expanded', 'true');
            const rect = moreMenu.getBoundingClientRect();
            const maxRight = window.innerWidth - 12;
            if (rect.right > maxRight) {
                const shift = Math.min(rect.left - 12, rect.right - maxRight);
                if (shift > 0) moreMenu.style.left = `${-shift}px`;
            }
        }

        moreBtn.addEventListener('click', () => {
            setMoreOpen(!moreMenu.classList.contains('open'));
        });

        document.addEventListener('click', (e) => {
            if (!moreLi.contains(e.target)) setMoreOpen(false);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') setMoreOpen(false);
        });

        moreLi.append(moreBtn, moreMenu);
        leftNav.appendChild(moreLi);

        const itemWidths = navItems.map(() => 0);

        function updatePriorityNav() {
            const container = document.querySelector('.navbar .container-fluid');
            const brandDiv = container?.firstElementChild;
            const rightNav = document.querySelector('.navbar .navbar-nav.navbar-right');

            navItems.forEach((item, i) => {
                if (!item.classList.contains('b-nav-hidden') && item.offsetWidth > 0) {
                    itemWidths[i] = item.offsetWidth;
                }
            });

            if (!container || container.clientWidth === 0) {
                navItems.forEach((item) => item.classList.remove('b-nav-hidden'));
                overflowLinks.forEach((entry) => entry.el.classList.add('b-nav-hidden'));
                moreLi.classList.add('b-nav-hidden');
                return;
            }

            const available = container.clientWidth
                - (brandDiv ? brandDiv.offsetWidth : 0)
                - (rightNav ? rightNav.offsetWidth : 0)
                - 18;

            const totalWidth = itemWidths.reduce((sum, w, idx) => sum + w + (idx > 0 ? 2 : 0), 0);

            if (totalWidth <= available) {
                navItems.forEach((item) => item.classList.remove('b-nav-hidden'));
                overflowLinks.forEach((entry) => entry.el.classList.add('b-nav-hidden'));
                moreLi.classList.add('b-nav-hidden');
                moreBtn.classList.remove('active');
                setMoreOpen(false);
                return;
            }

            const moreReserve = window.innerWidth <= 680 ? 74 : 106;
            const budget = Math.max(0, available - moreReserve);
            let used = 0;
            let visibleCount = 0;

            for (let i = 0; i < navItems.length; i++) {
                const step = itemWidths[i] + (i > 0 ? 2 : 0);
                if (used + step <= budget) {
                    used += step;
                    visibleCount++;
                } else {
                    break;
                }
            }

            let hiddenCount = 0;
            let hasActiveOverflow = false;

            navItems.forEach((item, i) => {
                const hidden = i >= visibleCount;
                item.classList.toggle('b-nav-hidden', hidden);
                overflowLinks[i].el.classList.toggle('b-nav-hidden', !hidden);
                if (hidden) {
                    hiddenCount++;
                    if (overflowLinks[i].active) hasActiveOverflow = true;
                }
            });

            moreCount.textContent = String(hiddenCount);
            moreMenu.classList.toggle('b-more-grid', hiddenCount >= 4);
            moreBtn.classList.toggle('active', hasActiveOverflow);
            moreLi.classList.toggle('b-nav-hidden', hiddenCount === 0);
            if (hiddenCount === 0) setMoreOpen(false);
        }

        updatePriorityNav();

        if (typeof ResizeObserver === 'function') {
            const container = document.querySelector('.navbar .container-fluid');
            const brandDiv = container?.firstElementChild;
            const rightNav = document.querySelector('.navbar .navbar-nav.navbar-right');
            const observer = new ResizeObserver(updatePriorityNav);
            if (container) observer.observe(container);
            if (brandDiv) observer.observe(brandDiv);
            if (rightNav) observer.observe(rightNav);
        }
        window.addEventListener('resize', updatePriorityNav);
    }

    function hasPositiveScore(el) {
        const scoreText = el.querySelector('.badge.label-score')?.textContent || '';
        const match = scoreText.match(/(-?\d+(?:[.,]\d+)?)/);
        return match ? parseFloat(match[1].replace(',', '.')) > 0 : false;
    }

    function scanCompletedFromRoot(root) {
        const map = new Map();

        for (const courseCard of root.querySelectorAll('.col-md-8 .card')) {
            const courseTitle = courseCard.querySelector('.card-header a')?.textContent || '';
            const courseCode = courseTitle.split(' - ')[0]?.trim();

            for (const item of courseCard.querySelectorAll('a.list-group-item[href]')) {
                const href = item.getAttribute('href');
                const done = hasPositiveScore(item);

                if (!map.has(href)) map.set(href, done);
                if (courseCode) {
                    const slug = href.split('/').pop();
                    const altHref = `/brute/student/course/${courseCode}/${slug}`;
                    if (!map.has(altHref)) map.set(altHref, done);
                }
            }
        }

        for (const row of root.querySelectorAll('.tab-content table tr')) {
            const link = row.querySelector('th a[href]');
            if (!link) continue;
            const href = link.getAttribute('href');
            const done = hasPositiveScore(row);

            if (!map.has(href)) map.set(href, done);
            const [courseCode, slug] = link.textContent.split(' - ').map((s) => s.trim());
            if (courseCode && slug) {
                const altHref = `/brute/student/course/${courseCode}/${slug}`;
                if (!map.has(altHref)) map.set(altHref, done);
            }
        }

        return map;
    }

    function injectDeadlineFilter() {
        const card = document.querySelector('.card.card-warning');
        const header = card?.querySelector('.card-header');
        if (!card || !header || document.getElementById('b-hide-completed-btn')) return;

        const DONE_CACHE_KEY = 'b-completed-deadlines-cache';
        const FILTER_KEY = 'b-hide-completed-deadlines';
        let hideCompleted = localStorage.getItem(FILTER_KEY) === 'true';
        let completedCount = 0;

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

        function applyCompletedSet(doneSet) {
            completedCount = 0;
            for (const item of card.querySelectorAll('a.list-group-item[href]')) {
                const isDone = doneSet.has(item.getAttribute('href'));
                item.classList.toggle('b-deadline-completed', isDone);
                if (isDone) completedCount++;
            }
            updateFilterState();
        }

        let doneSet = new Set();
        const cachedRaw = localStorage.getItem(DONE_CACHE_KEY);
        if (cachedRaw) {
            try {
                doneSet = new Set(JSON.parse(cachedRaw));
            } catch (_) {}
        }

        const scanned = scanCompletedFromRoot(document);
        if (scanned.size > 0) {
            doneSet = new Set([...scanned.entries()].filter(([, done]) => done).map(([k]) => k));
            localStorage.setItem(DONE_CACHE_KEY, JSON.stringify([...doneSet]));
        } else {
            const heading = document.querySelector('header h1, header h3')?.textContent || '';
            const courseCode = heading.split(' - ')[0]?.trim();
            const headers = document.querySelectorAll('.card.card-info table thead :is(td, th)');
            const cells = document.querySelectorAll('.card.card-info table tbody tr:first-child :is(td, th)');
            if (courseCode && headers.length > 0 && headers.length === cells.length) {
                headers.forEach((th, i) => {
                    const slug = th.childNodes[0]?.textContent?.trim();
                    if (!slug || slug === 'SUM') return;
                    const score = parseFloat(cells[i].textContent.trim().replace(',', '.'));
                    const key = `/brute/student/course/${courseCode}/${slug}`;
                    if (!Number.isNaN(score) && score > 0) {
                        doneSet.add(key);
                    } else {
                        doneSet.delete(key);
                    }
                });
                localStorage.setItem(DONE_CACHE_KEY, JSON.stringify([...doneSet]));
            }

            if (!cachedRaw) {
                fetch('/brute/student/index.php')
                    .then((r) => r.text())
                    .then((html) => {
                        const doc = new DOMParser().parseFromString(html, 'text/html');
                        const fetched = scanCompletedFromRoot(doc);
                        if (fetched.size > 0) {
                            const freshSet = new Set([...fetched.entries()].filter(([, done]) => done).map(([k]) => k));
                            localStorage.setItem(DONE_CACHE_KEY, JSON.stringify([...freshSet]));
                            applyCompletedSet(freshSet);
                        }
                    })
                    .catch(() => {});
            }
        }

        btn.addEventListener('click', () => {
            hideCompleted = !hideCompleted;
            localStorage.setItem(FILTER_KEY, String(hideCompleted));
            updateFilterState();
        });

        applyCompletedSet(doneSet);
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
