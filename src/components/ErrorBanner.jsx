function ErrorBanner({ error, onDismiss, onRetry }) {
  if (!error) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-200">
      <p className="text-sm flex-1">{error}</p>
      <div className="flex gap-2 shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-red-500/30 bg-red-500/20 px-3 py-1 text-xs font-medium transition-colors hover:bg-red-500/30"
          >
            Retry
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md px-2 py-1 text-xs hover:bg-red-500/20 transition-colors"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default ErrorBanner;
