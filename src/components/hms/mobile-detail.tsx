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
  inspectionPoints,
  issueCategories,
  pauseReasons,
  personaStaff,
  scoreInspection,
  skipReasons,
  type WorkOrder,
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
  staffById,
  stdMinutes,
  useHms,
} from "@/lib/hms-store";
import { type Translator, useMobileT } from "@/lib/mobile-i18n";
import { cn } from "@/lib/utils";
import { EmptyState } from "./demo-states";
import { MobileSheet, MobileShell, useMobilePersona } from "./mobile-shell";
import { HeritageNotice, RoomBadges } from "./room-components";
import { RoomHero } from "./room-hero";
import { Picto, categoryIcon, pauseIcon, pictoFor, skipIcon, zoneTone } from "./illustrations";
import { StatusChip } from "./status";
import { MobileDetailPhoto } from "./mobile-task-card";

/* ───────────── Shared bits ───────────── */

function ProgressRing({ value, label }: { value: number; label: string }) {
  return (
    <div className={cn("m-meter", value >= 100 && "m-meter-done")} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)} aria-label={label}>
      <strong>{label}</strong>
      <span className="m-meter-track"><i style={{ width: `${Math.min(100, value)}%` }} /></span>
    </div>
  );
}

function CameraSheet({ open, onClose, onCapture, title }: { open: boolean; onClose: () => void; onCapture: () => void; title: string }) {
  const { t } = useMobileT();
  return (
    <MobileSheet open={open} onClose={onClose} title={title}>
      <div className="m-camera">
        <div className="m-viewfinder" aria-hidden="true">
          <span className="vf-corner tl" /><span className="vf-corner tr" /><span className="vf-corner bl" /><span className="vf-corner br" />
          <Camera />
          <small>{t("Tap to capture", "اضغط للتصوير")}</small>
        </div>
        <button type="button" className="m-shutter" aria-label={t("Take photo", "التقاط صورة")} onClick={() => { onCapture(); onClose(); }} />
      </div>
    </MobileSheet>
  );
}

function NotFound({ what, back }: { what: string; back: string }) {
  const { t } = useMobileT();
  return (
    <MobileShell title={t("Not found", "غير موجود")} back={{ to: back }}>
      <EmptyState title={t(`${what} was not found`, `${what} غير موجودة`)} />
    </MobileShell>
  );
}

/** Photo-required button used by the report sheets. */
function PhotoButton({ on, onClick, t, after = false }: { on: boolean; onClick: () => void; t: Translator["t"]; after?: boolean }) {
  return (
    <button type="button" className={cn("m-photo-btn", on && "on")} onClick={onClick}>
      {on ? <><CheckCircle2 aria-hidden="true" /> {after ? t("After-photo attached", "أُرفقت صورة بعد الإصلاح") : t("Photo attached", "أُرفقت الصورة")}</> : <><Camera aria-hidden="true" /> {after ? t("Add after-photo (required)", "أضف صورة بعد الإصلاح (مطلوبة)") : t("Add photo (required)", "أضف صورة (مطلوبة)")}</>}
    </button>
  );
}

/* ───────────── Room detail (M-03) ───────────── */

