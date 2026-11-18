import { useSharedT } from "@/lib/mobile-i18n";
import { cn } from "@/lib/utils";

import emblem from "@/assets/marsa-dhahab-emblem.png";

/**
 * Marsa Dhahab «مرسى ذهب», the fictional hotel's own mark: @EmG38's dhow-and-sun emblem from hotel-hearth-ops
 * (supersedes the Dar Al Majlis seal, PD-05, owner decision 2026-11-18). Transparent PNG, 400×275.
 */
export function HotelMark({ className }: { className?: string }) {
  return <img src={emblem} className={cn("hotel-mark-img", className)} alt="Marsa Dhahab" width={400} height={275} />;
}

/** Hotel logo lockup: mark + «مرسى ذهب» over MARSA DHAHAB. A logo, not a label, so both names always show together. */
export function HotelBadge({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <div className={cn("hotel-badge", `hotel-badge-${tone}`, className)}>
      <HotelMark className="hotel-badge-mark" />
      <div className="hotel-badge-word">
        <strong lang="ar">مرسى ذهب</strong>
        <span>Marsa Dhahab</span>
      </div>
    </div>
  );
}

/** Small product credit: the hotel brand leads, Riwaq stays in the background. */
export function PoweredByRiwaq({ className }: { className?: string }) {
  const { t } = useSharedT();
  return (
    <p className={cn("powered-by", className)}>
      <span>{t("Powered by", "مدعوم من")}</span> <b>RIWAQ SYSTEMS</b>
    </p>
  );
}
