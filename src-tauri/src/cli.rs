pub(crate) const HELP_TEXT: &str = r#"amdv - Markdown Viewer

Usage: amdv [options] <file.md>

Options:
  -i, --interactive    Interactive review mode (Accept/Reject)
  -h, --help           Show this help message
  -st, --set-theme     Set theme (default-light, default-dark, purple, blue, green, red, red-light)
  --list-themes        List available themes
"#;

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct CliOptions {
    pub(crate) file_path: Option<String>,
    pub(crate) interactive: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum ParsedCommand {
    Help,
    ListThemes,
    SetTheme(String),
    Run(CliOptions),
}

/// Parses command-line arguments into the action the application should perform.
pub(crate) fn parse_cli(args: &[String]) -> Result<ParsedCommand, String> {
    let mut interactive = false;
    let mut file_path = None;
    let mut set_theme = None;
    let mut show_help = false;
    let mut list_themes = false;

    let mut index = 1;
    while index < args.len() {
        let arg = &args[index];
        match arg.as_str() {
            "-h" | "--help" => show_help = true,
            "--list-themes" => list_themes = true,
            "-i" | "--interactive" => interactive = true,
            "-st" | "--set-theme" => {
                let Some(theme) = args.get(index + 1) else {
                    return Err("Missing theme name after --set-theme".to_string());
                };
                if theme.starts_with('-') {
                    return Err("Missing theme name after --set-theme".to_string());
                }

                set_theme = Some(theme.clone());
                index += 1;
            }
            _ if !arg.starts_with('-') && file_path.is_none() => file_path = Some(arg.clone()),
            _ => {}
        }

        index += 1;
    }

    if show_help {
        return Ok(ParsedCommand::Help);
    }
    if list_themes {
        return Ok(ParsedCommand::ListThemes);
    }
    if let Some(theme) = set_theme {
        return Ok(ParsedCommand::SetTheme(theme));
    }

    Ok(ParsedCommand::Run(CliOptions {
        file_path,
        interactive,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_cli_reads_theme_value() {
        let args = vec![
            "amdv".to_string(),
            "--set-theme".to_string(),
            "red".to_string(),
        ];

        assert_eq!(
            parse_cli(&args).unwrap(),
            ParsedCommand::SetTheme("red".to_string())
        );
    }

    #[test]
    fn parse_cli_requires_theme_value() {
        let args = vec!["amdv".to_string(), "--set-theme".to_string()];

        assert!(parse_cli(&args).is_err());
    }

    #[test]
    fn parse_cli_detects_help_and_list_modes() {
        let help_args = vec!["amdv".to_string(), "--help".to_string()];
        let list_args = vec!["amdv".to_string(), "--list-themes".to_string()];

        assert_eq!(parse_cli(&help_args).unwrap(), ParsedCommand::Help);
        assert_eq!(parse_cli(&list_args).unwrap(), ParsedCommand::ListThemes);
    }

    #[test]
    fn parse_cli_extracts_interactive_mode_and_path() {
        let args = vec![
            "amdv".to_string(),
            "--interactive".to_string(),
            "plan.md".to_string(),
        ];

        assert_eq!(
            parse_cli(&args).unwrap(),
            ParsedCommand::Run(CliOptions {
                file_path: Some("plan.md".to_string()),
                interactive: true,
            })
        );
    }

    #[test]
    fn parse_cli_returns_none_when_no_file_path_exists() {
        let args = vec!["amdv".to_string(), "--interactive".to_string()];

        assert_eq!(
            parse_cli(&args).unwrap(),
            ParsedCommand::Run(CliOptions {
                file_path: None,
                interactive: true,
            })
        );
    }

    #[test]
    fn parse_cli_keeps_first_positional_file_argument() {
        let args = vec![
            "amdv".to_string(),
            "plan.md".to_string(),
            "notes.md".to_string(),
            "--interactive".to_string(),
        ];

        assert_eq!(
            parse_cli(&args).unwrap(),
            ParsedCommand::Run(CliOptions {
                file_path: Some("plan.md".to_string()),
                interactive: true,
            })
        );
    }

    #[test]
    fn parse_cli_supports_file_before_interactive_flag() {
        let args = vec![
            "amdv".to_string(),
            "plan.md".to_string(),
            "--interactive".to_string(),
        ];

        assert_eq!(
            parse_cli(&args).unwrap(),
            ParsedCommand::Run(CliOptions {
                file_path: Some("plan.md".to_string()),
                interactive: true,
            })
        );
    }

    #[test]
    fn parse_cli_help_has_priority_over_other_flags() {
        let args = vec![
            "amdv".to_string(),
            "--help".to_string(),
            "--set-theme".to_string(),
            "red".to_string(),
        ];

        assert_eq!(parse_cli(&args).unwrap(), ParsedCommand::Help);
    }

    #[test]
    fn parse_cli_list_themes_has_priority_over_set_theme() {
        let args = vec![
            "amdv".to_string(),
            "--list-themes".to_string(),
            "--set-theme".to_string(),
            "red".to_string(),
        ];

        assert_eq!(parse_cli(&args).unwrap(), ParsedCommand::ListThemes);
    }
}
