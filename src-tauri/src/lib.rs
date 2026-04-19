use serde::Deserialize;
use serde_json::{json, to_string};
use std::path::PathBuf;
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

const CONFIG_DIR: &str = ".config/amdv";
const CONFIG_FILE: &str = "config.json";
const FALLBACK_THEME_ID: &str = "default-light";
const THEME_METADATA_JSON: &str = include_str!("../../src/themes/metadata.json");

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ThemeCatalog {
    default_theme: String,
    themes: Vec<ThemeDefinition>,
}

#[derive(Debug, Clone, Deserialize)]
struct ThemeDefinition {
    id: String,
    label: String,
}

#[derive(Debug, PartialEq, Eq)]
struct CliOptions {
    file_path: Option<String>,
    interactive: bool,
}

fn load_theme_catalog() -> Result<ThemeCatalog, String> {
    serde_json::from_str(THEME_METADATA_JSON).map_err(|error| error.to_string())
}

fn default_theme_id() -> String {
    load_theme_catalog()
        .map(|catalog| catalog.default_theme)
        .unwrap_or_else(|_| FALLBACK_THEME_ID.to_string())
}

fn available_theme_ids() -> Result<Vec<String>, String> {
    load_theme_catalog().map(|catalog| catalog.themes.into_iter().map(|theme| theme.id).collect())
}

fn available_themes_text() -> Result<String, String> {
    let catalog = load_theme_catalog()?;
    let mut lines = vec!["Available themes:".to_string()];
    lines.extend(
        catalog
            .themes
            .into_iter()
            .map(|theme| format!("  {:<13} - {}", theme.id, theme.label)),
    );
    Ok(lines.join("\n"))
}

fn is_valid_theme(theme: &str) -> bool {
    match available_theme_ids() {
        Ok(theme_ids) => theme_ids.iter().any(|candidate| candidate == theme),
        Err(_) => theme == FALLBACK_THEME_ID,
    }
}

fn get_config_path() -> Option<PathBuf> {
    dirs::home_dir().map(|home_dir| home_dir.join(CONFIG_DIR).join(CONFIG_FILE))
}

fn ensure_config_dir() -> Result<(), String> {
    if let Some(config_path) = get_config_path() {
        if let Some(parent) = config_path.parent() {
            std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }
    }

    Ok(())
}

fn theme_from_config_content(content: &str) -> Option<String> {
    let json: serde_json::Value = serde_json::from_str(content).ok()?;
    let theme = json.get("theme")?.as_str()?;
    if is_valid_theme(theme) {
        Some(theme.to_string())
    } else {
        None
    }
}

#[tauri::command]
fn get_theme() -> Result<String, String> {
    let default_theme = default_theme_id();
    let Some(config_path) = get_config_path() else {
        return Ok(default_theme);
    };

    if !config_path.exists() {
        return Ok(default_theme);
    }

    let content = std::fs::read_to_string(&config_path).map_err(|error| error.to_string())?;
    Ok(theme_from_config_content(&content).unwrap_or(default_theme))
}

#[tauri::command]
fn set_theme(theme: String) -> Result<bool, String> {
    if !is_valid_theme(&theme) {
        let valid_themes = available_theme_ids()?.join(", ");
        return Err(format!(
            "Invalid theme '{}'. Valid themes: {}",
            theme, valid_themes
        ));
    }

    ensure_config_dir()?;
    if let Some(config_path) = get_config_path() {
        let config = json!({ "theme": theme });
        std::fs::write(&config_path, serde_json::to_string_pretty(&config).unwrap())
            .map_err(|error| error.to_string())?;
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
    args.iter().any(|arg| arg == "--list-themes")
}

fn is_interactive_mode(args: &[String]) -> bool {
    args.iter().any(|arg| arg == "-i" || arg == "--interactive")
}

fn is_help(args: &[String]) -> bool {
    args.iter().any(|arg| arg == "-h" || arg == "--help")
}

fn parse_cli_options(args: &[String]) -> CliOptions {
    CliOptions {
        file_path: args
            .iter()
            .skip(1)
            .find(|arg| !arg.starts_with('-'))
            .cloned(),
        interactive: is_interactive_mode(args),
    }
}

#[tauri::command]
fn read_markdown_file(path: &str) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|error| error.to_string())
}

