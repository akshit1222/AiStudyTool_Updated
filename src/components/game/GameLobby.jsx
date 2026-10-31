import { useEffect, useState } from 'react';
import { Award, Lock, Play, Timer, Heart, Flame, Volume2, VolumeX, Zap } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { BADGES, GAME_LENGTHS, START_LIVES, QUESTION_SECONDS } from '../../libs/game.js';
import { isMuted, setMuted } from '../../libs/sound.js';
import ErrorBanner from '../ErrorBanner';
import Loader from '../Loader';
import Mascot from '../Mascot';

function StatsPanel({ stats }) {
  const level = stats?.level || 1;
  const pct = stats ? Math.min(100, Math.round((stats.xpIntoLevel / stats.xpForNext) * 100)) : 0;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-orange-400 font-display text-xl font-bold shadow-lg shadow-violet-900/40">
          {level}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-display text-base font-semibold">Level {level}</p>
            <p className="text-xs tabular-nums text-white/45">
              {stats ? `${stats.xpIntoLevel} / ${stats.xpForNext} XP` : '…'}
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-orange-400 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        {[
          ['Games', stats?.games ?? 0],
          ['Best score', (stats?.best ?? 0).toLocaleString()],
          ['Best streak', stats?.bestStreak ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white/[0.04] px-2 py-3">
            <p className="font-display text-lg font-semibold tabular-nums">{value}</p>
            <p className="text-[11px] text-white/45">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Badges({ stats }) {
  const s = stats || { games: 0, bestStreak: 0, perfectGames: 0, level: 1, best: 0 };
  return (
    <div className="glass rounded-2xl p-5">
      <p className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
        <Award className="h-4 w-4 text-amber-300" aria-hidden="true" />
        Badges
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {BADGES.map((b) => {
          const unlocked = b.test(s);
          return (
            <li
              key={b.id}
              className={`rounded-xl border px-3 py-3 transition-colors ${
                unlocked
                  ? 'border-amber-300/40 bg-amber-300/10'
                  : 'border-white/10 bg-white/[0.02] opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                {unlocked ? (
                  <Award className="h-4 w-4 text-amber-300" aria-hidden="true" />
                ) : (
                  <Lock className="h-4 w-4 text-white/40" aria-hidden="true" />
                )}
                <p className="text-sm font-medium">{b.name}</p>
              </div>
              <p className="mt-1 text-xs text-white/45">{b.desc}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function GameLobby({
  stats,
  nickname,
  onNickname,
  initialNotes,
  length,
  onLength,
  dailyStreak,
  onStart,
}) {
  const [muted, setMutedState] = useState(isMuted);
  const [source, setSource] = useState('notes');
  const [notes, setNotes] = useState(initialNotes || '');
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (source !== 'saved') return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingSaved(true);
    apiFetch('/api/quizzes')
      .then((list) => !cancelled && setSaved(list))
      .catch((err) => !cancelled && setError(err.message || 'Failed to load saved quizzes'))
      .finally(() => !cancelled && setLoadingSaved(false));
    return () => {
      cancelled = true;
    };
  }, [source]);

  const generate = async () => {
    setError(null);
    setGenerating(true);
    try {
      const questions = await apiFetch('/api/generate/quiz', {
        method: 'POST',
        body: JSON.stringify({ text: notes, count: length }),
      });
      onStart(questions);
    } catch (err) {
      setError(err.message || 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  if (generating) {
    return <Loader label="Building your game…" kind="game" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="glass relative overflow-hidden rounded-2xl p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />
        <Mascot mood="cheer" className="pointer-events-none absolute bottom-1 right-2 hidden h-36 w-36 sm:block" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-3xl font-semibold tracking-tight">Quiz Blitz</h1>
            <div className="flex items-center gap-2">
              {dailyStreak > 0 && (
                <span
                  className="flex items-center gap-1.5 rounded-full border border-orange-400/40 bg-orange-500/15 px-3 py-1.5 text-xs font-medium text-orange-200"
                  title="Days in a row you have played"
                >
                  <Flame className="h-3.5 w-3.5 animate-flame text-orange-400" aria-hidden="true" />
                  {dailyStreak}-day streak
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setMuted(!muted);
                  setMutedState(!muted);
                }}
                aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
                className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/60 transition-colors hover:text-white"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <p className="mt-2 max-w-md text-sm text-white/60">
            Answer questions from your own notes against the clock. Build a streak, climb the
            leaderboard, and level up.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
            <li className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5">
              <Timer className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" />
              {QUESTION_SECONDS}s per question
            </li>
            <li className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5">
              <Heart className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
              {START_LIVES} lives
            </li>
            <li className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5">
              <Flame className="h-3.5 w-3.5 text-orange-400" aria-hidden="true" />
              x1.5 at 3, x2 at 5, x3 at 7 streak
            </li>
            <li className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
              Faster answers score more
            </li>
          </ul>
        </div>
      </div>

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      <div className="glass rounded-2xl p-5">
        <p className="mb-3 text-sm font-medium">Game length</p>
        <div className="grid grid-cols-3 gap-2">
          {GAME_LENGTHS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onLength(g.id)}
              className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                length === g.id
                  ? 'border-violet-400/60 bg-violet-500/15'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/25'
              }`}
            >
              <span className="block text-sm font-medium">{g.label}</span>
              <span className="block text-[11px] text-white/45">{g.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="mb-4 flex rounded-full border border-white/10 bg-white/[0.04] p-1 sm:w-fit">
          {[
            ['notes', 'Use my notes'],
            ['saved', 'Saved quizzes'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSource(id)}
              className={`flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
                source === id ? 'bg-white text-neutral-950' : 'text-white/60 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {source === 'notes' && (
          <div className="flex flex-col gap-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="Paste the notes you want to be quizzed on…"
              className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white/85 outline-none transition-colors placeholder:text-white/30 focus:border-violet-500/50"
            />
            <button
              type="button"
              onClick={generate}
              disabled={generating || notes.trim().length === 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader size="sm" inline /> Building your game…
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" aria-hidden="true" /> Generate and play
                </>
              )}
            </button>
          </div>
        )}

        {source === 'saved' && (
          <div className="flex flex-col gap-2">
            {loadingSaved && <Loader label="Loading saved quizzes…" compact />}
            {!loadingSaved && saved.length === 0 && (
              <p className="py-6 text-center text-sm text-white/50">
                No saved quizzes yet. Generate a quiz from the Generate tab and save it, or use your notes here.
              </p>
            )}
            {saved.map((quiz) => (
              <button
                key={quiz._id}
                type="button"
                onClick={() => onStart(quiz.questions)}
                className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-violet-400/50 hover:bg-violet-500/10"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{quiz.title}</span>
                  <span className="text-xs text-white/45">{quiz.questions.length} questions</span>
                </span>
                <Play className="h-4 w-4 shrink-0 text-white/40 transition-colors group-hover:text-violet-300" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-5">
        <label htmlFor="nickname" className="text-sm font-medium">
          Leaderboard name
        </label>
        <p className="mt-1 text-xs text-white/45">
          Shown to other players. Leave blank to use a shortened version of your email.
        </p>
        <input
          id="nickname"
          type="text"
          value={nickname}
          maxLength={16}
          onChange={(e) => onNickname(e.target.value)}
          placeholder="e.g. QuizWiz"
          className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-white/30 focus:border-violet-500/50 sm:max-w-xs"
        />
      </div>

      <StatsPanel stats={stats} />
      <Badges stats={stats} />
    </div>
  );
}
