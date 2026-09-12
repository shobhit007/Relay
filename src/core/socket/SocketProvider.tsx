import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/core/context/AuthContext';
import { onAccessTokenRefreshed } from '@/core/session/token-bridge';
import { getAccessToken } from '@/core/storage/secure-store';
import {
  getActiveChat,
  messageRetryCoordinator,
  messageService,
  registerMessageInboundHandlers,
} from '@features/messages';
import { useUser } from '@features/user';
import { socketManager } from '@shared/socket';

import { SocketConnectionBanner } from './SocketConnectionBanner';

export function SocketProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const { currentUserId } = useUser();

  useEffect(() => {
    const unsubscribeInbound = registerMessageInboundHandlers(
      () => currentUserId,
    );

    return () => {
      unsubscribeInbound();
    };
  }, [currentUserId]);

  useEffect(() => {
    let cancelled = false;

    async function syncSocketWithAuth() {
      if (status === 'authenticated') {
        const token = await getAccessToken();
        if (cancelled) {
          return;
        }
        if (token) {
          socketManager.connect(token);
        }
        return;
      }

      if (status === 'unauthenticated') {
        socketManager.disconnect();
      }
    }

    void syncSocketWithAuth();

    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    return onAccessTokenRefreshed((accessToken) => {
      socketManager.reconnectWithToken(accessToken);
    });
  }, []);

  useEffect(() => {
    messageRetryCoordinator.start();

    let previous = socketManager.getConnectionState();
    const unsubscribeConnection = socketManager.subscribeConnectionState(
      (state) => {
        if (state === 'connected' && previous !== 'connected') {
          messageRetryCoordinator.kick('socket');

          const active = getActiveChat();
          if (active) {
            void messageService
              .syncConversationMessages({
                localConversationId: active.localConversationId,
                currentUserId: active.currentUserId,
              })
              .catch((error) => {
                console.warn('Message sync on reconnect failed', error);
              });
          }
        }
        previous = state;
      },
    );

    // If already connected when the provider mounts, flush pending outbox.
    if (previous === 'connected') {
      messageRetryCoordinator.kick('socket');
    }

    socketManager.startNetworkGate();
    socketManager.startForegroundGate();

    return () => {
      unsubscribeConnection();
      messageRetryCoordinator.stop();
      socketManager.stopForegroundGate();
      socketManager.stopNetworkGate();
      socketManager.disconnect();
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <SocketConnectionBanner />
      {children}
    </View>
  );
}
