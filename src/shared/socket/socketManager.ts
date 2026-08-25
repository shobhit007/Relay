import { networkManager } from "@/core/network";
import { ensureValidAccessToken } from "@shared/api";

import {
  getSocketClient,
  resetSocketClient,
  type AppSocket,
} from "./socketClient";
import type { SocketEventName } from "./socketEvents";

export type SocketConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

type ConnectionStateListener = (state: SocketConnectionState) => void;

class SocketManager {
  private state: SocketConnectionState = "disconnected";
  private readonly stateListeners = new Set<ConnectionStateListener>();
  private readonly featureHandlers = new Map<
    string,
    Set<(...args: unknown[]) => void>
  >();
  private lifecycleBound = false;
  private intentionalDisconnect = false;
  private accessToken: string | null = null;
  private unsubscribeNetwork: (() => void) | null = null;
  private refreshingAuth = false;
  private authRetryUsed = false;

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

  startNetworkGate(): void {
    if (this.unsubscribeNetwork) {
      return;
    }

    const applyNetworkState = (
      network: ReturnType<typeof networkManager.getState>,
    ) => {
      const socket = getSocketClient();

      if (network.status === "offline") {
        socket.io.reconnection(false);
        return;
      }

      if (network.status !== "online") {
        return;
      }

      socket.io.reconnection(true);

      if (this.intentionalDisconnect || !this.accessToken || socket.connected) {
        return;
      }

      this.applyAuth(socket, this.accessToken);
      this.bindLifecycle(socket);
      this.rebindFeatureHandlers(socket);
      this.setState("reconnecting");
      socket.connect();
    };

    this.unsubscribeNetwork = networkManager.subscribe(applyNetworkState);
    applyNetworkState(networkManager.getState());
  }

  stopNetworkGate(): void {
    this.unsubscribeNetwork?.();
    this.unsubscribeNetwork = null;
  }

  connect(token: string): void {
    console.log("socket connecting...");
    const socket = getSocketClient();
    this.intentionalDisconnect = false;
    this.accessToken = token;
    this.applyAuth(socket, token);
    this.syncReconnectionEnabled(socket);

    this.bindLifecycle(socket);
    this.rebindFeatureHandlers(socket);

    if (socket.connected) {
      this.setState("connected");
      return;
    }

    this.setState("connecting");
    socket.connect();
  }

  disconnect(): void {
    this.intentionalDisconnect = true;
    this.accessToken = null;
    this.refreshingAuth = false;
    const socket = getSocketClient();
    socket.io.reconnection(false);
    this.unbindLifecycle(socket);
    this.clearSocketFeatureListeners(socket);
    socket.disconnect();
    this.setState("disconnected");
  }

  reconnectWithToken(token: string): void {
    console.log("reconnecting with token");
    const socket = getSocketClient();
    this.intentionalDisconnect = false;
    this.accessToken = token;
    this.applyAuth(socket, token);
    this.syncReconnectionEnabled(socket);

    this.bindLifecycle(socket);
    this.rebindFeatureHandlers(socket);

    if (socket.connected) {
      socket.disconnect();
    }

    this.setState("reconnecting");
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
    this.stopNetworkGate();
    this.disconnect();
    this.featureHandlers.clear();
    this.stateListeners.clear();
    resetSocketClient();
    this.lifecycleBound = false;
  }

  private applyAuth(socket: AppSocket, token: string) {
    socket.auth = { token };
  }

  private syncReconnectionEnabled(socket: AppSocket) {
    const shouldReconnect =
      !this.intentionalDisconnect &&
      networkManager.getState().status !== "offline";
    socket.io.reconnection(shouldReconnect);
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

    socket.on("connect", this.handleConnect);
    socket.on("disconnect", this.handleDisconnect);
    socket.on("connect_error", this.handleConnectError);
    socket.io.on("reconnect_attempt", this.handleReconnectAttempt);
    socket.io.on("reconnect", this.handleReconnect);
    socket.io.on("reconnect_failed", this.handleReconnectFailed);

    this.lifecycleBound = true;

    console.log("life cycle bounded");
  }

  private unbindLifecycle(socket: AppSocket) {
    if (!this.lifecycleBound) {
      return;
    }

    socket.off("connect", this.handleConnect);
    socket.off("disconnect", this.handleDisconnect);
    socket.off("connect_error", this.handleConnectError);
    socket.io.off("reconnect_attempt", this.handleReconnectAttempt);
    socket.io.off("reconnect", this.handleReconnect);
    socket.io.off("reconnect_failed", this.handleReconnectFailed);

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

  private refreshAuthCache(): void {
    void ensureValidAccessToken().then((token) => {
      if (this.intentionalDisconnect) {
        return;
      }

      if (!token) {
        this.disconnect();
        return;
      }

      this.accessToken = token;
      this.applyAuth(getSocketClient(), token);
    });
  }

  private readonly handleConnect = () => {
    this.refreshingAuth = false;
    this.authRetryUsed = false;
    this.setState("connected");
  };

  private readonly handleDisconnect = () => {
    if (this.intentionalDisconnect) {
      this.setState("disconnected");
      return;
    }

    this.setState("reconnecting");

    if (networkManager.getState().status === "offline") {
      getSocketClient().io.reconnection(false);
      return;
    }

    this.refreshAuthCache();
  };

  private readonly handleConnectError = (error: Error) => {
    if (this.intentionalDisconnect) {
      return;
    }

    if (error.message === "UNAUTHORIZED") {
      if (this.refreshingAuth) {
        return;
      }

      if (this.authRetryUsed) {
        this.disconnect();
        return;
      }

      this.authRetryUsed = true;
      this.refreshingAuth = true;
      this.setState("reconnecting");

      void ensureValidAccessToken()
        .then((token) => {
          if (this.intentionalDisconnect) {
            return;
          }

          if (!token) {
            this.disconnect();
            return;
          }

          const socket = getSocketClient();
          this.accessToken = token;
          this.applyAuth(socket, token);
          this.syncReconnectionEnabled(socket);

          if (!socket.connected) {
            socket.connect();
          }
        })
        .finally(() => {
          this.refreshingAuth = false;
        });
      return;
    }

    if (networkManager.getState().status === "offline") {
      this.setState("reconnecting");
      return;
    }

    this.setState("error");
  };

  private readonly handleReconnectAttempt = () => {
    console.log("reconnecting attempt");
    const socket = getSocketClient();
    if (this.accessToken) {
      this.applyAuth(socket, this.accessToken);
    }
    this.setState("reconnecting");
  };

  private readonly handleReconnect = () => {
    this.refreshingAuth = false;
    this.authRetryUsed = false;
    this.setState("connected");
  };

  private readonly handleReconnectFailed = () => {
    if (this.intentionalDisconnect) {
      return;
    }
    this.setState("error");
  };
}

export const socketManager = new SocketManager();
