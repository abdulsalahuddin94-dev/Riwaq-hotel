import { createFileRoute, redirect } from "@tanstack/react-router";

// Start the desktop preview at sign-in; phone-width entry is adapted after hydration.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ href: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Dar Al Majlis — Hotel Operations" },
      { name: "description", content: "Dar Al Majlis hotel operations, powered by Riwaq Systems." },
      { property: "og:title", content: "Dar Al Majlis — Hotel Operations" },
      { property: "og:description", content: "Dar Al Majlis hotel operations, powered by Riwaq Systems." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() { return null; }
