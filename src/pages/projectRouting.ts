import type { Id } from "../../convex/_generated/dataModel";

/** The `/develop` search parameter that names the active project. */
export const PROJECT_QUERY_KEY = "project";

interface ProjectLike {
  _id: Id<"projects">;
}

export interface ResolvedProject<T extends ProjectLike> {
  /** The authorized project the workspace should show, or null while none exist. */
  activeProjectId: Id<"projects"> | null;
  /** The requested project when it belongs to the authorized list. */
  requestedProject: T | undefined;
  /** True when a project was requested that is not in the authorized list. */
  requestedUnavailable: boolean;
}

/**
 * Resolve the active project from the requested id and the owner-scoped project
 * list. The requested id is honored only when it appears in the authorized
 * list; otherwise the first authorized project is the fallback. An unavailable
 * or unauthorized id therefore never becomes active, and authorization stays
 * server-side — the id is navigation state only.
 */
export function resolveActiveProject<T extends ProjectLike>(
  projects: readonly T[] | undefined,
  requestedProjectId: Id<"projects"> | null,
): ResolvedProject<T> {
  if (projects === undefined) {
    return { activeProjectId: null, requestedProject: undefined, requestedUnavailable: false };
  }
  const requestedProject = requestedProjectId
    ? projects.find((project) => project._id === requestedProjectId)
    : undefined;
  const activeProjectId = requestedProject?._id ?? projects[0]?._id ?? null;
  const requestedUnavailable =
    requestedProjectId !== null && requestedProject === undefined && projects.length > 0;
  return { activeProjectId, requestedProject, requestedUnavailable };
}

/** Read the requested project id from a `/develop` search object. */
export function projectFromSearch(search: { project?: unknown }): Id<"projects"> | null {
  return typeof search.project === "string" && search.project.length > 0
    ? (search.project as Id<"projects">)
    : null;
}
