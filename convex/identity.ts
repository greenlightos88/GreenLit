import { internalMutationGeneric as internalMutation } from "convex/server";
import type {
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";

/**
 * Identity and authorization boundary (ADR-0002 §10).
 *
 * Clerk establishes WHO the human is (`ctx.auth.getUserIdentity()`). Convex
 * enforces WHAT they may touch. External delivery recipients and AI/service
 * agents never pass through here: an internal/agent caller carries no
 * `ctx.auth` identity, so the human-only helpers reject it by construction —
 * no agent principal type needs to exist.
 */

type AnyQueryCtx = GenericQueryCtx<GenericDataModel>;
type AnyMutationCtx = GenericMutationCtx<GenericDataModel>;

/**
 * READ-ONLY. Resolve the authenticated human to an existing `users` row.
 * Never inserts — safe on every read/authorization path. Throws when there is
 * no Clerk identity, or the human has not been provisioned yet.
 */
export async function requireAuthenticatedUser(ctx: AnyQueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated.");
  const user = await ctx.db
    .query("users")
    .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
    .unique();
  if (!user) throw new Error("User not provisioned.");
  return user;
}

/**
 * WRITE. Provision (or refresh) the `users` row for the authenticated human.
 * Creates the row on first sight and, on later sightings, updates the stored
 * profile when Clerk's claims (email / display name) have changed. Called only
 * at explicit provisioning points (project creation) — never from a read path,
 * so reads never write.
 */
export async function ensureCurrentUser(ctx: AnyMutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated.");
  const existing = await ctx.db
    .query("users")
    .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
    .unique();
  if (existing) {
    const userId = existing._id as GenericId<"users">;
    const updates: { email?: string; displayName?: string } = {};
    if (identity.email !== undefined && existing.email !== identity.email) {
      updates.email = identity.email;
    }
    if (identity.name !== undefined && existing.displayName !== identity.name) {
      updates.displayName = identity.name;
    }
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(userId, updates);
      const refreshed = await ctx.db.get(userId);
      if (!refreshed) throw new Error("Failed to refresh user.");
      return refreshed;
    }
    return existing;
  }
  const id = await ctx.db.insert("users", {
    subject: identity.subject,
    // Omit optional fields entirely when Clerk did not supply them, rather than
    // storing an explicit undefined.
    ...(identity.email !== undefined ? { email: identity.email } : {}),
    ...(identity.name !== undefined ? { displayName: identity.name } : {}),
    createdAt: Date.now(),
  });
  const created = await ctx.db.get(id);
  if (!created) throw new Error("Failed to provision user.");
  return created;
}

/**
 * The single project access gate. Resolves the caller (read-only) and the
 * project in one place and returns both, so callers never re-fetch. A future
 * membership model replaces only the ownership predicate below — call sites do
 * not change.
 */
export async function assertProjectAccess(
  ctx: AnyQueryCtx,
  projectId: GenericId<"projects">,
) {
  const user = await requireAuthenticatedUser(ctx);
  const project = await ctx.db.get(projectId);
  if (!project) throw new Error("Project not found.");
  // An ownerless row is access-denied, never access-granted (ADR-0002 §10.4).
  if (project.ownerUserId === undefined || project.ownerUserId !== user._id) {
    throw new Error("Forbidden.");
  }
  return { user, project };
}

/**
 * Constrained development/seed backfill (ADR-0002 §10.4). Internal only (no
 * public API surface). It is NOT a general owner-setter: it refuses to
 * overwrite an existing owner and requires the target `users` row to already
 * exist. It never creates identities and never runs automatically.
 */
export const backfillProjectOwner = internalMutation({
  args: { projectId: v.id("projects"), subject: v.string() },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found.");
    if (project.ownerUserId !== undefined) {
      throw new Error("Project already has an owner; refusing to overwrite.");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_subject", (q) => q.eq("subject", args.subject))
      .unique();
    if (!user) {
      throw new Error("No user exists for that subject; provision the user first.");
    }
    await ctx.db.patch(args.projectId, {
      ownerUserId: user._id,
      updatedAt: Date.now(),
    });
    return { projectId: args.projectId, ownerUserId: user._id };
  },
});
