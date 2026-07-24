/** Branded loading screen shown while authentication and provisioning resolve. */
export function BootSplash({ message = "Loading your workspace…" }: { message?: string }) {
  return (
    <div className="auth-screen" role="status" aria-live="polite">
      <span className="workspace-monogram">GL</span>
      <p className="auth-message">{message}</p>
    </div>
  );
}
