import { createFileRoute, redirect } from "@tanstack/react-router";

/** Work orders were removed from the dashboard (2026-11-18): maintenance isn't part of the staff app. Old links land on the Live Board. */
export const Route = createFileRoute("/app/work-orders")({
  beforeLoad: () => {
    throw redirect({ to: "/app/board" });
  },
});
