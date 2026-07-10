import type { SolutionStatus } from "../../types/data";

const statusLabels: Record<SolutionStatus, string> = {
  "on-track": "On Track",
  "at-risk": "At Risk",
  "off-track": "Off Track",
  "not-started": "Not Started",
};

export function StatusIndicator({ status, label }: { status: SolutionStatus; label?: string }) {
  return (
    <span className={`card__status card__status--${status}`}>
      {label || statusLabels[status]}
    </span>
  );
}
