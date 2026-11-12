import { createFileRoute } from "@tanstack/react-router";
import { MobileInspectionFormPage } from "@/components/hms/mobile-detail";

export const Route = createFileRoute("/m/inspections_/$roomId")({
  head: ({ params }) => ({ meta: [{ title: `Inspect Room ${params.roomId} — Riwaq Mobile` }, { name: "description", content: "Scored 20-point supervisor inspection." }, { property: "og:title", content: `Inspect Room ${params.roomId} — Riwaq Mobile` }, { property: "og:description", content: "Scored 20-point supervisor inspection." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: InspectionRoute,
});

function InspectionRoute() {
  const { roomId } = Route.useParams();
  return <MobileInspectionFormPage roomId={roomId} />;
}
