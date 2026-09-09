import { useSyncExternalStore } from 'react';

import { appStateManager } from './appStateManager';
import type { AppStateSnapshot } from './types';

const SERVER_SNAPSHOT: AppStateSnapshot = {
  status: 'unknown',
  isActive: false,
};

function subscribe(onStoreChange: () => void): () => void {
  return appStateManager.subscribe(() => {
    onStoreChange();
  });
}

function getSnapshot(): AppStateSnapshot {
  return appStateManager.getState();
}

function getServerSnapshot(): AppStateSnapshot {
  return SERVER_SNAPSHOT;
}

export function useAppState(): AppStateSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsAppActive(): boolean {
  return useAppState().isActive;
}
