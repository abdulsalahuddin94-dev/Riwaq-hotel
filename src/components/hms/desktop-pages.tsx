import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Footprints,
  Send,
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
} from "./msym";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { wingLabel, wingShort, fmtDuration, fmtTime, type GuestRequest, guestRequestLabel, personaStaff, property, type Room, type RoomStatus, statusMeta } from "@/lib/demo-data";
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
  QueueGuestDialog,
  SendRequestDialog,
  PropertySettings,
  StaffDayDialog,
} from "./desktop-dialogs";
import { DesktopShell, useDesktop } from "./desktop-shell";
import { FloorBoard, RoomBadges, statusClass } from "./room-components";
import { ReportsContent } from "./reports-page";
import { NotificationBell } from "./notifications";
import { StatusChip } from "./status";
import { photos } from "./illustrations";

const KPI_STATUSES: { status: RoomStatus; label: string; helper: (n: number, s: ReturnType<typeof useHms>) => string; group?: RoomStatus[] }[] = [
  { status: "READY", label: "Ready", helper: () => "trusted for check-in" },
  { status: "AWAITING_INSPECTION", label: "Inspect", helper: () => "awaiting supervisor" },
  { status: "CLEANING", label: "Cleaning", helper: (_, s) => `${s.rooms.filter((r) => r.hk === "PAUSED").length} paused` },
  { status: "DIRTY", label: "Dirty", helper: () => "not started" },
  { status: "BLOCKED_OOO", label: "Blocked", helper: () => "OOO / OOS", group: ["BLOCKED_OOO", "BLOCKED_OOS"] },
];

const DAY = "Wednesday, 23 September";

/* ───────────────────────── Welcome hero ───────────────────────── */

function WelcomeHero() {
  const s = useHms();
  const me = s.staff.find((p) => p.id === personaStaff[s.desktopPersona as keyof typeof personaStaff]) ?? s.staff.find((p) => p.id === personaStaff.Manager);
  const now = demoNow(s);
  const sellable = s.rooms.filter((r) => !r.block);
  const ready = s.rooms.filter((r) => isReady(s, r)).length;
  const pct = sellable.length ? Math.round((ready / sellable.length) * 100) : 0;
  const waiting = s.rooms.filter((r) => r.queue).length;
  const arrivals = s.rooms.filter((r) => r.arrival).length;
  const hour = Math.floor(now / 60);
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <section className="welcome-hero" aria-label="Today at a glance">
      <img src={photos.majlisLuxury} alt="" className="welcome-scene" width={1920} height={768} />
      <div className="welcome-copy">
        <span>{hello},</span>
        <h2>{me?.name ?? "Welcome back"}</h2>
        <p className="welcome-date"><CalendarDays aria-hidden="true" /> {DAY}<span aria-hidden="true">·</span><span>Live · {fmtTime(now)} <small>(simulated)</small></span></p>
        <p>
          {waiting ? <><b>{waiting} guest{waiting > 1 ? "s" : ""}</b> waiting in the lobby. </> : null}
          <b>{arrivals}</b> arrivals still need a room today.
        </p>
      </div>
      <div className="welcome-gauge" role="img" aria-label={`${ready} of ${sellable.length} sellable rooms ready, ${pct}%`}>
        <svg viewBox="0 0 128 128" aria-hidden="true">
          <defs>
            <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--md-sky-soft)" />
              <stop offset="1" stopColor="var(--md-sky)" />
            </linearGradient>
          </defs>
          <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="10" />
          <circle cx="64" cy="64" r={r} fill="none" stroke="url(#gauge-grad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} transform="rotate(-90 64 64)" />
        </svg>
        <div><CheckCircle2 aria-hidden="true" /><strong>{pct}%</strong><small>{ready} of {sellable.length} rooms ready</small></div>
      </div>
      <NotificationBell onPhoto />
    </section>
  );
}

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
  const staff = s.staff.filter((p) => p.active !== false && p.role === "ATTENDANT");

  return (
    <>
      <WelcomeHero />

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
            <div><h2>Rooms by wing</h2><p>Open a room for its status, who cleaned it and the supervisor's check.</p></div>
            <div className="toolbar-actions">
              <Button variant={showFilters || activeFilters ? "hmsSecondary" : "hmsGhost"} size="hmsMd" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
                <Filter aria-hidden="true" /> Filters{activeFilters ? ` · ${activeFilters}` : ""}
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
  const attendants = s.staff.filter((p) => p.active !== false && p.role === "ATTENDANT");
  const supervisors = s.staff.filter((p) => p.active !== false && p.role === "SUPERVISOR");
  const signals = s.rooms.filter((r) => r.anomalies.length);
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
                <p>{(p.floors ?? []).map(wingShort).join(" · ")}</p>
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
      <section className="content-panel mt-5">
        <div className="section-heading"><div><h2>Accountability signals</h2><p>Raised automatically when a room looks too fast or bulk-ticked. Never blocks the attendant; review with them.</p></div></div>
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
  const attendants = s.staff.filter((p) => p.active !== false && p.role === "ATTENDANT");
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
    <DesktopShell title="Front Desk" eyebrow="Room status confirmed by housekeeping · send requests to the floor supervisor">
      <FrontDeskContent />
    </DesktopShell>
  );
}