#[tauri::command]
fn submit_decision(accepted: bool, note: String) -> Result<(), String> {
    let sender = DECISION_SENDER.lock().unwrap();
    let tx = sender.as_ref().ok_or("Interactive mode not initialized")?;
    tx.send((accepted, note)).map_err(|error| error.to_string())
}

fn print_and_exit_success(message: &str) -> ! {
    println!("{message}");
    std::process::exit(0);
}

fn print_and_exit_error(message: &str) -> ! {
    eprintln!("{message}");
    std::process::exit(1);
}

fn initialize_interactive_mode() {
    let (tx, rx) = channel::<(bool, String)>();
    {
        let mut global_sender = DECISION_SENDER.lock().unwrap();
        *global_sender = Some(tx);
    }

    std::thread::spawn(move || {
        let (accepted, note) = rx.recv().expect("channel should not disconnect");
        let result = json!({
            "accepted": accepted,
            "note": note
        });
        println!("{result}");
        std::process::exit(0);
    });
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

fn setup_interactive_close_handler(window: &tauri::WebviewWindow) {
    let window_clone = window.clone();
    window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            window_clone.emit("request-close-confirm", ()).ok();
        }
    });
}

fn build_app(options: CliOptions) -> tauri::Builder<tauri::Wry> {
    let interactive = options.interactive;
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
            if interactive {
                setup_interactive_close_handler(&window);
            }

            Ok(())
        })
}

fn run_application(options: CliOptions) {
    if options.interactive {
        initialize_interactive_mode();
    }

    build_app(options)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let args: Vec<String> = std::env::args().collect();

    if is_help(&args) {
        print_and_exit_success(HELP_TEXT);
    }

    if is_list_themes(&args) {
        match available_themes_text() {
            Ok(output) => print_and_exit_success(&output),
            Err(error) => print_and_exit_error(&format!("Failed to list themes: {error}")),
        }
    }

    match get_set_theme_arg(&args) {
        Ok(Some(theme)) => match set_theme(theme.clone()) {
            Ok(_) => print_and_exit_success(&format!("Theme set to: {theme}")),
            Err(error) => print_and_exit_error(&format!("Failed to set theme: {error}")),
        },
        Ok(None) => {}
        Err(error) => print_and_exit_error(&format!("Failed to set theme: {error}")),
    }

    run_application(parse_cli_options(&args));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn get_set_theme_arg_reads_theme_value() {
        let args = vec![
            "amdv".to_string(),
            "--set-theme".to_string(),
            "red".to_string(),
        ];

        assert_eq!(get_set_theme_arg(&args).unwrap(), Some("red".to_string()));
    }

    #[test]
    fn get_set_theme_arg_requires_value() {
        let args = vec!["amdv".to_string(), "--set-theme".to_string()];

        assert!(get_set_theme_arg(&args).is_err());
    }

    #[test]
    fn parse_cli_options_extracts_interactive_mode_and_path() {
        let args = vec![
            "amdv".to_string(),
            "--interactive".to_string(),
            "plan.md".to_string(),
        ];

        assert_eq!(
            parse_cli_options(&args),
            CliOptions {
                file_path: Some("plan.md".to_string()),
                interactive: true,
            }
        );
    }

    #[test]
    fn theme_validation_matches_shared_metadata() {
        assert!(is_valid_theme("default-light"));
        assert!(is_valid_theme("red-light"));
        assert!(!is_valid_theme("github-light"));
    }

    #[test]
    fn theme_from_config_content_returns_valid_theme() {
        let config = r#"{ "theme": "purple" }"#;
        assert_eq!(
            theme_from_config_content(config),
            Some("purple".to_string())
        );
    }

    #[test]
    fn theme_from_config_content_rejects_invalid_theme() {
        let config = r#"{ "theme": "legacy-theme" }"#;
        assert_eq!(theme_from_config_content(config), None);
    }

    #[test]
    fn default_theme_comes_from_shared_metadata() {
        assert_eq!(default_theme_id(), "default-light");
    }
}
