import { DefaultConfig, loadConfig, saveConfig, normalizeConfig } from "../../core/config";
import { emitConfigUpdate, onConfigUpdate } from "../../tauri/events";
import { getAllTails } from "../../core/tails";

let currentConfig = loadConfig();

function broadcastUpdate() {
  saveConfig(currentConfig);
  console.log("[settings] Emitting config-update", currentConfig);
  emitConfigUpdate(currentConfig);
}
}

  effectCards.innerHTML = "";
  const tails = getAllTails();
  // Always normalize config before using
  currentConfig = normalizeConfig(currentConfig);
  let selectedId = tails.some(t => t.id === currentConfig.tailId)
    ? currentConfig.tailId
    : tails[0].id;
  if (selectedId !== currentConfig.tailId) {
    currentConfig.tailId = selectedId;
    broadcastUpdate();
  }
  tails.forEach((tail) => {
    const label = document.createElement("label");
    label.className =
      "radio-card" + (tail.id === currentConfig.tailId ? " selected" : "");

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "tailId";
    input.value = tail.id;
    input.id = `effect-radio-${tail.id}`;
    if (tail.id === currentConfig.tailId) input.checked = true;

    input.addEventListener("change", (e) => {
      if ((e.target as HTMLInputElement).checked) {
        currentConfig.tailId = tail.id;
        broadcastUpdate();
        renderEffectCards();
      }
    });

    const cardContent = document.createElement("div");
    cardContent.className = "card-content";

    const icon = document.createElement("div");
    icon.className = "icon";
    icon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17a10 10 0 0 0-20 0"></path><path d="M6 17a6 6 0 0 1 12 0"></path><path d="M10 17a2 2 0 0 1 4 0"></path></svg>`;

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

const effectCards = document.getElementById("effect-cards") as HTMLDivElement;
  renderEffectCards();
import { ThemeRegistry } from "../../core/config/themes";

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

    input.addEventListener("change", (e) => {
      if ((e.target as HTMLInputElement).checked) {
        currentConfig.themeId = theme.id as typeof currentConfig.themeId;
        broadcastUpdate();
        renderThemeSwatches();
      }
    });

    const swatchWrapper = document.createElement("div");
    swatchWrapper.className = "swatch-wrapper";
    const swatch = document.createElement("div");
    swatch.className = "swatch";
    const [r, g, b] = theme.rgb;
    const color = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
    swatch.style.background = color;
    swatch.style.boxShadow = `0 0 12px rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 0.4)`;
    swatchWrapper.appendChild(swatch);

    const name = document.createElement("span");
    name.textContent = theme.name;

    label.appendChild(input);
    label.appendChild(swatchWrapper);
    label.appendChild(name);
    swatches.appendChild(label);
  });
}
const sizeSlider = document.getElementById("size-slider") as HTMLInputElement;
const lengthSlider = document.getElementById(
  "length-slider",
) as HTMLInputElement;
const opacitySlider = document.getElementById(
  "opacity-slider",
) as HTMLInputElement;
const sizeVal = document.getElementById("size-val") as HTMLDivElement;
const lengthVal = document.getElementById("length-val") as HTMLDivElement;
const opacityVal = document.getElementById("opacity-val") as HTMLDivElement;
const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
const navItems = document.querySelectorAll<HTMLLIElement>(".nav-item");
const tabPanes = document.querySelectorAll<HTMLDivElement>(".tab-pane");

function initUI() {
  renderEffectCards();
  renderThemeSwatches();
  sizeSlider.value = currentConfig.sizeMultiplier.toString();
  lengthSlider.value = currentConfig.lengthMultiplier.toString();
  opacitySlider.value = currentConfig.opacityMultiplier.toString();
  updateLabels();
}

function updateLabels() {
  sizeVal.innerText = `${currentConfig.sizeMultiplier.toFixed(1)}x`;
  lengthVal.innerText = `${currentConfig.lengthMultiplier.toFixed(1)}x`;
  opacityVal.innerText = `${currentConfig.opacityMultiplier.toFixed(1)}x`;
}

sizeSlider.addEventListener("input", (e) => {
  currentConfig.sizeMultiplier = Number.parseFloat(
    (e.target as HTMLInputElement).value,
  );
  updateLabels();
});
sizeSlider.addEventListener("change", () => broadcastUpdate());

lengthSlider.addEventListener("input", (e) => {
  currentConfig.lengthMultiplier = Number.parseFloat(
    (e.target as HTMLInputElement).value,
  );
  updateLabels();
});
lengthSlider.addEventListener("change", () => broadcastUpdate());

opacitySlider.addEventListener("input", (e) => {
  currentConfig.opacityMultiplier = Number.parseFloat(
    (e.target as HTMLInputElement).value,
  );
  updateLabels();
});
opacitySlider.addEventListener("change", () => broadcastUpdate());

// Tabs
navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navItems.forEach((n) => n.classList.remove("active"));
    tabPanes.forEach((t) => t.classList.remove("active"));

    item.classList.add("active");
    const target = (item as HTMLElement).dataset.target;
    if (target) {
      document.getElementById(target)?.classList.add("active");
    }
  });
});

// Reset
resetBtn.addEventListener("click", () => {
  currentConfig = { ...DefaultConfig };
  initUI();
  broadcastUpdate();
});

// Sync from changes that might happen externally
onConfigUpdate((config) => {
  currentConfig = normalizeConfig(config);
  initUI();
});

document.addEventListener("DOMContentLoaded", () => {
  broadcastUpdate();
  initUI();
});
