import {
  Ban,
  Bed,
  CheckCircle2,
  ClipboardCheck,
  type LucideIcon,
  Moon,
  Sparkles,
  User,
  Wrench,
} from "lucide-react";

/* ───────────────────────── Types ───────────────────────── */

export type RoomStatus =
  | "READY"
  | "AWAITING_INSPECTION"
  | "CLEANING"
  | "DIRTY"
  | "DND"
  | "BLOCKED_OOO"
  | "BLOCKED_OOS"
  | "OCCUPIED";

export type HkStatus = "DIRTY" | "IN_PROGRESS" | "PAUSED" | "CLEAN" | "INSPECTED";
export type Occupancy = "VACANT" | "OCCUPIED";
export type TaskType = "DEPARTURE" | "STAYOVER" | "RECLEAN" | "POST_REPAIR";
export type RoomType = "Standard" | "King" | "Twin" | "Suite";
export type Role = "ATTENDANT" | "SUPERVISOR" | "MANAGER" | "FRONT_DESK" | "ENGINEER" | "ADMIN";
export type Persona = "Manager" | "Front Desk" | "Admin" | "Attendant" | "Supervisor" | "Engineer";
export type Anomaly = "TOO_FAST" | "BULK_TICK" | "NO_START" | "OFFLINE_CONFLICT";
export type Zone =
  | "VENTILATION_WASTE"
  | "LINEN_STRIP"
  | "DUSTING"
  | "BATHROOM"
  | "LINEN_RESTOCK"
  | "FLOOR"
  | "FINAL_AUDIT";

export type Staff = { id: string; name: string; initials: string; role: Role; floors?: number[] | undefined };

export type ChecklistItem = {
  id: string;
  zone: Zone;
  label: string;
  labelAr: string;
  mandatory: boolean;
  photo: boolean;
};

export type ItemResult = {
  status: "DONE" | "SKIPPED";
  by: string;
  at: number;
  photo?: boolean | undefined;
  skipReason?: string | undefined;
};

export type InspectionPoint = {
  id: string;
  zone: "Bedroom" | "Bathroom" | "Amenities" | "Safety & electronics";
  label: string;
  weight: 1 | 2 | 3;
  critical: boolean;
};

export type Inspection = {
  by: string;
  at: number;
  score: number;
  result: "PASSED" | "FAILED";
  failed: string[];
  note?: string | undefined;
  remote?: boolean | undefined;
  photo?: boolean | undefined;
};

export type Block = { type: "OOO" | "OOS"; reason: string; woId?: string | undefined; since: number };

export type Room = {
  number: string;
  floor: number;
  type: RoomType;
  occupancy: Occupancy;
  hk: HkStatus;
  taskType: TaskType;
  attendant: string | null;
  items: Record<string, ItemResult>;
  startedAt?: number | undefined;
  completedAt?: number | undefined;
  pausedAt?: number | undefined;
  pauseReason?: string | undefined;
  pausedMinutes: number;
  dnd?: { since: number } | undefined;
  block?: Block | undefined;
  inspections: Inspection[];
  vip?: boolean | undefined;
  queue?: { guest: string; at: number } | undefined;
  arrival?: { guest: string; eta: string } | undefined;
  guest?: string | undefined;
  note?: string | undefined;
  anomalies: Anomaly[];
  refused?: boolean | undefined;
};

export type WorkOrderState = "OPEN" | "ACCEPTED" | "IN_PROGRESS" | "RESOLVED" | "VERIFIED";
export type WorkOrder = {
  id: string;
  room: string;
  category: "Plumbing" | "HVAC" | "Electrical" | "Carpentry" | "Furniture" | "Pest" | "Other";
  urgency: "P1" | "P2" | "P3";
  state: WorkOrderState;
  description: string;
  reportedBy: string;
  assignee: string | null;
  createdAt: number;
  acceptedAt?: number | undefined;
  resolvedAt?: number | undefined;
  resolution?: string | undefined;
  needsCleaning?: boolean | undefined;
};

export type Incident = {
  id: string;
  room: string;
  type: "DAMAGE" | "LOST_FOUND";
  description: string;
  by: string;
  at: number;
};

