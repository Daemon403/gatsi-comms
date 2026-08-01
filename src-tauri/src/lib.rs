use std::net::TcpStream;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::Manager;

struct ServerState {
    node_child: Mutex<Option<Child>>,
}

fn normalize_path(path: &std::path::Path) -> std::path::PathBuf {
    let s = path.to_string_lossy().replace("\\\\?\\", "").replace("//?/", "");
    std::path::PathBuf::from(s)
}

fn wait_for_port(port: u16, timeout_secs: u64) -> bool {
    let start = std::time::Instant::now();
    while start.elapsed().as_secs() < timeout_secs {
        if TcpStream::connect(format!("127.0.0.1:{}", port)).is_ok() {
            return true;
        }
        thread::sleep(Duration::from_millis(500));
    }
    false
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let handle = app.handle().clone();

            #[cfg(not(target_os = "android"))]
            {
                if cfg!(debug_assertions) {
                    app.manage(ServerState {
                        node_child: Mutex::new(None),
                    });
                    return Ok(());
                }

                let resource_dir = normalize_path(&handle.path().resource_dir()?);
                let node_bin = resource_dir.join("resources").join("nodejs").join("node.exe");
                let nextjs_dir = resource_dir.join("resources").join("nextjs");
                let server_port: u16 = 3987;

                let db_url = std::env::var("DATABASE_URL")
                    .expect("DATABASE_URL environment variable must be set");

                log::info!("Starting Next.js server on port {}...", server_port);
                let node_child = match Command::new(&node_bin)
                    .args([&nextjs_dir.join("server.js")])
                    .env("PORT", server_port.to_string())
                    .env("POSTGRES_PRISMA_URL", &db_url)
                    .env("DATABASE_URL", &db_url)
                    .env("NODE_ENV", "production")
                    .current_dir(&nextjs_dir)
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .spawn()
                {
                    Ok(child) => child,
                    Err(e) => {
                        log::error!("Failed to start Node.js server: {}", e);
                        return Err(Box::new(e));
                    }
                };

                app.manage(ServerState {
                    node_child: Mutex::new(Some(node_child)),
                });

                let handle_nav = handle.clone();
                thread::spawn(move || {
                    if !wait_for_port(server_port, 60) {
                        log::error!("Next.js server failed to become ready within 60 seconds");
                        return;
                    }
                    log::info!("Server is ready, navigating webview...");
                    let h = handle_nav.clone();
                    let _ = handle_nav.run_on_main_thread(move || {
                        if let Some(window) = h.get_webview_window("main") {
                            let _ = window.eval(&format!("window.location.href = 'http://localhost:{}'", server_port));
                        }
                    });
                });
            }

            #[cfg(target_os = "android")]
            {
                app.manage(ServerState {
                    node_child: Mutex::new(None),
                });
                log::info!("Android: window url loads deployed app directly from config");
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                log::info!("Shutting down...");
                let state = window.state::<ServerState>();
                if let Some(mut child) = state.node_child.lock().unwrap().take() {
                    let _ = child.kill();
                    let _ = child.wait();
                };
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
