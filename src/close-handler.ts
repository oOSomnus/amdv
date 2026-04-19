export interface CloseHandlerDependencies {
  confirmClose(): Promise<boolean>;
  listenForCloseRequest(handler: () => Promise<void> | void): Promise<() => void>;
}

interface SetupCloseHandlerOptions extends CloseHandlerDependencies {
  onCloseConfirmed(): Promise<void>;
}

export async function setupCloseHandler({
  confirmClose,
  listenForCloseRequest,
  onCloseConfirmed,
}: SetupCloseHandlerOptions): Promise<() => void> {
  return listenForCloseRequest(async () => {
    const confirmed = await confirmClose();
    if (confirmed) {
      await onCloseConfirmed();
    }
  });
}