export type AuditEvent = {
  id: number;
  at: number;
  actor: string | null;
  room?: string | undefined;
  type: string;
  text: string;
  override?: boolean | undefined;
};

export type Settings = {
  inspectionRequired: boolean;
  passScore: number;
  queueSlaMin: number;
  p1AcceptMin: number;
  dndWelfareHours: number;
  targetCredits: number;
};

/* ───────────────────────── Status meta ───────────────────────── */

export const statusMeta: Record<RoomStatus, { label: string; labelAr: string; icon: LucideIcon; className: string }> = {
  READY: { label: "Ready", labelAr: "جاهزة", icon: CheckCircle2, className: "status-ready" },
  AWAITING_INSPECTION: { label: "Inspect", labelAr: "بانتظار الفحص", icon: ClipboardCheck, className: "status-inspect" },
  CLEANING: { label: "Cleaning", labelAr: "قيد التنظيف", icon: Sparkles, className: "status-cleaning" },
  DIRTY: { label: "Dirty", labelAr: "غير نظيفة", icon: Bed, className: "status-dirty" },
  DND: { label: "DND", labelAr: "عدم الإزعاج", icon: Moon, className: "status-dnd" },
  BLOCKED_OOO: { label: "Out of order", labelAr: "خارج الخدمة", icon: Wrench, className: "status-blocked hatch" },
  BLOCKED_OOS: { label: "Out of service", labelAr: "خارج الخدمة مؤقتًا", icon: Ban, className: "status-blocked dotted" },
  OCCUPIED: { label: "Occupied", labelAr: "مشغولة", icon: User, className: "status-occupied" },
};

export const hkLabel: Record<HkStatus, string> = {
  DIRTY: "Dirty",
  IN_PROGRESS: "In progress",
  PAUSED: "Paused",
  CLEAN: "Clean",
  INSPECTED: "Inspected",
};

export const taskLabel: Record<TaskType, string> = {
  DEPARTURE: "Departure clean",
  STAYOVER: "Stayover service",
  RECLEAN: "Re-clean",
  POST_REPAIR: "Post-repair clean",
};

export const zoneLabel: Record<Zone, string> = {
  VENTILATION_WASTE: "1 · Ventilation & waste",
  LINEN_STRIP: "2 · Linen removal & property check",
  DUSTING: "3 · Dusting & disinfection",
  BATHROOM: "4 · Bathroom",
  LINEN_RESTOCK: "5 · Bed making & restock",
  FLOOR: "6 · Floor care",
  FINAL_AUDIT: "7 · Final audit",
};

export const roomTypeInfo: Record<RoomType, { credits: number; departure: number; stayover: number }> = {
  Standard: { credits: 1, departure: 30, stayover: 15 },
  King: { credits: 1.2, departure: 32, stayover: 16 },
  Twin: { credits: 1.2, departure: 34, stayover: 17 },
  Suite: { credits: 2, departure: 55, stayover: 25 },
};

export const pauseReasons = ["Break", "Called to assist", "Missing supplies", "Guest in room"];
export const skipReasons = ["Not applicable", "Out of stock", "Guest belongings", "Other"];
export const issueCategories: WorkOrder["category"][] = ["Plumbing", "HVAC", "Electrical", "Carpentry", "Furniture", "Pest", "Other"];

/* ───────────────────────── Staff ───────────────────────── */

