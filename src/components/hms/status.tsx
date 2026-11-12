import { statusMeta, type RoomStatus } from "@/lib/demo-data";
import { useSharedT } from "@/lib/mobile-i18n";
import { cn } from "@/lib/utils";

export function StatusChip({ status, compact = false }: { status: RoomStatus; compact?: boolean }) {
  const meta = statusMeta[status];
  const Icon = meta.icon;
  const tr = useSharedT();
  return (
    <span className={cn("status-chip", meta.className, compact && "status-chip-compact")}>
      <Icon aria-hidden="true" />
      <span>{tr.status(status)}</span>
    </span>
  );
}

export function StatusDot({ status }: { status: RoomStatus }) {
  return <span className={cn("status-dot", statusMeta[status].className)} aria-hidden="true" />;
}
