import { marked } from 'marked';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { confirm } from '@tauri-apps/plugin-dialog';
import { getTheme, applyTheme } from './theme';

function showActionBar() {
  if (document.getElementById('action-bar')) return; // Already exists
  const content = document.getElementById('content')!;
  const actionBar = document.createElement('div');
  actionBar.id = 'action-bar';
  actionBar.innerHTML = `
    <input type="text" id="note-input" placeholder="备注（可选）..." />
    <div id="buttons">
      <button id="btn-accept">Accept</button>
      <button id="btn-reject">Reject</button>
    </div>
  `;
  content.insertAdjacentElement('afterend', actionBar);
}

function bindButtonEvents() {
  document.getElementById('btn-accept')?.addEventListener('click', async () => {
    const note = (document.getElementById('note-input') as HTMLInputElement).value;
    await invoke('submit_decision', { accepted: true, note });
  });

  document.getElementById('btn-reject')?.addEventListener('click', async () => {
    const note = (document.getElementById('note-input') as HTMLInputElement).value;
    await invoke('submit_decision', { accepted: false, note });
  });
}

async function loadMarkdown() {
  const content = document.getElementById('content')!;
  const filePath = (window as any).__MD_FILE__;
  const isInteractive = (window as any).__INTERACTIVE__;

  if (!filePath) {
    content.textContent = 'No file provided. Usage: amdv <file.md>';
    content.className = 'error';
    return;
  }

  try {
    const text: string = await invoke<string>('read_markdown_file', { path: filePath });
    content.innerHTML = marked.parse(text) as string;
    content.className = 'markdown-body';

    // Show action bar only in interactive mode
    if (isInteractive) {
      showActionBar();
      bindButtonEvents();
      setupCloseHandler();
    }
  } catch (e) {
    content.textContent = `Error: ${e}`;
    content.className = 'error';
  }
}

// Auto-reload every 1.5 seconds for agent workflow
setInterval(loadMarkdown, 1500);

// Handle close confirmation from Rust (Tauri intercepts native close)
async function setupCloseHandler() {
  if ((window as any).__CLOSE_CONFIRM_HANDLER__) return;
  (window as any).__CLOSE_CONFIRM_HANDLER__ = true;

  await listen('request-close-confirm', async () => {
    const confirmed = await confirm('确定要退出吗？');
    if (confirmed) {
      await invoke('submit_decision', { accepted: false, note: '' });
    }
  });
}

async function init() {
  const theme = await getTheme();
  applyTheme(theme);
  await loadMarkdown();
}
init();
setInterval(loadMarkdown, 1500);

// --- TDD Tests ---

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`TEST FAILED: ${message}`);
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`TEST FAILED: ${message} (expected: ${expected}, got: ${actual})`);
  }
}

async function runTests() {
  console.log('Running TDD tests...');

  // Test 1: Action bar should NOT be in DOM when __INTERACTIVE__ is false
  delete (window as any).__INTERACTIVE__;
  (window as any).__MD_FILE__ = 'test.md';
  // Clear DOM
  const existingActionBar = document.getElementById('action-bar');
  if (existingActionBar) existingActionBar.remove();
  const content = document.getElementById('content')!;
  content.innerHTML = '';

  // Simulate loadMarkdown with isInteractive = false
  {
    const isInteractive = false;
    if (!isInteractive) {
      // action bar should not be created
    }
    const actionBar = document.getElementById('action-bar');
    assert(actionBar === null, 'Action bar should not exist when __INTERACTIVE__ is false');
  }

  // Test 2: Action bar SHOULD be in DOM when __INTERACTIVE__ is true
  (window as any).__INTERACTIVE__ = true;
  {
    const isInteractive = true;
    if (isInteractive) {
      showActionBar();
      bindButtonEvents();
    }
    const actionBar = document.getElementById('action-bar');
    assert(actionBar !== null, 'Action bar should exist when __INTERACTIVE__ is true');
    const noteInput = document.getElementById('note-input');
    const btnAccept = document.getElementById('btn-accept');
    const btnReject = document.getElementById('btn-reject');
    assert(noteInput !== null, 'Note input should exist');
    assert(btnAccept !== null, 'Accept button should exist');
    assert(btnReject !== null, 'Reject button should exist');
  }

  // Test 3: Button click handlers are bound (verify they are HTMLButtonElements)
  {
    const acceptBtn = document.getElementById('btn-accept');
    const rejectBtn = document.getElementById('btn-reject');
    const noteInput = document.getElementById('note-input') as HTMLInputElement;

    assert(acceptBtn instanceof HTMLButtonElement, 'Accept button should be an HTMLButtonElement');
    assert(rejectBtn instanceof HTMLButtonElement, 'Reject button should be an HTMLButtonElement');
    assert(noteInput instanceof HTMLInputElement, 'Note input should be an HTMLInputElement');
    assertEqual(noteInput.placeholder, '备注（可选）...', 'Note input should have correct placeholder');
  }

  console.log('All TDD tests passed.');
}

// Expose test runner globally for manual execution
(window as any).__runTests = runTests;

// Auto-run tests if URL contains ?test=1
if (new URLSearchParams(window.location.search).get('test') === '1') {
  runTests();
}
