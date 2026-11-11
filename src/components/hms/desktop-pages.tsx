import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Filter,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { wingLabel, wingShort, fmtDuration, fmtTime, property, type Room, type RoomStatus, statusMeta } from "@/lib/demo-data";
import {
  activeMinutes,
  actorFor,
  anomalyLabel,
  checklistProgress,
  demoNow,
  displayStatus,
  escalations,
  hms,
  isReady,
  roomCredits,
  staffName,
  stdMinutes,
  useHms,
} from "@/lib/hms-store";
import { cn } from "@/lib/utils";
import { EmptyState } from "./demo-states";
import {
  EventLogDialog,
  NewWorkOrderDialog,
  QueueGuestDialog,
  SettingsDialog,
  type SettingsKey,
  StaffDayDialog,
  WorkOrderDialog,
} from "./desktop-dialogs";
import { DesktopShell, useDesktop } from "./desktop-shell";
import { FloorBoard, RoomBadges, statusClass } from "./room-components";
import { ReportsContent } from "./reports-page";
import { EscalationAction, NowStrip } from "./now-strip";
import { ArrivalsTimeline } from "./arrivals-timeline";
import { StatusChip } from "./status";

const KPI_STATUSES: { status: RoomStatus; label: string; helper: (n: number, s: ReturnType<typeof useHms>) => string; group?: RoomStatus[] }[] = [
  { status: "READY", label: "Ready", helper: () => "trusted for check-in" },
  { status: "AWAITING_INSPECTION", label: "Inspect", helper: () => "awaiting supervisor" },
  { status: "CLEANING", label: "Cleaning", helper: (_, s) => `${s.rooms.filter((r) => r.hk === "PAUSED").length} paused` },
  { status: "DIRTY", label: "Dirty", helper: () => "not started" },
  { status: "BLOCKED_OOO", label: "Blocked", helper: () => "OOO / OOS", group: ["BLOCKED_OOO", "BLOCKED_OOS"] },
];

const DAY = "Wednesday, 23 September";

/* ───────────────────────── Live Board ───────────────────────── */

export function BoardPage() {
  return (
    <DesktopShell title="Live Board" eyebrow={DAY}>
      <BoardContent />
    </DesktopShell>
  );
}

