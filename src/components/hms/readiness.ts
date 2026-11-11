import type { Room } from "@/lib/demo-data";
import {
  activeMinutes,
  demoNow,
  displayStatus,
  type HmsState,
  isReady,
  stdMinutes,
} from "@/lib/hms-store";

/** Standard check-out time used to estimate when an occupied due-out room frees up. */
const CHECKOUT_MIN = 12 * 60;

/**
 * Estimated minutes until a room is READY, from standard clean times.
 * `null` means it can't be estimated (DND or blocked): treat as a risk.
 * This is an internal estimate, never a PMS promise.
 */
export function minutesToReady(s: HmsState, room: Room): number | null {
  if (isReady(s, room)) return 0;
  const st = displayStatus(room, s.settings);
  const insp = s.settings.inspectionRequired ? 10 : 0;
  const now = demoNow(s);
  switch (st) {
    case "AWAITING_INSPECTION":
      return 10;
    case "CLEANING":
      return Math.max(1, stdMinutes(room) - (activeMinutes(s, room) ?? 0)) + insp;
    case "DIRTY":
      // Unqueued rooms wait their turn on the attendant's list.
      return stdMinutes(room) + insp + (room.queue ? 0 : 20);
    case "OCCUPIED":
      return Math.max(0, CHECKOUT_MIN - now) + stdMinutes(room) + insp;
    case "READY":
      return 0;
    default:
      return null;
  }
}

/** Arrival time in minutes after midnight. Guests already waiting count as "now". */
export function arrivalMinute(s: HmsState, room: Room): number | null {
  if (!room.arrival) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(room.arrival.eta.trim());
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return demoNow(s);
}

export type ArrivalRisk = "ready" | "ontrack" | "tight" | "late";

export function arrivalRisk(
  s: HmsState,
  room: Room,
): { risk: ArrivalRisk; readyAt: number | null; eta: number } | null {
  const eta = arrivalMinute(s, room);
  if (eta === null) return null;
  const est = minutesToReady(s, room);
  if (est === 0) return { risk: "ready", readyAt: demoNow(s), eta };
  if (est === null) return { risk: "late", readyAt: null, eta };
  const readyAt = demoNow(s) + est;
  const slack = eta - readyAt;
  return { risk: slack < 0 ? "late" : slack < 30 ? "tight" : "ontrack", readyAt, eta };
}

export const riskLabel: Record<ArrivalRisk, string> = {
  ready: "Ready",
  ontrack: "On track",
  tight: "Tight",
  late: "At risk",
};
