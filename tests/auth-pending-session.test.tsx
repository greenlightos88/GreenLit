import { afterEach, describe, expect, mock, test } from "bun:test";
import type { ReactNode } from "react";
import { cleanup, renderHook } from "@testing-library/react";

const useAuthMock = mock((_options?: { treatPendingAsSignedOut?: boolean }) => ({
  isLoaded: true,
  isSignedIn: true,
  getToken: async () => "token",
}));

mock.module("@clerk/react", () => ({
  useAuth: useAuthMock,
  SignInButton: ({ children }: { children: ReactNode }) => <>{children}</>,
  SignOutButton: ({ children }: { children: ReactNode }) => <>{children}</>,
  UserButton: () => <div data-testid="user-button" />,
}));

const { useAuthForConvex } = await import("../src/auth/useAuthForConvex");

afterEach(() => {
  cleanup();
  useAuthMock.mockClear();
});

describe("useAuthForConvex", () => {
  test("does not collapse a pending signed-in Clerk session into signed-out state", () => {
    renderHook(() => useAuthForConvex());

    expect(useAuthMock).toHaveBeenCalledWith({
      treatPendingAsSignedOut: false,
    });
  });
});
