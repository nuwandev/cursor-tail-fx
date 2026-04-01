import { listen, emit } from "@tauri-apps/api/event";
import { Events } from "@/types";
import type { AppConfig } from "@/types";
export function onCursorMove(callback: (nx: number, ny: number) => void): void {
  listen<[number, number]>(Events.CursorMove, (event) => {
    console.log("[events.ts] cursor-move event received:", event.payload);
    if (
      Array.isArray(event.payload) &&
      event.payload.length === 2 &&
      typeof event.payload[0] === "number" &&
      typeof event.payload[1] === "number"
    ) {
      callback(event.payload[0], event.payload[1]);
    }
  });
}

export function onConfigUpdate(callback: (config: AppConfig) => void): void {
  listen(Events.ConfigUpdate, (event) => {
    console.log("[events.ts] config-update event received:", event.payload);
    if (typeof event.payload === "object" && event.payload !== null) {
      callback(event.payload as AppConfig);
    }
  });
}

export function emitConfigUpdate(config: AppConfig): void {
  emit(Events.ConfigUpdate, config);
}
