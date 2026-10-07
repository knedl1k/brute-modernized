# BRUTE Modernized

After the latest "update" to the BRUTE user interface, I felt compelled to fix it. I couldn't stand that it was so ugly and, overall, worse than the previous version.

Firefox add-ons listing: <https://addons.mozilla.org/en-US/firefox/addon/brute-modernized/>

## Project structure

```text
brute-theme-firefox/
├── manifest.json            # WebExtension Manifest V3 config
├── style.css                # main stylesheet
├── icons/
└── css/
    ├── variables.css        # colors, shadows, corners
    ├── base.css             # typography, container's size, headings
    ├── navbar.css           
    ├── tabs.css             # semestral tabs
    ├── courses.css          
    ├── badges.css           # Status badges
    ├── course-detail.css    
    ├── sidebar.css          # upcoming deadlines
    ├── components.css       
    └── footer.css           
```
