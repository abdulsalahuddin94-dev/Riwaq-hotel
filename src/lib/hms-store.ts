import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  type Anomaly,
  type AuditEvent,
  buildSeed,
  DEMO_DATE,
  FOLLOW_UP_GRACE_MIN,
  DEMO_START,
  type FollowUpOutcome,
  followUpLabel,
  type Reservation,
  fmtDuration,
  inspectionPoints,
  type GuestRequest,
  guestRequestLabel,
  type Persona,
  personaStaff,
  type Room,
  roleLabel,
  roomTypeInfo,
  signsInOnPhone,
  type RoomStatus,
  scoreInspection,
  type SeedState,
  type Settings,
  type Staff,
  type ChecklistItem,
  templateKey,
  type WorkOrder,
} from "./demo-data";

/* ───────────────────────── State & persistence ───────────────────────── */

export type HmsState = SeedState & {
  version: number;
  seededAt: number;
  desktopPersona: Persona;
  mobilePersona: Persona;
  nextEventId: number;
  seq: number;
};

const STORAGE_KEY = "riwaq-demo-state-v1";
const VERSION = 7;

function freshState(seededAt = 0): HmsState {
  const seed = buildSeed();
  return {
    ...seed,
    version: VERSION,
    seededAt,
    desktopPersona: "Manager",
    mobilePersona: "Attendant",
    nextEventId: seed.events.length + 1,
    seq: 0,
  };
}

const serverSnapshot = freshState();
let state: HmsState | null = null;
const listeners = new Set<() => void>();

function load(): HmsState {
  if (state) return state;
  if (typeof window === "undefined") return serverSnapshot;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as HmsState;
      if (parsed.version === VERSION) {
        state = parsed;
        return state;
      }
    }
  } catch {
    // Storage may be unavailable (private mode, embedded preview) — fall back to the seed.
  }
  state = freshState(Date.now());
  return state;
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function persist() {
  if (typeof window === "undefined") return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Optional persistence.
    }
  }, 120);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      state = JSON.parse(event.newValue) as HmsState;
      listeners.forEach((l) => l());
    } catch {
      // ignore
    }
  });
}

