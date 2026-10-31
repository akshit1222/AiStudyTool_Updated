import { useCallback, useEffect, useRef, useState } from 'react';
import { Flame, Heart, Snowflake, SkipForward, Volume2, VolumeX } from 'lucide-react';
import {
  FREEZE_SECONDS,
  QUESTION_SECONDS,
  START_LIVES,
  multiplierForStreak,
  pointsFor,
} from '../../libs/game.js';
import { isMuted, setMuted, sfx } from '../../libs/sound.js';

const LETTERS = ['A', 'B', 'C', 'D'];
const SKIPPED = -2;
const TIMED_OUT = -1;
const BURST_COLORS = ['#a78bfa', '#f0abfc', '#ff7a3d', '#fbbf24', '#34d399'];

function nextThreshold(streak) {
  if (streak < 3) return 3;
  if (streak < 5) return 5;
  if (streak < 7) return 7;
  return null;
}

// Score that counts up instead of jumping
function useCountUp(target) {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    let frame;
    const from = shownRef.current;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 450);
      const value = Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3)));
      shownRef.current = value;
      setShown(value);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return shown;
}

function Burst() {
  const [pieces] = useState(() =>
    Array.from({ length: 14 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
      const dist = 60 + Math.random() * 70;
      return {
        id: i,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        color: BURST_COLORS[i % BURST_COLORS.length],
        size: 5 + Math.random() * 5,
      };
    })
  );

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-10" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute animate-burst rounded-full"
          style={{ width: p.size, height: p.size, background: p.color, '--dx': `${p.dx}px`, '--dy': `${p.dy}px` }}
        />
      ))}
    </div>
  );
}

