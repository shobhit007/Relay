import { useEffect, type ReactNode } from 'react';

import { networkManager } from './networkManager';

type NetworkProviderProps = {
  children: ReactNode;
};

export function NetworkProvider({ children }: NetworkProviderProps) {
  useEffect(() => {
    networkManager.start();

    return () => {
      networkManager.stop();
    };
  }, []);

  return children;
}
