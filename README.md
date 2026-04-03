# CursorTrail

GPU‑accelerated cursor trail effects for Windows — built with **Tauri (Rust)** + **WebGL 2 (TypeScript)**.

CursorTrail runs as a click‑through overlay and renders particle trails using instanced drawing (up to 1,000 particles per frame) while keeping CPU usage low via adaptive cursor polling.

## Features

- Click‑through always‑on‑top overlay (multi‑monitor aware)
- Live settings UI (effect, theme, engine tuning)
- Tail effects are plug‑ins: add one `*Tail.ts` file and it auto‑appears in Settings
- GPU friendly: WebGL2 instanced particles, capped to 60 fps

## Platform support

- **Windows 10/11:** supported (native cursor tracking + click‑through overlay are implemented via Win32)
- **macOS/Linux:** not currently supported as a full product experience (the app may build, but cursor tracking/overlay behavior are Windows-specific)

## Download & install (recommended)

1. Go to **Releases** for this repository.
2. Download the latest Windows installer / `.exe`.
3. Run it.

On first launch, CursorTrail starts in the background and shows a **system tray** icon.

## How to use

- **Open Settings:** right‑click the tray icon → **Open Settings**
- **Quit:** right‑click the tray icon → **Quit CursorTrail**

### Settings overview

- **Effects:** choose a tail style (Comet, Orb, Sparkle, …)
- **Color Theme:** pick a preset theme color
- **Engine Tuning:** adjust particle scale, trail lifespan, and opacity (changes apply instantly)
- **Reset to Defaults:** restores the default settings

## Troubleshooting

- **I can’t click through the overlay**
  - The overlay is designed to be click‑through. If it isn’t, try quitting and relaunching from the tray.
- **High CPU/GPU usage**
  - Effects are capped to 60 fps and idle aggressively when the cursor stops. If usage is still high, try lowering **Opacity** and **Particle Scale**.
- **Nothing shows up**
  - Ensure WebGL 2 is available on your machine/driver.

## Privacy

CursorTrail tracks cursor position locally to render the effect. It does not need an account, and it does not send cursor data to a server.

## Contributing

Most users just install and enjoy CursorTrail. If you want to build from source or contribute (especially new tail effects), see:

- [CONTRIBUTING.md](CONTRIBUTING.md)

## License

No license has been specified yet in this repository.
