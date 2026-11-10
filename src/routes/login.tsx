import { createFileRoute } from "@tanstack/react-router";
import { DesktopLoginPage } from "@/components/hms/mobile-pages";
export const Route = createFileRoute("/login")({ head: () => ({ meta: [{ title: "Sign in — Riwaq" }, { name: "description", content: "Sign in to Riwaq heritage hospitality operations." }, { property: "og:title", content: "Sign in — Riwaq" }, { property: "og:description", content: "Sign in to Riwaq heritage hospitality operations." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: DesktopLoginPage });
