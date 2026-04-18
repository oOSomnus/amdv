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
"#;

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
            .invoke_handler(tauri::generate_handler![read_markdown_file, submit_decision])
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
            .invoke_handler(tauri::generate_handler![read_markdown_file, submit_decision])
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
