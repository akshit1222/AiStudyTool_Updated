import { useCallback, useEffect, useState } from 'react';
import { Crown, Medal, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../services/api';
import ErrorBanner from '../ErrorBanner';

const PERIODS = [
  { id: 'all', label: 'All time' },
  { id: 'week', label: 'This week' },
];

function Podium({ entries }) {
  // Visual order: 2nd, 1st, 3rd
  const order = [entries[1], entries[0], entries[2]];
  const heights = ['h-24', 'h-32', 'h-20'];
  const tones = [
    'from-slate-300/25 to-slate-300/5 border-slate-300/30',
    'from-amber-300/30 to-amber-300/5 border-amber-300/40',
    'from-orange-400/25 to-orange-400/5 border-orange-400/30',
  ];

  return (
    <div className="grid grid-cols-3 items-end gap-3">
      {order.map((entry, col) => (
        <div key={col} className="flex flex-col items-center gap-2">
          {entry ? (
            <>
              {entry.rank === 1 ? (
                <Crown className="h-6 w-6 text-amber-300" aria-hidden="true" />
              ) : (
                <Medal
                  className={`h-5 w-5 ${entry.rank === 2 ? 'text-slate-300' : 'text-orange-400'}`}
                  aria-hidden="true"
                />
              )}
              <p className="max-w-full truncate text-sm font-medium">
                {entry.nickname}
                {entry.isYou && <span className="ml-1 text-xs text-violet-300">(you)</span>}
              </p>
              <p className="font-display text-sm font-semibold tabular-nums text-white/80">
                {entry.score.toLocaleString()}
              </p>
            </>
          ) : (
            <div className="h-14" />
          )}
          <div
            className={`flex w-full items-start justify-center rounded-t-xl border border-b-0 bg-gradient-to-b pt-2 font-display text-lg font-bold text-white/70 ${heights[col]} ${tones[col]}`}
          >
            {entry ? entry.rank : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ entry }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        entry.isYou
          ? 'border-violet-400/50 bg-violet-500/10'
          : 'border-white/10 bg-white/[0.03]'
      }`}
    >
      <span className="w-7 font-display text-sm font-semibold tabular-nums text-white/50">
        {entry.rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {entry.nickname}
          {entry.isYou && <span className="ml-2 text-xs text-violet-300">you</span>}
        </p>
        <p className="text-xs text-white/40">
          {entry.correct}/{entry.total} correct · streak {entry.maxStreak} · {entry.games}{' '}
          {entry.games === 1 ? 'game' : 'games'}
        </p>
      </div>
      <p className="font-display text-base font-semibold tabular-nums">
        {entry.score.toLocaleString()}
      </p>
    </li>
  );
}

export default function Leaderboard({ refreshKey = 0 }) {
  const [period, setPeriod] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await apiFetch(`/api/game/leaderboard?period=${period}`));
    } catch (err) {
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, refreshKey]);

  const entries = data?.entries || [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const youOutside = data?.you && data.you.rank > entries.length ? data.you : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                period === p.id ? 'bg-white text-neutral-950' : 'text-white/60 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60 transition-colors hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <ErrorBanner error={error} onDismiss={() => setError(null)} onRetry={load} />

      {loading && !data && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.05]" />
          ))}
        </div>
      )}

      {!loading && data && entries.length === 0 && (
        <div className="glass rounded-2xl px-6 py-12 text-center">
          <Crown className="mx-auto h-8 w-8 text-amber-300" aria-hidden="true" />
          <p className="mt-3 font-display text-lg font-semibold">No scores yet</p>
          <p className="mt-1 text-sm text-white/50">
            {period === 'week'
              ? 'Nobody has played this week. Post the first score.'
              : 'Play a round of Quiz Blitz to claim the top spot.'}
          </p>
        </div>
      )}

      {entries.length > 0 && (
        <>
          <div className="glass rounded-2xl px-4 pt-6">
            <Podium entries={top3} />
          </div>
          {rest.length > 0 && (
            <ol className="flex flex-col gap-2">
              {rest.map((e) => (
                <Row key={e.rank} entry={e} />
              ))}
            </ol>
          )}
          {youOutside && (
            <div className="flex flex-col gap-2">
              <p className="text-center text-xs text-white/40">Your position</p>
              <ol>
                <Row entry={youOutside} />
              </ol>
            </div>
          )}
          <p className="text-center text-xs text-white/35">
            {data.totalPlayers} {data.totalPlayers === 1 ? 'player' : 'players'} ranked by best single game
          </p>
        </>
      )}
    </div>
  );
}
