import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Bell, ChevronRight, CircleUserRound, Delete, Languages, LogOut, ShieldCheck, Wifi, Wrench, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { wingLabel, wingShort, fmtDuration, fmtTime, personaStaff, type Room, roleLabel } from "@/lib/demo-data";
import {
  activeMinutes,
  checklistProgress,
  demoNow,
  displayStatus,
  hms,
  lastInspection,
  roomCredits,
  staffName,
  useHms,
} from "@/lib/hms-store";
import { cn } from "@/lib/utils";
import { EmptyState } from "./demo-states";
import { useMobileAlerts } from "./mobile-alerts";
import { MobileSheet, MobileShell, mobilePersonaHome, useMobilePersona } from "./mobile-shell";
import { RoomBadges, RoomCard, statusClass } from "./room-components";
import { StatusChip } from "./status";

/** Priority order for an attendant's list: queue → re-clean → VIP → in progress → to do → waiting → done. */
function priority(r: Room) {
  if (r.hk === "INSPECTED") return 90;
  if (r.hk === "CLEAN") return 80;
  if (r.dnd) return 70;
  if (r.queue) return 0;
  if (r.taskType === "RECLEAN") return 10;
  if (r.vip) return 20;
  if (r.hk === "IN_PROGRESS" || r.hk === "PAUSED") return 30;
  return r.taskType === "STAYOVER" ? 50 : 40;
}

/* ───────────── Attendant: My Rooms ───────────── */

