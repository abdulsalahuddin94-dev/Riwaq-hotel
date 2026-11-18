import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Plus, Printer, Search, Trash2 } from "./msym";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  fmtDuration,
  fmtTime,
  type GuestRequestType,
  guestRequestLabel,
  inspectionPoints,
  property,
  issueCategories,
  roleLabel,
  roomTypeInfo,
  type Role,
  type WorkOrder,
  zoneLabel,
  type Zone,
  wingLabel,
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

/* ───────────── Guest request → floor supervisor ───────────── */

const REQUEST_TYPES: GuestRequestType[] = ["towels", "amenities", "housekeeping", "late_checkout", "other"];

export function SendRequestDialog({ open, onOpenChange, defaultRoom }: { open: boolean; onOpenChange: (open: boolean) => void; defaultRoom?: string | undefined }) {
  const s = useHms();
  const rooms = s.rooms.filter((r) => !r.block);
  const [room, setRoom] = useState("");
  const [type, setType] = useState<GuestRequestType>("towels");
  const [note, setNote] = useState("");
  const [urgent, setUrgent] = useState(false);
  const selected = room || defaultRoom || rooms.find((r) => r.occupancy === "OCCUPIED")?.number || "";
  const sup = s.staff.find((p) => p.active !== false && p.role === "SUPERVISOR" && (p.floors ?? []).includes(Number(selected[0])));
  const close = () => {
    setRoom("");
    setType("towels");
    setNote("");
    setUrgent(false);
    onOpenChange(false);
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (type === "other" && !note.trim()) {
      toast.error("Say what the guest needs", { duration: 2500 });
      return;
    }
    hms.createRequest({ room: selected, type, note: note.trim(), urgent }, actorFor(s, "desktop"));
    toast.success(`Sent to ${sup ? sup.name : "the floor supervisor"} · Room ${selected}`, { duration: 3000 });
    close();
  };
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent data-platform="desktop" className="hms-dialog">
        <DialogHeader>
          <DialogTitle>Send a request to housekeeping</DialogTitle>
          <DialogDescription>It goes to the floor supervisor's phone. You'll see here when they're on it and when it's done.</DialogDescription>
        </DialogHeader>
        <form className="form-grid form-grid-2" onSubmit={submit}>
          <label>
            Room
            <select value={selected} onChange={(e) => setRoom(e.target.value)}>
              {rooms.map((r) => (
                <option key={r.number} value={r.number}>{r.number}{r.guest ? ` · ${r.guest}` : r.occupancy === "OCCUPIED" ? " · occupied" : ""}</option>
              ))}
            </select>
          </label>
          <label>
            Request
            <select value={type} onChange={(e) => setType(e.target.value as GuestRequestType)}>
              {REQUEST_TYPES.map((t) => <option key={t} value={t}>{guestRequestLabel[t]}</option>)}
            </select>
          </label>
          <label className="span-2">
            Note {type === "other" ? null : <span className="label-optional">optional</span>}
            <input autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder={type === "late_checkout" ? "e.g. Leaves at 14:00" : "e.g. Two extra pillows"} />
          </label>
          <label className="span-2 request-urgent">
            <Switch checked={urgent} onCheckedChange={setUrgent} /> Guest is waiting for it now
          </label>
          <p className="muted-line span-2">Goes to <b>{sup ? sup.name : "the floor supervisor"}</b>{sup ? ` · ${wingLabel(Number(selected[0]))}` : ""}</p>
          <DialogFooter className="span-2">
            <Button type="button" variant="hmsGhost" size="hmsMd" onClick={close}>Cancel</Button>
            <Button type="submit" variant="hmsPrimary" size="hmsMd" disabled={!selected}>Send request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
        .filter((p) => p.active !== false && p.role === "ATTENDANT")
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
              <DialogDescription>{property.name} · {report.rows.length} rows</DialogDescription>
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

export type SettingsKey = "property" | "checklists" | "rules";

export function SettingsDialog({ which, onClose }: { which: SettingsKey | null; onClose: () => void }) {
  const titles: Record<SettingsKey, string> = { property: "Property", checklists: "Checklists", rules: "Inspection & SLA rules" };
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
          <div key={f}><strong>{s.rooms.filter((r) => r.floor === f).length}</strong><span>{wingLabel(f)}</span></div>
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

