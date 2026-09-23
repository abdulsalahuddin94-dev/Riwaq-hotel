import { useState } from "react";
import { AlertTriangle, ArrowUpRight, CalendarDays, Download, Filter, Plus, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { alerts, kpis, rooms, staffProgress, statusMeta, timeline, workOrders } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState, SkeletonState } from "./demo-states";
import { DesktopShell } from "./desktop-shell";
import { FloorBoard } from "./room-components";
import { StatusChip } from "./status";

type DemoState = "default" | "loading" | "empty" | "error";

function StateToolbar({ state, onChange }: { state: DemoState; onChange: (state: DemoState) => void }) {
  return (
    <div className="state-toolbar" aria-label="Preview component states">
      <span>View state</span>
      {(["default", "loading", "empty", "error"] as DemoState[]).map((item) => (
        <Button key={item} variant={state === item ? "hmsSecondary" : "hmsGhost"} size="hmsSm" onClick={() => onChange(item)}>
          {item}
        </Button>
      ))}
    </div>
  );
}

export function BoardPage() {
  const [state, setState] = useState<DemoState>("default");
  return (
    <DesktopShell title="Live Board" eyebrow="Housekeeping · Wednesday, 23 September">
      <div className="page-actions-row">
        <div className="live-note"><span /> Live room readiness · updated just now</div>
        <div className="toolbar-actions">
          <StateToolbar state={state} onChange={setState} />
          <Button variant="hmsSecondary" size="hmsMd"><Filter aria-hidden="true" /> Filters</Button>
          <Button variant="hmsPrimary" size="hmsLg" onClick={() => toast.success("Assignment board updated", { duration: 3000 })}>
            <Sparkles aria-hidden="true" /> Auto-assign
          </Button>
        </div>
      </div>
      <section className="kpi-strip" aria-label="Housekeeping status summary">
        {kpis.map((kpi) => {
          const Icon = statusMeta[kpi.status].icon;
          return (
            <article className="kpi-item" key={kpi.label}>
              <div className={cn("kpi-icon", statusMeta[kpi.status].className)}><Icon aria-hidden="true" /></div>
              <div><strong>{kpi.value}</strong><span>{kpi.label}</span><small>{kpi.helper}</small></div>
            </article>
          );
        })}
        <article className="kpi-item occupancy-kpi"><div><strong>100</strong><span>Total rooms</span><small>5 floors · 16 staff</small></div></article>
      </section>
      <section className="board-panel">
        <div className="section-heading">
          <div><h2>Room status by floor</h2><p>Status is derived from occupancy, inspection, and active blocks.</p></div>
          <div className="board-legend">
            {["READY", "AWAITING_INSPECTION", "CLEANING", "DIRTY", "DND", "BLOCKED_OOO"].map((status) => (
              <StatusChip key={status} status={status as keyof typeof statusMeta} compact />
            ))}
          </div>
        </div>
        {state === "loading" ? <SkeletonState rows={5} /> : null}
        {state === "empty" ? <EmptyState title="No rooms match these filters" action="Clear filters" /> : null}
        {state === "error" ? <ErrorState title="Couldn't load the live board" onRetry={() => setState("default")} /> : null}
        {state === "default" ? <FloorBoard /> : null}
      </section>
    </DesktopShell>
  );
}

export function TeamPage() {
  return (
    <DesktopShell title="Team Progress" eyebrow="On shift · 8 attendants · 2 supervisors">
      <section className="content-panel">
        <div className="section-heading"><div><h2>Attendant progress</h2><p>Credits, current room, and accountability signals.</p></div><Button variant="hmsPrimary" size="hmsLg"><Users /> Manage shift</Button></div>
        <div className="data-table">
          <div className="table-row table-header"><span>Team member</span><span>Progress</span><span>Current room</span><span>Credits</span><span>Signals</span></div>
          {staffProgress.map((person) => (
            <div className="table-row" key={person.name}>
              <span className="staff-cell"><i>{person.initials}</i><b>{person.name}</b></span>
              <span><bdi>{person.done}/{person.assigned}</bdi><em><i style={{ inlineSize: `${Math.round((person.done / person.assigned) * 100)}%` }} /></em></span>
              <span><bdi>Room {person.currentRoom}</bdi></span><span>{person.credits}</span>
              <span>{person.anomalies ? <strong className="signal"><AlertTriangle /> {person.anomalies} anomaly</strong> : "Clear"}</span>
            </div>
          ))}
        </div>
      </section>
    </DesktopShell>
  );
}

