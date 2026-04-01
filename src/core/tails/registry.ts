import type { BaseTail } from "./BaseTail";
import type { AppConfig } from "../config/index";

export type TailClass = new (canvas: HTMLCanvasElement, config: AppConfig) => BaseTail;

export interface TailMeta {
  id: string;
  name: string;
  description: string;
  class: TailClass;
}

export const tailRegistry: Record<string, TailMeta> = {};

export function registerTail(meta: TailMeta) {
  tailRegistry[meta.id] = meta;
}
