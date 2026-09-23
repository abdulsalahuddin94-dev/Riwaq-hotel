import { createFileRoute } from "@tanstack/react-router";
import { MobileWorkOrderDetailPage } from "@/components/hms/mobile-detail";

export const Route = createFileRoute("/m/work-orders_/$woId")({
  head: ({ params }) => ({ meta: [{ title: `${params.woId} — TrianglZ HMS Mobile` }, { name: "description", content: "Maintenance job detail for engineers." }] }),
  component: WorkOrderRoute,
});

function WorkOrderRoute() {
  const { woId } = Route.useParams();
  return <MobileWorkOrderDetailPage woId={woId} />;
}
