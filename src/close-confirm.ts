const CLOSE_CONFIRM_ROOT_ID = 'close-confirm-root';
const CLOSE_CONFIRM_OVERLAY_ID = 'close-confirm-overlay';
const CLOSE_CONFIRM_CANCEL_ID = 'close-confirm-cancel';
const CLOSE_CONFIRM_EXIT_ID = 'close-confirm-exit';

export interface CloseConfirmController {
  confirmClose(): Promise<boolean>;
  destroy(): void;
}

interface CreateCloseConfirmOptions {
  document?: Document;
  window?: Window;
}

/**
 * Creates a singleton-style close confirmation overlay for interactive exit requests.
 */
export function createCloseConfirm({
  document: currentDocument = document,
  window: currentWindow = window,
}: CreateCloseConfirmOptions = {}): CloseConfirmController {
  let activePromise: Promise<boolean> | undefined;
  let resolveActive: ((value: boolean) => void) | undefined;
  let cleanupActive: (() => void) | undefined;

  function confirmClose(): Promise<boolean> {
    if (activePromise) {
      return activePromise;
    }

    activePromise = new Promise<boolean>((resolve) => {
      const root = ensureRoot(currentDocument);
      resolveActive = (value) => {
        cleanupActive?.();
        cleanupActive = undefined;
        activePromise = undefined;
        resolveActive = undefined;
        resolve(value);
      };
      cleanupActive = renderOverlay({
        currentDocument,
        currentWindow,
        onResolve(value) {
          resolveActive?.(value);
        },
        root,
      });
    });

    return activePromise;
  }

  function destroy() {
    if (resolveActive) {
      resolveActive(false);
      return;
    }

    cleanupActive?.();
    cleanupActive = undefined;
    activePromise = undefined;
  }

  return {
    confirmClose,
    destroy,
  };
}

function ensureRoot(currentDocument: Document): HTMLElement {
  const existing = currentDocument.getElementById(CLOSE_CONFIRM_ROOT_ID);
  if (existing instanceof HTMLElement) {
    return existing;
  }

  const root = currentDocument.createElement('div');
  root.id = CLOSE_CONFIRM_ROOT_ID;
  currentDocument.body.append(root);
  return root;
}

function renderOverlay({
  currentDocument,
  currentWindow,
  onResolve,
  root,
}: {
  currentDocument: Document;
  currentWindow: Window;
  onResolve(value: boolean): void;
  root: HTMLElement;
}): () => void {
  root.replaceChildren();

  const overlay = currentDocument.createElement('div');
  overlay.id = CLOSE_CONFIRM_OVERLAY_ID;
  overlay.className = 'close-confirm-overlay';
  overlay.innerHTML = `
    <div class="close-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="close-confirm-title">
      <p id="close-confirm-title" class="close-confirm-title">确定退出吗？</p>
      <div class="close-confirm-actions">
        <button id="${CLOSE_CONFIRM_CANCEL_ID}" type="button" class="close-confirm-button secondary">取消</button>
        <button id="${CLOSE_CONFIRM_EXIT_ID}" type="button" class="close-confirm-button primary">退出</button>
      </div>
    </div>
  `;

  root.append(overlay);

  const cancelButton = overlay.querySelector(`#${CLOSE_CONFIRM_CANCEL_ID}`);
  const exitButton = overlay.querySelector(`#${CLOSE_CONFIRM_EXIT_ID}`);

  if (!(cancelButton instanceof HTMLButtonElement)) {
    throw new Error('Missing close confirm cancel button');
  }

  if (!(exitButton instanceof HTMLButtonElement)) {
    throw new Error('Missing close confirm exit button');
  }

  const handleCancel = () => {
    onResolve(false);
  };

  const handleExit = () => {
    onResolve(true);
  };

  const handleOverlayClick = (event: MouseEvent) => {
    if (event.target === overlay) {
      handleCancel();
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
    }
  };

  cancelButton.addEventListener('click', handleCancel);
  exitButton.addEventListener('click', handleExit);
  overlay.addEventListener('click', handleOverlayClick);
  currentWindow.addEventListener('keydown', handleKeydown);
  cancelButton.focus();

  return () => {
    cancelButton.removeEventListener('click', handleCancel);
    exitButton.removeEventListener('click', handleExit);
    overlay.removeEventListener('click', handleOverlayClick);
    currentWindow.removeEventListener('keydown', handleKeydown);
    root.replaceChildren();
  };
}
