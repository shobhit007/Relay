import { io, type Socket } from 'socket.io-client';

import { env } from '@core/env';

import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from './socketEvents';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export function getSocketClient(): AppSocket {
  if (!socket) {
    socket = io(env.apiUrl, {
      autoConnect: false,
      transports: ['websocket'],
    }) as AppSocket;
  }

  return socket;
}

export function resetSocketClient(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
