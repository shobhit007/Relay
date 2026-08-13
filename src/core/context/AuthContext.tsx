import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { onSessionExpired } from '@/core/session/session-bridge';
import {
  deleteTokens,
  getAccessToken,
  saveTokens,
} from '@/core/storage/secure-store';
import { showToast } from '@core/toast';
import {
  getMe,
  login,
  logout as logoutRequest,
  register,
} from '@features/auth/api/auth.api';
import type {
  LoginInput,
  PublicUser,
  RegisterInput,
} from '@features/auth/types/auth.types';
import { userService } from '@features/user';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  user: PublicUser | null;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSessionUser(user: PublicUser) {
  await userService.setSessionUser({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    updatedAt: user.updatedAt,
  });
}

async function applySession(
  user: PublicUser,
  accessToken: string,
  refreshToken: string,
) {
  await saveTokens({ accessToken, refreshToken });
  await persistSessionUser(user);
  return user;
}

async function clearLocalSession() {
  await deleteTokens();
  await userService.clearSession();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    return onSessionExpired(() => {
      void (async () => {
        await clearLocalSession();
        setUser(null);
        setStatus('unauthenticated');
        showToast('Session expired. Please log in again.');
      })();
    });
  }, []);

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
        await persistSessionUser(me);
        if (!cancelled) {
          setUser(me);
          setStatus('authenticated');
        }
      } catch {
        await clearLocalSession();
        if (!cancelled) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    }

    void bootstrap();

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
    try {
      await logoutRequest();
    } catch {
      // Best-effort server revoke; always clear local session.
    }

    await clearLocalSession();
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
