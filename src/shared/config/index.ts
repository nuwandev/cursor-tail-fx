import type { AppConfig, TailSpecificConfig } from "@/types";
import { CURRENT_CONFIG_VERSION } from "@/types";

export function getIdealDefault(tailId: string): TailSpecificConfig {
  const SPECIFIC_DEFAULT_CONFIGS: Record<string, Partial<TailSpecificConfig>> = {
    aurora: {
      lengthMultiplier: 0.9,
      opacityMultiplier: 1,
      sizeMultiplier: 0.6,
      themeId: "cyan",
    },
    "clean-minimal": {
      lengthMultiplier: 3,
      opacityMultiplier: 0.6,
      sizeMultiplier: 1.5,
      themeId: "cyan",
    },
    comet: {
      lengthMultiplier: 0.4,
      opacityMultiplier: 1,
      sizeMultiplier: 0.4,
      themeId: "cyan",
    },
    "gamer-hud": {
      lengthMultiplier: 0.3,
      opacityMultiplier: 1,
      sizeMultiplier: 0.6,
      themeId: "gold",
    },
    "glass-fade": {
      lengthMultiplier: 0.3,
      opacityMultiplier: 0.6,
      sizeMultiplier: 0.8,
      themeId: "white",
    },
    "ink-drop": {
      lengthMultiplier: 0.7,
      opacityMultiplier: 1,
      sizeMultiplier: 0.9,
      themeId: "cyan",
    },
    "liquid-wave": {
      lengthMultiplier: 0.2,
      opacityMultiplier: 0.9,
      sizeMultiplier: 0.4,
      themeId: "blue",
    },
    "magic-rune": {
      lengthMultiplier: 0.5,
      opacityMultiplier: 0.9,
      sizeMultiplier: 0.4,
      themeId: "neon",
    },
    "neon-pulse": {
      lengthMultiplier: 0.3,
      opacityMultiplier: 0.9,
      sizeMultiplier: 0.4,
      themeId: "fire",
    },
    orb: {
      lengthMultiplier: 0.2,
      opacityMultiplier: 0.7,
      sizeMultiplier: 0.2,
      themeId: "minimal",
    },
    "retro-pixel": {
      lengthMultiplier: 0.5,
      opacityMultiplier: 0.9,
      sizeMultiplier: 0.3,
      themeId: "green",
    },
    "soft-glow": {
      lengthMultiplier: 0.4,
      opacityMultiplier: 0.5,
      sizeMultiplier: 0.2,
      themeId: "neon",
    },
    "spark-burst": {
      lengthMultiplier: 1.7,
      opacityMultiplier: 1,
      sizeMultiplier: 1.5,
      themeId: "yellow",
    },
    sparkle: {
      lengthMultiplier: 0.6,
      opacityMultiplier: 1,
      sizeMultiplier: 0.5,
      themeId: "white",
    },
  };

  const specific = SPECIFIC_DEFAULT_CONFIGS[tailId] || {};
  return {
    themeId: specific.themeId ?? "cyan",
    sizeMultiplier: specific.sizeMultiplier ?? 1,
    lengthMultiplier: specific.lengthMultiplier ?? 1,
    opacityMultiplier: specific.opacityMultiplier ?? 1,
  };
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  version: CURRENT_CONFIG_VERSION,
  tailEnabled: true,
  activeTailId: "comet",
  tailConfigs: {
    aurora: {
      lengthMultiplier: 0.9,
      opacityMultiplier: 1,
      sizeMultiplier: 0.6,
      themeId: "cyan",
    },
    "clean-minimal": {
      lengthMultiplier: 3,
      opacityMultiplier: 0.6,
      sizeMultiplier: 1.5,
      themeId: "cyan",
    },
    comet: {
      lengthMultiplier: 0.4,
      opacityMultiplier: 1,
      sizeMultiplier: 0.4,
      themeId: "cyan",
    },
    "gamer-hud": {
      lengthMultiplier: 0.3,
      opacityMultiplier: 1,
      sizeMultiplier: 0.6,
      themeId: "gold",
    },
    "glass-fade": {
      lengthMultiplier: 0.3,
      opacityMultiplier: 0.6,
      sizeMultiplier: 0.8,
      themeId: "white",
    },
    "ink-drop": {
      lengthMultiplier: 0.7,
      opacityMultiplier: 1,
      sizeMultiplier: 0.9,
      themeId: "cyan",
    },
    "liquid-wave": {
      lengthMultiplier: 0.2,
      opacityMultiplier: 0.9,
      sizeMultiplier: 0.4,
      themeId: "blue",
    },
    "magic-rune": {
      lengthMultiplier: 0.5,
      opacityMultiplier: 0.9,
      sizeMultiplier: 0.4,
      themeId: "neon",
    },
    "neon-pulse": {
      lengthMultiplier: 0.3,
      opacityMultiplier: 0.9,
      sizeMultiplier: 0.4,
      themeId: "fire",
    },
    orb: {
      lengthMultiplier: 0.2,
      opacityMultiplier: 0.7,
      sizeMultiplier: 0.2,
      themeId: "minimal",
    },
    "retro-pixel": {
      lengthMultiplier: 0.5,
      opacityMultiplier: 0.9,
      sizeMultiplier: 0.3,
      themeId: "green",
    },
    "soft-glow": {
      lengthMultiplier: 0.4,
      opacityMultiplier: 0.5,
      sizeMultiplier: 0.2,
      themeId: "neon",
    },
    "spark-burst": {
      lengthMultiplier: 1.7,
      opacityMultiplier: 1,
      sizeMultiplier: 1.5,
      themeId: "yellow",
    },
    sparkle: {
      lengthMultiplier: 0.6,
      opacityMultiplier: 1,
      sizeMultiplier: 0.5,
      themeId: "white",
    },
  },
};

