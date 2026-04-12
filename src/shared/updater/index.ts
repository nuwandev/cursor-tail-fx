export type UpdateCheckSource = "startup" | "settings";

/**
 * Updates are disabled for v1.
 * This stub is kept so any existing or future callsites still compile.
 */
export async function checkForUpdates(options: {
  source: UpdateCheckSource;
  showNoUpdateDialog?: boolean;
}): Promise<void> {
  if (options.source === "settings" && options.showNoUpdateDialog) {
    window.alert("Automatic updates are disabled in this version of Cursora.");
  }
}
