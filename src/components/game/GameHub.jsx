import { useState } from 'react';
import { Gamepad2, Trophy } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { prepareQuestions, readDailyStreak, readNickname, recordPlayDay, saveNickname } from '../../libs/game.js';
import ErrorBanner from '../ErrorBanner';
import GameLobby from './GameLobby';
import GameArena from './GameArena';
import GameResult from './GameResult';
import Leaderboard from './Leaderboard';

export default function GameHub({ stats, refreshStats, initialNotes }) {
  const [phase, setPhase] = useState('lobby'); // lobby | playing | result | leaderboard
  const [nickname, setNickname] = useState(readNickname);
  const [questions, setQuestions] = useState([]);
  const [rawQuestions, setRawQuestions] = useState([]);
  const [length, setLength] = useState(10);
  const [dailyStreak, setDailyStreak] = useState(() => readDailyStreak());
  const [result, setResult] = useState(null);
  const [submit, setSubmit] = useState({ status: 'idle' });
  const [error, setError] = useState(null);
  const [boardKey, setBoardKey] = useState(0);
  const [levelBefore, setLevelBefore] = useState(null);

  const handleNickname = (value) => {
    setNickname(value);
    saveNickname(value);
  };

  const start = (raw, length) => {
    const prepared = prepareQuestions(raw, length);
    if (prepared.length === 0) {
      setError('No playable questions were found. Try different notes or another quiz.');
      return;
    }
    setError(null);
    setRawQuestions(raw);
    setQuestions(prepared);
    setLevelBefore(stats?.level ?? null);
    setPhase('playing');
  };

  const finish = async (res) => {
    setResult(res);
    setPhase('result');
    setDailyStreak(recordPlayDay());

    if (res.score <= 0) {
      setSubmit({ status: 'idle' });
      return;
    }

    setSubmit({ status: 'saving' });
    try {
      const data = await apiFetch('/api/game/scores', {
        method: 'POST',
        body: JSON.stringify({
          score: res.score,
          correct: res.correct,
          total: res.total,
          maxStreak: res.maxStreak,
          nickname: nickname.trim(),
        }),
      });
      setSubmit({ status: 'done', data });
      setBoardKey((k) => k + 1);
      refreshStats();
    } catch (err) {
      setSubmit({ status: 'error', error: err.message || 'Request failed' });
    }
  };

  const showTabs = phase === 'lobby' || phase === 'leaderboard';

  return (
    <div className="flex flex-col gap-6">
      {showTabs && (
        <div className="flex gap-2">
          {[
            ['lobby', 'Play', Gamepad2],
            ['leaderboard', 'Leaderboard', Trophy],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPhase(id)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                phase === id
                  ? 'border-violet-400/60 bg-violet-500/15 text-white'
                  : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      )}

      {phase !== 'playing' && (
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
      )}

      {phase === 'lobby' && (
        <GameLobby
          stats={stats}
          nickname={nickname}
          onNickname={handleNickname}
          initialNotes={initialNotes}
          length={length}
          onLength={setLength}
          dailyStreak={dailyStreak}
          onStart={(raw) => start(raw, length)}
        />
      )}

      {phase === 'playing' && (
        <GameArena
          key={questions.map((q) => q.question).join('|')}
          questions={questions}
          onFinish={finish}
          onExit={() => setPhase('lobby')}
        />
      )}

      {phase === 'result' && result && (
        <GameResult
          result={result}
          submit={submit}
          levelBefore={levelBefore}
          onPlayAgain={() => start(rawQuestions, length)}
          onLeaderboard={() => setPhase('leaderboard')}
          onExit={() => setPhase('lobby')}
        />
      )}

      {phase === 'leaderboard' && <Leaderboard refreshKey={boardKey} />}
    </div>
  );
}
