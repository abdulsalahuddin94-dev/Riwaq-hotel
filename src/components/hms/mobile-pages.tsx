import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Bell, ChevronLeft, ChevronRight, CircleUserRound, Delete, Languages, LogOut, ShieldCheck, Smartphone, Wifi, Wrench, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { personaStaff, property, type Room } from "@/lib/demo-data";
import {
  activeMinutes,
  checklistProgress,
  demoNow,
  displayStatus,
  hms,
  lastInspection,
  roomCredits,
  staffById,
  useHms,
} from "@/lib/hms-store";
import { setLang, useMobileT } from "@/lib/mobile-i18n";
import { cn } from "@/lib/utils";
import { EmptyState } from "./demo-states";
import { HotelBadge, HotelMark, PoweredByRiwaq } from "./hotel-mark";
import { EmptyArt, Picto, RoleArt, RoomArt, RoomPhoto, StaffAvatar, categoryIcon, photos } from "./illustrations";
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

/** English / العربية switch. One language on screen at a time. */
export function LangSwitch({ className }: { className?: string }) {
  const { lang } = useMobileT();
  return (
    <div className={cn("lang-switch", className)} dir="ltr" role="group" aria-label="Language / اللغة">
      <Button variant="hmsGhost" type="button" aria-label="English" aria-pressed={lang === "en"} className={cn("lang-option", lang === "en" && "on")} onClick={() => setLang("en")}>EN</Button>
      <Button variant="hmsGhost" type="button" aria-label="العربية" aria-pressed={lang === "ar"} className={cn("lang-option", lang === "ar" && "on")} onClick={() => setLang("ar")} lang="ar">ع</Button>
    </div>
  );
}

/* ───────────── Attendant: My Rooms ───────────── */

