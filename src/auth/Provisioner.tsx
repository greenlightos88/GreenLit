import type { ReactNode } from "react";
import { useMutation } from "convex/react";
import { SignOutButton } from "@clerk/react";
import { api } from "../../convex/_generated/api";
import { ProvisioningGate } from "./ProvisioningGate";

/** Wires the Convex bootstrap mutation and Clerk sign-out into ProvisioningGate. */
export function Provisioner({ children }: { children: ReactNode }) {
  const bootstrap = useMutation(api.users.bootstrap);
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
