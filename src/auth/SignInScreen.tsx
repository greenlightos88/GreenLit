import { SignInButton } from "@clerk/react";

/** GreenLit-branded signed-out screen with Clerk modal sign-in. */
export function SignInScreen() {
  return (
    <div className="auth-screen">
      <span className="workspace-monogram">GL</span>
      <h1>GreenLit</h1>
      <p className="auth-message">
        Sign in to enter your creative development workspace.
      </p>
      <SignInButton mode="modal">
        <button type="button" className="button button-primary">
          Sign in
        </button>
      </SignInButton>
    </div>
  );
}
