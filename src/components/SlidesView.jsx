import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Presentation } from 'lucide-react';
import { apiFetch } from '../services/api';
import { buildPptx, slugify } from '../libs/buildPptx.js';
import { toPngDataUrl } from '../libs/imageUtils.js';
import ErrorBanner from './ErrorBanner';
import Loader from './Loader';
import MascotTip from './MascotTip';

function SlidePreview({ outline, index, image }) {
  const isTitle = index === 0;
  const slide = isTitle ? null : outline.slides[index - 1];

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b0a14] shadow-2xl shadow-violet-950/40"
      style={{ containerType: 'inline-size' }}
    >
      {isTitle ? (
        <>
          <div className="absolute right-[8%] top-[18%] h-[52cqw] w-[52cqw] max-h-[70%] max-w-[44%] rounded-full bg-violet-600/50" />
          <div className="absolute right-[6%] top-[42%] h-[30cqw] w-[30cqw] max-h-[44%] max-w-[26%] rounded-full bg-orange-500/50" />
          <div className="absolute left-[6%] top-[26%] w-[56%]">
            <h2 className="font-display font-bold leading-tight" style={{ fontSize: '5cqw' }}>
              {outline.title}
            </h2>
            {outline.subtitle && (
              <p className="mt-[2cqw] text-white/60" style={{ fontSize: '2.2cqw' }}>
                {outline.subtitle}
              </p>
            )}
          </div>
          <p className="absolute bottom-[4%] left-[6%] text-violet-300" style={{ fontSize: '1.3cqw' }}>
            Made with StudyForge
          </p>
        </>
      ) : (
        <>
          <div className="absolute left-[6%] top-[8%] flex items-center gap-[1.6cqw]">
            <span
              className="flex items-center justify-center rounded-full bg-violet-600 font-bold"
              style={{ width: '5.4cqw', height: '5.4cqw', fontSize: '2.2cqw' }}
            >
              {index}
            </span>
            <h2 className="font-display font-bold" style={{ fontSize: '3.4cqw' }}>
              {slide.title}
            </h2>
          </div>
          <ul
            className="absolute left-[6%] top-[28%] flex flex-col gap-[1.6cqw]"
            style={{ width: image ? '48%' : '56%', fontSize: '2.3cqw' }}
          >
            {slide.bullets.map((b, i) => (
              <li key={i} className="flex gap-[1.2cqw] leading-snug text-white/90">
                <span className="mt-[0.9cqw] h-[0.8cqw] w-[0.8cqw] shrink-0 rounded-full bg-fuchsia-400" />
                {b}
              </li>
            ))}
          </ul>
          {image ? (
            <div className="absolute right-[5%] top-[26%] w-[37%] overflow-hidden rounded-xl border border-violet-500/60 bg-[#161227]">
              <img src={image} alt="" className="aspect-video w-full object-cover" />
            </div>
          ) : (
            <>
              <div className="absolute right-[8%] top-[30%] h-[28cqw] w-[28cqw] max-h-[56%] max-w-[30%] rounded-full bg-violet-600/45" />
              <div className="absolute right-[5%] top-[52%] h-[16cqw] w-[16cqw] max-h-[34%] max-w-[18%] rounded-full bg-orange-500/45" />
            </>
          )}
          <p className="absolute bottom-[4%] left-[6%] text-violet-300" style={{ fontSize: '1.2cqw' }}>
            {outline.title}
          </p>
        </>
      )}
    </div>
  );
}

