// Centralized generic types for CursorTrail

// 1. Config Types
export type ThemeId = string;

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  rgb: [number, number, number];
}

export interface AppConfig {
  tailId: string;
  themeId: ThemeId;
  sizeMultiplier: number;
  lengthMultiplier: number;
  opacityMultiplier: number;
}

export type ConfigOverrides = Partial<AppConfig>;

// 2. Event Types
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

// 3. Tail Registry Types
import type { BaseTail } from "@/features/tails/BaseTail";

export type TailClass = new (canvas: HTMLCanvasElement, config: AppConfig) => BaseTail;

export interface TailMeta {
  id: string;
  name: string;
  description: string;
  class: TailClass;
}
