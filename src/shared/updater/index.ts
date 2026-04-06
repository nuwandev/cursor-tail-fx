import { check } from "@tauri-apps/plugin-updater";

let inFlight: Promise<void> | null = null;

export type UpdateCheckSource = "startup" | "settings";

export async function checkForUpdates(options: {
  source: UpdateCheckSource;
  showNoUpdateDialog?: boolean;
}): Promise<void> {
  if (import.meta.env.DEV) {
    if (options.source === "settings") {
      globalThis.alert("Updates are disabled in dev builds. Build a release to test the updater.");
    }
    return;
  }

  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const update = await check();

      if (!update) {
        if (options.showNoUpdateDialog) window.alert("You're up to date.");
        return;
      }

      const confirmed = window.confirm(`Update available: ${update.version}. Install now?`);
      if (!confirmed) return;

      await update.downloadAndInstall();
    } catch (err) {
      console.error("Update check failed:", err);
      if (options.source === "settings") {
        window.alert("Update check failed. Please try again later.");
      }
    }
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
