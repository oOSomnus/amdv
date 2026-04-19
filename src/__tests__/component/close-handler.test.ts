import { describe, expect, it, vi } from 'vitest';
import { setupCloseHandler } from '../../close-handler';

describe('close handler component', () => {
  it('submits the close action after confirmation', async () => {
    let handler: (() => Promise<void> | void) | undefined;
    const cleanup = vi.fn();
    const confirmClose = vi.fn().mockResolvedValue(true);
    const onCloseConfirmed = vi.fn().mockResolvedValue(undefined);

    const returnedCleanup = await setupCloseHandler({
      confirmClose,
      listenForCloseRequest: async (nextHandler) => {
        handler = nextHandler;
        return cleanup;
      },
      onCloseConfirmed,
    });

    await handler?.();

    expect(returnedCleanup).toBe(cleanup);
    expect(confirmClose).toHaveBeenCalledTimes(1);
    expect(onCloseConfirmed).toHaveBeenCalledTimes(1);
  });

  it('skips the close action when confirmation is rejected', async () => {
    let handler: (() => Promise<void> | void) | undefined;
    const onCloseConfirmed = vi.fn().mockResolvedValue(undefined);

    await setupCloseHandler({
      confirmClose: vi.fn().mockResolvedValue(false),
      listenForCloseRequest: async (nextHandler) => {
        handler = nextHandler;
        return vi.fn();
      },
      onCloseConfirmed,
    });

    await handler?.();

    expect(onCloseConfirmed).not.toHaveBeenCalled();
  });
});
