use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "windows")]
            {
                use windows::Win32::Foundation::HWND;
                use windows::Win32::UI::WindowsAndMessaging::{
                    GetSystemMetrics, GetWindowLongW, SetWindowLongW, SetWindowPos,
                    GWL_EXSTYLE, HWND_TOPMOST, SM_CXVIRTUALSCREEN, SM_CYVIRTUALSCREEN,
                    SM_XVIRTUALSCREEN, SM_YVIRTUALSCREEN, SWP_NOACTIVATE, SWP_NOZORDER,
                    WS_EX_LAYERED, WS_EX_TRANSPARENT,
                };

                let hwnd: HWND = HWND(window.hwnd().unwrap().0 as _);
                unsafe {
                    // Make the overlay window click-through and layered (transparent)
                    let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
                    SetWindowLongW(
                        hwnd,
                        GWL_EXSTYLE,
                        ex_style | (WS_EX_LAYERED.0 as i32) | (WS_EX_TRANSPARENT.0 as i32),
                    );

                    // Stretch overlay to cover all monitors in a multi-monitor setup
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

            // Spawn mouse-tracking thread — runs for the lifetime of the app
            let app_handle = app.handle().clone();
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

                    // Cache virtual screen dimensions — these only change on monitor
                    // connect/disconnect, not every frame. We refresh every ~5s to catch
                    // any runtime monitor changes without hammering the Win32 API.
                    let mut screen_cache_ticks: u32 = 0;
                    let mut vx: i32 = 0;
                    let mut vy: i32 = 0;
                    let mut vw: i32 = 1;
                    let mut vh: i32 = 1;

                    loop {
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

                        // Adaptive polling:
                        //   Active  (idle < 100 ticks) → poll at ~120 Hz (8ms)
                        //   Idle    (idle ≥ 100 ticks) → drop to  ~10 Hz (100ms) to save CPU
                        if idle_ticks >= 100 {
                            std::thread::sleep(Duration::from_millis(100));
                        } else {
                            std::thread::sleep(Duration::from_millis(8));
                        }
                    }
                }
            });

            // System tray: Settings and Quit menu items
            use tauri::menu::{Menu, MenuItem};
            use tauri::tray::TrayIconBuilder;

            let settings_i =
                MenuItem::with_id(app, "settings", "Open Settings", true, None::<&str>).unwrap();
            let quit_i =
                MenuItem::with_id(app, "quit", "Quit Cursora", true, None::<&str>).unwrap();
            let menu = Menu::with_items(app, &[&settings_i, &quit_i]).unwrap();

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "settings" => {
                        // If settings window already exists, focus it — don't open duplicates
                        if let Some(win) = app.get_webview_window("settings") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        } else {
                            let _ = tauri::WebviewWindowBuilder::new(
                                app,
                                "settings",
                                tauri::WebviewUrl::App(
                                    "src/windows/settings/index.html".into(),
                                ),
                            )
                            .title("Cursora — Settings")
                            .inner_size(860.0, 620.0)
                            .min_inner_size(700.0, 520.0)
                            .resizable(true)
                            .build();
                        }
                    }
                    _ => {}
                })
                .build(app)
                .unwrap();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
