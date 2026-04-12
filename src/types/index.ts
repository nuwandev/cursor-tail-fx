/**
 * Shared TypeScript types used across the settings UI, overlay renderer, and IPC layer.
 */

export interface ThemeMeta {
  id: string;
  name: string;
  rgb: [number, number, number];
}

export type ThemeId = ThemeMeta["id"];

export const CURRENT_CONFIG_VERSION = 2;

export interface TailSpecificConfig {
  themeId: string;
  sizeMultiplier: number;
  lengthMultiplier: number;
  opacityMultiplier: number;
}

export interface AppConfig {
  version: number;
  /** Master kill-switch for the desktop overlay effect (saves CPU/GPU when off). */
  tailEnabled: boolean;
  activeTailId: string;
  tailConfigs: Record<string, TailSpecificConfig>;
}

/** Back-compat alias kept for older callsites; prefer `TailSpecificConfig` for new code. */
export type ConfigOverrides = Partial<TailSpecificConfig>;

export const Events = {
  CursorMove: "cursor-move",
  ConfigUpdate: "config-update",
  TrayToggleTail: "tray-toggle-tail",
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

/**
 * IPC payloads.
 *
 * These shapes must match what the backend (Rust) and frontend emit/expect at runtime.
 */
/** Cursor position normalized to $[0, 1]$ in overlay coordinates. */
export type CursorMovePayload = [nx: number, ny: number];
/** Full config snapshot. */
export type ConfigUpdatePayload = AppConfig;

import type { BaseTail } from "@/features/tails/BaseTail";

export type TailClass = new (canvas: HTMLCanvasElement, config: TailSpecificConfig) => BaseTail;

export interface TailCreator {
  name: string;
  url?: string;
}

export interface TailMeta {
  id: string;
  name: string;
  description: string;
  class: TailClass;
  creator: TailCreator;
}
