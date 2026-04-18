import { invoke } from '@tauri-apps/api/core';

export const AVAILABLE_THEMES = ['github-light', 'github-dark', 'dracula'];

export async function getTheme(): Promise<string> {
  try {
    return await invoke<string>('get_theme');
  } catch {
    return 'github-light';
  }
}

export async function applyTheme(themeName: string) {
  if (!AVAILABLE_THEMES.includes(themeName)) {
    themeName = 'github-light';
  }
  document.querySelectorAll('[data-theme-css]').forEach(el => el.remove());
  const style = document.createElement('style');
  style.setAttribute('data-theme-css', 'true');
  style.textContent = getThemeCSS(themeName);
  document.head.appendChild(style);
}

export function getThemeCSS(themeName: string): string {
  const themes: Record<string, string> = {
    'github-light': `.markdown-body { color: #24292f; background-color: #ffffff; }
.markdown-body h1,.markdown-body h2,.markdown-body h3,.markdown-body h4 { color: #1f2328; border-bottom: 1px solid #d1d9e0; }
.markdown-body code { background-color: #f6f8fa; border: 1px solid #d1d9e0; border-radius: 6px; padding: 0.2em 0.4em; }
.markdown-body pre { background-color: #f6f8fa; border: 1px solid #d1d9e0; border-radius: 6px; }
.markdown-body blockquote { color: #636c76; border-left: 0.25em solid #d1d9e0; }
.markdown-body a { color: #0969da; }
.markdown-body table { border-collapse: collapse; }
.markdown-body th,.markdown-body td { border: 1px solid #d1d9e0; padding: 8px 12px; }
.markdown-body tr:nth-child(even) { background-color: #f6f8fa; }`,
    'github-dark': `.markdown-body { color: #e6edf3; background-color: #0d1117; }
.markdown-body h1,.markdown-body h2,.markdown-body h3,.markdown-body h4 { color: #e6edf3; border-bottom: 1px solid #30363d; }
.markdown-body code { background-color: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 0.2em 0.4em; }
.markdown-body pre { background-color: #161b22; border: 1px solid #30363d; border-radius: 6px; }
.markdown-body blockquote { color: #8b949e; border-left: 0.25em solid #30363d; }
.markdown-body a { color: #58a6ff; }
.markdown-body table { border-collapse: collapse; }
.markdown-body th,.markdown-body td { border: 1px solid #30363d; padding: 8px 12px; }
.markdown-body tr:nth-child(even) { background-color: #161b22; }`,
    'dracula': `.markdown-body { color: #f8f8f2; background-color: #282a36; }
.markdown-body h1,.markdown-body h2,.markdown-body h3,.markdown-body h4 { color: #f8f8f2; border-bottom: 1px solid #44475a; }
.markdown-body code { background-color: #44475a; border: 1px solid #6272a4; border-radius: 6px; padding: 0.2em 0.4em; }
.markdown-body pre { background-color: #44475a; border: 1px solid #6272a4; border-radius: 6px; }
.markdown-body blockquote { color: #6272a4; border-left: 0.25em solid #6272a4; }
.markdown-body a { color: #bd93f9; }
.markdown-body table { border-collapse: collapse; }
.markdown-body th,.markdown-body td { border: 1px solid #44475a; padding: 8px 12px; }
.markdown-body tr:nth-child(even) { background-color: #44475a; }`
  };
  return themes[themeName] || themes['github-light'];
}