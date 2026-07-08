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
let pendingCursor: { x: number; y: number } | null = null;
let overlayFrameId: number | null = null;

async function syncBackendTailEnabled(enabled: boolean): Promise<void> {
  try {
    await invoke("set_tail_enabled", { enabled });
  } catch (err) {
    console.warn("Failed to sync tail enabled state to backend:", err);
  }
}

function ensureOverlayLoop(): void {
  if (overlayFrameId !== null) return;
  overlayFrameId = requestAnimationFrame(handleOverlayFrame);
}

function stopOverlayLoop(): void {
  if (overlayFrameId !== null) {
    cancelAnimationFrame(overlayFrameId);
    overlayFrameId = null;
  }
  pendingCursor = null;
}

function handleOverlayFrame(time: number): void {
  overlayFrameId = null;
  if (!tailEnabled || !renderer) return;

  if (pendingCursor) {
    renderer.handleMouseMove(pendingCursor.x, pendingCursor.y);
    pendingCursor = null;
  }

  const keepRendering = renderer.renderFrame(time);
  if (pendingCursor || keepRendering) {
    ensureOverlayLoop();
  }
}

function stopOverlayRendering(): void {
  stopOverlayLoop();
  try {
    renderer?.destroy();
  } finally {
    renderer = null;
  }

  /*
   * Shrink + clear the canvas without touching WebGL APIs.
   * This avoids spinning up a new context while disabled and reduces backing-buffer memory.
   */
  if (canvasEl) {
    /*
     * Force a visual clear: some WebView/Windows compositor paths can keep the last
     * composed WebGL frame visible on a transparent window unless the element is removed
     * from layout.
     */
    canvasEl.style.display = "none";
    canvasEl.width = 1;
    canvasEl.height = 1;
  }
}

function startOverlayRendering(): void {
  if (!canvasEl) return;
  if (renderer) return;
  /*
   * Ensure the config we pass to the renderer includes a hydrated entry for the active tail.
   * On a true first run, `tailConfigs` can be empty until something calls `getTailConfig()`.
   */
  const initial = configManager.getState();
  const activeTailId = initial.activeTailId;

  configManager.getTailConfig(activeTailId);

  const hydratedConfig = configManager.getState();

  canvasEl.style.display = "block";
  renderer = new Renderer(canvasEl, hydratedConfig);
}

async function init() {
  try {
    canvasEl = document.getElementById("trail-canvas") as HTMLCanvasElement;
    if (!canvasEl) throw new Error("Could not find trail-canvas element");

    const initialConfig = configManager.getState();
    tailEnabled = initialConfig.tailEnabled !== false;

    if (tailEnabled) startOverlayRendering();
    else stopOverlayRendering();

    void syncBackendTailEnabled(tailEnabled);

    onConfigUpdate((config) => {
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
      pendingCursor = { x: nx, y: ny };
      ensureOverlayLoop();
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
