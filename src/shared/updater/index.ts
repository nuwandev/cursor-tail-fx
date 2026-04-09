export type UpdateCheckSource = "startup" | "settings";

export async function checkForUpdates(options: {
  source: UpdateCheckSource;
  showNoUpdateDialog?: boolean;
}): Promise<void> {
  // Updates are disabled for v1. This stub is kept so existing
  // call sites compile cleanly if referenced in the future.
  if (options.source === "settings" && options.showNoUpdateDialog) {
    window.alert("Automatic updates are disabled in this version of Cursora.");
  }
}
