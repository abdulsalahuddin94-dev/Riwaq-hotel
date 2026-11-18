import { createFileRoute, redirect } from "@tanstack/react-router";

/** The Escalation Center was folded into the notification bell (2026-11-18). Old links land on the Live Board. */
export const Route = createFileRoute("/app/escalations")({
  beforeLoad: () => {
    throw redirect({ to: "/app/board" });
  },
});
