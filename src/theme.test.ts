import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import {
  applyTheme,
  AVAILABLE_THEMES,
  DEFAULT_THEME,
  getTheme,
  isValidTheme,
  normalizeTheme,
  THEME_OPTIONS,
} from './theme';

const mockedInvoke = invoke as ReturnType<typeof vi.fn>;

describe('theme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.removeAttribute('data-theme');
  });

  it('exports theme options backed by shared metadata', () => {
    expect(THEME_OPTIONS.length).toBeGreaterThan(0);
    expect(DEFAULT_THEME).toBe('default-light');
    expect(AVAILABLE_THEMES).toEqual(THEME_OPTIONS.map((theme) => theme.id));
  });

  it('validates and normalizes theme names', () => {
    expect(isValidTheme('default-dark')).toBe(true);
    expect(isValidTheme('unknown-theme')).toBe(false);
    expect(normalizeTheme('unknown-theme')).toBe(DEFAULT_THEME);
  });

  it('returns theme from backend when valid', async () => {
    mockedInvoke.mockResolvedValue('default-dark');

    await expect(getTheme()).resolves.toBe('default-dark');
    expect(mockedInvoke).toHaveBeenCalledWith('get_theme');
  });

  it('falls back to default theme for invalid backend values', async () => {
    mockedInvoke.mockResolvedValue('legacy-theme');

    await expect(getTheme()).resolves.toBe(DEFAULT_THEME);
  });

  it('falls back to default theme on backend error', async () => {
    mockedInvoke.mockRejectedValue(new Error('backend error'));

    await expect(getTheme()).resolves.toBe(DEFAULT_THEME);
  });

  it('applies normalized theme ids to the document root', () => {
    applyTheme('default-dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('default-dark');

    applyTheme('invalid-theme');
    expect(document.documentElement.getAttribute('data-theme')).toBe(DEFAULT_THEME);
  });
});
