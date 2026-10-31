import { useEffect, useState } from 'react';
import Mascot from './Mascot';

const MESSAGES = {
  flashcards: ['Sharpening the flashcards…', 'Finding the juiciest facts…', 'Folding the corners…', 'Power level rising…'],
  quiz: ['Writing tricky questions…', 'Hiding the right answers…', 'Adding sneaky wrong options…', 'Boss level loading…'],
  summary: ['Reading every page…', 'Highlighting the good stuff…', 'Squishing it into bullets…', 'Nearly done!'],
  pictures: ['Mixing the paint…', 'Sketching your ideas…', 'Adding the sparkles…', 'Final touches!'],
  slides: ['Arranging the slides…', 'Picking the best titles…', 'Writing speaker notes…', 'Almost ready to present!'],
  game: ['Building your arena…', 'Loading the questions…', 'Warming up the timer…', 'Get ready to play!'],
  default: ['Reading your notes…', 'Picking out the key ideas…', 'Putting it together…', 'Almost there…'],
};

const TIPS = [
  'Testing yourself beats re-reading, every time.',
  'Short sessions beat marathons: try 25 minutes, then a 5-minute break.',
  'Explaining a topic out loud shows what you really know.',
  'Sleep is when memories stick, so do not skip it before an exam.',
  'Mix up topics instead of cramming just one.',
  'Wrong answers are useful: they show exactly what to review.',
];

function inferKind(label = '') {
  const text = label.toLowerCase();
  if (text.includes('flashcard')) return 'flashcards';
  if (text.includes('quiz') && !text.includes('saved')) return 'quiz';
  if (text.includes('summar')) return 'summary';
  if (text.includes('draw') || text.includes('picture') || text.includes('ideas')) return 'pictures';
  if (text.includes('slide')) return 'slides';
  if (text.includes('game') || text.includes('arena')) return 'game';
  return 'default';
}

function makeSparkles(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 4 + Math.random() * 92,
    size: 8 + Math.random() * 12,
    delay: Math.random() * 6,
    dur: 5 + Math.random() * 5,
    color: ['#fde68a', '#f0abfc', '#a78bfa', '#7dd3fc'][i % 4],
  }));
}

function Sparkles() {
  const [items] = useState(() => makeSparkles(14));
  return (
    <>
      {items.map((s) => (
        <svg
          key={s.id}
          viewBox="-10 -10 20 20"
          className="drift-up absolute bottom-0"
          style={{ left: `${s.left}%`, width: s.size, height: s.size, '--dur': `${s.dur}s`, '--delay': `${s.delay}s` }}
        >
          <path d="M0 -9 Q1.6 -1.6 9 0 Q1.6 1.6 0 9 Q-1.6 1.6 -9 0 Q-1.6 -1.6 0 -9Z" fill={s.color} />
        </svg>
      ))}
    </>
  );
}

export default function Loader({ label, kind, size = 'md', inline = false, compact = false }) {
  const [seconds, setSeconds] = useState(0);
  const active = !inline && !compact;

  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (inline) {
    const sizeClasses = size === 'sm' ? 'h-4 w-4 border-2' : 'h-8 w-8 border-[3px]';
    return (
      <div
        className={`${sizeClasses} animate-spin rounded-full border-white/20 border-t-violet-500`}
        role="status"
        aria-label="Loading"
      />
    );
  }

  if (compact) {
    return (
      <div className="flex items-center justify-center gap-3 py-2" role="status" aria-live="polite">
        <Mascot mood="thinking" className="h-12 w-12" />
        <p className="text-sm text-white/70">{label || 'Loading…'}</p>
      </div>
    );
  }

  const messages = MESSAGES[kind || inferKind(label)] || MESSAGES.default;
  const message = messages[Math.min(messages.length - 1, Math.floor(seconds / 3.5))];
  const progress = 1 - Math.exp(-seconds / 14);
  const filled = Math.floor(progress * 10);
  const tip = TIPS[Math.floor(seconds / 6) % TIPS.length];
  const slow = seconds >= 25;

  return (
    <div
      className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-violet-950/60 via-[#120e2b] to-[#1b0f2a]"
      role="status"
      aria-live="polite"
    >
      {/* speed lines */}
      <div
        className="spin-slow absolute left-1/2 top-1/2 -z-10 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2 opacity-70"
        style={{
          background: 'repeating-conic-gradient(from 0deg, rgba(196,181,253,0.11) 0deg 3deg, transparent 3deg 9deg)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 18%, black 62%)',
          maskImage: 'radial-gradient(circle, transparent 18%, black 62%)',
          animationDuration: '60s',
        }}
      />
      <div className="halftone absolute inset-0 -z-10 [mask-image:linear-gradient(to_top,black,transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-orange-500/15 to-transparent" />
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Sparkles />
      </div>

      {/* comic tag */}
      <span className="absolute left-4 top-4 -skew-x-6 border-2 border-[#1e1b4b] bg-violet-600 px-3 py-1 font-display text-[11px] font-extrabold uppercase tracking-widest text-white shadow-[3px_3px_0_0_#ff7a3d]">
        Now loading
      </span>
      <span className="absolute right-4 top-4 font-mono text-xs tabular-nums text-white/35">
        {seconds > 2 ? `${seconds}s` : ''}
      </span>

      <div className="flex flex-col items-center gap-5 px-6 pb-8 pt-14 text-center">
        <div className="relative flex flex-col items-center sm:block">
          <Mascot mood={slow ? 'oops' : 'thinking'} className="h-44 w-44 sm:h-52 sm:w-52" />
          <div
            key={slow ? 'slow' : message}
            className="bubble-pop relative mt-1 w-56 rounded-2xl border-2 border-[#1e1b4b] bg-white px-3 py-2 text-left text-xs font-bold leading-snug text-[#1e1b4b] shadow-[3px_3px_0_0_#c026d3] sm:absolute sm:-right-[13.5rem] sm:top-10 sm:mt-0 sm:w-52 sm:text-sm"
          >
            <span className="absolute -left-[8px] top-5 hidden h-3.5 w-3.5 rotate-45 border-b-2 border-l-2 border-[#1e1b4b] bg-white sm:block" />
            <span className="relative">
              {slow ? 'Taking longer than usual. The AI might be busy, hang tight!' : message}
            </span>
          </div>
        </div>

        <h2 className="font-display text-xl font-bold tracking-tight [text-shadow:2px_2px_0_rgba(124,58,237,0.7)] sm:text-2xl">
          {label || 'Working on it…'}
        </h2>

        {/* chapter progress */}
        <div className="flex w-full max-w-xs gap-1.5" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <span
              key={i}
              className={`h-3 flex-1 -skew-x-12 rounded-[3px] border border-[#1e1b4b] transition-colors duration-500 ${
                i < filled
                  ? 'bg-gradient-to-b from-fuchsia-400 to-violet-500'
                  : i === filled
                    ? 'animate-pulse bg-orange-400/70'
                    : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <p className="max-w-sm text-xs leading-relaxed text-white/45">
          <span className="mr-1.5 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-violet-200">
            Study tip
          </span>
          {tip}
        </p>
      </div>
    </div>
  );
}
