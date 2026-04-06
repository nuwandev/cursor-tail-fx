import { DefaultConfig, loadConfig, saveConfig, normalizeConfig } from "@/shared/config";
import { emitConfigUpdate, onConfigUpdate } from "@/shared/ipc/events";
import { getAllTails } from "@/features/tails";
import { ThemeRegistry } from "@/shared/config/themes";
import { checkForUpdates } from "@/shared/updater";
import { openUrl } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";

let currentConfig = loadConfig();

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
  saveConfig(currentConfig);
  emitConfigUpdate(currentConfig);
}

function renderEffectCards() {
  const effectCards = document.getElementById("effect-cards") as HTMLDivElement;
  effectCards.innerHTML = "";

  const tails = getAllTails();
  currentConfig = normalizeConfig(currentConfig);

  // If saved tail no longer exists (e.g. file deleted), fall back to first
  const validId = tails.some((t) => t.id === currentConfig.tailId)
    ? currentConfig.tailId
    : (tails[0]?.id ?? "comet");

  if (validId !== currentConfig.tailId) {
    currentConfig.tailId = validId;
    broadcastUpdate();
  }

  tails.forEach((tail) => {
    const label = document.createElement("label");
    label.className = "radio-card";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "tailId";
    input.value = tail.id;
    input.id = `effect-radio-${tail.id}`;
    if (tail.id === currentConfig.tailId) input.checked = true;

    input.addEventListener("change", () => {
      if (input.checked) {
        currentConfig.tailId = tail.id;
        broadcastUpdate();
        // Update selected state without full re-render (avoid flash)
        document.querySelectorAll(".radio-card input[type=radio]").forEach((r) => {
          const content = (r as HTMLInputElement).parentElement?.querySelector(".card-content");
          content?.classList.toggle("_checked", (r as HTMLInputElement).checked);
        });
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
    if (theme.id === currentConfig.themeId) input.checked = true;

    input.addEventListener("change", () => {
      if (input.checked) {
        currentConfig.themeId = theme.id;
        broadcastUpdate();
      }
    });

    const [r, g, b] = theme.rgb;
    const r255 = Math.round(r * 255);
    const g255 = Math.round(g * 255);
    const b255 = Math.round(b * 255);
    const color = `rgb(${r255}, ${g255}, ${b255})`;
    const glow = `rgba(${r255}, ${g255}, ${b255}, 0.5)`;

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
  sizeVal.innerText = `${currentConfig.sizeMultiplier.toFixed(1)}×`;
  lengthVal.innerText = `${currentConfig.lengthMultiplier.toFixed(1)}×`;
  opacityVal.innerText = `${currentConfig.opacityMultiplier.toFixed(1)}×`;
}

function syncSliders() {
  sizeSlider.value = currentConfig.sizeMultiplier.toString();
  lengthSlider.value = currentConfig.lengthMultiplier.toString();
  opacitySlider.value = currentConfig.opacityMultiplier.toString();
  updateLabels();
}

sizeSlider.addEventListener("input", (e) => {
  currentConfig.sizeMultiplier = parseFloat((e.target as HTMLInputElement).value);
  updateLabels();
});
sizeSlider.addEventListener("change", () => broadcastUpdate());

lengthSlider.addEventListener("input", (e) => {
  currentConfig.lengthMultiplier = parseFloat((e.target as HTMLInputElement).value);
  updateLabels();
});
lengthSlider.addEventListener("change", () => broadcastUpdate());

opacitySlider.addEventListener("input", (e) => {
  currentConfig.opacityMultiplier = parseFloat((e.target as HTMLInputElement).value);
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
    "Reset all settings to defaults? This will apply immediately.",
  );
  if (!confirmed) return;

  currentConfig = { ...DefaultConfig };
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
  currentConfig = normalizeConfig(config);
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
