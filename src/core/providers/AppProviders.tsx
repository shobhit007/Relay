import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/core/context/AuthContext';
import { DatabaseProvider } from '@core/db';
import { UserProvider } from '@features/user';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <DatabaseProvider>
      <UserProvider>
        <SafeAreaProvider>
          <AuthProvider>{children}</AuthProvider>
        </SafeAreaProvider>
      </UserProvider>
    </DatabaseProvider>
  );
}
