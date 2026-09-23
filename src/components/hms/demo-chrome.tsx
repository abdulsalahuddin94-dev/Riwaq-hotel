import { useEffect } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const DESKTOP_ROUTE = "/app/board";
const MOBILE_ROUTE = "/m/rooms";

export function DemoChrome({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isMobileView = pathname.startsWith("/m");

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
        window.location.assign(isMobileView ? DESKTOP_ROUTE : MOBILE_ROUTE);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileView]);

  return (
    <>
      {children}
      <Button
        className="demo-fab group"
        size="icon"
        type="button"
        aria-label={isMobileView ? "Switch to Desktop view" : "Switch to Mobile view"}
        onClick={() => window.location.assign(isMobileView ? DESKTOP_ROUTE : MOBILE_ROUTE)}
      >
        {isMobileView ? <Monitor aria-hidden="true" /> : <Smartphone aria-hidden="true" />}
        <span className="demo-fab-tooltip">
          {isMobileView ? "Switch to Desktop view" : "Switch to Mobile view"}
        </span>
      </Button>
    </>
  );
}
