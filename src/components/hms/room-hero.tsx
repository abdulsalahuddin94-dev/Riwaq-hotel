import { useContext, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { Room, RoomStatus } from "@/lib/demo-data";
import { useMobileT } from "@/lib/mobile-i18n";
import { RoomPhoto } from "./illustrations";
import { AppHostContext } from "./mobile-shell";
import { RoomBadges } from "./room-components";
import { StatusChip } from "./status";

const HERO = 400; // px, full-bleed hero height inside the phone
const BAR = 52; // px, collapsed top bar height below the status bar

/**
 * Full-bleed room hero. The photo starts at the very top of the screen (under the status bar)
 * with the room name and data over it. On scroll the photo drifts and fades away while the big
 * title shrinks into a compact top bar. Progress is one CSS variable (--hero-p, 0 → 1) set on the
 * app root, so every transform runs on the compositor.
 */
export function RoomHero({ room, status, back }: { room: Room; status: RoomStatus; back: { to: string; label: string } }) {
  const { app, scroller } = useContext(AppHostContext);
  const tr = useMobileT();
  const frame = useRef(0);

  useEffect(() => {
    if (!app || !scroller) return;
    const screen = app.closest(".device-screen");
    const update = () => {
      frame.current = 0;
      const y = scroller.scrollTop;
      const safeTop = parseFloat(getComputedStyle(app).getPropertyValue("--safe-top")) || 47;
      const range = HERO - BAR - safeTop;
      const p = Math.min(1, Math.max(0, y / range));
      app.style.setProperty("--hero-p", p.toFixed(4));
      app.style.setProperty("--hero-y", `${Math.min(y, HERO)}px`);
      app.style.setProperty("--hero-pull", `${Math.max(0, -y)}px`);
      app.classList.toggle("hero-collapsed", p >= 0.98);
      screen?.toggleAttribute("data-status-light", p < 0.8);
    };
    const onScroll = () => {
      if (!frame.current) frame.current = requestAnimationFrame(update);
    };
    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
      ["--hero-p", "--hero-y", "--hero-pull"].forEach((v) => app.style.removeProperty(v));
      app.classList.remove("hero-collapsed");
      screen?.removeAttribute("data-status-light");
    };
  }, [app, scroller]);

  const title = tr.t(`Room ${room.number}`, `غرفة ${room.number}`);

  return (
    <>
      <header className="room-hero" style={{ "--hero-h": `${HERO}px` } as React.CSSProperties}>
        <div className="room-hero-media">
          <RoomPhoto type={room.type} className="room-hero-photo" />
        </div>
        <div className="room-hero-shade" aria-hidden="true" />
        <div className="room-hero-copy">
          <p className="room-hero-eyebrow">{tr.wing(room.floor)}</p>
          <h1 className="room-hero-title">
            {tr.t("Room", "غرفة")} <bdi>{room.number}</bdi>
          </h1>
          <p className="room-hero-meta">
            {tr.roomType(room.type)} <i aria-hidden="true" /> {tr.task(room.taskType)}
          </p>
          <div className="room-hero-chips">
            <StatusChip status={status} />
            <RoomBadges room={room} showAnomaly={false} />
          </div>
        </div>
      </header>
      {app
        ? createPortal(
            <div className="room-topbar">
              <Link to={back.to as never} className="room-topbar-back" aria-label={back.label}>
                <ChevronLeft aria-hidden="true" />
              </Link>
              <strong className="room-topbar-title" aria-hidden="true">{title}</strong>
              <span className="room-topbar-chip"><StatusChip status={status} compact /></span>
            </div>,
            app,
          )
        : null}
    </>
  );
}
