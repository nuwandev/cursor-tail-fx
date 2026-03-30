import { CometTail } from "./CometTail";
import { SparkleTail } from "./SparkleTail";
import { OrbTail } from "./OrbTail";
import { RainbowTail } from "./RainbowTail";
import { BaseTail } from "./BaseTail";

// Type for concrete tail class constructor
export type TailClass = new (canvas: HTMLCanvasElement) => BaseTail;

// TailMeta contract
export interface TailMeta {
  id: string; // unique identifier, lowercase
  name: string; // display name
  description: string; // short description for UI
  class: TailClass; // reference to the tail class
}

// Metadata for each tail
export const CometTailMeta: TailMeta = {
  id: "comet",
  name: "Comet",
  description: "A comet-like trail",
  class: CometTail,
};

export const SparkleTailMeta: TailMeta = {
  id: "sparkle",
  name: "Sparkle",
  description: "Sparkly particle effect",
  class: SparkleTail,
};

export const OrbTailMeta: TailMeta = {
  id: "orb",
  name: "Orb",
  description: "Floating orb effect",
  class: OrbTail,
};

export const RainbowTailMeta: TailMeta = {
  id: "rainbow",
  name: "Rainbow",
  description: "Colorful rainbow trail",
  class: RainbowTail,
};

// TailRegistry: single source of truth
export const TailRegistry: TailMeta[] = [
  CometTailMeta,
  SparkleTailMeta,
  RainbowTailMeta,
  OrbTailMeta,
];

// Type-safe ID
export type TailId = (typeof TailRegistry)[number]["id"];

// Utility functions
export function getTailById(id: TailId): TailMeta | undefined {
  return TailRegistry.find((t) => t.id === id);
}

export function getAllTailIds(): TailId[] {
  return TailRegistry.map((t) => t.id);
}

export function getAllTails(): TailMeta[] {
  return TailRegistry;
}

// Get a tail class by string, fallback to CometTail if not found (safe for prod)
export function getTailSafe(tailId: string): TailClass {
  return TailRegistry.find((t) => t.id === tailId)?.class || CometTail;
}
