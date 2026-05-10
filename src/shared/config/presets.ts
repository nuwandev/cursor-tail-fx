import type { TailSpecificConfig } from "@/types";

export const TAIL_DEFAULT_CONFIGS: Record<string, Partial<TailSpecificConfig>> = {
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

export function getIdealDefault(tailId: string): TailSpecificConfig {
  const specific = TAIL_DEFAULT_CONFIGS[tailId] || {};

  return {
    themeId: specific.themeId ?? "cyan",
    sizeMultiplier: specific.sizeMultiplier ?? 1,
    lengthMultiplier: specific.lengthMultiplier ?? 1,
    opacityMultiplier: specific.opacityMultiplier ?? 1,
  };
}
