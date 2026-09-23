import {
  AlertTriangle,
  Ban,
  Bed,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  type LucideIcon,
  Moon,
  Sparkles,
  User,
  Wrench,
} from "lucide-react";

export type RoomStatus =
  | "READY"
  | "AWAITING_INSPECTION"
  | "CLEANING"
  | "DIRTY"
  | "DND"
  | "BLOCKED_OOO"
  | "BLOCKED_OOS"
  | "OCCUPIED";

export type Room = {
  number: string;
  floor: number;
  type: "Standard" | "King" | "Twin" | "Suite";
  status: RoomStatus;
  attendant: string;
  initials: string;
  minutes: number;
  progress: number;
  badges: Array<"Queue" | "VIP" | "Anomaly" | "Re-clean">;
};

export type Persona = "Manager" | "Front Desk" | "Admin" | "Attendant" | "Supervisor" | "Engineer";

export const statusMeta: Record<
  RoomStatus,
  { label: string; labelAr: string; icon: LucideIcon; className: string }
> = {
  READY: {
    label: "Ready",
    labelAr: "جاهزة",
    icon: CheckCircle2,
    className: "status-ready",
  },
  AWAITING_INSPECTION: {
    label: "Inspect",
    labelAr: "بانتظار الفحص",
    icon: ClipboardCheck,
    className: "status-inspect",
  },
  CLEANING: {
    label: "Cleaning",
    labelAr: "قيد التنظيف",
    icon: Sparkles,
    className: "status-cleaning",
  },
  DIRTY: {
    label: "Dirty",
    labelAr: "غير نظيفة",
    icon: Bed,
    className: "status-dirty",
  },
  DND: {
    label: "DND",
    labelAr: "عدم الإزعاج",
    icon: Moon,
    className: "status-dnd",
  },
  BLOCKED_OOO: {
    label: "Out of order",
    labelAr: "خارج الخدمة",
    icon: Wrench,
    className: "status-blocked hatch",
  },
  BLOCKED_OOS: {
    label: "Out of service",
    labelAr: "خارج الخدمة مؤقتًا",
    icon: Ban,
    className: "status-blocked dotted",
  },
  OCCUPIED: {
    label: "Occupied",
    labelAr: "مشغولة",
    icon: User,
    className: "status-occupied",
  },
};

const staff = [
  ["Ahmed Kamal", "AK"],
  ["Mona Adel", "MA"],
  ["Sara Hassan", "SH"],
  ["Maria Santos", "MS"],
  ["Youssef Ali", "YA"],
  ["Nour Samir", "NS"],
  ["Omar Farouk", "OF"],
  ["Lina Nabil", "LN"],
] as const;

const plannedStatuses: RoomStatus[] = [
  ...Array(34).fill("READY"),
  ...Array(8).fill("AWAITING_INSPECTION"),
  ...Array(10).fill("CLEANING"),
  ...Array(22).fill("DIRTY"),
  ...Array(20).fill("OCCUPIED"),
  ...Array(3).fill("DND"),
  ...Array(2).fill("BLOCKED_OOO"),
  "BLOCKED_OOS",
];

export const rooms: Room[] = Array.from({ length: 100 }, (_, index) => {
  const floor = Math.floor(index / 20) + 1;
  const position = (index % 20) + 1;
  const roomNumber = `${floor}${String(position).padStart(2, "0")}`;
  const staffer = staff[index % staff.length];
  const status = plannedStatuses[index];
  const suite = floor > 1 && position >= 19;
  const type = suite ? "Suite" : position % 5 === 0 ? "King" : position % 4 === 0 ? "Twin" : "Standard";
  const badges: Room["badges"] = [];
  if ([3, 47].includes(index)) badges.push("Queue");
  if ([9, 55].includes(index)) badges.push("VIP");
  if ([13, 32, 77].includes(index)) badges.push("Anomaly");
  if ([24, 61, 82].includes(index)) badges.push("Re-clean");
  return {
    number: roomNumber,
    floor,
    type,
    status,
    attendant: staffer[0],
    initials: staffer[1],
    minutes: 8 + ((index * 7) % 52),
    progress: status === "READY" ? 100 : status === "AWAITING_INSPECTION" ? 92 : status === "CLEANING" ? 45 + (index % 40) : status === "DIRTY" ? 0 : 15,
    badges,
  };
});

export const staffProgress = staff.map(([name, initials], index) => {
  const assigned = rooms.filter((room) => room.initials === initials);
  const done = assigned.filter((room) => ["READY", "AWAITING_INSPECTION"].includes(room.status)).length;
  return {
    name,
    initials,
    assigned: assigned.length,
    done,
    currentRoom: assigned.find((room) => room.status === "CLEANING")?.number ?? assigned[index % assigned.length]?.number ?? "—",
    anomalies: index % 3 === 0 ? 1 : 0,
    credits: 42 + index * 3,
  };
});

export const kpis = [
  { label: "Ready", value: 34, helper: "trusted for check-in", status: "READY" as RoomStatus },
  { label: "Inspect", value: 8, helper: "awaiting supervisor", status: "AWAITING_INSPECTION" as RoomStatus },
  { label: "Cleaning", value: 10, helper: "2 paused", status: "CLEANING" as RoomStatus },
  { label: "Dirty", value: 22, helper: "not started", status: "DIRTY" as RoomStatus },
  { label: "Blocked", value: 3, helper: "OOO/OOS", status: "BLOCKED_OOO" as RoomStatus },
];

export const mobileRooms = rooms
  .filter((room) => room.initials === "AK" || room.status === "CLEANING" || room.badges.includes("Queue"))
  .slice(0, 14);

export const timeline = [
  { time: "07:05", actor: "Front Desk", action: "Room 304 checked out", icon: BriefcaseBusiness },
  { time: "07:18", actor: "Ahmed Kamal", action: "Started cleaning", icon: Sparkles },
  { time: "07:41", actor: "Ahmed Kamal", action: "Checklist 22/22 completed", icon: ClipboardCheck },
  { time: "07:55", actor: "Mona Adel", action: "Inspection passed · 96%", icon: CheckCircle2 },
  { time: "07:56", actor: "System", action: "READY derived from inspected + unblocked", icon: CheckCircle2 },
];

export const alerts = [
  { title: "Queue room 304", detail: "Guest waiting · inspection SLA 4m left", tone: "warning" },
  { title: "DND room 218", detail: "Continuous DND over 24h · welfare check", tone: "dnd" },
  { title: "HVAC P1 room 511", detail: "Out of order · engineer not assigned", tone: "error" },
];

export const workOrders = [
  { room: "511", title: "P1 HVAC failure", owner: "Unassigned", status: "SLA breached" },
  { room: "214", title: "P1 plumbing leak", owner: "Karim Nabil", status: "Accepted" },
  { room: "420", title: "P3 furniture repair", owner: "Hany Fawzy", status: "Open" },
];

export function resetDemoData() {
  try {
    window.localStorage.removeItem("trianglz-demo-view");
    window.localStorage.removeItem("trianglz-demo-persona");
  } catch {
    // Storage can be unavailable in private or embedded previews.
  }
}
