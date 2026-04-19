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
    it('is a non-empty array', () => {
      expect(Array.isArray(AVAILABLE_THEMES)).toBe(true);
      expect(AVAILABLE_THEMES.length).toBeGreaterThan(0);
    });

    it('includes all expected themes', () => {
      expect(AVAILABLE_THEMES).toContain('default-light');
      expect(AVAILABLE_THEMES).toContain('default-dark');
      expect(AVAILABLE_THEMES).toContain('purple');
      expect(AVAILABLE_THEMES).toContain('blue');
      expect(AVAILABLE_THEMES).toContain('green');
      expect(AVAILABLE_THEMES).toContain('red');
      expect(AVAILABLE_THEMES).toContain('red-light');
    });
  });

  describe('getTheme', () => {
    it('returns theme from backend', async () => {
      mockedInvoke.mockResolvedValue('default-dark');

      const theme = await getTheme();

      expect(theme).toBe('default-dark');
      expect(mockedInvoke).toHaveBeenCalledWith('get_theme');
    });

    it('defaults to default-light on error', async () => {
      mockedInvoke.mockRejectedValue(new Error('backend error'));

      const theme = await getTheme();

      expect(theme).toBe('default-light');
    });
  });

  describe('applyTheme', () => {
    it('sets data-theme attribute on html element', () => {
      applyTheme('default-dark');

      expect(document.documentElement.getAttribute('data-theme')).toBe('default-dark');
    });

    it('overwrites previous theme when applying new one', () => {
      applyTheme('default-light');
      applyTheme('purple');

      expect(document.documentElement.getAttribute('data-theme')).toBe('purple');
    });

    it('defaults to default-light for invalid theme', () => {
      applyTheme('invalid-theme');

      expect(document.documentElement.getAttribute('data-theme')).toBe('default-light');
    });
  });
});