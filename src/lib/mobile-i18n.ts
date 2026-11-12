/**
 * Staff app language (mobile only). One language per screen: English (default,
 * Gulf housekeeping teams are multinational) or Arabic (RTL). Never both at once.
 * The choice is a per-device preference in localStorage, separate from the demo state.
 */
import { createContext, useContext, useSyncExternalStore } from "react";
import {
  type AuditEvent,
  type HkStatus,
  type Role,
  type RoomStatus,
  type RoomType,
  type TaskType,
  type WorkOrder,
  type Zone,
  fmtDuration,
  fmtTime,
  hkLabel,
  inspectionPoints,
  roleLabel,
  statusMeta,
  taskLabel,
  wings,
  zoneLabel,
} from "@/lib/demo-data";

export type Lang = "en" | "ar";

const KEY = "riwaq-mobile-lang";
const listeners = new Set<() => void>();
let current: Lang | null = null;

function read(): Lang {
  if (current) return current;
  try {
    current = window.localStorage.getItem(KEY) === "ar" ? "ar" : "en";
  } catch {
    current = "en";
  }
  return current;
}

export function setLang(lang: Lang) {
  current = lang;
  try {
    window.localStorage.setItem(KEY, lang);
  } catch {
    /* private mode: keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The staff app's language, read from the device preference. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, read, () => "en");
}

/** Shared components (status chips, badges, room cards) read this; desktop has no provider, so it stays English. */
export const LangContext = createContext<Lang>("en");

/* ───────────── Dictionaries for demo data ───────────── */

const roomTypeAr: Record<RoomType, string> = {
  "Heritage Room": "غرفة تراثية",
  "Courtyard Room": "غرفة الفناء",
  "Twin Room": "غرفة بسريرين",
  Suite: "جناح",
};

const wingShortAr: Record<number, string> = { 1: "الفناء", 2: "النجدي", 3: "حديقة النخيل", 4: "برج الحصن", 5: "الملكي" };

const taskAr: Record<TaskType, string> = {
  DEPARTURE: "تنظيف مغادرة",
  STAYOVER: "خدمة إقامة",
  RECLEAN: "إعادة تنظيف",
  POST_REPAIR: "تنظيف بعد الصيانة",
};

const hkAr: Record<HkStatus, string> = { DIRTY: "غير نظيفة", IN_PROGRESS: "قيد التنظيف", PAUSED: "متوقفة مؤقتًا", CLEAN: "نظيفة", INSPECTED: "تم فحصها" };

const zoneAr: Record<Zone, string> = {
  VENTILATION_WASTE: "١ · فحص التراث والتهوية والنفايات",
  LINEN_STRIP: "٢ · إزالة المفارش وفحص المتعلقات",
  DUSTING: "٣ · إزالة الغبار والتعقيم",
  BATHROOM: "٤ · الحمّام",
  LINEN_RESTOCK: "٥ · ترتيب السرير والاستكمال",
  FLOOR: "٦ · الأرضيات",
  FINAL_AUDIT: "٧ · المراجعة النهائية",
};

const roleAr: Record<Role, string> = {
  ATTENDANT: "عاملة غرف",
  SUPERVISOR: "مشرفة طابق",
  MANAGER: "مديرة العمليات",
  FRONT_DESK: "الاستقبال",
  ENGINEER: "فني صيانة",
  ADMIN: "مسؤول النظام",
};

const categoryAr: Record<WorkOrder["category"], string> = {
  "Heritage surface": "سطح تراثي",
  Plumbing: "سباكة",
  HVAC: "تكييف",
  Electrical: "كهرباء",
  Carpentry: "نجارة",
  Furniture: "أثاث",
  Pest: "حشرات",
  Other: "أخرى",
};

const urgencyAr: Record<WorkOrder["urgency"], string> = { P1: "عاجل", P2: "متوسط", P3: "منخفض" };
const urgencyEn: Record<WorkOrder["urgency"], string> = { P1: "P1 · urgent", P2: "P2", P3: "P3" };

const woStateAr: Record<WorkOrder["state"], string> = { OPEN: "مفتوح", ACCEPTED: "مقبول", IN_PROGRESS: "قيد الإصلاح", RESOLVED: "تم الإصلاح", VERIFIED: "تم التحقق" };

const inspectionZoneAr: Record<string, string> = { Bedroom: "غرفة النوم", Bathroom: "الحمّام", Amenities: "المستلزمات", "Safety & electronics": "السلامة والأجهزة", Heritage: "التراث" };

const inspectionPointAr: Record<string, string> = {
  i1: "السرير مرتّب حسب المعيار بلا تجاعيد",
  i2: "المفارش نظيفة بلا شعر أو بقع",
  i3: "الأسطح خالية من الغبار",
  i4: "الأرضية والسجاد نظيفان",
  i5: "الستائر والأثاث مرتّبة",
  i6: "المرحاض معقّم",
  i7: "الحوض والرخامة لامعان",
  i8: "الدش والبانيو والزجاج نظيفة",
  i9: "المرايا والكروم ملمّعة",
  i10: "الفوط كاملة ومطوية",
  i11: "مستلزمات الحمّام كاملة",
  i12: "القهوة والشاي والمياه متوفرة",
  i13: "تم فحص الميني بار",
  i14: "مستلزمات الترحيب في مكانها",
  i15: "القرطاسية والمطبوعات",
  i16: "التلفزيون والريموت يعملان",
  i17: "كل الإضاءة تعمل",
  i18: "التكييف مضبوط ويعمل",
  i19: "الخزنة مفتوحة وفارغة",
  i20: "قفل الباب والسلسلة آمنان",
  i21: "العناصر التراثية سليمة، وأي تلف جديد تم الإبلاغ عنه",
};

const reasonAr: Record<string, string> = {
  Break: "استراحة",
  "Called to assist": "طُلبت للمساعدة",
  "Missing supplies": "مستلزمات ناقصة",
  "Guest in room": "الضيف في الغرفة",
  "Not applicable": "لا ينطبق",
  "Out of stock": "غير متوفر",
  "Guest belongings": "متعلقات الضيف",
  Other: "أخرى",
};

const staffAr: Record<string, string> = {
  "Maria Santos": "ماريا سانتوس",
  "Priya Nair": "بريا ناير",
  "Salem Al Harthy": "سالم الحارثي",
  "Joy Reyes": "جوي رييس",
  "Ramesh Kumar": "راميش كومار",
  "Nora Al Ghamdi": "نورة الغامدي",
  "Grace Mwangi": "غريس موانجي",
  "Tariq Hamdan": "طارق حمدان",
  "Noura Al Qahtani": "نورة القحطاني",
  "Sultan Al Mutairi": "سلطان المطيري",
  "Hessa Al Suwaidi": "حصة السويدي",
  "Faisal Al Shehri": "فيصل الشهري",
  "Reem Al Dosari": "ريم الدوسري",
  "Mansoor Al Balushi": "منصور البلوشي",
  "Yousef Al Kuwari": "يوسف الكواري",
  "Khalid Al Otaibi": "خالد العتيبي",
};

const guestAr: Record<string, string> = {
  "Mr. Abdullah Al Rashid": "السيد عبدالله الراشد",
  "Ms. Claire Dubois": "السيدة كلير دوبوا",
  "Mr. Wei Zhang": "السيد وي تشانغ",
  "Mrs. Maryam Al Mansoori": "السيدة مريم المنصوري",
  "Mr. Luca Bianchi": "السيد لوكا بيانكي",
  "Ms. Emma Clark": "السيدة إيما كلارك",
  "Dr. Hamad Al Thani": "د. حمد آل ثاني",
  "Mrs. Latifa Al Kaabi": "السيدة لطيفة الكعبي",
  "Mr. John Carter": "السيد جون كارتر",
  "Ms. Yuki Tanaka": "السيدة يوكي تاناكا",
  "Sheikh Saud Al Sabah": "الشيخ سعود الصباح",
  "Mrs. Sofia Lopez": "السيدة صوفيا لوبيز",
};

const heritageAr: Record<string, string> = {
  "carved wooden door": "الباب الخشبي المنقوش",
  "gypsum (juss) ornament": "زخارف الجص",
  "mud-plaster wall": "الجدار الطيني",
  "lime-plaster niche": "الكوة الجيرية",
  "coral-stone wall": "الجدار المرجاني",
  "woven sadu textile": "منسوج السدو",
  "antique brass coffee pots": "الدلال النحاسية الأثرية",
  "wooden lattice screen": "المشربية الخشبية",
};

/** Seeded free text (notes, descriptions, block reasons). Text typed by staff stays as typed. */
const phraseAr: Record<string, string> = {
  "Waiting in lobby": "ينتظر في الردهة",
  "VIP · Arabic coffee welcome · anniversary": "ضيف مميز · استقبال بالقهوة العربية · ذكرى زواج",
  "VIP · late check-in, prefers 21°C": "ضيف مميز · وصول متأخر، يفضّل 21°م",
  "Hair on pillow, sink has water marks": "شعر على المخدة، وآثار مياه على الحوض",
  "Carpet not vacuumed under desk, towels missing": "السجادة تحت المكتب لم تُكنس، وفوط ناقصة",
  "Shower glass streaks": "خطوط على زجاج الدش",
  "Bathroom sink leaking under vanity": "تسريب من حوض الحمّام تحت الرخامة",
  "AC not cooling, error E4 on thermostat": "التكييف لا يبرّد، خطأ E4 على الثرموستات",
  "Desk chair wheel broken": "عجلة كرسي المكتب مكسورة",
  "P1 Plumbing — sink leak": "سباكة عاجلة — تسريب الحوض",
  "P1 HVAC — AC failure": "تكييف عاجل — عطل المكيّف",
  "P3 Furniture — chair": "أثاث — كرسي",
  "Wine stain on armchair (2 photos)": "بقعة نبيذ على الكرسي (صورتان)",
  "Phone charger found in bedside drawer": "شاحن هاتف في درج الكومودينو",
};

function heritageName(name: string) {
  return heritageAr[name.toLowerCase()] ?? name;
}

/** Translates a known seeded phrase; anything else (typed by staff) is returned as is. */
function phrase(text: string | undefined): string {
  if (!text) return "";
  if (phraseAr[text]) return phraseAr[text];
  let m = /^Heritage report (WO-\d+) · avoid the (.+) until reviewed$/.exec(text);
  if (m) return `بلاغ تراث ${m[1]} · تجنّب ${heritageName(m[2] ?? "")} حتى المراجعة`;
  m = /^(.+): new flaking noticed — work stopped in that area, awaiting heritage specialist review$/.exec(text);
  if (m) return `${heritageName(m[1] ?? "")}: تقشّر جديد — توقف العمل في هذه المنطقة بانتظار مراجعة متخصص التراث`;
  m = /^(P[123]) ([A-Za-z ]+?)(?: — (.*))?$/.exec(text);
  if (m && (m[2] as string) in categoryAr) {
    const cat = categoryAr[m[2] as WorkOrder["category"]];
    return `${cat} · ${urgencyAr[m[1] as WorkOrder["urgency"]]}${m[3] ? ` — ${phrase(m[3])}` : ""}`;
  }
  m = /^(.+) issue$/.exec(text);
  if (m && (m[1] as string) in categoryAr) return `مشكلة ${categoryAr[m[1] as WorkOrder["category"]]}`;
  return text;
}

const eventAr: Record<string, string> = {
  ASSIGNMENTS_PUBLISHED: "نُشرت توزيعات الصباح",
  CHECKED_OUT: "غادر الضيف الغرفة",
  CHECKED_IN: "وصل الضيف",
  CLEAN_STARTED: "بدأ التنظيف",
  CLEAN_PAUSED: "توقف مؤقتًا",
  CLEAN_RESUMED: "استأنف التنظيف",
  CLEAN_COMPLETED: "أنهى التنظيف",
  INSPECTION_PASSED: "اجتازت الفحص",
  INSPECTION_FAILED: "لم تجتز الفحص · إعادة تنظيف",
  DND_FLAGGED: "علامة عدم الإزعاج على الباب",
  DND_CLEARED: "أُزيلت علامة عدم الإزعاج",
  QUEUE_ADDED: "ضيف في الانتظار · أولوية أولى",
  WORK_ORDER_CREATED: "بلاغ صيانة",
  WO_ACCEPTED: "قُبل أمر الصيانة",
  WO_ASSIGNED: "أُسند أمر الصيانة",
  WO_STARTED: "بدأ الإصلاح",
  WO_RESOLVED: "تم الإصلاح · بانتظار تحقق المشرف",
  BLOCK_RELEASED: "تم التحقق وفُك الحجز",
  DAMAGE_REPORTED: "بلاغ تلف",
  LOST_FOUND_LOGGED: "تسجيل مفقودات",
  ITEM_CHECKED: "تم بند من القائمة",
  ITEM_UNCHECKED: "أُلغي بند من القائمة",
  ITEM_SKIPPED: "تخطّي بند",
  PHOTO_ATTACHED: "أُرفقت صورة",
  STATUS_RESET: "أُعيدت الحالة إلى غير نظيفة",
  ROOM_ASSIGNED: "إسناد الغرفة",
  ROOM_REASSIGNED: "إعادة إسناد الغرفة",
  SERVICE_REFUSED: "الضيف رفض الخدمة اليوم",
  SYNC_CONFLICT: "مزامنة متأخرة مع تعارض",
  QUEUE_CLEARED: "خرج الضيف من الانتظار",
  ESCALATION_RESOLVED: "تمت معالجة التصعيد",
};

/* ───────────── Translator ───────────── */

export function makeT(lang: Lang) {
  const ar = lang === "ar";
  const t = (en: string, arText: string) => (ar ? arText : en);
  return {
    lang,
    ar,
    dir: (ar ? "rtl" : "ltr") as "rtl" | "ltr",
    t,
    status: (st: RoomStatus) => (ar ? statusMeta[st].labelAr : statusMeta[st].label),
    roomType: (type: RoomType) => (ar ? roomTypeAr[type] : type),
    wing: (floor: number) => (ar ? (wings[floor]?.nameAr ?? `جناح ${floor}`) : (wings[floor]?.name ?? `Wing ${floor}`)),
    wingShort: (floor: number) => (ar ? (wingShortAr[floor] ?? `جناح ${floor}`) : (wings[floor]?.short ?? `Wing ${floor}`)),
    task: (task: TaskType) => (ar ? taskAr[task] : taskLabel[task]),
    hk: (hk: HkStatus) => (ar ? hkAr[hk] : hkLabel[hk]),
    zone: (zone: Zone) => (ar ? zoneAr[zone] : zoneLabel[zone]),
    role: (role: Role) => (ar ? roleAr[role] : roleLabel[role]),
    category: (c: WorkOrder["category"]) => (ar ? categoryAr[c] : c),
    urgency: (u: WorkOrder["urgency"]) => (ar ? urgencyAr[u] : urgencyEn[u]),
    woState: (st: WorkOrder["state"]) => (ar ? woStateAr[st] : st === "IN_PROGRESS" ? "Repair" : st[0] + st.slice(1).toLowerCase()),
    reason: (r: string | undefined) => (r ? (ar ? (reasonAr[r] ?? r) : r) : ""),
    inspectionZone: (z: string) => (ar ? (inspectionZoneAr[z] ?? z) : z),
    point: (id: string) => {
      const p = inspectionPoints.find((x) => x.id === id);
      return ar ? (inspectionPointAr[id] ?? p?.label ?? id) : (p?.label ?? id);
    },
    item: (it: { label: string; labelAr?: string }) => (ar && it.labelAr ? it.labelAr : it.label),
    asset: (a: { name: string; nameAr?: string; material: string; materialAr?: string }) => ({ name: ar && a.nameAr ? a.nameAr : a.name, material: ar && a.materialAr ? a.materialAr : a.material }),
    person: (name: string | undefined) => (name ? (ar ? (staffAr[name] ?? name) : name) : ar ? "غير مُسند" : "Unassigned"),
    first: (name: string | undefined) => (name ? (ar ? (staffAr[name] ?? name) : name).split(" ")[0] : ""),
    guest: (g: string | undefined) => (g ? (ar ? (guestAr[g] ?? g) : g) : ""),
    phrase: (text: string | undefined) => (ar ? phrase(text) : (text ?? "")),
    time: (m: number | undefined) => (ar ? fmtTime(m).replace("Yesterday", "أمس") : fmtTime(m)),
    duration: (m: number | undefined) => {
      const en = fmtDuration(m);
      if (!ar) return en;
      return en.replace(/(\d+)h (\d+)m/, "$1 س $2 د").replace(/(\d+) min/, "$1 د");
    },
    event: (e: AuditEvent) => {
      if (!ar) return e.text;
      const base = eventAr[e.type] ?? "تحديث على الغرفة";
      const pct = /(\d+(?:\.\d+)?)%/.exec(e.text);
      const min = /· (\d+) min/.exec(e.text);
      const reason = e.type === "CLEAN_PAUSED" ? /· (.+)$/.exec(e.text)?.[1] : undefined;
      return [base, reason ? reasonAr[reason] ?? reason : null, pct ? `${pct[1]}%` : null, min ? `${min[1]} د` : null].filter(Boolean).join(" · ");
    },
  };
}

export type Translator = ReturnType<typeof makeT>;

/** Translator for pages (reads the device preference directly). */
export function useMobileT(): Translator {
  return makeT(useLang());
}

/** Translator for shared components rendered inside the staff app (desktop gets English). */
export function useSharedT(): Translator {
  return makeT(useContext(LangContext));
}
