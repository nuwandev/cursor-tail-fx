import { CometTail } from "./CometTail";
import { SparkleTail } from "./SparkleTail";
import { OrbTail } from "./OrbTail";
import { RainbowTail } from "./RainbowTail";
import { BaseTail, TailMeta } from "./BaseTail";

// Type for concrete tail class constructor
export type TailClass = new (canvas: HTMLCanvasElement) => BaseTail;

// Registry mapping effect names to tail classes

export const TailRegistry = {
  comet: {
    id: "comet",
    name: "Comet",
    description: "A comet-like trail",
    class: CometTail,
  },
  sparkle: {
    id: "sparkle",
    name: "Sparkle",
    description: "Sparkly particle effect",
    class: SparkleTail,
  },
  orb: {
    id: "orb",
    name: "Orb",
    description: "Floating orb effect",
    class: OrbTail,
  },
  rainbow: {
    id: "rainbow",
    name: "Rainbow",
    description: "Colorful rainbow trail",
    class: RainbowTail,
  },
} as const;

export type TailId = keyof typeof TailRegistry;

// Get a tail class by id (type-safe)
export function getTail(effect: TailId): TailClass {
  return TailRegistry[effect].class;
}

// Get a tail class by string, fallback to CometTail if not found (safe for prod)
export function getTailSafe(effect: string): TailClass {
  return (TailRegistry[effect as TailId]?.class) ?? CometTail;
}

// Get tail metadata by id
export function getTailMeta(effect: TailId): TailMeta {
  return TailRegistry[effect];
}

// Get all tail metadata
export function getAllTails(): TailMeta[] {
  return Object.values(TailRegistry);
}