export function MobileRoomsPage() {
  const s = useHms();
  const { t } = useMobileT();
  const [filter, setFilter] = useState<"todo" | "done" | "issues">("todo");
  const me = personaStaff.Attendant;
  const mine = s.rooms.filter((r) => r.attendant === me).sort((a, b) => priority(a) - priority(b) || a.number.localeCompare(b.number));
  const done = mine.filter((r) => r.hk === "CLEAN" || r.hk === "INSPECTED");
  const issues = mine.filter((r) => r.dnd || r.block || r.taskType === "RECLEAN" || r.refused);
  const todo = mine.filter((r) => !done.includes(r) && !r.block);
  const list = filter === "todo" ? todo : filter === "done" ? done : issues;
  const pct = mine.length ? Math.round((done.length / mine.length) * 100) : 0;
  return (
    <MobileShell title={t("My Rooms", "غرفي")}>
      <div className="mobile-sync"><Wifi aria-hidden="true" /> {t("Saved on this device", "محفوظ على هذا الجهاز")} <span>{t(`${done.length} of ${mine.length} complete`, `${done.length} من ${mine.length} مكتملة`)}</span></div>
      <div className="m-day-card">
        <img src={photos.shiftSuite} alt="" width={1536} height={1024} className="m-day-art" />
        <div>
          <strong>{done.length} <small>{t(`of ${mine.length} rooms done`, `من ${mine.length} غرف انتهت`)}</small></strong>
          <div className="mobile-progress-summary"><div><span style={{ inlineSize: `${pct}%` }} /></div><b>{pct}%</b></div>
        </div>
      </div>
      <div className="m-chips" role="tablist">
        {([["todo", t("To do", "المطلوب"), todo.length], ["done", t("Done", "انتهت"), done.length], ["issues", t("Issues", "مشكلات"), issues.length]] as const).map(([k, label, n]) => (
          <button type="button" role="tab" aria-selected={filter === k} key={k} className={cn("m-chip", filter === k && "m-chip-on")} onClick={() => setFilter(k)}>
            {label} <b>{n}</b>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState art={<EmptyArt kind={filter === "issues" ? "rest" : filter === "todo" ? "done" : "search"} className="empty-art" />} title={filter === "todo" ? t("All your rooms are done", "خلصت كل غرفك") : filter === "done" ? t("Nothing finished yet", "لا شيء مكتمل بعد") : t("No issues on your rooms", "لا مشكلات في غرفك")} />
      ) : (
        <div className="mobile-room-list">{list.map((room) => <RoomCard room={room} s={s} key={room.number} />)}</div>
      )}
    </MobileShell>
  );
}

/* ───────────── Alerts ───────────── */

export function MobileAlertsPage() {
  const alerts = useMobileAlerts();
  const { t } = useMobileT();
  return (
    <MobileShell title={t("Alerts", "التنبيهات")}>
      {alerts.length === 0 ? (
        <EmptyState art={<EmptyArt kind="rest" className="empty-art" />} title={t("You're all caught up", "لا جديد الآن")} />
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
  const tr = useMobileT();
  const { t } = tr;
  const persona = useMobilePersona();
  const navigate = useNavigate();
  const id = personaStaff[persona];
  const person = s.staff.find((p) => p.id === id);
  let stats: [string, string][] = [];
  if (persona === "Attendant") {
    const mine = s.rooms.filter((r) => r.attendant === id);
    const done = mine.filter((r) => r.hk === "CLEAN" || r.hk === "INSPECTED");
    const ins = mine.flatMap((r) => r.inspections);
    stats = [[`${done.length}/${mine.length}`, t("Rooms done", "غرف منتهية")], [mine.reduce((a, r) => a + roomCredits(r), 0).toFixed(1), t("Credits", "النقاط")], [ins.length ? `${Math.round((ins.filter((i) => i.result === "PASSED").length / ins.length) * 100)}%` : "—", t("Pass rate", "نسبة النجاح")]];
  } else if (persona === "Supervisor") {
    const mine = s.rooms.flatMap((r) => r.inspections).filter((i) => i.by === id);
    const avg = mine.length ? Math.round(mine.reduce((a, i) => a + i.score, 0) / mine.length) : 0;
    stats = [[String(mine.length), t("Inspected", "تم فحصها")], [String(mine.filter((i) => i.result === "FAILED").length), t("Rejected", "مرفوضة")], [mine.length ? `${avg}%` : "—", t("Avg. score", "متوسط الدرجة")]];
  } else {
    const mine = s.workOrders.filter((w) => w.assignee === id);
    stats = [[String(mine.filter((w) => ["RESOLVED", "VERIFIED"].includes(w.state)).length), t("Resolved", "تم حلها")], [String(mine.filter((w) => !["RESOLVED", "VERIFIED"].includes(w.state)).length), t("Open", "مفتوحة")], [String(mine.filter((w) => w.urgency === "P1").length), t("Urgent jobs", "مهام عاجلة")]];
  }
  return (
    <MobileShell title={t("Me", "حسابي")}>
      <div className="mobile-profile">
        {person ? <StaffAvatar staff={person} className="profile-art" /> : null}
        <h2>{tr.person(person?.name)}</h2>
        <p>{person ? tr.role(person.role) : ""} · {t("Morning shift · started 07:30", "الوردية الصباحية · بدأت 07:30")}</p>
      </div>
      <div className="mobile-stats">
        {stats.map(([v, l]) => <article key={l}><strong>{v}</strong><span>{l}</span></article>)}
      </div>
      <div className="mobile-settings-list">
        <button type="button" onClick={() => toast.info(t("All changes are saved on this device.", "كل التغييرات محفوظة على هذا الجهاز."), { duration: 2500 })}><Wifi aria-hidden="true" /> {t("Sync status", "حالة المزامنة")} <span>{t("On device", "على الجهاز")} · {tr.time(demoNow(s))}</span></button>
        <div className="mobile-settings-row"><Languages aria-hidden="true" /> {t("Language", "اللغة")} <LangSwitch /></div>
        <button type="button" onClick={() => { toast.success(t("Shift ended · see you tomorrow", "انتهت الوردية · نراك غدًا"), { duration: 2500 }); void navigate({ to: "/m/login" }); }}><LogOut aria-hidden="true" /> {t("End shift", "إنهاء الوردية")} <ChevronRight aria-hidden="true" /></button>
      </div>
      <PoweredByRiwaq />
    </MobileShell>
  );
}

/* ───────────── Supervisor: inspection queue ───────────── */

export function MobileInspectionsPage() {
  const s = useHms();
  const tr = useMobileT();
  const { t } = tr;
  const me = s.staff.find((p) => p.id === personaStaff.Supervisor);
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const now = demoNow(s);
  const list = s.rooms
    .filter((r) => r.hk === "CLEAN" && (scope === "all" || (me?.floors ?? []).includes(r.floor)))
    .sort((a, b) => Number(!!b.queue) - Number(!!a.queue) || Number(!!b.vip) - Number(!!a.vip) || (a.completedAt ?? 0) - (b.completedAt ?? 0));
  const queued = list.filter((r) => r.queue).length;
  return (
    <MobileShell title={t("Inspection Queue", "قائمة الفحص")}>
      {queued ? <div className="mobile-callout"><Zap aria-hidden="true" /> {t(`${queued} queue room${queued > 1 ? "s" : ""} — guest waiting, inspect first.`, `${queued} غرفة عليها ضيف ينتظر — افحصها أولًا.`)}</div> : null}
      <div className="m-chips">
        <button type="button" className={cn("m-chip", scope === "mine" && "m-chip-on")} onClick={() => setScope("mine")}>{t("My wings", "أجنحتي")}</button>
        <button type="button" className={cn("m-chip", scope === "all" && "m-chip-on")} onClick={() => setScope("all")}>{t("All wings", "كل الأجنحة")}</button>
      </div>
      {list.length === 0 ? (
        <EmptyState art={<EmptyArt kind="done" className="empty-art" />} title={t("All caught up · no rooms waiting", "لا غرف بانتظار الفحص")} />
      ) : (
        <div className="mobile-room-list">
          {list.map((room) => {
            const left = room.completedAt !== undefined ? room.completedAt + s.settings.queueSlaMin - now : 0;
            const p = checklistProgress(s, room);
            const guest = tr.guest(room.queue?.guest);
            return (
              <Link to="/m/inspections/$roomId" params={{ roomId: room.number }} className="inspection-card" key={room.number}>
                <div className="insp-head">
                  <RoomPhoto type={room.type} className="room-thumb" refined />
                  <div>
                    <span>{tr.roomType(room.type)} · {tr.wingShort(room.floor)}</span>
                    <h2><bdi>{room.number}</bdi></h2>
                  </div>
                </div>
                <StatusChip status={displayStatus(room, s.settings)} />
                <p className="insp-meta">
                  {tr.person(staffById(s, room.attendant)?.name)} · {tr.duration(activeMinutes(s, room))} · {p.done}/{p.total} {t("items", "بند")}{p.skipped ? t(` (${p.skipped} skipped)`, ` (${p.skipped} متخطى)`) : ""}
                </p>
                <RoomBadges room={room} />
                {room.queue ? <p className={cn("sla-line", left <= 0 && "sla-breached")}>⏱ {left > 0 ? t(`${left} min left for ${guest}`, `باقي ${left} د على ${guest}`) : t(`SLA breached ${-left} min ago`, `تجاوز المهلة منذ ${-left} د`)}</p> : null}
                <span className="m-card-cta">{t("Inspect", "افحص")} <ChevronRight aria-hidden="true" /></span>
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
  const tr = useMobileT();
  const { t } = tr;
  const me = s.staff.find((p) => p.id === personaStaff.Supervisor);
  const [floor, setFloor] = useState(me?.floors?.[0] ?? 1);
  const [open, setOpen] = useState<string | null>(null);
  const rooms = s.rooms.filter((r) => r.floor === floor);
  const room = s.rooms.find((r) => r.number === open);
  const actor = personaStaff.Supervisor;
  const attendants = s.staff.filter((p) => p.role === "ATTENDANT");
  const wo = room ? s.workOrders.find((w) => w.room === room.number && w.state !== "VERIFIED") : undefined;
  const nameOf = (id: string | null | undefined) => tr.person(staffById(s, id)?.name);
  return (
    <MobileShell title={t("Wings", "الأجنحة")}>
      <div className="m-chips">
        {[1, 2, 3, 4, 5].map((f) => (
          <button type="button" key={f} className={cn("m-chip", floor === f && "m-chip-on")} onClick={() => setFloor(f)}>{tr.wingShort(f)}</button>
        ))}
      </div>
      <div className="mobile-floor-grid">
        {rooms.map((r) => {
          const st = displayStatus(r, s.settings);
          return (
            <button type="button" className={cn("m-floor-tile", statusClass[st])} key={r.number} onClick={() => setOpen(r.number)}>
              <strong><bdi>{r.number}</bdi></strong>
              <StatusChip status={st} compact />
              <span>{r.attendant ? tr.first(staffById(s, r.attendant)?.name) : "—"}{r.queue ? " · ⚡" : ""}{r.anomalies.length ? " · ⚠" : ""}</span>
            </button>
          );
        })}
      </div>
      <MobileSheet open={!!room} onClose={() => setOpen(null)} title={room ? t(`Room ${room.number}`, `غرفة ${room.number}`) : ""}>
        {room ? (
          <div className="m-sheet-stack">
            <div className="m-row-between"><span>{tr.roomType(room.type)} · {tr.wing(room.floor)}</span><StatusChip status={displayStatus(room, s.settings)} /></div>
            <dl className="m-facts">
              <div><dt>{t("Attendant", "العاملة")}</dt><dd>{nameOf(room.attendant)}</dd></div>
              <div><dt>{t("Checklist", "القائمة")}</dt><dd>{checklistProgress(s, room).done}/{checklistProgress(s, room).total}</dd></div>
              <div><dt>{t("Time", "الوقت")}</dt><dd>{tr.duration(activeMinutes(s, room))}</dd></div>
              <div><dt>{t("Last inspection", "آخر فحص")}</dt><dd>{lastInspection(room) ? `${lastInspection(room)?.result === "PASSED" ? "✔" : "✘"} ${lastInspection(room)?.score}%` : "—"}</dd></div>
            </dl>
            {room.block ? <p className="m-note m-note-blocked"><Wrench aria-hidden="true" /> {tr.phrase(room.block.reason)}</p> : null}
            {room.hk === "CLEAN" ? (
              <Button asChild variant="hmsPrimary" size="hmsXl"><Link to="/m/inspections/$roomId" params={{ roomId: room.number }}><ShieldCheck aria-hidden="true" /> {t("Inspect now", "افحص الآن")}</Link></Button>
            ) : null}
            {wo?.state === "RESOLVED" ? (
              <Button variant="hmsPrimary" size="hmsXl" onClick={() => { hms.woVerify(wo.id, actor); toast.success(t(`Room ${room.number} released — post-repair clean queued`, `تم فك حجز الغرفة ${room.number} — أُضيف تنظيف بعد الصيانة`), { duration: 3000 }); setOpen(null); }}>
                {t("Verify repair & release", "تأكيد الإصلاح وفك الحجز")}
              </Button>
            ) : null}
            {room.dnd ? (
              <Button variant="hmsSecondary" size="hmsLg" onClick={() => { hms.clearDnd(room.number, actor, "Welfare check done by supervisor"); toast.success(t("DND cleared", "أُزيلت علامة عدم الإزعاج"), { duration: 2500 }); }}>{t("Welfare check done · clear DND", "تم الاطمئنان · إزالة عدم الإزعاج")}</Button>
            ) : null}
            {!room.block ? (
              <label className="m-field">
                {t("Reassign attendant", "إعادة إسناد العاملة")}
                <select value={room.attendant ?? ""} onChange={(e) => { hms.assignRoom(room.number, e.target.value || null, actor); toast.success(e.target.value ? t(`Assigned to ${nameOf(e.target.value)}`, `أُسندت إلى ${nameOf(e.target.value)}`) : t("Unassigned", "بدون إسناد"), { duration: 2500 }); }}>
                  <option value="">{t("Unassigned", "غير مُسند")}</option>
                  {attendants.map((a) => <option key={a.id} value={a.id}>{tr.person(a.name)}</option>)}
                </select>
              </label>
            ) : null}
            {room.hk !== "DIRTY" && room.occupancy === "VACANT" && !room.block ? (
              <Button variant="hmsGhost" size="hmsLg" onClick={() => { hms.resetStatus(room.number, actor, "Supervisor reset"); toast.success(t("Reset to dirty", "أُعيدت إلى غير نظيفة"), { duration: 2500 }); }}>{t("Reset to dirty", "إعادة إلى غير نظيفة")}</Button>
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
  const tr = useMobileT();
  const { t } = tr;
  const me = personaStaff.Engineer;
  const [tab, setTab] = useState<"mine" | "open" | "done">("mine");
  const list = s.workOrders.filter((w) =>
    tab === "mine" ? w.assignee === me && !["RESOLVED", "VERIFIED"].includes(w.state) : tab === "open" ? !w.assignee && w.state === "OPEN" : ["RESOLVED", "VERIFIED"].includes(w.state),
  );
  return (
    <MobileShell title={t("My Jobs", "مهامي")}>
      <div className="m-chips">
        {([["mine", t("Assigned to me", "مُسندة لي")], ["open", t("Unassigned", "غير مُسندة")], ["done", t("Resolved", "تم حلها")]] as const).map(([k, l]) => (
          <button type="button" key={k} className={cn("m-chip", tab === k && "m-chip-on")} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState art={<EmptyArt kind="tools" className="empty-art" />} title={tab === "mine" ? t("No jobs assigned to you", "لا مهام مُسندة لك") : tab === "open" ? t("No unassigned jobs", "لا مهام غير مُسندة") : t("Nothing resolved yet", "لا شيء تم حله بعد")} />
      ) : (
        <div className="mobile-room-list">
          {list.map((order) => (
            <Link to="/m/work-orders/$woId" params={{ woId: order.id }} className="mobile-job-card" key={order.id}>
              <span className="job-lead">
                <Picto icon={categoryIcon[order.category]} className="picto-lg" tone={`cat-${order.category === "Heritage surface" ? "heritage" : order.category.toLowerCase()}`} />
                <span className={cn("priority", order.urgency === "P1" && "priority-critical")}>{tr.ar ? tr.urgency(order.urgency) : order.urgency}</span>
              </span>
              <div><h2>{tr.category(order.category)} · {t("Room", "غرفة")} <bdi>{order.room}</bdi></h2><p>{tr.phrase(order.description)}</p><p className="m-muted"><bdi>{order.id}</bdi> · {tr.woState(order.state).toLowerCase()} · {t("opened", "فُتح")} {tr.time(order.createdAt)}</p></div>
              <ChevronRight aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
    </MobileShell>
  );
}

/* ───────────── Login ───────────── */

type ShiftRole = "ATTENDANT" | "SUPERVISOR" | "ENGINEER";
const shiftRoles: { role: ShiftRole; label: string; labelAr: string; hint: string; hintAr: string }[] = [
  { role: "ATTENDANT", label: "Housekeeping", labelAr: "تنظيف الغرف", hint: "Clean and prepare rooms", hintAr: "تنظيف الغرف وتجهيزها" },
  { role: "SUPERVISOR", label: "Supervisor", labelAr: "مشرف", hint: "Inspect and release rooms", hintAr: "فحص الغرف واعتمادها" },
  { role: "ENGINEER", label: "Maintenance", labelAr: "صيانة", hint: "Fix reported issues", hintAr: "إصلاح الأعطال المبلّغ عنها" },
];

function greeting(min: number) {
  const h = Math.floor(min / 60);
  return h < 12 ? { en: "Good morning", ar: "صباح الخير" } : h < 17 ? { en: "Good afternoon", ar: "مساء الخير" } : { en: "Good evening", ar: "مساء الخير" };
}

export function MobileLoginPage() {
  const s = useHms();
  const tr = useMobileT();
  const { t } = tr;
  const navigate = useNavigate();
  const [role, setRole] = useState<ShiftRole | null>(null);
  const [who, setWho] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const people = s.staff.filter((p) => p.role === role);
  const person = s.staff.find((p) => p.id === who);
  const hello = greeting(demoNow(s));
  const roleInfo = shiftRoles.find((r) => r.role === role);
  const press = (d: string) => {
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4 && person) {
      const persona = person.role === "SUPERVISOR" ? "Supervisor" : person.role === "ENGINEER" ? "Engineer" : "Attendant";
      hms.setPersona("mobile", persona);
      toast.success(t(`Welcome, ${tr.first(person.name)} · shift started`, `أهلًا ${tr.first(person.name)} · بدأت الوردية`), { duration: 3500 });
      void navigate({ to: mobilePersonaHome[persona] });
    }
  };
  const back = () => (who ? setWho(null) : setRole(null));
  return (
    <MobileShell title={t("Shift sign-in", "تسجيل الدخول للوردية")} bare>
      <div className={cn("m-login", person && "m-login-pin")}>
        <div className="m-login-hero">
          <img src={photos.courtyardDawn} alt="" className="m-login-scene" />
          <HotelBadge className="m-login-brand" />
          {role ? (
            <button type="button" className="m-login-back" onClick={back} aria-label={t("Back", "رجوع")}><ChevronLeft aria-hidden="true" /></button>
          ) : (
            <LangSwitch className="m-login-lang" />
          )}
        </div>
        <div className="m-login-sheet">
          {!role ? (
            <>
              <p className="m-login-hello">{t(hello.en, hello.ar)}</p>
              <h2>{t("What is your job today?", "ما هي وظيفتك اليوم؟")}</h2>
              <div className="m-role-cards">
                {shiftRoles.map((r) => (
                  <button type="button" key={r.role} className={`m-role-card role-${r.role.toLowerCase()}`} onClick={() => setRole(r.role)}>
                    <RoleArt role={r.role} />
                    <span><b>{t(r.label, r.labelAr)}</b><small>{t(r.hint, r.hintAr)}</small></span>
                    <ChevronRight aria-hidden="true" />
                  </button>
                ))}
              </div>
              <PoweredByRiwaq />
            </>
          ) : !person ? (
            <>
              <p className="m-login-hello">{roleInfo ? t(roleInfo.label, roleInfo.labelAr) : ""}</p>
              <h2>{t("Tap your photo", "اضغط على صورتك")}</h2>
              <div className="m-face-grid">
                {people.map((p) => (
                  <button type="button" key={p.id} onClick={() => { setWho(p.id); setPin(""); }}>
                    <StaffAvatar staff={p} />
                    <b>{tr.first(p.name)}</b>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="pin-pad">
              <div className="pin-person"><StaffAvatar staff={person} className="pin-avatar" /><div><h2>{tr.person(person.name)}</h2><p>{tr.role(person.role)}</p></div><ShieldCheck aria-hidden="true" /></div>
              <h3>{t("Welcome back", "أهلًا بعودتك")}</h3>
              <p>{t("Enter your 4-digit PIN", "أدخل الرقم السري من 4 أرقام")}</p>
              <div className="pin-dots" aria-live="polite" aria-label={t(`${pin.length} of 4 digits`, `${pin.length} من 4 أرقام`)}>{[0, 1, 2, 3].map((i) => <i key={i} className={cn(i < pin.length && "on")}>{i < pin.length ? "•" : ""}</i>)}</div>
              <div className="pin-keys" dir="ltr">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d, i) => <Button variant="hmsGhost" type="button" key={d} aria-label={d} onClick={() => press(d)}><span>{d}</span><small aria-hidden="true">{["", "ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ"][i]}</small></Button>)}
                <Button variant="hmsGhost" type="button" onClick={() => setWho(null)} aria-label={t("Switch person", "تغيير الموظف")} title={t("Switch person", "تغيير الموظف")}><CircleUserRound aria-hidden="true" /></Button>
                <Button variant="hmsGhost" type="button" onClick={() => press("0")}>0</Button>
                <Button variant="hmsGhost" type="button" onClick={() => setPin((p) => p.slice(0, -1))} aria-label={t("Delete", "مسح")} title={t("Delete", "مسح")}><Delete aria-hidden="true" /></Button>
              </div>
              <p className="pin-demo-note">{t("Simulated shift sign-in", "تسجيل دخول تجريبي للوردية")}</p>
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}

export function DesktopLoginPage() {
  const navigate = useNavigate();
  const [remember, setRemember] = useState(true);
  return (
    <div className="login-screen" data-platform="desktop">
      <section className="login-visual" aria-hidden="true">
        <img src={photos.courtyardDusk} alt="" className="login-scene" />
        <div className="login-visual-copy">
          <strong className="hotel-lockup">
            <span lang="ar">{property.nameAr}</span>
            <span>{property.name}</span>
          </strong>
          <em>Heritage Hotel · <span lang="ar">فندق تراثي</span></em>
        </div>
      </section>
      <section className="login-side">
        <form
          className="login-panel"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Signed in", { duration: 2500 });
            void navigate({ to: "/app/board" });
          }}
        >
          <HotelMark className="login-mark" />
          <h1>Nice to see you</h1>
          <p>Sign in to run today's house at {property.name}.</p>
          <label>Email<input type="email" placeholder="name@property.example" defaultValue="hessa@property.example" /></label>
          <label>Password<input type="password" placeholder="••••••••" defaultValue="riwaq1234" /></label>
          <label className="login-remember">
            <button type="button" role="switch" aria-checked={remember} className={cn("login-switch", remember && "on")} onClick={() => setRemember((v) => !v)}><i /></button>
            Remember me on this computer
          </label>
          <Button type="submit" variant="hmsPrimary" size="hmsLg" className="login-submit">Sign in</Button>
          <Link to="/m/login" className="login-alt"><Smartphone aria-hidden="true" /> On shift with a phone? <b>Open the staff app</b></Link>
        </form>
        <footer className="login-foot">
          <span>© 2026 {property.name} Hotel</span>
          <PoweredByRiwaq />
        </footer>
      </section>
    </div>
  );
}
