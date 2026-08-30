# The Button

A tiny, offline-first website dedicated to pressing one button.

## Run locally

No build step or dependency installation is required. Serve this directory with any static web server, for example:

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

Opening `index.html` directly also works, including the button, customization, themes, and settings. A local server is useful for testing browser storage and deployment behavior.

## Deploy

The project is plain static HTML, CSS, and JavaScript. It can be deployed to GitHub Pages, Vercel, Netlify, or any static host by publishing the project directory.

Update the placeholder URL in `index.html` inside the About panel before deploying:

```html
https://github.com/YOUR_GITHUB_URL
```

## Shareable configurations

Button color, label, size, radius, and depth are encoded in the URL hash (for example `#c=7C3AED&t=PUSH&s=240`) and update live while customizing. Use "Copy share link" in the Customize drawer to copy the current configuration — opening that URL applies it. This is entirely client-side; nothing is sent anywhere.

## Files

- `index.html` contains the semantic page and panel markup.
- `style.css` contains the responsive layout, themes, and tactile button styling.
- `script.js` contains input handling, persistence, customization, settings, and accessibility behavior.
