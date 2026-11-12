import { createContext, useContext, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  LayoutGrid,
  Check,
  ChevronDown,
  LogOut,
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
import { HotelMark } from "./hotel-mark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fmtTime, type Persona, property } from "@/lib/demo-data";
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

const personaAccount: Record<"Manager" | "Front Desk" | "Admin", { id: string; title: string }> = {
  Manager: { id: "rf", title: "Operations Manager" },
  "Front Desk": { id: "te", title: "Front Office" },
  Admin: { id: "km", title: "System Admin" },
};

function UserMenu({ persona, onSwitch }: { persona: keyof typeof personaAccount; onSwitch: (next: Persona) => void }) {
  const s = useHms();
  const navigate = useNavigate();
  const person = (key: keyof typeof personaAccount) => s.staff.find((m) => m.id === personaAccount[key].id);
  const me = person(persona);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="user-menu-trigger" aria-label="Account menu">
        <span className="user-avatar" aria-hidden="true">{me?.initials}</span>
        <span className="user-menu-text">
          <strong>{me?.name}</strong>
          <small>{personaAccount[persona].title}</small>
        </span>
        <ChevronDown aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="user-menu">
        <DropdownMenuLabel>Switch account</DropdownMenuLabel>
        {personas.map((key) => {
          const k = key as keyof typeof personaAccount;
          const p = person(k);
          return (
            <DropdownMenuItem key={key} onSelect={() => onSwitch(key)} className={cn(key === persona && "user-menu-current")}>
              <span className="user-avatar user-avatar-sm" aria-hidden="true">{p?.initials}</span>
              <span className="user-menu-text">
                <strong>{p?.name}</strong>
                <small>{personaAccount[k].title}</small>
              </span>
              {key === persona ? <Check aria-hidden="true" className="ms-auto" /> : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { hms.reset(); toast.success("Sample data restored", { duration: 2000 }); }}>
          <RotateCcw aria-hidden="true" /> Restore sample data
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void navigate({ to: "/login" })}>
          <LogOut aria-hidden="true" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
    toast.success(`Signed in as ${personaAccount[next as keyof typeof personaAccount]?.title ?? next}`, { duration: 2500 });
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
        <a className="skip-link" href="#main-content">Skip to content</a>
        {mobileNav ? <button className="sidebar-scrim" type="button" aria-label="Close menu" onClick={() => setMobileNav(false)} /> : null}
        <aside className={cn("desktop-sidebar", collapsed && "desktop-sidebar-collapsed", mobileNav && "desktop-sidebar-open")}>
          <div className="sidebar-brand">
            <HotelMark className="sidebar-mark" />
            {!collapsed ? (
              <div>
                <strong><span lang="ar">{property.nameAr}</span> {property.name}</strong>
                <span>Powered by RIWAQ Systems</span>
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
              <strong>{property.name}</strong>
              <small>{property.location} · {s.rooms.length} keys</small>
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
                <h1>{title}</h1>
                <p>{eyebrow}</p>
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
              <span className="sync-pill" title="Board time">
                <span /> Live · {fmtTime(demoNow(s))}
              </span>
              <UserMenu persona={persona} onSwitch={changePersona} />
            </div>
          </header>
          <main className="desktop-content" id="main-content" tabIndex={-1}>{children}</main>
        </div>
        <RoomDrawer number={openRoom} onClose={() => setOpenRoom(null)} />
      </div>
    </DesktopContext.Provider>
  );
}
