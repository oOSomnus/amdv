import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createActionBar } from '../../action-bar';
import { createContentElement, flushPromises } from '../helpers/app-test-helpers';

describe('action bar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders after the content element and wires actions', async () => {
    const contentEl = createContentElement();
    const onAccept = vi.fn();
    const onReject = vi.fn();

    const actionBar = createActionBar({ contentEl, onAccept, onReject });
    const noteInput = document.getElementById('note-input') as HTMLInputElement;

    noteInput.value = 'ship it';
    (document.getElementById('btn-accept') as HTMLButtonElement).click();
    (document.getElementById('btn-reject') as HTMLButtonElement).click();
    await flushPromises();

    expect(contentEl.nextElementSibling).toBe(actionBar.element);
    expect(actionBar.getNoteValue()).toBe('ship it');
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('replaces any existing action bar before rendering a new one', () => {
    const contentEl = createContentElement();

    const first = createActionBar({
      contentEl,
      onAccept: vi.fn(),
      onReject: vi.fn(),
    });
    const second = createActionBar({
      contentEl,
      onAccept: vi.fn(),
      onReject: vi.fn(),
    });

    expect(document.querySelectorAll('#action-bar')).toHaveLength(1);
    expect(first.element.isConnected).toBe(false);
    expect(second.element.isConnected).toBe(true);
  });

  it('removes the action bar on destroy', () => {
    const contentEl = createContentElement();
    const actionBar = createActionBar({
      contentEl,
      onAccept: vi.fn(),
      onReject: vi.fn(),
    });

    actionBar.destroy();

    expect(document.getElementById('action-bar')).toBeNull();
  });
});
