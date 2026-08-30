# PRD — The Button
**Version:** 1.0  
**Author:** Moni  
**Status:** Ready for Implementation  
**Stack:** HTML · CSS · Vanilla JS (Static Frontend)

---

## 1. Product Overview

**The Button** is a single-interaction website. Users open the page, see one giant physical-looking button, and press it. That's the product.

The entire experience is built around making that one interaction — pressing a button — feel as satisfying and polished as possible. Nothing more. Nothing less.

The product deliberately embraces constraint as its identity. The simplicity is not a limitation; it is the point.

---

## 2. Product Goals

| Goal | Description |
|------|-------------|
| **Primary** | Deliver the most satisfying digital button-pressing experience possible |
| **Secondary** | Give users light personalization to make the button feel like theirs |
| **Tertiary** | Load instantly, work everywhere, require nothing from the user |

### Non-Goals (V1)

The following are explicitly **out of scope** for V1:

- User accounts or authentication
- Backend or server-side logic
- Database (local or remote)
- Social features, feeds, or sharing
- Payments or paywalls
- Push notifications
- Global press counters or leaderboards
- AI-generated responses
- Complex dashboards or analytics
- Chat or messaging

---

## 3. Target Audience

**Primary:** Anyone with a browser. No signup. No setup.

**Personas:**
- A person who finds a link and just wants to press something satisfying
- A developer who appreciates the craft in a minimalist build
- A designer who appreciates tactile UI done right
- Someone sharing it for the first time as a "just press this" moment

**Zero learning curve** is a hard requirement. The user should understand the entire product within 1 second of opening it.

---

## 4. Core User Experience

> "I see a big button. I press it. It feels real. I press it again."

The website opens to a full-screen layout with a single, massive, physically-raised button dead center. There is a press counter below it. There is a thin, unobtrusive toolbar with theme and settings access. Nothing competes with the button.

The button must:
- Immediately communicate "press me" without any text instruction
- Feel physically satisfying on press and release
- Work identically on mobile and desktop
- Load in under 1 second on a standard connection

---

## 5. Feature Requirements

### 5.1 Giant Button

**Idle State**
- Physically raised appearance via CSS box-shadow and perspective
- Clear depth/3D effect indicating a pressable surface
- Centered both horizontally and vertically on screen
- Visually dominant — button should occupy 35–55% of the viewport on desktop, 50–70% on mobile
- Subtle `scale(1.02)` hover effect on desktop (desktop only, no hover effect on touch)
- Default label: **PRESS ME**
- Default color: user-selectable, default to a confident red (`#E53935`) or deep blue

**Press State (mousedown / touchstart / keydown Enter or Space)**
- Button moves downward by `depth` value (default: 6px)
- Box-shadow reduces proportionally to simulate pressing into a surface
- Top highlight shadow becomes slightly muted
- No visible input delay — animation must start within one frame of input
- Transition easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` or similar fast-in ease

**Release State (mouseup / touchend / keyup)**
- Button returns to original position
- Subtle spring/bounce using `cubic-bezier(0.34, 1.56, 0.64, 1)` (slight overshoot acceptable)
- Release animation duration: 200–300ms
- Counter increments here (on release, not press)

**Acceptance Criteria:**
- [ ] Button appears 3D/raised in idle state
- [ ] Button visually depresses on press input
- [ ] Button returns with satisfying spring animation on release
- [ ] Interaction works with mouse, touch, keyboard (Enter and Space)
- [ ] No noticeable lag on modern mobile devices
- [ ] Button does not scroll the page on mobile when pressed

---

### 5.2 Press Counter

Located directly below (or above) the button. Format:

```
1,284
PRESSES
```

**Behavior:**
- Counter increments once per completed press (on release, not hold)
- Holds correctly during rapid clicking — each release = +1
- Long-press counts as 1 press per release
- Keyboard Space/Enter: counts once per keyup (prevent repeat via `event.repeat` check)
- Touch: counts once per `touchend`
- Persists across page reloads via `localStorage`
- Formatted with locale number formatting (commas: `1,284` not `1284`)
- If `localStorage` is unavailable: counter still works for the session, resets on reload (fail silently)

**Acceptance Criteria:**
- [ ] Counter increments on every completed press
- [ ] No double-counting on rapid input
- [ ] Counter value survives page reload
- [ ] Number formatted with commas
- [ ] Counter is readable in both light and dark themes

---

### 5.3 Button Customization Panel

Accessible via a settings icon. Opens as a slide-in panel or bottom sheet on mobile.

#### Color
- Native color picker (`<input type="color">`)
- 6 preset swatches: Red, Blue, Purple, Green, Orange, Black
- "Reset to Default" option

#### Label Text
- Text input, max 20 characters
- Placeholder: `PRESS ME`
- Updates button label in real time
- Empty input falls back to default label

#### Size
- Slider: min 150px, max 400px (controls button diameter/width)
- Real-time preview as slider moves

#### Border Radius
- Slider: 0px (square) → 50% (pill)
- 4 preset stops: Square | Rounded | Very Rounded | Pill

#### Depth
- Slider: 2px → 16px
- Controls shadow depth and press travel distance
- Does not allow values that break the 3D illusion

**Acceptance Criteria:**
- [ ] All customization values persist via localStorage
- [ ] Changes reflect on the button in real time
- [ ] Reset restores all defaults
- [ ] Panel is accessible via keyboard
- [ ] Panel is scrollable on small screens

---

### 5.4 Theme System

**Modes:** Light | Dark | System (default)

**Light Theme:**
- Background: `#F7F7F5`
- Surface: `#FFFFFF`
- Text primary: `#111111`
- Text secondary: `#666666`
- UI accents: `#DDDDDD`

