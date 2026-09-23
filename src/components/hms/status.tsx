import { statusMeta, type RoomStatus } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function StatusChip({ status, compact = false }: { status: RoomStatus; compact?: boolean }) {
  const meta = statusMeta[status];
  const Icon = meta.icon;
  return (
    <span className={cn("status-chip", meta.className, compact && "status-chip-compact")}>
      <Icon aria-hidden="true" />
      <span>{meta.label}</span>
    </span>
  );
}

export function StatusDot({ status }: { status: RoomStatus }) {
  return <span className={cn("status-dot", statusMeta[status].className)} aria-hidden="true" />;
}
