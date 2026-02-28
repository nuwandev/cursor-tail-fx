import { emit } from "@tauri-apps/api/event";

document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll<HTMLButtonElement>(".theme-btn");

    buttons.forEach(btn => {
        btn.addEventListener("click", async () => {
            // Update active state
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // Emit event to be picked up by main.ts
            const theme = btn.getAttribute("data-theme");
            await emit("style-update", { theme });
        });
    });
});