export const seedStaff: Staff[] = [
  { id: "ak", name: "Ahmed Kamal", initials: "AK", role: "ATTENDANT" },
  { id: "ms", name: "Maria Santos", initials: "MS", role: "ATTENDANT" },
  { id: "ya", name: "Youssef Ali", initials: "YA", role: "ATTENDANT" },
  { id: "ns", name: "Nour Samir", initials: "NS", role: "ATTENDANT" },
  { id: "of", name: "Omar Farouk", initials: "OF", role: "ATTENDANT" },
  { id: "ln", name: "Lina Nabil", initials: "LN", role: "ATTENDANT" },
  { id: "hm", name: "Hana Mostafa", initials: "HM", role: "ATTENDANT" },
  { id: "ks", name: "Karim Said", initials: "KS", role: "ATTENDANT" },
  { id: "ma", name: "Mona Adel", initials: "MA", role: "SUPERVISOR", floors: [1, 2, 3] },
  { id: "sh", name: "Sara Hassan", initials: "SH", role: "SUPERVISOR", floors: [4, 5] },
  { id: "rf", name: "Rania Fathy", initials: "RF", role: "MANAGER" },
  { id: "te", name: "Tarek Emad", initials: "TE", role: "FRONT_DESK" },
  { id: "dm", name: "Dina Magdy", initials: "DM", role: "FRONT_DESK" },
  { id: "fk", name: "Fady Khalil", initials: "FK", role: "ENGINEER" },
  { id: "hf", name: "Hany Fawzy", initials: "HF", role: "ENGINEER" },
  { id: "km", name: "Khaled Mansour", initials: "KM", role: "ADMIN" },
];

/** Staff member each demo persona acts as. */
export const personaStaff: Record<Persona, string> = {
  Manager: "rf",
  "Front Desk": "te",
  Admin: "km",
  Attendant: "ak",
  Supervisor: "ma",
  Engineer: "fk",
};

export const roleLabel: Record<Role, string> = {
  ATTENDANT: "Room Attendant",
  SUPERVISOR: "Floor Supervisor",
  MANAGER: "Housekeeping Manager",
  FRONT_DESK: "Front Desk",
  ENGINEER: "Engineer",
  ADMIN: "Admin",
};

/* ───────────────────────── Checklists ───────────────────────── */

const item = (id: string, zone: Zone, label: string, labelAr: string, mandatory = true, photo = false): ChecklistItem => ({
  id,
  zone,
  label,
  labelAr,
  mandatory,
  photo,
});

export const seedTemplates: Record<"departure" | "stayover", ChecklistItem[]> = {
  departure: [
    item("d1", "VENTILATION_WASTE", "Open windows / run ventilation", "فتح الشبابيك والتهوية", false),
    item("d2", "VENTILATION_WASTE", "Empty all bins & replace liners", "تفريغ السلال وتغيير الأكياس"),
    item("d3", "VENTILATION_WASTE", "Remove trays to service corridor", "إخراج الصواني لممر الخدمة", false),
    item("d4", "LINEN_STRIP", "Strip bed linen & towels", "إزالة المفارش والفوط"),
    item("d5", "LINEN_STRIP", "Inspect mattress for stains / bed bugs", "فحص المرتبة من البقع والحشرات"),
    item("d6", "LINEN_STRIP", "Check drawers, safe & under bed", "فحص الأدراج والخزنة وأسفل السرير"),
    item("d7", "DUSTING", "Dust high to low: fixtures to furniture", "إزالة الغبار من الأعلى للأسفل"),
    item("d8", "DUSTING", "Disinfect remote, phone, switches, handles", "تعقيم الريموت والتليفون والمفاتيح والمقابض"),
    item("d9", "BATHROOM", "Disinfect toilet", "تعقيم المرحاض"),
    item("d10", "BATHROOM", "Clean sink & vanity", "تنظيف الحوض والرخامة", true, true),
    item("d11", "BATHROOM", "Clean shower / tub & glass", "تنظيف الدش والبانيو والزجاج"),
    item("d12", "BATHROOM", "Polish mirrors & chrome", "تلميع المرايا والكروم", false),
    item("d13", "LINEN_RESTOCK", "Make bed to brand standard", "ترتيب السرير حسب المعيار", true, true),
    item("d14", "LINEN_RESTOCK", "Restock toiletries & towels", "استكمال مستلزمات الحمام والفوط"),
    item("d15", "LINEN_RESTOCK", "Restock coffee & water", "استكمال القهوة والمياه", false),
    item("d16", "FLOOR", "Vacuum carpet wall-to-wall", "كنس السجاد بالمكنسة"),
    item("d17", "FLOOR", "Mop hard floors", "مسح الأرضيات"),
    item("d18", "FINAL_AUDIT", "Check all light bulbs", "فحص كل اللمبات"),
    item("d19", "FINAL_AUDIT", "Set HVAC to eco mode", "ضبط التكييف على الوضع الاقتصادي", false),
    item("d20", "FINAL_AUDIT", "Align drapes & furniture", "ترتيب الستائر والأثاث", false),
    item("d21", "FINAL_AUDIT", "Air freshener", "معطر الجو", false),
    item("d22", "FINAL_AUDIT", "Lock door securely", "قفل الباب بإحكام"),
  ],
  stayover: [
    item("s1", "VENTILATION_WASTE", "Empty bins & replace liners", "تفريغ السلال وتغيير الأكياس"),
    item("s2", "LINEN_STRIP", "Replace used towels", "تغيير الفوط المستعملة"),
    item("s3", "DUSTING", "Wipe surfaces & high-touch points", "مسح الأسطح ونقاط اللمس"),
    item("s4", "BATHROOM", "Clean toilet, sink & shower", "تنظيف المرحاض والحوض والدش"),
    item("s5", "LINEN_RESTOCK", "Make bed", "ترتيب السرير", true, true),
    item("s6", "LINEN_RESTOCK", "Restock toiletries", "استكمال مستلزمات الحمام"),
    item("s7", "LINEN_RESTOCK", "Restock coffee & water", "استكمال القهوة والمياه", false),
    item("s8", "FLOOR", "Vacuum traffic areas", "كنس الممرات", false),
    item("s9", "FINAL_AUDIT", "Tidy guest belongings (don't move valuables)", "ترتيب متعلقات الضيف دون تحريك الثمين", false),
    item("s10", "FINAL_AUDIT", "Lock door securely", "قفل الباب بإحكام"),
  ],
};