const CONFIG_KEY = "cursora_config";
const LEGACY_CONFIG_KEY = "cursortrail_config";

class ConfigManager {
  private state!: AppConfig;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;

  public init(): void {
    if (this.initialized) return;

    const raw = localStorage.getItem(CONFIG_KEY) ?? localStorage.getItem(LEGACY_CONFIG_KEY);
    if (!raw) {
      this.state = structuredClone(DEFAULT_APP_CONFIG);
      this.saveNow();
      this.initialized = true;
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      this.state = this.migrate(parsed);
    } catch (err) {
      console.warn("Failed to load persisted config, resetting to defaults.", err);
      this.state = structuredClone(DEFAULT_APP_CONFIG);
      this.saveNow();
    }

    this.initialized = true;
  }

  private migrate(stored: unknown): AppConfig {
    const legacy = stored as Partial<AppConfig> & {
      tailId?: string;
      tailConfigs?: Record<string, Partial<TailSpecificConfig>>;
      themeId?: string;
      sizeMultiplier?: number;
      lengthMultiplier?: number;
      opacityMultiplier?: number;
    };

    if (legacy.version == null || legacy.version < CURRENT_CONFIG_VERSION) {
      const newState = structuredClone(DEFAULT_APP_CONFIG);
      this.applyLegacyState(newState, legacy);
      newState.version = CURRENT_CONFIG_VERSION;
      this.state = newState;
      this.saveNow();
      return newState;
    }

    /*
     * Stored config is already at the current version, but older builds may have
     * persisted partial objects. Normalize missing fields defensively.
     */
    const normalized = legacy as AppConfig;
    if (typeof (normalized as any).tailEnabled !== "boolean") {
      (normalized as any).tailEnabled = true;
    }
    if (typeof (normalized as any).activeTailId !== "string") {
      (normalized as any).activeTailId = DEFAULT_APP_CONFIG.activeTailId;
    }
    if (
      typeof (normalized as any).tailConfigs !== "object" ||
      (normalized as any).tailConfigs == null
    ) {
      (normalized as any).tailConfigs = {};
    }
    return normalized;
  }

