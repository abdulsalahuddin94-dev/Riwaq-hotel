import { useCallback, useEffect } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getHms } from "@/lib/hms-store";

const desktopHome = { Manager: "/app/board", "Front Desk": "/app/front-desk", Admin: "/app/settings" } as const;
const mobileHome = { Attendant: "/m/rooms", Supervisor: "/m/inspections", Engineer: "/m/work-orders" } as const;

export function DemoChrome({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const isMobileView = pathname.startsWith("/m");

  const toggle = useCallback(() => {
    const s = getHms();
    if (isMobileView) {
      void navigate({ to: desktopHome[s.desktopPersona as keyof typeof desktopHome] ?? "/app/board" });
    } else {
      void navigate({ to: mobileHome[s.mobilePersona as keyof typeof mobileHome] ?? "/m/rooms" });
    }
  }, [isMobileView, navigate]);

  useEffect(() => {
    try {
      window.localStorage.setItem("trianglz-demo-view", isMobileView ? "mobile" : "desktop");
    } catch {
      // Demo view preference is optional.
    }
  }, [isMobileView]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "m") {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return (
    <>
      {children}
      <Button
        className="demo-fab group"
        size="icon"
        type="button"
        aria-label={isMobileView ? "Switch to Desktop view" : "Switch to Mobile view"}
        onClick={toggle}
      >
        {isMobileView ? <Monitor aria-hidden="true" /> : <Smartphone aria-hidden="true" />}
        <span className="demo-fab-tooltip">{isMobileView ? "Switch to Desktop view (Ctrl+M)" : "Switch to Mobile view (Ctrl+M)"}</span>
      </Button>
    </>
  );
}
