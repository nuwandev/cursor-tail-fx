use tauri::Manager;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Condvar, Mutex};

/// Shared backend gate for enabling/disabling the cursor polling thread.
struct TailGate {
    enabled: AtomicBool,
    wait_lock: Mutex<()>,
    cv: Condvar,
}

impl TailGate {
    /// Create a new TailGate, initially enabled or disabled.
    fn new(enabled: bool) -> Self {
        Self {
            enabled: AtomicBool::new(enabled),
            wait_lock: Mutex::new(()),
            cv: Condvar::new(),
        }
    }

    /// Enable or disable the gate. Wakes any waiting threads if enabled.
    fn set_enabled(&self, enabled: bool) {
        self.enabled.store(enabled, Ordering::Relaxed);
        if enabled {
            self.cv.notify_all();
        }
    }

    /// Returns true if the gate is enabled.
    fn is_enabled(&self) -> bool {
        self.enabled.load(Ordering::Relaxed)
    }

    /// Block the calling thread until the gate is enabled.
    fn wait_until_enabled(&self) {
        let mut guard = self.wait_lock.lock().unwrap();
        while !self.is_enabled() {
            guard = self.cv.wait(guard).unwrap();
        }
    }
}

/// Quits the application.
#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}

/// Enable or disable autostart on Windows (per-user Run key).
/// If enable=true and a stale entry exists, it is updated to the current exe path.
#[tauri::command]
fn set_autostart(enable: bool) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::*;
        use winreg::RegKey;

        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        let exe_str = exe
            .to_str()
            .ok_or_else(|| "executable path not valid unicode".to_string())?;

        let key_path = r"Software\Microsoft\Windows\CurrentVersion\Run";
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let (key, _disp) = hkcu
            .create_subkey(key_path)
            .map_err(|e| format!("failed to open registry key: {}", e))?;

        let value_name = "cursor-tail";

        if enable {
            // Quote the path to be safe. Exact path ensures Windows can find the executable.
            let cmd = format!("\"{}\"", exe_str);
            key.set_value(value_name, &cmd)
                .map_err(|e| format!("failed to set registry value: {}", e))?;
        } else {
            let _ = key.delete_value(value_name);
        }

        Ok(true)
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("autostart is only supported on Windows in this build".into())
    }
}

/// Returns whether autostart is enabled for this app (Windows only).
/// Handles cases where the app was moved or path changed, and normalizes the comparison.
#[tauri::command]
fn is_autostart_enabled() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::*;
        use winreg::RegKey;

        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        let exe_str = exe
            .to_str()
            .ok_or_else(|| "executable path not valid unicode".to_string())?;

        let key_path = r"Software\Microsoft\Windows\CurrentVersion\Run";
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);

        match hkcu.open_subkey(key_path) {
            Ok(key) => match key.get_value::<String, &str>("cursor-tail") {
                Ok(val) => {
                    // Normalize: remove quotes and convert to lowercase for case-insensitive comparison
                    // (Windows NTFS is case-insensitive but Rust paths preserve case)
                    let stored_path = val.trim_matches('"').to_lowercase();
                    let current_path = exe_str.to_lowercase();

                    // Match if the stored path is our current exe
                    Ok(stored_path == current_path)
                }
                Err(_) => Ok(false),
            },
            Err(_) => Ok(false),
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("autostart is only supported on Windows in this build".into())
    }
}

