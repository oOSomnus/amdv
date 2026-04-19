import { invoke } from '@tauri-apps/api/core';
import './themes/markdown-base.css';
import './themes/default-light.css';
import './themes/default-dark.css';
import './themes/purple.css';
import './themes/blue.css';
import './themes/green.css';
import './themes/red.css';
import './themes/red-light.css';

export const AVAILABLE_THEMES = ['default-light', 'default-dark', 'purple', 'blue', 'green', 'red', 'red-light'];

export async function getTheme(): Promise<string> {
  try {
    return await invoke<string>('get_theme');
  } catch {
    return 'default-light';
  }
}

export function applyTheme(themeName: string) {
  if (!AVAILABLE_THEMES.includes(themeName)) {
    themeName = 'default-light';
  }
  document.documentElement.setAttribute('data-theme', themeName);
}