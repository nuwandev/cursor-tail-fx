import { onCursorMove, onConfigUpdate } from "../../tauri/events";
import { loadConfig, DefaultConfig } from "../../core/config";
import { Renderer } from "../../core/rendering/Renderer";

async function init() {
  try {
    const canvas = document.getElementById("trail-canvas") as HTMLCanvasElement;
    if (!canvas) throw new Error("Could not find trail-canvas element");

    const renderer = new Renderer(canvas, loadConfig());

    onConfigUpdate((config) => {
      renderer.handleConfigUpdate(config);
    });

    let cursorEventReceived = false;
    onCursorMove((nx, ny) => {
      cursorEventReceived = true;
      console.log("cursor event", nx, ny);
      console.log("canvas size", canvas.width, canvas.height);
      renderer.handleMouseMove(nx, ny);
    });
    setTimeout(() => {
      if (!cursorEventReceived) {
        console.warn("No cursor events received — check backend emission");
      }
    }, 2000);
  } catch (err) {
    console.error("CRITICAL OVERLAY ERROR:", err);
  }
}

document.addEventListener("DOMContentLoaded", init);
