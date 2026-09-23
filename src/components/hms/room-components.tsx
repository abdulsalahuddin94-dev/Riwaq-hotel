import { Clock, Crown, Zap, AlertTriangle, RotateCcw } from "lucide-react";
import { rooms, statusMeta, type Room } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { StatusChip } from "./status";

function BadgeIcon({ badge }: { badge: Room["badges"][number] }) {
  if (badge === "Queue") return <Zap aria-label="Queue" />;
  if (badge === "VIP") return <Crown aria-label="VIP" />;
  if (badge === "Anomaly") return <AlertTriangle aria-label="Anomaly" />;
  return <RotateCcw aria-label="Re-clean" />;
}

const badgeLabels: Record<Room["badges"][number], string> = {
  Queue: "Queue",
  VIP: "VIP",
  Anomaly: "Alert",
  "Re-clean": "Re-clean",
};

export function RoomTile({ room }: { room: Room }) {
  const meta = statusMeta[room.status];
  return (
    <button className={cn("room-tile", meta.className)} type="button" aria-label={`Room ${room.number}, ${meta.label}`}>
      <span className="room-status-rail" aria-hidden="true" />
      <div className="room-tile-top">
        <bdi>{room.number}</bdi>
        {room.badges.length === 0 ? <span className="room-attendant">{room.initials}</span> : null}
      </div>
      {room.badges.length > 0 ? (
        <div className="room-badges">
          {room.badges.slice(0, 1).map((badge) => (
            <span className={cn("room-badge", `badge-${badge.toLowerCase().replace("-", "")}`)} key={badge} title={badge}>
              <BadgeIcon badge={badge} />
              <span>{badgeLabels[badge]}</span>
            </span>
          ))}
          {room.badges.length > 1 ? <span className="badge-more">+{room.badges.length - 1}</span> : null}
        </div>
      ) : null}
      <StatusChip status={room.status} compact />
      {room.status === "CLEANING" ? <span className="tile-progress" style={{ inlineSize: `${room.progress}%` }} /> : null}
    </button>
  );
}

export function RoomCard({ room }: { room: Room }) {
  return (
    <article className="mobile-room-card">
      <div className="mobile-room-main">
        <div>
          <p className="mobile-room-meta">{room.type} · Floor {room.floor}</p>
          <h3><bdi>Room {room.number}</bdi></h3>
        </div>
        <StatusChip status={room.status} />
      </div>
      <div className="mobile-card-footer">
        <span><Clock aria-hidden="true" /> {room.minutes}m due</span>
        <span>{room.progress}/100</span>
      </div>
      <div className="mobile-progress"><span style={{ inlineSize: `${room.progress}%` }} /></div>
    </article>
  );
}

export function FloorBoard() {
  return (
    <div className="floor-board-shell">
      <div className="floor-board">
        {[1, 2, 3, 4, 5].map((floor) => {
          const floorRooms = rooms.filter((room) => room.floor === floor);
          const readyCount = floorRooms.filter((room) => room.status === "READY").length;
          return (
            <section className="floor-row" key={floor} aria-label={`Floor ${floor}`}>
              <div className="floor-label">
                <strong>F{floor}</strong>
                <span>{readyCount} ready</span>
              </div>
              <div className="room-grid" tabIndex={0} aria-label={`Floor ${floor} rooms, scroll horizontally`}>
                {floorRooms.map((room) => (
                  <RoomTile room={room} key={room.number} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <footer className="board-summary">
        <span><strong>100</strong> total rooms</span>
        <span><strong>34</strong> ready for check-in</span>
        <span className="board-updated"><i aria-hidden="true" /> Updated just now</span>
      </footer>
    </div>
  );
}
