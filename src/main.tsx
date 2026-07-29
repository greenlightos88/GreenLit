import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import App from "./App";
import { AppShell } from "./app/AppShell";
import { OverviewPage } from "./pages/OverviewPage";
import { DevelopPage } from "./pages/DevelopPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ScreenplayPage } from "./pages/ScreenplayPage";
import { DeliveryPage } from "./pages/DeliveryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { readAuthConfig } from "./auth/config";
import { AuthBoundary } from "./auth/AuthBoundary";
import { ConfigError } from "./auth/ConfigError";
import { useAuthForConvex } from "./auth/useAuthForConvex";
import "./styles.css";
import "./workspace.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

const rootRoute = createRootRoute({ component: AppShell });
const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: OverviewPage,
});
const developRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/develop",
  component: DevelopPage,
});
const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects",
  component: ProjectsPage,
});
const screenplayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/screenplay",
  component: ScreenplayPage,
});
const chamberRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/compile",
  component: App,
});
const deliveryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/delivery",
  component: DeliveryPage,
});
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});
const routeTree = rootRoute.addChildren([
  overviewRoute,
  developRoute,
  projectsRoute,
  screenplayRoute,
  chamberRoute,
  deliveryRoute,
  settingsRoute,
]);
const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("GreenlightOS root element was not found.");
const root = createRoot(rootElement);

/** The authenticated application: existing providers, mounted only after the
 * user is signed in and provisioned. */
function ApplicationProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

try {
  const config = readAuthConfig();
  const convex = new ConvexReactClient(config.convexUrl);
  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={config.clerkPublishableKey} afterSignOutUrl="/">
        <ConvexProviderWithClerk client={convex} useAuth={useAuthForConvex}>
          <AuthBoundary>
            <ApplicationProviders />
          </AuthBoundary>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </StrictMode>,
  );
} catch (error) {
  root.render(
    <StrictMode>
      <ConfigError message={error instanceof Error ? error.message : String(error)} />
    </StrictMode>,
  );
}
