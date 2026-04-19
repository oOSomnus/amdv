import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, type AppDependencies } from './app';
import { DEFAULT_THEME } from './theme';

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function createDependencies(
  overrides: Partial<AppDependencies> = {},
): AppDependencies {
  return {
    applyTheme: vi.fn(),
    confirmClose: vi.fn().mockResolvedValue(true),
    getTheme: vi.fn().mockResolvedValue(DEFAULT_THEME),
    listenForCloseRequest: vi.fn().mockResolvedValue(() => {}),
    parseMarkdown: vi.fn((markdown: string) => `<p>${markdown}</p>`),
    readMarkdownFile: vi.fn().mockResolvedValue('# Plan'),
    submitDecision: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('createApp', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="content" class="markdown-body">Loading...</div>';
    vi.clearAllMocks();
  });

  it('renders action bar and binds accept button in interactive mode', async () => {
    const dependencies = createDependencies();
    const contentEl = document.getElementById('content') as HTMLElement;
    const app = createApp({
      contentEl,
      dependencies,
      runtime: { filePath: 'plan.md', interactive: true, pollIntervalMs: 60_000 },
    });

    await app.init();

    const noteInput = document.getElementById('note-input') as HTMLInputElement;
    const acceptButton = document.getElementById('btn-accept') as HTMLButtonElement;

    noteInput.value = 'ship it';
    acceptButton.click();
    await flushPromises();

    expect(document.getElementById('action-bar')).not.toBeNull();
    expect(dependencies.listenForCloseRequest).toHaveBeenCalledTimes(1);
    expect(dependencies.submitDecision).toHaveBeenCalledWith(true, 'ship it');

    await app.destroy();
  });

  it('does not render action bar outside interactive mode', async () => {
    const dependencies = createDependencies();
    const contentEl = document.getElementById('content') as HTMLElement;
    const app = createApp({
      contentEl,
      dependencies,
      runtime: { filePath: 'plan.md', interactive: false, pollIntervalMs: 60_000 },
    });

    await app.init();

    expect(document.getElementById('action-bar')).toBeNull();
    expect(dependencies.listenForCloseRequest).not.toHaveBeenCalled();

    await app.destroy();
  });

  it('renders markdown load errors as an error state', async () => {
    const dependencies = createDependencies({
      readMarkdownFile: vi.fn().mockRejectedValue(new Error('disk unavailable')),
    });
    const contentEl = document.getElementById('content') as HTMLElement;
    const app = createApp({
      contentEl,
      dependencies,
      runtime: { filePath: 'plan.md', interactive: false, pollIntervalMs: 60_000 },
    });

    await app.init();

    expect(contentEl.className).toBe('error');
    expect(contentEl.textContent).toContain('disk unavailable');

    await app.destroy();
  });
});
