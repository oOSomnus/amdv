import { createActionBar, type ActionBarController } from './action-bar';
import { setupCloseHandler, type CloseHandlerDependencies } from './close-handler';
import type { AppRuntimeContext } from './runtime';

export interface AppDependencies extends CloseHandlerDependencies {
  applyTheme(themeName: string): void;
  getTheme(): Promise<string>;
  parseMarkdown(markdown: string): string;
  readMarkdownFile(path: string): Promise<string>;
  submitDecision(accepted: boolean, note: string): Promise<void>;
}

interface CreateAppOptions {
  contentEl: HTMLElement;
  dependencies: AppDependencies;
  runtime: AppRuntimeContext;
}

export interface AppController {
  destroy(): Promise<void>;
  init(): Promise<void>;
  loadMarkdown(): Promise<void>;
}

/**
 * Creates the application controller responsible for theming, markdown loading, and interactive mode.
 */
export function createApp({
  contentEl,
  dependencies,
  runtime,
}: CreateAppOptions): AppController {
  let actionBar: ActionBarController | undefined;
  let closeHandlerCleanup: (() => void) | undefined;
  let pollTimer: ReturnType<typeof setInterval> | undefined;

  function renderMissingFile() {
    contentEl.textContent = 'No file provided. Usage: amdv <file.md>';
    contentEl.className = 'error';
  }

  function renderError(error: unknown) {
    contentEl.textContent = `Error: ${String(error)}`;
    contentEl.className = 'error';
  }

  function renderMarkdown(markdown: string) {
    contentEl.innerHTML = dependencies.parseMarkdown(markdown);
    contentEl.className = 'markdown-body';
  }

  async function submitDecision(accepted: boolean) {
    if (!actionBar) {
      return;
    }

    await dependencies.submitDecision(accepted, actionBar.getNoteValue());
  }

  async function loadMarkdown() {
    if (!runtime.filePath) {
      renderMissingFile();
      return;
    }

    try {
      const markdown = await dependencies.readMarkdownFile(runtime.filePath);
      renderMarkdown(markdown);
    } catch (error) {
      renderError(error);
    }
  }

  async function init() {
    const theme = await dependencies.getTheme();
    dependencies.applyTheme(theme);

    if (runtime.interactive) {
      actionBar = createActionBar({
        contentEl,
        onAccept: () => submitDecision(true),
        onReject: () => submitDecision(false),
      });

      closeHandlerCleanup = await setupCloseHandler({
        confirmClose: dependencies.confirmClose,
        listenForCloseRequest: dependencies.listenForCloseRequest,
        onCloseConfirmed: () => submitDecision(false),
      });
    }

    await loadMarkdown();

    pollTimer = setInterval(() => {
      void loadMarkdown();
    }, runtime.pollIntervalMs);
  }

  async function destroy() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = undefined;
    }

    if (closeHandlerCleanup) {
      closeHandlerCleanup();
      closeHandlerCleanup = undefined;
    }

    actionBar?.destroy();
    actionBar = undefined;
  }

  return {
    destroy,
    init,
    loadMarkdown,
  };
}
