import { configManager } from "@/shared/config";
import { emitConfigUpdate, onConfigUpdate } from "@/shared/ipc/events";
import { getAllTails } from "@/features/tails";
import { ThemeRegistry } from "@/shared/config/themes";
import { checkForUpdates } from "@/shared/updater";
import { openUrl } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";

// Keep a local cached view of the current tail config being edited safely cloned from state manager
let activeTailId = configManager.getState().activeTailId;
let currentTailConfig = configManager.getTailConfig(activeTailId);

const REPO_URL = "https://github.com/nuwandev/cursor-tail-fx";

// Icons keyed by tail id — fallback to generic sparkle if unknown
const TAIL_ICONS: Record<string, string> = {
  comet: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 22L12 18L22 22L12 2Z"/></svg>`,
  orb: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>`,
  sparkle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1"/></svg>`,
  bubble: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/><circle cx="15" cy="11" r="1" fill="currentColor"/></svg>`,
};

const GENERIC_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg>`;

function broadcastUpdate() {
  emitConfigUpdate(configManager.getState());
}

function handleTailSwitch(tailId: string) {
  configManager.setActiveTailId(tailId);
  activeTailId = tailId;
  currentTailConfig = configManager.getTailConfig(tailId);
  
  renderEffectCards();
  renderThemeSwatches();
  syncSliders();
  broadcastUpdate();
}

function renderEffectCards() {
  const effectCards = document.getElementById("effect-cards") as HTMLDivElement;
  effectCards.innerHTML = "";

  const tails = getAllTails();

  // If saved tail no longer exists, fall back to first safely
  const validId = tails.some((t) => t.id === activeTailId)
    ? activeTailId
    : (tails[0]?.id ?? "comet");

  if (validId !== activeTailId) {
    handleTailSwitch(validId);
    return;
  }

  tails.forEach((tail) => {
    const label = document.createElement("label");
    label.className = "radio-card";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "tailId";
    input.value = tail.id;
    input.id = `effect-radio-${tail.id}`;
    if (tail.id === activeTailId) input.checked = true;

    input.addEventListener("change", () => {
      if (input.checked) {
        handleTailSwitch(tail.id);
      }
    });

    const cardContent = document.createElement("div");
    cardContent.className = "card-content";

    const icon = document.createElement("div");
    icon.className = "card-icon";
    icon.innerHTML = TAIL_ICONS[tail.id] ?? GENERIC_ICON;

    const info = document.createElement("div");
    info.className = "card-info";

    const title = document.createElement("span");
    title.className = "card-title";
    title.textContent = tail.name;

    const desc = document.createElement("span");
    desc.className = "card-desc";
    desc.textContent = tail.description;

    info.appendChild(title);
    info.appendChild(desc);
    cardContent.appendChild(icon);
    cardContent.appendChild(info);
    label.appendChild(input);
    label.appendChild(cardContent);
    effectCards.appendChild(label);
  });
}

function renderThemeSwatches() {
  const swatches = document.getElementById("theme-swatches") as HTMLDivElement;
  swatches.innerHTML = "";

  ThemeRegistry.forEach((theme) => {
    const label = document.createElement("label");
    label.className = "swatch-container";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "theme";
    input.value = theme.id;
    if (theme.id === currentTailConfig.themeId) input.checked = true;

    input.addEventListener("change", () => {
      if (input.checked) {
        configManager.updateTailConfig(activeTailId, { themeId: theme.id });
        currentTailConfig = configManager.getTailConfig(activeTailId);
        broadcastUpdate();
      }
    });

    const [r, g, b] = theme.rgb;
    const color = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
    const glow = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 0.5)`;

    const wrapper = document.createElement("div");
    wrapper.className = "swatch-wrapper";

    const swatch = document.createElement("div");
    swatch.className = "swatch";
    swatch.style.background = color;
    swatch.style.boxShadow = `0 0 10px ${glow}`;

    wrapper.appendChild(swatch);
    const name = document.createElement("span");
    name.textContent = theme.name;

    label.appendChild(input);
    label.appendChild(wrapper);
    label.appendChild(name);
    swatches.appendChild(label);
  });
}

// ─── Slider elements ──────────────────────────────────────────────
const sizeSlider = document.getElementById("size-slider") as HTMLInputElement;
const lengthSlider = document.getElementById("length-slider") as HTMLInputElement;
const opacitySlider = document.getElementById("opacity-slider") as HTMLInputElement;
const sizeVal = document.getElementById("size-val") as HTMLElement;
const lengthVal = document.getElementById("length-val") as HTMLElement;
const opacityVal = document.getElementById("opacity-val") as HTMLElement;

function updateLabels() {
  sizeVal.innerText = `${currentTailConfig.sizeMultiplier.toFixed(1)}×`;
  lengthVal.innerText = `${currentTailConfig.lengthMultiplier.toFixed(1)}×`;
  opacityVal.innerText = `${currentTailConfig.opacityMultiplier.toFixed(1)}×`;
}

function syncSliders() {
  sizeSlider.value = currentTailConfig.sizeMultiplier.toString();
  lengthSlider.value = currentTailConfig.lengthMultiplier.toString();
  opacitySlider.value = currentTailConfig.opacityMultiplier.toString();
  updateLabels();
}

sizeSlider.addEventListener("input", (e) => {
  const val = parseFloat((e.target as HTMLInputElement).value);
  configManager.updateTailConfig(activeTailId, { sizeMultiplier: val });
  currentTailConfig = configManager.getTailConfig(activeTailId);
  updateLabels();
});
sizeSlider.addEventListener("change", () => broadcastUpdate());

lengthSlider.addEventListener("input", (e) => {
  const val = parseFloat((e.target as HTMLInputElement).value);
  configManager.updateTailConfig(activeTailId, { lengthMultiplier: val });
  currentTailConfig = configManager.getTailConfig(activeTailId);
  updateLabels();
});
lengthSlider.addEventListener("change", () => broadcastUpdate());

opacitySlider.addEventListener("input", (e) => {
  const val = parseFloat((e.target as HTMLInputElement).value);
  configManager.updateTailConfig(activeTailId, { opacityMultiplier: val });
  currentTailConfig = configManager.getTailConfig(activeTailId);
  updateLabels();
});
opacitySlider.addEventListener("change", () => broadcastUpdate());

// ─── Tabs ─────────────────────────────────────────────────────────
document.querySelectorAll<HTMLElement>(".nav-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach((t) => t.classList.remove("active"));
    item.classList.add("active");
    const target = item.dataset.target;
    if (target) document.getElementById(target)?.classList.add("active");
  });
});

// ─── Reset ────────────────────────────────────────────────────────
document.getElementById("reset-btn")?.addEventListener("click", () => {
  const confirmed = globalThis.confirm(
    "Reset the settings for THIS tail to defaults? This will apply immediately."
  );
  if (!confirmed) return;

  configManager.resetTailConfig(activeTailId);
  currentTailConfig = configManager.getTailConfig(activeTailId);
  renderEffectCards();
  renderThemeSwatches();
  syncSliders();
  broadcastUpdate();
});

// ─── Updates ─────────────────────────────────────────────────────
{
  const btn = document.getElementById("check-updates-btn") as HTMLButtonElement | null;
  btn?.addEventListener("click", () => {
    const prevText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Checking…";

    void checkForUpdates({ source: "settings", showNoUpdateDialog: true }).finally(() => {
      btn.disabled = false;
      btn.textContent = prevText;
    });
  });
}

document.getElementById("open-repo-btn")?.addEventListener("click", () => {
  void (async () => {
    try {
      await openUrl(REPO_URL);
    } catch (err) {
      console.error("Failed to open repo link:", err);
      globalThis.alert("Could not open the GitHub repo.");
    }
  })();
});

document.getElementById("quit-btn")?.addEventListener("click", () => {
  void (async () => {
    try {
      await invoke("quit_app");
    } catch (err) {
      console.error("Failed to quit app:", err);
      globalThis.alert("Could not quit the app.");
    }
  })();
});

// ─── Sync from external config changes ───────────────────────────
onConfigUpdate((config) => {
  configManager.applyExternalConfig(config);
  activeTailId = configManager.getState().activeTailId;
  currentTailConfig = configManager.getTailConfig(activeTailId);

  renderEffectCards();
  renderThemeSwatches();
  syncSliders();
});

// ─── Init ─────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderEffectCards();
  renderThemeSwatches();
  syncSliders();
  broadcastUpdate();
});
