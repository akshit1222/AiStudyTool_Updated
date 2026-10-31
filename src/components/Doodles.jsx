import {
  Atom, BookOpen, Brain, Calculator, Cloud, FlaskConical, Globe, GraduationCap, Heart,
  Lightbulb, Palette, Pencil, Rocket, Sparkles, Star,
} from 'lucide-react';

// Floating study doodles and slow magic circles that fill the empty side space of every page.
const ITEMS = [
  { Icon: BookOpen, x: 4, y: 16, size: 38, rot: -12, color: '#a78bfa' },
  { Icon: Lightbulb, x: 13, y: 42, size: 34, rot: 10, color: '#fbbf24' },
  { Icon: Pencil, x: 6, y: 66, size: 34, rot: 35, color: '#f0abfc' },
  { Icon: Atom, x: 16, y: 84, size: 40, rot: 0, color: '#38bdf8' },
  { Icon: Star, x: 22, y: 26, size: 22, rot: 15, color: '#fde68a' },
  { Icon: Cloud, x: 2, y: 90, size: 40, rot: 0, color: '#c4b5fd' },
  { Icon: GraduationCap, x: 90, y: 14, size: 40, rot: 10, color: '#ff7a3d' },
  { Icon: FlaskConical, x: 84, y: 38, size: 34, rot: -14, color: '#34d399' },
  { Icon: Rocket, x: 93, y: 58, size: 38, rot: 25, color: '#f0abfc' },
  { Icon: Calculator, x: 82, y: 78, size: 34, rot: -8, color: '#38bdf8' },
  { Icon: Heart, x: 76, y: 22, size: 22, rot: 12, color: '#fb7185' },
  { Icon: Globe, x: 95, y: 88, size: 36, rot: 0, color: '#a78bfa' },
  { Icon: Brain, x: 10, y: 6, size: 30, rot: -6, color: '#f0abfc' },
  { Icon: Palette, x: 88, y: 4, size: 30, rot: 8, color: '#fbbf24' },
  { Icon: Sparkles, x: 17, y: 56, size: 22, rot: 0, color: '#fde68a' },
  { Icon: Sparkles, x: 82, y: 64, size: 22, rot: 0, color: '#fde68a' },
];

function starPoints(r) {
  return Array.from({ length: 5 }, (_, i) => {
    const a = (Math.PI * 2 * ((i * 2) % 5)) / 5 - Math.PI / 2;
    return `${(100 + r * Math.cos(a)).toFixed(1)},${(100 + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

function MagicCircle({ className }) {
  return (
    <svg viewBox="0 0 200 200" className={`spin-slow absolute ${className}`} fill="none" stroke="currentColor">
      <circle cx="100" cy="100" r="96" strokeWidth="1.2" strokeDasharray="3 6" />
      <circle cx="100" cy="100" r="84" strokeWidth="1.6" />
      <polygon points={starPoints(72)} strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="100" cy="100" r="30" strokeWidth="1.2" strokeDasharray="2 4" />
    </svg>
  );
}

export default function Doodles() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <MagicCircle className="-left-40 top-[38%] h-[30rem] w-[30rem] text-violet-400/[0.13]" />
      <MagicCircle className="-right-44 -top-24 h-[34rem] w-[34rem] text-fuchsia-400/[0.1]" />
      {ITEMS.map(({ Icon, x, y, size, rot, color }, i) => (
        <span
          key={i}
          className="absolute hidden animate-float opacity-[0.22] md:block"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            color,
            transform: `rotate(${rot}deg)`,
            animationDelay: `${(i % 7) * -0.9}s`,
            animationDuration: `${5 + (i % 5)}s`,
          }}
        >
          <Icon width={size} height={size} strokeWidth={1.6} />
        </span>
      ))}
    </div>
  );
}
