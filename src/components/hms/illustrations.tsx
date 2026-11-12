/**
 * Riwaq illustration kit. Original, hand-written SVG drawn for this project
 * (no photos, no third-party art, no real hotel imagery). Palette follows the
 * juss/brass/mud tokens in DESIGN.md. Pictures always sit next to a text label:
 * they help people who read little, they never carry status on their own.
 */
import { useId } from "react";
import {
  AirVent,
  Archive,
  Armchair,
  Bath,
  BedDouble,
  BedSingle,
  Blinds,
  BrickWall,
  Brush,
  Bug,
  CircleSlash,
  Coffee,
  Droplets,
  Ellipsis,
  Flower2,
  Footprints,
  Hammer,
  Hand,
  Lightbulb,
  Lock,
  Luggage,
  type LucideIcon,
  Package,
  Plug,
  RotateCcw,
  ScanSearch,
  ShowerHead,
  Sparkles,
  SprayCan,
  Toilet,
  Trash2,
  Users,
  UtensilsCrossed,
  Waves,
  Wind,
  Wrench,
  Shirt,
} from "lucide-react";
import type { ChecklistItem, RoomType, Staff, TaskType, WorkOrder, Zone } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import courtyardDawn from "@/assets/photos/courtyard-dawn.webp";
import courtyardDusk from "@/assets/photos/courtyard-dusk.webp";
import majlisNight from "@/assets/photos/majlis-night.webp";
import majlisLuxury from "@/assets/photos/majlis-luxury.jpg";
import roomCourtyard from "@/assets/photos/room-courtyard.webp";
import roomHeritage from "@/assets/photos/room-heritage.webp";
import mobileShiftSuite from "@/assets/photos/mobile-shift-suite.jpg";
import roomSuite from "@/assets/photos/room-suite.webp";
import roomTwin from "@/assets/photos/room-twin.webp";

/** AI-generated imagery (Lovable image generation, 2026-11-11). Fictional property: no real hotel is shown. */
export const photos = { courtyardDawn, courtyardDusk, majlisNight, majlisLuxury, shiftSuite: mobileShiftSuite };

const roomPhotos: Record<RoomType, string> = {
  "Heritage Room": roomHeritage,
  "Courtyard Room": roomCourtyard,
  "Twin Room": roomTwin,
  Suite: roomSuite,
};

/** Photo of the room type. Decorative: the room number and status sit next to it in text. */
export function RoomPhoto({ type, className, refined = false }: { type: RoomType; className?: string; refined?: boolean }) {
  return <img src={refined && type === "Heritage Room" ? mobileShiftSuite : roomPhotos[type]} alt="" width={1536} height={1024} className={cn("room-photo", className)} loading="lazy" decoding="async" />;
}

const C = {
  ink: "#2B1E15",
  wood: "#5A3B26",
  woodLight: "#7A5236",
  mud: "#A5784F",
  mudLight: "#C99A6B",
  mudPale: "#DDBB93",
  juss: "#E9DCC3",
  plaster: "#F6F1E8",
  brass: "#C9A86A",
  brassDeep: "#9C7B3E",
  palm: "#56704C",
  palmDark: "#3A5034",
  glow: "#FFD58A",
  linen: "#FFFDF8",
  rug: "#9E4A33",
  teal: "#3F6F73",
};

/** Najdi triangular crenellations along a width. */
function crenels(x: number, y: number, width: number, size: number) {
  const n = Math.max(1, Math.floor(width / (size * 1.6)));
  const step = width / n;
  let d = "";
  for (let i = 0; i < n; i++) {
    const cx = x + step * i + step / 2;
    d += `M${cx - size / 2} ${y}L${cx} ${y - size}L${cx + size / 2} ${y}Z`;
  }
  return d;
}

/** A pointed (Gulf) arch opening. */
function arch(cx: number, w: number, spring: number, base: number) {
  const h = w * 0.62;
  return `M${cx - w / 2} ${base}V${spring}Q${cx - w / 2} ${spring - h * 0.8} ${cx} ${spring - h}Q${cx + w / 2} ${spring - h * 0.8} ${cx + w / 2} ${spring}V${base}Z`;
}

/* ───────────────────────── Courtyard scene (login hero) ───────────────────────── */