export default function GameArena({ questions, onFinish, onExit }) {
  const [countdown, setCountdown] = useState(3);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [correctCount, setCorrectCount] = useState(0);
  const [played, setPlayed] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [hidden, setHidden] = useState([]);
  const [fiftyUsed, setFiftyUsed] = useState(false);
  const [skipUsed, setSkipUsed] = useState(false);
  const [freezeUsed, setFreezeUsed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS);
  const [gain, setGain] = useState(null);
  const [muted, setMutedState] = useState(isMuted);
  const deadline = useRef(0);
  const finished = useRef(false);
  const lastWhole = useRef(QUESTION_SECONDS);

  const started = countdown === 0;
  const question = questions[idx];
  const multiplier = multiplierForStreak(streak);
  const target = nextThreshold(streak);
  const wasWrong = revealed && selected !== question.correct && selected !== SKIPPED;
  const wasRight = revealed && selected === question.correct;
  const shownScore = useCountUp(score);

  // 3, 2, 1, go
  useEffect(() => {
    if (countdown === 0) return undefined;
    sfx.tick();
    const id = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 800);
    return () => clearTimeout(id);
  }, [countdown]);

  useEffect(() => {
    if (!started) return;
    sfx.go();
    deadline.current = Date.now() + QUESTION_SECONDS * 1000;
  }, [started]);

  const resolve = useCallback(
    (choice) => {
      if (revealed || !started) return;
      const isCorrect = choice === question.correct;
      setSelected(choice);
      setRevealed(true);
      setPlayed((p) => p + 1);

      if (isCorrect) {
        const left = Math.max(0, (deadline.current - Date.now()) / 1000);
        const newStreak = streak + 1;
        const points = pointsFor(left, newStreak);
        setScore((s) => s + points);
        setStreak(newStreak);
        setMaxStreak((m) => Math.max(m, newStreak));
        setCorrectCount((c) => c + 1);
        setGain({ points, key: idx });
        sfx.correct(newStreak);
      } else {
        setStreak(0);
        setLives((l) => l - 1);
        setGain(null);
        sfx.wrong();
        if (navigator.vibrate) navigator.vibrate(40);
      }
    },
    [revealed, started, question, streak, idx]
  );

  const skip = useCallback(() => {
    if (revealed || skipUsed || !started) return;
    setSkipUsed(true);
    setSelected(SKIPPED);
    setRevealed(true);
    setPlayed((p) => p + 1);
    setGain(null);
  }, [revealed, skipUsed, started]);

  const fiftyFifty = useCallback(() => {
    if (revealed || fiftyUsed || !started) return;
    const wrong = question.options.map((_, i) => i).filter((i) => i !== question.correct);
    const remove = wrong.sort(() => Math.random() - 0.5).slice(0, Math.max(0, wrong.length - 1));
    setHidden(remove);
    setFiftyUsed(true);
  }, [revealed, fiftyUsed, started, question]);

  const freeze = useCallback(() => {
    if (revealed || freezeUsed || !started) return;
    deadline.current += FREEZE_SECONDS * 1000;
    setFreezeUsed(true);
    sfx.freeze();
  }, [revealed, freezeUsed, started]);

  const advance = useCallback(() => {
    if (finished.current) return;
    if (lives <= 0 || idx >= questions.length - 1) {
      finished.current = true;
      onFinish({ score, correct: correctCount, total: played, maxStreak, livesLeft: Math.max(0, lives) });
      return;
    }
    setIdx((i) => i + 1);
    setSelected(null);
    setRevealed(false);
    setHidden([]);
    setGain(null);
    setSecondsLeft(QUESTION_SECONDS);
    lastWhole.current = QUESTION_SECONDS;
    deadline.current = Date.now() + QUESTION_SECONDS * 1000;
  }, [lives, idx, questions.length, onFinish, score, correctCount, played, maxStreak]);

  // Countdown for the current question
  useEffect(() => {
    if (revealed || !started) return undefined;
    const id = setInterval(() => {
      const left = (deadline.current - Date.now()) / 1000;
      if (left <= 0) {
        clearInterval(id);
        setSecondsLeft(0);
        resolve(TIMED_OUT);
        return;
      }
      setSecondsLeft(left);
      const whole = Math.ceil(left);
      if (whole <= 3 && whole !== lastWhole.current) sfx.tick();
      lastWhole.current = whole;
    }, 100);
    return () => clearInterval(id);
  }, [revealed, started, idx, resolve]);

  // Move on automatically after the answer is shown
  useEffect(() => {
    if (!revealed) return undefined;
    const id = setTimeout(advance, 1500);
    return () => clearTimeout(id);
  }, [revealed, advance]);

  // Keyboard: 1-4 or A-D to answer, Enter to continue
  useEffect(() => {
    const onKey = (e) => {
      if (!started) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (revealed) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          advance();
        }
        return;
      }
      const map = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 };
      const choice = map[e.key.toLowerCase()];
      if (choice !== undefined && choice < question.options.length && !hidden.includes(choice)) {
        resolve(choice);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, revealed, advance, resolve, question, hidden]);

  const toggleSound = () => {
    setMuted(!muted);
    setMutedState(!muted);
  };

  const pct = Math.max(0, Math.min(100, (secondsLeft / QUESTION_SECONDS) * 100));
  const timerColor = pct > 50 ? 'bg-violet-500' : pct > 25 ? 'bg-amber-400' : 'bg-red-500';
  const glow = streak >= 3 ? 0.15 + Math.min(0.35, (multiplier - 1) * 0.18) : 0;

  return (
    <div className="relative flex flex-col gap-5">
      {!started && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#0b0a14]/85 backdrop-blur-sm">
          <p className="text-sm text-white/50">Get ready</p>
          <p key={countdown} className="animate-countdown font-display text-8xl font-bold text-gradient">
            {countdown}
          </p>
          <p className="text-xs text-white/40">Press 1–4 or A–D to answer</p>
        </div>
      )}

      {/* HUD */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="text-sm text-white/50 transition-colors hover:text-white"
          >
            ← Quit
          </button>
          <button
            type="button"
            onClick={toggleSound}
            aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
            className="rounded-full border border-white/10 bg-white/[0.04] p-1.5 text-white/50 transition-colors hover:text-white"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex items-center gap-1" aria-label={`${Math.max(0, lives)} lives left`}>
          {Array.from({ length: START_LIVES }, (_, i) => (
            <Heart
              key={i}
              className={`h-5 w-5 transition-all ${
                i < lives ? 'fill-rose-500 text-rose-500' : 'text-white/20'
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="relative text-right">
          <p className="font-display text-2xl font-semibold tabular-nums leading-none">
            {shownScore.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-white/40">points</p>
          {revealed && gain && (
            <span
              key={gain.key}
              className="absolute -top-2 right-0 animate-rise font-display text-sm font-semibold text-emerald-300"
            >
              +{gain.points}
            </span>
          )}
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-[width] duration-100 ease-linear ${timerColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span
          className={`w-8 text-right font-mono text-sm tabular-nums ${
            pct <= 25 ? 'text-red-400' : 'text-white/60'
          }`}
        >
          {Math.ceil(secondsLeft)}
        </span>
      </div>

      {/* Combo */}
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>
          Question {idx + 1} of {questions.length}
        </span>
        <span
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 transition-colors ${
            streak >= 3
              ? 'border-orange-400/50 bg-orange-500/15 text-orange-200'
              : 'border-white/10 bg-white/[0.03]'
          }`}
        >
          <Flame
            className={`h-3.5 w-3.5 ${streak >= 3 ? 'animate-flame text-orange-400' : 'text-white/40'}`}
            aria-hidden="true"
          />
          {streak} streak · x{multiplier}
          {target && streak > 0 && <span className="text-white/40">· {target - streak} to x{multiplierForStreak(target)}</span>}
        </span>
      </div>

      {/* Question */}
      <div
        key={idx}
        className={`glass relative rounded-2xl p-5 transition-shadow duration-500 sm:p-6 ${wasWrong ? 'animate-shake' : 'animate-pop'}`}
        style={{ boxShadow: glow ? `0 0 70px -12px rgba(255,122,61,${glow})` : undefined }}
      >
        {wasRight && <Burst key={`burst-${idx}`} />}
        <h2 className="text-balance text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
          {question.question}
        </h2>
      </div>

      <div className="grid gap-3">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correct;
          const isSelected = selected === i;
          const isHidden = hidden.includes(i);

          let tone = 'border-white/10 bg-white/[0.04] text-white/80 hover:border-violet-400/50 hover:bg-violet-500/10';
          if (revealed) {
            if (isCorrect) tone = 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100';
            else if (isSelected) tone = 'border-red-400/60 bg-red-500/15 text-red-100';
            else tone = 'border-white/10 bg-white/[0.02] text-white/35';
          }

          return (
            <button
              key={i}
              type="button"
              disabled={revealed || isHidden}
              onClick={() => resolve(i)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-all active:scale-[0.99] ${tone} ${
                isHidden ? 'invisible' : ''
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/15 font-mono text-xs text-white/50">
                {LETTERS[i]}
              </span>
              <span className="flex-1">{option}</span>
            </button>
          );
        })}
      </div>

      {revealed && (
        <p className="text-center text-sm text-white/50">
          {selected === TIMED_OUT && 'Time is up. '}
          {selected === SKIPPED && 'Skipped. '}
          Press Enter to continue
        </p>
      )}

      {/* Lifelines */}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={fiftyFifty}
          disabled={revealed || fiftyUsed || !started}
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium transition-colors hover:bg-white/10 disabled:opacity-35"
        >
          50 / 50
        </button>
        <button
          type="button"
          onClick={freeze}
          disabled={revealed || freezeUsed || !started}
          className="flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-xs font-medium text-sky-200 transition-colors hover:bg-sky-500/20 disabled:opacity-35"
        >
          <Snowflake className="h-3.5 w-3.5" aria-hidden="true" />
          +{FREEZE_SECONDS}s
        </button>
        <button
          type="button"
          onClick={skip}
          disabled={revealed || skipUsed || !started}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium transition-colors hover:bg-white/10 disabled:opacity-35"
        >
          <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
          Skip
        </button>
      </div>
    </div>
  );
}
