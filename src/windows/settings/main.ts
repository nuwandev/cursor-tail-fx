import { emit, listen } from "@tauri-apps/api/event";
import {
  AppConfig,
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
} from "../../config";
import { getAllTails } from "../../core/tails";

let currentConfig: AppConfig = loadConfig();

// Dynamic tail effect UI
const effectCards = document.getElementById("effect-cards") as HTMLDivElement;
const themeRadios = document.querySelectorAll<HTMLInputElement>(
  'input[name="theme"]',
);

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

function broadcastUpdate() {
  saveConfig(currentConfig);
  emit("config-update", currentConfig);
}

function renderEffectCards() {
  effectCards.innerHTML = "";
  const tails = getAllTails();
  tails.forEach((tail) => {
    // Outer label
    const label = document.createElement("label");
    label.className =
      "radio-card" + (tail.id === currentConfig.effect ? " selected" : "");

    // Radio input
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "effect";
    input.value = tail.id;
    input.id = `effect-radio-${tail.id}`;
    if (tail.id === currentConfig.effect) input.checked = true;

    input.addEventListener("change", (e) => {
      if ((e.target as HTMLInputElement).checked) {
        currentConfig.effect = tail.id as typeof currentConfig.effect;
        broadcastUpdate();
        renderEffectCards(); // re-render to update selected style
      }
    });

    // Card content
    const cardContent = document.createElement("div");
    cardContent.className = "card-content";

    // Icon (placeholder SVG, can be customized per tail in future)
    const icon = document.createElement("div");
    icon.className = "icon";
    icon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17a10 10 0 0 0-20 0"></path><path d="M6 17a6 6 0 0 1 12 0"></path><path d="M10 17a2 2 0 0 1 4 0"></path></svg>`;

    // Info
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

function initUI() {
  renderEffectCards();
  themeRadios.forEach((r) => (r.checked = r.value === currentConfig.theme));

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

themeRadios.forEach((radio) => {
  radio.addEventListener("change", (e) => {
    if ((e.target as HTMLInputElement).checked) {
      currentConfig.theme = (e.target as HTMLInputElement).value as any;
      broadcastUpdate();
    }
  });
});

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
  currentConfig = { ...DEFAULT_CONFIG };
  initUI();
  broadcastUpdate();
});

// Sync from changes that might happen externally
listen<AppConfig>("config-update", (event) => {
  currentConfig = event.payload;
  initUI();
});

document.addEventListener("DOMContentLoaded", () => {
  broadcastUpdate();
  initUI();
});
