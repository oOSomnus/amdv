mod app;
mod cli;
mod interactive;
mod theme;

use cli::{parse_cli, ParsedCommand, HELP_TEXT};

fn print_and_exit_success(message: &str) -> ! {
    println!("{message}");
    std::process::exit(0);
}

fn print_and_exit_error(message: &str) -> ! {
    eprintln!("{message}");
    std::process::exit(1);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
/// Dispatches CLI commands and launches the application when a viewer session is requested.
pub fn run() {
    let args: Vec<String> = std::env::args().collect();

    match parse_cli(&args) {
        Ok(ParsedCommand::Help) => print_and_exit_success(HELP_TEXT),
        Ok(ParsedCommand::ListThemes) => match theme::available_themes_text() {
            Ok(output) => print_and_exit_success(&output),
            Err(error) => print_and_exit_error(&format!("Failed to list themes: {error}")),
        },
        Ok(ParsedCommand::SetTheme(theme_id)) => match theme::set_theme(theme_id.clone()) {
            Ok(_) => print_and_exit_success(&format!("Theme set to: {theme_id}")),
            Err(error) => print_and_exit_error(&format!("Failed to set theme: {error}")),
        },
        Ok(ParsedCommand::Run(options)) => app::run_application(options),
        Err(error) => print_and_exit_error(&format!("Failed to set theme: {error}")),
    }
}