export function CourtyardScene({ time = "dusk", className }: { time?: "dawn" | "dusk"; className?: string }) {
  const id = useId().replace(/:/g, "");
  const dusk = time === "dusk";
  const arches = [120, 250, 400, 550, 680];
  return (
    <svg className={className} viewBox="0 0 800 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          {dusk ? (
            <>
              <stop offset="0" stopColor="#1C2440" />
              <stop offset=".45" stopColor="#5B4468" />
              <stop offset=".78" stopColor="#D98B6A" />
              <stop offset="1" stopColor="#F2C48D" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#9FC3CF" />
              <stop offset=".55" stopColor="#E9D9C0" />
              <stop offset="1" stopColor="#F6DDB4" />
            </>
          )}
        </linearGradient>
        <radialGradient id={`glow${id}`} cx=".5" cy=".75" r=".7">
          <stop offset="0" stopColor={C.glow} stopOpacity=".95" />
          <stop offset=".6" stopColor="#E9A55C" stopOpacity=".55" />
          <stop offset="1" stopColor={C.ink} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`wall${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dusk ? "#B07E55" : C.mudLight} />
          <stop offset="1" stopColor={dusk ? "#7E5636" : C.mud} />
        </linearGradient>
        <mask id={`moon${id}`}>
          <rect width="800" height="600" fill="#fff" />
          <circle cx="628" cy="92" r="30" fill="#000" />
        </mask>
      </defs>

      <rect width="800" height="600" fill={`url(#sky${id})`} />
      {dusk ? (
        <g fill="#FFF4D6">
          {[[80, 60, 1.6], [190, 120, 1.1], [300, 48, 1.4], [420, 96, 1], [500, 36, 1.8], [720, 150, 1.2], [760, 60, 1.4], [350, 160, 0.9]].map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} opacity=".85" />
          ))}
          <circle cx="612" cy="100" r="34" fill="#F7E7B8" mask={`url(#moon${id})`} />
        </g>
      ) : (
        <g>
          <circle cx="640" cy="150" r="70" fill="#FFE7B0" opacity=".45" />
          <circle cx="640" cy="150" r="42" fill="#FFE2A0" />
        </g>
      )}

      {/* far dunes */}
      <path d="M0 330C120 300 220 320 320 305S520 290 620 300 760 290 800 300V400H0Z" fill={dusk ? "#8E5E58" : "#E0BF94"} opacity=".55" />

      {/* fort tower (left) */}
      <rect x="40" y="170" width="130" height="260" fill={`url(#wall${id})`} />
      <path d={crenels(40, 170, 130, 16)} fill={`url(#wall${id})`} />
      <rect x="92" y="215" width="12" height="26" rx="6" fill={C.ink} opacity=".7" />
      <rect x="92" y="275" width="12" height="26" rx="6" fill={C.ink} opacity=".7" />
      {/* wind tower (right) */}
      <rect x="590" y="150" width="96" height="280" fill={`url(#wall${id})`} />
      <path d={crenels(590, 150, 96, 14)} fill={`url(#wall${id})`} />
      {[604, 622, 640, 658].map((x) => (
        <rect key={x} x={x} y="168" width="9" height="74" fill={C.ink} opacity=".72" />
      ))}
      <path d="M590 250H686" stroke={C.ink} strokeOpacity=".25" strokeWidth="4" />
      {/* main wall */}
      <rect x="0" y="300" width="800" height="300" fill={`url(#wall${id})`} />
      <path d={crenels(0, 300, 800, 18)} fill={`url(#wall${id})`} />
      {/* wooden water spouts (marzam) */}
      {[200, 470, 740].map((x) => (
        <rect key={x} x={x} y="312" width="26" height="6" fill={C.wood} />
      ))}

      {/* riwaq colonnade */}
      <rect x="0" y="352" width="800" height="18" fill={C.ink} opacity=".12" />
      {arches.map((cx, i) => {
        const w = i === 2 ? 118 : 92;
        const spring = i === 2 ? 455 : 470;
        return (
          <g key={cx}>
            <path d={arch(cx, w, spring, 560)} fill={C.ink} />
            <path d={arch(cx, w, spring, 560)} fill={`url(#glow${id})`} opacity={dusk ? 1 : 0.55} />
            {/* hanging lantern */}
            <path d={`M${cx} ${spring - w * 0.55}V${spring - w * 0.2}`} stroke={C.brassDeep} strokeWidth="1.5" />
            <path d={`M${cx - 7} ${spring - w * 0.2}h14l-3 18h-8Z`} fill={C.brass} />
            <circle cx={cx} cy={spring - w * 0.2 + 9} r="5" fill="#FFF1C4" opacity={dusk ? 1 : 0.6} />
          </g>
        );
      })}
      {/* carved door in the middle arch */}
      <path d={arch(400, 70, 480, 560)} fill={C.wood} />
      <path d="M400 437V560" stroke={C.ink} strokeWidth="2" opacity=".6" />
      {[0, 1, 2].map((r) => (
        <g key={r} fill="none" stroke={C.brass} strokeWidth="1.4" opacity=".75">
          <rect x="374" y={488 + r * 22} width="18" height="14" />
          <rect x="408" y={488 + r * 22} width="18" height="14" />
        </g>
      ))}
      <circle cx="394" cy="525" r="2.4" fill={C.brass} />
      <circle cx="406" cy="525" r="2.4" fill={C.brass} />

      {/* courtyard floor */}
      <path d="M0 560H800V600H0Z" fill={dusk ? "#CFAF85" : C.juss} />
      <path d="M0 560H800" stroke={C.ink} strokeOpacity=".18" strokeWidth="2" />

      {/* palm (left foreground) */}
      <g>
        <path d="M232 600C236 540 230 470 246 410" stroke={C.wood} strokeWidth="12" fill="none" strokeLinecap="round" />
        {[430, 470, 510, 550].map((y) => (
          <path key={y} d={`M${226 + (600 - y) * 0.03} ${y}h18`} stroke={C.ink} strokeOpacity=".25" strokeWidth="2" />
        ))}
        <g fill={dusk ? "#2F3F2B" : C.palm}>
          <path d="M246 410C210 384 170 388 140 410C178 398 214 402 246 414Z" />
          <path d="M246 410C226 370 196 352 162 352C198 368 222 390 244 416Z" />
          <path d="M246 410C252 368 276 344 306 336C282 360 264 386 250 416Z" />
          <path d="M246 410C286 392 326 398 352 420C318 408 282 408 248 416Z" />
          <path d="M246 410C246 376 236 348 218 330C240 356 248 384 248 414Z" />
          <path d="M246 412C226 430 212 456 210 484C224 456 236 438 250 418Z" />
          <path d="M246 412C270 430 288 452 294 480C278 456 262 438 244 418Z" />
        </g>
        <g fill={C.wood}>
          <circle cx="240" cy="420" r="5" />
          <circle cx="250" cy="423" r="5" />
          <circle cx="245" cy="430" r="5" />
        </g>
      </g>
      {/* planter + small palm right */}
      <g>
        <path d="M600 600C602 570 598 545 606 520" stroke={C.wood} strokeWidth="7" fill="none" strokeLinecap="round" />
        <g fill={dusk ? "#2F3F2B" : C.palm}>
          <path d="M606 520C586 506 566 508 550 520C570 514 588 516 606 524Z" />
          <path d="M606 520C624 504 646 504 662 516C642 512 624 516 606 524Z" />
          <path d="M606 520C600 500 590 488 576 482C592 494 600 506 604 524Z" />
          <path d="M606 520C614 500 626 488 642 484C626 496 616 508 608 524Z" />
        </g>
        <path d="M584 572h44l-6 28h-32Z" fill={C.brassDeep} />
      </g>
    </svg>
  );
}

