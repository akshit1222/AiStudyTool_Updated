import { LABEL_CLASS } from '../libs/theme.js';

export default function ProgressBar({ current, total, known }) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="mb-6 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className={LABEL_CLASS}>
          Card {current} / {total}
        </span>
        <span className={LABEL_CLASS}>{Math.round(progress)}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      {known !== undefined && (
        <div className="flex justify-end">
          <span className={LABEL_CLASS}>✓ Known: {known}</span>
        </div>
      )}
    </div>
  );
}
