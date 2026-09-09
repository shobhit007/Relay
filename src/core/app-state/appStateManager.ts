import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';

import type { AppLifecycleState, AppStateSnapshot } from './types';

type AppStateListener = (state: AppStateSnapshot) => void;

function toLifecycleState(status: AppStateStatus): AppLifecycleState {
  if (status === 'active' || status === 'background' || status === 'inactive') {
    return status;
  }
  return 'unknown';
}

function toSnapshot(status: AppStateStatus): AppStateSnapshot {
  const lifecycle = toLifecycleState(status);
  return {
    status: lifecycle,
    isActive: lifecycle === 'active',
  };
}

function snapshotsEqual(a: AppStateSnapshot, b: AppStateSnapshot): boolean {
  return a.status === b.status && a.isActive === b.isActive;
}

const INITIAL_STATE: AppStateSnapshot = toSnapshot(AppState.currentState);

class AppStateManager {
  private state: AppStateSnapshot = INITIAL_STATE;
  private readonly listeners = new Set<AppStateListener>();
  private subscription: NativeEventSubscription | null = null;
  private started = false;

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.applyState(toSnapshot(AppState.currentState));

    this.subscription = AppState.addEventListener('change', (next) => {
      this.applyState(toSnapshot(next));
    });
  }

  stop(): void {
    if (!this.started) {
      return;
    }

    this.started = false;
    this.subscription?.remove();
    this.subscription = null;
    this.applyState({ status: 'unknown', isActive: false });
  }

  getState(): AppStateSnapshot {
    return this.state;
  }

  isActive(): boolean {
    return this.state.isActive;
  }

  subscribe(listener: AppStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private applyState(next: AppStateSnapshot) {
    if (snapshotsEqual(this.state, next)) {
      return;
    }

    this.state = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }
}

export const appStateManager = new AppStateManager();
