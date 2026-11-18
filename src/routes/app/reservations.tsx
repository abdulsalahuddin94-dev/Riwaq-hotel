import { createFileRoute } from "@tanstack/react-router";
import { ReservationsPage } from "@/components/hms/reservations-page";
export const Route = createFileRoute("/app/reservations")({
  head: () => ({
    meta: [
      { title: "Reservations · Marsa Dhahab" },
      { name: "description", content: "Take bookings and follow up guests who haven't arrived." },
      { property: "og:title", content: "Reservations · Marsa Dhahab" },
      {
        property: "og:description",
        content: "Take bookings and follow up guests who haven't arrived.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReservationsPage,
});
