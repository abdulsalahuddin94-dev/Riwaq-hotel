import { fmtTime, personaStaff } from "@/lib/demo-data";
import { demoNow, escalations, lastInspection, useHms } from "@/lib/hms-store";

export type MobileAlert = {
  id: string;
  title: string;
  detail: string;
  tone: "warning" | "error" | "dnd" | "info";
  link: { to: string; params?: Record<string, string> };
};

/** Role-aware notifications derived from live demo state. */
export function useMobileAlerts(): MobileAlert[] {
  const s = useHms();
  const persona = s.mobilePersona;
  const now = demoNow(s);
  const alerts: MobileAlert[] = [];

  if (persona === "Attendant") {
    const me = personaStaff.Attendant;
    for (const r of s.rooms.filter((x) => x.attendant === me)) {
      if (r.queue && r.hk !== "CLEAN" && r.hk !== "INSPECTED") {
        alerts.push({ id: `q-${r.number}`, title: `Guest waiting · Room ${r.number}`, detail: `${r.queue.guest} is in the lobby — clean this room first`, tone: "warning", link: { to: "/m/rooms/$roomId", params: { roomId: r.number } } });
      }
      const ins = lastInspection(r);
      if (r.taskType === "RECLEAN" && r.hk !== "CLEAN" && r.hk !== "INSPECTED" && ins?.result === "FAILED") {
        alerts.push({ id: `rc-${r.number}`, title: `Re-clean · Room ${r.number}`, detail: `Failed inspection ${ins.score}%${ins.note ? ` — ${ins.note}` : ""}`, tone: "error", link: { to: "/m/rooms/$roomId", params: { roomId: r.number } } });
      }
      if (r.vip && r.hk === "DIRTY") {
        alerts.push({ id: `vip-${r.number}`, title: `VIP arrival · Room ${r.number}`, detail: `${r.arrival?.guest ?? "VIP"} at ${r.arrival?.eta ?? "today"}${r.note ? ` · ${r.note}` : ""}`, tone: "info", link: { to: "/m/rooms/$roomId", params: { roomId: r.number } } });
      }
    }
  }

  if (persona === "Supervisor") {
    const me = s.staff.find((p) => p.id === personaStaff.Supervisor);
    const floors = me?.floors ?? [1, 2, 3];
    for (const r of s.rooms.filter((x) => x.hk === "CLEAN" && floors.includes(x.floor))) {
      const left = r.completedAt !== undefined ? r.completedAt + s.settings.queueSlaMin - now : 0;
      alerts.push({
        id: `insp-${r.number}`,
        title: `${r.queue ? "⚡ Queue room" : "Ready to inspect"} · Room ${r.number}`,
        detail: r.queue ? `${r.queue.guest} waiting · ${left > 0 ? `${left} min left on SLA` : `SLA breached ${-left} min ago`}` : `Marked clean at ${fmtTime(r.completedAt)}`,
        tone: r.queue ? (left > 0 ? "warning" : "error") : "info",
        link: { to: "/m/inspections/$roomId", params: { roomId: r.number } },
      });
    }
    for (const w of s.workOrders.filter((x) => x.state === "RESOLVED")) {
      alerts.push({ id: `wo-${w.id}`, title: `Verify repair · Room ${w.room}`, detail: `${w.id} resolved: ${w.resolution ?? "fixed"} — release the block from Floor board`, tone: "info", link: { to: "/m/floor" } });
    }
    for (const e of escalations(s).filter((x) => x.kind === "DND_WELFARE")) {
      alerts.push({ id: e.id, title: e.title, detail: e.detail, tone: "dnd", link: { to: "/m/floor" } });
    }
  }

  if (persona === "Engineer") {
    const me = personaStaff.Engineer;
    for (const w of s.workOrders.filter((x) => ["OPEN", "ACCEPTED", "IN_PROGRESS"].includes(x.state) && (x.assignee === me || !x.assignee))) {
      alerts.push({
        id: `wo-${w.id}`,
        title: `${w.urgency} ${w.category} · Room ${w.room}`,
        detail: `${w.description}${w.state === "OPEN" ? ` · waiting ${now - w.createdAt} min to be accepted` : ""}`,
        tone: w.urgency === "P1" ? "error" : "warning",
        link: { to: "/m/work-orders/$woId", params: { woId: w.id } },
      });
    }
  }

  return alerts;
}
