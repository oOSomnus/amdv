import { beforeEach, describe, expect, it } from 'vitest';
import { createCloseConfirm } from '../../close-confirm';

describe('close confirm component', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="close-confirm-root"></div>';
  });

  it('renders a minimal confirmation overlay and resolves true on exit', async () => {
    const closeConfirm = createCloseConfirm();
    const decisionPromise = closeConfirm.confirmClose();

    expect(document.body.textContent).toContain('Are you sure you want to exit?');
    expect(document.body.textContent).toContain('Cancel');
    expect(document.body.textContent).toContain('Exit');
    expect(document.body.textContent).not.toContain('amdv');

    (document.getElementById('close-confirm-exit') as HTMLButtonElement).click();

    await expect(decisionPromise).resolves.toBe(true);
    expect(document.getElementById('close-confirm-overlay')).toBeNull();
  });

  it('resolves false when dismissed via cancel, overlay click, or escape', async () => {
    const closeConfirm = createCloseConfirm();

    const cancelPromise = closeConfirm.confirmClose();
    (document.getElementById('close-confirm-cancel') as HTMLButtonElement).click();
    await expect(cancelPromise).resolves.toBe(false);

    const overlayPromise = closeConfirm.confirmClose();
    (document.getElementById('close-confirm-overlay') as HTMLDivElement).click();
    await expect(overlayPromise).resolves.toBe(false);

    const escapePromise = closeConfirm.confirmClose();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await expect(escapePromise).resolves.toBe(false);
  });

  it('reuses the pending promise instead of rendering duplicates', async () => {
    const closeConfirm = createCloseConfirm();
    const first = closeConfirm.confirmClose();
    const second = closeConfirm.confirmClose();

    expect(first).toBe(second);
    expect(document.querySelectorAll('#close-confirm-overlay')).toHaveLength(1);

    (document.getElementById('close-confirm-exit') as HTMLButtonElement).click();
    await expect(first).resolves.toBe(true);
  });

  it('resolves false and cleans up on destroy', async () => {
    const closeConfirm = createCloseConfirm();
    const decisionPromise = closeConfirm.confirmClose();

    closeConfirm.destroy();

    await expect(decisionPromise).resolves.toBe(false);
    expect(document.getElementById('close-confirm-overlay')).toBeNull();
  });
});
