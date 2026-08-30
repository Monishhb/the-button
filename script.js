(function () {
  "use strict";

  var defaults = {
    pressCount: 0,
    theme: "system",
    buttonColor: "#E53935",
    buttonText: "PRESS ME",
    buttonSize: 320,
    borderRadius: 16,
    depth: 6,
    soundEnabled: false,
    hapticsEnabled: true,
    animationsReduced: false
  };

  var state = loadState();
  var activePress = null;
  var activePanel = null;
  var lastFocusedElement = null;
  var closeTimer = null;
  var releaseTimer = null;
  var shareTimer = null;
  var copyFeedbackTimer = null;
  var suppressClickUntil = 0;
  var audioContext = null;
  var AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  var supportsPointerEvents = "PointerEvent" in window;
  var supportsHaptics = typeof navigator.vibrate === "function";
  var reducedMotionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var systemThemeQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  var pressButton = document.getElementById("press-button");
  var buttonHousing = pressButton ? pressButton.closest(".button-housing") : null;
  var buttonLabel = document.getElementById("button-label");
  var pressCount = document.getElementById("press-count");
  var themeToggle = document.getElementById("theme-toggle");
  var themeName = document.getElementById("theme-name");
  var themeIcon = document.getElementById("theme-icon");
  var themeColorMeta = document.getElementById("theme-color");
  var panelOverlay = document.getElementById("panel-overlay");
  var panelTriggers = document.querySelectorAll("[data-panel]");

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
  var soundToggle = document.getElementById("sound-toggle");
  var hapticsSetting = document.getElementById("haptics-setting");
  var hapticsToggle = document.getElementById("haptics-toggle");
  var animationSetting = document.getElementById("animation-setting");
  var copyLinkButton = document.getElementById("copy-link");

  initialize();

  function initialize() {
    if (!supportsHaptics) {
      hapticsSetting.hidden = true;
      state.hapticsEnabled = false;
    }

    if (typeof AudioContextConstructor !== "function") {
      soundSetting.hidden = true;
      state.soundEnabled = false;
    }

    var hashApplied = applyHashConfig();

    renderAll();
    bindThemeEvents();
    bindCustomizationEvents();
    bindSettingsEvents();
    bindPanelEvents();
    bindPressEvents();
    bindShareEvents();

    if (hashApplied) {
      syncShareHash();
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

  function loadState() {
    var loaded = {
      pressCount: readNumber("pressCount", defaults.pressCount, 0, Number.MAX_SAFE_INTEGER),
      theme: readTheme(),
      buttonColor: readColor(),
      buttonText: readText(),
      buttonSize: readNumber("buttonSize", defaults.buttonSize, 150, 400),
      borderRadius: readNumber("borderRadius", defaults.borderRadius, 0, 200),
      depth: readNumber("depth", defaults.depth, 2, 16),
      soundEnabled: readBoolean("soundEnabled", defaults.soundEnabled),
      hapticsEnabled: readBoolean("hapticsEnabled", defaults.hapticsEnabled),
      animationsReduced: readBoolean("animationsReduced", defaults.animationsReduced)
    };

    return loaded;
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

  function isHexColor(value) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function savePreference(key, value) {
    writeStorage(key, value);
  }

  function renderAll() {
    renderTheme();
    renderButton();
    renderControls();
    renderCount();
    renderMotion();
  }

  function renderTheme() {
    var resolvedTheme = getResolvedTheme();
    var themeLabel = state.theme.charAt(0).toUpperCase() + state.theme.slice(1);

    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    themeName.textContent = themeLabel;
    themeToggle.setAttribute("aria-label", "Theme: " + themeLabel + ". Change theme");
    themeToggle.title = "Theme: " + themeLabel + ". Click to change";
    themeIcon.setAttribute("data-mode", state.theme);
    themeColorMeta.setAttribute("content", resolvedTheme === "dark" ? "#0B0B0A" : "#F2F1ED");
  }

  function getResolvedTheme() {
    if (state.theme === "light" || state.theme === "dark") {
      return state.theme;
    }
    return systemThemeQuery && systemThemeQuery.matches ? "dark" : "light";
  }

  function renderButton() {
    var color = hexToRgb(state.buttonColor);
    var highlight = mixColor(color, { r: 255, g: 255, b: 255 }, 0.24);
    var shade = mixColor(color, { r: 0, g: 0, b: 0 }, 0.17);
    var deepShadow = mixColor(color, { r: 0, g: 0, b: 0 }, 0.38);
    var ink = getContrastingInk(color);

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
    soundToggle.checked = state.soundEnabled;
    hapticsToggle.checked = state.hapticsEnabled;
    animationSetting.value = state.animationsReduced ? "reduced" : "full";
    updateSelectedControls();
  }

  function renderCount() {
    pressCount.textContent = state.pressCount.toLocaleString();
  }

  function renderMotion() {
    document.documentElement.classList.toggle("animations-reduced", shouldReduceMotion());
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
    var index;

    for (index = 0; index < swatches.length; index += 1) {
      swatches[index].classList.toggle("is-selected", swatches[index].getAttribute("data-color").toUpperCase() === state.buttonColor);
    }

    for (index = 0; index < radiusPresets.length; index += 1) {
      radiusPresets[index].classList.toggle("is-selected", Number(radiusPresets[index].getAttribute("data-radius")) === state.borderRadius);
    }
  }

  function bindThemeEvents() {
    themeToggle.addEventListener("click", function () {
      var themes = ["system", "light", "dark"];
      var currentIndex = themes.indexOf(state.theme);
      state.theme = themes[(currentIndex + 1) % themes.length];
      savePreference("theme", state.theme);
      renderTheme();
    });

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
      savePreference("buttonText", state.buttonText);
      renderButton();
      scheduleShareSync();
    });

    sizeSlider.addEventListener("input", function (event) {
      state.buttonSize = clamp(Math.round(Number(event.target.value)), 150, 400);
      savePreference("buttonSize", state.buttonSize);
      renderButton();
      sizeValue.textContent = state.buttonSize + "px";
      radiusValue.textContent = getRadiusLabel();
      updateSelectedControls();
      scheduleShareSync();
    });

    radiusSlider.addEventListener("input", function (event) {
      state.borderRadius = clamp(Math.round(Number(event.target.value)), 0, 200);
      savePreference("borderRadius", state.borderRadius);
      renderButton();
      radiusValue.textContent = getRadiusLabel();
      updateSelectedControls();
      scheduleShareSync();
    });

    depthSlider.addEventListener("input", function (event) {
      state.depth = clamp(Math.round(Number(event.target.value)), 2, 16);
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
        savePreference("borderRadius", state.borderRadius);
        renderButton();
        renderControls();
        scheduleShareSync();
      });
    });

    document.getElementById("reset-appearance").addEventListener("click", function () {
      state.buttonColor = defaults.buttonColor;
      state.buttonText = defaults.buttonText;
      state.buttonSize = defaults.buttonSize;
      state.borderRadius = defaults.borderRadius;
      state.depth = defaults.depth;
      saveAppearancePreferences();
      renderButton();
      renderControls();
      syncShareHash();
    });
  }

  function updateColor(value) {
    if (!isHexColor(value)) {
      return;
    }
    state.buttonColor = value.toUpperCase();
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

  function applyHashConfig() {
    var hash = window.location.hash;
    if (!hash || hash.length < 3) {
      return false;
    }

    var applied = false;
    var pairs = hash.slice(1).split("&");
    for (var index = 0; index < pairs.length; index += 1) {
      var separator = pairs[index].indexOf("=");
      if (separator < 1) {
        continue;
      }
      var key = pairs[index].slice(0, separator);
      var value = pairs[index].slice(separator + 1);

      if (key === "c") {
        var hex = "#" + value.replace(/^#/, "");
        if (isHexColor(hex)) {
          state.buttonColor = hex.toUpperCase();
          applied = true;
        }
      } else if (key === "t") {
        var text = "";
        try {
          text = decodeURIComponent(value);
        } catch (error) {
          text = "";
        }
        if (text.trim() !== "") {
          state.buttonText = text.slice(0, 20);
          applied = true;
        }
      } else if (key === "s" && value !== "") {
        var size = Math.round(Number(value));
        if (Number.isFinite(size)) {
          state.buttonSize = clamp(size, 150, 400);
          applied = true;
        }
      } else if (key === "r" && value !== "") {
        var radius = Math.round(Number(value));
        if (Number.isFinite(radius)) {
          state.borderRadius = clamp(radius, 0, 200);
          applied = true;
        }
      } else if (key === "d" && value !== "") {
        var depth = Math.round(Number(value));
        if (Number.isFinite(depth)) {
          state.depth = clamp(depth, 2, 16);
          applied = true;
        }
      }
    }

    if (applied) {
      saveAppearancePreferences();
    }
    return applied;
  }

  function buildShareHash() {
    var parts = [];
    if (state.buttonColor !== defaults.buttonColor) {
      parts.push("c=" + state.buttonColor.slice(1));
    }
    if (state.buttonText !== defaults.buttonText) {
      parts.push("t=" + encodeURIComponent(state.buttonText));
    }
    if (state.buttonSize !== defaults.buttonSize) {
      parts.push("s=" + state.buttonSize);
    }
    if (state.borderRadius !== defaults.borderRadius) {
      parts.push("r=" + state.borderRadius);
    }
    if (state.depth !== defaults.depth) {
      parts.push("d=" + state.depth);
    }
    return parts.length ? "#" + parts.join("&") : "";
  }

  function syncShareHash() {
    try {
      var nextHash = buildShareHash();
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search + nextHash);
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
      syncShareHash();
    }, 150);
  }

  function bindShareEvents() {
    if (copyLinkButton) {
      copyLinkButton.addEventListener("click", function () {
        syncShareHash();
        var showFeedback = function (message) {
          copyLinkButton.textContent = message;
          if (copyFeedbackTimer) {
            window.clearTimeout(copyFeedbackTimer);
          }
          copyFeedbackTimer = window.setTimeout(function () {
            copyLinkButton.textContent = "Copy share link";
            copyFeedbackTimer = null;
          }, 1600);
        };
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          navigator.clipboard.writeText(window.location.href).then(function () {
            showFeedback("Copied to clipboard");
          }, function () {
            showFeedback("Link is in the address bar");
          });
        } else {
          showFeedback("Link is in the address bar");
        }
      });
    }

    window.addEventListener("hashchange", function () {
      if (applyHashConfig()) {
        renderButton();
        renderControls();
      }
    });
  }

  function bindSettingsEvents() {
    soundToggle.addEventListener("change", function () {
      state.soundEnabled = soundToggle.checked;
      savePreference("soundEnabled", state.soundEnabled);
    });

    hapticsToggle.addEventListener("change", function () {
      state.hapticsEnabled = hapticsToggle.checked;
      savePreference("hapticsEnabled", state.hapticsEnabled);
    });

    animationSetting.addEventListener("change", function () {
      state.animationsReduced = animationSetting.value === "reduced";
      savePreference("animationsReduced", state.animationsReduced);
      renderMotion();
    });

    document.getElementById("reset-everything").addEventListener("click", function () {
      clearStorage();
      state = copyDefaults();
      if (!supportsHaptics) {
        state.hapticsEnabled = false;
      }
      if (typeof AudioContextConstructor !== "function") {
        state.soundEnabled = false;
      }
      renderAll();
      syncShareHash();
    });
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
      soundEnabled: defaults.soundEnabled,
      hapticsEnabled: defaults.hapticsEnabled,
      animationsReduced: defaults.animationsReduced
    };
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
    }, 260);

    if (focusTarget && typeof focusTarget.focus === "function") {
      focusTarget.focus();
    }
  }

  function updateTriggerStates() {
    panelTriggers.forEach(function (trigger) {
      trigger.setAttribute("aria-expanded", String(activePanel && trigger.getAttribute("data-panel") === activePanel.id));
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

    pressButton.addEventListener("keydown", handleKeyDown);
    pressButton.addEventListener("keyup", handleKeyUp);
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

  function handleKeyDown(event) {
    if (!isActivationKey(event.key)) {
      return;
    }
    event.preventDefault();
    if (event.repeat || activePress) {
      return;
    }
    beginPress("keyboard", event.key);
  }

  function handleKeyUp(event) {
    if (!isActivationKey(event.key)) {
      return;
    }
    event.preventDefault();
    if (activePress && activePress.source === "keyboard") {
      finishPress(false);
    }
  }

  function isActivationKey(key) {
    return key === "Enter" || key === " " || key === "Spacebar" || key === "Space";
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
    playClickSound();
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
      state.pressCount += 1;
      renderCount();
      savePreference("pressCount", state.pressCount);
      if (!shouldReduceMotion()) {
        pressCount.classList.remove("tick");
        void pressCount.offsetWidth;
        pressCount.classList.add("tick");
      }
    }

    releaseTimer = window.setTimeout(function () {
      pressButton.classList.remove("is-releasing");
      releaseTimer = null;
    }, shouldReduceMotion() ? 100 : 320);
  }

  function cancelActivePress() {
    if (activePress) {
      finishPress(true);
    }
  }

  function playClickSound() {
    if (!state.soundEnabled || typeof AudioContextConstructor !== "function") {
      return;
    }

    try {
      if (!audioContext) {
        audioContext = new AudioContextConstructor();
      }
      if (audioContext.state === "suspended") {
        audioContext.resume().catch(function () {});
      }

      var now = audioContext.currentTime;

      var oscillator = audioContext.createOscillator();
      var body = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(190, now);
      oscillator.frequency.exponentialRampToValueAtTime(82, now + 0.07);
      body.gain.setValueAtTime(0.0001, now);
      body.gain.exponentialRampToValueAtTime(0.14, now + 0.004);
      body.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      oscillator.connect(body);
      body.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.075);

      var length = Math.max(1, Math.floor(audioContext.sampleRate * 0.028));
      var buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
      var data = buffer.getChannelData(0);
      for (var index = 0; index < length; index += 1) {
        data[index] = (Math.random() * 2 - 1) * (1 - index / length);
      }
      var noise = audioContext.createBufferSource();
      noise.buffer = buffer;
      var filter = audioContext.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 2400;
      filter.Q.value = 0.8;
      var snap = audioContext.createGain();
      snap.gain.setValueAtTime(0.09, now);
      snap.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);
      noise.connect(filter);
      filter.connect(snap);
      snap.connect(audioContext.destination);
      noise.start(now);
    } catch (error) {
      state.soundEnabled = false;
      soundToggle.checked = false;
      soundSetting.hidden = true;
      savePreference("soundEnabled", false);
    }
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