export function MobileRoomDetailPage({ roomId }: { roomId: string }) {
  const s = useHms();
  const persona = useMobilePersona();
  const navigate = useNavigate();
  const tr = useMobileT();
  const { t } = tr;
  const nameOf = (id: string | null | undefined) => tr.person(staffById(s, id)?.name);
  const actor = personaStaff[persona];
  const room = s.rooms.find((r) => r.number === roomId);
  const [sheet, setSheet] = useState<null | "pause" | "issue" | "damage" | "found" | "startCheck" | "camera">(null);
  const [issue, setIssue] = useState<{ category: WorkOrder["category"]; urgency: WorkOrder["urgency"]; note: string; photo: boolean }>({ category: "Plumbing", urgency: "P2", note: "", photo: false });
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState(false);
  const [cameraFor, setCameraFor] = useState<"issue" | "damage" | "found">("issue");
  if (!room) return <NotFound what={t(`Room ${roomId}`, `الغرفة ${roomId}`)} back="/m/rooms" />;

  const status = displayStatus(room, s.settings);
  const progress = checklistProgress(s, room);
  const minutes = activeMinutes(s, room);
  const ins = lastInspection(room);
  const history = roomEvents(s, room.number).slice(-6).reverse();
  const inProgress = room.hk === "IN_PROGRESS";
  const isDeparture = room.taskType !== "STAYOVER";

  const start = () => {
    hms.startCleaning(room.number, actor);
    toast.success(t(`Room ${room.number} started — timer running`, `بدأت غرفة ${room.number} — المؤقت يعمل`), { duration: 2500 });
    void navigate({ to: "/m/rooms/$roomId/checklist", params: { roomId: room.number } });
  };

  const openCamera = (forWhat: "issue" | "damage" | "found") => {
    setCameraFor(forWhat);
    setSheet("camera");
  };

  let footer: React.ReactNode;
  if (room.block) footer = <Button variant="hmsSecondary" size="hmsXl" disabled><Wrench aria-hidden="true" /> {t("Blocked", "محجوزة")} · {room.block.type === "OOO" ? t("Out of order", "خارج الخدمة") : t("Out of service", "خارج الخدمة مؤقتًا")}</Button>;
  else if (room.dnd && room.hk === "DIRTY")
    footer = (
      <Button variant="hmsSecondary" size="hmsXl" onClick={() => { hms.clearDnd(room.number, actor, "DND sign removed — service possible"); toast.success(t("DND cleared — you can start now", "أُزيلت علامة عدم الإزعاج — يمكنك البدء"), { duration: 2500 }); }}>
        <Moon aria-hidden="true" /> {t("DND removed? Tap to clear", "أُزيلت العلامة؟ اضغط للمسح")}
      </Button>
    );
  else if (room.hk === "DIRTY")
    footer = (
      <Button variant="hmsPrimary" size="hmsXl" onClick={() => (isDeparture ? setSheet("startCheck") : start())}>
        <Play aria-hidden="true" /> {room.taskType === "RECLEAN" ? t("Start re-clean", "ابدأ إعادة التنظيف") : t("Start cleaning", "ابدأ التنظيف")}
      </Button>
    );
  else if (room.hk === "PAUSED")
    footer = (
      <Button variant="hmsPrimary" size="hmsXl" onClick={() => { hms.resumeCleaning(room.number, actor); toast.success(t("Resumed — timer running", "استُؤنف — المؤقت يعمل"), { duration: 2000 }); }}>
        <Play aria-hidden="true" /> {t("Resume cleaning", "استئناف التنظيف")}
      </Button>
    );
  else if (inProgress)
    footer = (
      <Button asChild variant="hmsPrimary" size="hmsXl">
        <Link to="/m/rooms/$roomId/checklist" params={{ roomId: room.number }}>
          <ClipboardList aria-hidden="true" /> {progress.canComplete ? t("Review & mark clean", "راجع وعلّمها نظيفة") : `${t("Continue checklist", "أكمل القائمة")} · ${progress.done}/${progress.total}`}
        </Link>
      </Button>
    );
  else footer = <Button variant="hmsSecondary" size="hmsXl" disabled><CheckCircle2 aria-hidden="true" /> {room.hk === "CLEAN" ? t("Waiting for inspection", "بانتظار الفحص") : t("Done · inspected", "انتهت · تم فحصها")}</Button>;

  return (
    <MobileShell title={t(`Room ${room.number}`, `غرفة ${room.number}`)} immersive footer={footer}>
      <RoomHero room={room} status={status} back={{ to: persona === "Supervisor" ? "/m/floor" : "/m/rooms", label: persona === "Supervisor" ? t("Wings", "الأجنحة") : t("My Rooms", "غرفي") }} />
      <div className="room-body">
      <HeritageNotice room={room} />

      {room.queue ? <p className="m-note m-note-warn"><Sparkles aria-hidden="true" /> {t(`${room.queue.guest} is waiting in the lobby — this room is your #1.`, `${tr.guest(room.queue.guest)} ينتظر في الردهة — هذه الغرفة أولويتك الأولى.`)}</p> : null}
      {room.arrival && !room.queue ? <p className="m-note">{t("Arrival", "الوصول")}: {tr.guest(room.arrival.guest)} · {tr.phrase(room.arrival.eta)}</p> : null}
      {room.note ? <p className="m-note">{tr.phrase(room.note)}</p> : null}
      {room.guest && room.occupancy === "OCCUPIED" ? <p className="m-note">{t("Occupied", "مشغولة")} · {tr.guest(room.guest)}</p> : null}
      {room.block ? <p className="m-note m-note-blocked"><Wrench aria-hidden="true" /> {tr.phrase(room.block.reason)}</p> : null}
      {room.taskType === "RECLEAN" && ins?.result === "FAILED" ? (
        <div className="m-note m-note-error">
          <strong>{t("Re-clean needed", "مطلوب إعادة تنظيف")} · {ins.score}%</strong>
          <ul>{ins.failed.map((f) => <li key={f}>✘ {tr.point(f)}</li>)}</ul>
          {ins.note ? <p>“{tr.phrase(ins.note)}” — {nameOf(ins.by)}</p> : null}
        </div>
      ) : null}
      {room.hk === "PAUSED" ? <p className="m-note m-note-warn"><Pause aria-hidden="true" /> {t("Paused", "متوقفة")} · {tr.reason(room.pauseReason)}</p> : null}

      <Link to="/m/rooms/$roomId/checklist" params={{ roomId: room.number }} className="m-progress-card">
        <ProgressRing value={progress.percent} label={`${progress.done}/${progress.total}`} />
        <div>
          <strong>{t("Checklist", "قائمة التنظيف")}</strong>
          <span>{progress.missingMandatory.length ? t(`${progress.missingMandatory.length} required items left`, `باقي ${progress.missingMandatory.length} بنود مطلوبة`) : t("All required items done", "كل البنود المطلوبة تمت")}</span>
          <span>{minutes === undefined ? t(`Standard time ~${stdMinutes(room)} min`, `الوقت المعتاد ~${stdMinutes(room)} د`) : t(`${tr.duration(minutes)} of ~${stdMinutes(room)} min`, `${tr.duration(minutes)} من ~${stdMinutes(room)} د`)}</span>
        </div>
      </Link>

      <div className="m-action-grid">
        {inProgress ? <button type="button" onClick={() => setSheet("pause")}><Picto icon={Pause} tone="tone-warn" /> {t("Pause", "إيقاف مؤقت")}</button> : null}
        {room.hk === "DIRTY" && !room.dnd ? <button type="button" onClick={() => { hms.flagDnd(room.number, actor); toast.success(t("DND logged — reminder in 2 hours", "سُجّل عدم الإزعاج — تذكير بعد ساعتين"), { duration: 2500 }); }}><Picto icon={Moon} tone="tone-dnd" /> {t("Flag DND", "عدم إزعاج")}</button> : null}
        <button type="button" onClick={() => { setIssue({ category: "Plumbing", urgency: "P2", note: "", photo: false }); setSheet("issue"); }}><Picto icon={Wrench} tone="tone-info" /> {t("Report issue", "بلاغ صيانة")}</button>
        <button type="button" onClick={() => { setText(""); setPhoto(false); setSheet("damage"); }}><Picto icon={ShieldAlert} tone="tone-error" /> {t("Damage", "تلف")}</button>
        <button type="button" onClick={() => { setText(""); setPhoto(false); setSheet("found"); }}><Picto icon={Package} tone="tone-brass" /> {t("Found item", "مفقودات")}</button>
        {room.occupancy === "OCCUPIED" && room.hk === "DIRTY" && !room.refused ? <button type="button" onClick={() => { hms.guestRefused(room.number, actor); toast.success(t("Logged: guest refused service", "سُجّل: الضيف رفض الخدمة"), { duration: 2500 }); }}><Picto icon={Hand} tone="tone-neutral" /> {t("Guest refused", "رفض الضيف")}</button> : null}
      </div>

      <section className="m-history">
        <h2>{t("Today in this room", "اليوم في هذه الغرفة")}</h2>
        {history.length === 0 ? <p className="m-muted">{t("No activity yet.", "لا نشاط بعد.")}</p> : null}
        {history.map((e) => (
          <div key={e.id}><time>{tr.time(e.at)}</time><span><b>{e.actor ? nameOf(e.actor) : t("System", "النظام")}</b> {tr.event(e)}</span></div>
        ))}
      </section>
      </div>

      {/* Sheets */}
      <MobileSheet open={sheet === "startCheck"} onClose={() => setSheet(null)} title={t("Before you start", "قبل أن تبدأ")}>
        <div className="m-sheet-stack">
          <p>{t("Check the room for damage or missing items before touching anything.", "افحص الغرفة بحثًا عن تلف أو نواقص قبل لمس أي شيء.")}</p>
          <Button variant="hmsPrimary" size="hmsXl" onClick={() => { setSheet(null); start(); }}><Check aria-hidden="true" /> {t("No damage — start", "لا يوجد تلف — ابدأ")}</Button>
          <Button variant="hmsSecondary" size="hmsLg" onClick={() => { setText(""); setPhoto(false); setSheet("damage"); }}><ShieldAlert aria-hidden="true" /> {t("Report damage first", "أبلغ عن التلف أولًا")}</Button>
        </div>
      </MobileSheet>

      <MobileSheet open={sheet === "pause"} onClose={() => setSheet(null)} title={t("Why are you pausing?", "لماذا تتوقف؟")}>
        <div className="m-sheet-stack">
          {pauseReasons.map((r) => (
            <Button key={r} variant="hmsSecondary" size="hmsLg" className="m-pic-btn" onClick={() => { hms.pauseCleaning(room.number, actor, r); setSheet(null); toast.success(t(`Paused · ${r} — timer stopped`, `توقف · ${tr.reason(r)} — المؤقت متوقف`), { duration: 2500 }); }}>{(() => { const I = pauseIcon[r] ?? Pause; return <I aria-hidden="true" />; })()} {tr.reason(r)}</Button>
          ))}
        </div>
      </MobileSheet>

      <MobileSheet open={sheet === "issue"} onClose={() => setSheet(null)} title={t("Report maintenance issue", "بلاغ صيانة")}>
        <div className="m-sheet-stack">
          <div className="m-cat-grid">
            {issueCategories.map((c) => (
              <button type="button" key={c} className={cn("m-cat-pic", issue.category === c && "on")} onClick={() => setIssue({ ...issue, category: c, urgency: c === "Pest" ? "P1" : issue.urgency })}>{(() => { const I = categoryIcon[c]; return <I aria-hidden="true" />; })()}<span>{tr.category(c)}</span></button>
            ))}
          </div>
          <div className="m-segmented">
            {(["P1", "P2", "P3"] as const).map((u) => (
              <button type="button" key={u} className={cn(issue.urgency === u && "on", u === "P1" && "p1")} onClick={() => setIssue({ ...issue, urgency: u })}>{tr.urgency(u)}</button>
            ))}
          </div>
          <label className="m-field">{t("What's wrong?", "ما المشكلة؟")}<textarea rows={2} value={issue.note} onChange={(e) => setIssue({ ...issue, note: e.target.value })} placeholder={t("e.g. sink leaking", "مثال: تسريب من الحوض")} /></label>
          <PhotoButton on={issue.photo} onClick={() => openCamera("issue")} t={t} />
          <p className="m-muted">{issue.urgency === "P1" || issue.category === "Pest" ? t("Room will be set Out of Order — front desk can't sell it.", "ستصبح الغرفة خارج الخدمة — لا يمكن للاستقبال بيعها.") : t("Room will be set Out of Service until fixed.", "ستصبح الغرفة خارج الخدمة مؤقتًا حتى الإصلاح.")}</p>
          <Button
            variant="hmsPrimary"
            size="hmsXl"
            disabled={!issue.photo}
            onClick={() => {
              const id = hms.reportIssue(room.number, actor, { category: issue.category, urgency: issue.urgency, description: issue.note });
              setSheet(null);
              toast.success(t(`${id} sent to engineering`, `أُرسل ${id} إلى الصيانة`), { duration: 3000 });
            }}
          >
            {t("Send report", "إرسال البلاغ")}
          </Button>
        </div>
      </MobileSheet>

      <MobileSheet open={sheet === "damage" || sheet === "found"} onClose={() => setSheet(null)} title={sheet === "found" ? t("Log found item", "تسجيل مفقودات") : t("Report damage / missing item", "بلاغ تلف أو نقص")}>
        <div className="m-sheet-stack">
          {sheet === "found" ? <p className="m-muted">{t("Don't move the item until it's photographed in place.", "لا تحرّك الغرض قبل تصويره في مكانه.")}</p> : null}
          <label className="m-field">{sheet === "found" ? t("Item & where it was found", "الغرض ومكان العثور عليه") : t("What is damaged or missing?", "ما التالف أو الناقص؟")}<textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={sheet === "found" ? t("e.g. phone charger, bedside drawer", "مثال: شاحن هاتف في درج الكومودينو") : t("e.g. stain on armchair", "مثال: بقعة على الكرسي")} /></label>
          <PhotoButton on={photo} onClick={() => openCamera(sheet === "found" ? "found" : "damage")} t={t} />
          <Button
            variant="hmsPrimary"
            size="hmsXl"
            disabled={!photo || !text.trim()}
            onClick={() => {
              hms.reportIncident(room.number, actor, sheet === "found" ? "LOST_FOUND" : "DAMAGE", text.trim());
              toast.success(sheet === "found" ? t("Found item logged — supervisor notified", "سُجّلت المفقودات — تم إبلاغ المشرفة") : t("Damage reported — front desk & manager alerted", "تم الإبلاغ عن التلف — أُبلغ الاستقبال والمدير"), { duration: 3000 });
              setSheet(null);
            }}
          >
            {t("Submit", "إرسال")}
          </Button>
        </div>
      </MobileSheet>

      <CameraSheet
        open={sheet === "camera"}
        title={t("Take photo", "التقاط صورة")}
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
  const tr = useMobileT();
  const { t } = tr;
  const nameOf = (id: string | null | undefined) => tr.person(staffById(s, id)?.name);
  const actor = personaStaff[persona];
  const room = s.rooms.find((r) => r.number === roomId);
  const [cameraItem, setCameraItem] = useState<string | null>(null);
  const [skipItem, setSkipItem] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  if (!room) return <NotFound what={t(`Room ${roomId}`, `الغرفة ${roomId}`)} back="/m/rooms" />;

  const list = checklistFor(s, room);
  const progress = checklistProgress(s, room);
  const zones = Array.from(new Set(list.map((it) => it.zone))) as Zone[];
  const editable = room.hk === "IN_PROGRESS";
  const minutes = activeMinutes(s, room);
  const left = progress.missingMandatory.length + progress.missingPhoto.length;

  const tap = (id: string, needsPhoto: boolean) => {
    if (!editable) {
      toast.info(room.hk === "PAUSED" ? t("Resume cleaning to continue", "استأنف التنظيف للمتابعة") : room.hk === "DIRTY" ? t("Tap Start cleaning first", "اضغط ابدأ التنظيف أولًا") : t("This checklist is closed", "هذه القائمة مغلقة"), { duration: 2500 });
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
      <Button variant="hmsPrimary" size="hmsXl" onClick={() => { hms.startCleaning(room.number, actor); toast.success(t("Started — timer running", "بدأ — المؤقت يعمل"), { duration: 2000 }); }}><Play aria-hidden="true" /> {t("Start cleaning", "ابدأ التنظيف")}</Button>
    ) : room.hk === "PAUSED" ? (
      <Button variant="hmsPrimary" size="hmsXl" onClick={() => hms.resumeCleaning(room.number, actor)}><Play aria-hidden="true" /> {t("Resume cleaning", "استئناف التنظيف")}</Button>
    ) : editable ? (
      <Button variant="hmsPrimary" size="hmsXl" disabled={!progress.canComplete} onClick={() => setConfirm(true)}>
        {progress.canComplete ? <><Sparkles aria-hidden="true" /> {t("Mark clean", "علّمها نظيفة")}</> : t(`${left} required item${left > 1 ? "s" : ""} left`, `باقي ${left} بنود مطلوبة`)}
      </Button>
    ) : (
      <Button variant="hmsSecondary" size="hmsXl" disabled><CheckCircle2 aria-hidden="true" /> {room.hk === "CLEAN" ? t("Submitted · waiting for inspection", "أُرسلت · بانتظار الفحص") : t("Inspected", "تم فحصها")}</Button>
    );

  return (
    <MobileShell title={t("Checklist", "قائمة التنظيف")} subtitle={`${t("Room", "غرفة")} ${room.number} · ${tr.task(room.taskType)}`} back={{ to: "/m/rooms/$roomId", params: { roomId: room.number }, label: t(`Room ${room.number}`, `غرفة ${room.number}`) }} footer={footer}>
      <HeritageNotice room={room} compact />
      <div className="m-check-summary">
        <ProgressRing value={progress.percent} label={`${progress.done}/${progress.total}`} />
        <div>
          <strong>{t(`${progress.percent}% complete`, `مكتملة ${progress.percent}%`)}</strong>
          <span>{minutes === undefined ? t("Not started", "لم تبدأ") : t(`${tr.duration(minutes)} · standard ~${stdMinutes(room)} min`, `${tr.duration(minutes)} · المعتاد ~${stdMinutes(room)} د`)}</span>
          <span>{left ? t(`${left} required left`, `باقي ${left} مطلوبة`) : t("Ready to mark clean", "جاهزة لتعليمها نظيفة")}</span>
        </div>
      </div>
      {!editable && room.hk !== "CLEAN" && room.hk !== "INSPECTED" ? (
        <p className="m-note m-note-warn">{room.hk === "PAUSED" ? t(`Paused · ${room.pauseReason}. Resume to keep ticking.`, `متوقفة · ${tr.reason(room.pauseReason)}. استأنف لتكمل.`) : t("Start cleaning to begin ticking items — the timer starts with it.", "ابدأ التنظيف لتعليم البنود — المؤقت يبدأ معه.")}</p>
      ) : null}
      {zones.map((zone) => (
        <section className="m-zone" key={zone}>
          <h2>{tr.zone(zone)}</h2>
          {list
            .filter((it) => it.zone === zone)
            .map((it) => {
              const res = room.items[it.id];
              return (
                <div className={cn("m-check", res?.status === "DONE" && "m-check-done", res?.status === "SKIPPED" && "m-check-skipped")} key={it.id}>
                  <button type="button" className="m-check-main" onClick={() => tap(it.id, it.photo)} aria-pressed={res?.status === "DONE"}>
                    <Picto icon={pictoFor(it)} tone={zoneTone[it.zone]} className="m-check-picto" />
                    <span className="m-check-text">
                      {tr.item(it)}
                      <small>
                        {it.mandatory ? <em>{t("Required", "مطلوب")}</em> : null}
                        {it.photo ? <em className="tag-photo"><Camera aria-hidden="true" /> {t("Photo", "صورة")}</em> : null}
                        {res ? <span>{res.status === "SKIPPED" ? `${t("Skipped", "متخطى")} · ${tr.reason(res.skipReason)}` : `${nameOf(res.by).split(" ")[0]} · ${tr.time(res.at)}`}</span> : null}
                      </small>
                    </span>
                    {res?.photo ? <span className="m-thumb" aria-label={t("Photo attached", "أُرفقت صورة")}><Camera aria-hidden="true" /></span> : null}
                    {res?.status === "DONE" ? <CheckCircle2 className="m-check-icon" aria-hidden="true" /> : res?.status === "SKIPPED" ? <CircleSlash className="m-check-icon" aria-hidden="true" /> : <Circle className="m-check-icon" aria-hidden="true" />}
                  </button>
                  {editable && !it.mandatory && !res ? (
                    <button type="button" className="m-skip" onClick={() => setSkipItem(it.id)}>{t("Skip", "تخطّي")}</button>
                  ) : null}
                </div>
              );
            })}
        </section>
      ))}

      <CameraSheet
        open={!!cameraItem}
        title={t("Photo proof", "صورة إثبات")}
        onClose={() => setCameraItem(null)}
        onCapture={() => {
          if (cameraItem) hms.attachPhoto(room.number, cameraItem, actor);
          toast.success(t("Photo saved", "حُفظت الصورة"), { duration: 1500 });
        }}
      />
      <MobileSheet open={!!skipItem} onClose={() => setSkipItem(null)} title={t("Why skip this item?", "لماذا تتخطى هذا البند؟")}>
        <div className="m-sheet-stack">
          {skipReasons.map((r) => (
            <Button key={r} variant="hmsSecondary" size="hmsLg" className="m-pic-btn" onClick={() => { if (skipItem) hms.skipItem(room.number, skipItem, actor, r); setSkipItem(null); }}>{(() => { const I = skipIcon[r] ?? CircleSlash; return <I aria-hidden="true" />; })()} {tr.reason(r)}</Button>
          ))}
        </div>
      </MobileSheet>
      <MobileSheet open={confirm} onClose={() => setConfirm(false)} title={t(`Mark room ${room.number} clean?`, `تعليم الغرفة ${room.number} نظيفة؟`)}>
        <div className="m-sheet-stack">
          <dl className="m-facts">
            <div><dt>{t("Items done", "بنود تمت")}</dt><dd>{list.filter((it) => room.items[it.id]?.status === "DONE").length}</dd></div>
            <div><dt>{t("Skipped", "متخطاة")}</dt><dd>{progress.skipped}</dd></div>
            <div><dt>{t("Photos", "صور")}</dt><dd>{Object.values(room.items).filter((x) => x.photo).length}</dd></div>
            <div><dt>{t("Time", "الوقت")}</dt><dd>{tr.duration(minutes)}</dd></div>
          </dl>
          <p className="m-muted">{t("Your supervisor will be notified to inspect the room.", "سيتم إبلاغ مشرفتك لفحص الغرفة.")}</p>
          <Button
            variant="hmsPrimary"
            size="hmsXl"
            onClick={() => {
              hms.markClean(room.number, actor);
              setConfirm(false);
              toast.success(t(`Room ${room.number} marked clean — supervisor notified`, `الغرفة ${room.number} نظيفة — تم إبلاغ المشرفة`), { duration: 3000 });
              void navigate({ to: "/m/rooms" });
            }}
          >
            <Check aria-hidden="true" /> {t("Confirm — mark clean", "تأكيد — نظيفة")}
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
  const tr = useMobileT();
  const { t } = tr;
  const nameOf = (id: string | null | undefined) => tr.person(staffById(s, id)?.name);
  const actor = personaStaff.Supervisor;
  const room = s.rooms.find((r) => r.number === roomId);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [rejectOpen, setRejectOpen] = useState(false);
  const [attendantOpen, setAttendantOpen] = useState(false);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(false);
  const [camera, setCamera] = useState(false);
  if (!room) return <NotFound what={t(`Room ${roomId}`, `الغرفة ${roomId}`)} back="/m/inspections" />;

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
      <MobileShell title={t(`Inspect ${room.number}`, `فحص ${room.number}`)} back={{ to: "/m/inspections", label: t("Queue", "القائمة") }}>
        <EmptyState title={room.hk === "INSPECTED" ? t("Already inspected ✔", "تم فحصها ✔") : t("This room hasn't been marked clean yet", "لم تُعلَّم هذه الغرفة نظيفة بعد")} />
      </MobileShell>
    );
  }

  const footer = (
    <div className="m-footer-split">
      <Button variant="hmsSecondary" size="hmsXl" disabled={!anyFail} onClick={() => setRejectOpen(true)}><X aria-hidden="true" /> {t("Reject", "رفض")}</Button>
      <Button
        variant="hmsPrimary"
        size="hmsXl"
        disabled={!canApprove}
        onClick={() => {
          hms.submitInspection(room.number, actor, results);
          toast.success(t(`Room ${room.number} approved · ${score}% — READY for front desk`, `اعتُمدت الغرفة ${room.number} · ${score}% — جاهزة للاستقبال`), { duration: 3000 });
          void navigate({ to: "/m/inspections" });
        }}
      >
        <Check aria-hidden="true" /> {t("Approve", "اعتماد")}
      </Button>
    </div>
  );

  return (
    <MobileShell title={t(`Inspect ${room.number}`, `فحص ${room.number}`)} subtitle={`${tr.roomType(room.type)} · ${tr.wing(room.floor)}`} back={{ to: "/m/inspections", label: t("Queue", "القائمة") }} footer={footer}>
      <MobileDetailPhoto type={room.type} title={<>{t("Room", "غرفة")} <bdi>{room.number}</bdi></>} subtitle={`${tr.roomType(room.type)} · ${tr.wing(room.floor)}`} />
      <HeritageNotice room={room} compact />
      <button type="button" className="m-attendant-card" onClick={() => setAttendantOpen(true)}>
        <div>
          <strong>{nameOf(room.attendant)}</strong>
          <span>{tr.duration(activeMinutes(s, room))} · {progress.done}/{progress.total} {t("items", "بند")} · {Object.values(room.items).filter((x) => x.photo).length} {t("photos", "صور")}</span>
        </div>
        <span className="m-link">{t("View checklist", "عرض القائمة")}</span>
      </button>
      {room.queue ? <p className="m-note m-note-warn">⚡ {t(`${room.queue.guest} is waiting — approve as soon as it passes.`, `${tr.guest(room.queue.guest)} ينتظر — اعتمدها فور اجتيازها.`)}</p> : null}

      <div className={cn("m-score", allAnswered && (canApprove ? "m-score-pass" : "m-score-fail"))}>
        <div><strong>{answered ? `${score}%` : "—"}</strong><span>{t(`${answered}/${inspectionPoints.length} checked · pass ≥ ${s.settings.passScore}%`, `${answered}/${inspectionPoints.length} تم · النجاح ≥ ${s.settings.passScore}%`)}{criticalFail ? t(" · critical fail", " · فشل حرج") : ""}</span></div>
        <Button variant="hmsGhost" size="hmsSm" onClick={() => setResults(Object.fromEntries(inspectionPoints.map((p) => [p.id, results[p.id] ?? true])))}>{t("Pass remaining", "اعتماد الباقي")}</Button>
      </div>

      {zones.map((zone) => (
        <section className="m-zone" key={zone}>
          <h2>{tr.inspectionZone(zone)}</h2>
          {inspectionPoints
            .filter((p) => p.zone === zone)
            .map((p) => (
              <div className={cn("m-point", results[p.id] === false && "m-point-fail")} key={p.id}>
                <span>
                  {tr.point(p.id)}
                  <small>{p.critical ? <em className="tag-critical">{t("Critical", "حرج")}</em> : null} {t("weight", "الوزن")} {p.weight}</small>
                </span>
                <div className="m-passfail">
                  <button type="button" className={cn(results[p.id] === true && "pass")} aria-pressed={results[p.id] === true} onClick={() => setResults({ ...results, [p.id]: true })} aria-label={`${t("Pass", "ناجح")} ${tr.point(p.id)}`}><Check aria-hidden="true" /></button>
                  <button type="button" className={cn(results[p.id] === false && "fail")} aria-pressed={results[p.id] === false} onClick={() => setResults({ ...results, [p.id]: false })} aria-label={`${t("Fail", "راسب")} ${tr.point(p.id)}`}><X aria-hidden="true" /></button>
                </div>
              </div>
            ))}
        </section>
      ))}

      <MobileSheet open={attendantOpen} onClose={() => setAttendantOpen(false)} title={t(`${nameOf(room.attendant)}'s checklist`, `قائمة ${nameOf(room.attendant)}`)}>
        <div className="m-sheet-list">
          {list.map((it) => {
            const res = room.items[it.id];
            return (
              <div key={it.id} className={cn("m-mini-check", !res && "missing")}>
                {res?.status === "DONE" ? <CheckCircle2 aria-hidden="true" /> : res?.status === "SKIPPED" ? <CircleSlash aria-hidden="true" /> : <Circle aria-hidden="true" />}
                <span>{tr.item(it)}{res?.skipReason ? ` · ${tr.reason(res.skipReason)}` : ""}</span>
                {res?.photo ? <Camera aria-label={t("Photo", "صورة")} /> : null}
                <time>{res ? tr.time(res.at) : ""}</time>
              </div>
            );
          })}
        </div>
      </MobileSheet>

      <MobileSheet open={rejectOpen} onClose={() => setRejectOpen(false)} title={t("Reject & send back", "رفض وإعادة")}>
        <div className="m-sheet-stack">
          <p><b>{inspectionPoints.filter((p) => results[p.id] === false).length}</b> {t("failed points · score", "نقاط راسبة · الدرجة")} {score}%</p>
          <label className="m-field">{t("Note for the attendant", "ملاحظة للعاملة")}<textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("e.g. hair on pillow, water marks on sink", "مثال: شعر على المخدة، آثار مياه على الحوض")} /></label>
          <PhotoButton on={photo} onClick={() => setCamera(true)} t={t} />
          <Button
            variant="hmsPrimary"
            size="hmsXl"
            disabled={!photo || !note.trim()}
            onClick={() => {
              hms.submitInspection(room.number, actor, results, { note: note.trim(), photo: true });
              toast.success(t(`Room ${room.number} sent back to ${nameOf(room.attendant)} for re-clean`, `أُعيدت الغرفة ${room.number} إلى ${nameOf(room.attendant)} لإعادة التنظيف`), { duration: 3000 });
              void navigate({ to: "/m/inspections" });
            }}
          >
            {t("Send re-clean", "إرسال لإعادة التنظيف")}
          </Button>
        </div>
      </MobileSheet>
      <CameraSheet open={camera} title={t("Photo of the issue", "صورة المشكلة")} onClose={() => setCamera(false)} onCapture={() => setPhoto(true)} />
    </MobileShell>
  );
}

