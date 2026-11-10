import { createFileRoute } from "@tanstack/react-router";
import { MobileRoomDetailPage } from "@/components/hms/mobile-detail";

export const Route = createFileRoute("/m/rooms_/$roomId")({
  head: ({ params }) => ({ meta: [{ title: `Room ${params.roomId} — Riwaq Mobile` }, { name: "description", content: "Room details, actions, and history for the housekeeper." }] }),
  component: RoomDetailRoute,
});

function RoomDetailRoute() {
  const { roomId } = Route.useParams();
  return <MobileRoomDetailPage roomId={roomId} />;
}
