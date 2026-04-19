import { marked } from 'marked';
import { createApp } from '../../src/app';
import { applyTheme, DEFAULT_THEME } from '../../src/theme';
import smokeMarkdown from './fixtures/smoke.md?raw';

declare global {
  interface Window {
    __HARNESS_DECISIONS__?: Array<{ accepted: boolean; note: string }>;
  }
}

const contentEl = document.getElementById('content');

if (!(contentEl instanceof HTMLElement)) {
  throw new Error('Missing #content element');
}

const params = new URLSearchParams(window.location.search);
const filePath = params.get('file') ?? 'smoke';
const interactive = params.get('interactive') === '1';

window.__HARNESS_DECISIONS__ = [];

const app = createApp({
  contentEl,
  runtime: {
    filePath,
    interactive,
    pollIntervalMs: 60_000,
  },
  dependencies: {
    applyTheme,
    confirmClose: async () => true,
    getTheme: async () => DEFAULT_THEME,
    listenForCloseRequest: async () => () => {},
    parseMarkdown: (markdown) => marked.parse(markdown) as string,
    readMarkdownFile: async (path) => {
      if (path === 'smoke') {
        return smokeMarkdown;
      }

      throw new Error(`Unknown markdown fixture: ${path}`);
    },
    submitDecision: async (accepted, note) => {
      window.__HARNESS_DECISIONS__?.push({ accepted, note });
    },
  },
});

void app.init();
