import { AlertTriangle, CheckCircle2, Clock, Crown, Timer } from "lucide-react";
import { fmtTime } from "@/lib/demo-data";
import { demoNow, type HmsState } from "@/lib/hms-store";
import { cn } from "@/lib/utils";
import { type ArrivalRisk, arrivalRisk, riskLabel } from "./readiness";

const riskIcon: Record<ArrivalRisk, typeof Clock> = {
  ready: CheckCircle2,
  ontrack: Clock,
  tight: Timer,
  late: AlertTriangle,
};

/**
 * Today's arrivals on one time axis: the bar runs from now to the room's estimated ready time,
 * the pin marks when the guest arrives. A bar that crosses its pin is a room that will be late.
 */
export function ArrivalsTimeline({ s, onOpen }: { s: HmsState; onOpen: (room: string) => void }) {
  const now = demoNow(s);
  const rows = s.rooms
    .map((room) => ({ room, r: arrivalRisk(s, room) }))
    .filter((x): x is { room: typeof x.room; r: NonNullable<typeof x.r> } => x.r !== null)
    .sort((a, b) => a.r.eta - b.r.eta || a.room.number.localeCompare(b.room.number));
  if (!rows.length) return null;

  const start = Math.floor(now / 60) * 60 - 20;
  const lastPoint = Math.max(...rows.map((x) => Math.max(x.r.eta, x.r.readyAt ?? 0)), now + 300);
  const end = Math.ceil(lastPoint / 60) * 60 + 30;
  const pct = (m: number) =>
    `${((Math.min(Math.max(m, start), end) - start) / (end - start)) * 100}%`;
  const hours: number[] = [];
  for (let h = start + 20; h <= end; h += 60) hours.push(h);
  const counts = rows.reduce<Record<ArrivalRisk, number>>(
    (acc, x) => ({ ...acc, [x.r.risk]: acc[x.r.risk] + 1 }),
    { ready: 0, ontrack: 0, tight: 0, late: 0 },
  );

  return (
    <section className="content-panel arrivals-panel" aria-labelledby="arrivals-title">
      <div className="section-heading">
        <div>
          <h2 id="arrivals-title">Arrivals timeline</h2>
          <p>
            {rows.length} arrivals · {counts.ready} ready ·{" "}
            {counts.late ? (
              <strong className="arr-late-text">{counts.late} at risk</strong>
            ) : (
              "none at risk"
            )}
            {counts.tight ? ` · ${counts.tight} tight` : ""}. Ready times are internal estimates
            from standard clean times.
          </p>
        </div>
        <p className="arr-key" aria-hidden="true">
          <i className="arr-key-bar" /> until ready <i className="arr-key-pin" /> guest arrives
        </p>
      </div>

      <div className="arr-grid" aria-label="Arrivals and estimated room readiness" role="group">
        <div className="arr-row arr-axis" aria-hidden="true">
          <span>Guest · room</span>
          <div className="arr-track">
            {hours.map((h) => (
              <span key={h} className="arr-hour" style={{ insetInlineStart: pct(h) }}>
                {fmtTime(h)}
              </span>
            ))}
          </div>
          <span>Status</span>
        </div>
        {rows.map(({ room, r }) => {
          const Icon = riskIcon[r.risk];
          const inLobby = room.arrival?.eta && !/^\d/.test(room.arrival.eta);
          const label = `${room.arrival?.guest}, room ${room.number}, arrives ${inLobby ? "now, waiting in lobby" : fmtTime(r.eta)}, ${riskLabel[r.risk]}${r.readyAt !== null && r.risk !== "ready" ? `, estimated ready ${fmtTime(r.readyAt)}` : ""}`;
          return (
            <button
              type="button"
              key={room.number}
              className={cn("arr-row", `arr-${r.risk}`)}
              onClick={() => onOpen(room.number)}
              aria-label={label}
            >
              <span className="arr-who">
                <strong>{room.arrival?.guest}</strong>
                <small>
                  Room <bdi>{room.number}</bdi> · {inLobby ? "in lobby" : fmtTime(r.eta)}
                  {room.vip ? (
                    <>
                      {" "}
                      · <Crown aria-hidden="true" /> VIP
                    </>
                  ) : null}
                </small>
              </span>
              <span className="arr-track" aria-hidden="true">
                {hours.map((h) => (
                  <i key={h} className="arr-gridline" style={{ insetInlineStart: pct(h) }} />
                ))}
                <i className="arr-now" style={{ insetInlineStart: pct(now) }} />
                {r.risk !== "ready" ? (
                  <i
                    className="arr-bar"
                    style={{
                      insetInlineStart: pct(now),
                      inlineSize: `calc(${pct(r.readyAt ?? end)} - ${pct(now)})`,
                    }}
                  />
                ) : null}
                <i className="arr-pin" style={{ insetInlineStart: pct(r.eta) }} />
              </span>
              <span className="arr-status">
                <Icon aria-hidden="true" /> {riskLabel[r.risk]}
                {r.risk !== "ready" ? (
                  <small>
                    {r.readyAt === null ? "no estimate" : `ready ~${fmtTime(r.readyAt)}`}
                  </small>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
