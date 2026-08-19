import {
  getSocketClient,
  resetSocketClient,
  type AppSocket,
} from './socketClient';
import type { SocketEventName } from './socketEvents';

export type SocketConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

type ConnectionStateListener = (state: SocketConnectionState) => void;

class SocketManager {
  private state: SocketConnectionState = 'disconnected';
  private readonly stateListeners = new Set<ConnectionStateListener>();
  private readonly featureHandlers = new Map<
    string,
    Set<(...args: unknown[]) => void>
  >();
  private lifecycleBound = false;
  private intentionalDisconnect = false;

  getConnectionState(): SocketConnectionState {
    return this.state;
  }

  subscribeConnectionState(listener: ConnectionStateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  connect(token: string): void {
    const socket = getSocketClient();
    this.intentionalDisconnect = false;
    socket.auth = { token };

    this.bindLifecycle(socket);
    this.rebindFeatureHandlers(socket);

    if (socket.connected) {
      this.setState('connected');
      return;
    }

    this.setState('connecting');
    socket.connect();
  }

  disconnect(): void {
    this.intentionalDisconnect = true;
    const socket = getSocketClient();
    this.unbindLifecycle(socket);
    this.clearSocketFeatureListeners(socket);
    socket.disconnect();
    this.setState('disconnected');
  }

  reconnectWithToken(token: string): void {
    const socket = getSocketClient();
    this.intentionalDisconnect = false;
    socket.auth = { token };

    this.bindLifecycle(socket);
    this.rebindFeatureHandlers(socket);

    if (socket.connected) {
      socket.disconnect();
    }

    this.setState('reconnecting');
    socket.connect();
  }

  on<TPayload = unknown>(
    event: SocketEventName | string,
    handler: (payload: TPayload) => void,
  ): () => void {
    const wrapped = handler as (...args: unknown[]) => void;
    let handlers = this.featureHandlers.get(event);
    if (!handlers) {
      handlers = new Set();
      this.featureHandlers.set(event, handlers);
    }
    handlers.add(wrapped);

    this.socketOn(getSocketClient(), event, wrapped);

    return () => {
      this.off(event, wrapped);
    };
  }

  off(event: SocketEventName | string, handler: (...args: unknown[]) => void) {
    const handlers = this.featureHandlers.get(event);
    handlers?.delete(handler);
    if (handlers && handlers.size === 0) {
      this.featureHandlers.delete(event);
    }

    this.socketOff(getSocketClient(), event, handler);
  }

  emit(event: SocketEventName | string, payload: unknown): void {
    const socket = getSocketClient() as unknown as {
      emit: (eventName: string, data: unknown) => void;
    };
    socket.emit(event, payload);
  }

  getSocket(): AppSocket {
    return getSocketClient();
  }

  destroy(): void {
    this.disconnect();
    this.featureHandlers.clear();
    this.stateListeners.clear();
    resetSocketClient();
    this.lifecycleBound = false;
  }

  private setState(next: SocketConnectionState) {
    if (this.state === next) {
      return;
    }
    this.state = next;
    for (const listener of this.stateListeners) {
      listener(next);
    }
  }

  private bindLifecycle(socket: AppSocket) {
    if (this.lifecycleBound) {
      return;
    }

    socket.on('connect', this.handleConnect);
    socket.on('disconnect', this.handleDisconnect);
    socket.on('connect_error', this.handleConnectError);
    socket.io.on('reconnect_attempt', this.handleReconnectAttempt);
    socket.io.on('reconnect', this.handleReconnect);

    this.lifecycleBound = true;
  }

  private unbindLifecycle(socket: AppSocket) {
    if (!this.lifecycleBound) {
      return;
    }

    socket.off('connect', this.handleConnect);
    socket.off('disconnect', this.handleDisconnect);
    socket.off('connect_error', this.handleConnectError);
    socket.io.off('reconnect_attempt', this.handleReconnectAttempt);
    socket.io.off('reconnect', this.handleReconnect);

    this.lifecycleBound = false;
  }

  private rebindFeatureHandlers(socket: AppSocket) {
    this.clearSocketFeatureListeners(socket);
    for (const [event, handlers] of this.featureHandlers) {
      for (const handler of handlers) {
        this.socketOn(socket, event, handler);
      }
    }
  }

  private clearSocketFeatureListeners(socket: AppSocket) {
    for (const [event, handlers] of this.featureHandlers) {
      for (const handler of handlers) {
        this.socketOff(socket, event, handler);
      }
    }
  }

  private socketOn(
    socket: AppSocket,
    event: string,
    handler: (...args: unknown[]) => void,
  ) {
    socket.on(event as never, handler as never);
  }

  private socketOff(
    socket: AppSocket,
    event: string,
    handler: (...args: unknown[]) => void,
  ) {
    socket.off(event as never, handler as never);
  }

  private readonly handleConnect = () => {
    this.setState('connected');
  };

  private readonly handleDisconnect = () => {
    if (this.intentionalDisconnect) {
      this.setState('disconnected');
      return;
    }
    this.setState('reconnecting');
  };

  private readonly handleConnectError = () => {
    this.setState('error');
  };

  private readonly handleReconnectAttempt = () => {
    this.setState('reconnecting');
  };

  private readonly handleReconnect = () => {
    this.setState('connected');
  };
}

export const socketManager = new SocketManager();