export default function SlidesView({ initialText, onBack }) {
  const [outline, setOutline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(0);
  const [withPictures, setWithPictures] = useState(false);
  const [images, setImages] = useState({}); // content slide index -> data URL
  const [pending, setPending] = useState(0);
  const [building, setBuilding] = useState(false);
  const [runId, setRunId] = useState(0);
  const requested = useRef(new Set());

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      setOutline(null);
      setImages({});
      setCurrent(0);
      requested.current = new Set();
      try {
        const data = await apiFetch('/api/generate/slides', {
          method: 'POST',
          body: JSON.stringify({ text: initialText }),
        });
        if (active) setOutline(data);
      } catch (err) {
        if (active) setError(err.message || 'Failed to generate slides');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [initialText, runId]);

  const loadPictures = useCallback(async (data) => {
    data.slides.forEach((slide, i) => {
      if (requested.current.has(i)) return;
      requested.current.add(i);
      setPending((n) => n + 1);
      apiFetch('/api/generate/visuals/image', {
        method: 'POST',
        body: JSON.stringify({ title: slide.title, prompt: slide.imagePrompt || slide.title }),
      })
        .then((res) => setImages((prev) => ({ ...prev, [i]: res.image })))
        .catch(() => {
          requested.current.delete(i); // allow another attempt by toggling
        })
        .finally(() => setPending((n) => n - 1));
    });
  }, []);

  const togglePictures = (checked) => {
    setWithPictures(checked);
    if (checked && outline) loadPictures(outline);
  };

  const download = async () => {
    setBuilding(true);
    setError(null);
    try {
      const { default: PptxGenJS } = await import('pptxgenjs');
      const ready = {};
      if (withPictures) {
        for (const [key, value] of Object.entries(images)) {
          ready[key] = await toPngDataUrl(value);
        }
      }
      const pptx = buildPptx(new PptxGenJS(), outline, ready);
      await pptx.writeFile({ fileName: `${slugify(outline.title)}.pptx` });
    } catch (err) {
      setError(err.message || 'Could not build the PowerPoint file');
    } finally {
      setBuilding(false);
    }
  };

  const total = outline ? outline.slides.length + 1 : 0;
  const picturesLoading = withPictures && pending > 0;

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm text-white/50 transition-colors hover:text-white"
      >
        ← Back to Notes
      </button>

      <MascotTip mood={loading ? 'thinking' : 'cheer'} accent="orange">
        {loading ? 'Planning your slides…' : 'Your deck is ready! Flip through it, then download.'}
      </MascotTip>

      <div className="flex flex-col gap-2">
        <h1 className="flex items-center gap-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          <Presentation className="h-7 w-7 text-orange-300" aria-hidden="true" />
          Slides from your notes
        </h1>
        <p className="text-sm text-white/55">
          A short deck you can present or edit in PowerPoint, Keynote or Google Slides.
        </p>
      </div>

      <ErrorBanner error={error} onDismiss={() => setError(null)} onRetry={() => setRunId((n) => n + 1)} />

      {loading && <Loader label="Building your slides…" kind="slides" />}

      {outline && (
        <>
          <SlidePreview
            outline={outline}
            index={current}
            image={current > 0 && withPictures ? images[current - 1] : null}
          />

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              aria-label="Previous slide"
              className="rounded-full border border-white/15 bg-white/5 p-2 transition-colors hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="flex flex-wrap justify-center gap-1.5">
              {Array.from({ length: total }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === current ? 'w-6 bg-violet-400' : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
              disabled={current === total - 1}
              aria-label="Next slide"
              className="rounded-full border border-white/15 bg-white/5 p-2 transition-colors hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {current > 0 && outline.slides[current - 1].notes && (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
              <span className="text-white/40">Speaker note: </span>
              {outline.slides[current - 1].notes}
            </p>
          )}

          <label className="glass flex cursor-pointer items-start gap-3 rounded-2xl p-4">
            <input
              type="checkbox"
              checked={withPictures}
              onChange={(e) => togglePictures(e.target.checked)}
              className="mt-1 h-4 w-4 accent-violet-500"
            />
            <span>
              <span className="block text-sm font-medium">Add AI pictures to the slides</span>
              <span className="block text-xs text-white/50">
                Slower: one picture is drawn for each slide.
                {picturesLoading && ` Drawing… ${outline.slides.length - pending}/${outline.slides.length} done`}
              </span>
            </span>
          </label>

          <button
            type="button"
            onClick={download}
            disabled={building || picturesLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {building ? 'Building file…' : picturesLoading ? 'Waiting for pictures…' : 'Download PowerPoint (.pptx)'}
          </button>
        </>
      )}
    </div>
  );
}