/// Enables or disables the tail effect (gates the polling thread).
#[tauri::command]
fn set_tail_enabled(enabled: bool, gate: tauri::State<'_, Arc<TailGate>>) {
    gate.set_enabled(enabled);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    fn show_settings_window(app: &tauri::AppHandle) {
        if let Some(win) = app.get_webview_window("settings") {
            let _ = win.show();
            let _ = win.set_focus();
            return;
        }

        let _ = tauri::WebviewWindowBuilder::new(
            app,
            "settings",
            tauri::WebviewUrl::App("src/windows/settings/index.html".into()),
        )
        .title("Cursora | Settings")
        .inner_size(860.0, 620.0)
        .min_inner_size(700.0, 520.0)
        .resizable(true)
        .build();
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // Enforce single-instance: subsequent launches activate the existing instance.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_settings_window(app);
        }))
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // Shared backend gate: disables polling thread when effect is off.
            let gate = Arc::new(TailGate::new(true));
            app.manage(gate.clone());

            #[cfg(target_os = "windows")]
            {
                use windows::Win32::Foundation::HWND;
                use windows::Win32::UI::WindowsAndMessaging::{
                    GetSystemMetrics, GetWindowLongW, SetWindowLongW, SetWindowPos, GWL_EXSTYLE,
                    HWND_TOPMOST, SM_CXVIRTUALSCREEN, SM_CYVIRTUALSCREEN, SM_XVIRTUALSCREEN,
                    SM_YVIRTUALSCREEN, SWP_NOACTIVATE, SWP_NOZORDER, WS_EX_LAYERED,
                    WS_EX_TRANSPARENT,
                };

                let hwnd: HWND = HWND(window.hwnd().unwrap().0 as _);
                unsafe {
                    // Make overlay window click-through and layered (transparent)
                    let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
                    SetWindowLongW(
                        hwnd,
                        GWL_EXSTYLE,
                        ex_style | (WS_EX_LAYERED.0 as i32) | (WS_EX_TRANSPARENT.0 as i32),
                    );

                    // Stretch overlay to cover all monitors (multi-monitor setups)
                    let x = GetSystemMetrics(SM_XVIRTUALSCREEN);
                    let y = GetSystemMetrics(SM_YVIRTUALSCREEN);
                    let cx = GetSystemMetrics(SM_CXVIRTUALSCREEN);
                    let cy = GetSystemMetrics(SM_CYVIRTUALSCREEN);

                    SetWindowPos(
                        hwnd,
                        Some(HWND_TOPMOST),
                        x,
                        y,
                        cx,
                        cy,
                        SWP_NOZORDER | SWP_NOACTIVATE,
                    )
                    .unwrap();
                }
            }

            // Mouse-tracking thread: emits normalized cursor position for overlay
            let app_handle = app.handle().clone();
            let gate_for_thread = gate.clone();
            std::thread::spawn(move || {
                #[cfg(target_os = "windows")]
                {
                    use std::time::Duration;
                    use tauri::Emitter;
                    use windows::Win32::Foundation::POINT;
                    use windows::Win32::UI::WindowsAndMessaging::{
                        GetCursorPos, GetSystemMetrics, SM_CXVIRTUALSCREEN, SM_CYVIRTUALSCREEN,
                        SM_XVIRTUALSCREEN, SM_YVIRTUALSCREEN,
                    };

                    let mut last_pos = (-1.0f64, -1.0f64);
                    let mut idle_ticks: u32 = 0;

                    // Cache virtual screen dimensions; refresh every ~5s to catch monitor changes.
                    let mut screen_cache_ticks: u32 = 0;
                    let mut vx: i32 = 0;
                    let mut vy: i32 = 0;
                    let mut vw: i32 = 1;
                    let mut vh: i32 = 1;

                    loop {
                        // Block polling when disabled (saves CPU, avoids Win32 calls).
                        if !gate_for_thread.is_enabled() {
                            gate_for_thread.wait_until_enabled();
                            // Reset so the first post-enable move emits immediately.
                            last_pos = (-1.0f64, -1.0f64);
                            idle_ticks = 0;
                            screen_cache_ticks = 0;
                        }

                        // Refresh screen dimensions every 600 ticks (~5s at 8ms polling)
                        if screen_cache_ticks == 0 {
                            unsafe {
                                vx = GetSystemMetrics(SM_XVIRTUALSCREEN);
                                vy = GetSystemMetrics(SM_YVIRTUALSCREEN);
                                vw = GetSystemMetrics(SM_CXVIRTUALSCREEN).max(1);
                                vh = GetSystemMetrics(SM_CYVIRTUALSCREEN).max(1);
                            }
                        }
                        screen_cache_ticks = (screen_cache_ticks + 1) % 600;

                        let mut point = POINT::default();
                        unsafe {
                            if GetCursorPos(&mut point).is_ok() {
                                let nx = (point.x - vx) as f64 / vw as f64;
                                let ny = (point.y - vy) as f64 / vh as f64;

                                let dx = (nx - last_pos.0).abs();
                                let dy = (ny - last_pos.1).abs();

                                if dx > 0.00001 || dy > 0.00001 {
                                    let _ = app_handle.emit("cursor-move", (nx, ny));
                                    last_pos = (nx, ny);
                                    idle_ticks = 0;
                                } else {
                                    idle_ticks = idle_ticks.saturating_add(1);
                                }
                            }
                        }

                        // Adaptive polling: fast when active, slow when idle to save CPU
                        if idle_ticks >= 100 {
                            std::thread::sleep(Duration::from_millis(100));
                        } else {
                            std::thread::sleep(Duration::from_millis(8));
                        }
                    }
                }
            });

            use tauri::menu::{Menu, MenuItem};
            use tauri::tray::TrayIconBuilder;

            let toggle_tail_i =
                MenuItem::with_id(app, "toggle_tail", "Toggle Tail Effect", true, None::<&str>)
                    .unwrap();
            let settings_i =
                MenuItem::with_id(app, "settings", "Open Settings", true, None::<&str>).unwrap();
            let quit_i =
                MenuItem::with_id(app, "quit", "Quit Cursora", true, None::<&str>).unwrap();
            let menu = Menu::with_items(app, &[&toggle_tail_i, &settings_i, &quit_i]).unwrap();

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "toggle_tail" => {
                        // State and persistence are handled in the frontend; this just emits the event.
                        use tauri::Emitter;
                        let _ = app.emit("tray-toggle-tail", ());
                    }
                    "quit" => app.exit(0),
                    "settings" => {
                        show_settings_window(app);
                    }
                    _ => {}
                })
                .build(app)
                .unwrap();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            quit_app,
            set_tail_enabled,
            set_autostart,
            is_autostart_enabled
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
