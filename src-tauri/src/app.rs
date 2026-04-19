use crate::cli::CliOptions;
use crate::{interactive, theme};
use serde_json::to_string;
use tauri::Manager;

#[tauri::command]
fn read_markdown_file(path: &str) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|error| error.to_string())
}

#[tauri::command]
fn submit_decision(accepted: bool, note: String) -> Result<(), String> {
    interactive::submit_decision(accepted, note)
}

#[tauri::command]
fn get_theme() -> Result<String, String> {
    theme::get_theme()
}

#[tauri::command]
fn set_theme(theme: String) -> Result<bool, String> {
    theme::set_theme(theme)
}

fn inject_window_state(window: &tauri::WebviewWindow, options: &CliOptions) -> Result<(), String> {
    if let Some(file_path) = &options.file_path {
        let json_path = to_string(file_path).map_err(|error| error.to_string())?;
        window
            .eval(&format!("window.__MD_FILE__ = {json_path};"))
            .map_err(|error| error.to_string())?;
    }

    window
        .eval(&format!(
            "window.__INTERACTIVE__ = {};",
            options.interactive
        ))
        .map_err(|error| error.to_string())?;

    Ok(())
}

fn build_app(options: CliOptions) -> tauri::Builder<tauri::Wry> {
    let interactive_mode = options.interactive;
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_markdown_file,
            submit_decision,
            get_theme,
            set_theme
        ])
        .setup(move |app| {
            let window = app
                .get_webview_window("main")
                .expect("main window should exist");

            inject_window_state(&window, &options)?;
            if interactive_mode {
                interactive::setup_interactive_close_handler(&window);
            }

            Ok(())
        })
}

pub(crate) fn run_application(options: CliOptions) {
    if options.interactive {
        interactive::initialize_interactive_mode();
    }

    build_app(options)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
