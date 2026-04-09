import {
  emitConfigUpdate,
  onConfigUpdate,
  onCursorMove,
  onTrayToggleTail,
} from "@/shared/ipc/events";
import { configManager } from "@/shared/config";
import { Renderer } from "@/features/tails/Renderer";
import { invoke } from "@tauri-apps/api/core";

let renderer: Renderer | null = null;
let tailEnabled = true;
let canvasEl: HTMLCanvasElement | null = null;

async function syncBackendTailEnabled(enabled: boolean): Promise<void> {
  try {
    await invoke("set_tail_enabled", { enabled });
  } catch (err) {
    console.warn("Failed to sync tail enabled state to backend:", err);
  }
}

function stopOverlayRendering(): void {
  try {
    renderer?.destroy();
  } finally {
    renderer = null;
  }

  // Shrink + clear the canvas without touching WebGL APIs (avoids spinning up
  // a new context while disabled and reduces backing buffer memory).
  if (canvasEl) {
    // Force a visual clear: some WebView/Windows compositor paths can keep the
    // last composed WebGL frame visible on a transparent window unless the
    // element is removed from layout.
    canvasEl.style.display = "none";
    canvasEl.width = 1;
    canvasEl.height = 1;
  }
}

function startOverlayRendering(): void {
  if (!canvasEl) return;
  if (renderer) return;
  canvasEl.style.display = "block";
  renderer = new Renderer(canvasEl, configManager.getState());
}

async function init() {
  try {
    canvasEl = document.getElementById("trail-canvas") as HTMLCanvasElement;
    if (!canvasEl) throw new Error("Could not find trail-canvas element");

    const initialConfig = configManager.getState();
    tailEnabled = initialConfig.tailEnabled !== false;

    if (tailEnabled) startOverlayRendering();
    else stopOverlayRendering();

    // Ensure the backend mouse-tracking thread is actually gated.
    void syncBackendTailEnabled(tailEnabled);

    onConfigUpdate((config) => {
      // Keep local persisted config in sync across windows.
      configManager.applyExternalConfig(config);

      const nextEnabled = config.tailEnabled !== false;
      if (nextEnabled !== tailEnabled) {
        tailEnabled = nextEnabled;
        if (tailEnabled) startOverlayRendering();
        else stopOverlayRendering();
        void syncBackendTailEnabled(tailEnabled);
      }

      if (tailEnabled) {
        renderer?.handleConfigUpdate(config);
      }
    });

    onCursorMove((nx, ny) => {
      if (!tailEnabled) return;
      renderer?.handleMouseMove(nx, ny);
    });

    onTrayToggleTail(() => {
      const current = configManager.getState();
      const nextEnabled = !current.tailEnabled;
      configManager.setTailEnabled(nextEnabled);

      tailEnabled = nextEnabled;
      if (tailEnabled) startOverlayRendering();
      else stopOverlayRendering();
      void syncBackendTailEnabled(tailEnabled);

      emitConfigUpdate(configManager.getState());
    });
  } catch (err) {
    console.error("CRITICAL OVERLAY ERROR:", err);
  }
}

document.addEventListener("DOMContentLoaded", init);
