import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { bindCurrentUserIdSetter } from '../services/session-bridge';

type UserContextValue = {
  currentUserId: string | null;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    bindCurrentUserIdSetter(setCurrentUserId);
    return () => {
      bindCurrentUserIdSetter(null);
    };
  }, []);

  const value = useMemo(() => ({ currentUserId }), [currentUserId]);

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
