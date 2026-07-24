import type { AuthConfig } from "convex/server";

/**
 * Convex reads this at deploy time to verify Clerk-issued JWTs. Use Clerk's
 * native Convex integration (recommended) to obtain the issuer domain; a manual
 * "convex" JWT template is fallback/legacy only. `applicationID` must match the
 * token's audience ("convex"). Set CLERK_JWT_ISSUER_DOMAIN in the Convex
 * deployment environment (never committed).
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