/* ───────────────────────── Room illustrations ───────────────────────── */

type BedState = "messy" | "made" | "progress";

function Bed({ x, y, w, state }: { x: number; y: number; w: number; state: BedState }) {
  const h = w * 0.36;
  return (
    <g>
      <rect x={x} y={y - h * 1.15} width={w} height={h * 1.15} rx="4" fill={C.wood} />
      <path d={`M${x + 4} ${y - h * 0.95}h${w - 8}`} stroke={C.brass} strokeWidth="1.5" opacity=".7" />
      <rect x={x - 3} y={y - h * 0.1} width={w + 6} height={h * 0.9} rx="3" fill={C.linen} />
      {state === "messy" ? (
        <>
          <rect x={x + 5} y={y - h * 0.45} width={w * 0.3} height={h * 0.38} rx="4" fill={C.linen} stroke={C.juss} transform={`rotate(-14 ${x + 5} ${y})`} />
          <path d={`M${x - 3} ${y + h * 0.2}C${x + w * 0.25} ${y - h * 0.15} ${x + w * 0.5} ${y + h * 0.55} ${x + w * 0.75} ${y + h * 0.05}S${x + w + 6} ${y + h * 0.45} ${x + w + 3} ${y + h * 0.8}V${y + h * 0.8}H${x - 3}Z`} fill="#D9CDBA" />
          <path d={`M${x + w * 0.2} ${y + h * 0.35}q8 -6 16 0M${x + w * 0.55} ${y + h * 0.5}q8 -6 16 0`} stroke="#BBA98F" strokeWidth="1.4" fill="none" />
        </>
      ) : (
        <>
          <rect x={x + 4} y={y - h * 0.42} width={w / 2 - 7} height={h * 0.38} rx="4" fill={C.linen} stroke={C.juss} />
          <rect x={x + w / 2 + 3} y={y - h * 0.42} width={w / 2 - 7} height={h * 0.38} rx="4" fill={C.linen} stroke={C.juss} />
          <rect x={x - 3} y={y + h * 0.15} width={w + 6} height={h * 0.65} rx="2" fill={state === "progress" ? "#E6DAC6" : C.brass} opacity={state === "progress" ? 1 : 0.9} />
          {state === "made" ? <path d={`M${x - 3} ${y + h * 0.3}h${w + 6}`} stroke={C.plaster} strokeWidth="1.5" /> : null}
        </>
      )}
      <rect x={x - 3} y={y + h * 0.8} width="4" height="6" fill={C.wood} />
      <rect x={x + w - 1} y={y + h * 0.8} width="4" height="6" fill={C.wood} />
    </g>
  );
}

