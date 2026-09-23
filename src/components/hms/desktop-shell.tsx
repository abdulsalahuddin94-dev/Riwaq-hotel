import { createContext, useContext, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  LayoutGrid,
  LogIn,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Search,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import logoAsset from "@/assets/trianglz-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { fmtTime, type Persona } from "@/lib/demo-data";
import { demoNow, escalations, hms, useHms } from "@/lib/hms-store";
import { cn } from "@/lib/utils";
import { RoomDrawer } from "./room-drawer";

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

type NavPath = (typeof navItems)[number]["to"];

const personaNav: Record<"Manager" | "Front Desk" | "Admin", NavPath[]> = {
  Manager: navItems.map((n) => n.to),
  "Front Desk": ["/app/front-desk", "/app/board", "/app/work-orders"],
  Admin: ["/app/settings", "/app/board", "/app/team", "/app/reports"],
};

export const personaHome: Record<"Manager" | "Front Desk" | "Admin", NavPath> = {
  Manager: "/app/board",
  "Front Desk": "/app/front-desk",
  Admin: "/app/settings",
};

const personas: Persona[] = ["Manager", "Front Desk", "Admin"];

type DesktopCtx = { openRoom: (number: string) => void };
const DesktopContext = createContext<DesktopCtx>({ openRoom: () => undefined });
export const useDesktop = () => useContext(DesktopContext);

export function DesktopShell({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const s = useHms();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [openRoom, setOpenRoom] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const persona = (personas.includes(s.desktopPersona) ? s.desktopPersona : "Manager") as keyof typeof personaNav;
  const allowed = personaNav[persona];
  const escalationCount = escalations(s).length;

  const changePersona = (next: Persona) => {
    hms.setPersona("desktop", next);
    const home = personaHome[next as keyof typeof personaHome];
    toast.success(`Now viewing as ${next}`, { duration: 2500 });
    if (home && !personaNav[next as keyof typeof personaNav].includes(pathname as NavPath)) void navigate({ to: home });
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = search.trim();
    if (!value) return;
    if (s.rooms.some((r) => r.number === value)) {
      setOpenRoom(value);
      setSearch("");
    } else {
      toast.error(`Room ${value} not found`, { duration: 3000 });
    }
  };

  return (
    <DesktopContext.Provider value={{ openRoom: setOpenRoom }}>
      <div className="desktop-shell" data-platform="desktop" data-theme="light">
        {mobileNav ? <button className="sidebar-scrim" type="button" aria-label="Close menu" onClick={() => setMobileNav(false)} /> : null}
        <aside className={cn("desktop-sidebar", collapsed && "desktop-sidebar-collapsed", mobileNav && "desktop-sidebar-open")}>
          <div className="sidebar-brand">
            <img src={logoAsset.url} alt="TrianglZ Hotel" />
            {!collapsed ? (
              <div>
                <strong>TrianglZ HMS</strong>
                <span>Housekeeping</span>
              </div>
            ) : null}
            {mobileNav ? (
              <Button className="sidebar-close" variant="hmsGhost" size="hmsIcon" aria-label="Close menu" onClick={() => setMobileNav(false)}>
                <X aria-hidden="true" />
              </Button>
            ) : null}
          </div>
          <nav className="sidebar-nav" aria-label="Desktop navigation">
            {navItems
              .filter((item) => allowed.includes(item.to))
              .map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileNav(false)}
                    className={cn("sidebar-link", isActive && "sidebar-link-active")}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon aria-hidden="true" />
                    {!collapsed ? <span>{item.label}</span> : null}
                    {item.to === "/app/escalations" && escalationCount ? <b className="nav-count">{escalationCount}</b> : null}
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
              <small>Cairo · {s.rooms.length} rooms</small>
            </div>
          ) : null}
        </aside>
        <div className="desktop-main">
          <header className="desktop-topbar">
            <div className="desktop-title-group">
              <Button className="desktop-menu" variant="hmsGhost" size="hmsIcon" type="button" aria-label="Menu" onClick={() => setMobileNav(true)}>
                <Menu aria-hidden="true" />
              </Button>
              <div className="min-w-0">
                <p>{eyebrow}</p>
                <h1>{title}</h1>
              </div>
            </div>
            <div className="desktop-actions">
              <form className="room-search" onSubmit={submitSearch} role="search">
                <Search aria-hidden="true" />
                <input
                  aria-label="Search room number"
                  placeholder="Room # + Enter"
                  inputMode="numeric"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </form>
              <span className="sync-pill">
                <span /> Synced · {fmtTime(demoNow(s))} Cairo
              </span>
              <span className="demo-pill">DEMO</span>
              <label className="persona-select">
                <span>Demo as</span>
                <select value={persona} onChange={(event) => changePersona(event.target.value as Persona)}>
                  {personas.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <Button variant="hmsSecondary" size="hmsMd" onClick={() => hms.reset()} title="Restore the seeded demo data">
                <RotateCcw aria-hidden="true" /> Reset demo
              </Button>
              <Link to="/login" className="desktop-login-link">
                <LogIn aria-hidden="true" /> Login design
              </Link>
            </div>
          </header>
          <main className="desktop-content">{children}</main>
        </div>
        <RoomDrawer number={openRoom} onClose={() => setOpenRoom(null)} />
      </div>
    </DesktopContext.Provider>
  );
}
