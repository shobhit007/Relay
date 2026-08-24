import type { ReactNode } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/core/context/AuthContext';
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
              <AuthProvider>
                <SocketProvider>{children}</SocketProvider>
              </AuthProvider>
            </ToastProvider>
          </KeyboardProvider>
        </SafeAreaProvider>
      </UserProvider>
    </DatabaseProvider>
  );
}
