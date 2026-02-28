// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            use tauri::Manager;
            let window = app.get_webview_window("main").unwrap();
            
            #[cfg(target_os = "windows")]
            {
                use windows::Win32::Foundation::HWND;
                use windows::Win32::UI::WindowsAndMessaging::{
                    GetWindowLongW, SetWindowLongW, GWL_EXSTYLE, WS_EX_LAYERED, WS_EX_TRANSPARENT,
                    GetSystemMetrics, SM_XVIRTUALSCREEN, SM_YVIRTUALSCREEN, SM_CXVIRTUALSCREEN, SM_CYVIRTUALSCREEN,
                    SetWindowPos, HWND_TOPMOST, SWP_NOZORDER, SWP_NOACTIVATE
                };
                let hwnd: HWND = HWND(window.hwnd().unwrap().0 as _);
                unsafe {
                    // Make click-through and layered
                    let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
                    SetWindowLongW(
                        hwnd,
                        GWL_EXSTYLE,
                        ex_style | (WS_EX_LAYERED.0 as i32) | (WS_EX_TRANSPARENT.0 as i32),
                    );

                    // Resize to cover all monitors
                    let x = GetSystemMetrics(SM_XVIRTUALSCREEN);
                    let y = GetSystemMetrics(SM_YVIRTUALSCREEN);
                    let cx = GetSystemMetrics(SM_CXVIRTUALSCREEN);
                    let cy = GetSystemMetrics(SM_CYVIRTUALSCREEN);

                    SetWindowPos(
                        hwnd,
                        Some(HWND_TOPMOST),
                        x, y, cx, cy,
                        SWP_NOZORDER | SWP_NOACTIVATE
                    ).unwrap();
                }
            }
            
            // Mouse tracking thread
            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                #[cfg(target_os = "windows")]
                {
                    use windows::Win32::UI::WindowsAndMessaging::{
                        GetCursorPos, GetSystemMetrics, SM_XVIRTUALSCREEN, 
                        SM_YVIRTUALSCREEN, SM_CXVIRTUALSCREEN, SM_CYVIRTUALSCREEN
                    };
                    use windows::Win32::Foundation::POINT;
                    use tauri::Emitter;
                    use std::time::Duration;

                    let mut last_pos = (0.0, 0.0);

                    loop {
                        let mut point = POINT::default();
                        unsafe {
                            if GetCursorPos(&mut point).is_ok() {
                                let offset_x = GetSystemMetrics(SM_XVIRTUALSCREEN);
                                let offset_y = GetSystemMetrics(SM_YVIRTUALSCREEN);
                                let cx = GetSystemMetrics(SM_CXVIRTUALSCREEN);
                                let cy = GetSystemMetrics(SM_CYVIRTUALSCREEN);

                                if cx > 0 && cy > 0 {
                                    let nx = (point.x - offset_x) as f64 / cx as f64;
                                    let ny = (point.y - offset_y) as f64 / cy as f64;
                                    
                                    if (nx - last_pos.0).abs() > 0.0001 || (ny - last_pos.1).abs() > 0.0001 {
                                        app_handle.emit("cursor-move", (nx, ny)).unwrap_or(());
                                        last_pos = (nx, ny);
                                    }
                                }
                            }
                        }
                        std::thread::sleep(Duration::from_millis(8)); // ~120Hz
                    }
                }
            });
            
            // System tray menu
            use tauri::menu::{Menu, MenuItem};
            use tauri::tray::TrayIconBuilder;

            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>).unwrap();
            let settings_i = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>).unwrap();
            let menu = Menu::with_items(app, &[&settings_i, &quit_i]).unwrap();
            
            let tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "settings" => {
                        let _ = tauri::WebviewWindowBuilder::new(
                            app,
                            "settings",
                            tauri::WebviewUrl::App("src/windows/settings/index.html".into())
                        )
                        .title("CursorTrail Settings")
                        .inner_size(350.0, 480.0) // Bumped height for the new UX
                        .resizable(false)
                        .build();
                    }
                    _ => {}
                })
                .build(app).unwrap();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
