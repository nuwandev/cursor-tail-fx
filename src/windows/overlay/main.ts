import { listen } from "@tauri-apps/api/event";
import { Events } from "../../contracts/events";
import { loadConfig, DefaultConfig } from "../../core/config";
import { getTailSafe } from "../../core/tails";
import { TailEngine } from "../../core/tails/TailEngine";

let currentEngine: TailEngine | null = null;
let currentConfig = loadConfig();

function createEngine(tailId: string, canvas: HTMLCanvasElement): TailEngine {
  const TailClass = getTailSafe(tailId);
  const tail = new TailClass(canvas);
  // Map config to legacy shape if needed
  const legacyConfig = {
    ...currentConfig,
    effect: currentConfig.tailId,
    theme: currentConfig.themeId,
  };
  tail.updateConfig(legacyConfig);
  return new TailEngine(tail);
}

async function init() {
  try {
    const canvas = document.getElementById("trail-canvas") as HTMLCanvasElement;
    if (!canvas) throw new Error("Could not find trail-canvas element");

    currentEngine = createEngine(currentConfig.tailId, canvas);

    // Listen to Configuration Updates
    listen(Events.ConfigUpdate, (event) => {
      const payload =
        typeof event.payload === "object" && event.payload !== null
          ? event.payload
          : {};
      const newConfig = { ...DefaultConfig, ...payload };
      if (newConfig.tailId === currentConfig.tailId) {
        // Map config to legacy shape if needed
        const legacyConfig = {
          ...newConfig,
          effect: newConfig.tailId,
          theme: newConfig.themeId,
        };
        currentEngine?.updateConfig(legacyConfig);
      } else {
        if (currentEngine) currentEngine.destroy();
        currentEngine = createEngine(newConfig.tailId, canvas);
      }
      currentConfig = newConfig;
    });

    // Listen to IPC Mouse Move
    listen<[number, number]>(Events.CursorMove, (event) => {
      const [nx, ny] = event.payload;
      currentEngine?.updateMouse(nx * canvas.width, ny * canvas.height);
    });
  } catch (err) {
    console.error("CRITICAL OVERLAY ERROR:", err);
  }
}

document.addEventListener("DOMContentLoaded", init);
