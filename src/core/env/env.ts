function readPublicEnv(
  name: `EXPO_PUBLIC_${string}`,
  fallback?: string,
): string {
  const raw = process.env[name]?.trim() || fallback?.trim();
  if (!raw) {
    throw new Error(`Missing required env: ${name}`);
  }
  return raw;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

type AppEnv = "development" | "staging" | "production";

function readAppEnv(): AppEnv {
  const raw = (process.env.EXPO_PUBLIC_APP_ENV?.trim() || "development") as string;
  if (raw === "development" || raw === "staging" || raw === "production") {
    return raw;
  }
  throw new Error(
    `Invalid EXPO_PUBLIC_APP_ENV "${raw}". Expected development | staging | production`,
  );
}

/**
 * Typed public app config. Values come from Expo `EXPO_PUBLIC_*` env vars
 * (see `.env` / `.env.example`). Import from `@core/env` anywhere in the app.
 */
export const env = {
  apiUrl: stripTrailingSlash(
    readPublicEnv("EXPO_PUBLIC_API_URL", "http://localhost:8080"),
  ),
  appEnv: readAppEnv(),
} as const;

export type Env = typeof env;
