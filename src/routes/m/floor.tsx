import { createFileRoute } from "@tanstack/react-router";
import { MobileFloorPage } from "@/components/hms/mobile-pages";
export const Route = createFileRoute("/m/floor")({ head: () => ({ meta: [{ title: "Floor Board — Riwaq Mobile" }, { name: "description", content: "Supervisor mobile floor status board." }, { property: "og:title", content: "Floor Board — Riwaq Mobile" }, { property: "og:description", content: "Supervisor mobile floor status board." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: MobileFloorPage });
