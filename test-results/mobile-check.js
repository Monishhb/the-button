const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

const viewports = [
  { name: '390x844', width: 390, height: 844 },
  { name: '393x852', width: 393, height: 852 },
  { name: '402x874', width: 402, height: 874 },
  { name: '430x932', width: 430, height: 932 },
  { name: '375x667', width: 375, height: 667 },
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'landscape', width: 844, height: 390 },
];

(async () => {
  const browser = await chromium.launch();
  const results = [];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: vp.width < 640,
      hasTouch: vp.width < 640,
      colorScheme: 'dark',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // screenshot initial state first (dark reference look)
    await page.screenshot({ path: path.join(OUT, vp.name + '.png'), fullPage: false });

    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const horizontalScroll = doc.scrollWidth > doc.clientWidth + 1;
      const header = document.querySelector('.site-header');
      const nav = document.querySelector('.bottom-nav');
      const button = document.querySelector('.press-button');
      const counter = document.querySelector('.counter');
      const hero = document.querySelector('.hero-title');
      const mode = document.querySelector('.mode-chip');
      const keyHint = document.querySelector('.key-hint');
      const stage = document.querySelector('.stage');

      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return {
          x: Math.round(r.x), y: Math.round(r.y),
          w: Math.round(r.width), h: Math.round(r.height),
          bottom: Math.round(r.bottom), right: Math.round(r.right),
          visible: style.display !== 'none' && style.visibility !== 'hidden' && r.width > 0 && r.height > 0,
        };
      };

      const theme = document.documentElement.dataset.theme;
      const pressCount = document.getElementById('press-count')?.textContent;
      const buttonLabel = document.getElementById('button-label')?.textContent;
      const modeLabel = document.getElementById('mode-chip-label')?.textContent;

      // try press
      return {
        horizontalScroll,
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        theme,
        pressCount,
        buttonLabel,
        modeLabel,
        header: rect(header),
        nav: rect(nav),
        button: rect(button),
        counter: rect(counter),
        hero: rect(hero),
        mode: rect(mode),
        keyHint: rect(keyHint),
        stage: rect(stage),
        navVisible: nav ? getComputedStyle(nav).display !== 'none' : false,
        headerActionsVisible: document.querySelector('.header-actions')
          ? getComputedStyle(document.querySelector('.header-actions')).display !== 'none'
          : false,
        navDesktopVisible: document.querySelector('.nav-desktop')
          ? getComputedStyle(document.querySelector('.nav-desktop')).display !== 'none'
          : false,
        footerVisible: document.querySelector('.site-footer')
          ? getComputedStyle(document.querySelector('.site-footer')).display !== 'none'
          : false,
      };
    });

    // interact: press button
    const before = await page.evaluate(() => document.getElementById('press-count')?.textContent);
    await page.locator('#press-button').click({ force: true });
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => document.getElementById('press-count')?.textContent);

    // open menu on mobile
    let menuOk = null;
    if (vp.width < 640) {
      await page.locator('.js-menu-toggle').click();
      await page.waitForTimeout(150);
      const opened = await page.evaluate(() => {
        const m = document.getElementById('header-menu');
        return m && !m.hidden;
      });
      await page.locator('.header-menu-item[data-panel="modes-panel"]').click();
      await page.waitForTimeout(350);
      const panelOpen = await page.evaluate(() => {
        const p = document.getElementById('modes-panel');
        return p && p.classList.contains('is-open') && !p.hidden;
      });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(350);
      const panelClosed = await page.evaluate(() => {
        const p = document.getElementById('modes-panel');
        return p && p.hidden;
      });
      menuOk = { opened, panelOpen, panelClosed };
    } else {
      await page.locator('.nav-desktop [data-panel="customize-panel"]').click();
      await page.waitForTimeout(350);
      const panelOpen = await page.evaluate(() => {
        const p = document.getElementById('customize-panel');
        return p && p.classList.contains('is-open');
      });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      menuOk = { panelOpen };
    }

    // theme toggle
    const themeBtn = page.locator('[data-theme-toggle]:visible').first();
    if (await themeBtn.count()) {
      await themeBtn.click({ timeout: 5000 });
      await page.waitForTimeout(150);
    }
    const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);

    // overlap checks for mobile portrait
    let overlaps = {};
    if (vp.width < 640 && vp.height > vp.width) {
      overlaps = await page.evaluate(() => {
        const r = (s) => {
          const el = document.querySelector(s);
          if (!el || getComputedStyle(el).display === 'none') return null;
          return el.getBoundingClientRect();
        };
        const header = r('.site-header');
        const hero = r('.hero-title');
        const button = r('.press-button');
        const counter = r('.counter');
        const mode = r('.mode-chip');
        const nav = r('.bottom-nav');
        const key = r('.key-hint');
        const stage = r('.stage');

        const overlap = (a, b) => {
          if (!a || !b) return false;
          return !(a.right <= b.left + 1 || a.left >= b.right - 1 || a.bottom <= b.top + 1 || a.top >= b.bottom - 1);
        };

        const navCoversButton = overlap(nav, button);
        const navCoversCounter = overlap(nav, counter);
        const navCoversMode = overlap(nav, mode);
        const navCoversKey = overlap(key, nav) && key ? !(key.bottom <= nav.top + 1) : false;
        const headerHero = overlap(header, hero);
        const buttonBottom = button ? button.bottom : 0;
        const navTop = nav ? nav.top : Infinity;
        const contentInStage = stage ? (button.bottom <= stage.bottom + 2 && button.top >= stage.top - 2) : true;

        return {
          navCoversButton,
          navCoversCounter,
          navCoversMode,
          keyOverlapsNav: !!(key && nav && key.bottom > nav.top + 1 && key.top < nav.bottom - 1),
          headerHero,
          buttonAboveNav: buttonBottom < navTop,
          contentInStage,
          buttonCenterDelta: button ? Math.round((button.left + button.right) / 2 - window.innerWidth / 2) : null,
        };
      });
    }

    results.push({
      viewport: vp.name,
      errors,
      press: { before, after },
      menuOk,
      themeAfter,
      metrics,
      overlaps,
    });

    await context.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
