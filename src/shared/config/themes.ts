import type { ThemeMeta, ThemeId } from "@/types";

export const ThemeRegistry: ThemeMeta[] = [
  { id: "cyan", name: "Cyan", rgb: [0, 0.8, 1] },
  { id: "gold", name: "Gold", rgb: [1, 0.84, 0] },
  { id: "neon", name: "Neon", rgb: [1, 0, 1] },
  { id: "fire", name: "Fire", rgb: [1, 0.27, 0] },
  { id: "minimal", name: "Minimal", rgb: [1, 1, 1] },
];

export function getThemeById(id: ThemeId): ThemeMeta | undefined {
  return ThemeRegistry.find((t) => t.id === id);
}

export function getAllThemes(): ThemeMeta[] {
  return ThemeRegistry;
}
