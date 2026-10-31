import { useId } from 'react';

// "Forgey": an original flame-spirit student in a graduation cap.
// Moods: idle | thinking | reading | happy | cheer | sleepy | oops
const SPARKLE = 'M0 -9 Q1.6 -1.6 9 0 Q1.6 1.6 0 9 Q-1.6 1.6 -9 0 Q-1.6 -1.6 0 -9Z';
const INK = '#2e1065';

function Sparkle({ x, y, scale = 1, delay = 0, color = '#fde68a' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d={SPARKLE} fill={color} className="m-twinkle" style={{ animationDelay: `${delay}s` }} />
    </g>
  );
}

function Eye({ cx, cy, mood, uid }) {
  if (mood === 'happy' || mood === 'cheer') {
    return (
      <path
        d={`M${cx - 12} ${cy + 5} Q${cx} ${cy - 14} ${cx + 12} ${cy + 5}`}
        fill="none" stroke="#1a0b4a" strokeWidth="4.5" strokeLinecap="round"
      />
    );
  }
  if (mood === 'sleepy') {
    return (
      <path
        d={`M${cx - 12} ${cy} Q${cx} ${cy + 11} ${cx + 12} ${cy}`}
        fill="none" stroke="#1a0b4a" strokeWidth="4" strokeLinecap="round"
      />
    );
  }
  const [dx, dy] = { thinking: [4, -5], reading: [0, 6], idle: [0, 0], oops: [0, 0] }[mood] || [0, 0];
  const small = mood === 'oops';
  return (
    <g className="m-blink">
      <ellipse cx={cx} cy={cy} rx="14" ry="17" fill="#fff" />
      <ellipse cx={cx + dx} cy={cy + dy} rx={small ? 7 : 10} ry={small ? 9 : 13} fill={`url(#${uid}iris)`} />
      <ellipse cx={cx + dx} cy={cy + dy + 1} rx={small ? 3.5 : 5} ry={small ? 5 : 7} fill="#1a0b4a" />
      <circle cx={cx + dx - 4} cy={cy + dy - 5} r="4.2" fill="#fff" />
      <circle cx={cx + dx + 4} cy={cy + dy + 5} r="2" fill="#fff" opacity="0.9" />
    </g>
  );
}

function Mouth({ mood }) {
  if (mood === 'happy' || mood === 'cheer') {
    return (
      <g>
        <path d="M89 130 Q100 150 111 130 Z" fill="#7a1a4a" stroke="#1a0b4a" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M94 140 Q100 135 106 140 Q100 146 94 140Z" fill="#ff6b9d" />
      </g>
    );
  }
  if (mood === 'oops') {
    return <path d="M90 138 Q95 131 100 138 T110 138" fill="none" stroke="#1a0b4a" strokeWidth="2.8" strokeLinecap="round" />;
  }
  if (mood === 'thinking') {
    return <ellipse cx="100" cy="136" rx="4" ry="3.2" fill="#7a1a4a" stroke="#1a0b4a" strokeWidth="2" />;
  }
  if (mood === 'sleepy') {
    return <path d="M95 134 Q100 138 105 134" fill="none" stroke="#1a0b4a" strokeWidth="2.6" strokeLinecap="round" />;
  }
  return <path d="M91 132 Q100 142 109 132" fill="none" stroke="#1a0b4a" strokeWidth="3" strokeLinecap="round" />;
}