function BoardContent() {
  const s = useHms();
  const { openRoom } = useDesktop();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [statuses, setStatuses] = useState<RoomStatus[]>([]);
  const [floor, setFloor] = useState("all");
  const [attendant, setAttendant] = useState("all");
  const [flag, setFlag] = useState<"none" | "queue" | "anomaly" | "unassigned">("none");
  const [logOpen, setLogOpen] = useState(false);
  const statusOf = (r: Room) => displayStatus(r, s.settings);
  const activeFilters = statuses.length + (floor !== "all" ? 1 : 0) + (attendant !== "all" ? 1 : 0) + (flag !== "none" ? 1 : 0);
  const isMatch = (r: Room) =>
    (!statuses.length || statuses.includes(statusOf(r))) &&
    (floor === "all" || String(r.floor) === floor) &&
    (attendant === "all" || r.attendant === attendant) &&
    (flag === "none" || (flag === "queue" && !!r.queue) || (flag === "anomaly" && r.anomalies.length > 0) || (flag === "unassigned" && !r.attendant));
  const matches = s.rooms.filter(isMatch).length;
  const toggleStatus = (group: RoomStatus[]) =>
    setStatuses((cur) => (group.every((g) => cur.includes(g)) ? cur.filter((c) => !group.includes(c)) : Array.from(new Set([...cur, ...group]))));
  const clear = () => {
    setStatuses([]);
    setFloor("all");
    setAttendant("all");
    setFlag("none");
  };
  const recent = s.events.slice(-5).reverse();
  const staff = s.staff.filter((p) => p.role === "ATTENDANT");

  return (
    <>
      <NowStrip />

      <section className="readiness-ribbon" aria-label="Room status summary">
        {(() => {
          const counts = KPI_STATUSES.map((kpi) => {
            const group = kpi.group ?? [kpi.status];
            return { kpi, group, value: s.rooms.filter((r) => group.includes(statusOf(r))).length };
          });
          return (
            <>
              <div className="ribbon-bar" aria-hidden="true">
                {counts.map(({ kpi, value }) =>
                  value ? <span key={kpi.label} className={statusMeta[kpi.status].className} style={{ flexGrow: value }} /> : null,
                )}
              </div>
              <div className="ribbon-legend">
                {counts.map(({ kpi, group, value }) => {
                  const Icon = statusMeta[kpi.status].icon;
                  const on = group.every((g) => statuses.includes(g));
                  return (
                    <button type="button" className={cn("ribbon-item", on && "ribbon-item-on")} key={kpi.label} onClick={() => toggleStatus(group)} aria-pressed={on}>
                      <span className={cn("ribbon-swatch", statusMeta[kpi.status].className)}><Icon aria-hidden="true" /></span>
                      <strong>{value}</strong>
                      <span className="ribbon-label">{kpi.label}<small>{kpi.helper(value, s)}</small></span>
                    </button>
                  );
                })}
                <p className="ribbon-total">
                  <strong>{s.rooms.length}</strong> keys · {s.rooms.filter((r) => r.occupancy === "OCCUPIED").length} occupied · {s.staff.length} staff on shift
                </p>
              </div>
            </>
          );
        })()}
      </section>

      <div className="board-workspace">
        <section className="board-panel board-panel-ops">
          <div className="section-heading">
            <div><h2>Rooms by wing</h2><p>Open a room for who did what, the checklist and inspection.</p></div>
            <div className="toolbar-actions">
              <Button variant={showFilters || activeFilters ? "hmsSecondary" : "hmsGhost"} size="hmsMd" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
                <Filter aria-hidden="true" /> Filters{activeFilters ? ` · ${activeFilters}` : ""}
              </Button>
              <Button
                variant="hmsPrimary"
                size="hmsMd"
                onClick={() => {
                  const n = hms.autoAssign(actorFor(s, "desktop"));
                  if (n) {
                    toast.success(`${n} unassigned rooms auto-assigned by wing & credits`, { duration: 4000, action: { label: "Review", onClick: () => void navigate({ to: "/app/assign" }) } });
                  } else toast.info("Every active room already has an attendant", { duration: 3000 });
                }}
              >
                <Sparkles aria-hidden="true" /> Auto-assign
              </Button>
            </div>
          </div>
          {showFilters ? (
            <section className="filter-panel" aria-label="Board filters">
              <div className="filter-group">
                <span>Status</span>
                {(["READY", "AWAITING_INSPECTION", "CLEANING", "DIRTY", "OCCUPIED", "DND", "BLOCKED_OOO", "BLOCKED_OOS"] as RoomStatus[]).map((st) => (
                  <button type="button" key={st} className={cn("filter-chip", statuses.includes(st) && "filter-chip-on")} onClick={() => toggleStatus([st])}>
                    {statusMeta[st].label}
                  </button>
                ))}
              </div>
              <div className="filter-group">
                <span>Wing</span>
                <select value={floor} onChange={(e) => setFloor(e.target.value)}>
                  <option value="all">All wings</option>
                  {[1, 2, 3, 4, 5].map((f) => <option key={f} value={f}>{wingLabel(f)}</option>)}
                </select>
                <span>Attendant</span>
                <select value={attendant} onChange={(e) => setAttendant(e.target.value)}>
                  <option value="all">Everyone</option>
                  {staff.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <span>Flag</span>
                <select value={flag} onChange={(e) => setFlag(e.target.value as typeof flag)}>
                  <option value="none">Any</option>
                  <option value="queue">Queue rooms</option>
                  <option value="anomaly">Accountability signals</option>
                  <option value="unassigned">Unassigned</option>
                </select>
                {activeFilters ? <Button variant="hmsGhost" size="hmsSm" onClick={clear}><X aria-hidden="true" /> Clear</Button> : null}
              </div>
            </section>
          ) : null}
          {matches === 0 ? <EmptyState title="No rooms match these filters" action="Clear filters" onAction={clear} /> : <FloorBoard s={s} rooms={s.rooms} onOpen={openRoom} isMatch={isMatch} />}
        </section>
        <aside className="timeline-panel" aria-label="Recent housekeeping activity">
          <div className="timeline-heading">
            <div><h2>Staff timeline</h2></div>
            <Button variant="hmsGhost" size="hmsSm" onClick={() => setLogOpen(true)}>View all</Button>
          </div>
          <div className="timeline-list">
            {recent.map((event) => (
              <button type="button" key={event.id} onClick={() => (event.room ? openRoom(event.room) : setLogOpen(true))}>
                <span><CheckCircle2 aria-hidden="true" /></span>
                <div><h3>{event.room ? `${event.room} · ` : ""}{event.text}</h3><p>{staffName(s, event.actor)}</p></div>
                <time>{fmtTime(event.at)}</time>
              </button>
            ))}
          </div>
        </aside>
      </div>
      <EventLogDialog open={logOpen} onOpenChange={setLogOpen} onOpenRoom={openRoom} />
    </>
  );
}

/* ───────────────────────── Team ───────────────────────── */

export function TeamPage() {
  return (
    <DesktopShell title="Team Progress" eyebrow="On shift · 8 attendants · 2 supervisors">
      <TeamContent />
    </DesktopShell>
  );
}

function TeamContent() {
  const s = useHms();
  const { openRoom } = useDesktop();
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState<string | null>(null);
  const attendants = s.staff.filter((p) => p.role === "ATTENDANT");
  const supervisors = s.staff.filter((p) => p.role === "SUPERVISOR");
  return (
    <>
      <section className="content-panel">
        <div className="section-heading">
          <div><h2>Attendant progress</h2><p>Click a person for their full day: rooms, durations, skipped items, inspections.</p></div>
          <Button variant="hmsPrimary" size="hmsLg" onClick={() => void navigate({ to: "/app/assign" })}><Users aria-hidden="true" /> Manage shift</Button>
        </div>
        <div className="data-table">
          <div className="table-row table-header team-row"><span>Team member</span><span>Progress</span><span>Current room</span><span>Credits</span><span>Pass rate</span><span>Signals</span></div>
          {attendants.map((person) => {
            const rooms = s.rooms.filter((r) => r.attendant === person.id);
            const done = rooms.filter((r) => r.hk === "CLEAN" || r.hk === "INSPECTED").length;
            const current = rooms.find((r) => r.hk === "IN_PROGRESS" || r.hk === "PAUSED");
            const ins = rooms.flatMap((r) => r.inspections);
            const pass = ins.length ? Math.round((ins.filter((i) => i.result === "PASSED").length / ins.length) * 100) : null;
            const signals = rooms.filter((r) => r.anomalies.length).length;
            const credits = rooms.reduce((sum, r) => sum + roomCredits(r), 0);
            return (
              <button type="button" className="table-row team-row" key={person.id} onClick={() => setStaffId(person.id)}>
                <span className="staff-cell"><i>{person.initials}</i><b>{person.name}</b></span>
                <span><bdi>{done}/{rooms.length}</bdi><em><i style={{ inlineSize: `${rooms.length ? Math.round((done / rooms.length) * 100) : 0}%` }} /></em></span>
                <span>{current ? <bdi>{current.number} · {current.hk === "PAUSED" ? "paused" : fmtDuration(activeMinutes(s, current))}</bdi> : "—"}</span>
                <span className={cn(credits > s.settings.targetCredits && "over-target")}>{credits.toFixed(1)}</span>
                <span>{pass === null ? "—" : `${pass}%`}</span>
                <span>{signals ? <strong className="signal"><AlertTriangle aria-hidden="true" /> {signals} signal{signals > 1 ? "s" : ""}</strong> : "Clear"}</span>
              </button>
            );
          })}
        </div>
      </section>
      <section className="content-panel mt-5">
        <div className="section-heading"><div><h2>Supervisors</h2><p>Inspections completed today and rooms waiting on their floors.</p></div></div>
        <div className="supervisor-grid">
          {supervisors.map((p) => {
            const done = s.rooms.flatMap((r) => r.inspections).filter((i) => i.by === p.id);
            const waiting = s.rooms.filter((r) => r.hk === "CLEAN" && (p.floors ?? []).includes(r.floor));
            return (
              <article key={p.id}>
                <div className="staff-cell"><i>{p.initials}</i><b>{p.name}</b></div>
                <p>Floors {(p.floors ?? []).join(", ")}</p>
                <div className="mini-kpis">
                  <div><strong>{done.length}</strong><span>Inspected</span></div>
                  <div><strong>{done.filter((i) => i.result === "FAILED").length}</strong><span>Rejected</span></div>
                  <div><strong>{waiting.length}</strong><span>Waiting</span></div>
                </div>
                {waiting.length ? (
                  <div className="chip-row">
                    {waiting.map((r) => <button type="button" className="room-chip" key={r.number} onClick={() => openRoom(r.number)}>{r.number}{r.queue ? " ⚡" : ""}</button>)}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
      <StaffDayDialog staffId={staffId} onClose={() => setStaffId(null)} onOpenRoom={openRoom} />
    </>
  );
}

/* ───────────────────────── Assignment ───────────────────────── */

export function AssignPage() {
  return (
    <DesktopShell title="Assignment Board" eyebrow="Morning shift · balanced by room credits">
      <AssignContent />
    </DesktopShell>
  );
}

function AssignContent() {
  const s = useHms();
  const { openRoom } = useDesktop();
  const actor = actorFor(s, "desktop");
  const [selected, setSelected] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const attendants = s.staff.filter((p) => p.role === "ATTENDANT");
  const active = (r: Room) => !r.block && !(r.hk === "INSPECTED" && r.occupancy === "VACANT") && !(r.hk === "INSPECTED" && r.taskType === "STAYOVER");
  const unassigned = s.rooms.filter((r) => !r.attendant && active(r));
  const move = (number: string, to: string | null) => {
    hms.assignRoom(number, to, actor);
    setSelected(null);
  };
  const dropProps = (to: string | null, key: string) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setOver(key);
    },
    onDragLeave: () => setOver(null),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setOver(null);
      const number = e.dataTransfer.getData("text/plain");
      if (number) move(number, to);
    },
  });
  const chip = (r: Room) => {
    const st = displayStatus(r, s.settings);
    return (
      <button
        type="button"
        key={r.number}
        draggable
        onDragStart={(e) => e.dataTransfer.setData("text/plain", r.number)}
        onClick={() => setSelected((cur) => (cur === r.number ? null : r.number))}
        onDoubleClick={() => openRoom(r.number)}
        className={cn("assign-chip", statusClass[st], selected === r.number && "assign-chip-selected", r.hk === "CLEAN" || r.hk === "INSPECTED" ? "assign-chip-done" : "")}
        title={`${r.type} · ${statusMeta[st].label} · ${roomCredits(r)} credits — drag to move, double-click for details`}
      >
        <bdi>{r.number}</bdi>
        {r.queue ? <Zap aria-label="Queue" /> : r.vip ? <span aria-label="VIP">👑</span> : null}
        <small>{roomCredits(r).toFixed(1)}</small>
      </button>
    );
  };
  return (
    <>
      <div className="page-actions-row">
        <div className="live-note">
          {s.published ? <><span /> Assignments published — attendants see their lists</> : <><span className="dot-warn" /> Unpublished changes — attendants haven't been notified yet</>}
        </div>
        <div className="toolbar-actions">
          <Button variant="hmsSecondary" size="hmsMd" onClick={() => { const n = hms.autoAssign(actor); toast[n ? "success" : "info"](n ? `${n} rooms auto-assigned` : "Nothing left to assign", { duration: 3000 }); }}>
            <Sparkles aria-hidden="true" /> Auto-assign
          </Button>
          <Button variant="hmsPrimary" size="hmsLg" disabled={s.published} onClick={() => { hms.publishAssignments(actor); toast.success("Assignments published — 8 attendants notified", { duration: 3000 }); }}>
            Publish assignments
          </Button>
        </div>
      </div>
      <p className="hint-line">Drag a room onto an attendant — or click a room, then click “Move here”. Double-click a room for details. Numbers show workload credits.</p>
      <div className="assignment-layout">
        <section className={cn("content-panel assign-pool", over === "pool" && "drop-over")} {...dropProps(null, "pool")}>
          <div className="section-heading">
            <div><h2>Unassigned</h2><p>{unassigned.length} active rooms without an attendant.</p></div>
            {selected && s.rooms.find((r) => r.number === selected)?.attendant ? <Button variant="hmsGhost" size="hmsSm" onClick={() => move(selected, null)}>Unassign {selected}</Button> : null}
          </div>
          {unassigned.length ? <div className="assign-chip-grid">{unassigned.map(chip)}</div> : <EmptyState title="Every active room is assigned" />}
        </section>
        <section className="assign-columns">
          {attendants.map((p) => {
            const rooms = s.rooms.filter((r) => r.attendant === p.id && active(r));
            const doneRooms = s.rooms.filter((r) => r.attendant === p.id && !active(r) && !r.block);
            const credits = rooms.reduce((sum, r) => sum + roomCredits(r), 0) + doneRooms.reduce((sum, r) => sum + roomCredits(r), 0);
            const overTarget = credits > s.settings.targetCredits;
            return (
              <article className={cn("assign-column", overTarget && "assign-over", selected && "assign-target", over === p.id && "drop-over")} key={p.id} {...dropProps(p.id, p.id)}>
                <header>
                  <div className="staff-cell"><i>{p.initials}</i><b>{p.name}</b></div>
                  <span className={cn("credit-pill", overTarget && "credit-over")}>{credits.toFixed(1)} / {s.settings.targetCredits}</span>
                </header>
                <div className="credit-bar"><i style={{ inlineSize: `${Math.min(100, (credits / s.settings.targetCredits) * 100)}%` }} /></div>
                {overTarget ? <p className="warn-line"><AlertTriangle aria-hidden="true" /> Over target workload</p> : null}
                <div className="assign-chip-grid">{rooms.map(chip)}</div>
                {doneRooms.length ? <p className="muted-line">+{doneRooms.length} completed today</p> : null}
                {selected && s.rooms.find((r) => r.number === selected)?.attendant !== p.id ? (
                  <Button variant="hmsPrimary" size="hmsSm" className="move-here" onClick={() => move(selected, p.id)}>Move {selected} here</Button>
                ) : null}
              </article>
            );
          })}
        </section>
      </div>
    </>
  );
}

/* ───────────────────────── Reports ───────────────────────── */

export function ReportsPage() {
  return (
    <DesktopShell title="Reports" eyebrow="Wednesday, 23 September">
      <ReportsContent />
    </DesktopShell>
  );
}

/* ───────────────────────── Front Desk ───────────────────────── */

export function FrontDeskPage() {
  return (
    <DesktopShell title="Front Desk Board" eyebrow="Internal readiness · PMS sync not connected">
      <FrontDeskContent />
    </DesktopShell>
  );
}

function FrontDeskContent() {
  const s = useHms();
  const { openRoom } = useDesktop();
  const [filter, setFilter] = useState<"ready" | "notready" | "arrivals" | "occupied" | "all">("ready");
  const [query, setQuery] = useState("");
  const [queueOpen, setQueueOpen] = useState(false);
  const now = demoNow(s);
  const ready = s.rooms.filter((r) => isReady(s, r));
  const queued = s.rooms.filter((r) => r.queue);
  const list = s.rooms.filter((r) => {
    if (query && !r.number.includes(query.trim())) return false;
    if (filter === "ready") return isReady(s, r);
    if (filter === "notready") return !isReady(s, r) && r.occupancy === "VACANT";
    if (filter === "arrivals") return !!r.arrival;
    if (filter === "occupied") return r.occupancy === "OCCUPIED";
    return true;
  });
  const counts = {
    ready: ready.length,
    notready: s.rooms.filter((r) => !isReady(s, r) && r.occupancy === "VACANT").length,
    arrivals: s.rooms.filter((r) => r.arrival).length,
    occupied: s.rooms.filter((r) => r.occupancy === "OCCUPIED").length,
    all: s.rooms.length,
  };
  const eta = (r: Room) => {
    const st = displayStatus(r, s.settings);
    if (st === "CLEANING") return `~${Math.max(1, stdMinutes(r) - (activeMinutes(s, r) ?? 0)) + (s.settings.inspectionRequired ? 10 : 0)} min`;
    if (st === "AWAITING_INSPECTION") return "~10 min";
    return null;
  };
  return (
    <>

      {queued.length ? (
        <section className="content-panel queue-panel">
          <div className="section-heading"><div><h2>Guests waiting</h2><p>Queued rooms jump to #1 for the attendant; you'll be notified when READY.</p></div></div>
          <div className="queue-list">
            {queued.map((r) => (
              <button type="button" key={r.number} onClick={() => openRoom(r.number)}>
                <Zap aria-hidden="true" />
                <div><strong>{r.queue?.guest}</strong><span>Room {r.number} · waiting {Math.max(0, now - (r.queue?.at ?? now))} min</span></div>
                <StatusChip status={displayStatus(r, s.settings)} />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <ArrivalsTimeline s={s} onOpen={openRoom} />

      <section className="content-panel">
        <div className="section-heading">
          <div><h2>Rooms</h2><p><strong>{counts.ready}</strong> ready for check-in (internal) · {counts.notready} vacant but not ready · {counts.occupied} occupied. Open a room to check in, check out or see why it isn&apos;t ready.</p></div>
          <div className="toolbar-actions">
            <label className="room-search fd-search"><Search aria-hidden="true" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Room #" inputMode="numeric" /></label>
            <Button variant="hmsPrimary" size="hmsMd" onClick={() => setQueueOpen(true)}><Plus aria-hidden="true" /> Queue guest</Button>
          </div>
        </div>
        <div className="segmented segmented-inline fd-tabs" role="radiogroup" aria-label="Show rooms">
          {(["ready", "notready", "arrivals", "occupied", "all"] as const).map((k) => (
            <button type="button" role="radio" aria-checked={filter === k} key={k} className={cn(filter === k && "segmented-on")} onClick={() => setFilter(k)}>
              {{ ready: "Ready", notready: "Not ready", arrivals: "Arrivals", occupied: "Occupied", all: "All" }[k]} <span className="fd-tab-count">{counts[k]}</span>
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <EmptyState title="No rooms in this view" action="Show all rooms" onAction={() => { setFilter("all"); setQuery(""); }} />
        ) : (
          <div className="frontdesk-grid">
            {list.map((room) => {
              const st = displayStatus(room, s.settings);
              const e = eta(room);
              return (
                <button type="button" key={room.number} className={cn("fd-tile", isReady(s, room) && "fd-tile-ready")} onClick={() => openRoom(room.number)}>
                  <strong><bdi>{room.number}</bdi></strong>
                  <span>{room.type} · {wingShort(room.floor)}</span>
                  <StatusChip status={st} />
                  {e ? <small>Ready in {e}</small> : null}
                  {room.arrival ? <small className="fd-guest">{room.arrival.guest} · {room.arrival.eta}</small> : room.guest ? <small className="fd-guest">{room.guest}</small> : null}
                  <RoomBadges room={room} showAnomaly={false} max={2} />
                </button>
              );
            })}
          </div>
        )}
      </section>
      <QueueGuestDialog open={queueOpen} onOpenChange={setQueueOpen} />
    </>
  );
}

/* ───────────────────────── Work orders ───────────────────────── */

export function WorkOrdersPage() {
  return (
    <DesktopShell title="Work Orders" eyebrow="Maintenance and room blocks">
      <WorkOrdersContent />
    </DesktopShell>
  );
}

function WorkOrdersContent() {
  const s = useHms();
  const { openRoom } = useDesktop();
  const [tab, setTab] = useState<"open" | "resolved" | "all">("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const now = demoNow(s);
  const list = s.workOrders.filter((w) => (tab === "open" ? ["OPEN", "ACCEPTED", "IN_PROGRESS"].includes(w.state) : tab === "resolved" ? ["RESOLVED", "VERIFIED"].includes(w.state) : true));
  return (
    <>
      <section className="content-panel">
        <div className="section-heading">
          <div><h2>Work orders</h2><p>P1 work orders keep the room Out of Order until a supervisor verifies the fix.</p></div>
          <div className="toolbar-actions">
            <div className="segmented segmented-inline">
              {(["open", "resolved", "all"] as const).map((t) => (
                <button type="button" key={t} className={cn(tab === t && "segmented-on")} onClick={() => setTab(t)}>{t[0]?.toUpperCase()}{t.slice(1)}</button>
              ))}
            </div>
            <Button variant="hmsPrimary" size="hmsLg" onClick={() => setNewOpen(true)}><Plus aria-hidden="true" /> New work order</Button>
          </div>
        </div>
        {list.length === 0 ? (
          <EmptyState title={tab === "open" ? "No open work orders" : "Nothing here yet"} action="New work order" onAction={() => setNewOpen(true)} />
        ) : (
          <div className="work-order-list">
            {list.map((order) => (
              <article key={order.id} className="wo-row" onClick={() => setOpenId(order.id)}>
                <span className={cn("priority", order.urgency === "P1" && "priority-critical")}>{order.urgency}</span>
                <div>
                  <h3>{order.id} · {order.category} — {order.description}</h3>
                  <p>
                    <button type="button" className="link-btn" onClick={(e) => { e.stopPropagation(); openRoom(order.room); }}>Room {order.room}</button> · {order.assignee ? staffName(s, order.assignee) : "Unassigned"} · opened {fmtTime(order.createdAt)} ({fmtDuration(now - order.createdAt)} ago)
                  </p>
                </div>
                <strong className={cn("wo-state", `wo-${order.state.toLowerCase()}`)}>{order.state === "OPEN" && order.urgency === "P1" && now - order.createdAt >= s.settings.p1AcceptMin ? "SLA breached" : order.state.replace("_", " ").toLowerCase()}</strong>
                <Button variant="hmsGhost" size="hmsIcon" aria-label={`Open ${order.id}`} onClick={(e) => { e.stopPropagation(); setOpenId(order.id); }}><ArrowUpRight aria-hidden="true" /></Button>
              </article>
            ))}
          </div>
        )}
      </section>
      <WorkOrderDialog id={openId} onClose={() => setOpenId(null)} />
      <NewWorkOrderDialog open={newOpen} onOpenChange={setNewOpen} />
    </>
  );
}

/* ───────────────────────── Escalations ───────────────────────── */

export function EscalationsPage() {
  return (
    <DesktopShell title="Escalation Center" eyebrow="SLA breaches and operational risks">
      <EscalationsContent />
    </DesktopShell>
  );
}

function EscalationsContent() {
  const s = useHms();
  const { openRoom } = useDesktop();
  const actor = actorFor(s, "desktop");
  const [woId, setWoId] = useState<string | null>(null);
  const list = escalations(s);
  const signals = useMemo(() => s.rooms.filter((r) => r.anomalies.length), [s]);
  return (
    <>
      <section className="alert-list">
        {list.length === 0 ? <div className="content-panel"><EmptyState title="No open escalations — all SLAs on track" /></div> : null}
        {list.map((alert) => (
          <article className={cn("alert-item", `alert-${alert.tone}`)} key={alert.id}>
            {alert.kind === "DND_WELFARE" ? <Moon aria-hidden="true" /> : alert.kind === "P1_UNACCEPTED" ? <Wrench aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
            <div>
              <h2>{alert.title}</h2>
              <p>{alert.detail}</p>
            </div>
            <div className="alert-actions">
              <Button variant="hmsGhost" size="hmsMd" onClick={() => openRoom(alert.room)}>Room {alert.room}</Button>
              <Button variant="hmsGhost" size="hmsMd" onClick={() => { hms.resolveEscalation(alert.id, actor, `Escalation acknowledged · ${alert.title}`, alert.room); toast.success("Escalation acknowledged", { duration: 2500 }); }}>
                Acknowledge
              </Button>
              <EscalationAction alert={alert} s={s} onAssign={setWoId} />
            </div>
          </article>
        ))}
      </section>
      <section className="content-panel mt-5">
        <div className="section-heading"><div><h2>Accountability signals</h2><p>Automatically raised when work looks too fast, bulk-ticked, or synced with conflicts. Never blocks the attendant.</p></div></div>
        {signals.length === 0 ? <EmptyState title="No signals today" /> : (
          <div className="signal-list">
            {signals.map((r) => (
              <button type="button" key={r.number} onClick={() => openRoom(r.number)}>
                <AlertTriangle aria-hidden="true" />
                <div><strong>Room {r.number} · {staffName(s, r.attendant)}</strong><span>{r.anomalies.map((a) => anomalyLabel[a]).join(" · ")}</span></div>
                <span>{fmtDuration(activeMinutes(s, r))} vs std {stdMinutes(r)} min · {checklistProgress(s, r).done}/{checklistProgress(s, r).total} items</span>
              </button>
            ))}
          </div>
        )}
      </section>
      <WorkOrderDialog id={woId} onClose={() => setWoId(null)} />
    </>
  );
}

/* ───────────────────────── Settings ───────────────────────── */

export function SettingsPage() {
  return (
    <DesktopShell title="Settings" eyebrow="Property and housekeeping configuration">
      <SettingsContent />
    </DesktopShell>
  );
}

function SettingsContent() {
  const s = useHms();
  const [open, setOpen] = useState<SettingsKey | null>(null);
  const cards: { key: SettingsKey; title: string; copy: string; icon: typeof ClipboardList }[] = [
    { key: "property", title: "Property", copy: `5 wings · ${s.rooms.length} keys · 4 room types · ${property.location}`, icon: CalendarDays },
    { key: "checklists", title: "Checklists", copy: `Departure ${s.templates.departure.length} items · Stayover ${s.templates.stayover.length} items`, icon: ClipboardList },
    { key: "rules", title: "Inspection & SLA rules", copy: `Pass ${s.settings.passScore}% · ${s.settings.inspectionRequired ? "every room inspected" : "inspection optional"} · queue SLA ${s.settings.queueSlaMin} min`, icon: ShieldCheck },
    { key: "users", title: "Users & roles", copy: `${s.staff.length} active team members across 6 roles`, icon: Users },
  ];
  return (
    <>
      <section className="settings-grid">
        {cards.map((c) => (
          <button type="button" className="settings-card" key={c.key} onClick={() => setOpen(c.key)}>
            <c.icon aria-hidden="true" />
            <h2>{c.title}</h2>
            <p>{c.copy}</p>
            <span className="settings-open">Open settings <ArrowUpRight aria-hidden="true" /></span>
          </button>
        ))}
      </section>
      <SettingsDialog which={open} onClose={() => setOpen(null)} />
    </>
  );
}
