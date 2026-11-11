import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Moon,
  ShieldCheck,
  Wrench,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fmtTime, statusMeta } from "@/lib/demo-data";
import {
  actorFor,
  demoNow,
  displayStatus,
  type Escalation,
  escalations,
  hms,
  type HmsState,
  useHms,
} from "@/lib/hms-store";
import { cn } from "@/lib/utils";
import { WorkOrderDialog } from "./desktop-dialogs";
import { useDesktop } from "./desktop-shell";
import { arrivalRisk } from "./readiness";

/** The one action that resolves an escalation. Shared by the Now strip and the Escalation Center. */
export function EscalationAction({
  alert,
  s,
  onAssign,
  size = "hmsMd",
}: {
  alert: Escalation;
  s: HmsState;
  onAssign: (woId: string | null) => void;
  size?: "hmsMd" | "hmsSm";
}) {
  const actor = actorFor(s, "desktop");
  if (alert.kind === "QUEUE_SLA")
    return (
      <Button
        variant="hmsPrimary"
        size={size}
        onClick={() => {
          hms.remoteApprove(alert.room, actor);
          hms.resolveEscalation(
            alert.id,
            actor,
            "Queue SLA resolved by remote approval",
            alert.room,
          );
        }}
      >
        <ShieldCheck aria-hidden="true" /> Remote approve
      </Button>
    );
  if (alert.kind === "DND_WELFARE")
    return (
      <Button
        variant="hmsPrimary"
        size={size}
        onClick={() => {
          hms.clearDnd(alert.room, actor, "Welfare check completed · guest OK");
          hms.resolveEscalation(alert.id, actor, "Welfare check done", alert.room);
          toast.success("Welfare check logged", { duration: 2500 });
        }}
      >
        Welfare check done
      </Button>
    );
  if (alert.kind === "P1_UNACCEPTED")
    return (
      <Button variant="hmsPrimary" size={size} onClick={() => onAssign(alert.woId ?? null)}>
        Assign engineer
      </Button>
    );
  return null;
}

type NowItem = {
  id: string;
  rank: number;
  tone: "error" | "warning" | "dnd" | "info";
  icon: typeof AlertTriangle;
  title: string;
  detail: string;
  room: string;
  alert?: Escalation;
};

function nowItems(s: HmsState): NowItem[] {
  const now = demoNow(s);
  const items: NowItem[] = [];
  const esc = escalations(s);
  const escRooms = new Set(esc.filter((e) => e.kind === "QUEUE_SLA").map((e) => e.room));
  for (const e of esc) {
    items.push({
      id: e.id,
      rank: e.tone === "error" ? 0 : e.kind === "QUEUE_SLA" ? 1 : 3,
      tone: e.tone,
      icon: e.kind === "DND_WELFARE" ? Moon : e.kind === "P1_UNACCEPTED" ? Wrench : AlertTriangle,
      title: e.title,
      detail: e.detail,
      room: e.room,
      alert: e,
    });
  }
  for (const r of s.rooms) {
    if (r.queue && !escRooms.has(r.number)) {
      const st = displayStatus(r, s.settings);
      items.push({
        id: `wait-${r.number}`,
        rank: 1,
        tone: "warning",
        icon: Zap,
        title: `${r.queue.guest} waiting in the lobby`,
        detail: `Room ${r.number} is ${statusMeta[st].label.toLowerCase()} · waiting ${Math.max(0, now - r.queue.at)} min`,
        room: r.number,
      });
      continue;
    }
    if (!r.queue && r.arrival) {
      const risk = arrivalRisk(s, r);
      if (risk?.risk === "late") {
        items.push({
          id: `arr-${r.number}`,
          rank: 2,
          tone: "info",
          icon: CalendarClock,
          title: `${r.vip ? "VIP arrival" : "Arrival"} ${fmtTime(risk.eta)} at risk`,
          detail: `${r.arrival.guest} · Room ${r.number} ${risk.readyAt === null ? `is ${statusMeta[displayStatus(r, s.settings)].label.toLowerCase()}` : `estimated ready ${fmtTime(risk.readyAt)}`}`,
          room: r.number,
        });
      }
    }
  }
  return items.sort((a, b) => a.rank - b.rank);
}

const MAX = 4;

/** "What needs me now?" — the first thing on the Live Board. */
export function NowStrip() {
  const s = useHms();
  const { openRoom } = useDesktop();
  const [woId, setWoId] = useState<string | null>(null);
  const items = nowItems(s);
  const shown = items.slice(0, MAX);
  const rest = items.length - shown.length;

  if (!items.length)
    return (
      <section className="now-strip now-strip-clear" aria-label="Needs you now">
        <CheckCircle2 aria-hidden="true" />
        <p>
          <strong>All clear.</strong> No waiting guests, breached SLAs or arrivals at risk.
        </p>
      </section>
    );

  return (
    <section className="now-strip" aria-labelledby="now-title">
      <header className="now-head">
        <h2 id="now-title">
          Needs you now <span className="now-count">{items.length}</span>
        </h2>
        {rest > 0 ? (
          <Link to="/app/escalations" className="now-more">
            {rest} more · Escalation Center
          </Link>
        ) : null}
      </header>
      <ul className="now-list">
        {shown.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id} className={cn("now-item", `now-${item.tone}`)}>
              <span className="now-icon">
                <Icon aria-hidden="true" />
              </span>
              <div className="now-text">
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
              <div className="now-actions">
                <Button variant="hmsGhost" size="hmsSm" onClick={() => openRoom(item.room)}>
                  Room {item.room}
                </Button>
                {item.alert ? (
                  <EscalationAction alert={item.alert} s={s} onAssign={setWoId} size="hmsSm" />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <WorkOrderDialog id={woId} onClose={() => setWoId(null)} />
    </section>
  );
}
