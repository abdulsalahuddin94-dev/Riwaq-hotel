import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/components/hms/users-page";
export const Route = createFileRoute("/app/users")({
  head: () => ({
    meta: [
      { title: "Users · Marsa Dhahab" },
      {
        name: "description",
        content: "Create and manage staff accounts for the staff app and dashboard.",
      },
      { property: "og:title", content: "Users · Marsa Dhahab" },
      { property: "og:description", content: "Create and manage staff accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersPage,
});
