import { Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronRight, Clock, Crown, Landmark, Moon, RotateCcw, Zap } from "lucide-react";
import { wingLabel, fmtDuration, heritageNotice, type Room, type RoomStatus, statusMeta } from "@/lib/demo-data";
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

/** Heritage warning. Text only — the demo never shows a care recipe, because none has been approved. */
export function HeritageNotice({ room, compact = false }: { room: Room; compact?: boolean }) {
  if (!room.heritage.length) return null;
  return (
    <section className={cn("heritage-notice", compact && "heritage-notice-compact")} aria-label={heritageNotice.title}>
      <Landmark aria-hidden="true" />
      <div>
        <strong>
          {heritageNotice.title}
          <span className="heritage-ar" lang="ar" dir="rtl">{heritageNotice.titleAr}</span>
        </strong>
        <ul>
          {room.heritage.map((asset) => (
            <li key={asset.id}>
              {asset.name} <small>({asset.material})</small>
              <span className="heritage-ar" lang="ar" dir="rtl">{asset.nameAr}</span>
            </li>
          ))}
        </ul>
        {!compact ? (
          <>
            <p>{heritageNotice.body}</p>
            <p lang="ar" dir="rtl">{heritageNotice.bodyAr}</p>
          </>
        ) : (
          <p>Care procedure awaiting specialist approval — report, don&apos;t treat.</p>
        )}
      </div>
    </section>
  );
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
  const meta = statusMeta[status];
  const Icon = meta.icon;
  const badges = badgesFor(room, showAnomaly);
  const attendant = staffById(s, room.attendant);
  const progress = checklistProgress(s, room).percent;
  const summary = [`Room ${room.number}`, meta.label, attendant?.name ?? "Unassigned", ...badges.map((b) => (b === "Anomaly" ? "Accountability alert" : b))].join(" · ");
  return (
    <button
      className={cn("room-tile", statusClass[status], dimmed && "room-tile-dimmed")}
      type="button"
      onClick={() => onOpen(room.number)}
      title={summary}
      aria-label={`${summary}. Open details`}
    >
      <bdi className="tile-num">{room.number}</bdi>
      <Icon className="tile-icon" aria-hidden="true" />
      {badges.length ? (
        <span className="tile-flags" aria-hidden="true">
          {badges.slice(0, 2).map((badge) => (
            <span className={cn("tile-flag", `flag-${badge.toLowerCase().replace("-", "")}`)} key={badge}>
              <BadgeIcon badge={badge} />
            </span>
          ))}
        </span>
      ) : null}
      <span className="room-attendant" aria-hidden="true">{attendant?.initials ?? "—"}</span>
      {status === "CLEANING" ? <span className="tile-progress" style={{ inlineSize: `${progress}%` }} /> : null}
    </button>
  );
}

const floorSummary: { label: string; statuses: RoomStatus[]; className: string }[] = [
  { label: "ready", statuses: ["READY"], className: "status-ready" },
  { label: "inspect", statuses: ["AWAITING_INSPECTION"], className: "status-inspect" },
  { label: "cleaning", statuses: ["CLEANING"], className: "status-cleaning" },
  { label: "dirty", statuses: ["DIRTY"], className: "status-dirty" },
  { label: "occupied", statuses: ["OCCUPIED"], className: "status-occupied" },
  { label: "DND", statuses: ["DND"], className: "status-dnd" },
  { label: "blocked", statuses: ["BLOCKED_OOO", "BLOCKED_OOS"], className: "status-blocked" },
];

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
          return (
            <section className="floor-block" key={floor} aria-label={wingLabel(floor)}>
              <header className="floor-head">
                <strong>{wingLabel(floor)}</strong>
                <span className="floor-counts">
                  {floorSummary.map((group) => {
                    const count = floorRooms.filter((room) => group.statuses.includes(displayStatus(room, s.settings))).length;
                    return count ? (
                      <span key={group.label}>
                        <i className={group.className} aria-hidden="true" />
                        {count} {group.label}
                      </span>
                    ) : null;
                  })}
                </span>
              </header>
              <div className="room-grid">
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
            {room.type} · {wingLabel(room.floor)}
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
