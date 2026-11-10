import { useMemo, useRef, useState } from "react";
import { Download, Eye, FileSpreadsheet, ImageDown, Printer, Table2 } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { wingLabel, fmtTime, inspectionPoints, property, type Room, type RoomStatus, statusMeta } from "@/lib/demo-data";
import { activeMinutes, demoNow, displayStatus, type HmsState, stdMinutes, useHms } from "@/lib/hms-store";
import { cn } from "@/lib/utils";
import { buildReport, downloadCsv, type ReportKey, ReportPreviewDialog } from "./desktop-dialogs";
import { EmptyState } from "./demo-states";

/* Chart colors are hex (not CSS vars) so PNG export renders them. */
const C = {
  data: "#3f6b4f", // single data hue
  dataSoft: "#3f6b4f1a",
  gray: "#d6cbb8", // de-emphasis
  ink: "#2b1f17",
  muted: "#7a6a5a",
  grid: "#efe8dc",
  target: "#7a5a2f", // brass-700, reference lines
};
const STATUS_HEX: Record<string, string> = {
  Ready: "#3f7f55",
  Inspect: "#3e6a8a",
  Cleaning: "#d08a3a",
  Dirty: "#b5452a",
  Occupied: "#a99a86",
  DND: "#6d3f7a",
  Blocked: "#4a3f37",
};
const AXIS = { fontSize: 12, fill: C.muted };

/* ───────────── Data derivation ───────────── */

type Period = 7 | 14 | 30;

function frac(x: number) {
  return x - Math.floor(x);
}

