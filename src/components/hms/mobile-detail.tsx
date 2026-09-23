import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  Circle,
  CircleSlash,
  ClipboardList,
  Hand,
  Moon,
  Package,
  Pause,
  Play,
  ShieldAlert,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  fmtDuration,
  fmtTime,
  inspectionPoints,
  issueCategories,
  pauseReasons,
  personaStaff,
  scoreInspection,
  skipReasons,
  taskLabel,
  type WorkOrder,
  zoneLabel,
  type Zone,
} from "@/lib/demo-data";
import {
  activeMinutes,
  checklistFor,
  checklistProgress,
  displayStatus,
  hms,
  lastInspection,
  roomEvents,
  staffName,
  stdMinutes,
  useHms,
} from "@/lib/hms-store";
import { cn } from "@/lib/utils";
import { EmptyState } from "./demo-states";
import { MobileSheet, MobileShell, useMobilePersona } from "./mobile-shell";
import { RoomBadges } from "./room-components";
import { StatusChip } from "./status";

/* ───────────── Shared bits ───────────── */

function ProgressRing({ value, label }: { value: number; label: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("m-ring", value >= 100 && "m-ring-done")} role="img" aria-label={label}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={r} className="m-ring-track" />
        <circle cx="32" cy="32" r={r} className="m-ring-fill" strokeDasharray={c} strokeDashoffset={c - (c * Math.min(100, value)) / 100} />
      </svg>
      <span>{label}</span>
    </div>
  );
}

function CameraSheet({ open, onClose, onCapture, title }: { open: boolean; onClose: () => void; onCapture: () => void; title: string }) {
  return (
    <MobileSheet open={open} onClose={onClose} title={title}>
      <div className="m-camera">
        <div className="m-viewfinder" aria-hidden="true">
          <span className="vf-corner tl" /><span className="vf-corner tr" /><span className="vf-corner bl" /><span className="vf-corner br" />
          <Camera />
          <small>Demo camera · photo is simulated</small>
        </div>
        <button type="button" className="m-shutter" aria-label="Take photo" onClick={() => { onCapture(); onClose(); }} />
      </div>
    </MobileSheet>
  );
}

function NotFound({ what, back }: { what: string; back: string }) {
  return (
    <MobileShell title="Not found" back={{ to: back }}>
      <EmptyState title={`${what} doesn't exist in the demo data`} />
    </MobileShell>
  );
}

/* ───────────── Room detail (M-03) ───────────── */

