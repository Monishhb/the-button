# The Button

A tiny, offline-first website dedicated to pressing one button.

**Press. See. Repeat.**

## Run locally

No build step or dependency installation is required. Serve this directory with any static web server, for example:

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

Opening `index.html` directly also works, including the button, customization, themes, and settings. A local server is useful for testing browser storage and deployment behavior.

## Deploy

The project is plain static HTML, CSS, and JavaScript. It can be deployed to GitHub Pages, Vercel, Netlify, or any static host by publishing the project directory.

## What's inside (V2)

- Glassmorphism UI system (header, bottom nav, panels) over a physical, tactile button
- Customization: color, label, size, border radius, depth, plus button presets (Classic, Arcade, Emergency, Bubble, Minimal, Neon)
- Press effects: none, ripple, glow, particles, shockwave
- Statistics: total, today, session, best streak, fastest 10 presses (localStorage)
- Achievements with unlock toasts (localStorage)
- Modes: Classic, Rapid, Zen, Chaos
- Backgrounds: solid, gradient, glow, aurora, minimal
- Sound profiles via Web Audio: mechanical, soft, arcade, click, muted
- Keyboard: Space/Enter press the button (desktop shows a subtle hint)
- Themes: system / light / dark
- Reduced-motion support and iOS safe-area handling

## Shareable configurations

Button color, label, size, radius, and depth are encoded in the URL query string (for example `?color=cyan&label=YOH&depth=8`) and update live while customizing. Use **Copy link** in the Customize panel to copy the current configuration — opening that URL applies it. Named colors (`cyan`, `red`, ...) and 6-digit hex values are supported. Legacy hash links (`#c=7C3AED&t=PUSH`) still work. This is entirely client-side; nothing is sent anywhere.

## Files

- `index.html` contains the semantic page and panel markup.
- `style.css` contains the glass design system, responsive layout, themes, backgrounds, and tactile button styling.
- `script.js` contains input handling, persistence, statistics, achievements, modes, sound, and accessibility behavior.
