import NetInfo, {
  type NetInfoState,
  type NetInfoSubscription,
} from '@react-native-community/netinfo';

import type { NetworkState, NetworkStatus } from './types';

type NetworkStateListener = (state: NetworkState) => void;

const INITIAL_STATE: NetworkState = {
  status: 'unknown',
  isOnline: false,
  isConnected: null,
  isInternetReachable: null,
  type: null,
};

function deriveStatus(state: NetInfoState): NetworkStatus {
  if (state.isConnected === null) {
    return 'unknown';
  }

  if (state.isConnected === false || state.isInternetReachable === false) {
    return 'offline';
  }

  if (state.isConnected === true) {
    return 'online';
  }

  return 'unknown';
}

function toNetworkState(state: NetInfoState): NetworkState {
  const status = deriveStatus(state);

  return {
    status,
    isOnline: status === 'online',
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
    type: state.type ?? null,
  };
}

function statesEqual(a: NetworkState, b: NetworkState): boolean {
  return (
    a.status === b.status &&
    a.isOnline === b.isOnline &&
    a.isConnected === b.isConnected &&
    a.isInternetReachable === b.isInternetReachable &&
    a.type === b.type
  );
}

class NetworkManager {
  private state: NetworkState = INITIAL_STATE;
  private readonly listeners = new Set<NetworkStateListener>();
  private unsubscribeNetInfo: NetInfoSubscription | null = null;
  private started = false;

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;

    this.unsubscribeNetInfo = NetInfo.addEventListener((next) => {
      this.applyState(toNetworkState(next));
    });

    void NetInfo.fetch().then((next) => {
      if (!this.started) {
        return;
      }
      this.applyState(toNetworkState(next));
    });
  }

  stop(): void {
    if (!this.started) {
      return;
    }

    this.started = false;
    this.unsubscribeNetInfo?.();
    this.unsubscribeNetInfo = null;
    this.applyState(INITIAL_STATE);
  }

  getState(): NetworkState {
    return this.state;
  }

  isOnline(): boolean {
    return this.state.isOnline;
  }

  subscribe(listener: NetworkStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private applyState(next: NetworkState) {
    if (statesEqual(this.state, next)) {
      return;
    }

    this.state = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }
}

export const networkManager = new NetworkManager();
