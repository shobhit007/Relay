type AccessTokenRefreshedListener = (accessToken: string) => void;

const listeners = new Set<AccessTokenRefreshedListener>();

export function onAccessTokenRefreshed(
  listener: AccessTokenRefreshedListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitAccessTokenRefreshed(accessToken: string) {
  for (const listener of listeners) {
    listener(accessToken);
  }
}
