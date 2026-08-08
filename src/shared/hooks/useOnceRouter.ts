import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Prevents double-taps from stacking the same route (e.g. Welcome → Login twice).
 * Unlock when the screen regains focus (user navigates back).
 */
export function useOnceRouter() {
  const router = useRouter();
  const lockedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      lockedRef.current = false;
    }, []),
  );

  const pushOnce = useCallback(
    (href: Href) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      router.push(href);
    },
    [router],
  );

  const replaceOnce = useCallback(
    (href: Href) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      router.replace(href);
    },
    [router],
  );

  return { pushOnce, replaceOnce, router };
}
