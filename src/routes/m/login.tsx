import { createFileRoute } from "@tanstack/react-router";
import { MobileLoginPage } from "@/components/hms/mobile-pages";
export const Route = createFileRoute("/m/login")({ head: () => ({ meta: [{ title: "Shift Sign-in — TrianglZ HMS" }, { name: "description", content: "Mobile team shift sign-in design." }, { property: "og:title", content: "Shift Sign-in — TrianglZ HMS" }, { property: "og:description", content: "Mobile team shift sign-in design." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: MobileLoginPage });
