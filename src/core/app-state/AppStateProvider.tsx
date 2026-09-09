import { useEffect, type ReactNode } from 'react';

import { appStateManager } from './appStateManager';

type AppStateProviderProps = {
  children: ReactNode;
};

export function AppStateProvider({ children }: AppStateProviderProps) {
  useEffect(() => {
    appStateManager.start();

    return () => {
      appStateManager.stop();
    };
  }, []);

  return children;
}