export function AssignPage() {
  return (
    <DesktopShell title="Assignment Board" eyebrow="Morning shift · balanced by room credits">
      <div className="assignment-layout">
        <section className="content-panel"><div className="section-heading"><div><h2>Unassigned rooms</h2><p>22 rooms ready to distribute.</p></div><Button variant="hmsSecondary" size="hmsMd"><Sparkles /> Auto-assign</Button></div><div className="assignment-room-list">{rooms.filter((r) => r.status === "DIRTY").slice(0, 12).map((room) => <span key={room.number}><bdi>{room.number}</bdi><small>{room.type}</small></span>)}</div></section>
        <section className="content-panel"><div className="section-heading"><div><h2>Shift workload</h2><p>Drag rooms between attendants before publishing.</p></div><Button variant="hmsPrimary" size="hmsLg" onClick={() => toast.success("Assignments published", { duration: 3000 })}>Publish assignments</Button></div><div className="assignment-columns">{staffProgress.slice(0, 4).map((person) => <article key={person.name}><div className="staff-cell"><i>{person.initials}</i><b>{person.name}</b></div><strong>{person.credits} credits</strong><p>{person.assigned} rooms · {person.done} completed</p></article>)}</div></section>
      </div>
    </DesktopShell>
  );
}

export function ReportsPage() {
  return (
    <DesktopShell title="Reports" eyebrow="Daily accountability and compliance">
      <section className="reports-grid">{[
        ["Daily Room Status", "Room lifecycle, readiness, and blocking reasons"],
        ["Attendant Performance", "Credits, duration, completion, and anomalies"],
        ["Checklist Compliance", "Mandatory items, skips, and photo evidence"],
        ["Inspection Failures", "Scores, failed points, and re-clean outcomes"],
      ].map(([title, copy]) => <article className="report-card" key={title}><CalendarDays /><div><h2>{title}</h2><p>{copy}</p></div><Button variant="hmsSecondary" size="hmsMd"><Download /> Export</Button></article>)}</section>
    </DesktopShell>
  );
}

export function FrontDeskPage() {
  return (
    <DesktopShell title="Front Desk Board" eyebrow="Trusted readiness · no manual READY control">
      <section className="content-panel"><div className="section-heading"><div><h2>Ready for check-in</h2><p>34 vacant, inspected, and unblocked rooms.</p></div><Button variant="hmsPrimary" size="hmsLg" onClick={() => toast.success("Room added to priority queue", { duration: 3000 })}><Plus /> Queue guest</Button></div><div className="frontdesk-grid">{rooms.filter((room) => room.status === "READY").slice(0, 18).map((room) => <article key={room.number}><strong><bdi>{room.number}</bdi></strong><span>{room.type}</span><StatusChip status="READY" /></article>)}</div></section>
    </DesktopShell>
  );
}

export function WorkOrdersPage() {
  return (
    <DesktopShell title="Work Orders" eyebrow="Maintenance and room blocks">
      <section className="content-panel"><div className="section-heading"><div><h2>Open work orders</h2><p>P1 work orders prevent a room becoming READY.</p></div><Button variant="hmsPrimary" size="hmsLg"><Plus /> New work order</Button></div><div className="work-order-list">{workOrders.map((order, index) => <article key={order.room}><span className={cn("priority", index < 2 && "priority-critical")}>P{index < 2 ? "1" : "3"}</span><div><h3>{order.title}</h3><p>Room <bdi>{order.room}</bdi> · {order.owner}</p></div><strong>{order.status}</strong><Button variant="hmsGhost" size="hmsIcon" aria-label={`Open ${order.title}`}><ArrowUpRight /></Button></article>)}</div></section>
    </DesktopShell>
  );
}

export function EscalationsPage() {
  return (
    <DesktopShell title="Escalation Center" eyebrow="SLA breaches and operational risks">
      <section className="alert-list">{alerts.map((alert) => <article className={cn("alert-item", `alert-${alert.tone}`)} key={alert.title}><AlertTriangle /><div><h2>{alert.title}</h2><p>{alert.detail}</p></div><Button variant="hmsSecondary" size="hmsMd">Resolve</Button></article>)}</section>
    </DesktopShell>
  );
}

export function SettingsPage() {
  return (
    <DesktopShell title="Settings" eyebrow="Property and housekeeping configuration">
      <section className="settings-grid">{[["Property", "5 floors · 100 rooms · Africa/Cairo"], ["Checklists", "Departure, stayover, and re-clean templates"], ["Inspection rules", "Pass score 90% · every room inspected"], ["Users & roles", "16 active team members across 6 roles"]].map(([title, copy]) => <article key={title}><h2>{title}</h2><p>{copy}</p><Button variant="hmsSecondary" size="hmsMd">Open settings</Button></article>)}</section>
    </DesktopShell>
  );
}

export function TimelinePanel() {
  return <div className="timeline-list">{timeline.map((event) => { const Icon = event.icon; return <article key={`${event.time}-${event.action}`}><span><Icon /></span><div><h3>{event.action}</h3><p>{event.actor}</p></div><time>{event.time}</time></article>; })}</div>;
}
