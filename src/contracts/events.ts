// Centralized event contract for CursorTrail
import type { AppConfig } from "../core/config";

export const Events = {
  CursorMove: "cursor-move",
  ConfigUpdate: "config-update",
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

export interface CursorMovePayload {
  x: number;
  y: number;
}

export interface ConfigUpdatePayload {
  config: AppConfig;
}
