import { createFileRoute, redirect } from "@tanstack/react-router";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/app/board" });
  },
  head: () => ({
    meta: [
      { title: "TrianglZ Hotel HMS" },
      { name: "description", content: "TrianglZ Hotel housekeeping operations demo." },
      { property: "og:title", content: "TrianglZ Hotel HMS" },
      { property: "og:description", content: "TrianglZ Hotel housekeeping operations demo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() { return null; }