const REQUEST_STATE: Record<GuestRequest["status"], { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "Sent", icon: Clock, className: "req-pending" },
  acknowledged: { label: "On the way", icon: Footprints, className: "req-ack" },
  completed: { label: "Done", icon: CheckCircle2, className: "req-done" },
  cancelled: { label: "Cancelled", icon: X, className: "req-cancelled" },
};

/** Reception needs one answer per room: can I give it to a guest? Details (checklist, timings, signals) stay with the supervisor. */
function FrontDeskContent() {
  const s = useHms();
  const { openRoom } = useDesktop();
  const actor = actorFor(s, "desktop");
  const [filter, setFilter] = useState<"ready" | "notready" | "arrivals" | "occupied" | "all">("ready");
  const [query, setQuery] = useState("");
  const [queueOpen, setQueueOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const now = demoNow(s);
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
    ready: s.rooms.filter((r) => isReady(s, r)).length,
    notready: s.rooms.filter((r) => !isReady(s, r) && r.occupancy === "VACANT").length,
    arrivals: s.rooms.filter((r) => r.arrival).length,
    occupied: s.rooms.filter((r) => r.occupancy === "OCCUPIED").length,
    all: s.rooms.length,
  };
  const requests = s.requests.filter((q) => q.status !== "cancelled" && (q.status !== "completed" || (q.completedAt ?? 0) >= now - 120));
  return (
    <>
      <div className="fd-layout">
        <section className="content-panel">
          <div className="section-heading">
            <div><h2>Rooms</h2><p><strong>{counts.ready}</strong> ready for check-in · {counts.notready} vacant, not ready yet · {counts.occupied} occupied</p></div>
            <div className="toolbar-actions">
              <label className="room-search fd-search"><Search aria-hidden="true" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Room #" inputMode="numeric" aria-label="Find a room" /></label>
              <Button variant="hmsSecondary" size="hmsMd" onClick={() => setQueueOpen(true)}><Zap aria-hidden="true" /> Guest waiting</Button>
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
                return (
                  <button type="button" key={room.number} className={cn("fd-tile", isReady(s, room) && "fd-tile-ready")} onClick={() => openRoom(room.number)}>
                    <strong><bdi>{room.number}</bdi>{room.queue ? <Zap aria-label="Guest waiting" className="fd-tile-queue" /> : null}</strong>
                    <span>{room.type} · {wingShort(room.floor)}</span>
                    <StatusChip status={st} />
                    {room.arrival ? <small className="fd-guest">{room.arrival.guest} · {room.arrival.eta}</small> : room.guest ? <small className="fd-guest">{room.guest}</small> : null}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="fd-side">
          {queued.length ? (
            <section className="content-panel queue-panel">
              <div className="section-heading"><div><h2>Guests waiting</h2><p>Their room is cleaned first. The bell tells you when it's ready.</p></div></div>
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
          <section className="content-panel">
            <div className="section-heading">
              <div><h2>Requests to housekeeping</h2><p>Sent to the floor supervisor's phone.</p></div>
              <Button variant="hmsPrimary" size="hmsMd" onClick={() => setRequestOpen(true)}><Send aria-hidden="true" /> New request</Button>
            </div>
            {requests.length === 0 ? (
              <EmptyState title="No requests today" action="New request" onAction={() => setRequestOpen(true)} />
            ) : (
              <ul className="request-list">
                {requests.map((q) => {
                  const meta = REQUEST_STATE[q.status];
                  const Icon = meta.icon;
                  return (
                    <li key={q.id}>
                      <button type="button" className="link-btn request-room" onClick={() => openRoom(q.room)}>{q.room}</button>
                      <div>
                        <strong>{guestRequestLabel[q.type]}{q.urgent ? " · guest waiting" : ""}</strong>
                        <span>{q.note ? `${q.note} · ` : ""}{staffName(s, q.assignedTo)} · {fmtTime(q.requestedAt)}</span>
                      </div>
                      <span className={cn("request-state", meta.className)}><Icon aria-hidden="true" /> {meta.label}</span>
                      {q.status === "pending" ? (
                        <Button variant="hmsGhost" size="hmsSm" onClick={() => { hms.setRequestStatus(q.id, "cancelled", actor); toast.success("Request cancelled", { duration: 2000 }); }}>Cancel</Button>
                      ) : <span />}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
      <QueueGuestDialog open={queueOpen} onOpenChange={setQueueOpen} />
      <SendRequestDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </>
  );
}

/* ───────────────────────── Settings ───────────────────────── */

export function SettingsPage() {
  return (
    <DesktopShell title="Settings" eyebrow="Property">
      <SettingsContent />
    </DesktopShell>
  );
}

function SettingsContent() {
  const s = useHms();
  return (
    <section className="content-panel">
      <div className="section-heading">
        <div>
          <h2>{property.name}</h2>
          <p>5 wings · {s.rooms.length} rooms · Standard, Deluxe and Suite. The same wings and room types as the staff app.</p>
        </div>
      </div>
      <PropertySettings />
    </section>
  );
}