export function templateKey(taskType: TaskType): "departure" | "stayover" {
  return taskType === "STAYOVER" ? "stayover" : "departure";
}

/* ───────────────────────── Inspection template ───────────────────────── */

const pt = (id: string, zone: InspectionPoint["zone"], label: string, weight: 1 | 2 | 3, critical = false): InspectionPoint => ({
  id,
  zone,
  label,
  weight,
  critical,
});

export const inspectionPoints: InspectionPoint[] = [
  pt("i1", "Bedroom", "Bed made to standard, no wrinkles", 3),
  pt("i2", "Bedroom", "Linen clean, no hair or stains", 3, true),
  pt("i3", "Bedroom", "Surfaces dust-free", 2),
  pt("i4", "Bedroom", "Floor / carpet clean", 2),
  pt("i5", "Bedroom", "Drapes & furniture aligned", 1),
  pt("i6", "Bathroom", "Toilet sanitized", 3, true),
  pt("i7", "Bathroom", "Sink & vanity spotless", 2),
  pt("i8", "Bathroom", "Shower / tub & glass clean", 2),
  pt("i9", "Bathroom", "Mirrors & chrome polished", 1),
  pt("i10", "Bathroom", "Towels complete & folded", 2),
  pt("i11", "Amenities", "Toiletries complete", 2),
  pt("i12", "Amenities", "Coffee, tea & water stocked", 1),
  pt("i13", "Amenities", "Minibar checked", 1),
  pt("i14", "Amenities", "Welcome items placed", 1),
  pt("i15", "Amenities", "Stationery & collateral", 1),
  pt("i16", "Safety & electronics", "TV & remote working", 2),
  pt("i17", "Safety & electronics", "All lights working", 2),
  pt("i18", "Safety & electronics", "AC set & working", 2),
  pt("i19", "Safety & electronics", "Safe open & empty", 3, true),
  pt("i20", "Safety & electronics", "Door lock & chain secure", 3, true),
];

export function scoreInspection(results: Record<string, boolean>) {
  let total = 0;
  let got = 0;
  let criticalFail = false;
  for (const point of inspectionPoints) {
    total += point.weight;
    if (results[point.id] !== false) got += point.weight;
    if (point.critical && results[point.id] === false) criticalFail = true;
  }
  return { score: Math.round((got / total) * 1000) / 10, criticalFail };
}

/* ───────────────────────── Time helpers ───────────────────────── */

