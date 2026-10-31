import { useCallback, useEffect, useState } from 'react';
import { Download, ImageIcon, RefreshCw, Sparkles } from 'lucide-react';
import { apiFetch } from '../services/api';
import { downloadDataUrl, extensionFor, toPngDataUrl } from '../libs/imageUtils.js';
import { slugify } from '../libs/buildPptx.js';
import ErrorBanner from './ErrorBanner';
import Loader from './Loader';
import MascotTip from './MascotTip';

function PictureCard({ item, onRedraw }) {
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const png = await toPngDataUrl(item.image);
      downloadDataUrl(png, `${slugify(item.title)}.${item.kind === 'svg' ? 'png' : extensionFor(item.image)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="glass overflow-hidden rounded-2xl">
      <div className="relative aspect-video bg-white/[0.03]">
        {item.status === 'done' && item.image && (
          <img src={item.image} alt={item.prompt} className="h-full w-full object-cover" />
        )}
        {item.status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-hidden">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-orange-400/10" />
            <Sparkles className="relative h-6 w-6 animate-pulse text-violet-300" aria-hidden="true" />
            <p className="relative text-xs text-white/50">Drawing this one…</p>
          </div>
        )}
        {item.status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-sm text-red-300">{item.error || 'This picture failed'}</p>
            <button
              type="button"
              onClick={onRedraw}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs transition-colors hover:bg-white/10"
            >
              Try again
            </button>
          </div>
        )}
        {item.status === 'done' && item.kind === 'svg' && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white/70 backdrop-blur">
            Drawn diagram
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-base font-semibold">{item.title}</h3>
          {item.caption && <p className="mt-1 text-sm text-white/55">{item.caption}</p>}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={item.status !== 'done' || saving}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-white/10 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {saving ? 'Saving…' : 'Download'}
          </button>
          <button
            type="button"
            onClick={onRedraw}
            disabled={item.status === 'loading'}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-white/10 disabled:opacity-40"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Redraw
          </button>
        </div>
      </div>
    </article>
  );
}

export default function VisualsView({ initialText, onBack }) {
  const [items, setItems] = useState([]);
  const [planning, setPlanning] = useState(true);
  const [error, setError] = useState(null);
  const [runId, setRunId] = useState(0);

  const patch = useCallback((index, changes) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...changes } : it)));
  }, []);

  const drawImage = useCallback(
    async (index, item, variation = 0) => {
      patch(index, { status: 'loading', error: null });
      try {
        const result = await apiFetch('/api/generate/visuals/image', {
          method: 'POST',
          body: JSON.stringify({
            title: item.title,
            prompt: variation ? `${item.prompt} (a different take, version ${variation})` : item.prompt,
          }),
        });
        patch(index, { image: result.image, kind: result.kind, status: 'done' });
      } catch (err) {
        patch(index, { status: 'error', error: err.message || 'Failed to draw this picture' });
      }
    },
    [patch]
  );

  useEffect(() => {
    let active = true;

    (async () => {
      setPlanning(true);
      setError(null);
      setItems([]);
      try {
        const plan = await apiFetch('/api/generate/visuals/plan', {
          method: 'POST',
          body: JSON.stringify({ text: initialText, count: 4 }),
        });
        if (!active) return;
        const next = plan.items.map((it) => ({ ...it, status: 'loading', image: null, kind: null, variation: 0 }));
        setItems(next);
        setPlanning(false);
        // Pictures appear one by one as each finishes
        next.forEach((it, i) => drawImage(i, it));
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to plan pictures');
        setPlanning(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [initialText, drawImage, runId]);

  const redraw = (index) => {
    const item = items[index];
    const variation = (item.variation || 0) + 1;
    patch(index, { variation });
    drawImage(index, item, variation);
  };

  const usingDiagrams = items.some((i) => i.kind === 'svg');

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm text-white/50 transition-colors hover:text-white"
      >
        ← Back to Notes
      </button>

      <MascotTip mood={planning ? 'thinking' : 'happy'} accent="fuchsia">
        {planning ? 'Let me find the ideas that are worth drawing…' : 'Ta-da! Download your favourites or redraw any of them.'}
      </MascotTip>

      <div className="flex flex-col gap-2">
        <h1 className="flex items-center gap-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          <ImageIcon className="h-7 w-7 text-fuchsia-300" aria-hidden="true" />
          Pictures from your notes
        </h1>
        <p className="text-sm text-white/55">
          AI picks the ideas that are easiest to remember visually and draws one picture for each.
        </p>
      </div>

      <ErrorBanner error={error} onDismiss={() => setError(null)} onRetry={() => setRunId((n) => n + 1)} />

      {planning && <Loader label="Finding the ideas worth drawing…" kind="pictures" />}

      {items.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          {items.map((item, i) => (
            <PictureCard key={i} item={item} onRedraw={() => redraw(i)} />
          ))}
        </div>
      )}

      {usingDiagrams && (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/50">
          Your Gemini key could not use an image model, so these were drawn as diagrams instead. To get
          full AI images, enable billing for the key in Google AI Studio and set GEMINI_IMAGE_MODEL in
          backend/.env.
        </p>
      )}
    </div>
  );
}
