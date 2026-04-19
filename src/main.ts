import { marked } from 'marked';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { confirm } from '@tauri-apps/plugin-dialog';
import { createApp } from './app';
import { getRuntimeContext } from './runtime';
import { applyTheme, getTheme } from './theme';

const contentEl = document.getElementById('content');

if (!(contentEl instanceof HTMLElement)) {
  throw new Error('Missing #content element');
}

const app = createApp({
  contentEl,
  runtime: getRuntimeContext(),
  dependencies: {
    applyTheme,
    confirmClose: () => confirm('确定要退出吗？'),
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
