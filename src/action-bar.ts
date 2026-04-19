const ACTION_BAR_ID = 'action-bar';
const NOTE_INPUT_ID = 'note-input';
const ACCEPT_BUTTON_ID = 'btn-accept';
const REJECT_BUTTON_ID = 'btn-reject';

export const NOTE_PLACEHOLDER = 'Notes (optional)...';

interface ActionBarOptions {
  contentEl: HTMLElement;
  onAccept(): Promise<void> | void;
  onReject(): Promise<void> | void;
}

export interface ActionBarController {
  destroy(): void;
  element: HTMLElement;
  getNoteValue(): string;
}

/**
 * Creates the interactive action bar used to accept or reject the current document.
 */
export function createActionBar({
  contentEl,
  onAccept,
  onReject,
}: ActionBarOptions): ActionBarController {
  const existing = document.getElementById(ACTION_BAR_ID);
  if (existing) {
    existing.remove();
  }

  const actionBar = document.createElement('div');
  actionBar.id = ACTION_BAR_ID;
  actionBar.innerHTML = `
    <input type="text" id="${NOTE_INPUT_ID}" placeholder="${NOTE_PLACEHOLDER}" />
    <div id="buttons">
      <button id="${ACCEPT_BUTTON_ID}">Accept</button>
      <button id="${REJECT_BUTTON_ID}">Reject</button>
    </div>
  `;

  contentEl.insertAdjacentElement('afterend', actionBar);

  const noteInput = actionBar.querySelector(`#${NOTE_INPUT_ID}`);
  const acceptButton = actionBar.querySelector(`#${ACCEPT_BUTTON_ID}`);
  const rejectButton = actionBar.querySelector(`#${REJECT_BUTTON_ID}`);

  if (!(noteInput instanceof HTMLInputElement)) {
    throw new Error('Missing note input');
  }

  if (!(acceptButton instanceof HTMLButtonElement)) {
    throw new Error('Missing accept button');
  }

  if (!(rejectButton instanceof HTMLButtonElement)) {
    throw new Error('Missing reject button');
  }

  acceptButton.addEventListener('click', () => {
    void onAccept();
  });

  rejectButton.addEventListener('click', () => {
    void onReject();
  });

  return {
    destroy() {
      actionBar.remove();
    },
    element: actionBar,
    getNoteValue() {
      return noteInput.value;
    },
  };
}
