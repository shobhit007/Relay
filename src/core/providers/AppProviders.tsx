import type { ReactNode } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStateProvider } from '@/core/app-state';
import { AuthProvider } from '@/core/context/AuthContext';
import { NetworkProvider } from '@/core/network';
import { SocketProvider } from '@/core/socket/SocketProvider';
import { DatabaseProvider } from '@core/db';
import { ToastProvider } from '@core/toast';
import { UserProvider } from '@features/user';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <DatabaseProvider>
      <UserProvider>
        <SafeAreaProvider>
          <KeyboardProvider>
            <ToastProvider>
              <NetworkProvider>
                <AppStateProvider>
                  <AuthProvider>
                    <SocketProvider>{children}</SocketProvider>
                  </AuthProvider>
                </AppStateProvider>
              </NetworkProvider>
            </ToastProvider>
          </KeyboardProvider>
        </SafeAreaProvider>
      </UserProvider>
    </DatabaseProvider>
  );
}
