import { personaStaff } from "@/lib/demo-data";
import { demoNow, escalations, lastInspection, useHms } from "@/lib/hms-store";
import { useMobileT } from "@/lib/mobile-i18n";

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
  const tr = useMobileT();
  const { t } = tr;
  const alerts: MobileAlert[] = [];

  if (persona === "Attendant") {
    const me = personaStaff.Attendant;
    for (const r of s.rooms.filter((x) => x.attendant === me)) {
      if (r.queue && r.hk !== "CLEAN" && r.hk !== "INSPECTED") {
        alerts.push({ id: `q-${r.number}`, title: t(`Guest waiting · Room ${r.number}`, `ضيف ينتظر · غرفة ${r.number}`), detail: t(`${r.queue.guest} is in the lobby — clean this room first`, `${tr.guest(r.queue.guest)} في الردهة — نظّف هذه الغرفة أولًا`), tone: "warning", link: { to: "/m/rooms/$roomId", params: { roomId: r.number } } });
      }
      const ins = lastInspection(r);
      if (r.taskType === "RECLEAN" && r.hk !== "CLEAN" && r.hk !== "INSPECTED" && ins?.result === "FAILED") {
        alerts.push({ id: `rc-${r.number}`, title: t(`Re-clean · Room ${r.number}`, `إعادة تنظيف · غرفة ${r.number}`), detail: t(`Failed inspection ${ins.score}%${ins.note ? ` — ${ins.note}` : ""}`, `لم تجتز الفحص ${ins.score}%${ins.note ? ` — ${tr.phrase(ins.note)}` : ""}`), tone: "error", link: { to: "/m/rooms/$roomId", params: { roomId: r.number } } });
      }
      if (r.vip && r.hk === "DIRTY") {
        alerts.push({ id: `vip-${r.number}`, title: t(`VIP arrival · Room ${r.number}`, `وصول ضيف مميز · غرفة ${r.number}`), detail: t(`${r.arrival?.guest ?? "VIP"} at ${r.arrival?.eta ?? "today"}${r.note ? ` · ${r.note}` : ""}`, `${tr.guest(r.arrival?.guest) || "ضيف مميز"} الساعة ${tr.phrase(r.arrival?.eta) || "اليوم"}${r.note ? ` · ${tr.phrase(r.note)}` : ""}`), tone: "info", link: { to: "/m/rooms/$roomId", params: { roomId: r.number } } });
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
        title: r.queue ? t(`⚡ Queue room · Room ${r.number}`, `⚡ ضيف ينتظر · غرفة ${r.number}`) : t(`Ready to inspect · Room ${r.number}`, `جاهزة للفحص · غرفة ${r.number}`),
        detail: r.queue
          ? t(`${r.queue.guest} waiting · ${left > 0 ? `${left} min left on SLA` : `SLA breached ${-left} min ago`}`, `${tr.guest(r.queue.guest)} ينتظر · ${left > 0 ? `باقي ${left} د على المهلة` : `تجاوز المهلة منذ ${-left} د`}`)
          : t(`Marked clean at ${tr.time(r.completedAt)}`, `نظيفة منذ ${tr.time(r.completedAt)}`),
        tone: r.queue ? (left > 0 ? "warning" : "error") : "info",
        link: { to: "/m/inspections/$roomId", params: { roomId: r.number } },
      });
    }
    for (const w of s.workOrders.filter((x) => x.state === "RESOLVED")) {
      alerts.push({ id: `wo-${w.id}`, title: t(`Verify repair · Room ${w.room}`, `تأكيد الإصلاح · غرفة ${w.room}`), detail: t(`${w.id} resolved: ${w.resolution ?? "fixed"} — release the block from Floor board`, `${w.id} تم إصلاحه: ${w.resolution ?? "تم"} — فك الحجز من شاشة الأجنحة`), tone: "info", link: { to: "/m/floor" } });
    }
    for (const e of escalations(s).filter((x) => x.kind === "DND_WELFARE")) {
      alerts.push({ id: e.id, title: t(e.title, `عدم إزعاج طويل · غرفة ${e.room}`), detail: t(e.detail, `عدم إزعاج مستمر · مطلوب الاطمئنان على الضيف`), tone: "dnd", link: { to: "/m/floor" } });
    }
  }

  if (persona === "Engineer") {
    const me = personaStaff.Engineer;
    for (const w of s.workOrders.filter((x) => ["OPEN", "ACCEPTED", "IN_PROGRESS"].includes(x.state) && (x.assignee === me || !x.assignee))) {
      alerts.push({
        id: `wo-${w.id}`,
        title: t(`${w.urgency} ${w.category} · Room ${w.room}`, `${tr.category(w.category)} ${tr.urgency(w.urgency)} · غرفة ${w.room}`),
        detail: t(`${w.description}${w.state === "OPEN" ? ` · waiting ${now - w.createdAt} min to be accepted` : ""}`, `${tr.phrase(w.description)}${w.state === "OPEN" ? ` · ينتظر القبول منذ ${now - w.createdAt} د` : ""}`),
        tone: w.urgency === "P1" ? "error" : "warning",
        link: { to: "/m/work-orders/$woId", params: { woId: w.id } },
      });
    }
  }

  return alerts;
}
