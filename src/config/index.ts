// --- Config Validation Layer ---
export function validateConfig(config: any): AppConfig {
  return {
    theme:
      config.theme === "cyan" ||
      config.theme === "neon" ||
      config.theme === "fire" ||
      config.theme === "minimal"
        ? config.theme
        : DEFAULT_CONFIG.theme,
    effect: TailRegistry.some((t) => t.id === config.effect)
      ? config.effect
      : DEFAULT_CONFIG.effect,
    sizeMultiplier:
      typeof config.sizeMultiplier === "number" &&
      Number.isFinite(config.sizeMultiplier)
        ? config.sizeMultiplier
        : DEFAULT_CONFIG.sizeMultiplier,
    lengthMultiplier:
      typeof config.lengthMultiplier === "number" &&
      Number.isFinite(config.lengthMultiplier)
        ? config.lengthMultiplier
        : DEFAULT_CONFIG.lengthMultiplier,
    opacityMultiplier:
      typeof config.opacityMultiplier === "number" &&
      Number.isFinite(config.opacityMultiplier)
        ? config.opacityMultiplier
        : DEFAULT_CONFIG.opacityMultiplier,
  };
}

export function loadConfigSafe(): AppConfig {
  try {
    const raw = loadConfig();
    return validateConfig(raw);
  } catch {
    return validateConfig({});
  }
}
import { TailRegistry } from "../core/tails";
// The master configuration object that is synced across the app
export interface AppConfig {
  theme: "cyan" | "neon" | "fire" | "minimal";
  effect: "comet" | "sparkle" | "orb" | "rainbow";
  sizeMultiplier: number; // 0.1 to 3.0
  lengthMultiplier: number; // 0.1 to 3.0
  opacityMultiplier: number; // 0.1 to 1.0
}

// Default configuration
export const DEFAULT_CONFIG: AppConfig = {
  theme: "cyan",
  effect: "comet",
  sizeMultiplier: 1,
  lengthMultiplier: 1,
  opacityMultiplier: 1,
};

// Map of effect names to integer values for the WebGL shader
export const EFFECTS = {
  comet: 0,
  sparkle: 1,
  orb: 2,
  rainbow: 3,
};

// Map of themes to their RGB values
export const THEMES: Record<
  AppConfig["theme"],
  { r: number; g: number; b: number }
> = {
  cyan: { r: 0, g: 0.8, b: 1 },
  neon: { r: 1, g: 0, b: 1 },
  fire: { r: 1, g: 0.27, b: 0 },
  minimal: { r: 1, g: 1, b: 1 },
};

const STORAGE_KEY = "cursor-trail-config-v2";

export function loadConfig(): AppConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to parse saved config", e);
  }
  return { ...DEFAULT_CONFIG };
}

export function saveConfig(config: AppConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save config", e);
  }
}
