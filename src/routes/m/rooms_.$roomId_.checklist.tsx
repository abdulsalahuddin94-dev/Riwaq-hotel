import { createFileRoute } from "@tanstack/react-router";
import { MobileChecklistPage } from "@/components/hms/mobile-detail";

export const Route = createFileRoute("/m/rooms_/$roomId_/checklist")({
  head: ({ params }) => ({ meta: [{ title: `Checklist · Room ${params.roomId} — Riwaq Mobile` }, { name: "description", content: "Digital cleaning checklist with attribution and photo proof." }, { property: "og:title", content: `Checklist · Room ${params.roomId} — Riwaq Mobile` }, { property: "og:description", content: "Digital cleaning checklist with attribution and photo proof." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ChecklistRoute,
});

function ChecklistRoute() {
  const { roomId } = Route.useParams();
  return <MobileChecklistPage roomId={roomId} />;
}
