import { createContext, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BatteryFull, Bell, Briefcase, ChevronLeft, ClipboardCheck, Grid2X2, Home, RotateCcw, Signal, User, Wifi, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Persona, property } from "@/lib/demo-data";
import { hms, useHms } from "@/lib/hms-store";
import { cn } from "@/lib/utils";
import { useMobileAlerts } from "./mobile-alerts";

const attendantTabs = [
  { to: "/m/rooms", label: "Rooms", icon: Home },
  { to: "/m/alerts", label: "Alerts", icon: Bell },
  { to: "/m/me", label: "Me", icon: User },
] as const;

const supervisorTabs = [
  { to: "/m/inspections", label: "Inspect", icon: ClipboardCheck },
  { to: "/m/floor", label: "Wings", icon: Grid2X2 },
  { to: "/m/alerts", label: "Alerts", icon: Bell },
  { to: "/m/me", label: "Me", icon: User },
] as const;

const engineerTabs = [
  { to: "/m/work-orders", label: "Jobs", icon: Wrench },
  { to: "/m/alerts", label: "Alerts", icon: Bell },
  { to: "/m/me", label: "Me", icon: User },
] as const;

export const mobilePersonaHome = { Attendant: "/m/rooms", Supervisor: "/m/inspections", Engineer: "/m/work-orders" } as const;
type MobilePersona = keyof typeof mobilePersonaHome;

export function useMobilePersona(): MobilePersona {
  const s = useHms();
  return (["Attendant", "Supervisor", "Engineer"].includes(s.mobilePersona) ? s.mobilePersona : "Attendant") as MobilePersona;
}

function personaForRoute(pathname: string): MobilePersona | null {
  if (pathname === "/m/rooms") return "Attendant";
  if (pathname.startsWith("/m/inspections") || pathname === "/m/floor") return "Supervisor";
  if (pathname.startsWith("/m/work-orders")) return "Engineer";
  return null;
}

/* ───────────── Sheet host (keeps sheets inside the phone) ───────────── */

const SheetHostContext = createContext<HTMLElement | null>(null);

export function MobileSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const host = useContext(SheetHostContext);
  if (!open || !host) return null;
  return createPortal(
    <div className="m-sheet-layer" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="m-sheet-scrim" aria-label="Close" onClick={onClose} />
      <div className="m-sheet">
        <div className="m-sheet-grabber" aria-hidden="true" />
        <header className="m-sheet-header">
          <h2>{title}</h2>
          <button type="button" className="m-icon-btn" aria-label="Close" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="m-sheet-body">{children}</div>
      </div>
    </div>,
    host,
  );
}

/* ───────────── Shell ───────────── */

export function MobileShell({
  title,
  children,
  back,
  footer,
  subtitle,
}: {
  title: string;
  children: React.ReactNode;
  back?: { to: string; params?: Record<string, string>; label?: string };
  footer?: React.ReactNode;
  subtitle?: string;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const persona = useMobilePersona();
  const alerts = useMobileAlerts();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const routePersona = personaForRoute(pathname);

  // Opening a role-specific page directly (deep link, FAB, bookmark) switches the demo role to match.
  useEffect(() => {
    if (routePersona && routePersona !== persona) hms.setPersona("mobile", routePersona);
  }, [routePersona, persona]);

  const tabs = persona === "Supervisor" ? supervisorTabs : persona === "Engineer" ? engineerTabs : attendantTabs;
  const changePersona = (next: Persona) => {
    hms.setPersona("mobile", next);
    const home = mobilePersonaHome[next as MobilePersona];
    if (home) void navigate({ to: home });
  };

  return (
    <div className="mobile-stage">
      <div className="iphone-device" data-platform="mobile" data-theme="light">
        <div className="iphone-side iphone-side-left" />
        <div className="iphone-side iphone-side-right" />
        <div className="iphone-screen">
          <div className="iphone-notch" aria-hidden="true"><span /><i /></div>
          <div className="iphone-status" aria-hidden="true">
            <b>9:41</b>
            <span className="status-glyphs"><Signal /><Wifi /><BatteryFull /></span>
          </div>
          <div className="mobile-app" ref={setHost}>
            <SheetHostContext.Provider value={host}>
              <header className={cn("mobile-header", back && "mobile-header-back")}>
                {back ? (
                  <Link to={back.to as never} params={back.params as never} className="m-back" aria-label={back.label ?? "Back"}>
                    <ChevronLeft aria-hidden="true" /> {back.label ?? "Back"}
                  </Link>
                ) : null}
                <div>
                  <h1>{title}</h1>
                  <p>{subtitle ?? property.name}</p>
                </div>
                {!back ? <span className="mobile-role-pill">{persona === "Attendant" ? "Housekeeper" : persona}</span> : null}
              </header>
              <div className="mobile-scroll-area">{children}</div>
              {footer ? <div className="m-footer">{footer}</div> : null}
              {!footer ? (
                <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = pathname === tab.to || (tab.to !== "/m/me" && pathname.startsWith(`${tab.to}/`));
                    return (
                      <Link key={tab.to} to={tab.to} className={cn("mobile-tab", active && "mobile-tab-active")}>
                        <span className="tab-icon">
                          <Icon aria-hidden="true" />
                          {tab.to === "/m/alerts" && alerts.length ? <b className="tab-badge">{alerts.length}</b> : null}
                        </span>
                        <span>{tab.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              ) : null}
              <div className="mobile-home-indicator" aria-hidden="true" />
            </SheetHostContext.Provider>
          </div>
        </div>
      </div>
      <div className="mobile-persona-panel">
        <div className="mobile-persona-heading">
          <div><strong>Preview a role</strong><small>Switch mobile workspace</small></div>
        </div>
        <label className="mobile-persona-select">
          <span>Role</span>
          <select value={persona} onChange={(event) => changePersona(event.target.value as Persona)}>
            <option value="Attendant">Housekeeper · Maria</option>
            <option value="Supervisor">Supervisor · Noura</option>
            <option value="Engineer">Engineer · Mansoor</option>
          </select>
        </label>
        <Button className="mobile-persona-reset" variant="hmsSecondary" size="hmsMd" onClick={() => hms.reset()}>
          <RotateCcw aria-hidden="true" /> Restore sample data
        </Button>
        <Link to="/m/login" className="mobile-login-link"><Briefcase aria-hidden="true" /> View login screen</Link>
      </div>
    </div>
  );
}
