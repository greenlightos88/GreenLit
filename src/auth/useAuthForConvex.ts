import { useAuth } from "@clerk/react";

/**
 * Convex must continue the Clerk token exchange while Clerk finalizes a signed-in
 * session. Treating that pending state as signed out prevents the bridge from
 * ever presenting the session token to Convex.
 */
export function useAuthForConvex() {
  return useAuth({ treatPendingAsSignedOut: false });
}
