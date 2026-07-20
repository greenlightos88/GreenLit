import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "home"
  | "projects"
  | "compile"
  | "script"
  | "delivery"
  | "settings"
  | "search"
  | "bell"
  | "menu"
  | "panel-left"
  | "panel-right"
  | "sliders"
  | "arrow"
  | "plus"
  | "more"
  | "check"
  | "lock"
  | "download"
  | "users"
  | "close"
  | "assistant"
  | "mic"
  | "send";

const paths: Record<IconName, ReactNode> = {
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>,
  projects: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/></>,
  compile: <><path d="M5 3h10l4 4v14H5z"/><path d="M14 3v5h5M8 13h8M8 17h6"/></>,
  script: <><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/></>,
  delivery: <><path d="M4 7h16v13H4zM8 7V4h8v3"/><path d="M4 12h16M9 15h6"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  "panel-left": <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></>,
  "panel-right": <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/></>,
  sliders: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></>,
  arrow: <path d="m9 18 6-6-6-6"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  download: <><path d="M12 3v12m0 0 5-5m-5 5-5-5"/><path d="M5 21h14"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 4a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  assistant: <><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.4 5.4l2 2M16.6 16.6l2 2M18.6 5.4l-2 2M7.4 16.6l-2 2"/></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></>,
  send: <path d="M4 12 20 4l-4 16-4.5-6.5L4 12Zm7.5 1.5L20 4"/>,
};

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  );
}
