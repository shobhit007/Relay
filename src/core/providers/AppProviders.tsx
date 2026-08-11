import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/core/context/AuthContext';
import { DatabaseProvider } from '@core/db';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <DatabaseProvider>
      <SafeAreaProvider>
        <AuthProvider>{children}</AuthProvider>
      </SafeAreaProvider>
    </DatabaseProvider>
  );
}
