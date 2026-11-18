import type { SVGProps } from "react";

/**
 * Google Material Symbols Rounded, the icon set of the Marsa Dhahab design system (from @EmG38's hotel-hearth-ops).
 * Each icon is a ligature drawn inside an <svg> so it keeps the same box, sizing and `currentColor`
 * rules the dashboard CSS already applies to `svg` icons. Names below keep the old lucide export names,
 * so a file switches icon sets by changing only its import line.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number | string; filled?: boolean };

function make(glyph: string, defaultFilled = false) {
  function MaterialSymbol({ size, filled = defaultFilled, strokeWidth: _sw, ...rest }: IconProps) {
    const labelled = rest["aria-label"] !== undefined;
    return (
      <svg
        viewBox="0 0 24 24"
        width={size ?? 24}
        height={size ?? 24}
        fill="currentColor"
        role={labelled ? "img" : undefined}
        aria-hidden={labelled ? undefined : true}
        data-icon={glyph}
        {...rest}
        className={["msym", rest.className].filter(Boolean).join(" ")}
      >
        <text
          x="12"
          y="24"
          textAnchor="middle"
          className="msym-glyph"
          style={{ fontVariationSettings: `"FILL" ${filled ? 1 : 0}, "wght" 400, "GRAD" 0, "opsz" 24` }}
        >
          {glyph}
        </text>
      </svg>
    );
  }
  MaterialSymbol.displayName = `MaterialSymbol(${glyph})`;
  return MaterialSymbol;
}

export const AlertCircle = make("error");
export const AlertTriangle = make("warning");
export const ArrowUpRight = make("arrow_outward");
export const BarChart3 = make("bar_chart");
export const BedDouble = make("bed");
export const BedSingle = make("single_bed");
export const BriefcaseBusiness = make("concierge");
export const Building2 = make("apartment");
export const CalendarClock = make("event_upcoming");
export const CalendarDays = make("calendar_month");
export const Camera = make("photo_camera");
export const Check = make("check");
export const CheckCircle2 = make("check_circle", true);
export const ChevronDown = make("expand_more");
export const ChevronRight = make("chevron_right");
export const Circle = make("radio_button_unchecked");
export const CircleSlash = make("block");
export const ClipboardCheck = make("assignment_turned_in");
export const ClipboardList = make("assignment");
export const Clock = make("schedule");
export const Crown = make("workspace_premium");
export const Download = make("download");
export const Eye = make("visibility");
export const FileSpreadsheet = make("table_view");
export const Filter = make("filter_list");
export const ImageDown = make("image");
export const Landmark = make("account_balance");
export const LayoutGrid = make("grid_view");
export const LogIn = make("login");
export const LogOut = make("logout");
export const Menu = make("menu");
export const Moon = make("bedtime");
export const PanelLeftClose = make("left_panel_close");
export const PanelLeftOpen = make("left_panel_open");
export const Plus = make("add");
export const Printer = make("print");
export const RotateCcw = make("restart_alt");
export const Search = make("search");
export const Settings = make("settings");
export const ShieldCheck = make("verified_user");
export const Sparkles = make("auto_awesome");
export const Table2 = make("table");
export const Timer = make("timer");
export const Trash2 = make("delete");
export const Trees = make("park");
export const UserRoundCog = make("manage_accounts");
export const Users = make("groups");
export const Wrench = make("build");
export const X = make("close");
export const XCircle = make("cancel", true);
export const Zap = make("bolt");
