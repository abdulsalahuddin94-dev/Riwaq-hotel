import { createFileRoute } from "@tanstack/react-router";
import { MobileRoomsPage } from "@/components/hms/mobile-pages";
export const Route = createFileRoute("/m/rooms")({ head: () => ({ meta: [{ title: "My Rooms — Riwaq" }, { name: "description", content: "Assigned housekeeping rooms for today's shift." }, { property: "og:title", content: "My Rooms — Riwaq" }, { property: "og:description", content: "Assigned housekeeping rooms for today's shift." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: MobileRoomsPage });
