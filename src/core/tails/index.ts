import { CometTail } from "./CometTail";
import { SparkleTail } from "./SparkleTail";
import { OrbTail } from "./OrbTail";
import { RainbowTail } from "./RainbowTail";
import { BaseTail } from "./BaseTail";

export type TailClass = new (canvas: HTMLCanvasElement) => BaseTail;

export type TailMeta = {
  id: string;
  name: string;
  class: TailClass;
};

export const TailRegistry = [
  { id: "comet", name: "Comet", class: CometTail },
  { id: "sparkle", name: "Sparkle", class: SparkleTail },
  { id: "orb", name: "Orb", class: OrbTail },
  { id: "rainbow", name: "Rainbow", class: RainbowTail },
] as const;

export type TailId = (typeof TailRegistry)[number]["id"];

export function getTailById(id: TailId): TailMeta | undefined {
  return TailRegistry.find((t) => t.id === id);
}

export function getAllTailIds(): TailId[] {
  return TailRegistry.map((t) => t.id);
}

export function getAllTails(): TailMeta[] {
  return TailRegistry as unknown as TailMeta[];
}

export function getTailSafe(tailId: string): TailClass {
  return (TailRegistry.find((t) => t.id === tailId) || TailRegistry[0]).class;
}
