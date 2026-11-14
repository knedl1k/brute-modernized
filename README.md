# BRUTE Modernized

After the latest "update" to the BRUTE user interface, I felt compelled to fix it. I couldn't stand that it was so ugly and, overall, worse than the previous version.

Firefox add-ons listing: <https://addons.mozilla.org/en-US/firefox/addon/brute-modernized/>

## Project structure

```text
brute-modernized/
├── manifest.json            # WebExtension Manifest V3 config
├── icons/
├── js/
│   └── content.js           # theme/preset switcher, code viewer & deadline enhancements
└── css/
    ├── variables.css        # color palettes & theme presets
    ├── base.css             # typography, container's size, headings
    ├── navbar.css           
    ├── tabs.css             # semestral tabs
    ├── courses.css          
    ├── badges.css           # status badges
    ├── course-detail.css    
    ├── sidebar.css          # upcoming deadlines
    ├── components.css       
    └── footer.css           
```

## Adding a Custom Theme

1. Define a variable override block in `css/variables.css` matching your preset key:
   - **Light & Dark theme** (`mode: 'both'`): use CSS `light-dark(lightColor, darkColor)` values.
     ```css
     :root[data-preset="my-theme"] {
         --b-bg-page: light-dark(#f8fafc, #0b0f19);
         --b-bg-card: light-dark(#ffffff, #131c2e);
         /* ...override any variables from :root */
     }
     ```
   - **Single-mode theme** (`mode: 'dark'` or `mode: 'light'`): set flat color values once without duplicating them; the mode toggle (`Auto/Dark/Light`) is hidden automatically while the theme is active.
     ```css
     :root[data-preset="my-dark-theme"] {
         --b-bg-page: #120d16;
         --b-bg-card: #1d1524;
         /* ... */
     }
     ```
2. Register the preset in `PRESETS` inside `js/content.js`:
   ```js
   const PRESETS = {
       default: { label: 'Default', mode: 'both' },
       christmas: { label: 'Christmas', mode: 'both' },
       halloween: { label: 'Halloween', mode: 'both' },
       'my-theme': { label: 'My Theme', mode: 'both' } // 'both' | 'dark' | 'light'
   };
   ```

## Credits

- Christmas & Halloween vector illustrations are adapted from [OpenMoji](https://openmoji.org/) v15.0.0, licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
