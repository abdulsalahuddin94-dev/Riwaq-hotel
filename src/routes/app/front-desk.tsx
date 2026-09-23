import { createFileRoute } from "@tanstack/react-router";
import { FrontDeskPage } from "@/components/hms/desktop-pages";
export const Route = createFileRoute("/app/front-desk")({ head: () => ({ meta: [{ title: "Front Desk — TrianglZ HMS" }, { name: "description", content: "Trusted room readiness for check-in." }, { property: "og:title", content: "Front Desk — TrianglZ HMS" }, { property: "og:description", content: "Trusted room readiness for check-in." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: FrontDeskPage });
