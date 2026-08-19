import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { env } from '@core/env';
import {
  socketManager,
  type SocketConnectionState,
} from '@shared/socket';

const BANNER_VISIBLE_MS = 3000;

const STATE_LABELS: Record<SocketConnectionState, string> = {
  disconnected: 'Socket disconnected',
  connecting: 'Socket connecting…',
  connected: 'Socket connected',
  reconnecting: 'Socket reconnecting…',
  error: 'Socket error',
};

const STATE_COLORS: Record<SocketConnectionState, string> = {
  disconnected: '#6B7280',
  connecting: '#D97706',
  connected: '#059669',
  reconnecting: '#D97706',
  error: '#DC2626',
};

export function SocketConnectionBanner() {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<SocketConnectionState>(
    socketManager.getConnectionState(),
  );
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstStateRef = useRef(true);

  useEffect(() => {
    return socketManager.subscribeConnectionState((next) => {
      setState(next);

      // Skip the initial subscriber snapshot so the banner only
      // appears on real connection-state transitions.
      if (isFirstStateRef.current) {
        isFirstStateRef.current = false;
        return;
      }

      setVisible(true);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
        hideTimerRef.current = null;
      }, BANNER_VISIBLE_MS);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  if (env.appEnv !== 'development' || !visible) {
    return null;
  }

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: STATE_COLORS[state],
          paddingTop: insets.top + 4,
        },
      ]}
    >
      <Text style={styles.text}>{STATE_LABELS[state]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingBottom: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
