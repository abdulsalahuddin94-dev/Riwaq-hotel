import { Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronRight, Clock, Crown, Moon, RotateCcw, Zap } from "lucide-react";
import { fmtDuration, type Room, type RoomStatus } from "@/lib/demo-data";
import { activeMinutes, checklistProgress, displayStatus, type HmsState, staffById, stdMinutes } from "@/lib/hms-store";
import { cn } from "@/lib/utils";
import { StatusChip } from "./status";

export type RoomBadge = "Queue" | "VIP" | "Anomaly" | "Re-clean";

export function badgesFor(room: Room, showAnomaly = true): RoomBadge[] {
  const badges: RoomBadge[] = [];
  if (room.queue) badges.push("Queue");
  if (room.vip) badges.push("VIP");
  if (room.taskType === "RECLEAN" && room.hk !== "INSPECTED") badges.push("Re-clean");
  if (showAnomaly && room.anomalies.length) badges.push("Anomaly");
  return badges;
}

function BadgeIcon({ badge }: { badge: RoomBadge }) {
  if (badge === "Queue") return <Zap aria-hidden="true" />;
  if (badge === "VIP") return <Crown aria-hidden="true" />;
  if (badge === "Anomaly") return <AlertTriangle aria-hidden="true" />;
  return <RotateCcw aria-hidden="true" />;
}

export function RoomBadges({ room, showAnomaly = true, max = 3 }: { room: Room; showAnomaly?: boolean; max?: number }) {
  const badges = badgesFor(room, showAnomaly);
  if (!badges.length) return null;
  return (
    <span className="badge-row">
      {badges.slice(0, max).map((badge) => (
        <span className={cn("room-badge", `badge-${badge.toLowerCase().replace("-", "")}`)} key={badge}>
          <BadgeIcon badge={badge} />
          <span>{badge === "Anomaly" ? "Alert" : badge}</span>
        </span>
      ))}
    </span>
  );
}

export const statusClass: Record<RoomStatus, string> = {
  READY: "status-ready",
  AWAITING_INSPECTION: "status-inspect",
  CLEANING: "status-cleaning",
  DIRTY: "status-dirty",
  DND: "status-dnd",
  BLOCKED_OOO: "status-blocked hatch",
  BLOCKED_OOS: "status-blocked dotted",
  OCCUPIED: "status-occupied",
};

export function RoomTile({
  room,
  s,
  onOpen,
  dimmed = false,
  showAnomaly = true,
}: {
  room: Room;
  s: HmsState;
  onOpen: (number: string) => void;
  dimmed?: boolean;
  showAnomaly?: boolean;
}) {
  const status = displayStatus(room, s.settings);
  const badges = badgesFor(room, showAnomaly);
  const attendant = staffById(s, room.attendant);
  const progress = checklistProgress(s, room).percent;
  return (
    <button
      className={cn("room-tile", statusClass[status], dimmed && "room-tile-dimmed")}
      type="button"
      onClick={() => onOpen(room.number)}
      aria-label={`Room ${room.number}, ${status.replace(/_/g, " ").toLowerCase()}. Open details`}
    >
      <span className="room-status-rail" aria-hidden="true" />
      <div className="room-tile-top">
        <bdi>{room.number}</bdi>
        {badges.length === 0 ? <span className="room-attendant">{attendant?.initials ?? "—"}</span> : null}
      </div>
      {badges.length > 0 ? (
        <div className="room-badges">
          <span className={cn("room-badge", `badge-${badges[0]?.toLowerCase().replace("-", "")}`)} title={badges.join(", ")}>
            <BadgeIcon badge={badges[0] as RoomBadge} />
            <span>{badges[0] === "Anomaly" ? "Alert" : badges[0]}</span>
          </span>
          {badges.length > 1 ? <span className="badge-more">+{badges.length - 1}</span> : null}
        </div>
      ) : null}
      <StatusChip status={status} compact />
      {status === "CLEANING" ? <span className="tile-progress" style={{ inlineSize: `${progress}%` }} /> : null}
    </button>
  );
}

export function FloorBoard({
  s,
  rooms,
  onOpen,
  isMatch,
}: {
  s: HmsState;
  rooms: Room[];
  onOpen: (number: string) => void;
  isMatch: (room: Room) => boolean;
}) {
  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort();
  const readyTotal = rooms.filter((r) => displayStatus(r, s.settings) === "READY").length;
  const matches = rooms.filter(isMatch).length;
  return (
    <div className="floor-board-shell">
      <div className="floor-board">
        {floors.map((floor) => {
          const floorRooms = rooms.filter((room) => room.floor === floor);
          const readyCount = floorRooms.filter((room) => displayStatus(room, s.settings) === "READY").length;
          return (
            <section className="floor-row" key={floor} aria-label={`Floor ${floor}`}>
              <div className="floor-label">
                <strong>F{floor}</strong>
                <span>{readyCount} ready</span>
              </div>
              <div className="room-grid" tabIndex={0} aria-label={`Floor ${floor} rooms, scroll horizontally`}>
                {floorRooms.map((room) => (
                  <RoomTile room={room} s={s} onOpen={onOpen} dimmed={!isMatch(room)} key={room.number} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <footer className="board-summary">
        <span><strong>{rooms.length}</strong> total rooms</span>
        <span><strong>{readyTotal}</strong> ready for check-in</span>
        {matches !== rooms.length ? <span><strong>{matches}</strong> match filters</span> : null}
        <span className="board-updated"><i aria-hidden="true" /> Live · updates instantly</span>
      </footer>
    </div>
  );
}

/* ───────────── Mobile room card (tappable) ───────────── */

export function RoomCard({ room, s }: { room: Room; s: HmsState }) {
  const status = displayStatus(room, s.settings);
  const progress = checklistProgress(s, room);
  const minutes = activeMinutes(s, room);
  const std = stdMinutes(room);
  const meta =
    room.hk === "IN_PROGRESS" || room.hk === "PAUSED"
      ? `${room.hk === "PAUSED" ? "Paused" : "In progress"} · ${fmtDuration(minutes)} of ~${std} min`
      : room.hk === "CLEAN"
        ? "Waiting for inspection"
        : room.hk === "INSPECTED"
          ? "Done · inspected"
          : room.dnd
            ? "DND — try later"
            : `~${std} min · ${room.taskType === "STAYOVER" ? "Stayover" : room.taskType === "RECLEAN" ? "Re-clean" : "Departure"}`;
  return (
    <Link to="/m/rooms/$roomId" params={{ roomId: room.number }} className="mobile-room-card">
      <div className="mobile-room-main">
        <div>
          <p className="mobile-room-meta">
            {room.type} · Floor {room.floor}
          </p>
          <h3>
            <bdi>Room {room.number}</bdi>
          </h3>
        </div>
        <StatusChip status={status} />
      </div>
      <RoomBadges room={room} showAnomaly={false} />
      <div className="mobile-card-footer">
        <span>
          {room.dnd ? <Moon aria-hidden="true" /> : <Clock aria-hidden="true" />} {meta}
        </span>
        <span className="card-chevron">
          {progress.done}/{progress.total} <ChevronRight aria-hidden="true" />
        </span>
      </div>
      <div className="mobile-progress">
        <span style={{ inlineSize: `${progress.percent}%` }} />
      </div>
    </Link>
  );
}
