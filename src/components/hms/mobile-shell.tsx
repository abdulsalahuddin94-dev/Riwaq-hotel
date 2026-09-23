import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Briefcase, ClipboardCheck, Grid2X2, Home, Languages, User, Wrench } from "lucide-react";
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

export function MobileShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [persona, setPersona] = useState<Persona>(() => {
    if (typeof window === "undefined") return "Attendant";
    try {
      return (window.localStorage.getItem("trianglz-mobile-persona") as Persona) || "Attendant";
    } catch {
      return "Attendant";
    }
  });

  const tabs = persona === "Supervisor" ? supervisorTabs : persona === "Engineer" ? engineerTabs : attendantTabs;
  const changePersona = (nextPersona: Persona) => {
    setPersona(nextPersona);
    try {
      window.localStorage.setItem("trianglz-mobile-persona", nextPersona);
    } catch {
      // Optional persistence.
    }
  };

  return (
    <div className="mobile-stage">
      <div className="iphone-device" data-platform="mobile" data-theme="light" dir="ltr">
        <div className="iphone-side iphone-side-left" />
        <div className="iphone-side iphone-side-right" />
        <div className="iphone-screen">
          <div className="iphone-notch" aria-hidden="true"><span /><i /></div>
          <div className="iphone-status" aria-hidden="true">
            <b>9:41</b>
            <span>▂▃▅  Wi‑Fi  ▰</span>
          </div>
          <div className="mobile-app" dir="ltr">
            <header className="mobile-header">
              <div>
                <p>TrianglZ Hotel</p>
                <h1>{title}</h1>
              </div>
              <Button variant="hmsGhost" size="hmsIcon" aria-label="Language">
                <Languages aria-hidden="true" />
              </Button>
            </header>
            <div className="mobile-scroll-area">{children}</div>
            <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link key={tab.to} to={tab.to} className={cn("mobile-tab", pathname === tab.to && "mobile-tab-active")}>
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
        <span className="demo-pill">DEMO</span>
        <label className="persona-select">
          <span>Demo as</span>
          <select value={persona} onChange={(event) => changePersona(event.target.value as Persona)}>
            <option>Attendant</option>
            <option>Supervisor</option>
            <option>Engineer</option>
          </select>
        </label>
        <Button variant="hmsSecondary" size="hmsMd" onClick={resetDemoData}>Reset demo data</Button>
        <Link to="/m/login" className="desktop-login-link"><Briefcase aria-hidden="true" /> View login screen</Link>
      </div>
    </div>
  );
}
