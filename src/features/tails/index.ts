/// <reference types="vite/client" />
export * from "./registry";
import { tailRegistry } from "./registry";
import type { TailMeta, TailClass } from "@/types";

export function getTailById(id: string): TailMeta | undefined {
  return tailRegistry[id];
}

export function getAllTailIds(): string[] {
  return Object.keys(tailRegistry);
}

export function getAllTails(): TailMeta[] {
  return Object.values(tailRegistry);
}

export function getTailSafe(tailId: string): TailClass {
  const meta = tailRegistry[tailId];
  if (meta) return meta.class;

  const all = Object.values(tailRegistry);
  if (all.length > 0) return all[0].class;
  throw new Error("No tails have been registered in TailRegistry");
}

// Eagerly import all Tail files so they auto-register themselves
import.meta.glob("./*Tail.ts", { eager: true });
