import { CometTail } from "./CometTail";
import { SparkleTail } from "./SparkleTail";
import { OrbTail } from "./OrbTail";
import { RainbowTail } from "./RainbowTail";
import { BaseTail } from "./BaseTail";

// Type for concrete tail class constructor
export type TailClass = new (canvas: HTMLCanvasElement) => BaseTail;

// Registry mapping effect names to tail classes

export const TailRegistry = {
  comet: CometTail,
  sparkle: SparkleTail,
  orb: OrbTail,
  rainbow: RainbowTail,
} as const;

export type TailId = keyof typeof TailRegistry;

// Get a tail class by id (type-safe)
export function getTail(effect: TailId): TailClass {
  return TailRegistry[effect];
}

// Get a tail class by string, fallback to CometTail if not found (safe for prod)
export function getTailSafe(effect: string): TailClass {
  return TailRegistry[effect as TailId] ?? CometTail;
}
