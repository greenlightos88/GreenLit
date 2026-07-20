import type { IconName } from "@/components/Icon";

export interface NavigationItem {
  label: string;
  shortLabel: string;
  to: "/" | "/projects" | "/screenplay" | "/compile" | "/delivery" | "/settings";
  icon: IconName;
  description: string;
}

export const navigationItems: NavigationItem[] = [
  { label: "Home", shortLabel: "Home", to: "/", icon: "home", description: "Project intelligence overview" },
  { label: "Projects", shortLabel: "Projects", to: "/projects", icon: "projects", description: "Manage creative workspaces" },
  { label: "Screenplay", shortLabel: "Script", to: "/screenplay", icon: "script", description: "Write and validate scenes" },
  { label: "Compilation", shortLabel: "Compile", to: "/compile", icon: "compile", description: "Build professional packages" },
  { label: "Delivery Rooms", shortLabel: "Delivery", to: "/delivery", icon: "delivery", description: "Share frozen versions" },
];

export const settingsItem: NavigationItem = {
  label: "Settings",
  shortLabel: "Settings",
  to: "/settings",
  icon: "settings",
  description: "Workspace and account preferences",
};
