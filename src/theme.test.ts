import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Tauri invoke before importing main
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Import after mock
import { invoke } from '@tauri-apps/api/core';
import { getTheme, applyTheme, AVAILABLE_THEMES } from './theme';

const mockedInvoke = invoke as ReturnType<typeof vi.fn>;

describe('theme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clean up any existing theme styles
    document.querySelectorAll('[data-theme-css]').forEach(el => el.remove());
  });

  describe('AVAILABLE_THEMES', () => {
    it('contains three themes', () => {
      expect(AVAILABLE_THEMES).toHaveLength(3);
    });

    it('includes github-light, github-dark, and dracula', () => {
      expect(AVAILABLE_THEMES).toContain('github-light');
      expect(AVAILABLE_THEMES).toContain('github-dark');
      expect(AVAILABLE_THEMES).toContain('dracula');
    });
  });

  describe('getTheme', () => {
    it('returns theme from backend', async () => {
      mockedInvoke.mockResolvedValue('github-dark');

      const theme = await getTheme();

      expect(theme).toBe('github-dark');
      expect(mockedInvoke).toHaveBeenCalledWith('get_theme');
    });

    it('defaults to github-light on error', async () => {
      mockedInvoke.mockRejectedValue(new Error('backend error'));

      const theme = await getTheme();

      expect(theme).toBe('github-light');
    });
  });

  describe('applyTheme', () => {
    it('creates style element with theme CSS', async () => {
      await applyTheme('github-dark');

      const styleEl = document.querySelector('[data-theme-css]');
      expect(styleEl).toBeTruthy();
      expect(styleEl?.textContent).toContain('#0d1117'); // github-dark background
    });

    it('removes existing theme styles before adding new', async () => {
      await applyTheme('github-light');
      const firstStyle = document.querySelector('[data-theme-css]');

      await applyTheme('dracula');
      const secondStyle = document.querySelectorAll('[data-theme-css]');

      expect(secondStyle).toHaveLength(1);
      expect(secondStyle[0].textContent).toContain('#282a36'); // dracula background
    });

    it('defaults to github-light for invalid theme', async () => {
      await applyTheme('invalid-theme');

      const styleEl = document.querySelector('[data-theme-css]');
      expect(styleEl?.textContent).toContain('#ffffff'); // github-light background
    });
  });
});