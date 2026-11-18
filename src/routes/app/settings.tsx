import { createFileRoute, redirect } from "@tanstack/react-router";

/** Settings was removed (2026-11-18): it held read-only property info, and wing room counts now sit on the Live Board. Old links land there. */
export const Route = createFileRoute("/app/settings")({
  beforeLoad: () => {
    throw redirect({ to: "/app/board" });
  },
});
