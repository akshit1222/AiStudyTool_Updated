import { useEffect } from 'react';
import { Crown, TrendingUp } from 'lucide-react';
import { sfx } from '../../libs/sound.js';
import Confetti from './Confetti';
import Loader from '../Loader';
import Mascot from '../Mascot';

function Stat({ label, value }) {
  return (
    <div className="glass rounded-xl px-4 py-3 text-center">
      <p className="font-display text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] text-white/45">{label}</p>
    </div>
  );
}

export default function GameResult({
  result,
  submit,
  levelBefore,
  onPlayAgain,
  onLeaderboard,
  onExit,
}) {
  const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const celebrate = result.score > 0 && accuracy >= 70;

  useEffect(() => {
    if (celebrate) sfx.win();
    else sfx.lose();
  }, [celebrate]);
  const leveledUp = submit.data && levelBefore && submit.data.level > levelBefore;
  const headline =
    result.livesLeft === 0
      ? 'Out of lives'
      : accuracy === 100
        ? 'Flawless run'
        : accuracy >= 70
          ? 'Strong run'
          : 'Round complete';

  return (
    <div className="flex flex-col gap-6">
      {celebrate && <Confetti />}

      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <Mascot mood={celebrate ? 'cheer' : 'oops'} className="h-40 w-40" />
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">{headline}</h2>
        <p className="font-display text-5xl font-bold tabular-nums text-gradient">
          {result.score.toLocaleString()}
        </p>
        <p className="text-sm text-white/50">points</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Correct" value={`${result.correct}/${result.total}`} />
        <Stat label="Best streak" value={result.maxStreak} />
      </div>

      {/* Server result: rank and XP */}
      <div className="glass rounded-2xl p-5">
        {result.score === 0 && (
          <p className="text-center text-sm text-white/60">
            No points this time, so nothing was added to the leaderboard. Try another round.
          </p>
        )}
        {result.score > 0 && submit.status === 'saving' && (
          <Loader label="Saving your score…" compact />
        )}
        {result.score > 0 && submit.status === 'error' && (
          <p className="text-center text-sm text-red-300">
            Your score could not be saved: {submit.error}
          </p>
        )}
        {submit.status === 'done' && submit.data && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="flex items-center gap-2 text-sm text-white/70">
              <Crown className="h-4 w-4 text-amber-300" aria-hidden="true" />
              You rank <span className="font-semibold text-white">#{submit.data.rank}</span> on the leaderboard
            </p>
            <p className="flex items-center gap-2 text-sm text-white/70">
              <TrendingUp className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              <span className="font-semibold text-white">+{submit.data.xpEarned} XP</span> earned
            </p>
            {leveledUp && (
              <p className="animate-pop rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-1.5 text-sm font-medium text-amber-200">
                Level up! You are now level {submit.data.level}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onPlayAgain}
          className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white transition-all active:scale-[0.98]"
        >
          Play again
        </button>
        <button
          type="button"
          onClick={onLeaderboard}
          className="flex-1 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-medium transition-colors hover:bg-white/10 active:scale-[0.98]"
        >
          View leaderboard
        </button>
        <button
          type="button"
          onClick={onExit}
          className="flex-1 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-medium transition-colors hover:bg-white/10 active:scale-[0.98]"
        >
          Change source
        </button>
      </div>
    </div>
  );
}
