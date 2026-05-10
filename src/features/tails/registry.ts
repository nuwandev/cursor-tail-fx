import type { TailMeta } from "@/types";

export const tailRegistry: Record<string, TailMeta> = {};

function normalizeTailMeta(meta: TailMeta): TailMeta {
  const creatorName = meta.creator?.name?.trim();
  const creatorUrl = meta.creator?.url?.trim();

  if (!creatorName) {
    console.warn(`[TailRegistry] Tail '${meta.id}' registered without creator; defaulting to 'Unknown'.`);
    return { ...meta, creator: { name: "Unknown" } };
  }

  return {
    ...meta,
    creator: creatorUrl ? { name: creatorName, url: creatorUrl } : { name: creatorName },
  };
}

export function registerTail(meta: TailMeta): void {
  const normalized = normalizeTailMeta(meta);
  tailRegistry[normalized.id] = normalized;
}
