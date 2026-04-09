import { configManager } from "@/shared/config";
import { emitConfigUpdate, onConfigUpdate } from "@/shared/ipc/events";
import { getAllTails } from "@/features/tails";
import { ThemeRegistry } from "@/shared/config/themes";
import { openUrl } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";
import { PreviewManager } from "./PreviewManager";

let activeTailId = configManager.getState().activeTailId;
let currentTailConfig = configManager.getTailConfig(activeTailId);

const previewManager = new PreviewManager();

const REPO_URL = "https://github.com/nuwandev/cursor-tail-fx";

const tailToggleBtn = document.getElementById("tail-toggle-btn") as HTMLButtonElement | null;

function syncTailToggleButton(): void {
  if (!tailToggleBtn) return;
  const enabled = configManager.getState().tailEnabled !== false;
  tailToggleBtn.textContent = enabled ? "Disable Tail Effect" : "Enable Tail Effect";
}

function broadcastUpdate() {
  emitConfigUpdate(configManager.getState());
}

tailToggleBtn?.addEventListener("click", () => {
  const current = configManager.getState();
  configManager.setTailEnabled(!current.tailEnabled);
  syncTailToggleButton();
  broadcastUpdate();
});

function handleTailSwitch(tailId: string) {
  configManager.setActiveTailId(tailId);
  activeTailId = tailId;
  currentTailConfig = configManager.getTailConfig(tailId);

  previewManager.destroyAll();
  renderEffectCards();

  void (async () => {
    await previewManager.init(document.getElementById("effect-cards")!);
    previewManager.startAll();
  })();

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

    const canvas = document.createElement("canvas");
    canvas.className = "tail-preview-canvas";
    canvas.width = 280;
    canvas.height = 100;
    canvas.dataset.tailId = tail.id;

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
    cardContent.appendChild(canvas);
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
        previewManager.updateConfigForId(activeTailId, currentTailConfig);
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
  const val = Number.parseFloat((e.target as HTMLInputElement).value);
  configManager.updateTailConfig(activeTailId, { sizeMultiplier: val });
  currentTailConfig = configManager.getTailConfig(activeTailId);
  updateLabels();
  previewManager.updateConfigForId(activeTailId, currentTailConfig);
});
sizeSlider.addEventListener("change", () => broadcastUpdate());

lengthSlider.addEventListener("input", (e) => {
  const val = Number.parseFloat((e.target as HTMLInputElement).value);
  configManager.updateTailConfig(activeTailId, { lengthMultiplier: val });
  currentTailConfig = configManager.getTailConfig(activeTailId);
  updateLabels();
  previewManager.updateConfigForId(activeTailId, currentTailConfig);
});
lengthSlider.addEventListener("change", () => broadcastUpdate());

opacitySlider.addEventListener("input", (e) => {
  const val = Number.parseFloat((e.target as HTMLInputElement).value);
  configManager.updateTailConfig(activeTailId, { opacityMultiplier: val });
  currentTailConfig = configManager.getTailConfig(activeTailId);
  updateLabels();
  previewManager.updateConfigForId(activeTailId, currentTailConfig);
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
    "Reset the settings for THIS tail to defaults? This will apply immediately.",
  );
  if (!confirmed) return;

  configManager.resetTailConfig(activeTailId);
  currentTailConfig = configManager.getTailConfig(activeTailId);

  previewManager.destroyAll();
  renderEffectCards();
  void (async () => {
    await previewManager.init(document.getElementById("effect-cards")!);
    previewManager.startAll();
  })();

  renderThemeSwatches();
  syncSliders();
  broadcastUpdate();
});

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

  previewManager.destroyAll();
  renderEffectCards();
  void (async () => {
    await previewManager.init(document.getElementById("effect-cards")!);
    previewManager.startAll();
  })();

  renderThemeSwatches();
  syncSliders();
  syncTailToggleButton();
});

// ─── Init ─────────────────────────────────────────────────────────
async function initPreviews() {
  const container = document.getElementById("effect-cards")!;
  await previewManager.init(container);
  previewManager.startAll();
}

window.addEventListener("beforeunload", () => {
  previewManager.destroyAll();
});

document.addEventListener("DOMContentLoaded", () => {
  renderEffectCards();
  void initPreviews();
  renderThemeSwatches();
  syncSliders();
  syncTailToggleButton();
  broadcastUpdate();
});
