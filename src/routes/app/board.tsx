import { createFileRoute } from "@tanstack/react-router";
import { BoardPage } from "@/components/hms/desktop-pages";
export const Route = createFileRoute("/app/board")({ head: () => ({ meta: [{ title: "Live Board — Riwaq" }, { name: "description", content: "Live room readiness across the heritage property." }, { property: "og:title", content: "Live Board — Riwaq" }, { property: "og:description", content: "Live room readiness across TrianglZ Hotel." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: BoardPage });
