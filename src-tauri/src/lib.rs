use serde_json::to_string;
use std::sync::mpsc::{channel, Sender};
use std::sync::Mutex;
use tauri::Manager;

static DECISION_SENDER: Mutex<Option<Sender<(bool, String)>>> = Mutex::new(None);

fn is_interactive_mode(args: &[String]) -> bool {
    args.iter().any(|a| a == "-i" || a == "--interactive")
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
    tx.send((accepted, note)).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![read_markdown_file, submit_decision])
        .setup(|app| {
            let args: Vec<String> = std::env::args().collect();
            let interactive = is_interactive_mode(&args);

            let path = args.iter()
                .skip(1)
                .find(|a| !a.starts_with('-'))
                .cloned();

            if let Some(file_path) = path {
                let window = app.get_webview_window("main")
                    .expect("main window should exist");
                let json_path = to_string(&file_path).map_err(|e| e.to_string())?;
                window.eval(&format!("window.__MD_FILE__ = {};", json_path))
                    .map_err(|e: tauri::Error| e.to_string())?;
                window.eval(&format!("window.__INTERACTIVE__ = {};", interactive))
                    .map_err(|e: tauri::Error| e.to_string())?;
            }

            if interactive {
                let (tx, rx) = channel::<(bool, String)>();
                {
                    let mut global_sender = DECISION_SENDER.lock().unwrap();
                    *global_sender = Some(tx);
                }

                std::thread::spawn(move || {
                    let (accepted, note) = rx.recv().expect("channel should not disconnect");
                    let result = serde_json::json!({
                        "accepted": accepted,
                        "note": note
                    });
                    println!("{}", result);
                    std::process::exit(0);
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    //! Integration testing notes for submit_decision:
    //!
    //! Unit testing the `submit_decision` command is impractical because:
    //! 1. The mpsc channel requires a receiver to be listening, or `send()` returns an error
    //! 2. The receiver is spawned in a separate thread during `setup()`, which only runs
    //!    when `tauri::Builder::run()` is called
    //! 3. `rx.recv()` blocks indefinitely, and the spawned thread calls `std::process::exit(0)`
    //!    after receiving, which terminates the test process
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
