import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  deleteTokens,
  getAccessToken,
  saveTokens,
} from '@/core/storage/secure-store';
import { getMe, login, register } from '@features/auth/api/auth.api';
import type {
  LoginInput,
  PublicUser,
  RegisterInput,
} from '@features/auth/types/auth.types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  user: PublicUser | null;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function applySession(user: PublicUser, accessToken: string, refreshToken: string) {
  await saveTokens({ accessToken, refreshToken });
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const token = await getAccessToken();
        if (!token) {
          if (!cancelled) {
            setUser(null);
            setStatus('unauthenticated');
          }
          return;
        }

        const me = await getMe();
        if (!cancelled) {
          setUser(me);
          setStatus('authenticated');
        }
      } catch {
        await deleteTokens();
        if (!cancelled) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (input: LoginInput) => {
    const result = await login(input);
    const nextUser = await applySession(
      result.user,
      result.accessToken,
      result.refreshToken,
    );
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const signUp = useCallback(async (input: RegisterInput) => {
    const result = await register(input);
    const nextUser = await applySession(
      result.user,
      result.accessToken,
      result.refreshToken,
    );
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    await deleteTokens();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      signIn,
      signUp,
      signOut,
    }),
    [status, user, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