/** Demo business clock starts at 11:00. Times are minutes since midnight (negative = yesterday). */
export const DEMO_START = 11 * 60;

export function fmtTime(minutes: number | undefined) {
  if (minutes === undefined) return "—";
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const text = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  return minutes < 0 ? `Yesterday ${text}` : text;
}

export function fmtDuration(minutes: number | undefined) {
  if (minutes === undefined || Number.isNaN(minutes)) return "—";
  const m = Math.max(0, Math.round(minutes));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
}

/* ───────────────────────── Seed ───────────────────────── */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const guests = [
  "Mr. Hassan Othman",
  "Ms. Claire Dubois",
  "Mr. Wei Zhang",
  "Mrs. Aisha Rahman",
  "Mr. Luca Bianchi",
  "Ms. Emma Clark",
  "Dr. Samir Nassar",
  "Mrs. Fatima Zahra",
  "Mr. John Carter",
  "Ms. Yuki Tanaka",
  "Mr. Ali Mansour",
  "Mrs. Sofia Lopez",
];

type Planned = "READY" | "AWAITING" | "CLEANING" | "DIRTY" | "OCC_CLEAN" | "OCC_DIRTY" | "DND" | "OOO" | "OOS";

export type SeedState = {
  rooms: Room[];
  staff: Staff[];
  templates: Record<"departure" | "stayover", ChecklistItem[]>;
  workOrders: WorkOrder[];
  incidents: Incident[];
  events: AuditEvent[];
  settings: Settings;
  resolvedEscalations: string[];
  published: boolean;
};

