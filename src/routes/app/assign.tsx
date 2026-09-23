import { createFileRoute } from "@tanstack/react-router";
import { AssignPage } from "@/components/hms/desktop-pages";
export const Route = createFileRoute("/app/assign")({ head: () => ({ meta: [{ title: "Assignments — TrianglZ HMS" }, { name: "description", content: "Balance and publish room assignments." }, { property: "og:title", content: "Assignments — TrianglZ HMS" }, { property: "og:description", content: "Balance and publish room assignments." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: AssignPage });