/** Deterministic demo history: each previous day as it stood at the same time of day, so comparisons with today are like-for-like. */
function history(days: Period, floor: string, today: { cleaned: number; avgMin: number; pass: number; ready: number }) {
  const share = floor === "all" ? 1 : 0.2;
  const salt = floor === "all" ? 0 : Number(floor) * 13;
  const base = Date.UTC(2026, 8, 23);
  const out: { day: string; cleaned: number; avgMin: number; pass: number; ready: number }[] = [];
  for (let i = days - 1; i >= 1; i--) {
    const r1 = frac(Math.sin(i * 12.9898 + salt) * 43758.5453);
    const r2 = frac(Math.sin(i * 78.233 + salt) * 12345.6789);
    const r3 = frac(Math.sin(i * 39.425 + salt) * 24634.6345);
    const weekend = [5, 6].includes(new Date(base - i * 86400000).getUTCDay()) ? 1.12 : 1;
    out.push({
      day: new Date(base - i * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
      cleaned: Math.round((44 + r1 * 12) * weekend * share),
      avgMin: Math.round((26 + r2 * 7) * 10) / 10,
      pass: Math.round((87 + r3 * 10) * 10) / 10,
      ready: Math.round((29 + r1 * 10) * share),
    });
  }
  out.push({ day: "Today", ...today });
  return out;
}

function derive(s: HmsState, floor: string, period: Period) {
  const rooms = floor === "all" ? s.rooms : s.rooms.filter((r) => String(r.floor) === floor);
  const numbers = new Set(rooms.map((r) => r.number));
  const now = demoNow(s);
  const statusOf = (r: Room) => displayStatus(r, s.settings);

  const groups: [string, RoomStatus[]][] = [
    ["Ready", ["READY"]],
    ["Inspect", ["AWAITING_INSPECTION"]],
    ["Cleaning", ["CLEANING"]],
    ["Dirty", ["DIRTY"]],
    ["Occupied", ["OCCUPIED"]],
    ["DND", ["DND"]],
    ["Blocked", ["BLOCKED_OOO", "BLOCKED_OOS"]],
  ];
  const statusRows = groups.map(([label, sts]) => {
    const count = rooms.filter((r) => sts.includes(statusOf(r))).length;
    return { label, count, pct: rooms.length ? Math.round((count / rooms.length) * 100) : 0, icon: statusMeta[sts[0] as RoomStatus].icon };
  });

  const completed = rooms.filter((r) => r.completedAt !== undefined && r.startedAt !== undefined);
  const firstHour = 7;
  const cleanHours = s.events.filter((e) => e.type === "CLEAN_COMPLETED").map((e) => Math.floor(e.at / 60));
  // Stop at the latest hour with activity (plus one) so an idle demo clock doesn't pad the chart with empty hours.
  const lastHour = Math.max(firstHour, Math.min(Math.floor(now / 60), Math.max(firstHour, ...cleanHours) + 1));
  const hourly = Array.from({ length: lastHour - firstHour + 1 }, (_, i) => {
    const h = firstHour + i;
    const count = s.events.filter((e) => e.type === "CLEAN_COMPLETED" && e.room && numbers.has(e.room) && Math.floor(e.at / 60) === h).length;
    return { hour: `${String(h).padStart(2, "0")}:00`, count };
  });

  const attendants = s.staff
    .filter((p) => p.role === "ATTENDANT")
    .map((p) => {
      const mine = completed.filter((r) => r.attendant === p.id);
      const avg = mine.length ? mine.reduce((a, r) => a + (activeMinutes(s, r) ?? 0), 0) / mine.length : 0;
      const std = mine.length ? mine.reduce((a, r) => a + stdMinutes(r), 0) / mine.length : 30;
      return { name: p.name.split(" ")[0] as string, full: p.name, rooms: mine.length, avg: Math.round(avg * 10) / 10, std: Math.round(std) };
    })
    .filter((a) => a.rooms > 0)
    .sort((a, b) => b.avg - a.avg);
  const stdAvg = attendants.length ? Math.round(attendants.reduce((a, x) => a + x.std, 0) / attendants.length) : 30;

  const inspections = rooms.flatMap((r) => r.inspections);
  const passToday = inspections.length ? Math.round((inspections.filter((i) => i.result === "PASSED").length / inspections.length) * 1000) / 10 : 0;

  const itemStats = new Map<string, { label: string; skipped: number; applicable: number }>();
  for (const r of completed) {
    const tpl = s.templates[r.taskType === "STAYOVER" ? "stayover" : "departure"];
    for (const it of tpl) {
      const cur = itemStats.get(it.id) ?? { label: it.label, skipped: 0, applicable: 0 };
      cur.applicable += 1;
      if (r.items[it.id]?.status === "SKIPPED") cur.skipped += 1;
      itemStats.set(it.id, cur);
    }
  }
  const skipped = Array.from(itemStats.values())
    .filter((x) => x.skipped > 0)
    .map((x) => ({ label: x.label, skipped: x.skipped, pct: Math.round((x.skipped / x.applicable) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 6);
  const totalItems = completed.reduce((a, r) => a + Object.keys(r.items).length, 0);
  const doneItems = completed.reduce((a, r) => a + Object.values(r.items).filter((x) => x.status === "DONE").length, 0);
  const compliance = totalItems ? Math.round((doneItems / totalItems) * 1000) / 10 : 0;

  const failCounts = new Map<string, number>();
  for (const ins of inspections.filter((i) => i.result === "FAILED")) for (const f of ins.failed) failCounts.set(f, (failCounts.get(f) ?? 0) + 1);
  const failedPoints = Array.from(failCounts.entries())
    .map(([id, count]) => ({ label: inspectionPoints.find((p) => p.id === id)?.label ?? id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const avgToday = completed.length ? Math.round((completed.reduce((a, r) => a + (activeMinutes(s, r) ?? 0), 0) / completed.length) * 10) / 10 : 0;
  const readyNow = statusRows[0]?.count ?? 0;
  const trend = history(period, floor, { cleaned: completed.length, avgMin: avgToday, pass: passToday, ready: readyNow });
  const signals = rooms.filter((r) => r.anomalies.length).length;

  return { rooms, statusRows, hourly, attendants, stdAvg, passToday, skipped, compliance, failedPoints, avgToday, readyNow, trend, signals, completed, inspections, now };
}

/* ───────────── Export helpers ───────────── */

async function downloadPng(card: HTMLElement | null, title: string) {
  const svg = card?.querySelector("svg.recharts-surface") as SVGSVGElement | null;
  if (!svg) {
    toast.error("Nothing to export yet", { duration: 2500 });
    return;
  }
  const rect = svg.getBoundingClientRect();
  const width = Number(svg.getAttribute("width")) || rect.width;
  const height = Number(svg.getAttribute("height")) || rect.height;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("font-family", "Inter, -apple-system, Segoe UI, sans-serif");
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  await img.decode();
  const scale = 2;
  const pad = 24;
  const head = 44;
  const canvas = document.createElement("canvas");
  canvas.width = (width + pad * 2) * scale;
  canvas.height = (height + pad * 2 + head) * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width + pad * 2, height + pad * 2 + head);
  ctx.fillStyle = C.ink;
  ctx.font = "600 16px Inter, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(title, pad, pad + 14);
  ctx.fillStyle = C.muted;
  ctx.font = "12px Inter, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`Riwaq · ${property.name}`, pad, pad + 32);
  ctx.drawImage(img, pad, pad + head, width, height);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${title} saved as PNG`, { duration: 2500 });
  }, "image/png");
}

/* ───────────── Building blocks ───────────── */

type TableData = { columns: string[]; rows: (string | number)[][] };

function ChartCard({ title, insight, table, className, children, empty }: { title: string; insight: string; table: TableData; className?: string; children: React.ReactNode; empty?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [showTable, setShowTable] = useState(false);
  return (
    <section className={cn("chart-card", className)} ref={ref} aria-label={title}>
      <header className="chart-card-head">
        <div>
          <h2>{title}</h2>
          <p>{insight}</p>
        </div>
        <div className="chart-actions">
          <button type="button" className={cn("chart-icon-btn", showTable && "on")} onClick={() => setShowTable((v) => !v)} aria-pressed={showTable} title="Table view">
            <Table2 aria-hidden="true" />
            <span className="sr-only">Table view</span>
          </button>
          <button type="button" className="chart-icon-btn" onClick={() => void downloadPng(ref.current, title)} title="Download PNG" disabled={empty || showTable}>
            <ImageDown aria-hidden="true" />
            <span className="sr-only">Download PNG</span>
          </button>
          <button type="button" className="chart-icon-btn" onClick={() => downloadCsv({ title, ...table })} title="Download CSV">
            <FileSpreadsheet aria-hidden="true" />
            <span className="sr-only">Download CSV</span>
          </button>
        </div>
      </header>
      {showTable ? (
        <div className="chart-table-wrap">
          <table className="report-table">
            <thead>
              <tr>{table.columns.map((c) => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : empty ? (
        <EmptyState title="No data for this selection yet" />
      ) : (
        <div className="chart-body">{children}</div>
      )}
    </section>
  );
}

function ChartTip({ active, payload, label, unit = "", name }: { active?: boolean; payload?: { value: number; payload: Record<string, unknown> }[]; label?: string; unit?: string; name: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="chart-tip">
      <strong>
        {p?.value}
        {unit}
      </strong>
      <span>
        {name} · {String(p?.payload?.["full"] ?? p?.payload?.["label"] ?? label ?? "")}
      </span>
    </div>
  );
}

function Spark({ data, k }: { data: Record<string, number | string>[]; k: string }) {
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <Line type="monotone" dataKey={k} stroke={C.gray} strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line
          type="monotone"
          dataKey={k}
          stroke="transparent"
          isAnimationActive={false}
          dot={(props: { cx?: number; cy?: number; index?: number }) =>
            props.index === data.length - 1 ? <circle key="last" cx={props.cx} cy={props.cy} r={4} fill={C.data} stroke="#fff" strokeWidth={2} /> : <g key={props.index} />
          }
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function StatTile({ label, value, delta, goodWhenUp, trend, k }: { label: string; value: string; delta?: number | undefined; goodWhenUp: boolean; trend: Record<string, number | string>[]; k: string }) {
  const good = delta === undefined || delta === 0 ? null : (delta > 0) === goodWhenUp;
  return (
    <article className="stat-tile">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {delta !== undefined ? (
        <span className={cn("stat-delta", good === true && "good", good === false && "bad")}>
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "•"} {Math.abs(delta)}
          {k === "pass" ? " pts" : k === "avgMin" ? " min" : ""} vs same time yesterday
        </span>
      ) : null}
      <Spark data={trend} k={k} />
    </article>
  );
}

/* ───────────── Page ───────────── */

export function ReportsContent() {
  const s = useHms();
  const [period, setPeriod] = useState<Period>(14);
  const [floor, setFloor] = useState("all");
  const [preview, setPreview] = useState<ReportKey | null>(null);
  const d = useMemo(() => derive(s, floor, period), [s, floor, period]);
  const y = d.trend[d.trend.length - 2];
  const delta = (k: "cleaned" | "avgMin" | "pass" | "ready", cur: number) => (y ? Math.round((cur - (y[k] as number)) * 10) / 10 : undefined);
  const scope = floor === "all" ? "all floors" : `floor ${floor}`;
  const slowest = d.attendants[0];
  const fastest = d.attendants[d.attendants.length - 1];
  const peak = d.hourly.reduce((m, h) => (h.count > m.count ? h : m), d.hourly[0] ?? { hour: "—", count: 0 });
  const bestDay = d.trend.reduce((m, t) => (t.pass > m.pass ? t : m), d.trend[0] ?? { day: "—", pass: 0 });

  return (
    <div className="reports-v2">
      <div className="report-filters" role="group" aria-label="Report filters">
        <div className="segmented segmented-inline" role="radiogroup" aria-label="Period">
          {([7, 14, 30] as Period[]).map((p) => (
            <button type="button" role="radio" aria-checked={period === p} key={p} className={cn(period === p && "segmented-on")} onClick={() => setPeriod(p)}>
              {p} days
            </button>
          ))}
        </div>
        <label className="report-select">
          <span>Wing</span>
          <select value={floor} onChange={(e) => setFloor(e.target.value)}>
            <option value="all">All wings</option>
            {[1, 2, 3, 4, 5].map((f) => <option key={f} value={f}>{wingLabel(f)}</option>)}
          </select>
        </label>
        <span className="report-note">Today is live · earlier days compared at the same time of day ({fmtTime(d.now)})</span>
        <Button variant="hmsGhost" size="hmsMd" className="ms-auto" onClick={() => window.print()}>
          <Printer aria-hidden="true" /> Print / PDF
        </Button>
      </div>

      <section className="stat-row" aria-label="Key figures">
        <StatTile label="Ready for check-in" value={`${d.readyNow}`} delta={delta("ready", d.readyNow)} goodWhenUp trend={d.trend} k="ready" />
        <StatTile label="Rooms cleaned today" value={`${d.completed.length}`} delta={delta("cleaned", d.completed.length)} goodWhenUp trend={d.trend} k="cleaned" />
        <StatTile label="Avg. clean time" value={`${d.avgToday} min`} delta={delta("avgMin", d.avgToday)} goodWhenUp={false} trend={d.trend} k="avgMin" />
        <StatTile label="First-time pass rate" value={`${d.passToday}%`} delta={delta("pass", d.passToday)} goodWhenUp trend={d.trend} k="pass" />
        <article className="stat-tile stat-tile-plain">
          <span className="stat-label">Checklist items done</span>
          <strong className="stat-value">{d.compliance}%</strong>
          <span className="stat-delta">{d.signals} accountability signal{d.signals === 1 ? "" : "s"} on {scope}</span>
          <div className="meter" role="img" aria-label={`${d.compliance}% of checklist items done`}>
            <i style={{ inlineSize: `${d.compliance}%` }} />
          </div>
        </article>
      </section>

      <div className="report-grid">
        <ChartCard
          className="span-5"
          title="Room status now"
          insight={`${d.statusRows[0]?.count ?? 0} of ${d.rooms.length} rooms on ${scope} are ready · ${d.statusRows[3]?.count ?? 0} still dirty`}
          table={{ columns: ["Status", "Rooms", "Share"], rows: d.statusRows.map((r) => [r.label, r.count, `${r.pct}%`]) }}
        >
          <ul className="status-bars">
            {d.statusRows.map((r) => {
              const Icon = r.icon;
              const max = Math.max(...d.statusRows.map((x) => x.count), 1);
              return (
                <li key={r.label}>
                  <span className="sb-label"><Icon aria-hidden="true" style={{ color: STATUS_HEX[r.label] }} />{r.label}</span>
                  <span className="sb-track"><i style={{ inlineSize: `${(r.count / max) * 100}%`, background: STATUS_HEX[r.label] }} /></span>
                  <span className="sb-value">{r.count}<small>{r.pct}%</small></span>
                </li>
              );
            })}
          </ul>
          {/* Hidden recharts twin so the PNG export has an SVG to render */}
          <div className="sr-only" aria-hidden="true">
            <BarChart width={420} height={240} data={d.statusRows} layout="vertical" margin={{ left: 20, right: 40 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="label" tick={AXIS} axisLine={false} tickLine={false} width={80} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false}>
                {d.statusRows.map((r) => <Cell key={r.label} fill={STATUS_HEX[r.label]} />)}
                <LabelList dataKey="count" position="right" fill={C.ink} fontSize={12} />
              </Bar>
            </BarChart>
          </div>
        </ChartCard>

        <ChartCard
          className="span-7"
          title="Rooms cleaned per hour"
          insight={peak && peak.count ? `Peak at ${peak.hour} with ${peak.count} rooms marked clean` : "No rooms marked clean yet today"}
          table={{ columns: ["Hour", "Rooms cleaned"], rows: d.hourly.map((h) => [h.hour, h.count]) }}
          empty={!d.hourly.some((h) => h.count)}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={d.hourly} margin={{ top: 20, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid vertical={false} stroke={C.grid} />
              <XAxis dataKey="hour" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: C.dataSoft }} content={<ChartTip name="Rooms cleaned" />} />
              <Bar isAnimationActive={false} dataKey="count" fill={C.data} radius={[4, 4, 0, 0]} maxBarSize={24}>
                {d.hourly.map((h) => <Cell key={h.hour} fill={h.hour === peak?.hour ? C.data : "#7fb0ea"} />)}
                <LabelList dataKey="count" position="top" fill={C.ink} fontSize={11} formatter={(v: number) => (v ? v : "")} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          className="span-6"
          title="Average clean time by attendant"
          insight={slowest && fastest ? `${fastest.name} is fastest (${fastest.avg} min) · ${slowest.name} slowest (${slowest.avg} min) · standard ≈ ${d.stdAvg} min` : "No completed rooms yet"}
          table={{ columns: ["Attendant", "Rooms done", "Avg min", "Standard min"], rows: d.attendants.map((a) => [a.full, a.rooms, a.avg, a.std]) }}
          empty={!d.attendants.length}
        >
          <ResponsiveContainer width="100%" height={Math.max(200, d.attendants.length * 34 + 30)}>
            <BarChart data={d.attendants} layout="vertical" margin={{ top: 8, right: 44, bottom: 0, left: 4 }}>
              <CartesianGrid horizontal={false} stroke={C.grid} />
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} unit="m" />
              <YAxis type="category" dataKey="name" tick={{ ...AXIS, fill: C.ink }} axisLine={false} tickLine={false} width={64} />
              <Tooltip cursor={{ fill: C.dataSoft }} content={<ChartTip name="Avg clean time" unit=" min" />} />
              <ReferenceLine x={d.stdAvg} stroke={C.target} strokeWidth={1.5} label={{ value: `Std ${d.stdAvg}m`, position: "top", fill: C.target, fontSize: 11 }} />
              <Bar isAnimationActive={false} dataKey="avg" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {d.attendants.map((a) => <Cell key={a.name} fill={a.avg < a.std * 0.6 ? "#f08228" : C.data} />)}
                <LabelList dataKey="avg" position="right" fill={C.ink} fontSize={11} formatter={(v: number) => `${v}m`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="chart-foot"><i style={{ background: "#f08228" }} /> Orange = far below standard (possible rushed work)</p>
        </ChartCard>

        <ChartCard
          className="span-6"
          title="First-time inspection pass rate"
          insight={`Today ${d.passToday}% · target ${s.settings.passScore}% · best day ${bestDay?.day} at ${bestDay?.pass}%`}
          table={{ columns: ["Day", "Pass rate %"], rows: d.trend.map((t) => [t.day, t.pass]) }}
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={d.trend} margin={{ top: 16, right: 16, bottom: 0, left: -12 }}>
              <CartesianGrid vertical={false} stroke={C.grid} />
              <XAxis dataKey="day" tick={AXIS} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis domain={[80, 100]} ticks={[80, 85, 90, 95, 100]} tick={AXIS} axisLine={false} tickLine={false} unit="%" />
              <Tooltip cursor={{ stroke: C.muted, strokeWidth: 1 }} content={<ChartTip name="Pass rate" unit="%" />} />
              <ReferenceLine y={s.settings.passScore} stroke={C.target} strokeWidth={1.5} label={{ value: `Target ${s.settings.passScore}%`, position: "insideBottomRight", fill: C.target, fontSize: 11 }} />
              <Line isAnimationActive={false} type="monotone" dataKey="pass" stroke={C.data} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          className="span-6"
          title={`Rooms cleaned by ${fmtTime(d.now)} · last ${period} days`}
          insight={`Today ${d.completed.length} so far · ${period}-day average ${Math.round(d.trend.slice(0, -1).reduce((a, t) => a + t.cleaned, 0) / Math.max(1, d.trend.length - 1))}`}
          table={{ columns: ["Day", "Rooms cleaned", "Avg clean min"], rows: d.trend.map((t) => [t.day, t.cleaned, t.avgMin]) }}
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={d.trend} margin={{ top: 12, right: 16, bottom: 0, left: -12 }}>
              <CartesianGrid vertical={false} stroke={C.grid} />
              <XAxis dataKey="day" tick={AXIS} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ stroke: C.muted, strokeWidth: 1 }} content={<ChartTip name="Rooms cleaned" />} />
              <Area isAnimationActive={false} type="monotone" dataKey="cleaned" stroke={C.data} strokeWidth={2} fill={C.data} fillOpacity={0.1} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          className="span-6"
          title="Most skipped checklist items"
          insight={d.skipped[0] ? `"${d.skipped[0].label}" skipped in ${d.skipped[0].pct}% of cleaned rooms` : "No items skipped today"}
          table={{ columns: ["Item", "Times skipped", "% of rooms"], rows: d.skipped.map((x) => [x.label, x.skipped, `${x.pct}%`]) }}
          empty={!d.skipped.length}
        >
          <ResponsiveContainer width="100%" height={Math.max(160, d.skipped.length * 36 + 20)}>
            <BarChart data={d.skipped} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 4 }}>
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis type="category" dataKey="label" tick={{ ...AXIS, fill: C.ink }} axisLine={false} tickLine={false} width={190} />
              <Tooltip cursor={{ fill: C.dataSoft }} content={<ChartTip name="Skipped" unit="%" />} />
              <Bar isAnimationActive={false} dataKey="pct" fill={C.data} radius={[0, 4, 4, 0]} maxBarSize={18}>
                <LabelList dataKey="pct" position="right" fill={C.ink} fontSize={11} formatter={(v: number) => `${v}%`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          className="span-6"
          title="Top failed inspection points"
          insight={d.failedPoints[0] ? `"${d.failedPoints[0].label}" failed most often — ${d.failedPoints[0].count}×` : "No failed inspections today"}
          table={{ columns: ["Inspection point", "Failures"], rows: d.failedPoints.map((x) => [x.label, x.count]) }}
          empty={!d.failedPoints.length}
        >
          <ResponsiveContainer width="100%" height={Math.max(160, d.failedPoints.length * 36 + 20)}>
            <BarChart data={d.failedPoints} layout="vertical" margin={{ top: 4, right: 32, bottom: 0, left: 4 }}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis type="category" dataKey="label" tick={{ ...AXIS, fill: C.ink }} axisLine={false} tickLine={false} width={190} />
              <Tooltip cursor={{ fill: C.dataSoft }} content={<ChartTip name="Failures" />} />
              <Bar isAnimationActive={false} dataKey="count" fill={C.data} radius={[0, 4, 4, 0]} maxBarSize={18}>
                <LabelList dataKey="count" position="right" fill={C.ink} fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <section className="chart-card span-6 export-card" aria-label="Detailed exports">
          <header className="chart-card-head">
            <div>
              <h2>Detailed exports</h2>
              <p>Full row-level data behind the charts — every room, person, item, and inspection.</p>
            </div>
          </header>
          <ul className="export-list">
            {([
              ["status", "Daily Room Status", "Lifecycle, readiness, attendant, inspector, duration"],
              ["performance", "Attendant Performance", "Credits, average time, pass rate, signals"],
              ["compliance", "Checklist Compliance", "Every item: done, skipped, photo evidence"],
              ["failures", "Inspection Failures", "Failed points, notes, who re-cleaned"],
            ] as [ReportKey, string, string][]).map(([key, title, copy]) => (
              <li key={key}>
                <div>
                  <strong>{title}</strong>
                  <span>{copy} · {buildReport(s, key).rows.length} rows</span>
                </div>
                <Button variant="hmsGhost" size="hmsSm" onClick={() => setPreview(key)}><Eye aria-hidden="true" /> Preview</Button>
                <Button variant="hmsSecondary" size="hmsSm" onClick={() => downloadCsv(buildReport(s, key))}><Download aria-hidden="true" /> CSV</Button>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <ReportPreviewDialog reportKey={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
