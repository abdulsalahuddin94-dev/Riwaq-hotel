import { useSharedT } from "@/lib/mobile-i18n";
import { cn } from "@/lib/utils";

/**
 * Dar Al Majlis «دار المجلس», the fictional hotel's own mark, separate from the Riwaq product mark.
 * An eight-pointed khatam star (deep palm green, brass rim) holding a dallah, the coffee pot that opens every majlis.
 * Original drawing; no real hotel's logo is referenced.
 */
export function HotelMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label="Dar Al Majlis">
      <g fill="#1F3B34" stroke="#C9A86A" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M14 14h36v36H14Z" />
        <path d="M32 6.5 57.5 32 32 57.5 6.5 32Z" />
      </g>
      <path fill="#1F3B34" d="M15 15h34v34H15Z" />
      <circle cx="32" cy="32" r="15.5" fill="none" stroke="#C9A86A" strokeWidth=".8" opacity=".55" />
      <g fill="#E2C891">
        <circle cx="33" cy="19.4" r="1.5" />
        <path d="M29.6 24.2c.6-2.6 2-3.9 3.4-3.9s2.8 1.3 3.4 3.9Z" />
        <path d="M30.2 24.9h5.6l-.9 3.9h-3.8Z" />
        <path d="M29.6 29.4h6.8c2.6 1.6 4.1 4.9 4.1 8.4 0 3.6-2.1 6-4.1 7H29.6c-2-1-4.1-3.4-4.1-7 0-3.5 1.5-6.8 4.1-8.4Z" />
        <path d="M26.4 33.6c-3.1-1.2-5.2-4.2-6.2-8.4l1.5-.4c1.1 3.4 2.9 5.6 5.2 6.6Z" />
        <path d="M29.4 45.6h7.2v1.7h-7.2Z" />
      </g>
      <path d="M38.2 30.4c3.6.2 5 3.3 4 7.4" fill="none" stroke="#E2C891" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Hotel badge: mark + wordmark in the current staff-app language only. */
export function HotelBadge({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const { ar } = useSharedT();
  return (
    <div className={cn("hotel-badge", `hotel-badge-${tone}`, className)}>
      <HotelMark className="hotel-badge-mark" />
      {ar ? (
        <div className="hotel-badge-word" lang="ar"><strong>دار المجلس</strong><span>فندق تراثي</span></div>
      ) : (
        <div className="hotel-badge-word"><strong className="hotel-word-en">Dar Al Majlis</strong><span>Heritage Hotel</span></div>
      )}
    </div>
  );
}
