import { invoke } from '@tauri-apps/api/core';
import themeMetadataJson from './themes/metadata.json';
import './themes/markdown-base.css';
import './themes/default-light.css';
import './themes/default-dark.css';
import './themes/purple.css';
import './themes/blue.css';
import './themes/green.css';
import './themes/red.css';
import './themes/red-light.css';

interface ThemeDefinition {
  id: string;
  label: string;
}

interface ThemeMetadata {
  defaultTheme: string;
  themes: ThemeDefinition[];
}

const themeMetadata = themeMetadataJson as ThemeMetadata;

export const DEFAULT_THEME = themeMetadata.defaultTheme;
export const THEME_OPTIONS = themeMetadata.themes;
export const AVAILABLE_THEMES = THEME_OPTIONS.map((theme) => theme.id);

export function isValidTheme(themeName: string): boolean {
  return AVAILABLE_THEMES.includes(themeName);
}

export function normalizeTheme(themeName: string): string {
  return isValidTheme(themeName) ? themeName : DEFAULT_THEME;
}

export async function getTheme(): Promise<string> {
  try {
    const theme = await invoke<string>('get_theme');
    return normalizeTheme(theme);
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(themeName: string) {
  document.documentElement.setAttribute('data-theme', normalizeTheme(themeName));
}
