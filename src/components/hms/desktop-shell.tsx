import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  Hotel,
  LayoutGrid,
  LogIn,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import logoAsset from "@/assets/trianglz-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { resetDemoData, type Persona } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/app/board", label: "Live Board", icon: LayoutGrid },
  { to: "/app/team", label: "Team Progress", icon: Users },
  { to: "/app/assign", label: "Assignments", icon: ClipboardList },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
  { to: "/app/front-desk", label: "Front Desk", icon: BriefcaseBusiness },
  { to: "/app/work-orders", label: "Work Orders", icon: Wrench },
  { to: "/app/escalations", label: "Escalations", icon: AlertTriangle },
  { to: "/app/settings", label: "Settings", icon: Settings },
] as const;

const personas: Persona[] = ["Manager", "Front Desk", "Admin"];

export function DesktopShell({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [persona, setPersona] = useState<Persona>("Manager");

  useEffect(() => {
    try {
      const savedPersona = window.localStorage.getItem("trianglz-demo-persona") as Persona | null;
      if (savedPersona) setPersona(savedPersona);
    } catch {
      // Persona persistence is optional in the demo shell.
    }
  }, []);

  const changePersona = (nextPersona: Persona) => {
    setPersona(nextPersona);
    try {
      window.localStorage.setItem("trianglz-demo-persona", nextPersona);
    } catch {
      // Persona persistence is optional in the demo shell.
    }
  };

  return (
    <div className="desktop-shell" data-platform="desktop" data-theme="light">
      <aside className={cn("desktop-sidebar", collapsed && "desktop-sidebar-collapsed")}>
        <div className="sidebar-brand">
          <img src={logoAsset.url} alt="TrianglZ Hotel" />
          {!collapsed ? (
            <div>
              <strong>TrianglZ HMS</strong>
              <span>Housekeeping</span>
            </div>
          ) : null}
        </div>
        <nav className="sidebar-nav" aria-label="Desktop navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.to;
            return (
              <Link key={item.to} to={item.to} reloadDocument className={cn("sidebar-link", isActive && "sidebar-link-active")}>
                <Icon aria-hidden="true" />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>
        <Button variant="hmsGhost" size="hmsMd" className="sidebar-collapse" onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          {!collapsed ? <span>Collapse</span> : null}
        </Button>
        {!collapsed ? (
          <div className="sidebar-property">
            <span>Property</span>
            <strong>TrianglZ Hotel</strong>
            <small>Cairo · 100 rooms</small>
          </div>
        ) : null}
      </aside>
      <div className="desktop-main">
        <header className="desktop-topbar">
          <div className="desktop-title-group">
            <Button className="desktop-menu" variant="hmsGhost" size="hmsIcon" type="button" aria-label="Menu">
              <Menu aria-hidden="true" />
            </Button>
            <div className="min-w-0">
              <p>{eyebrow}</p>
              <h1>{title}</h1>
            </div>
          </div>
          <div className="desktop-actions">
            <label className="room-search">
              <Search aria-hidden="true" />
              <input aria-label="Search room number" placeholder="Search room #" />
            </label>
            <span className="sync-pill"><span /> Synced · 11:00 Africa/Cairo</span>
            <span className="demo-pill">DEMO</span>
            <label className="persona-select">
              <span>Demo as</span>
              <select value={persona} onChange={(event) => changePersona(event.target.value as Persona)}>
                {personas.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <Button variant="hmsSecondary" size="hmsMd" onClick={resetDemoData}>Reset demo</Button>
            <Link to="/login" className="desktop-login-link"><LogIn aria-hidden="true" /> Login design</Link>
          </div>
        </header>
        <main className="desktop-content">{children}</main>
      </div>
    </div>
  );
}

export function DesktopPlaceholderPage({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <DesktopShell title={title} eyebrow={eyebrow}>
      {children}
    </DesktopShell>
  );
}
