// Centralized config contract for cursor-tail

// Use string directly for TailId and ThemeId for now

export interface AppConfig {
  tailId: "comet" | "sparkle" | "orb" | "rainbow";
  themeId: "cyan" | "neon" | "fire" | "minimal";
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

export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem("cursortrail_config");
    if (!raw) return DefaultConfig;
    return { ...DefaultConfig, ...JSON.parse(raw) };
  } catch {
    return DefaultConfig;
  }
}

export function saveConfig(config: AppConfig) {
  localStorage.setItem("cursortrail_config", JSON.stringify(config));
}
