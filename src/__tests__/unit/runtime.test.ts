import { describe, expect, it } from 'vitest';
import { AUTO_RELOAD_INTERVAL_MS, getRuntimeContext } from '../../runtime';

describe('runtime unit', () => {
  it('returns default runtime values when globals are missing', () => {
    const testWindow = {} as Window;

    expect(getRuntimeContext(testWindow)).toEqual({
      filePath: undefined,
      interactive: false,
      pollIntervalMs: AUTO_RELOAD_INTERVAL_MS,
    });
  });

  it('reads injected window state when available', () => {
    const testWindow = {
      __INTERACTIVE__: true,
      __MD_FILE__: '/tmp/plan.md',
    } as Window;

    expect(getRuntimeContext(testWindow)).toEqual({
      filePath: '/tmp/plan.md',
      interactive: true,
      pollIntervalMs: AUTO_RELOAD_INTERVAL_MS,
    });
  });
});
