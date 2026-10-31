import Mascot from './Mascot';

const SHADOWS = {
  violet: 'shadow-[3px_3px_0_0_#7c3aed]',
  fuchsia: 'shadow-[3px_3px_0_0_#c026d3]',
  orange: 'shadow-[3px_3px_0_0_#ff7a3d]',
  teal: 'shadow-[3px_3px_0_0_#14b8a6]',
  sky: 'shadow-[3px_3px_0_0_#0ea5e9]',
};

// The mascot with a manga-style speech bubble: friendly guidance at the top of a page.
export default function MascotTip({ mood = 'idle', accent = 'violet', children, className = '' }) {
  return (
    <div className={`flex items-center gap-2 sm:gap-4 ${className}`}>
      <Mascot mood={mood} className="h-24 w-24 shrink-0 sm:h-28 sm:w-28" />
      <div
        key={String(children)}
        className={`bubble-pop relative rounded-2xl border-2 border-[#1e1b4b] bg-white px-4 py-3 text-sm font-semibold leading-snug text-[#1e1b4b] ${SHADOWS[accent] || SHADOWS.violet}`}
      >
        <span className="absolute -left-[9px] top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-[#1e1b4b] bg-white" />
        <span className="relative">{children}</span>
      </div>
    </div>
  );
}
