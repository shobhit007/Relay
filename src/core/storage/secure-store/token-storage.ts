import { deleteItem, getItem, setItem } from "./secureStore";

const ACCESS_TOKEN_KEY = "relay.accessToken";
const REFRESH_TOKEN_KEY = "relay.refreshToken";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export async function saveTokens({
  accessToken,
  refreshToken,
}: AuthTokens): Promise<void> {
  await Promise.all([
    setItem(ACCESS_TOKEN_KEY, accessToken),
    setItem(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function saveAccessToken(accessToken: string): Promise<void> {
  await setItem(ACCESS_TOKEN_KEY, accessToken);
}

export async function getAccessToken(): Promise<string | null> {
  return getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_TOKEN_KEY);
}

export async function deleteTokens(): Promise<void> {
  await Promise.all([
    deleteItem(ACCESS_TOKEN_KEY),
    deleteItem(REFRESH_TOKEN_KEY),
  ]);
}
