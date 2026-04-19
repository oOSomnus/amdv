import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app';
import { createCloseConfirm } from '../../close-confirm';
import {
  createAppTestHarness,
  createContentElement,
  flushPromises,
} from '../helpers/app-test-helpers';

describe('app integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders action bar and binds accept button in interactive mode', async () => {
    const harness = createAppTestHarness();
    const contentEl = createContentElement();
    const app = createApp({
      contentEl,
      dependencies: harness.dependencies,
      runtime: { filePath: 'plan.md', interactive: true, pollIntervalMs: 60_000 },
    });

    await app.init();

    const noteInput = document.getElementById('note-input') as HTMLInputElement;
    const acceptButton = document.getElementById('btn-accept') as HTMLButtonElement;

    noteInput.value = 'ship it';
    acceptButton.click();
    await flushPromises();

    expect(document.getElementById('action-bar')).not.toBeNull();
    expect(harness.dependencies.listenForCloseRequest).toHaveBeenCalledTimes(1);
    expect(harness.dependencies.submitDecision).toHaveBeenCalledWith(true, 'ship it');

    await app.destroy();
  });

  it('does not render action bar outside interactive mode', async () => {
    const harness = createAppTestHarness();
    const contentEl = createContentElement();
    const app = createApp({
      contentEl,
      dependencies: harness.dependencies,
      runtime: { filePath: 'plan.md', interactive: false, pollIntervalMs: 60_000 },
    });

    await app.init();

    expect(document.getElementById('action-bar')).toBeNull();
    expect(harness.dependencies.listenForCloseRequest).not.toHaveBeenCalled();

    await app.destroy();
  });

  it('renders markdown load errors as an error state', async () => {
    const harness = createAppTestHarness({
      readMarkdownFile: vi.fn().mockRejectedValue(new Error('disk unavailable')),
    });
    const contentEl = createContentElement();
    const app = createApp({
      contentEl,
      dependencies: harness.dependencies,
      runtime: { filePath: 'plan.md', interactive: false, pollIntervalMs: 60_000 },
    });

    await app.init();

    expect(contentEl.className).toBe('error');
    expect(contentEl.textContent).toContain('disk unavailable');

    await app.destroy();
  });

  it('renders a missing file state when no path is provided', async () => {
    const harness = createAppTestHarness();
    const contentEl = createContentElement();
    const app = createApp({
      contentEl,
      dependencies: harness.dependencies,
      runtime: { filePath: undefined, interactive: false, pollIntervalMs: 60_000 },
    });

    await app.init();

    expect(contentEl.className).toBe('error');
    expect(contentEl.textContent).toContain('No file provided');
    expect(harness.dependencies.readMarkdownFile).not.toHaveBeenCalled();

    await app.destroy();
  });

  it('reloads markdown on the polling interval', async () => {
    vi.useFakeTimers();
    const harness = createAppTestHarness();
    const contentEl = createContentElement();
    const app = createApp({
      contentEl,
      dependencies: harness.dependencies,
      runtime: { filePath: 'plan.md', interactive: false, pollIntervalMs: 1_500 },
    });

    await app.init();
    expect(harness.dependencies.readMarkdownFile).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1_500);

    expect(harness.dependencies.readMarkdownFile).toHaveBeenCalledTimes(2);

    await app.destroy();
  });

  it('cleans up timers, close handlers, and action bar on destroy', async () => {
    vi.useFakeTimers();
    const harness = createAppTestHarness();
    const contentEl = createContentElement();
    const app = createApp({
      contentEl,
      dependencies: harness.dependencies,
      runtime: { filePath: 'plan.md', interactive: true, pollIntervalMs: 1_500 },
    });

    await app.init();
    await app.destroy();
    await vi.advanceTimersByTimeAsync(1_500);
    await harness.emitCloseRequest();

    expect(harness.cleanup).toHaveBeenCalledTimes(1);
    expect(document.getElementById('action-bar')).toBeNull();
    expect(harness.dependencies.readMarkdownFile).toHaveBeenCalledTimes(1);
    expect(harness.dependencies.submitDecision).not.toHaveBeenCalled();
  });

  it('shows a minimal close confirm overlay and rejects on exit', async () => {
    const contentEl = createContentElement();
    const closeConfirm = createCloseConfirm();
    const harness = createAppTestHarness({
      confirmClose: () => closeConfirm.confirmClose(),
    });
    const app = createApp({
      contentEl,
      dependencies: harness.dependencies,
      runtime: { filePath: 'plan.md', interactive: true, pollIntervalMs: 60_000 },
    });

    await app.init();

    const noteInput = document.getElementById('note-input') as HTMLInputElement;
    noteInput.value = 'maybe later';

    const closeRequest = harness.emitCloseRequest();

    expect(document.body.textContent).toContain('确定退出吗？');
    expect(document.body.textContent).not.toContain('amdv');

    (document.getElementById('close-confirm-exit') as HTMLButtonElement).click();
    await closeRequest;
    await flushPromises();

    expect(harness.dependencies.submitDecision).toHaveBeenCalledWith(false, 'maybe later');

    await app.destroy();
  });

  it('dismisses the close confirm overlay without submitting on cancel', async () => {
    const contentEl = createContentElement();
    const closeConfirm = createCloseConfirm();
    const harness = createAppTestHarness({
      confirmClose: () => closeConfirm.confirmClose(),
    });
    const app = createApp({
      contentEl,
      dependencies: harness.dependencies,
      runtime: { filePath: 'plan.md', interactive: true, pollIntervalMs: 60_000 },
    });

    await app.init();

    const closeRequest = harness.emitCloseRequest();
    (document.getElementById('close-confirm-cancel') as HTMLButtonElement).click();
    await closeRequest;
    await flushPromises();

    expect(harness.dependencies.submitDecision).not.toHaveBeenCalled();

    await app.destroy();
  });
});
