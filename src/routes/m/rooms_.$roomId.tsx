import { createFileRoute } from "@tanstack/react-router";
import { MobileRoomDetailPage } from "@/components/hms/mobile-detail";

export const Route = createFileRoute("/m/rooms_/$roomId")({
  head: ({ params }) => ({ meta: [{ title: `Room ${params.roomId} — Riwaq Mobile` }, { name: "description", content: "Room details, actions, and history for the housekeeper." }, { property: "og:title", content: `Room ${params.roomId} — Riwaq Mobile` }, { property: "og:description", content: "Room details, actions, and history for the housekeeper." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: RoomDetailRoute,
});

function RoomDetailRoute() {
  const { roomId } = Route.useParams();
  return <MobileRoomDetailPage roomId={roomId} />;
}
