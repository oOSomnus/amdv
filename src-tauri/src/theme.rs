use serde::Deserialize;
use serde_json::json;
use std::path::PathBuf;

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

fn load_theme_catalog() -> Result<ThemeCatalog, String> {
    serde_json::from_str(THEME_METADATA_JSON).map_err(|error| error.to_string())
}

fn available_theme_ids() -> Result<Vec<String>, String> {
    load_theme_catalog().map(|catalog| catalog.themes.into_iter().map(|theme| theme.id).collect())
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

pub(crate) fn default_theme_id() -> String {
    load_theme_catalog()
        .map(|catalog| catalog.default_theme)
        .unwrap_or_else(|_| FALLBACK_THEME_ID.to_string())
}

pub(crate) fn available_themes_text() -> Result<String, String> {
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

pub(crate) fn is_valid_theme(theme: &str) -> bool {
    match available_theme_ids() {
        Ok(theme_ids) => theme_ids.iter().any(|candidate| candidate == theme),
        Err(_) => theme == FALLBACK_THEME_ID,
    }
}

pub(crate) fn theme_from_config_content(content: &str) -> Option<String> {
    let json: serde_json::Value = serde_json::from_str(content).ok()?;
    let theme = json.get("theme")?.as_str()?;
    if is_valid_theme(theme) {
        Some(theme.to_string())
    } else {
        None
    }
}

pub(crate) fn get_theme() -> Result<String, String> {
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

pub(crate) fn set_theme(theme: String) -> Result<bool, String> {
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

#[cfg(test)]
mod tests {
    use super::*;

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
    fn theme_from_config_content_rejects_missing_theme_and_invalid_json() {
        let missing_theme = r#"{ "mode": "purple" }"#;
        let invalid_json = r#"{ "theme": "#;

        assert_eq!(theme_from_config_content(missing_theme), None);
        assert_eq!(theme_from_config_content(invalid_json), None);
    }

    #[test]
    fn default_theme_comes_from_shared_metadata() {
        assert_eq!(default_theme_id(), "default-light");
    }

    #[test]
    fn available_themes_text_lists_header_and_known_themes() {
        let output = available_themes_text().expect("theme catalog should load");

        assert!(output.starts_with("Available themes:"));
        assert!(output.contains("default-light"));
        assert!(output.contains("Default Light"));
        assert!(output.contains("red-light"));
    }
}