function Lantern({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x} ${y - 12}V${y}`} stroke={C.brassDeep} strokeWidth="1" />
      <path d={`M${x - 5} ${y}h10l-2 12h-6Z`} fill={C.brass} />
      <circle cx={x} cy={y + 6} r="2.6" fill="#FFF1C4" />
    </g>
  );
}

function Sparkle({ x, y, s = 5 }: { x: number; y: number; s?: number }) {
  return <path d={`M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`} fill={C.brass} />;
}

/** Interior thumbnail for a room type. State drives the bed: messy (to clean), progress, made (clean). */
export function RoomArt({ type, state = "made", className, anchor = "xMidYMid" }: { type: RoomType; state?: BedState; className?: string; anchor?: "xMidYMid" | "xMidYMax" }) {
  const id = useId().replace(/:/g, "");
  const twin = type === "Twin Room";
  const suite = type === "Suite";
  const courtyard = type === "Courtyard Room";
  return (
    <svg className={className} viewBox="0 0 120 90" preserveAspectRatio={`${anchor} slice`} aria-hidden="true">
      <defs>
        <linearGradient id={`rw${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.plaster} />
          <stop offset="1" stopColor={C.juss} />
        </linearGradient>
        <linearGradient id={`win${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={courtyard ? "#A9CBD3" : "#E9C79A"} />
          <stop offset="1" stopColor={courtyard ? "#E7DCC2" : "#F6E4C4"} />
        </linearGradient>
      </defs>
      <rect width="120" height="90" fill={`url(#rw${id})`} />
      {/* wooden ceiling beams */}
      <rect width="120" height="7" fill={C.woodLight} />
      {[10, 30, 50, 70, 90, 110].map((x) => <rect key={x} x={x - 2} y="0" width="4" height="9" fill={C.wood} />)}
      {/* floor + rug */}
      <rect y="70" width="120" height="20" fill={C.mudPale} />
      <rect x={suite ? 6 : 18} y="74" width={suite ? 108 : 84} height="12" rx="1.5" fill={C.rug} />
      <path d={`M${suite ? 10 : 22} 80h${suite ? 100 : 76}`} stroke={C.brass} strokeWidth="1.2" strokeDasharray="3 3" />
      {/* window or niche */}
      <g transform={`translate(${suite ? 88 : twin ? 52 : 86} 0)`}>
        <path d={arch(0, 20, 30, 52)} fill={C.wood} />
        <path d={arch(0, 15, 31, 50)} fill={`url(#win${id})`} />
        {courtyard ? (
          <g fill={C.palm}>
            <path d="M0 50V36" stroke={C.wood} strokeWidth="1.6" />
            <path d="M0 36c-4-3-8-3-10 0 3-1 7-1 10 1ZM0 36c4-3 8-3 10 0-3-1-7-1-10 1ZM0 36c-1-4-3-6-6-7 3 2 5 4 6 8ZM0 36c1-4 3-6 6-7-3 2-5 4-6 8Z" />
          </g>
        ) : (
          <g stroke={C.wood} strokeWidth="1" opacity=".8">
            <path d="M-7 38h14M-7 43h14M-3.5 24v26M3.5 24v26" />
          </g>
        )}
      </g>
      {suite ? (
        <>
          {/* majlis floor seating */}
          <rect x="4" y="58" width="56" height="12" rx="2" fill={C.teal} />
          <rect x="4" y="52" width="56" height="8" rx="3" fill="#356064" />
          {[10, 24, 38, 52].map((x) => <rect key={x} x={x - 5} y="47" width="10" height="10" rx="3" fill={C.brass} />)}
          <path d="M8 64h48" stroke={C.brass} strokeWidth="1" strokeDasharray="2 2" />
          {/* dallah on tray */}
          <ellipse cx="74" cy="72" rx="9" ry="2.4" fill={C.brassDeep} />
          <path d="M71 70c-1-4 0-7 3-8v-2h2v2c3 1 4 4 3 8Z" fill={C.brass} />
          <path d="M79 64l5-3" stroke={C.brass} strokeWidth="1.6" strokeLinecap="round" />
          <Bed x={96} y={60} w={0} state={state} />
          <Lantern x={34} y={18} />
        </>
      ) : twin ? (
        <>
          <Bed x={8} y={60} w={34} state={state} />
          <Bed x={70} y={60} w={34} state={state} />
          <rect x="47" y="56" width="10" height="12" rx="1" fill={C.woodLight} />
          <Lantern x={52} y={18} />
        </>
      ) : (
        <>
          <Bed x={18} y={60} w={50} state={state} />
          <rect x="6" y="56" width="9" height="12" rx="1" fill={C.woodLight} />
          <Lantern x={10} y={42} />
        </>
      )}
      {state === "made" ? (
        <>
          <Sparkle x={suite ? 66 : twin ? 26 : 46} y={36} s={4} />
          <Sparkle x={suite ? 72 : twin ? 92 : 56} y={28} s={3} />
        </>
      ) : null}
    </svg>
  );
}

export function bedStateFor(hk: string): BedState {
  if (hk === "CLEAN" || hk === "INSPECTED") return "made";
  if (hk === "IN_PROGRESS" || hk === "PAUSED") return "progress";
  return "messy";
}

/* ───────────────────────── Staff avatars ───────────────────────── */

type Look = "bun" | "long" | "bob" | "short" | "moustache" | "curly" | "hijab" | "ghutra" | "hardhat";
const looks: Record<string, { look: Look; skin: number; tint: string }> = {
  ak: { look: "bun", skin: 1, tint: "#F3E2C7" },
  ms: { look: "long", skin: 2, tint: "#E5EEE6" },
  ya: { look: "ghutra", skin: 2, tint: "#E9E2F0" },
  ns: { look: "bob", skin: 1, tint: "#F6E0D6" },
  of: { look: "moustache", skin: 3, tint: "#E1ECEF" },
  ln: { look: "hijab", skin: 1, tint: "#F1E6CF" },
  hm: { look: "curly", skin: 4, tint: "#EDE3D3" },
  ks: { look: "short", skin: 2, tint: "#E4E9F1" },
  ma: { look: "hijab", skin: 2, tint: "#F3E6C9" },
  sh: { look: "ghutra", skin: 1, tint: "#E7ECE2" },
  rf: { look: "hijab", skin: 1, tint: "#EFE3D6" },
  te: { look: "ghutra", skin: 2, tint: "#E2EBEE" },
  dm: { look: "hijab", skin: 2, tint: "#F0E2E4" },
  fk: { look: "hardhat", skin: 2, tint: "#E6ECEE" },
  hf: { look: "hardhat", skin: 1, tint: "#EEE8DA" },
  km: { look: "ghutra", skin: 2, tint: "#E9E6DF" },
};
const skins = ["#F4D3B3", "#E6B88E", "#C99467", "#A06B45", "#7C5034"];
const uniform: Record<Staff["role"], string> = {
  ATTENDANT: C.teal,
  SUPERVISOR: C.wood,
  MANAGER: "#2E3A4F",
  FRONT_DESK: "#6B3F4C",
  ENGINEER: "#3E5468",
  ADMIN: "#4A4A4A",
};

/** Illustrated staff portrait. Always shown with the person's name next to it. */
export function StaffAvatar({ staff, className }: { staff: Pick<Staff, "id" | "role" | "initials">; className?: string }) {
  const l = looks[staff.id] ?? { look: "short" as Look, skin: 2, tint: C.juss };
  const skin = skins[l.skin] ?? skins[2];
  const hair = "#2A1D16";
  const cloth = uniform[staff.role];
  return (
    <svg className={cn("staff-avatar", className)} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill={l.tint} />
      <clipPath id={`clip-${staff.id}`}><circle cx="32" cy="32" r="32" /></clipPath>
      <g clipPath={`url(#clip-${staff.id})`}>
        {l.look === "long" ? <path d="M17 30c0-12 7-18 15-18s15 6 15 18v20H17Z" fill={hair} /> : null}
        {l.look === "hijab" ? <path d="M14 64V36c0-13 8-22 18-22s18 9 18 22v28Z" fill={staff.role === "SUPERVISOR" ? C.brassDeep : "#4E5B6E"} /> : null}
        {l.look === "ghutra" ? <path d="M15 58V31c0-12 8-19 17-19s17 7 17 19v27Z" fill="#FBFAF6" /> : null}
        {/* shoulders */}
        <path d="M8 64c2-11 11-17 24-17s22 6 24 17Z" fill={cloth} />
        {staff.role === "ATTENDANT" ? <path d="M26 48l6 7 6-7" fill="none" stroke={C.plaster} strokeWidth="2.2" /> : null}
        {staff.role === "SUPERVISOR" ? <circle cx="43" cy="55" r="2.6" fill={C.brass} /> : null}
        {staff.role === "ENGINEER" ? <path d="M18 54h28" stroke="#F2B544" strokeWidth="3" /> : null}
        <rect x="28" y="40" width="8" height="9" rx="3" fill={skin} />
        <ellipse cx="32" cy="31" rx="11" ry="12.5" fill={skin} />
        {/* hair / headwear */}
        {l.look === "bun" ? <><path d="M21 29c0-9 5-13 11-13s11 4 11 13c-3-5-7-7-11-7s-8 2-11 7Z" fill={hair} /><circle cx="32" cy="15" r="5" fill={hair} /></> : null}
        {l.look === "long" ? <path d="M21 30c0-9 5-14 11-14s11 5 11 14c-4-6-8-8-11-8s-7 2-11 8Z" fill={hair} /> : null}
        {l.look === "bob" ? <path d="M20 36c-1-13 4-19 12-19s13 6 12 19l-3-1c0-6-1-9-3-11-3 3-9 4-15 4 0 3 0 5-0 8Z" fill={hair} /> : null}
        {l.look === "short" || l.look === "moustache" ? <path d="M21 28c0-8 5-12 11-12s11 4 11 12c-2-3-6-5-11-5s-9 2-11 5Z" fill={hair} /> : null}
        {l.look === "moustache" ? <path d="M27 36.5c2-1.6 4-1.6 5 0 1-1.6 3-1.6 5 0" fill="none" stroke={hair} strokeWidth="1.8" strokeLinecap="round" /> : null}
        {l.look === "curly" ? <g fill={hair}>{[[23, 22], [28, 18], [34, 17], [40, 20], [43, 26], [21, 28]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="5" />)}</g> : null}
        {l.look === "hijab" ? <path d="M20 30c0-9 5-15 12-15s12 6 12 15c-2-4-6-7-12-7s-10 3-12 7Z" fill={staff.role === "SUPERVISOR" ? C.brassDeep : "#4E5B6E"} /> : null}
        {l.look === "ghutra" ? <><path d="M19 30c0-10 6-15 13-15s13 5 13 15c-3-3-8-5-13-5s-10 2-13 5Z" fill="#FBFAF6" /><path d="M20 22.5c4-2.5 8-3.5 12-3.5s8 1 12 3.5" fill="none" stroke={C.ink} strokeWidth="2.2" /><path d="M28 37c2 1 6 1 8 0" stroke={hair} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" /></> : null}
        {l.look === "hardhat" ? <><path d="M20 26c0-7 5-12 12-12s12 5 12 12Z" fill="#F2B544" /><rect x="18" y="25" width="28" height="3.5" rx="1.5" fill="#D99A25" /><path d="M32 14v12" stroke="#D99A25" strokeWidth="2" /></> : null}
        {/* face */}
        <circle cx="27.5" cy="31" r="1.4" fill={C.ink} />
        <circle cx="36.5" cy="31" r="1.4" fill={C.ink} />
        {l.look !== "moustache" ? <path d="M28.5 37c2 1.6 5 1.6 7 0" fill="none" stroke={C.ink} strokeWidth="1.3" strokeLinecap="round" /> : null}
      </g>
    </svg>
  );
}

/* ───────────────────────── Role pictures (mobile sign-in) ───────────────────────── */

export function RoleArt({ role, className }: { role: "ATTENDANT" | "SUPERVISOR" | "ENGINEER"; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 96" aria-hidden="true">
      <circle cx="48" cy="50" r="42" fill={role === "ATTENDANT" ? "#E3EEEC" : role === "SUPERVISOR" ? "#F3E7CF" : "#E3E9EF"} />
      {role === "ATTENDANT" ? (
        <g>
          {/* folded towels */}
          <rect x="18" y="58" width="40" height="11" rx="3" fill={C.teal} />
          <rect x="20" y="47" width="36" height="11" rx="3" fill={C.linen} stroke={C.juss} />
          <rect x="22" y="36" width="32" height="11" rx="3" fill={C.brass} />
          <path d="M22 41.5h32M20 52.5h36M18 63.5h40" stroke="#fff" strokeOpacity=".5" />
          {/* spray bottle */}
          <rect x="62" y="44" width="16" height="26" rx="4" fill="#5E8F94" />
          <rect x="65" y="36" width="10" height="9" rx="2" fill={C.ink} />
          <path d="M75 38h7l-2 4h-5Z" fill={C.ink} />
          <rect x="65" y="52" width="10" height="8" rx="1.5" fill={C.plaster} />
          <Sparkle x={30} y={26} s={5} />
          <Sparkle x={84} y={30} s={3.5} />
        </g>
      ) : role === "SUPERVISOR" ? (
        <g>
          <rect x="26" y="22" width="44" height="56" rx="5" fill={C.wood} />
          <rect x="30" y="28" width="36" height="46" rx="2" fill={C.linen} />
          <rect x="38" y="18" width="20" height="9" rx="3" fill={C.brassDeep} />
          {[38, 50, 62].map((y, i) => (
            <g key={y}>
              <rect x="34" y={y - 4} width="8" height="8" rx="2" fill={i < 2 ? "#3F7F55" : "#fff"} stroke={i < 2 ? "none" : C.mudLight} />
              {i < 2 ? <path d={`M35.5 ${y}l2 2 3.5-4`} stroke="#fff" strokeWidth="1.6" fill="none" /> : null}
              <rect x="46" y={y - 1.5} width="16" height="3" rx="1.5" fill={C.mudPale} />
            </g>
          ))}
          <circle cx="70" cy="72" r="11" fill={C.brass} />
          <path d="M65 72l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          {/* toolbox */}
          <path d="M38 40v-6a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v6" fill="none" stroke={C.ink} strokeWidth="3.5" />
          <rect x="18" y="40" width="60" height="34" rx="5" fill="#B5462F" />
          <rect x="18" y="52" width="60" height="5" fill="#8E3523" />
          <rect x="43" y="50" width="10" height="9" rx="2" fill={C.brass} />
          {/* wrench */}
          <g transform="rotate(-38 70 28)">
            <rect x="66" y="16" width="7" height="34" rx="3" fill="#8A97A3" />
            <path d="M62 14a8.5 8.5 0 1 0 15 0l-3 4h-9Z" fill="#8A97A3" />
          </g>
          <circle cx="24" cy="26" r="7" fill="#F2B544" />
          <path d="M20 26a4 4 0 0 1 8 0Z" fill="#D99A25" />
        </g>
      )}
    </svg>
  );
}

/* ───────────────────────── Empty-state pictures ───────────────────────── */

export function EmptyArt({ kind, className }: { kind: "done" | "rest" | "tools" | "search"; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 110" aria-hidden="true">
      <ellipse cx="70" cy="98" rx="52" ry="6" fill={C.juss} />
      {kind === "done" ? (
        <g>
          <path d={arch(70, 96, 54, 96)} fill={C.plaster} stroke={C.mudPale} strokeWidth="2" />
          <Bed x={36} y={80} w={68} state="made" />
          <Sparkle x={34} y={30} s={6} />
          <Sparkle x={106} y={38} s={4.5} />
          <Sparkle x={92} y={18} s={3.5} />
        </g>
      ) : kind === "rest" ? (
        <g>
          {/* dallah + finjan: all caught up, time for coffee */}
          <path d="M46 92c-6-14-4-28 8-34v-8h12v8c12 6 14 20 8 34Z" fill={C.brass} />
          <path d="M54 50h12l-2-8h-8Z" fill={C.brassDeep} />
          <circle cx="60" cy="38" r="4" fill={C.brassDeep} />
          <path d="M74 66c8-2 14-8 18-16" stroke={C.brass} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M46 70c-8 0-10 10-4 14" stroke={C.brassDeep} strokeWidth="3.5" fill="none" />
          <path d="M50 76h20" stroke={C.brassDeep} strokeWidth="2" />
          <path d="M96 84h16l-3 10h-10Z" fill={C.linen} stroke={C.mudPale} />
          <path d="M101 78c-2-4 2-6 0-10M107 78c-2-4 2-6 0-10" stroke={C.mudLight} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      ) : kind === "tools" ? (
        <g>
          <path d="M58 46v-6a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v6" fill="none" stroke={C.ink} strokeWidth="3.5" />
          <rect x="34" y="46" width="72" height="44" rx="6" fill="#B5462F" />
          <rect x="34" y="62" width="72" height="6" fill="#8E3523" />
          <circle cx="104" cy="40" r="14" fill="#3F7F55" />
          <path d="M97 40l5 5 9-10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <circle cx="62" cy="54" r="24" fill={C.plaster} stroke={C.brass} strokeWidth="6" />
          <path d="M80 72l18 18" stroke={C.brass} strokeWidth="9" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

/* ───────────────────────── Pictograms ───────────────────────── */

/** Zone tints for checklist pictogram tiles. */
export const zoneTone: Record<Zone, string> = {
  VENTILATION_WASTE: "zone-air",
  LINEN_STRIP: "zone-linen",
  DUSTING: "zone-dust",
  BATHROOM: "zone-bath",
  LINEN_RESTOCK: "zone-bed",
  FLOOR: "zone-floor",
  FINAL_AUDIT: "zone-final",
};

const pictoRules: [RegExp, LucideIcon][] = [
  [/heritage/i, ScanSearch],
  [/window|ventilat/i, Wind],
  [/bin/i, Trash2],
  [/tray/i, UtensilsCrossed],
  [/mattress/i, BedSingle],
  [/drawer|safe/i, Archive],
  [/towel|strip/i, Shirt],
  [/disinfect remote|switch|handle|high-touch/i, SprayCan],
  [/dust|wipe/i, Brush],
  [/toilet/i, Toilet],
  [/sink|vanity/i, Droplets],
  [/shower|tub/i, ShowerHead],
  [/mirror|chrome/i, Sparkles],
  [/make bed|bed/i, BedDouble],
  [/toiletr/i, Bath],
  [/coffee|water/i, Coffee],
  [/vacuum/i, Footprints],
  [/mop|floor/i, Waves],
  [/bulb|light/i, Lightbulb],
  [/hvac|ac\b|eco/i, AirVent],
  [/drape|curtain|furniture/i, Blinds],
  [/fragrance/i, Flower2],
  [/belonging/i, Luggage],
  [/lock|door/i, Lock],
];

export function pictoFor(item: Pick<ChecklistItem, "label">): LucideIcon {
  return pictoRules.find(([re]) => re.test(item.label))?.[1] ?? Sparkles;
}

export const categoryIcon: Record<WorkOrder["category"], LucideIcon> = {
  "Heritage surface": BrickWall,
  Plumbing: Droplets,
  HVAC: AirVent,
  Electrical: Plug,
  Carpentry: Hammer,
  Furniture: Armchair,
  Pest: Bug,
  Other: Wrench,
};

export const taskIcon: Record<TaskType, LucideIcon> = {
  DEPARTURE: Luggage,
  STAYOVER: BedDouble,
  RECLEAN: RotateCcw,
  POST_REPAIR: Wrench,
};

export const pauseIcon: Record<string, LucideIcon> = {
  Break: Coffee,
  "Called to assist": Users,
  "Missing supplies": Package,
  "Guest in room": Hand,
};

export const skipIcon: Record<string, LucideIcon> = {
  "Not applicable": CircleSlash,
  "Out of stock": Package,
  "Guest belongings": Luggage,
  Other: Ellipsis,
};

/** A pictogram in a soft tinted tile. */
export function Picto({ icon: Icon, tone, className }: { icon: LucideIcon; tone?: string; className?: string }) {
  return (
    <span className={cn("picto", tone, className)} aria-hidden="true">
      <Icon />
    </span>
  );
}
