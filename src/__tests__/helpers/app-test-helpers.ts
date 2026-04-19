import { vi } from 'vitest';
import { DEFAULT_THEME } from '../../theme';
import type { AppDependencies } from '../../app';

type CloseRequestHandler = () => Promise<void> | void;

export interface AppTestHarness {
  cleanup: ReturnType<typeof vi.fn>;
  dependencies: AppDependencies;
  emitCloseRequest(): Promise<void>;
}

export function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export function createContentElement() {
  document.body.innerHTML = '<div id="content" class="markdown-body">Loading...</div>';
  return document.getElementById('content') as HTMLElement;
}

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
