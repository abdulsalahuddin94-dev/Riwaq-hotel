import type { ReactNode } from "react";
import type { RoomType } from "@/lib/demo-data";
import { RoomPhoto } from "./illustrations";

/** Shared photo surface for inspection and maintenance tasks. */
export function MobileTaskPhoto({ type }: { type?: RoomType }) {
  return <RoomPhoto type={type ?? "Heritage Room"} refined className="mobile-card-photo" />;
}

export function MobileTaskContent({ eyebrow, title, children }: { eyebrow: ReactNode; title: ReactNode; children: ReactNode }) {
  return <div className="mobile-task-content"><p className="mobile-room-meta">{eyebrow}</p><h2>{title}</h2>{children}</div>;
}

export function MobileDetailPhoto({ type, title, subtitle }: { type: RoomType; title: ReactNode; subtitle: ReactNode }) {
  return <div className="mobile-detail-photo"><MobileTaskPhoto type={type} /><div><p>{subtitle}</p><h2>{title}</h2></div></div>;
}