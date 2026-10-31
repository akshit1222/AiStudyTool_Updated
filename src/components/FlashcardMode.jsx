import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, RotateCcw, Trophy, Save, X, Sparkles, Star } from 'lucide-react';
import { useFlashcards } from '../hooks/useFlashcards';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../services/api';
import { LABEL_CLASS } from '../libs/theme.js';
import ErrorBanner from './ErrorBanner';
import ProgressBar from './ProgressBar';
import Loader from './Loader';
import Mascot from './Mascot';
import MascotTip from './MascotTip';

function Stat({ value, label }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xl font-semibold">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </p>
    </div>
  );
}

export default function FlashcardMode({ initialText, savedData, savedCards, onBack, onBackToGenerate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'success'
  const {
    cards,
    currentIndex,
    flipped,
    known,
    loading,
    error,
    isComplete,
    loadCards,
    loadReviewCards,
    flip,
    markKnown,
    markReview,
    setCardsFromSaved,
    setError,
  } = useFlashcards();

  const [sessionKnown, setSessionKnown] = useState(0);
  const [totalCards, setTotalCards] = useState(0);

  useEffect(() => {
    if (savedCards) {
      setCardsFromSaved(savedCards);
    } else if (savedData) {
      setCardsFromSaved(savedData);
    } else if (initialText) {
      loadCards(initialText);
    }
  }, [initialText, savedData, savedCards, loadCards, setCardsFromSaved]);

  useEffect(() => {
    if (isComplete && sessionKnown === 0 && cards.length > 0) {
      setSessionKnown(known.size);
      setTotalCards(cards.length);
    }
  }, [isComplete, sessionKnown, known.size, cards.length]);

  const handleReviewMissed = () => {
    setSessionKnown(known.size);
    setTotalCards(cards.length);
    loadReviewCards();
    setSessionKnown(0);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaveStatus('saving');
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const title = saveTitle.trim() || `Untitled Flashcards - ${today}`;

    try {
      await apiFetch('/api/flashcards', {
        method: 'POST',
        body: JSON.stringify({
          title,
          cards: cards.map(card => ({ question: card.question, answer: card.answer })),
        }),
      });
      setSaveStatus('success');
      if (onBackToGenerate) {
        onBackToGenerate();
      }
      setTimeout(() => {
        setSaveStatus('idle');
        setShowSaveForm(false);
        setSaveTitle('');
      }, 2000);
    } catch (err) {
      setSaveStatus('idle');
      setError(err.message || 'Failed to save flashcards');
    }
  };

  if (loading) {
    return <Loader label="Generating flashcards…" />;
  }

  if (isComplete) {
    const knownCount = sessionKnown || known.size;
    const reviewCount = (totalCards || cards.length) - knownCount;

    return (
      <div className="flex flex-col gap-6">
        {!savedCards && (
          <button
            type="button"
            onClick={onBack}
            className="self-start text-sm text-white/50 transition-colors hover:text-white"
          >
            ← Back to Notes
          </button>
        )}

        <div className="flex flex-col items-center gap-6 py-10 text-center">
          <Mascot mood="cheer" className="h-44 w-44" />
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
            <Trophy className="h-7 w-7 text-violet-400" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">You&apos;re done!</h2>
            <p className="mt-1 text-sm text-white/50">
              You reviewed all {totalCards || cards.length} cards.
            </p>
          </div>
          <div className="grid w-full max-w-sm grid-cols-2 gap-3">
            <Stat value={`${knownCount}`} label="Known" />
            <Stat value={`${reviewCount}`} label="To review" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            {reviewCount > 0 && (
              <button
                type="button"
                onClick={handleReviewMissed}
                className="flex-1 rounded-md border border-orange-500/30 bg-orange-500/10 py-3 text-sm font-medium text-orange-200 transition-colors hover:bg-orange-500/20 active:scale-[0.98]"
              >
                Review Missed
              </button>
            )}
            {!savedCards && (
              <button
                type="button"
                onClick={() => loadCards(initialText)}
                className="flex-1 rounded-md bg-violet-600 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-500 active:scale-[0.98]"
              >
                Start Over
              </button>
            )}
            {!savedCards && (
              <button
                type="button"
                onClick={onBack}
                className="flex-1 rounded-md border border-white/15 bg-white/5 py-3 text-sm font-medium transition-colors hover:bg-white/10 active:scale-[0.98]"
              >
                Back to Notes
              </button>
            )}
          </div>

          {/* Save section */}
          <div className="w-full max-w-sm">
            {!user ? (
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                Log in to save
              </Link>
            ) : showSaveForm ? (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="Untitled Flashcards - 7/5/2026"
                    className="flex-1 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-500/50 focus:bg-violet-500/[0.04]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveForm(false);
                      setSaveTitle('');
                    }}
                    className="rounded-md border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10"
                  >
                    <X className="h-4 w-4 text-white/60" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveStatus === 'saving' ? 'Saving...' : 'Save'}
                </button>
              </div>
            ) : saveStatus === 'success' ? (
              <div className="flex items-center justify-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
                <Check className="h-4 w-4" />
                Saved
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSaveForm(true)}
                className="flex items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 active:scale-[0.98]"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  if (!currentCard) {
    return (
      <div className="flex flex-col gap-6">
        {!savedCards && (
          <button
            type="button"
            onClick={onBack}
            className="self-start text-sm text-white/50 transition-colors hover:text-white"
          >
            ← Back to Notes
          </button>
        )}
        <ErrorBanner
          error={error || 'No flashcards generated'}
          onDismiss={() => setError(null)}
          onRetry={!savedCards ? () => loadCards(initialText) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {!savedCards && (
        <button
          type="button"
          onClick={onBack}
          className="self-start text-sm text-white/50 transition-colors hover:text-white"
        >
          ← Back to Notes
        </button>
      )}

      <ErrorBanner
        error={error}
        onDismiss={() => setError(null)}
        onRetry={!savedCards ? () => loadCards(initialText) : undefined}
      />

      <MascotTip mood={flipped ? 'happy' : 'reading'} accent="fuchsia">
        {flipped ? 'Did you remember it? Be honest with yourself!' : 'Read the question, think, then tap the card to flip it.'}
      </MascotTip>

      <ProgressBar
        current={currentIndex + 1}
        total={cards.length}
        known={known.size}
      />

      <div className="relative isolate mb-4">
        <div className="absolute inset-x-3 -bottom-1.5 top-2 -z-10 rotate-[1.2deg] rounded-2xl border border-white/10 bg-violet-500/10" aria-hidden="true" />
        <div className="absolute inset-x-6 -bottom-3 top-4 -z-20 -rotate-[1.2deg] rounded-2xl border border-white/10 bg-fuchsia-500/10" aria-hidden="true" />
      <button
        type="button"
        onClick={flip}
        aria-label="Flip card"
        className="relative flex min-h-64 w-full flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-8 text-center backdrop-blur-xl transition-all hover:border-white/20 active:scale-[0.99]"
        style={{ perspective: '1000px' }}
      >
        <Sparkles className="absolute left-4 top-4 h-4 w-4 animate-pulse text-fuchsia-300/60" aria-hidden="true" />
        <Star className="absolute right-5 top-5 h-4 w-4 rotate-12 text-amber-300/50" aria-hidden="true" />
        <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_100%_100%,rgba(139,92,246,0.22),transparent_55%)]" aria-hidden="true" />
        <span className={LABEL_CLASS}>{flipped ? 'Answer' : 'Question'}</span>
        <p
          className={`text-balance max-w-lg ${
            flipped
              ? 'text-lg font-normal text-violet-200'
              : 'text-xl font-semibold sm:text-2xl'
          }`}
        >
          {flipped ? currentCard.answer : currentCard.question}
        </p>
        <span className="absolute bottom-4 font-mono text-[10px] uppercase tracking-widest text-white/30">
          {flipped ? 'Tap to see question' : 'Click to flip'}
        </span>
      </button>
      </div>

      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={markReview}
            className="flex items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 py-3 text-sm font-medium transition-colors hover:bg-white/10 active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            ↩ Review Again
          </button>
          <button
            type="button"
            onClick={markKnown}
            className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-500 active:scale-[0.98]"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            ✓ Got it
          </button>
        </div>
      )}
    </div>
  );
}