**Dark Theme:**
- Background: `#111111`
- Surface: `#1C1C1C`
- Text primary: `#F0F0F0`
- Text secondary: `#888888`
- UI accents: `#333333`

**Behavior:**
- System: reads `prefers-color-scheme`, updates automatically if OS changes
- Manual override stores in localStorage
- Theme transition: smooth CSS transition on background-color and color (`200ms ease`)
- Button color remains fully user-controlled regardless of theme
- Button shadow adapts per theme (darker in light mode, subtler in dark mode)

**Acceptance Criteria:**
- [ ] All 3 modes work correctly
- [ ] Smooth visual transition between modes
- [ ] Preference persists across sessions
- [ ] All UI elements meet WCAG AA contrast in both themes
- [ ] Button remains visible and clear in both themes

---

### 5.5 Settings Panel

Minimal panel accessible from the toolbar.

#### Sound
- Toggle: ON / OFF (default: OFF)
- Sound plays only after first user interaction (satisfies autoplay policy)
- If ON: short, subtle mechanical click sound on press (~50–80ms)
- Sound: procedurally generated via Web Audio API (no external audio file required for V1)
- If Web Audio API unsupported: silently disable, hide the toggle

#### Haptic Feedback
- Toggle: ON / OFF (default: ON if supported)
- Uses `navigator.vibrate(10)` on press
- If unsupported: no-op, no visible error

#### Animations
- Toggle: Full | Reduced
- Reduced: removes spring effect, no scaling, purely functional transitions
- Also respects OS-level `prefers-reduced-motion: reduce` regardless of setting

**Acceptance Criteria:**
- [ ] Sound toggle functions correctly
- [ ] Sound only plays post-interaction (never on load)
- [ ] Haptic fires on supported devices on press
- [ ] Animation setting works and persists
- [ ] `prefers-reduced-motion` is respected even if user set "Full"

---

### 5.6 About Panel/Modal

Simple overlay or panel triggered from toolbar.

**Content:**

```
The Button

A website dedicated to pressing one button.

Built by Moni

[GitHub ↗]  ← links to YOUR_GITHUB_URL
```

- Minimal styling, matches site theme
- Closes on click outside, Escape key, or close button
- GitHub link opens in new tab with `rel="noopener noreferrer"`
- No other content

---

## 6. Interaction Specifications

### Button Event Handling

```
Desktop:
  mousedown  → press state
  mouseup    → release state → counter++
  mouseleave (while pressed) → cancel, no count

Touch:
  touchstart → press state
  touchend   → release state → counter++
  touchcancel → cancel, no count

Keyboard:
  keydown (Enter / Space, event.repeat === false) → press state
  keyup (Enter / Space) → release state → counter++
```

