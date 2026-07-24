export interface AuthEnv {
  convexUrl: string;
  clerkPublishableKey: string;
}

/**
 * Read and validate the Vite-provided frontend authentication configuration.
 * Frontend access is Vite-native (`import.meta.env`), never `process.env`.
 * Throws a clear, actionable error naming every missing variable.
 */
export function readAuthConfig(env: ImportMetaEnv = import.meta.env): AuthEnv {
  const convexUrl = env.VITE_CONVEX_URL;
  const clerkPublishableKey = env.VITE_CLERK_PUBLISHABLE_KEY;

  const missing: string[] = [];
  if (!convexUrl) missing.push("VITE_CONVEX_URL");
  if (!clerkPublishableKey) missing.push("VITE_CLERK_PUBLISHABLE_KEY");
  if (missing.length > 0) {
    throw new Error(
      `Missing required frontend configuration: ${missing.join(", ")}. ` +
        `Define ${missing.length === 1 ? "it" : "them"} in .env.local (see .env.example).`,
    );
  }
  return { convexUrl, clerkPublishableKey };
}
