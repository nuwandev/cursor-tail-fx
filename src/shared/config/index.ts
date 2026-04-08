import type { AppConfig, TailSpecificConfig } from "@/types";
import { CURRENT_CONFIG_VERSION } from "@/types";

export function getIdealDefault(tailId: string): TailSpecificConfig {
  const SPECIFIC_DEFAULT_CONFIGS: Record<string, Partial<TailSpecificConfig>> = {
    "comet": { themeId: "cyan", sizeMultiplier: 1.0 },
    "orb": { themeId: "yellow", sizeMultiplier: 1.5, lengthMultiplier: 0.5 },
    "sparkle": { themeId: "white", sizeMultiplier: 1.0, lengthMultiplier: 0.8 },
    "bubble": { themeId: "magenta", sizeMultiplier: 1.5 },
    "clean-minimal": { themeId: "cyan", sizeMultiplier: 0.5, lengthMultiplier: 0.5 },
    "neon-pulse": { themeId: "magenta", sizeMultiplier: 1.5, lengthMultiplier: 1.5, opacityMultiplier: 0.9 },
    "spark-burst": { themeId: "yellow", sizeMultiplier: 2.0, lengthMultiplier: 0.8 },
    "soft-glow": { themeId: "cyan", sizeMultiplier: 3.5, opacityMultiplier: 0.8 },
    "magic-rune": { themeId: "green", sizeMultiplier: 1.5, lengthMultiplier: 1.0, opacityMultiplier: 0.9 },
    "gamer-hud": { themeId: "red", sizeMultiplier: 1.2, lengthMultiplier: 1.2 },
    "liquid-wave": { themeId: "blue", sizeMultiplier: 1.5, lengthMultiplier: 2.0 },
    "retro-pixel": { themeId: "green", sizeMultiplier: 2.0, opacityMultiplier: 0.8 },
    "glass-fade": { themeId: "white", sizeMultiplier: 1.8, lengthMultiplier: 1.5, opacityMultiplier: 0.6 },
  };

  const specific = SPECIFIC_DEFAULT_CONFIGS[tailId] || {};
  return {
    themeId: specific.themeId ?? "cyan",
    sizeMultiplier: specific.sizeMultiplier ?? 1.0,
    lengthMultiplier: specific.lengthMultiplier ?? 1.0,
    opacityMultiplier: specific.opacityMultiplier ?? 1.0,
  };
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  version: CURRENT_CONFIG_VERSION,
  activeTailId: "comet",
  tailConfigs: {},
};

const CONFIG_KEY = "cursora_config";
const LEGACY_CONFIG_KEY = "cursortrail_config";

class ConfigManager {
  private state!: AppConfig;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;

  public init(): void {
    if (this.initialized) return;
    try {
      const raw = localStorage.getItem(CONFIG_KEY) ?? localStorage.getItem(LEGACY_CONFIG_KEY);
      if (!raw) throw new Error("No config");
      
      let parsed = JSON.parse(raw);
      this.state = this.migrate(parsed);
    } catch (err) {
      this.state = structuredClone(DEFAULT_APP_CONFIG);
      this.saveNow();
    }
    this.initialized = true;
  }

  private migrate(stored: any): AppConfig {
    if (stored.version == null || stored.version < CURRENT_CONFIG_VERSION) {
      let newState = structuredClone(DEFAULT_APP_CONFIG);
      // Legacy global config to specific tail logic
      if (stored.tailId) newState.activeTailId = stored.tailId;
      
      if (!stored.tailConfigs) stored.tailConfigs = {};
      
      // Map old global theme multipliers into the specific tail if it didn't have one
      if (stored.tailId && !stored.tailConfigs[stored.tailId]) {
        stored.tailConfigs[stored.tailId] = {
           themeId: stored.themeId ?? getIdealDefault(stored.tailId).themeId,
           sizeMultiplier: typeof stored.sizeMultiplier === 'number' ? stored.sizeMultiplier : getIdealDefault(stored.tailId).sizeMultiplier,
           lengthMultiplier: typeof stored.lengthMultiplier === 'number' ? stored.lengthMultiplier : getIdealDefault(stored.tailId).lengthMultiplier,
           opacityMultiplier: typeof stored.opacityMultiplier === 'number' ? stored.opacityMultiplier : getIdealDefault(stored.tailId).opacityMultiplier,
        };
      }
      
      // Patch any existing configs with missed variables from legacy schemas
      for (const id in stored.tailConfigs) {
        stored.tailConfigs[id].opacityMultiplier ??= getIdealDefault(id).opacityMultiplier;
        stored.tailConfigs[id].sizeMultiplier ??= getIdealDefault(id).sizeMultiplier;
        stored.tailConfigs[id].lengthMultiplier ??= getIdealDefault(id).lengthMultiplier;
        stored.tailConfigs[id].themeId ??= getIdealDefault(id).themeId;
      }
      
      newState.tailConfigs = stored.tailConfigs;
      newState.version = CURRENT_CONFIG_VERSION;
      this.state = newState;
      this.saveNow();
      return newState;
    }
    return stored as AppConfig;
  }

  public getState(): AppConfig {
    if (!this.initialized) this.init();
    return structuredClone(this.state);
  }

  public getTailConfig(tailId: string): TailSpecificConfig {
    if (!this.initialized) this.init();
    if (!this.state.tailConfigs[tailId]) {
      this.state.tailConfigs[tailId] = getIdealDefault(tailId);
      this.saveNow(); // persist missing immediately
    }
    // Return deep clone to ensure pure immutability on UI side
    return structuredClone(this.state.tailConfigs[tailId]);
  }

  public updateTailConfig(tailId: string, updates: Partial<TailSpecificConfig>): void {
    if (!this.initialized) this.init();
    if (!this.state.tailConfigs[tailId]) {
      this.state.tailConfigs[tailId] = getIdealDefault(tailId);
    }
    this.state.tailConfigs[tailId] = {
      ...this.state.tailConfigs[tailId],
      ...updates
    };
    
    // Clamp values securely
    const c = this.state.tailConfigs[tailId];
    c.sizeMultiplier = Math.max(0.1, Math.min(5.0, c.sizeMultiplier));
    c.lengthMultiplier = Math.max(0.1, Math.min(5.0, c.lengthMultiplier));
    c.opacityMultiplier = Math.max(0.1, Math.min(5.0, c.opacityMultiplier));
    
    this.save();
  }

  public setActiveTailId(tailId: string): void {
     if (!this.initialized) this.init();
     this.state.activeTailId = tailId;
     this.save();
  }

  public resetTailConfig(tailId: string): void {
    if (!this.initialized) this.init();
    this.state.tailConfigs[tailId] = getIdealDefault(tailId);
    this.save();
  }

  public resetAllDefaults(): void {
    if (!this.initialized) this.init();
    this.state = structuredClone(DEFAULT_APP_CONFIG);
    this.saveNow();
  }
  
  public applyExternalConfig(config: AppConfig): void {
    if (!this.initialized) this.init();
    this.state = structuredClone(config);
    this.saveNow();
  }

  private save(): void {
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveNow();
      this.saveTimeout = null;
    }, 300);
  }

  private saveNow(): void {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(this.state));
  }
}

export const configManager = new ConfigManager();
// ensure initialized automatically
configManager.init();

// Export legacy loader mapping for any lingering code pieces safely
export function loadConfig(): AppConfig {
  return configManager.getState();
}
