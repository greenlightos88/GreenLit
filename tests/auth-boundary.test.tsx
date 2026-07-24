import { afterEach, describe, expect, mock, test } from "bun:test";
import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";

/**
 * Composition test for the auth boundary. convex/react's auth-state components
 * and Clerk's UI components are mocked so we can drive each state; the backend
 * authorization behavior is covered separately by tests/auth.test.ts.
 */

let authState: "loading" | "signedOut" | "authenticated" = "loading";

mock.module("convex/react", () => ({
  AuthLoading: ({ children }: { children: ReactNode }) =>
    authState === "loading" ? <>{children}</> : null,
  Unauthenticated: ({ children }: { children: ReactNode }) =>
    authState === "signedOut" ? <>{children}</> : null,
  Authenticated: ({ children }: { children: ReactNode }) =>
    authState === "authenticated" ? <>{children}</> : null,
  useMutation: () => () => Promise.resolve({ id: "u1", email: null, displayName: null }),
}));

mock.module("@clerk/react", () => ({
  SignInButton: ({ children }: { children: ReactNode }) => <>{children}</>,
  SignOutButton: ({ children }: { children: ReactNode }) => <>{children}</>,
  UserButton: () => <div data-testid="user-button" />,
}));

const { AuthBoundary } = await import("../src/auth/AuthBoundary");
const { UserButton } = await import("@clerk/react");

function Workspace() {
  // Stands in for the authenticated shell, which hosts the real UserButton.
  return (
    <div data-testid="workspace">
      <UserButton />
    </div>
  );
}

afterEach(cleanup);

describe("AuthBoundary", () => {
  test("loading renders the boot splash and not the workspace", () => {
    authState = "loading";
    render(
      <AuthBoundary>
        <Workspace />
      </AuthBoundary>,
    );
    expect(screen.getByText(/loading your workspace/i)).toBeDefined();
    expect(screen.queryByTestId("workspace")).toBeNull();
  });

  test("signed out renders sign-in and mounts neither the workspace nor the user button", () => {
    authState = "signedOut";
    render(
      <AuthBoundary>
        <Workspace />
      </AuthBoundary>,
    );
    expect(screen.getByText("Sign in")).toBeDefined();
    expect(screen.queryByTestId("workspace")).toBeNull();
    expect(screen.queryByTestId("user-button")).toBeNull();
  });

  test("authenticated provisions, then mounts the workspace with the user button", async () => {
    authState = "authenticated";
    render(
      <AuthBoundary>
        <Workspace />
      </AuthBoundary>,
    );
    await screen.findByTestId("workspace");
    expect(screen.getByTestId("user-button")).toBeDefined();
  });
});
