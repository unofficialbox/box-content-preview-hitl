import type { SolutionStatus } from "../../types/data";

interface ProgressBarProps {
  progress: number;
  status: SolutionStatus;
}

export function ProgressBar({ progress, status }: ProgressBarProps) {
  return (
    <div className="card__footer">
      <div className="card__progress-bar">
        <div
          className={`card__progress-fill card__progress-fill--${status}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="card__progress-label">{progress}% complete</span>
    </div>
  );
}
