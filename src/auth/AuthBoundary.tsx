import type { ReactNode } from "react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { BootSplash } from "./BootSplash";
import { SignInScreen } from "./SignInScreen";
import { Provisioner } from "./Provisioner";

/**
 * Three-stage authentication boundary. Clerk and Convex do not become ready at
 * the same moment:
 *
 * - AuthLoading   — Clerk is loading and/or the Convex token is synchronizing.
 * - Unauthenticated — signed out.
 * - Authenticated — Convex has a verified token; provision the application user
 *   (Provisioner) before mounting the workspace, so protected queries never run
 *   before the users row exists.
 */
export function AuthBoundary({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <BootSplash />
      </AuthLoading>
      <Unauthenticated>
        <SignInScreen />
      </Unauthenticated>
      <Authenticated>
        <Provisioner>{children}</Provisioner>
      </Authenticated>
    </>
  );
}
