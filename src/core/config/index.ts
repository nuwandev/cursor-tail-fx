// Centralized config contract for cursor-tail

// Use string directly for TailId and ThemeId for now

import { TailRegistry } from "../tails";
import { ThemeRegistry } from "./themes";

export interface AppConfig {
  tailId: string;
  themeId: string;
  sizeMultiplier: number;
  lengthMultiplier: number;
  opacityMultiplier: number;
}

export const DefaultConfig: AppConfig = {
  tailId: "comet",
  themeId: "cyan",
  sizeMultiplier: 1,
  lengthMultiplier: 1,
  opacityMultiplier: 1,
};

function isValidTailId(id: string): boolean {
  return TailRegistry.some(t => t.id === id);
}

function isValidThemeId(id: string): boolean {
  return ThemeRegistry.some(t => t.id === id);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function normalizeConfig(input: any): AppConfig {
  const merged = { ...DefaultConfig, ...(typeof input === "object" && input !== null ? input : {}) };
  const tailId = isValidTailId(merged.tailId) ? merged.tailId : DefaultConfig.tailId;
  const themeId = isValidThemeId(merged.themeId) ? merged.themeId : DefaultConfig.themeId;
  const sizeMultiplier = clamp(Number(merged.sizeMultiplier), 0.1, 5);
  const lengthMultiplier = clamp(Number(merged.lengthMultiplier), 0.1, 5);
  const opacityMultiplier = clamp(Number(merged.opacityMultiplier), 0.1, 5);
  return { tailId, themeId, sizeMultiplier, lengthMultiplier, opacityMultiplier };
}

export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem("cursortrail_config");
    if (!raw) return DefaultConfig;
    return normalizeConfig(JSON.parse(raw));
  } catch {
    return DefaultConfig;
  }
}

export function saveConfig(config: AppConfig) {
  const normalized = normalizeConfig(config);
  localStorage.setItem("cursortrail_config", JSON.stringify(normalized));
}
