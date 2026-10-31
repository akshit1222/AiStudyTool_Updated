import { useState, useRef } from 'react';
import { ClipboardList, FileText, ImageIcon, Presentation, Upload, Zap } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { LABEL_CLASS } from '../libs/theme.js';
import Loader from './Loader';
import MascotTip from './MascotTip';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

const SAMPLE_NOTES = `Photosynthesis is the process plants use to turn light energy into chemical energy stored in sugar. It happens in the chloroplasts, which contain the green pigment chlorophyll.

The light-dependent reactions take place in the thylakoid membranes. Chlorophyll absorbs sunlight, water is split into oxygen and hydrogen ions, and the energy is stored as ATP and NADPH. Oxygen is released as a by-product.

The Calvin cycle takes place in the stroma. It uses ATP and NADPH to fix carbon dioxide into glucose. This stage does not need light directly, but it depends on the products of the light reactions.

The overall equation is 6CO2 + 6H2O + light energy -> C6H12O6 + 6O2. Factors that affect the rate of photosynthesis include light intensity, carbon dioxide concentration and temperature.`;

function ActionButton({ icon: Icon, title, desc, accent, disabled, loading, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-violet-500/50 hover:bg-violet-500/[0.06] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:bg-white/[0.03]"
    >
      <div
        className={`rounded-md p-2 transition-colors group-hover:text-white ${accent}`}
      >
        {loading ? (
          <Loader size="sm" inline />
        ) : (
          <Icon className="h-4 w-4" aria-hidden="true" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-white/40">{loading ? 'Generating…' : desc}</p>
      </div>
    </button>
  );
}

export default function NotesInput({
  onFlashcards,
  onQuiz,
  onSummary,
  onVisuals,
  onSlides,
  loadingFlashcards = false,
  loadingQuiz = false,
  loadingSummary = false,
  initialText = '',
}) {
  const [text, setText] = useState(initialText);
  const [filename, setFilename] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handlePdfUpload = async (e) => {
    const file = e.target?.files?.[0] ?? e;
    if (!file || typeof file.arrayBuffer !== 'function') return;
    if (file.type && file.type !== 'application/pdf' && !file.name?.toLowerCase().endsWith('.pdf')) {
      setUploadError('Please choose a PDF file.');
      return;
    }

    setUploadError('');

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File exceeds 20MB limit. Please upload a smaller PDF.');
      return;
    }

    setPdfLoading(true);
    setFilename(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(' ');
        pages.push(pageText);
      }

      const extracted = pages.join('\n');

      if (!extracted || extracted.trim().length < 50) {
        setUploadError(
          "Could not extract text. Make sure it's a text-based PDF, not a scanned or image-only PDF."
        );
        setFilename('');
        return;
      }

      setText(extracted);
    } catch {
      setUploadError('Failed to read PDF. Please try another file.');
      setFilename('');
    } finally {
      setPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isEmpty = text.trim().length === 0;

  return (
    <div className="flex flex-col gap-6">
      <MascotTip mood={isEmpty ? 'idle' : 'happy'}>
        {isEmpty ? 'Paste your notes or drop a PDF. I will do the rest!' : 'Nice notes! Pick what you want me to make.'}
      </MascotTip>
      <div className="flex flex-col gap-2">
        <span className={LABEL_CLASS}>Step 01 · Input</span>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Paste your notes
        </h1>
        <p className="text-sm text-white/50">
          Drop in your study material and let AI turn it into flashcards, quizzes, or a
          summary.
        </p>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <span className={LABEL_CLASS}>notes.txt</span>
          <span className="flex items-center gap-3 font-mono text-[11px] text-white/40">
            {isEmpty && (
              <button
                type="button"
                onClick={() => setText(SAMPLE_NOTES)}
                className="font-sans text-xs text-violet-300 transition-colors hover:text-violet-200"
              >
                Try sample notes
              </button>
            )}
            {text.length.toLocaleString()} chars
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={9}
          className="min-h-48 w-full resize-y bg-transparent px-4 py-3 text-sm leading-relaxed text-white/80 outline-none placeholder:text-white/30"
          placeholder="Paste your study notes here…"
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handlePdfUpload}
        className="hidden"
        id="pdf-upload"
      />
      <label
        htmlFor="pdf-upload"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handlePdfUpload(e.dataTransfer.files?.[0]);
        }}
        className={`group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 transition-colors hover:border-violet-500/50 hover:bg-violet-500/[0.04] ${
          dragging ? 'border-violet-400 bg-violet-500/10' : 'border-white/15 bg-white/[0.02]'
        }`}
      >
        <div className="rounded-md border border-white/10 bg-white/5 p-2 transition-colors group-hover:border-violet-500/40">
          {pdfLoading ? (
            <Loader size="sm" inline />
          ) : (
            <Upload className="h-4 w-4 text-white/60" aria-hidden="true" />
          )}
        </div>
        <p className="text-sm text-white/60">
          {pdfLoading ? (
            'Extracting text…'
          ) : (
            <>
              Drag &amp; drop a PDF, or{' '}
              <span className="text-violet-400">browse files</span>
            </>
          )}
        </p>
        <span className={LABEL_CLASS}>
          {filename
            ? filename
            : 'PDF only · Max 20MB · Text-based PDFs only (scanned/image PDFs not supported)'}
        </span>
      </label>

      {uploadError && (
        <p className="text-xs text-red-400 text-center -mt-4">
          ⚠ {uploadError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ActionButton
          icon={Zap}
          title="⚡ Flashcards"
          desc="Spaced repetition"
          accent="bg-violet-500/15 text-violet-400 group-hover:bg-violet-500"
          disabled={isEmpty}
          loading={loadingFlashcards}
          onClick={() => onFlashcards(text)}
        />
        <ActionButton
          icon={ClipboardList}
          title="📝 Quiz"
          desc="Test yourself"
          accent="bg-blue-500/15 text-blue-400 group-hover:bg-blue-500"
          disabled={isEmpty}
          loading={loadingQuiz}
          onClick={() => onQuiz(text)}
        />
        <ActionButton
          icon={FileText}
          title="📋 Summary"
          desc="Quick TL;DR"
          accent="bg-teal-500/15 text-teal-400 group-hover:bg-teal-500"
          disabled={isEmpty}
          loading={loadingSummary}
          onClick={() => onSummary(text)}
        />
      </div>

      {(onVisuals || onSlides) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {onVisuals && (
            <ActionButton
              icon={ImageIcon}
              title="🎨 Pictures"
              desc="AI illustrations of key ideas"
              accent="bg-fuchsia-500/15 text-fuchsia-300 group-hover:bg-fuchsia-500"
              disabled={isEmpty}
              onClick={() => onVisuals(text)}
            />
          )}
          {onSlides && (
            <ActionButton
              icon={Presentation}
              title="📊 Slides"
              desc="A short PowerPoint deck"
              accent="bg-orange-500/15 text-orange-300 group-hover:bg-orange-500"
              disabled={isEmpty}
              onClick={() => onSlides(text)}
            />
          )}
        </div>
      )}
    </div>
  );
}