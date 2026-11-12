import { createFileRoute, redirect } from "@tanstack/react-router";

// Start the desktop preview at sign-in; phone-width entry is adapted after hydration.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ href: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Riwaq — Heritage Hospitality Operations" },
      { name: "description", content: "Riwaq heritage hospitality operations." },
      { property: "og:title", content: "Riwaq — Heritage Hospitality Operations" },
      { property: "og:description", content: "Riwaq heritage hospitality operations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() { return null; }
