import { createFileRoute } from "@tanstack/react-router";
import { MobileWorkOrderDetailPage } from "@/components/hms/mobile-detail";

export const Route = createFileRoute("/m/work-orders_/$woId")({
  head: ({ params }) => ({ meta: [{ title: `${params.woId} — Riwaq Mobile` }, { name: "description", content: "Maintenance job detail for engineers." }, { property: "og:title", content: `${params.woId} — Riwaq Mobile` }, { property: "og:description", content: "Maintenance job detail for engineers." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: WorkOrderRoute,
});

function WorkOrderRoute() {
  const { woId } = Route.useParams();
  return <MobileWorkOrderDetailPage woId={woId} />;
}
