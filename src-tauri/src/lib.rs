use serde_json::to_string;
use tauri::Manager;

// Note: fs:allow-read-text-file permission is intentionally broad to support
// reading user-provided CLI arguments (markdown files from any path).
// This is acceptable for a CLI-based markdown viewer where users explicitly
// specify files to open via command line arguments.

#[tauri::command]
fn read_markdown_file(path: &str) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![read_markdown_file])
        .setup(|app| {
            let args: Vec<String> = std::env::args().collect();
            if args.len() > 1 {
                let path = args[1].clone();
                let window = app.get_webview_window("main")
                    .expect("main window should exist");
                let json_path = to_string(&path).expect("Failed to serialize path to JSON");
                window.eval(&format!(
                    "window.__MD_FILE__ = {};",
                    json_path
                )).map_err(|e: tauri::Error| e.to_string())?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