### Rapid Click Behavior
Each mousedown/mouseup pair = exactly 1 count. No debounce needed — just count on release.

### Long Press
Counts as 1 on release, regardless of hold duration.

### Multiple Simultaneous Touches
Only the first active touch triggers the press. Additional touches ignored while button is held.

### Keyboard Hold
`event.repeat` flag blocks re-triggering on keydown. Counts once per keyup.

---

## 7. UX/UI Requirements

### Visual Hierarchy
1. Button (dominant)
2. Counter (secondary, small, below button)
3. Toolbar (minimal, top or bottom edge)

### Typography
- Button label: bold, uppercase, letter-spaced, sans-serif (`Inter`, `DM Sans`, or system-ui fallback)
- Counter number: large, tabular numerals, monospace or tabular-variant sans
- Counter label: tiny, uppercase, tracked

### Layout
- Button and counter centered in a flex column
- Toolbar: fixed, bottom of viewport on mobile; top on desktop
- Settings and About panels: slide-in from right on desktop, bottom sheet on mobile

### Motion Design
- Press: 80ms ease-in
- Release: 250ms spring (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
- Panel open: 250ms ease-out slide
- Panel close: 200ms ease-in slide
- Theme switch: 200ms color fade
- All transitions disabled when `prefers-reduced-motion: reduce`

---

## 8. Accessibility Requirements

- Semantic `<button>` element for the giant button
- `aria-label="Press the button"` or descriptive label
- `aria-pressed` state for screen readers
- Visible focus ring on the button and all interactive elements
- Focus ring: 2px solid, offset 3px, high-contrast color per theme
- All panels trap focus while open (focus loop)
- Escape key closes any open panel
- All controls reachable via Tab key
- Color contrast ≥ 4.5:1 for text elements
- Button color contrast: user-controlled but default choices are WCAG AA
- `prefers-reduced-motion` respected globally

**Acceptance Criteria:**
- [ ] Site is fully navigable via keyboard only
- [ ] Screen reader announces button label and state
- [ ] Focus is visible at all times
- [ ] No animations run when reduced motion is set
- [ ] Panels close on Escape

---

## 9. Responsive Design Requirements

### Mobile (< 640px)
- Button: 220–280px diameter/width, centered
- Counter: directly below button, 16px gap
- Toolbar: fixed bottom bar, 48px height, well-separated touch targets
- Customization: bottom sheet (slides up from bottom)
- No accidental scroll triggered by button press (`touch-action: none` on button)
- Safe area insets respected (`env(safe-area-inset-*)`)

### Tablet (640–1024px)
- Button: 280–340px
- Toolbar: top bar
- Panels: side panel

### Desktop (> 1024px)
- Button: 320–400px (or user-set size)
- Max button width: 400px (enforced)
- Centered on all screen widths
- Large-screen background: same background color, no filler content

---

## 10. Technical Requirements

### Stack
- **HTML5** — single `index.html`
- **CSS3** — single `style.css`, CSS custom properties for theming
- **Vanilla JavaScript** — single `script.js`, no frameworks

### No External Dependencies
- No jQuery, no React, no build tools
- Fonts: load from Google Fonts (`Inter`) or use `system-ui` fallback
- If Google Fonts used: load async, do not block render

### localStorage Schema

```js
{
  "pressCount": 0,
  "theme": "system",          // "light" | "dark" | "system"
  "buttonColor": "#E53935",
  "buttonText": "PRESS ME",
  "buttonSize": 280,          // px
  "borderRadius": 16,         // px
  "depth": 6,                 // px
  "soundEnabled": false,
  "hapticsEnabled": true,
  "animationsReduced": false
}
```

### Reset Everything
- Clears all localStorage keys
- Restores all defaults
- Does not reload the page
- Available from Settings panel

### Sound Generation (Web Audio API)
```
AudioContext → OscillatorNode (sine, 220Hz → 110Hz)
Duration: 60ms
Gain: 0.15 (quiet)
Only created after first user gesture
```

---

## 11. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Rapid clicking | Each click = 1 count, no debounce issues |
| Double-click | Two counts (correct — two interactions) |
| Long press | 1 count on release |
| Touch and hold | 1 count on release |
| Multiple fingers | First touch only; additional ignored |
| Space key held | 1 count per keyup (repeat blocked) |
| Browser refresh | Counter persists via localStorage |
| localStorage unavailable | Counter works in session, resets on reload; no crash |
| Very small screen (<320px) | Button scales down, min 150px; toolbar remains usable |
| Very large screen (4K) | Button capped at max size; centered; no layout breaks |
| `prefers-reduced-motion` | All transitions instant/functional; no spring effects |
| Audio unsupported | Sound toggle hidden or disabled; no error thrown |
| Vibration unsupported | `navigator.vibrate` no-ops; no error thrown |
| JavaScript disabled | Static page visible but non-functional; button present but inert |
| Offline | Full functionality (no network required) |

---

## 12. Performance Requirements

- **Time to Interactive:** < 1s on 4G
- **First Contentful Paint:** < 500ms
- No render-blocking resources (fonts loaded async)
- Total JS: target < 10KB minified
- Total CSS: target < 5KB minified
- No images required (button is pure CSS)
- No external API calls
- No third-party scripts

---

## 13. Security / Privacy

- No personal data collected
- No analytics, no tracking pixels, no cookies
- All state is local to the user's browser (`localStorage`)
- No server ever receives any data
- GitHub link uses `rel="noopener noreferrer"`
- Content Security Policy header recommended if deployed via Vercel/Netlify:
  ```
  Content-Security-Policy: default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com
  ```

---

## 14. Browser Compatibility

**Supported:** Chrome 90+, Firefox 90+, Safari 14+, Edge 90+

### Known Concerns

| Browser | Concern | Mitigation |
|---------|---------|------------|
| Mobile Safari | `100vh` includes browser chrome | Use `dvh` unit with `vh` fallback |
| Mobile Safari | Touch events need `touch-action: none` | Set on button element |
| All Mobile | Audio needs user gesture first | AudioContext only created after first interaction |
| Firefox | `navigator.vibrate` unsupported | Feature-detect, no-op gracefully |
| Safari | `prefers-color-scheme` via `matchMedia` | Standard API, fully supported |
| All | localStorage may be blocked in private mode | Try/catch around all localStorage access |

---

## 15. Data Persistence

All persistence via `localStorage`. Wrap every access in try/catch.

**Defaults:**

| Key | Default | Notes |
|-----|---------|-------|
| `pressCount` | `0` | Integer |
| `theme` | `"system"` | `"light"` / `"dark"` / `"system"` |
| `buttonColor` | `"#E53935"` | Hex color string |
| `buttonText` | `"PRESS ME"` | String, max 20 chars |
| `buttonSize` | `280` | Integer px, range 150–400 |
| `borderRadius` | `16` | Integer px, range 0–140 |
| `depth` | `6` | Integer px, range 2–16 |
| `soundEnabled` | `false` | Boolean |
| `hapticsEnabled` | `true` | Boolean |
| `animationsReduced` | `false` | Boolean |

**Reset Everything:** Removes all keys above, re-applies defaults, updates UI.

---

## 16. MVP Scope (V1)

The following are **required** for launch:

1. ✅ Giant centered button with physical press animation
2. ✅ Press counter with localStorage persistence
3. ✅ Button customization (color, text, size, radius, depth)
4. ✅ Light / Dark / System theme
5. ✅ Settings panel (sound, haptics, animations)
6. ✅ About panel with GitHub placeholder link
7. ✅ localStorage persistence for all preferences
8. ✅ Mobile-first responsive design
9. ✅ Keyboard accessibility (Enter, Space, Tab, Escape)
10. ✅ `prefers-reduced-motion` support
11. ✅ Reset Everything functionality
12. ✅ Works offline, no backend required

**Not required for V1:** Global counter, Easter eggs, custom sounds, shareable configs, advanced button shapes.

---

## 17. Future Roadmap (Post-V1, Optional)

- **Shareable configs:** URL params encode button color/text/size for sharing
- **Global counter:** opt-in, anonymous, server-side total press count
- **Easter eggs:** hidden interactions (10,000 press milestone animation, Konami code, etc.)
- **More button styles:** toggle, rocker, arcade, retro
- **Custom sound packs:** mechanical keyboard, bubble wrap, typewriter
- **Button themes:** Neon, Minimal, Industrial, Glossy
- **Confetti/particle effects:** on milestone presses (opt-in)

---

## 18. User Flow

```
Open website
      ↓
See giant button immediately (< 1 second)
      ↓
No instruction needed — press the button
      ↓
Button physically depresses
      ↓
Counter increments on release
      ↓
Button springs back with satisfying animation
      ↓
User presses again (and again)
      ↓
User notices theme icon → switches to dark mode
      ↓
User opens customization → changes color to purple
      ↓
User changes label to "PUSH"
      ↓
User returns to pressing the now-purple button
      ↓
User opens About → sees "Built by Moni" → clicks GitHub
      ↓
User closes About → keeps pressing
```

---

## 19. Acceptance Criteria

### Button
- [ ] Button is visible and centered on load (< 1s)
- [ ] Button appears 3D/raised via CSS shadow
- [ ] Press animation starts within one frame of input
- [ ] Counter increments exactly once per completed press
- [ ] Counter persists after reload
- [ ] Keyboard interaction (Enter, Space) works identically to click

### Customization
- [ ] Color picker and presets update button in real time
- [ ] Label update reflects immediately on button
- [ ] Size, radius, and depth sliders update in real time
- [ ] All values saved to localStorage
- [ ] Reset restores all defaults without reloading

### Theme
- [ ] Light, dark, and system modes all function correctly
- [ ] Theme persists after reload
- [ ] Theme transitions smoothly (no flash)
- [ ] All UI elements legible in both themes

### Settings
- [ ] Sound toggle works (only plays post-interaction)
- [ ] Haptic fires on supported devices
- [ ] Animations toggle removes spring effect
- [ ] `prefers-reduced-motion` disables all non-essential animation

### Accessibility
- [ ] Entire site navigable by keyboard only
- [ ] Button has accessible label
- [ ] Focus rings visible throughout
- [ ] Panels trap and release focus correctly
- [ ] Escape key closes any open panel

### Performance
- [ ] Page is interactive in < 1s on 4G
- [ ] No console errors on Chrome, Firefox, Safari, Edge
- [ ] No external APIs called
- [ ] Works offline after first load

### Mobile
- [ ] Button does not trigger page scroll
- [ ] Toolbar controls are easily tappable (≥ 44px touch targets)
- [ ] Layout correct in portrait and landscape
- [ ] Works on iOS Safari and Android Chrome

---

## 20. Recommended Project Structure

```
the-button/
│
├── index.html          # Single HTML file: structure, semantic markup, meta tags
├── style.css           # All styles: CSS custom properties, themes, button, layout, panels
├── script.js           # All logic: button interaction, counter, customization, localStorage, sound
│
├── assets/
│   └── icons/          # SVG icons (theme toggle, settings gear, info circle) — inline or referenced
│
└── README.md           # Setup, deploy instructions, customization notes, GitHub Pages guide
```

### File Responsibilities

**`index.html`**
- Document structure and semantic HTML
- `<meta>` tags for viewport, theme-color
- Links to `style.css`, `script.js`
- Button element with proper ARIA attributes
- Panel markup (hidden by default)
- Toolbar markup

**`style.css`**
- CSS custom properties for all theme tokens
- Dark mode via `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)`
- Button 3D styling (box-shadow layers for raised effect)
- Press animation keyframes or transition classes
- Panel slide animations
- Responsive breakpoints
- Reduced motion overrides
- Focus ring styles

**`script.js`**
- localStorage read/write with try/catch
- Button event handlers (mousedown, mouseup, touchstart, touchend, keydown, keyup)
- Counter logic
- Theme management
- Customization panel logic (real-time preview)
- Settings logic (sound via Web Audio API, haptics, animation toggle)
- Panel open/close with focus trap
- About panel
- Reset functionality

**`assets/icons/`**
- `theme.svg` — sun/moon toggle icon
- `settings.svg` — gear/sliders icon
- `info.svg` — info circle icon

**`README.md`**
- Project description
- How to run locally (just open `index.html`)
- How to deploy to GitHub Pages / Vercel
- How to update GitHub link in About section
- License

---

*This PRD is complete and implementation-ready. A developer with intermediate HTML/CSS/JS knowledge should be able to build V1 directly from this document.*
