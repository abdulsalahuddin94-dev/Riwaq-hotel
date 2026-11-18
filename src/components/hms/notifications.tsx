import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Moon,
  Phone,
  ShieldCheck,
  Zap,
} from "./msym";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DEMO_DATE,
  fmtDay,
  fmtTime,
  followUpLabel,
  guestRequestLabel,
  statusMeta,
} from "@/lib/demo-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  actorFor,
  demoNow,
  displayStatus,
  type Escalation,
  escalations,
  hms,
  type HmsState,
  needsFollowUp,
  staffName,
  useHms,
} from "@/lib/hms-store";
import { cn } from "@/lib/utils";
import { useDesktop } from "./desktop-shell";
import { arrivalRisk } from "./readiness";

/** The one action that resolves an escalation, shown on its notification. */
export function EscalationAction({
  alert,
  s,
  size = "hmsMd",
}: {
  alert: Escalation;
  s: HmsState;
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
  return null;
}

type NoteItem = {
  id: string;
  rank: number;
  tone: "error" | "warning" | "dnd" | "info" | "success";
  icon: typeof AlertTriangle;
  title: string;
  detail: string;
  room: string;
  alert?: Escalation;
  link?: "/app/reservations";
};

/** Everything that used to sit in "Needs you now", plus reception request updates. Front Desk sees guest-facing items only. */
export function notificationItems(s: HmsState): NoteItem[] {
  const now = demoNow(s);
  const frontDesk = s.desktopPersona === "Front Desk";
  const items: NoteItem[] = [];
  const esc = frontDesk ? [] : escalations(s);
  const escRooms = new Set(esc.filter((e) => e.kind === "QUEUE_SLA").map((e) => e.room));
  for (const e of esc) {
    items.push({
      id: e.id,
      rank: e.tone === "error" ? 0 : e.kind === "QUEUE_SLA" ? 1 : 3,
      tone: e.tone,
      icon: e.kind === "DND_WELFARE" ? Moon : AlertTriangle,
      title: e.title,
      detail: e.detail,
      room: e.room,
      alert: e,
    });
  }
  for (const r of s.rooms) {
    if (r.queue && !escRooms.has(r.number)) {
      const st = displayStatus(r, s.settings);
      const ready = st === "READY";
      items.push({
        id: `wait-${r.number}`,
        rank: ready ? 0 : 1,
        tone: ready ? "success" : "warning",
        icon: ready ? CheckCircle2 : Zap,
        title: ready
          ? `Room ${r.number} is ready for ${r.queue.guest}`
          : `${r.queue.guest} waiting in the lobby`,
        detail: ready
          ? "Confirmed by the supervisor · you can check the guest in"
          : `Room ${r.number} is ${statusMeta[st].label.toLowerCase()} · waiting ${Math.max(0, now - r.queue.at)} min`,
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
  for (const res of s.reservations.filter((x) => needsFollowUp(s, x))) {
    const last = res.followUps[res.followUps.length - 1];
    items.push({
      id: `res-${res.id}`,
      rank: 2,
      tone: "warning",
      icon: Phone,
      title: `Follow up ${res.guestName}`,
      detail: `Expected ${res.arrivalDate === DEMO_DATE ? "" : `${fmtDay(res.arrivalDate)} `}${res.expectedCheckIn} · not arrived${last ? ` · last call: ${followUpLabel[last.outcome].toLowerCase()}` : ""}`,
      room: res.roomId ?? "",
      link: "/app/reservations",
    });
  }
  for (const q of s.requests) {
    const label = guestRequestLabel[q.type];
    if (frontDesk && q.status === "acknowledged") {
      items.push({
        id: `req-${q.id}`,
        rank: 4,
        tone: "info",
        icon: ClipboardCheck,
        title: `${label} · Room ${q.room} on the way`,
        detail: `${staffName(s, q.assignedTo)} acknowledged at ${fmtTime(q.acknowledgedAt)}`,
        room: q.room,
      });
    } else if (
      frontDesk &&
      q.status === "completed" &&
      q.completedAt !== undefined &&
      now - q.completedAt <= 60
    ) {
      items.push({
        id: `req-${q.id}`,
        rank: 4,
        tone: "success",
        icon: CheckCircle2,
        title: `${label} · Room ${q.room} done`,
        detail: `Completed by ${staffName(s, q.assignedTo)} at ${fmtTime(q.completedAt)}`,
        room: q.room,
      });
    } else if (!frontDesk && q.status === "pending" && now - q.requestedAt > 15) {
      items.push({
        id: `req-${q.id}`,
        rank: 3,
        tone: "warning",
        icon: ClipboardCheck,
        title: `${label} · Room ${q.room} not picked up`,
        detail: `Sent ${now - q.requestedAt} min ago to ${staffName(s, q.assignedTo)}`,
        room: q.room,
      });
    }
  }
  return items.sort((a, b) => a.rank - b.rank);
}

/** The bell that replaces the Live Board's "Needs you now" section. Lives in the page heading (on the welcome photo on the Live Board). */
export function NotificationBell({ onPhoto = false }: { onPhoto?: boolean }) {
  const s = useHms();
  const { openRoom } = useDesktop();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = notificationItems(s);
  const actor = actorFor(s, "desktop");
  const urgent = items.some((i) => i.tone === "error");
  const Icon = items.length ? BellRing : Bell;
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "notif-bell",
              onPhoto && "notif-bell-photo",
              urgent && "notif-bell-urgent",
            )}
            aria-label={
              items.length
                ? `Notifications, ${items.length} need attention`
                : "Notifications, all clear"
            }
            title="Notifications"
          >
            <Icon aria-hidden="true" />
            {items.length ? <b className="notif-count">{items.length}</b> : null}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={10} className="notif-panel" data-platform="desktop">
          <header className="notif-head">
            <h2>Notifications</h2>
            <span>{items.length ? `${items.length} need attention` : "All clear"}</span>
          </header>
          {items.length === 0 ? (
            <p className="notif-empty">
              <CheckCircle2 aria-hidden="true" /> No waiting guests, breached SLAs or arrivals at
              risk.
            </p>
          ) : (
            <ul className="now-list notif-list">
              {items.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <li key={item.id} className={cn("now-item", `now-${item.tone}`)}>
                    <span className="now-icon">
                      <ItemIcon aria-hidden="true" />
                    </span>
                    <div className="now-text">
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                      <div className="now-actions">
                        {item.link ? (
                          <Button
                            variant="hmsSecondary"
                            size="hmsSm"
                            onClick={() => {
                              setOpen(false);
                              void navigate({ to: item.link! });
                            }}
                          >
                            <Phone aria-hidden="true" /> Open booking
                          </Button>
                        ) : null}
                        {item.room ? (
                          <Button
                            variant="hmsGhost"
                            size="hmsSm"
                            onClick={() => {
                              setOpen(false);
                              openRoom(item.room);
                            }}
                          >
                            Room {item.room}
                          </Button>
                        ) : null}
                        {item.alert ? (
                          <>
                            <EscalationAction alert={item.alert} s={s} size="hmsSm" />
                            <Button
                              variant="hmsGhost"
                              size="hmsSm"
                              onClick={() => {
                                if (!item.alert) return;
                                hms.resolveEscalation(
                                  item.alert.id,
                                  actor,
                                  `Escalation acknowledged · ${item.alert.title}`,
                                  item.alert.room,
                                );
                                toast.success("Acknowledged", { duration: 2000 });
                              }}
                            >
                              Acknowledge
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}