/* ───────────── Work order detail (M-11) ───────────── */

export function MobileWorkOrderDetailPage({ woId }: { woId: string }) {
  const s = useHms();
  const tr = useMobileT();
  const { t } = tr;
  const nameOf = (id: string | null | undefined) => tr.person(staffById(s, id)?.name);
  const actor = personaStaff.Engineer;
  const wo = s.workOrders.find((w) => w.id === woId);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [note, setNote] = useState("");
  const [needsCleaning, setNeedsCleaning] = useState(true);
  const [photo, setPhoto] = useState(false);
  const [camera, setCamera] = useState(false);
  if (!wo) return <NotFound what={t(`Work order ${woId}`, `أمر العمل ${woId}`)} back="/m/work-orders" />;
  const room = s.rooms.find((r) => r.number === wo.room);
  const steps = ["OPEN", "ACCEPTED", "IN_PROGRESS", "RESOLVED", "VERIFIED"] as const;
  const at = steps.indexOf(wo.state);

  const footer =
    wo.state === "OPEN" ? (
      <Button variant="hmsPrimary" size="hmsXl" onClick={() => { hms.woAccept(wo.id, actor); toast.success(t(`${wo.id} accepted`, `قُبل ${wo.id}`), { duration: 2500 }); }}><Check aria-hidden="true" /> {t("Accept job", "قبول المهمة")}</Button>
    ) : wo.state === "ACCEPTED" ? (
      <Button variant="hmsPrimary" size="hmsXl" onClick={() => { hms.woStart(wo.id, actor); toast.success(t("Repair started", "بدأ الإصلاح"), { duration: 2000 }); }}><Play aria-hidden="true" /> {t("Start repair", "ابدأ الإصلاح")}</Button>
    ) : wo.state === "IN_PROGRESS" ? (
      <Button variant="hmsPrimary" size="hmsXl" onClick={() => setResolveOpen(true)}><CheckCircle2 aria-hidden="true" /> {t("Resolve", "تم الإصلاح")}</Button>
    ) : (
      <Button variant="hmsSecondary" size="hmsXl" disabled>{wo.state === "RESOLVED" ? t("Waiting for supervisor to verify", "بانتظار تحقق المشرفة") : t("Verified · room released", "تم التحقق · فُك حجز الغرفة")}</Button>
    );

  return (
    <MobileShell title={wo.id} subtitle={`${tr.category(wo.category)} · ${tr.urgency(wo.urgency)} · ${t("Room", "غرفة")} ${wo.room}`} back={{ to: "/m/work-orders", label: t("Jobs", "المهام") }} footer={footer}>
      {room ? <MobileDetailPhoto type={room.type} title={<>{t("Room", "غرفة")} <bdi>{room.number}</bdi></>} subtitle={`${tr.category(wo.category)} · ${tr.wing(room.floor)}`} /> : null}
      <div className="m-stepper">
        {steps.map((st, i) => <span key={st} className={cn(i <= at && "on")}>{tr.woState(st)}</span>)}
      </div>
      <div className={cn("m-note", wo.urgency === "P1" ? "m-note-error" : "m-note-warn")}>
        <strong><AlertTriangle aria-hidden="true" /> {tr.phrase(wo.description)}</strong>
        <p>{t(`Reported by ${nameOf(wo.reportedBy)} at ${tr.time(wo.createdAt)} · 📷 1 photo`, `أبلغ ${nameOf(wo.reportedBy)} الساعة ${tr.time(wo.createdAt)} · 📷 صورة واحدة`)}</p>
      </div>
      <dl className="m-facts">
        <div><dt>{t("Room", "الغرفة")}</dt><dd>{wo.room} · {room ? `${tr.roomType(room.type)} · ${tr.wing(room.floor)}` : ""}</dd></div>
        <div><dt>{t("Occupancy", "الإشغال")}</dt><dd>{room?.occupancy === "OCCUPIED" ? t("Occupied — knock first", "مشغولة — اطرق الباب أولًا") : t("Vacant", "شاغرة")}</dd></div>
        <div><dt>{t("Block", "الحجز")}</dt><dd>{room?.block ? (room.block.type === "OOO" ? t("Out of order", "خارج الخدمة") : t("Out of service", "خارج الخدمة مؤقتًا")) : t("None", "لا يوجد")}</dd></div>
        <div><dt>{t("Assigned", "المُسند إليه")}</dt><dd>{nameOf(wo.assignee)}</dd></div>
        {wo.resolution ? <div><dt>{t("Resolution", "الإصلاح")}</dt><dd>{wo.resolution}</dd></div> : null}
      </dl>
      <p className="m-muted">{t("The room stays blocked until a supervisor verifies your fix.", "تبقى الغرفة محجوزة حتى تتحقق المشرفة من الإصلاح.")}</p>

      <MobileSheet open={resolveOpen} onClose={() => setResolveOpen(false)} title={t("Resolve job", "إنهاء المهمة")}>
        <div className="m-sheet-stack">
          <label className="m-field">{t("What did you fix?", "ماذا أصلحت؟")}<textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("e.g. replaced sink trap seal", "مثال: غيّرت جلدة سيفون الحوض")} /></label>
          <PhotoButton on={photo} onClick={() => setCamera(true)} t={t} after />
          <label className="m-toggle"><input type="checkbox" checked={needsCleaning} onChange={(e) => setNeedsCleaning(e.target.checked)} /> {t("Room needs cleaning after repair", "الغرفة تحتاج تنظيفًا بعد الإصلاح")}</label>
          <Button
            variant="hmsPrimary"
            size="hmsXl"
            disabled={!photo || !note.trim()}
            onClick={() => {
              hms.woResolve(wo.id, actor, note.trim(), needsCleaning);
              setResolveOpen(false);
              toast.success(t(`${wo.id} resolved — supervisor will verify`, `تم إصلاح ${wo.id} — ستتحقق المشرفة`), { duration: 3000 });
            }}
          >
            {t("Submit fix", "إرسال الإصلاح")}
          </Button>
        </div>
      </MobileSheet>
      <CameraSheet open={camera} title={t("After-photo", "صورة بعد الإصلاح")} onClose={() => setCamera(false)} onCapture={() => setPhoto(true)} />
    </MobileShell>
  );
}
