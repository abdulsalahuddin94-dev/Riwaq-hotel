import { createContext, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BatteryFull, Bell, Briefcase, ChevronLeft, ClipboardCheck, Grid2X2, Home, RotateCcw, Signal, User, Wifi, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Persona, property } from "@/lib/demo-data";
import { hms, useHms } from "@/lib/hms-store";
import { LangContext, setLang, useMobileT } from "@/lib/mobile-i18n";
import { cn } from "@/lib/utils";
import { useMobileAlerts } from "./mobile-alerts";

const attendantTabs = [
  { to: "/m/rooms", label: "Rooms", labelAr: "غرفي", icon: Home },
  { to: "/m/alerts", label: "Alerts", labelAr: "التنبيهات", icon: Bell },
  { to: "/m/me", label: "Me", labelAr: "حسابي", icon: User },
] as const;

const supervisorTabs = [
  { to: "/m/inspections", label: "Inspect", labelAr: "الفحص", icon: ClipboardCheck },
  { to: "/m/floor", label: "Wings", labelAr: "الأجنحة", icon: Grid2X2 },
  { to: "/m/alerts", label: "Alerts", labelAr: "التنبيهات", icon: Bell },
  { to: "/m/me", label: "Me", labelAr: "حسابي", icon: User },
] as const;

const engineerTabs = [
  { to: "/m/work-orders", label: "Jobs", labelAr: "المهام", icon: Wrench },
  { to: "/m/alerts", label: "Alerts", labelAr: "التنبيهات", icon: Bell },
  { to: "/m/me", label: "Me", labelAr: "حسابي", icon: User },
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
/** The app root inside the phone (sheets, immersive top bar) and its scroll container. */
export const AppHostContext = createContext<{ app: HTMLElement | null; scroller: HTMLElement | null }>({ app: null, scroller: null });

export function MobileSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const host = useContext(SheetHostContext);
  const { t } = useMobileT();
  if (!open || !host) return null;
  return createPortal(
    <div className="m-sheet-layer" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="m-sheet-scrim" aria-label={t("Close", "إغلاق")} onClick={onClose} />
      <div className="m-sheet">
        <div className="m-sheet-grabber" aria-hidden="true" />
        <header className="m-sheet-header">
          <h2>{title}</h2>
          <button type="button" className="m-icon-btn" aria-label={t("Close", "إغلاق")} onClick={onClose}>
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
  bare = false,
  immersive = false,
}: {
  title: string;
  bare?: boolean;
  /** Full-bleed page: no header; the page draws its own hero and collapsing top bar. */
  immersive?: boolean;
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
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  const [headerCompact, setHeaderCompact] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const tr = useMobileT();
  const routePersona = personaForRoute(pathname);

  useEffect(() => {
    setHeaderCompact(false);
    setScrolling(false);
    if (!scroller || bare) return;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      const offset = scroller.scrollTop;
      setHeaderCompact((compact) => offset > 40 ? true : offset < 8 ? false : compact);
      setScrolling(true);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setScrolling(false), 240);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      clearTimeout(idleTimer);
    };
  }, [scroller, bare, pathname]);

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
      <div className="device-frame" data-platform="mobile" data-theme="light">
        <div className="device-key device-key-power" />
        <div className="device-key device-key-volume" />
        <div className="device-screen">
          <div className="device-camera" aria-hidden="true" />
          <div className="device-status" aria-hidden="true">
            <b>9:41</b>
            <span className="status-glyphs"><Wifi /><Signal /><BatteryFull /><small>86%</small></span>
          </div>
          <div className={cn("mobile-app", immersive && "mobile-app-immersive")} ref={setHost} dir={tr.dir} lang={tr.lang}>
            <LangContext.Provider value={tr.lang}>
            <SheetHostContext.Provider value={host}>
            <AppHostContext.Provider value={{ app: host, scroller }}>
              {bare ? <div className="mobile-bare">{children}</div> : null}
              {!bare && !immersive ? <header className={cn("mobile-header", back && "mobile-header-back", headerCompact && "mobile-header-compact")}>
                {back ? (
                  <Link to={back.to as never} params={back.params as never} className="m-back" aria-label={back.label ?? tr.t("Back", "رجوع")}>
                    <ChevronLeft aria-hidden="true" /> {back.label ?? tr.t("Back", "رجوع")}
                  </Link>
                ) : null}
                <div>
                  <h1>{title}</h1>
                  <p>{subtitle ?? tr.t(property.name, property.nameAr)}</p>
                </div>
                {!back ? <span className="mobile-role-pill">{persona === "Attendant" ? tr.t("Housekeeper", "تنظيف الغرف") : persona === "Supervisor" ? tr.t("Supervisor", "مشرفة") : tr.t("Engineer", "صيانة")}</span> : null}
              </header> : null}
              {!bare ? <div className={cn("mobile-scroll-area", !footer && "mobile-scroll-dock")} ref={setScroller}>{children}</div> : null}
              {footer && !bare ? <div className="m-footer">{footer}</div> : null}
              {!footer && !bare ? <TabDock tabs={tabs} pathname={pathname} alerts={alerts.length} hidden={scrolling} /> : null}
              <div className="mobile-home-indicator" aria-hidden="true" />
            </AppHostContext.Provider>
            </SheetHostContext.Provider>
            </LangContext.Provider>
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
        <label className="mobile-persona-select">
          <span>Language</span>
          <select value={tr.lang} onChange={(event) => setLang(event.target.value as "en" | "ar")}>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </label>
        <Link to="/m/login" className="mobile-login-link"><Briefcase aria-hidden="true" /> View login screen</Link>
      </div>
    </div>
  );
}

/* ───────────── Tab dock ───────────── */

type Tab = { to: string; label: string; labelAr: string; icon: React.ComponentType<{ "aria-hidden"?: boolean | "true" }> };

/**
 * Light floating navigation with persistent labels and a sliding active indicator.
 */
function TabDock({ tabs, pathname, alerts, hidden }: { tabs: readonly Tab[]; pathname: string; alerts: number; hidden: boolean }) {
  const { t } = useMobileT();
  const activeIndex = Math.max(0, tabs.findIndex((tab) => pathname === tab.to || (tab.to !== "/m/me" && pathname.startsWith(`${tab.to}/`))));
  return (
    <nav className={cn("tab-dock", hidden && "tab-dock-hidden")} inert={hidden} aria-hidden={hidden || undefined} aria-label={t("Main navigation", "التنقل الرئيسي")} style={{ "--n": tabs.length, "--i": activeIndex } as React.CSSProperties}>
      <span className="tab-dock-arch" aria-hidden="true" />
      {tabs.map((tab, i) => {
        const Icon = tab.icon;
        const active = i === activeIndex;
        return (
          <Link key={tab.to} to={tab.to as never} className={cn("tab-dock-item", active && "on")} aria-label={t(tab.label, tab.labelAr)} title={t(tab.label, tab.labelAr)} aria-current={active ? "page" : undefined}>
            <span className="tab-dock-icon">
              <Icon aria-hidden="true" />
              {tab.to === "/m/alerts" && alerts ? <b className="tab-dock-badge" aria-label={t(`${alerts} new`, `${alerts} جديدة`)}>{alerts}</b> : null}
            </span>
            <span className="tab-dock-label">{t(tab.label, tab.labelAr)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
