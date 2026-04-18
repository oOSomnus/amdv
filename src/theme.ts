import { invoke } from '@tauri-apps/api/core';
import './themes/github-light.css';
import './themes/github-dark.css';
import './themes/dracula.css';

export const AVAILABLE_THEMES = ['github-light', 'github-dark', 'dracula'];

export async function getTheme(): Promise<string> {
  try {
    return await invoke<string>('get_theme');
  } catch {
    return 'github-light';
  }
}

export function applyTheme(themeName: string) {
  if (!AVAILABLE_THEMES.includes(themeName)) {
    themeName = 'github-light';
  }
  document.documentElement.setAttribute('data-theme', themeName);
}