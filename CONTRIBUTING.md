# Contributing to CursorTrail

Thanks for your interest in contributing — CursorTrail is designed to be easy to extend.

The most valuable contributions are new **tail effects** (visual styles). You can add a new effect as a single TypeScript file plus shaders.

By contributing, you agree that your contributions will be licensed under the project license (Apache-2.0). See [LICENSE](LICENSE) and [NOTICE](NOTICE).

## Quick contribution ideas

- Add a new tail effect (`*Tail.ts` + shaders)
- Add a new theme color
- Improve Settings UX copy (small, focused changes)
- Performance improvements (GPU/CPU reductions) with before/after notes

## Development setup

### Prerequisites

- Node.js (LTS recommended)
- Rust toolchain (stable)
- Tauri prerequisites for your OS (Windows requires MSVC build tools)

Tauri prerequisites: <https://tauri.app/start/prerequisites/>

### Run

```bash
npm install
npm run tauri dev
```

### Scripts

- `npm run tauri dev` — run the full desktop app (overlay + tray + settings)
- `npm run tauri build` — build and bundle installers/artifacts
- `npm run dev` — run the Vite dev server (frontend-only)
- `npm run build` — typecheck + build the frontend bundle
- `npm run preview` — preview the built frontend

### Build

```bash
npm run tauri build
```

Tauri bundles are produced under `src-tauri/target/release/bundle/`.

## Configuration

Configuration is stored in the webview’s local storage under the key:

- `cursortrail_config`

Shape (see `src/types/index.ts`):

```ts
type AppConfig = {
  tailId: string;
  themeId: string;
  sizeMultiplier: number; // clamped 0.1..5
  lengthMultiplier: number; // clamped 0.1..5
  opacityMultiplier: number; // clamped 0.1..5
};
```

Defaults and normalization live in `src/shared/config/index.ts`.

## Architecture (high-level)

- **Rust backend (Tauri):**
  - makes the overlay click‑through + topmost
  - polls the system cursor position and emits `cursor-move` with normalized coordinates
- **Overlay window:** `src/windows/overlay/index.html`
  - listens for `cursor-move` and feeds it into the renderer
- **Renderer:** `src/features/tails/Renderer.ts`
  - instantiates a tail effect class based on `tailId`
  - converts normalized coordinates to canvas pixels
- **Tail engine:** `src/features/tails/TailEngine.ts`
  - turns mouse travel into spawned particles (batch upload per event)
- **Settings window:** `src/windows/settings/index.html`
  - updates config and emits `config-update` (applies instantly)

## Creating a new tail effect (recommended)

This repo is set up so new effects are easy: add a `*Tail.ts` file + shaders, register it, and it shows up in Settings automatically.

### TL;DR (fast path)

1. Copy one of the existing tails (e.g. `CometTail.ts`) and rename it.
2. Copy the matching shaders and tweak the visuals.
3. Update the `registerTail({ id, name, description, class })` metadata.
4. Run `npm run tauri dev` → open Settings → your effect should be listed under **Effects**.

### 1) Create a new `*Tail.ts` file

Create a new file in:

- `src/features/tails/`

Important:

- The filename must end with `Tail.ts` (example: `NebulaTail.ts`).
- Your tail must call `registerTail(...)` once.
- `id` must be unique and stable (don’t change it after release).

Starter template (copy/paste):

```ts
import { BaseTail } from "./BaseTail";
import { registerTail } from "./registry";

import myVert from "./shaders/my.vert.glsl?raw";
import myFrag from "./shaders/my.frag.glsl?raw";

export class MyTail extends BaseTail {
  public getShaders() {
    return { vertex: myVert, fragment: myFrag };
  }

  public updateEffect(_dt: number): void {
    // Optional per-frame CPU-side updates.
    // Keep this light; prefer shader-driven visuals.
  }
}

registerTail({
  id: "my-tail",
  name: "My Tail",
  description: "One-line description shown in Settings",
  class: MyTail,
});
```

### 2) Add shaders

Add shader files to:

- `src/features/tails/shaders/`

Then import them with `?raw` (as above).

Tip: the simplest approach is to copy an existing shader pair (e.g. `comet.vert.glsl` + `comet.frag.glsl`) and iterate from there.

### 3) Verify it appears in Settings

All files matching `src/features/tails/*Tail.ts` are eagerly imported by `src/features/tails/index.ts`, so registration happens automatically.

Run:

```bash
npm run tauri dev
```

Then open Settings from the tray and check **Effects**.

If it doesn’t show up:

- Confirm the filename ends with `Tail.ts`
- Confirm `registerTail({ ... })` runs (no early exceptions)
- Check the devtools console for shader compile/link errors
- Confirm the `id` is unique

### Shader interface (what your GLSL can rely on)

Tails share the same per-instance attributes and core uniforms (defined in `src/features/tails/BaseTail.ts`):

- Attributes: `a_quadPos`, `i_position`, `i_velocity`, `i_spawnTime`, `i_lifeTime`, `i_color`
- Uniforms: `u_resolution`, `u_time`, `u_sizeMultiplier`, `u_lengthMultiplier`, `u_opacityMultiplier`

Need extra uniforms? Override `setupCustomUniforms()` and `applyCustomUniforms()` in your tail class.

### Optional: add an icon

Settings uses per-tail icons keyed by `id`. Unknown ids fall back to a generic icon.

To add a custom icon, add your tail `id` to `TAIL_ICONS` in `src/windows/settings/main.ts`.

## Adding a new theme

Themes are defined in:

- `src/shared/config/themes.ts`

Add an entry to `ThemeRegistry`:

- `id`: unique string
- `name`: user-visible label
- `rgb`: `[r, g, b]` where each component is `0..1`

## Code style

- Formatting: Prettier (`.prettierrc`)
- Linting: ESLint (`.eslintrc.cjs`)

Commands:

```bash
npx prettier -w .

npx eslint .
```

## Pull requests

- Keep PRs focused (one effect / one feature)
- Include screenshots or a short recording for visual changes
- Mention performance impact if relevant (particle count, frame time, CPU usage)
