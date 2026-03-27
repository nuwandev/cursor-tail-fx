import { emit, listen } from "@tauri-apps/api/event";
import { AppConfig, DEFAULT_CONFIG, loadConfig, saveConfig } from "../../config";

let currentConfig: AppConfig = loadConfig();

// Input Elements
const effectRadios = document.querySelectorAll<HTMLInputElement>('input[name="effect"]');
const themeRadios = document.querySelectorAll<HTMLInputElement>('input[name="theme"]');

const sizeSlider = document.getElementById("size-slider") as HTMLInputElement;
const lengthSlider = document.getElementById("length-slider") as HTMLInputElement;
const opacitySlider = document.getElementById("opacity-slider") as HTMLInputElement;

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

function initUI() {
  effectRadios.forEach(r => r.checked = r.value === currentConfig.effect);
  themeRadios.forEach(r => r.checked = r.value === currentConfig.theme);

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

// BINDINGS
effectRadios.forEach(radio => {
  radio.addEventListener("change", (e) => {
    if ((e.target as HTMLInputElement).checked) {
      currentConfig.effect = (e.target as HTMLInputElement).value as any;
      broadcastUpdate();
    }
  });
});

themeRadios.forEach(radio => {
  radio.addEventListener("change", (e) => {
    if ((e.target as HTMLInputElement).checked) {
      currentConfig.theme = (e.target as HTMLInputElement).value as any;
      broadcastUpdate();
    }
  });
});

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

// Tabs
navItems.forEach(item => {
  item.addEventListener("click", () => {
    navItems.forEach(n => n.classList.remove("active"));
    tabPanes.forEach(t => t.classList.remove("active"));

    item.classList.add("active");
    const target = item.getAttribute("data-target");
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
