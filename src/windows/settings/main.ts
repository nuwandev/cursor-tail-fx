import { emit } from "@tauri-apps/api/event";
import { AppConfig, DEFAULT_CONFIG } from "../../config";

document.addEventListener("DOMContentLoaded", () => {
    let currentConfig: AppConfig = { ...DEFAULT_CONFIG };

    const emitConfig = async () => {
        await emit("config-update", currentConfig);
    };

    // Tab Navigation
    const tabs = document.querySelectorAll<HTMLDivElement>(".tab");
    const contents = document.querySelectorAll<HTMLDivElement>(".tab-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            contents.forEach(c => c.classList.remove("active"));

            tab.classList.add("active");
            const target = document.getElementById(tab.getAttribute("data-target")!);
            if (target) {
                target.classList.add("active");
            }
        });
    });

    // --- Looks Tab ---
    // Theme Buttons
    const themeBtns = document.querySelectorAll<HTMLButtonElement>(".theme-btn");
    themeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            themeBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            currentConfig.theme = btn.getAttribute("data-theme") as AppConfig["theme"];
            emitConfig();
        });
    });

    // Effect Buttons
    const effectBtns = document.querySelectorAll<HTMLButtonElement>(".effect-btn");
    effectBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            effectBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            currentConfig.effect = btn.getAttribute("data-effect") as AppConfig["effect"];
            emitConfig();
        });
    });


    // --- Tuning Tab ---
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
