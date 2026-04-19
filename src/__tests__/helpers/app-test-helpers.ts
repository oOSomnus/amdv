import { vi } from 'vitest';
import { DEFAULT_THEME } from '../../theme';
import type { AppDependencies } from '../../app';

type CloseRequestHandler = () => Promise<void> | void;

export interface AppTestHarness {
  cleanup: ReturnType<typeof vi.fn>;
  dependencies: AppDependencies;
  emitCloseRequest(): Promise<void>;
}

/**
 * Waits for queued microtasks and timers used by the current test tick to settle.
 */
export function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Creates and returns the content container used by component and integration tests.
 */
export function createContentElement() {
  document.body.innerHTML = '<div id="content" class="markdown-body">Loading...</div>';
  return document.getElementById('content') as HTMLElement;
}

/**
 * Builds a reusable test harness with mocked app dependencies and close-request control.
 */
export function createAppTestHarness(
  overrides: Partial<AppDependencies> = {},
): AppTestHarness {
  const cleanup = vi.fn();
  let closeRequestHandler: CloseRequestHandler | undefined;

  const dependencies: AppDependencies = {
    applyTheme: vi.fn(),
    confirmClose: vi.fn().mockResolvedValue(true),
    getTheme: vi.fn().mockResolvedValue(DEFAULT_THEME),
    listenForCloseRequest: vi.fn().mockImplementation(async (handler: CloseRequestHandler) => {
      closeRequestHandler = handler;
      return cleanup;
    }),
    parseMarkdown: vi.fn((markdown: string) => `<p>${markdown}</p>`),
    readMarkdownFile: vi.fn().mockResolvedValue('# Plan'),
    submitDecision: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  return {
    cleanup,
    dependencies,
    async emitCloseRequest() {
      await closeRequestHandler?.();
    },
  };
}
