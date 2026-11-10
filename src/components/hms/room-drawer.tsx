import { useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, Circle, CircleSlash, ClipboardCheck, LogIn, LogOut, RotateCcw, ShieldCheck, UserRoundCog, Wrench, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { wingLabel, fmtDuration, fmtTime, hkLabel, inspectionPoints, taskLabel, zoneLabel, type Zone } from "@/lib/demo-data";
import {
  activeMinutes,
  actorFor,
  anomalyLabel,
  checklistFor,
  checklistProgress,
  displayStatus,
  hms,
  isReady,
  lastInspection,
  notReadyReasons,
  roomEvents,
  staffName,
  stdMinutes,
  useHms,
} from "@/lib/hms-store";
import { cn } from "@/lib/utils";
import { QueueGuestDialog, WorkOrderDialog } from "./desktop-dialogs";
import { HeritageNotice, RoomBadges } from "./room-components";
import { StatusChip } from "./status";

export function RoomDrawer({ number, onClose }: { number: string | null; onClose: () => void }) {
  return (
    <Sheet open={!!number} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="room-drawer w-full overflow-y-auto p-0 sm:max-w-[580px]" data-platform="desktop">
        {number ? <RoomDrawerBody number={number} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function RoomDrawerBody({ number }: { number: string }) {
  const s = useHms();
  const room = s.rooms.find((r) => r.number === number);
  const [queueOpen, setQueueOpen] = useState(false);
  const [woOpen, setWoOpen] = useState<string | null>(null);
  if (!room) return null;
  const actor = actorFor(s, "desktop");
  const persona = s.desktopPersona;
  const status = displayStatus(room, s.settings);
  const ready = isReady(s, room);
  const reasons = notReadyReasons(s, room);
  const progress = checklistProgress(s, room);
  const list = checklistFor(s, room);
  const events = roomEvents(s, number).slice().reverse();
  const inspection = lastInspection(room);
  const minutes = activeMinutes(s, room);
  const openWo = s.workOrders.find((w) => w.room === number && w.state !== "VERIFIED");
  const attendants = s.staff.filter((p) => p.role === "ATTENDANT");
  const isManager = persona === "Manager" || persona === "Admin";
  const isFrontDesk = persona === "Front Desk" || persona === "Manager";
  const zones = Array.from(new Set(list.map((it) => it.zone))) as Zone[];

  return (
    <div className="drawer-body">
      <SheetHeader className="drawer-header">
        <div className="drawer-title-row">
          <SheetTitle className="drawer-title">
            Room <bdi>{room.number}</bdi>
          </SheetTitle>
          <StatusChip status={status} />
        </div>
        <SheetDescription>
          {room.type} · {wingLabel(room.floor)} · {taskLabel[room.taskType]}
        </SheetDescription>
        <RoomBadges room={room} />
      </SheetHeader>

      <div className={cn("readiness-box", ready ? "readiness-yes" : "readiness-no")}>
        {ready ? <CheckCircle2 aria-hidden="true" /> : <XCircle aria-hidden="true" />}
        <div>
          <strong>{ready ? "Ready (internal)" : "Not ready for check-in"}</strong>
          <p>{ready ? "Vacant, inspected, and no active blocks." : reasons.join(" · ")}</p>
          <p className="pms-note">Internal readiness · PMS sync not connected</p>
        </div>
      </div>

      <HeritageNotice room={room} compact />

      <dl className="fact-grid">
        <div><dt>Occupancy</dt><dd>{room.occupancy === "OCCUPIED" ? `Occupied${room.guest ? ` · ${room.guest}` : ""}` : "Vacant"}</dd></div>
        <div><dt>Housekeeping</dt><dd>{hkLabel[room.hk]}{room.pauseReason ? ` · ${room.pauseReason}` : ""}</dd></div>
        <div><dt>Attendant</dt><dd>{room.attendant ? staffName(s, room.attendant) : "Unassigned"}</dd></div>
        <div><dt>Checklist</dt><dd>{progress.done}/{progress.total}{progress.skipped ? ` · ${progress.skipped} skipped` : ""}</dd></div>
        <div><dt>Started</dt><dd>{fmtTime(room.startedAt)}</dd></div>
        <div><dt>Finished</dt><dd>{fmtTime(room.completedAt)}</dd></div>
        <div><dt>Active time</dt><dd>{minutes === undefined ? "—" : `${fmtDuration(minutes)} (std ${stdMinutes(room)} min)`}</dd></div>
        <div><dt>Inspection</dt><dd>{inspection ? `${inspection.result === "PASSED" ? "Passed" : "Failed"} · ${inspection.score}% · ${staffName(s, inspection.by)}` : "—"}</dd></div>
        {room.arrival ? <div><dt>Arrival</dt><dd>{room.arrival.guest} · {room.arrival.eta}</dd></div> : null}
        {room.note ? <div><dt>Note</dt><dd>{room.note}</dd></div> : null}
      </dl>

      {room.anomalies.length && persona !== "Front Desk" ? (
        <div className="anomaly-box">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>Accountability signals</strong>
            {room.anomalies.map((a) => (
              <p key={a}>{anomalyLabel[a]}</p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="drawer-actions">
        {isFrontDesk && ready ? (
          <Button variant="hmsPrimary" size="hmsMd" onClick={() => { hms.checkIn(number, actor); toast.success(`Room ${number} checked in`, { duration: 3000 }); }}>
            <LogIn aria-hidden="true" /> Check in
          </Button>
        ) : null}
        {isFrontDesk && room.occupancy === "OCCUPIED" ? (
          <Button variant="hmsSecondary" size="hmsMd" onClick={() => { hms.checkOut(number, actor); toast.success(`Room ${number} checked out → Dirty`, { duration: 3000 }); }}>
            <LogOut aria-hidden="true" /> Check out
          </Button>
        ) : null}
        {isFrontDesk && !ready && room.occupancy === "VACANT" && !room.block && !room.queue ? (
          <Button variant="hmsSecondary" size="hmsMd" onClick={() => setQueueOpen(true)}>
            <Zap aria-hidden="true" /> Queue guest
          </Button>
        ) : null}
        {room.queue && isFrontDesk ? (
          <Button variant="hmsGhost" size="hmsMd" onClick={() => { hms.clearQueue(number, actor); toast.success("Queue cleared", { duration: 2500 }); }}>
            Clear queue
          </Button>
        ) : null}
        {isManager && room.hk === "CLEAN" ? (
          <Button variant="hmsPrimary" size="hmsMd" onClick={() => { hms.remoteApprove(number, actor); toast.success(`Room ${number} remotely approved`, { duration: 3000 }); }}>
            <ShieldCheck aria-hidden="true" /> Remote approve
          </Button>
        ) : null}
        {isManager && room.hk !== "DIRTY" && room.occupancy === "VACANT" ? (
          <Button variant="hmsGhost" size="hmsMd" onClick={() => { hms.resetStatus(number, actor, "Manager override"); toast.success(`Room ${number} reset to Dirty`, { duration: 3000 }); }}>
            <RotateCcw aria-hidden="true" /> Reset to dirty
          </Button>
        ) : null}
        {room.dnd && isManager ? (
          <Button variant="hmsGhost" size="hmsMd" onClick={() => { hms.clearDnd(number, actor, "DND cleared by manager"); toast.success("DND cleared", { duration: 2500 }); }}>
            Clear DND
          </Button>
        ) : null}
        {openWo ? (
          <Button variant="hmsGhost" size="hmsMd" onClick={() => setWoOpen(openWo.id)}>
            <Wrench aria-hidden="true" /> {openWo.id}
          </Button>
        ) : null}
        {isManager && !room.block ? (
          <label className="inline-select">
            <UserRoundCog aria-hidden="true" />
            <span className="sr-only">Assign attendant</span>
            <select
              value={room.attendant ?? ""}
              onChange={(event) => {
                hms.assignRoom(number, event.target.value || null, actor);
                toast.success(event.target.value ? `Assigned to ${staffName(s, event.target.value)}` : "Room unassigned", { duration: 2500 });
              }}
            >
              <option value="">Unassigned</option>
              {attendants.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <Tabs defaultValue="checklist" className="drawer-tabs">
        <TabsList>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="timeline">Timeline ({events.length})</TabsTrigger>
          <TabsTrigger value="inspection">Inspection</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist">
          {!room.startedAt && !Object.keys(room.items).length ? <p className="muted-line">Not started yet — items will appear here with who ticked them and when.</p> : null}
          {zones.map((zone) => (
            <section className="check-zone" key={zone}>
              <h4>{zoneLabel[zone]}</h4>
              {list
                .filter((it) => it.zone === zone)
                .map((it) => {
                  const res = room.items[it.id];
                  return (
                    <div className={cn("check-row", res?.status === "DONE" && "check-done", res?.status === "SKIPPED" && "check-skipped")} key={it.id}>
                      {res?.status === "DONE" ? <CheckCircle2 aria-label="Done" /> : res?.status === "SKIPPED" ? <CircleSlash aria-label="Skipped" /> : <Circle aria-label="Not done" />}
                      <span className="check-label">
                        {it.label}
                        {it.mandatory ? <em>Required</em> : null}
                        {res?.skipReason ? <small> · Skipped: {res.skipReason}</small> : null}
                      </span>
                      <span className="check-meta">
                        {res?.photo ? <Camera aria-label="Photo attached" /> : it.photo ? <Camera className="photo-missing" aria-label="Photo required" /> : null}
                        {res ? `${staffName(s, res.by).split(" ")[0]} · ${fmtTime(res.at)}` : "—"}
                      </span>
                    </div>
                  );
                })}
            </section>
          ))}
        </TabsContent>

        <TabsContent value="timeline">
          <ol className="audit-list">
            {events.length === 0 ? <li className="muted-line">No activity today.</li> : null}
            {events.map((e) => (
              <li key={e.id} className={cn(e.override && "audit-override")}>
                <time>{fmtTime(e.at)}</time>
                <div>
                  <strong>{staffName(s, e.actor)}</strong>
                  <span>{e.text}</span>
                  {e.override ? <em>Override</em> : null}
                </div>
              </li>
            ))}
          </ol>
        </TabsContent>

        <TabsContent value="inspection">
          {room.inspections.length === 0 ? <p className="muted-line">No inspection yet.</p> : null}
          {room.inspections
            .slice()
            .reverse()
            .map((ins, index) => (
              <article className={cn("inspection-result", ins.result === "PASSED" ? "inspection-pass" : "inspection-fail")} key={`${ins.at}-${index}`}>
                <header>
                  <ClipboardCheck aria-hidden="true" />
                  <strong>{ins.result === "PASSED" ? "Passed" : "Failed"} · {ins.score}%</strong>
                  <span>{staffName(s, ins.by)} · {fmtTime(ins.at)}{ins.remote ? " · remote" : ""}</span>
                </header>
                {ins.failed.length ? (
                  <ul>
                    {ins.failed.map((id) => (
                      <li key={id}>✘ {inspectionPoints.find((p) => p.id === id)?.label ?? id}</li>
                    ))}
                  </ul>
                ) : null}
                {ins.note ? <p>“{ins.note}”{ins.photo ? " · 📷 photo attached" : ""}</p> : null}
              </article>
            ))}
        </TabsContent>
      </Tabs>

      <QueueGuestDialog open={queueOpen} onOpenChange={setQueueOpen} defaultRoom={number} />
      <WorkOrderDialog id={woOpen} onClose={() => setWoOpen(null)} />
    </div>
  );
}
