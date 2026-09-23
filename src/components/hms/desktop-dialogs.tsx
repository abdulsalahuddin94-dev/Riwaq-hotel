import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Plus, Printer, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  fmtDuration,
  fmtTime,
  inspectionPoints,
  issueCategories,
  roleLabel,
  roomTypeInfo,
  type Role,
  type WorkOrder,
  zoneLabel,
  type Zone,
} from "@/lib/demo-data";
import {
  activeMinutes,
  actorFor,
  anomalyLabel,
  checklistProgress,
  displayStatus,
  type HmsState,
  hms,
  isReady,
  lastInspection,
  roomCredits,
  staffName,
  useHms,
} from "@/lib/hms-store";
import { cn } from "@/lib/utils";
import { StatusChip } from "./status";

/* ───────────── Queue guest ───────────── */

export function QueueGuestDialog({ open, onOpenChange, defaultRoom }: { open: boolean; onOpenChange: (open: boolean) => void; defaultRoom?: string }) {
  const s = useHms();
  const candidates = s.rooms.filter((r) => r.occupancy === "VACANT" && !r.block && !isReady(s, r) && !r.queue);
  const [room, setRoom] = useState(defaultRoom ?? "");
  const [guest, setGuest] = useState("");
  const selected = room || defaultRoom || candidates[0]?.number || "";
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!guest.trim()) {
      toast.error("Enter the guest name", { duration: 3000 });
      return;
    }
    hms.queueGuest(selected, guest.trim(), actorFor(s, "desktop"));
    toast.success(`${guest.trim()} queued for room ${selected} — attendant alerted`, { duration: 3500 });
    setGuest("");
    setRoom("");
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-platform="desktop" className="hms-dialog">
        <DialogHeader>
          <DialogTitle>Queue a waiting guest</DialogTitle>
          <DialogDescription>The room jumps to #1 on the attendant's list and the supervisor gets a {s.settings.queueSlaMin}-min inspection SLA.</DialogDescription>
        </DialogHeader>
        <form className="form-grid" onSubmit={submit}>
          <label>
            Guest name
            <input autoFocus value={guest} onChange={(e) => setGuest(e.target.value)} placeholder="e.g. Mr. Adam Fouad" />
          </label>
          <label>
            Room (vacant, not ready)
            <select value={selected} onChange={(e) => setRoom(e.target.value)}>
              {candidates.map((r) => (
                <option key={r.number} value={r.number}>
                  {r.number} · {r.type} · {displayStatus(r, s.settings).replace(/_/g, " ").toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <DialogFooter>
            <Button type="button" variant="hmsGhost" size="hmsMd" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="hmsPrimary" size="hmsMd" disabled={!selected}>Queue guest</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────── Work order detail ───────────── */

const woStateLabel: Record<WorkOrder["state"], string> = {
  OPEN: "Open",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved · verify",
  VERIFIED: "Verified · closed",
};

export function WorkOrderDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const s = useHms();
  const wo = s.workOrders.find((w) => w.id === id);
  const [resolution, setResolution] = useState("");
  const actor = actorFor(s, "desktop");
  const engineers = s.staff.filter((p) => p.role === "ENGINEER");
  return (
    <Dialog open={!!wo} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-platform="desktop" className="hms-dialog">
        {wo ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {wo.id} · {wo.urgency} {wo.category}
              </DialogTitle>
              <DialogDescription>
                Room {wo.room} · reported by {staffName(s, wo.reportedBy)} at {fmtTime(wo.createdAt)}
              </DialogDescription>
            </DialogHeader>
            <div className="wo-steps">
              {(["OPEN", "ACCEPTED", "IN_PROGRESS", "RESOLVED", "VERIFIED"] as const).map((st, i, arr) => (
                <span key={st} className={cn(arr.indexOf(wo.state) >= i && "wo-step-done")}>{woStateLabel[st].split(" ·")[0]}</span>
              ))}
            </div>
            <dl className="fact-grid">
              <div><dt>Description</dt><dd>{wo.description}</dd></div>
              <div><dt>Status</dt><dd>{woStateLabel[wo.state]}</dd></div>
              <div><dt>Engineer</dt><dd>{wo.assignee ? staffName(s, wo.assignee) : "Unassigned"}</dd></div>
              <div><dt>Accepted</dt><dd>{fmtTime(wo.acceptedAt)}</dd></div>
              <div><dt>Resolved</dt><dd>{fmtTime(wo.resolvedAt)}</dd></div>
              <div><dt>Room block</dt><dd>{s.rooms.find((r) => r.number === wo.room)?.block ? `${wo.urgency === "P1" ? "Out of order" : "Out of service"} until verified` : "Released"}</dd></div>
              {wo.resolution ? <div><dt>Resolution</dt><dd>{wo.resolution}</dd></div> : null}
            </dl>
            <div className="form-grid">
              {wo.state !== "VERIFIED" ? (
                <label>
                  Assign engineer
                  <select
                    value={wo.assignee ?? ""}
                    onChange={(e) => {
                      hms.woAssign(wo.id, e.target.value, actor);
                      toast.success(`Assigned to ${staffName(s, e.target.value)}`, { duration: 2500 });
                    }}
                  >
                    <option value="" disabled>Select engineer</option>
                    {engineers.map((eng) => (
                      <option key={eng.id} value={eng.id}>{eng.name}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              {wo.state === "ACCEPTED" || wo.state === "IN_PROGRESS" ? (
                <label>
                  Resolution note
                  <input value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="What was fixed?" />
                </label>
              ) : null}
            </div>
            <DialogFooter>
              {wo.state === "OPEN" ? (
                <Button variant="hmsPrimary" size="hmsMd" disabled={!wo.assignee} onClick={() => { hms.woAccept(wo.id, wo.assignee ?? actor); toast.success(`${wo.id} accepted`, { duration: 2500 }); }}>
                  Mark accepted
                </Button>
              ) : null}
              {wo.state === "ACCEPTED" || wo.state === "IN_PROGRESS" ? (
                <Button variant="hmsPrimary" size="hmsMd" onClick={() => { hms.woResolve(wo.id, wo.assignee ?? actor, resolution, true); setResolution(""); toast.success(`${wo.id} resolved — waiting for verification`, { duration: 3000 }); }}>
                  Mark resolved
                </Button>
              ) : null}
              {wo.state === "RESOLVED" ? (
                <Button variant="hmsPrimary" size="hmsMd" onClick={() => { hms.woVerify(wo.id, actor); toast.success(`Room ${wo.room} released — post-repair clean queued`, { duration: 3500 }); }}>
                  <CheckCircle2 aria-hidden="true" /> Verify & release room
                </Button>
              ) : null}
              <Button variant="hmsGhost" size="hmsMd" onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function NewWorkOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const s = useHms();
  const [room, setRoom] = useState("");
  const [category, setCategory] = useState<WorkOrder["category"]>("Plumbing");
  const [urgency, setUrgency] = useState<WorkOrder["urgency"]>("P2");
  const [description, setDescription] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!s.rooms.some((r) => r.number === room)) {
      toast.error("Choose a valid room number", { duration: 3000 });
      return;
    }
    const id = hms.createWorkOrder({ room, category, urgency, description }, actorFor(s, "desktop"));
    toast.success(`${id} created · room ${room} ${urgency === "P1" ? "Out of Order" : "Out of Service"}`, { duration: 3500 });
    setRoom("");
    setDescription("");
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-platform="desktop" className="hms-dialog">
        <DialogHeader>
          <DialogTitle>New work order</DialogTitle>
          <DialogDescription>P1 blocks the room as Out of Order; P2/P3 as Out of Service.</DialogDescription>
        </DialogHeader>
        <form className="form-grid form-grid-2" onSubmit={submit}>
          <label>
            Room
            <input list="room-numbers" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. 312" autoFocus />
            <datalist id="room-numbers">{s.rooms.map((r) => <option key={r.number} value={r.number} />)}</datalist>
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value as WorkOrder["category"])}>
              {issueCategories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <fieldset className="segmented">
            <legend>Urgency</legend>
            {(["P1", "P2", "P3"] as const).map((u) => (
              <button type="button" key={u} className={cn(urgency === u && "segmented-on")} onClick={() => setUrgency(u)}>{u}</button>
            ))}
          </fieldset>
          <label className="span-2">
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What is wrong?" />
          </label>
          <DialogFooter className="span-2">
            <Button type="button" variant="hmsGhost" size="hmsMd" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="hmsPrimary" size="hmsMd">Create work order</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────── Staff day view ───────────── */

export function StaffDayDialog({ staffId, onClose, onOpenRoom }: { staffId: string | null; onClose: () => void; onOpenRoom: (n: string) => void }) {
  const s = useHms();
  const person = s.staff.find((p) => p.id === staffId);
  const rooms = s.rooms.filter((r) => r.attendant === staffId);
  const done = rooms.filter((r) => r.hk === "CLEAN" || r.hk === "INSPECTED");
  const inspections = rooms.flatMap((r) => r.inspections);
  const passRate = inspections.length ? Math.round((inspections.filter((i) => i.result === "PASSED").length / inspections.length) * 100) : null;
  const avg = done.length ? Math.round(done.reduce((sum, r) => sum + (activeMinutes(s, r) ?? 0), 0) / done.length) : null;
  return (
    <Dialog open={!!person} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-platform="desktop" className="hms-dialog hms-dialog-wide">
        {person ? (
          <>
            <DialogHeader>
              <DialogTitle>{person.name} · day view</DialogTitle>
              <DialogDescription>{roleLabel[person.role]} · every room, duration, skipped items, and inspection result.</DialogDescription>
            </DialogHeader>
            <div className="mini-kpis">
              <div><strong>{done.length}/{rooms.length}</strong><span>Rooms done</span></div>
              <div><strong>{rooms.reduce((sum, r) => sum + roomCredits(r), 0).toFixed(1)}</strong><span>Credits</span></div>
              <div><strong>{avg === null ? "—" : `${avg}m`}</strong><span>Avg. clean</span></div>
              <div><strong>{passRate === null ? "—" : `${passRate}%`}</strong><span>Pass rate</span></div>
              <div><strong>{rooms.filter((r) => r.anomalies.length).length}</strong><span>Signals</span></div>
            </div>
            <div className="dialog-table">
              <div className="dt-row dt-head"><span>Room</span><span>Status</span><span>Start → finish</span><span>Duration</span><span>Checklist</span><span>Inspection</span></div>
              {rooms.map((r) => {
                const p = checklistProgress(s, r);
                const ins = lastInspection(r);
                return (
                  <button type="button" className="dt-row" key={r.number} onClick={() => { onClose(); onOpenRoom(r.number); }}>
                    <span><b>{r.number}</b> {r.anomalies.length ? <AlertTriangle className="inline-warn" aria-label={r.anomalies.map((a) => anomalyLabel[a]).join(", ")} /> : null}</span>
                    <span><StatusChip status={displayStatus(r, s.settings)} compact /></span>
                    <span>{fmtTime(r.startedAt)} → {fmtTime(r.completedAt)}</span>
                    <span>{fmtDuration(activeMinutes(s, r))}</span>
                    <span>{p.done}/{p.total}{p.skipped ? ` · ${p.skipped} skipped` : ""}</span>
                    <span>{ins ? `${ins.result === "PASSED" ? "✔" : "✘"} ${ins.score}%` : "—"}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/* ───────────── Full event log ───────────── */

export function EventLogDialog({ open, onOpenChange, onOpenRoom }: { open: boolean; onOpenChange: (o: boolean) => void; onOpenRoom: (n: string) => void }) {
  const s = useHms();
  const [query, setQuery] = useState("");
  const events = useMemo(() => {
    const q = query.trim().toLowerCase();
    return s.events
      .slice()
      .reverse()
      .filter((e) => !q || e.text.toLowerCase().includes(q) || e.room?.includes(q) || staffName(s, e.actor).toLowerCase().includes(q));
  }, [s, query]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-platform="desktop" className="hms-dialog hms-dialog-wide">
        <DialogHeader>
          <DialogTitle>Audit log · today</DialogTitle>
          <DialogDescription>Append-only record of every action — who, what, when, which room.</DialogDescription>
        </DialogHeader>
        <label className="dialog-search">
          <Search aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by room, person, or action" autoFocus />
        </label>
        <ol className="audit-list audit-list-scroll">
          {events.map((e) => (
            <li key={e.id} className={cn(e.override && "audit-override")}>
              <time>{fmtTime(e.at)}</time>
              <div>
                <strong>{staffName(s, e.actor)}</strong>
                <span>{e.text}</span>
                {e.room ? (
                  <button type="button" className="link-btn" onClick={() => { onOpenChange(false); onOpenRoom(e.room as string); }}>
                    Room {e.room}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
          {events.length === 0 ? <li className="muted-line">No events match.</li> : null}
        </ol>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────── Reports ───────────── */

export type ReportKey = "status" | "performance" | "compliance" | "failures";

export function buildReport(s: HmsState, key: ReportKey): { title: string; columns: string[]; rows: (string | number)[][] } {
  if (key === "status") {
    return {
      title: "Daily Room Status",
      columns: ["Room", "Floor", "Type", "Status", "Ready", "Attendant", "Started", "Finished", "Duration (min)", "Inspector", "Score"],
      rows: s.rooms.map((r) => {
        const ins = lastInspection(r);
        return [r.number, r.floor, r.type, displayStatus(r, s.settings), isReady(s, r) ? "Yes" : "No", r.attendant ? staffName(s, r.attendant) : "", fmtTime(r.startedAt), fmtTime(r.completedAt), activeMinutes(s, r) ?? "", ins ? staffName(s, ins.by) : "", ins?.score ?? ""];
      }),
    };
  }
  if (key === "performance") {
    return {
      title: "Attendant Performance",
      columns: ["Attendant", "Assigned", "Done", "Credits", "Avg min", "Inspections", "Pass rate", "Signals"],
      rows: s.staff
        .filter((p) => p.role === "ATTENDANT")
        .map((p) => {
          const rooms = s.rooms.filter((r) => r.attendant === p.id);
          const done = rooms.filter((r) => r.hk === "CLEAN" || r.hk === "INSPECTED");
          const ins = rooms.flatMap((r) => r.inspections);
          const avg = done.length ? Math.round(done.reduce((a, r) => a + (activeMinutes(s, r) ?? 0), 0) / done.length) : "";
          return [p.name, rooms.length, done.length, rooms.reduce((a, r) => a + roomCredits(r), 0).toFixed(1), avg, ins.length, ins.length ? `${Math.round((ins.filter((i) => i.result === "PASSED").length / ins.length) * 100)}%` : "", rooms.filter((r) => r.anomalies.length).length];
        }),
    };
  }
  if (key === "compliance") {
    const rows: (string | number)[][] = [];
    for (const tpl of ["departure", "stayover"] as const) {
      for (const it of s.templates[tpl]) {
        const relevant = s.rooms.filter((r) => (tpl === "stayover") === (r.taskType === "STAYOVER") && Object.keys(r.items).length);
        const done = relevant.filter((r) => r.items[it.id]?.status === "DONE").length;
        const skipped = relevant.filter((r) => r.items[it.id]?.status === "SKIPPED").length;
        const photos = relevant.filter((r) => r.items[it.id]?.photo).length;
        rows.push([tpl, zoneLabel[it.zone as Zone], it.label, it.mandatory ? "Yes" : "No", done, skipped, it.photo ? photos : "n/a"]);
      }
    }
    return { title: "Checklist Compliance", columns: ["Checklist", "Zone", "Item", "Required", "Done", "Skipped", "Photos"], rows };
  }
  return {
    title: "Inspection Failures",
    columns: ["Room", "Time", "Inspector", "Score", "Failed points", "Note", "Attendant"],
    rows: s.rooms.flatMap((r) =>
      r.inspections
        .filter((i) => i.result === "FAILED")
        .map((i) => [r.number, fmtTime(i.at), staffName(s, i.by), `${i.score}%`, i.failed.map((f) => inspectionPoints.find((p) => p.id === f)?.label ?? f).join("; "), i.note ?? "", r.attendant ? staffName(s, r.attendant) : ""]),
    ),
  };
}

export function downloadCsv(report: { title: string; columns: string[]; rows: (string | number)[][] }) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [report.columns, ...report.rows].map((row) => row.map(esc).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.title.toLowerCase().replace(/\s+/g, "-")}-2026-09-23.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast.success(`${report.title} exported (${report.rows.length} rows)`, { duration: 3000 });
}

export function ReportPreviewDialog({ reportKey, onClose }: { reportKey: ReportKey | null; onClose: () => void }) {
  const s = useHms();
  const report = reportKey ? buildReport(s, reportKey) : null;
  return (
    <Dialog open={!!report} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-platform="desktop" className="hms-dialog hms-dialog-xl report-print">
        {report ? (
          <>
            <DialogHeader>
              <DialogTitle>{report.title}</DialogTitle>
              <DialogDescription>TrianglZ Hotel · 23 September 2026 · {report.rows.length} rows</DialogDescription>
            </DialogHeader>
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>{report.columns.map((c) => <th key={c}>{c}</th>)}</tr>
                </thead>
                <tbody>
                  {report.rows.map((row, i) => (
                    <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                  ))}
                  {report.rows.length === 0 ? <tr><td colSpan={report.columns.length}>No rows today.</td></tr> : null}
                </tbody>
              </table>
            </div>
            <DialogFooter>
              <Button variant="hmsGhost" size="hmsMd" onClick={() => window.print()}><Printer aria-hidden="true" /> Print / PDF</Button>
              <Button variant="hmsPrimary" size="hmsMd" onClick={() => downloadCsv(report)}><Download aria-hidden="true" /> Export CSV</Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/* ───────────── Settings ───────────── */

export type SettingsKey = "property" | "checklists" | "rules" | "users";

export function SettingsDialog({ which, onClose }: { which: SettingsKey | null; onClose: () => void }) {
  const titles: Record<SettingsKey, string> = { property: "Property", checklists: "Checklists", rules: "Inspection & SLA rules", users: "Users & roles" };
  return (
    <Dialog open={!!which} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-platform="desktop" className="hms-dialog hms-dialog-wide">
        {which ? (
          <>
            <DialogHeader>
              <DialogTitle>{titles[which]}</DialogTitle>
              <DialogDescription>Changes apply immediately across Desktop and Mobile views.</DialogDescription>
            </DialogHeader>
            {which === "property" ? <PropertySettings /> : null}
            {which === "checklists" ? <ChecklistSettings /> : null}
            {which === "rules" ? <RulesSettings /> : null}
            {which === "users" ? <UserSettings /> : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PropertySettings() {
  const s = useHms();
  return (
    <div className="settings-body">
      <div className="mini-kpis">
        {[1, 2, 3, 4, 5].map((f) => (
          <div key={f}><strong>{s.rooms.filter((r) => r.floor === f).length}</strong><span>Floor {f}</span></div>
        ))}
      </div>
      <div className="dialog-table">
        <div className="dt-row dt-head dt-4"><span>Room type</span><span>Rooms</span><span>Credits</span><span>Std. departure / stayover</span></div>
        {(Object.keys(roomTypeInfo) as (keyof typeof roomTypeInfo)[]).map((t) => (
          <div className="dt-row dt-4" key={t}>
            <span><b>{t}</b></span>
            <span>{s.rooms.filter((r) => r.type === t).length}</span>
            <span>{roomTypeInfo[t].credits}</span>
            <span>{roomTypeInfo[t].departure} / {roomTypeInfo[t].stayover} min</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistSettings() {
  const s = useHms();
  const actor = actorFor(s, "desktop");
  const [tpl, setTpl] = useState<"departure" | "stayover">("departure");
  const [label, setLabel] = useState("");
  const [zone, setZone] = useState<Zone>("FINAL_AUDIT");
  const list = s.templates[tpl];
  return (
    <div className="settings-body">
      <div className="segmented segmented-inline">
        {(["departure", "stayover"] as const).map((t) => (
          <button type="button" key={t} className={cn(tpl === t && "segmented-on")} onClick={() => setTpl(t)}>
            {t === "departure" ? "Departure / re-clean" : "Stayover"} ({s.templates[t].length})
          </button>
        ))}
      </div>
      <div className="dialog-table checklist-editor">
        <div className="dt-row dt-head dt-cl"><span>Item</span><span>Zone</span><span>Required</span><span>Photo</span><span /></div>
        {list.map((it) => (
          <div className="dt-row dt-cl" key={it.id}>
            <span>{it.label}<small className="ar" lang="ar">{it.labelAr}</small></span>
            <span className="muted">{zoneLabel[it.zone].split(" · ")[1]}</span>
            <span><Switch checked={it.mandatory} onCheckedChange={(v) => hms.updateChecklistItem(tpl, it.id, { mandatory: v }, actor)} aria-label={`${it.label} required`} /></span>
            <span><Switch checked={it.photo} onCheckedChange={(v) => hms.updateChecklistItem(tpl, it.id, { photo: v }, actor)} aria-label={`${it.label} photo`} /></span>
            <span>
              <Button variant="hmsGhost" size="hmsIcon" aria-label={`Remove ${it.label}`} onClick={() => { hms.removeChecklistItem(tpl, it.id, actor); toast.success("Item removed", { duration: 2000 }); }}>
                <Trash2 aria-hidden="true" />
              </Button>
            </span>
          </div>
        ))}
      </div>
      <form
        className="add-item-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!label.trim()) return;
          hms.addChecklistItem(tpl, { label: label.trim(), labelAr: label.trim(), zone, mandatory: true, photo: false }, actor);
          setLabel("");
          toast.success("Item added", { duration: 2000 });
        }}
      >
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="New checklist item" />
        <select value={zone} onChange={(e) => setZone(e.target.value as Zone)}>
          {(Object.keys(zoneLabel) as Zone[]).map((z) => <option key={z} value={z}>{zoneLabel[z]}</option>)}
        </select>
        <Button type="submit" variant="hmsPrimary" size="hmsMd"><Plus aria-hidden="true" /> Add</Button>
      </form>
    </div>
  );
}

function RulesSettings() {
  const s = useHms();
  const actor = actorFor(s, "desktop");
  const [draft, setDraft] = useState(s.settings);
  const changed = JSON.stringify(draft) !== JSON.stringify(s.settings);
  return (
    <div className="settings-body form-grid form-grid-2">
      <label className="switch-row span-2">
        <span>
          <b>Supervisor inspection required before READY</b>
          <small>When off, rooms become READY as soon as they are marked clean.</small>
        </span>
        <Switch checked={draft.inspectionRequired} onCheckedChange={(v) => setDraft({ ...draft, inspectionRequired: v })} />
      </label>
      <label>
        Pass score (%)
        <input type="number" min={50} max={100} value={draft.passScore} onChange={(e) => setDraft({ ...draft, passScore: Number(e.target.value) })} />
      </label>
      <label>
        Queue inspection SLA (min)
        <input type="number" min={5} max={60} value={draft.queueSlaMin} onChange={(e) => setDraft({ ...draft, queueSlaMin: Number(e.target.value) })} />
      </label>
      <label>
        P1 accept SLA (min)
        <input type="number" min={5} max={60} value={draft.p1AcceptMin} onChange={(e) => setDraft({ ...draft, p1AcceptMin: Number(e.target.value) })} />
      </label>
      <label>
        Attendant target credits
        <input type="number" min={6} max={24} value={draft.targetCredits} onChange={(e) => setDraft({ ...draft, targetCredits: Number(e.target.value) })} />
      </label>
      <DialogFooter className="span-2">
        <Button variant="hmsGhost" size="hmsMd" disabled={!changed} onClick={() => setDraft(s.settings)}>Discard</Button>
        <Button
          variant="hmsPrimary"
          size="hmsMd"
          disabled={!changed}
          onClick={() => {
            const patch = Object.fromEntries(Object.entries(draft).filter(([k, v]) => s.settings[k as keyof typeof draft] !== v));
            hms.updateSettings(patch, actor);
            toast.success("Rules saved", { duration: 2500 });
          }}
        >
          Save rules
        </Button>
      </DialogFooter>
    </div>
  );
}

function UserSettings() {
  const s = useHms();
  const actor = actorFor(s, "desktop");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("ATTENDANT");
  return (
    <div className="settings-body">
      <div className="dialog-table">
        <div className="dt-row dt-head dt-3"><span>Name</span><span>Role</span><span>Rooms today</span></div>
        {s.staff.map((p) => (
          <div className="dt-row dt-3" key={p.id}>
            <span className="staff-cell"><i>{p.initials}</i><b>{p.name}</b></span>
            <span>{roleLabel[p.role]}</span>
            <span>{p.role === "ATTENDANT" ? s.rooms.filter((r) => r.attendant === p.id).length : "—"}</span>
          </div>
        ))}
      </div>
      <form
        className="add-item-row"
        onSubmit={(e) => {
          e.preventDefault();
          const clean = name.trim();
          if (clean.split(" ").length < 2) {
            toast.error("Enter first and last name", { duration: 2500 });
            return;
          }
          const initials = clean.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
          hms.addStaff({ name: clean, initials, role }, actor);
          setName("");
          toast.success(`${clean} added — PIN sent to supervisor`, { duration: 3000 });
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {(Object.keys(roleLabel) as Role[]).map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
        </select>
        <Button type="submit" variant="hmsPrimary" size="hmsMd"><Plus aria-hidden="true" /> Add user</Button>
      </form>
    </div>
  );
}
