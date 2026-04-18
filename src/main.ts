import { marked } from 'marked';
import { invoke } from '@tauri-apps/api/core';

async function loadMarkdown() {
  const content = document.getElementById('content')!;
  const filePath = (window as any).__MD_FILE__;

  if (!filePath) {
    content.textContent = 'No file provided. Usage: amdv <file.md>';
    content.className = 'error';
    return;
  }

  try {
    const text: string = await invoke<string>('read_markdown_file', { path: filePath });
    content.innerHTML = marked.parse(text) as string;
    content.className = 'markdown-body';
  } catch (e) {
    content.textContent = `Error: ${e}`;
    content.className = 'error';
  }
}

// Auto-reload every 1.5 seconds for agent workflow
setInterval(loadMarkdown, 1500);

loadMarkdown();
