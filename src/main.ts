import { marked } from 'marked';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { createApp } from './app';
import { createCloseConfirm } from './close-confirm';
import { getRuntimeContext } from './runtime';
import { applyTheme, getTheme } from './theme';

const contentEl = document.getElementById('content');
const closeConfirm = createCloseConfirm();

if (!(contentEl instanceof HTMLElement)) {
  throw new Error('Missing #content element');
}

const app = createApp({
  contentEl,
  runtime: getRuntimeContext(),
  dependencies: {
    applyTheme,
    confirmClose: () => closeConfirm.confirmClose(),
    getTheme,
    listenForCloseRequest: async (handler) =>
      listen('request-close-confirm', () => {
        void handler();
      }),
    parseMarkdown: (markdown) => marked.parse(markdown) as string,
    readMarkdownFile: (path) => invoke<string>('read_markdown_file', { path }),
    submitDecision: (accepted, note) => invoke('submit_decision', { accepted, note }),
  },
});

void app.init();