export function MobileRoomsPage() {
  const s = useHms();
  const [filter, setFilter] = useState<"todo" | "done" | "issues">("todo");
  const me = personaStaff.Attendant;
  const mine = s.rooms.filter((r) => r.attendant === me).sort((a, b) => priority(a) - priority(b) || a.number.localeCompare(b.number));
  const done = mine.filter((r) => r.hk === "CLEAN" || r.hk === "INSPECTED");
  const issues = mine.filter((r) => r.dnd || r.block || r.taskType === "RECLEAN" || r.refused);
  const todo = mine.filter((r) => !done.includes(r) && !r.block);
  const list = filter === "todo" ? todo : filter === "done" ? done : issues;
  const pct = mine.length ? Math.round((done.length / mine.length) * 100) : 0;
  return (
    <MobileShell title="My Rooms">
      <div className="mobile-sync"><Wifi aria-hidden="true" /> Saved on this device <span>{done.length} of {mine.length} complete</span></div>
      <div className="mobile-progress-summary"><div><span style={{ inlineSize: `${pct}%` }} /></div><b>{pct}%</b></div>
      <div className="m-chips" role="tablist">
        {([["todo", "To do", todo.length], ["done", "Done", done.length], ["issues", "Issues", issues.length]] as const).map(([k, label, n]) => (
          <button type="button" role="tab" aria-selected={filter === k} key={k} className={cn("m-chip", filter === k && "m-chip-on")} onClick={() => setFilter(k)}>
            {label} <b>{n}</b>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState title={filter === "todo" ? "All your rooms are done 🎉" : filter === "done" ? "Nothing finished yet" : "No issues on your rooms"} />
      ) : (
        <div className="mobile-room-list">{list.map((room) => <RoomCard room={room} s={s} key={room.number} />)}</div>
      )}
    </MobileShell>
  );
}

/* ───────────── Alerts ───────────── */

export function MobileAlertsPage() {
  const alerts = useMobileAlerts();
  return (
    <MobileShell title="Alerts">
      {alerts.length === 0 ? (
        <EmptyState title="You're all caught up" />
      ) : (
        <div className="mobile-alert-list">
          {alerts.map((alert) => (
            <Link to={alert.link.to as never} params={alert.link.params as never} className={cn("mobile-alert", `alert-${alert.tone}`)} key={alert.id}>
              {alert.tone === "error" ? <AlertTriangle aria-hidden="true" /> : alert.tone === "warning" ? <Zap aria-hidden="true" /> : <Bell aria-hidden="true" />}
              <div><h2>{alert.title}</h2><p>{alert.detail}</p></div>
              <ChevronRight aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
    </MobileShell>
  );
}

/* ───────────── Me ───────────── */

export function MobileMePage() {
  const s = useHms();
  const persona = useMobilePersona();
  const navigate = useNavigate();
  const id = personaStaff[persona];
  const person = s.staff.find((p) => p.id === id);
  let stats: [string, string][] = [];
  if (persona === "Attendant") {
    const mine = s.rooms.filter((r) => r.attendant === id);
    const done = mine.filter((r) => r.hk === "CLEAN" || r.hk === "INSPECTED");
    const ins = mine.flatMap((r) => r.inspections);
    stats = [[`${done.length}/${mine.length}`, "Rooms done"], [mine.reduce((a, r) => a + roomCredits(r), 0).toFixed(1), "Credits"], [ins.length ? `${Math.round((ins.filter((i) => i.result === "PASSED").length / ins.length) * 100)}%` : "—", "Pass rate"]];
  } else if (persona === "Supervisor") {
    const mine = s.rooms.flatMap((r) => r.inspections).filter((i) => i.by === id);
    const avg = mine.length ? Math.round(mine.reduce((a, i) => a + i.score, 0) / mine.length) : 0;
    stats = [[String(mine.length), "Inspected"], [String(mine.filter((i) => i.result === "FAILED").length), "Rejected"], [mine.length ? `${avg}%` : "—", "Avg. score"]];
  } else {
    const mine = s.workOrders.filter((w) => w.assignee === id);
    stats = [[String(mine.filter((w) => ["RESOLVED", "VERIFIED"].includes(w.state)).length), "Resolved"], [String(mine.filter((w) => !["RESOLVED", "VERIFIED"].includes(w.state)).length), "Open"], [String(mine.filter((w) => w.urgency === "P1").length), "P1 jobs"]];
  }
  return (
    <MobileShell title="Me">
      <div className="mobile-profile">
        <div className="profile-avatar">{person?.initials}</div>
        <h2>{person?.name}</h2>
        <p>{person ? roleLabel[person.role] : ""} · Morning shift · started 07:30</p>
      </div>
      <div className="mobile-stats">
        {stats.map(([v, l]) => <article key={l}><strong>{v}</strong><span>{l}</span></article>)}
      </div>
      <div className="mobile-settings-list">
        <button type="button" onClick={() => toast.info("All changes are saved on this device.", { duration: 2500 })}><Wifi aria-hidden="true" /> Sync status <span>On device · {fmtTime(demoNow(s))}</span></button>
        <button type="button" onClick={() => toast.info("Arabic is coming soon", { duration: 2500 })}><Languages aria-hidden="true" /> Language <span>English</span></button>
        <button type="button" onClick={() => { toast.success("Shift ended · see you tomorrow", { duration: 2500 }); void navigate({ to: "/m/login" }); }}><LogOut aria-hidden="true" /> End shift <ChevronRight aria-hidden="true" /></button>
      </div>
    </MobileShell>
  );
}

/* ───────────── Supervisor: inspection queue ───────────── */

export function MobileInspectionsPage() {
  const s = useHms();
  const me = s.staff.find((p) => p.id === personaStaff.Supervisor);
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const now = demoNow(s);
  const list = s.rooms
    .filter((r) => r.hk === "CLEAN" && (scope === "all" || (me?.floors ?? []).includes(r.floor)))
    .sort((a, b) => Number(!!b.queue) - Number(!!a.queue) || Number(!!b.vip) - Number(!!a.vip) || (a.completedAt ?? 0) - (b.completedAt ?? 0));
  const queued = list.filter((r) => r.queue).length;
  return (
    <MobileShell title="Inspection Queue">
      {queued ? <div className="mobile-callout"><Zap aria-hidden="true" /> {queued} queue room{queued > 1 ? "s" : ""} — guest waiting, inspect first.</div> : null}
      <div className="m-chips">
        <button type="button" className={cn("m-chip", scope === "mine" && "m-chip-on")} onClick={() => setScope("mine")}>My wings</button>
        <button type="button" className={cn("m-chip", scope === "all" && "m-chip-on")} onClick={() => setScope("all")}>All wings</button>
      </div>
      {list.length === 0 ? (
        <EmptyState title="All caught up 🎉 No rooms waiting" />
      ) : (
        <div className="mobile-room-list">
          {list.map((room) => {
            const left = room.completedAt !== undefined ? room.completedAt + s.settings.queueSlaMin - now : 0;
            const p = checklistProgress(s, room);
            return (
              <Link to="/m/inspections/$roomId" params={{ roomId: room.number }} className="inspection-card" key={room.number}>
                <div>
                  <span>{room.type} · {wingShort(room.floor)}</span>
                  <h2><bdi>{room.number}</bdi></h2>
                </div>
                <StatusChip status={displayStatus(room, s.settings)} />
                <p className="insp-meta">
                  {staffName(s, room.attendant)} · {fmtDuration(activeMinutes(s, room))} · {p.done}/{p.total} items{p.skipped ? ` (${p.skipped} skipped)` : ""}
                </p>
                <RoomBadges room={room} />
                {room.queue ? <p className={cn("sla-line", left <= 0 && "sla-breached")}>⏱ {left > 0 ? `${left} min left for ${room.queue.guest}` : `SLA breached ${-left} min ago`}</p> : null}
                <span className="m-card-cta">Inspect <ChevronRight aria-hidden="true" /></span>
              </Link>
            );
          })}
        </div>
      )}
    </MobileShell>
  );
}

/* ───────────── Supervisor: floor board ───────────── */

export function MobileFloorPage() {
  const s = useHms();
  const me = s.staff.find((p) => p.id === personaStaff.Supervisor);
  const [floor, setFloor] = useState(me?.floors?.[0] ?? 1);
  const [open, setOpen] = useState<string | null>(null);
  const rooms = s.rooms.filter((r) => r.floor === floor);
  const room = s.rooms.find((r) => r.number === open);
  const actor = personaStaff.Supervisor;
  const attendants = s.staff.filter((p) => p.role === "ATTENDANT");
  const wo = room ? s.workOrders.find((w) => w.room === room.number && w.state !== "VERIFIED") : undefined;
  return (
    <MobileShell title="Wings">
      <div className="m-chips">
        {[1, 2, 3, 4, 5].map((f) => (
          <button type="button" key={f} className={cn("m-chip", floor === f && "m-chip-on")} onClick={() => setFloor(f)}>{wingShort(f)}</button>
        ))}
      </div>
      <div className="mobile-floor-grid">
        {rooms.map((r) => {
          const st = displayStatus(r, s.settings);
          return (
            <button type="button" className={cn("m-floor-tile", statusClass[st])} key={r.number} onClick={() => setOpen(r.number)}>
              <strong><bdi>{r.number}</bdi></strong>
              <StatusChip status={st} compact />
              <span>{r.attendant ? s.staff.find((p) => p.id === r.attendant)?.initials : "—"}{r.queue ? " · ⚡" : ""}{r.anomalies.length ? " · ⚠" : ""}</span>
            </button>
          );
        })}
      </div>
      <MobileSheet open={!!room} onClose={() => setOpen(null)} title={room ? `Room ${room.number}` : ""}>
        {room ? (
          <div className="m-sheet-stack">
            <div className="m-row-between"><span>{room.type} · {wingLabel(room.floor)}</span><StatusChip status={displayStatus(room, s.settings)} /></div>
            <dl className="m-facts">
              <div><dt>Attendant</dt><dd>{staffName(s, room.attendant)}</dd></div>
              <div><dt>Checklist</dt><dd>{checklistProgress(s, room).done}/{checklistProgress(s, room).total}</dd></div>
              <div><dt>Time</dt><dd>{fmtDuration(activeMinutes(s, room))}</dd></div>
              <div><dt>Last inspection</dt><dd>{lastInspection(room) ? `${lastInspection(room)?.result === "PASSED" ? "✔" : "✘"} ${lastInspection(room)?.score}%` : "—"}</dd></div>
            </dl>
            {room.block ? <p className="m-note m-note-blocked"><Wrench aria-hidden="true" /> {room.block.reason}</p> : null}
            {room.hk === "CLEAN" ? (
              <Button asChild variant="hmsPrimary" size="hmsXl"><Link to="/m/inspections/$roomId" params={{ roomId: room.number }}><ShieldCheck aria-hidden="true" /> Inspect now</Link></Button>
            ) : null}
            {wo?.state === "RESOLVED" ? (
              <Button variant="hmsPrimary" size="hmsXl" onClick={() => { hms.woVerify(wo.id, actor); toast.success(`Room ${room.number} released — post-repair clean queued`, { duration: 3000 }); setOpen(null); }}>
                Verify repair & release
              </Button>
            ) : null}
            {room.dnd ? (
              <Button variant="hmsSecondary" size="hmsLg" onClick={() => { hms.clearDnd(room.number, actor, "Welfare check done by supervisor"); toast.success("DND cleared", { duration: 2500 }); }}>Welfare check done · clear DND</Button>
            ) : null}
            {!room.block ? (
              <label className="m-field">
                Reassign attendant
                <select value={room.attendant ?? ""} onChange={(e) => { hms.assignRoom(room.number, e.target.value || null, actor); toast.success(e.target.value ? `Assigned to ${staffName(s, e.target.value)}` : "Unassigned", { duration: 2500 }); }}>
                  <option value="">Unassigned</option>
                  {attendants.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>
            ) : null}
            {room.hk !== "DIRTY" && room.occupancy === "VACANT" && !room.block ? (
              <Button variant="hmsGhost" size="hmsLg" onClick={() => { hms.resetStatus(room.number, actor, "Supervisor reset"); toast.success("Reset to dirty", { duration: 2500 }); }}>Reset to dirty</Button>
            ) : null}
          </div>
        ) : null}
      </MobileSheet>
    </MobileShell>
  );
}

/* ───────────── Engineer: jobs ───────────── */

export function MobileWorkOrdersPage() {
  const s = useHms();
  const me = personaStaff.Engineer;
  const [tab, setTab] = useState<"mine" | "open" | "done">("mine");
  const list = s.workOrders.filter((w) =>
    tab === "mine" ? w.assignee === me && !["RESOLVED", "VERIFIED"].includes(w.state) : tab === "open" ? !w.assignee && w.state === "OPEN" : ["RESOLVED", "VERIFIED"].includes(w.state),
  );
  return (
    <MobileShell title="My Jobs">
      <div className="m-chips">
        {([["mine", "Assigned to me"], ["open", "Unassigned"], ["done", "Resolved"]] as const).map(([k, l]) => (
          <button type="button" key={k} className={cn("m-chip", tab === k && "m-chip-on")} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState title={tab === "mine" ? "No jobs assigned to you" : tab === "open" ? "No unassigned jobs" : "Nothing resolved yet"} />
      ) : (
        <div className="mobile-room-list">
          {list.map((order) => (
            <Link to="/m/work-orders/$woId" params={{ woId: order.id }} className="mobile-job-card" key={order.id}>
              <span className={cn("priority", order.urgency === "P1" && "priority-critical")}>{order.urgency}</span>
              <div><h2>{order.category} · Room <bdi>{order.room}</bdi></h2><p>{order.description}</p><p className="m-muted">{order.id} · {order.state.replace("_", " ").toLowerCase()} · opened {fmtTime(order.createdAt)}</p></div>
              <ChevronRight aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
    </MobileShell>
  );
}

/* ───────────── Login (production design preview) ───────────── */

export function MobileLoginPage() {
  const s = useHms();
  const navigate = useNavigate();
  const [who, setWho] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const people = s.staff.filter((p) => ["ATTENDANT", "SUPERVISOR", "ENGINEER"].includes(p.role)).slice(0, 12);
  const person = people.find((p) => p.id === who);
  const press = (d: string) => {
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4 && person) {
      const persona = person.role === "SUPERVISOR" ? "Supervisor" : person.role === "ENGINEER" ? "Engineer" : "Attendant";
      hms.setPersona("mobile", persona);
      toast.success(`Welcome, ${person.name.split(" ")[0]} · shift started`, { duration: 3500 });
      void navigate({ to: mobilePersonaHome[persona] });
    }
  };
  return (
    <MobileShell title="Shift sign-in">
      <div className="mobile-login">
        {!person ? (
          <>
            <p>Tap your photo to start your shift</p>
            <div className="avatar-grid">
              {people.map((p) => (
                <button type="button" key={p.id} onClick={() => { setWho(p.id); setPin(""); }}>
                  <span>{p.initials}</span>
                  <b>{p.name.split(" ")[0]}</b>
                  <small>{roleLabel[p.role].split(" ").slice(-1)[0]}</small>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="pin-pad">
            <div className="profile-avatar">{person.initials}</div>
            <h2>{person.name}</h2>
            <p>Enter your 4-digit PIN</p>
            <div className="pin-dots" aria-label={`${pin.length} of 4 digits`}>{[0, 1, 2, 3].map((i) => <i key={i} className={cn(i < pin.length && "on")} />)}</div>
            <div className="pin-keys">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => <button type="button" key={d} onClick={() => press(d)}>{d}</button>)}
              <button type="button" onClick={() => setWho(null)} aria-label="Back"><CircleUserRound aria-hidden="true" /></button>
              <button type="button" onClick={() => press("0")}>0</button>
              <button type="button" onClick={() => setPin((p) => p.slice(0, -1))} aria-label="Delete"><Delete aria-hidden="true" /></button>
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}

export function DesktopLoginPage() {
  const navigate = useNavigate();
  return (
    <div className="login-screen" data-platform="desktop">
      <form
        className="login-panel"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Signed in", { duration: 2500 });
          void navigate({ to: "/app/board" });
        }}
      >
        <h1>Welcome back</h1>
        <p>Sign in to Riwaq.</p>
        <label>Email<input type="email" placeholder="name@property.example" defaultValue="hessa@property.example" /></label>
        <label>Password<input type="password" placeholder="••••••••" defaultValue="riwaq1234" /></label>
        <Button type="submit" variant="hmsPrimary" size="hmsLg">Sign in</Button>
        <Link to="/app/board" className="login-skip">Back to dashboard</Link>
      </form>
    </div>
  );
}
