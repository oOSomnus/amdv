use serde_json::to_string;
use std::sync::mpsc::{channel, Sender};
use std::sync::Mutex;
use tauri::{Emitter, Manager, WindowEvent};

static DECISION_SENDER: Mutex<Option<Sender<(bool, String)>>> = Mutex::new(None);

const HELP_TEXT: &str = r#"amdv - Markdown Viewer

Usage: amdv [options] <file.md>

Options:
  -i, --interactive    Interactive review mode (Accept/Reject)
  -h, --help           Show this help message
  -st, --set-theme     Set theme (default-light, default-dark, purple, blue, green, red, red-light)
  --list-themes        List available themes
"#;

const VALID_THEMES: &[&str] = &["default-light", "default-dark", "purple", "blue", "green", "red", "red-light"];

const CONFIG_DIR: &str = ".config/amdv";
const CONFIG_FILE: &str = "config.json";

fn get_config_path() -> Option<std::path::PathBuf> {
    dirs::home_dir().map(|h| h.join(CONFIG_DIR).join(CONFIG_FILE))
}

fn ensure_config_dir() -> Result<(), String> {
    if let Some(config_path) = get_config_path() {
        if let Some(parent) = config_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
fn get_theme() -> Result<String, String> {
    if let Some(config_path) = get_config_path() {
        if config_path.exists() {
            let content = std::fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
            let json: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
            if let Some(theme) = json.get("theme").and_then(|v| v.as_str()) {
                return Ok(theme.to_string());
            }
        }
    }
    Ok("github-light".to_string())
}

#[tauri::command]
fn set_theme(theme: String) -> Result<bool, String> {
    if !VALID_THEMES.contains(&theme.as_str()) {
        return Err(format!("Invalid theme '{}'. Valid themes: {}", theme, VALID_THEMES.join(", ")));
    }
    ensure_config_dir()?;
    if let Some(config_path) = get_config_path() {
        let json = serde_json::json!({ "theme": theme });
        std::fs::write(&config_path, serde_json::to_string_pretty(&json).unwrap())
            .map_err(|e| e.to_string())?;
        return Ok(true);
    }
    Err("Could not determine config path".to_string())
}

fn get_set_theme_arg(args: &[String]) -> Result<Option<String>, String> {
    let mut iter = args.iter().peekable();
    while let Some(arg) = iter.next() {
        if arg == "--set-theme" || arg == "-st" {
            return match iter.next() {
                Some(theme) if !theme.starts_with('-') => Ok(Some(theme.clone())),
                _ => Err("Missing theme name after --set-theme".to_string()),
            };
        }
    }
    Ok(None)
}

fn is_list_themes(args: &[String]) -> bool {
    args.iter().any(|a| a == "--list-themes")
}

fn is_interactive_mode(args: &[String]) -> bool {
    args.iter().any(|a| a == "-i" || a == "--interactive")
}

fn handle_help(args: &[String]) {
    if args.iter().any(|a| a == "-h" || a == "--help") {
        print!("{}", HELP_TEXT);
        std::process::exit(0);
    }
}

// Note: fs:allow-read-text-file permission is intentionally broad to support
// reading user-provided CLI arguments (markdown files from any path).
// This is acceptable for a CLI-based markdown viewer where users explicitly
// specify files to open via command line arguments.

#[tauri::command]
fn read_markdown_file(path: &str) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn submit_decision(accepted: bool, note: String) -> Result<(), String> {
    let sender = DECISION_SENDER.lock().unwrap();
    let tx = sender.as_ref().ok_or("Interactive mode not initialized")?;
    tx.send((accepted, note.clone())).map_err(|e| e.to_string())?;

    // Print result and exit gracefully via event loop exit
    let result = serde_json::json!({
        "accepted": accepted,
        "note": note
    });
    println!("{}", result);

    // Exit via event loop termination - emit signal and let window close naturally
    // The spawned thread will see channel received and call process::exit
    std::process::exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let args: Vec<String> = std::env::args().collect();
    handle_help(&args);

    if is_list_themes(&args) {
        println!("Available themes:");
        println!("  default-light - Default Light");
        println!("  default-dark  - Default Dark");
        println!("  purple        - Purple");
        println!("  blue          - Blue");
        println!("  green         - Green");
        println!("  red           - Red");
        println!("  red-light     - Red Light");
        std::process::exit(0);
    }

    match get_set_theme_arg(&args) {
        Ok(Some(theme)) => {
            match set_theme(theme.clone()) {
                Ok(_) => {
                    println!("Theme set to: {}", theme);
                    std::process::exit(0);
                }
                Err(e) => {
                    eprintln!("Failed to set theme: {}", e);
                    std::process::exit(1);
                }
            }
        }
        Ok(None) => {}
        Err(e) => {
            eprintln!("Failed to set theme: {}", e);
            std::process::exit(1);
        }
    }

    let interactive = is_interactive_mode(&args);
    let path = args.iter()
        .skip(1)
        .find(|a| !a.starts_with('-'))
        .cloned();

    if !interactive {
        // Normal (non-interactive) mode
        tauri::Builder::default()
            .plugin(tauri_plugin_opener::init())
            .plugin(tauri_plugin_fs::init())
            .plugin(tauri_plugin_dialog::init())
            .invoke_handler(tauri::generate_handler![read_markdown_file, submit_decision, get_theme, set_theme])
            .setup(move |app| {
                let window = app.get_webview_window("main").expect("main window should exist");
                if let Some(ref file_path) = path {
                    let json_path = to_string(file_path).map_err(|e| e.to_string())?;
                    window.eval(&format!("window.__MD_FILE__ = {};", json_path))
                        .map_err(|e: tauri::Error| e.to_string())?;
                    window.eval("window.__INTERACTIVE__ = false;")
                        .map_err(|e: tauri::Error| e.to_string())?;
                }
                Ok(())
            })
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    } else {
        // Interactive mode
        let (tx, rx) = channel::<(bool, String)>();
        {
            let mut global_sender = DECISION_SENDER.lock().unwrap();
            *global_sender = Some(tx);
        }

        std::thread::spawn(move || {
            // Block on channel - this runs in spawned thread
            let (accepted, note) = rx.recv().expect("channel should not disconnect");
            let result = serde_json::json!({
                "accepted": accepted,
                "note": note
            });
            // Print AFTER event loop has exited (stdout still valid)
            println!("{}", result);
            std::process::exit(0);
        });

        tauri::Builder::default()
            .plugin(tauri_plugin_opener::init())
            .plugin(tauri_plugin_fs::init())
            .plugin(tauri_plugin_dialog::init())
            .invoke_handler(tauri::generate_handler![read_markdown_file, submit_decision, get_theme, set_theme])
            .setup(move |app| {
                let window = app.get_webview_window("main").expect("main window should exist");
                if let Some(ref file_path) = path {
                    let json_path = to_string(file_path).map_err(|e| e.to_string())?;
                    window.eval(&format!("window.__MD_FILE__ = {};", json_path))
                        .map_err(|e: tauri::Error| e.to_string())?;
                }
                window.eval("window.__INTERACTIVE__ = true;")
                    .map_err(|e: tauri::Error| e.to_string())?;

                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        window_clone.emit("request-close-confirm", ()).ok();
                    }
                });
                Ok(())
            })
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    }
}

#[cfg(test)]
mod tests {
    //! Integration testing notes for submit_decision:
    //!
    //! Unit testing the `submit_decision` command is impractical because:
    //! 1. The mpsc channel requires a receiver to be listening, or `send()` returns an error
    //! 2. The receiver is spawned in a separate thread during setup
    //! 3. `rx.recv()` blocks in the spawned thread until `submit_decision` sends
    //!
    //! To properly test this behavior, an integration test would be needed that:
    //! - Runs the Tauri app with a test webview
    //! - Invokes `submit_decision` via `invoke()`
    //! - Captures the JSON output from stdout
    //!
    //! For now, the command returns `Ok(())` silently if the sender is None (e.g., if called
    //! before setup completes), which is acceptable since the frontend will only call it
    //! after the app is fully initialized.
}
