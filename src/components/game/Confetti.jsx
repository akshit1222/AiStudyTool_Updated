import { useState } from 'react';

const COLORS = ['#a78bfa', '#f0abfc', '#ff7a3d', '#fbbf24', '#34d399', '#38bdf8'];

function makePieces(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.9,
    duration: 2.2 + Math.random() * 1.6,
    size: 6 + Math.random() * 7,
    color: COLORS[i % COLORS.length],
    round: Math.random() > 0.55,
  }));
}

export default function Confetti({ count = 48 }) {
  const [pieces] = useState(() => makePieces(count));

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 animate-confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.5,
            borderRadius: p.round ? '9999px' : '2px',
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
