import type { ReactNode } from "react";
import { useMutation } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { SignOutButton } from "@clerk/react";
import { ProvisioningGate } from "./ProvisioningGate";

// No _generated api in this repo (codegen requires a deployment); reference the
// bootstrap mutation by path.
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