  private applyLegacyState(
    newState: AppConfig,
    stored: Partial<AppConfig> & {
      tailId?: string;
      tailConfigs?: Record<string, Partial<TailSpecificConfig>>;
      themeId?: string;
      sizeMultiplier?: number;
      lengthMultiplier?: number;
      opacityMultiplier?: number;
    },
  ): void {
    /* Preserve the persisted kill-switch if present; otherwise default. */
    if (typeof (stored as any).tailEnabled === "boolean") {
      newState.tailEnabled = (stored as any).tailEnabled as boolean;
    }

    /* v1+ uses `activeTailId`; very old builds used `tailId`. */
    if (typeof stored.activeTailId === "string" && stored.activeTailId.length > 0) {
      newState.activeTailId = stored.activeTailId;
    } else if (stored.tailId) {
      newState.activeTailId = stored.tailId;
    }

    const legacyTailConfigs: Record<string, Partial<TailSpecificConfig>> = stored.tailConfigs ?? {};

    if (stored.tailId && !legacyTailConfigs[stored.tailId]) {
      legacyTailConfigs[stored.tailId] = this.buildLegacyTailConfig(stored.tailId, stored);
    }

    const normalizedTailConfigs: Record<string, TailSpecificConfig> = {};
    for (const [id, config] of Object.entries(legacyTailConfigs)) {
      normalizedTailConfigs[id] = this.normalizeTailConfig(id, config ?? {});
    }

    newState.tailConfigs = normalizedTailConfigs;
  }

  private buildLegacyTailConfig(
    tailId: string,
    stored: {
      themeId?: string;
      sizeMultiplier?: number;
      lengthMultiplier?: number;
      opacityMultiplier?: number;
    },
  ): TailSpecificConfig {
    const defaults = getIdealDefault(tailId);

    return {
      themeId: stored.themeId ?? defaults.themeId,
      sizeMultiplier:
        typeof stored.sizeMultiplier === "number" ? stored.sizeMultiplier : defaults.sizeMultiplier,
      lengthMultiplier:
        typeof stored.lengthMultiplier === "number"
          ? stored.lengthMultiplier
          : defaults.lengthMultiplier,
      opacityMultiplier:
        typeof stored.opacityMultiplier === "number"
          ? stored.opacityMultiplier
          : defaults.opacityMultiplier,
    };
  }

  private normalizeTailConfig(
    tailId: string,
    config: Partial<TailSpecificConfig>,
  ): TailSpecificConfig {
    const defaults = getIdealDefault(tailId);

    return {
      themeId: config.themeId ?? defaults.themeId,
      sizeMultiplier: config.sizeMultiplier ?? defaults.sizeMultiplier,
      lengthMultiplier: config.lengthMultiplier ?? defaults.lengthMultiplier,
      opacityMultiplier: config.opacityMultiplier ?? defaults.opacityMultiplier,
    };
  }

  public getState(): AppConfig {
    if (!this.initialized) this.init();
    return structuredClone(this.state);
  }

  /**
   * Returns a clone of the current tail config.
   *
   * If the tail is missing a persisted config entry, one is created immediately
   * and persisted to keep the store self-healing.
   */
  public getTailConfig(tailId: string): TailSpecificConfig {
    if (!this.initialized) this.init();
    if (!this.state.tailConfigs[tailId]) {
      this.state.tailConfigs[tailId] = getIdealDefault(tailId);
      this.saveNow();
    }
    return structuredClone(this.state.tailConfigs[tailId]);
  }

  public updateTailConfig(tailId: string, updates: Partial<TailSpecificConfig>): void {
    if (!this.initialized) this.init();
    if (!this.state.tailConfigs[tailId]) {
      this.state.tailConfigs[tailId] = getIdealDefault(tailId);
    }
    this.state.tailConfigs[tailId] = {
      ...this.state.tailConfigs[tailId],
      ...updates,
    };

    /* Enforce sane ranges so invalid values never get persisted. */
    const c = this.state.tailConfigs[tailId];
    c.sizeMultiplier = Math.max(0.1, Math.min(5, c.sizeMultiplier));
    c.lengthMultiplier = Math.max(0.1, Math.min(5, c.lengthMultiplier));
    c.opacityMultiplier = Math.max(0.1, Math.min(5, c.opacityMultiplier));

    this.save();
  }

  public setActiveTailId(tailId: string): void {
    if (!this.initialized) this.init();
    this.state.activeTailId = tailId;
    this.save();
  }

  public setTailEnabled(enabled: boolean): void {
    if (!this.initialized) this.init();
    this.state.tailEnabled = Boolean(enabled);
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
configManager.init();

/** Back-compat export for older callsites that expect `loadConfig()`. */
export function loadConfig(): AppConfig {
  return configManager.getState();
}
