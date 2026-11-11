import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SkeletonState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="grid gap-3" aria-label="Loading skeleton">
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton-row" key={index} />
      ))}
    </div>
  );
}

export function EmptyState({ title, action, onAction, art }: { title: string; action?: string; onAction?: () => void; art?: React.ReactNode }) {
  return (
    <div className={art ? "empty-state empty-state-art" : "empty-state"}>
      {art ?? (
        <div className="empty-illustration" aria-hidden="true">
          <CheckCircle2 />
        </div>
      )}
      <p>{title}</p>
      {action && onAction ? (
        <Button variant="hmsSecondary" size="hmsSm" onClick={onAction}>
          {action}
        </Button>
      ) : null}
    </div>
  );
}

export function ErrorState({ title = "Couldn't load", onRetry }: { title?: string; onRetry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle aria-hidden="true" />
      <span>{title}</span>
      <Button variant="hmsGhost" size="hmsSm" onClick={onRetry}>
        <RefreshCw aria-hidden="true" />
        Retry
      </Button>
    </div>
  );
}
