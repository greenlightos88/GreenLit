/** Boot-time screen shown when required frontend configuration is missing. */
export function ConfigError({ message }: { message: string }) {
  return (
    <div className="auth-screen" role="alert">
      <span className="workspace-monogram">GL</span>
      <h1>Configuration required</h1>
      <p className="auth-message">{message}</p>
    </div>
  );
}