export default function Mascot({ mood = 'idle', className = 'h-32 w-32', float = true }) {
  const uid = useId().replace(/:/g, '');
  const cheer = mood === 'cheer';
  const capTilt = mood === 'sleepy' ? -16 : -8;

  return (
    <svg viewBox="0 0 200 200" className={`${className} overflow-visible`} role="img" aria-label="Forgey the study mascot">
      <defs>
        <linearGradient id={`${uid}body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="0.55" stopColor="#d946ef" />
          <stop offset="1" stopColor="#ff7a3d" />
        </linearGradient>
        <linearGradient id={`${uid}flame`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff7a3d" />
          <stop offset="1" stopColor="#fde047" />
        </linearGradient>
        <radialGradient id={`${uid}iris`} cx="0.5" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="0.6" stopColor="#6d28d9" />
          <stop offset="1" stopColor="#2e1065" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="190" rx="50" ry="7" fill="#000" opacity="0.28" />

      <g className={float ? 'm-bob' : undefined}>
        {/* cheering arms (behind body) */}
        {cheer && (
          <g>
            <g className="m-wave"><path d="M46 124 Q26 104 30 76" fill="none" stroke={INK} strokeWidth="13" strokeLinecap="round" /><path d="M46 124 Q26 104 30 76" fill="none" stroke="#c4a8ff" strokeWidth="8" strokeLinecap="round" /><circle cx="30" cy="72" r="9" fill="#c4a8ff" stroke={INK} strokeWidth="3" /></g>
            <g className="m-wave" style={{ animationDelay: '0.25s' }}><path d="M154 124 Q174 104 170 76" fill="none" stroke={INK} strokeWidth="13" strokeLinecap="round" /><path d="M154 124 Q174 104 170 76" fill="none" stroke="#c4a8ff" strokeWidth="8" strokeLinecap="round" /><circle cx="170" cy="72" r="9" fill="#c4a8ff" stroke={INK} strokeWidth="3" /></g>
          </g>
        )}

        {/* flame on the cap */}
        <path className="m-flicker" d="M102 4 C111 17 118 25 111 40 L93 40 C86 25 94 17 102 4Z" fill={`url(#${uid}flame)`} stroke="#c2410c" strokeWidth="2" strokeLinejoin="round" />

        {/* body */}
        <path d="M100 42 C142 42 162 76 162 112 C162 154 135 178 100 178 C65 178 38 154 38 112 C38 76 58 42 100 42Z" fill={`url(#${uid}body)`} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M58 70 Q66 52 88 48" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.35" />

        {/* face */}
        <path d={`M${64 - 15} 96 Q${64} 83 ${64 + 15} 94`} fill="none" stroke="#1a0b4a" strokeWidth="4" strokeLinecap="round" />
        <path d={`M${136 - 15} 94 Q${136} 83 ${136 + 15} 96`} fill="none" stroke="#1a0b4a" strokeWidth="4" strokeLinecap="round" />
        <Eye cx={70} cy={110} mood={mood} uid={uid} />
        <Eye cx={130} cy={110} mood={mood} uid={uid} />
        <ellipse cx="55" cy="130" rx="10" ry="6" fill="#ff6b9d" opacity="0.65" />
        <ellipse cx="145" cy="130" rx="10" ry="6" fill="#ff6b9d" opacity="0.65" />
        <Mouth mood={mood} />

        {/* graduation cap */}
        <g transform={`rotate(${capTilt} 100 56)`}>
          <path d="M76 58 L76 76 Q100 88 124 76 L124 58 Z" fill="#1e1b4b" stroke="#0f0d1f" strokeWidth="2" />
          <path d="M56 54 L100 36 L144 54 L100 72 Z" fill="#2e2a6b" stroke="#fbbf24" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="100" cy="54" r="3.5" fill="#fbbf24" />
          <path d="M100 54 L138 58 L138 78" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="138" cy="82" rx="3.6" ry="7" fill="#fbbf24" />
        </g>

        {/* open book (not while cheering) */}
        {!cheer && (
          <g transform={mood === 'reading' ? 'translate(0 -4)' : undefined}>
            <path d="M56 152 Q80 144 100 154 L100 190 Q80 180 56 188 Z" fill="#fff7ed" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <path d="M144 152 Q120 144 100 154 L100 190 Q120 180 144 188 Z" fill="#fff7ed" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <path d="M66 162 Q80 158 92 164 M66 171 Q80 167 92 173 M108 164 Q120 158 134 162 M108 173 Q120 167 134 171" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
            <circle cx="58" cy="164" r="8" fill="#c4a8ff" stroke={INK} strokeWidth="3" />
            <circle cx="142" cy="164" r="8" fill="#c4a8ff" stroke={INK} strokeWidth="3" />
          </g>
        )}

        {/* mood extras */}
        {mood === 'thinking' && (
          <g fill="#fff" stroke={INK} strokeWidth="2.5">
            <circle cx="164" cy="64" r="4" />
            <circle cx="176" cy="46" r="6" />
            <ellipse cx="186" cy="20" rx="12" ry="11" />
            <text x="186" y="25" textAnchor="middle" fontSize="15" fontWeight="800" fill={INK} stroke="none">?</text>
          </g>
        )}
        {mood === 'oops' && (
          <path d="M158 82 Q166 96 158 104 Q150 96 158 82Z" fill="#7dd3fc" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        )}
        {mood === 'sleepy' && (
          <g fill="#c4b5fd" fontWeight="800" fontFamily="sans-serif">
            <text x="156" y="52" fontSize="18" className="m-twinkle">z</text>
            <text x="170" y="34" fontSize="24" className="m-twinkle" style={{ animationDelay: '0.5s' }}>Z</text>
          </g>
        )}
        {(mood === 'happy' || cheer) && (
          <g>
            <Sparkle x={20} y={50} scale={1.3} />
            <Sparkle x={182} y={56} scale={1} delay={0.7} color="#f0abfc" />
            <Sparkle x={168} y={22} scale={0.8} delay={1.2} />
          </g>
        )}
        {mood === 'idle' && <Sparkle x={178} y={44} scale={0.9} delay={0.4} />}
      </g>
    </svg>
  );
}
