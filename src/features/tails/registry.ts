import type { TailMeta } from "@/types";

export const tailRegistry: Record<string, TailMeta> = {};

export function registerTail(meta: TailMeta) {
  tailRegistry[meta.id] = meta;
}
