import { cn } from "@/lib/utils";

/**
 * Decorative oriental rosette for the desktop sidebar.
 *
 * Pure geometry — an 12/8-fold girih-style mandala drawn from polar coordinates,
 * never a photograph or a brand mark. Two layers turn in opposite directions at
 * very different speeds so the pattern never looks like a looping GIF.
 *
 * Presentation only: aria-hidden, pointer-events none, painted behind the nav.
 */

const C = 200;

/** Point on a circle of radius `r`, measured clockwise from 12 o'clock. */
const xy = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
};

/** Star polygon {points/step}, e.g. {12/5} walks every 5th vertex of a 12-gon. */
const star = (points: number, r: number, step: number) =>
  Array.from({ length: points }, (_, i) =>
    xy(r, ((i * step) % points) * (360 / points))
      .map((n) => n.toFixed(2))
      .join(","),
  ).join(" ");

const PETAL = "M200 26 C234 76 234 128 200 172 C166 128 166 76 200 26 Z";
const INNER_PETAL = "M200 92 C217 118 217 146 200 170 C183 146 183 118 200 92 Z";

export function SidebarMandala({ className }: { className?: string }) {
  return (
    <svg
      className={cn("sidebar-mandala", className)}
      viewBox="0 0 400 400"
      aria-hidden="true"
      focusable="false"
    >
      {/* outer ornament — turns clockwise, ~4 minutes a revolution */}
      <g className="mandala-spin mandala-outer" fill="none" stroke="currentColor" strokeWidth={1}>
        <circle cx={C} cy={C} r={193} />
        <circle cx={C} cy={C} r={181} strokeDasharray="1 7" strokeLinecap="round" />
        {Array.from({ length: 12 }, (_, i) => (
          <path key={`petal-${i}`} d={PETAL} transform={`rotate(${i * 30} ${C} ${C})`} />
        ))}
        {Array.from({ length: 24 }, (_, i) => {
          const [x, y] = xy(187, i * 15);
          return <circle key={`dot-${i}`} cx={x} cy={y} r={i % 2 ? 1.5 : 3} />;
        })}
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={`diamond-${i}`}
            d="M200 6 L208 18 L200 30 L192 18 Z"
            transform={`rotate(${i * 30 + 15} ${C} ${C})`}
          />
        ))}
        {/* the {12/5} girih star rides the outer ring: at sidebar size only its
            upper and lower points reach the visible band, so it decorates without
            laying a lattice of long diagonals behind the nav labels */}
        <polygon points={star(12, 152, 5)} />
      </g>

      {/* inner girih star — turns the other way, even slower */}
      <g
        className="mandala-spin mandala-inner"
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinejoin="round"
      >
        <polygon points={star(8, 116, 3)} />
        <circle cx={C} cy={C} r={104} />
        <circle cx={C} cy={C} r={76} strokeDasharray="3 6" strokeLinecap="round" />
        {Array.from({ length: 8 }, (_, i) => (
          <path key={`inner-${i}`} d={INNER_PETAL} transform={`rotate(${i * 45} ${C} ${C})`} />
        ))}
        <circle cx={C} cy={C} r={26} />
        <polygon points={star(6, 15, 5)} />
      </g>
    </svg>
  );
}
