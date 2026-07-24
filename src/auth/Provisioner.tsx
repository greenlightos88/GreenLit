import type { ReactNode } from "react";
import { useMutation } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { SignOutButton } from "@clerk/react";
import { ProvisioningGate } from "./ProvisioningGate";

// TEMPORARY (see docs/KNOWN_LIMITATIONS.md): this path-based reference is not
// end-to-end typed. `convex/_generated` is not committed yet because official
// typed codegen requires a configured Convex deployment. Once the first
// deployment exists and `convex/_generated` is committed, replace this with the
// typed `api.users.bootstrap`. This must remain the ONLY path-based frontend
// reference — new frontend queries/mutations must not copy this pattern.
const bootstrapRef = makeFunctionReference<"mutation">("users:bootstrap");

/** Wires the Convex bootstrap mutation and Clerk sign-out into ProvisioningGate. */
export function Provisioner({ children }: { children: ReactNode }) {
  const bootstrap = useMutation(bootstrapRef);
  return (
    <ProvisioningGate
      bootstrap={() => bootstrap({})}
      signOut={
        <SignOutButton>
          <button type="button" className="button button-secondary">
            Sign out
          </button>
        </SignOutButton>
      }
    >
      {children}
    </ProvisioningGate>
  );
}
