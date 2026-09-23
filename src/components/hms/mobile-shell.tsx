import { createContext, useContext, useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Briefcase, ClipboardCheck, Grid2X2, Home, User, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetDemoData, type Persona } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const attendantTabs = [
  { to: "/m/rooms", label: "Rooms", icon: Home },
  { to: "/m/alerts", label: "Alerts", icon: Bell },
  { to: "/m/me", label: "Me", icon: User },
] as const;

const supervisorTabs = [
  { to: "/m/inspections", label: "Inspect", icon: ClipboardCheck },
  { to: "/m/floor", label: "Floor", icon: Grid2X2 },
  { to: "/m/alerts", label: "Alerts", icon: Bell },
  { to: "/m/me", label: "Me", icon: User },
] as const;

const engineerTabs = [
  { to: "/m/work-orders", label: "Jobs", icon: Wrench },
  { to: "/m/alerts", label: "Alerts", icon: Bell },
  { to: "/m/me", label: "Me", icon: User },
] as const;

const MobilePersonaContext = createContext<Persona>("Attendant");
export const useMobilePersona = () => useContext(MobilePersonaContext);

function personaForRoute(pathname: string): Persona | null {
  if (pathname === "/m/rooms") return "Attendant";
  if (pathname === "/m/inspections" || pathname === "/m/floor") return "Supervisor";
  if (pathname === "/m/work-orders") return "Engineer";
  return null;
}

const personaHome = { Attendant: "/m/rooms", Supervisor: "/m/inspections", Engineer: "/m/work-orders" } as const;

export function MobileShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const routePersona = personaForRoute(pathname);
  const [persona, setPersona] = useState<Persona>(routePersona ?? "Attendant");

  useEffect(() => {
    try {
      const savedPersona = window.localStorage.getItem("trianglz-mobile-persona") as Persona | null;
      if (!routePersona && savedPersona && ["Attendant", "Supervisor", "Engineer"].includes(savedPersona)) setPersona(savedPersona);
    } catch {
      // Persona persistence is optional in the demo shell.
    }
  }, [routePersona]);

  const tabs = persona === "Supervisor" ? supervisorTabs : persona === "Engineer" ? engineerTabs : attendantTabs;
  const changePersona = (nextPersona: Persona) => {
    setPersona(nextPersona);
    try {
      window.localStorage.setItem("trianglz-mobile-persona", nextPersona);
    } catch {
      // Optional persistence.
    }
    if (nextPersona === "Attendant" || nextPersona === "Supervisor" || nextPersona === "Engineer") window.location.assign(personaHome[nextPersona]);
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
            <span>▂▃▅  Wi‑Fi  ▰</span>
          </div>
          <div className="mobile-app">
            <header className="mobile-header">
              <div>
                <p>TrianglZ Hotel</p>
                <h1>{title}</h1>
              </div>
              <span className="mobile-role-pill">{persona === "Attendant" ? "Housekeeper" : persona}</span>
            </header>
            <MobilePersonaContext.Provider value={persona}><div className="mobile-scroll-area">{children}</div></MobilePersonaContext.Provider>
            <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link key={tab.to} to={tab.to} reloadDocument className={cn("mobile-tab", pathname === tab.to && "mobile-tab-active")}>
                    <Icon aria-hidden="true" />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mobile-home-indicator" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="mobile-persona-panel">
        <div className="mobile-persona-heading">
          <span className="demo-pill">DEMO</span>
          <div><strong>Preview a role</strong><small>Switch mobile workspace</small></div>
        </div>
        <label className="mobile-persona-select">
          <span>Role</span>
          <select value={persona} onChange={(event) => changePersona(event.target.value as Persona)}>
            <option value="Attendant">Housekeeper (Attendant)</option>
            <option>Supervisor</option>
            <option>Engineer</option>
          </select>
        </label>
        <Button className="mobile-persona-reset" variant="hmsSecondary" size="hmsMd" onClick={resetDemoData}>Reset demo data</Button>
        <Link to="/m/login" reloadDocument className="mobile-login-link"><Briefcase aria-hidden="true" /> View login screen</Link>
      </div>
    </div>
  );
}