export function buildSeed(): SeedState {
  const rand = mulberry32(20260923);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)] as T;
  const events: AuditEvent[] = [];
  let eventId = 1;
  const log = (at: number, actor: string | null, room: string | undefined, type: string, text: string) =>
    events.push({ id: eventId++, at, actor, room, type, text });

  const plan: Planned[] = [
    ...Array<Planned>(34).fill("READY"),
    ...Array<Planned>(8).fill("AWAITING"),
    ...Array<Planned>(10).fill("CLEANING"),
    ...Array<Planned>(22).fill("DIRTY"),
    ...Array<Planned>(8).fill("OCC_CLEAN"),
    ...Array<Planned>(12).fill("OCC_DIRTY"),
    ...Array<Planned>(3).fill("DND"),
    "OOO",
    "OOO",
    "OOS",
  ];
  // Deterministic shuffle so statuses are spread across floors.
  for (let i = plan.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [plan[i], plan[j]] = [plan[j] as Planned, plan[i] as Planned];
  }

  const attendants = seedStaff.filter((s) => s.role === "ATTENDANT");
  const rooms: Room[] = Array.from({ length: 100 }, (_, index) => {
    const floor = Math.floor(index / 20) + 1;
    const position = (index % 20) + 1;
    const type: RoomType = floor > 1 && position >= 19 ? "Suite" : position % 5 === 0 ? "King" : position % 4 === 0 ? "Twin" : "Standard";
    return {
      number: `${floor}${String(position).padStart(2, "0")}`,
      floor,
      type,
      occupancy: "VACANT",
      hk: "DIRTY",
      taskType: "DEPARTURE",
      attendant: attendants[Math.min(7, Math.floor((index * 8) / 100))]?.id ?? null,
      items: {},
      pausedMinutes: 0,
      inspections: [],
      anomalies: [],
    };
  });

  const planOf = new Map(rooms.map((room, i) => [room.number, plan[i] as Planned]));
  const byPlan = (p: Planned) => rooms.filter((r) => planOf.get(r.number) === p);
  const supervisorFor = (floor: number) => (floor <= 3 ? "ma" : "sh");

  log(7 * 60 + 30, "rf", undefined, "ASSIGNMENTS_PUBLISHED", "Morning assignments published · 8 attendants");

  const fillItems = (room: Room, from: number, to: number, fraction = 1, bulk = false) => {
    const list = seedTemplates[templateKey(room.taskType)];
    const count = Math.round(list.length * fraction);
    list.slice(0, count).forEach((it, i) => {
      const at = Math.min(DEMO_START - 1, bulk ? to - 1 : from + Math.round(((to - from) * (i + 1)) / (list.length + 1)));
      if (!it.mandatory && fraction === 1 && rand() < 0.12) {
        room.items[it.id] = { status: "SKIPPED", by: room.attendant ?? "ak", at, skipReason: pick(["Not applicable", "Out of stock"]) };
      } else {
        room.items[it.id] = { status: "DONE", by: room.attendant ?? "ak", at, photo: it.photo || undefined };
      }
    });
  };

  // Stayover rooms & check-outs
  for (const room of rooms) {
    const p = planOf.get(room.number);
    if (p === "OCC_CLEAN" || p === "OCC_DIRTY" || p === "DND") {
      room.occupancy = "OCCUPIED";
      room.taskType = "STAYOVER";
      room.guest = guests[Number(room.number) % guests.length];
    }
    if (p === "DIRTY" || p === "READY" || p === "AWAITING" || p === "CLEANING") {
      log(6 * 60 + 40 + Math.floor(rand() * 60), "te", room.number, "CHECKED_OUT", `Guest checked out of room ${room.number}`);
    }
  }

  // Each attendant's day is planned backwards from the 11:00 demo clock so every
  // start/finish time is in the past and in-progress rooms started recently.
  let bulkUsed = false;
  for (const attendant of attendants) {
    const mine = rooms.filter((r) => r.attendant === attendant.id);
    const order: Planned[] = ["READY", "OCC_CLEAN", "AWAITING", "CLEANING"];
    const steps = order.flatMap((phase) =>
      mine
        .filter((r) => planOf.get(r.number) === phase)
        .map((room) => {
          const info = roomTypeInfo[room.type];
          const std = room.taskType === "STAYOVER" ? info.stayover : info.departure;
          const fastSlot = phase === "READY" && ["ya", "ln"].includes(attendant.id) && !mine.some((r) => r.anomalies.includes("TOO_FAST"));
          if (fastSlot) room.anomalies.push("TOO_FAST");
          const fraction = 0.3 + rand() * 0.5;
          const duration = phase === "CLEANING" ? Math.round(std * fraction) : fastSlot ? 9 : Math.round(std * (0.85 + rand() * 0.3));
          return { room, phase, std, duration, fraction, gap: phase === "CLEANING" ? 0 : 4 + Math.floor(rand() * 6) };
        }),
    );
    const total = steps.reduce((sum, st) => sum + st.duration + st.gap, 0);
    const squeeze = Math.min(1, (DEMO_START - 3 - (7 * 60 + 5)) / Math.max(1, total));
    let cursor = Math.max(7 * 60 + 5, DEMO_START - 3 - Math.round(total * squeeze));
    for (const { room, phase, fraction, gap, duration: plannedDuration } of steps) {
      const duration = Math.max(phase === "CLEANING" ? 6 : 8, Math.round(plannedDuration * squeeze));
      room.startedAt = cursor;
      log(cursor, attendant.id, room.number, "CLEAN_STARTED", "Started cleaning");
      if (phase === "CLEANING") {
        fillItems(room, cursor, cursor + duration, fraction);
        room.hk = "IN_PROGRESS";
        cursor += duration;
        continue;
      }
      {
        const bulk = phase === "AWAITING" && !bulkUsed && attendant.id !== "ak";
        if (bulk) {
          bulkUsed = true;
          room.anomalies.push("BULK_TICK");
        }
        fillItems(room, cursor, cursor + duration, 1, bulk);
        room.completedAt = cursor + duration;
        room.hk = "CLEAN";
        log(room.completedAt, attendant.id, room.number, "CLEAN_COMPLETED", `Marked clean · ${duration} min`);
        if (phase === "READY" || phase === "OCC_CLEAN") {
          const at = Math.min(DEMO_START - 2, room.completedAt + 4 + Math.floor(rand() * 30));
          const score = 90 + Math.round(rand() * 10);
          const by = supervisorFor(room.floor);
          room.inspections.push({ by, at, score, result: "PASSED", failed: [] });
          room.hk = "INSPECTED";
          log(at, by, room.number, "INSPECTION_PASSED", `Inspection passed · ${score}%`);
        }
        cursor = room.completedAt + gap;
      }
    }
  }

  // Pauses
  byPlan("CLEANING").slice(0, 2).forEach((room, i) => {
    room.hk = "PAUSED";
    room.pausedAt = Math.max((room.startedAt ?? DEMO_START - 20) + 4, DEMO_START - 12 - i * 9);
    room.pauseReason = i === 0 ? "Break" : "Missing supplies";
    log(room.pausedAt, room.attendant, room.number, "CLEAN_PAUSED", `Paused · ${room.pauseReason}`);
  });

  // Offline conflict anomaly
  const offline = byPlan("READY").find((r) => r.anomalies.length === 0 && r.attendant === "ks") ?? byPlan("READY").find((r) => r.anomalies.length === 0 && r.attendant !== "ak");
  if (offline) {
    offline.anomalies.push("OFFLINE_CONFLICT");
    log((offline.completedAt ?? 600) + 1, null, offline.number, "SYNC_CONFLICT", "Offline ticks synced after room was reassigned · kept with conflict flag");
  }

  // Re-clean after failed inspection (2 dirty + 1 cleaning)
  const reclean = [...byPlan("DIRTY").slice(0, 2), ...byPlan("CLEANING").slice(3, 4)];
  reclean.forEach((room, i) => {
    const by = supervisorFor(room.floor);
    const at = 8 * 60 + 50 + i * 35;
    room.inspections.push({
      by,
      at,
      score: 78 + i * 3,
      result: "FAILED",
      failed: i === 0 ? ["i2", "i7"] : i === 1 ? ["i4", "i10", "i12"] : ["i8", "i9"],
      note: i === 0 ? "Hair on pillow, sink has water marks" : i === 1 ? "Carpet not vacuumed under desk, towels missing" : "Shower glass streaks",
      photo: true,
    });
    log(at - 25, room.attendant, room.number, "CLEAN_COMPLETED", "Marked clean · first pass");
    log(at, by, room.number, "INSPECTION_FAILED", `Inspection failed · ${78 + i * 3}% → re-clean`);
    room.taskType = "RECLEAN";
  });

  // DND
  byPlan("DND").forEach((room, i) => {
    room.dnd = { since: i === 0 ? -20 * 60 : 9 * 60 + 10 * i };
    log(Math.max(room.dnd.since, 7 * 60 + 50), room.attendant, room.number, "DND_FLAGGED", "Do Not Disturb sign on door");
  });

  // Queue rooms & VIP arrivals
  // Queue the most recently cleaned room so its 15-min inspection SLA is still running at 11:00.
  const queued = byPlan("AWAITING")
    .filter((r) => !r.anomalies.length)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))[0];
  if (queued) {
    queued.queue = { guest: "Mr. Hassan Othman", at: (queued.completedAt ?? DEMO_START) - 8 };
    queued.arrival = { guest: "Mr. Hassan Othman", eta: "Waiting in lobby" };
    log(queued.queue.at, "te", queued.number, "QUEUE_ADDED", "Guest queued · Mr. Hassan Othman waiting");
  }
  const queuedDirty = byPlan("DIRTY")[4];
  if (queuedDirty) {
    queuedDirty.queue = { guest: "Ms. Claire Dubois", at: DEMO_START - 5 };
    queuedDirty.arrival = { guest: "Ms. Claire Dubois", eta: "Waiting in lobby" };
    log(queuedDirty.queue.at, "dm", queuedDirty.number, "QUEUE_ADDED", "Guest queued · Ms. Claire Dubois waiting");
  }
  byPlan("DIRTY").slice(6, 8).forEach((room, i) => {
    room.vip = true;
    room.arrival = { guest: i === 0 ? "Mrs. Aisha Rahman" : "Mr. Luca Bianchi", eta: i === 0 ? "13:00" : "14:30" };
    room.note = i === 0 ? "VIP · extra feather pillows · anniversary" : "VIP · late check-in, prefers 21°C";
  });
  byPlan("READY").slice(0, 10).forEach((room, i) => {
    room.arrival = { guest: guests[(i + 5) % guests.length] as string, eta: `${13 + (i % 5)}:${i % 2 ? "30" : "00"}` };
  });

  // New check-outs not yet assigned
  byPlan("DIRTY").slice(10, 15).forEach((room) => {
    room.attendant = null;
  });

  // Blocks & work orders
  const workOrders: WorkOrder[] = [];
  const [ooo1, ooo2] = byPlan("OOO");
  const [oos] = byPlan("OOS");
  if (ooo1) {
    workOrders.push({ id: "WO-1041", room: ooo1.number, category: "Plumbing", urgency: "P1", state: "ACCEPTED", description: "Bathroom sink leaking under vanity", reportedBy: ooo1.attendant ?? "ak", assignee: "fk", createdAt: 9 * 60 + 5, acceptedAt: 9 * 60 + 12 });
    ooo1.block = { type: "OOO", reason: "P1 Plumbing — sink leak", woId: "WO-1041", since: 9 * 60 + 5 };
    log(9 * 60 + 5, ooo1.attendant, ooo1.number, "WORK_ORDER_CREATED", "P1 Plumbing reported → room Out of Order");
    log(9 * 60 + 12, "fk", ooo1.number, "WO_ACCEPTED", "Fady Khalil accepted WO-1041");
  }
  if (ooo2) {
    workOrders.push({ id: "WO-1042", room: ooo2.number, category: "HVAC", urgency: "P1", state: "OPEN", description: "AC not cooling, error E4 on thermostat", reportedBy: ooo2.attendant ?? "ak", assignee: null, createdAt: 10 * 60 + 20 });
    ooo2.block = { type: "OOO", reason: "P1 HVAC — AC failure", woId: "WO-1042", since: 10 * 60 + 20 };
    log(10 * 60 + 20, ooo2.attendant, ooo2.number, "WORK_ORDER_CREATED", "P1 HVAC reported → room Out of Order");
  }
  if (oos) {
    workOrders.push({ id: "WO-1043", room: oos.number, category: "Furniture", urgency: "P3", state: "OPEN", description: "Desk chair wheel broken", reportedBy: oos.attendant ?? "ak", assignee: "hf", createdAt: 8 * 60 + 40 });
    oos.block = { type: "OOS", reason: "P3 Furniture — chair", woId: "WO-1043", since: 8 * 60 + 40 };
    log(8 * 60 + 40, oos.attendant, oos.number, "WORK_ORDER_CREATED", "P3 Furniture reported → room Out of Service");
  }
  for (const r of [ooo1, ooo2, oos]) if (r) r.attendant = null;

  // Incidents
  const incidents: Incident[] = [];
  const dmg = byPlan("CLEANING")[5];
  if (dmg) {
    incidents.push({ id: "INC-2026-0012", room: dmg.number, type: "DAMAGE", description: "Wine stain on armchair (2 photos)", by: dmg.attendant ?? "ak", at: (dmg.startedAt ?? 600) + 1 });
    log((dmg.startedAt ?? 600) + 1, dmg.attendant, dmg.number, "DAMAGE_REPORTED", "Damage reported before cleaning · wine stain on armchair");
  }
  const lf = byPlan("READY")[12];
  if (lf) {
    incidents.push({ id: "LF-2026-0042", room: lf.number, type: "LOST_FOUND", description: "Phone charger found in bedside drawer", by: lf.attendant ?? "ak", at: (lf.startedAt ?? 540) + 6 });
    log((lf.startedAt ?? 540) + 6, lf.attendant, lf.number, "LOST_FOUND_LOGGED", "Found item logged · phone charger");
  }

  events.sort((a, b) => a.at - b.at || a.id - b.id);

  return {
    rooms,
    staff: seedStaff,
    templates: seedTemplates,
    workOrders,
    incidents,
    events,
    settings: { inspectionRequired: true, passScore: 90, queueSlaMin: 15, p1AcceptMin: 10, dndWelfareHours: 24, targetCredits: 16 },
    resolvedEscalations: [],
    published: true,
  };
}
