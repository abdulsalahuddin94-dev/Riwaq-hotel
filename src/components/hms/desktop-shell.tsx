import { createContext, useContext, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  LayoutGrid,
  Check,
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  UserRoundCog,
  Users,
  X,
} from "./msym";
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
import { type Persona, property } from "@/lib/demo-data";
import { hms, needsFollowUp, useHms } from "@/lib/hms-store";
import { cn } from "@/lib/utils";
import { RoomDrawer } from "./room-drawer";
import { NotificationBell } from "./notifications";
import { StaffAvatar } from "./illustrations";
import { SidebarMandala } from "./mandala";

const navItems = [
  { to: "/app/board", label: "Live Board", icon: LayoutGrid },
  { to: "/app/front-desk", label: "Front Desk", icon: BriefcaseBusiness },
  { to: "/app/reservations", label: "Reservations", icon: CalendarDays },
  { to: "/app/assign", label: "Assignments", icon: ClipboardList },
  { to: "/app/team", label: "Team Progress", icon: Users },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
  { to: "/app/users", label: "Users", icon: UserRoundCog },
] as const;

type NavPath = (typeof navItems)[number]["to"];

const personaNav: Record<"Manager" | "Front Desk" | "Admin", NavPath[]> = {
  Manager: navItems.map((n) => n.to),
  "Front Desk": ["/app/front-desk", "/app/reservations"],
  Admin: ["/app/users", "/app/board", "/app/reports"],
};

export const personaHome: Record<"Manager" | "Front Desk" | "Admin", NavPath> = {
  Manager: "/app/board",
  "Front Desk": "/app/front-desk",
  Admin: "/app/users",
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

function UserMenu({ persona, onSwitch, collapsed }: { persona: keyof typeof personaAccount; onSwitch: (next: Persona) => void; collapsed: boolean }) {
  const s = useHms();
  const navigate = useNavigate();
  const person = (key: keyof typeof personaAccount) => s.staff.find((m) => m.id === personaAccount[key].id);
  const me = person(persona);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
       <Button variant="hmsGhost" className="user-menu-trigger" aria-label="Account menu" title={collapsed ? `${me?.name ?? persona} · Switch account` : undefined}>
        <span className="user-avatar" aria-hidden="true">{me ? <StaffAvatar staff={me} className="user-avatar-img" /> : null}</span>
        {!collapsed ? <span className="user-menu-text">
          <strong>{me?.name}</strong>
          <small>{personaAccount[persona].title}</small>
        </span> : null}
        {!collapsed ? <ChevronDown aria-hidden="true" /> : null}
       </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8} className="user-menu" data-platform="desktop">
        <DropdownMenuLabel>Switch account</DropdownMenuLabel>
        {personas.map((key) => {
          const k = key as keyof typeof personaAccount;
          const p = person(k);
          return (
            <DropdownMenuItem key={key} onSelect={() => onSwitch(key)} className={cn(key === persona && "user-menu-current")}>
              <span className="user-avatar user-avatar-sm" aria-hidden="true">{p ? <StaffAvatar staff={p} className="user-avatar-img" /> : null}</span>
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
  const persona = (personas.includes(s.desktopPersona) ? s.desktopPersona : "Manager") as keyof typeof personaNav;
  const allowed = personaNav[persona];
  const followUps = s.reservations.filter((r) => needsFollowUp(s, r)).length;

  const changePersona = (next: Persona) => {
    hms.setPersona("desktop", next);
    const home = personaHome[next as keyof typeof personaHome];
    toast.success(`Signed in as ${personaAccount[next as keyof typeof personaAccount]?.title ?? next}`, { duration: 2500 });
    if (home && !personaNav[next as keyof typeof personaNav].includes(pathname as NavPath)) void navigate({ to: home });
  };

  return (
    <DesktopContext.Provider value={{ openRoom: setOpenRoom }}>
      <div className="desktop-shell" data-platform="desktop" data-theme="light">
        <a className="skip-link" href="#main-content">Skip to content</a>
        {mobileNav ? <button className="sidebar-scrim" type="button" aria-label="Close menu" onClick={() => setMobileNav(false)} /> : null}
        <aside className={cn("desktop-sidebar", collapsed && "desktop-sidebar-collapsed", mobileNav && "desktop-sidebar-open")}>
          <SidebarMandala />
          <div className="sidebar-brand">
            <HotelMark className="sidebar-mark" />
            {!collapsed ? (
              <div>
                <strong>{property.name}</strong>
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
                    <span className="sidebar-link-icon"><Icon aria-hidden="true" filled={isActive} /></span>
                    {!collapsed ? <span>{item.label}</span> : null}
                    {item.to === "/app/reservations" && followUps ? <b className="nav-count" aria-label={`${followUps} to follow up`}>{followUps}</b> : null}
                  </Link>
                );
              })}
          </nav>
          <Button variant="hmsGhost" size="hmsMd" className="sidebar-collapse" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
            {!collapsed ? <span>Collapse</span> : null}
          </Button>
          <div className="sidebar-account">
            <UserMenu persona={persona} onSwitch={changePersona} collapsed={collapsed} />
          </div>
        </aside>
        <div className="desktop-main">
          <Button className="desktop-menu desktop-menu-floating" variant="hmsSecondary" size="hmsIcon" type="button" aria-label="Menu" onClick={() => setMobileNav(true)}>
            <Menu aria-hidden="true" />
          </Button>
          <main className="desktop-content" id="main-content" tabIndex={-1}>
            {pathname !== "/app/board" ? (
              <div className="desktop-page-heading">
                <div><h1>{title}</h1><p>{eyebrow}</p></div>
                <NotificationBell />
              </div>
            ) : null}
            {children}
          </main>
        </div>
        <RoomDrawer number={openRoom} onClose={() => setOpenRoom(null)} />
      </div>
    </DesktopContext.Provider>
  );
}
