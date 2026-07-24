import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { BootSplash } from "./BootSplash";

type Status = "pending" | "ready" | "error";

/**
 * Gates the workspace on successful provisioning. Calls `bootstrap` exactly once
 * per mount and renders `children` only after it resolves, so protected Convex
 * queries never mount before provisioning completes. On failure it renders a
 * retry and the injected sign-out control, and never mounts the workspace.
 *
 * Pure: `bootstrap` and `signOut` are injected, so it needs no Convex or Clerk
 * context and is directly testable.
 */
export function ProvisioningGate({
  bootstrap,
  signOut,
  children,
}: {
  bootstrap: () => Promise<unknown>;
  signOut: ReactNode;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<Status>("pending");
  const started = useRef(false);

  const run = useCallback(() => {
    setStatus("pending");
    void bootstrap()
      .then(() => setStatus("ready"))
      .catch(() => setStatus("error"));
  }, [bootstrap]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
  }, [run]);

  if (status === "ready") return <>{children}</>;

  if (status === "error") {
    return (
      <div className="auth-screen" role="alert">
        <span className="workspace-monogram">GL</span>
        <h1>Setup could not complete</h1>
        <p className="auth-message">
          We couldn&rsquo;t finish preparing your workspace.
        </p>
        <div className="auth-actions">
          <button type="button" className="button button-primary" onClick={run}>
            Retry
          </button>
          {signOut}
        </div>
      </div>
    );
  }

  return <BootSplash message="Preparing your workspace…" />;
}
