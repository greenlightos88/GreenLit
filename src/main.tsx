import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppShell } from "./app/AppShell";
import { OverviewPage } from "./pages/OverviewPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ScreenplayPage } from "./pages/ScreenplayPage";
import { DeliveryPage } from "./pages/DeliveryPage";
import { SettingsPage } from "./pages/SettingsPage";
import "./styles.css";

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

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
