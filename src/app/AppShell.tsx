import { AnimatePresence, motion } from "motion/react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { fixtureSnapshot } from "@/data/fixture";
import { navigationItems, settingsItem } from "./navigation";
import { useShellState } from "./shellState";

function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const [workspace, setWorkspace] = useState("Independent slate");
  return (
    <div className="workspace-switcher">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="workspace-monogram">IS</span>
        <span className="workspace-copy">
          <small>Workspace</small>
          <strong>{workspace}</strong>
        </span>
        <span className="switcher-chevron">⌄</span>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div className="workspace-menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
            {["Independent slate", "Oru Pictures"].map((name) => (
              <button type="button" key={name} onClick={() => { setWorkspace(name); setOpen(false); }}>
                <span>{name.slice(0, 2).toUpperCase()}</span>{name}{workspace === name ? <Icon name="check" /> : null}
              </button>
            ))}
            <Link to="/settings" onClick={() => setOpen(false)}>Manage workspaces</Link>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function CommandPalette() {
  const open = useShellState((state) => state.commandOpen);
  const setOpen = useShellState((state) => state.setCommandOpen);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const allItems = [...navigationItems, settingsItem];
  const filtered = allItems.filter((item) =>
    `${item.label} ${item.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="palette-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => setOpen(false)}>
          <motion.div className="command-palette" role="dialog" aria-modal="true" aria-label="Quick navigation" initial={{ opacity: 0, y: -12, scale: .99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} onMouseDown={(event) => event.stopPropagation()}>
            <div className="palette-search">
              <Icon name="search" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Go to a workspace…" autoFocus />
              <kbd>Esc</kbd>
            </div>
            <div className="palette-results">
              <p>Navigate</p>
              {filtered.map((item) => (
                <button type="button" key={item.to} onClick={() => { void navigate({ to: item.to }); setOpen(false); }}>
                  <Icon name={item.icon} />
                  <span><strong>{item.label}</strong><small>{item.description}</small></span>
                  <span>↵</span>
                </button>
              ))}
              {filtered.length === 0 ? <div className="empty-search">No matching workspace.</div> : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function HeaderMenus() {
  const notificationOpen = useShellState((state) => state.notificationOpen);
  const accountOpen = useShellState((state) => state.accountOpen);
  const toggleNotifications = useShellState((state) => state.toggleNotifications);
  const toggleAccount = useShellState((state) => state.toggleAccount);
  const [unread, setUnread] = useState(2);
  const [locked, setLocked] = useState(false);
  return (
    <>
    <div className="header-actions">
      <div className="header-popover-anchor">
        <button className="icon-button" type="button" aria-label="Notifications" aria-expanded={notificationOpen} onClick={toggleNotifications}>
          <Icon name="bell" />{unread > 0 ? <span className="notification-count">{unread}</span> : null}
        </button>
        {notificationOpen ? (
          <div className="header-popover notifications-popover">
            <div><strong>Notifications</strong><button type="button" onClick={() => setUnread(0)}>Mark all read</button></div>
            <article><span className="event-mark"/><p><strong>Studio bible requires review</strong><small>Two quality gates need your decision.</small></p><time>8m</time></article>
            <article><span className="event-mark muted"/><p><strong>Delivery Room viewed</strong><small>Maya Chen opened Producer Review v3.</small></p><time>2h</time></article>
          </div>
        ) : null}
      </div>
      <div className="header-popover-anchor">
        <button className="account-button" type="button" aria-label="Account menu" aria-expanded={accountOpen} onClick={toggleAccount}>
          <span>AO</span><span><strong>Amara Okoye</strong><small>Owner</small></span>
        </button>
        {accountOpen ? (
          <div className="header-popover account-popover">
            <Link to="/settings" onClick={toggleAccount}><Icon name="settings"/>Account settings</Link>
            <button type="button" onClick={() => { toggleAccount(); setLocked(true); }}><Icon name="lock"/>Lock workspace</button>
          </div>
        ) : null}
      </div>
    </div>
    {locked ? <div className="locked-overlay" role="dialog" aria-modal="true"><div><span className="workspace-monogram">IS</span><p className="overline">Workspace locked</p><h2>Independent slate</h2><p>Your session and unsaved interface state are preserved.</p><button type="button" className="button button-primary" onClick={() => setLocked(false)}>Unlock workspace</button></div></div> : null}
    </>
  );
}

export function AppShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const sidebarCompact = useShellState((state) => state.sidebarCompact);
  const mobileNavOpen = useShellState((state) => state.mobileNavOpen);
  const toggleSidebar = useShellState((state) => state.toggleSidebar);
  const setMobileNav = useShellState((state) => state.setMobileNav);
  const setCommandOpen = useShellState((state) => state.setCommandOpen);
  const current = [...navigationItems, settingsItem].find((item) => item.to === pathname) ?? navigationItems[0];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setMobileNav(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setCommandOpen, setMobileNav]);

  return (
    <div className={`saas-shell${sidebarCompact ? " sidebar-compact" : ""}${mobileNavOpen ? " mobile-nav-open" : ""}`}>
      <button className="mobile-scrim" type="button" aria-label="Close navigation" onClick={() => setMobileNav(false)} />
      <aside className="global-sidebar">
        <div className="sidebar-brand-row">
          <Link to="/" className="saas-brand" onClick={() => setMobileNav(false)}><span>G</span><strong>GreenlightOS</strong></Link>
          <button className="sidebar-collapse" type="button" onClick={toggleSidebar} aria-label={sidebarCompact ? "Expand navigation" : "Compact navigation"}><Icon name="panel-left" /></button>
        </div>
        <WorkspaceSwitcher />
        <nav className="global-nav" aria-label="Primary navigation">
          <p>Workspace</p>
          {navigationItems.map((item) => (
            <Link key={item.to} to={item.to} activeProps={{ className: "active" }} activeOptions={{ exact: item.to === "/" }} onClick={() => setMobileNav(false)} title={sidebarCompact ? item.label : undefined}>
              <Icon name={item.icon}/><span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-project">
          <p>Active project</p>
          <Link to="/projects" onClick={() => setMobileNav(false)}>
            <span className="project-thumbnail">SK</span>
            <span><strong>{fixtureSnapshot.meta.title}</strong><small>Feature · Canon 04</small></span>
          </Link>
        </div>
        <div className="sidebar-footer">
          <Link to={settingsItem.to} activeProps={{ className: "active" }} onClick={() => setMobileNav(false)} title={sidebarCompact ? settingsItem.label : undefined}><Icon name="settings"/><span>Settings</span></Link>
          <div className="usage-meter"><span><i style={{ width: "38%" }}/></span><p><strong>38%</strong> storage used</p></div>
        </div>
      </aside>

      <header className="global-header">
        <button className="mobile-menu-button" type="button" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Icon name="menu"/></button>
        <div className="breadcrumb"><span>Independent slate</span><span>/</span><strong>{current?.label ?? "Home"}</strong></div>
        <button className="global-search" type="button" onClick={() => setCommandOpen(true)}><Icon name="search"/><span>Search or jump to…</span><kbd>⌘ K</kbd></button>
        <HeaderMenus />
      </header>

      <div className="global-content">
        <Outlet />
      </div>
      <CommandPalette />
    </div>
  );
}
