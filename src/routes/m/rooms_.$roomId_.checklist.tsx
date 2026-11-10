import { createFileRoute } from "@tanstack/react-router";
import { MobileChecklistPage } from "@/components/hms/mobile-detail";

export const Route = createFileRoute("/m/rooms_/$roomId_/checklist")({
  head: ({ params }) => ({ meta: [{ title: `Checklist · Room ${params.roomId} — Riwaq Mobile` }, { name: "description", content: "Digital cleaning checklist with attribution and photo proof." }] }),
  component: ChecklistRoute,
});

function ChecklistRoute() {
  const { roomId } = Route.useParams();
  return <MobileChecklistPage roomId={roomId} />;
}
