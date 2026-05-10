# Cursora

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/nuwandev/cursor-tail-fx?display_name=tag)](https://github.com/nuwandev/cursor-tail-fx/releases)
[![Downloads](https://img.shields.io/github/downloads/nuwandev/cursor-tail-fx/total.svg)](https://github.com/nuwandev/cursor-tail-fx/releases)
![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-informational)

GPU‑accelerated cursor trail effects for Windows — built with **Tauri (Rust)** + **WebGL 2 (TypeScript)**.

Cursora runs as a click‑through overlay and renders particle trails using instanced drawing (up to 1,000 particles per frame) while keeping CPU usage low via adaptive cursor polling.

## Features

- Click‑through always‑on‑top overlay (multi‑monitor aware)
- Live settings UI (effect, theme, engine tuning)
- Tail effects are plug‑ins: add one `*Tail.ts` file (+ shaders) and it auto‑appears in Settings
- GPU friendly: WebGL2 instanced particles, capped to 60 fps

## Platform support

- **Windows 10/11:** supported (native cursor tracking + click‑through overlay are implemented via Win32)
- **macOS/Linux:** not currently supported as a full product experience (the app may build, but cursor tracking/overlay behavior are Windows-specific)

## Download & install (recommended)

1. Go to **Releases** for this repository.
2. Download the latest Windows installer / `.exe`.
3. Run it.

On first launch, Cursora starts in the background and shows a **system tray** icon.

## How to use

- **Open tray menu:** click the tray icon (left‑click shows the menu)
- **Open Settings:** tray menu → **Open Settings**
- **Toggle Tail Effect:** tray menu → **Toggle Tail Effect**
- **Quit:** tray menu → **Quit Cursora**

### Settings overview

- **Effects:** enable/disable the tail effect and choose a style (Comet, Orb, Sparkle, …)
- **Color Theme:** pick a preset theme color
- **Engine Tuning:** adjust particle scale, trail lifespan, and opacity (changes apply instantly)
- **Reset to Defaults:** resets the currently selected tail’s settings

## Troubleshooting

- **I can’t click through the overlay**
  - The overlay is designed to be click‑through. If it isn’t, try quitting and relaunching from the tray.
- **High CPU/GPU usage**
  - Effects are capped to 60 fps and idle aggressively when the cursor stops. If usage is still high, try lowering **Opacity** and **Particle Scale**.
- **Nothing shows up**
  - Ensure **Tail Effect** is enabled (Settings → Effects) and WebGL 2 is available on your machine/driver.

## Privacy

Cursora tracks cursor position locally to render the effect. It does not need an account, and it does not send cursor data to a server.

## Contributing

Most users just install and enjoy Cursora. If you want to build from source or contribute (especially new tail effects), see:

- [CONTRIBUTING.md](CONTRIBUTING.md)

## License

Licensed under the Apache License, Version 2.0.

Copyright © 2026 Theekshana Nuwan (nuwandev)

See [LICENSE](LICENSE) and [NOTICE](NOTICE).
