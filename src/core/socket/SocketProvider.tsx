import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/core/context/AuthContext';
import { onAccessTokenRefreshed } from '@/core/session/token-bridge';
import { getAccessToken } from '@/core/storage/secure-store';
import { registerMessageInboundHandlers } from '@features/messages';
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
    return () => {
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
