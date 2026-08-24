import { useSyncExternalStore } from 'react';

import { networkManager } from './networkManager';
import type { NetworkState } from './types';

const SERVER_SNAPSHOT: NetworkState = {
  status: 'unknown',
  isOnline: false,
  isConnected: null,
  isInternetReachable: null,
  type: null,
};

function subscribe(onStoreChange: () => void): () => void {
  return networkManager.subscribe(() => {
    onStoreChange();
  });
}

function getSnapshot(): NetworkState {
  return networkManager.getState();
}

function getServerSnapshot(): NetworkState {
  return SERVER_SNAPSHOT;
}

export function useNetwork(): NetworkState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsOnline(): boolean {
  return useNetwork().isOnline;
}
