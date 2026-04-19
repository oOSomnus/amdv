export const AUTO_RELOAD_INTERVAL_MS = 1500;

export interface AppRuntimeContext {
  filePath?: string;
  interactive: boolean;
  pollIntervalMs: number;
}

export function getRuntimeContext(currentWindow: Window = window): AppRuntimeContext {
  return {
    filePath: currentWindow.__MD_FILE__,
    interactive: currentWindow.__INTERACTIVE__ ?? false,
    pollIntervalMs: AUTO_RELOAD_INTERVAL_MS,
  };
}
