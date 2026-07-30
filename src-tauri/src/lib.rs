use std::net::TcpStream;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::Manager;

struct ServerState {
    node_child: Mutex<Option<Child>>,
}

/// Strip the Windows extended-length path prefix (\\?\) which some programs can't handle.
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

            // In dev mode, skip server startup (use devUrl instead)
            if cfg!(debug_assertions) {
                app.manage(ServerState {
                    node_child: Mutex::new(None),
                });
                return Ok(());
            }

            let resource_dir = normalize_path(&handle.path().resource_dir()?);
            let app_dir = normalize_path(&handle.path().app_data_dir()?);

            let pg_dir = app_dir.join("pgdata");
            let pg_bin = resource_dir.join("resources").join("postgres").join("bin");
            let node_bin = resource_dir.join("resources").join("nodejs").join("node.exe");
            let nextjs_dir = resource_dir.join("resources").join("nextjs");

            let pg_port: u16 = 5434;
            let server_port: u16 = 3000;

            // Ensure app data directory exists
            std::fs::create_dir_all(&app_dir)?;

            // 1. Initialize PostgreSQL data dir if first run
            if !pg_dir.join("PG_VERSION").exists() {
                log::info!("Initializing PostgreSQL data directory...");
                let init_output = Command::new(pg_bin.join("initdb.exe"))
                    .args(["-D", &pg_dir.to_string_lossy(), "-A", "trust", "--no-instructions"])
                    .stdout(Stdio::piped())
                    .stderr(Stdio::piped())
                    .output()
                    .map_err(|e| format!("Failed to launch initdb: {}", e))?;
                if !init_output.status.success() {
                    let stderr = String::from_utf8_lossy(&init_output.stderr);
                    let stdout = String::from_utf8_lossy(&init_output.stdout);
                    log::error!("initdb stderr: {}", stderr);
                    log::error!("initdb stdout: {}", stdout);
                    return Err(Box::new(std::io::Error::new(
                        std::io::ErrorKind::Other,
                        format!("initdb failed with exit code: {:?}. stderr: {}", init_output.status.code(), stderr),
                    )));
                }
            }

            // 2. Kill any leftover PostgreSQL from previous session
            let _ = Command::new(pg_bin.join("pg_ctl.exe"))
                .args(["stop", "-D", &pg_dir.to_string_lossy(), "-m", "fast"])
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .status();
            thread::sleep(Duration::from_secs(2));

            // Remove stale lock file if present
            let pid_file = pg_dir.join("postmaster.pid");
            if pid_file.exists() {
                log::info!("Removing stale postmaster.pid...");
                let _ = std::fs::remove_file(&pid_file);
            }

            // 3. Start PostgreSQL
            log::info!("Starting PostgreSQL on port {}...", pg_port);
            let pg_log = app_dir.join("pg.log");
            let pg_start = Command::new(pg_bin.join("pg_ctl.exe"))
                .args([
                    "start",
                    "-D", &pg_dir.to_string_lossy(),
                    "-l", &pg_log.to_string_lossy(),
                    "-o", &format!("-p {} --listen_addresses=localhost", pg_port),
                    "-w",
                ])
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .status();
            match pg_start {
                Err(e) => {
                    log::error!("Failed to launch pg_ctl: {}", e);
                    return Err(Box::new(e));
                }
                Ok(status) if !status.success() => {
                    let msg = format!("pg_ctl start failed (exit code {:?}). Check {} for details.", status.code(), pg_log.display());
                    log::error!("{}", msg);
                    return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other, msg)));
                }
                _ => {}
            }
            if !wait_for_port(pg_port, 30) {
                log::error!("PostgreSQL failed to become ready within 30 seconds");
                let msg = format!("PostgreSQL failed to start on port {}. Check {} for details.", pg_port, pg_log.display());
                return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other, msg)));
            }

            // 4. Create database (ignore if exists)
            let _ = Command::new(pg_bin.join("psql.exe"))
                .args([
                    "-h", "localhost",
                    "-p", &pg_port.to_string(),
                    "-U", "postgres",
                    "-c", "CREATE DATABASE gatsi_comms",
                ])
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .status();

            // 5. Run init SQL
            let init_sql = nextjs_dir.join("prisma").join("init.sql");
            if init_sql.exists() {
                log::info!("Running database initialization SQL...");
                let _ = Command::new(pg_bin.join("psql.exe"))
                    .args([
                        "-h", "localhost",
                        "-p", &pg_port.to_string(),
                        "-U", "postgres",
                        "-d", "gatsi_comms",
                        "-f", &init_sql.to_string_lossy(),
                    ])
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .status();
            }

            // 6. Start Next.js server
            log::info!("Starting Next.js server on port {}...", server_port);
            let db_url = format!("postgresql://postgres@localhost:{}/gatsi_comms", pg_port);
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
                    let _ = Command::new(pg_bin.join("pg_ctl.exe"))
                        .args(["stop", "-D", &pg_dir.to_string_lossy()])
                        .status();
                    return Err(Box::new(e));
                }
            };

            app.manage(ServerState {
                node_child: Mutex::new(Some(node_child)),
            });

            // 7. Wait for server and navigate the webview
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
                        let _ = window.eval("window.location.href = 'http://localhost:3000'");
                    }
                });
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                log::info!("Shutting down...");
                let state = window.state::<ServerState>();
                if let Some(mut child) = state.node_child.lock().unwrap().take() {
                    let _ = child.kill();
                    let _ = child.wait();
                }
                let handle = window.app_handle();
                if let Ok(raw_resource_dir) = handle.path().resource_dir() {
                    if let Ok(raw_app_dir) = handle.path().app_data_dir() {
                        let resource_dir = normalize_path(&raw_resource_dir);
                        let app_dir = normalize_path(&raw_app_dir);
                        let pg_dir = app_dir.join("pgdata");
                        let pg_bin = resource_dir.join("resources").join("postgres").join("bin");
                        let _ = Command::new(pg_bin.join("pg_ctl.exe"))
                            .args(["stop", "-D", &pg_dir.to_string_lossy(), "-m", "fast"])
                            .status();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
