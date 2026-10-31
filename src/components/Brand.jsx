import { Flame } from 'lucide-react';

export default function Brand({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 shadow-lg shadow-violet-900/40">
        <Flame className="h-4 w-4 text-white" aria-hidden="true" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">StudyForge</span>
    </span>
  );
}
