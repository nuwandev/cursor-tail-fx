import { emit } from "@tauri-apps/api/event";
import { AppConfig, DEFAULT_CONFIG } from "./config";

document.addEventListener("DOMContentLoaded", () => {
    let currentConfig: AppConfig = { ...DEFAULT_CONFIG };

    const emitConfig = async () => {
        await emit("config-update", currentConfig);
    };

    // Theme Buttons
    const buttons = document.querySelectorAll<HTMLButtonElement>(".theme-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            currentConfig.theme = btn.getAttribute("data-theme") as AppConfig["theme"];
            emitConfig();
        });
    });

    // Sliders
    const opacitySlider = document.getElementById("opacity") as HTMLInputElement;
    const opacityVal = document.getElementById("opacity-val") as HTMLSpanElement;
    opacitySlider.addEventListener("input", (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        opacityVal.textContent = `${Math.round(val * 100)}%`;
        currentConfig.opacityMultiplier = val;
        emitConfig();
    });

    const lengthSlider = document.getElementById("length") as HTMLInputElement;
    const lengthVal = document.getElementById("length-val") as HTMLSpanElement;
    lengthSlider.addEventListener("input", (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        lengthVal.textContent = `${val.toFixed(1)}x`;
        currentConfig.lengthMultiplier = val;
        emitConfig();
    });

    const sizeSlider = document.getElementById("size") as HTMLInputElement;
    const sizeVal = document.getElementById("size-val") as HTMLSpanElement;
    sizeSlider.addEventListener("input", (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        sizeVal.textContent = `${val.toFixed(1)}x`;
        currentConfig.sizeMultiplier = val;
        emitConfig();
    });
});
