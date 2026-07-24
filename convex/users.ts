import { mutationGeneric as mutation } from "convex/server";
import { ensureCurrentUser } from "./identity";

/**
 * Authenticated bootstrap for the frontend. Takes no identity arguments — the
 * identity is derived from ctx.auth — provisions or refreshes the current
 * application user, and is safe to call repeatedly. Returns only the minimal
 * current-user shape the UI needs.
 */
export const bootstrap = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ensureCurrentUser(ctx);
    return {
      id: user._id,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
    };
  },
});
