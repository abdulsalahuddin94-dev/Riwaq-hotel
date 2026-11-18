import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { initialSignInPath } from "@/lib/entry-flow";

/**
 * App-level chrome. The floating desktop/mobile switch was removed on
 * 2026-11-18: staff use Eman's mobile app, so the dashboard no longer offers
 * a way into the /m routes. Narrow screens opening /login still land on the
 * staff sign-in.
 */
export function DemoChrome({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const isMobileView = pathname.startsWith("/m");

  useEffect(() => {
    if (pathname === "/login" && initialSignInPath(window.innerWidth) === "/m/login") {
      void navigate({ to: "/m/login", replace: true });
    }
  }, [pathname, navigate]);

  useEffect(() => {
    try {
      window.localStorage.setItem("riwaq-demo-view", isMobileView ? "mobile" : "desktop");
    } catch {
      // View preference is optional.
    }
  }, [isMobileView]);

  return <>{children}</>;
}
