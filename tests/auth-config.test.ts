import { describe, expect, test } from "bun:test";
import { readAuthConfig } from "../src/auth/config";

const env = (o: Partial<Record<string, string>>) => o as unknown as ImportMetaEnv;

describe("readAuthConfig", () => {
  test("returns config when both variables are present", () => {
    const cfg = readAuthConfig(
      env({ VITE_CONVEX_URL: "https://x.convex.cloud", VITE_CLERK_PUBLISHABLE_KEY: "pk_test_x" }),
    );
    expect(cfg).toEqual({
      convexUrl: "https://x.convex.cloud",
      clerkPublishableKey: "pk_test_x",
    });
  });

  test("throws a clear message naming a single missing variable", () => {
    expect(() => readAuthConfig(env({ VITE_CLERK_PUBLISHABLE_KEY: "pk" }))).toThrow(
      /VITE_CONVEX_URL/,
    );
  });

  test("names every missing variable when both are absent", () => {
    let message = "";
    try {
      readAuthConfig(env({}));
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("VITE_CONVEX_URL");
    expect(message).toContain("VITE_CLERK_PUBLISHABLE_KEY");
  });
});
