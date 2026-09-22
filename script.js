(function () {
  "use strict";

  var defaults = {
    pressCount: 0,
    theme: "system",
    buttonColor: "#22D3EE",
    buttonText: "GLOW",
    buttonSize: 320,
    borderRadius: 200,
    depth: 10,
    sound: "muted",
    hapticsEnabled: true,
    animationsReduced: false,
    effect: "ripple",
    background: "gradient",
    preset: "neon",
    mode: "classic"
  };

  var SOUND_OPTIONS = ["mechanical", "soft", "arcade", "click", "muted"];
  var EFFECT_OPTIONS = ["none", "ripple", "glow", "particles", "shockwave"];
  var BACKGROUND_OPTIONS = ["solid", "gradient", "glow", "aurora", "minimal"];
  var MODE_OPTIONS = ["classic", "rapid", "zen", "chaos"];
  var PRESET_OPTIONS = ["classic", "arcade", "emergency", "bubble", "minimal", "neon"];

  var PRESETS = {
    classic: { buttonColor: "#E53935", buttonText: "PRESS ME", buttonSize: 320, borderRadius: 200, depth: 6 },
    arcade: { buttonColor: "#7C3AED", buttonText: "PLAY", buttonSize: 300, borderRadius: 20, depth: 12 },
    emergency: { buttonColor: "#E11D48", buttonText: "EMERGENCY", buttonSize: 340, borderRadius: 14, depth: 12 },
    bubble: { buttonColor: "#EC4899", buttonText: "POP", buttonSize: 300, borderRadius: 200, depth: 6 },
    minimal: { buttonColor: "#111111", buttonText: "OK", buttonSize: 240, borderRadius: 10, depth: 4 },
    neon: { buttonColor: "#22D3EE", buttonText: "GLOW", buttonSize: 320, borderRadius: 200, depth: 10 }
  };

  var NAMED_COLORS = {
    cyan: "#22D3EE",
    red: "#E53935",
    blue: "#2563EB",
    purple: "#7C3AED",
    green: "#16A34A",
    orange: "#F97316",
    black: "#111111",
    white: "#FFFFFF",
    pink: "#EC4899",
    yellow: "#FACC15",
    lime: "#84CC16",
    teal: "#14B8A6",
    violet: "#8B5CF6",
    rose: "#E11D48"
  };

  var ACHIEVEMENTS = [
    { id: "first_press", name: "First Press", desc: "Press the button for the very first time." },
    { id: "presses_100", name: "100 Presses", desc: "Press the button 100 times." },
    { id: "presses_1000", name: "1,000 Presses", desc: "Press the button 1,000 times." },
    { id: "presses_10000", name: "10,000 Presses", desc: "Press the button 10,000 times." },
    { id: "presses_100000", name: "100,000 Presses", desc: "Press the button 100,000 times." },
    { id: "button_addict", name: "Button Addict", desc: "Press 1,000 times in a single day." },
    { id: "rapid_fire", name: "Rapid Fire", desc: "Finish a Rapid challenge under 3 seconds." },
    { id: "night_owl", name: "Night Owl", desc: "Press between midnight and 4 AM." },
    { id: "curious", name: "Curious", desc: "Open every panel." }
  ];

  var PANEL_IDS = ["customize-panel", "stats-panel", "achievements-panel", "modes-panel", "settings-panel", "about-panel"];

  var SECRET_LABELS = {
    YOH: "YOH. YOH. YOH.",
    HELLO: "HELLO, HUMAN.",
    OPEN: "OPEN WHAT?",
    SECRET: "NOTHING TO SEE HERE.",
    PLAY: "GAME ON.",
    "?": "WHY INDEED.",
    "???": "THE BUTTON KNOWS."
  };

  var RANDOM_QUESTIONS = [
    "WHAT WOULD YOU PRESS?",
    "IF A BUTTON FALLS...",
    "DO YOU HEAR IT TOO?",
    "ONE MORE, THEN?",
    "IS IT PRESSING BACK?"
  ];

  var state = loadState();
  var stats = loadStats();
  var achievements = loadAchievements();
  var session = {
    count: 0,
    streak: 0,
    lastPressAt: 0,
    pressTimes: [],
    startedAt: Date.now()
  };
  var rapid = { running: false, startTime: 0, count: 0, timerId: null, resetTimer: null };
  var openedPanels = {};

  var activePress = null;
  var activePanel = null;
  var lastFocusedElement = null;
  var closeTimer = null;
  var releaseTimer = null;
  var shareTimer = null;
  var copyFeedbackTimer = null;
  var statusTimer = null;
  var suppressClickUntil = 0;
  var lastChaosAt = 0;
  var lastOverdriveAt = 0;
  var audioContext = null;
  var AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  var supportsPointerEvents = "PointerEvent" in window;
  var supportsHaptics = typeof navigator.vibrate === "function";
  var reducedMotionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var systemThemeQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  var pressButton = document.getElementById("press-button");
  var buttonHousing = pressButton ? pressButton.closest(".button-housing") : null;
  var fxIn = buttonHousing ? buttonHousing.querySelector(".button-fx-in") : null;
  var fxOut = buttonHousing ? buttonHousing.querySelector(".button-fx-out") : null;
  var buttonLabel = document.getElementById("button-label");
  var pressCount = document.getElementById("press-count");
  var themeToggles = document.querySelectorAll("[data-theme-toggle]");
  var themeColorMeta = document.getElementById("theme-color");
  var panelOverlay = document.getElementById("panel-overlay");
  var panelTriggers = document.querySelectorAll("[data-panel]");
  var toastStack = document.getElementById("toast-stack");
  var modeChip = document.querySelector(".mode-chip");
  var modeChipLabel = document.getElementById("mode-chip-label");
  var modeStatus = document.getElementById("mode-status");

  var colorPicker = document.getElementById("color-picker");
  var colorValue = document.getElementById("color-value");
  var labelInput = document.getElementById("label-input");
  var sizeSlider = document.getElementById("size-slider");
  var sizeValue = document.getElementById("size-value");
  var radiusSlider = document.getElementById("radius-slider");
  var radiusValue = document.getElementById("radius-value");
  var depthSlider = document.getElementById("depth-slider");
  var depthValue = document.getElementById("depth-value");
  var soundSetting = document.getElementById("sound-setting");
  var soundSelect = document.getElementById("sound-select");
  var hapticsSetting = document.getElementById("haptics-setting");
  var hapticsToggle = document.getElementById("haptics-toggle");
  var effectSelect = document.getElementById("effect-select");
  var backgroundSelect = document.getElementById("background-select");
  var animationSetting = document.getElementById("animation-setting");
  var copyLinkButton = document.getElementById("copy-link");
  var resetEverythingButton = document.getElementById("reset-everything");
  var resetConfirm = document.getElementById("reset-confirm");
  var resetCancelButton = document.getElementById("reset-cancel");
  var resetConfirmButton = document.getElementById("reset-confirm-btn");
  var menuToggle = document.querySelector(".js-menu-toggle");
  var headerMenu = document.getElementById("header-menu");
  var homeButton = document.querySelector(".js-home");

  var statTotal = document.getElementById("stat-total");
  var statToday = document.getElementById("stat-today");
  var statSession = document.getElementById("stat-session");
  var statStreak = document.getElementById("stat-streak");
  var statFastest = document.getElementById("stat-fastest");

  initialize();

  function initialize() {
    if (!supportsHaptics && hapticsSetting) {
      hapticsSetting.hidden = true;
      state.hapticsEnabled = false;
    }

    if (typeof AudioContextConstructor !== "function" && soundSetting) {
      soundSetting.hidden = true;
      state.sound = "muted";
    }

    var urlApplied = applyConfigFromUrl();

    renderAll();
    bindThemeEvents();
    bindCustomizationEvents();
    bindSettingsEvents();
    bindPanelEvents();
    bindPressEvents();
    bindShareEvents();
    bindKeyboardEvents();
    bindModeEvents();
    bindMenuEvents();

    evaluateAchievements();

    if (state.mode === "rapid") {
      showStatus("Press 10 times — go");
    }

    if (urlApplied) {
      syncShareUrl();
    }
  }

  function getStorage() {
    try {
      return window.localStorage;
    } catch (error) {
      return null;
    }
  }

  function readStorage(key) {
    var storage = getStorage();
    if (!storage) {
      return null;
    }
    try {
      return storage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    var storage = getStorage();
    if (!storage) {
      return;
    }
    try {
      storage.setItem(key, String(value));
    } catch (error) {
      // Private browsing and full storage should not break pressing.
    }
  }

  function clearStorage() {
    var storage = getStorage();
    if (!storage) {
      return;
    }
    try {
      storage.clear();
    } catch (error) {
      // Reset still updates the current session if storage is unavailable.
    }
  }

  function readNumber(key, fallback, minimum, maximum) {
    var raw = readStorage(key);
    var value = raw === null ? fallback : Number(raw);
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.round(Math.min(maximum, Math.max(minimum, value)));
  }

  function readBoolean(key, fallback) {
    var raw = readStorage(key);
    return raw === null ? fallback : raw === "true";
  }

  function readOption(key, fallback, options) {
    var raw = readStorage(key);
    return options.indexOf(raw) !== -1 ? raw : fallback;
  }

  function isHexColor(value) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  }

  function loadState() {
    var legacySound = readStorage("soundEnabled");
    var sound = readOption("sound", null, SOUND_OPTIONS);
    if (!sound) {
      sound = legacySound === "true" ? "mechanical" : defaults.sound;
    }

    return {
      pressCount: readNumber("pressCount", defaults.pressCount, 0, Number.MAX_SAFE_INTEGER),
      theme: readTheme(),
      buttonColor: readColor(),
      buttonText: readText(),
      buttonSize: readNumber("buttonSize", defaults.buttonSize, 150, 400),
      borderRadius: readNumber("borderRadius", defaults.borderRadius, 0, 200),
      depth: readNumber("depth", defaults.depth, 2, 16),
      sound: sound,
      hapticsEnabled: readBoolean("hapticsEnabled", defaults.hapticsEnabled),
      animationsReduced: readBoolean("animationsReduced", defaults.animationsReduced),
      effect: readOption("effect", defaults.effect, EFFECT_OPTIONS),
      background: readOption("background", defaults.background, BACKGROUND_OPTIONS),
      preset: readOption("preset", defaults.preset, PRESET_OPTIONS.concat(["custom"])),
      mode: readOption("mode", defaults.mode, MODE_OPTIONS)
    };
  }

  function readTheme() {
    var raw = readStorage("theme");
    return raw === "light" || raw === "dark" || raw === "system" ? raw : defaults.theme;
  }

  function readColor() {
    var raw = readStorage("buttonColor");
    return isHexColor(raw) ? raw.toUpperCase() : defaults.buttonColor;
  }

  function readText() {
    var raw = readStorage("buttonText");
    if (typeof raw !== "string" || raw.trim() === "") {
      return defaults.buttonText;
    }
    return raw.slice(0, 20);
  }

  function todayKey(date) {
    var value = date || new Date();
    var month = String(value.getMonth() + 1).padStart(2, "0");
    var day = String(value.getDate()).padStart(2, "0");
    return value.getFullYear() + "-" + month + "-" + day;
  }

  function loadStats() {
    var raw = readStorage("stats");
    var data = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (error) {
        data = null;
      }
    }
    if (!data || typeof data !== "object") {
      data = {};
    }

    var loaded = {
      date: typeof data.date === "string" ? data.date : todayKey(),
      today: Number.isFinite(Number(data.today)) ? Math.max(0, Math.round(Number(data.today))) : 0,
      bestStreak: Number.isFinite(Number(data.bestStreak)) ? Math.max(0, Math.round(Number(data.bestStreak))) : 0,
      fastest10: Number.isFinite(Number(data.fastest10)) && Number(data.fastest10) > 0 ? Math.round(Number(data.fastest10)) : null
    };

    if (loaded.date !== todayKey()) {
      loaded.date = todayKey();
      loaded.today = 0;
    }

    return loaded;
  }

  function saveStats() {
    writeStorage("stats", JSON.stringify(stats));
  }

  function loadAchievements() {
    var raw = readStorage("achievements");
    var list = null;
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch (error) {
        list = null;
      }
    }
    var valid = {};
    if (Array.isArray(list)) {
      for (var index = 0; index < list.length; index += 1) {
        for (var def = 0; def < ACHIEVEMENTS.length; def += 1) {
          if (ACHIEVEMENTS[def].id === list[index]) {
            valid[list[index]] = true;
          }
        }
      }
    }
    return valid;
  }

  function saveAchievements() {
    writeStorage("achievements", JSON.stringify(Object.keys(achievements)));
  }

  function savePreference(key, value) {
    writeStorage(key, value);
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function copyDefaults() {
    return {
      pressCount: defaults.pressCount,
      theme: defaults.theme,
      buttonColor: defaults.buttonColor,
      buttonText: defaults.buttonText,
      buttonSize: defaults.buttonSize,
      borderRadius: defaults.borderRadius,
      depth: defaults.depth,
      sound: defaults.sound,
      hapticsEnabled: defaults.hapticsEnabled,
      animationsReduced: defaults.animationsReduced,
      effect: defaults.effect,
      background: defaults.background,
      preset: defaults.preset,
      mode: defaults.mode
    };
  }

  function renderAll() {
    renderTheme();
    renderButton();
    renderControls();
    renderCount();
    renderMotion();
    renderEnvironment();
    renderModeUI();
    renderStats();
    renderAchievements();
  }

  function renderTheme() {
    var resolvedTheme = getResolvedTheme();
    var preferenceLabel = state.theme.charAt(0).toUpperCase() + state.theme.slice(1);
    var resolvedLabel = resolvedTheme.charAt(0).toUpperCase() + resolvedTheme.slice(1);

    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    themeColorMeta.setAttribute("content", resolvedTheme === "dark" ? "#05080D" : "#F2F1ED");

    for (var index = 0; index < themeToggles.length; index += 1) {
      var toggle = themeToggles[index];
      var name = toggle.querySelector(".theme-name");
      var icon = toggle.querySelector(".theme-icon");
      if (name) {
        name.textContent = resolvedLabel;
      }
      if (icon) {
        icon.setAttribute("data-mode", state.theme);
      }
      toggle.setAttribute("aria-label", "Theme: " + preferenceLabel + ". Currently " + resolvedLabel + ". Change theme");
      toggle.title = "Theme: " + resolvedLabel + " (" + preferenceLabel + "). Click to change";
    }
  }

  function getResolvedTheme() {
    if (state.theme === "light" || state.theme === "dark") {
      return state.theme;
    }
    return systemThemeQuery && systemThemeQuery.matches ? "dark" : "light";
  }

  function renderButton() {
    var color = hexToRgb(state.buttonColor);
    var shade = mixColor(color, { r: 0, g: 0, b: 0 }, 0.17);
    var deepShadow = mixColor(color, { r: 0, g: 0, b: 0 }, 0.4);
    var highlight = mixColor(color, { r: 255, g: 255, b: 255 }, 0.24);
    var ink = getContrastingInk(color);

    document.documentElement.style.setProperty("--brand-accent", state.buttonColor);
    document.documentElement.style.setProperty("--accent-rgb", color.r + ", " + color.g + ", " + color.b);

    pressButton.style.setProperty("--button-size", state.buttonSize + "px");
    pressButton.style.setProperty("--button-radius", state.borderRadius + "px");
    pressButton.style.setProperty("--button-depth", state.depth + "px");
    pressButton.style.setProperty("--button-color", state.buttonColor);
    pressButton.style.setProperty("--button-highlight", toHex(highlight));
    pressButton.style.setProperty("--button-shade", toHex(shade));
    pressButton.style.setProperty("--button-deep-shadow", toHex(deepShadow));
    pressButton.style.setProperty("--button-ink", ink);

    if (buttonHousing) {
      buttonHousing.style.setProperty("--button-radius", state.borderRadius + "px");
      buttonHousing.style.setProperty("--button-depth", state.depth + "px");
      buttonHousing.style.setProperty("--button-shade", toHex(shade));
      buttonHousing.style.setProperty("--button-deep-shadow", toHex(deepShadow));
    }

    buttonLabel.textContent = state.buttonText.trim() === "" ? defaults.buttonText : state.buttonText;
  }

  function renderControls() {
    colorPicker.value = state.buttonColor;
    colorValue.textContent = state.buttonColor;
    labelInput.value = state.buttonText === defaults.buttonText ? "" : state.buttonText;
    sizeSlider.value = String(state.buttonSize);
    sizeValue.textContent = state.buttonSize + "px";
    radiusSlider.value = String(state.borderRadius);
    radiusValue.textContent = getRadiusLabel();
    depthSlider.value = String(state.depth);
    depthValue.textContent = state.depth + "px";
    soundSelect.value = state.sound;
    hapticsToggle.checked = state.hapticsEnabled;
    effectSelect.value = state.effect;
    backgroundSelect.value = state.background;
    animationSetting.value = state.animationsReduced ? "reduced" : "full";
    updateSelectedControls();
  }

  function renderCount() {
    pressCount.textContent = state.pressCount.toLocaleString();
  }

  function renderMotion() {
    document.documentElement.classList.toggle("animations-reduced", shouldReduceMotion());
  }

  function renderEnvironment() {
    document.body.dataset.background = state.background;
    document.body.dataset.mode = state.mode;
  }

  function renderModeUI() {
    var modeCards = document.querySelectorAll(".mode-card[data-mode]");
    for (var index = 0; index < modeCards.length; index += 1) {
      modeCards[index].setAttribute("aria-pressed", String(modeCards[index].getAttribute("data-mode") === state.mode));
    }

    if (modeChipLabel) {
      modeChipLabel.textContent = state.mode.charAt(0).toUpperCase() + state.mode.slice(1);
    }

    if (state.mode !== "rapid") {
      stopRapidTimer();
      rapid.running = false;
      rapid.count = 0;
      rapid.startTime = 0;
    }

    if (modeChip) {
      modeChip.setAttribute("aria-label", "Mode: " + state.mode + ". Open modes panel");
    }
  }

  function renderStats() {
    if (stats.date !== todayKey()) {
      stats.date = todayKey();
      stats.today = 0;
      saveStats();
    }

    if (statTotal) statTotal.textContent = state.pressCount.toLocaleString();
    if (statToday) statToday.textContent = stats.today.toLocaleString();
    if (statSession) statSession.textContent = session.count.toLocaleString();
    if (statStreak) statStreak.textContent = stats.bestStreak.toLocaleString();
    if (statFastest) statFastest.textContent = stats.fastest10 ? (stats.fastest10 / 1000).toFixed(2) + "s" : "—";
  }

  function renderAchievements() {
    var items = document.querySelectorAll(".achievement");
    for (var index = 0; index < items.length; index += 1) {
      var id = items[index].getAttribute("data-achievement");
      items[index].classList.toggle("is-unlocked", Boolean(achievements[id]));
    }
  }

  function shouldReduceMotion() {
    return state.animationsReduced || Boolean(reducedMotionQuery && reducedMotionQuery.matches);
  }

  function getRadiusLabel() {
    if (state.borderRadius >= state.buttonSize / 2) {
      return "Pill";
    }
    return state.borderRadius + "px";
  }

  function updateSelectedControls() {
    var swatches = document.querySelectorAll("[data-color]");
    var radiusPresets = document.querySelectorAll("[data-radius]");
    var buttonPresets = document.querySelectorAll("[data-preset]");
    var index;

    for (index = 0; index < swatches.length; index += 1) {
      swatches[index].classList.toggle("is-selected", swatches[index].getAttribute("data-color").toUpperCase() === state.buttonColor);
    }

    for (index = 0; index < radiusPresets.length; index += 1) {
      radiusPresets[index].classList.toggle("is-selected", Number(radiusPresets[index].getAttribute("data-radius")) === state.borderRadius);
    }

    for (index = 0; index < buttonPresets.length; index += 1) {
      buttonPresets[index].classList.toggle("is-selected", buttonPresets[index].getAttribute("data-preset") === state.preset);
    }
  }

  function markCustom() {
    if (state.preset !== "custom") {
      state.preset = "custom";
      savePreference("preset", state.preset);
    }
  }

  function bindThemeEvents() {
    for (var index = 0; index < themeToggles.length; index += 1) {
      themeToggles[index].addEventListener("click", function () {
        var themes = ["system", "light", "dark"];
        var currentIndex = themes.indexOf(state.theme);
        state.theme = themes[(currentIndex + 1) % themes.length];
        savePreference("theme", state.theme);
        renderTheme();
      });
    }

    if (systemThemeQuery) {
      addMediaListener(systemThemeQuery, function () {
        if (state.theme === "system") {
          renderTheme();
        }
      });
    }

    if (reducedMotionQuery) {
      addMediaListener(reducedMotionQuery, renderMotion);
    }
  }

  function addMediaListener(query, listener) {
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", listener);
    } else if (typeof query.addListener === "function") {
      query.addListener(listener);
    }
  }

  function bindCustomizationEvents() {
    colorPicker.addEventListener("input", function (event) {
      updateColor(event.target.value);
    });

    labelInput.addEventListener("input", function (event) {
      state.buttonText = event.target.value.slice(0, 20);
      if (state.buttonText.trim() === "") {
        state.buttonText = defaults.buttonText;
      }
      markCustom();
      savePreference("buttonText", state.buttonText);
      renderButton();
      scheduleShareSync();
    });

    sizeSlider.addEventListener("input", function (event) {
      state.buttonSize = clamp(Math.round(Number(event.target.value)), 150, 400);
      markCustom();
      savePreference("buttonSize", state.buttonSize);
      renderButton();
      sizeValue.textContent = state.buttonSize + "px";
      radiusValue.textContent = getRadiusLabel();
      updateSelectedControls();
      scheduleShareSync();
    });

    radiusSlider.addEventListener("input", function (event) {
      state.borderRadius = clamp(Math.round(Number(event.target.value)), 0, 200);
      markCustom();
      savePreference("borderRadius", state.borderRadius);
      renderButton();
      radiusValue.textContent = getRadiusLabel();
      updateSelectedControls();
      scheduleShareSync();
    });

    depthSlider.addEventListener("input", function (event) {
      state.depth = clamp(Math.round(Number(event.target.value)), 2, 16);
      markCustom();
      savePreference("depth", state.depth);
      renderButton();
      depthValue.textContent = state.depth + "px";
      scheduleShareSync();
    });

    document.querySelectorAll("[data-color]").forEach(function (swatch) {
      swatch.addEventListener("click", function () {
        updateColor(swatch.getAttribute("data-color"));
      });
    });

    document.querySelectorAll("[data-radius]").forEach(function (preset) {
      preset.addEventListener("click", function () {
        state.borderRadius = clamp(Number(preset.getAttribute("data-radius")), 0, 200);
        markCustom();
        savePreference("borderRadius", state.borderRadius);
        renderButton();
        renderControls();
        scheduleShareSync();
      });
    });

    document.querySelectorAll("[data-preset]").forEach(function (presetButton) {
      presetButton.addEventListener("click", function () {
        applyPreset(presetButton.getAttribute("data-preset"));
      });
    });

    document.getElementById("reset-appearance").addEventListener("click", function () {
      state.buttonColor = defaults.buttonColor;
      state.buttonText = defaults.buttonText;
      state.buttonSize = defaults.buttonSize;
      state.borderRadius = defaults.borderRadius;
      state.depth = defaults.depth;
      state.preset = defaults.preset;
      saveAppearancePreferences();
      savePreference("preset", state.preset);
      renderButton();
      renderControls();
      syncShareUrl();
      showStatus("Appearance reset");
    });
  }

  function applyPreset(id) {
    var preset = PRESETS[id];
    if (!preset) {
      return;
    }
    state.buttonColor = preset.buttonColor;
    state.buttonText = preset.buttonText;
    state.buttonSize = preset.buttonSize;
    state.borderRadius = preset.borderRadius;
    state.depth = preset.depth;
    state.preset = id;
    saveAppearancePreferences();
    savePreference("preset", state.preset);
    renderButton();
    renderControls();
    syncShareUrl();
    showStatus(id + " preset applied");
  }

  function updateColor(value) {
    if (!isHexColor(value)) {
      return;
    }
    state.buttonColor = value.toUpperCase();
    markCustom();
    savePreference("buttonColor", state.buttonColor);
    renderButton();
    colorPicker.value = state.buttonColor;
    colorValue.textContent = state.buttonColor;
    updateSelectedControls();
    scheduleShareSync();
  }

  function saveAppearancePreferences() {
    savePreference("buttonColor", state.buttonColor);
    savePreference("buttonText", state.buttonText);
    savePreference("buttonSize", state.buttonSize);
    savePreference("borderRadius", state.borderRadius);
    savePreference("depth", state.depth);
  }

  function parseSharedColor(value) {
    if (!value) {
      return null;
    }
    var raw = String(value).trim().toLowerCase();
    if (NAMED_COLORS[raw]) {
      return NAMED_COLORS[raw].toUpperCase();
    }
    if (/^[0-9a-f]{6}$/.test(raw)) {
      return ("#" + raw).toUpperCase();
    }
    if (/^[0-9a-f]{3}$/.test(raw)) {
      return ("#" + raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2]).toUpperCase();
    }
    if (raw.charAt(0) === "#" && isHexColor(raw)) {
      return raw.toUpperCase();
    }
    return null;
  }

  function applyParam(key, value) {
    if (!value) {
      return false;
    }

    if (key === "color" || key === "c") {
      var hex = parseSharedColor(value);
      if (hex) {
        state.buttonColor = hex;
        return true;
      }
      return false;
    }

    if (key === "label" || key === "t") {
      var text = "";
      try {
        text = decodeURIComponent(String(value).replace(/\+/g, " "));
      } catch (error) {
        text = String(value);
      }
      if (text.trim() !== "") {
        state.buttonText = text.slice(0, 20);
        return true;
      }
      return false;
    }

    if (key === "size" || key === "s") {
      var size = Math.round(Number(value));
      if (Number.isFinite(size)) {
        state.buttonSize = clamp(size, 150, 400);
        return true;
      }
    }

    if (key === "radius" || key === "r") {
      var radius = Math.round(Number(value));
      if (Number.isFinite(radius)) {
        state.borderRadius = clamp(radius, 0, 200);
        return true;
      }
    }

    if (key === "depth" || key === "d") {
      var depth = Math.round(Number(value));
      if (Number.isFinite(depth)) {
        state.depth = clamp(depth, 2, 16);
        return true;
      }
    }

    return false;
  }

  function applyConfigFromUrl() {
    var applied = false;
    var search = window.location.search || "";
    var index;
    var separator;
    var key;
    var value;

    if (search.length > 1) {
      try {
        var params = new URLSearchParams(search);
        ["color", "label", "size", "radius", "depth"].forEach(function (paramKey) {
          if (params.has(paramKey) && applyParam(paramKey, params.get(paramKey))) {
            applied = true;
          }
        });
      } catch (error) {
        // Ignore malformed query strings and fall back to stored state.
      }
    }

    var hash = window.location.hash;
    if (hash && hash.length > 2) {
      var pairs = hash.slice(1).split("&");
      for (index = 0; index < pairs.length; index += 1) {
        separator = pairs[index].indexOf("=");
        if (separator < 1) {
          continue;
        }
        key = pairs[index].slice(0, separator);
        value = pairs[index].slice(separator + 1);
        if (applyParam(key, value)) {
          applied = true;
        }
      }
    }

    if (applied) {
      state.preset = "custom";
      saveAppearancePreferences();
      savePreference("preset", state.preset);
    }

    return applied;
  }

  function buildShareSearch() {
    var query = "";
    var parts = [];

    if (state.buttonColor !== defaults.buttonColor) {
      parts.push("color=" + state.buttonColor.slice(1).toLowerCase());
    }
    if (state.buttonText !== defaults.buttonText) {
      parts.push("label=" + encodeURIComponent(state.buttonText));
    }
    if (state.buttonSize !== defaults.buttonSize) {
      parts.push("size=" + state.buttonSize);
    }
    if (state.borderRadius !== defaults.borderRadius) {
      parts.push("radius=" + state.borderRadius);
    }
    if (state.depth !== defaults.depth) {
      parts.push("depth=" + state.depth);
    }

    if (parts.length) {
      query = "?" + parts.join("&");
    }
    return query;
  }

  function syncShareUrl() {
    try {
      var nextUrl = window.location.pathname + buildShareSearch();
      var currentUrl = window.location.pathname + window.location.search;
      if (nextUrl !== currentUrl || window.location.hash) {
        window.history.replaceState(null, "", nextUrl);
      }
    } catch (error) {
      // file:// or restricted history access: sharing simply stays out of sync.
    }
  }

  function scheduleShareSync() {
    if (shareTimer) {
      window.clearTimeout(shareTimer);
    }
    shareTimer = window.setTimeout(function () {
      shareTimer = null;
      syncShareUrl();
    }, 150);
  }

  function bindShareEvents() {
    if (copyLinkButton) {
      copyLinkButton.addEventListener("click", function () {
        syncShareUrl();
        var showFeedback = function (message) {
          copyLinkButton.textContent = message;
          copyLinkButton.classList.toggle("is-copied", message === "Link copied");
          if (copyFeedbackTimer) {
            window.clearTimeout(copyFeedbackTimer);
          }
          copyFeedbackTimer = window.setTimeout(function () {
            copyLinkButton.textContent = "Copy link";
            copyLinkButton.classList.remove("is-copied");
            copyFeedbackTimer = null;
          }, 1800);
        };
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          navigator.clipboard.writeText(window.location.href).then(function () {
            showFeedback("Link copied");
          }, function () {
            showFeedback("Link is in the address bar");
          });
        } else {
          showFeedback("Link is in the address bar");
        }
      });
    }

    window.addEventListener("hashchange", function () {
      if (applyConfigFromUrl()) {
        renderButton();
        renderControls();
      }
    });
  }

  function bindSettingsEvents() {
    soundSelect.addEventListener("change", function () {
      state.sound = SOUND_OPTIONS.indexOf(soundSelect.value) !== -1 ? soundSelect.value : defaults.sound;
      savePreference("sound", state.sound);
      if (state.sound !== "muted") {
        playPressSound();
      }
    });

    hapticsToggle.addEventListener("change", function () {
      state.hapticsEnabled = hapticsToggle.checked;
      savePreference("hapticsEnabled", state.hapticsEnabled);
    });

    effectSelect.addEventListener("change", function () {
      state.effect = EFFECT_OPTIONS.indexOf(effectSelect.value) !== -1 ? effectSelect.value : defaults.effect;
      savePreference("effect", state.effect);
    });

    backgroundSelect.addEventListener("change", function () {
      state.background = BACKGROUND_OPTIONS.indexOf(backgroundSelect.value) !== -1 ? backgroundSelect.value : defaults.background;
      savePreference("background", state.background);
      renderEnvironment();
    });

    animationSetting.addEventListener("change", function () {
      state.animationsReduced = animationSetting.value === "reduced";
      savePreference("animationsReduced", state.animationsReduced);
      renderMotion();
    });

    resetEverythingButton.addEventListener("click", function () {
      resetEverythingButton.hidden = true;
      resetConfirm.hidden = false;
      resetConfirmButton.focus();
    });

    resetCancelButton.addEventListener("click", hideResetConfirm);

    resetConfirmButton.addEventListener("click", function () {
      performFullReset();
      hideResetConfirm();
      resetEverythingButton.focus();
    });
  }

  function hideResetConfirm() {
    resetConfirm.hidden = true;
    resetEverythingButton.hidden = false;
  }

  function performFullReset() {
    clearStorage();
    state = copyDefaults();

    if (!supportsHaptics) {
      state.hapticsEnabled = false;
    }
    if (typeof AudioContextConstructor !== "function") {
      state.sound = "muted";
    }

    stats = {
      date: todayKey(),
      today: 0,
      bestStreak: 0,
      fastest10: null
    };
    achievements = {};
    session.count = 0;
    session.streak = 0;
    session.lastPressAt = 0;
    session.pressTimes = [];
    openedPanels = {};
    resetRapid();

    renderAll();
    syncShareUrl();
    showStatus("Everything reset");
  }

  function bindPanelEvents() {
    panelTriggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var panel = document.getElementById(trigger.getAttribute("data-panel"));
        if (panel) {
          openPanel(panel);
        }
      });
    });

    document.querySelectorAll("[data-close-panel]").forEach(function (closeButton) {
      closeButton.addEventListener("click", closePanel);
    });

    panelOverlay.addEventListener("click", closePanel);

    document.addEventListener("keydown", function (event) {
      if (!activePanel) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        if (!resetConfirm.hidden) {
          hideResetConfirm();
        }
        closePanel();
        return;
      }

      if (event.key === "Tab") {
        trapPanelFocus(event);
      }
    });
  }

  function openPanel(panel) {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }

    document.querySelectorAll(".panel").forEach(function (otherPanel) {
      if (otherPanel !== panel) {
        otherPanel.classList.remove("is-open");
        otherPanel.hidden = true;
        otherPanel.setAttribute("aria-hidden", "true");
      }
    });

    activePanel = panel;
    lastFocusedElement = document.activeElement;
    panel.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    panelOverlay.hidden = false;
    document.body.classList.add("panel-open");
    updateTriggerStates();

    openedPanels[panel.id] = true;
    evaluateAchievements();

    if (panel.id === "stats-panel") {
      renderStats();
    }
    if (panel.id === "achievements-panel") {
      renderAchievements();
    }

    var focusTargets = getFocusableElements(panel);
    if (focusTargets.length) {
      focusTargets[0].focus();
    }

    window.requestAnimationFrame(function () {
      panelOverlay.classList.add("is-open");
      panel.classList.add("is-open");
    });
  }

  function closePanel() {
    if (!activePanel) {
      return;
    }

    var panel = activePanel;
    var focusTarget = lastFocusedElement;
    activePanel = null;
    lastFocusedElement = null;
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    panelOverlay.classList.remove("is-open");
    updateTriggerStates();

    closeTimer = window.setTimeout(function () {
      panel.hidden = true;
      panelOverlay.hidden = true;
      document.body.classList.remove("panel-open");
      closeTimer = null;
      if (homeButton && !activePanel) {
        homeButton.classList.add("is-active");
        homeButton.setAttribute("aria-current", "page");
      }
    }, 280);

    if (focusTarget && typeof focusTarget.focus === "function") {
      focusTarget.focus();
    }
  }

  function updateTriggerStates() {
    panelTriggers.forEach(function (trigger) {
      trigger.setAttribute("aria-expanded", String(Boolean(activePanel && trigger.getAttribute("data-panel") === activePanel.id)));
    });
  }

  function getFocusableElements(container) {
    var selector = "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";
    return Array.prototype.slice.call(container.querySelectorAll(selector)).filter(function (element) {
      return !element.hidden && !element.closest("[hidden]") && element.getAttribute("aria-hidden") !== "true";
    });
  }

  function trapPanelFocus(event) {
    var focusTargets = getFocusableElements(activePanel);
    if (!focusTargets.length) {
      event.preventDefault();
      return;
    }

    var first = focusTargets[0];
    var last = focusTargets[focusTargets.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function isTextInputElement(element) {
    if (!element || element === document.body) {
      return false;
    }
    var tag = element.tagName;
    if (element.isContentEditable) {
      return true;
    }
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }

  function isInteractiveElement(element) {
    if (!element || element === document.body || element === document.documentElement) {
      return false;
    }
    var tag = element.tagName;
    return tag === "BUTTON" || tag === "A" || tag === "SUMMARY" || isTextInputElement(element);
  }

  function isActivationKey(key) {
    return key === "Enter" || key === " " || key === "Spacebar" || key === "Space";
  }

  function bindKeyboardEvents() {
    document.addEventListener("keydown", function (event) {
      if (!isActivationKey(event.key)) {
        return;
      }
      if (activePanel || isTextInputElement(document.activeElement)) {
        return;
      }
      if (document.activeElement !== pressButton && isInteractiveElement(document.activeElement)) {
        return;
      }
      if (event.repeat || activePress) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      beginPress("keyboard", event.key);
    });

    document.addEventListener("keyup", function (event) {
      if (!isActivationKey(event.key)) {
        return;
      }
      if (activePress && activePress.source === "keyboard") {
        event.preventDefault();
        finishPress(false);
      }
    });
  }

  function bindPressEvents() {
    if (supportsPointerEvents) {
      pressButton.addEventListener("pointerdown", handlePointerDown);
      pressButton.addEventListener("pointerup", handlePointerUp);
      pressButton.addEventListener("pointercancel", handlePointerCancel);
      pressButton.addEventListener("pointerleave", handlePointerLeave);
    } else {
      pressButton.addEventListener("mousedown", handleMouseDown);
      pressButton.addEventListener("mouseup", handleMouseUp);
      pressButton.addEventListener("mouseleave", handleMouseLeave);
      pressButton.addEventListener("touchstart", handleTouchStart, { passive: false });
      pressButton.addEventListener("touchend", handleTouchEnd, { passive: false });
      pressButton.addEventListener("touchcancel", handleTouchCancel, { passive: false });
    }

    pressButton.addEventListener("keydown", handleButtonKeyDown);
    pressButton.addEventListener("keyup", handleButtonKeyUp);
    pressButton.addEventListener("click", handleClickFallback);
    window.addEventListener("blur", cancelActivePress);
  }

  function handlePointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    if (activePress) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    beginPress("pointer", event.pointerId);
    if (event.pointerType !== "mouse" && typeof pressButton.setPointerCapture === "function") {
      try {
        pressButton.setPointerCapture(event.pointerId);
      } catch (error) {
        // Some older touch implementations do not expose pointer capture.
      }
    }
  }

  function handlePointerUp(event) {
    if (activePress && activePress.source === "pointer" && activePress.id === event.pointerId) {
      event.preventDefault();
      finishPress(false);
    }
  }

  function handlePointerCancel(event) {
    if (activePress && activePress.source === "pointer" && activePress.id === event.pointerId) {
      event.preventDefault();
      finishPress(true);
    }
  }

  function handlePointerLeave(event) {
    if (event.pointerType === "mouse" && activePress && activePress.source === "pointer" && activePress.id === event.pointerId) {
      finishPress(true);
    }
  }

  function handleMouseDown(event) {
    if (event.button !== 0 || activePress) {
      return;
    }
    event.preventDefault();
    beginPress("mouse", "mouse");
  }

  function handleMouseUp(event) {
    if (event.button === 0 && activePress && activePress.source === "mouse") {
      event.preventDefault();
      finishPress(false);
    }
  }

  function handleMouseLeave() {
    if (activePress && activePress.source === "mouse") {
      finishPress(true);
    }
  }

  function handleTouchStart(event) {
    if (activePress || !event.changedTouches.length) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    beginPress("touch", event.changedTouches[0].identifier);
  }

  function handleTouchEnd(event) {
    if (!activePress || activePress.source !== "touch") {
      return;
    }
    for (var index = 0; index < event.changedTouches.length; index += 1) {
      if (event.changedTouches[index].identifier === activePress.id) {
        event.preventDefault();
        finishPress(false);
        return;
      }
    }
  }

  function handleTouchCancel(event) {
    if (!activePress || activePress.source !== "touch") {
      return;
    }
    for (var index = 0; index < event.changedTouches.length; index += 1) {
      if (event.changedTouches[index].identifier === activePress.id) {
        event.preventDefault();
        finishPress(true);
        return;
      }
    }
  }

  function handleButtonKeyDown(event) {
    if (!isActivationKey(event.key)) {
      return;
    }
    event.preventDefault();
    if (event.repeat || activePress) {
      return;
    }
    beginPress("keyboard", event.key);
  }

  function handleButtonKeyUp(event) {
    if (!isActivationKey(event.key)) {
      return;
    }
    event.preventDefault();
    if (activePress && activePress.source === "keyboard") {
      finishPress(false);
    }
  }

  function handleClickFallback(event) {
    if (Date.now() < suppressClickUntil) {
      event.preventDefault();
      return;
    }

    if (activePress) {
      if (activePress.source === "keyboard") {
        return;
      }
      finishPress(false);
      return;
    }

    beginPress("click", "click");
    finishPress(false);
  }

  function beginPress(source, id) {
    if (activePress) {
      return false;
    }

    activePress = { source: source, id: id };
    if (releaseTimer) {
      window.clearTimeout(releaseTimer);
      releaseTimer = null;
    }
    pressButton.classList.remove("is-releasing");
    pressButton.classList.add("is-pressed");
    if (buttonHousing) {
      buttonHousing.classList.add("housing-pressed");
    }
    pressButton.setAttribute("aria-pressed", "true");
    playPressSound();
    vibrateOnPress();
    return true;
  }

  function finishPress(cancelled) {
    if (!activePress) {
      return;
    }

    activePress = null;
    suppressClickUntil = Date.now() + 450;
    pressButton.classList.remove("is-pressed");
    if (buttonHousing) {
      buttonHousing.classList.remove("housing-pressed");
    }
    pressButton.classList.add("is-releasing");
    pressButton.setAttribute("aria-pressed", "false");

    if (!cancelled) {
      recordPress();
      triggerPressEffect();
      runChaos();
      runRapidTick();
    }

    releaseTimer = window.setTimeout(function () {
      pressButton.classList.remove("is-releasing");
      releaseTimer = null;
    }, shouldReduceMotion() ? 100 : 340);
  }

  function cancelActivePress() {
    if (activePress) {
      finishPress(true);
    }
  }

  function recordPress() {
    var now = Date.now();

    state.pressCount += 1;
    session.count += 1;

    if (stats.date !== todayKey()) {
      stats.date = todayKey();
      stats.today = 0;
    }
    stats.today += 1;

    if (session.lastPressAt && now - session.lastPressAt <= 2000) {
      session.streak += 1;
    } else {
      session.streak = 1;
    }
    session.lastPressAt = now;
    if (session.streak > stats.bestStreak) {
      stats.bestStreak = session.streak;
    }

    session.pressTimes.push(now);
    if (session.pressTimes.length > 10) {
      session.pressTimes.shift();
    }
    updateFastestWindow();

    savePreference("pressCount", state.pressCount);
    saveStats();
    renderCount();
    renderStats();

    if (!shouldReduceMotion()) {
      pressCount.classList.remove("tick");
      void pressCount.offsetWidth;
      pressCount.classList.add("tick");
    }

    evaluateAchievements();
    checkEasterEggs(now);
  }

  function updateFastestWindow() {
    if (session.pressTimes.length < 10) {
      return;
    }

    var valid = true;
    for (var index = 1; index < session.pressTimes.length; index += 1) {
      if (session.pressTimes[index] - session.pressTimes[index - 1] > 2000) {
        valid = false;
        break;
      }
    }
    if (!valid) {
      return;
    }

    var span = session.pressTimes[session.pressTimes.length - 1] - session.pressTimes[0];
    if (span > 0 && (stats.fastest10 === null || span < stats.fastest10)) {
      stats.fastest10 = span;
      saveStats();
      renderStats();
    }
  }

  function triggerPressEffect() {
    if (shouldReduceMotion()) {
      return;
    }

    var kind = state.effect;
    if (kind === "none") {
      return;
    }
    if (state.mode === "zen" && (kind === "particles" || kind === "shockwave")) {
      kind = "ripple";
    }

    if (kind === "ripple" && fxIn) {
      spawnFx(fxIn, "fx-ripple");
    } else if (kind === "glow" && fxOut) {
      spawnFx(fxOut, "fx-glow");
    } else if (kind === "shockwave" && fxOut) {
      spawnFx(fxOut, "fx-shockwave");
    } else if (kind === "particles" && fxOut) {
      spawnParticles(8);
    }
  }

  function spawnFx(container, className) {
    var node = document.createElement("span");
    node.className = className;
    container.appendChild(node);
    window.setTimeout(function () {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    }, 750);
  }

  function spawnParticles(count) {
    if (!fxOut) {
      return;
    }
    for (var index = 0; index < count; index += 1) {
      var node = document.createElement("span");
      node.className = "fx-particle";
      var angle = (Math.PI * 2 * index) / count + Math.random() * 0.5;
      var distance = 46 + Math.random() * 42;
      node.style.setProperty("--dx", Math.round(Math.cos(angle) * distance) + "px");
      node.style.setProperty("--dy", Math.round(Math.sin(angle) * distance) + "px");
      fxOut.appendChild(node);
    }
    window.setTimeout(function () {
      while (fxOut.firstChild) {
        fxOut.removeChild(fxOut.firstChild);
      }
    }, 750);
  }

  function runChaos() {
    if (state.mode !== "chaos" || shouldReduceMotion()) {
      return;
    }
    var now = Date.now();
    if (now - lastChaosAt < 1600 || Math.random() > 0.12) {
      return;
    }
    lastChaosAt = now;

    var pick = Math.floor(Math.random() * 4);
    if (pick === 0) {
      pulseClass(document.body, "chaos-flash", 460);
    } else if (pick === 1 && buttonHousing) {
      var tilt = (Math.random() * 4 + 1.2).toFixed(1) + "deg";
      buttonHousing.style.setProperty("--tilt", Math.random() > 0.5 ? tilt : "-" + tilt);
      pulseClass(buttonHousing, "chaos-tilt", 460);
    } else if (pick === 2) {
      spawnParticles(5);
    } else if (pick === 3) {
      pressCount.classList.remove("tick");
      void pressCount.offsetWidth;
      pressCount.classList.add("tick");
    }
  }

  function pulseClass(element, className, duration) {
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(function () {
      element.classList.remove(className);
    }, duration);
  }

  function checkEasterEggs(now) {
    var count = state.pressCount;

    if (count === 100) {
      showStatus("One hundred.");
      if (!shouldReduceMotion() && fxOut) {
        spawnFx(fxOut, "fx-shockwave");
        spawnFx(fxOut, "fx-glow");
      }
    }

    if (count === 666) {
      pulseClass(document.body, "is-ominous", 950);
      showStatus("...");
    }

    if (count === 1000) {
      showStatus("A thousand. Keep going.");
      if (!shouldReduceMotion() && fxOut) {
        spawnFx(fxOut, "fx-glow");
      }
    }

    if (session.pressTimes.length >= 10 && now - lastOverdriveAt > 25000) {
      var windowStart = session.pressTimes[0];
      if (now - windowStart <= 1400) {
        lastOverdriveAt = now;
        pulseClass(document.body, "is-overdrive", 720);
        showStatus("Overdrive.");
      }
    }

    var label = (state.buttonText || "").trim().toUpperCase();
    if (SECRET_LABELS[label] && Math.random() < 0.5) {
      showStatus(SECRET_LABELS[label]);
      if (!shouldReduceMotion() && fxIn) {
        spawnFx(fxIn, "fx-ripple");
      }
    } else if (label === "?" && Math.random() < 0.35) {
      showStatus(RANDOM_QUESTIONS[Math.floor(Math.random() * RANDOM_QUESTIONS.length)]);
    }
  }

  function showStatus(message) {
    if (!modeStatus) {
      return;
    }
    modeStatus.textContent = message;
    if (statusTimer) {
      window.clearTimeout(statusTimer);
    }
    statusTimer = window.setTimeout(function () {
      modeStatus.textContent = "";
      statusTimer = null;
    }, 2800);
  }

  function bindModeEvents() {
    document.querySelectorAll(".mode-card[data-mode]").forEach(function (modeButton) {
      modeButton.addEventListener("click", function () {
        setMode(modeButton.getAttribute("data-mode"));
      });
    });
  }

  function closeHeaderMenu() {
    if (!headerMenu || !menuToggle) {
      return;
    }
    headerMenu.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
  }

  function openHeaderMenu() {
    if (!headerMenu || !menuToggle) {
      return;
    }
    headerMenu.hidden = false;
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close menu");
  }

  function bindMenuEvents() {
    if (menuToggle && headerMenu) {
      menuToggle.addEventListener("click", function (event) {
        event.stopPropagation();
        if (headerMenu.hidden) {
          openHeaderMenu();
        } else {
          closeHeaderMenu();
        }
      });

      headerMenu.addEventListener("click", function (event) {
        event.stopPropagation();
      });

      document.addEventListener("click", function (event) {
        if (headerMenu.hidden) {
          return;
        }
        if (!headerMenu.contains(event.target) && !menuToggle.contains(event.target)) {
          closeHeaderMenu();
        }
      });

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !headerMenu.hidden && !activePanel) {
          closeHeaderMenu();
          menuToggle.focus();
        }
      });
    }

    if (homeButton) {
      homeButton.addEventListener("click", function () {
        closeHeaderMenu();
        if (activePanel) {
          closePanel();
        }
        homeButton.classList.add("is-active");
        homeButton.setAttribute("aria-current", "page");
      });
    }

    panelTriggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        closeHeaderMenu();
        if (homeButton && trigger.closest(".bottom-nav") && !trigger.classList.contains("nav-home")) {
          homeButton.classList.remove("is-active");
          homeButton.removeAttribute("aria-current");
        }
      });
    });
  }

  function setMode(mode) {
    if (MODE_OPTIONS.indexOf(mode) === -1) {
      return;
    }
    resetRapid();
    state.mode = mode;
    savePreference("mode", state.mode);
    renderEnvironment();
    renderModeUI();

    if (mode === "rapid") {
      showStatus("Press 10 times — go");
    } else if (mode === "zen") {
      showStatus("Breathe. Then press.");
    } else if (mode === "chaos") {
      showStatus("Anything can happen.");
    } else {
      showStatus("Classic mode");
    }
  }

  function runRapidTick() {
    if (state.mode !== "rapid") {
      return;
    }

    if (!rapid.running) {
      rapid.running = true;
      rapid.startTime = Date.now();
      rapid.count = 1;
      startRapidTimer();
      showStatus("Keep going — 9 left");
      return;
    }

    rapid.count += 1;

    if (rapid.count >= 10) {
      var elapsed = Date.now() - rapid.startTime;
      stopRapidTimer();
      rapid.running = false;

      if (stats.fastest10 === null || elapsed < stats.fastest10) {
        stats.fastest10 = elapsed;
        saveStats();
      }
      renderStats();

      if (modeChipLabel) {
        modeChipLabel.textContent = (elapsed / 1000).toFixed(2) + "s";
      }
      if (modeChip) {
        modeChip.classList.remove("is-running");
      }

      showStatus("10 presses — " + (elapsed / 1000).toFixed(2) + "s");

      if (elapsed < 3000) {
        tryUnlock("rapid_fire");
      }

      if (rapid.resetTimer) {
        window.clearTimeout(rapid.resetTimer);
      }
      rapid.resetTimer = window.setTimeout(function () {
        rapid.count = 0;
        rapid.startTime = 0;
        if (modeChipLabel) {
          modeChipLabel.textContent = "Rapid";
        }
        rapid.resetTimer = null;
        showStatus("Press 10 times — go");
      }, 1800);
      return;
    }

    showStatus("Keep going — " + (10 - rapid.count) + " left");
  }

  function startRapidTimer() {
    stopRapidTimer();
    if (modeChip) {
      modeChip.classList.add("is-running");
    }
    rapid.timerId = window.setInterval(function () {
      if (!rapid.running || !modeChipLabel) {
        return;
      }
      var elapsed = (Date.now() - rapid.startTime) / 1000;
      modeChipLabel.textContent = elapsed.toFixed(2) + "s";
    }, 60);
  }

  function stopRapidTimer() {
    if (rapid.timerId) {
      window.clearInterval(rapid.timerId);
      rapid.timerId = null;
    }
    if (modeChip) {
      modeChip.classList.remove("is-running");
    }
  }

  function resetRapid() {
    stopRapidTimer();
    if (rapid.resetTimer) {
      window.clearTimeout(rapid.resetTimer);
      rapid.resetTimer = null;
    }
    rapid.running = false;
    rapid.count = 0;
    rapid.startTime = 0;
  }

  function evaluateAchievements() {
    tryUnlock("first_press", state.pressCount >= 1);
    tryUnlock("presses_100", state.pressCount >= 100);
    tryUnlock("presses_1000", state.pressCount >= 1000);
    tryUnlock("presses_10000", state.pressCount >= 10000);
    tryUnlock("presses_100000", state.pressCount >= 100000);
    tryUnlock("button_addict", stats.today >= 1000);

    var hour = new Date().getHours();
    tryUnlock("night_owl", hour >= 0 && hour < 4);

    var openedCount = 0;
    for (var index = 0; index < PANEL_IDS.length; index += 1) {
      if (openedPanels[PANEL_IDS[index]]) {
        openedCount += 1;
      }
    }
    tryUnlock("curious", openedCount >= PANEL_IDS.length);
  }

  function tryUnlock(id, condition) {
    if (!condition || achievements[id]) {
      return;
    }
    achievements[id] = true;
    saveAchievements();
    renderAchievements();

    var definition = null;
    for (var index = 0; index < ACHIEVEMENTS.length; index += 1) {
      if (ACHIEVEMENTS[index].id === id) {
        definition = ACHIEVEMENTS[index];
      }
    }
    if (!definition) {
      return;
    }

    var item = document.querySelector('.achievement[data-achievement="' + id + '"]');
    if (item) {
      item.classList.add("just-unlocked");
      window.setTimeout(function () {
        item.classList.remove("just-unlocked");
      }, 700);
    }

    showToast("Achievement unlocked", definition.name);
  }

  function showToast(title, subtitle) {
    if (!toastStack) {
      return;
    }
    var toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML =
      '<span class="toast-mark" aria-hidden="true"></span><span><span>' +
      escapeHtml(title) +
      '</span><span class="toast-sub">' +
      escapeHtml(subtitle) +
      "</span></span>";
    toastStack.appendChild(toast);

    window.setTimeout(function () {
      toast.classList.add("is-leaving");
      window.setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 280);
    }, 2600);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensureAudioContext() {
    if (typeof AudioContextConstructor !== "function") {
      return null;
    }
    try {
      if (!audioContext) {
        audioContext = new AudioContextConstructor();
      }
      if (audioContext.state === "suspended") {
        audioContext.resume().catch(function () {});
      }
      return audioContext;
    } catch (error) {
      return null;
    }
  }

  function playPressSound() {
    var profile = state.sound;
    if (!profile || profile === "muted" || typeof AudioContextConstructor !== "function") {
      return;
    }
    if (state.mode === "zen") {
      profile = "soft";
    }

    var context = ensureAudioContext();
    if (!context) {
      return;
    }

    try {
      var now = context.currentTime;

      if (profile === "mechanical") {
        playMechanical(context, now);
      } else if (profile === "soft") {
        playSoft(context, now);
      } else if (profile === "arcade") {
        playArcade(context, now);
      } else if (profile === "click") {
        playClick(context, now);
      }
    } catch (error) {
      state.sound = "muted";
      soundSelect.value = "muted";
      soundSetting.hidden = true;
      savePreference("sound", "muted");
    }
  }

  function playMechanical(context, now) {
    var oscillator = context.createOscillator();
    var body = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(190, now);
    oscillator.frequency.exponentialRampToValueAtTime(82, now + 0.07);
    body.gain.setValueAtTime(0.0001, now);
    body.gain.exponentialRampToValueAtTime(0.14, now + 0.004);
    body.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    oscillator.connect(body);
    body.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.075);
    playNoise(context, now, 0.028, 2400, 0.8, 0.09);
  }

  function playSoft(context, now) {
    var oscillator = context.createOscillator();
    var body = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(150, now);
    oscillator.frequency.exponentialRampToValueAtTime(88, now + 0.1);
    body.gain.setValueAtTime(0.0001, now);
    body.gain.exponentialRampToValueAtTime(0.07, now + 0.012);
    body.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    oscillator.connect(body);
    body.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.12);
    playNoise(context, now, 0.05, 1200, 0.6, 0.03);
  }

  function playArcade(context, now) {
    var oscillator = context.createOscillator();
    var body = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(660, now);
    oscillator.frequency.setValueAtTime(880, now + 0.045);
    body.gain.setValueAtTime(0.0001, now);
    body.gain.exponentialRampToValueAtTime(0.05, now + 0.005);
    body.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    oscillator.connect(body);
    body.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.105);
  }

  function playClick(context, now) {
    playNoise(context, now, 0.014, 3600, 1.1, 0.08);
    var oscillator = context.createOscillator();
    var body = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(1400, now);
    oscillator.frequency.exponentialRampToValueAtTime(700, now + 0.02);
    body.gain.setValueAtTime(0.0001, now);
    body.gain.exponentialRampToValueAtTime(0.04, now + 0.003);
    body.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    oscillator.connect(body);
    body.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.035);
  }

  function playNoise(context, now, duration, frequency, q, peak) {
    var length = Math.max(1, Math.floor(context.sampleRate * duration));
    var buffer = context.createBuffer(1, length, context.sampleRate);
    var data = buffer.getChannelData(0);
    for (var index = 0; index < length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / length);
    }
    var noise = context.createBufferSource();
    noise.buffer = buffer;
    var filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = q;
    var snap = context.createGain();
    snap.gain.setValueAtTime(peak, now);
    snap.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    noise.connect(filter);
    filter.connect(snap);
    snap.connect(context.destination);
    noise.start(now);
  }

  function vibrateOnPress() {
    if (!state.hapticsEnabled || !supportsHaptics) {
      return;
    }
    try {
      navigator.vibrate(10);
    } catch (error) {
      // Unsupported or blocked vibration is intentionally silent.
    }
  }

  function hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16)
    };
  }

  function mixColor(color, target, amount) {
    return {
      r: Math.round(color.r + (target.r - color.r) * amount),
      g: Math.round(color.g + (target.g - color.g) * amount),
      b: Math.round(color.b + (target.b - color.b) * amount)
    };
  }

  function getContrastingInk(color) {
    var whiteContrast = contrastRatio(color, { r: 255, g: 255, b: 255 });
    var darkContrast = contrastRatio(color, { r: 17, g: 17, b: 17 });
    return darkContrast >= whiteContrast ? "#111111" : "#FFFFFF";
  }

  function contrastRatio(first, second) {
    var firstLuminance = relativeLuminance(first);
    var secondLuminance = relativeLuminance(second);
    var lighter = Math.max(firstLuminance, secondLuminance);
    var darker = Math.min(firstLuminance, secondLuminance);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function relativeLuminance(color) {
    return 0.2126 * linearize(color.r / 255) + 0.7152 * linearize(color.g / 255) + 0.0722 * linearize(color.b / 255);
  }

  function linearize(value) {
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  }

  function toHex(color) {
    return "#" + [color.r, color.g, color.b].map(function (value) {
      return value.toString(16).padStart(2, "0");
    }).join("").toUpperCase();
  }
}());
