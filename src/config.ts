// The master configuration object that is synced across the app
export interface AppConfig {
    theme: "cyan" | "neon" | "fire" | "minimal";
    sizeMultiplier: number;     // 0.1 to 3.0
    lengthMultiplier: number;   // 0.1 to 3.0
    opacityMultiplier: number;  // 0.1 to 1.0
}

// Default configuration
export const DEFAULT_CONFIG: AppConfig = {
    theme: "cyan",
    sizeMultiplier: 1.0,
    lengthMultiplier: 1.0,
    opacityMultiplier: 1.0,
};

// Map of themes to their RGB values
export const THEMES: Record<AppConfig["theme"], { r: number, g: number, b: number }> = {
    cyan: { r: 0.0, g: 0.8, b: 1.0 },
    neon: { r: 1.0, g: 0.0, b: 1.0 },
    fire: { r: 1.0, g: 0.27, b: 0.0 },
    minimal: { r: 1.0, g: 1.0, b: 1.0 },
};