export function MobileRoomDetailPage({ roomId }: { roomId: string }) {
  const s = useHms();
  const persona = useMobilePersona();
  const navigate = useNavigate();
  const actor = personaStaff[persona];
  const room = s.rooms.find((r) => r.number === roomId);
  const [sheet, setSheet] = useState<null | "pause" | "issue" | "damage" | "found" | "startCheck" | "camera">(null);
  const [issue, setIssue] = useState<{ category: WorkOrder["category"]; urgency: WorkOrder["urgency"]; note: string; photo: boolean }>({ category: "Plumbing", urgency: "P2", note: "", photo: false });
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState(false);
  const [cameraFor, setCameraFor] = useState<"issue" | "damage" | "found">("issue");
  if (!room) return <NotFound what={`Room ${roomId}`} back="/m/rooms" />;

  const status = displayStatus(room, s.settings);
  const progress = checklistProgress(s, room);
  const minutes = activeMinutes(s, room);
  const ins = lastInspection(room);
  const history = roomEvents(s, room.number).slice(-6).reverse();
  const inProgress = room.hk === "IN_PROGRESS";
  const isDeparture = room.taskType !== "STAYOVER";

  const start = () => {
    hms.startCleaning(room.number, actor);
    toast.success(`Room ${room.number} started — timer running`, { duration: 2500 });
    void navigate({ to: "/m/rooms/$roomId/checklist", params: { roomId: room.number } });
  };

  const openCamera = (forWhat: "issue" | "damage" | "found") => {
    setCameraFor(forWhat);
    setSheet("camera");
  };

  let footer: React.ReactNode;
  if (room.block) footer = <Button variant="hmsSecondary" size="hmsXl" disabled><Wrench aria-hidden="true" /> Blocked · {room.block.type}</Button>;
  else if (room.dnd && room.hk === "DIRTY")
    footer = (
      <Button variant="hmsSecondary" size="hmsXl" onClick={() => { hms.clearDnd(room.number, actor, "DND sign removed — service possible"); toast.success("DND cleared — you can start now", { duration: 2500 }); }}>
        <Moon aria-hidden="true" /> DND removed? Tap to clear
      </Button>
    );
  else if (room.hk === "DIRTY")
    footer = (
      <Button variant="hmsPrimary" size="hmsXl" onClick={() => (isDeparture ? setSheet("startCheck") : start())}>
        <Play aria-hidden="true" /> {room.taskType === "RECLEAN" ? "Start re-clean" : "Start cleaning"}
      </Button>
    );
  else if (room.hk === "PAUSED")
    footer = (
      <Button variant="hmsPrimary" size="hmsXl" onClick={() => { hms.resumeCleaning(room.number, actor); toast.success("Resumed — timer running", { duration: 2000 }); }}>
        <Play aria-hidden="true" /> Resume cleaning
      </Button>
    );
  else if (inProgress)
    footer = (
      <Button asChild variant="hmsPrimary" size="hmsXl">
        <Link to="/m/rooms/$roomId/checklist" params={{ roomId: room.number }}>
          <ClipboardList aria-hidden="true" /> {progress.canComplete ? "Review & mark clean" : `Continue checklist · ${progress.done}/${progress.total}`}
        </Link>
      </Button>
    );
  else footer = <Button variant="hmsSecondary" size="hmsXl" disabled><CheckCircle2 aria-hidden="true" /> {room.hk === "CLEAN" ? "Waiting for inspection" : "Done · inspected"}</Button>;

  return (
    <MobileShell title={`Room ${room.number}`} subtitle={`${room.type} · Floor ${room.floor} · ${taskLabel[room.taskType]}`} back={{ to: persona === "Supervisor" ? "/m/floor" : "/m/rooms", label: persona === "Supervisor" ? "Floor" : "My Rooms" }} footer={footer}>
      <div className="m-hero">
        <StatusChip status={status} />
        <RoomBadges room={room} showAnomaly={false} />
      </div>

      {room.queue ? <p className="m-note m-note-warn"><Sparkles aria-hidden="true" /> {room.queue.guest} is waiting in the lobby — this room is your #1.</p> : null}
      {room.arrival && !room.queue ? <p className="m-note">Arrival: {room.arrival.guest} · {room.arrival.eta}</p> : null}
      {room.note ? <p className="m-note">{room.note}</p> : null}
      {room.guest && room.occupancy === "OCCUPIED" ? <p className="m-note">Occupied · {room.guest}</p> : null}
      {room.block ? <p className="m-note m-note-blocked"><Wrench aria-hidden="true" /> {room.block.reason}</p> : null}
      {room.taskType === "RECLEAN" && ins?.result === "FAILED" ? (
        <div className="m-note m-note-error">
          <strong>Re-clean needed · {ins.score}%</strong>
          <ul>{ins.failed.map((f) => <li key={f}>✘ {inspectionPoints.find((p) => p.id === f)?.label}</li>)}</ul>
          {ins.note ? <p>“{ins.note}” — {staffName(s, ins.by)}</p> : null}
        </div>
      ) : null}
      {room.hk === "PAUSED" ? <p className="m-note m-note-warn"><Pause aria-hidden="true" /> Paused · {room.pauseReason}</p> : null}

      <Link to="/m/rooms/$roomId/checklist" params={{ roomId: room.number }} className="m-progress-card">
        <ProgressRing value={progress.percent} label={`${progress.done}/${progress.total}`} />
        <div>
          <strong>Checklist</strong>
          <span>{progress.missingMandatory.length ? `${progress.missingMandatory.length} required items left` : "All required items done"}</span>
          <span>{minutes === undefined ? `Standard time ~${stdMinutes(room)} min` : `${fmtDuration(minutes)} of ~${stdMinutes(room)} min`}</span>
        </div>
      </Link>

      <div className="m-action-grid">
        {inProgress ? <button type="button" onClick={() => setSheet("pause")}><Pause aria-hidden="true" /> Pause</button> : null}
        {room.hk === "DIRTY" && !room.dnd ? <button type="button" onClick={() => { hms.flagDnd(room.number, actor); toast.success("DND logged — reminder in 2 hours", { duration: 2500 }); }}><Moon aria-hidden="true" /> Flag DND</button> : null}
        <button type="button" onClick={() => { setIssue({ category: "Plumbing", urgency: "P2", note: "", photo: false }); setSheet("issue"); }}><Wrench aria-hidden="true" /> Report issue</button>
        <button type="button" onClick={() => { setText(""); setPhoto(false); setSheet("damage"); }}><ShieldAlert aria-hidden="true" /> Damage</button>
        <button type="button" onClick={() => { setText(""); setPhoto(false); setSheet("found"); }}><Package aria-hidden="true" /> Found item</button>
        {room.occupancy === "OCCUPIED" && room.hk === "DIRTY" && !room.refused ? <button type="button" onClick={() => { hms.guestRefused(room.number, actor); toast.success("Logged: guest refused service", { duration: 2500 }); }}><Hand aria-hidden="true" /> Guest refused</button> : null}
      </div>

      <section className="m-history">
        <h2>Today in this room</h2>
        {history.length === 0 ? <p className="m-muted">No activity yet.</p> : null}
        {history.map((e) => (
          <div key={e.id}><time>{fmtTime(e.at)}</time><span><b>{staffName(s, e.actor)}</b> {e.text}</span></div>
        ))}
      </section>

      {/* Sheets */}
      <MobileSheet open={sheet === "startCheck"} onClose={() => setSheet(null)} title="Before you start">
        <div className="m-sheet-stack">
          <p>Check the room for damage or missing items <b>before</b> touching anything.</p>
          <Button variant="hmsPrimary" size="hmsXl" onClick={() => { setSheet(null); start(); }}><Check aria-hidden="true" /> No damage — start</Button>
          <Button variant="hmsSecondary" size="hmsLg" onClick={() => { setText(""); setPhoto(false); setSheet("damage"); }}><ShieldAlert aria-hidden="true" /> Report damage first</Button>
        </div>
      </MobileSheet>

      <MobileSheet open={sheet === "pause"} onClose={() => setSheet(null)} title="Why are you pausing?">
        <div className="m-sheet-stack">
          {pauseReasons.map((r) => (
            <Button key={r} variant="hmsSecondary" size="hmsLg" onClick={() => { hms.pauseCleaning(room.number, actor, r); setSheet(null); toast.success(`Paused · ${r} — timer stopped`, { duration: 2500 }); }}>{r}</Button>
          ))}
        </div>
      </MobileSheet>

      <MobileSheet open={sheet === "issue"} onClose={() => setSheet(null)} title="Report maintenance issue">
        <div className="m-sheet-stack">
          <div className="m-cat-grid">
            {issueCategories.map((c) => (
              <button type="button" key={c} className={cn(issue.category === c && "on")} onClick={() => setIssue({ ...issue, category: c, urgency: c === "Pest" ? "P1" : issue.urgency })}>{c}</button>
            ))}
          </div>
          <div className="m-segmented">
            {(["P1", "P2", "P3"] as const).map((u) => (
              <button type="button" key={u} className={cn(issue.urgency === u && "on", u === "P1" && "p1")} onClick={() => setIssue({ ...issue, urgency: u })}>{u}{u === "P1" ? " · urgent" : ""}</button>
            ))}
          </div>
          <label className="m-field">What's wrong?<textarea rows={2} value={issue.note} onChange={(e) => setIssue({ ...issue, note: e.target.value })} placeholder="e.g. sink leaking" /></label>
          <button type="button" className={cn("m-photo-btn", issue.photo && "on")} onClick={() => openCamera("issue")}>{issue.photo ? <><CheckCircle2 aria-hidden="true" /> Photo attached</> : <><Camera aria-hidden="true" /> Add photo (required)</>}</button>
          <p className="m-muted">{issue.urgency === "P1" || issue.category === "Pest" ? "Room will be set Out of Order — front desk can't sell it." : "Room will be set Out of Service until fixed."}</p>
          <Button
            variant="hmsPrimary"
            size="hmsXl"
            disabled={!issue.photo}
            onClick={() => {
              const id = hms.reportIssue(room.number, actor, { category: issue.category, urgency: issue.urgency, description: issue.note });
              setSheet(null);
              toast.success(`${id} sent to engineering`, { duration: 3000 });
            }}
          >
            Send report
          </Button>
        </div>
      </MobileSheet>

      <MobileSheet open={sheet === "damage" || sheet === "found"} onClose={() => setSheet(null)} title={sheet === "found" ? "Log found item" : "Report damage / missing item"}>
        <div className="m-sheet-stack">
          {sheet === "found" ? <p className="m-muted">Don't move the item until it's photographed in place.</p> : null}
          <label className="m-field">{sheet === "found" ? "Item & where it was found" : "What is damaged or missing?"}<textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={sheet === "found" ? "e.g. phone charger, bedside drawer" : "e.g. stain on armchair"} /></label>
          <button type="button" className={cn("m-photo-btn", photo && "on")} onClick={() => openCamera(sheet === "found" ? "found" : "damage")}>{photo ? <><CheckCircle2 aria-hidden="true" /> Photo attached</> : <><Camera aria-hidden="true" /> Add photo (required)</>}</button>
          <Button
            variant="hmsPrimary"
            size="hmsXl"
            disabled={!photo || !text.trim()}
            onClick={() => {
              hms.reportIncident(room.number, actor, sheet === "found" ? "LOST_FOUND" : "DAMAGE", text.trim());
              toast.success(sheet === "found" ? "Found item logged — supervisor notified" : "Damage reported — front desk & manager alerted", { duration: 3000 });
              setSheet(null);
            }}
          >
            Submit
          </Button>
        </div>
      </MobileSheet>

      <CameraSheet
        open={sheet === "camera"}
        title="Take photo"
        onClose={() => setSheet(cameraFor === "issue" ? "issue" : cameraFor === "found" ? "found" : "damage")}
        onCapture={() => {
          if (cameraFor === "issue") setIssue((cur) => ({ ...cur, photo: true }));
          else setPhoto(true);
        }}
      />
    </MobileShell>
  );
}

/* ───────────── Checklist (M-04) ───────────── */

export function MobileChecklistPage({ roomId }: { roomId: string }) {
  const s = useHms();
  const persona = useMobilePersona();
  const navigate = useNavigate();
  const actor = personaStaff[persona];
  const room = s.rooms.find((r) => r.number === roomId);
  const [cameraItem, setCameraItem] = useState<string | null>(null);
  const [skipItem, setSkipItem] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  if (!room) return <NotFound what={`Room ${roomId}`} back="/m/rooms" />;

  const list = checklistFor(s, room);
  const progress = checklistProgress(s, room);
  const zones = Array.from(new Set(list.map((it) => it.zone))) as Zone[];
  const editable = room.hk === "IN_PROGRESS";
  const minutes = activeMinutes(s, room);
  const left = progress.missingMandatory.length + progress.missingPhoto.length;

  const tap = (id: string, needsPhoto: boolean) => {
    if (!editable) {
      toast.info(room.hk === "PAUSED" ? "Resume cleaning to continue" : room.hk === "DIRTY" ? "Tap Start cleaning first" : "This checklist is closed", { duration: 2500 });
      return;
    }
    if (needsPhoto && !room.items[id]) {
      setCameraItem(id);
      return;
    }
    hms.toggleItem(room.number, id, actor);
  };

  const footer =
    room.hk === "DIRTY" ? (
      <Button variant="hmsPrimary" size="hmsXl" onClick={() => { hms.startCleaning(room.number, actor); toast.success("Started — timer running", { duration: 2000 }); }}><Play aria-hidden="true" /> Start cleaning</Button>
    ) : room.hk === "PAUSED" ? (
      <Button variant="hmsPrimary" size="hmsXl" onClick={() => hms.resumeCleaning(room.number, actor)}><Play aria-hidden="true" /> Resume cleaning</Button>
    ) : editable ? (
      <Button variant="hmsPrimary" size="hmsXl" disabled={!progress.canComplete} onClick={() => setConfirm(true)}>
        {progress.canComplete ? <><Sparkles aria-hidden="true" /> Mark clean</> : `${left} required item${left > 1 ? "s" : ""} left`}
      </Button>
    ) : (
      <Button variant="hmsSecondary" size="hmsXl" disabled><CheckCircle2 aria-hidden="true" /> {room.hk === "CLEAN" ? "Submitted · waiting for inspection" : "Inspected"}</Button>
    );

  return (
    <MobileShell title="Checklist" subtitle={`Room ${room.number} · ${taskLabel[room.taskType]}`} back={{ to: "/m/rooms/$roomId", params: { roomId: room.number }, label: `Room ${room.number}` }} footer={footer}>
      <div className="m-check-summary">
        <ProgressRing value={progress.percent} label={`${progress.done}/${progress.total}`} />
        <div>
          <strong>{progress.percent}% complete</strong>
          <span>{minutes === undefined ? "Not started" : `${fmtDuration(minutes)} · standard ~${stdMinutes(room)} min`}</span>
          <span>{left ? `${left} required left` : "Ready to mark clean"}</span>
        </div>
      </div>
      {!editable && room.hk !== "CLEAN" && room.hk !== "INSPECTED" ? (
        <p className="m-note m-note-warn">{room.hk === "PAUSED" ? `Paused · ${room.pauseReason}. Resume to keep ticking.` : "Start cleaning to begin ticking items — the timer starts with it."}</p>
      ) : null}
      {zones.map((zone) => (
        <section className="m-zone" key={zone}>
          <h2>{zoneLabel[zone]}</h2>
          {list
            .filter((it) => it.zone === zone)
            .map((it) => {
              const res = room.items[it.id];
              return (
                <div className={cn("m-check", res?.status === "DONE" && "m-check-done", res?.status === "SKIPPED" && "m-check-skipped")} key={it.id}>
                  <button type="button" className="m-check-main" onClick={() => tap(it.id, it.photo)} aria-pressed={res?.status === "DONE"}>
                    {res?.status === "DONE" ? <CheckCircle2 className="m-check-icon" aria-hidden="true" /> : res?.status === "SKIPPED" ? <CircleSlash className="m-check-icon" aria-hidden="true" /> : <Circle className="m-check-icon" aria-hidden="true" />}
                    <span className="m-check-text">
                      {it.label}
                      <small>
                        {it.mandatory ? <em>Required</em> : null}
                        {it.photo ? <em className="tag-photo"><Camera aria-hidden="true" /> Photo</em> : null}
                        {res ? <span>{res.status === "SKIPPED" ? `Skipped · ${res.skipReason}` : `${staffName(s, res.by).split(" ")[0]} · ${fmtTime(res.at)}`}</span> : null}
                      </small>
                    </span>
                    {res?.photo ? <span className="m-thumb" aria-label="Photo attached"><Camera aria-hidden="true" /></span> : null}
                  </button>
                  {editable && !it.mandatory && !res ? (
                    <button type="button" className="m-skip" onClick={() => setSkipItem(it.id)}>Skip</button>
                  ) : null}
                </div>
              );
            })}
        </section>
      ))}

      <CameraSheet
        open={!!cameraItem}
        title="Photo proof"
        onClose={() => setCameraItem(null)}
        onCapture={() => {
          if (cameraItem) hms.attachPhoto(room.number, cameraItem, actor);
          toast.success("Photo saved", { duration: 1500 });
        }}
      />
      <MobileSheet open={!!skipItem} onClose={() => setSkipItem(null)} title="Why skip this item?">
        <div className="m-sheet-stack">
          {skipReasons.map((r) => (
            <Button key={r} variant="hmsSecondary" size="hmsLg" onClick={() => { if (skipItem) hms.skipItem(room.number, skipItem, actor, r); setSkipItem(null); }}>{r}</Button>
          ))}
        </div>
      </MobileSheet>
      <MobileSheet open={confirm} onClose={() => setConfirm(false)} title={`Mark room ${room.number} clean?`}>
        <div className="m-sheet-stack">
          <dl className="m-facts">
            <div><dt>Items done</dt><dd>{list.filter((it) => room.items[it.id]?.status === "DONE").length}</dd></div>
            <div><dt>Skipped</dt><dd>{progress.skipped}</dd></div>
            <div><dt>Photos</dt><dd>{Object.values(room.items).filter((x) => x.photo).length}</dd></div>
            <div><dt>Time</dt><dd>{fmtDuration(minutes)}</dd></div>
          </dl>
          <p className="m-muted">Your supervisor will be notified to inspect the room.</p>
          <Button
            variant="hmsPrimary"
            size="hmsXl"
            onClick={() => {
              hms.markClean(room.number, actor);
              setConfirm(false);
              toast.success(`Room ${room.number} marked clean — supervisor notified`, { duration: 3000 });
              void navigate({ to: "/m/rooms" });
            }}
          >
            <Check aria-hidden="true" /> Confirm — mark clean
          </Button>
        </div>
      </MobileSheet>
    </MobileShell>
  );
}

/* ───────────── Inspection form (M-07) ───────────── */

export function MobileInspectionFormPage({ roomId }: { roomId: string }) {
  const s = useHms();
  const navigate = useNavigate();
  const actor = personaStaff.Supervisor;
  const room = s.rooms.find((r) => r.number === roomId);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [rejectOpen, setRejectOpen] = useState(false);
  const [attendantOpen, setAttendantOpen] = useState(false);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(false);
  const [camera, setCamera] = useState(false);
  if (!room) return <NotFound what={`Room ${roomId}`} back="/m/inspections" />;

  const answered = inspectionPoints.filter((p) => results[p.id] !== undefined).length;
  const { score, criticalFail } = scoreInspection(results);
  const anyFail = Object.values(results).includes(false);
  const allAnswered = answered === inspectionPoints.length;
  const canApprove = allAnswered && score >= s.settings.passScore && !criticalFail;
  const zones = Array.from(new Set(inspectionPoints.map((p) => p.zone)));
  const list = checklistFor(s, room);
  const progress = checklistProgress(s, room);

  if (room.hk !== "CLEAN") {
    return (
      <MobileShell title={`Inspect ${room.number}`} back={{ to: "/m/inspections", label: "Queue" }}>
        <EmptyState title={room.hk === "INSPECTED" ? "Already inspected ✔" : "This room hasn't been marked clean yet"} />
      </MobileShell>
    );
  }

  const footer = (
    <div className="m-footer-split">
      <Button variant="hmsSecondary" size="hmsXl" disabled={!anyFail} onClick={() => setRejectOpen(true)}><X aria-hidden="true" /> Reject</Button>
      <Button
        variant="hmsPrimary"
        size="hmsXl"
        disabled={!canApprove}
        onClick={() => {
          hms.submitInspection(room.number, actor, results);
          toast.success(`Room ${room.number} approved · ${score}% — READY for front desk`, { duration: 3000 });
          void navigate({ to: "/m/inspections" });
        }}
      >
        <Check aria-hidden="true" /> Approve
      </Button>
    </div>
  );

  return (
    <MobileShell title={`Inspect ${room.number}`} subtitle={`${room.type} · Floor ${room.floor}`} back={{ to: "/m/inspections", label: "Queue" }} footer={footer}>
      <button type="button" className="m-attendant-card" onClick={() => setAttendantOpen(true)}>
        <div>
          <strong>{staffName(s, room.attendant)}</strong>
          <span>{fmtDuration(activeMinutes(s, room))} · {progress.done}/{progress.total} items · {Object.values(room.items).filter((x) => x.photo).length} photos</span>
        </div>
        <span className="m-link">View checklist</span>
      </button>
      {room.queue ? <p className="m-note m-note-warn">⚡ {room.queue.guest} is waiting — approve as soon as it passes.</p> : null}

      <div className={cn("m-score", allAnswered && (canApprove ? "m-score-pass" : "m-score-fail"))}>
        <div><strong>{answered ? `${score}%` : "—"}</strong><span>{answered}/{inspectionPoints.length} checked · pass ≥ {s.settings.passScore}%{criticalFail ? " · critical fail" : ""}</span></div>
        <Button variant="hmsGhost" size="hmsSm" onClick={() => setResults(Object.fromEntries(inspectionPoints.map((p) => [p.id, results[p.id] ?? true])))}>Pass remaining</Button>
      </div>

      {zones.map((zone) => (
        <section className="m-zone" key={zone}>
          <h2>{zone}</h2>
          {inspectionPoints
            .filter((p) => p.zone === zone)
            .map((p) => (
              <div className={cn("m-point", results[p.id] === false && "m-point-fail")} key={p.id}>
                <span>
                  {p.label}
                  <small>{p.critical ? <em className="tag-critical">Critical</em> : null} weight {p.weight}</small>
                </span>
                <div className="m-passfail">
                  <button type="button" className={cn(results[p.id] === true && "pass")} aria-pressed={results[p.id] === true} onClick={() => setResults({ ...results, [p.id]: true })} aria-label={`Pass ${p.label}`}><Check aria-hidden="true" /></button>
                  <button type="button" className={cn(results[p.id] === false && "fail")} aria-pressed={results[p.id] === false} onClick={() => setResults({ ...results, [p.id]: false })} aria-label={`Fail ${p.label}`}><X aria-hidden="true" /></button>
                </div>
              </div>
            ))}
        </section>
      ))}

      <MobileSheet open={attendantOpen} onClose={() => setAttendantOpen(false)} title={`${staffName(s, room.attendant)}'s checklist`}>
        <div className="m-sheet-list">
          {list.map((it) => {
            const res = room.items[it.id];
            return (
              <div key={it.id} className={cn("m-mini-check", !res && "missing")}>
                {res?.status === "DONE" ? <CheckCircle2 aria-hidden="true" /> : res?.status === "SKIPPED" ? <CircleSlash aria-hidden="true" /> : <Circle aria-hidden="true" />}
                <span>{it.label}{res?.skipReason ? ` · ${res.skipReason}` : ""}</span>
                {res?.photo ? <Camera aria-label="Photo" /> : null}
                <time>{res ? fmtTime(res.at) : ""}</time>
              </div>
            );
          })}
        </div>
      </MobileSheet>

      <MobileSheet open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject & send back">
        <div className="m-sheet-stack">
          <p><b>{inspectionPoints.filter((p) => results[p.id] === false).length}</b> failed points · score {score}%</p>
          <label className="m-field">Note for the attendant<textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. hair on pillow, water marks on sink" /></label>
          <button type="button" className={cn("m-photo-btn", photo && "on")} onClick={() => setCamera(true)}>{photo ? <><CheckCircle2 aria-hidden="true" /> Photo attached</> : <><Camera aria-hidden="true" /> Add photo (required)</>}</button>
          <Button
            variant="hmsPrimary"
            size="hmsXl"
            disabled={!photo || !note.trim()}
            onClick={() => {
              hms.submitInspection(room.number, actor, results, { note: note.trim(), photo: true });
              toast.success(`Room ${room.number} sent back to ${staffName(s, room.attendant)} for re-clean`, { duration: 3000 });
              void navigate({ to: "/m/inspections" });
            }}
          >
            Send re-clean
          </Button>
        </div>
      </MobileSheet>
      <CameraSheet open={camera} title="Photo of the issue" onClose={() => setCamera(false)} onCapture={() => setPhoto(true)} />
    </MobileShell>
  );
}

/* ───────────── Work order detail (M-11) ───────────── */

export function MobileWorkOrderDetailPage({ woId }: { woId: string }) {
  const s = useHms();
  const actor = personaStaff.Engineer;
  const wo = s.workOrders.find((w) => w.id === woId);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [note, setNote] = useState("");
  const [needsCleaning, setNeedsCleaning] = useState(true);
  const [photo, setPhoto] = useState(false);
  const [camera, setCamera] = useState(false);
  if (!wo) return <NotFound what={`Work order ${woId}`} back="/m/work-orders" />;
  const room = s.rooms.find((r) => r.number === wo.room);
  const steps = ["OPEN", "ACCEPTED", "IN_PROGRESS", "RESOLVED", "VERIFIED"] as const;
  const at = steps.indexOf(wo.state);

  const footer =
    wo.state === "OPEN" ? (
      <Button variant="hmsPrimary" size="hmsXl" onClick={() => { hms.woAccept(wo.id, actor); toast.success(`${wo.id} accepted`, { duration: 2500 }); }}><Check aria-hidden="true" /> Accept job</Button>
    ) : wo.state === "ACCEPTED" ? (
      <Button variant="hmsPrimary" size="hmsXl" onClick={() => { hms.woStart(wo.id, actor); toast.success("Repair started", { duration: 2000 }); }}><Play aria-hidden="true" /> Start repair</Button>
    ) : wo.state === "IN_PROGRESS" ? (
      <Button variant="hmsPrimary" size="hmsXl" onClick={() => setResolveOpen(true)}><CheckCircle2 aria-hidden="true" /> Resolve</Button>
    ) : (
      <Button variant="hmsSecondary" size="hmsXl" disabled>{wo.state === "RESOLVED" ? "Waiting for supervisor to verify" : "Verified · room released"}</Button>
    );

  return (
    <MobileShell title={wo.id} subtitle={`${wo.urgency} ${wo.category} · Room ${wo.room}`} back={{ to: "/m/work-orders", label: "Jobs" }} footer={footer}>
      <div className="m-stepper">
        {steps.map((st, i) => <span key={st} className={cn(i <= at && "on")}>{st === "IN_PROGRESS" ? "Repair" : st[0] + st.slice(1).toLowerCase()}</span>)}
      </div>
      <div className={cn("m-note", wo.urgency === "P1" ? "m-note-error" : "m-note-warn")}>
        <strong><AlertTriangle aria-hidden="true" /> {wo.description}</strong>
        <p>Reported by {staffName(s, wo.reportedBy)} at {fmtTime(wo.createdAt)} · 📷 1 photo</p>
      </div>
      <dl className="m-facts">
        <div><dt>Room</dt><dd>{wo.room} · {room?.type} · F{room?.floor}</dd></div>
        <div><dt>Occupancy</dt><dd>{room?.occupancy === "OCCUPIED" ? "Occupied — knock first" : "Vacant"}</dd></div>
        <div><dt>Block</dt><dd>{room?.block ? room.block.type : "None"}</dd></div>
        <div><dt>Assigned</dt><dd>{staffName(s, wo.assignee)}</dd></div>
        {wo.resolution ? <div><dt>Resolution</dt><dd>{wo.resolution}</dd></div> : null}
      </dl>
      <p className="m-muted">The room stays blocked until a supervisor verifies your fix.</p>

      <MobileSheet open={resolveOpen} onClose={() => setResolveOpen(false)} title="Resolve job">
        <div className="m-sheet-stack">
          <label className="m-field">What did you fix?<textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. replaced sink trap seal" /></label>
          <button type="button" className={cn("m-photo-btn", photo && "on")} onClick={() => setCamera(true)}>{photo ? <><CheckCircle2 aria-hidden="true" /> After-photo attached</> : <><Camera aria-hidden="true" /> Add after-photo (required)</>}</button>
          <label className="m-toggle"><input type="checkbox" checked={needsCleaning} onChange={(e) => setNeedsCleaning(e.target.checked)} /> Room needs cleaning after repair</label>
          <Button
            variant="hmsPrimary"
            size="hmsXl"
            disabled={!photo || !note.trim()}
            onClick={() => {
              hms.woResolve(wo.id, actor, note.trim(), needsCleaning);
              setResolveOpen(false);
              toast.success(`${wo.id} resolved — supervisor will verify`, { duration: 3000 });
            }}
          >
            Submit fix
          </Button>
        </div>
      </MobileSheet>
      <CameraSheet open={camera} title="After-photo" onClose={() => setCamera(false)} onCapture={() => setPhoto(true)} />
    </MobileShell>
  );
}