function set(mutator: (draft: HmsState) => void) {
  const next = structuredClone(load());
  mutator(next);
  next.seq += 1;
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Subscribe to the whole demo state. Derive values in the component (selectors run after the snapshot so references stay stable). */
export function useHms(): HmsState {
  return useSyncExternalStore(subscribe, load, () => serverSnapshot);
}

export function getHms() {
  return load();
}

/* ───────────────────────── Derived helpers ───────────────────────── */

export function demoNow(s: HmsState = load()) {
  if (!s.seededAt) return DEMO_START;
  // The demo clock runs in real time from 11:00 but stops at 12:30 so a long-open demo keeps
  // believable timers and charts; "Reset demo" restarts it.
  return Math.min(DEMO_START + 90, DEMO_START + Math.floor((Date.now() - s.seededAt) / 60000));
}

/** A booking whose guest is late past the grace period (or whose day has passed) and nobody closed it. */
export function needsFollowUp(s: HmsState, res: Reservation) {
  if (res.status !== "expected") return false;
  if (res.arrivalDate < DEMO_DATE) return true;
  if (res.arrivalDate > DEMO_DATE) return false;
  const [h, m] = res.expectedCheckIn.split(":").map(Number);
  return demoNow(s) >= (h ?? 0) * 60 + (m ?? 0) + FOLLOW_UP_GRACE_MIN;
}

export function staffName(s: HmsState, id: string | null | undefined) {
  if (!id) return "System";
  return s.staff.find((p) => p.id === id)?.name ?? id;
}

export function staffById(s: HmsState, id: string | null | undefined): Staff | undefined {
  return id ? s.staff.find((p) => p.id === id) : undefined;
}

export function actorFor(s: HmsState, platform: "desktop" | "mobile") {
  return personaStaff[platform === "desktop" ? s.desktopPersona : s.mobilePersona];
}

export function displayStatus(room: Room, settings: Settings): RoomStatus {
  if (room.block?.type === "OOO") return "BLOCKED_OOO";
  if (room.block?.type === "OOS") return "BLOCKED_OOS";
  if (room.dnd) return "DND";
  if (room.occupancy === "OCCUPIED") return "OCCUPIED";
  if (room.hk === "INSPECTED" || (room.hk === "CLEAN" && !settings.inspectionRequired)) return "READY";
  if (room.hk === "CLEAN") return "AWAITING_INSPECTION";
  if (room.hk === "IN_PROGRESS" || room.hk === "PAUSED") return "CLEANING";
  return "DIRTY";
}

export function hasOpenP1(s: HmsState, number: string) {
  return s.workOrders.some((w) => w.room === number && w.urgency === "P1" && !["RESOLVED", "VERIFIED"].includes(w.state));
}

export function isReady(s: HmsState, room: Room) {
  return displayStatus(room, s.settings) === "READY" && !hasOpenP1(s, room.number);
}

/** Human-readable reasons a room is not READY (answers "why not?" for Front Desk). */
export function notReadyReasons(s: HmsState, room: Room): string[] {
  const reasons: string[] = [];
  if (room.block) reasons.push(`${room.block.type === "OOO" ? "Out of order" : "Out of service"}: ${room.block.reason}`);
  if (hasOpenP1(s, room.number) && !room.block) reasons.push("Open P1 work order");
  if (room.occupancy === "OCCUPIED") reasons.push("Room is occupied");
  if (room.dnd) reasons.push("Do Not Disturb");
  if (room.hk === "DIRTY") reasons.push("Not cleaned yet");
  if (room.hk === "IN_PROGRESS" || room.hk === "PAUSED") reasons.push(`Cleaning ${room.hk === "PAUSED" ? "paused" : "in progress"}`);
  if (room.hk === "CLEAN" && s.settings.inspectionRequired) reasons.push("Waiting for supervisor inspection");
  return reasons;
}

export function checklistFor(s: HmsState, room: Room): ChecklistItem[] {
  return s.templates[templateKey(room.taskType)];
}

export function checklistProgress(s: HmsState, room: Room) {
  const list = checklistFor(s, room);
  const done = list.filter((it) => room.items[it.id]).length;
  const missingMandatory = list.filter((it) => it.mandatory && room.items[it.id]?.status !== "DONE");
  const missingPhoto = list.filter((it) => it.photo && room.items[it.id]?.status === "DONE" && !room.items[it.id]?.photo);
  const skipped = list.filter((it) => room.items[it.id]?.status === "SKIPPED").length;
  return {
    total: list.length,
    done,
    skipped,
    percent: list.length ? Math.round((done / list.length) * 100) : 0,
    canComplete: missingMandatory.length === 0 && missingPhoto.length === 0,
    missingMandatory,
    missingPhoto,
  };
}

export function stdMinutes(room: Room) {
  const info = roomTypeInfo[room.type];
  return room.taskType === "STAYOVER" ? info.stayover : info.departure;
}

export function activeMinutes(s: HmsState, room: Room) {
  if (room.startedAt === undefined) return undefined;
  const end = room.completedAt ?? (room.hk === "PAUSED" && room.pausedAt !== undefined ? room.pausedAt : demoNow(s));
  return Math.max(0, end - room.startedAt - room.pausedMinutes);
}

export function roomCredits(room: Room) {
  const base = roomTypeInfo[room.type].credits;
  return room.taskType === "STAYOVER" ? base * 0.5 : base;
}

export function roomEvents(s: HmsState, number: string) {
  return s.events.filter((e) => e.room === number);
}

export function lastInspection(room: Room) {
  return room.inspections[room.inspections.length - 1];
}

export type Escalation = {
  id: string;
  kind: "QUEUE_SLA" | "DND_WELFARE" | "P1_UNACCEPTED" | "ANOMALY";
  room: string;
  title: string;
  detail: string;
  tone: "warning" | "dnd" | "error";
  woId?: string;
};

export function escalations(s: HmsState): Escalation[] {
  const now = demoNow(s);
  const list: Escalation[] = [];
  for (const room of s.rooms) {
    if (room.queue && room.hk === "CLEAN" && room.completedAt !== undefined) {
      const left = room.completedAt + s.settings.queueSlaMin - now;
      list.push({
        id: `queue-${room.number}-${room.completedAt}`,
        kind: "QUEUE_SLA",
        room: room.number,
        title: `Queue room ${room.number} awaiting inspection`,
        detail: `${room.queue.guest} waiting · ${left > 0 ? `SLA ${left} min left` : `SLA breached ${-left} min ago`}`,
        tone: left > 0 ? "warning" : "error",
      });
    }
    if (room.dnd && now - room.dnd.since >= s.settings.dndWelfareHours * 60) {
      list.push({
        id: `dnd-${room.number}-${room.dnd.since}`,
        kind: "DND_WELFARE",
        room: room.number,
        title: `DND room ${room.number} over ${s.settings.dndWelfareHours}h`,
        detail: "Continuous Do Not Disturb · welfare check required",
        tone: "dnd",
      });
    }
  }
  // Maintenance (work orders, P1 acceptance) is not part of the staff app, so it raises no dashboard alerts (owner, 2026-11-18).
  return list.filter((e) => !s.resolvedEscalations.includes(e.id));
}

export const anomalyLabel: Record<Anomaly, string> = {
  TOO_FAST: "Too fast — under 40% of standard time",
  BULK_TICK: "Bulk tick — most items ticked within 1 minute",
  NO_START: "Marked clean without a start event",
  OFFLINE_CONFLICT: "Offline sync conflict",
};

/* ───────────────────────── Actions ───────────────────────── */

function room(draft: HmsState, number: string) {
  const r = draft.rooms.find((x) => x.number === number);
  if (!r) throw new Error(`Room ${number} not found`);
  return r;
}

function log(draft: HmsState, actor: string | null, roomNo: string | undefined, type: string, text: string, override = false) {
  const event: AuditEvent = { id: draft.nextEventId++, at: demoNow(draft), actor, room: roomNo, type, text, override };
  draft.events.push(event);
}

function isOverride(draft: HmsState, r: Room, actor: string) {
  const who = draft.staff.find((p) => p.id === actor);
  return who?.role !== "ATTENDANT" || (r.attendant !== null && r.attendant !== actor);
}

function initialsOf(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function newPin() {
  return String(1000 + Math.floor(Math.random() * 9000));
}

export const hms = {
  setPersona(platform: "desktop" | "mobile", persona: Persona) {
    set((d) => {
      if (platform === "desktop") d.desktopPersona = persona;
      else d.mobilePersona = persona;
    });
  },

  reset() {
    state = freshState(Date.now());
    persist();
    listeners.forEach((l) => l());
    toast.success("Demo data reset", { duration: 3000 });
  },

  /* ── Attendant ── */
  startCleaning(number: string, actor: string) {
    set((d) => {
      const r = room(d, number);
      if (r.dnd || r.block) return;
      r.hk = "IN_PROGRESS";
      r.startedAt = demoNow(d);
      r.completedAt = undefined;
      r.pausedMinutes = 0;
      r.pausedAt = undefined;
      if (!r.attendant) r.attendant = actor;
      log(d, actor, number, "CLEAN_STARTED", r.taskType === "RECLEAN" ? "Started re-clean" : "Started cleaning", isOverride(d, r, actor));
    });
  },

  pauseCleaning(number: string, actor: string, reason: string) {
    set((d) => {
      const r = room(d, number);
      r.hk = "PAUSED";
      r.pausedAt = demoNow(d);
      r.pauseReason = reason;
      log(d, actor, number, "CLEAN_PAUSED", `Paused · ${reason}`);
    });
  },

  resumeCleaning(number: string, actor: string) {
    set((d) => {
      const r = room(d, number);
      if (r.pausedAt !== undefined) r.pausedMinutes += Math.max(0, demoNow(d) - r.pausedAt);
      r.hk = "IN_PROGRESS";
      r.pausedAt = undefined;
      r.pauseReason = undefined;
      log(d, actor, number, "CLEAN_RESUMED", "Resumed cleaning");
    });
  },

  toggleItem(number: string, itemId: string, actor: string) {
    set((d) => {
      const r = room(d, number);
      const it = d.templates[templateKey(r.taskType)].find((x) => x.id === itemId);
      if (r.items[itemId]) {
        delete r.items[itemId];
        log(d, actor, number, "ITEM_UNCHECKED", `Unticked "${it?.label ?? itemId}"`);
      } else {
        r.items[itemId] = { status: "DONE", by: actor, at: demoNow(d) };
      }
    });
  },

  attachPhoto(number: string, itemId: string, actor: string) {
    set((d) => {
      const r = room(d, number);
      const it = d.templates[templateKey(r.taskType)].find((x) => x.id === itemId);
      r.items[itemId] = { status: "DONE", by: actor, at: demoNow(d), photo: true };
      log(d, actor, number, "PHOTO_ATTACHED", `Photo attached · ${it?.label ?? itemId}`);
    });
  },

  skipItem(number: string, itemId: string, actor: string, reason: string) {
    set((d) => {
      const r = room(d, number);
      const it = d.templates[templateKey(r.taskType)].find((x) => x.id === itemId);
      r.items[itemId] = { status: "SKIPPED", by: actor, at: demoNow(d), skipReason: reason };
      log(d, actor, number, "ITEM_SKIPPED", `Skipped "${it?.label ?? itemId}" · ${reason}`);
    });
  },

  markClean(number: string, actor: string) {
    let result: { minutes: number; anomalies: Anomaly[] } = { minutes: 0, anomalies: [] };
    set((d) => {
      const r = room(d, number);
      const now = demoNow(d);
      if (r.pausedAt !== undefined) r.pausedMinutes += Math.max(0, now - r.pausedAt);
      const minutes = r.startedAt !== undefined ? Math.max(0, now - r.startedAt - r.pausedMinutes) : 0;
      const anomalies: Anomaly[] = [];
      if (r.startedAt === undefined) anomalies.push("NO_START");
      else if (minutes < stdMinutes(r) * 0.4) anomalies.push("TOO_FAST");
      const ticks = Object.values(r.items).map((x) => x.at);
      if (ticks.length >= 5 && Math.max(...ticks) - Math.min(...ticks) <= 1 && minutes > 3) anomalies.push("BULK_TICK");
      r.anomalies = Array.from(new Set([...r.anomalies.filter((a) => a === "OFFLINE_CONFLICT"), ...anomalies]));
      r.hk = "CLEAN";
      r.completedAt = now;
      r.pausedAt = undefined;
      r.pauseReason = undefined;
      const done = Object.values(r.items).filter((x) => x.status === "DONE").length;
      const skipped = Object.values(r.items).filter((x) => x.status === "SKIPPED").length;
      log(d, actor, number, "CLEAN_COMPLETED", `Marked clean · ${fmtDuration(minutes)} · ${done} done, ${skipped} skipped`);
      result = { minutes, anomalies };
    });
    return result;
  },

  flagDnd(number: string, actor: string) {
    set((d) => {
      const r = room(d, number);
      r.dnd = { since: demoNow(d) };
      log(d, actor, number, "DND_FLAGGED", "Do Not Disturb flagged · will retry in 2h");
    });
  },

  clearDnd(number: string, actor: string, note = "DND cleared") {
    set((d) => {
      const r = room(d, number);
      r.dnd = undefined;
      log(d, actor, number, "DND_CLEARED", note);
    });
  },

  guestRefused(number: string, actor: string) {
    set((d) => {
      const r = room(d, number);
      r.refused = true;
      log(d, actor, number, "SERVICE_REFUSED", "Guest refused service today · no penalty");
    });
  },

  reportIssue(number: string, actor: string, input: { category: WorkOrder["category"]; urgency: WorkOrder["urgency"]; description: string }) {
    let id = "";
    set((d) => {
      const r = room(d, number);
      id = `WO-${1041 + d.workOrders.length}`;
      d.workOrders.unshift({
        id,
        room: number,
        category: input.category,
        urgency: input.urgency,
        state: "OPEN",
        description: input.description || `${input.category} issue`,
        reportedBy: actor,
        assignee: null,
        createdAt: demoNow(d),
      });
      const blockType = input.urgency === "P1" || input.category === "Pest" ? "OOO" : "OOS";
      r.block = { type: blockType, reason: `${input.urgency} ${input.category}${input.description ? ` — ${input.description}` : ""}`, woId: id, since: demoNow(d) };
      log(d, actor, number, "WORK_ORDER_CREATED", `${input.urgency} ${input.category} reported → ${blockType === "OOO" ? "Out of Order" : "Out of Service"} (${id})`);
    });
    return id;
  },

  reportIncident(number: string, actor: string, type: "DAMAGE" | "LOST_FOUND", description: string) {
    set((d) => {
      const count = d.incidents.filter((i) => i.type === type).length;
      const id = type === "DAMAGE" ? `INC-2026-${String(13 + count).padStart(4, "0")}` : `LF-2026-${String(43 + count).padStart(4, "0")}`;
      d.incidents.unshift({ id, room: number, type, description, by: actor, at: demoNow(d) });
      log(d, actor, number, type === "DAMAGE" ? "DAMAGE_REPORTED" : "LOST_FOUND_LOGGED", `${type === "DAMAGE" ? "Damage reported" : "Found item logged"} · ${description} (${id})`);
    });
  },

  /* ── Supervisor ── */
  submitInspection(number: string, actor: string, results: Record<string, boolean>, opts: { note?: string; photo?: boolean; remote?: boolean } = {}) {
    let passed = false;
    set((d) => {
      const r = room(d, number);
      const { score, criticalFail } = scoreInspection(results);
      passed = score >= d.settings.passScore && !criticalFail;
      const failed = inspectionPoints.filter((p) => results[p.id] === false).map((p) => p.id);
      r.inspections.push({ by: actor, at: demoNow(d), score, result: passed ? "PASSED" : "FAILED", failed, note: opts.note, photo: opts.photo, remote: opts.remote });
      if (passed) {
        r.hk = "INSPECTED";
        log(d, actor, number, "INSPECTION_PASSED", `${opts.remote ? "Remote approval" : "Inspection passed"} · ${score}%`);
        if (r.queue && r.occupancy === "VACANT" && !r.block) {
          toast.success(`Room ${number} is READY for ${r.queue.guest}`, { duration: 5000 });
        }
      } else {
        r.hk = "DIRTY";
        r.taskType = "RECLEAN";
        r.items = {};
        r.startedAt = undefined;
        r.completedAt = undefined;
        r.pausedMinutes = 0;
        log(d, actor, number, "INSPECTION_FAILED", `Inspection failed · ${score}%${criticalFail ? " (critical point)" : ""} → re-clean${opts.note ? ` · ${opts.note}` : ""}`);
      }
    });
    return passed;
  },

  remoteApprove(number: string, actor: string) {
    const results = Object.fromEntries(inspectionPoints.map((p) => [p.id, true]));
    return hms.submitInspection(number, actor, results, { remote: true, note: "Manager remote approval from attendant photos" });
  },

  resetStatus(number: string, actor: string, reason: string) {
    set((d) => {
      const r = room(d, number);
      r.hk = "DIRTY";
      r.items = {};
      r.startedAt = undefined;
      r.completedAt = undefined;
      r.pausedAt = undefined;
      r.pausedMinutes = 0;
      log(d, actor, number, "STATUS_RESET", `Status reset to Dirty · ${reason}`, true);
    });
  },

  /* ── Assignment ── */
  assignRoom(number: string, attendantId: string | null, actor: string) {
    set((d) => {
      const r = room(d, number);
      const from = r.attendant;
      if (from === attendantId) return;
      r.attendant = attendantId;
      d.published = false;
      log(d, actor, number, from ? "ROOM_REASSIGNED" : "ROOM_ASSIGNED", attendantId ? `${from ? `Reassigned from ${staffName(d, from)} to` : "Assigned to"} ${staffName(d, attendantId)}` : `Unassigned from ${staffName(d, from)}`);
    });
  },

  autoAssign(actor: string) {
    let count = 0;
    set((d) => {
      const attendants = d.staff.filter((p) => p.active !== false && p.role === "ATTENDANT");
      const load = new Map(attendants.map((a) => [a.id, 0]));
      const floorsOf = new Map(attendants.map((a) => [a.id, new Set<number>()]));
      for (const r of d.rooms) {
        if (r.attendant && load.has(r.attendant) && r.hk !== "INSPECTED") {
          load.set(r.attendant, (load.get(r.attendant) ?? 0) + roomCredits(r));
          floorsOf.get(r.attendant)?.add(r.floor);
        }
      }
      const pending = d.rooms.filter((r) => !r.attendant && !r.block && r.hk !== "INSPECTED");
      pending.sort((a, b) => Number(!!b.queue) - Number(!!a.queue) || Number(!!b.vip) - Number(!!a.vip) || a.number.localeCompare(b.number));
      for (const r of pending) {
        const ranked = [...attendants].sort((a, b) => {
          const fa = floorsOf.get(a.id)?.has(r.floor) ? -2 : 0;
          const fb = floorsOf.get(b.id)?.has(r.floor) ? -2 : 0;
          return (load.get(a.id) ?? 0) + fa - ((load.get(b.id) ?? 0) + fb);
        });
        const target = ranked[0];
        if (!target) continue;
        r.attendant = target.id;
        load.set(target.id, (load.get(target.id) ?? 0) + roomCredits(r));
        floorsOf.get(target.id)?.add(r.floor);
        log(d, actor, r.number, "ROOM_ASSIGNED", `Auto-assigned to ${target.name}`);
        count++;
      }
      if (count) d.published = false;
    });
    return count;
  },

  publishAssignments(actor: string) {
    set((d) => {
      d.published = true;
      log(d, actor, undefined, "ASSIGNMENTS_PUBLISHED", "Assignments published · attendants notified");
    });
  },

  /* ── Front desk ── */
  queueGuest(number: string, guest: string, actor: string) {
    set((d) => {
      const r = room(d, number);
      r.queue = { guest, at: demoNow(d) };
      r.arrival = { guest, eta: "Waiting in lobby" };
      log(d, actor, number, "QUEUE_ADDED", `Guest queued · ${guest} waiting → priority #1`);
    });
  },

  clearQueue(number: string, actor: string) {
    set((d) => {
      const r = room(d, number);
      r.queue = undefined;
      log(d, actor, number, "QUEUE_CLEARED", "Queue cleared");
    });
  },

  checkIn(number: string, actor: string, guest?: string) {
    set((d) => {
      const r = room(d, number);
      r.occupancy = "OCCUPIED";
      r.guest = guest ?? r.queue?.guest ?? r.arrival?.guest ?? "Walk-in guest";
      r.queue = undefined;
      r.arrival = undefined;
      r.taskType = "STAYOVER";
      const res = d.reservations.find((x) => x.roomId === number && x.status === "expected" && x.arrivalDate <= DEMO_DATE);
      if (res) res.status = "checked_in";
      log(d, actor, number, "CHECKED_IN", `Checked in · ${r.guest}${res ? ` · ${res.code}` : ""}`);
    });
  },

  checkOut(number: string, actor: string) {
    set((d) => {
      const r = room(d, number);
      const guest = r.guest;
      r.occupancy = "VACANT";
      r.hk = "DIRTY";
      r.taskType = "DEPARTURE";
      r.items = {};
      r.startedAt = undefined;
      r.completedAt = undefined;
      r.pausedMinutes = 0;
      r.dnd = undefined;
      r.refused = undefined;
      r.guest = undefined;
      log(d, actor, number, "CHECKED_OUT", `Checked out${guest ? ` · ${guest}` : ""} → Dirty, departure clean needed`);
    });
  },

  /* ── Work orders ── */
  createWorkOrder(input: { room: string; category: WorkOrder["category"]; urgency: WorkOrder["urgency"]; description: string }, actor: string) {
    return hms.reportIssue(input.room, actor, input);
  },

  woAssign(id: string, engineerId: string, actor: string) {
    set((d) => {
      const wo = d.workOrders.find((w) => w.id === id);
      if (!wo) return;
      wo.assignee = engineerId;
      log(d, actor, wo.room, "WO_ASSIGNED", `${id} assigned to ${staffName(d, engineerId)}`);
    });
  },

  woAccept(id: string, actor: string) {
    set((d) => {
      const wo = d.workOrders.find((w) => w.id === id);
      if (!wo) return;
      wo.state = "ACCEPTED";
      wo.assignee = wo.assignee ?? actor;
      wo.acceptedAt = demoNow(d);
      log(d, actor, wo.room, "WO_ACCEPTED", `${staffName(d, actor)} accepted ${id}`);
    });
  },

  woStart(id: string, actor: string) {
    set((d) => {
      const wo = d.workOrders.find((w) => w.id === id);
      if (!wo) return;
      wo.state = "IN_PROGRESS";
      log(d, actor, wo.room, "WO_STARTED", `Repair started · ${id}`);
    });
  },

  woResolve(id: string, actor: string, resolution: string, needsCleaning: boolean) {
    set((d) => {
      const wo = d.workOrders.find((w) => w.id === id);
      if (!wo) return;
      wo.state = "RESOLVED";
      wo.resolvedAt = demoNow(d);
      wo.resolution = resolution || "Fixed";
      wo.needsCleaning = needsCleaning;
      log(d, actor, wo.room, "WO_RESOLVED", `${id} resolved · ${wo.resolution} · awaiting supervisor verification`);
    });
  },

  woVerify(id: string, actor: string) {
    set((d) => {
      const wo = d.workOrders.find((w) => w.id === id);
      if (!wo) return;
      wo.state = "VERIFIED";
      const r = room(d, wo.room);
      if (r.block?.woId === id) r.block = undefined;
      if (wo.needsCleaning !== false) {
        r.hk = "DIRTY";
        r.taskType = "POST_REPAIR";
        r.items = {};
        r.startedAt = undefined;
        r.completedAt = undefined;
      }
      log(d, actor, wo.room, "BLOCK_RELEASED", `${id} verified · block released${wo.needsCleaning !== false ? " → post-repair clean needed" : ""}`);
    });
  },

  /* ── Escalations & settings ── */
  resolveEscalation(id: string, actor: string, note: string, roomNo?: string) {
    set((d) => {
      d.resolvedEscalations.push(id);
      log(d, actor, roomNo, "ESCALATION_RESOLVED", note);
    });
  },

  updateSettings(patch: Partial<Settings>, actor: string) {
    set((d) => {
      d.settings = { ...d.settings, ...patch };
      log(d, actor, undefined, "SETTINGS_UPDATED", `Rules updated · ${Object.entries(patch).map(([k, v]) => `${k}=${v}`).join(", ")}`);
    });
  },

  updateChecklistItem(tpl: "departure" | "stayover", itemId: string, patch: Partial<ChecklistItem>, actor: string) {
    set((d) => {
      const it = d.templates[tpl].find((x) => x.id === itemId);
      if (!it) return;
      Object.assign(it, patch);
      log(d, actor, undefined, "CHECKLIST_UPDATED", `${tpl} checklist · "${it.label}" updated`);
    });
  },

  addChecklistItem(tpl: "departure" | "stayover", input: Omit<ChecklistItem, "id">, actor: string) {
    set((d) => {
      const id = `${tpl[0]}${Date.now().toString(36)}`;
      d.templates[tpl].push({ ...input, id });
      log(d, actor, undefined, "CHECKLIST_UPDATED", `${tpl} checklist · added "${input.label}"`);
    });
  },

  removeChecklistItem(tpl: "departure" | "stayover", itemId: string, actor: string) {
    set((d) => {
      const it = d.templates[tpl].find((x) => x.id === itemId);
      d.templates[tpl] = d.templates[tpl].filter((x) => x.id !== itemId);
      log(d, actor, undefined, "CHECKLIST_UPDATED", `${tpl} checklist · removed "${it?.label ?? itemId}"`);
    });
  },

  /* ── Reservations ── */

  createReservation(input: Omit<Reservation, "id" | "code" | "followUps" | "createdBy" | "status" | "roomId">, actor: string) {
    let code = "";
    set((d) => {
      const n = 48300 + d.reservations.length;
      code = `MD-${n}`;
      d.reservations.unshift({ ...input, id: `res-${n}`, code, status: "expected", roomId: null, createdBy: actor, followUps: [] });
      log(d, actor, undefined, "RESERVATION_CREATED", `Reservation ${code} · ${input.guestName} · ${input.roomType} · ${input.arrivalDate}`);
    });
    return code;
  },

  /** Puts a today's booking on a room, so housekeeping and the board see the arrival. */
  assignReservationRoom(id: string, roomNo: string | null, actor: string) {
    set((d) => {
      const res = d.reservations.find((x) => x.id === id);
      if (!res) return;
      if (res.roomId) {
        const old = d.rooms.find((r) => r.number === res.roomId);
        if (old?.arrival?.guest === res.guestName) old.arrival = undefined;
      }
      res.roomId = roomNo;
      if (roomNo && res.arrivalDate === DEMO_DATE) {
        const r = room(d, roomNo);
        r.arrival = { guest: res.guestName, eta: res.expectedCheckIn };
        if (res.vip) r.vip = true;
      }
      log(d, actor, roomNo ?? undefined, "RESERVATION_ROOM", roomNo ? `${res.code} · ${res.guestName} → room ${roomNo}` : `${res.code} · room released`);
    });
  },

  logFollowUp(id: string, input: { outcome: FollowUpOutcome; note?: string | undefined; newTime?: string | undefined }, actor: string) {
    set((d) => {
      const res = d.reservations.find((x) => x.id === id);
      if (!res) return;
      res.followUps.push({ ...input, at: demoNow(d), by: actor });
      if (input.outcome === "coming" && input.newTime) {
        res.expectedCheckIn = input.newTime;
        if (res.arrivalDate < DEMO_DATE) res.arrivalDate = DEMO_DATE;
        const r = res.roomId ? d.rooms.find((x) => x.number === res.roomId) : undefined;
        if (r?.arrival) r.arrival.eta = input.newTime;
      }
      if (input.outcome === "cancelled" || input.outcome === "no_show") {
        res.status = input.outcome === "cancelled" ? "cancelled" : "no_show";
        const r = res.roomId ? d.rooms.find((x) => x.number === res.roomId) : undefined;
        if (r?.arrival?.guest === res.guestName) r.arrival = undefined;
        res.roomId = null;
      }
      log(d, actor, undefined, "RESERVATION_FOLLOW_UP", `${res.code} · ${res.guestName} · ${followUpLabel[input.outcome]}${input.newTime ? ` · new time ${input.newTime}` : ""}${input.note ? ` · ${input.note}` : ""}`);
    });
  },

  /** Reception sends a request to the floor supervisor of the room's wing. */
  createRequest(input: { room: string; type: GuestRequest["type"]; note: string; urgent: boolean }, actor: string) {
    let id = "";
    set((d) => {
      const n = 105 + d.requests.length;
      id = `GR-${n}`;
      const wing = Number(input.room[0]);
      const sup = d.staff.find((p) => p.active !== false && p.role === "SUPERVISOR" && (p.floors ?? []).includes(wing));
      d.requests.unshift({ id, ...input, requestedAt: demoNow(d), requestedBy: actor, status: "pending", assignedTo: sup?.id ?? null });
      log(d, actor, input.room, "REQUEST_SENT", `${guestRequestLabel[input.type]} requested${input.note ? ` · ${input.note}` : ""}${sup ? ` · sent to ${sup.name}` : ""}`);
    });
    return id;
  },

  setRequestStatus(id: string, status: "acknowledged" | "completed" | "cancelled", actor: string) {
    set((d) => {
      const r = d.requests.find((x) => x.id === id);
      if (!r) return;
      r.status = status;
      if (status === "acknowledged") r.acknowledgedAt = demoNow(d);
      if (status === "completed") r.completedAt = demoNow(d);
      log(d, actor, r.room, `REQUEST_${status.toUpperCase()}`, `${guestRequestLabel[r.type]} · ${status === "acknowledged" ? "on the way" : status}`);
    });
  },

  /** Creates a team member. Staff-app roles get a 4-digit PIN; dashboard roles get a temporary password. Both are returned once, never shown again. */
  addStaff(input: Omit<Staff, "id" | "initials" | "pin" | "active" | "createdAt">, actor: string) {
    const id = `u${Date.now().toString(36)}`;
    const phoneRole = signsInOnPhone(input.role);
    const secret = phoneRole ? newPin() : `MD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    set((d) => {
      d.staff.push({ ...input, id, initials: initialsOf(input.name), pin: phoneRole ? secret : undefined, active: true, createdAt: demoNow(d) });
      log(d, actor, undefined, "USER_CREATED", `User created · ${input.name} · ${roleLabel[input.role]}`);
    });
    return { id, secret };
  },

  updateStaff(id: string, patch: Partial<Pick<Staff, "name" | "role" | "floors" | "shift" | "phone" | "email">>, actor: string) {
    set((d) => {
      const p = d.staff.find((x) => x.id === id);
      if (!p) return;
      Object.assign(p, patch);
      if (patch.name) p.initials = initialsOf(patch.name);
      if (p.role !== "SUPERVISOR") p.floors = undefined;
      log(d, actor, undefined, "USER_UPDATED", `User updated · ${p.name}`);
    });
  },

  resetPin(id: string, actor: string) {
    const pin = newPin();
    set((d) => {
      const p = d.staff.find((x) => x.id === id);
      if (!p) return;
      p.pin = pin;
      log(d, actor, undefined, "USER_PIN_RESET", `PIN reset · ${p.name}`);
    });
    return pin;
  },

  /** Deactivating hides the person from sign-in and assignment and returns their unfinished rooms to the pool. */
  setStaffActive(id: string, active: boolean, actor: string) {
    let released = 0;
    set((d) => {
      const p = d.staff.find((x) => x.id === id);
      if (!p) return;
      p.active = active;
      if (!active) {
        for (const r of d.rooms) {
          if (r.attendant === id && r.hk === "DIRTY") {
            r.attendant = null;
            released += 1;
          }
        }
        if (released) d.published = false;
      }
      log(d, actor, undefined, active ? "USER_ACTIVATED" : "USER_DEACTIVATED", `${active ? "User reactivated" : "User deactivated"} · ${p.name}${released ? ` · ${released} rooms back to unassigned` : ""}`);
    });
    return released;
  },
};
