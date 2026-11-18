import { useSharedT } from "@/lib/mobile-i18n";
import { cn } from "@/lib/utils";

/**
 * Marsa Dhahab «مرسى ذهب», the fictional hotel's own mark (brand from @EmG38's hotel-hearth-ops design system;
 * supersedes the Dar Al Majlis seal, PD-05, owner decision 2026-11-18).
 * Interim original drawing in the brand colours: a dhow under a setting sun on Gulf water.
 * Replace with Eman's emblem PNG when it is added to src/assets/.
 */
export function HotelMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label="Marsa Dhahab">
      <circle cx="32" cy="32" r="30" fill="#012947" />
      <circle cx="32" cy="32" r="27.5" fill="none" stroke="#E99023" strokeWidth="1.4" />
      <circle cx="32" cy="30" r="11" fill="#E99023" />
      <path d="M31 13.5v26" stroke="#F3DFB8" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M31.8 15.5c6.2 5 9.6 12.4 9.9 21.4H31.8Z" fill="#FFFFFF" />
      <path d="M30.2 18c-4.6 4.4-7 10.4-7.1 17.4h7.1Z" fill="#F3DFB8" />
      <path d="M17 39.5h30.5c-1.6 3.4-4.6 5.4-8.6 5.4H24.6c-3.5 0-6.2-2-7.6-5.4Z" fill="#E99023" />
      <path d="M10.5 48.2c3.6-2.2 7.2-2.2 10.8 0s7.2 2.2 10.8 0 7.2-2.2 10.8 0 7.2 2.2 10.8 0" fill="none" stroke="#1C82AB" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M15.5 53.4c2.8-1.6 5.6-1.6 8.4 0s5.6 1.6 8.4 0 5.6-1.6 8.4 0 5.6 1.6 8.4 0" fill="none" stroke="#83AEC8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
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
