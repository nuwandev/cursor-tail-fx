import { listen, emit } from "@tauri-apps/api/event";
import { Events } from "@/types";
import type { AppConfig, CursorMovePayload } from "@/types";

export function onTrayToggleTail(callback: () => void): void {
  listen<unknown>(Events.TrayToggleTail, () => {
    callback();
  });
}
export function onCursorMove(callback: (nx: number, ny: number) => void): void {
  listen<CursorMovePayload>(Events.CursorMove, (event) => {
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
  listen<AppConfig>(Events.ConfigUpdate, (event) => {
    // Runtime validation is intentionally minimal; config is normalized downstream.
    if (typeof event.payload === "object" && event.payload !== null) callback(event.payload);
  });
}

export function emitConfigUpdate(config: AppConfig): void {
  emit(Events.ConfigUpdate, config);
}
