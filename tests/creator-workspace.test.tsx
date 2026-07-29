import { afterEach, describe, expect, mock, test } from "bun:test";
import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/**
 * Router/restoration behavior for the creator workspace. convex/react and the
 * TanStack router are mocked so we can drive the authorized project list and the
 * `/develop?project=` search deterministically; owner authorization itself is
 * covered server-side by tests/auth.test.ts and tests/persisted-compilation.test.ts.
 *
 * The generated `api` is a proxy, so query/mutation references are not identity-
 * stable across modules. `listProjects` is the only query called with no second
 * argument; every project-scoped sub-query passes `{ projectId }` or "skip". We
 * distinguish on that instead of on reference identity.
 */

type Project = { _id: string; title: string; developmentStatus?: string; format?: string; updatedAt?: number };

let mockProjects: Project[] | undefined = [];
let mockSearch: { project?: string } = {};
const navigateSpy = mock((_options: unknown) => {});

mock.module("convex/react", () => ({
  // convex/react module mocks are process-global; include the auth-state exports
  // other suites rely on so this mock is a valid superset regardless of ordering.
  AuthLoading: ({ children }: { children: ReactNode }) => <>{children}</>,
  Unauthenticated: () => null,
  Authenticated: ({ children }: { children: ReactNode }) => <>{children}</>,
  useQuery: (_reference: unknown, args?: unknown) => {
    if (args === undefined) return mockProjects; // listProjects (no args)
    if (args === "skip") return undefined; // inactive project-scoped sub-query
    return undefined; // active candidates / canon / compilation (loading is fine here)
  },
  useMutation: () => mock(async () => ({ projectId: "NEW_ID" })),
}));

mock.module("@tanstack/react-router", () => ({
  useNavigate: () => navigateSpy,
  useSearch: () => mockSearch,
  Link: ({ to, search, className, children }: { to: string; search?: unknown; className?: string; children: ReactNode }) => (
    <a className={className} data-to={to} data-search={JSON.stringify(search ?? {})}>{children}</a>
  ),
}));

mock.module("@/components/Icon", () => ({ Icon: ({ name }: { name: string }) => <span data-icon={name} /> }));

mock.module("motion/react", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...rest }: { children?: ReactNode; initial?: unknown; animate?: unknown; exit?: unknown }) => {
      const { initial: _i, animate: _a, exit: _e, ...domProps } = rest as Record<string, unknown>;
      return <div {...domProps}>{children}</div>;
    },
  },
}));

const { DevelopPage } = await import("../src/pages/DevelopPage");
const { ProjectsPage } = await import("../src/pages/ProjectsPage");

afterEach(() => {
  cleanup();
  navigateSpy.mockClear();
  mockProjects = [];
  mockSearch = {};
});

describe("ProjectsPage navigation", () => {
  test("creating a project routes to /develop with the returned server id", async () => {
    mockProjects = [];
    render(<ProjectsPage />);
    fireEvent.click(screen.getByText("New project"));
    fireEvent.change(screen.getByPlaceholderText("Untitled project"), { target: { value: "My Film" } });
    fireEvent.click(screen.getByText("Create project"));

    await waitFor(() => expect(navigateSpy).toHaveBeenCalled());
    expect(navigateSpy).toHaveBeenCalledWith({ to: "/develop", search: { project: "NEW_ID" } });
  });

  test("Open project is a router Link, not a full-page anchor href", () => {
    mockProjects = [{ _id: "A", title: "Alpha", updatedAt: Date.now() }];
    render(<ProjectsPage />);
    const link = screen.getByText("Open project").closest("a");
    expect(link?.getAttribute("data-to")).toBe("/develop");
    expect(link?.getAttribute("data-search")).toContain("\"project\":\"A\"");
    expect(link?.getAttribute("href")).toBeNull(); // no full-page navigation
  });

  test("the In-development metric counts only in-development projects, not every non-delivered one", () => {
    mockProjects = [
      { _id: "A", title: "Alpha", developmentStatus: "In development", updatedAt: Date.now() },
      { _id: "B", title: "Beta", developmentStatus: "Delivered", updatedAt: Date.now() },
      { _id: "C", title: "Gamma", developmentStatus: "Archived", updatedAt: Date.now() },
    ];
    render(<ProjectsPage />);
    // Scope to the summary row so the status badge of the same text does not collide.
    const summary = screen.getByLabelText("Project summary");
    const metric = within(summary).getByText("In development").parentElement?.querySelector("strong");
    expect(metric?.textContent).toBe("1"); // only Alpha, not Beta (Delivered) nor Gamma (Archived)
  });
});

describe("DevelopPage restoration", () => {
  test("direct navigation restores the requested authorized project", () => {
    mockProjects = [{ _id: "A", title: "Alpha" }, { _id: "B", title: "Beta" }];
    mockSearch = { project: "B" };
    render(<DevelopPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Beta");
    expect(navigateSpy).not.toHaveBeenCalled(); // already correct, no URL churn
  });

  test("router search change (browser back/forward) updates the active project", () => {
    mockProjects = [{ _id: "A", title: "Alpha" }, { _id: "B", title: "Beta" }];
    mockSearch = { project: "A" };
    const { rerender } = render(<DevelopPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Alpha");

    mockSearch = { project: "B" }; // history navigation re-renders the route with new search
    rerender(<DevelopPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Beta");
  });

  test("an unavailable id falls back, corrects the URL, and keeps the notice visible", async () => {
    mockProjects = [{ _id: "A", title: "Alpha" }];
    mockSearch = { project: "UNAUTHORIZED" };
    const { rerender } = render(<DevelopPage />);

    // Never activates the unauthorized id; falls back to the authorized project.
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Alpha");
    expect(screen.getByText(/requested project was unavailable/i)).toBeDefined();

    // Corrects the URL in place via the router (replace), to the authorized project.
    await waitFor(() =>
      expect(navigateSpy).toHaveBeenCalledWith({ to: "/develop", search: { project: "A" }, replace: true }),
    );

    // After the router applies the correction, the explanation must remain readable.
    mockSearch = { project: "A" };
    rerender(<DevelopPage />);
    expect(screen.getByText(/requested project was unavailable/i)).toBeDefined();
  });
});
