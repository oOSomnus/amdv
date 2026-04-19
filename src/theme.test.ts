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
    document.documentElement.removeAttribute('data-theme');
  });

  describe('AVAILABLE_THEMES', () => {
    it('contains five themes', () => {
      expect(AVAILABLE_THEMES).toHaveLength(5);
    });

    it('includes all available themes', () => {
      expect(AVAILABLE_THEMES).toContain('github-light');
      expect(AVAILABLE_THEMES).toContain('github-dark');
      expect(AVAILABLE_THEMES).toContain('dracula');
      expect(AVAILABLE_THEMES).toContain('nord');
      expect(AVAILABLE_THEMES).toContain('monokai');
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
    it('sets data-theme attribute on html element', () => {
      applyTheme('github-dark');

      expect(document.documentElement.getAttribute('data-theme')).toBe('github-dark');
    });

    it('overwrites previous theme when applying new one', () => {
      applyTheme('github-light');
      applyTheme('dracula');

      expect(document.documentElement.getAttribute('data-theme')).toBe('dracula');
    });

    it('defaults to github-light for invalid theme', () => {
      applyTheme('invalid-theme');

      expect(document.documentElement.getAttribute('data-theme')).toBe('github-light');
    });
  });
});