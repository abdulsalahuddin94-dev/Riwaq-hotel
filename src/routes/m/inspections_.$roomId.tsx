import { createFileRoute } from "@tanstack/react-router";
import { MobileInspectionFormPage } from "@/components/hms/mobile-detail";

export const Route = createFileRoute("/m/inspections_/$roomId")({
  head: ({ params }) => ({ meta: [{ title: `Inspect Room ${params.roomId} — Riwaq Mobile` }, { name: "description", content: "Scored 20-point supervisor inspection." }] }),
  component: InspectionRoute,
});

function InspectionRoute() {
  const { roomId } = Route.useParams();
  return <MobileInspectionFormPage roomId={roomId} />;
}
