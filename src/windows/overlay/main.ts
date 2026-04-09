import { onCursorMove, onConfigUpdate } from "@/shared/ipc/events";
import { loadConfig } from "@/shared/config";
import { Renderer } from "@/features/tails/Renderer";

async function init() {
  try {
    const canvas = document.getElementById("trail-canvas") as HTMLCanvasElement;
    if (!canvas) throw new Error("Could not find trail-canvas element");

    const renderer = new Renderer(canvas, loadConfig());

    onConfigUpdate((config) => {
      renderer.handleConfigUpdate(config);
    });

    onCursorMove((nx, ny) => {
      renderer.handleMouseMove(nx, ny);
    });
  } catch (err) {
    console.error("CRITICAL OVERLAY ERROR:", err);
  }
}

document.addEventListener("DOMContentLoaded", init);
