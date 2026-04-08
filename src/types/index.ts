// Centralized generic types for Cursora

// 1. Config Types
export type ThemeId = string;

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  rgb: [number, number, number];
}

export const CURRENT_CONFIG_VERSION = 1;

export interface TailSpecificConfig {
  themeId: ThemeId;
  sizeMultiplier: number;
  lengthMultiplier: number;
  opacityMultiplier: number;
}

export interface AppConfig {
  version: number;
  activeTailId: string;
  tailConfigs: Record<string, TailSpecificConfig>;
}

// Support backwards compatibility typing if any files expect it directly
export type ConfigOverrides = Partial<TailSpecificConfig>;

// 2. Event Types
export const Events = {
  CursorMove: "cursor-move",
  ConfigUpdate: "config-update",
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

// Runtime payloads (must match what Rust/JS actually emit)
// - cursor-move: (nx, ny) normalized to [0..1]
export type CursorMovePayload = [nx: number, ny: number];
// - config-update: full AppConfig object
export type ConfigUpdatePayload = AppConfig;

// 3. Tail Registry Types
import type { BaseTail } from "@/features/tails/BaseTail";

export type TailClass = new (canvas: HTMLCanvasElement, config: TailSpecificConfig) => BaseTail;

export interface TailMeta {
  id: string;
  name: string;
  description: string;
  class: TailClass;
}
