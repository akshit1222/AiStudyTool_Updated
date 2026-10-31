import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Save, Sparkles, X } from 'lucide-react';
import { useSummary } from '../hooks/useSummary';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../services/api';
import { LABEL_CLASS } from '../libs/theme.js';
import ErrorBanner from './ErrorBanner';
import Loader from './Loader';
import MascotTip from './MascotTip';

const CHIPS = ['bg-violet-500', 'bg-fuchsia-500', 'bg-orange-500', 'bg-sky-500', 'bg-emerald-500', 'bg-rose-500'];

export default function SummaryView({ initialText, savedData, onBack, onBackToGenerate }) {
  const { user } = useAuth();
  const { summary, loading, error, loadSummary, setSummaryFromSaved, setError } = useSummary();
  const [copied, setCopied] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'success'

  useEffect(() => {
  if (savedData) {
    setSummaryFromSaved(savedData);
  } else if (initialText) {
    loadSummary(initialText);
  }
}, [initialText, savedData, loadSummary, setSummaryFromSaved]);

  const bullets = summary
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('•'));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaveStatus('saving');
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const title = saveTitle.trim() || `Untitled Summary - ${today}`;

    try {
      await apiFetch('/api/summaries', {
        method: 'POST',
        body: JSON.stringify({
          title,
          content: summary,
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
      setError(err.message || 'Failed to save summary');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm text-white/50 transition-colors hover:text-white"
      >
        ← Back to Notes
      </button>

      <ErrorBanner
        error={error}
        onDismiss={() => setError(null)}
        onRetry={() => loadSummary(initialText)}
      />

      {!loading && (
        <MascotTip mood={copied ? 'happy' : 'reading'} accent="teal">
          {copied ? 'Copied! Paste it anywhere you like.' : 'Here is the short version. Copy it or save it for later!'}
        </MascotTip>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <span className={LABEL_CLASS}>Step 03 · Output</span>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            📋 Summary
          </h1>
        </div>
        {summary && !loading && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 active:scale-[0.98]"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      {loading ? (
        <Loader label="Generating summary…" kind="summary" />
      ) : (
        <div className="ruled relative rounded-2xl border border-white/10 bg-white/[0.035] p-6 pt-8">
          <span className="absolute -top-3 left-8 h-6 w-24 -rotate-3 rounded-sm bg-amber-300/40 shadow" aria-hidden="true" />
          <span className="absolute -top-3 right-10 h-6 w-16 rotate-2 rounded-sm bg-fuchsia-300/35 shadow" aria-hidden="true" />
          <Sparkles className="absolute bottom-3 right-4 h-5 w-5 animate-pulse text-fuchsia-300/40" aria-hidden="true" />
          {bullets.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {bullets.map((line, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-white/85">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#1e1b4b] font-display text-xs font-bold text-white shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] ${CHIPS[i % CHIPS.length]}`}
                  >
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{line.replace(/^•\s*/, '')}</span>
                </li>
              ))}
            </ul>
          ) : summary ? (
            <p className="text-sm leading-relaxed text-white/75 whitespace-pre-wrap">{summary}</p>
          ) : null}
        </div>
      )}

      {/* Save section */}
      {summary && !loading && (
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
                  placeholder="Untitled Summary - 7/5/2026"
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
      )}
    </div>
  );
}
