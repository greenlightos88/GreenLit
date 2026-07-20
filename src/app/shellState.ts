import { create } from "zustand";

interface ShellState {
  sidebarCompact: boolean;
  mobileNavOpen: boolean;
  commandOpen: boolean;
  notificationOpen: boolean;
  accountOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCompact: (compact: boolean) => void;
  setMobileNav: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  toggleNotifications: () => void;
  toggleAccount: () => void;
  closeTransient: () => void;
}

export const useShellState = create<ShellState>((set) => ({
  sidebarCompact: false,
  mobileNavOpen: false,
  commandOpen: false,
  notificationOpen: false,
  accountOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarCompact: !state.sidebarCompact })),
  setSidebarCompact: (sidebarCompact) => set({ sidebarCompact }),
  setMobileNav: (mobileNavOpen) => set({ mobileNavOpen }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  toggleNotifications: () =>
    set((state) => ({
      notificationOpen: !state.notificationOpen,
      accountOpen: false,
    })),
  toggleAccount: () =>
    set((state) => ({ accountOpen: !state.accountOpen, notificationOpen: false })),
  closeTransient: () => set({ notificationOpen: false, accountOpen: false }),
}));
