import { createFileRoute, redirect } from "@tanstack/react-router";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ href: "/app/board" });
  },
  head: () => ({
    meta: [
      { title: "Riwaq — Heritage Hospitality Operations" },
      { name: "description", content: "Riwaq heritage hospitality operations demo." },
      { property: "og:title", content: "Riwaq — Heritage Hospitality Operations" },
      { property: "og:description", content: "Riwaq heritage hospitality operations demo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() { return null; }
